import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Landing } from "./pages/public/Landing";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route
          path="/services"
          element={
            <div className="mx-auto max-w-wrap px-6 py-16 text-center">
              <h1 className="font-display text-2xl font-bold">Services</h1>
              <p className="mt-2 text-ink-soft dark:text-paper/70">
                Browse campus services (Coming soon)
              </p>
            </div>
          }
        />
        <Route
          path="/login"
          element={
            <div className="mx-auto max-w-wrap px-6 py-16 text-center">
              <h1 className="font-display text-2xl font-bold">Log In</h1>
              <p className="mt-2 text-ink-soft dark:text-paper/70">
                User authentication (Issue #6)
              </p>
            </div>
          }
        />
        <Route
          path="/register"
          element={
            <div className="mx-auto max-w-wrap px-6 py-16 text-center">
              <h1 className="font-display text-2xl font-bold">Register</h1>
              <p className="mt-2 text-ink-soft dark:text-paper/70">
                User registration (Issue #5)
              </p>
            </div>
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
    </Routes>
  );
}

export default App;
