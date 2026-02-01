import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Shield, Smartphone, ArrowRight } from 'lucide-react';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-[#0f172a] text-white font-sans overflow-hidden">
            {/* Navbar */}
            <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
                <div className="text-2xl font-bold bg-gradient-to-r from-[#00ff9d] to-blue-500 bg-clip-text text-transparent">
                    SuperProfile
                </div>
                <div className="flex gap-4">
                    <Link to="/login" className="text-slate-300 hover:text-white font-medium px-4 py-2 transition-colors">
                        Login
                    </Link>
                    <Link to="/signup" className="bg-[#00ff9d] text-slate-900 font-bold px-6 py-2 rounded-full hover:bg-[#00cc7d] transition-transform hover:scale-105">
                        Get Started
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative max-w-7xl mx-auto px-6 pt-20 pb-32 text-center">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#00ff9d]/20 blur-[120px] rounded-full -z-10" />

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8"
                >
                    The Ultimate <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ff9d] to-blue-500">Link-in-Bio</span>
                    Platform.
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
                >
                    Turn your followers into customers. Lock exclusive content, automate DMs, and grow your audience with a profile that works as hard as you do.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                    <Link to="/signup" className="flex items-center justify-center gap-2 bg-white text-slate-900 font-bold text-lg px-8 py-4 rounded-full hover:bg-slate-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                        Create Your Profile <ArrowRight size={20} />
                    </Link>
                    <Link to="/demo-user" className="flex items-center justify-center gap-2 bg-slate-800 text-white font-bold text-lg px-8 py-4 rounded-full border border-slate-700 hover:bg-slate-700 transition-all">
                        View Design Demo
                    </Link>
                </motion.div>
            </header>

            {/* Features Grid */}
            <section className="bg-slate-900/50 py-24 border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-12">
                        <FeatureCard
                            icon={Smartphone}
                            title="Mobile First"
                            desc="Looks exactly like a native app. Glassmorphism design system included."
                        />
                        <FeatureCard
                            icon={Shield}
                            title="Follow to Unlock"
                            desc="Grow your followers by locking exclusive links behind a follow gate."
                        />
                        <FeatureCard
                            icon={Zap}
                            title="Auto DM Automation"
                            desc="Automatically send resources when people comment on your Reels."
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 text-center text-slate-600 border-t border-slate-800">
                <p>&copy; 2024 SuperProfile. All rights reserved.</p>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon: Icon, title, desc }) => (
    <div className="bg-[#0f172a] p-8 rounded-3xl border border-slate-800 hover:border-[#00ff9d]/30 transition-all hover:-translate-y-2">
        <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 text-[#00ff9d]">
            <Icon size={28} />
        </div>
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-slate-400 leading-relaxed">{desc}</p>
    </div>
);

export default LandingPage;
