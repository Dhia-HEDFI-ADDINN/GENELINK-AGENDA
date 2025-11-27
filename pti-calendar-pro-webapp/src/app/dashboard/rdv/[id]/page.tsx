'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { apiClient } from '@/lib/api-client';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Badge,
  Spinner,
  Alert,
  getRdvStatusVariant,
  getRdvStatusLabel,
  ChevronLeftIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  TruckIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CreditCardIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@pti-calendar/design-system';

interface RdvDetail {
  id: string;
  reference: string;
  statut: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  type_controle: string;
  client: {
    id: string;
    civilite: string;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    adresse?: string;
    code_postal?: string;
    ville?: string;
  };
  vehicule: {
    immatriculation: string;
    type_vehicule: string;
    type_carburant: string;
    marque?: string;
    modele?: string;
  };
  controleur?: {
    id: string;
    nom: string;
    prenom: string;
    initiales: string;
  };
  paiement: {
    statut: string;
    montant: number;
    methode?: string;
    date_paiement?: string;
  };
  historique: Array<{
    id: string;
    action: string;
    date: string;
    utilisateur?: string;
    details?: string;
  }>;
  notes?: string;
  resultat_controle?: {
    statut: 'FAVORABLE' | 'DEFAVORABLE' | 'CONTRE_VISITE';
    defauts?: string[];
    observations?: string;
  };
  created_at: string;
  updated_at: string;
}

export default function RdvDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const rdvId = params.id as string;

  const { data: rdv, isLoading, error } = useQuery({
    queryKey: ['rdv-detail', rdvId],
    queryFn: async () => {
      const response = await apiClient.get<RdvDetail>(`/rdv/${rdvId}`);
      return response.data;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => apiClient.post(`/rdv/${rdvId}/annuler`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rdv-detail', rdvId] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !rdv) {
    return (
      <Alert variant="error">
        Impossible de charger les détails du rendez-vous.
        <Button variant="outline" size="sm" className="mt-2" onClick={() => router.back()}>
          Retour
        </Button>
      </Alert>
    );
  }

  const canCancel = ['CREE', 'CONFIRME'].includes(rdv.statut);
  const canStart = rdv.statut === 'RAPPELE';
  const canComplete = rdv.statut === 'EN_COURS';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/rdv"
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <ChevronLeftIcon className="h-6 w-6 text-gray-600" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="page-title">RDV {rdv.reference}</h1>
              <Badge variant={getRdvStatusVariant(rdv.statut)} size="lg">
                {getRdvStatusLabel(rdv.statut)}
              </Badge>
            </div>
            <p className="text-gray-500 mt-1">
              {format(new Date(rdv.date), 'EEEE d MMMM yyyy', { locale: fr })} à {rdv.heure_debut}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {canStart && (
            <Link href={`/dashboard/rdv/${rdvId}/demarrer`}>
              <Button>Démarrer le contrôle</Button>
            </Link>
          )}
          {canComplete && (
            <Link href={`/dashboard/rdv/${rdvId}/terminer`}>
              <Button variant="success">Terminer le contrôle</Button>
            </Link>
          )}
          {canCancel && (
            <Button
              variant="danger"
              onClick={() => {
                if (confirm('Êtes-vous sûr de vouloir annuler ce RDV ?')) {
                  cancelMutation.mutate();
                }
              }}
              disabled={cancelMutation.isPending}
            >
              Annuler
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-gray-400" />
                Client
              </h2>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nom</p>
                  <p className="font-medium">
                    {rdv.client.civilite} {rdv.client.prenom} {rdv.client.nom}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Téléphone</p>
                  <a
                    href={`tel:${rdv.client.telephone}`}
                    className="font-medium text-primary-600 hover:underline flex items-center gap-1"
                  >
                    <PhoneIcon className="h-4 w-4" />
                    {rdv.client.telephone}
                  </a>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <a
                    href={`mailto:${rdv.client.email}`}
                    className="font-medium text-primary-600 hover:underline flex items-center gap-1"
                  >
                    <EnvelopeIcon className="h-4 w-4" />
                    {rdv.client.email}
                  </a>
                </div>
                {rdv.client.adresse && (
                  <div>
                    <p className="text-sm text-gray-500">Adresse</p>
                    <p className="font-medium">
                      {rdv.client.adresse}, {rdv.client.code_postal} {rdv.client.ville}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Véhicule */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TruckIcon className="h-5 w-5 text-gray-400" />
                Véhicule
              </h2>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Immatriculation</p>
                  <p className="font-medium text-lg">{rdv.vehicule.immatriculation}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium">{rdv.vehicule.type_vehicule}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Carburant</p>
                  <p className="font-medium">{rdv.vehicule.type_carburant}</p>
                </div>
                {rdv.vehicule.marque && (
                  <div>
                    <p className="text-sm text-gray-500">Marque / Modèle</p>
                    <p className="font-medium">
                      {rdv.vehicule.marque} {rdv.vehicule.modele}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Résultat contrôle */}
          {rdv.resultat_controle && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                  Résultat du contrôle
                </h2>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {rdv.resultat_controle.statut === 'FAVORABLE' ? (
                      <Badge variant="confirme" size="lg">Favorable</Badge>
                    ) : rdv.resultat_controle.statut === 'DEFAVORABLE' ? (
                      <Badge variant="annule" size="lg">Défavorable</Badge>
                    ) : (
                      <Badge variant="reporte" size="lg">Contre-visite</Badge>
                    )}
                  </div>

                  {rdv.resultat_controle.defauts && rdv.resultat_controle.defauts.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Défauts constatés</p>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {rdv.resultat_controle.defauts.map((defaut, i) => (
                          <li key={i} className="text-gray-700">{defaut}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {rdv.resultat_controle.observations && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Observations</p>
                      <p className="text-gray-700">{rdv.resultat_controle.observations}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Historique */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-gray-400" />
                Historique
              </h2>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="space-y-4">
                {rdv.historique.map((event, index) => (
                  <div key={event.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-primary-500 rounded-full" />
                      {index < rdv.historique.length - 1 && (
                        <div className="w-px h-full bg-gray-200 mt-1" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="font-medium text-gray-900">{event.action}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(event.date), 'dd/MM/yyyy HH:mm', { locale: fr })}
                        {event.utilisateur && ` - ${event.utilisateur}`}
                      </p>
                      {event.details && (
                        <p className="text-sm text-gray-600 mt-1">{event.details}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Infos RDV */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Informations</h2>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div>
                <p className="text-sm text-gray-500">Type de contrôle</p>
                <p className="font-medium">{rdv.type_controle}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Horaire</p>
                <p className="font-medium">
                  {rdv.heure_debut} - {rdv.heure_fin}
                </p>
              </div>
              {rdv.controleur && (
                <div>
                  <p className="text-sm text-gray-500">Contrôleur</p>
                  <p className="font-medium">
                    {rdv.controleur.prenom} {rdv.controleur.nom}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Créé le</p>
                <p className="font-medium">
                  {format(new Date(rdv.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Paiement */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CreditCardIcon className="h-5 w-5 text-gray-400" />
                Paiement
              </h2>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Montant</span>
                <span className="text-xl font-bold text-gray-900">
                  {rdv.paiement.montant.toFixed(2)} €
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Statut</span>
                <Badge
                  variant={rdv.paiement.statut === 'PAYE' ? 'confirme' : 'rappele'}
                >
                  {rdv.paiement.statut}
                </Badge>
              </div>
              {rdv.paiement.methode && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Méthode</span>
                  <span>{rdv.paiement.methode}</span>
                </div>
              )}
              {rdv.paiement.date_paiement && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Date</span>
                  <span>
                    {format(new Date(rdv.paiement.date_paiement), 'dd/MM/yyyy', { locale: fr })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions rapides */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Actions</h2>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-2">
              <Button variant="outline" fullWidth>
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Reporter le RDV
              </Button>
              <Button variant="outline" fullWidth>
                <EnvelopeIcon className="h-5 w-5 mr-2" />
                Envoyer un rappel
              </Button>
              <Button variant="outline" fullWidth>
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Imprimer la fiche
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
