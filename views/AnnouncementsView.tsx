import React from 'react';
import { Notification } from '../types';
import { MegaphoneIcon } from '../components/Icons';

interface AnnouncementsViewProps {
  notifications: Notification[];
  onBack: () => void;
}

const AnnouncementIcon: React.FC<{ type: Notification['type'] }> = ({ type }) => {
    const iconStyles = "h-6 w-6 text-blue-500";
    return <i className={`fa-solid fa-bullhorn ${iconStyles}`}></i>;
}

export const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({ notifications, onBack }) => {
  const announcements = notifications.filter(n => n.type === 'announcement' || n.type === 'admin');

  return (
    <div className="text-brand-dark">
      <div className="sticky top-16 bg-white/90 backdrop-blur-md p-4 border-b border-gray-100 flex items-center space-x-3">
        <button onClick={onBack} className="text-brand-blue">
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <MegaphoneIcon className="h-7 w-7 text-brand-blue" />
        <h2 className="text-2xl font-bold">Official Announcements</h2>
      </div>
      
      {announcements.length > 0 ? (
        <ul className="divide-y divide-gray-100">
          {announcements.map(notif => (
            <li key={notif.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start space-x-4">
                    <AnnouncementIcon type={notif.type} />
                    <div className="flex-1">
                        <p className="text-sm text-gray-800">{notif.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{notif.timestamp}</p>
                    </div>
                </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="p-8 text-center text-gray-500">
            <MegaphoneIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="font-semibold">No Announcements Yet</h3>
            <p className="text-sm">Check back here for official updates from the Eduswap team.</p>
        </div>
      )}
    </div>
  );
};

// FIX: Added default export for React.lazy compatibility.
export default AnnouncementsView;