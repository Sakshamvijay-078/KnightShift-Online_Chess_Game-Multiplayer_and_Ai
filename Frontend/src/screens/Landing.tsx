import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { NotificationBell } from "../components/NotificationBell";
import { useState, useEffect } from "react";
import axios from "axios";
import { decodeToken } from "./GetUserName";

interface UserProfile {
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
}

export const Landing = () => {
    const navigate = useNavigate();
    const { token, logout } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/users/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProfile(response.data.data);
            } catch (err) {
                // Silently fail - show fallback UI
            }
        };
        if (token) fetchProfile();
    }, [token]);

    const decoded = decodeToken();
    const userName = profile?.firstName || (decoded as any)?.firstName || "Player";

    return (
        <div className="min-h-screen w-full relative overflow-hidden flex flex-col items-center justify-center pt-20 pb-10 px-4 md:px-8">
            <NotificationBell />
            
            {/* Background glowing effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-chess-accent/20 rounded-full blur-[120px] animate-pulse-slow"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-chess-board/20 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>

            <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 z-10">
                
                {/* Left Column - Hero */}
                <div className="lg:col-span-7 flex flex-col justify-center space-y-8 animate-fade-in">
                    <div className="space-y-4">
                        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white leading-tight">
                            Welcome back, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-chess-accent to-chess-board">{userName}</span>
                        </h1>
                        <p className="text-chess-muted text-xl leading-relaxed max-w-2xl font-light">
                            Ready for your next match? Play against real opponents or sharpen your skills against Stockfish.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
                        <button 
                            onClick={() => navigate("/game")}
                            className="flex-1 group relative flex items-center justify-center gap-3 bg-gradient-to-r from-chess-accent to-chess-accentHover text-white py-5 px-8 rounded-2xl font-bold text-xl transition-all shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] hover:-translate-y-1 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            Play Online
                        </button>

                        <button 
                            onClick={() => navigate("/computer")}
                            className="flex-1 group relative flex items-center justify-center gap-3 glass-button text-white py-5 px-8 rounded-2xl font-bold text-xl hover:-translate-y-1"
                        >
                            <svg className="w-8 h-8 text-chess-board" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                            Vs Computer
                        </button>
                    </div>

                    {/* Quick info */}
                    <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/10 max-w-2xl">
                        <div>
                            <div className="text-2xl font-bold text-white mb-1">Real-time</div>
                            <div className="text-sm text-chess-muted uppercase tracking-wider">Multiplayer</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white mb-1">Stockfish</div>
                            <div className="text-sm text-chess-muted uppercase tracking-wider">AI Engine</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white mb-1">Timed</div>
                            <div className="text-sm text-chess-muted uppercase tracking-wider">1-10 min</div>
                        </div>
                    </div>
                </div>
                
                {/* Right Column - Dashboard Cards */}
                <div className="lg:col-span-5 flex flex-col gap-6 animate-slide-up">
                    
                    {/* Profile Summary Card */}
                    <div className="glass-panel rounded-3xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-chess-accent/10 rounded-full blur-[50px] group-hover:bg-chess-accent/20 transition-colors"></div>
                        <div className="flex items-center justify-between mb-6 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-chess-accent to-chess-board p-0.5">
                                    <div className="w-full h-full rounded-full bg-chess-panel flex items-center justify-center overflow-hidden">
                                        {profile?.avatar ? (
                                            <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-2xl font-black text-white uppercase">{userName[0]}</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">{profile ? `${profile.firstName} ${profile.lastName}` : userName}</h3>
                                    <p className="text-chess-muted text-sm">{profile?.email || ''}</p>
                                </div>
                            </div>
                            <button onClick={() => navigate("/profile")} className="w-10 h-10 rounded-full glass-button flex items-center justify-center text-white hover:text-chess-accent">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                            </button>
                        </div>
                    </div>

                    {/* Game Modes */}
                    <div className="glass-panel rounded-3xl p-6">
                        <h3 className="text-white font-bold uppercase tracking-wider mb-4 text-sm">Game Modes</h3>
                        <div className="space-y-3">
                            <button onClick={() => navigate("/game")} className="w-full flex items-center gap-4 p-4 bg-chess-darker/40 rounded-2xl border border-white/5 hover:border-chess-accent/30 hover:bg-chess-accent/5 transition-all group">
                                <div className="w-12 h-12 rounded-xl bg-chess-accent/20 flex items-center justify-center text-chess-accent text-xl">⚡</div>
                                <div className="text-left flex-1">
                                    <div className="text-white font-bold">Random Match</div>
                                    <div className="text-chess-muted text-xs">Play against a random online opponent</div>
                                </div>
                                <svg className="w-5 h-5 text-chess-muted group-hover:text-chess-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                            </button>
                            <button onClick={() => navigate("/game")} className="w-full flex items-center gap-4 p-4 bg-chess-darker/40 rounded-2xl border border-white/5 hover:border-chess-board/30 hover:bg-chess-board/5 transition-all group">
                                <div className="w-12 h-12 rounded-xl bg-chess-board/20 flex items-center justify-center text-chess-board text-xl">👥</div>
                                <div className="text-left flex-1">
                                    <div className="text-white font-bold">Challenge Friend</div>
                                    <div className="text-chess-muted text-xs">Send a challenge to a friend by email</div>
                                </div>
                                <svg className="w-5 h-5 text-chess-muted group-hover:text-chess-board transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                            </button>
                            <button onClick={() => navigate("/computer")} className="w-full flex items-center gap-4 p-4 bg-chess-darker/40 rounded-2xl border border-white/5 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all group">
                                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 text-xl">🤖</div>
                                <div className="text-left flex-1">
                                    <div className="text-white font-bold">Play Computer</div>
                                    <div className="text-chess-muted text-xs">Test your skills vs Stockfish AI</div>
                                </div>
                                <svg className="w-5 h-5 text-chess-muted group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                            </button>
                        </div>
                    </div>

                    <button 
                        onClick={logout}
                        className="mt-2 text-center text-chess-muted hover:text-red-400 transition-colors text-sm py-2"
                    >
                        Sign Out
                    </button>

                </div>

            </div>
        </div>
    );
};
export default Landing;