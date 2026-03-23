import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Message } from './ChatArea';
import { Bot, User } from 'lucide-react';

interface ChatInterfaceProps {
  messages: Message[];
  isTyping: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, isTyping }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="h-full w-full overflow-y-auto p-4 sm:p-6 space-y-6">
      <AnimatePresence>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
            className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[80%] gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border
                ${msg.sender === 'user' 
                  ? 'border-[var(--color-primary-accent)] bg-cyan-900/40 text-[var(--color-primary-accent)] neon-box-cyan' 
                  : 'border-[var(--color-secondary-accent)] bg-orange-900/40 text-[var(--color-secondary-accent)] neon-box-saffron'
                }
              `}>
                {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>

              {/* Message Bubble */}
              <div className={`p-4 rounded-2xl relative group ${
                msg.sender === 'user'
                  ? 'bg-[var(--color-primary-accent)]/10 border border-[var(--color-primary-accent)]/30 text-cyan-50 rounded-tr-sm'
                  : 'bg-[var(--color-secondary-accent)]/10 border border-[var(--color-secondary-accent)]/30 text-amber-50 rounded-tl-sm'
              }`}>
                {/* Subtle internal glow matching identity */}
                <div className={`absolute inset-0 rounded-2xl opacity-20 transition-opacity group-hover:opacity-40 pointer-events-none 
                  ${msg.sender === 'user' ? 'bg-gradient-to-tr from-[var(--color-primary-accent)] to-transparent' : 'bg-gradient-to-tr from-[var(--color-secondary-accent)] to-transparent'}
                `} />
                
                <p className="relative z-10 leading-relaxed text-sm md:text-base font-medium tracking-wide">
                  {msg.text}
                </p>
                
                {/* Decorative Tech Marks */}
                {msg.sender === 'ai' && (
                  <div className="absolute top-1 right-2 text-[8px] text-[var(--color-secondary-accent)]/50 font-mono tracking-widest">
                    v.4.0.1_CH
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        ))}

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex w-full justify-start"
          >
             <div className="flex max-w-[80%] gap-3 flex-row items-center">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border border-[var(--color-secondary-accent)] bg-orange-900/40 text-[var(--color-secondary-accent)] neon-box-saffron">
                  <Bot size={16} />
              </div>
              <div className="py-2 px-4 rounded-2xl bg-[var(--color-secondary-accent)]/10 border border-[var(--color-secondary-accent)]/30 rounded-tl-sm flex items-center gap-1.5 h-10">
                <motion.div className="w-1.5 h-1.5 bg-[var(--color-highlight-gold)] rounded-full shadow-[0_0_5px_#FFD700]" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0 }} />
                <motion.div className="w-1.5 h-1.5 bg-[var(--color-highlight-gold)] rounded-full shadow-[0_0_5px_#FFD700]" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.2 }} />
                <motion.div className="w-1.5 h-1.5 bg-[var(--color-highlight-gold)] rounded-full shadow-[0_0_5px_#FFD700]" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.4 }} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div ref={bottomRef} className="h-1 text-transparent font-mono text-[8px] opacity-10">sys.EOF</div>
    </div>
  );
};

export default ChatInterface;
