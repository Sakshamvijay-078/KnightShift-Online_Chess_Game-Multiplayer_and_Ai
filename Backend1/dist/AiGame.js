"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiGame = void 0;
const chess_js_1 = require("chess.js");
const child_process_1 = require("child_process");
const messages_1 = require("./messages");
class AiGame {
    constructor(player1, player1User, depth = 15, playerColor = "white") {
        var _a, _b;
        this.MoveCount = 0;
        this.valid = false;
        this.stockfish = null;
        this.player1User = player1User;
        this.player1 = player1;
        this.moves = [];
        this.Aimoves = [];
        this.board = new chess_js_1.Chess();
        this.valid = false;
        this.depth = depth;
        this.playerColor = playerColor.toLowerCase();
        this.player1.send(JSON.stringify({
            type: messages_1.AiINIT_GAME,
            board: this.board.board(),
            payload: {
                color: "w",
            },
        }));
        // Adjust path for Stockfish executable
        const stockfishPath = "C:/Users/saksh/OneDrive/Documents/Hello_Chess/Backend1/stockfish-windows-x86-64.exe";
        const fs = require("fs");
        if (!fs.existsSync(stockfishPath)) {
            console.error("Stockfish executable not found at", stockfishPath);
            return;
        }
        try {
            this.stockfish = (0, child_process_1.spawn)(stockfishPath);
            (_a = this.stockfish.stdout) === null || _a === void 0 ? void 0 : _a.on("data", (data) => {
                const output = data.toString();
                const match = output.match(/bestmove\s(\S+)/);
                if (match) {
                    const bestMove = match[1];
                    console.log(bestMove);
                    this.board.move(bestMove);
                    this.Aimoves.push(bestMove);
                    this.MoveCount++;
                    if (this.board.isGameOver()) {
                        this.player1.send(JSON.stringify({
                            type: messages_1.AiGAME_OVER,
                            board: this.board.board(),
                            winner: this.playerColor === "white" ? "black" : "white",
                            valid: true,
                        }));
                    }
                    else {
                        this.player1.send(JSON.stringify({
                            type: messages_1.AiMOVE,
                            payload: { from: bestMove.slice(0, 2), to: bestMove.slice(2, 4) },
                            board: this.board.board(),
                            turn: this.playerColor === "white" ? "white" : "black",
                            valid: true,
                        }));
                    }
                }
            });
            this.stockfish.on("error", (err) => {
                console.error("Failed to start Stockfish process:", err.message);
                this.stockfish = null;
            });
        }
        catch (err) {
            console.error("Error initializing Stockfish:", err);
        }
        if (this.playerColor === "black" && ((_b = this.stockfish) === null || _b === void 0 ? void 0 : _b.stdin)) {
            this.stockfish.stdin.write(`go depth ${this.depth}\n`);
        }
    }
    changeSocket(socket, user) {
        this.player1 = socket;
    }
    makeMove(socket, move, user, promotion) {
        var _a;
        if ((this.MoveCount % 2 === 0 && this.playerColor === "black") || (this.MoveCount % 2 !== 0 && this.playerColor === "white")) {
            return;
        }
        try {
            const moveResult = promotion
                ? this.board.move({ from: move.from, to: move.to, promotion })
                : this.board.move(move);
            if (!moveResult) {
                throw new Error("Invalid move");
            }
            this.valid = true;
            this.moves.push(`${move.from}${move.to}`);
            this.MoveCount++;
            if (this.board.isGameOver()) {
                this.player1.send(JSON.stringify({
                    type: messages_1.AiGAME_OVER,
                    board: this.board.board(),
                    winner: this.playerColor === "white" ? "white" : "black",
                    valid: this.valid,
                }));
                return;
            }
            this.player1.send(JSON.stringify({
                type: messages_1.AiMOVE,
                payload: move,
                board: this.board.board(),
                turn: this.playerColor === "white" ? "black" : "white",
                valid: this.valid,
            }));
            if ((_a = this.stockfish) === null || _a === void 0 ? void 0 : _a.stdin) {
                this.stockfish.stdin.write(`position fen ${this.board.fen()}\n`);
                this.stockfish.stdin.write(`go depth ${this.depth}\n`);
            }
            else {
                console.error("Stockfish process is not properly initialized.");
            }
        }
        catch (e) {
            this.valid = false;
            this.player1.send(JSON.stringify({
                type: messages_1.AiWRONG_MOVE,
                payload: { invalid: "Invalid Move" },
                turn: this.playerColor === "white" ? "white" : "black",
                valid: this.valid,
            }));
        }
    }
    resign(resign) {
        this.board = new chess_js_1.Chess();
        this.player1.send(JSON.stringify({
            type: messages_1.AiGAME_OVER,
            board: this.board.board(),
            winner: resign === this.player1User
                ? this.playerColor === "white"
                    ? "Black"
                    : "White"
                : this.playerColor === "white"
                    ? "White"
                    : "Black",
        }));
    }
}
exports.AiGame = AiGame;
