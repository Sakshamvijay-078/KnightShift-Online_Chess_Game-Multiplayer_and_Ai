import { useNavigate } from "react-router-dom";
import { useSocket } from "../hooks/useSocket";
import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { decodeToken } from "./GetUserName";
import { ChessBoard } from "../components/AiChessBoard";
import { Button } from "../components/Button";

// export const INIT_GAME = "init_game";
// export const MOVE = "move";
// export const GAME_OVER = "game_over";
// export const REMOVE_USER = "remove_user";
// export const REFRESH = "refresh";
// export const RESIGN = "resign";
export const AiMOVE = "ai_move";
export const AiRESIGN = "ai_resign";
export const AiINIT_GAME = "ai_init_game";
export const AiGAME_OVER = "ai_game_over";
export const AiREMOVE_USER = "ai_remove_user";
export const AiREFRESH = "ai_refresh";

interface Move {
  from?: string;
  to?: string;
}

export const Computer = () => {
  const navigate = useNavigate();
  const socket = useSocket();
  const [turn, setTurn] = useState("white");
  const [moves, setMoves] = useState<Move[]>([]);
  const [play, setPlay] = useState(true);
  const [waiting, setWaiting] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [table, setTable] = useState(false);
  const [leave, setLeave] = useState(true);
  const [resign, setResign] = useState(false);
  const [youAre, setYouAre] = useState("none");
  const hello = new Chess();
  const [board, setBoard] = useState(hello.board());
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState("");
  const [playAgain, setPlayAgain] = useState(false);
  const [level, setLevel] = useState<Number>(15);
  const [gameSetup, setGameSetup] = useState<boolean>(false);

  useEffect(() => {
    socket?.send(
      JSON.stringify({
        type: AiREFRESH,
        user: decodeToken(),
      })
    );
    const savedState = localStorage.getItem("chessGameState");
    if (savedState) {
      const {
        turn: savedTurn,
        moves: savedMoves,
        play: savedPlay,
        waiting: savedWaiting,
        playing: savedPlaying,
        table: savedTable,
        leave: savedLeave,
        resign: savedResign,
        youAre: savedYouAre,
        board: savedBoard,
        gameover: savedGameover,
        winner: savedWinner,
        playAgain: savedPlayAgain,
        level: savedLevel,
        gameSetup: savedGameSetup,
      } = JSON.parse(savedState);

      setTurn(savedTurn);
      setMoves(savedMoves);
      setPlay(savedPlay);
      setWaiting(savedWaiting);
      setPlaying(savedPlaying);
      setTable(savedTable);
      setLeave(savedLeave);
      setResign(savedResign);
      setYouAre(savedYouAre);
      setBoard(savedBoard);
      setGameOver(savedGameover);
      setWinner(savedWinner);
      setPlayAgain(savedPlayAgain);
      setGameSetup(savedGameSetup);
      setLevel(savedLevel);
    }
  }, []);

  useEffect(() => {
    const gameState = {
      turn,
      moves,
      play,
      waiting,
      playing,
      table,
      leave,
      resign,
      youAre,
      board,
      gameOver,
      winner,
      playAgain,
      level,
      gameSetup,
    };
    localStorage.setItem("chessGameState", JSON.stringify(gameState));
  }, [
    turn,
    moves,
    play,
    waiting,
    playing,
    table,
    leave,
    resign,
    youAre,
    board,
    gameOver,
    winner,
    playAgain,
    level,
    gameSetup,
  ]);

  useEffect(() => {
    if (!socket) {
      return;
    }
    socket.onmessage = (Data) => {
      const message = JSON.parse(Data.data);
      setTurn(message.turn);
      switch (message.type) {
        case AiINIT_GAME:
          setBoard(message.board);
          setWaiting(false);
          setPlaying(true);
          setTable(true);
          setLeave(false);
          setResign(true);
          setTurn("white");
          break;
        case AiMOVE:
          setTurn(message.turn);
          if (message.valid) {
            setMoves((prev) => [...prev, message.payload]);
          }
          setBoard(message.board);
          break;
        case AiGAME_OVER:
          setBoard(message.board);
          setTurn("null");
          setLeave(true);
          setResign(false);
          setPlaying(false);
          setGameOver(true);
          setWinner(message.winner);
          setPlayAgain(true);
          socket.send(
            JSON.stringify({
              type: AiGAME_OVER,
              user: decodeToken(),
            })
          );
          break;
        default:
          break;
      }
    };
  }, [socket]);

  if (!socket) return <div>Connecting to server .....................</div>;

  const handleGameStart = () => {
    setGameSetup(true);
    setWaiting(false);
    setPlaying(true);
    setTable(true);
    setLeave(false);
    setResign(true);
    setTurn("white");
    socket.send(
      JSON.stringify({
        type: AiINIT_GAME,
        user: decodeToken(),
        youAre,
        level,
      })
    );
  };

  return (
    <div className="flex justify-center md:w-full ">
      <div className="pt-8 max-w-screen-lg md:w-full">
        <div className="grid grid-cols-6 gap-4 w-full ">
          {!gameSetup && (
            <div className="col-span-6 flex justify-center items-center flex-col">
              <h2 className="text-2xl font-bold mb-4">Choose Your Color</h2>
              <div className="flex justify-between mb-4">
                <Button onClick={() => setYouAre("w")}>White</Button>
                <Button onClick={() => setYouAre("b")}>Black</Button>
              </div>
              <h2 className="text-2xl font-bold mb-4">
                Choose Difficulty Level
              </h2>
              <div className="flex justify-between mb-4">
                <Button onClick={() => setLevel(15)}>Easy</Button>
                <Button onClick={() => setLevel(20)}>Medium</Button>
                <Button onClick={() => setLevel(25)}>Hard</Button>
                <Button onClick={() => setLevel(30)}>Pro</Button>
              </div>
              <Button onClick={handleGameStart}>Start Game</Button>
            </div>
          )}

          {gameSetup && (
            <div className="col-span-6 w-full flex justify-center">
              <div className="pt-8 max-w-screen-lg md:w-full">
                <div className="grid grid-cols-6 gap-4 w-full ">
                  <div className="col-span-4 w-full flex justify-center ">
                    <ChessBoard
                      board={board}
                      socket={socket}
                      playercolor={youAre}
                    />
                  </div>
                  <div className="col-span-2 w-full flex bg-slate-900 flex-col items-center rounded-lg">
                    {(playing || playAgain) && (
                      <div className="h-15 flex justify-between bg-gray-800 items-center pl-1 rounded-lg p-3 ">
                        <div className="text-blue-900">You Are</div>
                        {youAre === "b" ? (
                          <p className="w-20 h-6 bg-black rounded-lg mt-1 ml-5 youAreB"></p>
                        ) : (
                          <p className="w-20 h-6 bg-white rounded-lg mt-1 ml-5 youAreW"></p>
                        )}
                      </div>
                    )}
                    <div className="flex justify-center text-3xl p-2 pr-4 pl-4 borderr text-blue-900 font-bold rounded-lg">
                      {play && (
                        <Button
                          onClick={() => {
                            setWaiting(true);
                            setPlay(false);
                            setLeave(false);
                            setMoves([]);
                            socket.send(
                              JSON.stringify({
                                type: AiINIT_GAME,
                                user: decodeToken(),
                                level,
                                youAre,
                              })
                            );
                          }}
                        >
                          Play
                        </Button>
                      )}
                      {playAgain && (
                        <Button
                          onClick={() => {
                            setPlay(false);
                            setPlayAgain(false);
                            setTable(false);
                            setWaiting(true);
                            setLeave(false);
                            setMoves([]);
                            socket.send(
                              JSON.stringify({
                                type: AiINIT_GAME,
                                user: decodeToken(),
                                youAre,
                                level,
                              })
                            );
                          }}
                        >
                          Play Again
                        </Button>
                      )}
                      {playAgain && (
                        <button
                          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-2 rounded p-2 m-4 button"
                          onClick={() => {
                            localStorage.removeItem("chessGameState");
                            navigate("/");
                          }}
                        >
                          Home
                        </button>
                      )}
                      {playing && (
                        <div>
                          Turn of
                          <p
                            className={`inline ${
                              turn === "white"
                                ? "text-white bg-black rounded-lg p-1"
                                : "text-black bg-white rounded-lg p-1"
                            }`}
                          >
                            {turn === "white" ? "White" : "Black"}
                          </p>
                        </div>
                      )}
                      {waiting && (
                        <div className="waiting">Waiting for other player</div>
                      )}
                    </div>
                    {table && (
                      <div className="move bg-gray-950 m-2">
                        {gameOver && (
                          <p className="text-2xl m-4">Winner : {winner}</p>
                        )}
                        {<p className="text-xl m-3">Moves:</p>}
                        {
                          <ul>
                            {moves.map((move, index) => (
                              <li key={index} className="ml-3">
                                {move.from} {move.to} by{" "}
                                {index % 2 === 0 ? "White" : "Black"}
                              </li>
                            ))}
                          </ul>
                        }
                      </div>
                    )}
                    {leave && (
                      <Button
                        onClick={() => {
                          localStorage.removeItem("chessGameState");
                          navigate("/");
                        }}
                      >
                        Leave Game
                      </Button>
                    )}
                    {resign && (
                      <Button
                        onClick={() => {
                          socket.send(
                            JSON.stringify({
                              type: AiRESIGN,
                              user: decodeToken(),
                            })
                          );
                          localStorage.removeItem("chessGameState");
                          navigate("/");
                        }}
                      >
                        Resign
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
