import React, { useEffect, useRef } from 'react';
import { Network, User } from 'lucide-react';
import type { Message } from '../App';
import { motion } from 'framer-motion';

interface OrchestrationStreamProps {
  messages: Message[];
  isTyping: boolean;
}

const OrchestrationStream: React.FC<OrchestrationStreamProps> = ({ messages, isTyping }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 flex flex-col font-mono overflow-y-auto px-4 md:px-8 custom-scrollbar pt-8 pb-32 z-10">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div key={msg.id} className={`flex flex-col w-full ${isUser ? 'items-end' : 'items-start'}`}>
              
              {/* Header */}
              <div className="flex items-center gap-3 mb-2">
                {!isUser && (
                  <div className="w-6 h-6 bg-white/5 border border-white/10 rounded-sm flex items-center justify-center">
                    <Network className="w-3 h-3 text-[var(--color-primary-accent)]" />
                  </div>
                )}
                {isUser && (
                   <span className="text-[10px] font-bold tracking-widest text-[#A855F7] uppercase">AUTHORIZED_USER</span>
                )}
                {!isUser && (
                   <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">SYNAPSE_NODE_01</span>
                )}
                {isUser && (
                  <div className="w-6 h-6 bg-[#A855F7]/10 border border-[#A855F7]/30 rounded-sm flex items-center justify-center">
                    <User className="w-3 h-3 text-[#A855F7]" />
                  </div>
                )}
              </div>
              
              {/* Bubble */}
              <div className="bg-[#13141A] border border-white/5 max-w-[85%] rounded-xl p-5 shadow-2xl relative">
                <div className="text-gray-300 text-sm tracking-wide leading-relaxed whitespace-pre-wrap font-sans">
                  {/* Highlight specific structural themes if needed */}
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
           <div className="flex flex-col w-full items-start">
             <div className="flex items-center gap-3 mb-3">
               <div className="w-6 h-6 bg-white/5 border border-white/10 rounded-sm flex items-center justify-center">
                 <Network className="w-3 h-3 text-[var(--color-primary-accent)]" />
               </div>
               <span className="text-[10px] font-bold tracking-widest text-[var(--color-primary-accent)] uppercase">THINKING...</span>
             </div>
             
             <div className="flex items-end gap-1.5 h-6 ml-2">
                {[0, 1, 2, 3].map((bar) => (
                  <motion.div
                    key={bar}
                    className="w-1.5 rounded-sm bg-[#A855F7] shadow-[0_0_8px_#A855F7]"
                    animate={{ height: ["30%", "100%", "30%"] }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: bar * 0.15,
                    }}
                  />
                ))}
             </div>
           </div>
        )}
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
};
export default OrchestrationStream;
