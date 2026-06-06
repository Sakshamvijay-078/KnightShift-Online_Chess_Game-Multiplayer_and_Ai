import { Chess } from "chess.js";
import { WebSocket } from "ws";
import { spawn, ChildProcess } from "child_process";
import { AiGAME_OVER, AiINIT_GAME, AiMOVE, AiWRONG_MOVE } from "./messages";

export class AiGame {
  public player1: WebSocket;
  private board: Chess;
  public Aimoves: string[];
  public moves: string[];
  public player1User: string;
  private MoveCount = 0;
  public valid = false;
  private stockfish: ChildProcess | null = null;
  private depth: number;
  private playerColor: string;

  constructor(player1: WebSocket, player1User: string, depth: number = 15, playerColor: string = "white") {
    this.player1User = player1User;
    this.player1 = player1;
    this.moves = [];
    this.Aimoves = [];
    this.board = new Chess();
    this.valid = false;
    this.depth = depth;
    const normalized = playerColor.toLowerCase();
    this.playerColor = normalized === "w" ? "white" : normalized === "b" ? "black" : normalized;

    this.player1.send(
      JSON.stringify({
        type: AiINIT_GAME,
        board: this.board.board(),
        fen: this.board.fen(),
        payload: {
          color: this.playerColor === "white" ? "w" : "b",
        },
      })
    );

    const stockfishPath = "stockfish";

    const commandStr = process.platform === "win32" ? "stockfish.exe" : "stockfish";


    try {
      this.stockfish = spawn(stockfishPath);

      this.stockfish.stdout?.on("data", (data) => {
        const output = data.toString();
        const match = output.match(/bestmove\s(\S+)/);
        if (match) {
          const bestMove = match[1];
          // Skip if stockfish says no move available (game already over)
          if (bestMove === "(none)") return;
          console.log(bestMove);
          const moveResult = this.board.move(bestMove);
          if (!moveResult) return; // Safety: ignore invalid moves
          this.Aimoves.push(bestMove);
          this.MoveCount++;

          if (this.board.isGameOver()) {
            this.player1.send(
              JSON.stringify({
                type: AiGAME_OVER,
                board: this.board.board(),
                fen: this.board.fen(),
                winner: this.playerColor === "white" ? "black" : "white",
                valid: true,
              })
            );
          } else {
            const tempFrom = bestMove.slice(0, 2);
            const tempTo = bestMove.slice(2, 4);
            this.player1.send(
              JSON.stringify({
                type: AiMOVE,
                payload: { 
                  from: tempFrom, 
                  to: tempTo,
                  san: moveResult.san,
                  flags: moveResult.flags
                },
                board: this.board.board(),
                fen: this.board.fen(),
                turn: this.playerColor === "white" ? "white" : "black",
                valid: true,
              })
            );
          }
        }
      });

      this.stockfish.on("error", (err) => {
        console.error("Failed to start Stockfish process:", err.message);
        this.stockfish = null;
      });
    } catch (err) {
      console.error("Error initializing Stockfish:", err);
    }

    if (this.playerColor === "black" && this.stockfish?.stdin) {
      this.stockfish.stdin.write(`position startpos\n`);
      this.stockfish.stdin.write(`go depth ${this.depth}\n`);
    }
  }

  changeSocket(socket: WebSocket, user: string) {
    this.player1 = socket;
  }

  makeMove(socket: WebSocket, move: { from: string; to: string }, user: string, promotion: string) {
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
        this.player1.send(
          JSON.stringify({
            type: AiGAME_OVER,
            board: this.board.board(),
            fen: this.board.fen(),
            winner: this.playerColor === "white" ? "white" : "black",
            valid: this.valid,
          })
        );
        return;
      }

      const fullPayload = {
        from: move.from,
        to: move.to,
        san: moveResult.san,
        flags: moveResult.flags
      };

      this.player1.send(
        JSON.stringify({
          type: AiMOVE,
          payload: fullPayload,
          board: this.board.board(),
          fen: this.board.fen(),
          turn: this.playerColor === "white" ? "black" : "white",
          valid: this.valid,
        })
      );

      if (this.stockfish?.stdin) {
        this.stockfish.stdin.write(`position fen ${this.board.fen()}\n`);
        this.stockfish.stdin.write(`go depth ${this.depth}\n`);
      } else {
        console.error("Stockfish process is not properly initialized.");
      }
    } catch (e) {
      this.valid = false;
      this.player1.send(
        JSON.stringify({
          type: AiWRONG_MOVE,
          payload: { invalid: "Invalid Move" },
          turn: this.playerColor === "white" ? "white" : "black",
          valid: this.valid,
        })
      );
    }
  }

  resign(resign: string) {
    this.board = new Chess();
    this.player1.send(
      JSON.stringify({
        type: AiGAME_OVER,
        board: this.board.board(),
        fen: this.board.fen(),
        winner:
          resign === this.player1User
            ? this.playerColor === "white"
              ? "Black"
              : "White"
            : this.playerColor === "white"
            ? "White"
            : "Black",
      })
    );
  }
}
