-- ============================================
-- PTI Calendar V4 - Seeds: Roles & Permissions
-- ============================================

-- ============================================
-- PERMISSIONS
-- ============================================
INSERT INTO permissions (id, name, description, category, created_at) VALUES
-- RDV Permissions
(uuid_generate_v4(), 'rdv:create', 'Créer un RDV', 'rdv', NOW()),
(uuid_generate_v4(), 'rdv:read', 'Voir les RDV', 'rdv', NOW()),
(uuid_generate_v4(), 'rdv:update', 'Modifier un RDV', 'rdv', NOW()),
(uuid_generate_v4(), 'rdv:delete', 'Supprimer un RDV', 'rdv', NOW()),
(uuid_generate_v4(), 'rdv:confirm', 'Confirmer un RDV', 'rdv', NOW()),
(uuid_generate_v4(), 'rdv:cancel', 'Annuler un RDV', 'rdv', NOW()),
(uuid_generate_v4(), 'rdv:reschedule', 'Replanifier un RDV', 'rdv', NOW()),
(uuid_generate_v4(), 'rdv:start', 'Démarrer un contrôle', 'rdv', NOW()),
(uuid_generate_v4(), 'rdv:complete', 'Terminer un contrôle', 'rdv', NOW()),
(uuid_generate_v4(), 'rdv:export', 'Exporter les RDV', 'rdv', NOW()),

-- Planning Permissions
(uuid_generate_v4(), 'planning:read', 'Voir le planning', 'planning', NOW()),
(uuid_generate_v4(), 'planning:manage', 'Gérer le planning', 'planning', NOW()),
(uuid_generate_v4(), 'planning:block', 'Bloquer des créneaux', 'planning', NOW()),

-- Centre Permissions
(uuid_generate_v4(), 'centre:read', 'Voir les centres', 'centre', NOW()),
(uuid_generate_v4(), 'centre:create', 'Créer un centre', 'centre', NOW()),
(uuid_generate_v4(), 'centre:update', 'Modifier un centre', 'centre', NOW()),
(uuid_generate_v4(), 'centre:delete', 'Supprimer un centre', 'centre', NOW()),
(uuid_generate_v4(), 'centre:manage_controleurs', 'Gérer les contrôleurs', 'centre', NOW()),
(uuid_generate_v4(), 'centre:manage_tarifs', 'Gérer les tarifs', 'centre', NOW()),

-- User Permissions
(uuid_generate_v4(), 'user:read', 'Voir les utilisateurs', 'user', NOW()),
(uuid_generate_v4(), 'user:create', 'Créer un utilisateur', 'user', NOW()),
(uuid_generate_v4(), 'user:update', 'Modifier un utilisateur', 'user', NOW()),
(uuid_generate_v4(), 'user:delete', 'Supprimer un utilisateur', 'user', NOW()),
(uuid_generate_v4(), 'user:assign_roles', 'Assigner des rôles', 'user', NOW()),

-- Client Permissions
(uuid_generate_v4(), 'client:read', 'Voir les clients', 'client', NOW()),
(uuid_generate_v4(), 'client:create', 'Créer un client', 'client', NOW()),
(uuid_generate_v4(), 'client:update', 'Modifier un client', 'client', NOW()),
(uuid_generate_v4(), 'client:delete', 'Supprimer un client', 'client', NOW()),
(uuid_generate_v4(), 'client:search', 'Rechercher des clients', 'client', NOW()),

-- Payment Permissions
(uuid_generate_v4(), 'payment:read', 'Voir les paiements', 'payment', NOW()),
(uuid_generate_v4(), 'payment:process', 'Traiter un paiement', 'payment', NOW()),
(uuid_generate_v4(), 'payment:refund', 'Effectuer un remboursement', 'payment', NOW()),
(uuid_generate_v4(), 'payment:export', 'Exporter les paiements', 'payment', NOW()),

-- Report Permissions
(uuid_generate_v4(), 'report:read', 'Voir les rapports', 'report', NOW()),
(uuid_generate_v4(), 'report:create', 'Créer des rapports', 'report', NOW()),
(uuid_generate_v4(), 'report:export', 'Exporter les rapports', 'report', NOW()),

-- Admin Permissions
(uuid_generate_v4(), 'admin:tenant_manage', 'Gérer les tenants', 'admin', NOW()),
(uuid_generate_v4(), 'admin:reseau_manage', 'Gérer les réseaux', 'admin', NOW()),
(uuid_generate_v4(), 'admin:config', 'Configuration système', 'admin', NOW()),
(uuid_generate_v4(), 'admin:audit', 'Voir les logs d''audit', 'admin', NOW()),
(uuid_generate_v4(), 'admin:monitoring', 'Accès monitoring', 'admin', NOW()),

-- Notification Permissions
(uuid_generate_v4(), 'notification:read', 'Voir les notifications', 'notification', NOW()),
(uuid_generate_v4(), 'notification:send', 'Envoyer des notifications', 'notification', NOW()),
(uuid_generate_v4(), 'notification:manage', 'Gérer les templates', 'notification', NOW());

-- ============================================
-- ROLES
-- ============================================
INSERT INTO roles (id, name, description, level, created_at, updated_at) VALUES
(
  'role-super-admin',
  'SUPER_ADMIN',
  'Super administrateur SGS France - Accès total',
  0,
  NOW(),
  NOW()
),
(
  'role-admin-tenant',
  'ADMIN_TENANT',
  'Administrateur de tenant/réseau',
  1,
  NOW(),
  NOW()
),
(
  'role-admin-agence',
  'ADMIN_AGENCE',
  'Administrateur d''agence multi-centres',
  2,
  NOW(),
  NOW()
),
(
  'role-admin-ct',
  'ADMIN_CT',
  'Responsable de centre technique',
  3,
  NOW(),
  NOW()
),
(
  'role-controleur',
  'CONTROLEUR',
  'Contrôleur technique',
  4,
  NOW(),
  NOW()
),
(
  'role-call-center',
  'CALL_CENTER',
  'Agent call center',
  5,
  NOW(),
  NOW()
),
(
  'role-client',
  'CLIENT',
  'Client particulier ou professionnel',
  10,
  NOW(),
  NOW()
),
(
  'role-api-key',
  'API_KEY',
  'Clé API pour intégrations',
  99,
  NOW(),
  NOW()
);

-- ============================================
-- ROLE_PERMISSIONS (Associations)
-- ============================================

-- SUPER_ADMIN: Toutes les permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'role-super-admin', id FROM permissions;

-- ADMIN_TENANT: Gestion du réseau
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'role-admin-tenant', id FROM permissions
WHERE name NOT IN ('admin:tenant_manage', 'admin:monitoring');

-- ADMIN_AGENCE: Gestion multi-centres
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'role-admin-agence', id FROM permissions
WHERE category IN ('rdv', 'planning', 'centre', 'user', 'client', 'payment', 'report', 'notification')
  AND name NOT IN ('centre:delete', 'user:delete', 'admin:config');

-- ADMIN_CT: Gestion centre unique
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'role-admin-ct', id FROM permissions
WHERE name IN (
  'rdv:create', 'rdv:read', 'rdv:update', 'rdv:confirm', 'rdv:cancel', 'rdv:reschedule', 'rdv:start', 'rdv:complete', 'rdv:export',
  'planning:read', 'planning:manage', 'planning:block',
  'centre:read', 'centre:update', 'centre:manage_controleurs', 'centre:manage_tarifs',
  'user:read', 'user:create', 'user:update',
  'client:read', 'client:create', 'client:update', 'client:search',
  'payment:read', 'payment:process',
  'report:read', 'report:create', 'report:export',
  'notification:read', 'notification:send'
);

-- CONTROLEUR: Opérations quotidiennes
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'role-controleur', id FROM permissions
WHERE name IN (
  'rdv:read', 'rdv:start', 'rdv:complete',
  'planning:read',
  'client:read', 'client:search'
);

-- CALL_CENTER: Gestion RDV téléphoniques
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'role-call-center', id FROM permissions
WHERE name IN (
  'rdv:create', 'rdv:read', 'rdv:update', 'rdv:confirm', 'rdv:cancel', 'rdv:reschedule',
  'planning:read',
  'centre:read',
  'client:read', 'client:create', 'client:update', 'client:search',
  'notification:send'
);

-- CLIENT: Accès limité
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'role-client', id FROM permissions
WHERE name IN (
  'rdv:create', 'rdv:read', 'rdv:cancel', 'rdv:reschedule',
  'centre:read',
  'payment:read'
);

SELECT 'Seeds Roles & Permissions créés avec succès' AS status;
