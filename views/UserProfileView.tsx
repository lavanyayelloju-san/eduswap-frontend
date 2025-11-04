// FIX: Implemented the UserProfileView component to display profiles of other users.
import React from 'react';
import { User, Resource } from '../types';
import { ChatBubbleOvalLeftEllipsisIcon } from '../components/Icons';
import { ResourceCard } from '../components/ResourceCard';
import { TrustBadge } from '../components/TrustBadge';

interface UserProfileViewProps {
  user: User;
  currentUser: User | null;
  userResources: Resource[];
  onBack: () => void;
  onSendMessage: (user: User) => void;
  onCommentClick: (resource: Resource) => void;
  onSaveClick: (resourceId: string) => void;
  onPreviewClick: (resource: Resource) => void;
  onProfileClick: (user: User) => void;
  onBorrowClick: (resource: Resource) => void;
  onReportClick: (resource: Resource) => void;
  onTermsClick: () => void;
  onDeleteClick: (resourceId: string) => void;
}

const ProfileStat: React.FC<{ value: number; label: string }> = ({ value, label }) => (
    <div className="text-center">
        <p className="font-bold text-xl text-brand-dark">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
    </div>
);

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  user, currentUser, userResources, onBack, onSendMessage,
  onCommentClick, onSaveClick, onPreviewClick, onProfileClick, onBorrowClick,
  onReportClick, onTermsClick, onDeleteClick
}) => {

  return (
    <div className="bg-gray-50 min-h-screen text-brand-dark">
      {/* Header with back button */}
      <div className="sticky top-16 bg-white/90 backdrop-blur-md p-4 border-b border-gray-100 z-10 flex items-center">
        <button onClick={onBack} className="text-brand-blue mr-4">
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <h2 className="text-xl font-bold text-brand-dark">{user.name}'s Profile</h2>
      </div>

      {/* Profile Header */}
      <div className="p-4 bg-white">
        <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
                <img src={user.avatarUrl} alt={user.name} className="h-20 w-20 rounded-full object-cover" />
                <div>
                    <h2 className="text-2xl font-bold">{user.name}</h2>
                    <p className="text-sm text-gray-500">@{user.username} &bull; {user.rollNumber}</p>
                    <p className="text-sm text-gray-600 mt-1">{user.course}</p>
                </div>
            </div>
            <TrustBadge score={user.trustScore} />
        </div>
        <p className="text-sm text-gray-700 mt-4">{user.bio}</p>
        {currentUser && currentUser.id !== user.id && (
            <button onClick={() => onSendMessage(user)} className="mt-4 w-full flex items-center justify-center space-x-2 py-2 bg-brand-blue text-white rounded-lg font-semibold text-sm hover:bg-brand-blue-light transition-colors">
                <ChatBubbleOvalLeftEllipsisIcon className="h-5 w-5" />
                <span>Send Message</span>
            </button>
        )}
      </div>
      
      {/* Stats */}
      <div className="p-4 grid grid-cols-2 gap-4 bg-white border-t border-b">
        <ProfileStat value={userResources.length} label="Shared" />
        <ProfileStat value={user.trustScore} label="Trust Score" />
      </div>

      {/* User's Resources */}
      <div className="p-4 mt-4">
        <h3 className="text-lg font-bold mb-2">{user.name}'s Resources</h3>
        {userResources.length > 0 ? (
          userResources.map(resource => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              currentUser={currentUser}
              onCommentClick={onCommentClick}
              onSaveClick={onSaveClick}
              onPreviewClick={onPreviewClick}
              onProfileClick={onProfileClick}
              onBorrowClick={onBorrowClick}
              onReportClick={onReportClick}
              onDeleteClick={onDeleteClick}
            />
          ))
        ) : (
          <p className="text-center text-gray-500 bg-white p-8 rounded-lg">{user.name} hasn't shared any resources yet.</p>
        )}
      </div>

       <div className="p-4 text-center">
            <button onClick={onTermsClick} className="text-xs text-gray-400 hover:underline">
                Terms & Conditions
            </button>
        </div>
    </div>
  );
};

export default UserProfileView;