import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyles = "relative flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-lg transition-all active:translate-y-1";
  
  const variants = {
    primary: "bg-chess-board text-white hover:bg-[#81A55D] shadow-[0_4px_0_#5A7540] active:shadow-none hover:-translate-y-0.5",
    secondary: "bg-chess-panel text-white border border-gray-600 hover:bg-[#3d3d3d] shadow-[0_4px_0_#1a1a1a] active:shadow-none hover:-translate-y-0.5",
    danger: "bg-red-600 text-white hover:bg-red-500 shadow-[0_4px_0_#8b0000] active:shadow-none hover:-translate-y-0.5",
    ghost: "bg-transparent text-gray-400 hover:text-white active:translate-y-0 hover:bg-gray-800"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};