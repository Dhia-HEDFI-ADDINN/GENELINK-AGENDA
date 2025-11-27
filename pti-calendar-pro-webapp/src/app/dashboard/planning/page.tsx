'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, addDays, startOfWeek, addWeeks, subWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';
import { apiClient } from '@/lib/api-client';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Spinner,
  Select,
  getRdvStatusVariant,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
} from '@pti-calendar/design-system';

interface Controleur {
  id: string;
  nom: string;
  prenom: string;
  initiales: string;
  couleur: string;
}

interface PlanningSlot {
  id: string;
  heure_debut: string;
  heure_fin: string;
  rdv?: {
    id: string;
    reference: string;
    statut: string;
    client_nom: string;
    vehicule_immatriculation: string;
  };
}

interface PlanningDay {
  date: string;
  controleur_id: string;
  slots: PlanningSlot[];
}

export default function PlanningPage() {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedControleur, setSelectedControleur] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');

  const weekStart = format(currentWeek, 'yyyy-MM-dd');
  const weekEnd = format(addDays(currentWeek, 6), 'yyyy-MM-dd');

  // Fetch controleurs
  const { data: controleurs } = useQuery({
    queryKey: ['controleurs'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Controleur[] }>('/controleurs');
      return response.data.data;
    },
  });

  // Fetch planning
  const { data: planning, isLoading } = useQuery({
    queryKey: ['planning', weekStart, weekEnd, selectedControleur],
    queryFn: async () => {
      const response = await apiClient.get<{ data: PlanningDay[] }>('/planning', {
        params: {
          date_debut: weekStart,
          date_fin: weekEnd,
          controleur_id: selectedControleur !== 'all' ? selectedControleur : undefined,
        },
      });
      return response.data.data;
    },
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));
  const timeSlots = generateTimeSlots('08:00', '18:00', 30);

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek((prev) => (direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1)));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Planning</h1>
          <p className="text-gray-500 mt-1">
            Semaine du {format(currentWeek, 'd MMMM', { locale: fr })} au{' '}
            {format(addDays(currentWeek, 6), 'd MMMM yyyy', { locale: fr })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Controleur filter */}
          <Select
            value={selectedControleur}
            onChange={(e) => setSelectedControleur(e.target.value)}
            options={[
              { value: 'all', label: 'Tous les contrôleurs' },
              ...(controleurs?.map((c) => ({
                value: c.id,
                label: `${c.prenom} ${c.nom}`,
              })) || []),
            ]}
          />

          {/* Week navigation */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateWeek('prev')}
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            >
              Aujourd'hui
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateWeek('next')}
            >
              <ChevronRightIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Planning Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header row with days */}
              <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50">
                <div className="p-3 text-sm font-medium text-gray-500 border-r border-gray-200">
                  Heure
                </div>
                {weekDays.map((day) => {
                  const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  return (
                    <div
                      key={day.toISOString()}
                      className={`p-3 text-center border-r border-gray-200 last:border-r-0 ${
                        isToday ? 'bg-primary-50' : isWeekend ? 'bg-gray-100' : ''
                      }`}
                    >
                      <p className="text-xs text-gray-500">
                        {format(day, 'EEE', { locale: fr })}
                      </p>
                      <p
                        className={`text-lg font-semibold ${
                          isToday ? 'text-primary-600' : 'text-gray-900'
                        }`}
                      >
                        {format(day, 'd')}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Time slots */}
              {timeSlots.map((time) => (
                <div
                  key={time}
                  className="grid grid-cols-8 border-b border-gray-100 last:border-b-0"
                >
                  <div className="p-2 text-xs text-gray-500 border-r border-gray-200 bg-gray-50">
                    {time}
                  </div>
                  {weekDays.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const slot = findSlotForTime(planning, dateStr, time, selectedControleur);
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                    return (
                      <div
                        key={`${dateStr}-${time}`}
                        className={`p-1 border-r border-gray-200 last:border-r-0 min-h-[48px] ${
                          isWeekend ? 'bg-gray-50' : ''
                        }`}
                      >
                        {slot?.rdv && (
                          <RdvSlotCard rdv={slot.rdv} />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Légende</h3>
          <div className="flex flex-wrap gap-4">
            {controleurs?.map((controleur) => (
              <div key={controleur.id} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: controleur.couleur }}
                />
                <span className="text-sm text-gray-600">
                  {controleur.initiales} - {controleur.prenom} {controleur.nom}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RdvSlotCard({ rdv }: { rdv: PlanningSlot['rdv'] }) {
  if (!rdv) return null;

  return (
    <a
      href={`/dashboard/rdv/${rdv.id}`}
      className="block p-2 rounded bg-primary-100 hover:bg-primary-200 transition-colors"
    >
      <p className="text-xs font-medium text-primary-800 truncate">
        {rdv.client_nom}
      </p>
      <p className="text-xs text-primary-600 truncate">
        {rdv.vehicule_immatriculation}
      </p>
      <Badge variant={getRdvStatusVariant(rdv.statut)} size="sm" className="mt-1">
        {rdv.statut}
      </Badge>
    </a>
  );
}

function generateTimeSlots(start: string, end: string, intervalMinutes: number): string[] {
  const slots: string[] = [];
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);

  let currentHour = startHour;
  let currentMin = startMin;

  while (currentHour < endHour || (currentHour === endHour && currentMin <= endMin)) {
    slots.push(
      `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`
    );

    currentMin += intervalMinutes;
    if (currentMin >= 60) {
      currentHour += Math.floor(currentMin / 60);
      currentMin = currentMin % 60;
    }
  }

  return slots;
}

function findSlotForTime(
  planning: PlanningDay[] | undefined,
  date: string,
  time: string,
  controleurFilter: string
): PlanningSlot | undefined {
  if (!planning) return undefined;

  const dayPlanning = planning.find((d) => d.date === date);
  if (!dayPlanning) return undefined;

  if (controleurFilter !== 'all' && dayPlanning.controleur_id !== controleurFilter) {
    return undefined;
  }

  return dayPlanning.slots.find((slot) => slot.heure_debut === time);
}
