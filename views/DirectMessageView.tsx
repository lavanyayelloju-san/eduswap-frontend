import React from 'react';
import { Conversation, User } from '../types';

interface DirectMessageViewProps {
  conversations: Conversation[];
  currentUser: User;
  onBack: () => void;
  onConversationClick: (conversation: Conversation) => void;
}

export const DirectMessageView: React.FC<DirectMessageViewProps> = ({ conversations, onBack, onConversationClick }) => {
  return (
    <div>
      <div className="sticky top-16 bg-white/90 backdrop-blur-md p-4 border-b border-gray-100 z-10 flex items-center">
        <button onClick={onBack} className="text-brand-blue mr-4">
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <h2 className="text-xl font-bold text-brand-dark">Direct Messages</h2>
      </div>
      <div className="p-4">
        {conversations.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {conversations.map(convo => (
              <li key={convo.id}>
                <button onClick={() => onConversationClick(convo)} className="w-full p-2 -mx-2 flex items-center space-x-4 text-left cursor-pointer hover:bg-gray-50 rounded-lg">
                  <img src={convo.participant.avatarUrl} alt={convo.participant.name} className="h-12 w-12 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-brand-dark">{convo.participant.name}</p>
                    <p className="text-sm text-gray-500 truncate">{convo.lastMessage}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500 mt-16">Your conversations will appear here.</p>
        )}
      </div>
    </div>
  );
};

export default DirectMessageView;