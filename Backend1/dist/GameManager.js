"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameManager = exports.AiMOVE = exports.AiREFRESH = exports.AiREMOVE_USER = exports.AiGAME_OVER = exports.AiINIT_GAME = exports.AiRESIGN = void 0;
const messages_1 = require("./messages");
const Game_1 = require("./Game");
const AiGame_1 = require("./AiGame");
exports.AiRESIGN = "ai_resign";
exports.AiINIT_GAME = "ai_init_game";
exports.AiGAME_OVER = "ai_game_over";
exports.AiREMOVE_USER = "ai_remove_user";
exports.AiREFRESH = "ai_refresh";
exports.AiMOVE = "ai_move";
class GameManager {
    constructor() {
        this.games = [];
        this.aigames = [];
        this.pendingUserId = null;
        this.pendingUser = null;
    }
    addUser(socket) {
        this.addHandler(socket);
    }
    addHandler(socket) {
        socket.on("message", (data) => {
            const message = JSON.parse(data.toString());
            if (message.type === exports.AiINIT_GAME) {
                // console.log(message.user._id);
                const game = new AiGame_1.AiGame(socket, message.user._id, message.level, message.color);
                // console.log(":sdjflas;dkjf");
                this.aigames.push(game);
            }
            if (message.type === messages_1.INIT_GAME) {
                if (this.pendingUserId && this.pendingUser) {
                    const game = new Game_1.Game(this.pendingUser, socket, this.pendingUserId, message.user._id);
                    this.games.push(game);
                    this.pendingUserId = null;
                    this.pendingUser = null;
                }
                else {
                    this.pendingUser = socket;
                    this.pendingUserId = message.user._id;
                }
            }
            if (message.type === exports.AiMOVE) {
                // console.log(this.aigames);
                const game = this.aigames.find(game => (game.player1User === message.user._id));
                // console.log(game);
                if (game) {
                    const promotion = message.promotion || "null";
                    game.makeMove(socket, message.move, message.user._id, promotion);
                }
                else {
                    console.log("your Game is not Startedddd");
                    socket.send(JSON.stringify({
                        type: messages_1.INVALID,
                        message: "wrong type",
                    }));
                }
            }
            if (message.type === messages_1.MOVE) {
                const game = this.games.find(game => ((game.player1User === message.user._id) || (game.player2User === message.user._id)));
                if (game) {
                    const promotion = message.promotion || "null";
                    // console.log("promotion");
                    game.makeMove(socket, message.move, message.user._id, promotion);
                }
                else {
                    console.log("your Game is not Started");
                    socket.send(JSON.stringify({
                        type: messages_1.INVALID,
                        message: "wrong type",
                    }));
                }
            }
            if (message.type === exports.AiREFRESH) {
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
            if (message.type === messages_1.REFRESH) {
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
            if (message.type === exports.AiGAME_OVER) {
                // console.log("hello342");
                const game = this.aigames.find(game => game.player1User === message.user._id);
                // console.log(this.games.length);
                this.aigames = this.aigames.filter(g => g !== game);
                // console.log(this.games.length)
            }
            if (message.type === messages_1.GAME_OVER) {
                // console.log("hello342");
                const game = this.games.find(game => ((game.player1User === message.user._id) || (game.player2User === message.user._id)));
                // console.log(this.games.length);
                this.games = this.games.filter(g => g !== game);
                // console.log(this.games.length)
            }
            if (message.type === exports.AiRESIGN) {
                const game = this.aigames.find(game => game.player1User === message.user._id);
                if (game) {
                    game.resign(message.user._id);
                    console.log(this.aigames.length);
                    this.aigames = this.aigames.filter(g => g !== game);
                    console.log(this.aigames.length);
                }
                else {
                    socket.send(JSON.stringify({
                        type: exports.AiGAME_OVER,
                        winner: "null",
                    }));
                }
            }
            if (message.type === messages_1.RESIGN) {
                const game = this.games.find(game => ((game.player1User === message.user._id) || (game.player2User === message.user._id)));
                if (game) {
                    game.resign(message.user._id);
                    console.log(this.games.length);
                    this.games = this.games.filter(g => g !== game);
                    console.log(this.games.length);
                }
                else {
                    socket.send(JSON.stringify({
                        type: messages_1.GAME_OVER,
                        winner: "null",
                    }));
                    // console.log("hello3")
                    this.pendingUser = null;
                    this.pendingUserId = null;
                }
            }
        });
    }
}
exports.GameManager = GameManager;
