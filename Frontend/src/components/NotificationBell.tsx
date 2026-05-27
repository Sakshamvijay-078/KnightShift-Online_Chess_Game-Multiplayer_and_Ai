import { useState } from 'react';
import { useChallenges } from '../context/SocketContext';

export const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { challenges, acceptChallenge, declineChallenge } = useChallenges();
    
    // Total count of unopened alerts
    const count = challenges.length;

    return (
        <div className="fixed top-6 right-6 md:right-8 z-[100]">
            <div className="relative">
                <button 
                    onClick={() => setIsOpen(!isOpen)} 
                    className="p-3 glass-button rounded-full transition-all shadow-[0_0_20px_rgba(0,0,0,0.3)] relative border border-white/10 hover:border-white/30 backdrop-blur-xl group bg-white/5 hover:bg-white/10"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {count > 0 && (
                        <div className="absolute -top-1 -right-1 bg-chess-accent text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)] border border-white/20 animate-pulse">
                            {count}
                        </div>
                    )}
                </button>

                {isOpen && (
                    <div className="absolute right-0 mt-4 w-80 glass-panel rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10 animate-in fade-in slide-in-from-top-4 duration-300 origin-top-right">
                        <div className="bg-black/20 backdrop-blur-md border-b border-white/10 px-5 py-4 font-bold flex justify-between items-center text-sm">
                            <span className="text-white tracking-wide uppercase text-xs">Notifications</span>
                            <span className="bg-chess-accent/20 text-chess-accent px-3 rounded-full text-xs py-1 border border-chess-accent/30">{count} New</span>
                        </div>
                        
                        <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                            {count === 0 ? (
                                <div className="p-8 text-center text-chess-muted text-sm flex flex-col items-center gap-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                    All caught up!
                                </div>
                            ) : (
                                challenges.map((challenge, idx) => (
                                    <div key={idx} className="p-5 border-b border-white/5 hover:bg-white/5 transition-colors relative overflow-hidden group">
                                        <div className="absolute left-0 top-0 w-1 h-full bg-chess-accent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center font-bold text-xl capitalize shrink-0 text-white border border-white/10 shadow-inner">
                                                {challenge.challengerName[0]}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white text-sm leading-tight group-hover:text-chess-accent transition-colors">{challenge.challengerName}</h4>
                                                <p className="text-xs text-chess-muted mt-0.5">Challenges you to a match!</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 mt-4">
                                            <button 
                                                onClick={() => { declineChallenge(challenge); setIsOpen(false); }} 
                                                className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 hover:text-white font-bold rounded-lg transition-all"
                                            >Decline</button>
                                            <button 
                                                onClick={() => { acceptChallenge(challenge); setIsOpen(false); }} 
                                                className="flex-[2] py-2 bg-gradient-to-r from-chess-accent to-chess-accentHover text-xs text-white font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:shadow-[0_0_20px_rgba(99,102,241,0.6)] hover:-translate-y-0.5"
                                            >Accept ({Math.floor(challenge.duration / 60)}m)</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
