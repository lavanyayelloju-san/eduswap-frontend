import React from 'react';
import { HomeIcon, PlusCircleIcon, BellIcon, UserCircleIcon, ChatBubbleOvalLeftEllipsisIcon, ShieldCheckIcon } from './Icons';
// FIX: Imported the shared 'View' type as 'AppView' to handle all possible app views for the 'activeView' prop, resolving a type mismatch.
import { User, View as AppView } from '../types';

type View = 'feed' | 'upload' | 'notifications' | 'profile' | 'admin';

interface BottomNavProps {
  activeView: AppView;
  setView: (view: View) => void;
  onSwappyClick: () => void;
  currentUser: User | null;
}

const NavItem: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center text-xs transition-colors ${isActive ? 'text-brand-blue' : 'text-gray-700 hover:text-brand-blue'}`}>
    {icon}
    <span className="mt-1">{label}</span>
  </button>
);

export const BottomNav: React.FC<BottomNavProps> = ({ activeView, setView, onSwappyClick, currentUser }) => {
  const iconClasses = "h-6 w-6";
  const navItems = [
    { view: 'feed', label: 'Home', icon: <HomeIcon className={iconClasses} /> },
    { view: 'swappy', label: 'Swappy', icon: <ChatBubbleOvalLeftEllipsisIcon className={iconClasses} /> },
    { view: 'upload', label: 'Upload', icon: <PlusCircleIcon className="h-8 w-8 text-brand-blue" /> },
    { view: 'notifications', label: 'Alerts', icon: <BellIcon className={iconClasses} /> },
    { view: 'profile', label: 'Profile', icon: <UserCircleIcon className={iconClasses} /> }
  ];

  const isAdmin = currentUser?.email === 'eduswapsmsk@gmail.com';

  if (isAdmin) {
    navItems.push({ view: 'admin', label: 'Admin', icon: <ShieldCheckIcon className={iconClasses} /> });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t z-30 max-w-lg mx-auto">
      <div className="flex justify-around items-center h-full">
        {navItems.map(item => (
          <NavItem 
            key={item.view}
            label={item.label}
            icon={item.view === 'upload' ? <div className="-mt-6 bg-white p-2 rounded-full"><PlusCircleIcon className="h-10 w-10 text-brand-blue" /></div> : item.icon}
            isActive={activeView === item.view}
            onClick={() => {
                if (item.view === 'swappy') {
                    onSwappyClick();
                } else {
                    setView(item.view as View)
                }
            }}
          />
        ))}
      </div>
    </nav>
  );
};

// FIX: Added default export for React.lazy compatibility.
export default BottomNav;