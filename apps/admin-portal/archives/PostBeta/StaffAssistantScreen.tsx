import { useState } from 'react';
import { Send, MessageSquare, Sparkles, Lightbulb } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function StaffAssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (!inputValue.trim()) return;
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: inputValue, timestamp: new Date().toLocaleTimeString() };
    setMessages((m) => [...m, userMessage]);
    setTimeout(() => {
      const assistantMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Mock response from assistant.', timestamp: new Date().toLocaleTimeString() };
      setMessages((m) => [...m, assistantMessage]);
    }, 800);
    setInputValue('');
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Staff Assistant</h1>
            <p className="text-gray-600">AI-powered operational guidance for staff</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        <div className="flex-1 flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-lg p-4 ${message.role === 'user' ? 'bg-[#009689] text-white' : 'bg-gray-50 text-gray-900'}`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs mt-2 text-gray-500">{message.timestamp}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-3">
              <input value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask a question..." className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
              <button onClick={handleSend} className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">Send</button>
            </div>
          </div>
        </div>

        <div className="w-80 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              <h2 className="font-semibold text-gray-900">Suggested Questions</h2>
            </div>
            <div className="space-y-2">
              <button onClick={() => setInputValue('How do we handle a reservation that does not appear in the system?')} className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm text-gray-700">How do we handle a reservation that does not appear in the system?</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
