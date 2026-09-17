import { useMemo, useState } from "react";
import { cn } from "../../lib/cn";
import { useApp } from "../../context/AppContext";
import { Modal } from "../../components/Modal";
import Button from "../../components/Button";

const statusStyles = {
  confirmed: "bg-(--color-moss-tint) text-(--color-moss-deep)",
  pending: "bg-(--color-honey-tint) text-(--color-honey-deep)",
  cancelled: "bg-(--color-paper-raised) text-(--color-ink-soft)",
  completed: "bg-(--color-line) text-(--color-ink)",
};

export function IncomingBookings() {
  const {
    currentUser,
    getMyProfile,
    services,
    bookings,
    slots,
    users,
    cancelBooking,
    completeBooking,
  } = useApp();
  const profile = getMyProfile(currentUser.id);
  const myServiceIds = useMemo(
    () =>
      new Set(
        services
          .filter((s) => s.entrepreneurId === profile.id)
          .map((s) => s.id),
      ),
    [services, profile.id],
  );
  const [cancelTarget, setCancelTarget] = useState(null);

  const today = new Date().toISOString().slice(0, 10);

  const rows = useMemo(
    () =>
      bookings
        .filter((b) => myServiceIds.has(b.serviceId))
        .map((b) => {
          const slot = slots.find((s) => s.id === b.slotId);
          const student = users.find((u) => u.id === b.studentId);
          return { ...b, slot, student };
        })
        .sort((a, b) =>
          `${a.slot?.slotDate}${a.slot?.startTime}`.localeCompare(
            `${b.slot?.slotDate}${b.slot?.startTime}`,
          ),
        ),
    [bookings, myServiceIds, slots, users],
  );

  const groups = {
    today: rows.filter(
      (r) =>
        r.slot?.slotDate === today &&
        (r.status === "confirmed" || r.status === "pending"),
    ),
    upcoming: rows.filter(
      (r) =>
        r.slot?.slotDate > today &&
        (r.status === "confirmed" || r.status === "pending"),
    ),
    past: rows.filter(
      (r) =>
        r.status === "completed" ||
        (r.slot?.slotDate < today && r.status !== "cancelled"),
    ),
  };

  function renderGroup(title, items) {
    if (items.length === 0) return null;
    return (
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-(--color-ink)">
          {title}
        </h2>
        <ul className="mt-3 space-y-3">
          {items.map((b) => (
            <li
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-(--color-line) p-4"
            >
              <div>
                <p className="font-data font-semibold text-(--color-ink)">
                  {b.serviceNameSnapshot}
                </p>
                <p className="text-sm text-(--color-ink-soft)">
                  {b.student?.fullName} · {b.slot?.slotDate} at{" "}
                  {b.slot?.startTime}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-data font-semibold capitalize",
                    statusStyles[b.status],
                  )}
                >
                  {b.status}
                </span>
                {(b.status === "confirmed" || b.status === "pending") && (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => completeBooking(b.id)}
                    >
                      Mark complete
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-(--color-clay-deep)"
                      onClick={() => setCancelTarget(b)}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  const hasAny = rows.length > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="font-data text-xs font-semibold uppercase tracking-wide text-(--color-ink-soft)">
        Dashboard
      </p>
      <h1 className="font-data mt-1 text-2xl font-semibold text-(--color-ink)">
        Incoming bookings
      </h1>

      {!hasAny && (
        <div className="mt-6 rounded-md border border-dashed border-(--color-line) p-10 text-center">
          <p className="font-data font-semibold text-(--color-ink)">
            No bookings yet.
          </p>
          <p className="mt-1 text-sm text-(--color-ink-soft)">
            Once your services are verified and listed, bookings will show up
            here.
          </p>
        </div>
      )}

      {renderGroup("Today", groups.today)}
      {renderGroup("Upcoming", groups.upcoming)}
      {renderGroup("Past", groups.past)}

      <Modal
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        title="Cancel this booking?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelTarget(null)}>
              Keep booking
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                cancelBooking(cancelTarget.id);
                setCancelTarget(null);
              }}
            >
              Cancel booking
            </Button>
          </>
        }
      >
        The student will see this as cancelled and the slot will reopen.
      </Modal>
    </div>
  );
}
