import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

export interface TopMatch {
  skill: string;
  score: number;
}

function getScoreColor(score: number) {
  if (score >= 0.80) return { bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.4)', text: '#4ade80', glow: 'rgba(34, 197, 94, 0.25)' };
  if (score >= 0.60) return { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)', text: '#fbbf24', glow: 'rgba(245, 158, 11, 0.25)' };
  return { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)', text: '#f87171', glow: 'rgba(239, 68, 68, 0.25)' };
}

interface FloatingPillProps {
  topMatch: TopMatch | null;
}

const FloatingPill = ({ topMatch }: FloatingPillProps) => {
  const colors = topMatch ? getScoreColor(topMatch.score) : null;
  const percentage = topMatch ? Math.round(topMatch.score * 100) : 0;

  return (
    <AnimatePresence>
      {topMatch && colors && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-24 right-8 z-50 pointer-events-auto"
          style={{
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            borderRadius: '9999px',
            padding: '10px 20px',
            backdropFilter: 'blur(16px)',
            boxShadow: `0 0 24px ${colors.glow}, 0 4px 12px rgba(0,0,0,0.3)`,
          }}
        >
          <div className="flex items-center gap-3">
            <Zap size={14} style={{ color: colors.text }} />
            <span className="text-sm font-medium text-text-bright tracking-wide">
              {topMatch.skill}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{
              background: colors.bg,
              color: colors.text,
              border: `1px solid ${colors.border}`,
            }}>
              {percentage}% match
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingPill;
