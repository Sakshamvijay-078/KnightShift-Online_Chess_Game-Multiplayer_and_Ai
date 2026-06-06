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
        const normalized = playerColor.toLowerCase();
        this.playerColor = normalized === "w" ? "white" : normalized === "b" ? "black" : normalized;
        this.player1.send(JSON.stringify({
            type: messages_1.AiINIT_GAME,
            board: this.board.board(),
            fen: this.board.fen(),
            payload: {
                color: this.playerColor === "white" ? "w" : "b",
            },
        }));
        const stockfishPath = "stockfish";
        const commandStr = process.platform === "win32" ? "stockfish.exe" : "stockfish";
        try {
            this.stockfish = (0, child_process_1.spawn)(stockfishPath);
            (_a = this.stockfish.stdout) === null || _a === void 0 ? void 0 : _a.on("data", (data) => {
                const output = data.toString();
                const match = output.match(/bestmove\s(\S+)/);
                if (match) {
                    const bestMove = match[1];
                    // Skip if stockfish says no move available (game already over)
                    if (bestMove === "(none)")
                        return;
                    // console.log(bestMove);
                    // Apply the move to the board immediately to keep state consistent
                    const moveResult = this.board.move(bestMove);
                    if (!moveResult)
                        return; // Safety: ignore invalid moves
                    this.Aimoves.push(bestMove);
                    this.MoveCount++;
                    // Realistic "thinking" delay before sending move to client
                    // Base: 600ms + random jitter 0–800ms + 30ms per depth level
                    const thinkingDelay = 1500 + Math.floor(Math.random() * 2500) + this.depth * 70;
                    // Capture board/fen snapshot now (before any future moves mutate state)
                    const boardSnapshot = this.board.board();
                    const fenSnapshot = this.board.fen();
                    const isOver = this.board.isGameOver();
                    setTimeout(() => {
                        if (isOver) {
                            this.player1.send(JSON.stringify({
                                type: messages_1.AiGAME_OVER,
                                board: boardSnapshot,
                                fen: fenSnapshot,
                                winner: this.playerColor === "white" ? "black" : "white",
                                valid: true,
                            }));
                        }
                        else {
                            const tempFrom = bestMove.slice(0, 2);
                            const tempTo = bestMove.slice(2, 4);
                            this.player1.send(JSON.stringify({
                                type: messages_1.AiMOVE,
                                payload: {
                                    from: tempFrom,
                                    to: tempTo,
                                    san: moveResult.san,
                                    flags: moveResult.flags
                                },
                                board: boardSnapshot,
                                fen: fenSnapshot,
                                turn: this.playerColor === "white" ? "white" : "black",
                                valid: true,
                            }));
                        }
                    }, thinkingDelay);
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
            this.stockfish.stdin.write(`position startpos\n`);
            this.stockfish.stdin.write(`go depth ${this.depth}\n`);
        }
    }
    changeSocket(socket, user) {
        this.player1 = socket;
    }
    makeMove(socket, move, user, promotion) {
        var _a;
        // Block the move if it's not the player's turn
        // White player moves on even MoveCount (0, 2, 4...), black on odd (1, 3, 5...)
        if ((this.MoveCount % 2 !== 0 && this.playerColor === "white") || (this.MoveCount % 2 === 0 && this.playerColor === "black")) {
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
                    fen: this.board.fen(),
                    winner: this.playerColor === "white" ? "white" : "black",
                    valid: this.valid,
                }));
                return;
            }
            const fullPayload = {
                from: move.from,
                to: move.to,
                san: moveResult.san,
                flags: moveResult.flags
            };
            this.player1.send(JSON.stringify({
                type: messages_1.AiMOVE,
                payload: fullPayload,
                board: this.board.board(),
                fen: this.board.fen(),
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
            fen: this.board.fen(),
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
