'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Spinner,
  Alert,
  BuildingOfficeIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  UsersIcon,
  CalendarIcon,
  ChartBarIcon,
  ClockIcon,
  CogIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@pti-calendar/design-system';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

interface CentreDetail {
  id: string;
  code: string;
  nom: string;
  adresse: string;
  code_postal: string;
  ville: string;
  telephone: string;
  email: string;
  latitude: number;
  longitude: number;
  reseau_id: string;
  reseau_nom: string;
  actif: boolean;
  created_at: string;
  configuration: {
    horaires: {
      [jour: string]: { debut: string; fin: string; pause_debut?: string; pause_fin?: string; ferme: boolean };
    };
    duree_creneau: number;
    types_controle: string[];
    tarifs: { [type: string]: number };
    delai_annulation: number;
    nb_lignes: number;
    capacite_jour_max: number;
  };
  stats: {
    rdv_total_mois: number;
    rdv_aujourd_hui: number;
    ca_mois: number;
    taux_occupation: number;
    taux_no_show: number;
    note_moyenne: number;
    evolution_rdv: number;
    rdv_par_jour: Array<{ date: string; total: number }>;
    rdv_par_type: Array<{ type: string; count: number }>;
  };
  controleurs: Array<{
    id: string;
    nom: string;
    prenom: string;
    email: string;
    actif: boolean;
    nb_controles_mois: number;
  }>;
  lignes: Array<{
    id: string;
    numero: number;
    nom: string;
    actif: boolean;
    types_compatibles: string[];
  }>;
}

export default function CentreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isSuperAdmin } = useAuth();

  const centreId = params.id as string;
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHorairesModal, setShowHorairesModal] = useState(false);
  const [showTarifsModal, setShowTarifsModal] = useState(false);
  const [showControleurModal, setShowControleurModal] = useState(false);
  const [showLigneModal, setShowLigneModal] = useState(false);
  const [editingControleur, setEditingControleur] = useState<any>(null);
  const [editingLigne, setEditingLigne] = useState<any>(null);

  const { data: centre, isLoading } = useQuery({
    queryKey: ['centre-detail', centreId],
    queryFn: async () => {
      const response = await apiClient.get<CentreDetail>(`/admin/centres/${centreId}`);
      return response.data;
    },
  });

  // Toggle centre actif
  const toggleActifMutation = useMutation({
    mutationFn: (actif: boolean) => apiClient.patch(`/admin/centres/${centreId}`, { actif }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centre-detail', centreId] });
    },
  });

  // Delete centre
  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/admin/centres/${centreId}`),
    onSuccess: () => {
      router.push('/dashboard/centres');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!centre) {
    return (
      <Alert variant="error">Centre non trouvé</Alert>
    );
  }

  // Chart data
  const rdvChartData = {
    labels: centre.stats.rdv_par_jour.map(d => format(new Date(d.date), 'dd/MM')),
    datasets: [{
      label: 'RDV',
      data: centre.stats.rdv_par_jour.map(d => d.total),
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4,
    }],
  };

  const typeChartData = {
    labels: centre.stats.rdv_par_type.map(t => t.type),
    datasets: [{
      data: centre.stats.rdv_par_type.map(t => t.count),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(234, 179, 8, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(168, 85, 247, 0.8)',
      ],
    }],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href="/dashboard/centres">
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{centre.nom}</h1>
              <Badge variant={centre.actif ? 'confirme' : 'annule'}>
                {centre.actif ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
            <p className="text-gray-500 mt-1">
              {centre.code} - {centre.reseau_nom}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowEditModal(true)}>
            <PencilIcon className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <Button
            variant={centre.actif ? 'danger' : 'primary'}
            onClick={() => toggleActifMutation.mutate(!centre.actif)}
          >
            {centre.actif ? 'Désactiver' : 'Activer'}
          </Button>
        </div>
      </div>

      {/* Contact Info */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Adresse</p>
                <p className="font-medium">{centre.adresse}</p>
                <p className="text-sm text-gray-600">{centre.code_postal} {centre.ville}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <PhoneIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Téléphone</p>
                <p className="font-medium">{centre.telephone || '-'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <EnvelopeIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{centre.email || '-'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Créé le</p>
                <p className="font-medium">{format(new Date(centre.created_at), 'dd/MM/yyyy', { locale: fr })}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary-600">{centre.stats.rdv_aujourd_hui}</p>
            <p className="text-sm text-gray-500 mt-1">RDV aujourd'hui</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{centre.stats.rdv_total_mois}</p>
            <p className="text-sm text-gray-500 mt-1">RDV ce mois</p>
            {centre.stats.evolution_rdv !== 0 && (
              <p className={`text-xs mt-1 ${centre.stats.evolution_rdv > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {centre.stats.evolution_rdv > 0 ? '+' : ''}{centre.stats.evolution_rdv}%
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{centre.stats.ca_mois.toLocaleString('fr-FR')}€</p>
            <p className="text-sm text-gray-500 mt-1">CA ce mois</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-orange-600">{centre.stats.taux_occupation}%</p>
            <p className="text-sm text-gray-500 mt-1">Taux occupation</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-red-600">{centre.stats.taux_no_show}%</p>
            <p className="text-sm text-gray-500 mt-1">Taux no-show</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <ChartBarIcon className="h-4 w-4 mr-2" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="controleurs">
            <UsersIcon className="h-4 w-4 mr-2" />
            Contrôleurs ({centre.controleurs.length})
          </TabsTrigger>
          <TabsTrigger value="lignes">
            <CogIcon className="h-4 w-4 mr-2" />
            Lignes ({centre.lignes.length})
          </TabsTrigger>
          <TabsTrigger value="horaires">
            <ClockIcon className="h-4 w-4 mr-2" />
            Horaires
          </TabsTrigger>
          <TabsTrigger value="tarifs">
            Tarifs
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Évolution des RDV (30 jours)</h3>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="h-64">
                  <Line data={rdvChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Répartition par type</h3>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="h-64 flex items-center justify-center">
                  <Doughnut data={typeChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Controleurs Tab */}
        <TabsContent value="controleurs" className="mt-6">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <h3 className="font-semibold">Contrôleurs du centre</h3>
              <Button size="sm" onClick={() => setShowControleurModal(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Contrôleur</th>
                    <th>Email</th>
                    <th>Contrôles ce mois</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {centre.controleurs.map((controleur) => (
                    <tr key={controleur.id}>
                      <td>
                        <span className="font-medium">{controleur.prenom} {controleur.nom}</span>
                      </td>
                      <td>{controleur.email}</td>
                      <td>{controleur.nb_controles_mois}</td>
                      <td>
                        <Badge variant={controleur.actif ? 'confirme' : 'annule'}>
                          {controleur.actif ? 'Actif' : 'Inactif'}
                        </Badge>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => {
                            setEditingControleur(controleur);
                            setShowControleurModal(true);
                          }}>
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lignes Tab */}
        <TabsContent value="lignes" className="mt-6">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <h3 className="font-semibold">Lignes de contrôle</h3>
              <Button size="sm" onClick={() => setShowLigneModal(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>N°</th>
                    <th>Nom</th>
                    <th>Types compatibles</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {centre.lignes.map((ligne) => (
                    <tr key={ligne.id}>
                      <td><span className="font-bold">{ligne.numero}</span></td>
                      <td>{ligne.nom}</td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {ligne.types_compatibles.map(t => (
                            <Badge key={t} variant="rappele" size="sm">{t}</Badge>
                          ))}
                        </div>
                      </td>
                      <td>
                        <Badge variant={ligne.actif ? 'confirme' : 'annule'}>
                          {ligne.actif ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td>
                        <Button variant="ghost" size="sm" onClick={() => {
                          setEditingLigne(ligne);
                          setShowLigneModal(true);
                        }}>
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Horaires Tab */}
        <TabsContent value="horaires" className="mt-6">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <h3 className="font-semibold">Horaires d'ouverture</h3>
              <Button variant="outline" size="sm" onClick={() => setShowHorairesModal(true)}>
                <PencilIcon className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Jour</th>
                    <th>Ouverture</th>
                    <th>Pause</th>
                    <th>Fermeture</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(centre.configuration.horaires).map(([jour, h]) => (
                    <tr key={jour}>
                      <td className="font-medium capitalize">{jour}</td>
                      <td>{h.ferme ? '-' : h.debut}</td>
                      <td>{h.ferme ? '-' : (h.pause_debut && h.pause_fin ? `${h.pause_debut} - ${h.pause_fin}` : '-')}</td>
                      <td>{h.ferme ? '-' : h.fin}</td>
                      <td>
                        <Badge variant={h.ferme ? 'annule' : 'confirme'}>
                          {h.ferme ? 'Fermé' : 'Ouvert'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Durée d'un créneau</p>
                  <p className="text-lg font-semibold">{centre.configuration.duree_creneau} min</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Capacité max/jour</p>
                  <p className="text-lg font-semibold">{centre.configuration.capacite_jour_max} RDV</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Délai annulation</p>
                  <p className="text-lg font-semibold">{centre.configuration.delai_annulation}h</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tarifs Tab */}
        <TabsContent value="tarifs" className="mt-6">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <h3 className="font-semibold">Grille tarifaire</h3>
              <Button variant="outline" size="sm" onClick={() => setShowTarifsModal(true)}>
                <PencilIcon className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Type de contrôle</th>
                    <th>Tarif</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(centre.configuration.tarifs).map(([type, tarif]) => (
                    <tr key={type}>
                      <td className="font-medium">{type}</td>
                      <td>{tarif.toFixed(2)} €</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <HorairesModal
        isOpen={showHorairesModal}
        onClose={() => setShowHorairesModal(false)}
        centreId={centreId}
        horaires={centre.configuration.horaires}
        config={{
          duree_creneau: centre.configuration.duree_creneau,
          capacite_jour_max: centre.configuration.capacite_jour_max,
          delai_annulation: centre.configuration.delai_annulation,
        }}
      />

      <TarifsModal
        isOpen={showTarifsModal}
        onClose={() => setShowTarifsModal(false)}
        centreId={centreId}
        tarifs={centre.configuration.tarifs}
        typesControle={centre.configuration.types_controle}
      />

      <ControleurModal
        isOpen={showControleurModal}
        onClose={() => {
          setShowControleurModal(false);
          setEditingControleur(null);
        }}
        centreId={centreId}
        controleur={editingControleur}
      />

      <LigneModal
        isOpen={showLigneModal}
        onClose={() => {
          setShowLigneModal(false);
          setEditingLigne(null);
        }}
        centreId={centreId}
        ligne={editingLigne}
        typesControle={centre.configuration.types_controle}
      />
    </div>
  );
}

// Horaires Modal
function HorairesModal({ isOpen, onClose, centreId, horaires, config }: {
  isOpen: boolean;
  onClose: () => void;
  centreId: string;
  horaires: any;
  config: { duree_creneau: number; capacite_jour_max: number; delai_annulation: number };
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    horaires: { ...horaires },
    duree_creneau: config.duree_creneau,
    capacite_jour_max: config.capacite_jour_max,
    delai_annulation: config.delai_annulation,
  });

  const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

  const mutation = useMutation({
    mutationFn: () => apiClient.patch(`/admin/centres/${centreId}/configuration`, {
      horaires: formData.horaires,
      duree_creneau: formData.duree_creneau,
      capacite_jour_max: formData.capacite_jour_max,
      delai_annulation: formData.delai_annulation,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centre-detail', centreId] });
      onClose();
    },
  });

  const updateJour = (jour: string, field: string, value: any) => {
    setFormData({
      ...formData,
      horaires: {
        ...formData.horaires,
        [jour]: { ...formData.horaires[jour], [field]: value },
      },
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Modifier les horaires" size="lg">
      <div className="space-y-6">
        {jours.map((jour) => (
          <div key={jour} className="grid grid-cols-6 gap-3 items-center">
            <span className="font-medium capitalize">{jour}</span>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!formData.horaires[jour]?.ferme}
                onChange={(e) => updateJour(jour, 'ferme', !e.target.checked)}
              />
              Ouvert
            </label>
            {!formData.horaires[jour]?.ferme && (
              <>
                <Input
                  type="time"
                  value={formData.horaires[jour]?.debut || '08:00'}
                  onChange={(e) => updateJour(jour, 'debut', e.target.value)}
                  label="Ouverture"
                />
                <Input
                  type="time"
                  value={formData.horaires[jour]?.fin || '18:00'}
                  onChange={(e) => updateJour(jour, 'fin', e.target.value)}
                  label="Fermeture"
                />
                <Input
                  type="time"
                  value={formData.horaires[jour]?.pause_debut || ''}
                  onChange={(e) => updateJour(jour, 'pause_debut', e.target.value)}
                  label="Pause début"
                />
                <Input
                  type="time"
                  value={formData.horaires[jour]?.pause_fin || ''}
                  onChange={(e) => updateJour(jour, 'pause_fin', e.target.value)}
                  label="Pause fin"
                />
              </>
            )}
          </div>
        ))}

        <hr />

        <div className="grid grid-cols-3 gap-4">
          <Input
            type="number"
            label="Durée créneau (min)"
            value={formData.duree_creneau}
            onChange={(e) => setFormData({ ...formData, duree_creneau: parseInt(e.target.value) })}
            min={15}
            max={120}
          />
          <Input
            type="number"
            label="Capacité max/jour"
            value={formData.capacite_jour_max}
            onChange={(e) => setFormData({ ...formData, capacite_jour_max: parseInt(e.target.value) })}
            min={1}
          />
          <Input
            type="number"
            label="Délai annulation (h)"
            value={formData.delai_annulation}
            onChange={(e) => setFormData({ ...formData, delai_annulation: parseInt(e.target.value) })}
            min={0}
          />
        </div>
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>Annuler</Button>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// Tarifs Modal
function TarifsModal({ isOpen, onClose, centreId, tarifs, typesControle }: {
  isOpen: boolean;
  onClose: () => void;
  centreId: string;
  tarifs: { [type: string]: number };
  typesControle: string[];
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ ...tarifs });

  const mutation = useMutation({
    mutationFn: () => apiClient.patch(`/admin/centres/${centreId}/configuration`, { tarifs: formData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centre-detail', centreId] });
      onClose();
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Modifier les tarifs">
      <div className="space-y-4">
        {typesControle.map((type) => (
          <Input
            key={type}
            type="number"
            label={type}
            value={formData[type] || 0}
            onChange={(e) => setFormData({ ...formData, [type]: parseFloat(e.target.value) })}
            min={0}
            step={0.01}
          />
        ))}
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>Annuler</Button>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// Controleur Modal
function ControleurModal({ isOpen, onClose, centreId, controleur }: {
  isOpen: boolean;
  onClose: () => void;
  centreId: string;
  controleur: any;
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    nom: controleur?.nom || '',
    prenom: controleur?.prenom || '',
    email: controleur?.email || '',
    actif: controleur?.actif ?? true,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (controleur) {
        return apiClient.put(`/admin/centres/${centreId}/controleurs/${controleur.id}`, formData);
      }
      return apiClient.post(`/admin/centres/${centreId}/controleurs`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centre-detail', centreId] });
      onClose();
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={controleur ? 'Modifier le contrôleur' : 'Ajouter un contrôleur'}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Prénom"
            value={formData.prenom}
            onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
            required
          />
          <Input
            label="Nom"
            value={formData.nom}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            required
          />
        </div>
        <Input
          type="email"
          label="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.actif}
            onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
          />
          Actif
        </label>
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>Annuler</Button>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// Ligne Modal
function LigneModal({ isOpen, onClose, centreId, ligne, typesControle }: {
  isOpen: boolean;
  onClose: () => void;
  centreId: string;
  ligne: any;
  typesControle: string[];
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    numero: ligne?.numero || 1,
    nom: ligne?.nom || '',
    types_compatibles: ligne?.types_compatibles || [],
    actif: ligne?.actif ?? true,
  });

  const toggleType = (type: string) => {
    const types = formData.types_compatibles.includes(type)
      ? formData.types_compatibles.filter((t: string) => t !== type)
      : [...formData.types_compatibles, type];
    setFormData({ ...formData, types_compatibles: types });
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (ligne) {
        return apiClient.put(`/admin/centres/${centreId}/lignes/${ligne.id}`, formData);
      }
      return apiClient.post(`/admin/centres/${centreId}/lignes`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centre-detail', centreId] });
      onClose();
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={ligne ? 'Modifier la ligne' : 'Ajouter une ligne'}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="number"
            label="Numéro"
            value={formData.numero}
            onChange={(e) => setFormData({ ...formData, numero: parseInt(e.target.value) })}
            min={1}
            required
          />
          <Input
            label="Nom"
            value={formData.nom}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            placeholder="Ex: Ligne principale"
          />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Types de contrôle compatibles</p>
          <div className="flex flex-wrap gap-2">
            {typesControle.map((type) => (
              <label key={type} className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.types_compatibles.includes(type)}
                  onChange={() => toggleType(type)}
                />
                {type}
              </label>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.actif}
            onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
          />
          Active
        </label>
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>Annuler</Button>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
