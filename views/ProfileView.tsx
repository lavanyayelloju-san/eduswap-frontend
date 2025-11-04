// FIX: Implemented the ProfileView component to display the current user's profile, stats, and shared resources.
import React from 'react';
import { User, Resource } from '../types';
import { PencilSquareIcon, BookmarkIcon, ShieldCheckIcon, ArrowRightOnRectangleIcon, DocumentTextIcon } from '../components/Icons';
import { ResourceCard } from '../components/ResourceCard';
import { TrustBadge } from '../components/TrustBadge';

interface ProfileViewProps {
  currentUser: User;
  userResources: Resource[];
  onEditProfile: () => void;
  onViewSavedItems: () => void;
  onSecurity: () => void;
  onLogout: () => void;
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

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser, userResources, onEditProfile, onViewSavedItems, onSecurity, onLogout,
  onCommentClick, onSaveClick, onPreviewClick, onProfileClick, onBorrowClick, onReportClick, onTermsClick, onDeleteClick
}) => {

  return (
    <div className="bg-gray-50 min-h-screen text-brand-dark">
      {/* Profile Header */}
      <div className="p-4 bg-white">
        <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
                <img src={currentUser.avatarUrl} alt={currentUser.name} className="h-20 w-20 rounded-full object-cover" />
                <div>
                    <h2 className="text-2xl font-bold">{currentUser.name}</h2>
                    <p className="text-sm text-gray-500">@{currentUser.username} &bull; {currentUser.rollNumber}</p>
                    <p className="text-sm text-gray-600 mt-1">{currentUser.course}</p>
                </div>
            </div>
            <TrustBadge score={currentUser.trustScore} />
        </div>
        <p className="text-sm text-gray-700 mt-4">{currentUser.bio}</p>
        <button onClick={onEditProfile} className="mt-4 w-full flex items-center justify-center space-x-2 py-2 border rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors">
            <PencilSquareIcon className="h-4 w-4" />
            <span>Edit Profile</span>
        </button>
      </div>

      {/* Stats */}
      <div className="p-4 grid grid-cols-3 gap-4 bg-white border-t border-b">
        <ProfileStat value={userResources.length} label="Shared" />
        <ProfileStat value={currentUser.savedItems.length} label="Saved" />
        <ProfileStat value={currentUser.trustScore} label="Trust Score" />
      </div>

      {/* Menu */}
      <div className="mt-4 bg-white">
        <button onClick={onViewSavedItems} className="w-full flex justify-between items-center p-4 text-left border-b hover:bg-gray-50">
          <div className="flex items-center space-x-3">
            <BookmarkIcon className="h-6 w-6 text-gray-600" />
            <span className="font-semibold">Saved Items</span>
          </div>
          <i className="fa-solid fa-chevron-right text-gray-400"></i>
        </button>
        <button onClick={onSecurity} className="w-full flex justify-between items-center p-4 text-left border-b hover:bg-gray-50">
          <div className="flex items-center space-x-3">
            <ShieldCheckIcon className="h-6 w-6 text-gray-600" />
            <span className="font-semibold">Security</span>
          </div>
          <i className="fa-solid fa-chevron-right text-gray-400"></i>
        </button>
        <button onClick={onTermsClick} className="w-full flex justify-between items-center p-4 text-left border-b hover:bg-gray-50">
          <div className="flex items-center space-x-3">
            <DocumentTextIcon className="h-6 w-6 text-gray-600" />
            <span className="font-semibold">Terms & Conditions</span>
          </div>
          <i className="fa-solid fa-chevron-right text-gray-400"></i>
        </button>
        <button onClick={onLogout} className="w-full flex justify-between items-center p-4 text-left text-red-600 hover:bg-red-50">
          <div className="flex items-center space-x-3">
            <ArrowRightOnRectangleIcon className="h-6 w-6" />
            <span className="font-semibold">Logout</span>
          </div>
        </button>
      </div>

      {/* User's Resources */}
      <div className="p-4 mt-4">
        <h3 className="text-lg font-bold mb-2">My Shared Resources</h3>
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
          <p className="text-center text-gray-500 bg-white p-8 rounded-lg">You haven't shared any resources yet.</p>
        )}
      </div>
    </div>
  );
};

export default ProfileView;