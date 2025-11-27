'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
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
  Alert,
  BuildingOffice2Icon,
  BuildingOfficeIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChartBarIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@pti-calendar/design-system';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Reseau {
  id: string;
  code: string;
  nom: string;
  description?: string;
  logo_url?: string;
  contact_nom?: string;
  contact_email?: string;
  contact_telephone?: string;
  actif: boolean;
  created_at: string;
  stats: {
    nb_centres: number;
    nb_centres_actifs: number;
    nb_controleurs: number;
    rdv_mois: number;
    ca_mois: number;
    taux_occupation_moyen: number;
  };
}

export default function ReseauxPage() {
  const { isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [filterActif, setFilterActif] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingReseau, setEditingReseau] = useState<Reseau | null>(null);

  // Only super admins can access this page
  if (!isSuperAdmin) {
    return (
      <Alert variant="error">
        Accès non autorisé. Cette page est réservée aux administrateurs SGS.
      </Alert>
    );
  }

  const { data: reseaux, isLoading } = useQuery({
    queryKey: ['reseaux-admin', search, filterActif],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Reseau[]; meta: { total: number } }>('/admin/reseaux', {
        params: {
          search: search || undefined,
          actif: filterActif || undefined,
          include_stats: true,
        },
      });
      return response.data;
    },
  });

  // Global stats
  const totalStats = reseaux?.data.reduce(
    (acc, r) => ({
      nb_centres: acc.nb_centres + r.stats.nb_centres,
      nb_controleurs: acc.nb_controleurs + r.stats.nb_controleurs,
      rdv_mois: acc.rdv_mois + r.stats.rdv_mois,
      ca_mois: acc.ca_mois + r.stats.ca_mois,
    }),
    { nb_centres: 0, nb_controleurs: 0, rdv_mois: 0, ca_mois: 0 }
  );

  // Chart data
  const chartData = {
    labels: reseaux?.data.slice(0, 10).map((r) => r.nom) || [],
    datasets: [
      {
        label: 'RDV ce mois',
        data: reseaux?.data.slice(0, 10).map((r) => r.stats.rdv_mois) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
      },
      {
        label: 'CA ce mois (k€)',
        data: reseaux?.data.slice(0, 10).map((r) => r.stats.ca_mois / 1000) || [],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
      },
    ],
  };

  const toggleActifMutation = useMutation({
    mutationFn: ({ id, actif }: { id: string; actif: boolean }) =>
      apiClient.patch(`/admin/reseaux/${id}`, { actif }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reseaux-admin'] });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des réseaux</h1>
          <p className="text-gray-500 mt-1">{reseaux?.meta.total || 0} réseaux</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Nouveau réseau
        </Button>
      </div>

      {/* Global Stats */}
      {totalStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary-600">{totalStats.nb_centres}</p>
              <p className="text-sm text-gray-500 mt-1">Centres total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-gray-900">{totalStats.nb_controleurs}</p>
              <p className="text-sm text-gray-500 mt-1">Contrôleurs total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-purple-600">{totalStats.rdv_mois.toLocaleString('fr-FR')}</p>
              <p className="text-sm text-gray-500 mt-1">RDV ce mois</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{(totalStats.ca_mois / 1000).toFixed(0)}k €</p>
              <p className="text-sm text-gray-500 mt-1">CA ce mois</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart */}
      {reseaux?.data && reseaux.data.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold">Performance par réseau (top 10)</h3>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="h-64">
              <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Input
                placeholder="Rechercher (nom, code...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
              />
            </div>
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
      ) : reseaux?.data && reseaux.data.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {reseaux.data.map((reseau) => (
            <Card key={reseau.id} className={!reseau.actif ? 'opacity-60' : ''}>
              <CardHeader className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    {reseau.logo_url ? (
                      <img src={reseau.logo_url} alt={reseau.nom} className="w-10 h-10 object-contain" />
                    ) : (
                      <BuildingOffice2Icon className="h-6 w-6 text-primary-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{reseau.nom}</h3>
                    <p className="text-xs text-gray-500">{reseau.code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={reseau.actif ? 'confirme' : 'annule'}>
                    {reseau.actif ? 'Actif' : 'Inactif'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingReseau(reseau);
                      setShowModal(true);
                    }}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleActifMutation.mutate({ id: reseau.id, actif: !reseau.actif })}
                  >
                    {reseau.actif ? (
                      <XCircleIcon className="h-4 w-4 text-red-500" />
                    ) : (
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {reseau.description && (
                  <p className="text-sm text-gray-600 mb-4">{reseau.description}</p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                      <BuildingOfficeIcon className="h-4 w-4" />
                    </div>
                    <p className="text-xl font-bold">{reseau.stats.nb_centres_actifs}/{reseau.stats.nb_centres}</p>
                    <p className="text-xs text-gray-500">Centres actifs</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                      <UsersIcon className="h-4 w-4" />
                    </div>
                    <p className="text-xl font-bold">{reseau.stats.nb_controleurs}</p>
                    <p className="text-xs text-gray-500">Contrôleurs</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                      <ChartBarIcon className="h-4 w-4" />
                    </div>
                    <p className="text-xl font-bold">{reseau.stats.taux_occupation_moyen}%</p>
                    <p className="text-xs text-gray-500">Occupation</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm">
                    <span className="text-gray-500">Ce mois:</span>
                    <span className="font-medium ml-2">{reseau.stats.rdv_mois} RDV</span>
                    <span className="text-gray-400 mx-2">•</span>
                    <span className="font-medium text-green-600">{reseau.stats.ca_mois.toLocaleString('fr-FR')} €</span>
                  </div>
                  <Link href={`/dashboard/centres?reseau_id=${reseau.id}`}>
                    <Button variant="outline" size="sm">Voir centres</Button>
                  </Link>
                </div>

                {/* Contact */}
                {reseau.contact_nom && (
                  <div className="mt-4 pt-4 border-t text-sm text-gray-600">
                    <p className="font-medium">{reseau.contact_nom}</p>
                    {reseau.contact_email && <p>{reseau.contact_email}</p>}
                    {reseau.contact_telephone && <p>{reseau.contact_telephone}</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <BuildingOffice2Icon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun réseau trouvé</p>
          </CardContent>
        </Card>
      )}

      {/* Modal */}
      <ReseauFormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingReseau(null);
        }}
        reseau={editingReseau}
      />
    </div>
  );
}

function ReseauFormModal({ isOpen, onClose, reseau }: {
  isOpen: boolean;
  onClose: () => void;
  reseau: Reseau | null;
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    code: reseau?.code || '',
    nom: reseau?.nom || '',
    description: reseau?.description || '',
    logo_url: reseau?.logo_url || '',
    contact_nom: reseau?.contact_nom || '',
    contact_email: reseau?.contact_email || '',
    contact_telephone: reseau?.contact_telephone || '',
    actif: reseau?.actif ?? true,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (reseau) {
        return apiClient.put(`/admin/reseaux/${reseau.id}`, formData);
      }
      return apiClient.post('/admin/reseaux', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reseaux-admin'] });
      onClose();
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={reseau ? 'Modifier le réseau' : 'Nouveau réseau'}>
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            required
            disabled={!!reseau}
            placeholder="RESEAU_01"
          />
          <Input
            label="Nom"
            value={formData.nom}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            required
          />
        </div>

        <Input
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />

        <Input
          label="URL du logo"
          value={formData.logo_url}
          onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
          placeholder="https://..."
        />

        <hr />

        <h4 className="font-medium text-gray-700">Contact principal</h4>

        <Input
          label="Nom du contact"
          value={formData.contact_nom}
          onChange={(e) => setFormData({ ...formData, contact_nom: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            type="email"
            label="Email"
            value={formData.contact_email}
            onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
          />
          <Input
            type="tel"
            label="Téléphone"
            value={formData.contact_telephone}
            onChange={(e) => setFormData({ ...formData, contact_telephone: e.target.value })}
          />
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.actif}
            onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
          />
          Réseau actif
        </label>

        <ModalFooter>
          <Button variant="ghost" type="button" onClick={onClose}>Annuler</Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
