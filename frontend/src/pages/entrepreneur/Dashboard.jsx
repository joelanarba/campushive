import { Link } from "react-router-dom";
import { StatusBanner } from "../../components/StatusBanner";
import { useApp } from "../../context/AppContext";

export function Dashboard() {
  const { currentUser, getMyProfile, services, bookings, slots, users } =
    useApp();
  const profile = getMyProfile(currentUser.id);
  const myServices = services.filter((s) => s.entrepreneurId === profile?.id);
  const myServiceIds = new Set(myServices.map((s) => s.id));
  const myBookings = bookings.filter((b) => myServiceIds.has(b.serviceId));
  const upcoming = myBookings
    .filter((b) => b.status === "confirmed" || b.status === "pending")
    .map((b) => ({
      ...b,
      slot: slots.find((s) => s.id === b.slotId),
      student: users.find((u) => u.id === b.studentId),
    }))
    .sort((a, b) =>
      `${a.slot?.slotDate}${a.slot?.startTime}`.localeCompare(
        `${b.slot?.slotDate}${b.slot?.startTime}`,
      ),
    );

  const nextStepByStatus = {
    pending:
      "You'll be able to receive bookings as soon as an admin reviews your profile.",
    rejected:
      "Update your profile with the details below, then it will be reviewed again.",
    suspended:
      "Contact an admin to resolve this before you can receive new bookings.",
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="font-data text-xs font-semibold uppercase tracking-wide text-(--color-ink-soft)">
        Dashboard
      </p>
      <h1 className="font-data mt-1 text-2xl font-semibold text-(--color-ink)">
        {profile?.businessName || "Your business"}
      </h1>

      <div className="mt-4">
        <StatusBanner
          status={profile?.verificationStatus}
          reason={profile?.rejectionReason}
          nextStep={nextStepByStatus[profile?.verificationStatus]}
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon="🛠"
          value={myServices.length}
          label="Services listed"
          accent="honey"
        />
        <StatCard
          icon="📅"
          value={upcoming.length}
          label="Upcoming bookings"
          accent="moss"
        />
        <StatCard
          icon="📋"
          value={myBookings.length}
          label="Total bookings"
          accent="clay"
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/dashboard/services"
          className="rounded-md border border-(--color-line) px-4 py-2.5 font-data text-sm font-semibold text-(--color-ink) hover:border-(--color-honey-deep)"
        >
          Manage services
        </Link>
        <Link
          to="/dashboard/bookings"
          className="rounded-md border border-(--color-line) px-4 py-2.5 font-data text-sm font-semibold text-(--color-ink) hover:border-(--color-honey-deep)"
        >
          View bookings
        </Link>
        <Link
          to="/dashboard/profile"
          className="rounded-md border border-(--color-line) px-4 py-2.5 font-data text-sm font-semibold text-(--color-ink) hover:border-(--color-honey-deep)"
        >
          Edit business profile
        </Link>
      </div>

      <div className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="font-data text-lg font-semibold text-(--color-ink)">
            Next up
          </h2>
          <Link
            to="/dashboard/bookings"
            className="font-data text-sm font-semibold text-(--color-honey-deep) hover:underline"
          >
            View all
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <div className="mt-3 rounded-md border border-dashed border-(--color-line) p-8 text-center">
            <p className="font-data text-sm font-medium text-(--color-ink)">
              Nothing booked yet.
            </p>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-(--color-line) rounded-md border border-(--color-line)">
            {upcoming.slice(0, 4).map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <p className="font-data text-sm font-medium text-(--color-ink)">
                    {b.serviceNameSnapshot}
                  </p>
                  <p className="text-xs text-(--color-ink-soft)">
                    {b.student?.fullName}
                  </p>
                </div>
                <p className="font-data text-sm text-(--color-ink-soft)">
                  {b.slot?.slotDate} · {b.slot?.startTime}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
