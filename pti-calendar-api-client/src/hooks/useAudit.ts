/**
 * PTI Calendar - React Audit Hook
 * Provides easy-to-use audit logging for React applications
 */

import { useCallback, useEffect, useRef } from 'react';
import { AuditClient, getAuditClient } from '../audit';

export interface UseAuditOptions {
  appName: string;
  trackPageViews?: boolean;
  trackErrors?: boolean;
  enabled?: boolean;
}

export interface UseAuditResult {
  logAction: (action: string, entityType: string, entityId?: string, metadata?: Record<string, unknown>) => void;
  logPageView: (pagePath: string, pageTitle?: string) => void;
  logRdvCreated: (rdvId: string, metadata?: Record<string, unknown>) => void;
  logRdvModified: (rdvId: string, changes?: Record<string, unknown>) => void;
  logRdvCancelled: (rdvId: string, motif?: string) => void;
  logPayment: (paymentId: string, status: string, amount: number) => void;
  logSearch: (query: string, entityType: string, resultsCount?: number) => void;
  logError: (error: Error | string, metadata?: Record<string, unknown>) => void;
  logLogin: (userId: string, method?: string) => void;
  logLogout: (userId: string) => void;
  logDownload: (fileType: string, entityType: string, entityId?: string) => void;
  flush: () => Promise<void>;
}

export function useAudit(options: UseAuditOptions): UseAuditResult {
  const { appName, trackPageViews = true, trackErrors = true, enabled = true } = options;

  const auditClientRef = useRef<AuditClient | null>(null);

  // Initialize audit client
  useEffect(() => {
    auditClientRef.current = getAuditClient(appName);
    auditClientRef.current.setEnabled(enabled);

    return () => {
      auditClientRef.current?.flush();
    };
  }, [appName, enabled]);

  // Track page views
  useEffect(() => {
    if (!trackPageViews || typeof window === 'undefined') return;

    const handleRouteChange = () => {
      auditClientRef.current?.logPageView(
        window.location.pathname,
        document.title
      );
    };

    // Initial page view
    handleRouteChange();

    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', handleRouteChange);

    // For Next.js or similar frameworks with custom routing
    // You may need to integrate with router events

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [trackPageViews]);

  // Track global errors
  useEffect(() => {
    if (!trackErrors || typeof window === 'undefined') return;

    const handleError = (event: ErrorEvent) => {
      auditClientRef.current?.logError(event.error || event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      auditClientRef.current?.logError(
        event.reason?.message || 'Unhandled Promise Rejection',
        { reason: event.reason }
      );
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [trackErrors]);

  // Memoized callbacks
  const logAction = useCallback(
    (action: string, entityType: string, entityId?: string, metadata?: Record<string, unknown>) => {
      auditClientRef.current?.logAction(action, entityType, entityId, metadata);
    },
    []
  );

  const logPageView = useCallback((pagePath: string, pageTitle?: string) => {
    auditClientRef.current?.logPageView(pagePath, pageTitle);
  }, []);

  const logRdvCreated = useCallback((rdvId: string, metadata?: Record<string, unknown>) => {
    auditClientRef.current?.logRdvCreated(rdvId, metadata);
  }, []);

  const logRdvModified = useCallback((rdvId: string, changes?: Record<string, unknown>) => {
    auditClientRef.current?.logRdvModified(rdvId, changes);
  }, []);

  const logRdvCancelled = useCallback((rdvId: string, motif?: string) => {
    auditClientRef.current?.logRdvCancelled(rdvId, motif);
  }, []);

  const logPayment = useCallback((paymentId: string, status: string, amount: number) => {
    auditClientRef.current?.logPayment(paymentId, status, amount);
  }, []);

  const logSearch = useCallback((query: string, entityType: string, resultsCount?: number) => {
    auditClientRef.current?.logSearch(query, entityType, resultsCount);
  }, []);

  const logError = useCallback((error: Error | string, metadata?: Record<string, unknown>) => {
    auditClientRef.current?.logError(error, metadata);
  }, []);

  const logLogin = useCallback((userId: string, method?: string) => {
    auditClientRef.current?.logLogin(userId, method);
  }, []);

  const logLogout = useCallback((userId: string) => {
    auditClientRef.current?.logLogout(userId);
  }, []);

  const logDownload = useCallback((fileType: string, entityType: string, entityId?: string) => {
    auditClientRef.current?.logDownload(fileType, entityType, entityId);
  }, []);

  const flush = useCallback(async () => {
    await auditClientRef.current?.flush();
  }, []);

  return {
    logAction,
    logPageView,
    logRdvCreated,
    logRdvModified,
    logRdvCancelled,
    logPayment,
    logSearch,
    logError,
    logLogin,
    logLogout,
    logDownload,
    flush,
  };
}

export default useAudit;
