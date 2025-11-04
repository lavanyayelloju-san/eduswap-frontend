import React from 'react';
import { EduSwapLogo, ChatBubbleOvalLeftEllipsisIcon } from './Icons';

interface HeaderProps {
    onMessageClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMessageClick }) => {
  return (
    <header className="sticky top-0 bg-white/90 backdrop-blur-md p-4 border-b border-gray-100 z-40">
        <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
                <EduSwapLogo className="h-7 w-7" />
                <div>
                    <h1 className="text-xl font-bold text-brand-dark">EduSwap</h1>
                    <p className="text-xs text-gray-500 -mt-1">Samskruti College of Engineering and Technology</p>
                </div>
            </div>
            <div className="flex items-center space-x-4">
                <button onClick={onMessageClick} className="relative text-gray-600 hover:text-brand-blue">
                    <ChatBubbleOvalLeftEllipsisIcon className="h-7 w-7" />
                </button>
            </div>
        </div>
    </header>
  );
};

export default Header;