

import React from 'react';
import { Resource } from '../types';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: Resource | null;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, resource }) => {
  if (!isOpen || !resource) return null;

  const isPdf = resource.fileUrl && resource.fileMimeType === 'application/pdf';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg h-[90vh] flex flex-col transition-transform duration-300 transform animate-scale-up" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-brand-dark truncate pr-4">{resource.title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl flex-shrink-0">&times;</button>
        </div>
        
        <div className="p-4 flex-1 overflow-auto">
          {isPdf ? (
             <iframe src={resource.fileUrl} className="w-full h-full" title={resource.title}></iframe>
          ) : resource.imageUrl ? (
            <img src={resource.imageUrl} alt={resource.title} className="w-full h-auto rounded-md object-contain" />
          ) : (
            <div className="text-center p-8 text-gray-500">
              <p>No preview available for this digital resource.</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex space-x-2">
           <button onClick={onClose} className="flex-1 border border-brand-blue text-brand-blue p-3 rounded-lg hover:bg-primary-light transition-colors font-semibold">
            Close
          </button>
          {resource.fileUrl && (
             <a href={resource.fileUrl} download target="_blank" rel="noopener noreferrer" className="flex-1 text-center bg-brand-blue text-white p-3 rounded-lg hover:bg-brand-blue-light transition-colors font-semibold">
                Download
             </a>
          )}
        </div>
      </div>
       <style>{`
        @keyframes scale-up {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-up { animation: scale-up 0.3s ease-out; }
        `}</style>
    </div>
  );
};

// FIX: Added default export for React.lazy compatibility.
export default PreviewModal;