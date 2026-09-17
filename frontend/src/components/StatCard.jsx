export function StatCard({ icon, value, label, accent = "honey" }) {
  const accents = {
    honey: "bg-(--color-honey-tint) text-(--color-honey-deep)",
    moss: "bg-(--color-moss-tint) text-(--color-moss-deep)",
    clay: "bg-(--color-clay-tint) text-(--color-clay-deep)",
  };
  return (
    <div className="flex items-center gap-4 rounded-lg border border-(--color-line) bg-white p-5">
      <div
        className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full font-data text-lg ${accents[accent]}`}
      >
        {icon}
      </div>
      <div>
        <p className="font-data text-2xl font-semibold leading-none text-(--color-ink)">
          {value}
        </p>
        <p className="mt-1 text-sm text-(--color-ink-soft)">{label}</p>
      </div>
    </div>
  );
}
