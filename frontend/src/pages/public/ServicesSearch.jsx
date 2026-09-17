import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ServiceCard from "../../components/ServiceCard";
import { useApp } from "../../context/AppContext";

export default function ServicesSearch() {
  const { services = [], categories = [] } = useApp();
  const [searchParams] = useSearchParams();
  
  // Format categories from DB
  const categoryLabels = ["All", ...categories.map(c => c.category_name)];
  
  const initialCategory = searchParams.get("category");
  const initialLabel = categories.find(c => c.tag.toLowerCase() === initialCategory)?.category_name || "All";

  const [activeCategory, setActiveCategory] = useState(initialLabel);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return services.filter((svc) => {
      const catName = svc.category?.category_name;
      const providerName = svc.entrepreneur?.business_name;
      const svcName = svc.title;
      
      const matchesCategory =
        activeCategory === "All" || catName === activeCategory;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        (svcName && svcName.toLowerCase().includes(q)) ||
        (providerName && providerName.toLowerCase().includes(q));
        
      return matchesCategory && matchesQuery;
    });
  }, [services, activeCategory, query]);

  return (
    <div className="mx-auto max-w-wrap px-6 py-10">
      <h1 className="text-[2rem] font-semibold">Find a service</h1>
      <p className="mb-7 mt-1 text-ink-soft dark:text-paper/70">
        Only verified campus entrepreneurs show up here.
      </p>

      <form
        role="search"
        onSubmit={(e) => e.preventDefault()}
        className="flex max-w-[26rem] gap-2"
      >
        <label htmlFor="q" className="sr-only">
          Search by service or provider name
        </label>
        <input
          id="q"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search services or providers?"
          className="w-full rounded-md border border-line bg-white px-4 py-[0.65rem] font-data text-[0.95rem] text-ink dark:border-line-dark dark:bg-ink-raised dark:text-paper"
        />
        <button
          type="submit"
          className="rounded-md bg-honey px-[1.1rem] py-[0.65rem] font-data font-semibold text-ink hover:bg-honey-deep hover:text-white"
        >
          Search
        </button>
      </form>

      <div
        role="group"
        aria-label="Filter by category"
        className="mt-5 flex flex-wrap gap-2"
      >
        {categoryLabels.map((cat) => {
          const active = cat === activeCategory;
          return (
            <button
              key={cat}
              type="button"
              aria-pressed={active}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full border px-[0.9rem] py-[0.4rem] font-data text-sm font-medium ${
                active
                  ? "border-ink bg-ink text-paper dark:border-paper dark:bg-paper dark:text-ink"
                  : "border-line bg-transparent text-ink dark:border-line-dark dark:text-paper"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      <p
        aria-live="polite"
        className="my-5 text-sm text-ink-soft dark:text-paper/70"
      >
        {filtered.length} service{filtered.length === 1 ? "" : "s"} found
      </p>

      <ul className="grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-2">
        {filtered.map((svc) => (
          <ServiceCard
            key={svc.id}
            category={svc.category?.category_name || "Uncategorized"}
            name={svc.title}
            provider={svc.entrepreneur?.business_name || "Unknown Provider"}
            price={`GH₵${svc.price}`}
            description={svc.description}
            duration={`${svc.duration_minutes} min`}
            to={`/services/${svc.id}`}
          />
        ))}
      </ul>
    </div>
  );
}
