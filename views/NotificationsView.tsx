
import React from 'react';
import { Notification } from '../types';
import { MegaphoneIcon, UserCircleIcon, ChatBubbleOvalLeftEllipsisIcon } from '../components/Icons';

interface NotificationsViewProps {
  notifications: Notification[];
  onAnnouncementClick: () => void;
  onBorrowDecision: (notificationId: string, resourceId: string | undefined, approved: boolean) => void;
}

const NotificationIcon: React.FC<{ type: Notification['type'] }> = ({ type }) => {
    const iconStyles = "h-8 w-8 text-white p-1.5 rounded-full flex-shrink-0";
    switch(type) {
        case 'comment': return <div className={`bg-green-500 ${iconStyles}`}><ChatBubbleOvalLeftEllipsisIcon /></div>;
        case 'borrow_request': return <div className={`bg-blue-500 ${iconStyles}`}><UserCircleIcon /></div>;
        case 'borrow_response': return <div className={`bg-purple-500 ${iconStyles}`}><UserCircleIcon /></div>;
        default: return <div className={`bg-gray-400 ${iconStyles}`}><UserCircleIcon /></div>;
    }
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ notifications, onAnnouncementClick, onBorrowDecision }) => {
  return (
    <div className="text-brand-dark">
      <div className="p-4 border-b">
        <h2 className="text-2xl font-bold">Notifications</h2>
      </div>

      <div className="p-4">
        <button onClick={onAnnouncementClick} className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-lg mb-4">
            <div className="flex items-center space-x-3">
                <MegaphoneIcon className="h-6 w-6 text-brand-blue" />
                <span className="font-semibold">Official Announcements</span>
            </div>
            <span className="text-xs font-bold text-white bg-red-500 rounded-full px-2 py-0.5">NEW</span>
        </button>
      </div>

      <ul className="divide-y divide-gray-100">
        {notifications.filter(n => n.type !== 'announcement' && n.type !== 'admin').map(notif => (
          <li key={notif.id} className="p-4 hover:bg-gray-50 flex items-start space-x-4">
            <NotificationIcon type={notif.type} />
            <div className="flex-1">
              <p className="text-sm text-gray-800">{notif.message}</p>
               {notif.type === 'borrow_request' && notif.borrower && (
                 <div className="mt-2 p-2 bg-gray-100 rounded-lg">
                    <p className="text-xs font-semibold">Requester: {notif.borrower.name}</p>
                    <p className="text-xs">Trust Score: {notif.borrower.trustScore}</p>
                 </div>
               )}
              <p className="text-xs text-gray-500 mt-1">{notif.timestamp}</p>
              {notif.type === 'borrow_request' && !notif.processed && (
                <div className="flex space-x-2 mt-3">
                    <button 
                        onClick={() => onBorrowDecision(notif.id, notif.resourceId, true)}
                        className="px-3 py-1 text-xs font-bold text-white bg-green-500 rounded-full hover:bg-green-600"
                    >
                        Approve
                    </button>
                    <button 
                        onClick={() => onBorrowDecision(notif.id, notif.resourceId, false)}
                        className="px-3 py-1 text-xs font-bold text-white bg-red-500 rounded-full hover:bg-red-600"
                    >
                        Reject
                    </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

// FIX: Added default export for React.lazy compatibility.
export default NotificationsView;