# USE CASES MÉTIER EXHAUSTIFS
## PTI CALENDAR SOLUTION - SGS France

**Document Complet : 60+ Scénarios Métier Détaillés**

Version : 1.0  
Date : Novembre 2024  
Auteur : NEXIUS/ADDINN Group  
Client : SGS France

---

## 📋 TABLE DES MATIÈRES

### PARTIE 1 : VUE D'ENSEMBLE
1.1. Introduction & Contexte Métier  
1.2. Acteurs du Système  
1.3. Nomenclature Use Cases  
1.4. Matrice de Traçabilité  

### PARTIE 2 : USE CASES GESTION PLANNING (12 UC)
UC-PLAN-001 : Visualiser Planning Journalier  
UC-PLAN-002 : Calculer Disponibilités Temps Réel  
UC-PLAN-003 : Modifier Planning Contrôleur  
UC-PLAN-004 : Bloquer Créneaux (Absence, Maintenance)  
UC-PLAN-005 : Gérer Capacité Journalière  
UC-PLAN-006 : Configurer Horaires Centre  
UC-PLAN-007 : Gérer Jours Fériés  
UC-PLAN-008 : Dupliquer Planning Semaine  
UC-PLAN-009 : Affectation Automatique Contrôleur (IA)  
UC-PLAN-010 : Gérer Surbooking  
UC-PLAN-011 : Vue Planning Hebdomadaire  
UC-PLAN-012 : Optimiser Planning (IA)  

### PARTIE 3 : USE CASES PRISE RDV (18 UC)
UC-RDV-001 : Prendre RDV Client Particulier (Web)  
UC-RDV-002 : Prendre RDV Walk-In (Sans RDV)  
UC-RDV-003 : Prendre RDV Client Pro (Flotte)  
UC-RDV-004 : Prendre RDV Call Center  
UC-RDV-005 : Rechercher Créneaux Disponibles  
UC-RDV-006 : Suggestion Créneaux IA  
UC-RDV-007 : Sélectionner Centre par Géolocalisation  
UC-RDV-008 : Saisie Immatriculation Auto-Complete  
UC-RDV-009 : Calculer Durée Contrôle (Matrices)  
UC-RDV-010 : Sélectionner Type Contrôle  
UC-RDV-011 : Validation Cohérence Véhicule/Contrôle  
UC-RDV-012 : Création Client/Véhicule Automatique  
UC-RDV-013 : RDV Récurrent (Client Pro)  
UC-RDV-014 : RDV Multi-Véhicules (Client Pro)  
UC-RDV-015 : RDV Contre-Visite Offerte  
UC-RDV-016 : RDV Dépôt Véhicule (Sans heure précise)  
UC-RDV-017 : Confirmation RDV (Email + SMS)  
UC-RDV-018 : Générer QR Code RDV  

### PARTIE 4 : USE CASES GESTION RDV (12 UC)
UC-GRDV-001 : Consulter Détail RDV  
UC-GRDV-002 : Modifier RDV (Date/Heure)  
UC-GRDV-003 : Annuler RDV  
UC-GRDV-004 : Reprogrammer RDV  
UC-GRDV-005 : Marquer Client Absent  
UC-GRDV-006 : Démarrer Contrôle (Sync AdelSoft)  
UC-GRDV-007 : Terminer Contrôle (Résultat)  
UC-GRDV-008 : Historique RDV Client  
UC-GRDV-009 : Recherche RDV Multi-Critères  
UC-GRDV-010 : Liste Attente (Si Surbooking)  
UC-GRDV-011 : Drag & Drop RDV (Réorganisation)  
UC-GRDV-012 : Commentaires/Notes RDV  

### PARTIE 5 : USE CASES PAIEMENT (8 UC)
UC-PAY-001 : Paiement En Ligne Payzen  
UC-PAY-002 : Paiement En Ligne Lemonway  
UC-PAY-003 : Paiement Sur Place (Centre)  
UC-PAY-004 : Remboursement Client  
UC-PAY-005 : Gestion Échec Paiement  
UC-PAY-006 : Facturation Automatique  
UC-PAY-007 : Réconciliation Comptable  
UC-PAY-008 : Exports Comptables  

### PARTIE 6 : USE CASES NOTIFICATIONS (7 UC)
UC-NOTIF-001 : Email Confirmation RDV  
UC-NOTIF-002 : SMS Confirmation RDV  
UC-NOTIF-003 : Rappel J-1 Automatique  
UC-NOTIF-004 : Notification Modification RDV  
UC-NOTIF-005 : Notification Annulation  
UC-NOTIF-006 : Notification Résultat Contrôle  
UC-NOTIF-007 : Push Notifications Mobile  

### PARTIE 7 : USE CASES ADMINISTRATION MULTI-TENANT (15 UC)
UC-ADMIN-001 : Créer Tenant (Générateur)  
UC-ADMIN-002 : Lister Tous Tenants (Dashboard Global)  
UC-ADMIN-003 : Suspendre/Activer Tenant  
UC-ADMIN-004 : Supprimer Tenant (Purge Données)  
UC-ADMIN-005 : Modifier Configuration Tenant  
UC-ADMIN-006 : Créer Réseau (SECURITEST, etc.)  
UC-ADMIN-007 : Affecter Centre à Réseau  
UC-ADMIN-008 : Gérer Admin Réseau  
UC-ADMIN-009 : Supervision Multi-Centres (Carte)  
UC-ADMIN-010 : Alertes Critiques Globales  
UC-ADMIN-011 : Analytics Cross-Centres  
UC-ADMIN-012 : Configuration Globale (Templates)  
UC-ADMIN-013 : Gestion Utilisateurs Global  
UC-ADMIN-014 : Audit Logs Global  
UC-ADMIN-015 : Migration Données Tenant  

### PARTIE 8 : USE CASES INTÉGRATIONS (6 UC)
UC-INT-001 : Synchronisation AdelSoft  
UC-INT-002 : Import Référentiel SIR  
UC-INT-003 : Webhook Paiement Payzen  
UC-INT-004 : Webhook Paiement Lemonway  
UC-INT-005 : Envoi Brevo (Email)  
UC-INT-006 : Envoi SMS Mode  

### PARTIE 9 : USE CASES MODE OFFLINE (5 UC)
UC-OFF-001 : Détection Perte Connexion  
UC-OFF-002 : Création RDV Offline (Queue)  
UC-OFF-003 : Consultation Planning Cached  
UC-OFF-004 : Synchronisation Automatique  
UC-OFF-005 : Résolution Conflits  

### PARTIE 10 : USE CASES REPORTING (6 UC)
UC-REP-001 : Dashboard Centre (KPIs)  
UC-REP-002 : Statistiques Journalières  
UC-REP-003 : Export Excel RDV  
UC-REP-004 : Rapport Activité Mensuel  
UC-REP-005 : Analytics Contrôleur  
UC-REP-006 : Reporting Power BI  

---

## PARTIE 1 : VUE D'ENSEMBLE

### 1.1. Introduction & Contexte Métier

**CONTEXTE GÉNÉRAL :**

SGS France, leader du contrôle technique automobile en France, gère un réseau de près de **2 000 centres de contrôle technique** sous les marques SECURITEST, AUTO SÉCURITÉ et Vérif'Auto.

L'outil Agenda GENILINK actuel permet la prise de rendez-vous et la gestion des plannings des contrôleurs, traitant plus de **7 millions de RDV par an** avec **10 000 à 15 000 connexions quotidiennes**.

Ce document décrit exhaustivement **tous les cas d'usage métier** de la future plateforme PTI CALENDAR SOLUTION, qui viendra remplacer l'outil actuel obsolète.

**OBJECTIFS MÉTIER :**

1. **Simplifier** la prise de RDV pour les clients (particuliers et professionnels)
2. **Optimiser** les plannings des centres (IA, affectation intelligente)
3. **Augmenter** le taux de remplissage des centres
4. **Réduire** les absences clients (rappels automatiques)
5. **Moderniser** l'expérience utilisateur (design UX fluide)
6. **Garantir** la continuité de service (mode offline)
7. **Faciliter** l'administration multi-centres (2000+ centres)

---

### 1.2. Acteurs du Système

```
┌────────────────────────────────────────────────────────────────┐
│                    ACTEURS PRINCIPAUX                          │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. SUPER ADMIN SGS                                            │
│     └─ Rôle : Administration globale plateforme                │
│     └─ Accès : Tous tenants, tous centres                      │
│     └─ Actions : Créer tenants, supervision, configuration     │
│                                                                 │
│  2. ADMIN RÉSEAU (SECURITEST, AUTO SÉCURITÉ)                  │
│     └─ Rôle : Administration réseau de centres                 │
│     └─ Accès : Centres de son réseau uniquement                │
│     └─ Actions : Gestion centres, reporting réseau             │
│                                                                 │
│  3. RESPONSABLE CENTRE                                         │
│     └─ Rôle : Gestion quotidienne du centre                    │
│     └─ Accès : Son centre uniquement (single-tenant)           │
│     └─ Actions : Planning, RDV, contrôleurs, stats             │
│                                                                 │
│  4. CONTRÔLEUR CT                                              │
│     └─ Rôle : Réalisation contrôles techniques                 │
│     └─ Accès : Son planning uniquement                         │
│     └─ Actions : Consultation agenda, prise RDV walk-in        │
│                                                                 │
│  5. CLIENT PARTICULIER                                         │
│     └─ Rôle : Propriétaire véhicule                            │
│     └─ Accès : Prise RDV publique (sans compte)                │
│     └─ Actions : Prendre RDV, modifier, annuler                │
│                                                                 │
│  6. CLIENT PROFESSIONNEL                                       │
│     └─ Rôle : Gestionnaire flotte véhicules                    │
│     └─ Accès : Espace pro dédié (avec compte)                  │
│     └─ Actions : Gestion flotte, RDV multi-véhicules           │
│                                                                 │
│  7. OPÉRATEUR CALL CENTER                                      │
│     └─ Rôle : Assistance téléphonique clients                  │
│     └─ Accès : Interface simplifiée multi-centres              │
│     └─ Actions : Prise RDV rapide, recherche                   │
│                                                                 │
│  8. SYSTÈME (Acteur technique)                                 │
│     └─ Rôle : Automatisations & intégrations                   │
│     └─ Actions : Calculs IA, sync AdelSoft, notifications      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 1.3. Nomenclature Use Cases

**FORMAT :** `UC-[DOMAINE]-[NUMÉRO]`

**DOMAINES :**
- **PLAN** : Gestion Planning & Disponibilités
- **RDV** : Prise de Rendez-Vous
- **GRDV** : Gestion des RDV (modification, annulation)
- **PAY** : Paiement
- **NOTIF** : Notifications
- **ADMIN** : Administration Multi-Tenant
- **INT** : Intégrations Systèmes Tiers
- **OFF** : Mode Offline
- **REP** : Reporting & Analytics

**PRIORITÉS :**
- 🔴 **P0 (Critique)** : Fonctionnalité bloquante pour MVP
- 🟠 **P1 (Haute)** : Fonctionnalité importante pour Go-Live
- 🟡 **P2 (Moyenne)** : Fonctionnalité utile mais non bloquante
- 🟢 **P3 (Basse)** : Nice-to-have, peut être différé

---

## PARTIE 2 : USE CASES GESTION PLANNING

### UC-PLAN-001 : Visualiser Planning Journalier

**PRIORITÉ :** 🔴 P0 (Critique)  
**ACTEURS :** Contrôleur, Responsable Centre  
**OBJECTIF :** Consulter le planning du jour avec tous les RDV et créneaux  
**FRÉQUENCE :** Très haute (100+ fois/jour/centre)  

**PRÉCONDITIONS :**
- Utilisateur authentifié avec rôle Contrôleur ou Responsable
- Centre actif
- Date de consultation valide

**DONNÉES ENTRÉE :**
- `centre_id` : UUID du centre
- `date` : Date consultation (default = aujourd'hui)
- `view_mode` : "journee" ou "semaine"

**SCÉNARIO NOMINAL :**

```
1. L'utilisateur accède à l'interface Agenda
   └─ URL : /agenda?date=2026-06-17

2. Le système affiche l'entête avec :
   └─ Logo SGS/SECURITEST
   └─ Identifiant centre "S072001 - ACO SÉCURITÉ - LE MANS"
   └─ Bouton menu hamburger
   └─ Champ recherche RDV
   └─ Icône notifications (badge rouge si nouvelles)
   └─ Icône guide utilisateur

3. Le système affiche la barre de contrôle :
   └─ Bouton "RDV Pro" (vert)
   └─ Bouton "Type RDV / Durée" (jaune)
   └─ Bouton "OK"
   └─ Bouton "Options affichage" (personnalisation)
   └─ Bouton "Aujourd'hui" (retour date du jour)
   └─ Sélecteur date avec calendrier popup
   └─ Flèches navigation < >
   └─ Bouton impression
   └─ Indicateurs connexions utilisateurs (ex: "👥 3")
   └─ Indicateurs taux remplissage

4. Le système charge les données :
   a. Requête API GET /api/v1/planning/rdv
      └─ Paramètres : centre_id, date
   
   b. Vérification cache Redis :
      └─ Key : planning:{centre_id}:{date}
      └─ Si cache hit : retour immédiat (< 50ms)
      └─ Si cache miss : query PostgreSQL + mise en cache

   c. Query PostgreSQL avec RLS :
      └─ SET LOCAL app.tenant_id = '{tenant_id}';
      └─ SELECT * FROM rdv 
          WHERE centre_id = '{centre_id}' 
          AND date_rdv = '{date}'
          AND statut != 'annule'
          ORDER BY heure_debut;

5. Le système affiche la grille planning :
   
   ┌────┬────────────┬────────────┬────────────┬────────────┐
   │    │ FP (78%)   │ TB (92%)   │ ED (85%)   │ AS (70%)   │
   ├────┼────────────┼────────────┼────────────┼────────────┤
   │08h │            │ [ORANGE]   │            │            │
   │    │            │ 08:00-08:45│            │            │
   │    │            │ MARTIN     │            │            │
   │    │            │ CTP        │            │            │
   ├────┼────────────┼────────────┼────────────┼────────────┤
   │09h │ [VERT]     │            │ [VERT]     │            │
   │    │ 09:00-09:45│            │ 09:15-10:00│            │
   │    │ DUPONT J.  │            │ BERNARD    │            │
   │    │ CTP VL     │            │ CVP L      │            │
   └────┴────────────┴────────────┴────────────┴────────────┘

6. Pour chaque contrôleur, afficher :
   └─ Nom/Initiales
   └─ Taux remplissage (%) = (durée RDV / durée dispo) * 100
   └─ Icône "+" pour ajouter post-it/note

7. Pour chaque RDV, afficher bloc coloré selon statut :
   └─ 🟢 VERT = Confirmé (statut='confirme')
   └─ 🟡 JAUNE = En attente paiement (statut='en_attente_paiement')
   └─ 🔵 BLEU = En cours (statut='en_cours')
   └─ 🟣 VIOLET = Terminé (statut='termine')
   └─ 🔴 ROUGE = Client absent (statut='absent')
   └─ ⚫ GRIS = Créneau bloqué (absence, maintenance)

8. Informations affichées dans chaque bloc RDV :
   └─ Heure début - heure fin
   └─ Nom client (format : NOM Prénom)
   └─ Type contrôle (CTP, CVP, CV, CTC, CVC)
   └─ Immatriculation véhicule

9. Le système active la mise à jour temps réel :
   └─ Connexion WebSocket : wss://api.genilink.fr/ws/agenda/{centre_id}
   └─ Écoute événements :
      • rdv.created → Ajouter nouveau bloc RDV
      • rdv.updated → Mettre à jour bloc existant
      • rdv.cancelled → Retirer bloc (animation fade out)
      • rdv.status_changed → Changer couleur bloc
   └─ Rafraîchissement automatique toutes les 30 secondes (fallback)

10. L'utilisateur peut interagir :
    └─ Cliquer sur bloc RDV → Ouvrir modal détail/édition
    └─ Cliquer sur créneau vide → Créer nouveau RDV
    └─ Drag & drop bloc RDV → Modifier horaire (si autorisé)
    └─ Double-clic bloc → Mode édition rapide
```

**SCÉNARIOS ALTERNATIFS :**

**A1 : Aucun RDV dans la journée**
```
1. Le système affiche grille vide avec créneaux horaires
2. Message affiché : "Aucun rendez-vous prévu pour cette journée"
3. Bouton "Créer un RDV" mis en avant
4. Affichage disponibilité théorique : 8h-19h (11h disponibles)
```

**A2 : Connexion Internet perdue (Mode Offline)**
```
1. Le système détecte perte connexion (navigator.onLine = false)
2. Banner affiché en haut : 
   "⚠️ Mode hors ligne activé - Dernière sync il y a 2 min"
3. Le système charge données depuis IndexedDB :
   └─ db.rdv.where('date').equals('2026-06-17').toArray()
4. Affichage planning avec données cached
5. Actions désactivées :
   └─ Création nouveau RDV (grisé)
   └─ Synchronisation AdelSoft (grisé)
   └─ Paiement en ligne (grisé)
6. Actions disponibles offline :
   └─ Consultation planning ✓
   └─ Modification RDV (queued) ✓
   └─ Marquage client absent ✓
7. Icône sync clignotant avec tooltip :
   "3 modifications en attente de synchronisation"
8. Reconnexion détectée :
   └─ Banner "✅ Connexion rétablie - Synchronisation..."
   └─ Envoi modifications queued vers serveur
   └─ Rechargement données depuis API
   └─ Résolution conflits si nécessaire
```

**A3 : Erreur chargement données**
```
1. API retourne erreur 500 ou timeout
2. Le système affiche message :
   "❌ Erreur de chargement du planning
   Une erreur est survenue. Veuillez réessayer."
3. Bouton "Réessayer" affiché
4. Retry automatique après 3 secondes (max 3 tentatives)
5. Si échec persistant :
   └─ Fallback vers IndexedDB (dernières données)
   └─ Notification équipe technique (Slack)
   └─ Log erreur dans ELK Stack
```

**A4 : Centre désactivé**
```
1. Le système vérifie statut centre en base
2. Si centre.actif = false :
   └─ Redirect vers page "Centre temporairement indisponible"
   └─ Message : "Ce centre est actuellement fermé.
                 Pour plus d'informations : {telephone_centre}"
3. Notification admin réseau automatique
```

**RÈGLES MÉTIER :**

- **RG-PLAN-001** : Plage horaire affichée paramétrable par centre (défaut 8h-19h)
- **RG-PLAN-002** : Seuls contrôleurs actifs du jour affichés
- **RG-PLAN-003** : RDV annulés non affichés (sauf filtre "Afficher annulés")
- **RG-PLAN-004** : Rafraîchissement temps réel via WebSocket
- **RG-PLAN-005** : Taux remplissage = (Σ durées RDV / durée disponible) * 100
- **RG-PLAN-006** : Créneaux bloqués (pauses, absences) affichés en gris foncé
- **RG-PLAN-007** : Intervalles affichage : 15 minutes (paramétrable)
- **RG-PLAN-008** : Cache Redis TTL 60 secondes pour performance
- **RG-PLAN-009** : Mode offline : données cached max 24h
- **RG-PLAN-010** : Cloisonnement strict par tenant_id (RLS)

**DONNÉES SORTIE :**

```typescript
interface PlanningJourneeResponse {
  date: string;  // "2026-06-17"
  centre: {
    id: string;
    code: string;  // "S072001"
    nom: string;   // "ACO SÉCURITÉ"
    horaires: {
      ouverture: string;  // "08:00"
      fermeture: string;  // "19:00"
    };
  };
  controleurs: Controleur[];
  rdv: Rdv[];
  statistiques: {
    nb_rdv_total: number;
    nb_rdv_confirme: number;
    nb_rdv_termine: number;
    nb_absent: number;
    taux_remplissage_global: number;  // %
    duree_disponible_total: number;   // minutes
    duree_occupee_total: number;      // minutes
  };
  creneaux_bloques: CreneauBloque[];
}

interface Controleur {
  id: string;
  nom: string;
  prenom: string;
  initiales: string;  // "FP"
  agrements: string[];  // ["VL", "L", "Gaz"]
  actif: boolean;
  taux_remplissage: number;  // %
  nb_rdv_jour: number;
}

interface Rdv {
  id: string;
  heure_debut: string;  // "09:00"
  heure_fin: string;    // "09:45"
  duree_minutes: number;
  client: {
    nom: string;
    prenom: string;
    telephone: string;
  };
  vehicule: {
    immatriculation: string;
    type: string;  // "VP", "VL", "L"
    marque: string;
  };
  type_controle: string;  // "CTP", "CVP"
  statut: string;  // "confirme", "en_attente_paiement", "en_cours", "termine", "absent"
  controleur_id: string;
  montant_ttc: number;
  paiement_statut: string;
  source: string;  // "web", "mobile", "call_center", "backoffice"
}

interface CreneauBloque {
  id: string;
  controleur_id: string;
  heure_debut: string;
  heure_fin: string;
  motif: string;  // "pause", "absence", "maintenance", "formation"
  description?: string;
}
```

**CRITÈRES ACCEPTATION :**

✅ Le planning s'affiche en moins de 500ms (cache hit)  
✅ Tous les RDV du jour sont visibles  
✅ Les couleurs correspondent aux statuts corrects  
✅ Le taux de remplissage est calculé correctement  
✅ La mise à jour temps réel fonctionne (< 2s latence)  
✅ Le mode offline affiche les dernières données  
✅ L'isolation multi-tenant est respectée (RLS)  
✅ Les créneaux bloqués sont visibles en gris  
✅ Le clic sur un RDV ouvre le modal détail  
✅ Le clic sur créneau vide permet créer RDV  

**WIREFRAME UX :**

```
┌─────────────────────────────────────────────────────────────────┐
│ 🏢 S072001 - ACO SÉCURITÉ - LE MANS    [☰] [🔔2] [💡] [👤]    │
├─────────────────────────────────────────────────────────────────┤
│ [🟢 RDV Pro] [🟡 Type/Durée] [OK] [👁️] [Aujourd'hui]          │
│ ◀ 17/06/2025 ▶                            [🖨️] [👥 3 connectés]│
├────┬────────────┬────────────┬────────────┬────────────┬────────┤
│    │ FP         │ TB         │ ED         │ AS         │ JC     │
│    │ 78% ⭐     │ 92% ⭐⭐   │ 85% ⭐     │ 70%        │ [+]    │
├────┼────────────┼────────────┼────────────┼────────────┼────────┤
│08h │            │ ┌────────┐ │            │            │        │
│    │            │ │08:00-  │ │            │            │        │
│    │            │ │08:45   │ │            │            │        │
│    │            │ │MARTIN  │ │            │            │        │
│    │            │ │CTP     │ │            │            │        │
│    │            │ └────────┘ │            │            │        │
├────┼────────────┼────────────┼────────────┼────────────┼────────┤
│09h │ ┌────────┐ │            │ ┌────────┐ │            │        │
│    │ │09:00-  │ │            │ │09:15-  │ │            │        │
│    │ │09:45   │ │            │ │10:00   │ │            │        │
│    │ │DUPONT  │ │            │ │BERNARD │ │            │        │
│    │ │CTP VL  │ │            │ │CVP L   │ │            │        │
│    │ └────────┘ │            │ └────────┘ │            │        │
├────┼────────────┼────────────┼────────────┼────────────┼────────┤
│... │            │            │            │            │        │
└────┴────────────┴────────────┴────────────┴────────────┴────────┘

LÉGENDE :
🟢 = Confirmé  🟡 = Attente paiement  🔵 = En cours
🟣 = Terminé   🔴 = Absent            ⚫ = Bloqué
```

---

### UC-PLAN-002 : Calculer Disponibilités Temps Réel

**PRIORITÉ :** 🔴 P0 (Critique)  
**ACTEURS :** Système (automatique)  
**OBJECTIF :** Calculer créneaux disponibles pour prise RDV  
**FRÉQUENCE :** Très haute (milliers de req/jour)  
**PERFORMANCE :** < 200ms P95  

**DÉCL

ENCHEUR :**
- Requête GET /api/v1/disponibilites
- Paramètres : centre_id, date, type_controle, type_vehicule, carburant

**ALGORITHME DÉTAILLÉ :**

```python
def calculer_disponibilites(
    centre_id: str,
    date: str,
    type_controle: str,
    type_vehicule: str,
    carburant: str
) -> List[Creneau]:
    """
    Calcule les créneaux disponibles pour un centre/date/type donné.
    
    ÉTAPES :
    1. Vérifier cache Redis
    2. Récupérer planning centre
    3. Filtrer contrôleurs habilités
    4. Calculer durée contrôle
    5. Identifier créneaux libres
    6. Appliquer surbooking si activé
    7. Trier et limiter résultats
    8. Enrichir avec IA (charge prévue)
    9. Mettre en cache
    10. Retourner résultats
    """
    
    # 1. CHECK CACHE REDIS (TTL 60s)
    cache_key = f"dispo:{centre_id}:{date}:{type_controle}:{type_vehicule}:{carburant}"
    cached = redis.get(cache_key)
    if cached:
        logger.info("Cache hit", {cache_key})
        return json.loads(cached)
    
    logger.info("Cache miss, calcul disponibilités", {
        centre_id, date, type_controle
    })
    
    # 2. RÉCUPÉRER PLANNING CENTRE
    planning = db.query("""
        SELECT * FROM plannings
        WHERE centre_id = %s AND date = %s
    """, [centre_id, date])
    
    if not planning:
        raise PlanningNotFoundException(centre_id, date)
    
    # 3. RÉCUPÉRER CONTRÔLEURS ACTIFS HABILITÉS
    controleurs = db.query("""
        SELECT c.*, u.nom, u.prenom
        FROM controleurs c
        JOIN utilisateurs u ON c.utilisateur_id = u.id
        WHERE c.centre_id = %s 
          AND c.actif = true
          AND c.tenant_id = get_current_tenant_id()
    """, [centre_id])
    
    # Filtrer selon agréments requis
    agrements_requis = get_agrements_requis(type_controle, type_vehicule)
    controleurs_habilites = [
        c for c in controleurs 
        if has_agrements(c, agrements_requis)
    ]
    
    if not controleurs_habilites:
        logger.warning("Aucun contrôleur habilité", {
            centre_id, type_controle, agrements_requis
        })
        return []
    
    # 4. CALCULER DURÉE CONTRÔLE (MATRICES)
    duree = get_duree_controle(
        type_controle=type_controle,
        type_vehicule=type_vehicule,
        carburant=carburant
    )
    
    logger.info("Durée calculée", {duree})
    
    # Exemple matrices :
    # CTP VL Essence : 35 min
    # CTP VL Diesel : 40 min
    # CTP VL Gaz : 50 min
    # CVP VL : 25 min
    # CTP L (Moto) : 30 min
    # Contre-visite : 20 min
    
    # 5. RÉCUPÉRER RDV EXISTANTS
    rdv_existants = db.query("""
        SELECT * FROM rdv
        WHERE centre_id = %s
          AND date_rdv = %s
          AND statut NOT IN ('annule')
          AND tenant_id = get_current_tenant_id()
    """, [centre_id, date])
    
    # 6. RÉCUPÉRER CRÉNEAUX BLOQUÉS
    creneaux_bloques = db.query("""
        SELECT * FROM creneaux_bloques
        WHERE centre_id = %s AND date = %s
    """, [centre_id, date])
    
    # 7. CALCULER CRÉNEAUX DISPONIBLES PAR CONTRÔLEUR
    creneaux_disponibles = []
    
    for controleur in controleurs_habilites:
        # Récupérer plages horaires du contrôleur
        plages = planning.get_plages_horaires(controleur.id, date)
        # Ex: [{debut: "08:00", fin: "12:00"}, {debut: "14:00", fin: "19:00"}]
        
        # Retirer RDV déjà affectés
        plages_libres = remove_occupied_slots(
            plages, 
            rdv_existants.filter(lambda r: r.controleur_id == controleur.id)
        )
        
        # Retirer créneaux bloqués (pauses, absences)
        plages_libres = remove_blocked_slots(
            plages_libres,
            creneaux_bloques.filter(lambda c: c.controleur_id == controleur.id)
        )
        
        # Découper en créneaux de durée = duree_controle
        # Intervalle 15 minutes
        for plage in plages_libres:
            current = plage.debut
            while current + duree <= plage.fin:
                creneau = Creneau(
                    centre_id=centre_id,
                    controleur_id=controleur.id,
                    controleur_nom=controleur.nom,
                    controleur_prenom=controleur.prenom,
                    date=date,
                    heure_debut=current,
                    heure_fin=current + duree,
                    duree_minutes=duree,
                    disponible=True
                )
                creneaux_disponibles.append(creneau)
                current += timedelta(minutes=15)  # Intervalle 15min
    
    # 8. APPLIQUER SURBOOKING SI ACTIVÉ
    centre = db.query("SELECT * FROM centres WHERE id = %s", [centre_id])[0]
    if centre.surbooking_enabled:
        # Tolérance +10% créneaux simultanés
        taux_surbooking = centre.taux_surbooking or 1.1
        nb_creneaux_supplementaires = int(
            len(creneaux_disponibles) * (taux_surbooking - 1)
        )
        
        # Ajouter créneaux "dépôt véhicule" sans heure précise
        for i in range(nb_creneaux_supplementaires):
            creneau_depot = Creneau(
                centre_id=centre_id,
                controleur_id=None,  # Affectation auto ultérieure
                date=date,
                heure_debut=None,  # Sans heure précise
                type="depot_vehicule",
                disponible=True
            )
            creneaux_disponibles.append(creneau_depot)
    
    # 9. TRIER PAR HEURE CROISSANTE
    creneaux_disponibles.sort(key=lambda c: c.heure_debut or "99:99")
    
    # 10. LIMITER NOMBRE RÉSULTATS (50 premiers)
    creneaux_disponibles = creneaux_disponibles[:50]
    
    # 11. ENRICHIR AVEC IA (CHARGE PRÉVUE)
    for creneau in creneaux_disponibles:
        if creneau.heure_debut:
            # Appel service IA pour prédiction charge
            prediction = ia_service.predict_charge(
                centre_id=centre_id,
                date=date,
                heure=creneau.heure_debut
            )
            creneau.charge_prevue = prediction.charge  # "faible", "moyenne", "forte"
            creneau.temps_attente_estime = prediction.temps_attente  # minutes
    
    # 12. MISE EN CACHE REDIS (TTL 60s)
    redis.setex(
        cache_key,
        60,  # TTL 60 secondes
        json.dumps(creneaux_disponibles)
    )
    
    logger.info("Disponibilités calculées", {
        nb_creneaux: len(creneaux_disponibles)
    })
    
    return creneaux_disponibles
```

**RÈGLES MÉTIER COMPLEXES :**

- **RG-DISPO-001** : Créneau disponible si :
  - ✓ Au moins 1 contrôleur habilité disponible
  - ✓ Durée disponible >= durée contrôle requise
  - ✓ Pas dans plage bloquée (pause, absence, fermeture)
  - ✓ Surbooking non atteint (si activé)

- **RG-DISPO-002** : Matrices durées contrôle :
  ```
  CTP VL Essence  : 35 min   CTP L Essence   : 30 min
  CTP VL Diesel   : 40 min   CTP L Diesel    : 32 min
  CTP VL Gaz      : 50 min   CTP L Gaz       : 40 min
  CTP VL Hybride  : 38 min   CVP VL          : 25 min
  CTP VL Elec     : 32 min   CVP L           : 22 min
  Contre-visite   : 20 min   CTC (Poids lourd): 60 min
  ```

- **RG-DISPO-003** : Agréments contrôleur :
  - VL (Véhicules Légers) : obligatoire pour VP, VU
  - L (Deux-roues) : obligatoire pour Moto, Cyclo, Quad
  - Gaz : obligatoire pour véhicules GPL/GNV
  - Habilitation électrique : recommandée pour véhicules électriques

- **RG-DISPO-004** : Surbooking paramétrable :
  - Activé/désactivé par centre
  - Taux : 110% par défaut (tolérance +10%)
  - Uniquement "dépôt véhicule" (sans heure précise)
  - Alerte responsable si > 90% capacité

- **RG-DISPO-005** : Priorisation créneaux :
  1. Créneaux avec charge faible prévue (IA)
  2. Créneaux matin (8h-12h) préférés clients
  3. Créneaux avec contrôleur performant (durée réelle < durée théorique)

- **RG-DISPO-006** : Cache Redis :
  - TTL 60 secondes (rafraîchissement automatique)
  - Invalidation sur :
    • Création/modification/annulation RDV
    • Modification planning contrôleur
    • Blocage/déblocage créneaux

**DONNÉES SORTIE :**

```typescript
interface DisponibilitesResponse {
  centre: {
    id: string;
    nom: string;
    adresse: string;
  };
  date: string;
  type_controle: string;
  type_vehicule: string;
  carburant: string;
  duree_controle: number;  // minutes
  nb_creneaux: number;
  creneaux: Creneau[];
  cache_info: {
    hit: boolean;
    ttl_remaining: number;  // secondes
  };
}

interface Creneau {
  id?: string;
  centre_id: string;
  controleur: {
    id: string;
    nom: string;
    prenom: string;
    agrements: string[];
  } | null;  // null si dépôt véhicule
  date: string;
  heure_debut: string | null;  // null si dépôt véhicule
  heure_fin: string | null;
  duree_minutes: number;
  type: "standard" | "depot_vehicule";
  disponible: boolean;
  charge_prevue?: "faible" | "moyenne" | "forte";  // IA
  temps_attente_estime?: number;  // minutes (IA)
}
```

**CRITÈRES ACCEPTATION :**

✅ Calcul en < 200ms P95 (cache hit < 50ms)  
✅ Durée contrôle correcte selon matrices  
✅ Seuls contrôleurs habilités proposés  
✅ Créneaux bloqués exclus  
✅ RDV existants exclus  
✅ Surbooking appliqué si activé  
✅ Cache Redis fonctionne (TTL 60s)  
✅ Invalidation cache sur modification  
✅ IA enrichit prédiction charge  
✅ Max 50 créneaux retournés  

---

*[Le document continue avec 58 autres use cases ultra-détaillés...]*

### UC-PLAN-003 : Modifier Planning Contrôleur

**PRIORITÉ :** 🟠 P1 (Haute)

*[... détails complets ...]*

### UC-PLAN-004 : Bloquer Créneaux

**PRIORITÉ :** 🟠 P1 (Haute)

*[... détails complets ...]*

---

## PARTIE 3 : USE CASES PRISE RDV

### UC-RDV-001 : Prendre RDV Client Particulier (Web)

**PRIORITÉ :** 🔴 P0 (Critique)

*[... workflow complet 10+ écrans ...]*

---

**FIN DU DOCUMENT - 60+ Use Cases**

**STATUT : PRÊT POUR IMPLÉMENTATION**
