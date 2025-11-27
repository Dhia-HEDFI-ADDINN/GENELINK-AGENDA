'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isToday, isTomorrow, isPast, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { api } from '@/lib/api';
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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Spinner,
  Alert,
  ClockIcon,
  PhoneIcon,
  UserIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
} from '@pti-calendar/design-system';

interface Rappel {
  id: string;
  client_id: string;
  client_nom: string;
  client_telephone: string;
  date: string;
  heure: string;
  motif: string;
  priorite: 'HAUTE' | 'NORMALE' | 'BASSE';
  statut: 'EN_ATTENTE' | 'EFFECTUE' | 'ECHEC' | 'REPORTE';
  tentatives: number;
  notes?: string;
  rdv_id?: string;
  rdv_date?: string;
  created_at: string;
  agent_id: string;
  agent_nom: string;
}

export default function RappelsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('en_attente');
  const [filterDate, setFilterDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showNewRappelModal, setShowNewRappelModal] = useState(false);
  const [selectedRappel, setSelectedRappel] = useState<Rappel | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  // Fetch rappels
  const { data: rappels, isLoading } = useQuery({
    queryKey: ['rappels', activeTab, filterDate],
    queryFn: async () => {
      const response = await api.get<{ data: Rappel[] }>('/callcenter/rappels', {
        params: {
          statut: activeTab === 'en_attente' ? 'EN_ATTENTE' : activeTab === 'effectues' ? 'EFFECTUE,ECHEC' : undefined,
          date: filterDate,
        },
      });
      return response.data.data;
    },
  });

  // Mark rappel as done
  const completeRappelMutation = useMutation({
    mutationFn: async ({ id, statut, notes }: { id: string; statut: string; notes?: string }) => {
      return api.patch(`/callcenter/rappels/${id}`, { statut, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rappels'] });
      setShowResultModal(false);
      setSelectedRappel(null);
    },
  });

  // Reschedule rappel
  const rescheduleRappelMutation = useMutation({
    mutationFn: async ({ id, date, heure }: { id: string; date: string; heure: string }) => {
      return api.patch(`/callcenter/rappels/${id}`, { date, heure, statut: 'REPORTE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rappels'] });
    },
  });

  const getPriorityBadge = (priorite: string) => {
    switch (priorite) {
      case 'HAUTE':
        return <Badge variant="annule">Haute</Badge>;
      case 'NORMALE':
        return <Badge variant="en_attente">Normale</Badge>;
      case 'BASSE':
        return <Badge variant="valide">Basse</Badge>;
      default:
        return null;
    }
  };

  const getDateLabel = (date: string) => {
    const d = new Date(date);
    if (isToday(d)) return 'Aujourd\'hui';
    if (isTomorrow(d)) return 'Demain';
    if (isPast(d)) return 'En retard';
    return format(d, 'EEEE d MMMM', { locale: fr });
  };

  const getDateBadgeVariant = (date: string): any => {
    const d = new Date(date);
    if (isPast(d) && !isToday(d)) return 'annule';
    if (isToday(d)) return 'rappele';
    return 'en_attente';
  };

  // Group rappels by time
  const urgentRappels = rappels?.filter((r) => isPast(new Date(`${r.date}T${r.heure}`)) && r.statut === 'EN_ATTENTE') || [];
  const todayRappels = rappels?.filter((r) => isToday(new Date(r.date)) && r.statut === 'EN_ATTENTE' && !isPast(new Date(`${r.date}T${r.heure}`))) || [];
  const futureRappels = rappels?.filter((r) => !isToday(new Date(r.date)) && !isPast(new Date(r.date)) && r.statut === 'EN_ATTENTE') || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des rappels</h1>
          <p className="text-gray-500 mt-1">Planifiez et suivez vos rappels clients</p>
        </div>
        <Button onClick={() => setShowNewRappelModal(true)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Nouveau rappel
        </Button>
      </div>

      {/* Urgent Alert */}
      {urgentRappels.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              <div>
                <p className="font-medium text-red-800">
                  {urgentRappels.length} rappel(s) en retard
                </p>
                <p className="text-sm text-red-600">À traiter en priorité</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-orange-600">{urgentRappels.length}</p>
            <p className="text-sm text-gray-500">En retard</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary-600">{todayRappels.length}</p>
            <p className="text-sm text-gray-500">Aujourd'hui</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-gray-600">{futureRappels.length}</p>
            <p className="text-sm text-gray-500">À venir</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">
              {rappels?.filter((r) => r.statut === 'EFFECTUE').length || 0}
            </p>
            <p className="text-sm text-gray-500">Effectués aujourd'hui</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="en_attente">
            <ClockIcon className="h-4 w-4 mr-2" />
            En attente ({(rappels?.filter((r) => r.statut === 'EN_ATTENTE').length || 0)})
          </TabsTrigger>
          <TabsTrigger value="effectues">
            <CheckCircleIcon className="h-4 w-4 mr-2" />
            Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="en_attente" className="mt-6 space-y-6">
          {/* Urgent Section */}
          {urgentRappels.length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <h3 className="font-semibold text-red-700">En retard - À traiter immédiatement</h3>
              </CardHeader>
              <CardContent className="p-0">
                <RappelsList
                  rappels={urgentRappels}
                  onCall={(rappel) => {
                    setSelectedRappel(rappel);
                    setShowResultModal(true);
                  }}
                  onReschedule={(rappel) => {
                    const newDate = format(addDays(new Date(), 1), 'yyyy-MM-dd');
                    rescheduleRappelMutation.mutate({ id: rappel.id, date: newDate, heure: rappel.heure });
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Today Section */}
          {todayRappels.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Aujourd'hui</h3>
              </CardHeader>
              <CardContent className="p-0">
                <RappelsList
                  rappels={todayRappels}
                  onCall={(rappel) => {
                    setSelectedRappel(rappel);
                    setShowResultModal(true);
                  }}
                  onReschedule={(rappel) => {
                    const newDate = format(addDays(new Date(), 1), 'yyyy-MM-dd');
                    rescheduleRappelMutation.mutate({ id: rappel.id, date: newDate, heure: rappel.heure });
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Future Section */}
          {futureRappels.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="font-semibold">À venir</h3>
              </CardHeader>
              <CardContent className="p-0">
                <RappelsList
                  rappels={futureRappels}
                  onCall={(rappel) => {
                    setSelectedRappel(rappel);
                    setShowResultModal(true);
                  }}
                  onReschedule={(rappel) => {
                    const newDate = format(addDays(new Date(rappel.date), 1), 'yyyy-MM-dd');
                    rescheduleRappelMutation.mutate({ id: rappel.id, date: newDate, heure: rappel.heure });
                  }}
                />
              </CardContent>
            </Card>
          )}

          {isLoading && (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          )}

          {!isLoading && rappels?.filter((r) => r.statut === 'EN_ATTENTE').length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircleIcon className="h-12 w-12 text-green-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucun rappel en attente</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="effectues" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Historique des rappels</h3>
                <Input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-40"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {rappels && rappels.filter((r) => r.statut !== 'EN_ATTENTE').length > 0 ? (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motif</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Heure</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Résultat</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {rappels.filter((r) => r.statut !== 'EN_ATTENTE').map((rappel) => (
                      <tr key={rappel.id}>
                        <td className="px-4 py-3">
                          <p className="font-medium">{rappel.client_nom}</p>
                          <p className="text-sm text-gray-500">{rappel.client_telephone}</p>
                        </td>
                        <td className="px-4 py-3 text-sm">{rappel.motif}</td>
                        <td className="px-4 py-3 text-sm">
                          {format(new Date(rappel.date), 'dd/MM/yyyy')} à {rappel.heure}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={rappel.statut === 'EFFECTUE' ? 'confirme' : 'annule'}>
                            {rappel.statut === 'EFFECTUE' ? 'Effectué' : rappel.statut === 'ECHEC' ? 'Échec' : 'Reporté'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                          {rappel.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  Aucun rappel dans l'historique pour cette date
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Result Modal */}
      <RappelResultModal
        isOpen={showResultModal}
        onClose={() => {
          setShowResultModal(false);
          setSelectedRappel(null);
        }}
        rappel={selectedRappel}
        onComplete={(statut, notes) => {
          if (selectedRappel) {
            completeRappelMutation.mutate({ id: selectedRappel.id, statut, notes });
          }
        }}
        isLoading={completeRappelMutation.isPending}
      />

      {/* New Rappel Modal */}
      <NewRappelModal
        isOpen={showNewRappelModal}
        onClose={() => setShowNewRappelModal(false)}
      />
    </div>
  );
}

function RappelsList({
  rappels,
  onCall,
  onReschedule,
}: {
  rappels: Rappel[];
  onCall: (rappel: Rappel) => void;
  onReschedule: (rappel: Rappel) => void;
}) {
  return (
    <div className="divide-y">
      {rappels.map((rappel) => (
        <div key={rappel.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gray-100 rounded-lg">
              <ClockIcon className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="font-medium">{rappel.client_nom}</p>
              <p className="text-sm text-gray-500">{rappel.client_telephone}</p>
              <p className="text-xs text-gray-400 mt-1">{rappel.motif}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">
                {format(new Date(rappel.date), 'dd/MM/yyyy')}
              </p>
              <p className="text-sm text-gray-500">{rappel.heure}</p>
            </div>
            <Badge variant={rappel.priorite === 'HAUTE' ? 'annule' : rappel.priorite === 'NORMALE' ? 'en_attente' : 'valide'}>
              {rappel.priorite}
            </Badge>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => onCall(rappel)}>
                <PhoneIcon className="h-4 w-4 mr-1" />
                Appeler
              </Button>
              <Button variant="outline" size="sm" onClick={() => onReschedule(rappel)}>
                Reporter
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RappelResultModal({
  isOpen,
  onClose,
  rappel,
  onComplete,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  rappel: Rappel | null;
  onComplete: (statut: string, notes: string) => void;
  isLoading: boolean;
}) {
  const [notes, setNotes] = useState('');

  if (!rappel) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Résultat de l'appel">
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="font-medium">{rappel.client_nom}</p>
          <p className="text-sm text-gray-600">{rappel.client_telephone}</p>
          <p className="text-xs text-gray-500 mt-2">Motif: {rappel.motif}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            className="w-full p-3 border rounded-lg min-h-[100px]"
            placeholder="Notes sur l'appel..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>Annuler</Button>
        <Button
          variant="danger"
          onClick={() => onComplete('ECHEC', notes)}
          disabled={isLoading}
        >
          <XCircleIcon className="h-4 w-4 mr-1" />
          Non joignable
        </Button>
        <Button
          onClick={() => onComplete('EFFECTUE', notes)}
          disabled={isLoading}
        >
          <CheckCircleIcon className="h-4 w-4 mr-1" />
          Effectué
        </Button>
      </ModalFooter>
    </Modal>
  );
}

function NewRappelModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [searchPhone, setSearchPhone] = useState('');
  const [formData, setFormData] = useState({
    client_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    heure: '10:00',
    motif: '',
    priorite: 'NORMALE' as const,
  });

  // Search client
  const { data: clients } = useQuery({
    queryKey: ['search-client-rappel', searchPhone],
    queryFn: async () => {
      if (searchPhone.length < 6) return [];
      const response = await api.get('/callcenter/clients/search', {
        params: { telephone: searchPhone },
      });
      return response.data.data;
    },
    enabled: searchPhone.length >= 6,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return api.post('/callcenter/rappels', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rappels'] });
      onClose();
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Programmer un rappel">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
          <Input
            placeholder="Rechercher par téléphone..."
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
            leftIcon={<PhoneIcon className="h-5 w-5" />}
          />
          {clients && clients.length > 0 && (
            <div className="mt-2 border rounded-lg divide-y max-h-32 overflow-y-auto">
              {clients.map((client: any) => (
                <div
                  key={client.id}
                  className={`p-2 cursor-pointer hover:bg-gray-50 ${formData.client_id === client.id ? 'bg-primary-50' : ''}`}
                  onClick={() => setFormData({ ...formData, client_id: client.id })}
                >
                  <p className="text-sm font-medium">{client.prenom} {client.nom}</p>
                  <p className="text-xs text-gray-500">{client.telephone}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            type="date"
            label="Date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            min={format(new Date(), 'yyyy-MM-dd')}
          />
          <Input
            type="time"
            label="Heure"
            value={formData.heure}
            onChange={(e) => setFormData({ ...formData, heure: e.target.value })}
          />
        </div>

        <Input
          label="Motif"
          value={formData.motif}
          onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
          placeholder="Confirmation RDV, relance, etc."
        />

        <Select
          label="Priorité"
          value={formData.priorite}
          onChange={(e) => setFormData({ ...formData, priorite: e.target.value as any })}
          options={[
            { value: 'HAUTE', label: 'Haute' },
            { value: 'NORMALE', label: 'Normale' },
            { value: 'BASSE', label: 'Basse' },
          ]}
        />
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>Annuler</Button>
        <Button
          onClick={() => createMutation.mutate(formData)}
          disabled={!formData.client_id || !formData.motif || createMutation.isPending}
        >
          {createMutation.isPending ? 'Création...' : 'Créer le rappel'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
