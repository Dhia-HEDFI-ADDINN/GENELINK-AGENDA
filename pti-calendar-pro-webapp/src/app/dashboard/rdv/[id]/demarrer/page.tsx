'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { apiClient } from '@/lib/api-client';

interface RdvDetail {
  id: string;
  reference: string;
  statut: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  type_controle: string;
  client: {
    civilite: string;
    nom: string;
    prenom: string;
    telephone: string;
    email: string;
  };
  vehicule: {
    immatriculation: string;
    type_vehicule: string;
    type_carburant: string;
    marque?: string;
    modele?: string;
  };
  ligne_controle?: number;
  controleur?: {
    id: string;
    nom: string;
    prenom: string;
  };
}

interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  required: boolean;
}

const initialChecklist: ChecklistItem[] = [
  {
    id: 'carte_grise',
    label: 'Carte grise (certificat d\'immatriculation)',
    description: 'Vérifier que le document est valide et correspond au véhicule',
    checked: false,
    required: true,
  },
  {
    id: 'piece_identite',
    label: 'Pièce d\'identité du client',
    description: 'CNI, passeport ou permis de conduire',
    checked: false,
    required: true,
  },
  {
    id: 'paiement',
    label: 'Paiement vérifié',
    description: 'Confirmer que le paiement a bien été effectué',
    checked: false,
    required: true,
  },
  {
    id: 'vehicule_present',
    label: 'Véhicule présent sur la ligne',
    description: 'Le véhicule est bien positionné sur la ligne de contrôle',
    checked: false,
    required: true,
  },
  {
    id: 'immatriculation_verifiee',
    label: 'Immatriculation vérifiée',
    description: 'La plaque correspond à celle du RDV',
    checked: false,
    required: true,
  },
  {
    id: 'etat_general',
    label: 'État général acceptable',
    description: 'Pas de fuite visible, pas de dommages empêchant le contrôle',
    checked: false,
    required: false,
  },
];

export default function DemarrerControlePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const rdvId = params.id as string;

  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialChecklist);
  const [ligneControle, setLigneControle] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: rdv, isLoading } = useQuery({
    queryKey: ['rdv-detail', rdvId],
    queryFn: async () => {
      const response = await apiClient.get<RdvDetail>(`/rdv/${rdvId}`);
      return response.data;
    },
  });

  const checkinMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(`/rdv/${rdvId}/checkin`, {
        ligne_controle: ligneControle ? parseInt(ligneControle) : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rdv-detail', rdvId] });
    },
  });

  const startMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(`/rdv/${rdvId}/demarrer`, {
        notes_prealables: notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rdv-detail', rdvId] });
      router.push(`/dashboard/rdv/${rdvId}`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Erreur lors du démarrage du contrôle');
    },
  });

  const toggleChecklistItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const allRequiredChecked = checklist
    .filter((item) => item.required)
    .every((item) => item.checked);

  const handleStart = async () => {
    if (!allRequiredChecked) {
      setError('Veuillez valider tous les points de contrôle obligatoires');
      return;
    }

    setError(null);

    // If not already checked in, do checkin first
    if (rdv?.statut === 'CONFIRME' || rdv?.statut === 'RAPPELE') {
      await checkinMutation.mutateAsync();
    }

    // Then start the control
    await startMutation.mutateAsync();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!rdv) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700">RDV introuvable</p>
        <Link href="/dashboard/rdv" className="text-red-600 underline mt-2 block">
          Retour aux RDV
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/dashboard/rdv/${rdvId}`}
          className="text-blue-600 hover:text-blue-700 flex items-center mb-4"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour au RDV
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Démarrer le contrôle</h1>
        <p className="text-gray-600 mt-1">
          RDV {rdv.reference} - {format(new Date(rdv.date), 'EEEE d MMMM yyyy', { locale: fr })} à {rdv.heure_debut}
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Vehicle & Client Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-blue-700 font-medium">Client</p>
            <p className="font-semibold">
              {rdv.client.civilite} {rdv.client.prenom} {rdv.client.nom}
            </p>
            <p className="text-sm text-blue-600">{rdv.client.telephone}</p>
          </div>
          <div>
            <p className="text-sm text-blue-700 font-medium">Véhicule</p>
            <p className="font-semibold text-lg">{rdv.vehicule.immatriculation}</p>
            <p className="text-sm text-blue-600">
              {rdv.vehicule.marque} {rdv.vehicule.modele} - {rdv.type_controle}
            </p>
          </div>
        </div>
      </div>

      {/* Ligne de contrôle */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Ligne de contrôle</h2>
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((num) => (
            <button
              key={num}
              onClick={() => setLigneControle(String(num))}
              className={`p-4 rounded-lg border-2 text-center font-semibold transition-colors ${
                ligneControle === String(num)
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              Ligne {num}
            </button>
          ))}
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Points de vérification</h2>
        <div className="space-y-4">
          {checklist.map((item) => (
            <label
              key={item.id}
              className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                item.checked
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggleChecklistItem(item.id)}
                className="mt-1 h-5 w-5 text-green-600 rounded border-gray-300 focus:ring-green-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{item.label}</span>
                  {item.required && (
                    <span className="text-xs text-red-600 font-medium">Obligatoire</span>
                  )}
                </div>
                {item.description && (
                  <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                )}
              </div>
              {item.checked && (
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Notes préalables (optionnel)</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observations avant le contrôle (ex: rayures existantes, état particulier...)"
          className="w-full border rounded-lg px-4 py-3 min-h-[100px] resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Link
          href={`/dashboard/rdv/${rdvId}`}
          className="flex-1 bg-gray-200 text-gray-700 text-center py-3 rounded-lg font-semibold hover:bg-gray-300"
        >
          Annuler
        </Link>
        <button
          onClick={handleStart}
          disabled={!allRequiredChecked || checkinMutation.isPending || startMutation.isPending}
          className="flex-1 bg-blue-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {checkinMutation.isPending || startMutation.isPending ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Démarrage...
            </span>
          ) : (
            'Démarrer le contrôle'
          )}
        </button>
      </div>

      {/* Checklist status */}
      <div className="mt-6 text-center text-sm text-gray-500">
        {checklist.filter((item) => item.checked).length}/{checklist.length} points vérifiés
        {!allRequiredChecked && (
          <span className="text-red-600 ml-2">
            ({checklist.filter((item) => item.required && !item.checked).length} obligatoires restants)
          </span>
        )}
      </div>
    </div>
  );
}
