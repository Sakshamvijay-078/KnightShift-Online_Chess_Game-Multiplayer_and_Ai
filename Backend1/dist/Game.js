"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
const chess_js_1 = require("chess.js");
const messages_1 = require("./messages");
class Game {
    constructor(player1, player2, player1User, player2User) {
        this.MoveCount = 0;
        this.valid = false;
        this.player1User = player1User;
        this.player2User = player2User;
        this.player1 = player1;
        this.player2 = player2;
        this.moves = [];
        this.board = new chess_js_1.Chess();
        this.valid = false;
        this.player1.send(JSON.stringify({
            type: messages_1.INIT_GAME,
            board: this.board.board(),
            payload: {
                color: 'w',
            }
        }));
        this.player2.send(JSON.stringify({
            type: messages_1.INIT_GAME,
            board: this.board.board(),
            payload: {
                color: 'b',
            }
        }));
    }
    changeSocket(socket, user) {
        if (user === this.player1User) {
            this.player1 = socket;
            // console.log("socket_change user 1")
        }
        else {
            this.player2 = socket;
            // console.log("socket_change user 2");
        }
    }
    ;
    makeMove(socket, move, user, promotion) {
        // console.log("hello33");
        if (this.MoveCount % 2 === 0 && socket !== this.player1) {
            return;
        }
        if (this.MoveCount % 2 === 1 && socket !== this.player2) {
            return;
        }
        try {
            if (promotion != "null") {
                // console.log("hello2");
                this.board.move({ from: move.from, to: move.to, promotion: promotion });
                // console.log('helo1');
            }
            else {
                this.board.move(move);
                // console.log("fjsdj");
            }
            this.valid = true;
            this.MoveCount++;
        }
        catch (e) {
            this.valid = false;
            if (this.MoveCount % 2 === 0) {
                this.player1.send(JSON.stringify({
                    type: messages_1.WRONG_MOVE,
                    payload: {
                        invalid: 'Invalid Move'
                    },
                    turn: this.MoveCount % 2 === 0 ? "white" : "black",
                    valid: this.valid,
                }));
            }
            if (this.MoveCount % 2 === 1) {
                this.player2.send(JSON.stringify({
                    type: messages_1.WRONG_MOVE,
                    payload: {
                        invalid: 'Invalid Move'
                    },
                    turn: this.MoveCount % 2 === 0 ? "white" : "black",
                    valid: this.valid,
                }));
            }
        }
        if (this.board.isGameOver()) {
            this.player1.send(JSON.stringify({
                type: messages_1.GAME_OVER,
                board: this.board.board(),
                winner: this.MoveCount % 2 === 0 ? 'black' : 'white',
                valid: this.valid,
            }));
            this.player2.send(JSON.stringify({
                type: messages_1.GAME_OVER,
                board: this.board.board(),
                winner: this.MoveCount % 2 === 0 ? 'black' : 'white',
                valid: this.valid,
            }));
        }
        this.player2.send(JSON.stringify({
            type: messages_1.MOVE,
            payload: move,
            board: this.board.board(),
            turn: this.MoveCount % 2 === 0 ? "white" : "black",
            valid: this.valid,
        }));
        this.player1.send(JSON.stringify({
            type: messages_1.MOVE,
            payload: move,
            board: this.board.board(),
            turn: this.MoveCount % 2 === 0 ? "white" : "black",
            valid: this.valid,
        }));
    }
    resign(resign) {
        this.board = new chess_js_1.Chess();
        this.player1.send(JSON.stringify({
            type: messages_1.GAME_OVER,
            board: this.board.board(),
            winner: resign === this.player1User ? "Black" : "White",
        }));
        this.player2.send(JSON.stringify({
            type: messages_1.GAME_OVER,
            board: this.board.board(),
            winner: resign === this.player1User ? "Black" : "White",
        }));
    }
}
exports.Game = Game;
