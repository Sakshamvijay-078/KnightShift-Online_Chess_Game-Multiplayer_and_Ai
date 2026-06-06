import { useState, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { GoogleLogin } from '@react-oauth/google';

interface LoginData {
    email: string;
    password: string;
}

const Login = () => {
    const [data, setData] = useState<LoginData>({ email: "", password: "" });
    const [error, setError] = useState<string>("");
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.currentTarget;
        setData({ ...data, [name]: value });
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        try {
            const url = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/auth`;
            const { data: res } = await axios.post(url, data);
            login(res.data);
        } catch (error: any) {
            if (error.response && error.response.status >= 400 && error.response.status <= 500) {
                setError(error.response.data.message);
            } else {
                setError("An unexpected error occurred. Please try again later.");
            }
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            const url = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/auth/google`;
            const { data: res } = await axios.post(url, { credential: credentialResponse.credential });
            login(res.data);
        } catch (error: any) {
            setError(error.response?.data?.message || "Google Authentication Failed");
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background glowing effects */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-chess-accent/30 rounded-full blur-[100px] animate-pulse-slow"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-chess-board/20 rounded-full blur-[100px] animate-pulse-slow delay-1000"></div>

            <div className="glass-panel rounded-3xl flex flex-col md:flex-row w-full max-w-5xl overflow-hidden relative z-10 animate-fade-in shadow-2xl">
                
                {/* Left Side - Welcome info */}
                <div className="w-full md:w-5/12 bg-gradient-to-br from-chess-dark/80 to-chess-darker/90 p-10 flex flex-col items-center justify-center text-center border-r border-white/5">
                    <div className="mb-8">
                        <svg className="w-16 h-16 mx-auto mb-4 text-chess-accent" fill="currentColor" viewBox="0 0 24 24"><path d="M17 4c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v2H5v2h2v4.5C5.8 11.2 5 12.5 5 14v4h14v-4c0-1.5-.8-2.8-2-3.5V10h2V8h-2V4zm-4 12c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm2-8H9V6h6v2z"/></svg>
                    </div>
                    <h1 className="text-4xl font-black text-white mb-4 text-glow">KnightShift</h1>
                    <p className="text-chess-muted mb-8 text-lg font-light leading-relaxed">
                        Enter the arena. Outsmart your opponents. Climb the ranks.
                    </p>
                    <div className="mt-auto">
                        <p className="text-sm text-chess-muted mb-4">New to KnightShift?</p>
                        <Link to="/signup">
                            <button type="button" className="glass-button w-full text-white font-medium py-3 px-8 rounded-xl outline-none">
                                Create an Account
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="w-full md:w-7/12 p-10 md:p-14 flex flex-col justify-center bg-chess-panel/30">
                    <form className="space-y-6 max-w-md w-full mx-auto" onSubmit={handleSubmit}>
                        <div className="mb-10 text-center md:text-left">
                            <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                            <p className="text-chess-muted">Sign in to continue your journey</p>
                        </div>

                        <div className="flex justify-center mb-8">
                            <div className="transform hover:scale-105 transition-transform duration-300">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => setError("Google Login Failed")}
                                    useOneTap
                                    theme="filled_black"
                                    shape="pill"
                                />
                            </div>
                        </div>

                        <div className="flex items-center text-chess-muted mb-8">
                            <div className="flex-1 border-t border-white/10"></div>
                            <span className="px-4 text-xs font-medium uppercase tracking-widest text-chess-muted/60">or log in with email</span>
                            <div className="flex-1 border-t border-white/10"></div>
                        </div>
                        
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-chess-muted mb-1 ml-1">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-chess-darker/50 border border-white/10 text-white px-5 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-chess-accent focus:border-transparent transition-all placeholder-chess-muted/30"
                                    placeholder="grandmaster@example.com"
                                />
                            </div>
                            <div className="relative">
                                <label className="block text-sm font-medium text-chess-muted mb-1 ml-1">Password</label>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={data.password}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-chess-darker/50 border border-white/10 text-white px-5 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-chess-accent focus:border-transparent transition-all placeholder-chess-muted/30 pr-12"
                                    placeholder="••••••••"
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-10 text-chess-muted hover:text-white transition-colors"
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>
                                    )}
                                </button>
                            </div>
                            
                            <div className="flex justify-between items-center text-sm">
                                <label className="flex items-center text-chess-muted cursor-pointer group">
                                    <input type="checkbox" className="mr-2 rounded border-white/20 bg-chess-darker text-chess-accent focus:ring-chess-accent focus:ring-offset-chess-darker" />
                                    <span className="group-hover:text-white transition-colors">Remember me</span>
                                </label>
                                <a href="/forgot-password" className="text-chess-accent hover:text-white transition-colors">Forgot password?</a>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-900/40 border border-red-500/50 text-red-200 text-sm rounded-xl text-center animate-fade-in flex items-center justify-center">
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                                {error}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={loading}
                            className={`w-full bg-gradient-to-r from-chess-accent to-chess-accentHover text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transform hover:-translate-y-0.5 transition-all outline-none ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Authenticating...
                                </span>
                            ) : "Login to Arena"}
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
};

export default Login;
