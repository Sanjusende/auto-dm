import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CheckCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import LinkCard from './LinkCard';

const ProfilePage = () => {
    const { username } = useParams();
    const [profileUser, setProfileUser] = useState(null);
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unlockedLinks, setUnlockedLinks] = useState(new Set());
    const [selectedLink, setSelectedLink] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationSuccess, setVerificationSuccess] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!username) return;
            try {
                setLoading(true);
                const res = await axios.get(`http://localhost:5000/api/public/${username}`);
                setProfileUser(res.data.user);
                setLinks(res.data.links);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [username]);

    const handleLinkClick = (link) => {
        if (link.isLocked && !unlockedLinks.has(link._id)) {
            setSelectedLink(link);
        } else {
            window.open(link.url, '_blank');
        }
    };

    const handleFollow = () => {
        // Simulate opening Instagram
        window.open(`https://instagram.com/${profileUser?.username}`, '_blank');

        // Simulate verification
        setIsVerifying(true);
        setTimeout(() => {
            setIsVerifying(false);
            setVerificationSuccess(true);

            // Unlock after success message
            setTimeout(() => {
                setUnlockedLinks(prev => new Set(prev).add(selectedLink._id));
                window.open(selectedLink.url, '_blank');
                closeModal();
            }, 1500);
        }, 2000);
    };

    const closeModal = () => {
        setSelectedLink(null);
        setVerificationSuccess(false);
        setIsVerifying(false);
    };

    if (loading) return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
            <Loader2 className="animate-spin text-[#00ff9d]" size={48} />
        </div>
    );

    if (!profileUser) return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white p-4 text-center">
            <div>
                <h1 className="text-2xl font-bold mb-2">User not found 😕</h1>
                <p className="text-slate-400">The profile you are looking for does not exist.</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center py-10 px-4 font-sans">
            {/* Profile Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center mb-8"
            >
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#00ff9d] to-blue-500 p-[2px] mb-4">
                    <div className="w-full h-full rounded-full bg-[#0f172a] flex items-center justify-center overflow-hidden">
                        <img
                            src={profileUser.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=techinformer"}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
                <h1 className="text-2xl font-bold tracking-tight">{profileUser.username}</h1>
                <p className="text-slate-400 text-sm mt-1">@{profileUser.username}</p>
                <p className="text-center text-slate-300 mt-4 max-w-sm leading-relaxed">
                    Sharing tips on Tech, Coding & AI. 🚀 <br />
                    Follow to unlock exclusive resources below! 👇
                </p>
            </motion.div>

            {/* Links List */}
            <div className="w-full max-w-md flex flex-col items-center">
                {links.length === 0 ? (
                    <p className="text-slate-500 italic">No links added yet.</p>
                ) : (
                    links.map(link => (
                        <LinkCard
                            key={link._id}
                            link={link}
                            isUnlocked={unlockedLinks.has(link._id)}
                            onClick={handleLinkClick}
                        />
                    ))
                )}
            </div>

            {/* Footer */}
            <footer className="mt-12 text-slate-600 text-xs text-center">
                <p>Powered by Super Profile Clone</p>
            </footer>

            {/* Lock Modal */}
            <AnimatePresence>
                {selectedLink && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={closeModal}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-[#1e293b] border border-slate-700 w-full max-w-sm rounded-2xl p-6 text-center shadow-2xl relative overflow-hidden"
                        >
                            {/* Decorative background glow */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#00ff9d]/20 blur-3xl rounded-full -z-10" />

                            {!isVerifying && !verificationSuccess && (
                                <>
                                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-[#00ff9d]">
                                        <Lock size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Locked Content!</h3>
                                    <p className="text-slate-400 mb-6 leading-relaxed">
                                        This resource is locked. Follow <span className="text-[#00ff9d]">@{profileUser.username}</span> on Instagram to unlock it.
                                    </p>

                                    <button
                                        onClick={handleFollow}
                                        className="w-full bg-[#00ff9d] hover:bg-[#00cc7d] text-slate-900 font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        I have Followed
                                    </button>
                                    <button
                                        onClick={closeModal}
                                        className="mt-4 text-slate-500 text-sm hover:text-slate-300 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </>
                            )}

                            {isVerifying && (
                                <div className="py-8">
                                    <Loader2 size={48} className="animate-spin text-[#00ff9d] mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-white">Verifying Follow...</h3>
                                    <p className="text-slate-500 text-sm mt-2">Please wait a moment</p>
                                </div>
                            )}

                            {verificationSuccess && (
                                <div className="py-8">
                                    <div className="w-16 h-16 bg-[#00ff9d]/20 rounded-full flex items-center justify-center mx-auto mb-4 text-[#00ff9d]">
                                        <CheckCircle size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Success! ✅</h3>
                                    <p className="text-slate-400">Unlocking content...</p>
                                </div>
                            )}

                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProfilePage;
