-- ============================================
-- PTI Calendar V4 - Seeds: Users
-- ============================================
-- Mot de passe par défaut: password123 (bcrypt hash)
-- Hash: $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4wVWZlYVFkQvCVuO

-- ============================================
-- SUPER ADMINS SGS France
-- ============================================
INSERT INTO users (id, tenant_id, email, password_hash, nom, prenom, telephone, roles, permissions, centre_ids, actif, email_verified, created_at, updated_at) VALUES
(
  'user-admin-sgs-001',
  '11111111-1111-1111-1111-111111111111',
  'admin@sgs-france.fr',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4wVWZlYVFkQvCVuO',
  'Dupont',
  'Jean-Pierre',
  '0601020304',
  ARRAY['SUPER_ADMIN'],
  ARRAY[]::varchar[],
  ARRAY[]::uuid[],
  true,
  true,
  NOW(),
  NOW()
),
(
  'user-admin-sgs-002',
  '11111111-1111-1111-1111-111111111111',
  'superviseur@sgs-france.fr',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4wVWZlYVFkQvCVuO',
  'Martin',
  'Sophie',
  '0601020305',
  ARRAY['SUPER_ADMIN'],
  ARRAY[]::varchar[],
  ARRAY[]::uuid[],
  true,
  true,
  NOW(),
  NOW()
);

-- ============================================
-- ADMINS TENANT/RESEAU
-- ============================================
INSERT INTO users (id, tenant_id, email, password_hash, nom, prenom, telephone, roles, permissions, centre_ids, actif, email_verified, created_at, updated_at) VALUES
-- Admin Securitest
(
  'user-admin-securitest',
  '22222222-2222-2222-2222-222222222222',
  'admin@securitest.fr',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4wVWZlYVFkQvCVuO',
  'Bernard',
  'Michel',
  '0601020306',
  ARRAY['ADMIN_TENANT'],
  ARRAY[]::varchar[],
  ARRAY[]::uuid[],
  true,
  true,
  NOW(),
  NOW()
),
-- Admin Autovision
(
  'user-admin-autovision',
  '33333333-3333-3333-3333-333333333333',
  'admin@autovision.fr',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4wVWZlYVFkQvCVuO',
  'Dubois',
  'Catherine',
  '0601020307',
  ARRAY['ADMIN_TENANT'],
  ARRAY[]::varchar[],
  ARRAY[]::uuid[],
  true,
  true,
  NOW(),
  NOW()
);

-- ============================================
-- RESPONSABLES DE CENTRES (ADMIN_CT)
-- ============================================
INSERT INTO users (id, tenant_id, email, password_hash, nom, prenom, telephone, roles, permissions, centre_ids, actif, email_verified, created_at, updated_at) VALUES
-- Centre Paris 11
(
  'user-resp-paris11',
  '22222222-2222-2222-2222-222222222222',
  'responsable.paris11@securitest.fr',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4wVWZlYVFkQvCVuO',
  'Leroy',
  'Philippe',
  '0601020308',
  ARRAY['ADMIN_CT'],
  ARRAY[]::varchar[],
  ARRAY['centre-paris-11']::uuid[],
  true,
  true,
  NOW(),
  NOW()
),
-- Centre Lyon 3
(
  'user-resp-lyon3',
  '22222222-2222-2222-2222-222222222222',
  'responsable.lyon3@securitest.fr',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4wVWZlYVFkQvCVuO',
  'Moreau',
  'Isabelle',
  '0601020309',
  ARRAY['ADMIN_CT'],
  ARRAY[]::varchar[],
  ARRAY['centre-lyon-3']::uuid[],
  true,
  true,
  NOW(),
  NOW()
),
-- Centre Marseille
(
  'user-resp-marseille',
  '33333333-3333-3333-3333-333333333333',
  'responsable.marseille@autovision.fr',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4wVWZlYVFkQvCVuO',
  'Petit',
  'Laurent',
  '0601020310',
  ARRAY['ADMIN_CT'],
  ARRAY[]::varchar[],
  ARRAY['centre-marseille-01']::uuid[],
  true,
  true,
  NOW(),
  NOW()
);

-- ============================================
-- CONTROLEURS
-- ============================================
INSERT INTO users (id, tenant_id, email, password_hash, nom, prenom, telephone, roles, permissions, centre_ids, actif, email_verified, created_at, updated_at) VALUES
-- Contrôleurs Paris 11
(
  'user-ctrl-paris11-001',
  '22222222-2222-2222-2222-222222222222',
  'controleur1.paris11@securitest.fr',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4wVWZlYVFkQvCVuO',
  'Durand',
  'Pierre',
  '0601020311',
  ARRAY['CONTROLEUR'],
  ARRAY[]::varchar[],
  ARRAY['centre-paris-11']::uuid[],
  true,
  true,
  NOW(),
  NOW()
),
(
  'user-ctrl-paris11-002',
  '22222222-2222-2222-2222-222222222222',
  'controleur2.paris11@securitest.fr',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4wVWZlYVFkQvCVuO',
  'Rousseau',
  'Marie',
  '0601020312',
  ARRAY['CONTROLEUR'],
  ARRAY[]::varchar[],
  ARRAY['centre-paris-11']::uuid[],
  true,
  true,
  NOW(),
  NOW()
),
(
  'user-ctrl-paris11-003',
  '22222222-2222-2222-2222-222222222222',
  'controleur3.paris11@securitest.fr',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4wVWZlYVFkQvCVuO',
  'Lefebvre',
  'Thomas',
  '0601020313',
  ARRAY['CONTROLEUR'],
  ARRAY[]::varchar[],
  ARRAY['centre-paris-11']::uuid[],
  true,
  true,
  NOW(),
  NOW()
),
-- Contrôleurs Lyon 3
(
  'user-ctrl-lyon3-001',
  '22222222-2222-2222-2222-222222222222',
  'controleur1.lyon3@securitest.fr',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4wVWZlYVFkQvCVuO',
  'Garcia',
  'Antoine',
  '0601020314',
  ARRAY['CONTROLEUR'],
  ARRAY[]::varchar[],
  ARRAY['centre-lyon-3']::uuid[],
  true,
  true,
  NOW(),
  NOW()
),
(
  'user-ctrl-lyon3-002',
  '22222222-2222-2222-2222-222222222222',
  'controleur2.lyon3@securitest.fr',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4wVWZlYVFkQvCVuO',
  'Martinez',
  'Julie',
  '0601020315',
  ARRAY['CONTROLEUR'],
  ARRAY[]::varchar[],
  ARRAY['centre-lyon-3']::uuid[],
  true,
  true,
  NOW(),
  NOW()
),
-- Contrôleurs Marseille
(
  'user-ctrl-marseille-001',
  '33333333-3333-3333-3333-333333333333',
  'controleur1.marseille@autovision.fr',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4wVWZlYVFkQvCVuO',
  'Lopez',
  'Nicolas',
  '0601020316',
  ARRAY['CONTROLEUR'],
  ARRAY[]::varchar[],
  ARRAY['centre-marseille-01']::uuid[],
  true,
  true,
  NOW(),
  NOW()
),
(
  'user-ctrl-marseille-002',
  '33333333-3333-3333-3333-333333333333',
  'controleur2.marseille@autovision.fr',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4wVWZlYVFkQvCVuO',
  'Sanchez',
  'Emma',
  '0601020317',
  ARRAY['CONTROLEUR'],
  ARRAY[]::varchar[],
  ARRAY['centre-marseille-01']::uuid[],
  true,
  true,
  NOW(),
  NOW()
);

-- ============================================
-- AGENTS CALL CENTER
-- ============================================
INSERT INTO users (id, tenant_id, email, password_hash, nom, prenom, telephone, roles, permissions, centre_ids, actif, email_verified, created_at, updated_at) VALUES
(
  'user-cc-001',
  '11111111-1111-1111-1111-111111111111',
  'agent1@callcenter.sgs.fr',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4wVWZlYVFkQvCVuO',
  'Blanc',
  'Lucie',
  '0601020318',
  ARRAY['CALL_CENTER'],
  ARRAY[]::varchar[],
  ARRAY[]::uuid[],
  true,
  true,
  NOW(),
  NOW()
),
(
  'user-cc-002',
  '11111111-1111-1111-1111-111111111111',
  'agent2@callcenter.sgs.fr',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4wVWZlYVFkQvCVuO',
  'Noir',
  'David',
  '0601020319',
  ARRAY['CALL_CENTER'],
  ARRAY[]::varchar[],
  ARRAY[]::uuid[],
  true,
  true,
  NOW(),
  NOW()
),
(
  'user-cc-003',
  '11111111-1111-1111-1111-111111111111',
  'agent3@callcenter.sgs.fr',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4wVWZlYVFkQvCVuO',
  'Vert',
  'Sarah',
  '0601020320',
  ARRAY['CALL_CENTER'],
  ARRAY[]::varchar[],
  ARRAY[]::uuid[],
  true,
  true,
  NOW(),
  NOW()
);

-- ============================================
-- CLIENTS TEST
-- ============================================
INSERT INTO users (id, tenant_id, email, password_hash, nom, prenom, telephone, roles, permissions, centre_ids, actif, email_verified, created_at, updated_at) VALUES
(
  'user-client-001',
  '22222222-2222-2222-2222-222222222222',
  'client.test@gmail.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4wVWZlYVFkQvCVuO',
  'Testeur',
  'Jean',
  '0612345678',
  ARRAY['CLIENT'],
  ARRAY[]::varchar[],
  ARRAY[]::uuid[],
  true,
  true,
  NOW(),
  NOW()
),
(
  'user-client-002',
  '22222222-2222-2222-2222-222222222222',
  'marie.dupont@email.fr',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4wVWZlYVFkQvCVuO',
  'Dupont',
  'Marie',
  '0623456789',
  ARRAY['CLIENT'],
  ARRAY[]::varchar[],
  ARRAY[]::uuid[],
  true,
  true,
  NOW(),
  NOW()
),
(
  'user-client-003',
  '33333333-3333-3333-3333-333333333333',
  'entreprise@societe.fr',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4wVWZlYVFkQvCVuO',
  'Entreprise',
  'SAS',
  '0634567890',
  ARRAY['CLIENT'],
  ARRAY[]::varchar[],
  ARRAY[]::uuid[],
  true,
  true,
  NOW(),
  NOW()
);

-- ============================================
-- USER_ROLES (Associations table)
-- ============================================
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE
  (u.roles @> ARRAY[r.name])
ON CONFLICT DO NOTHING;

SELECT 'Seeds Users créés avec succès' AS status;
