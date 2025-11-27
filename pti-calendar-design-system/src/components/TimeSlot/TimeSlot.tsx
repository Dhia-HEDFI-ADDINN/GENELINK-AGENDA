import React from 'react';
import { cn } from '../../utils/cn';

export interface TimeSlotData {
  id?: string;
  heure_debut: string;
  heure_fin: string;
  controleur_id?: string;
  controleur_nom?: string;
  controleur_initiales?: string;
  disponible: boolean;
  charge?: 'faible' | 'moyenne' | 'forte';
}

export interface TimeSlotProps {
  slot: TimeSlotData;
  selected?: boolean;
  onClick?: () => void;
  showControleur?: boolean;
  compact?: boolean;
}

export const TimeSlot: React.FC<TimeSlotProps> = ({
  slot,
  selected = false,
  onClick,
  showControleur = false,
  compact = false,
}) => {
  const isAvailable = slot.disponible;

  return (
    <button
      type="button"
      onClick={isAvailable ? onClick : undefined}
      disabled={!isAvailable}
      className={cn(
        'rounded-lg border text-center transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        compact ? 'px-2 py-1.5' : 'px-3 py-2',
        {
          'border-primary-500 bg-primary-500 text-white shadow-md': selected,
          'border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100 hover:border-primary-300 cursor-pointer':
            isAvailable && !selected,
          'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed': !isAvailable,
        }
      )}
    >
      <div className={cn('font-medium', compact ? 'text-sm' : 'text-base')}>
        {slot.heure_debut}
      </div>
      {showControleur && slot.controleur_initiales && (
        <div className={cn('text-xs mt-0.5', selected ? 'text-primary-100' : 'text-gray-500')}>
          {slot.controleur_initiales}
        </div>
      )}
      {slot.charge && (
        <div className="flex justify-center mt-1">
          <ChargeIndicator charge={slot.charge} />
        </div>
      )}
    </button>
  );
};

const ChargeIndicator: React.FC<{ charge: 'faible' | 'moyenne' | 'forte' }> = ({ charge }) => {
  const colors = {
    faible: 'bg-green-400',
    moyenne: 'bg-yellow-400',
    forte: 'bg-red-400',
  };

  return (
    <div className="flex gap-0.5">
      <span className={cn('w-1.5 h-1.5 rounded-full', colors[charge])} />
      <span className={cn('w-1.5 h-1.5 rounded-full', charge !== 'faible' ? colors[charge] : 'bg-gray-300')} />
      <span className={cn('w-1.5 h-1.5 rounded-full', charge === 'forte' ? colors[charge] : 'bg-gray-300')} />
    </div>
  );
};

export interface TimeSlotGridProps {
  slots: TimeSlotData[];
  selectedSlotId?: string;
  onSelect: (slot: TimeSlotData) => void;
  showControleur?: boolean;
  columns?: number;
}

export const TimeSlotGrid: React.FC<TimeSlotGridProps> = ({
  slots,
  selectedSlotId,
  onSelect,
  showControleur = false,
  columns = 4,
}) => {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };

  return (
    <div className={cn('grid gap-2', gridCols[columns as keyof typeof gridCols] || 'grid-cols-4')}>
      {slots.map((slot, index) => (
        <TimeSlot
          key={slot.id || `${slot.heure_debut}-${index}`}
          slot={slot}
          selected={selectedSlotId === slot.id || selectedSlotId === `${slot.heure_debut}-${slot.controleur_id}`}
          onClick={() => onSelect(slot)}
          showControleur={showControleur}
        />
      ))}
    </div>
  );
};
