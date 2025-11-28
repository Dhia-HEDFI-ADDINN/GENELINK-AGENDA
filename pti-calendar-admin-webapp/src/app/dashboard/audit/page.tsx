'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Input,
  Select,
  Badge,
  Modal,
  ModalFooter,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Spinner,
  Alert,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  ClockIcon,
  UserIcon,
  ComputerDesktopIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  EyeIcon,
} from '@pti-calendar/design-system';

interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  action_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'LOGIN' | 'LOGOUT' | 'ERROR' | 'SECURITY';
  entity_type: string;
  entity_id?: string;
  user_id?: string;
  user_email?: string;
  user_nom?: string;
  centre_id?: string;
  centre_nom?: string;
  reseau_id?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  severity: 'info' | 'warning' | 'error' | 'critical';
}

interface AuditStats {
  total_logs: number;
  logs_today: number;
  logs_this_week: number;
  by_action_type: Array<{ action_type: string; count: number }>;
  by_entity_type: Array<{ entity_type: string; count: number }>;
  by_severity: Array<{ severity: string; count: number }>;
  security_alerts: number;
}

export default function AuditPage() {
  const { isSuperAdmin, user } = useAuth();

  const [activeTab, setActiveTab] = useState('logs');
  const [search, setSearch] = useState('');
  const [filterActionType, setFilterActionType] = useState('');
  const [filterEntityType, setFilterEntityType] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [filterDateTo, setFilterDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Fetch logs
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['audit-logs', search, filterActionType, filterEntityType, filterSeverity, filterDateFrom, filterDateTo, page],
    queryFn: async () => {
      const response = await apiClient.get<{ data: AuditLog[]; meta: { total: number; page: number; total_pages: number } }>(
        '/audit/logs',
        {
          params: {
            search: search || undefined,
            action_type: filterActionType || undefined,
            entity_type: filterEntityType || undefined,
            severity: filterSeverity || undefined,
            date_from: filterDateFrom ? startOfDay(new Date(filterDateFrom)).toISOString() : undefined,
            date_to: filterDateTo ? endOfDay(new Date(filterDateTo)).toISOString() : undefined,
            page,
            limit: 50,
          },
        }
      );
      return response.data;
    },
  });

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['audit-stats', filterDateFrom, filterDateTo],
    queryFn: async () => {
      const response = await apiClient.get<AuditStats>('/audit/stats', {
        params: {
          date_from: filterDateFrom ? startOfDay(new Date(filterDateFrom)).toISOString() : undefined,
          date_to: filterDateTo ? endOfDay(new Date(filterDateTo)).toISOString() : undefined,
        },
      });
      return response.data;
    },
  });

  // Export
  const exportMutation = useMutation({
    mutationFn: async (exportFormat: 'csv' | 'json') => {
      const response = await apiClient.post('/audit/export', {
        format: exportFormat,
        filters: {
          search: search || undefined,
          action_type: filterActionType || undefined,
          entity_type: filterEntityType || undefined,
          severity: filterSeverity || undefined,
          date_from: filterDateFrom ? startOfDay(new Date(filterDateFrom)).toISOString() : undefined,
          date_to: filterDateTo ? endOfDay(new Date(filterDateTo)).toISOString() : undefined,
        },
      });
      // Download file
      const blob = new Blob([response.data as any], { type: exportFormat === 'csv' ? 'text/csv' : 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_export_${format(new Date(), 'yyyyMMdd_HHmmss')}.${exportFormat}`;
      a.click();
    },
  });

  const getActionTypeBadge = (type: string) => {
    const variants: Record<string, any> = {
      CREATE: 'confirme',
      UPDATE: 'rappele',
      DELETE: 'annule',
      VIEW: 'en_attente',
      LOGIN: 'valide',
      LOGOUT: 'valide',
      ERROR: 'annule',
      SECURITY: 'annule',
    };
    return variants[type] || 'en_attente';
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, any> = {
      info: 'en_attente',
      warning: 'rappele',
      error: 'annule',
      critical: 'annule',
    };
    return variants[severity] || 'en_attente';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'error':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
          <p className="text-gray-500 mt-1">
            Journal des événements et traçabilité complète
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => exportMutation.mutate('csv')} disabled={exportMutation.isPending}>
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => exportMutation.mutate('json')} disabled={exportMutation.isPending}>
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.total_logs.toLocaleString('fr-FR')}</p>
              <p className="text-sm text-gray-500">Total période</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary-600">{stats.logs_today.toLocaleString('fr-FR')}</p>
              <p className="text-sm text-gray-500">Aujourd'hui</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.logs_this_week.toLocaleString('fr-FR')}</p>
              <p className="text-sm text-gray-500">Cette semaine</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{stats.security_alerts}</p>
              <p className="text-sm text-gray-500">Alertes sécurité</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {stats.by_severity.find((s) => s.severity === 'info')?.count || 0}
              </p>
              <p className="text-sm text-gray-500">Événements info</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="logs">
            <DocumentTextIcon className="h-4 w-4 mr-2" />
            Logs ({logsData?.meta.total || 0})
          </TabsTrigger>
          <TabsTrigger value="security">
            <ShieldExclamationIcon className="h-4 w-4 mr-2" />
            Sécurité
          </TabsTrigger>
          <TabsTrigger value="analytics">
            Analytiques
          </TabsTrigger>
        </TabsList>

        {/* Logs Tab */}
        <TabsContent value="logs" className="mt-6 space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
                <div className="sm:col-span-2">
                  <Input
                    placeholder="Rechercher..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
                  />
                </div>
                <Select
                  value={filterActionType}
                  onChange={(e) => setFilterActionType(e.target.value)}
                  options={[
                    { value: '', label: 'Toutes les actions' },
                    { value: 'CREATE', label: 'Création' },
                    { value: 'UPDATE', label: 'Modification' },
                    { value: 'DELETE', label: 'Suppression' },
                    { value: 'VIEW', label: 'Consultation' },
                    { value: 'LOGIN', label: 'Connexion' },
                    { value: 'LOGOUT', label: 'Déconnexion' },
                    { value: 'ERROR', label: 'Erreur' },
                    { value: 'SECURITY', label: 'Sécurité' },
                  ]}
                />
                <Select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  options={[
                    { value: '', label: 'Toutes sévérités' },
                    { value: 'info', label: 'Info' },
                    { value: 'warning', label: 'Warning' },
                    { value: 'error', label: 'Error' },
                    { value: 'critical', label: 'Critical' },
                  ]}
                />
                <Input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                />
                <Input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Logs List */}
          {logsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : logsData?.data && logsData.data.length > 0 ? (
            <>
              <Card>
                <CardContent className="p-0">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Horodatage</th>
                        <th>Action</th>
                        <th>Utilisateur</th>
                        <th>Entité</th>
                        <th>Sévérité</th>
                        <th>IP</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {logsData.data.map((log) => (
                        <tr key={log.id} className={log.severity === 'critical' || log.severity === 'error' ? 'bg-red-50' : ''}>
                          <td>
                            <div className="flex items-center gap-2 text-sm">
                              <ClockIcon className="h-4 w-4 text-gray-400" />
                              {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}
                            </div>
                          </td>
                          <td>
                            <Badge variant={getActionTypeBadge(log.action_type)} size="sm">
                              {log.action_type}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">{log.action}</p>
                          </td>
                          <td>
                            {log.user_email ? (
                              <div className="flex items-center gap-2">
                                <UserIcon className="h-4 w-4 text-gray-400" />
                                <div>
                                  <p className="text-sm font-medium">{log.user_nom || log.user_email}</p>
                                  {log.user_nom && <p className="text-xs text-gray-500">{log.user_email}</p>}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">Système</span>
                            )}
                          </td>
                          <td>
                            <p className="text-sm">{log.entity_type}</p>
                            {log.entity_id && (
                              <p className="text-xs text-gray-500 font-mono">{log.entity_id.substring(0, 8)}...</p>
                            )}
                          </td>
                          <td>
                            <div className="flex items-center gap-1">
                              {getSeverityIcon(log.severity)}
                              <Badge variant={getSeverityBadge(log.severity)} size="sm">
                                {log.severity}
                              </Badge>
                            </div>
                          </td>
                          <td>
                            <span className="text-xs font-mono text-gray-500">{log.ip_address || '-'}</span>
                          </td>
                          <td>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Pagination */}
              {logsData.meta.total_pages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Précédent
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {page} sur {logsData.meta.total_pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= logsData.meta.total_pages}
                  >
                    Suivant
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucun log trouvé</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-6 space-y-4">
          <SecurityEventsPanel />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6 space-y-4">
          {stats && <AuditAnalytics stats={stats} />}
        </TabsContent>
      </Tabs>

      {/* Log Detail Modal */}
      <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}

// Security Events Panel
function SecurityEventsPanel() {
  const { data: securityLogs, isLoading } = useQuery({
    queryKey: ['audit-security-logs'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: AuditLog[] }>('/audit/security/events', {
        params: { limit: 100 },
      });
      return response.data.data;
    },
  });

  const { data: failedLogins } = useQuery({
    queryKey: ['audit-failed-logins'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: any[] }>('/audit/security/failed-logins');
      return response.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Failed Logins */}
      {failedLogins && failedLogins.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <h3 className="font-semibold text-red-800">Tentatives de connexion échouées</h3>
          </CardHeader>
          <CardContent className="p-0">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Tentatives</th>
                  <th>Dernière tentative</th>
                  <th>IP</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {failedLogins.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="font-medium">{item.email}</td>
                    <td><Badge variant="annule">{item.attempts}</Badge></td>
                    <td>{format(new Date(item.last_attempt), 'dd/MM HH:mm')}</td>
                    <td className="font-mono text-xs">{item.ip_address}</td>
                    <td>
                      {item.locked ? (
                        <Badge variant="annule">Bloqué</Badge>
                      ) : (
                        <Badge variant="rappele">Surveillé</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Security Events */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold">Événements de sécurité récents</h3>
        </CardHeader>
        <CardContent className="p-0">
          {securityLogs && securityLogs.length > 0 ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Horodatage</th>
                  <th>Événement</th>
                  <th>Utilisateur</th>
                  <th>Détails</th>
                  <th>Sévérité</th>
                </tr>
              </thead>
              <tbody>
                {securityLogs.map((log) => (
                  <tr key={log.id} className={log.severity === 'critical' ? 'bg-red-50' : ''}>
                    <td>{format(new Date(log.timestamp), 'dd/MM HH:mm:ss')}</td>
                    <td className="font-medium">{log.action}</td>
                    <td>{log.user_email || 'N/A'}</td>
                    <td className="text-sm text-gray-600">
                      {log.metadata?.reason || log.metadata?.details || '-'}
                    </td>
                    <td>
                      <Badge variant={log.severity === 'critical' ? 'annule' : 'rappele'}>
                        {log.severity}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-gray-500">
              Aucun événement de sécurité récent
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Audit Analytics
function AuditAnalytics({ stats }: { stats: AuditStats }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* By Action Type */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold">Par type d'action</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.by_action_type.map((item) => (
              <div key={item.action_type} className="flex items-center justify-between">
                <span className="text-sm">{item.action_type}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500"
                      style={{ width: `${(item.count / stats.total_logs) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-16 text-right">
                    {item.count.toLocaleString('fr-FR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* By Entity Type */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold">Par type d'entité</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.by_entity_type.slice(0, 10).map((item) => (
              <div key={item.entity_type} className="flex items-center justify-between">
                <span className="text-sm">{item.entity_type}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${(item.count / stats.total_logs) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-16 text-right">
                    {item.count.toLocaleString('fr-FR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* By Severity */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold">Par sévérité</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.by_severity.map((item) => {
              const colors: Record<string, string> = {
                info: 'bg-blue-500',
                warning: 'bg-yellow-500',
                error: 'bg-red-500',
                critical: 'bg-red-700',
              };
              return (
                <div key={item.severity} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{item.severity}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors[item.severity] || 'bg-gray-500'}`}
                        style={{ width: `${(item.count / stats.total_logs) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-16 text-right">
                      {item.count.toLocaleString('fr-FR')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Log Detail Modal
function LogDetailModal({ log, onClose }: { log: AuditLog | null; onClose: () => void }) {
  if (!log) return null;

  return (
    <Modal isOpen={!!log} onClose={onClose} title="Détail du log" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">ID</p>
            <p className="font-mono text-sm">{log.id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Horodatage</p>
            <p>{format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss.SSS', { locale: fr })}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Action</p>
            <p className="font-medium">{log.action}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Type</p>
            <Badge variant={log.action_type === 'ERROR' ? 'annule' : 'confirme'}>{log.action_type}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Entité</p>
            <p>{log.entity_type} {log.entity_id && <span className="font-mono text-xs">({log.entity_id})</span>}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Sévérité</p>
            <Badge variant={log.severity === 'error' || log.severity === 'critical' ? 'annule' : 'en_attente'}>
              {log.severity}
            </Badge>
          </div>
        </div>

        <hr />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Utilisateur</p>
            <p>{log.user_nom || log.user_email || 'Système'}</p>
            {log.user_email && log.user_nom && <p className="text-xs text-gray-400">{log.user_email}</p>}
          </div>
          <div>
            <p className="text-sm text-gray-500">IP / User Agent</p>
            <p className="font-mono text-xs">{log.ip_address || '-'}</p>
            {log.user_agent && <p className="text-xs text-gray-400 truncate">{log.user_agent}</p>}
          </div>
        </div>

        {log.centre_nom && (
          <div>
            <p className="text-sm text-gray-500">Centre</p>
            <p>{log.centre_nom}</p>
          </div>
        )}

        {log.metadata && Object.keys(log.metadata).length > 0 && (
          <div>
            <p className="text-sm text-gray-500 mb-2">Métadonnées</p>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          </div>
        )}

        {log.changes && (log.changes.before || log.changes.after) && (
          <div>
            <p className="text-sm text-gray-500 mb-2">Modifications</p>
            <div className="grid grid-cols-2 gap-4">
              {log.changes.before && (
                <div>
                  <p className="text-xs font-medium text-red-600 mb-1">Avant</p>
                  <pre className="bg-red-50 p-2 rounded text-xs overflow-auto max-h-32">
                    {JSON.stringify(log.changes.before, null, 2)}
                  </pre>
                </div>
              )}
              {log.changes.after && (
                <div>
                  <p className="text-xs font-medium text-green-600 mb-1">Après</p>
                  <pre className="bg-green-50 p-2 rounded text-xs overflow-auto max-h-32">
                    {JSON.stringify(log.changes.after, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>Fermer</Button>
      </ModalFooter>
    </Modal>
  );
}
