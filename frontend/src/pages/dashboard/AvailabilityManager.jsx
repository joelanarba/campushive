import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, Trash2, Plus } from "lucide-react";
import api from "../../services/api";
import Button from "../../components/Button";
import { ErrorSummary } from "../../components/ErrorSummary";
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

export default function AvailabilityManager() {
  const { id } = useParams();
  const [slots, setSlots] = useState([]);
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      weekday: 1,
      start_time: "09:00",
      end_time: "17:00"
    }
  });

  const fetchAvailability = async () => {
    setLoading(true);
    // 1. Fetch Service Info
    const svcRes = await api.getMyService(id);
    if (svcRes.ok) setService(svcRes.data.data.service);

    const slotsRes = await api.get(`/entrepreneurs/me/services/${id}/availability`);
    if (slotsRes.ok) {
      setSlots(slotsRes.data.data.slots);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAvailability();
  }, [id]);

  const onAddSlot = async (data) => {
    setError(null);
    const payload = {
      weekday: parseInt(data.weekday),
      start_time: data.start_time,
      end_time: data.end_time
    };
    const res = await api.post(`/entrepreneurs/me/services/${id}/availability`, payload);
    if (res.ok) {
      fetchAvailability();
      reset();
    } else {
      setError(res.error || "Failed to add availability slot");
    }
  };

  const onDeleteSlot = async (slotId) => {
    if (window.confirm("Delete this availability slot?")) {
      const res = await api.delete(`/entrepreneurs/me/services/${id}/availability/${slotId}`);
      if (res.ok) fetchAvailability();
      else alert(res.error || "Failed to delete");
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link to="/dashboard/entrepreneur" className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink dark:text-paper/70 dark:hover:text-paper mb-8 no-underline">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink dark:text-paper">Manage Availability</h1>
        <p className="text-ink-soft dark:text-paper/70 mt-2">
          Set your working hours for <strong>{service?.title}</strong>. Students will only be able to book you during these times.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <form onSubmit={handleSubmit(onAddSlot)} className="bg-paper-raised dark:bg-ink-raised p-5 rounded-xl border border-line dark:border-line-dark shadow-sm space-y-4">
            <h3 className="font-bold text-lg mb-4">Add New Slot</h3>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            
            <div>
              <label className="block text-sm font-medium mb-1">Day of Week</label>
              <select {...register("weekday")} className="w-full rounded-md border border-line bg-transparent px-3 py-2 text-ink dark:border-line-dark dark:text-paper">
                {WEEKDAYS.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Start Time</label>
              <input type="time" {...register("start_time")} className="w-full rounded-md border border-line bg-transparent px-3 py-2 text-ink dark:border-line-dark dark:text-paper" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">End Time</label>
              <input type="time" {...register("end_time")} className="w-full rounded-md border border-line bg-transparent px-3 py-2 text-ink dark:border-line-dark dark:text-paper" />
            </div>

            <Button type="submit" className="w-full justify-center mt-4 gap-2">
              <Plus size={16} /> Add Slot
            </Button>
          </form>
        </div>

        <div className="md:col-span-2 space-y-4">
          <h3 className="font-bold text-lg">Current Schedule</h3>
          
          {slots.length === 0 ? (
            <div className="p-8 text-center bg-paper-raised dark:bg-ink-raised rounded-xl border border-line dark:border-line-dark">
              <Clock className="mx-auto mb-3 text-ink-soft opacity-50" size={32} />
              <p className="text-ink-soft">No availability slots set. Students cannot book this service yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {slots.map(slot => (
                <div key={slot.id} className="flex items-center justify-between p-4 bg-paper-raised dark:bg-ink-raised rounded-xl border border-line dark:border-line-dark">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-honey-tint dark:bg-honey-deep/20 flex items-center justify-center text-honey-deep font-bold">
                      {WEEKDAYS.find(w => w.id === slot.weekday)?.name.substring(0,3)}
                    </div>
                    <div>
                      <p className="font-semibold">{WEEKDAYS.find(w => w.id === slot.weekday)?.name}</p>
                      <p className="text-sm text-ink-soft">{slot.start_time} - {slot.end_time}</p>
                    </div>
                  </div>
                  <button onClick={() => onDeleteSlot(slot.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
