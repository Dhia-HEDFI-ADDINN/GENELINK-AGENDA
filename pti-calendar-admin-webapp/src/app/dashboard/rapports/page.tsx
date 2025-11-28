'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
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
  Spinner,
  Alert,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  ChartBarIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  UsersIcon,
  CurrencyEuroIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@pti-calendar/design-system';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
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

interface ReportStats {
  periode: {
    debut: string;
    fin: string;
  };
  rdv: {
    total: number;
    confirmes: number;
    annules: number;
    no_show: number;
    termines: number;
    evolution: number;
    par_jour: Array<{ date: string; total: number; annules: number }>;
    par_type: Array<{ type: string; count: number; ca: number }>;
    par_centre: Array<{ centre_id: string; centre_nom: string; total: number; ca: number; taux_occupation: number }>;
  };
  ca: {
    total: number;
    evolution: number;
    par_jour: Array<{ date: string; montant: number }>;
    par_reseau: Array<{ reseau_id: string; reseau_nom: string; montant: number }>;
    par_mode_paiement: Array<{ mode: string; montant: number; count: number }>;
  };
  performance: {
    taux_occupation_global: number;
    taux_annulation: number;
    taux_no_show: number;
    delai_moyen_prise_rdv: number;
    satisfaction_moyenne: number;
    top_centres: Array<{ id: string; nom: string; score: number }>;
    worst_centres: Array<{ id: string; nom: string; score: number; raison: string }>;
  };
  controles: {
    total: number;
    favorables: number;
    defavorables: number;
    contre_visite: number;
    taux_reussite: number;
    defauts_frequents: Array<{ code: string; libelle: string; count: number }>;
  };
}

export default function RapportsPage() {
  const { isSuperAdmin, user } = useAuth();

  const [activeTab, setActiveTab] = useState('synthese');
  const [periodeType, setPeriodeType] = useState('mois');
  const [periodeDebut, setPeriodeDebut] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [periodeFin, setPeriodeFin] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [filterReseau, setFilterReseau] = useState('');
  const [filterCentre, setFilterCentre] = useState('');

  // Fetch réseaux
  const { data: reseaux } = useQuery({
    queryKey: ['reseaux-list'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: { id: string; nom: string }[] }>('/admin/reseaux');
      return response.data.data;
    },
    enabled: isSuperAdmin,
  });

  // Fetch centres
  const { data: centres } = useQuery({
    queryKey: ['centres-list', filterReseau],
    queryFn: async () => {
      const response = await apiClient.get<{ data: { id: string; nom: string }[] }>('/admin/centres', {
        params: { reseau_id: filterReseau || undefined },
      });
      return response.data.data;
    },
  });

  // Fetch rapport
  const { data: stats, isLoading } = useQuery({
    queryKey: ['rapport-stats', periodeDebut, periodeFin, filterReseau, filterCentre],
    queryFn: async () => {
      const response = await apiClient.get<ReportStats>('/admin/reports/stats', {
        params: {
          date_debut: periodeDebut,
          date_fin: periodeFin,
          reseau_id: filterReseau || undefined,
          centre_id: filterCentre || undefined,
        },
      });
      return response.data;
    },
  });

  // Export rapport
  const exportMutation = useMutation({
    mutationFn: async (format: 'pdf' | 'excel') => {
      const response = await apiClient.post('/admin/reports/export', {
        format,
        date_debut: periodeDebut,
        date_fin: periodeFin,
        reseau_id: filterReseau || undefined,
        centre_id: filterCentre || undefined,
        sections: ['synthese', 'rdv', 'ca', 'performance', 'controles'],
      }, { responseType: 'blob' });

      const blob = new Blob([response.data as any], {
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport_${periodeDebut}_${periodeFin}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      a.click();
    },
  });

  const handlePeriodeChange = (type: string) => {
    setPeriodeType(type);
    const now = new Date();
    switch (type) {
      case 'semaine':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + 1);
        setPeriodeDebut(format(weekStart, 'yyyy-MM-dd'));
        setPeriodeFin(format(now, 'yyyy-MM-dd'));
        break;
      case 'mois':
        setPeriodeDebut(format(startOfMonth(now), 'yyyy-MM-dd'));
        setPeriodeFin(format(endOfMonth(now), 'yyyy-MM-dd'));
        break;
      case 'trimestre':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        setPeriodeDebut(format(quarterStart, 'yyyy-MM-dd'));
        setPeriodeFin(format(now, 'yyyy-MM-dd'));
        break;
      case 'annee':
        setPeriodeDebut(format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd'));
        setPeriodeFin(format(now, 'yyyy-MM-dd'));
        break;
    }
  };

  // Chart: RDV par jour
  const rdvChartData = {
    labels: stats?.rdv.par_jour.map((d) => format(new Date(d.date), 'dd/MM')) || [],
    datasets: [
      {
        label: 'RDV',
        data: stats?.rdv.par_jour.map((d) => d.total) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Annulés',
        data: stats?.rdv.par_jour.map((d) => d.annules) || [],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Chart: CA par jour
  const caChartData = {
    labels: stats?.ca.par_jour.map((d) => format(new Date(d.date), 'dd/MM')) || [],
    datasets: [{
      label: 'CA (€)',
      data: stats?.ca.par_jour.map((d) => d.montant) || [],
      borderColor: 'rgb(34, 197, 94)',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      fill: true,
      tension: 0.4,
    }],
  };

  // Chart: RDV par type
  const typeChartData = {
    labels: stats?.rdv.par_type.map((t) => t.type) || [],
    datasets: [{
      data: stats?.rdv.par_type.map((t) => t.count) || [],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(234, 179, 8, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(168, 85, 247, 0.8)',
      ],
    }],
  };

  // Chart: Résultats contrôles
  const resultatsChartData = {
    labels: ['Favorables', 'Défavorables', 'Contre-visite'],
    datasets: [{
      data: [
        stats?.controles.favorables || 0,
        stats?.controles.defavorables || 0,
        stats?.controles.contre_visite || 0,
      ],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(234, 179, 8, 0.8)',
      ],
    }],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports et Statistiques</h1>
          <p className="text-gray-500 mt-1">Analyse de performance et indicateurs clés</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => exportMutation.mutate('excel')} disabled={exportMutation.isPending}>
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button variant="outline" onClick={() => exportMutation.mutate('pdf')} disabled={exportMutation.isPending}>
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
            <Select
              value={periodeType}
              onChange={(e) => handlePeriodeChange(e.target.value)}
              options={[
                { value: 'semaine', label: 'Cette semaine' },
                { value: 'mois', label: 'Ce mois' },
                { value: 'trimestre', label: 'Ce trimestre' },
                { value: 'annee', label: 'Cette année' },
                { value: 'custom', label: 'Personnalisé' },
              ]}
            />
            <Input
              type="date"
              value={periodeDebut}
              onChange={(e) => { setPeriodeDebut(e.target.value); setPeriodeType('custom'); }}
            />
            <Input
              type="date"
              value={periodeFin}
              onChange={(e) => { setPeriodeFin(e.target.value); setPeriodeType('custom'); }}
            />
            {isSuperAdmin && reseaux && (
              <Select
                value={filterReseau}
                onChange={(e) => { setFilterReseau(e.target.value); setFilterCentre(''); }}
                options={[
                  { value: '', label: 'Tous les réseaux' },
                  ...reseaux.map((r) => ({ value: r.id, label: r.nom })),
                ]}
              />
            )}
            {centres && centres.length > 0 && (
              <Select
                value={filterCentre}
                onChange={(e) => setFilterCentre(e.target.value)}
                options={[
                  { value: '', label: 'Tous les centres' },
                  ...centres.map((c) => ({ value: c.id, label: c.nom })),
                ]}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : stats ? (
        <>
          {/* KPI Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <KpiCard
              title="RDV total"
              value={stats.rdv.total}
              evolution={stats.rdv.evolution}
              icon={<CalendarIcon className="h-6 w-6" />}
            />
            <KpiCard
              title="CA total"
              value={`${(stats.ca.total / 1000).toFixed(0)}k €`}
              evolution={stats.ca.evolution}
              icon={<CurrencyEuroIcon className="h-6 w-6" />}
            />
            <KpiCard
              title="Taux occupation"
              value={`${stats.performance.taux_occupation_global}%`}
              icon={<BuildingOfficeIcon className="h-6 w-6" />}
            />
            <KpiCard
              title="Taux réussite"
              value={`${stats.controles.taux_reussite}%`}
              icon={<ChartBarIcon className="h-6 w-6" />}
              good={stats.controles.taux_reussite > 80}
            />
            <KpiCard
              title="Satisfaction"
              value={`${stats.performance.satisfaction_moyenne}/5`}
              icon={<UsersIcon className="h-6 w-6" />}
              good={stats.performance.satisfaction_moyenne > 4}
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="synthese">Synthèse</TabsTrigger>
              <TabsTrigger value="rdv">Rendez-vous</TabsTrigger>
              <TabsTrigger value="ca">Chiffre d'affaires</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="controles">Contrôles</TabsTrigger>
            </TabsList>

            {/* Synthèse Tab */}
            <TabsContent value="synthese" className="mt-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <h3 className="font-semibold">Évolution des RDV</h3>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <div className="h-64">
                      <Line data={rdvChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <h3 className="font-semibold">Évolution du CA</h3>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <div className="h-64">
                      <Line data={caChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <h3 className="font-semibold">Répartition par type</h3>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <div className="h-48 flex items-center justify-center">
                      <Doughnut data={typeChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <h3 className="font-semibold">Résultats des contrôles</h3>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <div className="h-48 flex items-center justify-center">
                      <Doughnut data={resultatsChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <h3 className="font-semibold">Indicateurs clés</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Taux d'annulation</span>
                        <Badge variant={stats.performance.taux_annulation < 10 ? 'confirme' : 'annule'}>
                          {stats.performance.taux_annulation}%
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Taux no-show</span>
                        <Badge variant={stats.performance.taux_no_show < 5 ? 'confirme' : 'annule'}>
                          {stats.performance.taux_no_show}%
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Délai moyen prise RDV</span>
                        <span className="font-medium">{stats.performance.delai_moyen_prise_rdv}j</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* RDV Tab */}
            <TabsContent value="rdv" className="mt-6 space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{stats.rdv.confirmes}</p>
                    <p className="text-sm text-gray-500">Confirmés</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{stats.rdv.termines}</p>
                    <p className="text-sm text-gray-500">Terminés</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-red-600">{stats.rdv.annules}</p>
                    <p className="text-sm text-gray-500">Annulés</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-orange-600">{stats.rdv.no_show}</p>
                    <p className="text-sm text-gray-500">No-show</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <h3 className="font-semibold">RDV par type de contrôle</h3>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Nombre</th>
                        <th>CA</th>
                        <th>Part</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.rdv.par_type.map((item) => (
                        <tr key={item.type}>
                          <td className="font-medium">{item.type}</td>
                          <td>{item.count}</td>
                          <td>{item.ca.toLocaleString('fr-FR')} €</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary-500"
                                  style={{ width: `${(item.count / stats.rdv.total) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm">{((item.count / stats.rdv.total) * 100).toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="font-semibold">RDV par centre</h3>
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
                      {stats.rdv.par_centre.slice(0, 10).map((item) => (
                        <tr key={item.centre_id}>
                          <td className="font-medium">{item.centre_nom}</td>
                          <td>{item.total}</td>
                          <td>{item.ca.toLocaleString('fr-FR')} €</td>
                          <td>
                            <Badge variant={item.taux_occupation >= 80 ? 'confirme' : item.taux_occupation >= 50 ? 'rappele' : 'annule'}>
                              {item.taux_occupation}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* CA Tab */}
            <TabsContent value="ca" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <h3 className="font-semibold">CA par réseau</h3>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="h-64">
                    <Bar
                      data={{
                        labels: stats.ca.par_reseau.map((r) => r.reseau_nom),
                        datasets: [{
                          label: 'CA (€)',
                          data: stats.ca.par_reseau.map((r) => r.montant),
                          backgroundColor: 'rgba(34, 197, 94, 0.8)',
                        }],
                      }}
                      options={{ responsive: true, maintainAspectRatio: false }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="font-semibold">Répartition par mode de paiement</h3>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Mode</th>
                        <th>Montant</th>
                        <th>Transactions</th>
                        <th>Part</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.ca.par_mode_paiement.map((item) => (
                        <tr key={item.mode}>
                          <td className="font-medium">{item.mode}</td>
                          <td>{item.montant.toLocaleString('fr-FR')} €</td>
                          <td>{item.count}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-500"
                                  style={{ width: `${(item.montant / stats.ca.total) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm">{((item.montant / stats.ca.total) * 100).toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="mt-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <h3 className="font-semibold text-green-700">Top 10 centres</h3>
                  </CardHeader>
                  <CardContent className="p-0">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Centre</th>
                          <th>Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.performance.top_centres.map((centre, index) => (
                          <tr key={centre.id}>
                            <td>
                              <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-semibold">
                                {index + 1}
                              </span>
                            </td>
                            <td className="font-medium">{centre.nom}</td>
                            <td>
                              <Badge variant="confirme">{centre.score}/100</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <h3 className="font-semibold text-red-700">Centres à améliorer</h3>
                  </CardHeader>
                  <CardContent className="p-0">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Centre</th>
                          <th>Score</th>
                          <th>Raison</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.performance.worst_centres.map((centre) => (
                          <tr key={centre.id}>
                            <td className="font-medium">{centre.nom}</td>
                            <td>
                              <Badge variant="annule">{centre.score}/100</Badge>
                            </td>
                            <td className="text-sm text-gray-600">{centre.raison}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Controles Tab */}
            <TabsContent value="controles" className="mt-6 space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">{stats.controles.total}</p>
                    <p className="text-sm text-gray-500">Contrôles réalisés</p>
                  </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{stats.controles.favorables}</p>
                    <p className="text-sm text-green-700">Favorables</p>
                  </CardContent>
                </Card>
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-red-600">{stats.controles.defavorables}</p>
                    <p className="text-sm text-red-700">Défavorables</p>
                  </CardContent>
                </Card>
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-yellow-600">{stats.controles.contre_visite}</p>
                    <p className="text-sm text-yellow-700">Contre-visites</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <h3 className="font-semibold">Défauts les plus fréquents</h3>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Libellé</th>
                        <th>Occurrences</th>
                        <th>Fréquence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.controles.defauts_frequents.slice(0, 15).map((defaut) => (
                        <tr key={defaut.code}>
                          <td><code className="bg-gray-100 px-2 py-1 rounded text-xs">{defaut.code}</code></td>
                          <td className="font-medium">{defaut.libelle}</td>
                          <td>{defaut.count}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-red-500"
                                  style={{ width: `${(defaut.count / stats.controles.defavorables) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm">{((defaut.count / stats.controles.defavorables) * 100).toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : null}
    </div>
  );
}

function KpiCard({ title, value, evolution, icon, good }: {
  title: string;
  value: string | number;
  evolution?: number;
  icon: React.ReactNode;
  good?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${good ? 'text-green-600' : 'text-gray-900'}`}>{value}</p>
            {evolution !== undefined && (
              <div className={`flex items-center gap-1 mt-1 text-xs ${evolution >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {evolution >= 0 ? (
                  <ArrowTrendingUpIcon className="h-3 w-3" />
                ) : (
                  <ArrowTrendingDownIcon className="h-3 w-3" />
                )}
                {Math.abs(evolution)}%
              </div>
            )}
          </div>
          <div className="p-2 bg-gray-100 rounded-lg text-gray-600">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
