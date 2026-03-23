import { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import type { Message as ChatMessage } from './components/ChatArea';
import AnalysisPanel from './components/AnalysisPanel';

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: 1, 
      sender: 'ai', 
      text: 'Initializing neural handshake...\n\nWelcome to the Skill-Sync Monolith. I am currently operating at 92% match capacity for your current context. How shall we proceed with the data synthesis?', 
      timestamp: 'NOW',
      skills: ['Core_Logic']
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const formatTimestamp = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
  };

  const handleSendMessage = useCallback(async (text: string) => {
    const userMsg: ChatMessage = { 
      id: Date.now(), 
      sender: 'user', 
      text, 
      timestamp: formatTimestamp() 
    };
    setMessages(prev => [...prev, userMsg]);
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
        const aiMsg: ChatMessage = { 
          id: aiMessageId, 
          sender: 'ai', 
          text: "", 
          timestamp: formatTimestamp() 
        };
        setMessages(prev => [...prev, aiMsg]);
        setIsTyping(false);

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
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        sender: 'ai', 
        text: "ERR_CONNECTION_REFUSED. FAILED TO SYNC WITH MONOLITH_CORE.",
        timestamp: formatTimestamp()
      }]);
      setIsTyping(false);
    }
  }, []);

  return (
    <div className="flex h-screen w-full bg-bg-dark text-text-bright overflow-hidden">
      <Sidebar />
      <ChatArea 
        messages={messages} 
        isTyping={isTyping} 
        onSendMessage={handleSendMessage} 
      />
      <AnalysisPanel />
    </div>
  );
}

export default App;
