import { z } from 'zod';

// =============================================
// Zod Schemas pour validation
// =============================================

// Password Schema (sécurité SGS)
export const passwordSchema = z.string()
  .min(12, 'Le mot de passe doit contenir au moins 12 caractères')
  .regex(/[A-Z]/, 'Doit contenir au moins une majuscule')
  .regex(/[a-z]/, 'Doit contenir au moins une minuscule')
  .regex(/[0-9]/, 'Doit contenir au moins un chiffre')
  .regex(/[^A-Za-z0-9]/, 'Doit contenir au moins un caractère spécial');

// Email Schema
export const emailSchema = z.string()
  .email('Format email invalide')
  .min(5, 'Email trop court')
  .max(254, 'Email trop long');

// Phone Schema (France)
export const phoneSchema = z.string()
  .regex(
    /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,
    'Numéro de téléphone français invalide'
  );

// Immatriculation Schema
export const immatriculationSchema = z.string()
  .transform(val => val.toUpperCase().replace(/\s/g, ''))
  .refine(val => {
    // Nouveau format: AA-123-BB
    const newFormat = /^[A-Z]{2}-[0-9]{3}-[A-Z]{2}$/;
    // Ancien format: 1234 AB 75
    const oldFormat = /^[0-9]{1,4}[A-Z]{1,3}[0-9]{2}$/;
    return newFormat.test(val) || oldFormat.test(val.replace(/-/g, ''));
  }, 'Format immatriculation invalide');

// Date Schema (YYYY-MM-DD)
export const dateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)')
  .refine(val => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Date invalide');

// Time Schema (HH:mm)
export const timeSchema = z.string()
  .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format heure invalide (HH:mm)');

// UUID Schema
export const uuidSchema = z.string()
  .uuid('UUID invalide');

// SIRET Schema
export const siretSchema = z.string()
  .regex(/^[0-9]{14}$/, 'SIRET invalide (14 chiffres)')
  .refine(val => {
    // Vérification clé de Luhn
    let sum = 0;
    for (let i = 0; i < 14; i++) {
      let digit = parseInt(val[i], 10);
      if (i % 2 === 0) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
    }
    return sum % 10 === 0;
  }, 'SIRET invalide (clé de contrôle)');

// Code Postal Schema (France)
export const codePostalSchema = z.string()
  .regex(/^[0-9]{5}$/, 'Code postal invalide (5 chiffres)');

// =============================================
// Validation Functions
// =============================================

/**
 * Valide un email
 */
export function isValidEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

/**
 * Valide un numéro de téléphone français
 */
export function isValidPhone(phone: string): boolean {
  return phoneSchema.safeParse(phone).success;
}

/**
 * Valide une immatriculation
 */
export function isValidImmatriculation(immat: string): boolean {
  return immatriculationSchema.safeParse(immat).success;
}

/**
 * Valide un SIRET
 */
export function isValidSiret(siret: string): boolean {
  return siretSchema.safeParse(siret).success;
}

/**
 * Valide un mot de passe selon les règles de sécurité
 */
export function isValidPassword(password: string): { valid: boolean; errors: string[] } {
  const result = passwordSchema.safeParse(password);
  if (result.success) {
    return { valid: true, errors: [] };
  }
  return {
    valid: false,
    errors: result.error.errors.map(e => e.message)
  };
}

/**
 * Valide un UUID
 */
export function isValidUUID(uuid: string): boolean {
  return uuidSchema.safeParse(uuid).success;
}

/**
 * Valide une date au format YYYY-MM-DD
 */
export function isValidDate(date: string): boolean {
  return dateSchema.safeParse(date).success;
}

/**
 * Valide une heure au format HH:mm
 */
export function isValidTime(time: string): boolean {
  return timeSchema.safeParse(time).success;
}

// =============================================
// Complex Validation Schemas
// =============================================

// Address Schema
export const addressSchema = z.object({
  rue: z.string().min(1, 'Rue requise').max(200),
  complement: z.string().max(200).optional(),
  code_postal: codePostalSchema,
  ville: z.string().min(1, 'Ville requise').max(100),
  pays: z.string().default('France')
});

// Client Schema
export const createClientSchema = z.object({
  type: z.enum(['particulier', 'professionnel']),
  civilite: z.string().optional(),
  nom: z.string().min(1, 'Nom requis').max(100),
  prenom: z.string().max(100).optional(),
  raison_sociale: z.string().max(200).optional(),
  siret: siretSchema.optional(),
  email: emailSchema.optional(),
  telephone: phoneSchema,
  adresse: addressSchema.optional()
}).refine(data => {
  if (data.type === 'professionnel') {
    return !!data.raison_sociale && !!data.siret;
  }
  return true;
}, {
  message: 'Raison sociale et SIRET requis pour un client professionnel'
});

// Vehicule Schema
export const createVehiculeSchema = z.object({
  immatriculation: immatriculationSchema,
  type: z.enum(['VP', 'VL', 'VU', 'L', 'PL', 'TC', 'QUAD', 'CAMPING_CAR']),
  marque: z.string().min(1, 'Marque requise').max(50),
  modele: z.string().max(100).optional(),
  carburant: z.enum(['essence', 'diesel', 'gpl', 'gnv', 'hybride', 'electrique', 'hydrogene']),
  date_premiere_immatriculation: dateSchema.optional()
});

// RDV Schema
export const createRdvSchema = z.object({
  centre_id: uuidSchema,
  date_rdv: dateSchema,
  heure_debut: timeSchema,
  type_controle: z.enum(['CTP', 'CVP', 'CV', 'CTC', 'CVC', 'CTL', 'CVL']),
  client: z.union([
    z.object({ client_id: uuidSchema }),
    createClientSchema
  ]),
  vehicule: z.union([
    z.object({ vehicule_id: uuidSchema }),
    createVehiculeSchema
  ]),
  controleur_id: uuidSchema.optional(),
  notes: z.string().max(1000).optional()
});

// Login Schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Mot de passe requis'),
  tenant_id: uuidSchema.optional()
});

// Register Schema
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  nom: z.string().min(1, 'Nom requis').max(100),
  prenom: z.string().min(1, 'Prénom requis').max(100),
  telephone: phoneSchema.optional(),
  tenant_id: uuidSchema
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type CreateVehiculeInput = z.infer<typeof createVehiculeSchema>;
export type CreateRdvInput = z.infer<typeof createRdvSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
