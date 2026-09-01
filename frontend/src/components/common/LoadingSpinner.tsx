import React from 'react';

export const LoadingSpinner: React.FC<{ text?: string }> = ({ text = 'Loading intelligence...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
      <div className="relative w-12 h-12">
        <div className="w-12 h-12 rounded-full border-2 border-[#7C3AED]/20 border-t-[#9B5CFF] animate-spin"></div>
        <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-b-[#7C3AED] animate-spin animation-delay-500"></div>
      </div>
      <p className="text-sm text-[#A8A3B8] animate-pulse font-mono">{text}</p>
    </div>
  );
};
