import React, { useState } from 'react';
import { User, Report } from '../types';

interface AdminDashboardViewProps {
  users: User[];
  reports: Report[];
  onViewId: (user: User) => void;
  onPostAnnouncement: (message: string) => void;
  onRemoveResource: (resourceId: string) => void;
  onDismissReport: (reportId: string) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ users, reports, onViewId, onPostAnnouncement, onRemoveResource, onDismissReport }) => {
  const [activeTab, setActiveTab] = useState('verifications');
  const [announcement, setAnnouncement] = useState('');
  
  const pendingUsers = users.filter(u => u.status === 'pending');

  const handlePost = () => {
      if(announcement.trim()) {
          onPostAnnouncement(announcement);
          setAnnouncement('');
          alert('Announcement posted!');
      }
  }

  return (
    <div className="p-4 text-brand-dark">
      <div className="border-b-2 border-gray-200 mb-4">
        <nav className="flex space-x-4">
          <button onClick={() => setActiveTab('verifications')} className={`py-2 px-1 font-semibold ${activeTab === 'verifications' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-gray-500'}`}>Verifications</button>
          <button onClick={() => setActiveTab('reports')} className={`py-2 px-1 font-semibold ${activeTab === 'reports' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-gray-500'}`}>Reports</button>
          <button onClick={() => setActiveTab('announcements')} className={`py-2 px-1 font-semibold ${activeTab === 'announcements' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-gray-500'}`}>Announcements</button>
        </nav>
      </div>
      
      {activeTab === 'verifications' && (
         <div>
            <h3 className="text-xl font-bold mb-3">Pending Verifications ({pendingUsers.length})</h3>
            <div className="bg-white rounded-lg shadow p-4 space-y-3">
              {pendingUsers.length > 0 ? pendingUsers.map(user => (
                <div key={user.id} className="flex justify-between items-center border-b pb-2 last:border-b-0">
                  <div>
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <button onClick={() => onViewId(user)} className="px-3 py-1 text-xs font-bold text-white bg-brand-blue rounded-full hover:bg-brand-blue-light">View ID</button>
                </div>
              )) : <p className="text-gray-500">No pending verifications.</p>}
            </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div>
          <h3 className="text-xl font-bold mb-3">User Reports ({reports.length})</h3>
          <div className="bg-white rounded-lg shadow p-4 space-y-4">
            {reports.length > 0 ? reports.map(report => (
              <div key={report.id} className="border-b pb-3 last:border-b-0">
                <p className="font-semibold">Resource: <span className="font-normal">{report.resource.title}</span></p>
                <p className="text-sm text-gray-600">Reported by: {report.reporter.name}</p>
                <div className="mt-2">
                    <span className="inline-block bg-red-100 text-red-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">{report.reasonCategory}</span>
                </div>
                <p className="text-sm text-gray-800 bg-gray-100 p-2 rounded-md mt-2">{report.reasonDetails}</p>
                <div className="flex space-x-2 mt-3 justify-end">
                  <button onClick={() => onDismissReport(report.id)} className="px-3 py-1 text-xs font-bold text-gray-700 bg-gray-200 rounded-full hover:bg-gray-300">Dismiss</button>
                  <button onClick={() => onRemoveResource(report.resource.id)} className="px-3 py-1 text-xs font-bold text-white bg-red-500 rounded-full hover:bg-red-600">Remove Item</button>
                </div>
              </div>
            )) : <p className="text-gray-500">No active reports.</p>}
          </div>
        </div>
      )}

      {activeTab === 'announcements' && (
         <div>
            <h3 className="text-xl font-bold mb-3">Post an Announcement</h3>
            <div className="bg-white rounded-lg shadow p-4">
                <textarea 
                    rows={5} 
                    value={announcement}
                    onChange={e => setAnnouncement(e.target.value)}
                    placeholder="Type your message to all users here..."
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue bg-gray-50 text-brand-dark"
                />
                <button 
                    onClick={handlePost}
                    className="mt-4 w-full py-3 bg-brand-blue text-white rounded-lg font-semibold hover:bg-brand-blue-light"
                >
                    Post Announcement
                </button>
            </div>
        </div>
      )}

    </div>
  );
};

// FIX: Added default export for React.lazy compatibility.
export default AdminDashboardView;