import { useEffect, useState } from "react";
import { Button } from "../components/Button";
import { ChessBoard } from "../components/ChessBoard";
import { useSocket } from "../hooks/useSocket";
import { Chess } from "chess.js";
import "/src/Styles/ChessBoard.css";
import { useNavigate } from "react-router-dom";
import { decodeToken } from "./GetUserName";

export const INIT_GAME = "init_game";
export const MOVE = "move";
export const GAME_OVER = "game_over";
export const REMOVE_USER = "remove_user";
export const REFRESH = "refresh";
export const RESIGN = 'resign';

interface Move {
  from?: string;
  to?: string;
}


export const Game = () => {
  const navigate = useNavigate();
  const socket = useSocket();
  const [turn, setTurn] = useState<string>("w");
  const [moves, setMoves] = useState<Move[]>([]);
  const [chess, setChess] = useState(new Chess());
  const [board, setBoard] = useState<any>(chess.board());
  const [clicked, setClicked] = useState<boolean>(false);
  const [started, setStarted] = useState<boolean>(false);
  const [show, setShow] = useState<boolean>(false);
  const [youAre, setYouAre] = useState<string>("none");
  const [winner, setWinner] = useState<string>("none");
  const [gameover, setGameover] = useState(false);
  const resetState = () => {
    socket?.send(JSON.stringify({
      type:RESIGN,
      user: decodeToken(),
    }));
    setTurn("w");
    setMoves([]);
    setChess(new Chess());
    setBoard(chess.board());
    setClicked(false);
    setStarted(false);
    setShow(false);
    setYouAre("none");
    setWinner("none");
    setGameover(false);
    localStorage.removeItem("chessGameState"); // Clear saved state in localStorage
  };

  // Load state from local storage when the component mounts
  useEffect(() => {
    socket?.send(JSON.stringify({
      type:REFRESH,
      user:decodeToken(),
    }))
    const savedState = localStorage.getItem("chessGameState");
    if (savedState) {
      const {
        turn: savedTurn,
        moves: savedMoves,
        board: savedBoard,
        clicked: savedClicked,
        started: savedStarted,
        show: savedShow,
        youAre: savedYouAre,
        winner: savedWinner,
        gameover: savedGameover
      } = JSON.parse(savedState);

      setTurn(savedTurn || "w");
      setMoves(savedMoves || []);
      setBoard(savedBoard || chess.board());
      setClicked(savedClicked || false);
      setStarted(savedStarted || false);
      setShow(savedShow || false);
      setYouAre(savedYouAre || "none");
      setGameover(savedGameover || false);
      setWinner(savedWinner||"none");
    }
  }, []);

  // Save state to local storage whenever it changes
  useEffect(() => {
    const gameState = {
      turn,
      moves,
      chess,
      board,
      clicked,
      started,
      show,
      youAre,
      gameover,
      winner
    };
    localStorage.setItem("chessGameState", JSON.stringify(gameState));
  }, [turn, moves, board, clicked, started, show, youAre,chess,gameover,winner]);

  // Handle socket messages
  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.valid) {
        setTurn(message.turn);
        if (message.payload) {
          setMoves((prevMoves) => [...prevMoves, message.payload]);
        }
      }
      switch (message.type) { 
        case INIT_GAME:
          setShow(true)
          setYouAre(message.payload.color);
          setTurn("w");
          setBoard(chess.board());
          setStarted(true);
          setWinner("none");
          setGameover(false);
          break;
        case MOVE:
          chess.move(message.payload);
          setBoard(chess.board());
          break;
        case GAME_OVER:
          setTimeout(() => {
            setShow(true);
            setChess(new Chess());
            setStarted(false);
            setBoard(chess.board());
            setTurn("NONE");
            setWinner(message.winner);
            setGameover(true);
            setClicked(true);
          }, 100);
          socket.send(JSON.stringify({
            type:GAME_OVER,
            user:decodeToken(),
          }))
          break;
        default:
          break;
      }
    };
  }, [socket]);

  if (!socket) return <div>Connecting...</div>;

  return (
    <div className="flex justify-center md:w-full ">
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
            {started && (
              <div className="h-15 flex justify-between bg-gray-800 items-center pl-1 rounded-lg p-3 ">
                <div className="text-blue-900">You Are</div>{" "}
                {youAre === "b" ? (
                  <p className="w-20 h-6 bg-black rounded-lg mt-1 ml-5 youAreB"></p>
                ) : (
                  <p className="w-20 h-6 bg-white rounded-lg mt-1 ml-5 youAreW"></p>
                )}
              </div>
            )}
            <div className="flex justify-center text-3xl p-2 pr-4 pl-4 borderr text-blue-900 font-bold rounded-lg">
              {!clicked && !started  && !clicked  && (
                <Button
                  onClick={() => {
                    setClicked(true);
                    socket.send(
                      JSON.stringify({
                        type: INIT_GAME,
                        user: decodeToken(),
                      })
                    );
                  }}
                >
                  Play
                </Button>
              )}
              {show && !started && (
                <Button
                  onClick={() => {
                    setClicked(true);
                    setShow(false);
                    socket.send(
                      JSON.stringify({
                        type: INIT_GAME,
                        user: decodeToken(),
                      })
                    );
                  }}
                >
                  Play Again
                </Button>
              )}
              {show && !started && (
                <button
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-2 rounded p-2 m-4 button"
                  onClick={() => {
                    navigate("/");
                  }}
                >
                  Home
                </button>
              )}
              {started && (
                <div>
                  Turn of
                  <p
                    className={`inline ${
                      turn === "w"
                        ? "text-white bg-black rounded-lg p-1"
                        : "text-black bg-white rounded-lg p-1"
                    }`}
                  >
                    {turn === "w" ? "White" : "Black"}
                  </p>
                </div>
              )}
              {clicked && !started && (
                <div className="waiting">Waiting for other player to start</div>
              )}
            </div>
            {(started || show) && (
              <div className="move bg-gray-950 m-2">
                {gameover && <p className="text-2xl m-4">Winner : {winner}</p>}
                <p className="text-xl m-3">Moves:</p>
                <ul>
                  {moves.map((move, index) => (
                    <li key={index} className="ml-3">
                      {move.from} {move.to} by{" "}
                      {index % 2 === 0 ? "White" : "Black"}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Reset Button */}
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mt-4"
              onClick={()=>{
                resetState();
              }}
            >
              {(clicked)?"Leave Game":"Resign Game"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
