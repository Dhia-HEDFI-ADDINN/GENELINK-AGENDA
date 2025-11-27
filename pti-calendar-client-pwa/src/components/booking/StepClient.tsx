'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useBooking, ClientInfo } from '@/contexts/BookingContext';
import {
  Input,
  Select,
  Card,
  CardContent,
  CardHeader,
  Button,
  Alert,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  MapPinIcon,
} from '@pti-calendar/design-system';

const clientSchema = z.object({
  civilite: z.enum(['M', 'MME'], {
    required_error: 'La civilité est requise',
  }),
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  telephone: z
    .string()
    .regex(/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/, 'Numéro de téléphone invalide'),
  adresse: z.string().optional(),
  code_postal: z.string().regex(/^\d{5}$/, 'Code postal invalide').optional().or(z.literal('')),
  ville: z.string().optional(),
  recoit_sms: z.boolean(),
  recoit_email: z.boolean(),
  accepte_conditions: z.boolean().refine((val) => val === true, {
    message: 'Vous devez accepter les conditions générales',
  }),
});

type ClientFormData = z.infer<typeof clientSchema>;

const CIVILITE_OPTIONS = [
  { value: 'M', label: 'Monsieur' },
  { value: 'MME', label: 'Madame' },
];

export function StepClient() {
  const { state, setClientInfo, nextStep } = useBooking();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: state.clientInfo || {
      recoit_sms: true,
      recoit_email: true,
      accepte_conditions: false,
    },
    mode: 'onChange',
  });

  const onSubmit = (data: ClientFormData) => {
    setClientInfo(data as ClientInfo);
    nextStep();
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Récapitulatif RDV */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
            Récapitulatif de votre rendez-vous
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Centre :</span>
              <span className="font-medium text-gray-900">{state.centre?.nom}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Adresse :</span>
              <span className="text-gray-900">{state.centre?.ville}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date :</span>
              <span className="font-medium text-gray-900">
                {state.selectedSlot &&
                  format(new Date(state.selectedSlot.date), 'EEEE d MMMM yyyy', { locale: fr })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Heure :</span>
              <span className="font-medium text-gray-900">
                {state.selectedSlot?.heure_debut}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Véhicule :</span>
              <span className="font-medium text-gray-900">
                {state.vehicleInfo?.immatriculation}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulaire client */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-gray-400" />
              Vos coordonnées
            </h2>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <Select
              label="Civilité"
              options={CIVILITE_OPTIONS}
              {...register('civilite')}
              error={errors.civilite?.message}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nom"
                placeholder="Dupont"
                {...register('nom')}
                error={errors.nom?.message}
              />
              <Input
                label="Prénom"
                placeholder="Jean"
                {...register('prenom')}
                error={errors.prenom?.message}
              />
            </div>

            <Input
              label="Email"
              type="email"
              placeholder="jean.dupont@email.com"
              leftIcon={<EnvelopeIcon className="h-5 w-5" />}
              {...register('email')}
              error={errors.email?.message}
            />

            <Input
              label="Téléphone"
              type="tel"
              placeholder="06 12 34 56 78"
              leftIcon={<PhoneIcon className="h-5 w-5" />}
              {...register('telephone')}
              error={errors.telephone?.message}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <MapPinIcon className="h-5 w-5 text-gray-400" />
              Adresse (optionnel)
            </h2>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <Input
              label="Adresse"
              placeholder="123 rue de Paris"
              {...register('adresse')}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Code postal"
                placeholder="75001"
                {...register('code_postal')}
                error={errors.code_postal?.message}
              />
              <Input
                label="Ville"
                placeholder="Paris"
                {...register('ville')}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Préférences de notification</h2>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('recoit_sms')}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">
                Je souhaite recevoir des rappels par SMS
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('recoit_email')}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">
                Je souhaite recevoir des confirmations par email
              </span>
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('accepte_conditions')}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 mt-0.5"
              />
              <span className="text-sm text-gray-700">
                J'accepte les{' '}
                <a href="/cgv" target="_blank" className="text-primary-600 hover:underline">
                  conditions générales de vente
                </a>{' '}
                et la{' '}
                <a href="/politique-confidentialite" target="_blank" className="text-primary-600 hover:underline">
                  politique de confidentialité
                </a>
              </span>
            </label>
            {errors.accepte_conditions && (
              <p className="text-sm text-red-600 mt-2">
                {errors.accepte_conditions.message}
              </p>
            )}
          </CardContent>
        </Card>
      </form>

      {/* Continue Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-bottom">
        <div className="container-app">
          <Button
            onClick={handleSubmit(onSubmit)}
            fullWidth
            disabled={!isValid}
          >
            Continuer vers le paiement
          </Button>
        </div>
      </div>
    </div>
  );
}
