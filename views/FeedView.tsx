// FIX: Implemented the FeedView component to display a list of resources.
import React, { useState } from 'react';
import { ResourceCard } from '../components/ResourceCard';
import { Resource, User } from '../types';
import { SmartSuggestions } from '../components/SmartSuggestions';

interface FeedViewProps {
  resources: Resource[];
  currentUser: User | null;
  onCommentClick: (resource: Resource) => void;
  onSaveClick: (resourceId: string) => void;
  onPreviewClick: (resource: Resource) => void;
  onProfileClick: (user: User) => void;
  onOpenFilters: () => void;
  onBorrowClick: (resource: Resource) => void;
  onReportClick: (resource: Resource) => void;
  onDeleteClick: (resourceId: string) => void;
}

export const FeedView: React.FC<FeedViewProps> = ({ resources, currentUser, onCommentClick, onSaveClick, onPreviewClick, onProfileClick, onOpenFilters, onBorrowClick, onReportClick, onDeleteClick }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSuggestionClick = (query: string) => {
      setSearchQuery(query);
  };
  
  const filteredResources = resources.filter(resource => 
    resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-4">
      {/* Search and Filter Bar */}
      <div className="flex items-center space-x-2 mb-2">
        <div className="relative flex-1">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input 
                type="text"
                placeholder="Search notes, textbooks..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white p-3 pl-10 border-none rounded-full focus:outline-none focus:ring-2 focus:ring-brand-blue text-brand-dark"
            />
        </div>
        <button onClick={onOpenFilters} className="bg-white p-3 rounded-full text-brand-dark hover:bg-gray-200">
            <i className="fa-solid fa-sliders"></i>
        </button>
      </div>

      <SmartSuggestions resources={resources} onSuggestionClick={handleSuggestionClick} />
      
      <div className="mt-4">
        {filteredResources.map(resource => (
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
        ))}
      </div>
    </div>
  );
};

export default FeedView;