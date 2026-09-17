import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Register } from "./pages/public/Register";
import { Login } from "./pages/public/Login";
import Landing from "./pages/public/Landing";
import ServicesSearch from "./pages/public/ServicesSearch";
import ServiceDetails from "./pages/public/ServiceDetails";

function App() {
  return (
    <Routes>
      {/* Routes WITH navbar + footer */}
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/services" element={<ServicesSearch />} />
        <Route path="/services/:id" element={<ServiceDetails />} />

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
