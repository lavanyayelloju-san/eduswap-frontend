import React, { useState } from 'react';
import { Resource } from '../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: Resource | null;
  onSubmit: (resourceId: string, reasonCategory: string, reasonDetails: string) => void;
}

const reportCategories = [
    "Inappropriate Content",
    "Spam or Misleading",
    "Copyright Infringement",
    "Item Not as Described",
    "Harassment or Hate Speech",
    "Other"
];

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, resource, onSubmit }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [details, setDetails] = useState('');

  if (!isOpen || !resource) return null;

  const handleSubmit = () => {
    if (selectedCategory) {
      onSubmit(resource.id, selectedCategory, details);
      setSelectedCategory('');
      setDetails('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-brand-dark">Report Resource</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-700">You are reporting the resource: <span className="font-semibold">{resource.title}</span></p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select a reason</label>
            <div className="space-y-2">
                {reportCategories.map(category => (
                    <label key={category} className="flex items-center p-3 rounded-lg hover:bg-gray-50 border has-[:checked]:bg-blue-50 has-[:checked]:border-brand-blue">
                        <input
                            type="radio"
                            name="report-category"
                            value={category}
                            checked={selectedCategory === category}
                            onChange={() => setSelectedCategory(category)}
                            className="h-4 w-4 text-brand-blue focus:ring-brand-blue"
                        />
                        <span className="ml-3 text-sm font-medium text-gray-800">{category}</span>
                    </label>
                ))}
            </div>
          </div>

          <div>
            <label htmlFor="details" className="block text-sm font-medium text-gray-700">Provide details (optional)</label>
            <textarea
              id="details"
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Please provide any additional information..."
              className="mt-1 block w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue bg-primary-light text-brand-dark"
            />
          </div>
        </div>
        <div className="p-4 border-t flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg font-semibold text-gray-700 hover:bg-gray-100">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!selectedCategory}
            className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 disabled:bg-gray-300"
          >
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;