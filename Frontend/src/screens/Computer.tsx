import { useNavigate } from "react-router-dom";
import { useGlobalSocket } from "../context/SocketContext";
import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { decodeToken } from "./GetUserName";
import { AiChessBoard } from "../components/AiChessBoard";
import { Button } from "../components/Button";
import { NotificationBell } from "../components/NotificationBell";
import { playMoveSound, playCaptureSound, playGameOverSound } from "../utils/audio";
import { getCapturedPieces } from "../utils/chessUtils";

export const AiMOVE = "ai_move";
export const AiRESIGN = "ai_resign";
export const AiINIT_GAME = "ai_init_game";
export const AiGAME_OVER = "ai_game_over";
export const AiREMOVE_USER = "ai_remove_user";
export const AiREFRESH = "ai_refresh";

interface Move {
  from: string;
  to: string;
  promotion?: string;
  san: string;
}

export const Computer = () => {
    const navigate = useNavigate();
    const socket = useGlobalSocket();
    
    const [board, setBoard] = useState(new Chess().board());
    const [hello, setHello] = useState(new Chess());
    const [turn, setTurn] = useState("white");
    const [moves, setMoves] = useState<Move[]>([]);
    
    // Lifecycle 
    const [, setPlay] = useState(true);
    const [, setWaiting] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [table, setTable] = useState(false);
    const [leave, setLeave] = useState(true);
    const [resign, setResign] = useState(false);
    const [youAre, setYouAre] = useState("none");
    const { capturedByWhite, capturedByBlack, whiteAdvantage, blackAdvantage } = getCapturedPieces(board);

    const myCaptured = youAre === 'w' ? capturedByWhite : capturedByBlack;
    const oppCaptured = youAre === 'w' ? capturedByBlack : capturedByWhite;
    const myAdvantage = youAre === 'w' ? whiteAdvantage : blackAdvantage;
    const oppAdvantage = youAre === 'w' ? blackAdvantage : whiteAdvantage;
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState("");
    const [playAgain, setPlayAgain] = useState(false);
    const [level, setLevel] = useState<number>(15);
    const [gameSetup, setGameSetup] = useState<boolean>(false);
    
    // Analysis boundary
    const [historyIndex, setHistoryIndex] = useState(-1);

    useEffect(() => {
        if (!socket) return;
        socket.send(JSON.stringify({ type: AiREFRESH, user: decodeToken() }));
        
        socket.onmessage = (Data) => {
            const message = JSON.parse(Data.data);
            if (message.turn) setTurn(message.turn);

            switch (message.type) {
                case AiINIT_GAME:
                    const newChess = message.fen ? new Chess(message.fen) : new Chess();
                    setHello(newChess);
                    setBoard(newChess.board());
                    setWaiting(false); setPlaying(true); setTable(true); setLeave(false); setResign(true);
                    setTurn("white");
                    setMoves([]);
                    setHistoryIndex(-1);
                    setGameOver(false);
                    break;

                case AiMOVE:
                    if (message.valid) {
                        setMoves((prev) => [...prev, message.payload]);
                        const c = message.fen ? new Chess(message.fen) : new Chess();
                        setHello(c);
                        if (historyIndex === -1) setBoard(c.board());
                        
                        const flags = message.payload?.flags || "";
                        if (flags.includes('c') || flags.includes('e')) {
                            playCaptureSound();
                        } else {
                            playMoveSound();
                        }
                    }
                    break;
                
                case AiGAME_OVER:
                    const finalC = message.fen ? new Chess(message.fen) : new Chess();
                    setHello(finalC);
                    if (historyIndex === -1) setBoard(finalC.board());
                    
                    setTurn("null"); setLeave(true); setResign(false);
                    setPlaying(false); setGameOver(true); setWinner(message.winner); setPlayAgain(true);
                    playGameOverSound();
                    
                    socket.send(JSON.stringify({ type: AiGAME_OVER, user: decodeToken() }));
                    break;
            }
        };
    }, [socket, historyIndex]);

    const handleTraverse = (direction: "prev" | "next") => {
        if (!table || moves.length === 0) return;
        
        let newIndex = historyIndex === -1 ? moves.length - 1 : historyIndex;
        if (direction === "prev" && newIndex >= 0) newIndex--;
        if (direction === "next" && newIndex < moves.length - 1) newIndex++;
        
        if (direction === "next" && newIndex === moves.length - 1) {
            setHistoryIndex(-1);
            setBoard(hello.board());
            return;
        }

        setHistoryIndex(newIndex);
        const traverseChess = new Chess();
        for (let i = 0; i <= newIndex; i++) {
            if (i >= 0) traverseChess.move(moves[i]);
        }
        setBoard(traverseChess.board());
    };

    if (!socket) return <div className="min-h-screen bg-chess-dark flex items-center justify-center text-xl text-gray-300">Connecting to AI Server...</div>;

    const handleGameStart = () => {
        if(youAre === "none") {
            alert("Please select a color first");
            return;
        }
        setGameSetup(true); setWaiting(false); setPlaying(true); setTable(true); setLeave(false); setResign(true); setTurn("white");
        socket.send(JSON.stringify({ type: AiINIT_GAME, user: decodeToken(), youAre, level }));
    };

    return (
        <div className="flex justify-center w-full min-h-screen bg-chess-dark py-8 px-4">
            <NotificationBell />
            <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 relative">
                
                {!gameSetup ? (
                    <div className="col-span-12 flex flex-col items-center justify-center min-h-[60vh] bg-chess-panel border border-gray-700 rounded-3xl p-8 max-w-2xl mx-auto shadow-2xl space-y-10">
                        <h1 className="text-4xl font-black text-white text-center">Play vs Stockfish</h1>
                        
                        <div className="w-full space-y-4">
                            <h2 className="text-xl font-bold text-gray-300 text-center">1. Choose Your Color</h2>
                            <div className="flex gap-4 justify-center">
                                <button onClick={() => setYouAre("w")} className={`w-24 h-24 rounded-2xl border-4 transition-all hover:-translate-y-1 ${youAre === 'w' ? 'border-chess-board bg-white' : 'border-gray-600 bg-gray-200'}`}>
                                    <img src="/kw.png" className="w-16 h-16 mx-auto opacity-80" alt="White King"/>
                                </button>
                                <button onClick={() => setYouAre("b")} className={`w-24 h-24 rounded-2xl border-4 transition-all hover:-translate-y-1 ${youAre === 'b' ? 'border-chess-board bg-gray-900' : 'border-gray-600 bg-gray-800'}`}>
                                    <img src="/k.png" className="w-16 h-16 mx-auto opacity-80" alt="Black King"/>
                                </button>
                            </div>
                        </div>

                        <div className="w-full space-y-4">
                            <h2 className="text-xl font-bold text-gray-300 text-center">2. Select Difficulty</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[ { lbl: "Easy", val: 5 }, { lbl: "Medium", val: 10 }, { lbl: "Hard", val: 15 }, { lbl: "Pro", val: 20 } ].map((opt) => (
                                    <button 
                                        key={opt.val}
                                        onClick={() => setLevel(opt.val)}
                                        className={`py-3 rounded-xl font-bold border-2 transition-all ${level === opt.val ? 'bg-chess-board bg-opacity-20 border-chess-board text-white' : 'bg-transparent border-gray-700 text-gray-400 hover:border-gray-500'}`}
                                    >
                                        {opt.lbl}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Button variant="primary" onClick={handleGameStart} className="w-full text-xl py-4 mt-6">
                            Start Game
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Left Side: Chess Board */}
                        <div className="col-span-1 md:col-span-8 flex flex-col justify-center items-start">
                            
                            {/* AI Opponent Card */}
                            {playing || gameOver ? (
                                <div className="w-full max-w-[640px] flex flex-col bg-gray-800/80 p-3 border border-b-0 border-gray-700">
                                    <div className="flex justify-between items-center w-full">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-600 rounded shadow flex items-center justify-center font-bold text-gray-300">AI</div>
                                            <span className="font-bold text-gray-200">Stockfish (Lvl {level})</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 mt-2 h-6 pl-13">
                                        {oppCaptured.map((piece, i) => (
                                            <img key={i} src={`/${youAre === 'w' ? `${piece.toUpperCase()}_copy` : piece}.png`} className="w-5 h-5 opacity-80" alt={piece} />
                                        ))}
                                        {oppAdvantage > 0 && <span className="text-gray-400 text-sm font-bold ml-1">+{oppAdvantage}</span>}
                                    </div>
                                </div>
                            ) : null}

                            <div className={historyIndex !== -1 ? "opacity-90 grayscale-[0.2]" : ""}>
                                <AiChessBoard board={board} socket={socket} playercolor={youAre} chessEngine={hello} />
                            </div>

                            {/* Player Card */}
                            {(playing || gameOver) ? (
                                <div className="w-full max-w-[640px] flex flex-col bg-gray-800/80 p-3 border border-t-0 border-gray-700 shadow-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-chess-board rounded shadow flex items-center justify-center font-bold text-white shadow-inner">YOU</div>
                                        <span className="font-bold text-white">You ({youAre === 'w' ? 'White' : 'Black'})</span>
                                    </div>
                                    <div className="flex items-center gap-1 mt-2 h-6 pl-13">
                                        {myCaptured.map((piece, i) => (
                                            <img key={i} src={`/${youAre === 'w' ? piece : `${piece.toUpperCase()}_copy`}.png`} className="w-5 h-5 opacity-80" alt={piece} />
                                        ))}
                                        {myAdvantage > 0 && <span className="text-gray-400 text-sm font-bold ml-1">+{myAdvantage}</span>}
                                    </div>
                                </div>
                            ) : null}

                            {/* Analysis Traverse Controls */}
                            {(gameOver || playing) && moves.length > 0 && (
                                <div className="w-full max-w-[640px] flex justify-center mt-4">
                                    <div className="flex gap-2 bg-chess-panel border border-gray-700 rounded-xl p-2 shadow-lg">
                                        <button onClick={() => handleTraverse("prev")} className="p-3 hover:bg-gray-700 rounded transition text-gray-300 hover:text-white" disabled={historyIndex === -1 && moves.length === 0}>
                                            &larr; Prev
                                        </button>
                                        <div className="px-6 py-3 font-mono text-gray-400 border-x border-gray-700">
                                            {historyIndex === -1 ? "LIVE" : `Move ${historyIndex + 1}/${moves.length}`}
                                        </div>
                                        <button onClick={() => handleTraverse("next")} className="p-3 hover:bg-gray-700 rounded transition text-gray-300 hover:text-white" disabled={historyIndex === -1}>
                                            Next &rarr;
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Right Side: Info Panel */}
                        <div className="col-span-1 md:col-span-4 flex flex-col gap-4">
                            <div className="bg-chess-panel border border-gray-700/50 rounded-2xl p-6 shadow-xl w-full max-h-[85vh] flex flex-col">
                                
                                {gameOver ? (
                                   <div className="text-center p-4 bg-yellow-900/30 rounded-xl border border-yellow-700/50 mb-4 shrink-0">
                                     <h2 className="text-2xl font-black text-yellow-400 mb-1">Match Complete</h2>
                                     <p className="text-gray-300">Winner: <span className="font-bold text-white capitalize">{winner}</span></p>
                                   </div>
                                ) : playing || playAgain ? (
                                    <div className="text-center p-3 mb-4 rounded-xl shrink-0 bg-gray-800/50 border border-gray-700/50">
                                        <span className="text-sm text-gray-400 uppercase tracking-widest block mb-1">To Move</span>
                                        <span className={`inline-block px-4 py-1 rounded font-bold text-lg shadow-inner ${turn === 'white' ? 'bg-white text-black' : 'bg-gray-900 text-white border border-gray-700'}`}>{turn}</span>
                                    </div>
                                ) : null}

                                <div className="grid grid-cols-1 gap-3 shrink-0">
                                    {playAgain && (
                                        <Button variant="primary" onClick={() => {
                                            setPlay(false); setPlayAgain(false); setTable(false); setWaiting(true); setLeave(false); setMoves([]); setGameOver(false);
                                            socket.send(JSON.stringify({ type: AiINIT_GAME, user: decodeToken(), youAre, level }));
                                        }}>Rematch AI</Button>
                                    )}
                                    {resign && (
                                        <Button variant="danger" onClick={() => {
                                            if(window.confirm("Are you sure you want to resign against the computer?")) {
                                                socket.send(JSON.stringify({ type: AiRESIGN, user: decodeToken() }));
                                                navigate("/");
                                            }
                                        }}>Resign</Button>
                                    )}
                                    {(playAgain || leave) && (
                                        <Button variant="secondary" onClick={() => { navigate("/"); }}>Main Menu</Button>
                                    )}
                                </div>
                                
                                {/* Move Tracker */}
                                {playing || gameOver ? (
                                    <div className="flex-1 mt-4 border-t border-gray-700/50 pt-4 overflow-y-auto custom-scrollbar flex flex-col min-h-0">
                                        <h3 className="text-gray-400 font-bold mb-2 uppercase text-xs tracking-wider shrink-0 flex justify-end">
                                            {historyIndex !== -1 && <span className="text-yellow-400">ANALYSIS MODE</span>}
                                        </h3>
                                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm bg-gray-900 rounded border border-gray-700 p-2">
                                        {moves.filter((_, i) => i % 2 === 0).map((moveWhiteInfo, rawIndex) => {
                                            const index = rawIndex * 2;
                                            const moveBlackInfo = moves[index + 1];
                                            const moveWhite = moveWhiteInfo.san || `${moveWhiteInfo.from}-${moveWhiteInfo.to}`;
                                            const moveBlack = moveBlackInfo ? (moveBlackInfo.san || `${moveBlackInfo.from}-${moveBlackInfo.to}`) : null;
                                            return (
                                                    <div key={index} className="col-span-2 grid grid-cols-12 gap-2 hover:bg-gray-800 rounded px-1 group">
                                                        <div className="col-span-2 text-gray-600 font-mono text-center pt-1">{rawIndex + 1}.</div>
                                                        <div className={`col-span-5 flex items-center justify-center font-mono font-bold pt-1 pb-1 rounded cursor-pointer transition ${historyIndex === index ? 'bg-chess-board text-white shadow shadow-green-900/50 border border-t-white/30' : 'text-gray-300 hover:text-white'}`} onClick={() => handleTraverse("prev")}>
                                                            {moveWhite}
                                                        </div>
                                                        {moveBlack ? (
                                                            <div className={`col-span-5 flex items-center justify-center font-mono font-bold pt-1 pb-1 rounded cursor-pointer transition ${historyIndex === index+1 ? 'bg-gray-700 border border-gray-500 text-white shadow' : 'text-gray-300 hover:text-white'}`}>
                                                                {moveBlack}
                                                            </div>
                                                        ) : <div className="col-span-5"></div>}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ) : null}
                                
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
