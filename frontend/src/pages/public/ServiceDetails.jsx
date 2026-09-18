import { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, MapPin, CheckCircle2 } from "lucide-react";
import api from "../../services/api";
import { useApp } from "../../context/AppContext";
import Button from "../../components/Button";
import { Modal } from "../../components/Modal";
import {
  BookingReview,
  BookingActions,
} from "../../components/BookingConfirmation";
import { useBookingMutation } from "../../hooks/useBookingMutation";
import { RequestError } from "../../components/RequestError";

const ServiceDetails = () => {
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
  const [slotsError, setSlotsError] = useState(null);
  const [bookingError, setBookingError] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const { pending: booking, run } = useBookingMutation(id);
  const [slotsRevision, setSlotsRevision] = useState(0);
  const [serviceRevision, setServiceRevision] = useState(0);
  const slotRequest = useRef(0);

  // Simple week state (starts at today)
  const [startDate, setStartDate] = useState(new Date());

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setService(null);
    setShowModal(false);
    setSelectedSlot(null);
    setBookingError(null);
    api.getService(id).then((res) => {
      if (!active) return;
      if (res.ok) setService(res.data.data.service);
      else setError(res.error || "Service not found");
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [id, serviceRevision]);

  useEffect(() => {
    if (!showModal) return;
    const ticket = ++slotRequest.current;
    setLoadingSlots(true);
    setSlotsError(null);
    setOccurrences([]);
    const end = new Date(startDate);
    end.setUTCDate(end.getUTCDate() + 6);
    api
      .getAvailability(
        id,
        startDate.toISOString().split("T")[0],
        end.toISOString().split("T")[0],
      )
      .then((res) => {
        if (ticket !== slotRequest.current) return;
        if (res.ok) setOccurrences(res.data.data.occurrences);
        else setSlotsError(res.error);
        setLoadingSlots(false);
      });
    return () => {
      slotRequest.current += 1;
    };
  }, [id, showModal, startDate, slotsRevision]);

  const handleBookSlot = async () => {
    if (booking || !selectedSlot || !currentUser) return;
    setBookingError(null);
    const res = await run(() =>
      api.createBooking({
        service_id: selectedSlot.service_id,
        slot_id: selectedSlot.slot_id,
        slot_version: selectedSlot.slot_version,
        starts_at: selectedSlot.starts_at,
      }),
    );
    if (!res) return;
    if (res.ok) {
      setShowModal(false);
      navigate("/dashboard/student", {
        state: {
          bookingFeedback: {
            userId: currentUser.id,
            reference: res.data.data.booking.booking_reference,
          },
        },
      });
    } else {
      setBookingError(res.error || "Failed to create booking.");
      if (res.status === 409) {
        setSelectedSlot(null);
        setSlotsRevision((value) => value + 1);
      }
      if (res.status === 401)
        navigate("/login", { state: { from: "/services/" + id } });
    }
  };

  if (loading) return <div className="p-20 text-center">Loading...</div>;
  if (error || !service)
    return (
      <div className="p-20 text-center">
        <RequestError
          error={error}
          onRetry={() => setServiceRevision((value) => value + 1)}
        />
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link
        to="/services"
        className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink dark:text-paper/70 dark:hover:text-paper mb-8 no-underline">
        <ArrowLeft size={16} /> Back to Search
      </Link>

      <div className="bg-paper-raised dark:bg-ink-raised rounded-2xl p-6 md:p-10 shadow-sm border border-line dark:border-line-dark">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-ink dark:text-paper mb-2">
              {service.title}
            </h1>
            <div className="flex items-center gap-2 text-ink-soft dark:text-paper/70 mb-6">
              <span className="font-medium">
                {service.entrepreneur?.business_name}
              </span>
              <CheckCircle2
                size={16}
                className="text-green-600 dark:text-green-500"
              />
            </div>
            <p className="text-ink-soft mb-8">{service.description}</p>

            <div className="flex flex-wrap gap-6 mb-8 border-t border-line pt-6">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-honey-deep" />{" "}
                {service.duration_minutes} min
              </div>
              <div className="flex items-center gap-2 capitalize">
                <MapPin size={18} className="text-honey-deep" />{" "}
                {service.location_type.replace("_", " ")}
              </div>
            </div>
          </div>

          <div className="md:w-72 bg-white dark:bg-ink rounded-xl p-6 border shadow-sm shrink-0 text-center">
            <p className="text-sm text-ink-soft mb-1">Price</p>
            <p className="text-3xl font-bold mb-6">GH₵{service.price}</p>
            <Button
              className="w-full justify-center py-3"
              onClick={() => {
                setSelectedSlot(null);
                setBookingError(null);
                setShowModal(true);
              }}>
              Book Now
            </Button>
          </div>
        </div>
      </div>

      <Modal
        open={showModal}
        pending={booking}
        onClose={() => setShowModal(false)}
        title={
          !currentUser
            ? "Log in to book"
            : selectedSlot
              ? "Review your booking"
              : "Select a time"
        }
        focusKey={!currentUser ? "login" : selectedSlot ? "review" : "slots"}
        footer={
          !currentUser ? (
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowModal(false)}>
                Go back
              </Button>
              <Button
                type="button"
                onClick={() =>
                  navigate("/login", { state: { from: "/services/" + id } })
                }>
                Log in to continue
              </Button>
            </>
          ) : selectedSlot ? (
            <BookingActions
              action="create"
              pending={booking}
              onConfirm={handleBookSlot}
              onBack={() => {
                setSelectedSlot(null);
                setBookingError(null);
              }}
            />
          ) : null
        }>
        {!currentUser ? (
          <p>
            Please log in to request a booking. You will return to this service
            after signing in.
          </p>
        ) : selectedSlot ? (
          <>
            <BookingReview
              booking={selectedSlot}
              service={service}
              action="create"
            />
            <RequestError error={bookingError} />
          </>
        ) : (
          <>
            <p className="mb-4">
              Choose a time to review your booking request. Times are shown in
              Africa/Accra.
            </p>
            <div className="mb-4 flex flex-wrap justify-between gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  const prev = new Date(startDate);
                  prev.setUTCDate(prev.getUTCDate() - 7);
                  setStartDate(prev);
                }}>
                Previous week
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  const next = new Date(startDate);
                  next.setUTCDate(next.getUTCDate() + 7);
                  setStartDate(next);
                }}>
                Next week
              </Button>
            </div>
            <RequestError error={bookingError} />
            {loadingSlots ? (
              <p role="status" className="p-10 text-center">
                Loading availability...
              </p>
            ) : slotsError ? (
              <RequestError
                error={slotsError}
                onRetry={() => setSlotsRevision((value) => value + 1)}
              />
            ) : occurrences.length === 0 ? (
              <p className="p-10 text-center">
                No availability this week. Try next week!
              </p>
            ) : (
              <div className="space-y-4">
                {[...new Set(occurrences.map((slot) => slot.date))].map(
                  (date) => (
                    <div key={date}>
                      <h3 className="mb-2 font-semibold text-ink dark:text-paper">
                        {new Date(date).toLocaleDateString(undefined, {
                          timeZone: "Africa/Accra",
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                        })}
                      </h3>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {occurrences
                          .filter((slot) => slot.date === date)
                          .map((slot) => (
                            <button
                              type="button"
                              key={slot.starts_at}
                              onClick={() => {
                                setBookingError(null);
                                setSelectedSlot(slot);
                              }}
                              className="rounded-md border border-line px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-honey-deep hover:bg-honey-tint dark:border-line-dark dark:text-paper dark:hover:border-honey dark:hover:bg-honey/15">
                              {slot.start_time}
                            </button>
                          ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default ServiceDetails;
