import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ServiceCard from "../../components/ServiceCard";
import { Pagination } from "../../components/Pagination";
import { RequestError } from "../../components/RequestError";
import { usePagedList } from "../../hooks/usePagedList";
import { useApp } from "../../context/AppContext";
import api from "../../services/api";

const ServicesSearch = () => {
  const {
    categories,
    categoriesLoading,
    categoriesError,
    categoryPagination,
    loadMoreCategories,
    retryCategories,
    knownCategories,
    removedCategoryIds,
    changedCategoryTags,
    categoryRevision,
  } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const categoryId = searchParams.get("category_id") || "";
  const entrepreneurId = searchParams.get("entrepreneur_id") || "";
  const requestedPage = Number(searchParams.get("page") || 1);
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;
  const [query, setQuery] = useState(q);
  const [categoryNotice, setCategoryNotice] = useState(null);
  const previousRevision = useRef(categoryRevision);
  const selectedCategory = knownCategories.get(categoryId);
  const categoryOptions =
    selectedCategory && !categories.some((item) => item.id === categoryId)
      ? [selectedCategory, ...categories]
      : categories;
  useEffect(() => {
    setQuery(q);
  }, [q]);
  const setPage = useCallback(
    (value) =>
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        next.set("page", String(value));
        return next;
      }),
    [setSearchParams],
  );
  const list = usePagedList(
    api.listServices,
    {
      page,
      limit: 20,
      q,
      category_tag: category,
      category_id: categoryId,
      entrepreneur_id: entrepreneurId,
    },
    "services",
    setPage,
  );
  useEffect(() => {
    if (previousRevision.current === categoryRevision) return;
    previousRevision.current = categoryRevision;
    list.reload();
  }, [categoryRevision, list.reload]);
  useEffect(() => {
    if (!categoryId || !removedCategoryIds.has(categoryId)) return;
    setCategoryNotice(
      "The selected category was removed. Showing results without that category filter.",
    );
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete("category_id");
        next.set("page", "1");
        return next;
      },
      { replace: true },
    );
  }, [categoryId, removedCategoryIds, setSearchParams]);
  const changeFilter = (key, value) =>
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      if (value) next.set(key, value);
      else next.delete(key);
      if (key === "category") next.delete("category_id");
      if (key === "category_id") next.delete("category");
      next.set("page", "1");
      return next;
    });
  return (
    <div className="mx-auto max-w-wrap px-6 py-10">
      <h1 className="text-[2rem] font-semibold">Find a service</h1>
      <p className="mb-7 mt-1 text-ink-soft dark:text-paper/70">
        Only verified campus entrepreneurs show up here.
      </p>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          changeFilter("q", query.trim());
        }}
        className="flex max-w-[26rem] gap-2">
        <label htmlFor="q" className="sr-only">
          Search by service or provider name
        </label>
        <input
          id="q"
          type="search"
          value={query}
          maxLength={200}
          onChange={(event) => {
            const value = event.target.value;
            setQuery(value);
            if (!value.trim() && q) changeFilter("q", "");
          }}
          placeholder="Search services or providers"
          className="w-full rounded-md border border-line bg-white px-4 py-[0.65rem] font-data text-[0.95rem] text-ink dark:border-line-dark dark:bg-ink-raised dark:text-paper"
        />
        <button
          type="submit"
          className="rounded-md bg-honey px-4 py-2 font-semibold text-ink hover:bg-honey-deep hover:text-white">
          Search
        </button>
      </form>
      <div
        role="group"
        aria-label="Filter by category"
        className="mt-5 flex flex-wrap gap-2">
        {[{ id: "all", tag: "", category_name: "All" }, ...categoryOptions].map(
          (item) => {
            const active =
              item.id === "all"
                ? !category && !categoryId
                : categoryId === item.id ||
                  (!!category &&
                    item.tag.toLowerCase() === category.toLowerCase());
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setCategoryNotice(null);
                  changeFilter("category_id", item.id === "all" ? "" : item.id);
                }}
                className={
                  "rounded-full border px-4 py-2 text-sm " +
                  (active
                    ? "border-ink bg-ink text-paper dark:border-paper dark:bg-paper dark:text-ink"
                    : "border-line text-ink dark:border-line-dark dark:text-paper")
                }>
                {item.category_name}
              </button>
            );
          },
        )}
      </div>
      {(category || categoryId) && (
        <p className="mt-3 text-sm">
          Category filter:{" "}
          {categoryId
            ? selectedCategory?.category_name || categoryId
            : category}{" "}
          <button
            type="button"
            className="underline"
            onClick={() => {
              setCategoryNotice(null);
              changeFilter("category_id", "");
            }}>
            Clear category filter
          </button>
        </p>
      )}
      {categoryNotice && (
        <p
          role="status"
          className="mt-3 text-sm text-ink-soft dark:text-paper/70">
          {categoryNotice}
        </p>
      )}
      {category && changedCategoryTags.has(category.toLowerCase()) && (
        <p
          role="status"
          className="mt-3 text-sm text-ink-soft dark:text-paper/70">
          A category using this tag was changed or removed. This filter still
          matches any categories using the tag.{" "}
          <button
            type="button"
            className="underline"
            onClick={() => changeFilter("category_id", "")}>
            Clear category filter
          </button>
        </p>
      )}
      <RequestError
        error={categoriesError}
        onRetry={categoriesLoading ? undefined : retryCategories}
      />
      {categoriesLoading ? (
        <p role="status" className="mt-3 text-sm">
          Loading categories...
        </p>
      ) : (
        categoryPagination?.page < categoryPagination?.total_pages && (
          <button
            type="button"
            onClick={loadMoreCategories}
            className="mt-3 text-sm underline">
            Load more categories
          </button>
        )
      )}
      {entrepreneurId && (
        <p className="mt-3 text-sm">
          Showing this provider’s services.{" "}
          <button
            type="button"
            onClick={() => changeFilter("entrepreneur_id", "")}
            className="underline">
            Show all providers
          </button>
        </p>
      )}
      {list.loading ? (
        <p role="status" className="my-6">
          Loading services...
        </p>
      ) : list.error ? (
        <RequestError error={list.error} onRetry={list.reload} />
      ) : (
        <>
          <p
            aria-live="polite"
            className="my-5 text-sm text-ink-soft dark:text-paper/70">
            {list.pagination?.total || 0} services found
          </p>
          {list.items.length === 0 ? (
            <p className="py-6">No services match these filters.</p>
          ) : (
            <ul className="grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-2">
              {list.items.map((service) => (
                <ServiceCard
                  key={service.id}
                  category={service.category?.category_name || "Uncategorized"}
                  name={service.title}
                  provider={
                    service.entrepreneur?.business_name || "Unknown Provider"
                  }
                  price={"GH\u20b5" + service.price}
                  description={service.description}
                  duration={service.duration_minutes + " min"}
                  to={"/services/" + service.id}
                />
              ))}
            </ul>
          )}
        </>
      )}
      {!list.error && (
        <Pagination
          pagination={list.pagination}
          onPageChange={setPage}
          disabled={list.loading}
        />
      )}
    </div>
  );
};
export default ServicesSearch;
