import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyles = "relative flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold transition-all outline-none duration-300";
  
  const variants = {
    primary: "bg-gradient-to-r from-chess-accent to-chess-accentHover text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none border border-white/10",
    secondary: "glass-button border border-white/10 text-gray-200 hover:text-white hover:border-white/30 hover:bg-white/10 shadow-[0_0_15px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 active:translate-y-1",
    danger: "bg-red-500/20 text-red-200 border border-red-500/50 hover:bg-red-500/40 hover:border-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none",
    ghost: "bg-transparent text-chess-muted hover:text-white hover:bg-white/5 active:bg-white/10"
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