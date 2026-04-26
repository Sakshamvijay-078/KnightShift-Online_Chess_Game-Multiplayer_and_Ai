import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { decodeToken } from '../screens/GetUserName';

const WS_URL = "ws://localhost:8080";

export interface Challenge {
    challengerEmail: string;
    challengerName: string;
    duration: number;
}

interface SocketContextType {
    socket: WebSocket | null;
    challenges: Challenge[];
    acceptChallenge: (c: Challenge) => void;
    declineChallenge: (c: Challenge) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        const ws = new WebSocket(WS_URL);
        
        ws.onopen = () => {
            console.log('Global socket connected');
            ws.send(JSON.stringify({ type: "refresh", user: decodeToken() }));
            setSocket(ws);
        };

        const handleMessage = (event: MessageEvent) => {
            const message = JSON.parse(event.data);
            
            if (message.type === "challenge_receive") {
                setChallenges(prev => [
                    ...prev.filter(c => c.challengerEmail !== message.challengerEmail), // remove duplicate if spamming
                    {
                        challengerEmail: message.challengerEmail,
                        challengerName: message.challengerName,
                        duration: message.duration
                    }
                ]);
            }
            
            if (message.type === "init_game" && window.location.pathname !== "/game") {
                navigate("/game");
                setChallenges([]); 
            }
        };
        
        ws.addEventListener("message", handleMessage);

        ws.onclose = () => {
            console.log('Global socket disconnected');
            setSocket(null);
        };

        return () => {
            ws.removeEventListener("message", handleMessage);
            ws.close();
        }
    }, [navigate]);

    const acceptChallenge = (c: Challenge) => {
        if (!socket) return;
        socket.send(JSON.stringify({
            type: "challenge_accept",
            user: decodeToken(),
            challengerEmail: c.challengerEmail,
            duration: c.duration
        }));
        setChallenges(prev => prev.filter(ch => ch !== c));
        navigate("/game");
    };

    const declineChallenge = (c: Challenge) => {
        if (!socket) return;
        socket.send(JSON.stringify({
            type: "challenge_decline",
            user: decodeToken(),
            challengerEmail: c.challengerEmail
        }));
        setChallenges(prev => prev.filter(ch => ch !== c));
    };

    return (
        <SocketContext.Provider value={{ socket, challenges, acceptChallenge, declineChallenge }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useGlobalSocket = () => {
    const context = useContext(SocketContext);
    if (!context) throw new Error("useGlobalSocket must be used within a SocketProvider");
    return context.socket;
};

export const useChallenges = () => {
    const context = useContext(SocketContext);
    if (!context) throw new Error("useChallenges must be used within a SocketProvider");
    return { 
        challenges: context.challenges, 
        acceptChallenge: context.acceptChallenge, 
        declineChallenge: context.declineChallenge 
    };
};
