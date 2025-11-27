'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays, isTomorrow, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { api } from '@/lib/api';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Input,
  Badge,
  Modal,
  ModalFooter,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Spinner,
  Alert,
  PhoneIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  TruckIcon,
} from '@pti-calendar/design-system';

interface RdvToConfirm {
  id: string;
  client: {
    id: string;
    nom: string;
    prenom: string;
    telephone: string;
    email: string;
  };
  centre: {
    id: string;
    nom: string;
    ville: string;
    adresse: string;
  };
  date: string;
  heure_debut: string;
  heure_fin: string;
  type_controle: string;
  vehicule: {
    immatriculation: string;
    type: string;
  };
  statut: string;
  confirmation: {
    appele: boolean;
    date_appel?: string;
    resultat?: 'CONFIRME' | 'ANNULE' | 'NON_JOIGNABLE' | 'REPORTE';
    notes?: string;
  };
}

export default function ConfirmationsPage() {
  const queryClient = useQueryClient();
  const [filterDate, setFilterDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [selectedRdv, setSelectedRdv] = useState<RdvToConfirm | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Fetch RDV to confirm
  const { data: rdvList, isLoading } = useQuery({
    queryKey: ['rdv-confirmations', filterDate],
    queryFn: async () => {
      const response = await api.get<{ data: RdvToConfirm[] }>('/callcenter/rdv/confirmations', {
        params: { date: filterDate },
      });
      return response.data.data;
    },
  });

  // Stats
  const total = rdvList?.length || 0;
  const confirmes = rdvList?.filter((r) => r.confirmation.resultat === 'CONFIRME').length || 0;
  const nonAppeles = rdvList?.filter((r) => !r.confirmation.appele).length || 0;
  const nonJoignables = rdvList?.filter((r) => r.confirmation.resultat === 'NON_JOIGNABLE').length || 0;

  // Confirm mutation
  const confirmMutation = useMutation({
    mutationFn: async ({
      rdvId,
      resultat,
      notes,
    }: {
      rdvId: string;
      resultat: string;
      notes?: string;
    }) => {
      return api.post(`/callcenter/rdv/${rdvId}/confirmer`, { resultat, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rdv-confirmations'] });
      setShowConfirmModal(false);
      setSelectedRdv(null);
    },
  });

  const getDateLabel = () => {
    const date = new Date(filterDate);
    if (isToday(date)) return "Aujourd'hui";
    if (isTomorrow(date)) return 'Demain';
    return format(date, 'EEEE d MMMM', { locale: fr });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Confirmations de RDV</h1>
          <p className="text-gray-500 mt-1">Appelez les clients pour confirmer leurs rendez-vous</p>
        </div>
        <Input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="w-40"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{total}</p>
            <p className="text-sm text-gray-500">Total RDV</p>
          </CardContent>
        </Card>
        <Card className={nonAppeles > 0 ? 'border-orange-200 bg-orange-50' : ''}>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-orange-600">{nonAppeles}</p>
            <p className="text-sm text-gray-500">À appeler</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{confirmes}</p>
            <p className="text-sm text-gray-500">Confirmés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-red-600">{nonJoignables}</p>
            <p className="text-sm text-gray-500">Non joignables</p>
          </CardContent>
        </Card>
      </div>

      {/* Alert for pending */}
      {nonAppeles > 0 && (
        <Alert variant="warning">
          <div className="flex items-center justify-between w-full">
            <span>
              <strong>{nonAppeles}</strong> client(s) pour {getDateLabel()} n'ont pas encore été appelés
            </span>
            <Button
              size="sm"
              onClick={() => {
                const firstNonCalled = rdvList?.find((r) => !r.confirmation.appele);
                if (firstNonCalled) {
                  setSelectedRdv(firstNonCalled);
                  setShowConfirmModal(true);
                }
              }}
            >
              Commencer les appels
            </Button>
          </div>
        </Alert>
      )}

      {/* RDV List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : rdvList && rdvList.length > 0 ? (
        <Card>
          <CardHeader>
            <h2 className="font-semibold">RDV du {getDateLabel()}</h2>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Heure</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Centre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Véhicule</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rdvList.map((rdv) => (
                  <tr
                    key={rdv.id}
                    className={`hover:bg-gray-50 ${!rdv.confirmation.appele ? 'bg-yellow-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">{rdv.heure_debut}</p>
                      <p className="text-xs text-gray-500">{rdv.type_controle}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <UserIcon className="h-4 w-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium">{rdv.client.prenom} {rdv.client.nom}</p>
                          <p className="text-sm text-gray-500">{rdv.client.telephone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm">{rdv.centre.nom}</p>
                      <p className="text-xs text-gray-500">{rdv.centre.ville}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-sm">{rdv.vehicule.immatriculation}</p>
                      <p className="text-xs text-gray-500">{rdv.vehicule.type}</p>
                    </td>
                    <td className="px-4 py-3">
                      {rdv.confirmation.appele ? (
                        <Badge
                          variant={
                            rdv.confirmation.resultat === 'CONFIRME' ? 'confirme' :
                            rdv.confirmation.resultat === 'ANNULE' ? 'annule' :
                            rdv.confirmation.resultat === 'NON_JOIGNABLE' ? 'rappele' : 'en_attente'
                          }
                        >
                          {rdv.confirmation.resultat === 'CONFIRME' ? 'Confirmé' :
                           rdv.confirmation.resultat === 'ANNULE' ? 'Annulé' :
                           rdv.confirmation.resultat === 'NON_JOIGNABLE' ? 'Non joignable' :
                           rdv.confirmation.resultat === 'REPORTE' ? 'Reporté' : '-'}
                        </Badge>
                      ) : (
                        <Badge variant="en_attente">À appeler</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant={rdv.confirmation.appele ? 'outline' : 'primary'}
                        onClick={() => {
                          setSelectedRdv(rdv);
                          setShowConfirmModal(true);
                        }}
                      >
                        <PhoneIcon className="h-4 w-4 mr-1" />
                        {rdv.confirmation.appele ? 'Rappeler' : 'Appeler'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun RDV prévu pour cette date</p>
          </CardContent>
        </Card>
      )}

      {/* Confirm Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setSelectedRdv(null);
        }}
        rdv={selectedRdv}
        onConfirm={(resultat, notes) => {
          if (selectedRdv) {
            confirmMutation.mutate({ rdvId: selectedRdv.id, resultat, notes });
          }
        }}
        isLoading={confirmMutation.isPending}
        onNext={() => {
          // Find next non-called RDV
          const currentIndex = rdvList?.findIndex((r) => r.id === selectedRdv?.id) || 0;
          const nextRdv = rdvList?.slice(currentIndex + 1).find((r) => !r.confirmation.appele);
          if (nextRdv) {
            setSelectedRdv(nextRdv);
          } else {
            setShowConfirmModal(false);
            setSelectedRdv(null);
          }
        }}
      />
    </div>
  );
}

function ConfirmationModal({
  isOpen,
  onClose,
  rdv,
  onConfirm,
  isLoading,
  onNext,
}: {
  isOpen: boolean;
  onClose: () => void;
  rdv: RdvToConfirm | null;
  onConfirm: (resultat: string, notes?: string) => void;
  isLoading: boolean;
  onNext: () => void;
}) {
  const [notes, setNotes] = useState('');

  if (!rdv) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmation de RDV" size="lg">
      <div className="space-y-6">
        {/* Script */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-blue-800 mb-2">Script d'appel</p>
          <p className="text-blue-700">
            "Bonjour, je vous appelle de la part du centre de contrôle technique {rdv.centre.nom}.
            Je souhaitais confirmer votre rendez-vous prévu le{' '}
            <strong>{format(new Date(rdv.date), 'EEEE d MMMM', { locale: fr })}</strong> à{' '}
            <strong>{rdv.heure_debut}</strong> pour votre véhicule immatriculé{' '}
            <strong>{rdv.vehicule.immatriculation}</strong>. Pouvez-vous me confirmer votre présence ?"
          </p>
        </div>

        {/* RDV Info */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Client</p>
                <p className="font-medium">{rdv.client.prenom} {rdv.client.nom}</p>
                <p className="text-sm">{rdv.client.telephone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Centre</p>
                <p className="font-medium">{rdv.centre.nom}</p>
                <p className="text-sm">{rdv.centre.ville}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date et heure</p>
                <p className="font-medium">{format(new Date(rdv.date), 'dd/MM/yyyy')} à {rdv.heure_debut}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Véhicule</p>
                <p className="font-medium font-mono">{rdv.vehicule.immatriculation}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            className="w-full p-3 border rounded-lg min-h-[80px]"
            placeholder="Notes sur l'appel..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="primary"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => {
              onConfirm('CONFIRME', notes);
              setNotes('');
            }}
            disabled={isLoading}
          >
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            Confirmé
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              onConfirm('ANNULE', notes);
              setNotes('');
            }}
            disabled={isLoading}
          >
            <XCircleIcon className="h-5 w-5 mr-2" />
            Annulé
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              onConfirm('NON_JOIGNABLE', notes);
              setNotes('');
            }}
            disabled={isLoading}
          >
            <PhoneIcon className="h-5 w-5 mr-2" />
            Non joignable
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              onConfirm('REPORTE', notes);
              setNotes('');
            }}
            disabled={isLoading}
          >
            <ClockIcon className="h-5 w-5 mr-2" />
            Reporté
          </Button>
        </div>
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>Fermer</Button>
        <Button variant="outline" onClick={onNext}>
          Passer au suivant
        </Button>
      </ModalFooter>
    </Modal>
  );
}
