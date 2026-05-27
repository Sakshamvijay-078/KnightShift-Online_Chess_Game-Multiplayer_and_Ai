import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  isVerified: boolean;
  friends?: string[];
  friendRequests?: { from: string; fromName: string }[];
}

const Profile = () => {
    const { token, logout } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({ firstName: "", lastName: "", photoUrl: "" });
    const [friendEmail, setFriendEmail] = useState("");
    const [friendMsg, setFriendMsg] = useState("");
    const [friendsList, setFriendsList] = useState<{email: string; name: string}[]>([]);
    const navigate = useNavigate();

    const fetchProfile = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/users/profile`, {
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

    const fetchFriends = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/users/friends`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFriendsList(response.data.data || []);
        } catch (err) {
            // Friends feature may not be available yet
        }
    };

    useEffect(() => {
        fetchProfile();
        fetchFriends();
    }, [token]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await axios.put(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/users/profile`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(response.data.data);
            setEditMode(false);
        } catch (err) {
            setError("Failed to update profile.");
        }
    };

    const handleSendFriendRequest = async () => {
        if (!friendEmail.trim()) return;
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/users/friends/request`, 
                { email: friendEmail }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setFriendMsg(response.data.message);
            setFriendEmail("");
            setTimeout(() => setFriendMsg(""), 3000);
        } catch (err: any) {
            setFriendMsg(err.response?.data?.message || "Failed to send request.");
            setTimeout(() => setFriendMsg(""), 3000);
        }
    };

    const handleFriendAction = async (fromEmail: string, action: "accept" | "decline") => {
        try {
            await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/users/friends/${action}`, 
                { email: fromEmail }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchProfile();
            fetchFriends();
        } catch (err) {
            setError(`Failed to ${action} friend request.`);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-chess-darker flex items-center justify-center relative overflow-hidden">
            <div className="absolute w-64 h-64 bg-chess-accent/20 rounded-full blur-[80px] animate-pulse"></div>
            <div className="flex flex-col items-center z-10">
                <svg className="animate-spin h-10 w-10 text-chess-accent mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <div className="text-white text-lg font-bold tracking-widest uppercase">Loading Profile...</div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen w-full bg-chess-darker py-10 px-4 md:px-8 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-chess-accent/10 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[100px]"></div>
            
            <div className="max-w-5xl mx-auto relative z-10">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button onClick={() => navigate("/")} className="glass-button w-12 h-12 rounded-full flex items-center justify-center text-white hover:text-chess-accent transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    </button>
                    <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-widest">Profile</h1>
                    <button onClick={logout} className="glass-button px-6 py-2.5 rounded-full text-red-400 font-bold hover:bg-red-500/20 hover:text-red-300 transition-colors text-sm uppercase tracking-wide border-red-500/30">
                        Sign Out
                    </button>
                </div>

                {profile && !profile.isVerified && (
                    <div className="mb-8 bg-gradient-to-r from-yellow-900/40 to-yellow-800/20 border border-yellow-700/50 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between shadow-lg backdrop-blur-md">
                        <div className="flex items-center mb-4 sm:mb-0">
                            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center mr-4">⚠️</div>
                            <div>
                                <h3 className="text-yellow-400 font-bold text-lg">Verify your email</h3>
                                <p className="text-yellow-200/70 text-sm">Secure your account to unlock all features.</p>
                            </div>
                        </div>
                    </div>
                )}

                {error && <div className="text-red-300 mb-8 bg-red-900/30 border border-red-500/30 p-4 rounded-xl text-center backdrop-blur-sm">{error}</div>}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column - Profile Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="glass-panel rounded-3xl p-8 relative overflow-hidden flex flex-col items-center text-center">
                            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-chess-accent/40 to-transparent"></div>
                            
                            <div className="relative z-10 w-32 h-32 rounded-full p-1 bg-gradient-to-br from-chess-accent via-white to-chess-board mb-6 shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                                <div className="w-full h-full rounded-full overflow-hidden bg-chess-darker flex items-center justify-center">
                                    {profile?.avatar ? (
                                        <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-5xl font-black text-white uppercase">{profile?.firstName?.[0]}</span>
                                    )}
                                </div>
                            </div>
                            
                            {!editMode ? (
                                <>
                                    <h2 className="text-2xl font-black text-white mb-1 uppercase">{profile?.firstName} {profile?.lastName}</h2>
                                    <p className="text-chess-muted mb-6 flex items-center justify-center gap-2 text-sm">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                        {profile?.email}
                                    </p>
                                    
                                    <button onClick={() => setEditMode(true)} className="w-full glass-button text-white font-bold py-3 rounded-xl uppercase tracking-wider text-sm">
                                        Edit Profile
                                    </button>
                                </>
                            ) : (
                                <form onSubmit={handleUpdate} className="w-full space-y-4 text-left">
                                    <h3 className="text-xl font-bold text-white mb-4 text-center">Edit Details</h3>
                                    <div>
                                        <label className="block text-xs uppercase text-chess-muted mb-1 ml-1">First Name</label>
                                        <input type="text" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="w-full bg-chess-darker/50 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-chess-accent" />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase text-chess-muted mb-1 ml-1">Last Name</label>
                                        <input type="text" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="w-full bg-chess-darker/50 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-chess-accent" />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase text-chess-muted mb-1 ml-1">Avatar URL</label>
                                        <input type="url" placeholder="https://..." value={formData.photoUrl} onChange={(e) => setFormData({...formData, photoUrl: e.target.value})} className="w-full bg-chess-darker/50 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-chess-accent" />
                                    </div>
                                    <div className="flex gap-3 pt-4">
                                        <button type="submit" className="flex-1 bg-chess-accent hover:bg-chess-accentHover text-white font-bold py-3 rounded-xl transition-colors">Save</button>
                                        <button type="button" onClick={() => setEditMode(false)} className="flex-1 glass-button text-white font-bold py-3 rounded-xl">Cancel</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Friends */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Friend Requests */}
                        {profile?.friendRequests && profile.friendRequests.length > 0 && (
                            <div className="glass-panel rounded-3xl p-6">
                                <h3 className="text-white font-bold uppercase tracking-wider mb-4 text-sm flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-chess-accent animate-pulse"></span>
                                    Friend Requests ({profile.friendRequests.length})
                                </h3>
                                <div className="space-y-3">
                                    {profile.friendRequests.map((req, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-chess-darker/40 rounded-2xl border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-chess-accent/20 flex items-center justify-center text-white font-bold uppercase">{req.fromName[0]}</div>
                                                <div>
                                                    <div className="text-white font-bold">{req.fromName}</div>
                                                    <div className="text-chess-muted text-xs">{req.from}</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleFriendAction(req.from, "accept")} className="bg-chess-accent hover:bg-chess-accentHover text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">Accept</button>
                                                <button onClick={() => handleFriendAction(req.from, "decline")} className="glass-button text-chess-muted hover:text-white px-4 py-2 rounded-lg text-sm font-bold">Decline</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Add Friend */}
                        <div className="glass-panel rounded-3xl p-6">
                            <h3 className="text-white font-bold uppercase tracking-wider mb-4 text-sm flex items-center gap-2">
                                <svg className="w-5 h-5 text-chess-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
                                Add Friend
                            </h3>
                            <div className="flex gap-3">
                                <input 
                                    type="email" 
                                    placeholder="Enter friend's email address" 
                                    value={friendEmail}
                                    onChange={(e) => setFriendEmail(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSendFriendRequest()}
                                    className="flex-1 bg-chess-darker/50 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-chess-accent placeholder:text-gray-600 text-sm"
                                />
                                <button 
                                    onClick={handleSendFriendRequest}
                                    disabled={!friendEmail.trim()}
                                    className="bg-chess-accent hover:bg-chess-accentHover disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all"
                                >Send</button>
                            </div>
                            {friendMsg && <p className="text-chess-accent text-sm mt-3">{friendMsg}</p>}
                        </div>

                        {/* Friends List */}
                        <div className="glass-panel rounded-3xl p-6">
                            <h3 className="text-white font-bold uppercase tracking-wider mb-4 text-sm flex items-center gap-2">
                                <svg className="w-5 h-5 text-chess-board" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                Friends ({friendsList.length})
                            </h3>
                            {friendsList.length === 0 ? (
                                <div className="text-center text-chess-muted text-sm py-8 opacity-60">
                                    <p>No friends yet. Add someone by email!</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {friendsList.map((friend, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-chess-darker/40 rounded-2xl border border-white/5 hover:border-white/10 transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-chess-board/20 flex items-center justify-center text-white font-bold uppercase">{friend.name[0]}</div>
                                                <div>
                                                    <div className="text-white font-bold">{friend.name}</div>
                                                    <div className="text-chess-muted text-xs">{friend.email}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
