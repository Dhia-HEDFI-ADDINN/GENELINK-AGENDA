import React from 'react';
import { cn } from '../../utils/cn';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'gray';
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

const colorClasses = {
  primary: 'text-primary-600',
  white: 'text-white',
  gray: 'text-gray-400',
};

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', color = 'primary', className }) => {
  return (
    <svg
      className={cn('animate-spin', sizeClasses[size], colorClasses[color], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

export interface LoadingOverlayProps {
  loading: boolean;
  children: React.ReactNode;
  text?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ loading, children, text }) => {
  return (
    <div className="relative">
      {children}
      {loading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-10">
          <Spinner size="lg" />
          {text && <p className="mt-3 text-sm text-gray-600">{text}</p>}
        </div>
      )}
    </div>
  );
};
