import React, { useState } from 'react';
import { EduSwapLogo } from '../components/Icons';
import { ProgressIndicator } from '../components/ProgressIndicator';

interface SignupViewProps {
  onSignup: () => void;
  onBackToLogin: () => void;
}

export const SignupView: React.FC<SignupViewProps> = ({ onSignup, onBackToLogin }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="p-4 sm:p-8 flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-sm mx-auto">
            <div className="text-center mb-6">
                <EduSwapLogo className="h-10 w-10 mx-auto text-brand-blue mb-3" />
                <h1 className="text-2xl font-bold text-brand-dark">Create Your Account</h1>
                <p className="text-xs text-gray-400 mt-1">Samskruti College of Engineering and Technology</p>
            </div>
            
            <ProgressIndicator currentStep={1} />

            <div className="w-full bg-white p-8 rounded-2xl shadow-md mt-6">
                <div className="space-y-4">
                    <input placeholder="Full Name" className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue text-brand-dark bg-primary-light"/>
                    <input placeholder="Username" className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue text-brand-dark bg-primary-light"/>
                    <input placeholder="Email" type="email" className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue text-brand-dark bg-primary-light"/>
                    <input placeholder="Roll Number (e.g., 23259-AI-070)" className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue text-brand-dark bg-primary-light"/>
                    <div className="relative">
                        <input placeholder="Password" type={showPassword ? "text" : "password"} className="w-full p-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue text-brand-dark bg-primary-light"/>
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500">
                            <i className={showPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i>
                        </button>
                    </div>
                </div>
                <button onClick={onSignup} className="w-full py-3 mt-6 bg-brand-blue text-white rounded-lg font-semibold hover:bg-brand-blue-light transition-colors">
                    Continue
                </button>
                 <p className="text-center text-sm text-gray-600 mt-6">
                    Already have an account?{' '}
                    <button onClick={onBackToLogin} className="font-semibold text-brand-blue hover:underline">Log In</button>
                </p>
            </div>
        </div>
    </div>
  );
};

export default SignupView;