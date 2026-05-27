import { useNavigate } from "react-router-dom";
import { useGlobalSocket } from "../context/SocketContext";
import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { decodeToken } from "./GetUserName";
import { ChessBoard } from "../components/ChessBoard";
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
export const LEAVE_QUEUE = "leave_queue";

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
    
    // Mobile Chat Overlay
    const [showMobileChat, setShowMobileChat] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    
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

    // Clear unread count when chat is opened
    useEffect(() => {
        if (showMobileChat || activeTab === "chat") {
            setUnreadCount(0);
        }
    }, [showMobileChat, activeTab]);

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
                    setUnreadCount(prev => prev + 1);
                    break;

                case GAME_OVER:
                    const finalC = message.fen ? new Chess(message.fen) : new Chess();
                    setHello(finalC);
                    if (historyIndex === -1) setBoard(finalC.board());
                    
                    setTurn("null"); setLeave(true); setResign(false);
                    setPlaying(false); setGameOver(true); setWinner(message.winner);
                    setReason(message.reason); setPlayAgain(true);
                    playGameOverSound();
                    
                    // Tell server to clean up the game
                    socket.send(JSON.stringify({ type: GAME_OVER, user: decodeToken() }));
                    break;
            }
        };

        socket.addEventListener("message", handleMessage);
        return () => socket.removeEventListener("message", handleMessage);
    }, [socket, historyIndex]);

    const handleTraverse = (direction: "prev" | "next") => {
        if (!table || moves.length === 0) return;
        
        let newIndex: number;
        if (historyIndex === -1) {
            // Currently on live view
            if (direction === "prev") {
                newIndex = moves.length - 1; // show last move
            } else {
                return; // already at latest
            }
        } else {
            if (direction === "prev") {
                newIndex = Math.max(0, historyIndex - 1);
            } else {
                newIndex = historyIndex + 1;
                if (newIndex >= moves.length) {
                    // Back to live
                    setHistoryIndex(-1);
                    setBoard(hello.board());
                    return;
                }
            }
        }

        setHistoryIndex(newIndex);
        const traverseChess = new Chess();
        for (let i = 0; i <= newIndex; i++) {
            traverseChess.move(moves[i]);
        }
        setBoard(traverseChess.board());
    };

    if (!socket) return (
        <div className="min-h-screen bg-chess-darker flex flex-col items-center justify-center text-white relative overflow-hidden">
            <div className="absolute w-96 h-96 bg-chess-accent/20 rounded-full blur-[100px] animate-pulse-slow"></div>
            <div className="z-10 flex flex-col items-center">
                <svg className="animate-spin h-12 w-12 text-chess-accent mb-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <div className="text-xl font-bold tracking-widest uppercase">Connecting to Arena...</div>
            </div>
        </div>
    );

    const myTime = youAre === 'w' ? player1Time : player2Time;
    const oppTime = youAre === 'w' ? player2Time : player1Time;
    const { capturedByWhite, capturedByBlack, whiteAdvantage, blackAdvantage } = getCapturedPieces(board);

    const myCaptured = youAre === 'w' ? capturedByWhite : capturedByBlack;
    const oppCaptured = youAre === 'w' ? capturedByBlack : capturedByWhite;
    const myAdvantage = youAre === 'w' ? whiteAdvantage : blackAdvantage;
    const oppAdvantage = youAre === 'w' ? blackAdvantage : whiteAdvantage;

    return (
        <div className="flex justify-center w-full min-h-screen bg-chess-darker py-6 px-4 relative overflow-x-hidden">
            {/* Background effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-chess-accent/10 rounded-full blur-[150px] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-chess-board/10 rounded-full blur-[150px] pointer-events-none"></div>

            <NotificationBell />
            <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
                
                {/* Left Side: Chess Board */}
                <div className="col-span-1 lg:col-span-8 flex flex-col justify-center items-center lg:items-start w-full mx-auto">
                    
                    {/* Opponent Card */}
                    {playing || gameOver ? (
                        <div className="w-full max-w-[640px] flex flex-col glass-panel rounded-t-2xl p-4 mb-2 shadow-lg backdrop-blur-xl border-b-0 border-white/10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-[40px]"></div>
                            <div className="flex justify-between items-center w-full relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-chess-darker rounded-xl shadow-inner flex items-center justify-center font-bold text-gray-400 border border-white/5 text-sm">OPP</div>
                                    <div>
                                        <span className="font-bold text-white block">Opponent</span>
                                        <span className="text-xs text-chess-muted uppercase">{youAre === 'w' ? 'Black' : 'White'}</span>
                                    </div>
                                </div>
                                <div className={`glass-panel border-white/10 px-5 py-2 flex items-center justify-center rounded-xl text-2xl font-mono font-bold shadow-[0_0_15px_rgba(0,0,0,0.5)] ${oppTime < 60000 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                                    {formatTime(oppTime)}
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

                    {/* Board Surface */}
                    <div className={`w-full max-w-[min(640px,calc(100vw-2rem))] shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-lg overflow-hidden border border-white/10 ${historyIndex !== -1 ? 'opacity-90 grayscale-[0.2]' : ''}`}>
                       <ChessBoard board={board} socket={socket} playercolor={youAre} chessEngine={hello} />
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
                    {playing || gameOver ? (
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
                                    <div className="w-10 h-10 bg-gradient-to-br from-chess-accent to-chess-board rounded-xl shadow-inner flex items-center justify-center font-black text-white border border-white/20 text-sm">YOU</div>
                                    <div>
                                        <span className="font-bold text-white block">You <span className="text-chess-muted font-normal text-sm ml-1">({youAre === 'w' ? 'White' : 'Black'})</span></span>
                                        <span className="text-xs text-chess-accent uppercase font-bold">Player</span>
                                    </div>
                                </div>
                                <div className={`glass-panel border-white/10 px-5 py-2 flex items-center justify-center rounded-xl text-2xl font-mono font-bold shadow-[0_0_15px_rgba(0,0,0,0.5)] ${myTime < 60000 ? 'text-red-400 border-red-900 animate-pulse' : 'text-white'}`}>
                                    {formatTime(myTime)}
                                </div>
                            </div>
                        </div>
                    ) : null}

                </div>

                {/* Right Side: Info Panel */}
                <div className="col-span-1 lg:col-span-4 flex flex-col gap-4 max-w-[640px] mx-auto w-full">
                    <div className="glass-panel border-white/10 rounded-3xl p-4 md:p-6 shadow-2xl w-full lg:max-h-[85vh] flex flex-col relative overflow-hidden">
                        
                        {/* Status Header */}
                        {gameOver ? (
                           <div className="text-center p-5 bg-gradient-to-r from-yellow-900/40 to-yellow-800/20 rounded-2xl border border-yellow-700/50 mb-6 shrink-0 relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/20 rounded-full blur-[20px]"></div>
                             <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200 mb-2 drop-shadow-md">
                                 {reason === "timeout" ? "Timeout" : reason === "resign" ? "Resignation" : "Game Over"}
                             </h2>
                             <p className="text-gray-200 text-lg">Winner: <span className="font-black text-white capitalize">{winner}</span></p>
                           </div>
                        ) : playing ? (
                            <div className="text-center p-4 mb-6 rounded-2xl shrink-0 bg-chess-darker/50 border border-white/5 flex items-center justify-between">
                                <span className="text-sm text-chess-muted uppercase tracking-widest font-bold">To Move</span>
                                <span className={`inline-block px-5 py-2 rounded-xl font-bold text-sm shadow-inner transition-colors ${turn === 'white' ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-gray-900 text-white border border-gray-700 shadow-[0_0_15px_rgba(0,0,0,0.5)]'}`}>{turn.toUpperCase()}</span>
                            </div>
                        ) : null}

                        {/* Setup Controls */}
                        {(!playing && !gameOver) && (
                            <div className="space-y-6 mb-6">
                                <div className="text-center mb-6">
                                    <h2 className="text-2xl font-bold text-white mb-2">New Match</h2>
                                    <p className="text-chess-muted text-sm">Select a match type and time control to begin playing.</p>
                                </div>
                                <div className="flex bg-chess-darker/80 rounded-xl p-1.5 border border-white/5">
                                    <button 
                                        className={`flex-1 py-3 text-sm uppercase tracking-wider font-bold rounded-lg transition-all ${matchType === 'random' ? 'bg-chess-accent text-white shadow-lg' : 'text-chess-muted hover:text-white hover:bg-white/5'}`}
                                        onClick={() => setMatchType('random')}
                                    >Random Match</button>
                                    <button 
                                        className={`flex-1 py-3 text-sm uppercase tracking-wider font-bold rounded-lg transition-all ${matchType === 'friend' ? 'bg-chess-accent text-white shadow-lg' : 'text-chess-muted hover:text-white hover:bg-white/5'}`}
                                        onClick={() => setMatchType('friend')}
                                    >Play Friend</button>
                                </div>
                                <select 
                                    className="w-full bg-chess-darker/80 border border-white/10 text-white p-4 rounded-xl outline-none font-bold text-center appearance-none cursor-pointer focus:ring-2 focus:ring-chess-accent transition-all"
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
                                        className="w-full bg-chess-darker/80 border border-white/10 text-white px-5 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-chess-accent transition-all placeholder:text-gray-600"
                                    />
                                )}
                            </div>
                        )}

                        {waiting && (
                            <div className="text-center p-6 mb-6 text-chess-accent animate-pulse bg-chess-accent/10 rounded-2xl border border-chess-accent/30 shrink-0 font-medium">
                                {matchType === 'friend' ? `Waiting for ${friendEmail} to accept...` : 'Searching for opponent...'}
                            </div>
                        )}

                        {/* Buttons Base */}
                        <div className="grid grid-cols-1 gap-4 shrink-0 mt-auto">
                            {play && (
                                <button className="w-full bg-gradient-to-r from-chess-accent to-chess-accentHover text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transform hover:-translate-y-0.5 transition-all outline-none" onClick={() => {
                                    setWaiting(true); setPlay(false); setLeave(false); setMoves([]);
                                    if (matchType === "random") {
                                        socket.send(JSON.stringify({ type: INIT_GAME, user: decodeToken(), duration: parseInt(durationStr) }));
                                    } else {
                                        socket.send(JSON.stringify({ type: CHALLENGE_SEND, user: decodeToken(), friendEmail, duration: parseInt(durationStr) }));
                                    }
                                }}>{matchType === 'friend' ? 'Send Challenge' : 'Find Match'}</button>
                            )}
                            {playAgain && (
                                <button className="w-full bg-gradient-to-r from-chess-accent to-chess-accentHover text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transform hover:-translate-y-0.5 transition-all outline-none" onClick={() => {
                                    setPlay(false); setPlayAgain(false); setTable(false); setWaiting(true); setLeave(false); setMoves([]); setGameOver(false);
                                    if (matchType === "random") {
                                        socket.send(JSON.stringify({ type: INIT_GAME, user: decodeToken(), duration: parseInt(durationStr) }));
                                    } else {
                                        socket.send(JSON.stringify({ type: CHALLENGE_SEND, user: decodeToken(), friendEmail, duration: parseInt(durationStr) }));
                                    }
                                }}>Play Again</button>
                            )}
                            {resign && (
                                <button className="w-full bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 text-red-200 font-bold py-4 rounded-xl transition-colors" onClick={() => {
                                    if (window.confirm("Are you sure you want to resign?")) {
                                        socket.send(JSON.stringify({ type: RESIGN, user: decodeToken() }));
                                    }
                                }}>Resign Match</button>
                            )}
                            {waiting && (
                                <button className="w-full glass-button text-white font-bold py-4 rounded-xl transition-colors" onClick={() => {
                                    socket.send(JSON.stringify({ type: LEAVE_QUEUE, user: decodeToken() }));
                                    setWaiting(false); setPlay(true); setLeave(true);
                                }}>Cancel Search</button>
                            )}
                            {(waiting || gameOver || (leave && !play)) && (
                                <button className="w-full text-chess-muted hover:text-white py-3 text-sm font-medium transition-colors" onClick={() => {
                                    if(waiting) socket.send(JSON.stringify({ type: LEAVE_QUEUE, user: decodeToken() }));
                                    navigate("/");
                                }}>Back to Dashboard</button>
                            )}
                        </div>
                        
                        {/* Move History & Chat Component Layout */}
                        <div className="mt-6 pt-2 flex-1 min-h-[300px] flex flex-col">
                            {/* Tabs Navbar */}
                            <div className="flex bg-chess-darker/50 rounded-xl p-1 mb-4 shrink-0 border border-white/5">
                                <button 
                                    className={`flex-1 py-2.5 text-xs uppercase font-bold tracking-wider transition-all rounded-lg ${activeTab === "moves" ? "bg-white/10 text-white shadow-sm" : "text-chess-muted hover:text-white"}`}
                                    onClick={() => setActiveTab("moves")}
                                >Move Tracker</button>
                                <button 
                                    className={`flex-1 py-2.5 text-xs uppercase font-bold tracking-wider transition-all rounded-lg ${activeTab === "chat" ? "bg-white/10 text-white shadow-sm" : "text-chess-muted hover:text-white"}`}
                                    onClick={() => setActiveTab("chat")}
                                >Live Chat</button>
                            </div>
                            
                            {activeTab === "moves" ? (
                                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col">
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
                            ) : (
                                <div className="flex-1 min-h-[300px] bg-chess-darker/40 rounded-xl border border-white/5 p-1 relative">
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

            {/* Floating Chat Button (Mobile) */}
            {(playing || gameOver) && (
                <div className="fixed bottom-6 right-6 z-50 md:hidden">
                    <button 
                        onClick={() => setShowMobileChat(true)}
                        className="bg-chess-accent hover:bg-chess-accentHover text-white w-14 h-14 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-transform hover:scale-110 flex items-center justify-center relative"
                    >
                        <span className="text-2xl">💬</span>
                        {unreadCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg border-2 border-chess-darker">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                </div>
            )}

            {/* Mobile Chat Overlay */}
            {showMobileChat && (
                <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end justify-center md:hidden animate-in fade-in">
                    <div className="w-full h-[75vh] bg-chess-darker rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/10 flex flex-col relative animate-in slide-in-from-bottom-full duration-300">
                        <div className="flex justify-between items-center p-4 border-b border-white/10 bg-black/20 rounded-t-3xl">
                            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                💬 Live Match Chat
                            </h3>
                            <button 
                                onClick={() => setShowMobileChat(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-gray-300 hover:text-white hover:bg-white/20 transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden p-2 pb-6">
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
                    </div>
                </div>
            )}
        </div>
    );
};

