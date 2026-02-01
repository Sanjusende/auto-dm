import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Instagram, Send, Plus, CheckCircle, Smartphone } from 'lucide-react';

const AutoDM = () => {
    const API_URL = import.meta.env.VITE_API_URL;
    const [step, setStep] = useState(1); // 1: Connect, 2: Select Reel, 3: Configure, 4: Success
    const [user, setUser] = useState(null);
    const [reels, setReels] = useState([]);
    const [selectedReel, setSelectedReel] = useState(null);
    const [keyword, setKeyword] = useState('');
    const [message, setMessage] = useState('');
    const [automations, setAutomations] = useState([]);

    const [searchParams, setSearchParams] = useSearchParams();
    const { user: appUser, login } = useAuth(); // rename user to appUser to avoid conflict

    useEffect(() => {
        fetchAutomations();

        // Check for Instagram connection params (Legacy/Fallback)
        const connected = searchParams.get('connected');
        const token = searchParams.get('token');
        const igUser = searchParams.get('username');
        const igId = searchParams.get('ig_id');

        if (connected && token && igUser) {
            saveInstagramConnection(token, igUser, igId);
        } else if (appUser && appUser.instagramUsername) {
            // If already connected in DB
            setUser({ username: appUser.instagramUsername, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${appUser.instagramUsername}` });
            setStep(2);
            fetchReels();
        }

        // Listen for Popup Message
        const handleMessage = (event) => {
            // Security check: Match origin if needed, or check structure
            // For local dev, we might be loose, but better to check
            if (event.origin !== API_URL) {
                // in development, API_URL is localhost:5000, but frontend is 5173.
                // The message comes from the POPUP which is on API_URL (eventually) or ...
                // Actually, the popup is on API_URL domain when it sends the message.
            }

            const { token, username, instagramId, error } = event.data;
            if (token && username) {
                saveInstagramConnection(token, username, instagramId);
            } else if (error) {
                alert('Instagram Login Failed: ' + error);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);

    }, [searchParams, appUser, API_URL]);

    const getAuthHeaders = () => {
        const token = Cookies.get('token');
        return { Authorization: `Bearer ${token}` };
    };

    const saveInstagramConnection = async (token, igUser, igId) => {
        try {
            await axios.post(`${API_URL}/api/instagram/save`, {
                instagramId: igId,
                instagramAccessToken: token,
                instagramUsername: igUser
            }, { headers: getAuthHeaders() });
            setUser({ username: igUser, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${igUser}` });
            setStep(2);
            fetchReels();
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);

            // Reload page to ensure AuthContext updates with new user data if needed
            // window.location.reload(); 
        } catch (err) {
            console.error('Failed to save connection', err);
            alert('Failed to save connection: ' + (err.response?.data?.message || err.message));
        }
    };

    const fetchReels = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/instagram/media`, { headers: getAuthHeaders() });
            setReels(res.data);
        } catch (err) {
            console.error('Failed to fetch reels', err);
        }
    };

    const fetchAutomations = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/automations`, { headers: getAuthHeaders() });
            setAutomations(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const connectInstagram = () => {
        // Open Popup for Backend Auth
        const width = 600;
        const height = 700;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;
        window.open(`${API_URL}/api/instagram/auth`, 'Instagram Login', `width=${width},height=${height},top=${top},left=${left}`);
    };

    const handleCreateAutomation = async () => {
        try {
            await axios.post(`${API_URL}/api/automations`, {
                reelId: selectedReel.id,
                reelThumbnail: selectedReel.thumbnail,
                triggerKeyword: keyword,
                dmMessage: message
            }, {
                headers: getAuthHeaders()
            });
            fetchAutomations();
            setStep(4);
        } catch (err) {
            alert('Failed to save: ' + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-white p-6 font-sans">
            <div className="max-w-4xl mx-auto">
                <header className="mb-10 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#00ff9d] to-blue-500 bg-clip-text text-transparent">
                            Auto DM Automation
                        </h1>
                        <p className="text-slate-400 mt-2">Turn comments into conversations automatically.</p>
                    </div>
                    {user && (
                        <div className="flex items-center gap-3 bg-slate-800 p-2 rounded-full border border-slate-700">
                            <img src={user.avatar} className="w-8 h-8 rounded-full" alt="Profile" />
                            <span className="text-sm font-medium pr-2">@{user.username}</span>
                            <button onClick={connectInstagram} className="px-3 py-1 bg-blue-600 rounded-full text-xs font-bold hover:bg-blue-500">
                                Reconnect
                            </button>
                        </div>
                    )}
                </header>

                {/* Existing Automations */}
                {automations.length > 0 && step === 1 && (
                    <div className="mb-10">
                        <h2 className="text-xl font-semibold mb-4">Active Automations</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {automations.map(auto => (
                                <div key={auto._id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex gap-4">
                                    <img src={auto.reelThumbnail} className="w-16 h-24 object-cover rounded-lg" alt="Reel" />
                                    <div>
                                        <h3 className="font-bold text-[#00ff9d]">Trigger: "{auto.triggerKeyword}"</h3>
                                        <p className="text-slate-400 text-sm mt-1 line-clamp-2">{auto.dmMessage}</p>
                                        <div className="mt-2 flex items-center gap-2 text-xs text-blue-400">
                                            <Send size={12} /> Auto DM Active
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 1: Connect */}
                {step === 1 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-slate-800/30 rounded-3xl border border-slate-700 border-dashed">
                        <div className="w-20 h-20 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                            <Instagram size={40} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-bold mb-4">Connect your Instagram</h2>
                        <p className="text-slate-400 max-w-md mx-auto mb-8">
                            We need permission to read your comments and send messages on your behalf.
                        </p>
                        <button
                            onClick={connectInstagram}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-blue-500/25"
                        >
                            Connect with Facebook/Instagram
                        </button>
                    </motion.div>
                )}

                {/* Step 2: Select Reel */}
                {step === 2 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h2 className="text-xl font-semibold mb-6">Select a Reel to Automate</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {reels.map(reel => (
                                <div
                                    key={reel.id}
                                    onClick={() => { setSelectedReel(reel); setStep(3); }}
                                    className="group cursor-pointer relative aspect-[9/16] rounded-xl overflow-hidden border border-transparent hover:border-[#00ff9d] transition-all"
                                >
                                    <img src={reel.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Reel" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-3">
                                        <p className="text-white text-sm font-medium truncate">{reel.caption}</p>
                                        <p className="text-slate-400 text-xs flex items-center gap-1 mt-1">
                                            <Smartphone size={10} /> {(reel.plays || 0).toLocaleString()} views
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Step 3: Configure */}
                {step === 3 && selectedReel && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl mx-auto">
                        <div className="flex items-center gap-4 mb-8">
                            <img src={selectedReel.thumbnail} className="w-16 h-24 object-cover rounded-lg border border-slate-700" alt="Selected" />
                            <div>
                                <p className="text-sm text-slate-400">Selected Reel</p>
                                <p className="font-medium text-white line-clamp-1">{selectedReel.caption}</p>
                            </div>
                            <button onClick={() => setStep(2)} className="text-xs text-blue-400 hover:underline ml-auto">Change</button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Trigger Keyword</label>
                                <input
                                    type="text"
                                    value={keyword}
                                    onChange={e => setKeyword(e.target.value.toUpperCase())}
                                    placeholder="e.g. GUIDE"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff9d]"
                                />
                                <p className="text-xs text-slate-500 mt-2">If a user comments this specific word, the DM will be sent.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">DM Message</label>
                                <textarea
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    placeholder="Hey! Here is the link you asked for: https://..."
                                    className="w-full h-32 bg-slate-800 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff9d]"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setStep(2)}
                                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-medium transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleCreateAutomation}
                                    disabled={!keyword || !message}
                                    className="flex-1 py-3 bg-[#00ff9d] hover:bg-[#00cc7d] text-slate-900 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Activate Automation
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Step 4: Success */}
                {step === 4 && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
                            <CheckCircle size={40} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Automation Active! 🚀</h2>
                        <p className="text-slate-400 mb-8">
                            Anyone who comments <strong>"{keyword}"</strong> on your reel will receive the DM.
                        </p>
                        <button
                            onClick={() => { setStep(1); setKeyword(''); setMessage(''); setSelectedReel(null); }}
                            className="bg-slate-800 hover:bg-slate-700 py-3 px-8 rounded-xl font-medium"
                        >
                            Create Another
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default AutoDM;
