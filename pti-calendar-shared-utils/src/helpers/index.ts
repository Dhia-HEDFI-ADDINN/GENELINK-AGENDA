import { v4 as uuidv4 } from 'uuid';
import { addDays, addMinutes, parseISO, isWeekend, isBefore, isAfter, differenceInMinutes } from 'date-fns';

// =============================================
// ID Generators
// =============================================

/**
 * Génère un UUID v4
 */
export function generateUUID(): string {
  return uuidv4();
}

/**
 * Génère une référence RDV
 */
export function generateRdvReference(centreCode: string, date: string): string {
  const dateStr = date.replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${centreCode}-${dateStr}-${random}`;
}

/**
 * Génère un code à 6 chiffres (pour reset password, etc.)
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Génère une clé API
 */
export function generateApiKey(): string {
  const prefix = 'pti_';
  const key = Array.from({ length: 32 }, () =>
    Math.random().toString(36).charAt(2)
  ).join('');
  return `${prefix}${key}`;
}

// =============================================
// Date & Time Helpers
// =============================================

/**
 * Retourne la date du jour au format YYYY-MM-DD
 */
export function today(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Ajoute des jours à une date
 */
export function addDaysToDate(date: string, days: number): string {
  return addDays(parseISO(date), days).toISOString().split('T')[0];
}

/**
 * Calcule l'heure de fin à partir de l'heure de début et de la durée
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startDate = new Date(2000, 0, 1, hours, minutes);
  const endDate = addMinutes(startDate, durationMinutes);
  return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
}

/**
 * Vérifie si une date est un week-end
 */
export function isWeekendDate(date: string): boolean {
  return isWeekend(parseISO(date));
}

/**
 * Vérifie si une date est dans le passé
 */
export function isPastDate(date: string): boolean {
  return isBefore(parseISO(date), new Date());
}

/**
 * Vérifie si une date est dans le futur
 */
export function isFutureDate(date: string): boolean {
  return isAfter(parseISO(date), new Date());
}

/**
 * Calcule la différence en minutes entre deux heures
 */
export function getMinutesBetweenTimes(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  return (endH * 60 + endM) - (startH * 60 + startM);
}

/**
 * Vérifie si deux plages horaires se chevauchent
 */
export function timeRangesOverlap(
  start1: string, end1: string,
  start2: string, end2: string
): boolean {
  return start1 < end2 && end1 > start2;
}

/**
 * Génère les créneaux horaires entre deux heures
 */
export function generateTimeSlots(
  startTime: string,
  endTime: string,
  intervalMinutes: number
): string[] {
  const slots: string[] = [];
  let current = startTime;

  while (current < endTime) {
    slots.push(current);
    current = calculateEndTime(current, intervalMinutes);
  }

  return slots;
}

// =============================================
// Array Helpers
// =============================================

/**
 * Groupe un tableau par une clé
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Supprime les doublons d'un tableau
 */
export function uniqueBy<T>(array: T[], key: keyof T): T[] {
  const seen = new Set();
  return array.filter(item => {
    const k = item[key];
    if (seen.has(k)) {
      return false;
    }
    seen.add(k);
    return true;
  });
}

/**
 * Trie un tableau par une clé
 */
export function sortBy<T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Pagine un tableau
 */
export function paginate<T>(array: T[], page: number, limit: number): {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
} {
  const total = array.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    data: array.slice(start, end),
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
}

// =============================================
// Object Helpers
// =============================================

/**
 * Supprime les propriétés nulles ou undefined d'un objet
 */
export function removeNullish<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v != null)
  ) as Partial<T>;
}

/**
 * Deep clone d'un objet
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Merge profond de deux objets
 */
export function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      result[key] = deepMerge(
        target[key] as Record<string, unknown>,
        source[key] as Record<string, unknown>
      ) as T[Extract<keyof T, string>];
    } else {
      result[key] = source[key] as T[Extract<keyof T, string>];
    }
  }

  return result;
}

// =============================================
// String Helpers
// =============================================

/**
 * Normalise une chaîne (supprime accents, lowercase)
 */
export function normalizeString(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Génère un slug à partir d'une chaîne
 */
export function slugify(str: string): string {
  return normalizeString(str)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Masque partiellement une chaîne (pour emails, phones)
 */
export function mask(str: string, visibleStart: number = 3, visibleEnd: number = 3): string {
  if (str.length <= visibleStart + visibleEnd) {
    return str;
  }
  const masked = '*'.repeat(str.length - visibleStart - visibleEnd);
  return str.slice(0, visibleStart) + masked + str.slice(-visibleEnd);
}

// =============================================
// Async Helpers
// =============================================

/**
 * Attend un certain temps (ms)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry une fonction avec backoff exponentiel
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delayMs?: number;
    backoffMultiplier?: number;
  } = {}
): Promise<T> {
  const { maxRetries = 3, delayMs = 1000, backoffMultiplier = 2 } = options;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        await sleep(delayMs * Math.pow(backoffMultiplier, attempt));
      }
    }
  }

  throw lastError;
}

// =============================================
// Business Logic Helpers
// =============================================

/**
 * Calcule la durée d'un contrôle selon le type de véhicule et carburant
 */
export function calculateControleDuration(
  typeControle: string,
  typeVehicule: string,
  carburant: string
): number {
  const durations: Record<string, Record<string, Record<string, number>>> = {
    CTP: {
      VP: { essence: 35, diesel: 40, gpl: 50, gnv: 50, hybride: 38, electrique: 32, hydrogene: 45 },
      VL: { essence: 35, diesel: 40, gpl: 50, gnv: 50, hybride: 38, electrique: 32, hydrogene: 45 },
      VU: { essence: 40, diesel: 45, gpl: 55, gnv: 55, hybride: 43, electrique: 37, hydrogene: 50 },
      L: { essence: 30, diesel: 32, gpl: 40, gnv: 40, hybride: 32, electrique: 28, hydrogene: 38 },
      PL: { essence: 60, diesel: 65, gpl: 75, gnv: 75, hybride: 65, electrique: 55, hydrogene: 70 }
    },
    CVP: {
      VP: { essence: 25, diesel: 25, gpl: 30, gnv: 30, hybride: 25, electrique: 22, hydrogene: 28 },
      VL: { essence: 25, diesel: 25, gpl: 30, gnv: 30, hybride: 25, electrique: 22, hydrogene: 28 },
      VU: { essence: 30, diesel: 30, gpl: 35, gnv: 35, hybride: 30, electrique: 25, hydrogene: 32 },
      L: { essence: 22, diesel: 22, gpl: 28, gnv: 28, hybride: 22, electrique: 20, hydrogene: 25 },
      PL: { essence: 40, diesel: 45, gpl: 50, gnv: 50, hybride: 45, electrique: 38, hydrogene: 48 }
    },
    CV: {
      VP: { essence: 20, diesel: 20, gpl: 25, gnv: 25, hybride: 20, electrique: 18, hydrogene: 22 },
      VL: { essence: 20, diesel: 20, gpl: 25, gnv: 25, hybride: 20, electrique: 18, hydrogene: 22 },
      VU: { essence: 25, diesel: 25, gpl: 30, gnv: 30, hybride: 25, electrique: 22, hydrogene: 28 },
      L: { essence: 18, diesel: 18, gpl: 22, gnv: 22, hybride: 18, electrique: 15, hydrogene: 20 },
      PL: { essence: 35, diesel: 35, gpl: 40, gnv: 40, hybride: 35, electrique: 30, hydrogene: 38 }
    }
  };

  const typeKey = typeControle.toUpperCase();
  const vehiculeKey = typeVehicule.toUpperCase();
  const carburantKey = carburant.toLowerCase();

  return durations[typeKey]?.[vehiculeKey]?.[carburantKey] ?? 45;
}

/**
 * Calcule le prix TTC d'un contrôle
 */
export function calculateControlePrix(
  typeControle: string,
  typeVehicule: string
): { ht: number; tva: number; ttc: number } {
  const prix: Record<string, Record<string, number>> = {
    CTP: { VP: 65, VL: 65, VU: 75, L: 55, PL: 120 },
    CVP: { VP: 35, VL: 35, VU: 40, L: 30, PL: 65 },
    CV: { VP: 0, VL: 0, VU: 0, L: 0, PL: 0 }
  };

  const ht = prix[typeControle.toUpperCase()]?.[typeVehicule.toUpperCase()] ?? 65;
  const tva = ht * 0.2;
  const ttc = ht + tva;

  return { ht, tva, ttc };
}

/**
 * Vérifie si un contrôleur a les agréments requis
 */
export function hasRequiredAgrements(
  controleurAgrements: string[],
  typeVehicule: string,
  carburant: string
): boolean {
  const required: string[] = [];

  // Agrément véhicule
  if (['VP', 'VL', 'VU'].includes(typeVehicule.toUpperCase())) {
    required.push('VL');
  } else if (typeVehicule.toUpperCase() === 'L') {
    required.push('L');
  } else if (['PL', 'TC'].includes(typeVehicule.toUpperCase())) {
    required.push('PL');
  }

  // Agrément carburant
  if (['gpl', 'gnv'].includes(carburant.toLowerCase())) {
    required.push('GAZ');
  }
  if (carburant.toLowerCase() === 'electrique') {
    required.push('ELECTRIQUE');
  }

  return required.every(agr =>
    controleurAgrements.map(a => a.toUpperCase()).includes(agr.toUpperCase())
  );
}
