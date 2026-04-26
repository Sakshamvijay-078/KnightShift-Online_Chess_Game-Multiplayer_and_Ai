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

  const [play,setPlay] = useState(true);
  const [waiting, setWaiting] = useState(false);
  const [table, setTable] = useState(false);
  const [playAgain, setPlayAgain] = useState(false);
  const [leave, setLeave] = useState(true);
  const [resign, setResign] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [gameover, setGameover] = useState(false);

  const [youAre, setYouAre] = useState<string>("");
  const [winner, setWinner] = useState<string>("");
  const resetState = () => {
    setTurn("w");
    setWaiting(false);
    setPlayAgain(true);
    setTable(true);
    setChess(new Chess());
    setBoard(chess.board());
    setPlay(false);
    setResign(false);
    setGameover(true);
    setPlaying(false);
    setLeave(true);
    setGameover(true);
    localStorage.removeItem("chessGameState"); // Clear saved state in localStorage
    socket?.send(JSON.stringify({
      type:RESIGN,
      user: decodeToken(),
    }));
  };
  const LeaveState = () =>{
    setPlay(true);
    setWaiting(false);
    setPlayAgain(false);
    setPlaying(false);
    setTable(false);
    setLeave(false);
    setResign(false);
    setMoves([]);
    setTurn('w');
    setYouAre('null');
    setWinner("null");
    setGameover(false);
    setChess(new Chess());
    setBoard(chess.board());
    localStorage.removeItem('chessGameState');
  }

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
        play: savedPlay,
        waiting: savedWaiting,
        table: savedTable,
        playAgain: savedPlayAgain,
        playing: savedPlaying,
        resign: savedResign,
        leave: savedLeave,
        youAre: savedYouAre,
        winner: savedWinner,
        gameover: savedGameover,
      } = JSON.parse(savedState);

      setTurn(savedTurn || "w");
      setMoves(savedMoves || []);
      setPlaying(savedPlaying || false);
      setBoard(savedBoard || chess.board());
      setPlay(savedPlay || true);
      setWaiting(savedWaiting || false);
      setTable(savedTable || false);
      setPlayAgain(savedPlayAgain || false);
      setResign(savedResign || false);
      setLeave(savedLeave || true);
      setYouAre(savedYouAre || "none");
      setGameover(savedGameover || false);
      setWinner(savedWinner || "none");
    }
  }, []);

  // // Save state to local storage whenever it changes
  // useEffect(() => {
  //   const gameState = {
  //     turn,
  //     moves,
  //     chess,
  //     board,
  //     play,
  //     waiting,
  //     table,
  //     playAgain,
  //     playing,
  //     resign,
  //     leave,
  //     youAre,
  //     gameover,
  //     winner
  //   };
  //   localStorage.setItem("chessGameState", JSON.stringify(gameState));
  // }, [turn, moves, board, play, playing, playAgain, table, resign, leave, youAre,chess,gameover,winner,waiting]);

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
          setWaiting(false);
          setPlaying(true);
          setTable(true);
          setResign(true);
          setYouAre(message.payload.color);
          setTurn("w");
          setChess(new Chess());
          setBoard(chess.board());
          break;
        case MOVE:
          chess.move(message.payload);
          setBoard(chess.board());
          break;
        case GAME_OVER:
          setTimeout(() => {
            setPlaying(false);
            setPlayAgain(true);
            setChess(new Chess());
            setLeave(true);
            setTable(true);
            setBoard(chess.board());
            setTurn("NONE");
            setWinner(message.winner);
            setGameover(true);
            setResign(false);
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
            {playing && (
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
              {play && (
                <Button
                  onClick={() => {
                    setPlay(false);
                    setLeave(false);
                    setResign(true);
                    setWaiting(true);
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
              {playAgain && (
                <Button
                  onClick={() => {
                    setPlay(false);
                    setPlayAgain(false);
                    setWaiting(true);
                    setLeave(true);
                    setResign(false);
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
              {playAgain && (
                <button
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-2 rounded p-2 m-4 button"
                  onClick={() => {
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
                      turn === "w"
                        ? "text-white bg-black rounded-lg p-1"
                        : "text-black bg-white rounded-lg p-1"
                    }`}
                  >
                    {turn === "w" ? "White" : "Black"}
                  </p>
                </div>
              )}
              {waiting && (
                <div className="waiting">Waiting for other player to start</div>
              )}
            </div>
            {table && <div className="move bg-gray-950 m-2">
                {gameover && <p className="text-2xl m-4">Winner : {winner}</p>}
                {<p className="text-xl m-3">Moves:</p>}
                {<ul>
                  {moves.map((move, index) => (
                    <li key={index} className="ml-3">
                      {move.from} {move.to} by{" "}
                      {index % 2 === 0 ? "White" : "Black"}
                    </li>
                  ))}
                </ul>}
              </div>
            }
            {leave && < button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mt-4"
              onClick={()=>{
                setPlaying(false);
                LeaveState();
              }}
            >
              Leave Game
            </button>}
            {resign && < button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mt-4"
              onClick={()=>{
                resetState();
              }}
            >
              Resign Game
            </button>}
          </div>
        </div>
      </div>
    </div>
  );
};
