import React from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';

const LinkCard = ({ link, isUnlocked, onClick }) => {
    const IconComponent = Icons[link.icon] || Icons.Link;

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => onClick(link)}
            className={`
        relative w-full max-w-md p-4 mb-4 rounded-xl cursor-pointer border
        backdrop-blur-md transition-all duration-300
        flex items-center justify-between
        ${link.isLocked && !isUnlocked
                    ? 'bg-slate-900/60 border-slate-700/50 hover:bg-slate-800/60'
                    : 'bg-slate-800/40 border-slate-600/30 hover:bg-slate-700/50 hover:border-[#00ff9d]/50 hover:shadow-[0_0_15px_rgba(0,255,157,0.1)]'}
      `}
        >
            <div className="flex items-center space-x-4">
                <div className={`
          p-2 rounded-lg 
          ${link.isLocked && !isUnlocked ? 'bg-slate-800 text-slate-400' : 'bg-slate-700/50 text-[#00ff9d]'}
        `}>
                    <IconComponent size={24} />
                </div>
                <span className="text-white font-medium text-lg tracking-wide">
                    {link.title}
                </span>
            </div>

            {link.isLocked && !isUnlocked && (
                <div className="text-slate-400">
                    <Icons.Lock size={20} />
                </div>
            )}
        </motion.div>
    );
};

export default LinkCard;
