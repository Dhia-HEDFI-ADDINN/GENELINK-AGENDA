'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
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
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@pti-calendar/design-system';

interface Centre {
  id: string;
  code: string;
  nom: string;
  adresse: string;
  code_postal: string;
  ville: string;
  telephone: string;
  email: string;
  reseau_id: string;
  reseau_nom: string;
  actif: boolean;
  nb_controleurs: number;
  nb_lignes: number;
  created_at: string;
}

interface Reseau {
  id: string;
  nom: string;
}

export default function CentresPage() {
  const { isAdminSGS } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [filterReseau, setFilterReseau] = useState('');
  const [filterActif, setFilterActif] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCentre, setEditingCentre] = useState<Centre | null>(null);

  // Fetch réseaux
  const { data: reseaux } = useQuery({
    queryKey: ['reseaux-list'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Reseau[] }>('/admin/reseaux');
      return response.data.data;
    },
    enabled: isAdminSGS,
  });

  // Fetch centres
  const { data: centres, isLoading } = useQuery({
    queryKey: ['centres-admin', search, filterReseau, filterActif],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Centre[]; meta: { total: number } }>('/admin/centres', {
        params: {
          search: search || undefined,
          reseau_id: filterReseau || undefined,
          actif: filterActif || undefined,
        },
      });
      return response.data;
    },
  });

  // Toggle actif
  const toggleActifMutation = useMutation({
    mutationFn: ({ id, actif }: { id: string; actif: boolean }) =>
      apiClient.patch(`/admin/centres/${id}`, { actif }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centres-admin'] });
    },
  });

  // Delete centre
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/centres/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centres-admin'] });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Centres</h1>
          <p className="text-gray-500 mt-1">{centres?.meta.total || 0} centres</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Nouveau centre
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <Input
                placeholder="Rechercher (nom, code, ville...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
              />
            </div>
            {isAdminSGS && reseaux && (
              <Select
                value={filterReseau}
                onChange={(e) => setFilterReseau(e.target.value)}
                options={[
                  { value: '', label: 'Tous les réseaux' },
                  ...reseaux.map((r) => ({ value: r.id, label: r.nom })),
                ]}
              />
            )}
            <Select
              value={filterActif}
              onChange={(e) => setFilterActif(e.target.value)}
              options={[
                { value: '', label: 'Tous les statuts' },
                { value: 'true', label: 'Actifs' },
                { value: 'false', label: 'Inactifs' },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Liste */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : centres?.data && centres.data.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Centre</th>
                  <th>Réseau</th>
                  <th>Ville</th>
                  <th>Contrôleurs</th>
                  <th>Lignes</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {centres.data.map((centre) => (
                  <tr key={centre.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <BuildingOfficeIcon className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <Link href={`/dashboard/centres/${centre.id}`} className="font-medium text-primary-600 hover:underline">
                            {centre.nom}
                          </Link>
                          <p className="text-xs text-gray-500">{centre.code}</p>
                        </div>
                      </div>
                    </td>
                    <td>{centre.reseau_nom}</td>
                    <td>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPinIcon className="h-4 w-4 text-gray-400" />
                        {centre.ville} ({centre.code_postal})
                      </div>
                    </td>
                    <td>{centre.nb_controleurs}</td>
                    <td>{centre.nb_lignes}</td>
                    <td>
                      <Badge variant={centre.actif ? 'confirme' : 'annule'}>
                        {centre.actif ? 'Actif' : 'Inactif'}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingCentre(centre)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActifMutation.mutate({ id: centre.id, actif: !centre.actif })}
                        >
                          {centre.actif ? (
                            <XCircleIcon className="h-4 w-4 text-red-500" />
                          ) : (
                            <CheckCircleIcon className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                      </div>
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
            <BuildingOfficeIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun centre trouvé</p>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <CentreFormModal
        isOpen={showCreateModal || !!editingCentre}
        onClose={() => {
          setShowCreateModal(false);
          setEditingCentre(null);
        }}
        centre={editingCentre}
        reseaux={reseaux || []}
      />
    </div>
  );
}

interface CentreFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  centre: Centre | null;
  reseaux: Reseau[];
}

function CentreFormModal({ isOpen, onClose, centre, reseaux }: CentreFormModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    code: centre?.code || '',
    nom: centre?.nom || '',
    adresse: centre?.adresse || '',
    code_postal: centre?.code_postal || '',
    ville: centre?.ville || '',
    telephone: centre?.telephone || '',
    email: centre?.email || '',
    reseau_id: centre?.reseau_id || '',
    nb_lignes: centre?.nb_lignes || 1,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (centre) {
        return apiClient.put(`/admin/centres/${centre.id}`, data);
      }
      return apiClient.post('/admin/centres', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centres-admin'] });
      onClose();
    },
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={centre ? 'Modifier le centre' : 'Nouveau centre'}
    >
      <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(formData); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
          />
          <Select
            label="Réseau"
            value={formData.reseau_id}
            onChange={(e) => setFormData({ ...formData, reseau_id: e.target.value })}
            options={[{ value: '', label: 'Sélectionner...' }, ...reseaux.map((r) => ({ value: r.id, label: r.nom }))]}
            required
          />
        </div>
        <Input
          label="Nom"
          value={formData.nom}
          onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
          required
        />
        <Input
          label="Adresse"
          value={formData.adresse}
          onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Code postal"
            value={formData.code_postal}
            onChange={(e) => setFormData({ ...formData, code_postal: e.target.value })}
            required
          />
          <Input
            label="Ville"
            value={formData.ville}
            onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
            required
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
          label="Nombre de lignes"
          type="number"
          min={1}
          max={10}
          value={formData.nb_lignes}
          onChange={(e) => setFormData({ ...formData, nb_lignes: parseInt(e.target.value) })}
        />
        <ModalFooter>
          <Button variant="ghost" type="button" onClick={onClose}>Annuler</Button>
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
