'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Notification {
  id: string;
  type: 'RDV_CONFIRMATION' | 'RDV_RAPPEL' | 'RDV_MODIFICATION' | 'RDV_ANNULATION' | 'PROMO' | 'INFO';
  titre: string;
  message: string;
  lu: boolean;
  created_at: string;
  data?: {
    rdv_id?: string;
    centre_nom?: string;
    date?: string;
    heure?: string;
  };
}

const notificationIcons: Record<string, string> = {
  RDV_CONFIRMATION: '✅',
  RDV_RAPPEL: '🔔',
  RDV_MODIFICATION: '📝',
  RDV_ANNULATION: '❌',
  PROMO: '🎁',
  INFO: 'ℹ️',
};

const notificationColors: Record<string, { bg: string; border: string }> = {
  RDV_CONFIRMATION: { bg: 'bg-green-50', border: 'border-green-200' },
  RDV_RAPPEL: { bg: 'bg-blue-50', border: 'border-blue-200' },
  RDV_MODIFICATION: { bg: 'bg-yellow-50', border: 'border-yellow-200' },
  RDV_ANNULATION: { bg: 'bg-red-50', border: 'border-red-200' },
  PROMO: { bg: 'bg-purple-50', border: 'border-purple-200' },
  INFO: { bg: 'bg-gray-50', border: 'border-gray-200' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    loadNotifications();
    checkPushPermission();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    // Simulate API call - in production, this would fetch from backend
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mock data
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'RDV_RAPPEL',
        titre: 'Rappel de rendez-vous',
        message: 'Votre contrôle technique est prévu demain à 10h00 au centre SGS Auto Contrôle Paris 15.',
        lu: false,
        created_at: new Date().toISOString(),
        data: {
          rdv_id: 'rdv-123',
          centre_nom: 'SGS Auto Contrôle Paris 15',
          date: '2024-01-15',
          heure: '10:00',
        },
      },
      {
        id: '2',
        type: 'RDV_CONFIRMATION',
        titre: 'Rendez-vous confirmé',
        message: 'Votre rendez-vous du 15/01/2024 à 10h00 a bien été confirmé.',
        lu: true,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        data: {
          rdv_id: 'rdv-123',
        },
      },
      {
        id: '3',
        type: 'PROMO',
        titre: 'Offre spéciale',
        message: 'Profitez de -15% sur votre prochain contrôle technique avec le code HIVER2024.',
        lu: true,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '4',
        type: 'INFO',
        titre: 'Nouveaux services disponibles',
        message: 'Découvrez nos nouveaux services de pré-contrôle disponibles dans votre centre.',
        lu: true,
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    setNotifications(mockNotifications);
    setLoading(false);
  };

  const checkPushPermission = async () => {
    if ('Notification' in window) {
      setPushEnabled(Notification.permission === 'granted');
    }
  };

  const requestPushPermission = async () => {
    if (!('Notification' in window)) {
      alert('Votre navigateur ne supporte pas les notifications push.');
      return;
    }

    setPushLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setPushEnabled(permission === 'granted');

      if (permission === 'granted') {
        // In production, register service worker and subscribe to push
        new Notification('Notifications activées', {
          body: 'Vous recevrez désormais des notifications pour vos rendez-vous.',
          icon: '/icons/icon-192x192.png',
        });
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
    } finally {
      setPushLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lu: true } : n))
    );
    // In production, call API to mark as read
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
    // In production, call API to mark all as read
  };

  const deleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    // In production, call API to delete
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter((n) => !n.lu)
    : notifications;

  const unreadCount = notifications.filter((n) => !n.lu).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="text-blue-600 hover:text-blue-700 mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-xl font-bold">Notifications</h1>
              {unreadCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Push Notification Banner */}
      {isMounted && !pushEnabled && typeof window !== 'undefined' && 'Notification' in window && (
        <div className="bg-blue-600 text-white px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span>Activez les notifications pour ne rien manquer</span>
            </div>
            <button
              onClick={requestPushPermission}
              disabled={pushLoading}
              className="bg-white text-blue-600 px-4 py-1 rounded-lg text-sm font-medium hover:bg-blue-50 disabled:opacity-50"
            >
              {pushLoading ? 'Activation...' : 'Activer'}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Toutes ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Non lues ({unreadCount})
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
            </h3>
            <p className="text-gray-500">
              {filter === 'unread'
                ? 'Vous avez lu toutes vos notifications.'
                : 'Vous n\'avez pas encore reçu de notification.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => {
              const colors = notificationColors[notification.type] || notificationColors.INFO;
              const icon = notificationIcons[notification.type] || 'ℹ️';

              return (
                <div
                  key={notification.id}
                  className={`${colors.bg} border ${colors.border} rounded-lg p-4 ${
                    !notification.lu ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                  }`}
                  onClick={() => !notification.lu && markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {notification.titre}
                            {!notification.lu && (
                              <span className="ml-2 inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                            )}
                          </h3>
                          <p className="text-gray-600 text-sm mt-1">{notification.message}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="text-gray-400 hover:text-gray-600 p-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {/* Action button for RDV notifications */}
                      {notification.data?.rdv_id && (
                        <Link
                          href={`/rdv/${notification.data.rdv_id}`}
                          className="inline-block mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Voir le rendez-vous →
                        </Link>
                      )}

                      {/* Timestamp */}
                      <div className="mt-2 text-xs text-gray-500">
                        {formatDistanceToNow(parseISO(notification.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Notification Preferences */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Préférences de notification</h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <span className="font-medium">Rappels de RDV</span>
                <p className="text-sm text-gray-500">Rappel 24h et 1h avant votre rendez-vous</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
            </label>
            <label className="flex items-center justify-between">
              <div>
                <span className="font-medium">Confirmations</span>
                <p className="text-sm text-gray-500">Confirmations de réservation et modifications</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
            </label>
            <label className="flex items-center justify-between">
              <div>
                <span className="font-medium">Offres et promotions</span>
                <p className="text-sm text-gray-500">Réductions et offres spéciales</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
            </label>
            <label className="flex items-center justify-between">
              <div>
                <span className="font-medium">Notifications par email</span>
                <p className="text-sm text-gray-500">Recevoir également par email</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
            </label>
            <label className="flex items-center justify-between">
              <div>
                <span className="font-medium">Notifications par SMS</span>
                <p className="text-sm text-gray-500">Recevoir également par SMS</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
