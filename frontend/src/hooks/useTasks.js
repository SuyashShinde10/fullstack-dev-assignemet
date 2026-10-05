import { useState, useEffect } from 'react';
import { fetchTasks } from '../api';

export function useTasks(query, status, page, pageSize) {
  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    setLoading(true);
    setError(null);

    fetchTasks({ query, status, page, pageSize }, controller.signal)
      .then((data) => {
        if (!ignore) {
          setTasks(data.items);
          setTotal(data.total);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          return;
        }
        if (!ignore) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [query, status, page, pageSize]);

  return { tasks, total, loading, error };
}
