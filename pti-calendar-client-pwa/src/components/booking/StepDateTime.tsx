'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, addDays, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useBooking, SelectedSlot } from '@/contexts/BookingContext';
import {
  DatePicker,
  TimeSlotGrid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Spinner,
  Alert,
  CalendarIcon,
  ClockIcon,
  type TimeSlotData,
} from '@pti-calendar/design-system';
import { apiClient } from '@/lib/api-client';

interface DisponibilitesResponse {
  date: string;
  creneaux: TimeSlotData[];
}

export function StepDateTime() {
  const { state, setSelectedSlot, nextStep } = useBooking();
  const [selectedDate, setSelectedDate] = useState<Date>(addDays(new Date(), 1));
  const [selectedSlotLocal, setSelectedSlotLocal] = useState<TimeSlotData | null>(null);

  const minDate = addDays(startOfDay(new Date()), 1); // Minimum tomorrow
  const maxDate = addDays(startOfDay(new Date()), 60); // Maximum 60 days ahead

  // Fetch disponibilités
  const { data: disponibilites, isLoading, error } = useQuery({
    queryKey: ['disponibilites', state.centre?.id, format(selectedDate, 'yyyy-MM-dd'), state.typeControle, state.vehicleInfo?.type_vehicule, state.vehicleInfo?.type_carburant],
    queryFn: async () => {
      if (!state.centre || !state.typeControle || !state.vehicleInfo) {
        throw new Error('Missing required data');
      }

      const response = await apiClient.get<DisponibilitesResponse>(
        `/centres/${state.centre.id}/disponibilites`,
        {
          params: {
            date: format(selectedDate, 'yyyy-MM-dd'),
            type_controle: state.typeControle,
            type_vehicule: state.vehicleInfo.type_vehicule,
            type_carburant: state.vehicleInfo.type_carburant,
          },
        }
      );
      return response.data;
    },
    enabled: !!state.centre && !!state.typeControle && !!state.vehicleInfo,
  });

  // Fetch highlighted dates (dates with availability)
  const { data: availableDates } = useQuery({
    queryKey: ['available-dates', state.centre?.id, state.typeControle],
    queryFn: async () => {
      if (!state.centre || !state.typeControle) {
        return [];
      }

      const response = await apiClient.get<{ dates: string[] }>(
        `/centres/${state.centre.id}/dates-disponibles`,
        {
          params: {
            type_controle: state.typeControle,
            date_debut: format(minDate, 'yyyy-MM-dd'),
            date_fin: format(maxDate, 'yyyy-MM-dd'),
          },
        }
      );
      return response.data.dates.map((d) => new Date(d));
    },
    enabled: !!state.centre && !!state.typeControle,
  });

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlotLocal(null);
  };

  const handleSlotSelect = (slot: TimeSlotData) => {
    setSelectedSlotLocal(slot);
  };

  const handleContinue = () => {
    if (selectedSlotLocal) {
      const slotData: SelectedSlot = {
        date: format(selectedDate, 'yyyy-MM-dd'),
        heure_debut: selectedSlotLocal.heure_debut,
        heure_fin: selectedSlotLocal.heure_fin,
        controleur_id: selectedSlotLocal.controleur_id,
        controleur_nom: selectedSlotLocal.controleur_nom,
      };
      setSelectedSlot(slotData);
      nextStep();
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Récapitulatif */}
      <Alert variant="info">
        <div className="space-y-1">
          <p><span className="font-medium">Centre :</span> {state.centre?.nom}</p>
          <p><span className="font-medium">Type :</span> {state.typeControle}</p>
          <p><span className="font-medium">Véhicule :</span> {state.vehicleInfo?.immatriculation}</p>
        </div>
      </Alert>

      {/* Calendrier */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
            Sélectionnez une date
          </h2>
        </CardHeader>
        <CardContent className="p-0">
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            minDate={minDate}
            maxDate={maxDate}
            highlightedDates={availableDates || []}
            inline
          />
        </CardContent>
      </Card>

      {/* Créneaux horaires */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-gray-400" />
            Créneaux disponibles le{' '}
            {format(selectedDate, 'EEEE d MMMM', { locale: fr })}
          </h2>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <Alert variant="error">
              Erreur lors du chargement des créneaux. Veuillez réessayer.
            </Alert>
          ) : disponibilites?.creneaux && disponibilites.creneaux.length > 0 ? (
            <TimeSlotGrid
              slots={disponibilites.creneaux}
              selectedSlot={selectedSlotLocal || undefined}
              onSelectSlot={handleSlotSelect}
            />
          ) : (
            <div className="text-center py-8">
              <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun créneau disponible ce jour</p>
              <p className="text-sm text-gray-400 mt-2">
                Essayez une autre date
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected slot summary */}
      {selectedSlotLocal && (
        <Card className="bg-primary-50 border-primary-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-primary-900">Créneau sélectionné</p>
                <p className="text-primary-700">
                  {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })} à{' '}
                  {selectedSlotLocal.heure_debut}
                </p>
                {selectedSlotLocal.controleur_nom && (
                  <p className="text-sm text-primary-600 mt-1">
                    Contrôleur : {selectedSlotLocal.controleur_nom}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Continue Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-bottom">
        <div className="container-app">
          <Button
            onClick={handleContinue}
            fullWidth
            disabled={!selectedSlotLocal}
          >
            Continuer
          </Button>
        </div>
      </div>
    </div>
  );
}
