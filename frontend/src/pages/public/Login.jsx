import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { FormField } from "../../components/FormField";
import { PasswordField } from "../../components/PasswordField";
import { ErrorSummary } from "../../components/ErrorSummary";
import { AuthSplitPanel } from "../../components/AuthSplitPanel";
import Button from "../../components/Button";

export function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = {};
    if (!email.trim()) nextErrors.email = "Enter your email address.";
    if (!password) nextErrors.password = "Enter your password.";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (!result.ok) {
      setErrors({ password: result.error });
      return;
    }

    const dest = location.state?.from;
    if (dest) navigate(dest);
    else if (result.user?.role?.includes("admin")) navigate("/dashboard/admin");
    else if (result.user?.role?.includes("entrepreneur"))
      navigate("/dashboard/entrepreneur");
    else navigate("/services");
  }

  return (
    <div className="grid lg:grid-cols-2 lg:min-h-screen">
      <AuthSplitPanel
        headline="Skip the group chat. Book campus services directly."
        points={[
          "Only verified providers show up in search",
          "Real, live availability — no back-and-forth",
          "Manage every booking from one place",
        ]}
      />

      <div className="mx-auto flex w-full max-w-md flex-col justify-center px-4 py-16 sm:px-6">
        <h1 className="font-display text-2xl font-semibold text-(--color-ink) dark:text-(--color-paper)">
          Log in
        </h1>
        <p className="mt-1 text-sm text-(--color-ink-soft) dark:text-(--color-paper)/60">
          Welcome back to CampusHive.
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-6">
          <ErrorSummary errors={errors} />

          <FormField
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="email"
          />

          <PasswordField
            id="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete="current-password"
          />

          <Button type="submit" variant="primary" className="w-full">
            Log in
          </Button>
        </form>

        <p className="mt-6 text-sm text-(--color-ink-soft) dark:text-(--color-paper)/60">
          New to CampusHive?{" "}
          <Link
            to="/register"
            className="font-semibold text-(--color-honey-deep) hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
