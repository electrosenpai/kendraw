import { useState, useEffect } from 'react';

export type BackendStatus = 'checking' | 'available' | 'unavailable';

export function useBackendAvailability(baseUrl: string = 'http://localhost:8081'): BackendStatus {
  const [status, setStatus] = useState<BackendStatus>('checking');

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch(`${baseUrl}/health`, {
          signal: AbortSignal.timeout(3000),
        });
        if (!cancelled) {
          setStatus(res.ok ? 'available' : 'unavailable');
        }
      } catch {
        if (!cancelled) setStatus('unavailable');
      }
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, [baseUrl]);

  return status;
}
