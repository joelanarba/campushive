import { CalendarDays, CircleAlert, LoaderCircle } from "lucide-react";
import Button from "./Button";
import { Modal } from "./Modal";
import { RequestError } from "./RequestError";

export const bookingActions = {
  create: {
    title: "Review your booking",
    label: "Send booking request",
    description:
      "Your provider will review the request and confirm your booking.",
  },
  cancel: {
    title: "Cancel this booking?",
    label: "Cancel booking",
    description:
      "This releases your time slot. This booking cannot be reopened.",
    destructive: true,
    status: "cancelled",
    success: "Booking cancelled",
  },
  accept: {
    title: "Accept this booking?",
    label: "Accept booking",
    description:
      "Confirm that you can provide this service at the requested time.",
    status: "confirmed",
    success: "Booking accepted",
  },
  decline: {
    title: "Decline this booking?",
    label: "Decline booking",
    description:
      "This cancels the request and releases the time slot. This booking cannot be reopened.",
    destructive: true,
    status: "cancelled",
    success: "Booking declined",
  },
  complete: {
    title: "Mark this booking completed?",
    label: "Mark completed",
    description:
      "Confirm that this service has been delivered. This booking cannot be reopened.",
    status: "completed",
    success: "Booking marked completed",
  },
};

export const BookingReview = ({ booking, service, action }) => {
  const config = bookingActions[action];
  // Booking records use the backend's campus scheduling zone; occurrences also carry it explicitly.
  const timeZone = booking.timezone || "Africa/Accra";
  const date = new Date(booking.starts_at).toLocaleDateString(undefined, {
    timeZone,
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = (value) =>
    new Date(value).toLocaleTimeString(undefined, {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
    });
  const Icon = config.destructive ? CircleAlert : CalendarDays;
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span
          className={`rounded-xl p-2.5 ${config.destructive ? "bg-clay-tint text-clay-deep dark:bg-clay/20 dark:text-clay-tint" : "bg-honey-tint text-honey-deep dark:bg-honey/15 dark:text-honey"}`}>
          <Icon size={22} aria-hidden="true" />
        </span>
        <p className="pt-1">{config.description}</p>
      </div>
      <div className="rounded-xl border border-line bg-paper-raised p-4 dark:border-line-dark dark:bg-ink">
        <p className="break-words font-semibold text-ink dark:text-paper">
          {booking.service_name_snapshot ||
            service?.title ||
            booking.service?.title}
        </p>
        {(service?.entrepreneur?.business_name ||
          booking.service?.entrepreneur?.business_name) && (
          <p className="mt-1">
            By{" "}
            {service?.entrepreneur?.business_name ||
              booking.service.entrepreneur.business_name}
          </p>
        )}
        {booking.user?.full_name && (
          <p className="mt-1">For {booking.user.full_name}</p>
        )}
        <dl className="mt-4 space-y-2">
          <div>
            <dt className="sr-only">Date</dt>
            <dd>{date}</dd>
          </div>
          <div>
            <dt className="sr-only">Time</dt>
            <dd>
              {time(booking.starts_at)} - {time(booking.ends_at)}{" "}
              <span className="block text-xs">{timeZone}</span>
            </dd>
          </div>
          {action === "create" && (
            <div className="flex justify-between gap-3 border-t border-line pt-3 dark:border-line-dark">
              <dt>{service.duration_minutes} minutes</dt>
              <dd className="font-semibold text-ink dark:text-paper">
                {new Intl.NumberFormat("en-GH", {
                  style: "currency",
                  currency: "GHS",
                }).format(Number(service.price))}
              </dd>
            </div>
          )}
          {booking.booking_reference && (
            <div className="flex flex-wrap justify-between gap-2 border-t border-line pt-3 dark:border-line-dark">
              <dt>Booking reference</dt>
              <dd className="font-data font-semibold">
                {booking.booking_reference}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
};

export const BookingActions = ({ action, pending, onBack, onConfirm }) => (
  <>
    <Button
      type="button"
      variant="secondary"
      disabled={pending}
      onClick={onBack}
      className="disabled:cursor-wait disabled:opacity-50">
      {action === "create" ? "Change time" : "Go back"}
    </Button>
    <Button
      type="button"
      variant={bookingActions[action].destructive ? "danger" : "primary"}
      disabled={pending}
      onClick={onConfirm}
      className="disabled:cursor-wait disabled:opacity-50">
      {pending && (
        <LoaderCircle
          size={16}
          className="motion-safe:animate-spin"
          aria-hidden="true"
        />
      )}
      <span role={pending ? "status" : undefined}>
        {pending ? "Saving..." : bookingActions[action].label}
      </span>
    </Button>
  </>
);

export const BookingConfirmation = ({
  selection,
  pending,
  error,
  onClose,
  onConfirm,
  returnFocusRef,
}) => (
  <Modal
    open={Boolean(selection)}
    title={selection ? bookingActions[selection.action].title : "Booking"}
    onClose={onClose}
    pending={pending}
    returnFocusRef={returnFocusRef}
    footer={
      selection && (
        <BookingActions
          action={selection.action}
          pending={pending}
          onBack={onClose}
          onConfirm={onConfirm}
        />
      )
    }>
    {selection && (
      <BookingReview booking={selection.booking} action={selection.action} />
    )}
    <RequestError error={error} />
  </Modal>
);
