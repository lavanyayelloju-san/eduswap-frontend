import React from 'react';
import { Resource } from '../types';

interface SmartSuggestionsProps {
  resources: Resource[];
  onSuggestionClick: (query: string) => void;
}

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({ resources, onSuggestionClick }) => {
  const suggestions = React.useMemo(() => {
    const subjects = new Set<string>();
    resources.forEach(r => subjects.add(r.subject));
    const topSuggestions = Array.from(subjects).slice(0, 5);
    if (!topSuggestions.length) {
        return ['AIML', 'CSE', 'EEE', 'Past Papers'];
    }
    return topSuggestions;
  }, [resources]);
  
  return (
    <div className="mt-3">
      <div className="flex space-x-2 overflow-x-auto pb-2 -mx-4 px-4">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            className="bg-primary-light text-brand-dark px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap hover:bg-gray-200"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};
