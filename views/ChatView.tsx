import React, { useState, useRef, useEffect } from 'react';
import { Conversation, User } from '../types';

interface ChatViewProps {
  conversation: Conversation;
  currentUser: User;
  onBack: () => void;
  onSendMessage: (conversationId: string, text: string) => void;
}

const ChatView: React.FC<ChatViewProps> = ({ conversation, currentUser, onBack, onSendMessage }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages]);

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(conversation.id, inputText);
      setInputText('');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)]">
      {/* Header */}
      <div className="sticky top-16 bg-white/90 backdrop-blur-md p-3 border-b border-gray-100 z-10 flex items-center">
        <button onClick={onBack} className="text-brand-blue mr-3 p-2">
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <img src={conversation.participant.avatarUrl} alt={conversation.participant.name} className="h-10 w-10 rounded-full" />
        <h2 className="text-lg font-bold text-brand-dark ml-3">{conversation.participant.name}</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        {conversation.messages.map(msg => (
          <div key={msg.id} className={`flex mb-4 ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`rounded-2xl py-2 px-3 max-w-xs lg:max-w-md ${msg.senderId === currentUser.id ? 'bg-brand-blue text-white rounded-br-none' : 'bg-gray-200 text-brand-dark rounded-bl-none'}`}>
              <p className="text-sm">{msg.text}</p>
              <p className={`text-xs text-right mt-1 ${msg.senderId === currentUser.id ? 'text-blue-200' : 'text-gray-500'}`}>{msg.timestamp}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 p-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-brand-blue bg-primary-light text-brand-dark"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="bg-brand-blue text-white p-3 rounded-full hover:bg-brand-blue-light disabled:bg-gray-300 transition-colors"
            aria-label="Send message"
          >
            <i className="fa-regular fa-paper-plane text-xl"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
