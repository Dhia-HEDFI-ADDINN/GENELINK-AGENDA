-- ============================================
-- PTI Calendar V4 - Seeds: Centres
-- ============================================

-- ============================================
-- CENTRES SECURITEST (Tenant 2)
-- ============================================
INSERT INTO centres (id, tenant_id, reseau_id, code, nom, siret, status, adresse, contact, horaires, coordonnees, agrements, capacite_journaliere, nb_lignes, created_at, updated_at) VALUES
-- Paris 11ème
(
  'centre-paris-11',
  '22222222-2222-2222-2222-222222222222',
  'aaaa1111-1111-1111-1111-111111111111',
  'SEC-75011',
  'Securitest Paris 11',
  '12345678901234',
  'active',
  '{"rue": "45 Boulevard Voltaire", "complement": "", "code_postal": "75011", "ville": "Paris", "pays": "France"}'::jsonb,
  '{"telephone": "01 43 57 89 00", "email": "paris11@securitest.fr", "fax": "", "site_web": "https://securitest-paris11.fr"}'::jsonb,
  '{
    "lundi": {"ouverture": "08:00", "fermeture": "18:00", "pause_debut": "12:00", "pause_fin": "14:00", "ferme": false},
    "mardi": {"ouverture": "08:00", "fermeture": "18:00", "pause_debut": "12:00", "pause_fin": "14:00", "ferme": false},
    "mercredi": {"ouverture": "08:00", "fermeture": "18:00", "pause_debut": "12:00", "pause_fin": "14:00", "ferme": false},
    "jeudi": {"ouverture": "08:00", "fermeture": "18:00", "pause_debut": "12:00", "pause_fin": "14:00", "ferme": false},
    "vendredi": {"ouverture": "08:00", "fermeture": "18:00", "pause_debut": "12:00", "pause_fin": "14:00", "ferme": false},
    "samedi": {"ouverture": "08:00", "fermeture": "12:00", "ferme": false},
    "dimanche": {"ferme": true}
  }'::jsonb,
  '{"latitude": 48.8566, "longitude": 2.3784}'::jsonb,
  ARRAY['VL', 'L', 'GAZ']::varchar[],
  40,
  3,
  NOW(),
  NOW()
),
-- Paris 15ème
(
  'centre-paris-15',
  '22222222-2222-2222-2222-222222222222',
  'aaaa1111-1111-1111-1111-111111111111',
  'SEC-75015',
  'Securitest Paris 15',
  '12345678901235',
  'active',
  '{"rue": "123 Rue de Vaugirard", "complement": "", "code_postal": "75015", "ville": "Paris", "pays": "France"}'::jsonb,
  '{"telephone": "01 45 67 89 00", "email": "paris15@securitest.fr", "fax": "", "site_web": ""}'::jsonb,
  '{
    "lundi": {"ouverture": "08:30", "fermeture": "18:30", "pause_debut": "12:30", "pause_fin": "14:00", "ferme": false},
    "mardi": {"ouverture": "08:30", "fermeture": "18:30", "pause_debut": "12:30", "pause_fin": "14:00", "ferme": false},
    "mercredi": {"ouverture": "08:30", "fermeture": "18:30", "pause_debut": "12:30", "pause_fin": "14:00", "ferme": false},
    "jeudi": {"ouverture": "08:30", "fermeture": "18:30", "pause_debut": "12:30", "pause_fin": "14:00", "ferme": false},
    "vendredi": {"ouverture": "08:30", "fermeture": "18:30", "pause_debut": "12:30", "pause_fin": "14:00", "ferme": false},
    "samedi": {"ouverture": "09:00", "fermeture": "13:00", "ferme": false},
    "dimanche": {"ferme": true}
  }'::jsonb,
  '{"latitude": 48.8426, "longitude": 2.2985}'::jsonb,
  ARRAY['VL', 'GAZ', 'ELECTRIQUE']::varchar[],
  35,
  2,
  NOW(),
  NOW()
),
-- Lyon 3
(
  'centre-lyon-3',
  '22222222-2222-2222-2222-222222222222',
  'aaaa1111-1111-1111-1111-111111111111',
  'SEC-69003',
  'Securitest Lyon Part-Dieu',
  '12345678901236',
  'active',
  '{"rue": "78 Rue Garibaldi", "complement": "", "code_postal": "69003", "ville": "Lyon", "pays": "France"}'::jsonb,
  '{"telephone": "04 78 12 34 56", "email": "lyon3@securitest.fr", "fax": "", "site_web": ""}'::jsonb,
  '{
    "lundi": {"ouverture": "08:00", "fermeture": "18:00", "pause_debut": "12:00", "pause_fin": "14:00", "ferme": false},
    "mardi": {"ouverture": "08:00", "fermeture": "18:00", "pause_debut": "12:00", "pause_fin": "14:00", "ferme": false},
    "mercredi": {"ouverture": "08:00", "fermeture": "18:00", "pause_debut": "12:00", "pause_fin": "14:00", "ferme": false},
    "jeudi": {"ouverture": "08:00", "fermeture": "18:00", "pause_debut": "12:00", "pause_fin": "14:00", "ferme": false},
    "vendredi": {"ouverture": "08:00", "fermeture": "18:00", "pause_debut": "12:00", "pause_fin": "14:00", "ferme": false},
    "samedi": {"ouverture": "08:00", "fermeture": "12:00", "ferme": false},
    "dimanche": {"ferme": true}
  }'::jsonb,
  '{"latitude": 45.7607, "longitude": 4.8599}'::jsonb,
  ARRAY['VL', 'L', 'PL', 'GAZ']::varchar[],
  45,
  4,
  NOW(),
  NOW()
),
-- Toulouse
(
  'centre-toulouse-01',
  '22222222-2222-2222-2222-222222222222',
  'aaaa1111-1111-1111-1111-111111111111',
  'SEC-31000',
  'Securitest Toulouse Centre',
  '12345678901237',
  'active',
  '{"rue": "56 Avenue Jean Jaurès", "complement": "", "code_postal": "31000", "ville": "Toulouse", "pays": "France"}'::jsonb,
  '{"telephone": "05 61 12 34 56", "email": "toulouse@securitest.fr", "fax": "", "site_web": ""}'::jsonb,
  '{
    "lundi": {"ouverture": "08:30", "fermeture": "18:00", "pause_debut": "12:00", "pause_fin": "14:00", "ferme": false},
    "mardi": {"ouverture": "08:30", "fermeture": "18:00", "pause_debut": "12:00", "pause_fin": "14:00", "ferme": false},
    "mercredi": {"ouverture": "08:30", "fermeture": "18:00", "pause_debut": "12:00", "pause_fin": "14:00", "ferme": false},
    "jeudi": {"ouverture": "08:30", "fermeture": "18:00", "pause_debut": "12:00", "pause_fin": "14:00", "ferme": false},
    "vendredi": {"ouverture": "08:30", "fermeture": "18:00", "pause_debut": "12:00", "pause_fin": "14:00", "ferme": false},
    "samedi": {"ferme": true},
    "dimanche": {"ferme": true}
  }'::jsonb,
  '{"latitude": 43.6047, "longitude": 1.4442}'::jsonb,
  ARRAY['VL', 'L']::varchar[],
  30,
  2,
  NOW(),
  NOW()
);

-- ============================================
-- CENTRES AUTOVISION (Tenant 3)
-- ============================================
INSERT INTO centres (id, tenant_id, reseau_id, code, nom, siret, status, adresse, contact, horaires, coordonnees, agrements, capacite_journaliere, nb_lignes, created_at, updated_at) VALUES
-- Marseille
(
  'centre-marseille-01',
  '33333333-3333-3333-3333-333333333333',
  'aaaa2222-2222-2222-2222-222222222222',
  'AV-13001',
  'Autovision Marseille Vieux-Port',
  '98765432101234',
  'active',
  '{"rue": "89 La Canebière", "complement": "", "code_postal": "13001", "ville": "Marseille", "pays": "France"}'::jsonb,
  '{"telephone": "04 91 12 34 56", "email": "marseille@autovision.fr", "fax": "", "site_web": "https://autovision-marseille.fr"}'::jsonb,
  '{
    "lundi": {"ouverture": "08:00", "fermeture": "19:00", "pause_debut": "12:00", "pause_fin": "13:30", "ferme": false},
    "mardi": {"ouverture": "08:00", "fermeture": "19:00", "pause_debut": "12:00", "pause_fin": "13:30", "ferme": false},
    "mercredi": {"ouverture": "08:00", "fermeture": "19:00", "pause_debut": "12:00", "pause_fin": "13:30", "ferme": false},
    "jeudi": {"ouverture": "08:00", "fermeture": "19:00", "pause_debut": "12:00", "pause_fin": "13:30", "ferme": false},
    "vendredi": {"ouverture": "08:00", "fermeture": "19:00", "pause_debut": "12:00", "pause_fin": "13:30", "ferme": false},
    "samedi": {"ouverture": "09:00", "fermeture": "17:00", "ferme": false},
    "dimanche": {"ferme": true}
  }'::jsonb,
  '{"latitude": 43.2965, "longitude": 5.3698}'::jsonb,
  ARRAY['VL', 'L', 'PL', 'GAZ', 'ELECTRIQUE']::varchar[],
  50,
  4,
  NOW(),
  NOW()
),
-- Nice
(
  'centre-nice-01',
  '33333333-3333-3333-3333-333333333333',
  'aaaa2222-2222-2222-2222-222222222222',
  'AV-06000',
  'Autovision Nice Promenade',
  '98765432101235',
  'active',
  '{"rue": "234 Promenade des Anglais", "complement": "", "code_postal": "06000", "ville": "Nice", "pays": "France"}'::jsonb,
  '{"telephone": "04 93 12 34 56", "email": "nice@autovision.fr", "fax": "", "site_web": ""}'::jsonb,
  '{
    "lundi": {"ouverture": "08:00", "fermeture": "18:30", "pause_debut": "12:00", "pause_fin": "14:00", "ferme": false},
    "mardi": {"ouverture": "08:00", "fermeture": "18:30", "pause_debut": "12:00", "pause_fin": "14:00", "ferme": false},
    "mercredi": {"ouverture": "08:00", "fermeture": "18:30", "pause_debut": "12:00", "pause_fin": "14:00", "ferme": false},
    "jeudi": {"ouverture": "08:00", "fermeture": "18:30", "pause_debut": "12:00", "pause_fin": "14:00", "ferme": false},
    "vendredi": {"ouverture": "08:00", "fermeture": "18:30", "pause_debut": "12:00", "pause_fin": "14:00", "ferme": false},
    "samedi": {"ouverture": "09:00", "fermeture": "13:00", "ferme": false},
    "dimanche": {"ferme": true}
  }'::jsonb,
  '{"latitude": 43.7102, "longitude": 7.2620}'::jsonb,
  ARRAY['VL', 'L']::varchar[],
  35,
  3,
  NOW(),
  NOW()
),
-- Bordeaux
(
  'centre-bordeaux-01',
  '33333333-3333-3333-3333-333333333333',
  'aaaa2222-2222-2222-2222-222222222222',
  'AV-33000',
  'Autovision Bordeaux Lac',
  '98765432101236',
  'active',
  '{"rue": "67 Rue du Lac", "complement": "Zone Commerciale", "code_postal": "33000", "ville": "Bordeaux", "pays": "France"}'::jsonb,
  '{"telephone": "05 56 12 34 56", "email": "bordeaux@autovision.fr", "fax": "", "site_web": ""}'::jsonb,
  '{
    "lundi": {"ouverture": "08:00", "fermeture": "18:00", "pause_debut": "12:00", "pause_fin": "14:00", "ferme": false},
    "mardi": {"ouverture": "08:00", "fermeture": "18:00", "pause_debut": "12:00", "pause_fin": "14:00", "ferme": false},
    "mercredi": {"ouverture": "08:00", "fermeture": "18:00", "pause_debut": "12:00", "pause_fin": "14:00", "ferme": false},
    "jeudi": {"ouverture": "08:00", "fermeture": "18:00", "pause_debut": "12:00", "pause_fin": "14:00", "ferme": false},
    "vendredi": {"ouverture": "08:00", "fermeture": "18:00", "pause_debut": "12:00", "pause_fin": "14:00", "ferme": false},
    "samedi": {"ouverture": "09:00", "fermeture": "12:00", "ferme": false},
    "dimanche": {"ferme": true}
  }'::jsonb,
  '{"latitude": 44.8378, "longitude": -0.5792}'::jsonb,
  ARRAY['VL', 'PL', 'GAZ']::varchar[],
  40,
  3,
  NOW(),
  NOW()
);

-- ============================================
-- TARIFS PAR CENTRE
-- ============================================
INSERT INTO tarifs (id, centre_id, type_controle, type_vehicule, carburant, prix_ht, taux_tva, actif, created_at) VALUES
-- Tarifs Paris 11
(uuid_generate_v4(), 'centre-paris-11', 'CTP', 'VL', NULL, 6250, 20.0, true, NOW()),
(uuid_generate_v4(), 'centre-paris-11', 'CTP', 'VU', NULL, 7083, 20.0, true, NOW()),
(uuid_generate_v4(), 'centre-paris-11', 'CTP', 'L', NULL, 3750, 20.0, true, NOW()),
(uuid_generate_v4(), 'centre-paris-11', 'CVP', 'VL', NULL, 2917, 20.0, true, NOW()),
(uuid_generate_v4(), 'centre-paris-11', 'CVP', 'VU', NULL, 3333, 20.0, true, NOW()),
(uuid_generate_v4(), 'centre-paris-11', 'CV', 'VL', NULL, 2500, 20.0, true, NOW()),

-- Tarifs Lyon 3
(uuid_generate_v4(), 'centre-lyon-3', 'CTP', 'VL', NULL, 5833, 20.0, true, NOW()),
(uuid_generate_v4(), 'centre-lyon-3', 'CTP', 'VU', NULL, 6667, 20.0, true, NOW()),
(uuid_generate_v4(), 'centre-lyon-3', 'CTP', 'PL', NULL, 10000, 20.0, true, NOW()),
(uuid_generate_v4(), 'centre-lyon-3', 'CVP', 'VL', NULL, 2750, 20.0, true, NOW()),
(uuid_generate_v4(), 'centre-lyon-3', 'CV', 'VL', NULL, 2333, 20.0, true, NOW()),

-- Tarifs Marseille
(uuid_generate_v4(), 'centre-marseille-01', 'CTP', 'VL', NULL, 5417, 20.0, true, NOW()),
(uuid_generate_v4(), 'centre-marseille-01', 'CTP', 'VU', NULL, 6250, 20.0, true, NOW()),
(uuid_generate_v4(), 'centre-marseille-01', 'CTP', 'PL', NULL, 9583, 20.0, true, NOW()),
(uuid_generate_v4(), 'centre-marseille-01', 'CVP', 'VL', NULL, 2500, 20.0, true, NOW()),
(uuid_generate_v4(), 'centre-marseille-01', 'CV', 'VL', NULL, 2083, 20.0, true, NOW());

SELECT 'Seeds Centres & Tarifs créés avec succès' AS status;
