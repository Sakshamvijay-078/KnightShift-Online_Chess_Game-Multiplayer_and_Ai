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
        <div className="flex flex-col h-full bg-gray-900 border border-gray-700 rounded-xl overflow-hidden mt-6">
            <div className="bg-gray-800 border-b border-gray-700 p-3 font-bold text-gray-300 flex items-center justify-between">
                <div>💬 Live Match Chat</div>
                <div className="text-xs font-normal text-gray-500">Messages will not be saved</div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[200px] md:max-h-[300px]">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 text-sm mt-10">
                        No messages yet. Say hello!
                    </div>
                )}
                {messages.map(m => (
                    <div key={m.id} className={`flex flex-col ${m.isSelf ? 'items-end' : 'items-start'}`}>
                        {!m.isSelf && <span className="text-[10px] text-gray-500 mb-1 ml-1">{m.sender}</span>}
                        <div className={`px-3 py-2 rounded-xl max-w-[85%] text-sm ${m.isSelf ? 'bg-chess-board text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                            {m.text}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-3 bg-gray-800 border-t border-gray-700 flex gap-2">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-900 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-chess-board transition"
                    maxLength={150}
                />
                <button
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                    className="bg-chess-board hover:bg-[#81A55D] disabled:opacity-50 text-white px-4 py-2 rounded font-bold text-sm transition"
                >
                    Send
                </button>
            </div>
        </div>
    );
};
