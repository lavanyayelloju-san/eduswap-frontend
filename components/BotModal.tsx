import React, { useState, useRef, useEffect } from 'react';
import { askSwappy } from '../services/geminiService';
import { ChatMessage } from '../types';

interface BotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BotModal: React.FC<BotModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: 'bot', text: 'Hi! I\'m Swappy 🐭. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: ChatMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const botResponse = await askSwappy(input);
      const botMessage: ChatMessage = { sender: 'bot', text: botResponse };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = { sender: 'bot', text: 'Sorry, I had a little trouble connecting. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-3xl shadow-lg w-full max-w-lg h-[80%] flex flex-col transition-transform duration-300 transform animate-slide-up">
        <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white rounded-t-3xl">
          <h2 className="text-xl font-bold text-brand-dark">Chat with Swappy 🐭</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto">
          {messages.map((msg, index) => (
            <div key={index} className={`flex mb-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`rounded-2xl p-3 max-w-xs lg:max-w-md ${msg.sender === 'user' ? 'bg-brand-blue text-white rounded-br-none' : 'bg-gray-200 text-brand-dark rounded-bl-none'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-gray-200 text-brand-dark rounded-2xl p-3 rounded-bl-none">
                <div className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t bg-white sticky bottom-0">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything..."
              className="flex-1 p-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-brand-blue bg-primary-light text-brand-dark"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || input.trim() === ''}
              className="bg-brand-blue text-white p-3 rounded-full hover:bg-brand-blue-light disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
              aria-label="Send message"
            >
              <i className="fa-regular fa-paper-plane text-xl"></i>
            </button>
          </div>
        </div>
      </div>
       <style>{`
        @keyframes slide-up {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
        `}</style>
    </div>
  );
};

// FIX: Added default export for React.lazy compatibility.
export default BotModal;