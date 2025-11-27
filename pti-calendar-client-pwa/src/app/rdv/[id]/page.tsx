'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, parseISO, isBefore, addHours } from 'date-fns';
import { fr } from 'date-fns/locale';
import { apiClient, Rdv } from '@/lib/api-client';

type RdvStatus = 'CREE' | 'CONFIRME' | 'RAPPELE' | 'EN_COURS' | 'TERMINE' | 'ANNULE' | 'NO_SHOW' | 'REPORTE';

const statusConfig: Record<RdvStatus, { label: string; color: string; bgColor: string }> = {
  CREE: { label: 'Créé', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  CONFIRME: { label: 'Confirmé', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  RAPPELE: { label: 'Rappelé', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  EN_COURS: { label: 'En cours', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  TERMINE: { label: 'Terminé', color: 'text-green-700', bgColor: 'bg-green-100' },
  ANNULE: { label: 'Annulé', color: 'text-red-700', bgColor: 'bg-red-100' },
  NO_SHOW: { label: 'Absent', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  REPORTE: { label: 'Reporté', color: 'text-purple-700', bgColor: 'bg-purple-100' },
};

const typeControleLabels: Record<string, string> = {
  CTP: 'Contrôle Technique Périodique',
  CVP: 'Contre-visite pollution',
  CV: 'Contre-visite',
  CTC: 'Contrôle Technique Complémentaire',
};

export default function RdvDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [rdv, setRdv] = useState<Rdv | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadRdv();
  }, [params.id]);

  const loadRdv = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getRdv(params.id as string);
      setRdv(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement du RDV');
    } finally {
      setLoading(false);
    }
  };

  const canModify = (): boolean => {
    if (!rdv) return false;
    // Can't modify if already completed, cancelled, or no-show
    if (['TERMINE', 'ANNULE', 'NO_SHOW'].includes(rdv.statut)) return false;
    // Can modify up to 24h before the appointment
    const rdvDateTime = parseISO(`${rdv.date}T${rdv.heure_debut}`);
    return isBefore(new Date(), addHours(rdvDateTime, -24));
  };

  const canCancel = (): boolean => {
    if (!rdv) return false;
    // Can't cancel if already completed, cancelled, or no-show
    if (['TERMINE', 'ANNULE', 'NO_SHOW', 'EN_COURS'].includes(rdv.statut)) return false;
    return true;
  };

  const handleCancel = async () => {
    if (!rdv || !cancelReason.trim()) return;

    try {
      setCancelling(true);
      await apiClient.cancelRdv(rdv.id);
      // Reload RDV to get updated status
      await loadRdv();
      setShowCancelModal(false);
      setCancelReason('');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'annulation');
    } finally {
      setCancelling(false);
    }
  };

  const handleAddToCalendar = () => {
    if (!rdv) return;

    const startDate = parseISO(`${rdv.date}T${rdv.heure_debut}`);
    const endDate = parseISO(`${rdv.date}T${rdv.heure_fin}`);

    const event = {
      title: `Contrôle Technique - ${rdv.vehicule.immatriculation}`,
      description: `RDV: ${rdv.reference}\nType: ${typeControleLabels[rdv.type_controle]}\nVéhicule: ${rdv.vehicule.immatriculation}`,
      location: `${rdv.centre.nom}, ${rdv.centre.adresse}, ${rdv.centre.code_postal} ${rdv.centre.ville}`,
      startDate: format(startDate, "yyyyMMdd'T'HHmmss"),
      endDate: format(endDate, "yyyyMMdd'T'HHmmss"),
    };

    // Google Calendar URL
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${event.startDate}/${event.endDate}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`;
    window.open(googleUrl, '_blank');
  };

  const handleGetDirections = () => {
    if (!rdv) return;
    const address = encodeURIComponent(`${rdv.centre.adresse}, ${rdv.centre.code_postal} ${rdv.centre.ville}`);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${address}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !rdv) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">RDV introuvable</h2>
          <p className="text-gray-600 mb-6">{error || 'Le rendez-vous demandé n\'existe pas ou a été supprimé.'}</p>
          <Link
            href="/mes-rdv"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Retour à mes RDV
          </Link>
        </div>
      </div>
    );
  }

  const status = statusConfig[rdv.statut as RdvStatus] || statusConfig.CREE;
  const rdvDate = parseISO(rdv.date);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/mes-rdv" className="text-blue-600 hover:text-blue-700 flex items-center">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Retour
            </Link>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.bgColor} ${status.color}`}>
              {status.label}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Reference */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">RDV #{rdv.reference}</h1>
              <p className="text-gray-500 text-sm mt-1">
                Créé le {format(parseISO(rdv.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{rdv.prix_total}€</div>
              <div className="text-sm text-gray-500">TTC</div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="flex items-center bg-blue-50 rounded-lg p-4 mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex flex-col items-center justify-center text-white mr-4">
              <span className="text-2xl font-bold">{format(rdvDate, 'd')}</span>
              <span className="text-xs uppercase">{format(rdvDate, 'MMM', { locale: fr })}</span>
            </div>
            <div>
              <div className="font-semibold text-lg text-gray-900">
                {format(rdvDate, 'EEEE d MMMM yyyy', { locale: fr })}
              </div>
              <div className="text-gray-600">
                {rdv.heure_debut} - {rdv.heure_fin}
              </div>
            </div>
          </div>

          {/* Control Type */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Type de contrôle</h3>
            <p className="text-lg font-semibold text-gray-900">
              {typeControleLabels[rdv.type_controle] || rdv.type_controle}
            </p>
          </div>
        </div>

        {/* Centre Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Centre de contrôle
          </h2>
          <div className="space-y-2">
            <p className="font-semibold text-gray-900">{rdv.centre.nom}</p>
            <p className="text-gray-600">{rdv.centre.adresse}</p>
            <p className="text-gray-600">{rdv.centre.code_postal} {rdv.centre.ville}</p>
            <p className="text-gray-600">📞 {rdv.centre.telephone}</p>
          </div>
          <button
            onClick={handleGetDirections}
            className="mt-4 w-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Itinéraire
          </button>
        </div>

        {/* Vehicle Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Véhicule
          </h2>
          <div className="flex items-center">
            <div className="bg-yellow-400 px-4 py-2 rounded-lg mr-4">
              <span className="font-mono font-bold text-lg">{rdv.vehicule.immatriculation}</span>
            </div>
            <div>
              {rdv.vehicule.marque && rdv.vehicule.modele && (
                <p className="font-semibold text-gray-900">{rdv.vehicule.marque} {rdv.vehicule.modele}</p>
              )}
              <p className="text-gray-600">
                {rdv.vehicule.type_vehicule} • {rdv.vehicule.type_carburant}
              </p>
            </div>
          </div>
        </div>

        {/* Client Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Informations client
          </h2>
          <div className="space-y-2">
            <p className="font-semibold text-gray-900">
              {rdv.client.civilite} {rdv.client.prenom} {rdv.client.nom}
            </p>
            <p className="text-gray-600">📧 {rdv.client.email}</p>
            <p className="text-gray-600">📞 {rdv.client.telephone}</p>
          </div>
        </div>

        {/* Inspection Result (if completed) */}
        {rdv.statut === 'TERMINE' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Résultat du contrôle
            </h2>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-green-700 font-medium">Contrôle technique validé</p>
              <p className="text-sm text-gray-600 mt-2">
                Votre véhicule a passé le contrôle technique avec succès.
                Le procès-verbal sera disponible sous 24h.
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleAddToCalendar}
              className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Ajouter au calendrier
            </button>

            {canModify() && (
              <Link
                href={`/rdv/${rdv.id}/modifier`}
                className="flex items-center justify-center bg-blue-100 hover:bg-blue-200 text-blue-700 py-3 px-4 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Modifier
              </Link>
            )}

            {canCancel() && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="flex items-center justify-center bg-red-100 hover:bg-red-200 text-red-700 py-3 px-4 rounded-lg transition-colors col-span-2"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Annuler le RDV
              </button>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Besoin d'aide ?</h3>
          <p className="text-blue-700 text-sm mb-4">
            Contactez notre service client pour toute question concernant votre rendez-vous.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="tel:0800000000"
              className="flex items-center justify-center bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              📞 0 800 00 00 00
            </a>
            <a
              href="mailto:contact@sgs.com"
              className="flex items-center justify-center bg-white text-blue-600 border border-blue-600 py-2 px-4 rounded-lg hover:bg-blue-50"
            >
              📧 Nous contacter
            </a>
          </div>
        </div>
      </main>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Annuler le rendez-vous</h3>
            <p className="text-gray-600 mb-4">
              Êtes-vous sûr de vouloir annuler ce rendez-vous ? Cette action est irréversible.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motif d'annulation *
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Sélectionnez un motif</option>
                <option value="EMPECHEMENT">Empêchement personnel</option>
                <option value="CHANGEMENT_DATE">Je souhaite une autre date</option>
                <option value="VEHICULE_VENDU">Véhicule vendu</option>
                <option value="ERREUR_RESERVATION">Erreur de réservation</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
              >
                Retour
              </button>
              <button
                onClick={handleCancel}
                disabled={!cancelReason || cancelling}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelling ? 'Annulation...' : 'Confirmer l\'annulation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
