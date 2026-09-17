import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, MapPin, CheckCircle2, Calendar as CalendarIcon, X } from "lucide-react";
import api from "../../services/api";
import { useApp } from "../../context/AppContext";
import Button from "../../components/Button";
import { ErrorSummary } from "../../components/ErrorSummary";

export default function ServiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useApp();
  
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Booking Modal State
  const [showModal, setShowModal] = useState(false);
  const [occurrences, setOccurrences] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  // Simple week state (starts at today)
  const [startDate, setStartDate] = useState(new Date());

  useEffect(() => {
    async function fetchService() {
      try {
        const res = await api.getService(id);
        if (res.ok) setService(res.data.data.service);
        else setError(res.error || "Service not found");
      } catch (err) {
        setError("Failed to load service");
      } finally {
        setLoading(false);
      }
    }
    fetchService();
  }, [id]);

  useEffect(() => {
    if (showModal) {
      fetchAvailability(startDate);
    }
  }, [showModal, startDate]);

  const fetchAvailability = async (start) => {
    setLoadingSlots(true);
    const end = new Date(start);
    end.setDate(end.getDate() + 6); // fetch 1 week
    
    const fromStr = start.toISOString().split('T')[0];
    const toStr = end.toISOString().split('T')[0];
    
    const res = await api.getAvailability(id, fromStr, toStr);
    if (res.ok) setOccurrences(res.data.data.occurrences);
    setLoadingSlots(false);
  };

  const handleBookSlot = async (slot) => {
    if (!currentUser) {
      alert("You must be logged in to book a service.");
      navigate("/login");
      return;
    }
    if (window.confirm("Book  for ?")) {
      const payload = {
        service_id: slot.service_id,
        slot_id: slot.slot_id,
        slot_version: slot.slot_version,
        starts_at: slot.starts_at
      };
      const res = await api.createBooking(payload);
      if (res.ok) {
        alert("Booking successful!");
        setShowModal(false);
        navigate("/dashboard/student");
      } else {
        alert(res.error || "Failed to create booking. The slot might have been taken.");
        fetchAvailability(startDate); // refresh
      }
    }
  };

  if (loading) return <div className="p-20 text-center">Loading...</div>;
  if (error || !service) return <div className="p-20 text-center">{error}</div>;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link to="/services" className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink dark:text-paper/70 dark:hover:text-paper mb-8 no-underline">
        <ArrowLeft size={16} /> Back to Search
      </Link>
      
      <div className="bg-paper-raised dark:bg-ink-raised rounded-2xl p-6 md:p-10 shadow-sm border border-line dark:border-line-dark">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-ink dark:text-paper mb-2">{service.title}</h1>
            <div className="flex items-center gap-2 text-ink-soft dark:text-paper/70 mb-6">
              <span className="font-medium">{service.entrepreneur?.business_name}</span>
              <CheckCircle2 size={16} className="text-green-600 dark:text-green-500" />
            </div>
            <p className="text-ink-soft mb-8">{service.description}</p>
            
            <div className="flex flex-wrap gap-6 mb-8 border-t border-line pt-6">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-honey-deep" /> {service.duration_minutes} min
              </div>
              <div className="flex items-center gap-2 capitalize">
                <MapPin size={18} className="text-honey-deep" /> {service.location_type.replace('_', ' ')}
              </div>
            </div>
          </div>
          
          <div className="md:w-72 bg-white dark:bg-ink rounded-xl p-6 border shadow-sm shrink-0 text-center">
            <p className="text-sm text-ink-soft mb-1">Price</p>
            <p className="text-3xl font-bold mb-6">GH₵{service.price}</p>
            <Button className="w-full justify-center py-3" onClick={() => setShowModal(true)}>
              Book Now
            </Button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-paper dark:bg-ink rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Select a Time</h2>
              <button onClick={() => setShowModal(false)}><X /></button>
            </div>
            
            <div className="flex justify-between mb-4">
              <Button variant="secondary" onClick={() => {
                const prev = new Date(startDate);
                prev.setDate(prev.getDate() - 7);
                setStartDate(prev);
              }}>Previous Week</Button>
              <Button variant="secondary" onClick={() => {
                const next = new Date(startDate);
                next.setDate(next.getDate() + 7);
                setStartDate(next);
              }}>Next Week</Button>
            </div>

            {loadingSlots ? (
              <div className="text-center p-10">Loading availability...</div>
            ) : occurrences.length === 0 ? (
              <div className="text-center p-10 text-ink-soft">No availability this week. Try next week!</div>
            ) : (
              <div className="space-y-4">
                {/* Group by date */}
                {[...new Set(occurrences.map(o => o.date))].map(date => (
                  <div key={date}>
                    <h3 className="font-bold mb-2">{new Date(date).toLocaleDateString(undefined, {weekday: 'long', month: 'short', day: 'numeric'})}</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {occurrences.filter(o => o.date === date).map(slot => (
                        <button
                          key={slot.starts_at}
                          onClick={() => handleBookSlot(slot)}
                          className="px-3 py-2 border rounded-md hover:bg-honey-tint hover:border-honey-deep text-sm font-medium transition-colors"
                        >
                          {slot.start_time}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
