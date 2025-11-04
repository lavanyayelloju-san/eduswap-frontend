import React, { useState } from 'react';
import { CameraIcon } from '../components/Icons';
import { ProgressIndicator } from '../components/ProgressIndicator';

interface IdVerificationViewProps {
    onVerificationComplete: (idCardUrl: string) => void;
}

export const IdVerificationView: React.FC<IdVerificationViewProps> = ({ onVerificationComplete }) => {
    const [idPreview, setIdPreview] = useState<string | null>(null);
    const [pin, setPin] = useState('');

    const handleIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const objectUrl = URL.createObjectURL(file);
            setIdPreview(objectUrl);
        }
    };
    
    return (
        <div className="p-8 flex flex-col items-center justify-center min-h-screen bg-white">
            <div className="w-full max-w-sm mx-auto">
                <ProgressIndicator currentStep={3} />
                <div className="text-center mt-8">
                    <h1 className="text-3xl font-bold text-brand-dark mb-2">Final Step!</h1>
                    <p className="text-gray-500 mb-8">Secure your account & verify your ID.</p>
                </div>
                <div className="w-full bg-white p-8 rounded-2xl shadow-lg">
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md mb-6">
                        <div className="space-y-1 text-center">
                             {idPreview ? (
                                <img src={idPreview} alt="ID Preview" className="mx-auto h-32 w-auto object-contain rounded-md" />
                            ) : (
                                <CameraIcon className="mx-auto h-12 w-12 text-gray-400" />
                            )}
                            <div className="flex text-sm text-gray-600 justify-center">
                                <label htmlFor="id-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-brand-blue hover:text-brand-blue-light focus-within:outline-none">
                                    <span>Upload your College ID</span>
                                    <input id="id-upload" name="id-upload" type="file" className="sr-only" accept="image/*" onChange={handleIdChange} />
                                </label>
                            </div>
                            <p className="text-xs text-gray-500">Must be a clear photo</p>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="pin" className="block text-sm font-medium text-gray-700 text-left mb-2">Set a 4-Digit PIN</label>
                        <input 
                            type="password" 
                            id="pin" 
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            maxLength={4}
                            placeholder="****"
                            className="w-full p-3 mb-6 text-center tracking-[1em] border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue text-brand-dark bg-primary-light" 
                        />
                    </div>
                    <button 
                        onClick={() => onVerificationComplete(idPreview!)} 
                        disabled={!idPreview || pin.length !== 4}
                        className="w-full py-3 bg-brand-blue text-white rounded-lg font-semibold hover:bg-brand-blue-light transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        Complete Sign Up
                    </button>
                </div>
            </div>
        </div>
    );
};

// FIX: Added default export for React.lazy compatibility.
export default IdVerificationView;