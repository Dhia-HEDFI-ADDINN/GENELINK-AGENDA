import { format, parseISO, formatDistance } from 'date-fns';
import { fr } from 'date-fns/locale';

// =============================================
// Date & Time Formatters
// =============================================

/**
 * Formate une date au format français
 */
export function formatDate(date: string | Date, pattern: string = 'dd/MM/yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, pattern, { locale: fr });
}

/**
 * Formate une date en texte long
 */
export function formatDateLong(date: string | Date): string {
  return formatDate(date, "EEEE d MMMM yyyy");
}

/**
 * Formate une date courte
 */
export function formatDateShort(date: string | Date): string {
  return formatDate(date, 'dd/MM/yy');
}

/**
 * Formate une heure
 */
export function formatTime(time: string): string {
  return time.replace(':', 'h');
}

/**
 * Formate une plage horaire
 */
export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} - ${formatTime(end)}`;
}

/**
 * Formate une durée en minutes
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h${remainingMinutes.toString().padStart(2, '0')}`;
}

/**
 * Formate une date relative (il y a X temps)
 */
export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistance(d, new Date(), { addSuffix: true, locale: fr });
}

// =============================================
// Money Formatters
// =============================================

/**
 * Formate un montant en euros
 */
export function formatMoney(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency
  }).format(amount);
}

/**
 * Formate un montant sans symbole
 */
export function formatAmount(amount: number, decimals: number = 2): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(amount);
}

// =============================================
// Phone Formatters
// =============================================

/**
 * Formate un numéro de téléphone français
 */
export function formatPhone(phone: string, style: 'national' | 'international' = 'national'): string {
  // Nettoyer le numéro
  let cleaned = phone.replace(/\D/g, '');

  // Supprimer le préfixe 33 si présent
  if (cleaned.startsWith('33')) {
    cleaned = cleaned.slice(2);
  }

  // S'assurer qu'on a 9 chiffres (sans le 0)
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1);
  }

  if (cleaned.length !== 9) {
    return phone; // Retourner tel quel si format non reconnu
  }

  if (style === 'international') {
    return `+33 ${cleaned[0]} ${cleaned.slice(1, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7, 9)}`;
  }

  return `0${cleaned[0]} ${cleaned.slice(1, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7, 9)}`;
}

// =============================================
// Immatriculation Formatters
// =============================================

/**
 * Formate une immatriculation
 */
export function formatImmatriculation(immat: string): string {
  const cleaned = immat.toUpperCase().replace(/[^A-Z0-9]/g, '');

  // Nouveau format: AA-123-BB
  if (/^[A-Z]{2}[0-9]{3}[A-Z]{2}$/.test(cleaned)) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5, 7)}`;
  }

  return cleaned;
}

// =============================================
// Text Formatters
// =============================================

/**
 * Formate un nom propre (Première lettre majuscule)
 */
export function formatName(name: string): string {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Génère des initiales
 */
export function formatInitials(prenom: string, nom: string): string {
  const p = prenom.trim().charAt(0).toUpperCase();
  const n = nom.trim().charAt(0).toUpperCase();
  return `${p}${n}`;
}

/**
 * Tronque un texte
 */
export function truncate(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - suffix.length) + suffix;
}

// =============================================
// Number Formatters
// =============================================

/**
 * Formate un pourcentage
 */
export function formatPercent(value: number, decimals: number = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Formate un nombre avec séparateurs de milliers
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value);
}

// =============================================
// Address Formatters
// =============================================

/**
 * Formate une adresse sur une ligne
 */
export function formatAddressSingleLine(address: {
  rue: string;
  complement?: string;
  code_postal: string;
  ville: string;
}): string {
  const parts = [address.rue];
  if (address.complement) {
    parts.push(address.complement);
  }
  parts.push(`${address.code_postal} ${address.ville}`);
  return parts.join(', ');
}

/**
 * Formate une adresse sur plusieurs lignes
 */
export function formatAddressMultiLine(address: {
  rue: string;
  complement?: string;
  code_postal: string;
  ville: string;
}): string {
  const lines = [address.rue];
  if (address.complement) {
    lines.push(address.complement);
  }
  lines.push(`${address.code_postal} ${address.ville}`);
  return lines.join('\n');
}

// =============================================
// Reference Formatters
// =============================================

/**
 * Formate une référence RDV
 */
export function formatReference(ref: string): string {
  return ref.toUpperCase();
}

/**
 * Formate un ID court (8 premiers caractères d'un UUID)
 */
export function formatShortId(uuid: string): string {
  return uuid.slice(0, 8).toUpperCase();
}
