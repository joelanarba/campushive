import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, Trash2, Plus } from "lucide-react";
import api from "../../services/api";
import Button from "../../components/Button";
import { RequestError } from "../../components/RequestError";
import { Pagination } from "../../components/Pagination";
import { usePagedList } from "../../hooks/usePagedList";
import { useForm } from "react-hook-form";

const WEEKDAYS = [
  { id: 1, name: "Monday" },
  { id: 2, name: "Tuesday" },
  { id: 3, name: "Wednesday" },
  { id: 4, name: "Thursday" },
  { id: 5, name: "Friday" },
  { id: 6, name: "Saturday" },
  { id: 7, name: "Sunday" },
];

const AvailabilityManager = () => {
  const { id } = useParams();
  const [page, setPage] = useState(1);
  const request = useCallback(
    (params) => api.listMyAvailability(id, params),
    [id],
  );
  const schedule = usePagedList(request, { page, limit: 20 }, "slots", setPage);
  const slots = schedule.items;
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [service, setService] = useState(null);
  const [serviceError, setServiceError] = useState(null);
  const [serviceRevision, setServiceRevision] = useState(0);
  const [error, setError] = useState(null);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      weekday: 1,
      start_time: "09:00",
      end_time: "17:00",
    },
  });

  useEffect(() => {
    let active = true;
    setPage(1);
    setService(null);
    setServiceError(null);
    api.getMyService(id).then((res) => {
      if (!active) return;
      if (res.ok) setService(res.data.data.service);
      else setServiceError(res.error);
    });
    return () => {
      active = false;
    };
  }, [id, serviceRevision]);

  const onAddSlot = async (data) => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    const payload = {
      weekday: parseInt(data.weekday),
      start_time: data.start_time,
      end_time: data.end_time,
    };
    const res = await api.createMyAvailability(id, payload);
    if (res.ok) {
      schedule.reload();
      reset();
      setSuccess("Availability added.");
    } else {
      setError(res.error || "Failed to add availability slot");
    }
    setSubmitting(false);
  };

  const onDeleteSlot = async (slotId) => {
    if (submitting || !window.confirm("Delete this availability slot?")) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    const res = await api.deleteMyAvailability(id, slotId);
    if (res.ok) {
      schedule.reload();
      setSuccess("Availability removed.");
    } else setError(res.error);
    setSubmitting(false);
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link
        to="/dashboard/entrepreneur"
        className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink dark:text-paper/70 dark:hover:text-paper mb-8 no-underline">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink dark:text-paper">
          Manage Availability
        </h1>
        <p className="text-ink-soft dark:text-paper/70 mt-2">
          Set your working hours for <strong>{service?.title}</strong>. Students
          will only be able to book you during these times.
        </p>
      </div>

      <RequestError
        error={serviceError}
        onRetry={() => setServiceRevision((value) => value + 1)}
      />
      <RequestError error={error} />
      {success && (
        <p role="status" className="mb-4 text-green-700 dark:text-green-400">
          {success}
        </p>
      )}
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <form
            onSubmit={handleSubmit(onAddSlot)}
            className="bg-paper-raised dark:bg-ink-raised p-5 rounded-xl border border-line dark:border-line-dark shadow-sm space-y-4">
            <h3 className="font-bold text-lg mb-4">Add New Slot</h3>

            <div>
              <label className="block text-sm font-medium mb-1">
                Day of Week
              </label>
              <select
                {...register("weekday")}
                className="w-full rounded-md border border-line bg-transparent px-3 py-2 text-ink dark:border-line-dark dark:text-paper">
                {WEEKDAYS.map((w) => (
                  <option
                    key={w.id}
                    value={w.id}
                    className="bg-white text-black dark:bg-zinc-900 dark:text-white">
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Start Time
              </label>
              <input
                type="time"
                {...register("start_time")}
                className="w-full rounded-md border border-line bg-transparent px-3 py-2 text-ink dark:border-line-dark dark:text-paper"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">End Time</label>
              <input
                type="time"
                {...register("end_time")}
                className="w-full rounded-md border border-line bg-transparent px-3 py-2 text-ink dark:border-line-dark dark:text-paper"
              />
            </div>

            <Button
              disabled={submitting || !service}
              type="submit"
              className="w-full justify-center mt-4 gap-2">
              <Plus size={16} /> Add Slot
            </Button>
          </form>
        </div>

        <div className="md:col-span-2 space-y-4">
          <h3 className="font-bold text-lg">Current Schedule</h3>

          {schedule.loading ? (
            <p role="status">Loading availability...</p>
          ) : schedule.error ? (
            <RequestError error={schedule.error} onRetry={schedule.reload} />
          ) : slots.length === 0 ? (
            <div className="p-8 text-center bg-paper-raised dark:bg-ink-raised rounded-xl border border-line dark:border-line-dark">
              <Clock
                className="mx-auto mb-3 text-ink-soft opacity-50"
                size={32}
              />
              <p className="text-ink-soft">
                No availability slots set. Students cannot book this service
                yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-4 bg-paper-raised dark:bg-ink-raised rounded-xl border border-line dark:border-line-dark">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-honey-tint dark:bg-honey-deep/20 flex items-center justify-center text-honey-deep font-bold">
                      {WEEKDAYS.find(
                        (w) => w.id === slot.weekday,
                      )?.name.substring(0, 3)}
                    </div>
                    <div>
                      <p className="font-semibold">
                        {WEEKDAYS.find((w) => w.id === slot.weekday)?.name}
                      </p>
                      <p className="text-sm text-ink-soft">
                        {slot.start_time} - {slot.end_time}
                      </p>
                    </div>
                  </div>
                  <button
                    disabled={submitting}
                    aria-label="Delete availability slot"
                    onClick={() => onDeleteSlot(slot.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {!schedule.error && (
            <Pagination
              pagination={schedule.pagination}
              onPageChange={setPage}
              disabled={schedule.loading || submitting}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AvailabilityManager;
