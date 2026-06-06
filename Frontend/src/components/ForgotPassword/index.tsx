import { useState, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setStatus("loading");
        setMessage("");
        try {
            const { data } = await axios.post(`${API}/api/auth/forgot-password`, { email });
            setStatus("sent");
            setMessage(data.message);
        } catch (err: any) {
            setStatus("error");
            setMessage(err.response?.data?.message || "Something went wrong. Please try again.");
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background glowing effects */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-chess-accent/30 rounded-full blur-[100px] animate-pulse-slow"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-chess-board/20 rounded-full blur-[100px] animate-pulse-slow delay-1000"></div>

            <div className="glass-panel rounded-3xl flex flex-col md:flex-row w-full max-w-4xl overflow-hidden relative z-10 shadow-2xl">
                
                {/* Left Side */}
                <div className="w-full md:w-5/12 bg-gradient-to-br from-chess-dark/80 to-chess-darker/90 p-10 flex flex-col items-center justify-center text-center border-r border-white/5">
                    <div className="mb-8">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-chess-accent/20 border border-chess-accent/30 flex items-center justify-center">
                            <svg className="w-10 h-10 text-chess-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-white mb-4 text-glow">KnightShift</h1>
                    <p className="text-chess-muted mb-8 text-lg font-light leading-relaxed">
                        No worries — we'll send a reset link straight to your inbox.
                    </p>
                    <div className="mt-auto">
                        <p className="text-sm text-chess-muted mb-4">Remember your password?</p>
                        <Link to="/login">
                            <button type="button" className="glass-button w-full text-white font-medium py-3 px-8 rounded-xl outline-none">
                                Back to Login
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Right Side — Form */}
                <div className="w-full md:w-7/12 p-10 md:p-14 flex flex-col justify-center bg-chess-panel/30">
                    
                    {status === "sent" ? (
                        <div className="max-w-md w-full mx-auto text-center">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                                <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-4">Check Your Email</h2>
                            <p className="text-chess-muted mb-2 text-lg">{message}</p>
                            <p className="text-chess-muted/60 text-sm mt-4 mb-8">
                                The link will expire in <span className="text-chess-accent font-semibold">1 hour</span>. Check your spam folder if you don't see it.
                            </p>
                            <button
                                onClick={() => { setStatus("idle"); setEmail(""); setMessage(""); }}
                                className="text-chess-accent hover:text-white transition-colors text-sm font-medium"
                            >
                                Send another email →
                            </button>
                        </div>
                    ) : (
                        <form className="space-y-6 max-w-md w-full mx-auto" onSubmit={handleSubmit}>
                            <div className="mb-10 text-center md:text-left">
                                <h2 className="text-3xl font-bold text-white mb-2">Forgot Password?</h2>
                                <p className="text-chess-muted">Enter your email and we'll send you a reset link.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-chess-muted mb-1 ml-1">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                    required
                                    disabled={status === "loading"}
                                    className="w-full bg-chess-darker/50 border border-white/10 text-white px-5 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-chess-accent focus:border-transparent transition-all placeholder-chess-muted/30 disabled:opacity-60"
                                    placeholder="grandmaster@example.com"
                                />
                            </div>

                            {status === "error" && message && (
                                <div className="p-4 bg-red-900/40 border border-red-500/50 text-red-200 text-sm rounded-xl text-center animate-fade-in flex items-center justify-center gap-2">
                                    <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {message}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={status === "loading"}
                                className={`w-full bg-gradient-to-r from-chess-accent to-chess-accentHover text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transform hover:-translate-y-0.5 transition-all outline-none ${status === "loading" ? "opacity-70 cursor-not-allowed" : ""}`}
                            >
                                {status === "loading" ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Sending Reset Link...
                                    </span>
                                ) : "Send Reset Link"}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
