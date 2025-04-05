import { Color, PieceSymbol, Square } from "chess.js";
import { useState } from "react";
// import { MOVE } from "../screens/Game";
import "/src/Styles/newChessBoard.css";
import { decodeToken } from "../screens/GetUserName";
export const AiMOVE = "ai_move";
// const PROMOTION = "promotion";

export const ChessBoard = ({
  board,
  socket,
  playercolor,
}: {
  board: ({
    square: Square;
    type: PieceSymbol;
    color: Color;
  } | null)[][];
  socket: WebSocket;
  playercolor: any;
}) => {
  const [from, setFrom] = useState<null | Square>(null);
  const [box_click, setBox_click] = useState("none");
  const [promotionModal, setPromotionModal] = useState(false);
  const [promotionSquare, setPromotionSquare] = useState<null | string>(null);
  const [promotionFrom, setPromotionFrom] = useState<null | string>(null);
  console.log(board);
  const handlePromotion = (piece: string) => {
    console.log(promotionFrom, promotionSquare);
    if (promotionSquare && promotionFrom) {
      socket.send(
        JSON.stringify({
          type: AiMOVE,
          move: {
            from: promotionFrom,
            to: promotionSquare,
          },
          promotion: piece, // Send promotion piece
          user: decodeToken(),
        })
      );
    }
    setPromotionModal(false);
    setPromotionSquare(null);
    setPromotionFrom(null);
    setFrom(null);
  };
  // setPromotionModal(true);
  return (
    <div className="text-white font-bold border chessBoard">
      {board.map((row, i) => {
        return (
          <div key={i} className="flex">
            {row.map((square, j) => {
              const squareRepresentation = (String.fromCharCode(97 + (j % 8)) +
                "" +
                (8 - i)) as Square;

              return (
                <div
                  onClick={() => {
                    if (!from && playercolor === square?.color) {
                      setBox_click(squareRepresentation);
                      setFrom(squareRepresentation);
                    } else if (from) {
                      setBox_click("null");

                      // Check if a pawn is moving to the promotion rank
                      const isPawnPromotion =
                        from && // Ensure a starting square exists
                        board[8 - parseInt(from[1])][from.charCodeAt(0) - 97]
                          ?.type === "p" && // Check if the piece being moved is a pawn
                        ((playercolor === "w" &&
                          squareRepresentation[1] === "8") || // White pawn reaching rank 8
                          (playercolor === "b" &&
                            squareRepresentation[1] === "1")); // Black pawn reaching rank 1
                      if (isPawnPromotion) {
                        // console.log("hfa;j");
                        setPromotionSquare(squareRepresentation);
                        setPromotionFrom(from);
                        setPromotionModal(true);
                      } else {
                        // console.log("fasdj");
                        socket.send(
                          JSON.stringify({
                            type: AiMOVE,
                            move: {
                              from,
                              to: squareRepresentation,
                            },
                            user: decodeToken(),
                          })
                        );
                        setFrom(null);
                      }
                    }
                  }}
                  key={j}
                  className={`w-20 h-20 ${
                    (i + j) % 2 ? "bg-green-700" : "bg-green-100"
                  } text-black copy_${i}_${j} ${
                    box_click ===
                    String.fromCharCode(97 + (j % 8)) + "" + (8 - i)
                      ? "color"
                      : "null"
                  }`}
                >
                  <div className="w-full justify-center flex h-full">
                    <div className="h-full justify-center flex-col flex">
                      {square ? (
                        <img
                          className="w-15"
                          src={`/${
                            square?.color === "b"
                              ? square?.type
                              : `${square?.type?.toUpperCase()}_copy`
                          }.png`}
                          alt={`${square.color}${square.type}`}
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
      {promotionModal && (
        <div className="promotion-modal">
          <div className="modal-content">
            <h2>Promote to:</h2>
            <div className="piece-options">
              {["q", "r", "b", "n"].map((piece) => (
                <button
                  key={piece}
                  className="piece-button"
                  onClick={() => handlePromotion(piece)}
                >
                  <img
                    src={`/${
                      playercolor === "b"
                        ? piece
                        : `${piece.toUpperCase()}_copy`
                    }.png`}
                    alt={piece}
                    className="piece-image"
                  />
                  <span>{piece.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
