import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ServiceCard from "../../components/ServiceCard";

const CATEGORIES = ["All", "Beauty", "Food", "Tech", "Academics"];

// TODO: swap for a query helper from src/data/mockData.js once it's wired up
const SERVICES = [
  {
    id: "skin-fade-lineup",
    category: "Beauty",
    name: "Skin Fade + Line-up",
    provider: "Kwame's Barber Studio · Commonwealth Hall, Block C",
    price: "GH₵35",
    description: "Precision fade with a sharp line-up finish.",
    duration: "40 min",
  },
  {
    id: "beard-trim",
    category: "Beauty",
    name: "Beard Trim",
    provider: "Kwame's Barber Studio · Commonwealth Hall, Block C",
    price: "GH₵15",
    description: "Shape-up and beard oil finish.",
    duration: "20 min",
  },
  {
    id: "knotless-braids-medium",
    category: "Beauty",
    name: "Knotless Braids (Medium)",
    provider: "Efua's Braids & Twists · Volta Hall Annex",
    price: "GH₵180",
    description: "Full head, medium-size knotless braids. Hair not included.",
    duration: "240 min",
  },
  {
    id: "graduation-portrait-session",
    category: "Beauty",
    name: "Graduation Portrait Session",
    provider: "Kojo Antwi Photography · Legon Hall",
    price: "GH₵120",
    description: "30-minute shoot, 10 edited digital photos.",
    duration: "30 min",
  },
];

export default function ServicesSearch() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("category");
  const initialLabel =
    CATEGORIES.find((c) => c.toLowerCase() === initialCategory) ?? "All";

  const [activeCategory, setActiveCategory] = useState(initialLabel);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return SERVICES.filter((svc) => {
      const matchesCategory =
        activeCategory === "All" || svc.category === activeCategory;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        svc.name.toLowerCase().includes(q) ||
        svc.provider.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query]);

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
          placeholder="Search services or providers…"
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
        {CATEGORIES.map((cat) => {
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
            category={svc.category}
            name={svc.name}
            provider={svc.provider}
            price={svc.price}
            description={svc.description}
            duration={svc.duration}
            to={`/providers/${svc.id}`}
          />
        ))}
      </ul>
    </div>
  );
}
