import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { useApp } from "../../context/AppContext";
import { Calendar, Clock, MapPin, CheckCircle, XCircle } from "lucide-react";
import Button from "../../components/Button";

export default function StudentDashboard() {
  const { currentUser } = useApp();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    setLoading(true);
    const res = await api.listStudentBookings();
    if (res.ok) setBookings(res.data.data.bookings);
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (id) => {
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      const res = await api.updateBookingStatus(id, 'cancelled');
      if (res.ok) fetchBookings();
      else alert(res.error || "Failed to cancel booking");
    }
  };

  if (loading) return <div className="p-10 text-center">Loading bookings...</div>;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-ink dark:text-paper">My Bookings</h1>
        <p className="text-ink-soft dark:text-paper/70 mt-1">
          Welcome back, {currentUser?.full_name}. Here are your scheduled services.
        </p>
      </div>

      <div className="bg-paper-raised dark:bg-ink-raised rounded-2xl border border-line dark:border-line-dark shadow-sm overflow-hidden">
        {bookings.length === 0 ? (
          <div className="p-10 text-center">
            <Calendar className="mx-auto mb-4 text-ink-soft opacity-50" size={40} />
            <p className="text-ink-soft dark:text-paper/70 mb-4">You haven't booked any services yet.</p>
            <Button to="/services" variant="secondary">Explore Services</Button>
          </div>
        ) : (
          <div className="divide-y divide-line dark:divide-line-dark">
            {bookings.map(booking => {
              const start = new Date(booking.starts_at);
              const end = new Date(booking.ends_at);
              return (
                <div key={booking.id} className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg">{booking.service_name_snapshot}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : ''} ${booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''} ${booking.status === 'cancelled' ? 'bg-red-100 text-red-700' : ''} ${booking.status === 'completed' ? 'bg-blue-100 text-blue-700' : ''}`}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-ink-soft mb-1">
                      By {booking.service?.entrepreneur?.business_name}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-ink-soft dark:text-paper/60">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} /> {start.toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} /> {start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                      <span className="flex items-center gap-1 font-mono bg-ink/5 px-1.5 py-0.5 rounded">
                        Ref: {booking.booking_reference}
                      </span>
                    </div>
                  </div>
                  
                  {['pending', 'confirmed'].includes(booking.status) && (
                    <button 
                      onClick={() => handleCancel(booking.id)}
                      className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded-md transition-colors shrink-0"
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
