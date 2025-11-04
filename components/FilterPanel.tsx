import React, { useState, useMemo } from 'react';
import { Resource } from '../types';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  resources: Resource[];
  onApplyFilters: (filters: any) => void;
}

const FilterSection: React.FC<{title: string, options: string[], selected: string[], onChange: (option: string) => void}> = ({ title, options, selected, onChange }) => (
    <div>
        <h4 className="font-bold text-brand-dark mb-2">{title}</h4>
        <div className="space-y-2">
            {options.map(option => (
                <label key={option} className="flex items-center">
                    <input 
                        type="checkbox"
                        checked={selected.includes(option)}
                        onChange={() => onChange(option)}
                        className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                    />
                    <span className="ml-2 text-gray-700">{option}</span>
                </label>
            ))}
        </div>
    </div>
);

export const FilterPanel: React.FC<FilterPanelProps> = ({ isOpen, onClose, resources, onApplyFilters }) => {
  const [selectedFilters, setSelectedFilters] = useState<{
      itemType: string[];
      resourceType: string[];
      course: string[];
      subject: string[];
  }>({
      itemType: [],
      resourceType: [],
      course: [],
      subject: [],
  });
  
  const filterOptions = useMemo(() => {
    const itemTypes = new Set<string>();
    const resourceTypes = new Set<string>();
    const courses = new Set<string>();
    const subjects = new Set<string>();
    resources.forEach(r => {
        itemTypes.add(r.itemType);
        resourceTypes.add(r.resourceType);
        courses.add(r.course);
        subjects.add(r.subject);
    });
    return {
        itemType: Array.from(itemTypes),
        resourceType: Array.from(resourceTypes),
        course: Array.from(courses),
        subject: Array.from(subjects),
    };
  }, [resources]);

  const handleFilterChange = (category: keyof typeof selectedFilters, option: string) => {
      setSelectedFilters(prev => {
          const currentSelection = prev[category];
          const newSelection = currentSelection.includes(option)
            ? currentSelection.filter(item => item !== option)
            : [...currentSelection, option];
          return { ...prev, [category]: newSelection };
      });
  };

  const handleApply = () => {
      onApplyFilters(selectedFilters);
      onClose();
  };
  
  const handleClear = () => {
    setSelectedFilters({ itemType: [], resourceType: [], course: [], subject: [] });
    onApplyFilters({});
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50" onClick={onClose}>
        <div className="bg-white rounded-t-3xl shadow-lg w-full max-w-lg h-[60%] flex flex-col transition-transform duration-300 transform animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white rounded-t-3xl">
                <h2 className="text-xl font-bold text-brand-dark">Filters</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
               <FilterSection title="Item Type" options={filterOptions.itemType} selected={selectedFilters.itemType} onChange={(opt) => handleFilterChange('itemType', opt)} />
               <FilterSection title="Resource Type" options={filterOptions.resourceType} selected={selectedFilters.resourceType} onChange={(opt) => handleFilterChange('resourceType', opt)} />
               <FilterSection title="Course" options={filterOptions.course} selected={selectedFilters.course} onChange={(opt) => handleFilterChange('course', opt)} />
               <FilterSection title="Subject" options={filterOptions.subject} selected={selectedFilters.subject} onChange={(opt) => handleFilterChange('subject', opt)} />
            </div>

            <div className="p-4 border-t bg-white sticky bottom-0 flex space-x-2">
                <button onClick={handleClear} className="flex-1 border border-gray-300 text-gray-700 p-3 rounded-lg hover:bg-gray-100 font-semibold">Clear</button>
                <button onClick={handleApply} className="flex-1 bg-brand-blue text-white p-3 rounded-lg hover:bg-brand-blue-light font-semibold">Apply Filters</button>
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
export default FilterPanel;