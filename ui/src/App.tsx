import { useState } from 'react';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import OrchestrationStream from './components/OrchestrationStream';
import CommandInput from './components/CommandInput';
import ParticleNetwork from './components/ParticleNetwork';

export type Message = {
  id: number;
  sender: 'user' | 'ai';
  text: string;
};

function App() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, sender: 'ai', text: 'Initializing neural handshake...\n\nWelcome to the Monolith. I am currently operating at 24% capacity. All protocols are nominal. Encryption layers are active. How shall we proceed with the data synthesis?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async (text: string) => {
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text }]);
    setIsTyping(true);
    
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text })
      });
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      
      if (reader) {
        const aiMessageId = Date.now() + 1;
        setMessages(prev => [...prev, { id: aiMessageId, sender: 'ai', text: "" }]);
        setIsTyping(false); // Stop typing, start streaming

        let done = false;
        let buffer = "";
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            buffer += decoder.decode(value, { stream: true });
            
            let boundary = buffer.indexOf('\n\n');
            while (boundary !== -1) {
              const chunkStr = buffer.slice(0, boundary);
              buffer = buffer.slice(boundary + 2);
              
              if (chunkStr.startsWith('data: ')) {
                try {
                  const data = JSON.parse(chunkStr.substring(6));
                  setMessages(prev => prev.map(msg => 
                    msg.id === aiMessageId ? { ...msg, text: msg.text + data.chunk } : msg
                  ));
                } catch (e) {
                  // Ignore JSON parse errors natively
                }
              }
              boundary = buffer.indexOf('\n\n');
            }
          }
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: "ERR_CONNECTION_REFUSED. FAILED TO SYNC WITH MONOLITH_CORE." }]);
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#0a0a0f] text-gray-300 font-mono overflow-hidden relative selection:bg-[#00F0FF] selection:text-black">
      {/* Background Layer */}
      <ParticleNetwork />
      
      {/* Top Banner fixed overlay */}
      <TopHeader />
      
      <div className="flex flex-1 pt-16 z-10 w-full relative h-[calc(100vh)]">
        <Sidebar />
         
        <main className="flex-1 relative flex flex-col h-full bg-gradient-to-b from-[#0D0E12]/90 to-[#0a0a0f]/90 backdrop-blur-sm shadow-2xl">
          <OrchestrationStream messages={messages} isTyping={isTyping} />
          
          {/* Floating Action Command Panel */}
          <CommandInput onSendMessage={handleSendMessage} isTyping={isTyping} />
            
          {/* Desktop Right Side Floating Skills */}
          <div className="absolute right-8 top-1/3 w-56 bg-[#12131A] border border-white/5 rounded-lg p-4 font-mono shadow-2xl hidden lg:block">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[9px] text-[var(--color-primary-accent)] font-bold tracking-widest uppercase">ACTIVE_SKILLS</span>
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-accent)] shadow-[0_0_5px_#00F0FF]"></div>
            </div>
            <div className="space-y-3">
              {[
                { icon: '</>', name: 'Compiler_V8' },
                { icon: '⌕', name: 'Data_Miner' },
                { icon: '文', name: 'Lingua_Core' }
              ].map(skill => (
                <div key={skill.name} className="flex items-center gap-3 text-gray-400 group cursor-pointer hover:text-gray-200 transition-colors">
                  <div className="w-6 h-6 bg-white/5 rounded-sm flex items-center justify-center text-[10px] border border-white/5 group-hover:border-white/20 transition-colors font-bold">
                    {skill.icon}
                  </div>
                  <span className="text-xs tracking-wider">{skill.name}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
