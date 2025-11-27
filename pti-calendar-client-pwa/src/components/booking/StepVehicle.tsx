'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useBooking, VehicleInfo } from '@/contexts/BookingContext';
import {
  Input,
  Select,
  Card,
  CardContent,
  CardHeader,
  Button,
  Alert,
  TruckIcon,
} from '@pti-calendar/design-system';

const vehicleSchema = z.object({
  immatriculation: z
    .string()
    .min(1, 'L\'immatriculation est requise')
    .regex(/^[A-Z]{2}-\d{3}-[A-Z]{2}$|^\d{1,4}[A-Z]{2,3}\d{2}$/i, 'Format d\'immatriculation invalide'),
  type_vehicule: z.enum(['VL', 'VUL', 'MOTO', 'CARAVANE', 'REMORQUE'], {
    required_error: 'Le type de véhicule est requis',
  }),
  type_carburant: z.enum(['ESSENCE', 'DIESEL', 'ELECTRIQUE', 'HYBRIDE', 'GPL', 'GNV'], {
    required_error: 'Le type de carburant est requis',
  }),
  marque: z.string().optional(),
  modele: z.string().optional(),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

const TYPE_CONTROLE_OPTIONS = [
  {
    value: 'PERIODIQUE',
    label: 'Contrôle périodique',
    description: 'Contrôle technique obligatoire',
  },
  {
    value: 'CONTRE_VISITE',
    label: 'Contre-visite',
    description: 'Suite à un refus lors d\'un précédent contrôle',
  },
  {
    value: 'COMPLEMENTAIRE',
    label: 'Contrôle complémentaire',
    description: 'Contrôle pollution complémentaire',
  },
];

const VEHICLE_TYPE_OPTIONS = [
  { value: 'VL', label: 'Véhicule léger (VL)' },
  { value: 'VUL', label: 'Véhicule utilitaire léger (VUL)' },
  { value: 'MOTO', label: 'Moto / Scooter' },
  { value: 'CARAVANE', label: 'Caravane' },
  { value: 'REMORQUE', label: 'Remorque' },
];

const FUEL_TYPE_OPTIONS = [
  { value: 'ESSENCE', label: 'Essence' },
  { value: 'DIESEL', label: 'Diesel' },
  { value: 'ELECTRIQUE', label: 'Électrique' },
  { value: 'HYBRIDE', label: 'Hybride' },
  { value: 'GPL', label: 'GPL' },
  { value: 'GNV', label: 'GNV' },
];

export function StepVehicle() {
  const { state, setTypeControle, setVehicleInfo, nextStep } = useBooking();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: state.vehicleInfo || undefined,
    mode: 'onChange',
  });

  const selectedTypeControle = state.typeControle;

  const onSubmit = (data: VehicleFormData) => {
    setVehicleInfo(data as VehicleInfo);
    nextStep();
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Centre sélectionné */}
      {state.centre && (
        <Alert variant="info">
          <span className="font-medium">Centre sélectionné :</span> {state.centre.nom}, {state.centre.ville}
        </Alert>
      )}

      {/* Type de contrôle */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Type de contrôle</h2>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-3">
            {TYPE_CONTROLE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedTypeControle === option.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="typeControle"
                  value={option.value}
                  checked={selectedTypeControle === option.value}
                  onChange={() => setTypeControle(option.value as typeof selectedTypeControle)}
                  className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <div className="ml-3">
                  <span className="font-medium text-gray-900">{option.label}</span>
                  <p className="text-sm text-gray-500 mt-0.5">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Informations véhicule */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <TruckIcon className="h-5 w-5 text-gray-400" />
            Votre véhicule
          </h2>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input
                label="Immatriculation"
                placeholder="AB-123-CD"
                {...register('immatriculation')}
                error={errors.immatriculation?.message}
                className="uppercase"
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: AB-123-CD ou ancien format 1234 ABC 75
              </p>
            </div>

            <Select
              label="Type de véhicule"
              options={VEHICLE_TYPE_OPTIONS}
              {...register('type_vehicule')}
              error={errors.type_vehicule?.message}
            />

            <Select
              label="Carburant"
              options={FUEL_TYPE_OPTIONS}
              {...register('type_carburant')}
              error={errors.type_carburant?.message}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Marque (optionnel)"
                placeholder="Ex: Renault"
                {...register('marque')}
              />
              <Input
                label="Modèle (optionnel)"
                placeholder="Ex: Clio"
                {...register('modele')}
              />
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Continue Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-bottom">
        <div className="container-app">
          <Button
            onClick={handleSubmit(onSubmit)}
            fullWidth
            disabled={!isValid || !selectedTypeControle}
          >
            Continuer
          </Button>
        </div>
      </div>
    </div>
  );
}
