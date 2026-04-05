import { useEffect, useState } from 'react';
import type { DsaData } from '../types/dsa';
import { mockData } from '../mocks/dsaMockData';

export function useDsaData(): {
  data: DsaData | null;
  loading: boolean;
  error: unknown;
} {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [data, setData] = useState<DsaData | null>(null);

  useEffect(() => {
    let canceled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // TEMP: simulate API delay
        await new Promise((res) => setTimeout(res, 500));

        // Use mock data for now
        if (!canceled) {
          setData(mockData);
        }
      } catch (err) {
        if (!canceled) {
          setError(err);
          setData(mockData); // fallback even on error
        }
      } finally {
        if (!canceled) {
          setLoading(false); // CRITICAL
        }
      }
    };

    fetchData();

    return () => {
      canceled = true;
    };
  }, []);

  return { data, loading, error };
}
