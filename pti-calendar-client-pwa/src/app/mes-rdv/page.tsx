'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  Button,
  Input,
  Modal,
  ModalFooter,
  Badge,
  Spinner,
  Alert,
  getRdvStatusVariant,
  getRdvStatusLabel,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  TruckIcon,
  PhoneIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@pti-calendar/design-system';
import { apiClient } from '@/lib/api-client';

interface Rdv {
  id: string;
  reference: string;
  statut: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  type_controle: string;
  centre: {
    nom: string;
    adresse: string;
    code_postal: string;
    ville: string;
    telephone: string;
  };
  vehicule: {
    immatriculation: string;
    type_vehicule: string;
    marque?: string;
    modele?: string;
  };
  prix_total: number;
}

export default function MesRdvPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRdv, setSelectedRdv] = useState<Rdv | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);

  const queryClient = useQueryClient();

  // Search RDV by reference and email
  const { data: rdvList, isLoading, error, refetch } = useQuery({
    queryKey: ['mes-rdv', searchQuery, searchEmail],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Rdv[] }>('/rdv/mes-rdv', {
        params: {
          reference: searchQuery || undefined,
          email: searchEmail || undefined,
        },
      });
      return response.data.data;
    },
    enabled: isSearching && (!!searchQuery || !!searchEmail),
  });

  // Cancel RDV mutation
  const cancelMutation = useMutation({
    mutationFn: async (rdvId: string) => {
      await apiClient.post(`/rdv/${rdvId}/annuler`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mes-rdv'] });
      setShowCancelModal(false);
      setSelectedRdv(null);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
  };

  const handleCancelRdv = () => {
    if (selectedRdv) {
      cancelMutation.mutate(selectedRdv.id);
    }
  };

  const canCancel = (rdv: Rdv) => {
    const rdvDate = new Date(`${rdv.date}T${rdv.heure_debut}`);
    const now = new Date();
    const hoursUntilRdv = (rdvDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilRdv >= 24 && ['CREE', 'CONFIRME'].includes(rdv.statut);
  };

  const canModify = (rdv: Rdv) => {
    const rdvDate = new Date(`${rdv.date}T${rdv.heure_debut}`);
    const now = new Date();
    const hoursUntilRdv = (rdvDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilRdv >= 48 && ['CREE', 'CONFIRME'].includes(rdv.statut);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="container-app">
          <div className="flex items-center h-14">
            <Link href="/" className="p-2 -ml-2 rounded-lg hover:bg-gray-100">
              <ChevronLeftIcon className="h-6 w-6 text-gray-600" />
            </Link>
            <h1 className="flex-1 text-center font-semibold text-gray-900">
              Mes rendez-vous
            </h1>
            <div className="w-10" />
          </div>
        </div>
      </header>

      <main className="container-app py-6 space-y-6">
        {/* Search Form */}
        {!isSearching && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold text-gray-900 mb-4">
                  Retrouver mes rendez-vous
                </h2>
                <form onSubmit={handleSearch} className="space-y-4">
                  <Input
                    label="Référence du rendez-vous"
                    placeholder="Ex: RDV-ABC123"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
                  />
                  <Input
                    label="Email utilisé lors de la réservation"
                    type="email"
                    placeholder="exemple@email.com"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                  />
                  <Button type="submit" fullWidth disabled={!searchEmail}>
                    Rechercher
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Results */}
        {isSearching && (
          <>
            {/* Back to search */}
            <button
              onClick={() => setIsSearching(false)}
              className="text-sm text-primary-600 hover:underline flex items-center gap-1"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Nouvelle recherche
            </button>

            {/* Loading */}
            {isLoading && (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            )}

            {/* Error */}
            {error && (
              <Alert variant="error">
                Une erreur est survenue. Veuillez réessayer.
                <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
                  <ArrowPathIcon className="h-4 w-4 mr-1" />
                  Réessayer
                </Button>
              </Alert>
            )}

            {/* No results */}
            {rdvList && rdvList.length === 0 && (
              <div className="text-center py-12">
                <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucun rendez-vous trouvé</p>
                <p className="text-sm text-gray-400 mt-2">
                  Vérifiez votre email ou référence
                </p>
              </div>
            )}

            {/* RDV List */}
            {rdvList && rdvList.length > 0 && (
              <div className="space-y-4">
                {rdvList.map((rdv, index) => (
                  <motion.div
                    key={rdv.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <RdvCard
                      rdv={rdv}
                      onCancel={() => {
                        setSelectedRdv(rdv);
                        setShowCancelModal(true);
                      }}
                      onModify={() => {
                        setSelectedRdv(rdv);
                        setShowModifyModal(true);
                      }}
                      canCancel={canCancel(rdv)}
                      canModify={canModify(rdv)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Empty state for first visit */}
        {!isSearching && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">
              Vous n'avez pas encore de compte ?{' '}
              <Link href="/booking" className="text-primary-600 hover:underline">
                Prendre rendez-vous
              </Link>
            </p>
          </div>
        )}
      </main>

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Annuler le rendez-vous"
      >
        <p className="text-gray-600">
          Êtes-vous sûr de vouloir annuler ce rendez-vous ?
        </p>
        {selectedRdv && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm">
            <p>
              <strong>Date :</strong>{' '}
              {format(new Date(selectedRdv.date), 'd MMMM yyyy', { locale: fr })}
            </p>
            <p>
              <strong>Heure :</strong> {selectedRdv.heure_debut}
            </p>
            <p>
              <strong>Centre :</strong> {selectedRdv.centre.nom}
            </p>
          </div>
        )}
        <Alert variant="warning" className="mt-4">
          L'annulation est gratuite jusqu'à 24h avant le rendez-vous.
        </Alert>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowCancelModal(false)}>
            Retour
          </Button>
          <Button
            variant="danger"
            onClick={handleCancelRdv}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending ? <Spinner size="sm" color="white" /> : 'Confirmer l\'annulation'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Modify Modal */}
      <Modal
        isOpen={showModifyModal}
        onClose={() => setShowModifyModal(false)}
        title="Modifier le rendez-vous"
      >
        <p className="text-gray-600">
          Pour modifier votre rendez-vous, veuillez annuler celui-ci et en reprendre un nouveau.
        </p>
        <Alert variant="info" className="mt-4">
          La modification est possible jusqu'à 48h avant le rendez-vous.
        </Alert>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowModifyModal(false)}>
            Fermer
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setShowModifyModal(false);
              setShowCancelModal(true);
            }}
          >
            Annuler et reprendre RDV
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

interface RdvCardProps {
  rdv: Rdv;
  onCancel: () => void;
  onModify: () => void;
  canCancel: boolean;
  canModify: boolean;
}

function RdvCard({ rdv, onCancel, onModify, canCancel, canModify }: RdvCardProps) {
  const isPast = new Date(`${rdv.date}T${rdv.heure_fin}`) < new Date();

  return (
    <Card className={isPast ? 'opacity-75' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm text-gray-500">Réf: {rdv.reference}</p>
            <Badge variant={getRdvStatusVariant(rdv.statut)}>
              {getRdvStatusLabel(rdv.statut)}
            </Badge>
          </div>
          <p className="font-semibold text-gray-900">{rdv.prix_total.toFixed(2)} €</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
            <span>
              {format(new Date(rdv.date), 'EEEE d MMMM yyyy', { locale: fr })}
            </span>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <ClockIcon className="h-5 w-5 text-gray-400" />
            <span>
              {rdv.heure_debut} - {rdv.heure_fin}
            </span>
          </div>

          <div className="flex items-start gap-3 text-sm">
            <MapPinIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <div>
              <p className="font-medium">{rdv.centre.nom}</p>
              <p className="text-gray-500">
                {rdv.centre.adresse}, {rdv.centre.code_postal} {rdv.centre.ville}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <TruckIcon className="h-5 w-5 text-gray-400" />
            <span>
              {rdv.vehicule.immatriculation}
              {rdv.vehicule.marque && ` - ${rdv.vehicule.marque} ${rdv.vehicule.modele || ''}`}
            </span>
          </div>
        </div>

        {/* Actions */}
        {!isPast && (canCancel || canModify) && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
            {canModify && (
              <Button variant="outline" size="sm" onClick={onModify} className="flex-1">
                Modifier
              </Button>
            )}
            {canCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel} className="flex-1 text-red-600 hover:bg-red-50">
                Annuler
              </Button>
            )}
          </div>
        )}

        {/* Contact center */}
        {rdv.centre.telephone && (
          <a
            href={`tel:${rdv.centre.telephone}`}
            className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-100 text-sm text-primary-600"
          >
            <PhoneIcon className="h-4 w-4" />
            Contacter le centre
          </a>
        )}
      </CardContent>
    </Card>
  );
}
