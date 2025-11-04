// FIX: Created the TrustBadge component.
import React from 'react';
import { ShieldCheckIcon } from './Icons';

interface TrustBadgeProps {
  score: number;
}

export const TrustBadge: React.FC<TrustBadgeProps> = ({ score }) => {
  const getColor = () => {
    if (score > 80) return 'text-green-500 bg-green-100';
    if (score > 60) return 'text-yellow-500 bg-yellow-100';
    return 'text-red-500 bg-red-100';
  };

  return (
    <div className={`flex items-center space-x-1 py-1 px-2 rounded-full ${getColor()}`}>
      <ShieldCheckIcon className="h-4 w-4" />
      <span className="text-xs font-bold">{score}</span>
    </div>
  );
};

export default TrustBadge;
