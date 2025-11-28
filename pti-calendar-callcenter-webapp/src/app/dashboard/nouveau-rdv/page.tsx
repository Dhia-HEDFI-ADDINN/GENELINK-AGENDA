'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { api } from '@/lib/api';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Input,
  Select,
  Alert,
  Spinner,
  TimeSlotGrid,
  ChevronLeftIcon,
  CalendarIcon,
  UserIcon,
  TruckIcon,
  MapPinIcon,
  PhoneIcon,
  CheckCircleIcon,
  type TimeSlotData,
} from '@pti-calendar/design-system';
import Link from 'next/link';

const rdvSchema = z.object({
  // Client
  client_nom: z.string().min(2, 'Nom requis'),
  client_prenom: z.string().min(2, 'Prénom requis'),
  client_telephone: z.string().regex(/^(0|\+33)[1-9]\d{8}$/, 'Téléphone invalide'),
  client_email: z.string().email('Email invalide').optional().or(z.literal('')),
  client_professionnel: z.boolean().optional(),

  // Véhicule
  immatriculation: z.string().regex(/^[A-Z]{2}-\d{3}-[A-Z]{2}$|^\d{1,4}[A-Z]{2,3}\d{2}$/i, 'Format immatriculation invalide'),
  type_vehicule: z.enum(['VL', 'VUL', 'MOTO', 'CARAVANE', 'REMORQUE', 'PL']),
  carburant: z.enum(['ESSENCE', 'DIESEL', 'ELECTRIQUE', 'HYBRIDE', 'GPL', 'GNV']),
  marque: z.string().optional(),
  modele: z.string().optional(),

  // Contrôle
  type_controle: z.enum(['CTP', 'CVP', 'CV', 'CTC']),

  // Notes
  notes_client: z.string().optional(),
});

type RdvFormData = z.infer<typeof rdvSchema>;

const TYPE_CONTROLE_OPTIONS = [
  { value: 'CTP', label: 'Contrôle technique périodique' },
  { value: 'CVP', label: 'Contre-visite périodique' },
  { value: 'CV', label: 'Contre-visite' },
  { value: 'CTC', label: 'Contrôle complémentaire' },
];

const TYPE_VEHICULE_OPTIONS = [
  { value: 'VL', label: 'Véhicule léger' },
  { value: 'VUL', label: 'Véhicule utilitaire léger' },
  { value: 'MOTO', label: 'Moto' },
  { value: 'CARAVANE', label: 'Caravane' },
  { value: 'REMORQUE', label: 'Remorque' },
  { value: 'PL', label: 'Poids lourd' },
];

const CARBURANT_OPTIONS = [
  { value: 'ESSENCE', label: 'Essence' },
  { value: 'DIESEL', label: 'Diesel' },
  { value: 'ELECTRIQUE', label: 'Électrique' },
  { value: 'HYBRIDE', label: 'Hybride' },
  { value: 'GPL', label: 'GPL' },
  { value: 'GNV', label: 'GNV' },
];

interface Centre {
  id: string;
  nom: string;
  adresse: string;
  code_postal: string;
  ville: string;
  telephone: string;
  distance?: number;
}

interface Disponibilites {
  date: string;
  creneaux: TimeSlotData[];
}

export default function NouveauRdvCallCenterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillTelephone = searchParams.get('telephone');

  const [step, setStep] = useState<'client' | 'centre' | 'slot' | 'confirm'>('client');
  const [searchCentre, setSearchCentre] = useState('');
  const [selectedCentre, setSelectedCentre] = useState<Centre | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotData | null>(null);
  const [formData, setFormData] = useState<RdvFormData | null>(null);
  const [callStartTime] = useState<Date>(new Date());

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<RdvFormData>({
    resolver: zodResolver(rdvSchema),
    mode: 'onChange',
    defaultValues: {
      type_controle: 'CTP',
      type_vehicule: 'VL',
      carburant: 'ESSENCE',
      client_professionnel: false,
      client_telephone: prefillTelephone || '',
    },
  });

  const typeControle = watch('type_controle');
  const typeVehicule = watch('type_vehicule');
  const carburant = watch('carburant');

  // Search centres
  const { data: centres, isLoading: loadingCentres } = useQuery({
    queryKey: ['centres-search', searchCentre],
    queryFn: async () => {
      const response = await api.get<{ data: Centre[] }>('/centres', {
        params: { search: searchCentre, limit: 20 },
      });
      return response.data.data;
    },
    enabled: searchCentre.length >= 2 && step === 'centre',
  });

  // Fetch disponibilités
  const { data: disponibilites, isLoading: loadingSlots } = useQuery({
    queryKey: ['disponibilites', selectedCentre?.id, selectedDate, typeControle, typeVehicule, carburant],
    queryFn: async () => {
      const response = await api.get<Disponibilites>(
        `/centres/${selectedCentre?.id}/disponibilites`,
        {
          params: {
            date: selectedDate,
            type_controle: typeControle,
            type_vehicule: typeVehicule,
            carburant: carburant,
          },
        }
      );
      return response.data;
    },
    enabled: !!selectedCentre && step === 'slot',
  });

  // Create RDV mutation
  const createRdvMutation = useMutation({
    mutationFn: async (data: {
      formData: RdvFormData;
      centre_id: string;
      date: string;
      heure_debut: string;
      heure_fin: string;
      controleur_id?: string;
    }) => {
      const response = await api.post('/callcenter/rdv', {
        centre_id: data.centre_id,
        date: data.date,
        heure_debut: data.heure_debut,
        type_controle: data.formData.type_controle,
        type_vehicule: data.formData.type_vehicule,
        carburant: data.formData.carburant,
        immatriculation: data.formData.immatriculation.toUpperCase(),
        marque: data.formData.marque,
        modele: data.formData.modele,
        client_nom: data.formData.client_nom,
        client_prenom: data.formData.client_prenom,
        client_telephone: data.formData.client_telephone,
        client_email: data.formData.client_email || undefined,
        client_professionnel: data.formData.client_professionnel,
        controleur_id: data.controleur_id,
        notes_client: data.formData.notes_client,
        canal_creation: 'CALLCENTER',
        source: 'CALLCENTER',
      });
      return response.data;
    },
    onSuccess: async (data) => {
      // Log the call
      const callDuration = Math.floor((new Date().getTime() - callStartTime.getTime()) / 1000);
      await api.post('/callcenter/appels', {
        client_telephone: formData?.client_telephone,
        duree_secondes: callDuration,
        type: 'ENTRANT',
        resultat: 'RDV_CREE',
        rdv_id: data.id,
      });

      router.push(`/dashboard/confirmation-rdv?id=${data.id}`);
    },
  });

  const handleClientSubmit = (data: RdvFormData) => {
    setFormData(data);
    setStep('centre');
  };

  const handleCentreSelect = (centre: Centre) => {
    setSelectedCentre(centre);
    setStep('slot');
  };

  const handleSlotSelect = (slot: TimeSlotData) => {
    setSelectedSlot(slot);
  };

  const handleConfirm = () => {
    if (formData && selectedCentre && selectedSlot) {
      createRdvMutation.mutate({
        formData,
        centre_id: selectedCentre.id,
        date: selectedDate,
        heure_debut: selectedSlot.heure_debut,
        heure_fin: selectedSlot.heure_fin,
        controleur_id: selectedSlot.controleur_id,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="p-2 rounded-lg hover:bg-gray-100">
          <ChevronLeftIcon className="h-6 w-6 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Nouveau rendez-vous</h1>
          <p className="text-gray-500 mt-1">Prise de RDV par téléphone</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Durée de l'appel</p>
          <CallTimer startTime={callStartTime} />
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {['Client', 'Centre', 'Créneau', 'Confirmation'].map((label, index) => {
          const stepIndex = ['client', 'centre', 'slot', 'confirm'].indexOf(step);
          const isActive = index === stepIndex;
          const isComplete = index < stepIndex;

          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  isComplete
                    ? 'bg-green-500 text-white'
                    : isActive
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isComplete ? <CheckCircleIcon className="h-5 w-5" /> : index + 1}
              </div>
              <span className={`text-sm hidden md:block ${isActive ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                {label}
              </span>
              {index < 3 && <div className="w-8 md:w-12 h-0.5 bg-gray-200" />}
            </div>
          );
        })}
      </div>

      {/* Step 1: Client Info */}
      {step === 'client' && (
        <form onSubmit={handleSubmit(handleClientSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-gray-400" />
                Informations client
              </h2>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Téléphone *"
                placeholder="06 12 34 56 78"
                {...register('client_telephone')}
                error={errors.client_telephone?.message}
              />
              <div />
              <Input
                label="Nom *"
                {...register('client_nom')}
                error={errors.client_nom?.message}
              />
              <Input
                label="Prénom *"
                {...register('client_prenom')}
                error={errors.client_prenom?.message}
              />
              <Input
                label="Email"
                type="email"
                {...register('client_email')}
                error={errors.client_email?.message}
              />
              <div className="flex items-center">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register('client_professionnel')}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Client professionnel</span>
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <TruckIcon className="h-5 w-5 text-gray-400" />
                Véhicule
              </h2>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Immatriculation *"
                placeholder="AB-123-CD"
                {...register('immatriculation')}
                error={errors.immatriculation?.message}
                className="uppercase"
              />
              <Select
                label="Type de contrôle *"
                options={TYPE_CONTROLE_OPTIONS}
                {...register('type_controle')}
                error={errors.type_controle?.message}
              />
              <Select
                label="Type de véhicule *"
                options={TYPE_VEHICULE_OPTIONS}
                {...register('type_vehicule')}
                error={errors.type_vehicule?.message}
              />
              <Select
                label="Carburant *"
                options={CARBURANT_OPTIONS}
                {...register('carburant')}
                error={errors.carburant?.message}
              />
              <Input label="Marque" placeholder="Ex: Renault" {...register('marque')} />
              <Input label="Modèle" placeholder="Ex: Clio" {...register('modele')} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Notes</h2>
            </CardHeader>
            <CardContent>
              <textarea
                {...register('notes_client')}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                rows={2}
                placeholder="Notes visibles par le client..."
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={!isValid}>
              Rechercher un centre
            </Button>
          </div>
        </form>
      )}

      {/* Step 2: Centre Selection */}
      {step === 'centre' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <MapPinIcon className="h-5 w-5 text-gray-400" />
                Rechercher un centre
              </h2>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Ville, code postal..."
                value={searchCentre}
                onChange={(e) => setSearchCentre(e.target.value)}
                leftIcon={<MapPinIcon className="h-5 w-5" />}
              />
            </CardContent>
          </Card>

          {loadingCentres && (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          )}

          {centres && centres.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">{centres.length} centres trouvés</p>
              {centres.map((centre) => (
                <Card
                  key={centre.id}
                  className={`cursor-pointer transition-all hover:border-primary-300 ${
                    selectedCentre?.id === centre.id ? 'ring-2 ring-primary-500 border-primary-500' : ''
                  }`}
                  onClick={() => handleCentreSelect(centre)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{centre.nom}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {centre.adresse}, {centre.code_postal} {centre.ville}
                        </p>
                        {centre.telephone && (
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <PhoneIcon className="h-4 w-4" />
                            {centre.telephone}
                          </p>
                        )}
                      </div>
                      {centre.distance !== undefined && (
                        <span className="text-sm text-gray-500">
                          {centre.distance < 1
                            ? `${Math.round(centre.distance * 1000)}m`
                            : `${centre.distance.toFixed(1)}km`}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {centres && centres.length === 0 && searchCentre.length >= 2 && (
            <div className="text-center py-8 text-gray-500">
              Aucun centre trouvé pour "{searchCentre}"
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('client')}>
              Retour
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Slot Selection */}
      {step === 'slot' && selectedCentre && (
        <div className="space-y-6">
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <p className="font-medium">{selectedCentre.nom}</p>
              <p className="text-sm text-gray-500">
                {selectedCentre.adresse}, {selectedCentre.code_postal} {selectedCentre.ville}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                Sélectionner un créneau
              </h2>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlot(null);
                }}
                min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                className="w-auto"
              />
            </CardHeader>
            <CardContent>
              {loadingSlots ? (
                <div className="flex justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : disponibilites?.creneaux && disponibilites.creneaux.length > 0 ? (
                <TimeSlotGrid
                  slots={disponibilites.creneaux}
                  selectedSlot={selectedSlot || undefined}
                  onSelectSlot={handleSlotSelect}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Aucun créneau disponible pour cette date
                </div>
              )}
            </CardContent>
          </Card>

          {selectedSlot && (
            <Card className="bg-primary-50 border-primary-200">
              <CardContent className="p-4">
                <p className="font-medium text-primary-900">Créneau sélectionné</p>
                <p className="text-primary-700">
                  {format(new Date(selectedDate), 'EEEE d MMMM yyyy', { locale: fr })} à {selectedSlot.heure_debut}
                </p>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('centre')}>
              Retour
            </Button>
            <Button onClick={() => setStep('confirm')} disabled={!selectedSlot}>
              Confirmer
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Confirmation */}
      {step === 'confirm' && formData && selectedCentre && selectedSlot && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Récapitulatif du rendez-vous</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Client</p>
                  <p className="font-medium">{formData.client_prenom} {formData.client_nom}</p>
                  <p className="text-gray-600">{formData.client_telephone}</p>
                </div>
                <div>
                  <p className="text-gray-500">Véhicule</p>
                  <p className="font-medium">{formData.immatriculation.toUpperCase()}</p>
                  <p className="text-gray-600">{formData.marque} {formData.modele}</p>
                </div>
                <div>
                  <p className="text-gray-500">Centre</p>
                  <p className="font-medium">{selectedCentre.nom}</p>
                  <p className="text-gray-600">{selectedCentre.ville}</p>
                </div>
                <div>
                  <p className="text-gray-500">Date et heure</p>
                  <p className="font-medium">
                    {format(new Date(selectedDate), 'EEEE d MMMM yyyy', { locale: fr })}
                  </p>
                  <p className="text-gray-600">{selectedSlot.heure_debut}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert variant="info">
            Le client recevra un SMS et un email de confirmation.
          </Alert>

          {createRdvMutation.isError && (
            <Alert variant="error">
              Une erreur est survenue lors de la création du RDV. Veuillez réessayer.
            </Alert>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('slot')}>
              Retour
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={createRdvMutation.isPending}
            >
              {createRdvMutation.isPending ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Création...
                </>
              ) : (
                'Créer le rendez-vous'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Call timer component
function CallTimer({ startTime }: { startTime: Date }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((new Date().getTime() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <p className="font-mono text-lg font-semibold text-primary-600">
      {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
    </p>
  );
}
