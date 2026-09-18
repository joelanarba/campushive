import { useCallback, useEffect, useRef, useState } from "react";

// Each list owns its request state; late responses never replace a newer page/filter.
export const usePagedList = (request, params, key, onPageChange) => {
  const [state, setState] = useState({
    items: [],
    pagination: null,
    summary: null,
    loading: true,
    error: null,
  });
  const [revision, setRevision] = useState(0);
  const sequence = useRef(0);
  const serialized = JSON.stringify(params);
  useEffect(() => {
    const ticket = ++sequence.current;
    setState((old) => ({ ...old, loading: true, error: null }));
    request(JSON.parse(serialized)).then((res) => {
      if (ticket !== sequence.current) return;
      if (!res.ok) {
        setState((old) => ({ ...old, loading: false, error: res.error }));
        return;
      }
      const data = res.data.data;
      const lastPage = Math.max(1, data.pagination.total_pages);
      if (data.pagination.page > lastPage && onPageChange) {
        onPageChange(lastPage);
        return;
      }
      setState({
        items: data[key],
        pagination: data.pagination,
        summary: data.summary,
        loading: false,
        error: null,
      });
    });
    return () => {
      sequence.current += 1;
    };
  }, [request, serialized, key, revision, onPageChange]);
  const reload = useCallback(() => setRevision((value) => value + 1), []);
  return { ...state, reload };
};
