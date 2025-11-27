'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Button,
  Input,
  Card,
  CardContent,
  CalendarIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
} from '@pti-calendar/design-system';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    if (searchQuery.trim()) {
      window.location.href = `/booking?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const features = [
    {
      icon: <CalendarIcon className="h-8 w-8" />,
      title: 'Réservation 24h/24',
      description: 'Prenez rendez-vous à tout moment, même le week-end',
    },
    {
      icon: <MapPinIcon className="h-8 w-8" />,
      title: '+2000 centres',
      description: 'Trouvez le centre SGS le plus proche de chez vous',
    },
    {
      icon: <ClockIcon className="h-8 w-8" />,
      title: 'Créneaux flexibles',
      description: 'Choisissez le créneau qui vous convient',
    },
    {
      icon: <CheckCircleIcon className="h-8 w-8" />,
      title: 'Confirmation immédiate',
      description: 'Recevez votre confirmation par SMS et email',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container-app py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <CalendarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">PTI Calendar</h1>
                <p className="text-xs text-gray-500">by SGS France</p>
              </div>
            </div>
            <Link href="/mes-rdv">
              <Button variant="ghost" size="sm">
                Mes RDV
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container-app py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Réservez votre contrôle technique
          </h2>
          <p className="text-gray-600 mb-8">
            Simple, rapide et sans stress. Trouvez un centre près de chez vous.
          </p>
        </motion.div>

        {/* Search Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Ville, code postal ou adresse..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    leftIcon={<MapPinIcon className="h-5 w-5" />}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Button onClick={handleSearch} className="sm:w-auto w-full">
                  <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                  Rechercher
                </Button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-sm text-gray-500">Recherches fréquentes :</span>
                {['Paris', 'Lyon', 'Marseille', 'Toulouse'].map((city) => (
                  <button
                    key={city}
                    onClick={() => setSearchQuery(city)}
                    className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
                  >
                    {city}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-2 gap-4 mb-12"
        >
          <Link href="/booking">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CalendarIcon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">Nouveau RDV</h3>
                <p className="text-xs text-gray-500 mt-1">Prendre rendez-vous</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/mes-rdv">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">Mes RDV</h3>
                <p className="text-xs text-gray-500 mt-1">Gérer mes rendez-vous</p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            Pourquoi choisir PTI Calendar ?
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="p-4 text-center">
                    <div className="text-primary-600 mb-3 flex justify-center">
                      {feature.icon}
                    </div>
                    <h4 className="font-medium text-gray-900 text-sm mb-1">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-gray-500">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-8 mt-12">
        <div className="container-app text-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} SGS France - PTI Calendar
          </p>
          <div className="mt-4 flex justify-center gap-6 text-sm">
            <Link href="/mentions-legales" className="text-gray-500 hover:text-gray-700">
              Mentions légales
            </Link>
            <Link href="/cgv" className="text-gray-500 hover:text-gray-700">
              CGV
            </Link>
            <Link href="/contact" className="text-gray-500 hover:text-gray-700">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
