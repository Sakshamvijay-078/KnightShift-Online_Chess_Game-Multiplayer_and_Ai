import { useEffect, useState } from "react"
import { decodeToken } from "../screens/GetUserName";
const REFRESH = "refresh";
// import { decodeToken } from "../screens/GetUserName";

const WS_URL = "ws://localhost:8080"

export const useSocket = ()=>{
    const [socket , setSocket] = useState<WebSocket| null>(null);
    useEffect(()=>{
        const ws = new WebSocket(WS_URL);
        ws.onopen = () =>{
            console.log('connected');
            setSocket(ws);
        }
        ws.onclose = () =>{
            console.log('disconnected');
            setSocket(null);
        }
        return ()=>{
            console.log("web socket is close")
            ws.close();
        }
    },[])
    socket?.send(JSON.stringify({
        type:REFRESH,
        user: decodeToken(),
    }))
    return socket;
}