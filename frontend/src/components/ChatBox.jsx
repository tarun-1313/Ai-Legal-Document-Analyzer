import { useState } from 'react';
import { Volume2 } from 'lucide-react';

const speak = (text, lang = 'en') => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === 'en' ? 'en-US' : lang;
  window.speechSynthesis.speak(utterance);
};

// Tailwind styled chat UI component
export default function ChatBox({ onSend, loading, language }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');

    // Call backend via prop
    const response = await onSend(input, newMessages);
    const botMsg = { role: 'assistant', content: response };
    setMessages([...newMessages, botMsg]);
  };

  return (
    <div className="flex flex-col h-full bg-[#0f1117] text-white rounded-3xl shadow-2xl">
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <div className="p-4 bg-primary/10 rounded-full">
              <Volume2 className="text-primary w-12 h-12" />
            </div>
            <p className="text-sm max-w-xs">Ask anything about the document. I can explain clauses and risks in your regional language.</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}
          >
            <div
              className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed relative group ${
                msg.role === 'user' 
                  ? 'bg-primary text-white rounded-tr-none' 
                  : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-none'
              } whitespace-pre-wrap`}
            >
              {msg.content}
              {msg.role === 'assistant' && (
                <button 
                  onClick={() => speak(msg.content, language)}
                  className="absolute -right-10 top-2 p-2 bg-white/5 hover:bg-primary/20 rounded-xl text-primary opacity-0 group-hover:opacity-100 transition-all"
                  title="Listen"
                >
                  <Volume2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-primary animate-pulse">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="p-4 bg-white/5 border-t border-white/10 flex items-center gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 bg-white/5 border border-white/10 text-white text-sm rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-6 py-3 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-sm font-bold rounded-2xl transition-all shadow-lg shadow-primary/20"
        >
          Send
        </button>
      </form>
    </div>
  );
}
