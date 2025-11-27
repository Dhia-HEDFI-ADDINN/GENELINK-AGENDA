'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { useAuth } from '../providers';
import { api } from '@/lib/api';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Badge,
  Spinner,
  PhoneIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
} from '@pti-calendar/design-system';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

interface CallCenterStats {
  today: {
    appels_total: number;
    rdv_crees: number;
    rdv_modifies: number;
    rdv_annules: number;
    temps_moyen_appel: number;
    taux_conversion: number;
  };
  rappels_en_attente: number;
  rdv_a_confirmer: number;
  rdv_proches: Array<{
    id: string;
    client_nom: string;
    client_telephone: string;
    centre_nom: string;
    date: string;
    heure: string;
    statut: string;
  }>;
  historique_appels: Array<{
    date: string;
    appels: number;
    rdv_crees: number;
  }>;
  performance: {
    rang: number;
    total_agents: number;
    rdv_semaine: number;
    objectif_semaine: number;
  };
}

export default function CallCenterDashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [isLoading, isAuthenticated]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['callcenter-stats'],
    queryFn: async () => {
      const response = await api.get<CallCenterStats>('/callcenter/stats');
      return response.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const chartData = {
    labels: stats?.historique_appels.map((h) => format(new Date(h.date), 'dd/MM')) || [],
    datasets: [
      {
        label: 'Appels',
        data: stats?.historique_appels.map((h) => h.appels) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'RDV créés',
        data: stats?.historique_appels.map((h) => h.rdv_crees) || [],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const conversionData = {
    labels: ['Convertis', 'Non convertis'],
    datasets: [{
      data: [
        stats?.today.rdv_crees || 0,
        (stats?.today.appels_total || 0) - (stats?.today.rdv_crees || 0),
      ],
      backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(229, 231, 235, 0.8)'],
    }],
  };

  const progressPercent = stats?.performance
    ? Math.min((stats.performance.rdv_semaine / stats.performance.objectif_semaine) * 100, 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-500 mt-1">
            Bonjour {user?.prenom} ! Voici votre activité du jour.
          </p>
        </div>
        <p className="text-sm text-gray-500">
          {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
        </p>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {stats && stats.rappels_en_attente > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ClockIcon className="h-6 w-6 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-800">
                    {stats.rappels_en_attente} rappel(s) en attente
                  </p>
                  <p className="text-sm text-orange-600">À traiter aujourd'hui</p>
                </div>
              </div>
              <Link href="/dashboard/rappels">
                <Button size="sm">Voir</Button>
              </Link>
            </CardContent>
          </Card>
        )}
        {stats && stats.rdv_a_confirmer > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800">
                    {stats.rdv_a_confirmer} RDV à confirmer
                  </p>
                  <p className="text-sm text-blue-600">Pour demain</p>
                </div>
              </div>
              <Link href="/dashboard/confirmations">
                <Button size="sm" variant="outline">Appeler</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary-600">{stats?.today.appels_total || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Appels aujourd'hui</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{stats?.today.rdv_crees || 0}</p>
            <p className="text-sm text-gray-500 mt-1">RDV créés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-yellow-600">{stats?.today.rdv_modifies || 0}</p>
            <p className="text-sm text-gray-500 mt-1">RDV modifiés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-red-600">{stats?.today.rdv_annules || 0}</p>
            <p className="text-sm text-gray-500 mt-1">RDV annulés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-purple-600">{stats?.today.temps_moyen_appel || 0}s</p>
            <p className="text-sm text-gray-500 mt-1">Temps moyen</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary-600">{stats?.today.taux_conversion || 0}%</p>
            <p className="text-sm text-gray-500 mt-1">Taux conversion</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Objectif semaine</h2>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-center mb-4">
              <p className="text-4xl font-bold text-primary-600">
                {stats?.performance.rdv_semaine || 0}
              </p>
              <p className="text-sm text-gray-500">
                sur {stats?.performance.objectif_semaine || 0} RDV
              </p>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${progressPercent >= 100 ? 'bg-green-500' : 'bg-primary-500'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-center text-sm text-gray-500 mt-2">
              {progressPercent.toFixed(0)}% atteint
            </p>
            {stats?.performance && (
              <p className="text-center text-xs text-gray-400 mt-2">
                Rang {stats.performance.rang}/{stats.performance.total_agents}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Conversion */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Taux de conversion</h2>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-48 flex items-center justify-center">
              <Doughnut
                data={conversionData}
                options={{
                  cutout: '70%',
                  plugins: { legend: { display: false } },
                }}
              />
            </div>
            <p className="text-center text-2xl font-bold text-primary-600 mt-2">
              {stats?.today.taux_conversion || 0}%
            </p>
          </CardContent>
        </Card>

        {/* Chart */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <h2 className="font-semibold">Activité (7 jours)</h2>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-48">
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' } },
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prochains RDV */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="font-semibold">Prochains RDV à rappeler</h2>
          <Link href="/dashboard/confirmations">
            <Button variant="ghost" size="sm">Voir tout</Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {stats?.rdv_proches && stats.rdv_proches.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Centre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Heure</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stats.rdv_proches.map((rdv) => (
                  <tr key={rdv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{rdv.client_nom}</p>
                      <p className="text-sm text-gray-500">{rdv.client_telephone}</p>
                    </td>
                    <td className="px-4 py-3 text-sm">{rdv.centre_nom}</td>
                    <td className="px-4 py-3 text-sm">
                      {format(new Date(rdv.date), 'dd/MM/yyyy')} à {rdv.heure}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={rdv.statut === 'CONFIRME' ? 'confirme' : 'en_attente'}>
                        {rdv.statut}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="outline">
                        <PhoneIcon className="h-4 w-4 mr-1" />
                        Appeler
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-500">
              Aucun RDV à rappeler pour le moment
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/dashboard/nouveau-rdv">
          <Card className="hover:border-primary-300 cursor-pointer transition-colors">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 bg-primary-100 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="font-medium">Nouveau RDV</p>
                <p className="text-sm text-gray-500">Prise de RDV rapide</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/clients">
          <Card className="hover:border-primary-300 cursor-pointer transition-colors">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <UserIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Recherche client</p>
                <p className="text-sm text-gray-500">Historique complet</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/rappels">
          <Card className="hover:border-primary-300 cursor-pointer transition-colors">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="font-medium">Rappels</p>
                <p className="text-sm text-gray-500">Liste des rappels</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/scripts">
          <Card className="hover:border-primary-300 cursor-pointer transition-colors">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <DocumentIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Scripts</p>
                <p className="text-sm text-gray-500">Guides d'appel</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}
