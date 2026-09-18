import { useLayoutEffect, useRef, useState } from "react";
import { subscribeSession } from "../services/api";

// Prevent duplicate writes and ignore results belonging to a departed screen/session.
export const useSessionMutation = (scope, fallbackError = "Unable to save changes.") => {
  const [pending, setPending] = useState(false);
  const sequence = useRef(0);
  const inFlight = useRef(false);
  useLayoutEffect(() => {
    let userId;
    inFlight.current = false;
    setPending(false);
    const unsubscribe = subscribeSession((user) => {
      if (user?.id === userId) return;
      userId = user?.id;
      sequence.current += 1;
      inFlight.current = false;
      setPending(false);
    });
    return () => {
      unsubscribe();
      sequence.current += 1;
      inFlight.current = false;
    };
  }, [scope]);

  const run = async (request) => {
    if (inFlight.current) return null;
    inFlight.current = true;
    const ticket = ++sequence.current;
    setPending(true);
    try {
      const result = await request();
      return ticket === sequence.current ? result : null;
    } catch (error) {
      return ticket === sequence.current
        ? { ok: false, error: error.message || fallbackError }
        : null;
    } finally {
      if (ticket === sequence.current) {
        inFlight.current = false;
        setPending(false);
      }
    }
  };
  return { pending, run };
};
