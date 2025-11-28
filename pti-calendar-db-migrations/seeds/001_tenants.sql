-- ============================================
-- PTI Calendar V4 - Seeds: Tenants & Réseaux
-- ============================================

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TENANTS (SGS France - Multi-réseaux)
-- ============================================
INSERT INTO tenants (id, code, nom, status, config, subscription, created_at, updated_at) VALUES
-- Tenant principal SGS France
(
  '11111111-1111-1111-1111-111111111111',
  'SGS_FRANCE',
  'SGS France',
  'active',
  '{
    "timezone": "Europe/Paris",
    "locale": "fr-FR",
    "currency": "EUR",
    "surbooking_enabled": true,
    "taux_surbooking": 5,
    "rappel_j1_enabled": true,
    "rappel_h2_enabled": true,
    "paiement_en_ligne_enabled": true,
    "paiement_providers": ["stripe", "payzen"],
    "horaires_defaut": {
      "ouverture": "08:00",
      "fermeture": "18:00",
      "pause_debut": "12:00",
      "pause_fin": "14:00",
      "jours_ouvres": [1, 2, 3, 4, 5, 6]
    }
  }'::jsonb,
  '{
    "plan": "enterprise",
    "centres_max": 2000,
    "users_max": 10000,
    "expires_at": "2030-12-31T23:59:59Z"
  }'::jsonb,
  NOW(),
  NOW()
),
-- Tenant réseau Securitest
(
  '22222222-2222-2222-2222-222222222222',
  'SECURITEST',
  'Réseau Securitest',
  'active',
  '{
    "timezone": "Europe/Paris",
    "locale": "fr-FR",
    "currency": "EUR",
    "surbooking_enabled": true,
    "taux_surbooking": 3,
    "rappel_j1_enabled": true,
    "rappel_h2_enabled": true,
    "paiement_en_ligne_enabled": true,
    "paiement_providers": ["stripe"],
    "horaires_defaut": {
      "ouverture": "08:30",
      "fermeture": "18:30",
      "pause_debut": "12:30",
      "pause_fin": "14:00",
      "jours_ouvres": [1, 2, 3, 4, 5, 6]
    }
  }'::jsonb,
  '{
    "plan": "business",
    "centres_max": 500,
    "users_max": 2500,
    "expires_at": "2030-12-31T23:59:59Z"
  }'::jsonb,
  NOW(),
  NOW()
),
-- Tenant réseau Autovision
(
  '33333333-3333-3333-3333-333333333333',
  'AUTOVISION',
  'Réseau Autovision',
  'active',
  '{
    "timezone": "Europe/Paris",
    "locale": "fr-FR",
    "currency": "EUR",
    "surbooking_enabled": false,
    "taux_surbooking": 0,
    "rappel_j1_enabled": true,
    "rappel_h2_enabled": false,
    "paiement_en_ligne_enabled": true,
    "paiement_providers": ["stripe", "payzen"],
    "horaires_defaut": {
      "ouverture": "08:00",
      "fermeture": "19:00",
      "pause_debut": "12:00",
      "pause_fin": "13:30",
      "jours_ouvres": [1, 2, 3, 4, 5, 6]
    }
  }'::jsonb,
  '{
    "plan": "business",
    "centres_max": 300,
    "users_max": 1500,
    "expires_at": "2030-12-31T23:59:59Z"
  }'::jsonb,
  NOW(),
  NOW()
);

-- ============================================
-- RESEAUX (Groupes de centres)
-- ============================================
INSERT INTO reseaux (id, code, nom, marque, logo_url, config, created_at, updated_at) VALUES
(
  'aaaa1111-1111-1111-1111-111111111111',
  'SECURITEST',
  'Securitest',
  'Securitest - La sécurité en confiance',
  '/images/logos/securitest.png',
  '{
    "couleur_primaire": "#003C71",
    "couleur_secondaire": "#E30613",
    "email_support": "support@securitest.fr",
    "telephone_support": "0800 123 456"
  }'::jsonb,
  NOW(),
  NOW()
),
(
  'aaaa2222-2222-2222-2222-222222222222',
  'AUTOVISION',
  'Autovision',
  'Autovision - Le contrôle technique',
  '/images/logos/autovision.png',
  '{
    "couleur_primaire": "#00A651",
    "couleur_secondaire": "#FFD700",
    "email_support": "contact@autovision.fr",
    "telephone_support": "0800 789 012"
  }'::jsonb,
  NOW(),
  NOW()
),
(
  'aaaa3333-3333-3333-3333-333333333333',
  'DEKRA',
  'Dekra',
  'Dekra - Safety First',
  '/images/logos/dekra.png',
  '{
    "couleur_primaire": "#006747",
    "couleur_secondaire": "#FFFFFF",
    "email_support": "info@dekra.fr",
    "telephone_support": "0800 456 789"
  }'::jsonb,
  NOW(),
  NOW()
);

SELECT 'Seeds Tenants & Réseaux créés avec succès' AS status;
