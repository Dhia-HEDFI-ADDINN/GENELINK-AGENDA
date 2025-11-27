'use client';

import { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBooking } from '@/contexts/BookingContext';
import {
  Steps,
  ChevronLeftIcon,
  Button,
  Spinner,
} from '@pti-calendar/design-system';
import { StepCentre } from '@/components/booking/StepCentre';
import { StepVehicle } from '@/components/booking/StepVehicle';
import { StepDateTime } from '@/components/booking/StepDateTime';
import { StepClient } from '@/components/booking/StepClient';
import { StepPayment } from '@/components/booking/StepPayment';
import { StepConfirmation } from '@/components/booking/StepConfirmation';

const BOOKING_STEPS = [
  { id: 'centre', title: 'Centre' },
  { id: 'vehicle', title: 'Véhicule' },
  { id: 'datetime', title: 'Date & Heure' },
  { id: 'client', title: 'Coordonnées' },
  { id: 'payment', title: 'Paiement' },
  { id: 'confirmation', title: 'Confirmation' },
];

function BookingContent() {
  const { state, prevStep } = useBooking();
  const currentStep = state.currentStep;

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StepCentre />;
      case 1:
        return <StepVehicle />;
      case 2:
        return <StepDateTime />;
      case 3:
        return <StepClient />;
      case 4:
        return <StepPayment />;
      case 5:
        return <StepConfirmation />;
      default:
        return <StepCentre />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="container-app">
          <div className="flex items-center h-14">
            {currentStep > 0 && currentStep < 5 && (
              <button
                onClick={prevStep}
                className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
                aria-label="Retour"
              >
                <ChevronLeftIcon className="h-6 w-6 text-gray-600" />
              </button>
            )}
            <h1 className="flex-1 text-center font-semibold text-gray-900">
              {currentStep < 5 ? 'Réservation' : 'Confirmation'}
            </h1>
            {currentStep > 0 && currentStep < 5 && <div className="w-10" />}
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      {currentStep < 5 && (
        <div className="bg-white border-b border-gray-100 py-4">
          <div className="container-app">
            <Steps
              steps={BOOKING_STEPS.slice(0, 5)}
              currentStep={currentStep}
              orientation="horizontal"
            />
          </div>
        </div>
      )}

      {/* Step Content */}
      <main className="container-app py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <BookingContent />
    </Suspense>
  );
}
