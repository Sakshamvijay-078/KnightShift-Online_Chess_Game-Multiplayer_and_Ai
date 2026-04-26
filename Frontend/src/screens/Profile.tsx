import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/Button";
import { useNavigate } from "react-router-dom";

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  isVerified: boolean;
}

const Profile = () => {
    const { token, logout } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({ firstName: "", lastName: "", photoUrl: "" });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axios.get("http://localhost:8000/api/users/profile", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProfile(response.data.data);
                setFormData({
                    firstName: response.data.data.firstName,
                    lastName: response.data.data.lastName,
                    photoUrl: response.data.data.avatar || ""
                });
            } catch (err) {
                setError("Failed to load profile. Please sign in again.");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [token]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await axios.put("http://localhost:8000/api/users/profile", formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(response.data.data);
            setEditMode(false);
        } catch (err) {
            setError("Failed to update profile.");
        }
    };

    if (loading) return <div className="min-h-screen bg-chess-dark text-white flex items-center justify-center">Loading Profile...</div>;

    return (
        <div className="min-h-screen w-full bg-chess-dark py-12 px-4 relative">
            
            <button onClick={() => navigate("/")} className="absolute top-6 left-6 text-gray-400 hover:text-white flex items-center gap-2">
               &larr; Back to Base
            </button>

            <div className="max-w-2xl mx-auto space-y-6">
                
                {profile && !profile.isVerified && (
                    <div className="bg-yellow-900/30 border border-yellow-700/50 p-4 rounded-xl flex items-center justify-between">
                        <div>
                            <h3 className="text-yellow-400 font-bold">Email Pending Verification ⚠️</h3>
                            <p className="text-gray-300 text-sm">Please check your inbox to verify your account and secure your elo.</p>
                        </div>
                        <Button variant="ghost" className="text-yellow-400 border border-yellow-700">Resend Link</Button>
                    </div>
                )}

                <div className="bg-chess-panel border border-gray-700 shadow-2xl rounded-3xl p-8 md:p-12">
                    <div className="flex justify-between items-start mb-8">
                        <h1 className="text-4xl font-black text-white">Player Data</h1>
                        <Button variant="danger" onClick={logout}>Sign Out</Button>
                    </div>

                    {error && <div className="text-red-400 mb-6 bg-red-900/20 p-4 rounded-xl">{error}</div>}

                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start mb-10">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-chess-boardLight shadow-xl flex-shrink-0 bg-gray-800 flex items-center justify-center">
                            {profile?.avatar ? (
                                <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl font-black text-gray-500 uppercase">{profile?.firstName?.[0]}</span>
                            )}
                        </div>
                        <div className="flex-1 w-full">
                            {!editMode ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-gray-400 text-sm uppercase tracking-widest font-bold">Display Name</label>
                                        <p className="text-2xl font-bold text-white uppercase">{profile?.firstName} {profile?.lastName}</p>
                                    </div>
                                    <div>
                                        <label className="text-gray-400 text-sm uppercase tracking-widest font-bold">Linked Email</label>
                                        <p className="text-lg text-gray-300">{profile?.email}</p>
                                    </div>
                                    <Button variant="secondary" onClick={() => setEditMode(true)} className="mt-4">Edit Profile</Button>
                                </div>
                            ) : (
                                <form onSubmit={handleUpdate} className="space-y-4 w-full">
                                    <div className="flex gap-4">
                                        <input
                                            type="text"
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                            className="w-1/2 bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-xl"
                                        />
                                        <input
                                            type="text"
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                            className="w-1/2 bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-xl"
                                        />
                                    </div>
                                    <input
                                        type="url"
                                        placeholder="Paste a direct image URL for your avatar"
                                        value={formData.photoUrl}
                                        onChange={(e) => setFormData({...formData, photoUrl: e.target.value})}
                                        className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-xl bg-opacity-70"
                                    />
                                    <div className="flex gap-3 pt-2">
                                        <Button type="submit" variant="primary">Save Changes</Button>
                                        <Button type="button" variant="ghost" onClick={() => setEditMode(false)}>Cancel</Button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
