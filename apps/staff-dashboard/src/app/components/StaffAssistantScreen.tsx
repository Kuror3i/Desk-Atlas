import { useState } from 'react';
import { Send, MessageSquare, Sparkles, Lightbulb } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function StaffAssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        'Hello! I\'m your operational assistant. I can help you with questions about reservation handling, session management, workspace policies, QR code issues, and operational procedures. How can I assist you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');

  const suggestedQuestions = [
    'How do we handle a reservation that does not appear in the system?',
    'What should we do if a user\'s preferred space is no longer available?',
    'What is the process for delayed arrivals?',
    'What if a QR code is valid but checkout fails?',
    'How do I assist a walk-in customer?',
    'What are the steps for handling a no-show?',
  ];

  const mockResponses: Record<string, string> = {
    reservation:
      'If a reservation doesn\'t appear in the system:\n\n1. Ask the user for their confirmation email or reservation code\n2. Use the Record Search feature to look up by email or name\n3. Check if the reservation is for a different date or time\n4. If found, verify the details and proceed with check-in\n5. If not found, check with the member directly or create a walk-in session\n6. Document the issue in the notes for admin review',
    space:
      'When a user\'s preferred space is unavailable:\n\n1. Check the reservation for listed alternatives\n2. Offer the alternative spaces first\n3. If alternatives are also unavailable, check the Workspace Status map for similar available spaces in the same zone\n4. Explain the situation to the user and get their approval for the alternative\n5. Update the reservation record with the new workspace assignment\n6. Document the change in the session notes',
    delayed:
      'Process for delayed arrivals:\n\n1. Check if the reservation is still within the grace period (typically 15-30 minutes)\n2. If within grace period, proceed with normal check-in\n3. If beyond grace period but user contacted ahead, note the exception and check them in\n4. If no prior contact and significantly delayed, check workspace availability\n5. If original workspace is now reserved for another user, follow the alternative space procedure\n6. Document the delay in the session notes',
    qr: 'If a QR code is valid but checkout fails:\n\n1. First, try the checkout process again to rule out temporary system issues\n2. Check the Active Sessions screen to verify the session exists and is active\n3. Verify the QR code matches the correct session ID\n4. If the issue persists, manually complete the checkout through the staff dashboard\n5. Note the QR failure in the session record\n6. Report the technical issue to the admin or IT team for investigation',
    walkin:
      'To assist a walk-in customer:\n\n1. Check the Workspace Status map for available spaces\n2. Ask the customer for their preferred workspace type (desk, meeting room, etc.)\n3. Verify availability for their desired time duration\n4. Create a walk-in session through the system\n5. Assign the workspace and generate a QR code or reference\n6. Explain workspace rules, check-out procedures, and amenities\n7. Complete payment processing if applicable',
    noshow:
      'Steps for handling a no-show:\n\n1. Wait for the standard grace period to expire (typically 15-30 minutes after reservation start)\n2. Attempt to contact the user via phone or email if contact info is available\n3. If no response, mark the reservation as "No Show" in the system\n4. Release the workspace back to available status\n5. Document the no-show in the reservation notes\n6. The no-show will be tracked for potential future policies or member standing\n7. Inform admin if this is a repeat occurrence',
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...messages, userMessage]);

    setTimeout(() => {
      let responseContent =
        'I understand your question. Based on our operational procedures, here are the recommended steps:\n\n';

      const query = inputValue.toLowerCase();
      if (query.includes('reservation') && query.includes('appear')) {
        responseContent += mockResponses.reservation;
      } else if (query.includes('space') || query.includes('available')) {
        responseContent += mockResponses.space;
      } else if (query.includes('delayed') || query.includes('late')) {
        responseContent += mockResponses.delayed;
      } else if (query.includes('qr') || query.includes('checkout')) {
        responseContent += mockResponses.qr;
      } else if (query.includes('walk-in') || query.includes('walkin')) {
        responseContent += mockResponses.walkin;
      } else if (query.includes('no-show') || query.includes('no show')) {
        responseContent += mockResponses.noshow;
      } else {
        responseContent =
          'I can help you with that. Here are the general guidelines:\n\n1. First, verify all relevant information in the system (reservation details, session status, workspace availability)\n2. Check our standard operating procedures for similar situations\n3. Document any exceptions or issues for admin review\n4. Prioritize customer service while following operational policies\n5. When in doubt, consult with a senior staff member or admin\n\nWould you like more specific guidance on any particular aspect?';
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    }, 800);

    setInputValue('');
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
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
        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-3xl ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user' ? 'bg-[#b2dfdb]' : 'bg-purple-100'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <span className="text-sm font-medium text-[#009689]">ST</span>
                    ) : (
                      <MessageSquare className="w-4 h-4 text-purple-600" />
                    )}
                  </div>

                  <div
                    className={`rounded-lg p-4 ${
                      message.role === 'user' ? 'bg-[#009689] text-white' : 'bg-gray-50 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p
                      className={`text-xs mt-2 ${message.role === 'user' ? 'text-[#b2dfdb]' : 'text-gray-500'}`}
                    >
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask a question about operational procedures..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 space-y-6">
          {/* Suggested Questions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              <h2 className="font-semibold text-gray-900">Suggested Questions</h2>
            </div>
            <div className="space-y-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuestion(question)}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm text-gray-700"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h3 className="font-semibold text-purple-900 mb-2">About This Assistant</h3>
            <p className="text-sm text-purple-800 mb-3">
              This RAG-based assistant provides operational guidance based on documented procedures and best practices.
            </p>
            <ul className="space-y-2 text-sm text-purple-800">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-0.5">•</span>
                <span>Ask about reservation handling</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-0.5">•</span>
                <span>Get help with session management</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-0.5">•</span>
                <span>Learn about QR code troubleshooting</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-0.5">•</span>
                <span>Understand workspace policies</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
