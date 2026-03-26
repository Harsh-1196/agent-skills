import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Terminal } from 'lucide-react';

interface InputBoxProps {
  onSendMessage: (text: string) => void;
  isTyping: boolean;
}

const InputBox: React.FC<InputBoxProps> = ({ onSendMessage, isTyping }) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isTyping) {
      onSendMessage(input.trim());
      setInput('');
      // Optional sound play could be added here
    }
  };

  // Keep focus on input for terminal feel, though optional
  useEffect(() => {
    const handleGlobalKey = (_e: KeyboardEvent) => {
      // Focus if not selecting text
      if (document.activeElement?.tagName !== 'INPUT' && !window.getSelection()?.toString()) {
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  return (
    <div className="relative group p-1 bg-black/50 rounded-xl border border-[var(--color-primary-accent)]/20 hover:border-[var(--color-primary-accent)]/50 transition-colors shadow-lg">
      <div className="absolute inset-0 bg-[var(--color-primary-accent)]/5 blur-xl rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      <form onSubmit={handleSubmit} className="relative flex items-center gap-3 w-full px-4 py-3 bg-[var(--color-primary-base)] rounded-lg">
        <Terminal className="text-[var(--color-primary-accent)] w-5 h-5 opacity-70" />
        
        <div className="flex-1 relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            placeholder={isTyping ? "Processing trajectory..." : "Enter command or query..."}
            className="w-full bg-transparent border-none outline-none text-[var(--color-text-soft)] font-mono text-sm placeholder:text-gray-600 tracking-wide disabled:opacity-50"
          />
          {/* Blinking cursor effect for empty input */}
          {!input && !isTyping && (
            <motion.div 
              className="absolute left-[155px] md:left-[175px] top-[4px] w-2 h-4 bg-[var(--color-primary-accent)]/70 hidden md:block"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            />
          )}
        </div>

        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="relative overflow-hidden p-2 rounded-md bg-[var(--color-primary-accent)]/10 text-[var(--color-primary-accent)] border border-[var(--color-primary-accent)]/40 hover:bg-[var(--color-primary-accent)] hover:text-black hover:shadow-[0_0_15px_rgba(0,245,255,0.6)] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[var(--color-primary-accent)] disabled:hover:shadow-none transition-all duration-300 group/btn"
        >
          {/* Button ripple effect on hover */}
          <span className="absolute inset-0 bg-white/20 scale-0 group-hover/btn:scale-150 transition-transform duration-500 rounded-full" />
          <Send className="w-4 h-4 relative z-10" />
        </button>
      </form>

      {/* Futuristic corner details */}
      <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-[var(--color-primary-accent)]" />
      <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-[var(--color-primary-accent)]" />
    </div>
  );
};

export default InputBox;
