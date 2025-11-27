'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { format, addMonths } from 'date-fns';
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
}

type ResultatType = 'A' | 'S' | 'R';

interface DefautItem {
  id: string;
  code: string;
  libelle: string;
  gravite: 'MINEUR' | 'MAJEUR' | 'CRITIQUE';
  selected: boolean;
}

// Sample defects list (in production, this would come from an API)
const defautsDisponibles: DefautItem[] = [
  { id: '1', code: '1.1.1', libelle: 'Feu de croisement défectueux avant gauche', gravite: 'MAJEUR', selected: false },
  { id: '2', code: '1.1.2', libelle: 'Feu de croisement défectueux avant droit', gravite: 'MAJEUR', selected: false },
  { id: '3', code: '1.2.1', libelle: 'Feu de position défectueux', gravite: 'MINEUR', selected: false },
  { id: '4', code: '2.1.1', libelle: 'Usure excessive des plaquettes de frein avant', gravite: 'MAJEUR', selected: false },
  { id: '5', code: '2.1.2', libelle: 'Disque de frein avant usé', gravite: 'MAJEUR', selected: false },
  { id: '6', code: '2.2.1', libelle: 'Frein de stationnement inefficace', gravite: 'CRITIQUE', selected: false },
  { id: '7', code: '3.1.1', libelle: 'Pneu avant gauche usure limite', gravite: 'MINEUR', selected: false },
  { id: '8', code: '3.1.2', libelle: 'Pneu usé au-delà de la limite légale', gravite: 'MAJEUR', selected: false },
  { id: '9', code: '4.1.1', libelle: 'Pollution excessive (CO)', gravite: 'MAJEUR', selected: false },
  { id: '10', code: '4.1.2', libelle: 'Pollution excessive (particules)', gravite: 'MAJEUR', selected: false },
  { id: '11', code: '5.1.1', libelle: 'Jeu excessif direction', gravite: 'CRITIQUE', selected: false },
  { id: '12', code: '6.1.1', libelle: 'Corrosion importante sur châssis', gravite: 'CRITIQUE', selected: false },
  { id: '13', code: '7.1.1', libelle: 'Pare-brise fissuré dans le champ de vision', gravite: 'MAJEUR', selected: false },
  { id: '14', code: '8.1.1', libelle: 'Ceinture de sécurité défectueuse', gravite: 'CRITIQUE', selected: false },
];

const resultatLabels: Record<ResultatType, { label: string; description: string; color: string }> = {
  A: {
    label: 'Favorable (A)',
    description: 'Le véhicule est conforme, pas de défaut majeur ou critique',
    color: 'green',
  },
  S: {
    label: 'Défavorable pour défauts majeurs (S)',
    description: 'Contre-visite obligatoire dans les 2 mois',
    color: 'orange',
  },
  R: {
    label: 'Défavorable pour défaut critique (R)',
    description: 'Véhicule interdit de circuler, contre-visite obligatoire',
    color: 'red',
  },
};

export default function TerminerControlePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const rdvId = params.id as string;

  const [resultat, setResultat] = useState<ResultatType | null>(null);
  const [defauts, setDefauts] = useState<DefautItem[]>(defautsDisponibles);
  const [numeroPV, setNumeroPV] = useState('');
  const [observations, setObservations] = useState('');
  const [dateLimiteCV, setDateLimiteCV] = useState<string>(
    format(addMonths(new Date(), 2), 'yyyy-MM-dd')
  );
  const [searchDefaut, setSearchDefaut] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: rdv, isLoading } = useQuery({
    queryKey: ['rdv-detail', rdvId],
    queryFn: async () => {
      const response = await apiClient.get<RdvDetail>(`/rdv/${rdvId}`);
      return response.data;
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      const selectedDefauts = defauts
        .filter((d) => d.selected)
        .map((d) => ({ code: d.code, libelle: d.libelle, gravite: d.gravite }));

      await apiClient.post(`/rdv/${rdvId}/terminer`, {
        resultat,
        numero_pv: numeroPV || undefined,
        defauts: selectedDefauts.length > 0 ? selectedDefauts : undefined,
        observations: observations || undefined,
        date_limite_cv: resultat !== 'A' ? dateLimiteCV : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rdv-detail', rdvId] });
      router.push(`/dashboard/rdv/${rdvId}?completed=true`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement du résultat');
    },
  });

  const toggleDefaut = (id: string) => {
    setDefauts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, selected: !d.selected } : d))
    );
  };

  const selectedDefauts = defauts.filter((d) => d.selected);
  const hasCritique = selectedDefauts.some((d) => d.gravite === 'CRITIQUE');
  const hasMajeur = selectedDefauts.some((d) => d.gravite === 'MAJEUR');

  // Auto-determine result based on selected defects
  const suggestedResult: ResultatType | null = hasCritique ? 'R' : hasMajeur ? 'S' : selectedDefauts.length === 0 ? 'A' : 'S';

  const filteredDefauts = defauts.filter(
    (d) =>
      d.code.toLowerCase().includes(searchDefaut.toLowerCase()) ||
      d.libelle.toLowerCase().includes(searchDefaut.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!resultat) {
      setError('Veuillez sélectionner un résultat');
      return;
    }

    if ((resultat === 'S' || resultat === 'R') && selectedDefauts.length === 0) {
      setError('Veuillez sélectionner au moins un défaut pour un résultat défavorable');
      return;
    }

    if (resultat === 'A' && selectedDefauts.some((d) => d.gravite !== 'MINEUR')) {
      setError('Un résultat favorable ne peut pas avoir de défaut majeur ou critique');
      return;
    }

    setError(null);
    await completeMutation.mutateAsync();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!rdv || rdv.statut !== 'EN_COURS') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700">
          {!rdv ? 'RDV introuvable' : 'Ce RDV n\'est pas en cours de contrôle'}
        </p>
        <Link href={`/dashboard/rdv/${rdvId}`} className="text-red-600 underline mt-2 block">
          Retour au RDV
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
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
        <h1 className="text-2xl font-bold text-gray-900">Terminer le contrôle</h1>
        <p className="text-gray-600 mt-1">
          {rdv.vehicule.immatriculation} - {rdv.vehicule.marque} {rdv.vehicule.modele}
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Defects Selection */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Défauts constatés</h2>

            {/* Search */}
            <div className="relative mb-4">
              <input
                type="text"
                value={searchDefaut}
                onChange={(e) => setSearchDefaut(e.target.value)}
                placeholder="Rechercher un défaut par code ou libellé..."
                className="w-full border rounded-lg pl-10 pr-4 py-2"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Selected defects */}
            {selectedDefauts.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Défauts sélectionnés ({selectedDefauts.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedDefauts.map((defaut) => (
                    <span
                      key={defaut.id}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        defaut.gravite === 'CRITIQUE'
                          ? 'bg-red-100 text-red-700'
                          : defaut.gravite === 'MAJEUR'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {defaut.code}
                      <button
                        onClick={() => toggleDefaut(defaut.id)}
                        className="hover:opacity-70"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Defects list */}
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {filteredDefauts.map((defaut) => (
                <label
                  key={defaut.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    defaut.selected
                      ? defaut.gravite === 'CRITIQUE'
                        ? 'bg-red-50 border-red-300'
                        : defaut.gravite === 'MAJEUR'
                        ? 'bg-orange-50 border-orange-300'
                        : 'bg-yellow-50 border-yellow-300'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={defaut.selected}
                    onChange={() => toggleDefaut(defaut.id)}
                    className="mt-1 h-4 w-4 rounded border-gray-300"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium text-gray-900">{defaut.code}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          defaut.gravite === 'CRITIQUE'
                            ? 'bg-red-100 text-red-700'
                            : defaut.gravite === 'MAJEUR'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {defaut.gravite}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{defaut.libelle}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Observations */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Observations</h2>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Observations supplémentaires, remarques..."
              className="w-full border rounded-lg px-4 py-3 min-h-[100px] resize-none"
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Result Selection */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Résultat du contrôle</h2>

            {suggestedResult && !resultat && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                💡 Suggestion basée sur les défauts: {resultatLabels[suggestedResult].label}
              </div>
            )}

            <div className="space-y-3">
              {(Object.keys(resultatLabels) as ResultatType[]).map((r) => {
                const config = resultatLabels[r];
                return (
                  <label
                    key={r}
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      resultat === r
                        ? config.color === 'green'
                          ? 'border-green-500 bg-green-50'
                          : config.color === 'orange'
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="resultat"
                      value={r}
                      checked={resultat === r}
                      onChange={() => setResultat(r)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{config.label}</p>
                      <p className="text-sm text-gray-500">{config.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* PV Number */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Numéro de PV</h2>
            <input
              type="text"
              value={numeroPV}
              onChange={(e) => setNumeroPV(e.target.value)}
              placeholder="Ex: CT2024-001234"
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>

          {/* Date limite CV (if not favorable) */}
          {resultat && resultat !== 'A' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">Date limite contre-visite</h2>
              <input
                type="date"
                value={dateLimiteCV}
                onChange={(e) => setDateLimiteCV(e.target.value)}
                className="w-full border rounded-lg px-4 py-2"
              />
              <p className="text-sm text-gray-500 mt-2">
                Le client a jusqu'à cette date pour repasser le contrôle
              </p>
            </div>
          )}

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg border p-6">
            <h3 className="font-semibold mb-3">Récapitulatif</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Défauts critiques</span>
                <span className={`font-medium ${defauts.filter((d) => d.selected && d.gravite === 'CRITIQUE').length > 0 ? 'text-red-600' : ''}`}>
                  {defauts.filter((d) => d.selected && d.gravite === 'CRITIQUE').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Défauts majeurs</span>
                <span className={`font-medium ${defauts.filter((d) => d.selected && d.gravite === 'MAJEUR').length > 0 ? 'text-orange-600' : ''}`}>
                  {defauts.filter((d) => d.selected && d.gravite === 'MAJEUR').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Défauts mineurs</span>
                <span className="font-medium">
                  {defauts.filter((d) => d.selected && d.gravite === 'MINEUR').length}
                </span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between">
                <span className="text-gray-500">Total défauts</span>
                <span className="font-bold">{selectedDefauts.length}</span>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!resultat || completeMutation.isPending}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {completeMutation.isPending ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Enregistrement...
              </span>
            ) : (
              'Valider et terminer'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
