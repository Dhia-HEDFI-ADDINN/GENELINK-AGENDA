'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
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
  ChevronLeftIcon,
  UserIcon,
  KeyIcon,
  TrashIcon,
} from '@pti-calendar/design-system';

interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  centre_id?: string;
  centre_nom?: string;
  reseau_id?: string;
  reseau_nom?: string;
  actif: boolean;
  last_login?: string;
  created_at: string;
}

interface Centre {
  id: string;
  nom: string;
}

interface Reseau {
  id: string;
  nom: string;
}

const ROLE_OPTIONS = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'ADMIN_TENANT', label: 'Admin Réseau' },
  { value: 'ADMIN_CT', label: 'Admin Centre' },
  { value: 'RESPONSABLE', label: 'Responsable' },
  { value: 'CONTROLEUR', label: 'Contrôleur' },
  { value: 'ACCUEIL', label: 'Accueil' },
  { value: 'CALL_CENTER', label: 'Call Center' },
];

export default function UserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAdminSGS } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({});

  // Fetch user
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const response = await apiClient.get<User>(`/admin/users/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  // Fetch centres
  const { data: centres } = useQuery({
    queryKey: ['centres-select'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Centre[] }>('/admin/centres', {
        params: { limit: 1000 },
      });
      return response.data.data;
    },
  });

  // Fetch reseaux
  const { data: reseaux } = useQuery({
    queryKey: ['reseaux-select'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Reseau[] }>('/admin/reseaux');
      return response.data.data;
    },
    enabled: isAdminSGS,
  });

  // Update user
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<User>) => {
      return apiClient.put(`/admin/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      setIsEditing(false);
    },
  });

  // Delete user
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiClient.delete(`/admin/users/${id}`);
    },
    onSuccess: () => {
      router.push('/dashboard/utilisateurs');
    },
  });

  // Reset password
  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<{ temporary_password: string }>(
        `/admin/users/${id}/reset-password`
      );
      return response.data;
    },
    onSuccess: (data) => {
      setTemporaryPassword(data.temporary_password);
    },
  });

  // Toggle actif
  const toggleActifMutation = useMutation({
    mutationFn: async () => {
      return apiClient.patch(`/admin/users/${id}`, { actif: !user?.actif });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', id] });
    },
  });

  const handleEdit = () => {
    if (user) {
      setFormData({
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        centre_id: user.centre_id,
        reseau_id: user.reseau_id,
      });
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <Alert variant="error">Utilisateur non trouvé</Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/utilisateurs" className="p-2 rounded-lg hover:bg-gray-100">
            <ChevronLeftIcon className="h-6 w-6 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {user.prenom} {user.nom}
            </h1>
            <p className="text-gray-500 mt-1">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={user.actif ? 'confirme' : 'annule'}>
            {user.actif ? 'Actif' : 'Inactif'}
          </Badge>
          {!isEditing && (
            <Button variant="outline" onClick={handleEdit}>
              Modifier
            </Button>
          )}
        </div>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-gray-400" />
            Informations
          </h2>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nom"
                value={formData.nom || ''}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              />
              <Input
                label="Prénom"
                value={formData.prenom || ''}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Select
                label="Rôle"
                value={formData.role || ''}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                options={ROLE_OPTIONS}
              />
              {isAdminSGS && reseaux && (
                <Select
                  label="Réseau"
                  value={formData.reseau_id || ''}
                  onChange={(e) => setFormData({ ...formData, reseau_id: e.target.value })}
                  options={[{ value: '', label: 'Aucun' }, ...reseaux.map((r) => ({ value: r.id, label: r.nom }))]}
                />
              )}
              {centres && (
                <Select
                  label="Centre"
                  value={formData.centre_id || ''}
                  onChange={(e) => setFormData({ ...formData, centre_id: e.target.value })}
                  options={[{ value: '', label: 'Aucun' }, ...centres.map((c) => ({ value: c.id, label: c.nom }))]}
                />
              )}
              <div className="md:col-span-2 flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => setIsEditing(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSave} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </div>
          ) : (
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-500">Nom complet</dt>
                <dd className="font-medium">{user.prenom} {user.nom}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Email</dt>
                <dd className="font-medium">{user.email}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Rôle</dt>
                <dd className="font-medium">
                  {ROLE_OPTIONS.find((r) => r.value === user.role)?.label || user.role}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Centre</dt>
                <dd className="font-medium">{user.centre_nom || '-'}</dd>
              </div>
              {user.reseau_nom && (
                <div>
                  <dt className="text-sm text-gray-500">Réseau</dt>
                  <dd className="font-medium">{user.reseau_nom}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-gray-500">Dernière connexion</dt>
                <dd className="font-medium">
                  {user.last_login
                    ? format(new Date(user.last_login), 'dd/MM/yyyy à HH:mm', { locale: fr })
                    : 'Jamais'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Créé le</dt>
                <dd className="font-medium">
                  {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: fr })}
                </dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Actions</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Réinitialiser le mot de passe</p>
              <p className="text-sm text-gray-500">
                Générer un nouveau mot de passe temporaire
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowResetPasswordModal(true)}
            >
              <KeyIcon className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">
                {user.actif ? 'Désactiver' : 'Activer'} le compte
              </p>
              <p className="text-sm text-gray-500">
                {user.actif
                  ? 'L\'utilisateur ne pourra plus se connecter'
                  : 'Permettre à l\'utilisateur de se connecter'}
              </p>
            </div>
            <Button
              variant={user.actif ? 'outline' : 'success'}
              onClick={() => toggleActifMutation.mutate()}
              disabled={toggleActifMutation.isPending}
            >
              {user.actif ? 'Désactiver' : 'Activer'}
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
            <div>
              <p className="font-medium text-red-800">Supprimer le compte</p>
              <p className="text-sm text-red-600">
                Cette action est irréversible
              </p>
            </div>
            <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
              <TrashIcon className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reset Password Modal */}
      <Modal
        isOpen={showResetPasswordModal}
        onClose={() => {
          setShowResetPasswordModal(false);
          setTemporaryPassword(null);
        }}
        title="Réinitialiser le mot de passe"
      >
        {temporaryPassword ? (
          <div className="space-y-4">
            <Alert variant="success">
              Le mot de passe a été réinitialisé avec succès.
            </Alert>
            <div className="p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Nouveau mot de passe temporaire :</p>
              <p className="font-mono font-bold text-lg">{temporaryPassword}</p>
            </div>
            <Alert variant="warning">
              Communiquez ce mot de passe à l'utilisateur de manière sécurisée.
              Il devra le changer lors de sa prochaine connexion.
            </Alert>
          </div>
        ) : (
          <p className="text-gray-600">
            Un nouveau mot de passe temporaire sera généré pour {user.prenom} {user.nom}.
            L'utilisateur devra le changer lors de sa prochaine connexion.
          </p>
        )}
        <ModalFooter>
          <Button
            variant="ghost"
            onClick={() => {
              setShowResetPasswordModal(false);
              setTemporaryPassword(null);
            }}
          >
            {temporaryPassword ? 'Fermer' : 'Annuler'}
          </Button>
          {!temporaryPassword && (
            <Button
              onClick={() => resetPasswordMutation.mutate()}
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? 'Génération...' : 'Confirmer'}
            </Button>
          )}
        </ModalFooter>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Supprimer l'utilisateur"
      >
        <p className="text-gray-600">
          Êtes-vous sûr de vouloir supprimer le compte de{' '}
          <span className="font-medium">{user.prenom} {user.nom}</span> ?
        </p>
        <Alert variant="error" className="mt-4">
          Cette action est irréversible. Toutes les données associées seront perdues.
        </Alert>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
            Annuler
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
