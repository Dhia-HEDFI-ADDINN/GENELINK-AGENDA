'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useBooking } from '@/contexts/BookingContext';
import {
  Input,
  Card,
  CardContent,
  CardHeader,
  Button,
  Spinner,
  Alert,
  CreditCardIcon,
  CheckCircleIcon,
} from '@pti-calendar/design-system';
import { apiClient } from '@/lib/api-client';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface CreateRdvResponse {
  rdv_id: string;
  client_secret: string;
  payment_intent_id: string;
  prix_base: number;
  prix_total: number;
  reduction: number;
}

interface CheckPromoResponse {
  valid: boolean;
  type_reduction: 'POURCENTAGE' | 'MONTANT_FIXE';
  valeur: number;
  nouveau_prix: number;
}

export function StepPayment() {
  const { state, setRdvId, setPricing, setPaymentIntent, nextStep } = useBooking();
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Create RDV and get payment intent
  const createRdvMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<CreateRdvResponse>('/rdv/create-with-payment', {
        centre_id: state.centre?.id,
        type_controle: state.typeControle,
        date: state.selectedSlot?.date,
        heure_debut: state.selectedSlot?.heure_debut,
        heure_fin: state.selectedSlot?.heure_fin,
        controleur_id: state.selectedSlot?.controleur_id,
        vehicule: state.vehicleInfo,
        client: state.clientInfo,
        code_promo: promoApplied ? promoCode : undefined,
      });
      return response.data;
    },
    onSuccess: (data) => {
      setRdvId(data.rdv_id);
      setPaymentIntent(data.payment_intent_id);
      setPricing({
        prixBase: data.prix_base,
        prixTotal: data.prix_total,
        reduction: data.reduction,
      });
    },
  });

  // Check promo code
  const checkPromoMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiClient.post<CheckPromoResponse>('/paiements/check-promo', {
        code,
        centre_id: state.centre?.id,
        type_controle: state.typeControle,
        type_vehicule: state.vehicleInfo?.type_vehicule,
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.valid) {
        setPromoApplied(true);
        setPromoError(null);
        setPricing({
          prixBase: state.prixBase || 0,
          prixTotal: data.nouveau_prix,
          reduction: data.valeur,
        });
      } else {
        setPromoError('Code promo invalide');
      }
    },
    onError: () => {
      setPromoError('Code promo invalide ou expiré');
    },
  });

  // Initialize payment on mount
  useEffect(() => {
    if (!state.rdvId) {
      createRdvMutation.mutate();
    }
  }, []);

  const handleApplyPromo = () => {
    if (promoCode.trim()) {
      checkPromoMutation.mutate(promoCode.trim().toUpperCase());
    }
  };

  if (createRdvMutation.isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner size="lg" />
        <p className="text-gray-500 mt-4">Préparation de votre réservation...</p>
      </div>
    );
  }

  if (createRdvMutation.isError) {
    return (
      <Alert variant="error" title="Erreur">
        Une erreur est survenue lors de la création de votre réservation. Veuillez réessayer.
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => createRdvMutation.mutate()}
        >
          Réessayer
        </Button>
      </Alert>
    );
  }

  const clientSecret = createRdvMutation.data?.client_secret;

  return (
    <div className="space-y-6 pb-24">
      {/* Récapitulatif */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <h3 className="font-medium text-gray-900 mb-3">Récapitulatif</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Centre</span>
              <span className="font-medium text-gray-900">{state.centre?.nom}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date</span>
              <span className="text-gray-900">
                {state.selectedSlot &&
                  format(new Date(state.selectedSlot.date), 'd MMMM yyyy', { locale: fr })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Heure</span>
              <span className="text-gray-900">{state.selectedSlot?.heure_debut}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Véhicule</span>
              <span className="text-gray-900">{state.vehicleInfo?.immatriculation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Client</span>
              <span className="text-gray-900">
                {state.clientInfo?.prenom} {state.clientInfo?.nom}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Code promo */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Code promo</h2>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex gap-2">
            <Input
              placeholder="Entrez votre code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              disabled={promoApplied}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={handleApplyPromo}
              disabled={promoApplied || checkPromoMutation.isPending}
            >
              {checkPromoMutation.isPending ? <Spinner size="sm" /> : 'Appliquer'}
            </Button>
          </div>
          {promoApplied && (
            <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
              <CheckCircleIcon className="h-4 w-4" />
              Code promo appliqué !
            </div>
          )}
          {promoError && (
            <p className="mt-2 text-sm text-red-600">{promoError}</p>
          )}
        </CardContent>
      </Card>

      {/* Tarif */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Montant à payer</h2>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Contrôle technique</span>
              <span className="text-gray-900">
                {state.prixBase?.toFixed(2)} €
              </span>
            </div>
            {state.reduction && state.reduction > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Réduction</span>
                <span>-{state.reduction.toFixed(2)} €</span>
              </div>
            )}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-xl text-primary-600">
                  {state.prixTotal?.toFixed(2)} €
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Paiement Stripe */}
      {clientSecret && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <CreditCardIcon className="h-5 w-5 text-gray-400" />
              Paiement sécurisé
            </h2>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#2563eb',
                    borderRadius: '8px',
                  },
                },
                locale: 'fr',
              }}
            >
              <PaymentForm onSuccess={nextStep} />
            </Elements>
          </CardContent>
        </Card>
      )}

      {/* Security badges */}
      <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
          Paiement sécurisé SSL
        </span>
        <span>Powered by Stripe</span>
      </div>
    </div>
  );
}

function PaymentForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setPaymentStatus } = useBooking();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);
    setPaymentStatus('processing');

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || 'Erreur lors de la validation');
      setIsProcessing(false);
      setPaymentStatus('failed');
      return;
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/booking/confirmation`,
      },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message || 'Erreur lors du paiement');
      setIsProcessing(false);
      setPaymentStatus('failed');
    } else if (paymentIntent?.status === 'succeeded') {
      setPaymentStatus('succeeded');
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <Alert variant="error">{error}</Alert>
      )}
      <Button
        type="submit"
        fullWidth
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <>
            <Spinner size="sm" color="white" className="mr-2" />
            Paiement en cours...
          </>
        ) : (
          'Payer et confirmer'
        )}
      </Button>
    </form>
  );
}
