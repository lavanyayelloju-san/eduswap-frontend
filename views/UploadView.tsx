import React, { useState } from 'react';
import { CameraIcon, CalendarDaysIcon } from '../components/Icons';
import { Resource } from '../types';

interface UploadViewProps {
  onUpload: (resourceData: Omit<Resource, 'id' | 'owner' | 'comments'>) => void;
}

export const UploadView: React.FC<UploadViewProps> = ({ onUpload }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [course, setCourse] = useState('');
  const [subject, setSubject] = useState('');
  const [itemType, setItemType] = useState<Resource['itemType']>('Notes');
  const [resourceType, setResourceType] = useState<Resource['resourceType']>('Digital');
  const [meetupLocation, setMeetupLocation] = useState('');
  const [deadline, setDeadline] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
      setFilePreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const resourceData: Omit<Resource, 'id' | 'owner' | 'comments'> = {
      title, description, course, subject, itemType, resourceType,
      availability: 'Available',
      imageUrl: file && !file.type.includes('pdf') ? filePreview : undefined,
      fileUrl: file && file.type.includes('pdf') ? filePreview : undefined,
      fileMimeType: file ? file.type : undefined,
      meetupLocation: resourceType === 'Physical' ? meetupLocation : undefined,
      deadline: resourceType === 'Physical' ? deadline : undefined,
      tags: [course, subject, itemType].filter(Boolean),
    };
    onUpload(resourceData);
  };

  return (
    <div className="p-4 bg-white m-4 rounded-xl shadow-sm border border-gray-100">
       <div className="text-left mb-6">
          <h1 className="text-2xl font-bold text-brand-dark">Upload a Resource</h1>
          <p className="text-gray-500 mt-1">Share your study materials with the community.</p>
        </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Upload File or Cover Image</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              {filePreview ? (
                <img src={filePreview} alt="Preview" className="mx-auto h-24 w-auto object-contain rounded-md" />
              ) : (
                <CameraIcon className="mx-auto h-12 w-12 text-gray-400" />
              )}
              <div className="flex text-sm text-gray-600 justify-center">
                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-brand-blue hover:text-brand-blue-light focus-within:outline-none">
                  <span>{file ? 'Change file' : 'Select a file'}</span>
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                </label>
                 {file && <p className="pl-1">({file.name})</p>}
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g., Advanced AI Concepts" className="mt-1 block w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue bg-gray-50 text-brand-dark" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} required placeholder="Describe the resource, its condition, edition, etc." className="mt-1 block w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue bg-gray-50 text-brand-dark" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Course</label>
            <input type="text" placeholder="e.g., CSE" value={course} onChange={e => setCourse(e.target.value)} required className="mt-1 block w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue bg-gray-50 text-brand-dark" />
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-700">Subject</label>
            <input type="text" placeholder="e.g., Data Structures" value={subject} onChange={e => setSubject(e.target.value)} required className="mt-1 block w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue bg-gray-50 text-brand-dark" />
          </div>
        </div>
        
        {resourceType === 'Physical' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">Meetup Location</label>
              <input type="text" placeholder="e.g., Library Entrance, Block A" value={meetupLocation} onChange={e => setMeetupLocation(e.target.value)} required className="mt-1 block w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue bg-gray-50 text-brand-dark" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Borrow Deadline</label>
                <div className="relative mt-1">
                    <input 
                        type="date" 
                        value={deadline} 
                        onChange={e => setDeadline(e.target.value)} 
                        required 
                        className={`block w-full p-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue bg-gray-50 ${deadline ? 'text-brand-dark' : 'text-gray-500'}`}
                        style={{colorScheme: 'light'}}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                    </div>
                </div>
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Item Type</label>
          <select value={itemType} onChange={e => setItemType(e.target.value as Resource['itemType'])} className="mt-1 block w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue bg-gray-50 text-brand-dark">
            <option>Notes</option> <option>Textbook</option> <option>Lab Equipment</option> <option>Past Papers</option> <option>Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Resource Type</label>
          <div className="flex space-x-4 mt-2">
            <label className="flex items-center text-brand-dark font-medium"><input type="radio" name="resourceType" value="Digital" checked={resourceType === 'Digital'} onChange={() => setResourceType('Digital')} className="mr-2 text-brand-blue focus:ring-brand-blue" /> Digital</label>
            <label className="flex items-center text-brand-dark font-medium"><input type="radio" name="resourceType" value="Physical" checked={resourceType === 'Physical'} onChange={() => setResourceType('Physical')} className="mr-2 text-brand-blue focus:ring-brand-blue" /> Physical</label>
          </div>
        </div>

        <button type="submit" className="w-full py-3 bg-brand-blue text-white rounded-lg font-semibold hover:bg-brand-blue-light transition-colors">
          Submit Resource
        </button>
      </form>
    </div>
  );
};

export default UploadView;