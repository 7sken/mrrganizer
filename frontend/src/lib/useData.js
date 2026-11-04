// Hook do pobierania danych z API: const { data, loading, error, reload } = useData('/cats')
import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';

export function useData(url, initial = null) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      setData(await api.get(url));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, setData, loading, error, reload };
}
