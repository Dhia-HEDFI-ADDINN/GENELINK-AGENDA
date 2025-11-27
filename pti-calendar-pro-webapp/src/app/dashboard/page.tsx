'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Badge,
  Spinner,
  getRdvStatusVariant,
  getRdvStatusLabel,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  TruckIcon,
  ArrowRightIcon,
} from '@pti-calendar/design-system';

interface DashboardStats {
  rdv_aujourd_hui: number;
  rdv_en_attente: number;
  rdv_termines: number;
  rdv_annules: number;
  taux_occupation: number;
  no_shows: number;
  prochains_rdv: Rdv[];
}

interface Rdv {
  id: string;
  reference: string;
  statut: string;
  heure_debut: string;
  heure_fin: string;
  client: {
    nom: string;
    prenom: string;
    telephone: string;
  };
  vehicule: {
    immatriculation: string;
    type_vehicule: string;
  };
  controleur?: {
    nom: string;
    prenom: string;
    initiales: string;
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', today],
    queryFn: async () => {
      const response = await apiClient.get<DashboardStats>('/dashboard/stats', {
        params: { date: today },
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Bonjour, {user?.prenom} !</h1>
          <p className="text-gray-500 mt-1">
            {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
          </p>
        </div>
        <Link href="/dashboard/rdv/nouveau">
          <Button>
            <CalendarIcon className="h-5 w-5 mr-2" />
            Nouveau RDV
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="RDV aujourd'hui"
          value={stats?.rdv_aujourd_hui || 0}
          icon={<CalendarIcon className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title="En attente"
          value={stats?.rdv_en_attente || 0}
          icon={<ClockIcon className="h-6 w-6" />}
          color="yellow"
        />
        <StatCard
          title="Terminés"
          value={stats?.rdv_termines || 0}
          icon={<CheckCircleIcon className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title="Taux occupation"
          value={`${stats?.taux_occupation || 0}%`}
          icon={<UserIcon className="h-6 w-6" />}
          color="purple"
        />
      </div>

      {/* Alerts */}
      {stats && stats.no_shows > 0 && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 flex items-center gap-4">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            <div className="flex-1">
              <p className="font-medium text-red-800">
                {stats.no_shows} No-show{stats.no_shows > 1 ? 's' : ''} aujourd'hui
              </p>
              <p className="text-sm text-red-600">
                Des clients ne se sont pas présentés à leur rendez-vous
              </p>
            </div>
            <Link href="/dashboard/rdv?statut=NO_SHOW">
              <Button variant="outline" size="sm">
                Voir
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Next appointments */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Prochains rendez-vous
          </h2>
          <Link href="/dashboard/rdv">
            <Button variant="ghost" size="sm">
              Voir tout
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {stats?.prochains_rdv && stats.prochains_rdv.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {stats.prochains_rdv.map((rdv) => (
                <RdvRow key={rdv.id} rdv={rdv} />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Aucun rendez-vous à venir</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickActionCard
          title="Planning"
          description="Voir le planning complet"
          href="/dashboard/planning"
          icon={<CalendarIcon className="h-8 w-8" />}
        />
        <QuickActionCard
          title="Check-in"
          description="Enregistrer une arrivée"
          href="/dashboard/rdv?action=checkin"
          icon={<CheckCircleIcon className="h-8 w-8" />}
        />
        <QuickActionCard
          title="Statistiques"
          description="Analyser les performances"
          href="/dashboard/stats"
          icon={<ChartBarIcon className="h-8 w-8" />}
        />
        <QuickActionCard
          title="Contrôleurs"
          description="Gérer l'équipe"
          href="/dashboard/controleurs"
          icon={<UserIcon className="h-8 w-8" />}
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="stat-label">{title}</p>
            <p className="stat-value">{value}</p>
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function RdvRow({ rdv }: { rdv: Rdv }) {
  return (
    <Link href={`/dashboard/rdv/${rdv.id}`} className="block hover:bg-gray-50">
      <div className="px-6 py-4 flex items-center gap-4">
        {/* Time */}
        <div className="text-center min-w-[60px]">
          <p className="text-lg font-semibold text-gray-900">{rdv.heure_debut}</p>
          <p className="text-xs text-gray-500">{rdv.heure_fin}</p>
        </div>

        {/* Divider */}
        <div className="w-px h-12 bg-gray-200" />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900 truncate">
              {rdv.client.prenom} {rdv.client.nom}
            </p>
            <Badge variant={getRdvStatusVariant(rdv.statut)} size="sm">
              {getRdvStatusLabel(rdv.statut)}
            </Badge>
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <TruckIcon className="h-4 w-4" />
              {rdv.vehicule.immatriculation}
            </span>
            {rdv.controleur && (
              <span className="flex items-center gap-1">
                <UserIcon className="h-4 w-4" />
                {rdv.controleur.initiales}
              </span>
            )}
          </div>
        </div>

        {/* Arrow */}
        <ArrowRightIcon className="h-5 w-5 text-gray-400" />
      </div>
    </Link>
  );
}

function QuickActionCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-6 text-center">
          <div className="text-primary-600 mb-3 flex justify-center">{icon}</div>
          <h3 className="font-medium text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

// Import missing icon
function ChartBarIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
      />
    </svg>
  );
}
