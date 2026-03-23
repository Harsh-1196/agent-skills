import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Orbit, CheckCircle2 } from 'lucide-react';

const skills = [
  { name: 'Predictive Analytics', confidence: 98, usage: '12.4k' },
  { name: 'Cybersecurity Protocols', confidence: 95, usage: '8.9k' },
  { name: 'Sanskrit NLP processing', confidence: 92, usage: '3.1k' },
  { name: 'Quantum Cryptography', confidence: 88, usage: '1.2k' },
  { name: 'Autonomous Strategy', confidence: 85, usage: '4.5k' },
];

const SkillIntelligencePanel: React.FC = () => {
  return (
    <div className="h-full flex flex-col text-[var(--color-text-soft)]">
      
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-[var(--color-secondary-accent)]/30">
        <BrainCircuit className="text-[var(--color-secondary-accent)] w-6 h-6 neon-text-saffron" />
        <h2 className="text-lg font-semibold tracking-wider uppercase text-cyan-100">Learned Skills</h2>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        {skills.map((skill, index) => (
          <motion.div 
            key={skill.name}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="group"
          >
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-medium text-cyan-50 tracking-wide group-hover:text-[var(--color-primary-accent)] transition-colors">
                {skill.name}
              </span>
              <span className="text-xs text-[var(--color-highlight-gold)] font-mono">
                {skill.confidence}%
              </span>
            </div>
            
            {/* Progress Bar Container */}
            <div className="h-1.5 w-full bg-cyan-950/50 rounded-full overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${skill.confidence}%` }}
                transition={{ duration: 1.5, delay: index * 0.2, ease: "easeOut" }}
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-[var(--color-secondary-accent)] to-[var(--color-highlight-gold)] shadow-[0_0_10px_rgba(255,215,0,0.8)]"
              />
            </div>
            
            {/* Metadata */}
            <div className="flex justify-between items-center mt-2 text-[10px] text-gray-500 uppercase font-mono">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                <span>Verified</span>
              </div>
              <div className="flex items-center gap-1">
                <Orbit className="w-3 h-3 text-[var(--color-secondary-accent)] animate-spin-slow" />
                <span>{skill.usage} calls</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-cyan-900/50 flex justify-center">
        <div className="text-xs text-cyan-400/50 flex flex-col items-center">
          <Orbit className="w-4 h-4 mb-1 animate-[spin_4s_linear_infinite]" />
          <span>Real-time Sync Active</span>
        </div>
      </div>
    </div>
  );
};

export default SkillIntelligencePanel;
