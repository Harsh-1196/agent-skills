import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, CornerDownLeft, Terminal } from 'lucide-react';

interface CommandInputProps {
  onSendMessage: (text: string) => void;
  isTyping: boolean;
}

const CommandInput: React.FC<CommandInputProps> = ({ onSendMessage, isTyping }) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isTyping) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  useEffect(() => {
    const handleGlobalKey = (_e: KeyboardEvent) => {
      if (document.activeElement?.tagName !== 'INPUT' && !window.getSelection()?.toString()) {
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl z-20 font-mono">
      <form onSubmit={handleSubmit} className="w-full bg-[#08080C] border border-white/5 rounded-lg p-2 pr-2 pl-6 flex items-center gap-4 shadow-2xl transition-colors hover:border-white/10">
        <Terminal className="w-5 h-5 text-[var(--color-primary-accent)]" />
        
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isTyping}
          placeholder={isTyping ? "OVERRIDE LOCKED: STREAM ACTIVE..." : "EXECUTE COMMAND OR INQUIRY..."}
          className="flex-1 bg-transparent border-none outline-none text-gray-300 text-xs placeholder:text-gray-600 tracking-wider disabled:opacity-50"
        />

        <Paperclip className="w-5 h-5 text-gray-600 hover:text-white cursor-pointer transition-colors" />

        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="bg-[var(--color-primary-accent)] text-black px-6 py-2.5 rounded-sm text-xs font-bold tracking-widest flex items-center gap-2 hover:bg-cyan-300 disabled:opacity-50 disabled:bg-gray-700 disabled:text-gray-500 transition-colors"
        >
          SUBMIT <CornerDownLeft className="w-3 h-3" />
        </button>
      </form>

      <div className="mt-4 text-center text-[8px] text-gray-600 tracking-[0.2em] font-mono">
        END-TO-END ENCRYPTED SESSION // NODE: ALPHA-7 // STATUS: SYNCHRONIZED
      </div>
    </div>
  );
};
export default CommandInput;
