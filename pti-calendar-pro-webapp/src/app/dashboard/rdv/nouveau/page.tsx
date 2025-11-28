'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
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
  client_societe: z.string().optional(),

  // Véhicule
  immatriculation: z.string().regex(/^[A-Z]{2}-\d{3}-[A-Z]{2}$|^\d{1,4}[A-Z]{2,3}\d{2}$/i, 'Format immatriculation invalide'),
  type_vehicule: z.enum(['VL', 'VUL', 'MOTO', 'CARAVANE', 'REMORQUE', 'PL']),
  carburant: z.enum(['ESSENCE', 'DIESEL', 'ELECTRIQUE', 'HYBRIDE', 'GPL', 'GNV']),
  marque: z.string().optional(),
  modele: z.string().optional(),

  // Contrôle
  type_controle: z.enum(['CTP', 'CVP', 'CV', 'CTC']),

  // Notes
  notes_internes: z.string().optional(),
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

interface Disponibilites {
  date: string;
  creneaux: TimeSlotData[];
}

export default function NouveauRdvPage() {
  const router = useRouter();
  const { user } = useAuth();
  const centreId = user?.centre_id;

  const [step, setStep] = useState<'form' | 'slot' | 'confirm'>('form');
  const [selectedDate, setSelectedDate] = useState<string>(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotData | null>(null);
  const [formData, setFormData] = useState<RdvFormData | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<RdvFormData>({
    resolver: zodResolver(rdvSchema),
    mode: 'onChange',
    defaultValues: {
      type_controle: 'CTP',
      type_vehicule: 'VL',
      carburant: 'ESSENCE',
      client_professionnel: false,
    },
  });

  const typeControle = watch('type_controle');
  const typeVehicule = watch('type_vehicule');
  const carburant = watch('carburant');

  // Fetch disponibilités
  const { data: disponibilites, isLoading: loadingSlots } = useQuery({
    queryKey: ['disponibilites', centreId, selectedDate, typeControle, typeVehicule, carburant],
    queryFn: async () => {
      const response = await apiClient.get<Disponibilites>(
        `/centres/${centreId}/disponibilites`,
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
    enabled: !!centreId && step === 'slot',
  });

  // Create RDV mutation
  const createRdvMutation = useMutation({
    mutationFn: async (data: RdvFormData & { date: string; heure_debut: string; heure_fin: string; controleur_id?: string }) => {
      const response = await apiClient.post('/rdv', {
        centre_id: centreId,
        date: data.date,
        heure_debut: data.heure_debut,
        type_controle: data.type_controle,
        type_vehicule: data.type_vehicule,
        carburant: data.carburant,
        immatriculation: data.immatriculation.toUpperCase(),
        marque: data.marque,
        modele: data.modele,
        client_nom: data.client_nom,
        client_prenom: data.client_prenom,
        client_telephone: data.client_telephone,
        client_email: data.client_email || undefined,
        client_professionnel: data.client_professionnel,
        client_societe: data.client_societe,
        controleur_id: data.controleur_id,
        notes_internes: data.notes_internes,
        canal_creation: 'PRO',
      });
      return response.data;
    },
    onSuccess: (data) => {
      router.push(`/dashboard/rdv/${data.id}?created=true`);
    },
  });

  const handleFormSubmit = (data: RdvFormData) => {
    setFormData(data);
    setStep('slot');
  };

  const handleSlotSelect = (slot: TimeSlotData) => {
    setSelectedSlot(slot);
  };

  const handleConfirm = () => {
    if (formData && selectedSlot) {
      createRdvMutation.mutate({
        ...formData,
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
        <Link href="/dashboard/rdv" className="p-2 rounded-lg hover:bg-gray-100">
          <ChevronLeftIcon className="h-6 w-6 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouveau rendez-vous</h1>
          <p className="text-gray-500 mt-1">Créer un RDV pour un client</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {['Informations', 'Créneau', 'Confirmation'].map((label, index) => {
          const stepIndex = ['form', 'slot', 'confirm'].indexOf(step);
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
              <span className={`text-sm ${isActive ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                {label}
              </span>
              {index < 2 && <div className="w-12 h-0.5 bg-gray-200" />}
            </div>
          );
        })}
      </div>

      {/* Step 1: Form */}
      {step === 'form' && (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Client Info */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-gray-400" />
                Informations client
              </h2>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                label="Téléphone *"
                placeholder="06 12 34 56 78"
                {...register('client_telephone')}
                error={errors.client_telephone?.message}
              />
              <Input
                label="Email"
                type="email"
                {...register('client_email')}
                error={errors.client_email?.message}
              />
              <div className="md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register('client_professionnel')}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Client professionnel</span>
                </label>
              </div>
              {watch('client_professionnel') && (
                <Input
                  label="Société"
                  {...register('client_societe')}
                  className="md:col-span-2"
                />
              )}
            </CardContent>
          </Card>

          {/* Vehicle Info */}
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
              <Select
                label="Type de contrôle *"
                options={TYPE_CONTROLE_OPTIONS}
                {...register('type_controle')}
                error={errors.type_controle?.message}
              />
              <Input
                label="Marque"
                placeholder="Ex: Renault"
                {...register('marque')}
              />
              <Input
                label="Modèle"
                placeholder="Ex: Clio"
                {...register('modele')}
              />
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Notes internes</h2>
            </CardHeader>
            <CardContent>
              <textarea
                {...register('notes_internes')}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                rows={3}
                placeholder="Notes visibles uniquement par le centre..."
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={!isValid}>
              Choisir un créneau
            </Button>
          </div>
        </form>
      )}

      {/* Step 2: Slot Selection */}
      {step === 'slot' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                Sélectionner une date et un créneau
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
                {selectedSlot.controleur_nom && (
                  <p className="text-sm text-primary-600 mt-1">
                    Contrôleur : {selectedSlot.controleur_nom}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('form')}>
              Retour
            </Button>
            <Button onClick={() => setStep('confirm')} disabled={!selectedSlot}>
              Confirmer
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 'confirm' && formData && selectedSlot && (
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
                  <p className="text-gray-500">Date et heure</p>
                  <p className="font-medium">
                    {format(new Date(selectedDate), 'EEEE d MMMM yyyy', { locale: fr })}
                  </p>
                  <p className="text-gray-600">{selectedSlot.heure_debut} - {selectedSlot.heure_fin}</p>
                </div>
                <div>
                  <p className="text-gray-500">Type de contrôle</p>
                  <p className="font-medium">
                    {TYPE_CONTROLE_OPTIONS.find(o => o.value === formData.type_controle)?.label}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

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
                  Création en cours...
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
