import React from 'react';
import { motion } from 'framer-motion';
import { Users, MousePointer, MessageCircle, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
            <Icon size={24} className="text-white" />
        </div>
        <p className="text-slate-400 text-sm">{label}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
);

const Dashboard = () => {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-[#0f172a] text-white p-6 font-sans">
            <div className="max-w-6xl mx-auto">
                <header className="mb-10 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Creator Dashboard</h1>
                        <p className="text-slate-400">Welcome back, {user?.username}</p>
                    </div>
                    <Link to="/admin/auto-dm" className="bg-[#00ff9d] text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-[#00cc7d] transition">
                        Create Automation
                    </Link>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <StatCard icon={Users} label="Total Followers" value="0" color="bg-blue-500" />
                    <StatCard icon={MousePointer} label="Link Clicks" value="0" color="bg-purple-500" />
                    <StatCard icon={MessageCircle} label="Auto DMs Sent" value="0" color="bg-[#00ff9d]" />
                    <StatCard icon={TrendingUp} label="Engagement Rate" value="0%" color="bg-pink-500" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-slate-800/30 border border-slate-700 rounded-2xl p-6">
                        <h3 className="font-bold mb-4">Recent Activity</h3>
                        <div className="text-slate-500 text-sm">No recent activity</div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-6 border border-indigo-500/30 relative overflow-hidden">
                        <h3 className="font-bold text-xl mb-2 relative z-10">Pro Features ⚡</h3>
                        <p className="text-slate-300 text-sm mb-6 relative z-10">Upgrade to unlock detailed analytics and unlimited automations.</p>
                        <button className="w-full bg-white text-indigo-900 font-bold py-3 rounded-xl relative z-10">Upgrade Now</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
