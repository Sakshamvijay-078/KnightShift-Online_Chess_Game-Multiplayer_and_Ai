import { useState, useRef, useEffect } from "react";
import { decodeToken } from "../screens/GetUserName";

export interface ChatMessage {
    id: string;
    sender: string;
    text: string;
    isSelf: boolean;
}

export const MatchChat = ({
    messages,
    socket,
    onSendLocal
}: {
    messages: ChatMessage[];
    socket: WebSocket | null;
    onSendLocal: (text: string) => void;
}) => {
    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        const text = inputValue.trim();
        if (!text || !socket) return;

        socket.send(JSON.stringify({
            type: "send_chat",
            user: decodeToken(),
            chatMessage: text
        }));

        onSendLocal(text);
        setInputValue("");
    };
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") handleSend();
    };

    return (
        <div className="flex flex-col h-full glass-panel rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.4)] border border-white/10 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-chess-accent/10 rounded-full blur-[40px] pointer-events-none"></div>
            
            <div className="bg-black/20 backdrop-blur-md border-b border-white/10 p-4 font-bold flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                    <span className="text-xl">💬</span>
                    <span className="text-white tracking-wide">Live Match Chat</span>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-chess-accent px-2 py-1 bg-chess-accent/10 rounded-full border border-chess-accent/20">Ephemeral</div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[200px] md:max-h-[300px] custom-scrollbar relative z-10 bg-black/10">
                {messages.length === 0 && (
                    <div className="text-center text-chess-muted text-sm mt-12 flex flex-col items-center gap-2 opacity-50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        No messages yet. Say hello!
                    </div>
                )}
                {messages.map(m => (
                    <div key={m.id} className={`flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300 ${m.isSelf ? 'items-end' : 'items-start'}`}>
                        {!m.isSelf && <span className="text-[10px] text-chess-muted mb-1 ml-1 font-bold tracking-wider">{m.sender}</span>}
                        <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm shadow-md backdrop-blur-md ${m.isSelf ? 'bg-gradient-to-r from-chess-accent to-chess-accentHover text-white rounded-br-sm border border-white/20' : 'bg-white/10 text-gray-200 rounded-bl-sm border border-white/5'}`}>
                            {m.text}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-3 bg-black/30 backdrop-blur-md border-t border-white/10 flex gap-2 relative z-10">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="flex-1 bg-black/20 border border-white/10 text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-chess-accent focus:bg-white/5 transition-all shadow-inner placeholder:text-gray-600"
                    maxLength={150}
                />
                <button
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                    className="bg-chess-accent hover:bg-chess-accentHover disabled:opacity-50 disabled:hover:bg-chess-accent text-white px-5 py-2 rounded-xl font-bold text-sm transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:shadow-none hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] transform hover:-translate-y-0.5 disabled:transform-none"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform rotate-90" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                </button>
            </div>
        </div>
    );
};
