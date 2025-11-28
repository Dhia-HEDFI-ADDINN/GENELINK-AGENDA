'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api, Centre } from '@/lib/api-client';

interface Location {
  latitude: number;
  longitude: number;
}

export default function CentresPage() {
  const [centres, setCentres] = useState<Centre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchRadius, setSearchRadius] = useState(30);
  const [sortBy, setSortBy] = useState<'distance' | 'name' | 'availability'>('distance');

  // Request user's location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (err) => {
          setLocationError('Impossible d\'obtenir votre position. Vous pouvez rechercher par ville ou code postal.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    }
  }, []);

  // Load centres
  const loadCentres = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        limit: 50,
      };

      if (userLocation) {
        params.latitude = userLocation.latitude;
        params.longitude = userLocation.longitude;
      }

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const result = await api.searchCentres(params);
      let sortedCentres = result.data || [];

      // Sort centres
      if (sortBy === 'distance' && userLocation) {
        sortedCentres = sortedCentres.sort((a, b) => (a.distance || 999) - (b.distance || 999));
      } else if (sortBy === 'name') {
        sortedCentres = sortedCentres.sort((a, b) => a.nom.localeCompare(b.nom));
      } else if (sortBy === 'availability') {
        sortedCentres = sortedCentres.sort((a, b) => {
          if (a.prochaine_disponibilite && !b.prochaine_disponibilite) return -1;
          if (!a.prochaine_disponibilite && b.prochaine_disponibilite) return 1;
          if (a.prochaine_disponibilite && b.prochaine_disponibilite) {
            return new Date(a.prochaine_disponibilite).getTime() - new Date(b.prochaine_disponibilite).getTime();
          }
          return 0;
        });
      }

      // Filter by radius if location available
      if (userLocation && searchRadius) {
        sortedCentres = sortedCentres.filter((c) => !c.distance || c.distance <= searchRadius);
      }

      setCentres(sortedCentres);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des centres');
    } finally {
      setLoading(false);
    }
  }, [userLocation, searchQuery, searchRadius, sortBy]);

  useEffect(() => {
    loadCentres();
  }, [loadCentres]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadCentres();
  };

  const getDirections = (centre: Centre) => {
    const destination = centre.latitude && centre.longitude
      ? `${centre.latitude},${centre.longitude}`
      : encodeURIComponent(`${centre.adresse}, ${centre.code_postal} ${centre.ville}`);

    const origin = userLocation
      ? `${userLocation.latitude},${userLocation.longitude}`
      : '';

    const url = origin
      ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`
      : `https://www.google.com/maps/dir/?api=1&destination=${destination}`;

    window.open(url, '_blank');
  };

  const formatDistance = (km: number): string => {
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
  };

  const formatNextAvailability = (dateStr?: string): string => {
    if (!dateStr) return 'Non disponible';
    const date = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays === 1) return 'Demain';
    if (diffDays < 7) return `Dans ${diffDays} jours`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="flex items-center hover:opacity-80">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Retour
            </Link>
          </div>
          <h1 className="text-2xl font-bold">Trouver un centre</h1>
          <p className="text-blue-100 mt-1">Plus de 2000 centres SGS en France</p>
        </div>
      </header>

      {/* Search Bar */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ville, code postal, ou nom du centre..."
                className="w-full border rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Rechercher
            </button>
          </form>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Rayon:</label>
              <select
                value={searchRadius}
                onChange={(e) => setSearchRadius(Number(e.target.value))}
                className="border rounded-lg px-2 py-1 text-sm"
              >
                <option value={10}>10 km</option>
                <option value={20}>20 km</option>
                <option value={30}>30 km</option>
                <option value={50}>50 km</option>
                <option value={100}>100 km</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Trier par:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border rounded-lg px-2 py-1 text-sm"
              >
                <option value="distance">Distance</option>
                <option value="availability">Disponibilité</option>
                <option value="name">Nom</option>
              </select>
            </div>
          </div>

          {/* Location status */}
          {locationError && (
            <div className="mt-3 flex items-center text-amber-600 text-sm">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {locationError}
            </div>
          )}
          {userLocation && !locationError && (
            <div className="mt-3 flex items-center text-green-600 text-sm">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              Position détectée - Centres triés par distance
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700">{error}</p>
            <button
              onClick={loadCentres}
              className="mt-4 text-red-600 underline hover:no-underline"
            >
              Réessayer
            </button>
          </div>
        ) : centres.length === 0 ? (
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucun centre trouvé</h3>
            <p className="text-gray-600">Essayez de modifier votre recherche ou d'augmenter le rayon</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {centres.map((centre) => (
              <div
                key={centre.id}
                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
              >
                <div className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    {/* Centre Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-lg text-gray-900">{centre.nom}</h3>
                        {centre.distance !== undefined && (
                          <span className="inline-flex items-center bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm font-medium ml-2">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            {formatDistance(centre.distance)}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mt-1">{centre.adresse}</p>
                      <p className="text-gray-600">{centre.code_postal} {centre.ville}</p>
                      <div className="flex flex-wrap gap-4 mt-3 text-sm">
                        <a
                          href={`tel:${centre.telephone}`}
                          className="flex items-center text-gray-600 hover:text-blue-600"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {centre.telephone}
                        </a>
                        {centre.email && (
                          <a
                            href={`mailto:${centre.email}`}
                            className="flex items-center text-gray-600 hover:text-blue-600"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Email
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Availability & Actions */}
                    <div className="flex flex-col items-end gap-3">
                      {centre.prochaine_disponibilite && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Prochaine dispo</p>
                          <p className="text-green-600 font-medium">
                            {formatNextAvailability(centre.prochaine_disponibilite)}
                          </p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => getDirections(centre)}
                          className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm transition-colors"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                          Itinéraire
                        </button>
                        <Link
                          href={`/booking?centre=${centre.id}`}
                          className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                          Réserver
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Map Placeholder */}
        <div className="mt-8">
          <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <p>Carte interactive</p>
              <p className="text-sm">(Google Maps intégré en production)</p>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 md:hidden">
        <Link
          href="/booking"
          className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-blue-700"
        >
          Prendre rendez-vous
        </Link>
      </div>
    </div>
  );
}
