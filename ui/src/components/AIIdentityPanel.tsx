import React from 'react';
import { motion } from 'framer-motion';
import { Cpu } from 'lucide-react';

const AIIdentityPanel: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8 }}
      className="flex items-center gap-4 p-2"
    >
      <div className="relative flex items-center justify-center w-14 h-14 rounded-xl border border-[var(--color-primary-accent)] bg-cyan-950/30 neon-box-cyan">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-2 border border-dashed border-[var(--color-secondary-accent)] rounded-full opacity-50"
        />
        <Cpu className="text-[var(--color-primary-accent)] w-7 h-7 z-10" />
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary-accent)] to-cyan-200 neon-text-cyan uppercase">
          Kaushal AI
        </h1>
        <p className="text-xs text-[var(--color-text-soft)]/70 tracking-wider">
          SELF-LEARNING INTELLIGENCE SYSTEM
        </p>
      </div>
    </motion.div>
  );
};

export default AIIdentityPanel;
