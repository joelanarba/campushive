import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { FormField } from "../../components/FormField";
import { ErrorSummary } from "../../components/ErrorSummary";
import Button from "../../components/Button";

export function ManageAvailability() {
  const { serviceId } = useParams();
  const { services, slots, addSlot, removeSlot } = useApp();
  const service = services.find((s) => s.id === serviceId);
  const serviceSlots = slots
    .filter((s) => s.serviceId === serviceId)
    .sort((a, b) =>
      `${a.slotDate}${a.startTime}`.localeCompare(
        `${b.slotDate}${b.startTime}`,
      ),
    );

  const [form, setForm] = useState({
    slotDate: "",
    startTime: "",
    endTime: "",
  });
  const [errors, setErrors] = useState({});

  if (!service) {
    return (
      <p className="mx-auto max-w-md px-4 py-16 text-center text-(--color-ink)">
        Service not found.
      </p>
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    const next = {};
    if (!form.slotDate) next.slotDate = "Choose a date.";
    if (!form.startTime) next.startTime = "Choose a start time.";
    if (!form.endTime) next.endTime = "Choose an end time.";
    if (form.startTime && form.endTime && form.endTime <= form.startTime)
      next.endTime = "End time must be after the start time.";
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    addSlot({ serviceId, ...form });
    setForm({ slotDate: "", startTime: "", endTime: "" });
    setErrors({});
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link
        to="/dashboard/services"
        className="text-sm font-data font-medium text-(--color-honey-deep) hover:underline"
      >
        Back to services
      </Link>
      <h1 className="mt-2 font-data text-2xl font-semibold text-(--color-ink)">
        Availability — {service.title}
      </h1>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-6 rounded-md border border-(--color-line) p-5"
      >
        <h2 className="mb-4 font-display text-lg font-semibold text-(--color-ink)">
          Add a time slot
        </h2>
        <ErrorSummary errors={errors} />
        <div className="grid grid-cols-3 gap-3">
          <FormField
            id="slotDate"
            label="Date"
            type="date"
            value={form.slotDate}
            onChange={(e) =>
              setForm((p) => ({ ...p, slotDate: e.target.value }))
            }
            error={errors.slotDate}
          />
          <FormField
            id="startTime"
            label="Start"
            type="time"
            value={form.startTime}
            onChange={(e) =>
              setForm((p) => ({ ...p, startTime: e.target.value }))
            }
            error={errors.startTime}
          />
          <FormField
            id="endTime"
            label="End"
            type="time"
            value={form.endTime}
            onChange={(e) =>
              setForm((p) => ({ ...p, endTime: e.target.value }))
            }
            error={errors.endTime}
          />
        </div>
        <Button type="submit" variant="primary">
          Add slot
        </Button>
      </form>

      {serviceSlots.length === 0 ? (
        <p className="mt-6 text-sm text-(--color-ink-soft)">
          No time slots yet — add one above.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-(--color-line) rounded-md border border-(--color-line)">
          {serviceSlots.map((slot) => (
            <li
              key={slot.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <span className="text-sm font-data text-(--color-ink)">
                {slot.slotDate} · {slot.startTime}–{slot.endTime}
                {slot.isBooked && (
                  <span className="ml-2 rounded-full bg-(--color-moss-tint) px-2 py-0.5 text-xs font-semibold text-(--color-moss-deep)">
                    Booked
                  </span>
                )}
              </span>
              {!slot.isBooked && (
                <Button
                  variant="ghost"
                  className="text-(--color-clay-deep)"
                  onClick={() => removeSlot(slot.id)}
                >
                  Remove
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
