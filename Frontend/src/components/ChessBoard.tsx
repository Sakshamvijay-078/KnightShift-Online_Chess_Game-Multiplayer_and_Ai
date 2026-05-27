import { Color, PieceSymbol, Square } from "chess.js";
import { useState } from "react";
import { MOVE } from "../screens/Game";
import { decodeToken } from "../screens/GetUserName";

export const ChessBoard = ({
  board,
  socket,
  playercolor,
  chessEngine,
}: {
  board: ({
    square: Square;
    type: PieceSymbol;
    color: Color;
  } | null)[][];
  socket: WebSocket;
  playercolor: any;
  chessEngine?: any;
}) => {
  const [from, setFrom] = useState<null | Square>(null);
  const [promotionModal, setPromotionModal] = useState(false);
  const [promotionSquare, setPromotionSquare] = useState<null | string>(null);
  const [promotionFrom, setPromotionFrom] = useState<null | string>(null);

  const handlePromotion = (piece: string) => {
    if (promotionSquare && promotionFrom) {
      socket.send(
        JSON.stringify({
          type: MOVE,
          move: {
            from: promotionFrom,
            to: promotionSquare,
          },
          promotion: piece,
          user: decodeToken(),
        })
      );
    }
    setPromotionModal(false);
    setPromotionSquare(null);
    setPromotionFrom(null);
    setFrom(null);
  };

  // Calculate valid destination squares if a piece is selected
  const validMoves = from && chessEngine 
    ? chessEngine.moves({ square: from, verbose: true }).map((m: any) => m.to)
    : [];

  return (
    <div className="relative inline-block border-[6px] border-white/5 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden bg-chess-darker">
      <div className="flex flex-col">
        {Array.from({ length: 8 }).map((_, rI) => {
          // If playing as black, render from bottom to top (row 7 down to 0)
          const i = playercolor === "b" ? 7 - rI : rI;
          const row = board[i];
          
          return (
            <div key={i} className="flex">
              {Array.from({ length: 8 }).map((_, cJ) => {
                // If playing as black, render from right to left (col 7 down to 0)
                const j = playercolor === "b" ? 7 - cJ : cJ;
                const square = row[j];
                
                const squareRepresentation = (String.fromCharCode(97 + (j % 8)) + "" + (8 - i)) as Square;
                const isDarkSquare = (i + j) % 2 !== 0;
                const isSelected = from === squareRepresentation;
                const isValidMove = validMoves.includes(squareRepresentation);
                
                return (
                  <div
                    onClick={() => {
                      // Attempting to move
                      if (from && isValidMove) {
                        const isPawnPromotion =
                          board[8 - parseInt(from[1])][from.charCodeAt(0) - 97]?.type === "p" &&
                          ((playercolor === "w" && squareRepresentation[1] === "8") ||
                           (playercolor === "b" && squareRepresentation[1] === "1"));

                        if (isPawnPromotion) {
                          setPromotionSquare(squareRepresentation);
                          setPromotionFrom(from);
                          setPromotionModal(true);
                        } else {
                          socket.send(
                            JSON.stringify({
                              type: MOVE,
                              move: {
                                from,
                                to: squareRepresentation,
                              },
                              user: decodeToken(),
                            })
                          );
                          setFrom(null);
                        }
                      } else if (square?.color === playercolor) {
                        // Select/reselect a piece
                        setFrom(squareRepresentation);
                      } else {
                        // Clicked empty invalid square
                        setFrom(null);
                      }
                    }}
                    key={j}
                    className={`
                      w-[clamp(2.5rem,calc((100vw-3rem)/8),5rem)] aspect-square flex justify-center items-center cursor-pointer transition-colors relative
                      ${isDarkSquare ? "bg-chess-board" : "bg-chess-boardLight"}
                      ${isSelected ? "ring-inset ring-4 ring-yellow-400 bg-yellow-200/50" : ""}
                    `}
                  >
                    {square && (
                      <img
                        className={`w-[85%] h-[85%] select-none drop-shadow-md transition-transform ${isValidMove ? 'opacity-50' : 'hover:scale-105'} z-10`}
                        src={`/${square.color === "b" ? square.type : `${square.type.toUpperCase()}_copy`}.png`}
                        alt={`${square.color}${square.type}`}
                        draggable={false}
                      />
                    )}

                    {/* Valid Move Indicator (Chess.com style dots) */}
                    {isValidMove && !square && (
                      <div className="absolute w-4 h-4 md:w-6 md:h-6 bg-black/20 rounded-full z-0" />
                    )}
                    {isValidMove && square && (
                      <div className="absolute w-12 h-12 md:w-[72px] md:h-[72px] border-[6px] border-black/20 rounded-full z-0" />
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Promotion Modal Overlay */}
      {promotionModal && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-md">
          <div className="glass-panel p-6 rounded-3xl shadow-2xl border border-white/10 animate-in fade-in zoom-in duration-300">
            <h2 className="text-white text-xl font-bold text-center mb-4">Promote to</h2>
            <div className="flex gap-4">
              {["q", "r", "b", "n"].map((piece) => (
                <button
                  key={piece}
                  className="w-16 h-16 bg-white/5 rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center shadow-lg border border-white/10 hover:border-white/30 hover:scale-110 active:scale-95"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePromotion(piece);
                  }}
                >
                  <img
                    src={`/${playercolor === "b" ? piece : `${piece.toUpperCase()}_copy`}.png`}
                    alt={piece}
                    className="w-12 h-12"
                  />
                </button>
              ))}
            </div>
            <button 
              className="mt-6 w-full text-gray-400 hover:text-white text-sm transition"
              onClick={(e) => {
                e.stopPropagation();
                setPromotionModal(false);
                setFrom(null);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
