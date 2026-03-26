import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const BackgroundEffects: React.FC = () => {
  // Generate random particles
  const particles = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5,
    }));
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Radial Gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,245,255,0.03)_0%,transparent_70%)]" />

      {/* Particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-cyan-400 opacity-20"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            boxShadow: '0 0 10px rgba(0,245,255,0.8)',
          }}
          animate={{
            y: [`${p.y}%`, `${(p.y + 20) % 100}%`, `${p.y}%`],
            x: [`${p.x}%`, `${p.x + (Math.random() * 10 - 5)}%`, `${p.x}%`],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "linear",
            delay: p.delay,
          }}
        />
      ))}

      {/* Mandala Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] text-[var(--color-primary-accent)] mix-blend-screen overflow-hidden">
        <svg viewBox="0 0 100 100" className="w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] animate-[spin_120s_linear_infinite]" fill="none" stroke="currentColor" strokeWidth="0.5">
          <circle cx="50" cy="50" r="48" />
          <circle cx="50" cy="50" r="40" strokeDasharray="2 4" />
          <circle cx="50" cy="50" r="32" />
          <path d="M50 2 L50 98 M2 50 L98 50 M16 16 L84 84 M16 84 L84 16" />
          {/* Subtle petals */}
          <path d="M50 18 Q60 30 50 50 Q40 30 50 18" />
          <path d="M50 82 Q60 70 50 50 Q40 70 50 82" />
          <path d="M18 50 Q30 60 50 50 Q30 40 18 50" />
          <path d="M82 50 Q70 60 50 50 Q70 40 82 50" />
        </svg>
      </div>

      {/* Grid overlay for cyberpunk feel */}
      <div 
        className="absolute inset-0 opacity-10" 
        style={{
          backgroundImage: `linear-gradient(rgba(0, 245, 255, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 245, 255, 0.2) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />
    </div>
  );
};

export default BackgroundEffects;
