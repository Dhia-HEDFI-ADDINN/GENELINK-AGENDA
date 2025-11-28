'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { apiClient } from '@/lib/api-client';
import {
  Card,
  CardContent,
  CardHeader,
  Select,
  Spinner,
  CalendarIcon,
  ChartBarIcon,
  UsersIcon,
  CurrencyEuroIcon,
  TruckIcon,
} from '@pti-calendar/design-system';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface StatsData {
  resume: {
    total_rdv: number;
    total_ca: number;
    taux_occupation: number;
    taux_noshow: number;
  };
  evolution_rdv: Array<{
    date: string;
    total: number;
    termines: number;
    annules: number;
  }>;
  repartition_statuts: Record<string, number>;
  repartition_types: Record<string, number>;
  top_controleurs: Array<{
    nom: string;
    prenom: string;
    total_rdv: number;
    taux_completion: number;
  }>;
  ca_par_jour: Array<{
    date: string;
    montant: number;
  }>;
}

const PERIOD_OPTIONS = [
  { value: '7', label: '7 derniers jours' },
  { value: '30', label: '30 derniers jours' },
  { value: 'month', label: 'Ce mois' },
  { value: '90', label: '3 derniers mois' },
];

export default function StatsPage() {
  const [period, setPeriod] = useState('30');

  const { dateDebut, dateFin } = getDateRange(period);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats', dateDebut, dateFin],
    queryFn: async () => {
      const response = await apiClient.get<StatsData>('/stats', {
        params: {
          date_debut: dateDebut,
          date_fin: dateFin,
        },
      });
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  const evolutionChartData = {
    labels: stats?.evolution_rdv.map((d) => format(new Date(d.date), 'dd/MM')) || [],
    datasets: [
      {
        label: 'Total RDV',
        data: stats?.evolution_rdv.map((d) => d.total) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Terminés',
        data: stats?.evolution_rdv.map((d) => d.termines) || [],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'transparent',
        tension: 0.4,
      },
    ],
  };

  const statutsChartData = {
    labels: Object.keys(stats?.repartition_statuts || {}),
    datasets: [
      {
        data: Object.values(stats?.repartition_statuts || {}),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(107, 114, 128, 0.8)',
        ],
      },
    ],
  };

  const caChartData = {
    labels: stats?.ca_par_jour.map((d) => format(new Date(d.date), 'dd/MM')) || [],
    datasets: [
      {
        label: 'Chiffre d\'affaires (€)',
        data: stats?.ca_par_jour.map((d) => d.montant) || [],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Statistiques</h1>
          <p className="text-gray-500 mt-1">
            Analysez les performances de votre centre
          </p>
        </div>
        <Select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          options={PERIOD_OPTIONS}
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total RDV"
          value={stats?.resume.total_rdv || 0}
          icon={<CalendarIcon className="h-6 w-6" />}
          color="blue"
        />
        <KpiCard
          title="Chiffre d'affaires"
          value={`${(stats?.resume.total_ca || 0).toLocaleString('fr-FR')} €`}
          icon={<CurrencyEuroIcon className="h-6 w-6" />}
          color="green"
        />
        <KpiCard
          title="Taux occupation"
          value={`${stats?.resume.taux_occupation || 0}%`}
          icon={<ChartBarIcon className="h-6 w-6" />}
          color="purple"
        />
        <KpiCard
          title="Taux No-show"
          value={`${stats?.resume.taux_noshow || 0}%`}
          icon={<UsersIcon className="h-6 w-6" />}
          color={stats?.resume.taux_noshow && stats.resume.taux_noshow > 5 ? 'red' : 'gray'}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              Évolution des rendez-vous
            </h2>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="h-64">
              <Line
                data={evolutionChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              Répartition par statut
            </h2>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="h-64 flex items-center justify-center">
              <Doughnut
                data={statutsChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              Chiffre d'affaires journalier
            </h2>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="h-64">
              <Bar
                data={caChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              Performance des contrôleurs
            </h2>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="space-y-4">
              {stats?.top_controleurs.map((controleur, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-sm font-semibold text-primary-600">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {controleur.prenom} {controleur.nom}
                      </p>
                      <p className="text-sm text-gray-500">
                        {controleur.total_rdv} RDV
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {controleur.taux_completion}%
                    </p>
                    <p className="text-xs text-gray-500">Taux complétion</p>
                  </div>
                </div>
              ))}
              {(!stats?.top_controleurs || stats.top_controleurs.length === 0) && (
                <p className="text-center text-gray-500 py-8">
                  Aucune donnée disponible
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Types de contrôle */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">
            Répartition par type de contrôle
          </h2>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.entries(stats?.repartition_types || {}).map(([type, count]) => (
              <div
                key={type}
                className="p-4 bg-gray-50 rounded-lg text-center"
              >
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-sm text-gray-500">{type}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'red' | 'gray';
}

function KpiCard({ title, value, icon, color }: KpiCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
    gray: 'bg-gray-100 text-gray-600',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function getDateRange(period: string): { dateDebut: string; dateFin: string } {
  const today = new Date();
  let dateDebut: Date;
  let dateFin = today;

  switch (period) {
    case '7':
      dateDebut = subDays(today, 7);
      break;
    case '30':
      dateDebut = subDays(today, 30);
      break;
    case 'month':
      dateDebut = startOfMonth(today);
      dateFin = endOfMonth(today);
      break;
    case '90':
      dateDebut = subDays(today, 90);
      break;
    default:
      dateDebut = subDays(today, 30);
  }

  return {
    dateDebut: format(dateDebut, 'yyyy-MM-dd'),
    dateFin: format(dateFin, 'yyyy-MM-dd'),
  };
}
