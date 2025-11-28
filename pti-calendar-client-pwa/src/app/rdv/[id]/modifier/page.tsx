'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, parseISO, addDays, isBefore, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';
import { api, Rdv, Centre, TimeSlot } from '@/lib/api-client';

export default function ModifierRdvPage() {
  const params = useParams();
  const router = useRouter();
  const [rdv, setRdv] = useState<Rdv | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'date' | 'slot' | 'confirm'>('date');

  // Form state
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRdv();
  }, [params.id]);

  const loadRdv = async () => {
    try {
      setLoading(true);
      const data = await api.getRdv(params.id as string);
      setRdv(data);

      // Check if RDV can be modified
      const canModify = !['TERMINE', 'ANNULE', 'NO_SHOW', 'EN_COURS'].includes(data.statut);
      if (!canModify) {
        setError('Ce rendez-vous ne peut plus être modifié.');
        return;
      }

      // Load available dates for the next 30 days
      await loadAvailableDates(data.centre.id, data.type_controle);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement du RDV');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableDates = async (centreId: string, typeControle: string) => {
    try {
      const today = new Date();
      const dateDebut = format(addDays(today, 1), 'yyyy-MM-dd');
      const dateFin = format(addDays(today, 30), 'yyyy-MM-dd');

      const result = await api.getDatesDisponibles(centreId, {
        type_controle: typeControle,
        date_debut: dateDebut,
        date_fin: dateFin,
      });

      setAvailableDates(result.dates || []);
    } catch (err) {
      console.error('Error loading available dates:', err);
    }
  };

  const loadAvailableSlots = async (date: string) => {
    if (!rdv) return;

    try {
      setLoadingSlots(true);
      const result = await api.getDisponibilites(rdv.centre.id, {
        date,
        type_controle: rdv.type_controle,
        type_vehicule: rdv.vehicule.type_vehicule,
        type_carburant: rdv.vehicule.type_carburant,
      });

      setAvailableSlots(result.creneaux.filter((slot) => slot.disponible));
    } catch (err) {
      console.error('Error loading slots:', err);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateSelect = async (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    await loadAvailableSlots(date);
    setStep('slot');
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStep('confirm');
  };

  const handleSubmit = async () => {
    if (!rdv || !selectedDate || !selectedSlot) return;

    try {
      setSubmitting(true);
      // In production, this would call the API to update the RDV
      // await api.rescheduleRdv(rdv.id, {
      //   nouvelle_date: selectedDate,
      //   nouvelle_heure: selectedSlot.heure_debut,
      // });

      // For now, redirect to confirmation
      router.push(`/rdv/${rdv.id}?modified=true`);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la modification');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !rdv) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Impossible de modifier</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href={`/rdv/${params.id}`}
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Retour au RDV
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href={`/rdv/${rdv.id}`} className="text-blue-600 hover:text-blue-700 flex items-center">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Retour
            </Link>
            <h1 className="font-semibold">Modifier le RDV</h1>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center space-x-4">
            {['date', 'slot', 'confirm'].map((s, index) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === s
                      ? 'bg-blue-600 text-white'
                      : index < ['date', 'slot', 'confirm'].indexOf(step)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index + 1}
                </div>
                {index < 2 && (
                  <div
                    className={`w-12 h-1 ${
                      index < ['date', 'slot', 'confirm'].indexOf(step) ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2 text-sm text-gray-600">
            <span className="mx-4">Date</span>
            <span className="mx-4">Créneau</span>
            <span className="mx-4">Confirmation</span>
          </div>
        </div>
      </div>

      {/* Current RDV Info */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium text-yellow-800">RDV actuel</p>
              <p className="text-yellow-700 text-sm">
                {format(parseISO(rdv.date), 'EEEE d MMMM yyyy', { locale: fr })} à {rdv.heure_debut}
              </p>
              <p className="text-yellow-700 text-sm">{rdv.centre.nom}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 pb-8">
        {/* Step 1: Date Selection */}
        {step === 'date' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Choisir une nouvelle date</h2>

            {availableDates.length === 0 ? (
              <p className="text-gray-600">Aucune date disponible pour le moment.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {availableDates.slice(0, 12).map((date) => {
                  const dateObj = parseISO(date);
                  const isSelected = selectedDate === date;
                  return (
                    <button
                      key={date}
                      onClick={() => handleDateSelect(date)}
                      className={`p-4 rounded-lg border-2 text-center transition-colors ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-sm text-gray-500">
                        {format(dateObj, 'EEE', { locale: fr })}
                      </div>
                      <div className="text-2xl font-bold">
                        {format(dateObj, 'd')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(dateObj, 'MMMM', { locale: fr })}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Slot Selection */}
        {step === 'slot' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Choisir un créneau</h2>
              <button
                onClick={() => {
                  setStep('date');
                  setSelectedSlot(null);
                }}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Changer de date
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              Date sélectionnée : {format(parseISO(selectedDate), 'EEEE d MMMM yyyy', { locale: fr })}
            </p>

            {loadingSlots ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            ) : availableSlots.length === 0 ? (
              <p className="text-gray-600">Aucun créneau disponible pour cette date.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {availableSlots.map((slot, index) => (
                  <button
                    key={index}
                    onClick={() => handleSlotSelect(slot)}
                    className={`p-3 rounded-lg border-2 text-center transition-colors ${
                      selectedSlot?.heure_debut === slot.heure_debut
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-semibold">{slot.heure_debut}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 'confirm' && selectedSlot && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Confirmer la modification</h2>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Ancienne date</p>
                  <p className="font-medium line-through text-gray-400">
                    {format(parseISO(rdv.date), 'd MMMM yyyy', { locale: fr })}
                  </p>
                  <p className="line-through text-gray-400">{rdv.heure_debut}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nouvelle date</p>
                  <p className="font-medium text-green-600">
                    {format(parseISO(selectedDate), 'd MMMM yyyy', { locale: fr })}
                  </p>
                  <p className="text-green-600">{selectedSlot.heure_debut}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <div>
                  <p className="font-medium">{rdv.centre.nom}</p>
                  <p className="text-sm text-gray-600">{rdv.centre.adresse}</p>
                </div>
              </div>
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <div>
                  <p className="font-medium">{rdv.vehicule.immatriculation}</p>
                  <p className="text-sm text-gray-600">{rdv.type_controle}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('slot')}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300"
              >
                Retour
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Modification...' : 'Confirmer'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
