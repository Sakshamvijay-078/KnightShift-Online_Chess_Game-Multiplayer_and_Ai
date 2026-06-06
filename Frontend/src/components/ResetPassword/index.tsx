import { useState, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import { Link, useParams, useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const ResetPassword = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const passwordRules = {
        length: password.length >= 8,
        upper: /[A-Z]/.test(password),
        lower: /[a-z]/.test(password),
        number: /\d/.test(password),
    };
    const allRulesMet = Object.values(passwordRules).every(Boolean);
    const passwordsMatch = password === confirm;

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!allRulesMet) { setMessage("Please meet all password requirements."); setStatus("error"); return; }
        if (!passwordsMatch) { setMessage("Passwords do not match."); setStatus("error"); return; }

        setStatus("loading");
        setMessage("");
        try {
            const { data } = await axios.post(`${API}/api/auth/reset-password/${token}`, { password });
            setStatus("success");
            setMessage(data.message);
            setTimeout(() => navigate("/login"), 3000);
        } catch (err: any) {
            setStatus("error");
            setMessage(err.response?.data?.message || "Failed to reset password. The link may have expired.");
        }
    };

    const RuleItem = ({ met, label }: { met: boolean; label: string }) => (
        <div className={`flex items-center gap-2 text-xs transition-colors ${met ? "text-green-400" : "text-chess-muted/60"}`}>
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {met
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v14M5 12h14" />
                }
            </svg>
            <span>{label}</span>
        </div>
    );

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background glowing effects */}
            <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-chess-accent/30 rounded-full blur-[100px] animate-pulse-slow"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-chess-board/20 rounded-full blur-[100px] animate-pulse-slow delay-1000"></div>

            <div className="glass-panel rounded-3xl flex flex-col md:flex-row w-full max-w-4xl overflow-hidden relative z-10 shadow-2xl">

                {/* Left Side */}
                <div className="w-full md:w-5/12 bg-gradient-to-br from-chess-dark/80 to-chess-darker/90 p-10 flex flex-col items-center justify-center text-center border-r border-white/5">
                    <div className="mb-8">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-chess-accent/20 border border-chess-accent/30 flex items-center justify-center">
                            <svg className="w-10 h-10 text-chess-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                            </svg>
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-white mb-4 text-glow">KnightShift</h1>
                    <p className="text-chess-muted mb-8 text-lg font-light leading-relaxed">
                        Choose a strong password to protect your account and get back to the game.
                    </p>
                    <div className="mt-auto">
                        <Link to="/login">
                            <button type="button" className="glass-button w-full text-white font-medium py-3 px-8 rounded-xl outline-none">
                                Back to Login
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Right Side */}
                <div className="w-full md:w-7/12 p-10 md:p-14 flex flex-col justify-center bg-chess-panel/30">

                    {status === "success" ? (
                        <div className="max-w-md w-full mx-auto text-center">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                                <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-4">Password Reset!</h2>
                            <p className="text-chess-muted mb-2 text-lg">{message}</p>
                            <p className="text-chess-muted/60 text-sm mt-4 mb-8">
                                Redirecting you to login in a moment...
                            </p>
                            <Link to="/login">
                                <button className="w-full bg-gradient-to-r from-chess-accent to-chess-accentHover text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all outline-none">
                                    Go to Login Now
                                </button>
                            </Link>
                        </div>
                    ) : (
                        <form className="space-y-6 max-w-md w-full mx-auto" onSubmit={handleSubmit}>
                            <div className="mb-8 text-center md:text-left">
                                <h2 className="text-3xl font-bold text-white mb-2">Set New Password</h2>
                                <p className="text-chess-muted">Your new password must be strong and unique.</p>
                            </div>

                            {/* New Password */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-chess-muted mb-1 ml-1">New Password</label>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                    required
                                    disabled={status === "loading"}
                                    className="w-full bg-chess-darker/50 border border-white/10 text-white px-5 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-chess-accent focus:border-transparent transition-all placeholder-chess-muted/30 pr-12 disabled:opacity-60"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-10 text-chess-muted hover:text-white transition-colors"
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                                    )}
                                </button>
                            </div>

                            {/* Password strength indicators */}
                            {password.length > 0 && (
                                <div className="grid grid-cols-2 gap-2 p-4 bg-white/5 rounded-xl border border-white/10">
                                    <RuleItem met={passwordRules.length} label="At least 8 characters" />
                                    <RuleItem met={passwordRules.upper} label="One uppercase letter" />
                                    <RuleItem met={passwordRules.lower} label="One lowercase letter" />
                                    <RuleItem met={passwordRules.number} label="One number" />
                                </div>
                            )}

                            {/* Confirm Password */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-chess-muted mb-1 ml-1">Confirm Password</label>
                                <input
                                    type={showConfirm ? "text" : "password"}
                                    value={confirm}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirm(e.target.value)}
                                    required
                                    disabled={status === "loading"}
                                    className={`w-full bg-chess-darker/50 border text-white px-5 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-chess-accent focus:border-transparent transition-all placeholder-chess-muted/30 pr-12 disabled:opacity-60 ${confirm.length > 0 ? (passwordsMatch ? "border-green-500/50" : "border-red-500/50") : "border-white/10"}`}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-4 top-10 text-chess-muted hover:text-white transition-colors"
                                >
                                    {showConfirm ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                                    )}
                                </button>
                                {confirm.length > 0 && !passwordsMatch && (
                                    <p className="text-red-400 text-xs mt-1 ml-1">Passwords do not match</p>
                                )}
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
                                disabled={status === "loading" || !allRulesMet || !passwordsMatch}
                                className={`w-full bg-gradient-to-r from-chess-accent to-chess-accentHover text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transform hover:-translate-y-0.5 transition-all outline-none ${(status === "loading" || !allRulesMet || !passwordsMatch) ? "opacity-60 cursor-not-allowed" : ""}`}
                            >
                                {status === "loading" ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Resetting Password...
                                    </span>
                                ) : "Reset Password"}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
