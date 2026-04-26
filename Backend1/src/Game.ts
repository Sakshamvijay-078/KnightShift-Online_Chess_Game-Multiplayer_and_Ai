import { Chess } from "chess.js";
import { WebSocket } from "ws";
import { GAME_OVER, INIT_GAME, MOVE, WRONG_MOVE, TIMER_UPDATE, RECEIVE_CHAT } from "./messages";

export class Game {
    public player1: WebSocket;
    public player2: WebSocket;
    private board: Chess;
    public moves: string[];
    public player1User: string;
    public player2User: string;
    private MoveCount = 0;
    public valid = false;

    // Timer extensions
    public duration: number; 
    public player1TimeMs: number;
    public player2TimeMs: number;
    public lastMoveTime: number;
    private timerInterval: any;
    public gameOver = false;

    constructor(player1: WebSocket, player2: WebSocket, player1User: string, player2User: string, durationInSeconds: number) {
        this.player1User = player1User;
        this.player2User = player2User;
        this.player1 = player1;
        this.player2 = player2;
        this.moves = [];
        this.board = new Chess();
        this.valid = false;
        this.duration = durationInSeconds || 600; // default 10min

        // Initialize Times
        this.player1TimeMs = this.duration * 1000;
        this.player2TimeMs = this.duration * 1000;
        this.lastMoveTime = Date.now();

        this.player1.send(JSON.stringify({
            type: INIT_GAME,
            board: this.board.board(),
            fen: this.board.fen(),
            payload: { color: 'w', duration: this.duration }
        }));
        this.player2.send(JSON.stringify({
            type: INIT_GAME,
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
            } else {
                // Black's turn (Player 2)
                if (this.player2TimeMs - elapsed <= 0) {
                    this.player2TimeMs = 0;
                    this.handleTimeout("white");
                }
            }
        }, 1000);
    }

    handleTimeout(winnerColor: string) {
        this.gameOver = true;
        const msg = JSON.stringify({
            type: GAME_OVER,
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

    changeSocket(socket: WebSocket, user: string) {
        const isWhite = user === this.player1User;
        if (isWhite) {
            this.player1 = socket;
        } else {
            this.player2 = socket;
        }

        // Re-transmit to synchronize routing on reload
        socket.send(JSON.stringify({
            type: INIT_GAME,
            board: this.board.board(),
            fen: this.board.fen(),
            payload: { color: isWhite ? 'w' : 'b', duration: this.duration }
        }));
        
        // Push all moves to sync client view
        this.moves.forEach(m => {
            const split = m.split("-");
            socket.send(JSON.stringify({
                type: MOVE,
                payload: { from: split[0], to: split[1] },
                board: this.board.board(),
                fen: this.board.fen(),
                valid: true
            }));
        });

        // Immediately sync timers on reconnect
        socket.send(JSON.stringify({
            type: TIMER_UPDATE,
            player1Time: this.player1TimeMs,
            player2Time: this.player2TimeMs,
            lastMoveTime: this.lastMoveTime
        }));
    }

    makeMove(socket: WebSocket, move: { from: string; to: string; }, user: string, promotion: string) {
        if (this.gameOver) return;

        if (this.MoveCount % 2 === 0 && socket !== this.player1) return;
        if (this.MoveCount % 2 === 1 && socket !== this.player2) return;

        let moveResult;
        try {
            if (promotion != "null") {
                moveResult = this.board.move({ from: move.from, to: move.to, promotion: promotion });
            } else {
                moveResult = this.board.move(move);
            }
            this.valid = true;
            this.moves.push(`${move.from}-${move.to}`);

            // Calculate timing differences
            const now = Date.now();
            const elapsed = now - this.lastMoveTime;
            if (this.MoveCount % 2 === 0) {
                this.player1TimeMs -= elapsed;
            } else {
                this.player2TimeMs -= elapsed;
            }
            this.lastMoveTime = now;
            this.MoveCount++;
        } catch (e) {
            this.valid = false;
            socket.send(JSON.stringify({
                type: WRONG_MOVE,
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
                type: GAME_OVER,
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
            type: MOVE,
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

    resign(resign: string) {
        this.gameOver = true;
        clearInterval(this.timerInterval);
        this.board = new Chess();
        const msg = JSON.stringify({
            type: GAME_OVER,
            board: this.board.board(),
            fen: this.board.fen(),
            winner: resign === this.player1User ? "black" : "white",
            reason: "resign"
        });
        this.player1.send(msg);
        this.player2.send(msg);
    }

    handleChat(socket: WebSocket, message: string, senderName: string) {
        if (this.gameOver) return;
        const targetSocket = socket === this.player1 ? this.player2 : this.player1;
        if (targetSocket.readyState === WebSocket.OPEN) {
            targetSocket.send(JSON.stringify({
                type: RECEIVE_CHAT,
                message,
                senderName
            }));
        }
    }
}