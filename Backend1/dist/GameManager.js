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
        this.pendingUser = null;
        this.onlineUsers = new Map();
    }
    // Helper: find active (non-game-over) game for a user
    findActiveGame(userId) {
        return this.games.find(game => !game.gameOver &&
            (game.player1User === userId || game.player2User === userId));
    }
    // Helper: clean up finished games from the array
    cleanupFinishedGames() {
        this.games = this.games.filter(g => !g.gameOver);
    }
    addUser(socket) {
        this.addHandler(socket);
        socket.on('close', () => {
            // If the disconnecting user was the pending user, clear them
            if (this.pendingUser && this.pendingUser.socket === socket) {
                this.pendingUser = null;
            }
            // Find and remove from onlineUsers on disconnect
            for (const [email, user] of this.onlineUsers.entries()) {
                if (user.socket === socket) {
                    this.onlineUsers.delete(email);
                    break;
                }
            }
        });
    }
    addHandler(socket) {
        socket.on("message", (data) => {
            var _a, _b, _c, _d;
            const message = JSON.parse(data.toString());
            // Register socket globally on any REFRESH or INIT ONLY if email exists securely
            if (message.user && message.user.email) {
                this.onlineUsers.set(message.user.email, {
                    socket,
                    userId: message.user._id,
                    email: message.user.email,
                    name: message.user.firstName || message.user.email.split('@')[0]
                });
            }
            if (message.type === messages_1.CHALLENGE_SEND) {
                const targetEmail = message.friendEmail;
                const duration = message.duration || 600;
                let senderName = "Anonymous";
                if (message.user && message.user.firstName) {
                    senderName = message.user.firstName;
                }
                else if (message.user && message.user.email) {
                    senderName = message.user.email.split('@')[0];
                }
                const targetUser = this.onlineUsers.get(targetEmail);
                if (targetUser) {
                    targetUser.socket.send(JSON.stringify({
                        type: messages_1.CHALLENGE_RECEIVE,
                        challengerEmail: ((_a = message.user) === null || _a === void 0 ? void 0 : _a.email) || "unknown",
                        challengerName: senderName,
                        duration
                    }));
                    socket.send(JSON.stringify({ type: messages_1.INVALID, message: `Challenge sent to ${targetEmail}!` }));
                }
                else {
                    socket.send(JSON.stringify({ type: messages_1.INVALID, message: "User is currently offline or email is incorrect." }));
                }
            }
            if (message.type === messages_1.CHALLENGE_ACCEPT) {
                const challengerEmail = message.challengerEmail;
                const duration = message.duration || 600;
                const challenger = this.onlineUsers.get(challengerEmail);
                if (challenger) {
                    // Clean up any stale finished games for both users before starting new one
                    this.cleanupFinishedGames();
                    const game = new Game_1.Game(challenger.socket, socket, challenger.userId, message.user._id, duration);
                    this.games.push(game);
                }
                else {
                    socket.send(JSON.stringify({ type: messages_1.INVALID, message: "Challenger went offline." }));
                }
            }
            if (message.type === messages_1.CHALLENGE_DECLINE) {
                const challengerEmail = message.challengerEmail;
                const challenger = this.onlineUsers.get(challengerEmail);
                if (challenger) {
                    challenger.socket.send(JSON.stringify({ type: messages_1.INVALID, message: `${message.user.firstName || message.user.email} declined your challenge.` }));
                }
            }
            if (message.type === exports.AiINIT_GAME) {
                this.aigames = this.aigames.filter(g => g.player1User !== message.user._id);
                const game = new AiGame_1.AiGame(socket, message.user._id, message.level, message.color);
                this.aigames.push(game);
            }
            if (message.type === messages_1.INIT_GAME) {
                const duration = message.duration || 600;
                // Clean up any stale finished games for this user
                this.cleanupFinishedGames();
                // Prevent matching if user is already in an active game
                const existingGame = this.findActiveGame(message.user._id);
                if (existingGame) {
                    socket.send(JSON.stringify({ type: messages_1.INVALID, message: "You are already in an active game." }));
                    return;
                }
                if (this.pendingUser) {
                    if (this.pendingUser.userId !== message.user._id) {
                        // Also check pending user isn't already in an active game
                        const pendingExistingGame = this.findActiveGame(this.pendingUser.userId);
                        if (pendingExistingGame) {
                            // Pending user is stale, replace them
                            this.pendingUser = { socket, userId: message.user._id, duration };
                            return;
                        }
                        const game = new Game_1.Game(this.pendingUser.socket, socket, this.pendingUser.userId, message.user._id, duration);
                        this.games.push(game);
                        this.pendingUser = null;
                    }
                    else {
                        // Same user re-queued; update their socket
                        this.pendingUser = { socket, userId: message.user._id, duration };
                    }
                }
                else {
                    this.pendingUser = { socket, userId: message.user._id, duration };
                }
            }
            // Dedicated leave queue handler — clean, no side effects
            if (message.type === messages_1.LEAVE_QUEUE) {
                if (((_b = this.pendingUser) === null || _b === void 0 ? void 0 : _b.userId) === message.user._id) {
                    this.pendingUser = null;
                }
            }
            if (message.type === exports.AiMOVE) {
                const game = this.aigames.find(game => (game.player1User === message.user._id));
                if (game) {
                    const promotion = message.promotion || "null";
                    game.makeMove(socket, message.move, message.user._id, promotion);
                }
            }
            if (message.type === messages_1.MOVE) {
                const game = this.findActiveGame(message.user._id);
                if (game) {
                    const promotion = message.promotion || "null";
                    game.makeMove(socket, message.move, message.user._id, promotion);
                }
            }
            if (message.type === messages_1.SEND_CHAT) {
                const game = this.findActiveGame(message.user._id);
                if (game) {
                    const senderName = message.user.firstName || "Player";
                    game.handleChat(socket, message.chatMessage, senderName);
                }
            }
            if (message.type === exports.AiREFRESH) {
                const game = this.aigames.find(game => game.player1User === message.user._id);
                if (game)
                    game.changeSocket(socket, message.user._id);
            }
            if (message.type === messages_1.REFRESH) {
                const game = this.games.find(game => ((game.player1User === message.user._id) || (game.player2User === message.user._id)));
                if (game) {
                    game.changeSocket(socket, message.user._id);
                }
                else {
                    if (((_c = this.pendingUser) === null || _c === void 0 ? void 0 : _c.userId) === message.user._id) {
                        this.pendingUser.socket = socket;
                    }
                }
            }
            if (message.type === exports.AiGAME_OVER) {
                this.aigames = this.aigames.filter(g => g.player1User !== message.user._id);
            }
            if (message.type === messages_1.GAME_OVER) {
                // Remove all finished games for this user
                this.games = this.games.filter(g => !((g.player1User === message.user._id || g.player2User === message.user._id) && g.gameOver));
            }
            if (message.type === exports.AiRESIGN) {
                const game = this.aigames.find(game => game.player1User === message.user._id);
                if (game) {
                    game.resign(message.user._id);
                    this.aigames = this.aigames.filter(g => g !== game);
                }
                else {
                    socket.send(JSON.stringify({ type: exports.AiGAME_OVER, winner: "null" }));
                }
            }
            if (message.type === messages_1.RESIGN) {
                const game = this.findActiveGame(message.user._id);
                if (game) {
                    game.resign(message.user._id);
                    this.games = this.games.filter(g => g !== game);
                }
                else {
                    // Also clear pending user if they resign while in queue
                    if (((_d = this.pendingUser) === null || _d === void 0 ? void 0 : _d.userId) === message.user._id) {
                        this.pendingUser = null;
                    }
                }
            }
        });
    }
}
exports.GameManager = GameManager;
