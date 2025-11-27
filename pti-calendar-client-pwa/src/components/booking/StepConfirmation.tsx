'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useBooking } from '@/contexts/BookingContext';
import {
  Card,
  CardContent,
  Button,
  CheckCircleIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  TruckIcon,
  DocumentTextIcon,
} from '@pti-calendar/design-system';

export function StepConfirmation() {
  const { state, reset } = useBooking();

  // Add to calendar URL
  const getCalendarUrl = () => {
    if (!state.selectedSlot || !state.centre) return '#';

    const startDate = new Date(`${state.selectedSlot.date}T${state.selectedSlot.heure_debut}`);
    const endDate = new Date(`${state.selectedSlot.date}T${state.selectedSlot.heure_fin}`);

    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    const title = encodeURIComponent('Contrôle technique - ' + state.centre.nom);
    const location = encodeURIComponent(`${state.centre.adresse}, ${state.centre.code_postal} ${state.centre.ville}`);
    const details = encodeURIComponent(
      `Véhicule: ${state.vehicleInfo?.immatriculation}\nType: ${state.typeControle}\n\nPensez à apporter:\n- Carte grise\n- Dernier rapport de contrôle technique (si contre-visite)`
    );

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatDate(startDate)}/${formatDate(endDate)}&location=${location}&details=${details}`;
  };

  return (
    <div className="space-y-6 py-8">
      {/* Success animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="flex justify-center"
      >
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircleIcon className="h-12 w-12 text-green-600" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <h1 className="text-2xl font-bold text-gray-900">Réservation confirmée !</h1>
        <p className="text-gray-500 mt-2">
          Votre rendez-vous a été enregistré avec succès.
        </p>
        {state.rdvId && (
          <p className="text-sm text-gray-400 mt-1">
            Référence : {state.rdvId}
          </p>
        )}
      </motion.div>

      {/* Confirmation details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CalendarIcon className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Date et heure</p>
                <p className="font-semibold text-gray-900">
                  {state.selectedSlot &&
                    format(new Date(state.selectedSlot.date), 'EEEE d MMMM yyyy', { locale: fr })}
                </p>
                <p className="text-gray-700">à {state.selectedSlot?.heure_debut}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPinIcon className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Centre</p>
                <p className="font-semibold text-gray-900">{state.centre?.nom}</p>
                <p className="text-gray-700">
                  {state.centre?.adresse}
                  <br />
                  {state.centre?.code_postal} {state.centre?.ville}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <TruckIcon className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Véhicule</p>
                <p className="font-semibold text-gray-900">
                  {state.vehicleInfo?.immatriculation}
                </p>
                <p className="text-gray-700">
                  {state.vehicleInfo?.marque} {state.vehicleInfo?.modele}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Documents reminder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <DocumentTextIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-800">Documents à apporter</h3>
                <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                  <li>• Carte grise du véhicule</li>
                  <li>• Pièce d'identité</li>
                  {state.typeControle === 'CONTRE_VISITE' && (
                    <li>• Dernier rapport de contrôle technique</li>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-600">
              Un email de confirmation a été envoyé à{' '}
              <span className="font-medium">{state.clientInfo?.email}</span>
            </p>
            {state.clientInfo?.recoit_sms && (
              <p className="text-sm text-gray-600 mt-1">
                Un SMS de rappel sera envoyé 24h avant votre rendez-vous.
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="space-y-3"
      >
        <a href={getCalendarUrl()} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" fullWidth>
            <CalendarIcon className="h-5 w-5 mr-2" />
            Ajouter au calendrier
          </Button>
        </a>

        <Link href="/mes-rdv">
          <Button variant="secondary" fullWidth>
            Voir mes rendez-vous
          </Button>
        </Link>

        <Link href="/">
          <Button variant="ghost" fullWidth onClick={reset}>
            Retour à l'accueil
          </Button>
        </Link>
      </motion.div>

      {/* Contact */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-center text-sm text-gray-500 pt-4"
      >
        <p>
          Besoin d'aide ?{' '}
          <a href="tel:0800123456" className="text-primary-600 hover:underline">
            0 800 123 456
          </a>{' '}
          (appel gratuit)
        </p>
      </motion.div>
    </div>
  );
}
