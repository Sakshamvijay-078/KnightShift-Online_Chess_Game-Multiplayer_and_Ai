import { useState, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Button } from "../Button";
import { useAuth } from "../../context/AuthContext";
import { GoogleLogin } from '@react-oauth/google';

interface SignupData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

const Signup = () => {
    const [data, setData] = useState<SignupData>({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
    });
    const [error, setError] = useState<string>("");
    const { login } = useAuth();

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const url = "http://localhost:8000/api/users";
            const { data: res } = await axios.post(url, data);
            login(res.data);
        } catch (error: any) {
            if (error.response && error.response.status >= 400 && error.response.status <= 500) {
                setError(error.response.data.message);
            }
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            const url = "http://localhost:8000/api/auth/google";
            const { data: res } = await axios.post(url, { credential: credentialResponse.credential });
            login(res.data);
        } catch (error: any) {
            setError(error.response?.data?.message || "Google Authentication Failed");
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-chess-dark p-6">
            <div className="flex flex-col md:flex-row-reverse bg-chess-panel border border-gray-700 shadow-2xl rounded-3xl overflow-hidden max-w-4xl w-full">
                
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="text-center md:text-left mb-8">
                            <h1 className="text-3xl font-black text-white">Create Account</h1>
                            <p className="text-gray-400 mt-2">Join the KnightShift community</p>
                        </div>
                        
                        <div className="flex justify-center mb-6">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => setError("Google Login Failed")}
                            />
                        </div>

                        <div className="flex items-center text-gray-500 mb-6">
                            <div className="flex-1 border-t border-gray-600"></div>
                            <span className="px-4 text-xs uppercase tracking-widest">or sign up with email</span>
                            <div className="flex-1 border-t border-gray-600"></div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    placeholder="First Name"
                                    name="firstName"
                                    value={data.firstName}
                                    onChange={handleChange}
                                    required
                                    className="w-1/2 bg-gray-900 border border-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-chess-board transition"
                                />
                                <input
                                    type="text"
                                    placeholder="Last Name"
                                    name="lastName"
                                    value={data.lastName}
                                    onChange={handleChange}
                                    required
                                    className="w-1/2 bg-gray-900 border border-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-chess-board transition"
                                />
                            </div>
                            <input
                                type="email"
                                placeholder="Email"
                                name="email"
                                value={data.email}
                                onChange={handleChange}
                                required
                                className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-chess-board transition"
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                name="password"
                                value={data.password}
                                onChange={handleChange}
                                required
                                className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-chess-board transition"
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-900/30 border border-red-800 text-red-200 text-sm rounded-lg text-center">
                                {error}
                            </div>
                        )}

                        <Button type="submit" variant="primary" className="w-full">
                            Sign Up
                        </Button>
                    </form>
                </div>

                <div className="w-full md:w-1/2 bg-chess-boardLight p-8 md:p-12 flex flex-col items-center justify-center text-center">
                    <h1 className="text-4xl font-black text-chess-dark mb-4">Welcome Back</h1>
                    <p className="text-gray-700 mb-8 font-medium">
                        Already have an account? Skip the form and login directly.
                    </p>
                    <Link to="/login" className="w-full block">
                        <button type="button" className="w-full bg-white text-chess-dark font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all outline-none">
                            Login
                        </button>
                    </Link>
                </div>

            </div>
        </div>
    );
};

export default Signup;
