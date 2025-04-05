import { Chess, Move } from "chess.js";
import { WebSocket } from "ws";
import { GAME_OVER, INIT_GAME, MOVE, TURN, WRONG_MOVE } from "./messages";

export class Game {
    public player1: WebSocket;
    public player2: WebSocket;
    private board: Chess;
    public moves: string[];
    public player1User: string;
    public player2User: string;
    private MoveCount = 0;
    public valid = false;


    constructor(player1: WebSocket, player2: WebSocket, player1User: string, player2User: string) {
        this.player1User = player1User;
        this.player2User = player2User;
        this.player1 = player1;
        this.player2 = player2;
        this.moves = [];
        this.board = new Chess();
        this.valid = false;
        this.player1.send(JSON.stringify({
            type: INIT_GAME,
            board: this.board.board(),
            payload: {
                color: 'w',
            }
        }))
        this.player2.send(JSON.stringify({
            type: INIT_GAME,
            board: this.board.board(),
            payload: {
                color: 'b',
            }
        }))
    }
    changeSocket(socket: WebSocket, user: string) {
        if (user === this.player1User) {
            this.player1 = socket;
            // console.log("socket_change user 1")
        }
        else {
            this.player2 = socket;
            // console.log("socket_change user 2");

        }
    };
    makeMove(socket: WebSocket, move: { from: string; to: string; }, user: string, promotion: string) {
        // console.log("hello33");
        if (this.MoveCount % 2 === 0 && socket !== this.player1) {
            return
        }
        if (this.MoveCount % 2 === 1 && socket !== this.player2) {
            return
        }
        try {
            if (promotion!="null") {
                // console.log("hello2");
                this.board.move({ from: move.from, to: move.to, promotion: promotion })
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
                    type: WRONG_MOVE,
                    payload: {
                        invalid: 'Invalid Move'
                    },
                    turn: this.MoveCount % 2 === 0 ? "white" : "black",
                    valid: this.valid,
                }))
            }
            if (this.MoveCount % 2 === 1) {
                this.player2.send(JSON.stringify({
                    type: WRONG_MOVE,
                    payload: {
                        invalid: 'Invalid Move'
                    },
                    turn: this.MoveCount % 2 === 0 ? "white" : "black",
                    valid: this.valid,
                }))
            }
        }
        if (this.board.isGameOver()) {
            this.player1.send(JSON.stringify({
                type: GAME_OVER,
                board: this.board.board(),
                winner: this.MoveCount % 2 === 0 ? 'black' : 'white',
                valid: this.valid,
            }))
            this.player2.send(JSON.stringify({
                type: GAME_OVER,
                board: this.board.board(),
                winner: this.MoveCount % 2 === 0 ? 'black' : 'white',
                valid: this.valid,
            }))
        }
        this.player2.send(JSON.stringify({
            type: MOVE,
            payload: move,
            board: this.board.board(),
            turn: this.MoveCount % 2 === 0 ? "white" : "black",
            valid: this.valid,
        }))
        this.player1.send(JSON.stringify({
            type: MOVE,
            payload: move,
            board: this.board.board(),
            turn: this.MoveCount % 2 === 0 ? "white" : "black",
            valid: this.valid,
        }))
    }
    resign(resign: string) {
        this.board = new Chess();
        this.player1.send(JSON.stringify({
            type: GAME_OVER,
            board: this.board.board(),
            winner: resign === this.player1User ? "Black" : "White",
        }))
        this.player2.send(JSON.stringify({
            type: GAME_OVER,
            board: this.board.board(),
            winner: resign === this.player1User ? "Black" : "White",
        }))
    }
}