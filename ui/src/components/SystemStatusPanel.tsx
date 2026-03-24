import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Database, Zap } from 'lucide-react';

const SystemStatusPanel: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8 }}
      className="hidden md:flex gap-6 items-center p-3 px-6 glass-panel rounded-full text-sm"
    >
      <div className="flex items-center gap-2">
        <Database className="w-4 h-4 text-cyan-400" />
        <span className="text-gray-400">Model:</span>
        <span className="text-cyan-300 font-mono">Kaushal AI-v4 (Gemini Core)</span>
      </div>
      
      <div className="w-[1px] h-6 bg-cyan-900/50"></div>
      
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-saffron-400 text-[var(--color-secondary-accent)]" />
        <span className="text-gray-400">Memory:</span>
        <span className="text-[var(--color-secondary-accent)] font-mono">1.2TB Active</span>
      </div>
      
      <div className="w-[1px] h-6 bg-cyan-900/50"></div>
      
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-green-400 animate-pulse" />
        <span className="text-green-400 font-mono text-xs uppercase tracking-widest">Updating</span>
      </div>
    </motion.div>
  );
};

export default SystemStatusPanel;
