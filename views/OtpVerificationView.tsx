import React, { useState, useRef } from 'react';
import { ProgressIndicator } from '../components/ProgressIndicator';

interface OtpVerificationViewProps {
    onOtpSuccess: () => void;
}

export const OtpVerificationView: React.FC<OtpVerificationViewProps> = ({ onOtpSuccess }) => {
    const [otp, setOtp] = useState(new Array(6).fill(""));
    const [error, setError] = useState('');
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = (element: HTMLInputElement, index: number) => {
        if (isNaN(Number(element.value))) return; // Only allow numbers

        const newOtp = [...otp];
        newOtp[index] = element.value;
        setOtp(newOtp);

        // Focus next input
        if (element.nextSibling && element.value) {
            (element.nextSibling as HTMLInputElement).focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleSubmit = () => {
        setError('');
        const enteredOtp = otp.join('');
        // In a real app, you would verify this OTP against a backend service.
        // We'll use a mock OTP for this demo.
        if (enteredOtp === "123456") {
            onOtpSuccess();
        } else {
            setError('Invalid OTP. Please try again.');
        }
    };
    
    return (
        <div className="p-8 flex flex-col items-center justify-center min-h-screen bg-white">
            <div className="w-full max-w-sm mx-auto">
                <ProgressIndicator currentStep={2} />
                <div className="text-center mt-8">
                    <h1 className="text-3xl font-bold text-brand-dark mb-2">Verify Your Account</h1>
                    <p className="text-gray-500 mb-8">Enter the 6-digit code sent to your phone (use 123456).</p>
                </div>
                <div className="w-full bg-white p-8 rounded-2xl shadow-lg">
                    <div className="flex justify-center gap-2 mb-6">
                        {otp.map((data, index) => (
                            <input
                                // Fix: Changed the ref callback to use a block body to prevent it from returning a value, which was causing a TypeScript error.
                                ref={el => { inputRefs.current[index] = el; }}
                                key={index}
                                type="text"
                                name="otp"
                                className="w-12 h-14 text-center text-2xl font-bold border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue text-brand-dark bg-primary-light"
                                maxLength={1}
                                value={data}
                                onChange={e => handleChange(e.target, index)}
                                onKeyDown={e => handleKeyDown(e, index)}
                                onFocus={e => e.target.select()}
                            />
                        ))}
                    </div>

                     {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
                     <button 
                        onClick={handleSubmit} 
                        className="w-full py-3 bg-brand-blue text-white rounded-lg font-semibold hover:bg-brand-blue-light transition-colors disabled:bg-gray-300"
                        disabled={otp.join('').length !== 6}
                    >
                        Verify
                    </button>
                    <p className="text-center text-sm text-gray-600 mt-4">
                        Didn't receive the code? <button className="font-semibold text-brand-blue hover:underline">Resend OTP</button>
                    </p>
                </div>
            </div>
        </div>
    );
};

// FIX: Added default export for React.lazy compatibility.
export default OtpVerificationView;