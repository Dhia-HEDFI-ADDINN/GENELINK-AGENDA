import React, { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  isBefore,
  startOfDay,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { cn } from '../../utils/cn';

export interface DatePickerProps {
  selected?: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  highlightedDates?: Date[];
  inline?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  selected,
  onChange,
  minDate,
  maxDate,
  disabledDates = [],
  highlightedDates = [],
  inline = true,
}) => {
  const [currentMonth, setCurrentMonth] = useState(selected || new Date());

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const startDay = startOfMonth(currentMonth).getDay();
  const emptyDays = startDay === 0 ? 6 : startDay - 1; // Adjust for Monday start

  const isDisabled = (date: Date) => {
    if (minDate && isBefore(date, startOfDay(minDate))) return true;
    if (maxDate && isBefore(startOfDay(maxDate), date)) return true;
    return disabledDates.some((d) => isSameDay(d, date));
  };

  const isHighlighted = (date: Date) => highlightedDates.some((d) => isSameDay(d, date));

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div className={cn('bg-white rounded-xl', inline ? 'p-4' : 'p-4 shadow-lg border')}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <h2 className="font-semibold text-gray-900 capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: fr })}
        </h2>
        <button
          type="button"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before month start */}
        {Array.from({ length: emptyDays }).map((_, index) => (
          <div key={`empty-${index}`} className="h-10" />
        ))}

        {/* Days */}
        {days.map((day) => {
          const disabled = isDisabled(day);
          const isSelected = selected && isSameDay(day, selected);
          const highlighted = isHighlighted(day);
          const today = isToday(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => !disabled && onChange(day)}
              disabled={disabled}
              className={cn(
                'h-10 w-full rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                {
                  'bg-primary-600 text-white hover:bg-primary-700': isSelected,
                  'bg-primary-100 text-primary-700': highlighted && !isSelected,
                  'bg-gray-100 text-gray-400 cursor-not-allowed': disabled,
                  'hover:bg-gray-100 text-gray-900': !disabled && !isSelected && !highlighted,
                  'ring-2 ring-primary-500 ring-inset': today && !isSelected,
                }
              )}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-primary-100" />
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-gray-100" />
          <span>Indisponible</span>
        </div>
      </div>
    </div>
  );
};
