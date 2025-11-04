import React from 'react';
import { Resource } from '../types';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: Resource | null;
  // FIX: Added onAddComment to props to enable comment submission.
  onAddComment: (resourceId: string, text: string) => void;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({ isOpen, onClose, resource, onAddComment }) => {
  // FIX: Added state for comment input.
  const [commentText, setCommentText] = React.useState('');

  if (!isOpen || !resource) return null;

  // FIX: Implemented handleAddComment to submit a new comment.
  const handleAddComment = () => {
    if (commentText.trim()) {
      onAddComment(resource.id, commentText);
      setCommentText('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50" onClick={onClose}>
        <div className="bg-white rounded-t-3xl shadow-lg w-full max-w-lg h-[80%] flex flex-col transition-transform duration-300 transform animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white rounded-t-3xl">
                <h2 className="text-xl font-bold text-brand-dark">Comments ({resource.comments.length})</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto">
                {resource.comments.map(comment => (
                    <div key={comment.id} className="flex items-start space-x-3 mb-4">
                        <img src={comment.user.avatarUrl} alt={comment.user.name} className="h-10 w-10 rounded-full" />
                        <div className="flex-1 bg-gray-100 rounded-2xl p-3">
                            <p className="font-bold text-sm text-brand-dark">{comment.user.name}</p>
                            <p className="text-sm text-gray-700">{comment.text}</p>
                        </div>
                    </div>
                ))}
                {resource.comments.length === 0 && <p className="text-center text-gray-500 mt-8">No comments yet. Be the first to comment!</p>}
            </div>

            <div className="p-4 border-t bg-white sticky bottom-0">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        placeholder="Add a comment..."
                        // FIX: Connected input to state and added key press handler.
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                        className="flex-1 p-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-brand-blue bg-primary-light text-brand-dark"
                    />
                    {/* FIX: Connected button to handleAddComment function. */}
                    <button onClick={handleAddComment} className="bg-brand-blue text-white p-3 rounded-full hover:bg-brand-blue-light">
                         <i className="fa-regular fa-paper-plane text-xl"></i>
                    </button>
                </div>
            </div>
        </div>
         <style>{`
        @keyframes slide-up {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
        `}</style>
    </div>
  );
};

// FIX: Added default export for React.lazy compatibility.
export default CommentsModal;