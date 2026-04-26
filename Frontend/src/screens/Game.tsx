import { useNavigate } from "react-router-dom";
import { useGlobalSocket } from "../context/SocketContext";
import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { decodeToken } from "./GetUserName";
import { ChessBoard } from "../components/ChessBoard";
import { Button } from "../components/Button";
import { MatchChat, ChatMessage } from "../components/MatchChat";
import { NotificationBell } from "../components/NotificationBell";
import { playMoveSound, playCaptureSound, playGameOverSound } from "../utils/audio";
import { getCapturedPieces } from "../utils/chessUtils";

export const INIT_GAME = "init_game";
export const CHALLENGE_SEND = "challenge_send";
export const MOVE = "move";
export const GAME_OVER = "game_over";
export const RESIGN = "resign";
export const REFRESH = "refresh";
export const TIMER_UPDATE = "timer_update";
export const INVALID = "invalid";

interface Move {
  from: string;
  to: string;
  promotion?: string;
  san: string;
}

const formatTime = (ms: number) => {
    if (ms <= 0) return "0:00";
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
};

export const Game = () => {
    const navigate = useNavigate();
    const socket = useGlobalSocket();
    
    // Core Game State
    const [board, setBoard] = useState(new Chess().board());
    const [hello, setHello] = useState(new Chess());
    const [turn, setTurn] = useState("white");
    const [moves, setMoves] = useState<Move[]>([]);
    const [youAre, setYouAre] = useState("none");
    
    // Lifecycle State
    const [play, setPlay] = useState(true);
    const [waiting, setWaiting] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [table, setTable] = useState(false);
    const [leave, setLeave] = useState(true);
    const [resign, setResign] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState("");
    const [playAgain, setPlayAgain] = useState(false);
    const [reason, setReason] = useState("");

    // Time & Friend Request State
    const [matchType, setMatchType] = useState<"random" | "friend">("random");
    const [friendEmail, setFriendEmail] = useState("");
    const [durationStr, setDurationStr] = useState("600"); 

    const [activeTab, setActiveTab] = useState<"moves" | "chat">("moves");
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    
    // Live Clocks
    const [player1Time, setPlayer1Time] = useState(600000);
    const [player2Time, setPlayer2Time] = useState(600000);
    const [lastMoveTime, setLastMoveTime] = useState(Date.now());
    
    // Analysis
    const [historyIndex, setHistoryIndex] = useState(-1);
    
    // Clock effect
    useEffect(() => {
        if (!playing || gameOver || historyIndex !== -1) return;
        const interval = setInterval(() => {
            const elapsed = Date.now() - lastMoveTime;
            if (turn === "white") {
                setPlayer1Time(prev => Math.max(0, prev - elapsed));
            } else {
                setPlayer2Time(prev => Math.max(0, prev - elapsed));
            }
            setLastMoveTime(Date.now());
        }, 1000);
        return () => clearInterval(interval);
    }, [playing, gameOver, turn, lastMoveTime, historyIndex]);

    useEffect(() => {
        if (!socket) return;
        socket.send(JSON.stringify({ type: REFRESH, user: decodeToken() }));
        
        const handleMessage = (Data: MessageEvent) => {
            const message = JSON.parse(Data.data);
            if (message.turn) setTurn(message.turn);

            switch (message.type) {
                case INIT_GAME:
                    const newChess = message.fen ? new Chess(message.fen) : new Chess();
                    setHello(newChess);
                    setBoard(newChess.board());
                    setWaiting(false); setPlay(false); setPlaying(true); setTable(true); setLeave(false); setResign(true);
                    setYouAre(message.payload.color); 
                    setTurn("white");
                    setMoves([]);
                    setPlayer1Time(message.payload.duration * 1000);
                    setPlayer2Time(message.payload.duration * 1000);
                    setLastMoveTime(Date.now());
                    setHistoryIndex(-1);
                    setGameOver(false);
                    break;

                case MOVE:
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
                    if (message.player1Time) setPlayer1Time(message.player1Time);
                    if (message.player2Time) setPlayer2Time(message.player2Time);
                    if (message.lastMoveTime) setLastMoveTime(message.lastMoveTime);
                    break;
                
                case TIMER_UPDATE:
                    setPlayer1Time(message.player1Time);
                    setPlayer2Time(message.player2Time);
                    setLastMoveTime(message.lastMoveTime);
                    break;

                case INVALID:
                    alert(message.message);
                    if (message.message.includes("offline")) {
                        setWaiting(false);
                        setPlay(true);
                        setLeave(true);
                    }
                    break;

                case "receive_chat":
                    setChatMessages(prev => [...prev, {
                        id: Date.now().toString() + Math.random().toString(),
                        sender: message.senderName,
                        text: message.message,
                        isSelf: false
                    }]);
                    // Show a tiny red badge if hidden
                    if (activeTab === "moves") {
                        // We could use an indicator here if desired
                    }
                    break;

                case GAME_OVER:
                    const finalC = message.fen ? new Chess(message.fen) : new Chess();
                    setHello(finalC);
                    if (historyIndex === -1) setBoard(finalC.board());
                    
                    setTurn("null"); setLeave(true); setResign(false);
                    setPlaying(false); setGameOver(true); setWinner(message.winner);
                    setReason(message.reason); setPlayAgain(true);
                    playGameOverSound();
                    
                    break;
            }
        };

        socket.addEventListener("message", handleMessage);
        return () => socket.removeEventListener("message", handleMessage);
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

    if (!socket) return <div className="min-h-screen bg-chess-dark flex items-center justify-center text-xl text-gray-300 animate-pulse">Connecting to Server...</div>;

    const myTime = youAre === 'w' ? player1Time : player2Time;
    const oppTime = youAre === 'w' ? player2Time : player1Time;
    const { capturedByWhite, capturedByBlack, whiteAdvantage, blackAdvantage } = getCapturedPieces(board);

    const myCaptured = youAre === 'w' ? capturedByWhite : capturedByBlack;
    const oppCaptured = youAre === 'w' ? capturedByBlack : capturedByWhite;
    const myAdvantage = youAre === 'w' ? whiteAdvantage : blackAdvantage;
    const oppAdvantage = youAre === 'w' ? blackAdvantage : whiteAdvantage;

    return (
        <div className="flex justify-center w-full min-h-screen bg-chess-dark py-8 px-4">
            <NotificationBell />
            <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 relative">
                
                {/* Left Side: Chess Board */}
                <div className="col-span-1 md:col-span-8 flex flex-col justify-center items-start">
                    
                    {/* Opponent Card */}
                    {playing || gameOver ? (
                        <div className="w-full max-w-[640px] flex flex-col bg-gray-800/80 p-3 border border-b-0 border-gray-700">
                            <div className="flex justify-between items-center w-full">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-600 rounded shadow flex items-center justify-center font-bold text-gray-300">OPP</div>
                                    <span className="font-bold text-gray-200">Opponent</span>
                                </div>
                                <div className="bg-gray-900 border border-gray-700 px-4 py-1 flex items-center justify-center rounded text-xl font-mono font-bold text-gray-300">
                                    {formatTime(oppTime)}
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

                    {/* Board Surface */}
                    <div className={historyIndex !== -1 ? "opacity-90 grayscale-[0.2]" : ""}>
                       <ChessBoard board={board} socket={socket} playercolor={youAre} chessEngine={hello} />
                    </div>

                    {/* Flush Analysis Traverse Controls */}
                    {(gameOver || playing) && moves.length > 0 && (
                        <div className="w-full max-w-[640px] flex justify-center bg-gray-900 border border-t-0 border-b-0 border-gray-700 shadow-inner">
                            <div className="flex w-full divide-x divide-gray-700 h-12">
                                <button onClick={() => {
                                    if(historyIndex === -1 && moves.length === 0) return;
                                    setHistoryIndex(0);
                                    const traverseChess = new Chess();
                                    if (moves.length > 0) traverseChess.move(moves[0]);
                                    setBoard(traverseChess.board());
                                }} className="flex-1 flex justify-center items-center hover:bg-gray-800 transition text-gray-400 hover:text-white group" title="First Move">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-active:scale-95 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M7 6v12h2V6H7zm9 12l-6-6 6-6v12z"/>
                                    </svg>
                                </button>
                                <button onClick={() => handleTraverse("prev")} className="flex-1 flex justify-center items-center hover:bg-gray-800 transition text-gray-400 hover:text-white group" title="Previous Move">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 group-active:scale-95 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/>
                                    </svg>
                                </button>
                                <button onClick={() => handleTraverse("next")} className="flex-1 flex justify-center items-center hover:bg-gray-800 transition text-gray-400 hover:text-white group" title="Next Move">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 group-active:scale-95 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                                    </svg>
                                </button>
                                <button onClick={() => {
                                    setHistoryIndex(-1);
                                    setBoard(hello.board());
                                }} className="flex-1 flex justify-center items-center hover:bg-gray-800 transition text-gray-400 hover:text-white group" title="Current/Live Move">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-active:scale-95 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17 6h-2v12h2V6zM7 6v12l6-6-6-6z"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Player Card */}
                    {playing || gameOver ? (
                        <div className="w-full max-w-[640px] flex flex-col bg-gray-800/80 p-3 border border-t-0 border-gray-700 shadow-xl">
                            <div className="flex items-center gap-1 mb-2 h-6 pl-13">
                                {myCaptured.map((piece, i) => (
                                    <img key={i} src={`/${youAre === 'w' ? piece : `${piece.toUpperCase()}_copy`}.png`} className="w-5 h-5 opacity-80" alt={piece} />
                                ))}
                                {myAdvantage > 0 && <span className="text-gray-400 text-sm font-bold ml-1">+{myAdvantage}</span>}
                            </div>
                            <div className="flex justify-between items-center w-full">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-chess-board rounded shadow flex items-center justify-center font-bold text-white shadow-inner">YOU</div>
                                    <span className="font-bold text-white">You ({youAre === 'w' ? 'White' : 'Black'})</span>
                                </div>
                                <div className={`bg-gray-900 border px-4 py-1 flex items-center justify-center rounded text-xl font-mono font-bold ${myTime < 60000 ? 'text-red-400 border-red-900' : 'text-white border-gray-700'}`}>
                                    {formatTime(myTime)}
                                </div>
                            </div>
                        </div>
                    ) : null}

                </div>

                {/* Right Side: Info Panel */}
                <div className="col-span-1 md:col-span-4 flex flex-col gap-4">
                    <div className="bg-chess-panel border border-gray-700/50 rounded-2xl p-6 shadow-xl w-full max-h-[85vh] flex flex-col">
                        
                        {/* Status Header */}
                        {gameOver ? (
                           <div className="text-center p-4 bg-yellow-900/30 rounded-xl border border-yellow-700/50 mb-4 shrink-0">
                             <h2 className="text-2xl font-black text-yellow-400 mb-1">
                                 {reason === "timeout" ? "Timeout" : reason === "resign" ? "Resignation" : "Game Over"}
                             </h2>
                             <p className="text-gray-300">Winner: <span className="font-bold text-white capitalize">{winner}</span></p>
                           </div>
                        ) : playing ? (
                            <div className="text-center p-3 mb-4 rounded-xl shrink-0 bg-gray-800/50 border border-gray-700/50">
                                <span className="text-sm text-gray-400 uppercase tracking-widest block mb-1">To Move</span>
                                <span className={`inline-block px-4 py-1 rounded font-bold text-lg shadow-inner ${turn === 'white' ? 'bg-white text-black' : 'bg-gray-900 text-white border border-gray-700'}`}>{turn}</span>
                            </div>
                        ) : null}

                        {/* Setup Controls */}
                        {(!playing && !gameOver) && (
                            <div className="space-y-4 mb-4">
                                <div className="flex bg-gray-800 rounded-lg p-1">
                                    <button 
                                        className={`flex-1 py-2 text-sm font-bold rounded ${matchType === 'random' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                                        onClick={() => setMatchType('random')}
                                    >Random Match</button>
                                    <button 
                                        className={`flex-1 py-2 text-sm font-bold rounded ${matchType === 'friend' ? 'bg-chess-board text-white shadow shadow-green-900/50' : 'text-gray-400 hover:text-gray-200'}`}
                                        onClick={() => setMatchType('friend')}
                                    >Play Friend</button>
                                </div>
                                <select 
                                    className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded-lg outline-none font-bold text-center"
                                    value={durationStr}
                                    onChange={(e) => setDurationStr(e.target.value)}
                                >
                                    <option value="60">1 min (Bullet)</option>
                                    <option value="180">3 min (Blitz)</option>
                                    <option value="300">5 min (Blitz)</option>
                                    <option value="600">10 min (Rapid)</option>
                                </select>
                                {matchType === 'friend' && (
                                    <input 
                                        type="email" 
                                        placeholder="Friend's Email Address" 
                                        value={friendEmail}
                                        onChange={(e) => setFriendEmail(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-chess-board placeholder:text-gray-600"
                                    />
                                )}
                            </div>
                        )}

                        {waiting && (
                            <div className="text-center p-4 mb-4 text-blue-400 animate-pulse bg-blue-900/20 rounded-xl border border-blue-800/30 shrink-0">
                                {matchType === 'friend' ? `Waiting for ${friendEmail} to accept...` : 'Searching for opponent...'}
                            </div>
                        )}

                        {/* Buttons Base */}
                        <div className="grid grid-cols-1 gap-3 shrink-0">
                            {play && (
                                <Button variant="primary" onClick={() => {
                                    setWaiting(true); setPlay(false); setLeave(false); setMoves([]);
                                    if (matchType === "random") {
                                        socket.send(JSON.stringify({ type: INIT_GAME, user: decodeToken(), duration: parseInt(durationStr) }));
                                    } else {
                                        socket.send(JSON.stringify({ type: CHALLENGE_SEND, user: decodeToken(), friendEmail, duration: parseInt(durationStr) }));
                                    }
                                }}>{matchType === 'friend' ? 'Send Challenge' : 'Find Match'}</Button>
                            )}
                            {playAgain && (
                                <Button variant="primary" onClick={() => {
                                    setPlay(false); setPlayAgain(false); setTable(false); setWaiting(true); setLeave(false); setMoves([]); setGameOver(false);
                                    if (matchType === "random") {
                                        socket.send(JSON.stringify({ type: INIT_GAME, user: decodeToken(), duration: parseInt(durationStr) }));
                                    } else {
                                        socket.send(JSON.stringify({ type: CHALLENGE_SEND, user: decodeToken(), friendEmail, duration: parseInt(durationStr) }));
                                    }
                                }}>Play Again</Button>
                            )}
                            {resign && (
                                <Button variant="danger" onClick={() => {
                                    if (window.confirm("Are you sure you want to resign?")) {
                                        socket.send(JSON.stringify({ type: RESIGN, user: decodeToken() }));
                                    }
                                }}>Resign</Button>
                            )}
                            {leave && !play && (
                                <Button variant="secondary" onClick={() => { localStorage.removeItem("chessGameState"); navigate("/"); }}>Leave Queue</Button>
                            )}
                            {(waiting || gameOver) && (
                                <Button variant="ghost" className="border border-gray-700 text-gray-400 hover:bg-gray-800" onClick={() => {
                                    if(waiting) socket.send(JSON.stringify({ type: RESIGN, user: decodeToken() }));
                                    localStorage.removeItem("chessGameState"); navigate("/");
                                }}>Back to Menu</Button>
                            )}
                        </div>
                        
                        {/* Move History & Chat Component Layout */}
                        <div className="mt-4 pt-4 border-t border-gray-700/50 flex-1 min-h-0 hidden md:flex flex-col">
                            {/* Tabs Navbar */}
                            <div className="flex border-b border-gray-700/50 shrink-0 mb-3">
                                <button 
                                    className={`flex-1 py-2 text-xs uppercase font-bold tracking-wider transition ${activeTab === "moves" ? "text-chess-board border-b-2 border-chess-board" : "text-gray-500 hover:text-gray-300"}`}
                                    onClick={() => setActiveTab("moves")}
                                >Move Tracker</button>
                                <button 
                                    className={`flex-1 py-2 text-xs uppercase font-bold tracking-wider transition ${activeTab === "chat" ? "text-chess-board border-b-2 border-chess-board" : "text-gray-500 hover:text-gray-300"}`}
                                    onClick={() => setActiveTab("chat")}
                                >Live Chat</button>
                            </div>
                            
                            {activeTab === "moves" ? (
                                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col">
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
                            ) : (
                                <div className="flex-1 min-h-[300px]">
                                    <MatchChat 
                                        messages={chatMessages} 
                                        socket={socket} 
                                        onSendLocal={(text: string) => {
                                            setChatMessages(prev => [...prev, {
                                                id: Date.now().toString(),
                                                sender: "You",
                                                text,
                                                isSelf: true
                                            }]);
                                        }} 
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
