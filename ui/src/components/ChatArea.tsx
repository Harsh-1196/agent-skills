import { useState } from 'react';
import { Bell, Settings, HandMetal, ThumbsUp, Copy, Paperclip, Send } from 'lucide-react';

export type Message = {
  id: number;
  sender: 'user' | 'ai' | 'system';
  text: string;
  skills?: string[];
  timestamp: string;
};

const ContextBadge = ({ text, match }: { text: string, match: string }) => (
  <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-full text-xs font-medium">
    <div className="w-4 h-4 text-primary-blue"><HandMetal size={14} /></div>
    <span className="text-text-dim">Context: <span className="text-text-bright">{text}</span> <span className="text-text-dim">({match} Match)</span></span>
  </div>
);

const MessageBubble = ({ role, content, timestamp, skills }: { role: 'user' | 'ai' | 'system', content: string, timestamp: string, skills?: string[] }) => {
  if (role === 'system') {
    return (
      <div className="flex justify-center my-6">
        <div className="flex items-center gap-2 px-4 py-2 glass rounded-full text-xs text-text-dim border border-white/5">
          <div className="w-4 h-4 text-green-400"><ThumbsUp size={14} /></div>
          <span>
            Applied {skills?.map((s, index) => (
              <span key={s}>
                <span className="text-text-bright font-bold">"{s}"</span>
                {index < skills.length - 1 && ' & '}
              </span>
            ))} skills.
          </span>
          <div className="ml-2 cursor-pointer hover:text-white">×</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col mb-8 ${role === 'user' ? 'items-end' : 'items-start'}`}>
      <div className={`max-w-[85%] p-6 rounded-2xl relative ${role === 'user' ? 'glass text-text-bright border-l-2 border-primary-blue/50' : 'bg-surface-light/40 border border-white/5'}`}>
        <p className="leading-relaxed text-[15px] whitespace-pre-wrap">{content}</p>
        
        {role === 'ai' && content.includes("QuickSort") && (
          <div className="mt-4 p-4 bg-black/40 rounded-xl border border-white/5 font-mono text-sm">
            <p className="text-green-400 mb-2">// Pivot Selection Insight</p>
            <p className="text-text-dim italic">To avoid the O(n²) worst-case, modern implementations use <span className="text-text-bright">Median-of-Three</span> or random pivot selection to ensure high probability of balanced splits.</p>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 mt-2 px-2">
        <span className="text-[10px] text-text-dim uppercase tracking-widest">{timestamp}</span>
        {role === 'ai' && (
          <div className="flex gap-2 text-text-dim opacity-50">
            <ThumbsUp size={14} className="cursor-pointer hover:text-white" />
            <Copy size={14} className="cursor-pointer hover:text-white" />
          </div>
        )}
      </div>
    </div>
  );
};

interface ChatAreaProps {
  messages: Message[];
  isTyping: boolean;
  onSendMessage: (text: string) => void;
}

const ChatArea = ({ messages, isTyping, onSendMessage }: ChatAreaProps) => {
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  return (
    <main className="flex-1 flex flex-col bg-bg-dark h-screen overflow-hidden relative">
      {/* Header */}
      <header className="h-20 border-b border-border-subtle flex items-center justify-between px-8 bg-bg-dark/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <h1 className="font-heading font-bold text-2xl">Skill-Sync</h1>
          <ContextBadge text="Algorithm Explanation" match="92%" />
        </div>
        <div className="flex items-center gap-4 text-text-dim">
          <Bell size={22} className="cursor-pointer hover:text-white transition-colors" />
          <Settings size={22} className="cursor-pointer hover:text-white transition-colors" />
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
        <div className="max-w-4xl mx-auto">
          {messages.map((msg) => (
            <MessageBubble 
              key={msg.id}
              role={msg.sender} 
              content={msg.text} 
              timestamp={msg.timestamp}
              skills={msg.skills}
            />
          ))}
          {isTyping && (
            <div className="text-text-dim text-xs animate-pulse px-4">Monolith is thinking...</div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="glass rounded-2xl p-2 flex items-center gap-2 glow-blue">
            <div className="p-3 text-text-dim cursor-pointer hover:text-white">
              <Paperclip size={20} />
            </div>
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask Skill-Sync anything..."
              className="flex-1 bg-transparent border-none outline-none text-text-bright p-3 placeholder:text-text-dim/50"
            />
            <div className="flex items-center gap-4 bg-black/40 px-4 py-2 rounded-xl mr-1">
              <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Think</span>
              <div className="w-12 h-6 bg-primary-blue rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-lg" />
              </div>
            </div>
            <button 
              onClick={handleSend}
              className="bg-primary-blue p-3 rounded-xl hover:opacity-90 transition-opacity"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ChatArea;
