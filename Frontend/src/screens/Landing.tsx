import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { NotificationBell } from "../components/NotificationBell";

export const Landing = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    return (
        <div className="flex flex-col md:flex-row items-center justify-center min-h-screen bg-chess-dark text-white p-6 w-full max-w-6xl mx-auto gap-12">
            <NotificationBell />
            
            {/* Left side Graphic */}
            <div className="w-full md:w-1/2 flex justify-center">
                <div className="relative group perspective">
                    <img 
                        src="/chess_image.jpg" 
                        alt="Chess Board Graphic" 
                        className="rounded-lg shadow-[0_0_50px_rgba(115,149,82,0.3)] border-2 border-chess-panel transition-transform duration-500 ease-in-out group-hover:scale-105"
                    />
                </div>
            </div>

            {/* Right side interactions */}
            <div className="w-full md:w-1/2 flex flex-col justify-center items-center md:items-start space-y-8">
                <div className="space-y-4 text-center md:text-left">
                    <h1 className="text-5xl font-black tracking-tight drop-shadow-md">
                        Play Chess Online on the <span className="text-chess-board">#1</span> Site!
                    </h1>
                    <p className="text-gray-400 text-lg leading-relaxed">
                        Join players from around the world. Play against real opponents or test your skills against the powerful Stockfish engine.
                    </p>
                </div>

                <div className="flex flex-col space-y-4 w-full max-w-sm">
                    <button 
                        onClick={() => navigate("/game")}
                        className="relative flex items-center justify-center gap-3 w-full bg-chess-board hover:bg-[#81A55D] text-white py-4 px-6 rounded-xl font-bold text-xl transition-all shadow-[0_6px_0_#5A7540] hover:translate-y-1 hover:shadow-[0_2px_0_#5A7540] active:translate-y-2 active:shadow-none"
                    >
                        <svg xmlns="http://www.w3.org/Form/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
                           <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
                        </svg>
                        Play Online
                    </button>

                    <button 
                        onClick={() => navigate("/computer")}
                        className="relative flex items-center justify-center gap-3 w-full bg-chess-panel hover:bg-[#3d3d3d] border border-gray-600 text-white py-4 px-6 rounded-xl font-bold text-xl transition-all shadow-[0_6px_0_#1a1a1a] hover:translate-y-1 hover:shadow-[0_2px_0_#1a1a1a] active:translate-y-2 active:shadow-none"
                    >
                        <svg xmlns="http://www.w3.org/Form/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
                           <path d="M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/>
                        </svg>
                        Play Computer
                    </button>
                    
                    <button 
                        onClick={() => navigate("/profile")}
                        className="w-full text-center text-gray-500 hover:text-white transition-colors mt-4 text-sm uppercase tracking-widest font-bold"
                    >
                        Player Profile
                    </button>
                    
                    <button 
                        onClick={logout}
                        className="w-full text-center text-red-500/50 hover:text-red-500 transition-colors mt-2 text-xs"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
            
        </div>
    );
};
export default Landing;