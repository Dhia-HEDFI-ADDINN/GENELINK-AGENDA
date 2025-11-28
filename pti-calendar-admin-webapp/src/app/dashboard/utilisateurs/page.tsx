'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
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
  Spinner,
  Alert,
  UsersIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  KeyIcon,
  EnvelopeIcon,
  LockClosedIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@pti-calendar/design-system';

// Simple Tabs implementation
function Tabs({ value, onValueChange, children }: { value: string; onValueChange: (v: string) => void; children: React.ReactNode }) {
  return <div data-value={value} data-onchange={onValueChange ? 'true' : 'false'}>{children}</div>;
}
function TabsList({ children }: { children: React.ReactNode }) {
  return <div className="flex border-b border-gray-200 mb-4">{children}</div>;
}
function TabsTrigger({ value, children, ...props }: { value: string; children: React.ReactNode } & React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 border-b-2 border-transparent hover:text-primary-600 hover:border-primary-300 data-[state=active]:text-primary-600 data-[state=active]:border-primary-600"
      {...props}
    >
      {children}
    </button>
  );
}
function TabsContent({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
  role: 'ADMIN_SGS' | 'ADMIN_RESEAU' | 'GESTIONNAIRE_CENTRE' | 'CONTROLEUR' | 'CALLCENTER';
  reseau_id?: string;
  reseau_nom?: string;
  centre_id?: string;
  centre_nom?: string;
  actif: boolean;
  derniere_connexion?: string;
  created_at: string;
  permissions: string[];
}

interface Role {
  id: string;
  code: string;
  nom: string;
  description: string;
  permissions: string[];
  niveau: number;
  nb_utilisateurs: number;
}

interface Permission {
  id: string;
  code: string;
  nom: string;
  categorie: string;
  description: string;
}

export default function UtilisateursPage() {
  const { isSuperAdmin, user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('utilisateurs');
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterActif, setFilterActif] = useState('');
  const [filterReseau, setFilterReseau] = useState('');

  const [showUserModal, setShowUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // Fetch users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users', search, filterRole, filterActif, filterReseau],
    queryFn: async () => {
      const response = await apiClient.get<{ data: User[]; meta: { total: number } }>('/admin/users', {
        params: {
          search: search || undefined,
          role: filterRole || undefined,
          actif: filterActif || undefined,
          reseau_id: filterReseau || undefined,
        },
      });
      return response.data;
    },
  });

  // Fetch roles
  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Role[] }>('/admin/roles');
      return response.data.data;
    },
  });

  // Fetch permissions
  const { data: permissions } = useQuery({
    queryKey: ['admin-permissions'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Permission[] }>('/admin/permissions');
      return response.data.data;
    },
  });

  // Fetch reseaux
  const { data: reseaux } = useQuery({
    queryKey: ['reseaux-list'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: { id: string; nom: string }[] }>('/admin/reseaux');
      return response.data.data;
    },
    enabled: isSuperAdmin,
  });

  // Toggle user actif
  const toggleUserActifMutation = useMutation({
    mutationFn: ({ id, actif }: { id: string; actif: boolean }) =>
      apiClient.patch(`/admin/users/${id}`, { actif }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  // Reset password
  const resetPasswordMutation = useMutation({
    mutationFn: (userId: string) => apiClient.post(`/admin/users/${userId}/reset-password`),
    onSuccess: () => {
      alert('Un email de réinitialisation a été envoyé');
    },
  });

  // Delete user
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => apiClient.delete(`/admin/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN_SGS': return 'confirme';
      case 'ADMIN_RESEAU': return 'rappele';
      case 'GESTIONNAIRE_CENTRE': return 'en_attente';
      case 'CONTROLEUR': return 'valide';
      default: return 'annule';
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      'ADMIN_SGS': 'Admin SGS',
      'ADMIN_RESEAU': 'Admin Réseau',
      'GESTIONNAIRE_CENTRE': 'Gestionnaire',
      'CONTROLEUR': 'Contrôleur',
      'CALLCENTER': 'Call Center',
    };
    return labels[role] || role;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
          <p className="text-gray-500 mt-1">
            {users?.meta?.total || users?.data?.length || 0} utilisateurs • {roles?.length || 0} rôles
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="utilisateurs">
            <UsersIcon className="h-4 w-4 mr-2" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="roles">
            <ShieldCheckIcon className="h-4 w-4 mr-2" />
            Rôles et permissions
          </TabsTrigger>
        </TabsList>

        {/* Utilisateurs Tab */}
        <TabsContent value="utilisateurs" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <Card className="flex-1">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                  <div className="sm:col-span-2">
                    <Input
                      placeholder="Rechercher (nom, email...)"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
                    />
                  </div>
                  <Select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    options={[
                      { value: '', label: 'Tous les rôles' },
                      { value: 'ADMIN_SGS', label: 'Admin SGS' },
                      { value: 'ADMIN_RESEAU', label: 'Admin Réseau' },
                      { value: 'GESTIONNAIRE_CENTRE', label: 'Gestionnaire' },
                      { value: 'CONTROLEUR', label: 'Contrôleur' },
                      { value: 'CALLCENTER', label: 'Call Center' },
                    ]}
                  />
                  {isSuperAdmin && reseaux && (
                    <Select
                      value={filterReseau}
                      onChange={(e) => setFilterReseau(e.target.value)}
                      options={[
                        { value: '', label: 'Tous les réseaux' },
                        ...reseaux.map((r) => ({ value: r.id, label: r.nom })),
                      ]}
                    />
                  )}
                  <Select
                    value={filterActif}
                    onChange={(e) => setFilterActif(e.target.value)}
                    options={[
                      { value: '', label: 'Tous les statuts' },
                      { value: 'true', label: 'Actifs' },
                      { value: 'false', label: 'Inactifs' },
                    ]}
                  />
                </div>
              </CardContent>
            </Card>
            <Button onClick={() => setShowUserModal(true)} className="ml-4">
              <PlusIcon className="h-5 w-5 mr-2" />
              Nouvel utilisateur
            </Button>
          </div>

          {usersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : users?.data && users.data.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Utilisateur</th>
                      <th>Rôle</th>
                      <th>Affectation</th>
                      <th>Dernière connexion</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.data.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-primary-600 font-semibold">
                                {user.prenom[0]}{user.nom[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{user.prenom} {user.nom}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {getRoleLabel(user.role)}
                          </Badge>
                        </td>
                        <td>
                          {user.centre_nom && <p className="text-sm">{user.centre_nom}</p>}
                          {user.reseau_nom && <p className="text-xs text-gray-500">{user.reseau_nom}</p>}
                          {!user.centre_nom && !user.reseau_nom && <span className="text-gray-400">-</span>}
                        </td>
                        <td>
                          {user.derniere_connexion ? (
                            <span className="text-sm">
                              {format(new Date(user.derniere_connexion), 'dd/MM/yyyy HH:mm', { locale: fr })}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">Jamais</span>
                          )}
                        </td>
                        <td>
                          <Badge variant={user.actif ? 'confirme' : 'annule'}>
                            {user.actif ? 'Actif' : 'Inactif'}
                          </Badge>
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingUser(user);
                                setShowUserModal(true);
                              }}
                              title="Modifier"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => resetPasswordMutation.mutate(user.id)}
                              title="Réinitialiser mot de passe"
                            >
                              <KeyIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleUserActifMutation.mutate({ id: user.id, actif: !user.actif })}
                              title={user.actif ? 'Désactiver' : 'Activer'}
                            >
                              {user.actif ? (
                                <XCircleIcon className="h-4 w-4 text-red-500" />
                              ) : (
                                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                              )}
                            </Button>
                            {user.id !== currentUser?.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm('Supprimer cet utilisateur ?')) {
                                    deleteUserMutation.mutate(user.id);
                                  }
                                }}
                                title="Supprimer"
                              >
                                <TrashIcon className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <UsersIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucun utilisateur trouvé</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="mt-6 space-y-4">
          <div className="flex items-center justify-end">
            {isSuperAdmin && (
              <Button onClick={() => setShowRoleModal(true)}>
                <PlusIcon className="h-5 w-5 mr-2" />
                Nouveau rôle
              </Button>
            )}
          </div>

          {rolesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {roles?.map((role) => (
                <Card key={role.id}>
                  <CardHeader className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <ShieldCheckIcon className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{role.nom}</h3>
                        <p className="text-xs text-gray-500">{role.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="en_attente">{role.nb_utilisateurs} utilisateurs</Badge>
                      {isSuperAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingRole(role);
                            setShowRoleModal(true);
                          }}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 mb-4">{role.description}</p>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">Permissions ({role.permissions.length})</p>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.slice(0, 8).map((perm) => (
                          <Badge key={perm} variant="valide" size="sm">{perm}</Badge>
                        ))}
                        {role.permissions.length > 8 && (
                          <Badge variant="annule" size="sm">+{role.permissions.length - 8}</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Permissions Reference */}
          {permissions && permissions.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Référentiel des permissions</h3>
              </CardHeader>
              <CardContent className="p-0">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Nom</th>
                      <th>Catégorie</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {permissions.map((perm) => (
                      <tr key={perm.id}>
                        <td><code className="text-xs bg-gray-100 px-2 py-1 rounded">{perm.code}</code></td>
                        <td>{perm.nom}</td>
                        <td><Badge variant="rappele" size="sm">{perm.categorie}</Badge></td>
                        <td className="text-sm text-gray-600">{perm.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* User Modal */}
      <UserFormModal
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setEditingUser(null);
        }}
        user={editingUser}
        roles={roles || []}
        reseaux={reseaux || []}
        isSuperAdmin={isSuperAdmin}
      />

      {/* Role Modal */}
      <RoleFormModal
        isOpen={showRoleModal}
        onClose={() => {
          setShowRoleModal(false);
          setEditingRole(null);
        }}
        role={editingRole}
        permissions={permissions || []}
      />
    </div>
  );
}

// User Form Modal
function UserFormModal({ isOpen, onClose, user, roles, reseaux, isSuperAdmin }: {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  roles: Role[];
  reseaux: { id: string; nom: string }[];
  isSuperAdmin: boolean;
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    email: user?.email || '',
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    telephone: user?.telephone || '',
    role: user?.role || 'CONTROLEUR',
    reseau_id: user?.reseau_id || '',
    centre_id: user?.centre_id || '',
    actif: user?.actif ?? true,
    permissions_supplementaires: [] as string[],
  });

  // Fetch centres for selected reseau
  const { data: centres } = useQuery({
    queryKey: ['centres-for-reseau', formData.reseau_id],
    queryFn: async () => {
      const response = await apiClient.get<{ data: { id: string; nom: string }[] }>('/admin/centres', {
        params: { reseau_id: formData.reseau_id },
      });
      return response.data.data;
    },
    enabled: !!formData.reseau_id,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (user) {
        return apiClient.put(`/admin/users/${user.id}`, formData);
      }
      return apiClient.post('/admin/users', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      onClose();
    },
  });

  const needsReseau = ['ADMIN_RESEAU', 'GESTIONNAIRE_CENTRE', 'CONTROLEUR'].includes(formData.role);
  const needsCentre = ['GESTIONNAIRE_CENTRE', 'CONTROLEUR'].includes(formData.role);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={user ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'} size="lg">
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Prénom"
            value={formData.prenom}
            onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
            required
          />
          <Input
            label="Nom"
            value={formData.nom}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            type="email"
            label="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={!!user}
          />
          <Input
            type="tel"
            label="Téléphone"
            value={formData.telephone}
            onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
          />
        </div>

        <Select
          label="Rôle"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value as any, centre_id: '', reseau_id: '' })}
          options={[
            { value: 'ADMIN_SGS', label: 'Admin SGS', disabled: !isSuperAdmin },
            { value: 'ADMIN_RESEAU', label: 'Admin Réseau' },
            { value: 'GESTIONNAIRE_CENTRE', label: 'Gestionnaire Centre' },
            { value: 'CONTROLEUR', label: 'Contrôleur' },
            { value: 'CALLCENTER', label: 'Call Center' },
          ]}
          required
        />

        {needsReseau && isSuperAdmin && (
          <Select
            label="Réseau"
            value={formData.reseau_id}
            onChange={(e) => setFormData({ ...formData, reseau_id: e.target.value, centre_id: '' })}
            options={[
              { value: '', label: 'Sélectionner...' },
              ...reseaux.map((r) => ({ value: r.id, label: r.nom })),
            ]}
            required={needsReseau}
          />
        )}

        {needsCentre && centres && (
          <Select
            label="Centre"
            value={formData.centre_id}
            onChange={(e) => setFormData({ ...formData, centre_id: e.target.value })}
            options={[
              { value: '', label: 'Sélectionner...' },
              ...centres.map((c) => ({ value: c.id, label: c.nom })),
            ]}
            required={needsCentre}
          />
        )}

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.actif}
            onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
          />
          Utilisateur actif
        </label>

        {!user && (
          <Alert variant="info">
            Un email d'invitation sera envoyé à l'utilisateur pour définir son mot de passe.
          </Alert>
        )}

        <ModalFooter>
          <Button variant="ghost" type="button" onClick={onClose}>Annuler</Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

// Role Form Modal
function RoleFormModal({ isOpen, onClose, role, permissions }: {
  isOpen: boolean;
  onClose: () => void;
  role: Role | null;
  permissions: Permission[];
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    code: role?.code || '',
    nom: role?.nom || '',
    description: role?.description || '',
    permissions: role?.permissions || [],
    niveau: role?.niveau || 100,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (role) {
        return apiClient.put(`/admin/roles/${role.id}`, formData);
      }
      return apiClient.post('/admin/roles', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      onClose();
    },
  });

  const togglePermission = (permCode: string) => {
    const newPerms = formData.permissions.includes(permCode)
      ? formData.permissions.filter((p) => p !== permCode)
      : [...formData.permissions, permCode];
    setFormData({ ...formData, permissions: newPerms });
  };

  // Group permissions by category
  const permissionsByCategory = permissions.reduce((acc, perm) => {
    if (!acc[perm.categorie]) acc[perm.categorie] = [];
    acc[perm.categorie].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={role ? 'Modifier le rôle' : 'Nouveau rôle'} size="lg">
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            required
            disabled={!!role}
            placeholder="CUSTOM_ROLE"
          />
          <Input
            label="Nom"
            value={formData.nom}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            required
          />
        </div>

        <Input
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />

        <Input
          type="number"
          label="Niveau hiérarchique"
          value={formData.niveau}
          onChange={(e) => setFormData({ ...formData, niveau: parseInt(e.target.value) })}
          min={1}
          max={1000}
          helperText="Plus le niveau est bas, plus le rôle est élevé (1 = Super Admin)"
        />

        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Permissions</p>
          <div className="space-y-4 max-h-64 overflow-y-auto border rounded-lg p-4">
            {Object.entries(permissionsByCategory).map(([category, perms]) => (
              <div key={category}>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{category}</p>
                <div className="grid grid-cols-2 gap-2">
                  {perms.map((perm) => (
                    <label key={perm.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(perm.code)}
                        onChange={() => togglePermission(perm.code)}
                      />
                      <span title={perm.description}>{perm.nom}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {formData.permissions.length} permission(s) sélectionnée(s)
          </p>
        </div>

        <ModalFooter>
          <Button variant="ghost" type="button" onClick={onClose}>Annuler</Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
