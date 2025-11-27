// =============================================
// Value Objects - Immutable Domain Objects
// =============================================

// Money Value Object
export class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: string = 'EUR'
  ) {
    if (amount < 0) {
      throw new Error('Amount cannot be negative');
    }
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add money with different currencies');
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot subtract money with different currencies');
    }
    return new Money(this.amount - other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }

  format(): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: this.currency
    }).format(this.amount);
  }

  toJSON() {
    return {
      amount: this.amount,
      currency: this.currency
    };
  }
}

// TimeSlot Value Object
export class TimeSlot {
  constructor(
    public readonly heureDebut: string,
    public readonly heureFin: string
  ) {
    if (!this.isValidTime(heureDebut) || !this.isValidTime(heureFin)) {
      throw new Error('Invalid time format. Expected HH:mm');
    }
    if (heureDebut >= heureFin) {
      throw new Error('Start time must be before end time');
    }
  }

  private isValidTime(time: string): boolean {
    return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
  }

  getDurationMinutes(): number {
    const [startH, startM] = this.heureDebut.split(':').map(Number);
    const [endH, endM] = this.heureFin.split(':').map(Number);
    return (endH * 60 + endM) - (startH * 60 + startM);
  }

  overlaps(other: TimeSlot): boolean {
    return this.heureDebut < other.heureFin && this.heureFin > other.heureDebut;
  }

  contains(time: string): boolean {
    return time >= this.heureDebut && time < this.heureFin;
  }

  toJSON() {
    return {
      heureDebut: this.heureDebut,
      heureFin: this.heureFin
    };
  }
}

// Immatriculation Value Object
export class Immatriculation {
  private static readonly REGEX_ANCIEN = /^[0-9]{1,4}[A-Z]{1,3}[0-9]{2}$/;
  private static readonly REGEX_NOUVEAU = /^[A-Z]{2}-[0-9]{3}-[A-Z]{2}$/;
  private static readonly REGEX_DIPLOMATIQUE = /^[0-9]{3}[A-Z]{3}[0-9]{2}$/;

  constructor(public readonly value: string) {
    const normalized = this.normalize(value);
    if (!this.isValid(normalized)) {
      throw new Error(`Invalid immatriculation: ${value}`);
    }
    this.value = normalized;
  }

  private normalize(value: string): string {
    return value.toUpperCase().replace(/\s/g, '').replace(/-/g, '-');
  }

  private isValid(value: string): boolean {
    return (
      Immatriculation.REGEX_NOUVEAU.test(value) ||
      Immatriculation.REGEX_ANCIEN.test(value.replace(/-/g, '')) ||
      Immatriculation.REGEX_DIPLOMATIQUE.test(value)
    );
  }

  isNouveauFormat(): boolean {
    return Immatriculation.REGEX_NOUVEAU.test(this.value);
  }

  format(): string {
    if (this.isNouveauFormat()) {
      return this.value;
    }
    return this.value;
  }

  equals(other: Immatriculation): boolean {
    return this.value === other.value;
  }

  toJSON() {
    return this.value;
  }
}

// Email Value Object
export class Email {
  private static readonly REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(public readonly value: string) {
    const normalized = value.toLowerCase().trim();
    if (!Email.REGEX.test(normalized)) {
      throw new Error(`Invalid email: ${value}`);
    }
    this.value = normalized;
  }

  getDomain(): string {
    return this.value.split('@')[1];
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toJSON() {
    return this.value;
  }
}

// PhoneNumber Value Object
export class PhoneNumber {
  private static readonly REGEX_FR = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;

  constructor(public readonly value: string) {
    const normalized = this.normalize(value);
    if (!PhoneNumber.REGEX_FR.test(value)) {
      throw new Error(`Invalid phone number: ${value}`);
    }
    this.value = normalized;
  }

  private normalize(value: string): string {
    let normalized = value.replace(/[\s.-]/g, '');
    if (normalized.startsWith('0033')) {
      normalized = '+33' + normalized.slice(4);
    } else if (normalized.startsWith('0')) {
      normalized = '+33' + normalized.slice(1);
    }
    return normalized;
  }

  format(style: 'national' | 'international' = 'national'): string {
    const digits = this.value.replace(/\D/g, '').slice(-9);
    if (style === 'international') {
      return `+33 ${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;
    }
    return `0${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;
  }

  equals(other: PhoneNumber): boolean {
    return this.value === other.value;
  }

  toJSON() {
    return this.value;
  }
}

// DateOnly Value Object
export class DateOnly {
  private readonly date: Date;

  constructor(value: string | Date) {
    if (typeof value === 'string') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error(`Invalid date format: ${value}. Expected YYYY-MM-DD`);
      }
      this.date = new Date(value + 'T00:00:00.000Z');
    } else {
      this.date = new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
    }
  }

  toString(): string {
    return this.date.toISOString().split('T')[0];
  }

  toDate(): Date {
    return new Date(this.date);
  }

  addDays(days: number): DateOnly {
    const newDate = new Date(this.date);
    newDate.setDate(newDate.getDate() + days);
    return new DateOnly(newDate);
  }

  isWeekend(): boolean {
    const day = this.date.getUTCDay();
    return day === 0 || day === 6;
  }

  isBefore(other: DateOnly): boolean {
    return this.toString() < other.toString();
  }

  isAfter(other: DateOnly): boolean {
    return this.toString() > other.toString();
  }

  equals(other: DateOnly): boolean {
    return this.toString() === other.toString();
  }

  toJSON() {
    return this.toString();
  }
}

// Reference Value Object (RDV Reference)
export class Reference {
  constructor(public readonly value: string) {}

  static generate(centreCode: string, date: DateOnly): Reference {
    const dateStr = date.toString().replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return new Reference(`${centreCode}-${dateStr}-${random}`);
  }

  getCentreCode(): string {
    return this.value.split('-')[0];
  }

  getDate(): string {
    return this.value.split('-')[1];
  }

  equals(other: Reference): boolean {
    return this.value === other.value;
  }

  toJSON() {
    return this.value;
  }
}

// Duration Value Object
export class Duration {
  constructor(public readonly minutes: number) {
    if (minutes < 0) {
      throw new Error('Duration cannot be negative');
    }
  }

  static fromHoursAndMinutes(hours: number, minutes: number): Duration {
    return new Duration(hours * 60 + minutes);
  }

  getHours(): number {
    return Math.floor(this.minutes / 60);
  }

  getRemainingMinutes(): number {
    return this.minutes % 60;
  }

  format(): string {
    const hours = this.getHours();
    const mins = this.getRemainingMinutes();
    if (hours === 0) {
      return `${mins} min`;
    }
    return `${hours}h${mins > 0 ? mins.toString().padStart(2, '0') : ''}`;
  }

  add(other: Duration): Duration {
    return new Duration(this.minutes + other.minutes);
  }

  toJSON() {
    return this.minutes;
  }
}
