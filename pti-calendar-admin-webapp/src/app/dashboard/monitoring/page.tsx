'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Spinner,
  Alert,
  ServerIcon,
  CircleStackIcon,
  CpuChipIcon,
  SignalIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ClockIcon,
} from '@pti-calendar/design-system';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  last_check: string;
  checks: {
    name: string;
    status: 'pass' | 'warn' | 'fail';
    message?: string;
    duration_ms: number;
  }[];
  metrics: {
    requests_per_minute: number;
    error_rate: number;
    avg_response_time_ms: number;
    memory_mb: number;
    cpu_percent: number;
  };
}

interface SystemMetrics {
  timestamp: string;
  total_requests: number;
  error_count: number;
  avg_response_time: number;
  active_users: number;
  active_connections: number;
  cache_hit_rate: number;
  db_connections: {
    active: number;
    idle: number;
    max: number;
  };
  memory: {
    used_mb: number;
    total_mb: number;
    percent: number;
  };
  cpu: {
    percent: number;
    cores: number;
  };
}

interface AlertItem {
  id: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  service: string;
  title: string;
  message: string;
  resolved: boolean;
  resolved_at?: string;
}

export default function MonitoringPage() {
  const { isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);

  if (!isSuperAdmin) {
    return (
      <Alert variant="error">
        Accès réservé aux administrateurs SGS.
      </Alert>
    );
  }

  // Fetch services health
  const { data: services, isLoading: servicesLoading, refetch: refetchServices } = useQuery({
    queryKey: ['services-health'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: ServiceHealth[] }>('/admin/monitoring/services');
      return response.data.data;
    },
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Fetch system metrics
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ['system-metrics'],
    queryFn: async () => {
      const response = await apiClient.get<SystemMetrics>('/admin/monitoring/metrics');
      return response.data;
    },
    refetchInterval: autoRefresh ? 15000 : false,
  });

  // Fetch metrics history
  const { data: metricsHistory } = useQuery({
    queryKey: ['metrics-history'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: SystemMetrics[] }>('/admin/monitoring/metrics/history', {
        params: { period: '1h', interval: '1m' },
      });
      return response.data.data;
    },
    refetchInterval: autoRefresh ? 60000 : false,
  });

  // Fetch active alerts
  const { data: alerts, refetch: refetchAlerts } = useQuery({
    queryKey: ['active-alerts'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: AlertItem[] }>('/admin/monitoring/alerts', {
        params: { status: 'active' },
      });
      return response.data.data;
    },
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const refetchAll = () => {
    refetchServices();
    refetchMetrics();
    refetchAlerts();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'pass':
        return 'text-green-500';
      case 'degraded':
      case 'warn':
        return 'text-yellow-500';
      case 'unhealthy':
      case 'fail':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'pass':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'degraded':
      case 'warn':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'unhealthy':
      case 'fail':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <CircleStackIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  // Chart data for response time
  const responseTimeData = {
    labels: metricsHistory?.slice(-30).map((m) => format(new Date(m.timestamp), 'HH:mm')) || [],
    datasets: [{
      label: 'Temps de réponse (ms)',
      data: metricsHistory?.slice(-30).map((m) => m.avg_response_time) || [],
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4,
    }],
  };

  // Chart data for error rate
  const errorRateData = {
    labels: metricsHistory?.slice(-30).map((m) => format(new Date(m.timestamp), 'HH:mm')) || [],
    datasets: [{
      label: 'Taux d\'erreur (%)',
      data: metricsHistory?.slice(-30).map((m) => (m.error_count / Math.max(m.total_requests, 1)) * 100) || [],
      borderColor: 'rgb(239, 68, 68)',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      fill: true,
      tension: 0.4,
    }],
  };

  // Overall status
  const overallStatus = services?.every((s) => s.status === 'healthy')
    ? 'healthy'
    : services?.some((s) => s.status === 'unhealthy')
      ? 'unhealthy'
      : 'degraded';

  const healthyCount = services?.filter((s) => s.status === 'healthy').length || 0;
  const degradedCount = services?.filter((s) => s.status === 'degraded').length || 0;
  const unhealthyCount = services?.filter((s) => s.status === 'unhealthy').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monitoring Système</h1>
          <p className="text-gray-500 mt-1">
            Surveillance en temps réel de l'infrastructure
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>
          <Button variant="outline" onClick={refetchAll}>
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Rafraîchir
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card className={
        overallStatus === 'healthy' ? 'border-green-200 bg-green-50' :
        overallStatus === 'degraded' ? 'border-yellow-200 bg-yellow-50' :
        'border-red-200 bg-red-50'
      }>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getStatusIcon(overallStatus)}
              <div>
                <h2 className="text-lg font-semibold">
                  Statut global: {overallStatus === 'healthy' ? 'Opérationnel' : overallStatus === 'degraded' ? 'Dégradé' : 'En panne'}
                </h2>
                <p className="text-sm text-gray-600">
                  {healthyCount} services OK • {degradedCount} dégradés • {unhealthyCount} en panne
                </p>
              </div>
            </div>
            <div className="text-right text-sm text-gray-500">
              <ClockIcon className="h-4 w-4 inline mr-1" />
              Dernière mise à jour: {metrics ? format(new Date(metrics.timestamp), 'HH:mm:ss') : '-'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      {alerts && alerts.length > 0 && (
        <Card className="border-red-200">
          <CardHeader className="flex items-center justify-between">
            <h3 className="font-semibold text-red-800">Alertes actives ({alerts.length})</h3>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="p-4 flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {alert.severity === 'critical' ? (
                      <XCircleIcon className="h-5 w-5 text-red-500 mt-0.5" />
                    ) : alert.severity === 'error' ? (
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5" />
                    ) : (
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium">{alert.title}</p>
                      <p className="text-sm text-gray-600">{alert.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {alert.service} • {format(new Date(alert.timestamp), 'dd/MM HH:mm')}
                      </p>
                    </div>
                  </div>
                  <Badge variant={alert.severity === 'critical' ? 'annule' : 'rappele'}>
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{metrics.total_requests.toLocaleString('fr-FR')}</p>
              <p className="text-xs text-gray-500">Requêtes/min</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary-600">{metrics.avg_response_time.toFixed(0)}ms</p>
              <p className="text-xs text-gray-500">Temps réponse</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${metrics.error_count > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {((metrics.error_count / Math.max(metrics.total_requests, 1)) * 100).toFixed(2)}%
              </p>
              <p className="text-xs text-gray-500">Taux erreur</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{metrics.active_users}</p>
              <p className="text-xs text-gray-500">Utilisateurs actifs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{metrics.cache_hit_rate.toFixed(0)}%</p>
              <p className="text-xs text-gray-500">Cache hit rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">
                {metrics.db_connections.active}/{metrics.db_connections.max}
              </p>
              <p className="text-xs text-gray-500">Connexions DB</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="services">Services ({services?.length || 0})</TabsTrigger>
          <TabsTrigger value="metrics">Métriques</TabsTrigger>
          <TabsTrigger value="resources">Ressources</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Temps de réponse (60 min)</h3>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="h-64">
                  <Line data={responseTimeData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Taux d'erreur (60 min)</h3>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="h-64">
                  <Line data={errorRateData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Services Grid */}
          {servicesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : services && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {services.map((service) => (
                <Card key={service.name} className={
                  service.status === 'healthy' ? '' :
                  service.status === 'degraded' ? 'border-yellow-200' :
                  'border-red-200'
                }>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(service.status)}
                        <span className="font-medium">{service.name}</span>
                      </div>
                      <Badge size="sm" variant={
                        service.status === 'healthy' ? 'confirme' :
                        service.status === 'degraded' ? 'rappele' : 'annule'
                      }>
                        {service.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Version: {service.version}</p>
                      <p>Uptime: {formatUptime(service.uptime)}</p>
                      <p>Réponse: {service.metrics.avg_response_time_ms.toFixed(0)}ms</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="mt-6 space-y-4">
          {services?.map((service) => (
            <Card key={service.name}>
              <CardHeader className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <h3 className="font-semibold">{service.name}</h3>
                    <p className="text-xs text-gray-500">v{service.version} • Uptime: {formatUptime(service.uptime)}</p>
                  </div>
                </div>
                <Badge variant={
                  service.status === 'healthy' ? 'confirme' :
                  service.status === 'degraded' ? 'rappele' : 'annule'
                }>
                  {service.status}
                </Badge>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-5 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <p className="text-lg font-bold">{service.metrics.requests_per_minute}</p>
                    <p className="text-xs text-gray-500">Req/min</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <p className="text-lg font-bold">{service.metrics.avg_response_time_ms.toFixed(0)}ms</p>
                    <p className="text-xs text-gray-500">Latence</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <p className={`text-lg font-bold ${service.metrics.error_rate > 1 ? 'text-red-600' : 'text-green-600'}`}>
                      {service.metrics.error_rate.toFixed(2)}%
                    </p>
                    <p className="text-xs text-gray-500">Erreurs</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <p className="text-lg font-bold">{service.metrics.memory_mb.toFixed(0)}MB</p>
                    <p className="text-xs text-gray-500">Mémoire</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <p className="text-lg font-bold">{service.metrics.cpu_percent.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500">CPU</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Health Checks</p>
                  <div className="grid grid-cols-3 gap-2">
                    {service.checks.map((check) => (
                      <div key={check.name} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                        {getStatusIcon(check.status)}
                        <span className={getStatusColor(check.status)}>{check.name}</span>
                        <span className="text-xs text-gray-400 ml-auto">{check.duration_ms}ms</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Métriques détaillées</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Request metrics */}
                <div>
                  <h4 className="font-medium mb-3">Requêtes HTTP</h4>
                  <div className="space-y-2">
                    <MetricRow label="Total requêtes/min" value={metrics?.total_requests || 0} unit="req/min" />
                    <MetricRow label="Erreurs" value={metrics?.error_count || 0} unit="err/min" danger={(metrics?.error_count ?? 0) > 10} />
                    <MetricRow label="Temps moyen" value={metrics?.avg_response_time || 0} unit="ms" />
                    <MetricRow label="Utilisateurs actifs" value={metrics?.active_users || 0} />
                    <MetricRow label="Connexions actives" value={metrics?.active_connections || 0} />
                  </div>
                </div>

                {/* Cache metrics */}
                <div>
                  <h4 className="font-medium mb-3">Cache & Base de données</h4>
                  <div className="space-y-2">
                    <MetricRow label="Cache hit rate" value={metrics?.cache_hit_rate || 0} unit="%" good={(metrics?.cache_hit_rate ?? 0) > 80} />
                    <MetricRow label="Connexions DB actives" value={metrics?.db_connections.active || 0} />
                    <MetricRow label="Connexions DB idle" value={metrics?.db_connections.idle || 0} />
                    <MetricRow label="Connexions DB max" value={metrics?.db_connections.max || 0} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Memory */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold flex items-center gap-2">
                  <CircleStackIcon className="h-5 w-5" />
                  Mémoire
                </h3>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center mb-4">
                  <div className="relative w-32 h-32">
                    <Doughnut
                      data={{
                        labels: ['Utilisée', 'Libre'],
                        datasets: [{
                          data: [
                            metrics?.memory.percent || 0,
                            100 - (metrics?.memory.percent || 0),
                          ],
                          backgroundColor: [
                            (metrics?.memory.percent || 0) > 80 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(59, 130, 246, 0.8)',
                            'rgba(229, 231, 235, 0.8)',
                          ],
                        }],
                      }}
                      options={{
                        cutout: '70%',
                        plugins: { legend: { display: false } },
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">{metrics?.memory.percent.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
                <div className="text-center text-sm text-gray-600">
                  {metrics?.memory.used_mb.toFixed(0)} MB / {metrics?.memory.total_mb.toFixed(0)} MB
                </div>
              </CardContent>
            </Card>

            {/* CPU */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold flex items-center gap-2">
                  <CpuChipIcon className="h-5 w-5" />
                  CPU
                </h3>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center mb-4">
                  <div className="relative w-32 h-32">
                    <Doughnut
                      data={{
                        labels: ['Utilisé', 'Libre'],
                        datasets: [{
                          data: [
                            metrics?.cpu.percent || 0,
                            100 - (metrics?.cpu.percent || 0),
                          ],
                          backgroundColor: [
                            (metrics?.cpu.percent || 0) > 80 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(34, 197, 94, 0.8)',
                            'rgba(229, 231, 235, 0.8)',
                          ],
                        }],
                      }}
                      options={{
                        cutout: '70%',
                        plugins: { legend: { display: false } },
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">{metrics?.cpu.percent.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
                <div className="text-center text-sm text-gray-600">
                  {metrics?.cpu.cores} cores
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Per-service resource usage */}
          {services && (
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Utilisation par service</h3>
              </CardHeader>
              <CardContent className="p-0">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Mémoire</th>
                      <th>CPU</th>
                      <th>Requêtes/min</th>
                      <th>Latence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((service) => (
                      <tr key={service.name}>
                        <td className="font-medium">{service.name}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${service.metrics.memory_mb > 500 ? 'bg-red-500' : 'bg-blue-500'}`}
                                style={{ width: `${Math.min((service.metrics.memory_mb / 1024) * 100, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm">{service.metrics.memory_mb.toFixed(0)}MB</span>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${service.metrics.cpu_percent > 80 ? 'bg-red-500' : 'bg-green-500'}`}
                                style={{ width: `${service.metrics.cpu_percent}%` }}
                              />
                            </div>
                            <span className="text-sm">{service.metrics.cpu_percent.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td>{service.metrics.requests_per_minute}</td>
                        <td>{service.metrics.avg_response_time_ms.toFixed(0)}ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricRow({ label, value, unit, danger, good }: {
  label: string;
  value: number;
  unit?: string;
  danger?: boolean;
  good?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`font-medium ${danger ? 'text-red-600' : good ? 'text-green-600' : ''}`}>
        {value.toLocaleString('fr-FR')}{unit && ` ${unit}`}
      </span>
    </div>
  );
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}j ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
