import { useSessionMutation } from "./useSessionMutation";

export const useBookingMutation = (scope) => useSessionMutation(scope, "Unable to save this booking.");
