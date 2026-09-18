import { useCallback, useEffect, useRef, useState } from "react";
import api from "../services/api";

// Shared option pages are separate from the admin's paginated list.
export const useCategoryOptions = () => {
  const cache = useRef({
    pages: new Map(),
    known: new Map(),
    supplemental: new Map(),
    deleted: new Set(),
    changedTags: new Set(),
    pagination: null,
    revision: 0,
  });
  const request = useRef(null);
  const sequence = useRef(0);
  const retryPage = useRef(1);
  const [state, setState] = useState({
    categories: [],
    knownCategories: new Map(),
    removedCategoryIds: new Set(),
    changedCategoryTags: new Set(),
    categoryPagination: null,
    categoryRevision: 0,
    categoriesLoading: true,
    categoriesError: null,
  });

  const publish = useCallback((extra = {}) => {
    const data = cache.current;
    const options = new Map([...data.pages, ...data.supplemental]);
    setState((old) => ({
      ...old,
      categories: [...options.values()].filter(
        (item) => !data.deleted.has(item.id),
      ),
      knownCategories: new Map(data.known),
      removedCategoryIds: new Set(data.deleted),
      changedCategoryTags: new Set(data.changedTags),
      categoryPagination: data.pagination,
      categoryRevision: data.revision,
      ...extra,
    }));
  }, []);

  const load = useCallback(
    (page) => {
      if (request.current) return request.current;
      const ticket = ++sequence.current;
      retryPage.current = page;
      publish({ categoriesLoading: true, categoriesError: null });
      request.current = (async () => {
        try {
          const res = await api.listCategories({ page, limit: 20 });
          if (ticket !== sequence.current) return;
          if (!res.ok) {
            publish({ categoriesLoading: false, categoriesError: res.error });
            return;
          }
          const data = cache.current;
          if (page === 1) data.pages.clear();
          for (const item of res.data.data.categories) {
            if (data.deleted.has(item.id)) continue;
            data.pages.set(item.id, item);
            data.known.set(item.id, item);
            data.supplemental.delete(item.id);
          }
          data.pagination = res.data.data.pagination;
          publish({ categoriesLoading: false, categoriesError: null });
        } catch (error) {
          if (ticket === sequence.current)
            publish({
              categoriesLoading: false,
              categoriesError: error.message || "Unable to load categories.",
            });
        } finally {
          if (ticket === sequence.current) request.current = null;
        }
      })();
      return request.current;
    },
    [publish],
  );

  useEffect(() => {
    load(1);
    return () => {
      sequence.current += 1;
      request.current = null;
    };
  }, [load]);

  const applyCategoryMutation = useCallback(
    ({ category, deletedId, previousCategory } = {}) => {
      // Invalidate before restarting: an older page must not resurrect a deleted option.
      sequence.current += 1;
      request.current = null;
      const data = cache.current;
      data.pages.clear();
      data.pagination = null;
      data.revision += 1;
      if (deletedId) {
        data.deleted.add(deletedId);
        data.known.delete(deletedId);
        data.supplemental.delete(deletedId);
      }
      if (category?.id) {
        data.deleted.delete(category.id);
        data.known.set(category.id, category);
        data.supplemental.set(category.id, category);
      }
      if (
        previousCategory?.tag &&
        (deletedId || (category && category.tag !== previousCategory.tag))
      ) {
        data.changedTags.add(previousCategory.tag.toLowerCase());
      }
      return load(1);
    },
    [load],
  );

  const loadMoreCategories = useCallback(() => {
    const pagination = cache.current.pagination;
    if (pagination && pagination.page >= pagination.total_pages) return;
    return load(pagination ? pagination.page + 1 : 1);
  }, [load]);
  const retryCategories = useCallback(() => load(retryPage.current), [load]);
  return {
    ...state,
    loadMoreCategories,
    retryCategories,
    applyCategoryMutation,
  };
};
