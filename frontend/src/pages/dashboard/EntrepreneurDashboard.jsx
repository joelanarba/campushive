import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Clock,
  Calendar,
  CheckCircle,
} from "lucide-react";
import api from "../../services/api";
import { useApp } from "../../context/AppContext";
import Button from "../../components/Button";

export default function EntrepreneurDashboard() {
  const { currentUser } = useApp();
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const [svcRes, bkRes] = await Promise.all([
      api.listMyServices(),
      api.listEntrepreneurBookings(),
    ]);

    if (svcRes.ok) setServices(svcRes.data.data.services || []);
    if (bkRes.ok) setBookings(bkRes.data.data.bookings || []);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id, title) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      const res = await api.deleteMyService(id);
      if (res.ok) {
        setServices(services.filter((s) => s.id !== id));
      } else {
        alert(res.error || "Failed to delete service");
      }
    }
  };

  const handleUpdateBooking = async (id, status) => {
    if (window.confirm("Mark booking as ?")) {
      const res = await api.updateBookingStatus(id, status);
      if (res.ok) fetchData();
      else alert(res.error || "Failed to update booking");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-ink dark:text-paper">
            Provider Dashboard
          </h1>
          <p className="text-ink-soft dark:text-paper/70 mt-1">
            Welcome back,{" "}
            {currentUser?.entrepreneur_profile?.business_name ||
              currentUser?.full_name}
          </p>
        </div>
        <Button to="/dashboard/entrepreneur/services/new" className="gap-2">
          <Plus size={18} /> Add New Service
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Bookings */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-paper-raised dark:bg-ink-raised rounded-2xl border border-line dark:border-line-dark shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-line dark:border-line-dark bg-ink/5 dark:bg-paper/5">
              <h2 className="text-lg font-semibold text-ink dark:text-paper flex items-center gap-2">
                <Calendar size={18} /> Incoming Bookings
              </h2>
            </div>

            {loading ? (
              <div className="p-10 text-center text-ink-soft dark:text-paper/70">
                Loading bookings...
              </div>
            ) : bookings.length === 0 ? (
              <div className="p-10 text-center text-ink-soft dark:text-paper/70">
                No bookings yet. When students book you, they will appear here.
              </div>
            ) : (
              <div className="divide-y divide-line dark:divide-line-dark">
                {bookings.map((booking) => {
                  const start = new Date(booking.starts_at);
                  const end = new Date(booking.ends_at);
                  return (
                    <div
                      key={booking.id}
                      className="p-6 flex flex-col md:flex-row gap-4 justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg">
                            {booking.service?.title ||
                              booking.service_name_snapshot}
                          </h3>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${booking.status === "confirmed" ? "bg-green-100 text-green-700" : ""} ${booking.status === "pending" ? "bg-yellow-100 text-yellow-700" : ""} ${booking.status === "cancelled" ? "bg-red-100 text-red-700" : ""} ${booking.status === "completed" ? "bg-blue-100 text-blue-700" : ""}`}>
                            {booking.status}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-ink-soft mb-1">
                          Student: {booking.user?.full_name} (
                          {booking.user?.email})
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-ink-soft dark:text-paper/60">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} /> {start.toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} />{" "}
                            {start.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            -{" "}
                            {end.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span className="flex items-center gap-1 font-mono bg-ink/5 px-1.5 py-0.5 rounded">
                            Ref: {booking.booking_reference}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 shrink-0">
                        {booking.status === "pending" && (
                          <>
                            <button
                              onClick={() =>
                                handleUpdateBooking(booking.id, "confirmed")
                              }
                              className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors">
                              Accept Booking
                            </button>
                            <button
                              onClick={() =>
                                handleUpdateBooking(booking.id, "cancelled")
                              }
                              className="px-3 py-1.5 bg-red-100 text-red-700 text-sm font-medium rounded hover:bg-red-200 transition-colors">
                              Decline
                            </button>
                          </>
                        )}
                        {booking.status === "confirmed" && (
                          <button
                            onClick={() =>
                              handleUpdateBooking(booking.id, "completed")
                            }
                            className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors">
                            Mark Completed
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Services */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-paper-raised dark:bg-ink-raised rounded-2xl border border-line dark:border-line-dark shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-line dark:border-line-dark bg-ink/5 dark:bg-paper/5">
              <h2 className="text-lg font-semibold text-ink dark:text-paper">
                Your Services
              </h2>
            </div>

            {loading ? (
              <div className="p-6 text-center text-ink-soft dark:text-paper/70">
                Loading services...
              </div>
            ) : services.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-ink-soft dark:text-paper/70 mb-4">
                  You haven't listed any services yet.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-line dark:divide-line-dark">
                {services.map((svc) => (
                  <div key={svc.id} className="p-6 flex flex-col gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-lg text-ink dark:text-paper">
                          {svc.title}
                        </h3>
                        {!svc.is_active && (
                          <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full font-medium">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-ink-soft dark:text-paper/60 mt-2">
                        <span className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-honey-deep"></div>
                          GH₵{svc.price}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} /> {svc.duration_minutes} min
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-line dark:border-line-dark">
                      <Button
                        to={`/dashboard/entrepreneur/services/${svc.id}/availability`}
                        variant="secondary"
                        className="px-3 py-2 h-auto text-xs"
                        title="Manage Schedule">
                        <Clock size={14} className="mr-1" /> Schedule
                      </Button>
                      <Button
                        to={`/dashboard/entrepreneur/services/${svc.id}/edit`}
                        variant="secondary"
                        className="px-3 py-2 h-auto text-xs">
                        <Edit2 size={14} />
                      </Button>
                      <button
                        onClick={() => handleDelete(svc.id, svc.title)}
                        className="p-2 rounded-md border border-line dark:border-line-dark text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ml-auto"
                        title="Delete service">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
