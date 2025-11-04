import React, { useState } from 'react';
import { EduSwapLogo } from '../components/Icons';

interface LoginViewProps {
    onLogin: (identifier: string, pass: string) => void;
    onGoToSignup: () => void;
    error: string;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, onGoToSignup, error }) => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(identifier, password);
    };

    return (
        <div className="p-8 flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="text-center">
                <EduSwapLogo className="h-12 w-12 mx-auto text-brand-blue mb-4" />
                <h1 className="text-3xl font-bold text-brand-dark">Welcome Back!</h1>
                <p className="text-gray-500 mt-1">Log in to continue sharing & learning.</p>
                <p className="text-xs text-gray-400 mt-1">Samskruti College of Engineering and Technology</p>
            </div>
            <div className="w-full max-w-sm mx-auto mt-8">
                 <form onSubmit={handleSubmit} className="w-full bg-white p-8 rounded-2xl shadow-md">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username or Email</label>
                        <input 
                            type="text" 
                            placeholder="Username or email" 
                            value={identifier} 
                            onChange={e => setIdentifier(e.target.value)} 
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue text-brand-dark bg-primary-light" 
                            required
                        />
                    </div>
                    <div className="mb-6">
                         <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="••••••••" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                className="w-full p-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue text-brand-dark bg-primary-light" 
                                required
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500">
                                <i className={showPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i>
                            </button>
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
                    
                    <button type="submit" className="w-full py-3 bg-brand-blue text-white rounded-lg font-semibold hover:bg-brand-blue-light transition-colors">Log In</button>
                    
                    <p className="text-center text-sm text-gray-600 mt-6">
                        Don't have an account?{' '}
                        <button type="button" onClick={onGoToSignup} className="font-semibold text-brand-blue hover:underline">Sign Up</button>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default LoginView;