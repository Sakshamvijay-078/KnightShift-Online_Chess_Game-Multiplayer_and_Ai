import { useNavigate } from "react-router-dom";
import { useGlobalSocket } from "../context/SocketContext";
import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { decodeToken } from "./GetUserName";
import { AiChessBoard } from "../components/AiChessBoard";
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

    if (!socket) return (
        <div className="min-h-screen bg-chess-darker flex flex-col items-center justify-center text-white relative overflow-hidden">
            <div className="absolute w-96 h-96 bg-chess-accent/20 rounded-full blur-[100px] animate-pulse-slow"></div>
            <div className="z-10 flex flex-col items-center">
                <svg className="animate-spin h-12 w-12 text-chess-accent mb-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <div className="text-xl font-bold tracking-widest uppercase">Connecting to AI Server...</div>
            </div>
        </div>
    );

    const handleGameStart = () => {
        if(youAre === "none") {
            alert("Please select a color first");
            return;
        }
        setGameSetup(true); setWaiting(false); setPlaying(true); setTable(true); setLeave(false); setResign(true); setTurn("white");
        socket.send(JSON.stringify({ type: AiINIT_GAME, user: decodeToken(), color: youAre, level }));
    };

    return (
        <div className="flex justify-center w-full min-h-screen bg-chess-darker py-6 px-4 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-chess-accent/10 rounded-full blur-[150px] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-chess-board/10 rounded-full blur-[150px] pointer-events-none"></div>

            <NotificationBell />
            <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
                
                {!gameSetup ? (
                    <div className="col-span-12 flex flex-col items-center justify-center min-h-[70vh] py-12">
                        <div className="glass-panel rounded-[2rem] p-8 md:p-12 max-w-3xl w-full mx-auto shadow-2xl relative overflow-hidden border border-white/10">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-chess-accent/20 rounded-full blur-[60px] pointer-events-none"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-600/10 rounded-full blur-[50px] pointer-events-none"></div>
                            
                            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 text-center mb-2 uppercase tracking-tight">Play vs Stockfish</h1>
                            <p className="text-chess-muted text-center mb-10 text-lg">Challenge the world's most powerful chess engine.</p>
                            
                            <div className="w-full space-y-10 relative z-10">
                                <div className="space-y-4">
                                    <h2 className="text-sm font-bold text-chess-muted uppercase tracking-widest text-center flex items-center justify-center gap-4">
                                        <div className="w-10 h-[1px] bg-white/10"></div>
                                        Choose Your Color
                                        <div className="w-10 h-[1px] bg-white/10"></div>
                                    </h2>
                                    <div className="flex gap-6 justify-center">
                                        <button onClick={() => setYouAre("w")} className={`w-32 h-32 rounded-2xl border-4 transition-all duration-300 flex flex-col items-center justify-center gap-2 group ${youAre === 'w' ? 'border-chess-board bg-white/10 shadow-[0_0_30px_rgba(255,255,255,0.2)]' : 'border-white/5 bg-black/20 hover:border-white/20 hover:bg-white/5'}`}>
                                            <img src="/kw.png" className="w-16 h-16 opacity-90 drop-shadow-lg group-hover:scale-110 transition-transform" alt="White King"/>
                                            <span className="text-white font-bold tracking-wider">WHITE</span>
                                        </button>
                                        <button onClick={() => setYouAre("b")} className={`w-32 h-32 rounded-2xl border-4 transition-all duration-300 flex flex-col items-center justify-center gap-2 group ${youAre === 'b' ? 'border-chess-board bg-black/40 shadow-[0_0_30px_rgba(0,0,0,0.5)]' : 'border-white/5 bg-black/20 hover:border-white/20 hover:bg-black/30'}`}>
                                            <img src="/k.png" className="w-16 h-16 opacity-90 drop-shadow-lg group-hover:scale-110 transition-transform" alt="Black King"/>
                                            <span className="text-gray-300 font-bold tracking-wider">BLACK</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h2 className="text-sm font-bold text-chess-muted uppercase tracking-widest text-center flex items-center justify-center gap-4">
                                        <div className="w-10 h-[1px] bg-white/10"></div>
                                        Select Difficulty
                                        <div className="w-10 h-[1px] bg-white/10"></div>
                                    </h2>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[ { lbl: "Beginner", val: 5, icon: '🐣' }, { lbl: "Amateur", val: 10, icon: '🧠' }, { lbl: "Master", val: 15, icon: '⚔️' }, { lbl: "Grandmaster", val: 20, icon: '👑' } ].map((opt) => (
                                            <button 
                                                key={opt.val}
                                                onClick={() => setLevel(opt.val)}
                                                className={`py-4 px-2 flex flex-col items-center justify-center gap-2 rounded-xl border-2 transition-all duration-300 ${level === opt.val ? 'bg-chess-accent/20 border-chess-accent text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] transform scale-105' : 'bg-black/20 border-white/5 text-gray-400 hover:border-white/20 hover:bg-white/5'}`}
                                            >
                                                <span className="text-2xl">{opt.icon}</span>
                                                <span className="font-bold tracking-wide">{opt.lbl}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button onClick={handleGameStart} className="w-full bg-gradient-to-r from-chess-accent to-chess-accentHover text-white font-black py-5 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transform hover:-translate-y-1 transition-all outline-none text-xl tracking-widest uppercase mt-4">
                                    INITIALIZE MATCH
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Left Side: Chess Board */}
                        <div className="col-span-1 lg:col-span-8 flex flex-col justify-center items-center lg:items-start w-full mx-auto">
                            
                            {/* AI Opponent Card */}
                            {playing || gameOver ? (
                                <div className="w-full max-w-[640px] flex flex-col glass-panel rounded-t-2xl p-4 mb-2 shadow-lg backdrop-blur-xl border-b-0 border-white/10 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px]"></div>
                                    <div className="flex justify-between items-center w-full relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gray-800 rounded-xl shadow-inner flex items-center justify-center font-bold text-blue-400 border border-white/5 text-xl">🤖</div>
                                            <div>
                                                <span className="font-bold text-white text-lg block flex items-center gap-2">Stockfish Engine <span className="bg-blue-900/50 text-blue-300 text-xs px-2 py-0.5 rounded border border-blue-500/30">Lvl {level}</span></span>
                                                <span className="text-xs text-chess-muted uppercase">Computer</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 mt-3 min-h-[24px]">
                                        {oppCaptured.map((piece, i) => (
                                            <img key={i} src={`/${youAre === 'w' ? `${piece.toUpperCase()}_copy` : piece}.png`} className="w-6 h-6 opacity-90 drop-shadow-sm transform hover:scale-110 transition-transform" alt={piece} />
                                        ))}
                                        {oppAdvantage > 0 && <span className="text-chess-muted text-sm font-bold ml-2 bg-white/10 px-2 rounded-md">+{oppAdvantage}</span>}
                                    </div>
                                </div>
                            ) : null}

                            <div className={`w-full max-w-[640px] shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-lg overflow-hidden border border-white/10 ${historyIndex !== -1 ? 'opacity-90 grayscale-[0.2]' : ''}`}>
                                <AiChessBoard board={board} socket={socket} playercolor={youAre} chessEngine={hello} />
                            </div>

                            {/* Analysis Traverse Controls */}
                            {(gameOver || playing) && moves.length > 0 && (
                                <div className="w-full max-w-[640px] mt-2 glass-panel rounded-2xl border-white/10 overflow-hidden shadow-lg">
                                    <div className="flex w-full divide-x divide-white/10 h-14">
                                        <button onClick={() => {
                                            if(historyIndex === -1 && moves.length === 0) return;
                                            setHistoryIndex(0);
                                            const traverseChess = new Chess();
                                            if (moves.length > 0) traverseChess.move(moves[0]);
                                            setBoard(traverseChess.board());
                                        }} className="flex-1 flex justify-center items-center hover:bg-white/10 transition text-chess-muted hover:text-white group" title="First Move">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-active:scale-90 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M7 6v12h2V6H7zm9 12l-6-6 6-6v12z"/>
                                            </svg>
                                        </button>
                                        <button onClick={() => handleTraverse("prev")} className="flex-1 flex justify-center items-center hover:bg-white/10 transition text-chess-muted hover:text-white group" title="Previous Move">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 group-active:scale-90 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/>
                                            </svg>
                                        </button>
                                        <button onClick={() => handleTraverse("next")} className="flex-1 flex justify-center items-center hover:bg-white/10 transition text-chess-muted hover:text-white group" title="Next Move">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 group-active:scale-90 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                                            </svg>
                                        </button>
                                        <button onClick={() => {
                                            setHistoryIndex(-1);
                                            setBoard(hello.board());
                                        }} className="flex-1 flex justify-center items-center hover:bg-white/10 transition text-chess-muted hover:text-white group" title="Live Board">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-active:scale-90 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M17 6h-2v12h2V6zM7 6v12l6-6-6-6z"/>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Player Card */}
                            {(playing || gameOver) ? (
                                <div className="w-full max-w-[640px] flex flex-col glass-panel rounded-b-2xl p-4 mt-2 shadow-lg backdrop-blur-xl border-t-0 border-white/10 relative overflow-hidden">
                                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-chess-accent/10 rounded-full blur-[40px]"></div>
                                    <div className="flex items-center gap-1 mb-3 min-h-[24px] relative z-10">
                                        {myCaptured.map((piece, i) => (
                                            <img key={i} src={`/${youAre === 'w' ? piece : `${piece.toUpperCase()}_copy`}.png`} className="w-6 h-6 opacity-90 drop-shadow-sm transform hover:scale-110 transition-transform" alt={piece} />
                                        ))}
                                        {myAdvantage > 0 && <span className="text-chess-muted text-sm font-bold ml-2 bg-white/10 px-2 rounded-md">+{myAdvantage}</span>}
                                    </div>
                                    <div className="flex justify-between items-center w-full relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-chess-accent to-chess-board rounded-xl shadow-inner flex items-center justify-center font-black text-white border border-white/20">YOU</div>
                                            <div>
                                                <span className="font-bold text-white text-lg block">You <span className="text-chess-muted font-normal text-sm ml-1">({youAre === 'w' ? 'White' : 'Black'})</span></span>
                                                <span className="text-xs text-chess-accent uppercase font-bold">Player</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                        </div>

                        {/* Right Side: Info Panel */}
                        <div className="col-span-1 lg:col-span-4 flex flex-col gap-4 max-w-[640px] mx-auto w-full">
                            <div className="glass-panel border-white/10 rounded-3xl p-6 shadow-2xl w-full max-h-[85vh] flex flex-col relative overflow-hidden">
                                
                                {gameOver ? (
                                   <div className="text-center p-5 bg-gradient-to-r from-yellow-900/40 to-yellow-800/20 rounded-2xl border border-yellow-700/50 mb-6 shrink-0 relative overflow-hidden">
                                     <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/20 rounded-full blur-[20px]"></div>
                                     <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200 mb-2 drop-shadow-md">Match Complete</h2>
                                     <p className="text-gray-200 text-lg">Winner: <span className="font-black text-white capitalize">{winner}</span></p>
                                   </div>
                                ) : playing || playAgain ? (
                                    <div className="text-center p-4 mb-6 rounded-2xl shrink-0 bg-chess-darker/50 border border-white/5 flex items-center justify-between">
                                        <span className="text-sm text-chess-muted uppercase tracking-widest font-bold">To Move</span>
                                        <span className={`inline-block px-5 py-2 rounded-xl font-bold text-sm shadow-inner transition-colors ${turn === 'white' ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-gray-900 text-white border border-gray-700 shadow-[0_0_15px_rgba(0,0,0,0.5)]'}`}>{turn.toUpperCase()}</span>
                                    </div>
                                ) : null}

                                <div className="grid grid-cols-1 gap-4 shrink-0 mt-auto">
                                    {playAgain && (
                                        <button className="w-full bg-gradient-to-r from-chess-accent to-chess-accentHover text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transform hover:-translate-y-0.5 transition-all outline-none" onClick={() => {
                                            setPlay(false); setPlayAgain(false); setTable(false); setWaiting(true); setLeave(false); setMoves([]); setGameOver(false);
                                            socket.send(JSON.stringify({ type: AiINIT_GAME, user: decodeToken(), color: youAre, level }));
                                        }}>Rematch AI</button>
                                    )}
                                    {resign && (
                                        <button className="w-full bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 text-red-200 font-bold py-4 rounded-xl transition-colors" onClick={() => {
                                            if(window.confirm("Are you sure you want to resign against the computer?")) {
                                                socket.send(JSON.stringify({ type: AiRESIGN, user: decodeToken() }));
                                                navigate("/");
                                            }
                                        }}>Resign Match</button>
                                    )}
                                    {(playAgain || leave) && (
                                        <button className="w-full text-chess-muted hover:text-white py-3 text-sm font-medium transition-colors" onClick={() => { navigate("/"); }}>Back to Dashboard</button>
                                    )}
                                </div>
                                
                                {/* Move Tracker */}
                                {playing || gameOver ? (
                                    <div className="flex-1 mt-6 border-t border-gray-700/50 pt-2 overflow-y-auto custom-scrollbar flex flex-col min-h-0">
                                        <h3 className="text-chess-muted font-bold mb-3 uppercase text-[10px] tracking-widest shrink-0 flex justify-between items-center px-2">
                                            <span>Match History</span>
                                            {historyIndex !== -1 && <span className="text-premium-gold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-premium-gold animate-pulse"></span> ANALYSIS MODE</span>}
                                        </h3>
                                        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-sm">
                                        {moves.filter((_, i) => i % 2 === 0).map((moveWhiteInfo, rawIndex) => {
                                            const index = rawIndex * 2;
                                            const moveBlackInfo = moves[index + 1];
                                            const moveWhite = moveWhiteInfo.san || `${moveWhiteInfo.from}-${moveWhiteInfo.to}`;
                                            const moveBlack = moveBlackInfo ? (moveBlackInfo.san || `${moveBlackInfo.from}-${moveBlackInfo.to}`) : null;
                                            return (
                                                    <div key={index} className="col-span-2 grid grid-cols-12 gap-2 hover:bg-white/5 rounded-lg px-2 py-1.5 group transition-colors">
                                                        <div className="col-span-2 text-chess-muted font-mono flex items-center justify-center text-xs">{rawIndex + 1}.</div>
                                                        <div className={`col-span-5 flex items-center justify-center font-mono font-bold py-1 rounded cursor-pointer transition-all ${historyIndex === index ? 'bg-chess-accent text-white shadow-md' : 'text-gray-300 hover:bg-white/10'}`} onClick={() => handleTraverse("prev")}>
                                                            {moveWhite}
                                                        </div>
                                                        {moveBlack ? (
                                                            <div className={`col-span-5 flex items-center justify-center font-mono font-bold py-1 rounded cursor-pointer transition-all ${historyIndex === index+1 ? 'bg-white/20 text-white shadow-md border border-white/30' : 'text-gray-300 hover:bg-white/10'}`}>
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
