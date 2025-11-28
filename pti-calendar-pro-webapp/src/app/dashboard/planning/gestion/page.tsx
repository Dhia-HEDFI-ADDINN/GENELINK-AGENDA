'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { apiClient } from '@/lib/api-client';

interface TimeSlot {
  id: string;
  heure_debut: string;
  heure_fin: string;
  statut: 'DISPONIBLE' | 'RESERVE' | 'BLOQUE' | 'PAUSE';
  rdv?: {
    id: string;
    reference: string;
    client_nom: string;
    immatriculation: string;
    type_controle: string;
  };
  motif_blocage?: string;
}

interface DayPlanning {
  date: string;
  controleur_id: string;
  controleur_nom: string;
  ligne_controle: number;
  horaires_ouverture: { debut: string; fin: string };
  creneaux: TimeSlot[];
  is_jour_ferie: boolean;
  is_ferme: boolean;
}

const statusColors = {
  DISPONIBLE: 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200',
  RESERVE: 'bg-blue-100 border-blue-300 text-blue-700',
  BLOQUE: 'bg-gray-100 border-gray-300 text-gray-500',
  PAUSE: 'bg-yellow-100 border-yellow-300 text-yellow-700',
};

const HEURES = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00',
];

export default function GestionPlanningPage() {
  const queryClient = useQueryClient();
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [blockType, setBlockType] = useState<'BLOQUE' | 'PAUSE'>('BLOQUE');

  const weekDays = Array.from({ length: 6 }, (_, i) => addDays(currentWeekStart, i)); // Mon-Sat

  const { data: planningData, isLoading } = useQuery({
    queryKey: ['planning-gestion', format(currentWeekStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      // In production, fetch from API
      // const response = await apiClient.get(`/planning/semaine`, {
      //   params: { date_debut: format(currentWeekStart, 'yyyy-MM-dd') }
      // });
      // return response.data;

      // Mock data
      return weekDays.map((date): DayPlanning => ({
        date: format(date, 'yyyy-MM-dd'),
        controleur_id: 'ctrl-1',
        controleur_nom: 'Jean Martin',
        ligne_controle: 1,
        horaires_ouverture: { debut: '08:00', fin: '18:00' },
        is_jour_ferie: false,
        is_ferme: date.getDay() === 0, // Sunday closed
        creneaux: HEURES.slice(0, -1).map((heure, idx): TimeSlot => ({
          id: `${format(date, 'yyyy-MM-dd')}-${heure}`,
          heure_debut: heure,
          heure_fin: HEURES[idx + 1],
          statut: Math.random() > 0.7 ? 'RESERVE' : Math.random() > 0.9 ? 'BLOQUE' : 'DISPONIBLE',
          rdv: Math.random() > 0.7 ? {
            id: `rdv-${Math.random()}`,
            reference: `RDV-${Math.floor(Math.random() * 10000)}`,
            client_nom: 'Client Demo',
            immatriculation: 'AB-123-CD',
            type_controle: 'CTP',
          } : undefined,
        })),
      }));
    },
  });

  const blockMutation = useMutation({
    mutationFn: async ({ slotIds, statut, motif }: { slotIds: string[]; statut: 'BLOQUE' | 'PAUSE'; motif?: string }) => {
      await apiClient.post('/planning/bloquer', {
        creneau_ids: slotIds,
        statut,
        motif,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning-gestion'] });
      setSelectedSlots([]);
      setShowBlockModal(false);
      setBlockReason('');
    },
  });

  const unblockMutation = useMutation({
    mutationFn: async (slotIds: string[]) => {
      await apiClient.post('/planning/debloquer', {
        creneau_ids: slotIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning-gestion'] });
      setSelectedSlots([]);
    },
  });

  const toggleSlotSelection = (slotId: string, slotStatut: string) => {
    if (slotStatut === 'RESERVE') return; // Can't select reserved slots

    setSelectedSlots((prev) =>
      prev.includes(slotId)
        ? prev.filter((id) => id !== slotId)
        : [...prev, slotId]
    );
  };

  const handleBlockSlots = () => {
    if (selectedSlots.length === 0) return;
    blockMutation.mutate({
      slotIds: selectedSlots,
      statut: blockType,
      motif: blockReason || undefined,
    });
  };

  const handleUnblockSlots = () => {
    if (selectedSlots.length === 0) return;
    unblockMutation.mutate(selectedSlots);
  };

  const getSelectedSlotsStatus = (): 'mixed' | 'DISPONIBLE' | 'BLOQUE' | 'PAUSE' | null => {
    if (selectedSlots.length === 0) return null;

    const statuts = selectedSlots.map((id) => {
      for (const day of planningData || []) {
        const slot = day.creneaux.find((s) => s.id === id);
        if (slot) return slot.statut;
      }
      return null;
    });

    const uniqueStatuts = Array.from(new Set(statuts));
    if (uniqueStatuts.length > 1) return 'mixed';
    return uniqueStatuts[0] as any;
  };

  const selectedStatus = getSelectedSlotsStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion du planning</h1>
          <p className="text-gray-600 mt-1">
            Gérez vos disponibilités, bloquez des créneaux, définissez vos pauses
          </p>
        </div>
        <Link
          href="/dashboard/planning"
          className="text-blue-600 hover:text-blue-700"
        >
          ← Retour au planning
        </Link>
      </div>

      {/* Week Navigation */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-center">
            <h2 className="text-lg font-semibold">
              Semaine du {format(currentWeekStart, 'd MMMM yyyy', { locale: fr })}
            </h2>
            <button
              onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Semaine actuelle
            </button>
          </div>
          <button
            onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Actions Bar */}
      {selectedSlots.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div>
            <span className="font-medium text-blue-900">
              {selectedSlots.length} créneau{selectedSlots.length > 1 ? 'x' : ''} sélectionné{selectedSlots.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedSlots([])}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              Annuler
            </button>
            {(selectedStatus === 'BLOQUE' || selectedStatus === 'PAUSE') && (
              <button
                onClick={handleUnblockSlots}
                disabled={unblockMutation.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Débloquer
              </button>
            )}
            {(selectedStatus === 'DISPONIBLE' || selectedStatus === 'mixed') && (
              <button
                onClick={() => setShowBlockModal(true)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Bloquer
              </button>
            )}
          </div>
        </div>
      )}

      {/* Planning Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left text-sm font-medium text-gray-500 w-20">Heure</th>
                  {weekDays.map((date) => (
                    <th
                      key={date.toISOString()}
                      className={`p-3 text-center text-sm font-medium min-w-[140px] ${
                        isSameDay(date, new Date()) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className={isSameDay(date, new Date()) ? 'text-blue-600' : 'text-gray-900'}>
                        {format(date, 'EEE', { locale: fr })}
                      </div>
                      <div className={`text-lg ${isSameDay(date, new Date()) ? 'text-blue-600 font-bold' : ''}`}>
                        {format(date, 'd')}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HEURES.slice(0, -1).map((heure, heureIdx) => (
                  <tr key={heure} className="border-b last:border-b-0">
                    <td className="p-2 text-sm text-gray-500 font-medium">{heure}</td>
                    {planningData?.map((dayData) => {
                      const slot = dayData.creneaux.find((s) => s.heure_debut === heure);
                      if (!slot) return <td key={dayData.date} className="p-1"></td>;

                      const isSelected = selectedSlots.includes(slot.id);
                      const isDisabled = slot.statut === 'RESERVE';

                      return (
                        <td key={dayData.date} className="p-1">
                          <button
                            onClick={() => toggleSlotSelection(slot.id, slot.statut)}
                            disabled={isDisabled}
                            className={`w-full p-2 rounded border text-xs transition-all ${
                              statusColors[slot.statut]
                            } ${
                              isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                            } ${
                              isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
                            }`}
                          >
                            {slot.statut === 'RESERVE' && slot.rdv ? (
                              <div className="text-left">
                                <div className="font-medium truncate">{slot.rdv.immatriculation}</div>
                                <div className="truncate opacity-75">{slot.rdv.type_controle}</div>
                              </div>
                            ) : slot.statut === 'BLOQUE' ? (
                              <div>Bloqué</div>
                            ) : slot.statut === 'PAUSE' ? (
                              <div>Pause</div>
                            ) : (
                              <div>Disponible</div>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 border border-green-300"></div>
          <span className="text-gray-600">Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300"></div>
          <span className="text-gray-600">Réservé</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-100 border border-gray-300"></div>
          <span className="text-gray-600">Bloqué</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300"></div>
          <span className="text-gray-600">Pause</span>
        </div>
      </div>

      {/* Block Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Bloquer des créneaux</h3>
            <p className="text-gray-600 mb-4">
              {selectedSlots.length} créneau{selectedSlots.length > 1 ? 'x' : ''} sélectionné{selectedSlots.length > 1 ? 's' : ''}
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Type de blocage</label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="blockType"
                    value="BLOQUE"
                    checked={blockType === 'BLOQUE'}
                    onChange={() => setBlockType('BLOQUE')}
                    className="text-blue-600"
                  />
                  <span>Blocage (indisponible)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="blockType"
                    value="PAUSE"
                    checked={blockType === 'PAUSE'}
                    onChange={() => setBlockType('PAUSE')}
                    className="text-blue-600"
                  />
                  <span>Pause</span>
                </label>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motif (optionnel)
              </label>
              <input
                type="text"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Ex: Formation, Réunion, Maintenance..."
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBlockModal(false);
                  setBlockReason('');
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
              >
                Annuler
              </button>
              <button
                onClick={handleBlockSlots}
                disabled={blockMutation.isPending}
                className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                {blockMutation.isPending ? 'Blocage...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
