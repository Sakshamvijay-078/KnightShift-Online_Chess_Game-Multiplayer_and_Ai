"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
const chess_js_1 = require("chess.js");
const ws_1 = require("ws");
const messages_1 = require("./messages");
class Game {
    constructor(player1, player2, player1User, player2User, durationInSeconds) {
        this.MoveCount = 0;
        this.valid = false;
        this.gameOver = false;
        this.player1User = player1User;
        this.player2User = player2User;
        this.player1 = player1;
        this.player2 = player2;
        this.moves = [];
        this.board = new chess_js_1.Chess();
        this.valid = false;
        this.duration = durationInSeconds || 600; // default 10min
        // Initialize Times
        this.player1TimeMs = this.duration * 1000;
        this.player2TimeMs = this.duration * 1000;
        this.lastMoveTime = Date.now();
        this.player1.send(JSON.stringify({
            type: messages_1.INIT_GAME,
            board: this.board.board(),
            fen: this.board.fen(),
            payload: { color: 'w', duration: this.duration }
        }));
        this.player2.send(JSON.stringify({
            type: messages_1.INIT_GAME,
            board: this.board.board(),
            fen: this.board.fen(),
            payload: { color: 'b', duration: this.duration }
        }));
        this.startTimerInterval();
    }
    startTimerInterval() {
        this.timerInterval = setInterval(() => {
            if (this.gameOver || this.board.isGameOver()) {
                clearInterval(this.timerInterval);
                return;
            }
            const elapsed = Date.now() - this.lastMoveTime;
            if (this.MoveCount % 2 === 0) {
                // White's turn (Player 1)
                if (this.player1TimeMs - elapsed <= 0) {
                    this.player1TimeMs = 0;
                    this.handleTimeout("black");
                }
            }
            else {
                // Black's turn (Player 2)
                if (this.player2TimeMs - elapsed <= 0) {
                    this.player2TimeMs = 0;
                    this.handleTimeout("white");
                }
            }
        }, 1000);
    }
    handleTimeout(winnerColor) {
        this.gameOver = true;
        const msg = JSON.stringify({
            type: messages_1.GAME_OVER,
            board: this.board.board(),
            fen: this.board.fen(),
            winner: winnerColor,
            valid: this.valid,
            reason: "timeout"
        });
        this.player1.send(msg);
        this.player2.send(msg);
        clearInterval(this.timerInterval);
    }
    changeSocket(socket, user) {
        const isWhite = user === this.player1User;
        if (isWhite) {
            this.player1 = socket;
        }
        else {
            this.player2 = socket;
        }
        // Re-transmit to synchronize routing on reload
        socket.send(JSON.stringify({
            type: messages_1.INIT_GAME,
            board: this.board.board(),
            fen: this.board.fen(),
            payload: { color: isWhite ? 'w' : 'b', duration: this.duration }
        }));
        // Push all moves to sync client view
        this.moves.forEach(m => {
            const split = m.split("-");
            socket.send(JSON.stringify({
                type: messages_1.MOVE,
                payload: { from: split[0], to: split[1] },
                board: this.board.board(),
                fen: this.board.fen(),
                valid: true
            }));
        });
        // Immediately sync timers on reconnect
        socket.send(JSON.stringify({
            type: messages_1.TIMER_UPDATE,
            player1Time: this.player1TimeMs,
            player2Time: this.player2TimeMs,
            lastMoveTime: this.lastMoveTime
        }));
    }
    makeMove(socket, move, user, promotion) {
        if (this.gameOver)
            return;
        if (this.MoveCount % 2 === 0 && socket !== this.player1)
            return;
        if (this.MoveCount % 2 === 1 && socket !== this.player2)
            return;
        let moveResult;
        try {
            if (promotion != "null") {
                moveResult = this.board.move({ from: move.from, to: move.to, promotion: promotion });
            }
            else {
                moveResult = this.board.move(move);
            }
            this.valid = true;
            this.moves.push(`${move.from}-${move.to}`);
            // Calculate timing differences
            const now = Date.now();
            const elapsed = now - this.lastMoveTime;
            if (this.MoveCount % 2 === 0) {
                this.player1TimeMs -= elapsed;
            }
            else {
                this.player2TimeMs -= elapsed;
            }
            this.lastMoveTime = now;
            this.MoveCount++;
        }
        catch (e) {
            this.valid = false;
            socket.send(JSON.stringify({
                type: messages_1.WRONG_MOVE,
                payload: { invalid: 'Invalid Move' },
                turn: this.MoveCount % 2 === 0 ? "white" : "black",
                valid: this.valid,
            }));
            return;
        }
        if (this.board.isGameOver()) {
            this.gameOver = true;
            clearInterval(this.timerInterval);
            const winner = this.MoveCount % 2 === 0 ? 'black' : 'white';
            const msg = JSON.stringify({
                type: messages_1.GAME_OVER,
                board: this.board.board(),
                fen: this.board.fen(),
                winner,
                valid: this.valid,
                reason: "checkmate"
            });
            this.player1.send(msg);
            this.player2.send(msg);
            return;
        }
        const fullPayload = {
            from: move.from,
            to: move.to,
            san: moveResult.san,
            flags: moveResult.flags
        };
        const moveMsg = JSON.stringify({
            type: messages_1.MOVE,
            payload: fullPayload,
            board: this.board.board(),
            fen: this.board.fen(),
            turn: this.MoveCount % 2 === 0 ? "white" : "black",
            valid: this.valid,
            player1Time: this.player1TimeMs,
            player2Time: this.player2TimeMs,
            lastMoveTime: this.lastMoveTime
        });
        this.player2.send(moveMsg);
        this.player1.send(moveMsg);
    }
    resign(resign) {
        this.gameOver = true;
        clearInterval(this.timerInterval);
        this.board = new chess_js_1.Chess();
        const msg = JSON.stringify({
            type: messages_1.GAME_OVER,
            board: this.board.board(),
            fen: this.board.fen(),
            winner: resign === this.player1User ? "black" : "white",
            reason: "resign"
        });
        this.player1.send(msg);
        this.player2.send(msg);
    }
    handleChat(socket, message, senderName) {
        if (this.gameOver)
            return;
        const targetSocket = socket === this.player1 ? this.player2 : this.player1;
        if (targetSocket.readyState === ws_1.WebSocket.OPEN) {
            targetSocket.send(JSON.stringify({
                type: messages_1.RECEIVE_CHAT,
                message,
                senderName
            }));
        }
    }
}
exports.Game = Game;
