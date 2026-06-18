import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';

export const ReadinessCopilotPanel: React.FC = () => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', text: string }>>([
    { role: 'assistant', text: 'I am your engineering readiness copilot. How can I help you interpret your placement analytics today?' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages([...messages, { role: 'user', text: input }]);
    const currentInput = input;
    setInput('');

    // Mock API call to AI layer
    setTimeout(() => {
      let reply = "Your core engineering foundations are stable. To improve, focus on verifiable project execution rather than just DSA.";
      if (currentInput.toLowerCase().includes('backend')) {
        reply = "Your backend project maturity lacks infrastructure signals. Consider implementing Redis or a message queue to boost your complexity metrics.";
      } else if (currentInput.toLowerCase().includes('dsa')) {
        reply = "You have excellent medium-difficulty DP progression, but your Graph depth is below the FAANG-focused cohort average.";
      }
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    }, 800);
  };

  return (
    <Card className="flex flex-col h-[500px] bg-slate-900 border border-slate-800 rounded-[24px] overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Readiness Copilot</h3>
            <p className="text-xs text-slate-400 font-medium">Context-aware engineering guidance</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
              msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about your engineering gaps..."
            className="w-full bg-slate-800 border-none text-white text-sm rounded-xl pl-4 pr-12 py-3 focus:ring-1 focus:ring-indigo-500 placeholder-slate-500 outline-none"
          />
          <button 
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-indigo-400 hover:text-indigo-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </form>
      </div>
    </Card>
  );
};
