'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useBooking, Centre } from '@/contexts/BookingContext';
import {
  Input,
  Card,
  CardContent,
  Button,
  Spinner,
  Alert,
  MapPinIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  ClockIcon,
} from '@pti-calendar/design-system';
import { apiClient } from '@/lib/api-client';

export function StepCentre() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [useGeolocation, setUseGeolocation] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const { state, setCentre, nextStep } = useBooking();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Geolocation
  useEffect(() => {
    if (useGeolocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          setUseGeolocation(false);
        }
      );
    }
  }, [useGeolocation]);

  // Search centres
  const { data: centres, isLoading, error } = useQuery({
    queryKey: ['centres', debouncedSearch, userLocation],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }
      if (userLocation) {
        params.latitude = userLocation.lat.toString();
        params.longitude = userLocation.lng.toString();
      }
      params.limit = '20';

      const response = await apiClient.get<{ data: Centre[] }>('/centres', { params });
      return response.data.data;
    },
    enabled: debouncedSearch.length >= 2 || userLocation !== null,
  });

  const handleSelectCentre = (centre: Centre) => {
    setCentre(centre);
  };

  const handleContinue = () => {
    if (state.centre) {
      nextStep();
    }
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-3">
        <Input
          placeholder="Rechercher par ville, code postal..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
        />
        <button
          onClick={() => setUseGeolocation(true)}
          className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
        >
          <MapPinIcon className="h-4 w-4" />
          Utiliser ma position actuelle
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Error */}
      {error && (
        <Alert variant="error">
          Une erreur est survenue lors de la recherche. Veuillez réessayer.
        </Alert>
      )}

      {/* Results */}
      {centres && centres.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            {centres.length} centre{centres.length > 1 ? 's' : ''} trouvé{centres.length > 1 ? 's' : ''}
          </p>
          {centres.map((centre) => (
            <CentreCard
              key={centre.id}
              centre={centre}
              isSelected={state.centre?.id === centre.id}
              onSelect={() => handleSelectCentre(centre)}
            />
          ))}
        </div>
      )}

      {/* No results */}
      {centres && centres.length === 0 && debouncedSearch.length >= 2 && (
        <div className="text-center py-12">
          <MapPinIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucun centre trouvé pour "{debouncedSearch}"</p>
          <p className="text-sm text-gray-400 mt-2">
            Essayez avec une autre ville ou code postal
          </p>
        </div>
      )}

      {/* Empty state */}
      {!centres && !isLoading && debouncedSearch.length < 2 && !userLocation && (
        <div className="text-center py-12">
          <MagnifyingGlassIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Recherchez un centre de contrôle technique</p>
          <p className="text-sm text-gray-400 mt-2">
            Entrez au moins 2 caractères ou utilisez votre position
          </p>
        </div>
      )}

      {/* Continue Button */}
      {state.centre && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-bottom">
          <div className="container-app">
            <Button onClick={handleContinue} fullWidth>
              Continuer avec ce centre
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface CentreCardProps {
  centre: Centre;
  isSelected: boolean;
  onSelect: () => void;
}

function CentreCard({ centre, isSelected, onSelect }: CentreCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all ${
        isSelected
          ? 'ring-2 ring-primary-500 border-primary-500'
          : 'hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{centre.nom}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {centre.adresse}, {centre.code_postal} {centre.ville}
            </p>

            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
              {centre.distance !== undefined && (
                <span className="flex items-center gap-1">
                  <MapPinIcon className="h-4 w-4" />
                  {centre.distance < 1
                    ? `${Math.round(centre.distance * 1000)}m`
                    : `${centre.distance.toFixed(1)}km`}
                </span>
              )}
              {centre.telephone && (
                <span className="flex items-center gap-1">
                  <PhoneIcon className="h-4 w-4" />
                  {centre.telephone}
                </span>
              )}
            </div>

            {centre.prochaine_disponibilite && (
              <div className="mt-3 flex items-center gap-1 text-sm text-green-600">
                <ClockIcon className="h-4 w-4" />
                <span>
                  Prochaine dispo :{' '}
                  {new Date(centre.prochaine_disponibilite).toLocaleDateString('fr-FR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Selection indicator */}
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-3 ${
              isSelected
                ? 'border-primary-500 bg-primary-500'
                : 'border-gray-300'
            }`}
          >
            {isSelected && (
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
