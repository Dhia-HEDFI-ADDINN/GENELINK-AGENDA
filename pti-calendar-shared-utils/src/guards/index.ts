// =============================================
// Guard Utilities pour NestJS
// Ces sont des helpers pour créer des guards
// Les vrais guards NestJS sont dans chaque microservice
// =============================================

/**
 * Vérifie si un utilisateur a un rôle donné
 */
export function hasRole(userRoles: string[], requiredRole: string): boolean {
  return userRoles.includes(requiredRole);
}

/**
 * Vérifie si un utilisateur a au moins un des rôles requis
 */
export function hasAnyRole(userRoles: string[], requiredRoles: string[]): boolean {
  return requiredRoles.some(role => userRoles.includes(role));
}

/**
 * Vérifie si un utilisateur a tous les rôles requis
 */
export function hasAllRoles(userRoles: string[], requiredRoles: string[]): boolean {
  return requiredRoles.every(role => userRoles.includes(role));
}

/**
 * Vérifie si un utilisateur a une permission donnée
 */
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.includes(requiredPermission);
}

/**
 * Vérifie si un utilisateur a au moins une des permissions requises
 */
export function hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.some(perm => userPermissions.includes(perm));
}

/**
 * Vérifie si un utilisateur a toutes les permissions requises
 */
export function hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.every(perm => userPermissions.includes(perm));
}

/**
 * Vérifie si un utilisateur a accès à un tenant
 */
export function canAccessTenant(userTenantId: string, requestedTenantId: string, isSuperAdmin: boolean = false): boolean {
  if (isSuperAdmin) return true;
  return userTenantId === requestedTenantId;
}

/**
 * Vérifie si un utilisateur a accès à un centre
 */
export function canAccessCentre(userCentreIds: string[], requestedCentreId: string, isAdmin: boolean = false): boolean {
  if (isAdmin) return true;
  return userCentreIds.includes(requestedCentreId);
}

/**
 * Définition des permissions par rôle
 */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: [
    'tenant:*',
    'centre:*',
    'user:*',
    'planning:*',
    'rdv:*',
    'payment:*',
    'stats:*',
    'admin:*'
  ],
  ADMIN_TENANT: [
    'centre:read', 'centre:write',
    'user:read', 'user:write',
    'planning:*',
    'rdv:*',
    'payment:read', 'payment:refund',
    'stats:*'
  ],
  ADMIN_AGENCE: [
    'centre:read',
    'user:read',
    'planning:read', 'planning:write',
    'rdv:*',
    'payment:read',
    'stats:read'
  ],
  ADMIN_CT: [
    'planning:read', 'planning:write',
    'rdv:read', 'rdv:create', 'rdv:update',
    'stats:read'
  ],
  CONTROLEUR: [
    'planning:read',
    'rdv:read', 'rdv:update'
  ],
  CALL_CENTER: [
    'planning:read',
    'rdv:read', 'rdv:create', 'rdv:update', 'rdv:cancel',
    'payment:create'
  ],
  CLIENT: [
    'rdv:read:own', 'rdv:create', 'rdv:cancel:own',
    'payment:create:own'
  ],
  API_KEY: [
    'planning:read',
    'rdv:read', 'rdv:create'
  ]
};

/**
 * Récupère les permissions pour un rôle
 */
export function getPermissionsForRole(role: string): string[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Récupère toutes les permissions pour une liste de rôles
 */
export function getPermissionsForRoles(roles: string[]): string[] {
  const allPermissions = new Set<string>();

  for (const role of roles) {
    const permissions = getPermissionsForRole(role);
    permissions.forEach(p => allPermissions.add(p));
  }

  return Array.from(allPermissions);
}

/**
 * Vérifie si une permission wildcard match
 * Ex: 'rdv:*' match 'rdv:read', 'rdv:write', etc.
 */
export function permissionMatches(userPermission: string, requiredPermission: string): boolean {
  if (userPermission === requiredPermission) return true;

  // Wildcard match
  if (userPermission.endsWith(':*')) {
    const prefix = userPermission.slice(0, -1); // Remove '*'
    return requiredPermission.startsWith(prefix);
  }

  // Global wildcard
  if (userPermission === '*') return true;

  return false;
}

/**
 * Vérifie si un utilisateur a une permission (avec support wildcard)
 */
export function checkPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.some(perm => permissionMatches(perm, requiredPermission));
}

// =============================================
// JWT Utilities
// =============================================

/**
 * Structure du payload JWT
 */
export interface JwtPayload {
  sub: string;        // User ID
  email: string;
  roles: string[];
  permissions: string[];
  tenant_id: string;
  centre_ids: string[];
  iat: number;        // Issued at
  exp: number;        // Expiration
}

/**
 * Vérifie si un token est expiré
 */
export function isTokenExpired(exp: number): boolean {
  return Date.now() >= exp * 1000;
}

/**
 * Calcule le temps restant avant expiration (en secondes)
 */
export function getTokenTimeRemaining(exp: number): number {
  return Math.max(0, exp - Math.floor(Date.now() / 1000));
}

// =============================================
// Rate Limiting Utilities
// =============================================

/**
 * Configuration rate limit par endpoint
 */
export const RATE_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  '/auth/login': { limit: 5, windowMs: 60000 },          // 5 req/min
  '/auth/register': { limit: 10, windowMs: 60000 },      // 10 req/min
  '/auth/forgot-password': { limit: 3, windowMs: 60000 }, // 3 req/min
  '/rdv': { limit: 100, windowMs: 60000 },               // 100 req/min
  '/planning': { limit: 200, windowMs: 60000 },          // 200 req/min
  '/payment': { limit: 50, windowMs: 60000 },            // 50 req/min
  'default': { limit: 100, windowMs: 60000 }             // 100 req/min
};

/**
 * Récupère la configuration rate limit pour un endpoint
 */
export function getRateLimitConfig(endpoint: string): { limit: number; windowMs: number } {
  // Cherche une correspondance exacte
  if (RATE_LIMITS[endpoint]) {
    return RATE_LIMITS[endpoint];
  }

  // Cherche une correspondance partielle (préfixe)
  for (const [pattern, config] of Object.entries(RATE_LIMITS)) {
    if (endpoint.startsWith(pattern)) {
      return config;
    }
  }

  return RATE_LIMITS['default'];
}
