// FIX: Created the EditProfileModal component.
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { boyAvatars, girlAvatars, petAvatars } from '../mockData';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSave: (updatedUser: Partial<User>) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, currentUser, onSave }) => {
  const [name, setName] = useState(currentUser?.name || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [course, setCourse] = useState(currentUser?.course || '');
  const [rollNumber, setRollNumber] = useState(currentUser?.rollNumber || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  
  useEffect(() => {
    if (currentUser) {
        setName(currentUser.name);
        setUsername(currentUser.username);
        setAvatarUrl(currentUser.avatarUrl);
        setCourse(currentUser.course || '');
        setRollNumber(currentUser.rollNumber);
        setBio(currentUser.bio || '');
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const handleSave = () => {
    onSave({ name, username, avatarUrl, course, rollNumber, bio });
    onClose();
  };
  
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatarUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const allAvatars = [...boyAvatars, ...girlAvatars, ...petAvatars];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-xl font-bold text-brand-dark">Edit Profile</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
            <div className="flex flex-col items-center">
                <img src={avatarUrl} alt={name} className="h-24 w-24 rounded-full mb-2 object-cover" />
                <label htmlFor="avatar-upload" className="text-sm font-medium text-brand-blue cursor-pointer hover:underline">
                    Upload Photo
                    <input type="file" id="avatar-upload" className="sr-only" accept="image/*" onChange={handlePhotoUpload}/>
                </label>
            </div>
            
            <div className="text-center">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Or choose an avatar</h4>
                <div className="grid grid-cols-5 gap-2 mt-4">
                    {allAvatars.map(url => (
                        <img 
                            key={url} 
                            src={url} 
                            onClick={() => setAvatarUrl(url)} 
                            alt="Avatar"
                            className={`h-12 w-12 rounded-full cursor-pointer transition-transform transform hover:scale-110 ${avatarUrl === url ? 'ring-2 ring-brand-blue' : ''}`}
                        />
                    ))}
                </div>
            </div>
          
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue bg-primary-light text-brand-dark" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1 block w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue bg-primary-light text-brand-dark" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Course</label>
              <input type="text" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="e.g., Diploma in CSE" className="mt-1 block w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue bg-primary-light text-brand-dark" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Roll Number</label>
              <input type="text" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} className="mt-1 block w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue bg-primary-light text-brand-dark" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Bio</label>
              <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..." className="mt-1 block w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue bg-primary-light text-brand-dark" />
            </div>
        </div>
        <div className="p-4 border-t flex justify-end space-x-2 sticky bottom-0 bg-white rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg font-semibold text-gray-700 hover:bg-gray-100">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-brand-blue text-white rounded-lg font-semibold hover:bg-brand-blue-light">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;