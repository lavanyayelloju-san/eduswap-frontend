// FIX: Implemented the SavedItemsView component.
import React from 'react';
import { Resource, User } from '../types';
import { ResourceCard } from '../components/ResourceCard';

interface SavedItemsViewProps {
  resources: Resource[];
  currentUser: User | null;
  onPreviewClick: (resource: Resource) => void;
  onCommentClick: (resource: Resource) => void;
  onSaveClick: (resourceId: string) => void;
  onProfileClick: (user: User) => void;
  onBorrowClick: (resource: Resource) => void;
  onReportClick: (resource: Resource) => void;
  onBack: () => void;
  onDeleteClick: (resourceId: string) => void;
}


export const SavedItemsView: React.FC<SavedItemsViewProps> = ({ resources, currentUser, onPreviewClick, onBack, onCommentClick, onSaveClick, onProfileClick, onBorrowClick, onReportClick, onDeleteClick }) => {
  return (
    <div>
      <div className="sticky top-16 bg-white/90 backdrop-blur-md p-4 border-b border-gray-100 z-10 flex items-center">
        <button onClick={onBack} className="text-brand-blue mr-4">
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <h2 className="text-xl font-bold text-brand-dark">Saved Items</h2>
      </div>
      <div className="p-4">
        {resources.length > 0 ? (
          <div>
            {resources.map(resource => (
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
        ) : (
          <div className="text-center text-gray-500 mt-16 p-4">
            <i className="fa-regular fa-bookmark text-5xl text-gray-300 mb-4"></i>
            <h3 className="font-semibold text-lg">No Saved Items</h3>
            <p>Tap the save icon on a resource to save it for later.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedItemsView;