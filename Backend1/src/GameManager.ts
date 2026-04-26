import { WebSocket } from "ws";
import { 
    GAME_OVER, INIT_GAME, INIT_FRIEND_GAME, INVALID, 
    MOVE, REFRESH, RESIGN, CHALLENGE_SEND, CHALLENGE_RECEIVE, 
    CHALLENGE_ACCEPT, CHALLENGE_DECLINE, SEND_CHAT 
} from "./messages";
import { Game } from "./Game";
import { AiGame } from "./AiGame";

export const AiRESIGN = "ai_resign";
export const AiINIT_GAME = "ai_init_game";
export const AiGAME_OVER = "ai_game_over";
export const AiREMOVE_USER = "ai_remove_user";
export const AiREFRESH = "ai_refresh";
export const AiMOVE = "ai_move";

interface PendingPlayer {
    socket: WebSocket;
    userId: string;
    duration: number;
}

interface ActiveUser {
    socket: WebSocket;
    userId: string;
    email: string;
    name: string;
}

export class GameManager {
    private games: Game[];
    private aigames: AiGame[];
    private pendingUser: PendingPlayer | null;
    
    // Globally maps email -> ActiveUser so we can push push notifications anywhere
    public onlineUsers: Map<string, ActiveUser>;

    constructor() {
        this.games = [];
        this.aigames = [];
        this.pendingUser = null;
        this.onlineUsers = new Map();
    }

    addUser(socket: WebSocket) {
        this.addHandler(socket);
        
        socket.on('close', () => {
            // Find and remove from onlineUsers on disconnect
            for (const [email, user] of this.onlineUsers.entries()) {
                if (user.socket === socket) {
                    this.onlineUsers.delete(email);
                    break;
                }
            }
        });
    }

    private addHandler(socket: WebSocket) {
        socket.on("message", (data) => {
            const message = JSON.parse(data.toString());
            
            // Register socket globally on any REFRESH or INIT ONLY if email exists securely
            if (message.user && message.user.email) {
                console.log("Registered user:", message.user.email); this.onlineUsers.set(message.user.email, {
                    socket,
                    userId: message.user._id,
                    email: message.user.email,
                    name: message.user.firstName || message.user.email.split('@')[0]
                });
            }

            if (message.type === CHALLENGE_SEND) {
                const targetEmail = message.friendEmail;
                const duration = message.duration || 600;
                
                let senderName = "Anonymous";
                if (message.user && message.user.firstName) {
                    senderName = message.user.firstName;
                } else if (message.user && message.user.email) {
                    senderName = message.user.email.split('@')[0];
                }

                const targetUser = this.onlineUsers.get(targetEmail);
                console.log("Target user found:", !!targetUser, targetEmail); if (targetUser) {
                    targetUser.socket.send(JSON.stringify({
                        type: CHALLENGE_RECEIVE,
                        challengerEmail: message.user?.email || "unknown",
                        challengerName: senderName,
                        duration
                    }));
                    socket.send(JSON.stringify({type: INVALID, message: `Challenge sent to ${targetEmail}!`})); 
                } else {
                    socket.send(JSON.stringify({ type: INVALID, message: "User is currently offline or email is incorrect." }));
                }
            }

            if (message.type === CHALLENGE_ACCEPT) {
                const challengerEmail = message.challengerEmail;
                const duration = message.duration || 600;
                
                const challenger = this.onlineUsers.get(challengerEmail);
                if (challenger) {
                    // Match found! They accepted.
                    const game = new Game(challenger.socket, socket, challenger.userId, message.user._id, duration);
                    this.games.push(game);
                } else {
                    socket.send(JSON.stringify({ type: INVALID, message: "Challenger went offline." }));
                }
            }
            
            if (message.type === CHALLENGE_DECLINE) {
                const challengerEmail = message.challengerEmail;
                const challenger = this.onlineUsers.get(challengerEmail);
                if (challenger) {
                    challenger.socket.send(JSON.stringify({ type: INVALID, message: `${message.user.firstName || message.user.email} declined your challenge.` }));
                }
            }

            if(message.type === AiINIT_GAME){
                this.aigames = this.aigames.filter(g => g.player1User !== message.user._id);
                const game = new AiGame(socket, message.user._id, message.level, message.color);
                this.aigames.push(game);
            }

            if (message.type === INIT_GAME) {
                const duration = message.duration || 600;
                if (this.pendingUser) {
                    if (this.pendingUser.userId !== message.user._id) {
                        const game = new Game(this.pendingUser.socket, socket, this.pendingUser.userId, message.user._id, duration);
                        this.games.push(game);
                        this.pendingUser = null;
                    } else {
                        this.pendingUser = { socket, userId: message.user._id, duration };
                    }
                } else {
                    this.pendingUser = { socket, userId: message.user._id, duration };
                }
            }

            if(message.type === AiMOVE){
                const game = this.aigames.find( game => (game.player1User === message.user._id));
                if(game){
                    const promotion = message.promotion || "null";
                    game.makeMove(socket, message.move, message.user._id, promotion);
                } else {
                    // silently ignore or respond
                }
            }

            if (message.type === MOVE) {
                const game = this.games.find(game => ((game.player1User === message.user._id) || (game.player2User === message.user._id)));
                if (game) {
                    const promotion = message.promotion || "null";
                    game.makeMove(socket, message.move, message.user._id, promotion);
                }
            }

            if (message.type === SEND_CHAT) {
                const game = this.games.find(game => ((game.player1User === message.user._id) || (game.player2User === message.user._id)));
                if (game) {
                    const senderName = message.user.firstName || "Player";
                    game.handleChat(socket, message.chatMessage, senderName);
                }
            }

            if(message.type === AiREFRESH){
                const game = this.aigames.find(game => game.player1User === message.user._id);
                if (game) game.changeSocket(socket, message.user._id);
            }

            if (message.type === REFRESH) {
                const game = this.games.find(game => ((game.player1User === message.user._id) || (game.player2User === message.user._id)));
                if (game) {
                    game.changeSocket(socket, message.user._id);
                } else {
                    if (this.pendingUser?.userId === message.user._id) {
                        this.pendingUser.socket = socket;
                    }
                }
            }

            if (message.type === AiGAME_OVER) {
                const game = this.aigames.find(game => game.player1User === message.user._id);
                this.aigames = this.aigames.filter(g => g !== game);
            }

            if (message.type === GAME_OVER) {
                const game = this.games.find(game => ((game.player1User === message.user._id) || (game.player2User === message.user._id)));
                this.games = this.games.filter(g => g !== game);
            }

            if (message.type === AiRESIGN) {
                const game = this.aigames.find(game => game.player1User === message.user._id);
                if (game) {
                    game.resign(message.user._id);
                    this.aigames = this.aigames.filter(g => g !== game);
                } else {
                    socket.send(JSON.stringify({ type:AiGAME_OVER, winner: "null" }));
                }
            }

            if (message.type === RESIGN) {
                const game = this.games.find(game => ((game.player1User === message.user._id) || (game.player2User === message.user._id)));
                if (game) {
                    game.resign(message.user._id);
                    this.games = this.games.filter(g => g !== game);
                } else {
                    socket.send(JSON.stringify({ type:GAME_OVER, winner: "null" }));
                    if (this.pendingUser?.userId === message.user._id) {
                        this.pendingUser = null;
                    }
                }
            }
        });
    }
}