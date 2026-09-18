import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Register } from "./pages/public/Register";
import { Login } from "./pages/public/Login";
import Landing from "./pages/public/Landing";
import ServicesSearch from "./pages/public/ServicesSearch";
import ServiceDetails from "./pages/public/ServiceDetails";

import EntrepreneurDashboard from "./pages/dashboard/EntrepreneurDashboard";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import AdminCategories from "./pages/dashboard/AdminCategories";
import ServiceForm from "./pages/dashboard/ServiceForm";
import AvailabilityManager from "./pages/dashboard/AvailabilityManager";
import StudentDashboard from "./pages/dashboard/StudentDashboard";

const App = () => {
  return (
    <Routes>
      {/* Routes WITH navbar + footer */}
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/services" element={<ServicesSearch />} />
        <Route path="/services/:id" element={<ServiceDetails />} />

        {/* Entrepreneur Dashboard */}
        <Route
          path="/dashboard/entrepreneur"
          element={
            <ProtectedRoute allow={["entrepreneur"]}>
              <EntrepreneurDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/entrepreneur/services/new"
          element={
            <ProtectedRoute allow={["entrepreneur"]}>
              <ServiceForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/entrepreneur/services/:id/edit"
          element={
            <ProtectedRoute allow={["entrepreneur"]}>
              <ServiceForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/entrepreneur/services/:id/availability"
          element={
            <ProtectedRoute allow={["entrepreneur"]}>
              <AvailabilityManager />
            </ProtectedRoute>
          }
        />

        {/* Student Dashboard */}
        <Route
          path="/dashboard/student"
          element={
            <ProtectedRoute allow={["student"]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Dashboard */}
        <Route
          path="/dashboard/admin/categories"
          element={
            <ProtectedRoute allow={["admin"]}>
              <AdminCategories />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute allow={["admin"]}>
              <AdminDashboard />
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
};

export default App;
