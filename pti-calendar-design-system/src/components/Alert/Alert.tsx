import React from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { cn } from '../../utils/cn';

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const variants = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-500',
    title: 'text-blue-800',
    text: 'text-blue-700',
    Icon: InformationCircleIcon,
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'text-green-500',
    title: 'text-green-800',
    text: 'text-green-700',
    Icon: CheckCircleIcon,
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: 'text-yellow-500',
    title: 'text-yellow-800',
    text: 'text-yellow-700',
    Icon: ExclamationTriangleIcon,
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-500',
    title: 'text-red-800',
    text: 'text-red-700',
    Icon: XCircleIcon,
  },
};

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  className,
}) => {
  const styles = variants[variant];
  const Icon = styles.Icon;

  return (
    <div
      className={cn('rounded-lg border p-4 flex gap-3', styles.bg, styles.border, className)}
      role="alert"
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', styles.icon)} />
      <div className="flex-1">
        {title && <h4 className={cn('font-medium mb-1', styles.title)}>{title}</h4>}
        <div className={cn('text-sm', styles.text)}>{children}</div>
      </div>
      {dismissible && onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className={cn('flex-shrink-0 rounded-lg p-1 hover:bg-black/5', styles.icon)}
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
