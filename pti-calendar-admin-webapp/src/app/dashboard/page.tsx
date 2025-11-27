'use client';

import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Badge,
  Spinner,
  CalendarIcon,
  BuildingOfficeIcon,
  UsersIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
} from '@pti-calendar/design-system';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

interface GlobalStats {
  kpi: {
    total_rdv_jour: number;
    total_rdv_mois: number;
    ca_mois: number;
    taux_occupation_global: number;
    nb_centres_actifs: number;
    nb_controleurs_actifs: number;
    evolution_rdv: number;
    evolution_ca: number;
  };
  alertes: Array<{
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    centre?: string;
  }>;
  top_centres: Array<{
    id: string;
    nom: string;
    rdv_mois: number;
    ca_mois: number;
    taux_occupation: number;
  }>;
  rdv_par_jour: Array<{
    date: string;
    total: number;
  }>;
  ca_par_reseau: Array<{
    reseau: string;
    ca: number;
  }>;
}

export default function AdminDashboardPage() {
  const { user, isSuperAdmin } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await apiClient.get<GlobalStats>('/admin/stats');
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

  const rdvChartData = {
    labels: stats?.rdv_par_jour.map((d) => format(new Date(d.date), 'dd/MM')) || [],
    datasets: [{
      label: 'RDV',
      data: stats?.rdv_par_jour.map((d) => d.total) || [],
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4,
    }],
  };

  const caChartData = {
    labels: stats?.ca_par_reseau.map((r) => r.reseau) || [],
    datasets: [{
      label: 'CA (€)',
      data: stats?.ca_par_reseau.map((r) => r.ca) || [],
      backgroundColor: 'rgba(34, 197, 94, 0.8)',
    }],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-500 mt-1">
            Vue d'ensemble {isSuperAdmin ? 'globale' : `- ${user?.reseau_nom}`}
          </p>
        </div>
        <p className="text-sm text-gray-500">
          {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
        </p>
      </div>

      {/* Alerts */}
      {stats?.alertes && stats.alertes.length > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-medium text-yellow-800">Alertes ({stats.alertes.length})</h3>
                <ul className="mt-2 space-y-1 text-sm text-yellow-700">
                  {stats.alertes.slice(0, 3).map((alerte) => (
                    <li key={alerte.id}>• {alerte.message} {alerte.centre && `(${alerte.centre})`}</li>
                  ))}
                </ul>
              </div>
              <Link href="/dashboard/alertes">
                <Button variant="outline" size="sm">Voir tout</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="RDV aujourd'hui"
          value={stats?.kpi.total_rdv_jour || 0}
          subtitle="Tous les centres"
          icon={<CalendarIcon className="h-6 w-6" />}
          color="blue"
        />
        <KpiCard
          title="RDV ce mois"
          value={stats?.kpi.total_rdv_mois || 0}
          evolution={stats?.kpi.evolution_rdv}
          icon={<ChartBarIcon className="h-6 w-6" />}
          color="purple"
        />
        <KpiCard
          title="CA du mois"
          value={`${((stats?.kpi.ca_mois || 0) / 1000).toFixed(0)}k €`}
          evolution={stats?.kpi.evolution_ca}
          icon={<CurrencyIcon className="h-6 w-6" />}
          color="green"
        />
        <KpiCard
          title="Taux occupation"
          value={`${stats?.kpi.taux_occupation_global || 0}%`}
          subtitle="Moyenne globale"
          icon={<UsersIcon className="h-6 w-6" />}
          color="orange"
        />
      </div>

      {/* Sub KPIs */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Centres actifs</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.kpi.nb_centres_actifs || 0}</p>
            </div>
            <BuildingOfficeIcon className="h-10 w-10 text-gray-300" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Contrôleurs actifs</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.kpi.nb_controleurs_actifs || 0}</p>
            </div>
            <UsersIcon className="h-10 w-10 text-gray-300" />
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Évolution des RDV (30 jours)</h2>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="h-64">
              <Line data={rdvChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">CA par réseau</h2>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="h-64">
              <Bar data={caChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Centres */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Top centres du mois</h2>
          <Link href="/dashboard/centres">
            <Button variant="ghost" size="sm">Voir tous</Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Centre</th>
                <th>RDV</th>
                <th>CA</th>
                <th>Occupation</th>
              </tr>
            </thead>
            <tbody>
              {stats?.top_centres.map((centre, index) => (
                <tr key={centre.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </span>
                      <Link href={`/dashboard/centres/${centre.id}`} className="font-medium text-primary-600 hover:underline">
                        {centre.nom}
                      </Link>
                    </div>
                  </td>
                  <td>{centre.rdv_mois}</td>
                  <td>{centre.ca_mois.toLocaleString('fr-FR')} €</td>
                  <td>
                    <Badge variant={centre.taux_occupation >= 80 ? 'confirme' : centre.taux_occupation >= 50 ? 'rappele' : 'annule'}>
                      {centre.taux_occupation}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  evolution?: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function KpiCard({ title, value, subtitle, evolution, icon, color }: KpiCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
            {evolution !== undefined && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${evolution >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {evolution >= 0 ? <ArrowTrendingUpIcon className="h-4 w-4" /> : <ArrowTrendingDownIcon className="h-4 w-4" />}
                {Math.abs(evolution)}% vs mois précédent
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function CurrencyIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 7.756a4.5 4.5 0 100 8.488M7.5 10.5h5.25m-5.25 3h5.25M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ChartBarIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}
