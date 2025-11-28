'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useAuth } from './providers';
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
  TimeSlotGrid,
  getRdvStatusVariant,
  getRdvStatusLabel,
  CalendarIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  UserIcon,
  TruckIcon,
  MapPinIcon,
  PlusIcon,
  ArrowRightOnRectangleIcon,
} from '@pti-calendar/design-system';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('pti_cc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

interface Client {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  rdv_count: number;
}

interface Centre {
  id: string;
  nom: string;
  ville: string;
  code_postal: string;
}

export default function CallCenterPage() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const queryClient = useQueryClient();

  const [searchPhone, setSearchPhone] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showNewRdvModal, setShowNewRdvModal] = useState(false);
  const [searchCentre, setSearchCentre] = useState('');
  const [selectedCentre, setSelectedCentre] = useState<Centre | null>(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedSlot, setSelectedSlot] = useState<{ heure_debut: string; heure_fin: string } | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [isLoading, isAuthenticated]);

  // Search client by phone
  const { data: clients, isLoading: searchingClients } = useQuery({
    queryKey: ['search-client', searchPhone],
    queryFn: async () => {
      if (searchPhone.length < 6) return [];
      const response = await api.get('/callcenter/clients/search', {
        params: { telephone: searchPhone },
      });
      return response.data.data as Client[];
    },
    enabled: searchPhone.length >= 6,
  });

  // Search centres
  const { data: centres } = useQuery({
    queryKey: ['search-centres', searchCentre],
    queryFn: async () => {
      if (searchCentre.length < 2) return [];
      const response = await api.get('/centres', {
        params: { search: searchCentre, limit: 10 },
      });
      return response.data.data as Centre[];
    },
    enabled: searchCentre.length >= 2,
  });

  // Get disponibilités
  const { data: slots, isLoading: loadingSlots } = useQuery({
    queryKey: ['slots', selectedCentre?.id, selectedDate],
    queryFn: async () => {
      if (!selectedCentre) return { creneaux: [] };
      const response = await api.get(`/centres/${selectedCentre.id}/disponibilites`, {
        params: { date: selectedDate, type_controle: 'PERIODIQUE' },
      });
      return response.data;
    },
    enabled: !!selectedCentre,
  });

  // Create RDV
  const createRdvMutation = useMutation({
    mutationFn: async (data: {
      client_id?: string;
      client: { civilite: string; nom: string; prenom: string; email: string; telephone: string };
      centre_id: string;
      date: string;
      heure_debut: string;
      heure_fin: string;
      type_controle?: string;
      vehicule: { immatriculation: string; type_vehicule: string; type_carburant: string };
    }) => {
      const response = await api.post('/callcenter/rdv', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-rdv'] });
      setShowNewRdvModal(false);
      setSelectedSlot(null);
    },
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="callcenter-header">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <PhoneIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">PTI CallCenter</h1>
              <p className="text-xs text-gray-500">Interface agent</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user?.prenom} {user?.nom}</p>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Search Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  Recherche client
                </h2>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-4">
                <Input
                  placeholder="Numéro de téléphone..."
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  leftIcon={<PhoneIcon className="h-5 w-5" />}
                />

                {searchingClients && <Spinner size="sm" />}

                {clients && clients.length > 0 && (
                  <div className="space-y-2">
                    {clients.map((client) => (
                      <div
                        key={client.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedClient?.id === client.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedClient(client)}
                      >
                        <p className="font-medium text-gray-900">{client.prenom} {client.nom}</p>
                        <p className="text-sm text-gray-500">{client.telephone}</p>
                        <p className="text-xs text-gray-400 mt-1">{client.rdv_count} RDV précédents</p>
                      </div>
                    ))}
                  </div>
                )}

                {searchPhone.length >= 6 && clients && clients.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">Aucun client trouvé</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => setShowNewRdvModal(true)}
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Nouveau client
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedClient && (
              <Card>
                <CardHeader>
                  <h2 className="font-semibold text-gray-900">Client sélectionné</h2>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-gray-400" />
                      <span>{selectedClient.prenom} {selectedClient.nom}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="h-4 w-4 text-gray-400" />
                      <span>{selectedClient.telephone}</span>
                    </div>
                  </div>
                  <Button className="w-full mt-4" onClick={() => setShowNewRdvModal(true)}>
                    <CalendarIcon className="h-5 w-5 mr-2" />
                    Prendre RDV
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content - Booking */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  Prise de rendez-vous rapide
                </h2>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-4">
                {/* Centre search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Centre</label>
                  <Input
                    placeholder="Rechercher un centre (ville, code postal)..."
                    value={searchCentre}
                    onChange={(e) => setSearchCentre(e.target.value)}
                    leftIcon={<MapPinIcon className="h-5 w-5" />}
                  />
                  {centres && centres.length > 0 && !selectedCentre && (
                    <div className="mt-2 border rounded-lg divide-y">
                      {centres.map((centre) => (
                        <div
                          key={centre.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            setSelectedCentre(centre);
                            setSearchCentre(centre.nom);
                          }}
                        >
                          <p className="font-medium">{centre.nom}</p>
                          <p className="text-sm text-gray-500">{centre.ville} ({centre.code_postal})</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedCentre && (
                  <>
                    {/* Date selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                      <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={format(new Date(), 'yyyy-MM-dd')}
                      />
                    </div>

                    {/* Slots */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Créneaux disponibles</label>
                      {loadingSlots ? (
                        <div className="flex justify-center py-8"><Spinner size="md" /></div>
                      ) : slots?.creneaux && slots.creneaux.length > 0 ? (
                        <TimeSlotGrid
                          slots={slots.creneaux}
                          selectedSlotId={selectedSlot?.heure_debut}
                          onSelect={(slot) => setSelectedSlot({ heure_debut: slot.heure_debut, heure_fin: slot.heure_fin })}
                        />
                      ) : (
                        <p className="text-center py-8 text-gray-500">Aucun créneau disponible</p>
                      )}
                    </div>

                    {selectedSlot && (
                      <Alert variant="info">
                        Créneau sélectionné : {selectedDate} à {selectedSlot.heure_debut}
                        <Button
                          size="sm"
                          className="ml-4"
                          onClick={() => setShowNewRdvModal(true)}
                        >
                          Confirmer le RDV
                        </Button>
                      </Alert>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* New RDV Modal */}
      <NewRdvModal
        isOpen={showNewRdvModal}
        onClose={() => setShowNewRdvModal(false)}
        client={selectedClient}
        centre={selectedCentre}
        date={selectedDate}
        slot={selectedSlot}
        onSubmit={(data) => createRdvMutation.mutate(data)}
        isSubmitting={createRdvMutation.isPending}
      />
    </div>
  );
}

function NewRdvModal({
  isOpen,
  onClose,
  client,
  centre,
  date,
  slot,
  onSubmit,
  isSubmitting,
}: {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  centre: Centre | null;
  date: string;
  slot: { heure_debut: string; heure_fin: string } | null;
  onSubmit: (data: {
    client_id?: string;
    client: { civilite: string; nom: string; prenom: string; email: string; telephone: string };
    centre_id: string;
    date: string;
    heure_debut: string;
    heure_fin: string;
    type_controle?: string;
    vehicule: { immatriculation: string; type_vehicule: string; type_carburant: string };
  }) => void;
  isSubmitting: boolean;
}) {
  const [formData, setFormData] = useState({
    civilite: 'M',
    nom: client?.nom || '',
    prenom: client?.prenom || '',
    email: client?.email || '',
    telephone: client?.telephone || '',
    immatriculation: '',
    type_vehicule: 'VL',
    type_carburant: 'ESSENCE',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!centre || !slot) return;

    onSubmit({
      client_id: client?.id,
      client: {
        civilite: formData.civilite,
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        telephone: formData.telephone,
      },
      centre_id: centre.id,
      date,
      heure_debut: slot.heure_debut,
      heure_fin: slot.heure_fin,
      type_controle: 'PERIODIQUE',
      vehicule: {
        immatriculation: formData.immatriculation,
        type_vehicule: formData.type_vehicule,
        type_carburant: formData.type_carburant,
      },
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouveau rendez-vous">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Récap */}
        {centre && slot && (
          <div className="p-3 bg-gray-50 rounded-lg text-sm">
            <p><strong>Centre:</strong> {centre.nom}</p>
            <p><strong>Date:</strong> {format(new Date(date), 'd MMMM yyyy', { locale: fr })}</p>
            <p><strong>Heure:</strong> {slot.heure_debut} - {slot.heure_fin}</p>
          </div>
        )}

        {/* Client info */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Civilité"
            value={formData.civilite}
            onChange={(e) => setFormData({ ...formData, civilite: e.target.value })}
            options={[{ value: 'M', label: 'M.' }, { value: 'MME', label: 'Mme' }]}
          />
          <Input
            label="Téléphone"
            value={formData.telephone}
            onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Nom"
            value={formData.nom}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            required
          />
          <Input
            label="Prénom"
            value={formData.prenom}
            onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
            required
          />
        </div>
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />

        {/* Véhicule */}
        <div className="border-t pt-4">
          <h3 className="font-medium text-gray-900 mb-3">Véhicule</h3>
          <Input
            label="Immatriculation"
            value={formData.immatriculation}
            onChange={(e) => setFormData({ ...formData, immatriculation: e.target.value.toUpperCase() })}
            placeholder="AB-123-CD"
            required
          />
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Select
              label="Type"
              value={formData.type_vehicule}
              onChange={(e) => setFormData({ ...formData, type_vehicule: e.target.value })}
              options={[
                { value: 'VL', label: 'VL' },
                { value: 'VUL', label: 'VUL' },
                { value: 'MOTO', label: 'Moto' },
              ]}
            />
            <Select
              label="Carburant"
              value={formData.type_carburant}
              onChange={(e) => setFormData({ ...formData, type_carburant: e.target.value })}
              options={[
                { value: 'ESSENCE', label: 'Essence' },
                { value: 'DIESEL', label: 'Diesel' },
                { value: 'ELECTRIQUE', label: 'Électrique' },
                { value: 'HYBRIDE', label: 'Hybride' },
              ]}
            />
          </div>
        </div>

        <ModalFooter>
          <Button variant="ghost" type="button" onClick={onClose}>Annuler</Button>
          <Button type="submit" disabled={isSubmitting || !centre || !slot}>
            {isSubmitting ? 'Création...' : 'Créer le RDV'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
