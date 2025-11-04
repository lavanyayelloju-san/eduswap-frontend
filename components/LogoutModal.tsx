import React from 'react';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmLogout: () => void;
}

const LogoutModal: React.FC<LogoutModalProps> = ({ isOpen, onClose, onConfirmLogout }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold text-brand-dark mb-2">Confirm Logout</h2>
          <p className="text-gray-600 mb-6">Are you sure you want to log out?</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 border rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirmLogout}
              className="flex-1 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
