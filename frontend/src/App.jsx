import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Register } from "./pages/public/Register";
import { Login } from "./pages/public/Login";
import Landing from "./pages/public/Landing";
import ServicesSearch from "./pages/public/ServicesSearch";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Dashboard } from "./pages/entrepreneur/Dashboard";
import { ProfileSetup } from "./pages/entrepreneur/ProfileSetup";
import { ManageServices } from "./pages/entrepreneur/ManageServices";
import { ManageAvailability } from "./pages/entrepreneur/ManageAvailability";
import { IncomingBookings } from "./pages/entrepreneur/IncomingBookings";

function App() {
  return (
    <Routes>
      {/* Routes WITH navbar + footer */}
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/services" element={<ServicesSearch />} />

        {/* Entrepreneur */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute role="entrepreneur">
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/profile"
          element={
            <ProtectedRoute role="entrepreneur">
              <ProfileSetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/services"
          element={
            <ProtectedRoute role="entrepreneur">
              <ManageServices />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/services/:serviceId/availability"
          element={
            <ProtectedRoute role="entrepreneur">
              <ManageAvailability />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/bookings"
          element={
            <ProtectedRoute role="entrepreneur">
              <IncomingBookings />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={
            <div className="mx-auto max-w-wrap px-6 py-16 text-center">
              <h1 className="font-display text-2xl font-bold">404</h1>
              <p className="mt-2 text-ink-soft dark:text-paper/70">
                Page not found
              </p>
            </div>
          }
        />
      </Route>

      {/* Routes WITHOUT navbar + footer */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}

export default App;
