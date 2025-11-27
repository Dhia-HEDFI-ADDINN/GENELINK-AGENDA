// =============================================
// TypeScript Decorators pour NestJS
// =============================================

/**
 * Decorator pour marquer une route comme publique (sans auth)
 */
export function Public(): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    Reflect.defineMetadata('isPublic', true, descriptor.value!);
    return descriptor;
  };
}

/**
 * Decorator pour spécifier les rôles requis
 */
export function Roles(...roles: string[]): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    Reflect.defineMetadata('roles', roles, descriptor.value!);
    return descriptor;
  };
}

/**
 * Decorator pour spécifier les permissions requises
 */
export function Permissions(...permissions: string[]): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    Reflect.defineMetadata('permissions', permissions, descriptor.value!);
    return descriptor;
  };
}

/**
 * Decorator pour extraire le tenant_id
 */
export function TenantId(): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    const existingParams = Reflect.getOwnMetadata('tenant_param', target, propertyKey as string) || [];
    existingParams.push(parameterIndex);
    Reflect.defineMetadata('tenant_param', existingParams, target, propertyKey as string);
  };
}

/**
 * Decorator pour le caching
 */
export function Cacheable(ttlSeconds: number = 60, keyPrefix?: string): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    Reflect.defineMetadata('cache_ttl', ttlSeconds, descriptor.value!);
    if (keyPrefix) {
      Reflect.defineMetadata('cache_prefix', keyPrefix, descriptor.value!);
    }
    return descriptor;
  };
}

/**
 * Decorator pour invalider le cache
 */
export function CacheInvalidate(...patterns: string[]): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    Reflect.defineMetadata('cache_invalidate', patterns, descriptor.value!);
    return descriptor;
  };
}

/**
 * Decorator pour le logging automatique
 */
export function Log(level: 'debug' | 'info' | 'warn' | 'error' = 'info'): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value as Function;

    descriptor.value = async function (...args: unknown[]) {
      const className = target.constructor.name;
      const methodName = String(propertyKey);

      console.log(`[${level.toUpperCase()}] ${className}.${methodName} called`);
      const start = Date.now();

      try {
        const result = await originalMethod.apply(this, args);
        console.log(`[${level.toUpperCase()}] ${className}.${methodName} completed in ${Date.now() - start}ms`);
        return result;
      } catch (error) {
        console.error(`[ERROR] ${className}.${methodName} failed:`, error);
        throw error;
      }
    } as unknown as typeof descriptor.value;

    return descriptor;
  };
}

/**
 * Decorator pour mesurer le temps d'exécution
 */
export function Timed(metricName?: string): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value as Function;
    const name = metricName || `${target.constructor.name}.${String(propertyKey)}`;

    descriptor.value = async function (...args: unknown[]) {
      const start = process.hrtime.bigint();
      try {
        return await originalMethod.apply(this, args);
      } finally {
        const end = process.hrtime.bigint();
        const durationMs = Number(end - start) / 1e6;
        console.log(`[METRIC] ${name}: ${durationMs.toFixed(2)}ms`);
      }
    } as unknown as typeof descriptor.value;

    return descriptor;
  };
}

/**
 * Decorator pour retry automatique
 */
export function Retry(maxRetries: number = 3, delayMs: number = 1000): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value as Function;

    descriptor.value = async function (...args: unknown[]) {
      let lastError: Error | undefined;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          lastError = error as Error;
          if (attempt < maxRetries) {
            console.warn(`Retry ${attempt}/${maxRetries} for ${String(propertyKey)}`);
            await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
          }
        }
      }

      throw lastError;
    } as unknown as typeof descriptor.value;

    return descriptor;
  };
}

/**
 * Decorator pour audit logging
 */
export function AuditLog(action: string): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    Reflect.defineMetadata('audit_action', action, descriptor.value!);
    return descriptor;
  };
}

/**
 * Decorator pour validation
 */
export function Validate(): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    Reflect.defineMetadata('validate', true, descriptor.value!);
    return descriptor;
  };
}

/**
 * Decorator pour rate limiting
 */
export function RateLimit(limit: number, windowMs: number = 60000): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    Reflect.defineMetadata('rate_limit', { limit, windowMs }, descriptor.value!);
    return descriptor;
  };
}

// =============================================
// Class Decorators
// =============================================

/**
 * Decorator pour marquer un service comme tenant-aware
 */
export function TenantAware(): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata('tenant_aware', true, target);
    return target;
  };
}

/**
 * Decorator pour Event Handler
 */
export function EventHandler(eventType: string): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata('event_type', eventType, target);
    return target;
  };
}
