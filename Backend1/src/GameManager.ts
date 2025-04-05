import { WebSocket } from "ws";
import { GAME_OVER, INIT_GAME, INVALID, MOVE, REFRESH, RESIGN } from "./messages";
import { Game } from "./Game";
import { AiGame } from "./AiGame";
export const AiRESIGN = "ai_resign";
export const AiINIT_GAME = "ai_init_game";
export const AiGAME_OVER = "ai_game_over";
export const AiREMOVE_USER = "ai_remove_user";
export const AiREFRESH = "ai_refresh";
export const AiMOVE = "ai_move";

export class GameManager {
    private games: Game[];
    private aigames: AiGame[];
    private pendingUser: WebSocket | null;
    private pendingUserId: string | null;

    constructor() {
        this.games = [];
        this.aigames = [];
        this.pendingUserId = null;
        this.pendingUser = null;
    }

    addUser(socket: WebSocket) {
        this.addHandler(socket);
    }

    private addHandler(socket: WebSocket) {
        socket.on("message", (data) => {
            const message = JSON.parse(data.toString());
            if(message.type === AiINIT_GAME){
                // console.log(message.user._id);
                const game = new AiGame(socket,message.user._id,message.level,message.color);
                // console.log(":sdjflas;dkjf");
                this.aigames.push(game);
            }
            if (message.type === INIT_GAME) {
                if (this.pendingUserId && this.pendingUser) {
                    const game = new Game(this.pendingUser, socket, this.pendingUserId, message.user._id);
                    this.games.push(game);
                    this.pendingUserId = null;
                    this.pendingUser = null;
                }
                else {
                    
                    this.pendingUser = socket;
                    this.pendingUserId = message.user._id;
                }
            }
            if(message.type === AiMOVE){
                // console.log(this.aigames);
                const game = this.aigames.find( game => (game.player1User === message.user._id));
                // console.log(game);
                if(game){
                    const promotion = message.promotion || "null";
                    game.makeMove(socket, message.move, message.user._id,promotion);
                }
                else{
                    console.log("your Game is not Startedddd");
                    socket.send(JSON.stringify({
                        type: INVALID,
                        message: "wrong type",
                    }))
                }
            }
            if (message.type === MOVE) {
                const game = this.games.find(game => ((game.player1User === message.user._id) || (game.player2User === message.user._id)));
                if (game) {
                    const promotion = message.promotion || "null";
                    // console.log("promotion");
                    game.makeMove(socket, message.move, message.user._id,promotion);
                }
                else{
                    console.log("your Game is not Started");
                    socket.send(JSON.stringify({
                        type: INVALID,
                        message: "wrong type",
                    }))
                }
            }
            if(message.type === AiREFRESH){
                const game = this.aigames.find(game => game.player1User === message.user._id);
                if (game) {
                    game.changeSocket(socket, message.user._id);
                }
                else {
                    if (this.pendingUserId === message.user._id) {
                        this.pendingUser = socket;
                        // console.log("hello")
                    }
                }
            }
            if (message.type === REFRESH) {
                const game = this.games.find(game => ((game.player1User === message.user._id) || (game.player2User === message.user._id)));
                if (game) {
                    game.changeSocket(socket, message.user._id);
                }
                else {
                    if (this.pendingUserId === message.user._id) {
                        this.pendingUser = socket;
                        // console.log("hello")
                    }   
                }
            }
            if (message.type === AiGAME_OVER) {
                // console.log("hello342");
                const game = this.aigames.find(game => game.player1User === message.user._id);
                // console.log(this.games.length);
                this.aigames = this.aigames.filter(g => g !== game);
                // console.log(this.games.length)
            }
            if (message.type === GAME_OVER) {
                // console.log("hello342");
                const game = this.games.find(game => ((game.player1User === message.user._id) || (game.player2User === message.user._id)));
                // console.log(this.games.length);
                this.games = this.games.filter(g => g !== game);
                // console.log(this.games.length)
            }
            if (message.type === AiRESIGN) {
                const game = this.aigames.find(game => game.player1User === message.user._id);
                if (game) {
                    game.resign( message.user._id);
                    console.log(this.aigames.length);
                    this.aigames = this.aigames.filter(g => g !== game);
                    console.log(this.aigames.length);
                }
                else{
                    socket.send(JSON.stringify({
                        type:AiGAME_OVER,
                        winner: "null",
                        
                    }))
                }
            }
            if (message.type === RESIGN) {
                const game = this.games.find(game => ((game.player1User === message.user._id) || (game.player2User === message.user._id)));
                if (game) {
                    game.resign( message.user._id);
                    console.log(this.games.length);
                    this.games = this.games.filter(g => g !== game);
                    console.log(this.games.length);
                }
                else{
                    socket.send(JSON.stringify({
                        type:GAME_OVER,
                        winner: "null",
                        
                    }))
                    // console.log("hello3")
                    this.pendingUser = null;
                    this.pendingUserId = null;
                }
            }
        })
    }
}