import { Color, PieceSymbol, Square } from "chess.js";

type PieceMap = Record<PieceSymbol, number>;
const initialPieces: PieceMap = { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 };

const pieceValues: Record<PieceSymbol, number> = {
    p: 1,
    n: 3,
    b: 3,
    r: 5,
    q: 9,
    k: 0
};

export const getCapturedPieces = (
    board: ({ square: Square; type: PieceSymbol; color: Color } | null)[][]
) => {
    const currentWhite: PieceMap = { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 };
    const currentBlack: PieceMap = { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 };

    board.forEach((row) => {
        row.forEach((square) => {
            if (square) {
                if (square.color === 'w') {
                    currentWhite[square.type]++;
                } else {
                    currentBlack[square.type]++;
                }
            }
        });
    });

    const capturedWhite: PieceSymbol[] = [];
    const capturedBlack: PieceSymbol[] = [];
    
    let whiteScore = 0;
    let blackScore = 0;

    Object.keys(initialPieces).forEach((key) => {
        const type = key as PieceSymbol;
        // The pieces white has lost (black has captured)
        const missingWhite = initialPieces[type] - currentWhite[type];
        for (let i = 0; i < missingWhite; i++) {
            capturedWhite.push(type);
            blackScore += pieceValues[type];
        }

        // The pieces black has lost (white has captured)
        const missingBlack = initialPieces[type] - currentBlack[type];
        for (let i = 0; i < missingBlack; i++) {
            capturedBlack.push(type);
            whiteScore += pieceValues[type];
        }
    });

    // Define standard sorting order purely for visual harmony
    const order: Record<PieceSymbol, number> = { p: 1, n: 2, b: 3, r: 4, q: 5, k: 6 };
    capturedWhite.sort((a, b) => order[a] - order[b]);
    capturedBlack.sort((a, b) => order[a] - order[b]);

    return {
        capturedByWhite: capturedBlack, // Pieces white has collected
        capturedByBlack: capturedWhite, // Pieces black has collected
        whiteAdvantage: whiteScore - blackScore,
        blackAdvantage: blackScore - whiteScore,
    };
};
