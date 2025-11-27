'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types
export interface Centre {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  code_postal: string;
  telephone: string;
  latitude: number;
  longitude: number;
  distance?: number;
  prochaine_disponibilite?: string;
  note_moyenne?: number;
}

export interface VehicleInfo {
  immatriculation: string;
  type_vehicule: 'VL' | 'VUL' | 'MOTO' | 'CARAVANE' | 'REMORQUE';
  type_carburant: 'ESSENCE' | 'DIESEL' | 'ELECTRIQUE' | 'HYBRIDE' | 'GPL' | 'GNV';
  marque?: string;
  modele?: string;
  date_premiere_immatriculation?: string;
  date_derniere_visite?: string;
}

export interface ClientInfo {
  civilite: 'M' | 'MME';
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse?: string;
  code_postal?: string;
  ville?: string;
  recoit_sms: boolean;
  recoit_email: boolean;
  accepte_conditions: boolean;
}

export interface SelectedSlot {
  date: string;
  heure_debut: string;
  heure_fin: string;
  controleur_id?: string;
  controleur_nom?: string;
}

export interface BookingState {
  currentStep: number;
  centre: Centre | null;
  typeControle: 'PERIODIQUE' | 'CONTRE_VISITE' | 'COMPLEMENTAIRE' | null;
  vehicleInfo: VehicleInfo | null;
  selectedSlot: SelectedSlot | null;
  clientInfo: ClientInfo | null;
  promoCode: string | null;
  prixTotal: number | null;
  prixBase: number | null;
  reduction: number | null;
  rdvId: string | null;
  paymentIntentId: string | null;
  paymentStatus: 'pending' | 'processing' | 'succeeded' | 'failed' | null;
}

type BookingAction =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_CENTRE'; payload: Centre }
  | { type: 'SET_TYPE_CONTROLE'; payload: BookingState['typeControle'] }
  | { type: 'SET_VEHICLE_INFO'; payload: VehicleInfo }
  | { type: 'SET_SELECTED_SLOT'; payload: SelectedSlot }
  | { type: 'SET_CLIENT_INFO'; payload: ClientInfo }
  | { type: 'SET_PROMO_CODE'; payload: string }
  | { type: 'SET_PRICING'; payload: { prixBase: number; prixTotal: number; reduction: number } }
  | { type: 'SET_RDV_ID'; payload: string }
  | { type: 'SET_PAYMENT_INTENT'; payload: string }
  | { type: 'SET_PAYMENT_STATUS'; payload: BookingState['paymentStatus'] }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'RESET' };

const initialState: BookingState = {
  currentStep: 0,
  centre: null,
  typeControle: null,
  vehicleInfo: null,
  selectedSlot: null,
  clientInfo: null,
  promoCode: null,
  prixTotal: null,
  prixBase: null,
  reduction: null,
  rdvId: null,
  paymentIntentId: null,
  paymentStatus: null,
};

function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_CENTRE':
      return { ...state, centre: action.payload };
    case 'SET_TYPE_CONTROLE':
      return { ...state, typeControle: action.payload };
    case 'SET_VEHICLE_INFO':
      return { ...state, vehicleInfo: action.payload };
    case 'SET_SELECTED_SLOT':
      return { ...state, selectedSlot: action.payload };
    case 'SET_CLIENT_INFO':
      return { ...state, clientInfo: action.payload };
    case 'SET_PROMO_CODE':
      return { ...state, promoCode: action.payload };
    case 'SET_PRICING':
      return {
        ...state,
        prixBase: action.payload.prixBase,
        prixTotal: action.payload.prixTotal,
        reduction: action.payload.reduction,
      };
    case 'SET_RDV_ID':
      return { ...state, rdvId: action.payload };
    case 'SET_PAYMENT_INTENT':
      return { ...state, paymentIntentId: action.payload };
    case 'SET_PAYMENT_STATUS':
      return { ...state, paymentStatus: action.payload };
    case 'NEXT_STEP':
      return { ...state, currentStep: Math.min(state.currentStep + 1, 5) };
    case 'PREV_STEP':
      return { ...state, currentStep: Math.max(state.currentStep - 1, 0) };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface BookingContextValue {
  state: BookingState;
  dispatch: React.Dispatch<BookingAction>;
  setCentre: (centre: Centre) => void;
  setTypeControle: (type: BookingState['typeControle']) => void;
  setVehicleInfo: (info: VehicleInfo) => void;
  setSelectedSlot: (slot: SelectedSlot) => void;
  setClientInfo: (info: ClientInfo) => void;
  setPromoCode: (code: string) => void;
  setPricing: (pricing: { prixBase: number; prixTotal: number; reduction: number }) => void;
  setRdvId: (id: string) => void;
  setPaymentIntent: (id: string) => void;
  setPaymentStatus: (status: BookingState['paymentStatus']) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
  canProceed: boolean;
}

const BookingContext = createContext<BookingContextValue | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(bookingReducer, initialState);

  const canProceed = (() => {
    switch (state.currentStep) {
      case 0: // Centre selection
        return state.centre !== null;
      case 1: // Type & Vehicle
        return state.typeControle !== null && state.vehicleInfo !== null;
      case 2: // Date & Time
        return state.selectedSlot !== null;
      case 3: // Client info
        return state.clientInfo !== null;
      case 4: // Payment
        return state.paymentStatus === 'succeeded';
      default:
        return true;
    }
  })();

  const value: BookingContextValue = {
    state,
    dispatch,
    setCentre: (centre) => dispatch({ type: 'SET_CENTRE', payload: centre }),
    setTypeControle: (type) => dispatch({ type: 'SET_TYPE_CONTROLE', payload: type }),
    setVehicleInfo: (info) => dispatch({ type: 'SET_VEHICLE_INFO', payload: info }),
    setSelectedSlot: (slot) => dispatch({ type: 'SET_SELECTED_SLOT', payload: slot }),
    setClientInfo: (info) => dispatch({ type: 'SET_CLIENT_INFO', payload: info }),
    setPromoCode: (code) => dispatch({ type: 'SET_PROMO_CODE', payload: code }),
    setPricing: (pricing) => dispatch({ type: 'SET_PRICING', payload: pricing }),
    setRdvId: (id) => dispatch({ type: 'SET_RDV_ID', payload: id }),
    setPaymentIntent: (id) => dispatch({ type: 'SET_PAYMENT_INTENT', payload: id }),
    setPaymentStatus: (status) => dispatch({ type: 'SET_PAYMENT_STATUS', payload: status }),
    nextStep: () => dispatch({ type: 'NEXT_STEP' }),
    prevStep: () => dispatch({ type: 'PREV_STEP' }),
    reset: () => dispatch({ type: 'RESET' }),
    canProceed,
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}
