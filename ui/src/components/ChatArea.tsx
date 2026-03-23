import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Settings, HandMetal, ThumbsUp, Copy, Paperclip, Send, Zap, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type Message = {
  id: number;
  sender: 'user' | 'ai' | 'system';
  text: string;
  skills?: string[];
  timestamp: string;
};

interface SkillSuggestion {
  skill: string;
  description: string;
  score: number;
}

function getScoreColor(score: number) {
  if (score >= 0.80) return { text: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/30', bar: 'bg-green-400' };
  if (score >= 0.60) return { text: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30', bar: 'bg-amber-400' };
  return { text: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30', bar: 'bg-red-400' };
}

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

// Skill suggestion card in the typeahead dropdown
const SuggestionCard = ({ suggestion, onClick }: { suggestion: SkillSuggestion, onClick: () => void }) => {
  const colors = getScoreColor(suggestion.score);
  const percentage = Math.round(suggestion.score * 100);

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      onClick={onClick}
      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer hover:scale-[1.01] ${colors.bg} ${colors.border} hover:brightness-125`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Zap size={12} className={colors.text} />
          <span className="text-sm font-bold text-text-bright">{suggestion.skill}</span>
        </div>
        <span className={`text-[10px] font-bold ${colors.text}`}>{percentage}%</span>
      </div>
      <p className="text-[11px] text-text-dim leading-snug line-clamp-1 pl-5">
        {suggestion.description}
      </p>
      {/* Mini score bar */}
      <div className="h-0.5 w-full bg-white/5 rounded-full mt-2 ml-5 max-w-[calc(100%-20px)]">
        <div className={`h-full rounded-full ${colors.bar}`} style={{ width: `${percentage}%` }} />
      </div>
    </motion.button>
  );
};

interface ChatAreaProps {
  messages: Message[];
  isTyping: boolean;
  onSendMessage: (text: string) => void;
}

const ChatArea = ({ messages, isTyping, onSendMessage }: ChatAreaProps) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<SkillSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounced search as user types
  const searchSkills = useCallback(async (query: string) => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch("/api/skills/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() })
      });
      const data = await res.json();
      if (data.matches && data.matches.length > 0) {
        setSuggestions(data.matches);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (e) {
      console.error("Skill search failed:", e);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Trigger debounced search on input change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (inputValue.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      searchSkills(inputValue);
    }, 400); // 400ms debounce

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue, searchSkills]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: SkillSuggestion) => {
    // Inject the skill name as a prompt prefix
    const injectedPrompt = `[Using skill: ${suggestion.skill}] ${inputValue}`;
    onSendMessage(injectedPrompt);
    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <main className="flex-1 flex flex-col bg-bg-dark h-screen overflow-hidden relative">
      {/* Header */}
      <header className="h-20 border-b border-border-subtle flex items-center justify-between px-8 bg-bg-dark/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <h1 className="font-heading font-bold text-2xl">Kaushal AI</h1>
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

      {/* Input Area with Typeahead */}
      <div className="p-8">
        <div className="max-w-4xl mx-auto relative">
          {/* Typeahead Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                ref={suggestionsRef}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-full mb-3 left-0 right-0 z-30"
              >
                <div className="glass rounded-2xl p-3 border border-primary-blue/20 glow-blue">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <div className="flex items-center gap-2">
                      <Zap size={12} className="text-primary-blue" />
                      <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Matching Skills</span>
                    </div>
                    {isSearching && <Loader2 size={12} className="text-primary-blue animate-spin" />}
                  </div>
                  <div className="flex flex-col gap-2">
                    {suggestions.map((s, i) => (
                      <SuggestionCard
                        key={`${s.skill}-${i}`}
                        suggestion={s}
                        onClick={() => handleSuggestionClick(s)}
                      />
                    ))}
                  </div>
                  <p className="text-[9px] text-text-dim/40 text-center mt-2">Click a skill to inject it into your prompt</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Searching indicator (subtle, inline) */}
          {isSearching && !showSuggestions && inputValue.trim().length >= 3 && (
            <div className="absolute bottom-full mb-2 left-4 flex items-center gap-2">
              <Loader2 size={10} className="text-primary-blue animate-spin" />
              <span className="text-[10px] text-text-dim/50">Searching skills...</span>
            </div>
          )}

          <div className="glass rounded-2xl p-2 flex items-center gap-2 glow-blue">
            <div className="p-3 text-text-dim cursor-pointer hover:text-white">
              <Paperclip size={20} />
            </div>
            <input 
              ref={inputRef}
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
                if (e.key === 'Escape') setShowSuggestions(false);
              }}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              placeholder="Ask Kaushal AI anything..."
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
