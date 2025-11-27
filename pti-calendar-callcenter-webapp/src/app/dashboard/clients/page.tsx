'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
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
  MagnifyingGlassIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  TruckIcon,
  CalendarIcon,
  ClockIcon,
  PlusIcon,
  PencilIcon,
  getRdvStatusVariant,
  getRdvStatusLabel,
} from '@pti-calendar/design-system';

interface Client {
  id: string;
  civilite: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse?: string;
  code_postal?: string;
  ville?: string;
  date_naissance?: string;
  created_at: string;
  rdv_count: number;
  derniere_visite?: string;
}

interface ClientDetail extends Client {
  vehicules: Array<{
    id: string;
    immatriculation: string;
    marque: string;
    modele: string;
    type_vehicule: string;
    type_carburant: string;
    date_premiere_immat?: string;
  }>;
  rdv_historique: Array<{
    id: string;
    date: string;
    heure_debut: string;
    centre_nom: string;
    type_controle: string;
    statut: string;
    resultat?: string;
    vehicule_immat: string;
  }>;
  notes: Array<{
    id: string;
    contenu: string;
    created_at: string;
    agent_nom: string;
  }>;
}

export default function ClientsPage() {
  const queryClient = useQueryClient();

  const [searchType, setSearchType] = useState<'telephone' | 'nom' | 'email' | 'immat'>('telephone');
  const [searchValue, setSearchValue] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientDetail | null>(null);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [noteContent, setNoteContent] = useState('');

  // Search clients
  const { data: clients, isLoading: searching } = useQuery({
    queryKey: ['search-clients', searchType, searchValue],
    queryFn: async () => {
      if (searchValue.length < 3) return [];
      const response = await api.get<{ data: Client[] }>('/callcenter/clients/search', {
        params: { [searchType]: searchValue },
      });
      return response.data.data;
    },
    enabled: searchValue.length >= 3,
  });

  // Fetch client detail
  const { data: clientDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['client-detail', selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return null;
      const response = await api.get<ClientDetail>(`/callcenter/clients/${selectedClient.id}`);
      return response.data;
    },
    enabled: !!selectedClient?.id,
  });

  // Add note
  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      return api.post(`/callcenter/clients/${selectedClient?.id}/notes`, { contenu: content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-detail', selectedClient?.id] });
      setShowAddNoteModal(false);
      setNoteContent('');
    },
  });

  // Update client
  const updateClientMutation = useMutation({
    mutationFn: async (data: Partial<Client>) => {
      return api.put(`/callcenter/clients/${selectedClient?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-detail', selectedClient?.id] });
      queryClient.invalidateQueries({ queryKey: ['search-clients'] });
      setShowEditModal(false);
    },
  });

  // Schedule callback
  const scheduleCallbackMutation = useMutation({
    mutationFn: async (data: { date: string; heure: string; motif: string }) => {
      return api.post(`/callcenter/clients/${selectedClient?.id}/rappels`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-detail', selectedClient?.id] });
      alert('Rappel programmé');
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Recherche client</h1>
        <p className="text-gray-500 mt-1">Recherchez un client et consultez son historique complet</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h2 className="font-semibold flex items-center gap-2">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                Recherche
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as any)}
                options={[
                  { value: 'telephone', label: 'Par téléphone' },
                  { value: 'nom', label: 'Par nom' },
                  { value: 'email', label: 'Par email' },
                  { value: 'immat', label: 'Par immatriculation' },
                ]}
              />
              <Input
                placeholder={
                  searchType === 'telephone' ? '06 12 34 56 78' :
                  searchType === 'nom' ? 'Nom du client' :
                  searchType === 'email' ? 'email@exemple.com' :
                  'AB-123-CD'
                }
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                leftIcon={
                  searchType === 'telephone' ? <PhoneIcon className="h-5 w-5" /> :
                  searchType === 'immat' ? <TruckIcon className="h-5 w-5" /> :
                  <MagnifyingGlassIcon className="h-5 w-5" />
                }
              />
            </CardContent>
          </Card>

          {/* Search Results */}
          {searching && (
            <div className="flex justify-center py-4">
              <Spinner size="md" />
            </div>
          )}

          {clients && clients.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="font-medium text-sm text-gray-500">
                  {clients.length} résultat(s)
                </h3>
              </CardHeader>
              <CardContent className="p-0 divide-y">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedClient?.id === client.id
                        ? 'bg-primary-50 border-l-4 border-primary-500'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedClient(client as any)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {client.civilite} {client.prenom} {client.nom}
                        </p>
                        <p className="text-sm text-gray-500">{client.telephone}</p>
                      </div>
                      <div className="text-right text-xs text-gray-400">
                        <p>{client.rdv_count} RDV</p>
                        {client.derniere_visite && (
                          <p>Dernier: {format(new Date(client.derniere_visite), 'dd/MM/yy')}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {searchValue.length >= 3 && clients && clients.length === 0 && !searching && (
            <Alert variant="info">
              Aucun client trouvé pour cette recherche.
              <Link href="/dashboard/nouveau-rdv" className="block mt-2">
                <Button size="sm">
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Créer un nouveau client
                </Button>
              </Link>
            </Alert>
          )}
        </div>

        {/* Client Detail */}
        <div className="lg:col-span-2">
          {selectedClient && (
            <>
              {loadingDetail ? (
                <div className="flex justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : clientDetail ? (
                <div className="space-y-6">
                  {/* Client Info Card */}
                  <Card>
                    <CardHeader className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center">
                          <UserIcon className="h-7 w-7 text-primary-600" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold">
                            {clientDetail.civilite} {clientDetail.prenom} {clientDetail.nom}
                          </h2>
                          <p className="text-gray-500">Client depuis {format(new Date(clientDetail.created_at), 'MMMM yyyy', { locale: fr })}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)}>
                          <PencilIcon className="h-4 w-4 mr-1" />
                          Modifier
                        </Button>
                        <Link href={`/dashboard/nouveau-rdv?client_id=${clientDetail.id}`}>
                          <Button size="sm">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            Nouveau RDV
                          </Button>
                        </Link>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <PhoneIcon className="h-4 w-4 text-gray-400" />
                          <span>{clientDetail.telephone}</span>
                          <Button variant="ghost" size="sm" className="ml-auto">
                            <PhoneIcon className="h-4 w-4 text-green-500" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                          <span>{clientDetail.email}</span>
                        </div>
                        {clientDetail.adresse && (
                          <div className="col-span-2 text-gray-600">
                            {clientDetail.adresse}, {clientDetail.code_postal} {clientDetail.ville}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tabs */}
                  <Tabs defaultValue="historique">
                    <TabsList>
                      <TabsTrigger value="historique">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Historique RDV ({clientDetail.rdv_historique.length})
                      </TabsTrigger>
                      <TabsTrigger value="vehicules">
                        <TruckIcon className="h-4 w-4 mr-2" />
                        Véhicules ({clientDetail.vehicules.length})
                      </TabsTrigger>
                      <TabsTrigger value="notes">
                        Notes ({clientDetail.notes.length})
                      </TabsTrigger>
                    </TabsList>

                    {/* Historique Tab */}
                    <TabsContent value="historique" className="mt-4">
                      <Card>
                        <CardContent className="p-0">
                          {clientDetail.rdv_historique.length > 0 ? (
                            <table className="w-full">
                              <thead className="bg-gray-50 border-b">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Centre</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Véhicule</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Résultat</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {clientDetail.rdv_historique.map((rdv) => (
                                  <tr key={rdv.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                      <p className="font-medium">{format(new Date(rdv.date), 'dd/MM/yyyy')}</p>
                                      <p className="text-xs text-gray-500">{rdv.heure_debut}</p>
                                    </td>
                                    <td className="px-4 py-3 text-sm">{rdv.centre_nom}</td>
                                    <td className="px-4 py-3 text-sm">{rdv.type_controle}</td>
                                    <td className="px-4 py-3 text-sm font-mono">{rdv.vehicule_immat}</td>
                                    <td className="px-4 py-3">
                                      <Badge variant={getRdvStatusVariant(rdv.statut)}>
                                        {getRdvStatusLabel(rdv.statut)}
                                      </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                      {rdv.resultat && (
                                        <Badge variant={rdv.resultat === 'FAVORABLE' ? 'confirme' : 'annule'}>
                                          {rdv.resultat}
                                        </Badge>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="p-8 text-center text-gray-500">
                              Aucun historique de RDV
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Véhicules Tab */}
                    <TabsContent value="vehicules" className="mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {clientDetail.vehicules.length > 0 ? (
                          clientDetail.vehicules.map((vehicule) => (
                            <Card key={vehicule.id}>
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                      <TruckIcon className="h-6 w-6 text-gray-600" />
                                    </div>
                                    <div>
                                      <p className="font-bold font-mono">{vehicule.immatriculation}</p>
                                      <p className="text-sm text-gray-600">
                                        {vehicule.marque} {vehicule.modele}
                                      </p>
                                    </div>
                                  </div>
                                  <Badge variant="en_attente">{vehicule.type_vehicule}</Badge>
                                </div>
                                <div className="mt-3 text-sm text-gray-500 space-y-1">
                                  <p>Carburant: {vehicule.type_carburant}</p>
                                  {vehicule.date_premiere_immat && (
                                    <p>1ère immat: {format(new Date(vehicule.date_premiere_immat), 'dd/MM/yyyy')}</p>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <div className="col-span-2 text-center py-8 text-gray-500">
                            Aucun véhicule enregistré
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* Notes Tab */}
                    <TabsContent value="notes" className="mt-4">
                      <Card>
                        <CardHeader className="flex items-center justify-between">
                          <h3 className="font-semibold">Notes internes</h3>
                          <Button size="sm" onClick={() => setShowAddNoteModal(true)}>
                            <PlusIcon className="h-4 w-4 mr-1" />
                            Ajouter
                          </Button>
                        </CardHeader>
                        <CardContent className="p-0 divide-y">
                          {clientDetail.notes.length > 0 ? (
                            clientDetail.notes.map((note) => (
                              <div key={note.id} className="p-4">
                                <p className="text-sm">{note.contenu}</p>
                                <p className="text-xs text-gray-400 mt-2">
                                  {note.agent_nom} - {format(new Date(note.created_at), 'dd/MM/yyyy HH:mm')}
                                </p>
                              </div>
                            ))
                          ) : (
                            <div className="p-8 text-center text-gray-500">
                              Aucune note pour ce client
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <h3 className="font-semibold">Actions rapides</h3>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          Programmer rappel
                        </Button>
                        <Button variant="outline" size="sm">
                          <EnvelopeIcon className="h-4 w-4 mr-1" />
                          Envoyer email
                        </Button>
                        <Link href={`/dashboard/rdv?client_id=${clientDetail.id}`}>
                          <Button variant="outline" size="sm">
                            Voir tous les RDV
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : null}
            </>
          )}

          {!selectedClient && (
            <Card>
              <CardContent className="p-12 text-center">
                <UserIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Recherchez un client pour voir son profil complet</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Note Modal */}
      <Modal
        isOpen={showAddNoteModal}
        onClose={() => setShowAddNoteModal(false)}
        title="Ajouter une note"
      >
        <textarea
          className="w-full p-3 border rounded-lg min-h-[120px]"
          placeholder="Saisissez votre note..."
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
        />
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowAddNoteModal(false)}>Annuler</Button>
          <Button
            onClick={() => addNoteMutation.mutate(noteContent)}
            disabled={!noteContent.trim() || addNoteMutation.isPending}
          >
            {addNoteMutation.isPending ? 'Enregistrement...' : 'Ajouter'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit Client Modal */}
      {selectedClient && (
        <EditClientModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          client={clientDetail || selectedClient}
          onSave={(data) => updateClientMutation.mutate(data)}
          isSaving={updateClientMutation.isPending}
        />
      )}
    </div>
  );
}

function EditClientModal({
  isOpen,
  onClose,
  client,
  onSave,
  isSaving,
}: {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  onSave: (data: Partial<Client>) => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState({
    civilite: client.civilite || 'M',
    nom: client.nom || '',
    prenom: client.prenom || '',
    email: client.email || '',
    telephone: client.telephone || '',
    adresse: client.adresse || '',
    code_postal: client.code_postal || '',
    ville: client.ville || '',
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Modifier le client">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Select
            label="Civilité"
            value={formData.civilite}
            onChange={(e) => setFormData({ ...formData, civilite: e.target.value })}
            options={[
              { value: 'M', label: 'M.' },
              { value: 'MME', label: 'Mme' },
            ]}
          />
          <Input
            label="Prénom"
            value={formData.prenom}
            onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
          />
          <Input
            label="Nom"
            value={formData.nom}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Téléphone"
            value={formData.telephone}
            onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <Input
          label="Adresse"
          value={formData.adresse}
          onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Code postal"
            value={formData.code_postal}
            onChange={(e) => setFormData({ ...formData, code_postal: e.target.value })}
          />
          <Input
            label="Ville"
            value={formData.ville}
            onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
          />
        </div>
      </div>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>Annuler</Button>
        <Button onClick={() => onSave(formData)} disabled={isSaving}>
          {isSaving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
