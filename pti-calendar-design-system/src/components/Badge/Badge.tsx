import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full font-medium',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-800',
        primary: 'bg-primary-100 text-primary-800',
        secondary: 'bg-secondary-100 text-secondary-800',
        success: 'bg-success-100 text-success-800',
        warning: 'bg-warning-100 text-warning-800',
        error: 'bg-error-100 text-error-800',
        info: 'bg-blue-100 text-blue-800',
        // RDV Status
        cree: 'bg-blue-100 text-blue-800',
        confirme: 'bg-green-100 text-green-800',
        rappele: 'bg-yellow-100 text-yellow-800',
        en_attente: 'bg-gray-100 text-gray-600',
        en_cours: 'bg-purple-100 text-purple-800',
        termine: 'bg-emerald-100 text-emerald-800',
        annule: 'bg-red-100 text-red-800',
        no_show: 'bg-gray-100 text-gray-600',
        reporte: 'bg-orange-100 text-orange-800',
        valide: 'bg-green-100 text-green-800',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-sm',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ className, variant, size, dot, children, ...props }) => {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full mr-1.5', {
            'bg-gray-500': variant === 'default',
            'bg-primary-500': variant === 'primary',
            'bg-success-500': variant === 'success' || variant === 'confirme' || variant === 'termine',
            'bg-warning-500': variant === 'warning' || variant === 'rappele',
            'bg-error-500': variant === 'error' || variant === 'annule',
            'bg-blue-500': variant === 'cree',
            'bg-purple-500': variant === 'en_cours',
            'bg-orange-500': variant === 'reporte',
          })}
        />
      )}
      {children}
    </span>
  );
};

// Helper to get badge variant from RDV status
export const getRdvStatusVariant = (status: string): BadgeProps['variant'] => {
  const statusMap: Record<string, BadgeProps['variant']> = {
    CREE: 'cree',
    CONFIRME: 'confirme',
    RAPPELE: 'rappele',
    EN_COURS: 'en_cours',
    TERMINE: 'termine',
    ANNULE: 'annule',
    NO_SHOW: 'no_show',
    REPORTE: 'reporte',
  };
  return statusMap[status] || 'default';
};

// Status label mapping
export const getRdvStatusLabel = (status: string): string => {
  const labelMap: Record<string, string> = {
    CREE: 'Créé',
    CONFIRME: 'Confirmé',
    RAPPELE: 'Rappelé',
    EN_COURS: 'En cours',
    TERMINE: 'Terminé',
    ANNULE: 'Annulé',
    NO_SHOW: 'No-show',
    REPORTE: 'Reporté',
  };
  return labelMap[status] || status;
};
