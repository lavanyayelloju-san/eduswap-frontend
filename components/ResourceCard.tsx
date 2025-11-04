// FIX: Implemented the ResourceCard component to display resource details.
import React, { useState, useRef, useEffect } from 'react';
import { Resource, User } from '../types';
import { BookmarkIcon, CalendarDaysIcon, ChatBubbleOvalLeftEllipsisIcon, EllipsisVerticalIcon, EyeIcon } from './Icons';
import { TrustBadge } from './TrustBadge';

interface ResourceCardProps {
  resource: Resource;
  currentUser: User | null;
  onCommentClick: (resource: Resource) => void;
  onSaveClick: (resourceId: string) => void;
  onPreviewClick: (resource: Resource) => void;
  onProfileClick: (user: User) => void;
  onBorrowClick: (resource: Resource) => void;
  onReportClick: (resource: Resource) => void;
  onDeleteClick: (resourceId: string) => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource, currentUser, onCommentClick, onSaveClick, onPreviewClick, onProfileClick, onBorrowClick, onReportClick, onDeleteClick }) => {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isSaved = currentUser?.savedItems?.includes(resource.id);
  const isOwner = currentUser?.id === resource.owner.id;
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);


  const renderActionButton = () => {
    if (isOwner) {
      return <span className="text-sm font-bold text-gray-500 px-4 py-2">It's yours!</span>;
    }

    if (resource.resourceType === 'Digital') {
      return (
          <a href={resource.fileUrl} download target="_blank" rel="noopener noreferrer" className="text-sm font-bold bg-green-500 text-white px-4 py-2 rounded-full hover:bg-green-600">
            Download
          </a>
      );
    }
    
    // Physical resource logic
    switch (resource.availability) {
      case 'Available':
        return <button onClick={() => onBorrowClick(resource)} className="text-sm font-bold bg-brand-blue text-white px-4 py-2 rounded-full hover:bg-brand-blue-light">Request Borrow</button>;
      case 'Pending Approval':
        return <button disabled className="text-sm font-bold bg-yellow-500 text-white px-4 py-2 rounded-full cursor-not-allowed">Pending</button>;
      case 'Borrowed':
        return <button disabled className="text-sm font-bold bg-gray-400 text-white px-4 py-2 rounded-full cursor-not-allowed">Borrowed</button>;
      default:
        return null;
    }
  };
  
  const tagColors: { [key: string]: string } = {
    'Digital': 'bg-green-100 text-green-800',
    'Physical': 'bg-yellow-100 text-yellow-800',
    'Notes': 'bg-purple-100 text-purple-800',
    'Textbook': 'bg-indigo-100 text-indigo-800',
    'CSE': 'bg-blue-100 text-blue-800',
    'Data Structures': 'bg-green-100 text-green-800',
    'default': 'bg-gray-100 text-gray-800'
  }

  const getTagColor = (tag: string) => {
    return tagColors[tag] || tagColors['default'];
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <button onClick={() => onProfileClick(resource.owner)} className="flex items-center space-x-3 text-left">
            <img src={resource.owner.avatarUrl} alt={resource.owner.name} className="h-10 w-10 rounded-full object-cover" />
            <div>
              <p className="font-bold text-sm text-brand-dark">{resource.owner.name}</p>
              <p className="text-xs text-gray-500">@{resource.owner.username}</p>
            </div>
          </button>
          <div className="flex items-center space-x-2">
            <TrustBadge score={resource.owner.trustScore} />
             <div className="relative">
                <button onClick={() => setMenuOpen(!isMenuOpen)} className="text-gray-500 hover:text-gray-800 p-1 rounded-full">
                    <EllipsisVerticalIcon className="h-5 w-5" />
                </button>
                {isMenuOpen && (
                    <div ref={menuRef} className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                        <ul className="py-1">
                            {isOwner ? (
                                <li><button onClick={() => { onDeleteClick(resource.id); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Delete Resource</button></li>
                            ) : (
                                <li><button onClick={() => { onReportClick(resource); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Report Resource</button></li>
                            )}
                        </ul>
                    </div>
                )}
             </div>
          </div>
        </div>
        <h3 className="font-bold text-lg text-brand-dark my-2">{resource.title}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-3">{resource.description}</p>
        
        {resource.resourceType === 'Physical' && resource.deadline && (
            <div className="flex items-center space-x-2 text-xs text-gray-500 my-3">
                <CalendarDaysIcon className="h-4 w-4" />
                <span>Return by: {new Date(resource.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
        )}

        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getTagColor(resource.course)}`}>{resource.course}</span>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getTagColor(resource.subject)}`}>{resource.subject}</span>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getTagColor(resource.itemType)}`}>{resource.itemType}</span>
           <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getTagColor(resource.resourceType)}`}>{resource.resourceType}</span>
        </div>
      </div>
      {resource.imageUrl && (
        <div className="w-full">
            <img src={resource.imageUrl} alt={resource.title} className="w-full h-48 object-cover" />
        </div>
      )}
      <div className="p-4 border-t flex justify-between items-center bg-gray-50">
        <div className="flex space-x-4 items-center">
          <button onClick={() => onCommentClick(resource)} className="flex items-center space-x-1 text-gray-600 hover:text-brand-blue">
            <ChatBubbleOvalLeftEllipsisIcon className="h-5 w-5" />
            <span className="text-sm font-semibold">{resource.comments.length}</span>
          </button>
          <button onClick={() => onSaveClick(resource.id)} className={`flex items-center space-x-1 ${isSaved ? 'text-brand-blue' : 'text-gray-600'} hover:text-brand-blue`}>
            <BookmarkIcon className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
            <span className="text-sm font-semibold">Save</span>
          </button>
          {(resource.imageUrl || resource.fileUrl) && (
            <button onClick={() => onPreviewClick(resource)} className="flex items-center space-x-1 text-gray-600 hover:text-brand-blue">
                <EyeIcon className="h-5 w-5" />
                <span className="text-sm font-semibold">Preview</span>
            </button>
          )}
        </div>
        <div>
          {renderActionButton()}
        </div>
      </div>
    </div>
  );
};

export default ResourceCard;