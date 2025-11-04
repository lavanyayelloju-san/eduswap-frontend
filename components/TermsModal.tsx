import React from 'react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-xl font-bold text-brand-dark">Terms and Conditions</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
          <h3 className="font-bold">1. Acceptance of Terms</h3>
          <p className="text-sm text-gray-600">By using the EduSwap platform, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the service.</p>
          
          <h3 className="font-bold">2. User Conduct</h3>
          <p className="text-sm text-gray-600">You are solely responsible for the content you post. You agree not to post any material that is illegal, defamatory, or infringes on copyright. All resources must be for educational purposes only.</p>

          <h3 className="font-bold">3. Resource Exchange</h3>
          <p className="text-sm text-gray-600">EduSwap is a platform to facilitate resource sharing. We are not responsible for the condition of physical items or the accuracy of digital content. Users coordinate exchanges at their own risk.</p>

          <h3 className="font-bold">4. Trust Score</h3>
          <p className="text-sm text-gray-600">Your Trust Score is a reflection of your activity and reliability on the platform. EduSwap reserves the right to adjust scores or suspend accounts based on user reports and platform monitoring.</p>

          <h3 className="font-bold">5. Liability</h3>
          <p className="text-sm text-gray-600">EduSwap is not liable for any personal injury, or any lost, stolen, or damaged items that may occur during an exchange. Users agree to take reasonable precautions and arrange meetings in safe, public locations.</p>
        </div>
         <div className="p-4 border-t flex justify-end sticky bottom-0 bg-white rounded-b-2xl">
            <button onClick={onClose} className="px-6 py-2 bg-brand-blue text-white rounded-lg font-semibold hover:bg-brand-blue-light">Close</button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;