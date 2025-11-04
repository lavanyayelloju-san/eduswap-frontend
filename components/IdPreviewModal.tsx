import React from 'react';
import { User } from '../types';

interface IdPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onVerify: (userId: string, approved: boolean) => void;
}

export const IdPreviewModal: React.FC<IdPreviewModalProps> = ({ isOpen, onClose, user, onVerify }) => {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-brand-dark">ID Verification</h2>
          <p className="text-sm text-gray-500">For {user.name} ({user.rollNumber})</p>
        </div>
        <div className="p-4">
          {user.idCardUrl ? (
            <img src={user.idCardUrl} alt={`College ID for ${user.name}`} className="w-full h-auto rounded-md" />
          ) : (
            <p className="text-center text-gray-500">No ID card was uploaded.</p>
          )}
        </div>
        <div className="p-4 border-t flex justify-end space-x-2">
          <button onClick={() => onVerify(user.id, false)} className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600">Reject</button>
          <button onClick={() => onVerify(user.id, true)} className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600">Approve</button>
        </div>
      </div>
    </div>
  );
};

// FIX: Added default export for React.lazy compatibility.
export default IdPreviewModal;