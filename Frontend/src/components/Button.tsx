import React from "react"
import "/src/Styles/ChessBoard.css";

export const Button =({ onClick, children}:{onClick: ()=> void, children:React.ReactNode})=>{
    return <button onClick={onClick} className="bg-green-500 hover:bg-green-700 button" >
        {children}
    </button>
}