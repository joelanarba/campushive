import { usePagedList } from "../../hooks/usePagedList";
import { Pagination } from "../../components/Pagination";
import { RequestError } from "../../components/RequestError";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BookingConfirmation } from "../../components/BookingConfirmation";
import { SuccessBanner } from "../../components/SuccessBanner";
import { useBookingMutation } from "../../hooks/useBookingMutation";

import api from "../../services/api";
import { useApp } from "../../context/AppContext";
import { Calendar, Clock } from "lucide-react";
import Button from "../../components/Button";

const StudentDashboard = () => {
  const { currentUser } = useApp();
  const [page, setPage] = useState(1);
  const list = usePagedList(
    api.listStudentBookings,
    { page, limit: 20 },
    "bookings",
    setPage,
  );
  const bookings = list.items;
  const { pending: busy, run } = useBookingMutation();
  const [selection, setSelection] = useState(null);
  const [dialogError, setDialogError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [success, setSuccess] = useState(null);
  const headingRef = useRef(null);
  const consumedFeedback = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // A list reload can remove the dialog's original trigger; keep focus on the screen.
  useLayoutEffect(() => {
    if (success || actionError) headingRef.current?.focus();
  }, [success, actionError]);

  useEffect(() => {
    const feedback = location.state?.bookingFeedback;
    if (!feedback || consumedFeedback.current === location.key) return;
    consumedFeedback.current = location.key;
    if (feedback.userId === currentUser?.id) {
      setSuccess({
        title: "Booking request sent",
        reference: feedback.reference,
        pending: true,
      });
    }
    const { bookingFeedback, ...remainingState } = location.state;
    navigate(location.pathname + location.search + location.hash, {
      replace: true,
      state: remainingState,
    });
  }, [location, navigate, currentUser?.id]);

  const openCancel = (booking) => {
    if (busy) return;
    setSuccess(null);
    setActionError(null);
    setDialogError(null);
    setSelection({ booking, action: "cancel" });
  };
  const handleCancel = async () => {
    if (busy || !selection) return;
    setDialogError(null);
    const res = await run(() =>
      api.updateBookingStatus(selection.booking.id, "cancelled"),
    );
    if (!res) return;
    if (res.ok) {
      setSelection(null);
      setSuccess({
        title: "Booking cancelled",
        reference: selection.booking.booking_reference,
      });
      list.reload();
    } else if (res.status === 409 || res.status === 404) {
      setSelection(null);
      setActionError(res.error);
      list.reload();
    } else setDialogError(res.error);
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-10">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-3xl font-bold text-ink dark:text-paper">
          My Bookings
        </h1>
        <p className="text-ink-soft dark:text-paper/70 mt-1">
          Welcome back, {currentUser?.full_name}. Here are your scheduled
          services.
        </p>
      </div>

      {success && (
        <SuccessBanner title={success.title} onDismiss={() => setSuccess(null)}>
          {success.reference && (
            <p>
              Reference:{" "}
              <span className="font-data font-semibold">
                {success.reference}
              </span>
            </p>
          )}
          {success.pending && (
            <p className="mt-1">Awaiting provider confirmation.</p>
          )}
        </SuccessBanner>
      )}
      <RequestError error={actionError} />
      <div className="bg-paper-raised dark:bg-ink-raised rounded-2xl border border-line dark:border-line-dark shadow-sm overflow-hidden">
        {list.loading ? (
          <p role="status" className="p-10">
            Loading bookings...
          </p>
        ) : list.error ? (
          <RequestError error={list.error} onRetry={list.reload} />
        ) : bookings.length === 0 ? (
          <div className="p-10 text-center">
            <Calendar
              className="mx-auto mb-4 text-ink-soft opacity-50"
              size={40}
            />
            <p className="text-ink-soft dark:text-paper/70 mb-4">
              You haven't booked any services yet.
            </p>
            <Button to="/services" variant="secondary">
              Explore Services
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-line dark:divide-line-dark">
            {bookings.map((booking) => {
              const start = new Date(booking.starts_at);
              const end = new Date(booking.ends_at);
              return (
                <div
                  key={booking.id}
                  className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg">
                        {booking.service_name_snapshot}
                      </h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${booking.status === "confirmed" ? "bg-green-100 text-green-700" : ""} ${booking.status === "pending" ? "bg-yellow-100 text-yellow-700" : ""} ${booking.status === "cancelled" ? "bg-red-100 text-red-700" : ""} ${booking.status === "completed" ? "bg-blue-100 text-blue-700" : ""}`}>
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

                  {["pending", "confirmed"].includes(booking.status) && (
                    <button
                      disabled={busy}
                      onClick={() => openCancel(booking)}
                      className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded-md transition-colors shrink-0">
                      Cancel Booking
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {!list.error && (
          <Pagination
            pagination={list.pagination}
            onPageChange={setPage}
            disabled={list.loading || busy}
          />
        )}
      </div>
      <BookingConfirmation
        selection={selection}
        pending={busy}
        error={dialogError}
        onClose={() => {
          if (!busy) setSelection(null);
        }}
        onConfirm={handleCancel}
        returnFocusRef={headingRef}
      />
    </div>
  );
};

export default StudentDashboard;
