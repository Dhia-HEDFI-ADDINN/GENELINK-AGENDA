'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { apiClient } from '@/lib/api-client';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Input,
  Select,
  Badge,
  Modal,
  ModalFooter,
  Spinner,
  Alert,
  getRdvStatusVariant,
  getRdvStatusLabel,
  MagnifyingGlassIcon,
  CalendarIcon,
  FunnelIcon,
  CheckCircleIcon,
  PlayIcon,
  XMarkIcon,
  UserIcon,
  TruckIcon,
  PhoneIcon,
  ArrowPathIcon,
} from '@pti-calendar/design-system';

interface Rdv {
  id: string;
  reference: string;
  statut: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  type_controle: string;
  client: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
  };
  vehicule: {
    immatriculation: string;
    type_vehicule: string;
    marque?: string;
    modele?: string;
  };
  controleur?: {
    id: string;
    nom: string;
    prenom: string;
    initiales: string;
  };
  prix_total: number;
}

const STATUT_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'CREE', label: 'Créé' },
  { value: 'CONFIRME', label: 'Confirmé' },
  { value: 'RAPPELE', label: 'Rappelé' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'TERMINE', label: 'Terminé' },
  { value: 'ANNULE', label: 'Annulé' },
  { value: 'NO_SHOW', label: 'No-show' },
  { value: 'REPORTE', label: 'Reporté' },
];

export default function RdvListPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState({
    search: '',
    statut: searchParams.get('statut') || '',
    date: searchParams.get('date') || format(new Date(), 'yyyy-MM-dd'),
  });

  const [selectedRdv, setSelectedRdv] = useState<Rdv | null>(null);
  const [actionModal, setActionModal] = useState<'checkin' | 'start' | 'complete' | 'noshow' | null>(null);

  // Fetch RDV list
  const { data: rdvList, isLoading, refetch } = useQuery({
    queryKey: ['rdv-list', filters],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Rdv[]; meta: { total: number } }>('/rdv', {
        params: {
          search: filters.search || undefined,
          statut: filters.statut || undefined,
          date: filters.date || undefined,
          limit: 50,
        },
      });
      return response.data;
    },
  });

  // Action mutations
  const checkinMutation = useMutation({
    mutationFn: (rdvId: string) => apiClient.post(`/rdv/${rdvId}/checkin`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rdv-list'] });
      setActionModal(null);
      setSelectedRdv(null);
    },
  });

  const startMutation = useMutation({
    mutationFn: (rdvId: string) => apiClient.post(`/rdv/${rdvId}/demarrer`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rdv-list'] });
      setActionModal(null);
      setSelectedRdv(null);
    },
  });

  const completeMutation = useMutation({
    mutationFn: ({ rdvId, resultat }: { rdvId: string; resultat: string }) =>
      apiClient.post(`/rdv/${rdvId}/terminer`, { resultat }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rdv-list'] });
      setActionModal(null);
      setSelectedRdv(null);
    },
  });

  const noshowMutation = useMutation({
    mutationFn: (rdvId: string) => apiClient.post(`/rdv/${rdvId}/no-show`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rdv-list'] });
      setActionModal(null);
      setSelectedRdv(null);
    },
  });

  const handleAction = (rdv: Rdv, action: typeof actionModal) => {
    setSelectedRdv(rdv);
    setActionModal(action);
  };

  const executeAction = () => {
    if (!selectedRdv) return;

    switch (actionModal) {
      case 'checkin':
        checkinMutation.mutate(selectedRdv.id);
        break;
      case 'start':
        startMutation.mutate(selectedRdv.id);
        break;
      case 'noshow':
        noshowMutation.mutate(selectedRdv.id);
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Rendez-vous</h1>
          <p className="text-gray-500 mt-1">
            {rdvList?.meta.total || 0} rendez-vous trouvés
          </p>
        </div>
        <Link href="/dashboard/rdv/nouveau">
          <Button>
            <CalendarIcon className="h-5 w-5 mr-2" />
            Nouveau RDV
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <Input
                placeholder="Rechercher (nom, immatriculation, référence...)"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
              />
            </div>
            <Select
              value={filters.statut}
              onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
              options={STATUT_OPTIONS}
            />
            <Input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* RDV List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : rdvList?.data && rdvList.data.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Heure</th>
                    <th>Client</th>
                    <th>Véhicule</th>
                    <th>Type</th>
                    <th>Contrôleur</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rdvList.data.map((rdv) => (
                    <tr key={rdv.id}>
                      <td>
                        <div>
                          <p className="font-semibold">{rdv.heure_debut}</p>
                          <p className="text-xs text-gray-500">{rdv.heure_fin}</p>
                        </div>
                      </td>
                      <td>
                        <div>
                          <p className="font-medium">
                            {rdv.client.prenom} {rdv.client.nom}
                          </p>
                          <p className="text-xs text-gray-500">{rdv.client.telephone}</p>
                        </div>
                      </td>
                      <td>
                        <div>
                          <p className="font-medium">{rdv.vehicule.immatriculation}</p>
                          <p className="text-xs text-gray-500">
                            {rdv.vehicule.marque} {rdv.vehicule.modele}
                          </p>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm">{rdv.type_controle}</span>
                      </td>
                      <td>
                        {rdv.controleur ? (
                          <span className="text-sm">
                            {rdv.controleur.initiales}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td>
                        <Badge variant={getRdvStatusVariant(rdv.statut)}>
                          {getRdvStatusLabel(rdv.statut)}
                        </Badge>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          {rdv.statut === 'CONFIRME' && (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleAction(rdv, 'checkin')}
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                            </Button>
                          )}
                          {rdv.statut === 'RAPPELE' && (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleAction(rdv, 'start')}
                              >
                                <PlayIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAction(rdv, 'noshow')}
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {rdv.statut === 'EN_COURS' && (
                            <Link href={`/dashboard/rdv/${rdv.id}/terminer`}>
                              <Button variant="success" size="sm">
                                Terminer
                              </Button>
                            </Link>
                          )}
                          <Link href={`/dashboard/rdv/${rdv.id}`}>
                            <Button variant="ghost" size="sm">
                              Détails
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun rendez-vous trouvé</p>
            <p className="text-sm text-gray-400 mt-2">
              Modifiez vos filtres ou créez un nouveau rendez-vous
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Modals */}
      <Modal
        isOpen={actionModal !== null}
        onClose={() => {
          setActionModal(null);
          setSelectedRdv(null);
        }}
        title={
          actionModal === 'checkin'
            ? 'Check-in client'
            : actionModal === 'start'
            ? 'Démarrer le contrôle'
            : actionModal === 'noshow'
            ? 'Marquer No-show'
            : ''
        }
      >
        {selectedRdv && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium">
                {selectedRdv.client.prenom} {selectedRdv.client.nom}
              </p>
              <p className="text-sm text-gray-500">
                {selectedRdv.vehicule.immatriculation} - {selectedRdv.heure_debut}
              </p>
            </div>

            {actionModal === 'checkin' && (
              <Alert variant="info">
                Le client va être enregistré comme présent. Un contrôleur pourra alors démarrer le contrôle.
              </Alert>
            )}

            {actionModal === 'start' && (
              <Alert variant="info">
                Le contrôle va démarrer. Le statut passera à "En cours".
              </Alert>
            )}

            {actionModal === 'noshow' && (
              <Alert variant="warning">
                Le client sera marqué comme absent. Cette action est irréversible.
              </Alert>
            )}
          </div>
        )}

        <ModalFooter>
          <Button variant="ghost" onClick={() => setActionModal(null)}>
            Annuler
          </Button>
          <Button
            variant={actionModal === 'noshow' ? 'danger' : 'primary'}
            onClick={executeAction}
            disabled={
              checkinMutation.isPending ||
              startMutation.isPending ||
              noshowMutation.isPending
            }
          >
            {actionModal === 'checkin' && 'Confirmer check-in'}
            {actionModal === 'start' && 'Démarrer'}
            {actionModal === 'noshow' && 'Confirmer No-show'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
