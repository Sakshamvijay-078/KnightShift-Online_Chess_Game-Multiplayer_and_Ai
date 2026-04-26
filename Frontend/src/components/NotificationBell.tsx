import { useState } from 'react';
import { useChallenges } from '../context/SocketContext';

export const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { challenges, acceptChallenge, declineChallenge } = useChallenges();
    
    // Total count of unopened alerts
    const count = challenges.length;

    return (
        <div className="fixed top-6 right-8 z-[100]">
            <div className="relative">
                <button 
                    onClick={() => setIsOpen(!isOpen)} 
                    className="p-3 bg-gray-900 border border-gray-700 rounded-full hover:bg-gray-800 transition shadow-lg relative"
                >
                    <svg xmlns="http://www.w3.org/Form/2000/svg" className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {count > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full animate-bounce">
                            {count}
                        </div>
                    )}
                </button>

                {isOpen && (
                    <div className="absolute right-0 mt-3 w-80 bg-gray-900 border border-chess-board text-white rounded-xl shadow-[0_0_40px_rgba(115,149,82,0.15)] overflow-hidden">
                        <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 pb-2 font-bold flex justify-between items-center text-sm">
                            Notifications
                            <span className="bg-gray-700 px-2 rounded-full text-xs py-0.5">{count} New</span>
                        </div>
                        
                        <div className="max-h-[70vh] overflow-y-auto">
                            {count === 0 ? (
                                <div className="p-6 text-center text-gray-500 text-sm">
                                    No new notifications.
                                </div>
                            ) : (
                                challenges.map((challenge, idx) => (
                                    <div key={idx} className="p-4 border-b border-gray-800 hover:bg-gray-800/50 transition">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 bg-chess-board rounded-full flex items-center justify-center font-bold text-lg capitalize shrink-0 text-white border border-gray-700">
                                                {challenge.challengerName[0]}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm leading-tight">{challenge.challengerName}</h4>
                                                <p className="text-xs text-gray-400">has challenged you to a game!</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <button 
                                                onClick={() => { declineChallenge(challenge); setIsOpen(false); }} 
                                                className="flex-1 py-1.5 bg-gray-700 hover:bg-gray-600 text-xs text-white font-bold rounded transition"
                                            >Decline</button>
                                            <button 
                                                onClick={() => { acceptChallenge(challenge); setIsOpen(false); }} 
                                                className="flex-1 py-1.5 bg-chess-board hover:bg-[#81A55D] text-xs text-white font-bold rounded transition shadow-lg"
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
