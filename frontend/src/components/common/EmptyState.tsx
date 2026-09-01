import React from 'react';
import { LucideIcon, ShieldOff } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = ShieldOff,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl border border-dashed border-[#282245] bg-[#121022]/40">
      <div className="p-4 rounded-2xl bg-[#18142A] border border-[#7C3AED]/30 text-[#9B5CFF] mb-4 shadow-lg">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-[#F5F3FF] mb-1">{title}</h3>
      <p className="text-sm text-[#A8A3B8] max-w-md mb-6">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 rounded-lg bg-[#7C3AED] hover:bg-[#9B5CFF] text-white text-sm font-medium transition-all shadow-glow-purple"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
