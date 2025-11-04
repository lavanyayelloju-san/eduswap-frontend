// FIX: Replaced placeholder content with a functional PendingVerificationView component.
import React from 'react';
import { ShieldCheckIcon } from '../components/Icons';

// FIX: Added props interface to accept the onBackToLogin handler.
interface PendingVerificationViewProps {
    onBackToLogin: () => void;
}

export const PendingVerificationView: React.FC<PendingVerificationViewProps> = ({ onBackToLogin }) => {
    return (
        <div className="p-8 flex flex-col items-center justify-center min-h-screen bg-white text-center">
            <ShieldCheckIcon className="h-20 w-20 text-yellow-500 mb-6" />
            <h1 className="text-3xl font-bold text-brand-dark mb-2">Verification Pending</h1>
            <p className="text-gray-500 max-w-sm">
                Your account is currently under review by our team. This usually takes less than 24 hours. We'll notify you once your account is approved.
            </p>
            <button 
                // FIX: Used the onBackToLogin prop for navigation instead of reloading the page.
                onClick={onBackToLogin} 
                className="mt-8 px-6 py-3 bg-brand-blue text-white rounded-lg font-semibold hover:bg-brand-blue-light"
            >
                Back to Login
            </button>
        </div>
    );
};

// FIX: Added default export for React.lazy compatibility.
export default PendingVerificationView;