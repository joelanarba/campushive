import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { AuthSplitPanel } from "../../components/AuthSplitPanel";
import { ErrorSummary } from "../../components/ErrorSummary";
import { FormField } from "../../components/FormField";
import { PasswordField } from "../../components/PasswordField";
import Button from "../../components/Button";

export function Register() {
  const { register } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
    // entrepreneur-only
    businessName: "",
    description: "",
    phoneNumber: "",
    location: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate() {
    const next = {};
    if (!form.fullName.trim()) next.fullName = "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email))
      next.email = "Enter a valid email address.";
    if (form.password.length < 8)
      next.password = "Password must be at least 8 characters.";
    if (form.confirmPassword !== form.password)
      next.confirmPassword = "Passwords do not match.";

    if (form.role === "entrepreneur") {
      if (!form.businessName.trim())
        next.businessName = "Enter your business name.";
      if (!form.phoneNumber.trim())
        next.phoneNumber = "Enter a phone number students can reach you on.";
      if (!form.location.trim()) next.location = "Where are you based?";
    }
    return next;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    const result = await register(form); // ← async now
    setSubmitting(false);

    if (!result.ok) {
      setErrors({ email: result.error });
      return;
    }
    navigate(form.role === "entrepreneur" ? "/dashboard" : "/services");
  }

  const points =
    form.role === "entrepreneur"
      ? [
          "List your services and set your own availability",
          "Get reviewed and verified by an admin",
          "Manage every booking from one dashboard",
        ]
      : [
          "Only verified providers show up in search",
          "Book an open slot in a few taps",
          "Track every booking from one place",
        ];

  return (
    <div className="grid lg:grid-cols-2 lg:min-h-screen">
      <AuthSplitPanel
        headline={
          form.role === "entrepreneur"
            ? "List your business. Manage bookings in one place."
            : "Skip the group chat. Book campus services directly."
        }
        points={points}
      />

      <div className="mx-auto flex w-full max-w-md flex-col justify-center px-4 py-16 sm:px-6">
        <h1 className="font-display text-2xl font-semibold text-(--color-ink) dark:text-(--color-paper)">
          Create your account
        </h1>

        <form onSubmit={handleSubmit} noValidate className="mt-6">
          <ErrorSummary errors={errors} />

          <fieldset className="mb-5">
            <legend className="mb-2 text-sm font-medium text-(--color-ink) dark:text-(--color-paper)">
              I am a…
            </legend>
            <div className="flex gap-3">
              {["student", "entrepreneur"].map((role) => (
                <label
                  key={role}
                  className={`flex-1 cursor-pointer rounded-md border px-4 py-2.5 text-center text-sm font-data font-medium capitalize ${
                    form.role === role
                      ? "border-(--color-honey-deep) bg-(--color-honey-tint) dark:bg-(--color-honey-deep)/20"
                      : "border-(--color-line) dark:border-(--color-line-dark)"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={form.role === role}
                    onChange={(e) => update("role", e.target.value)}
                    className="sr-only"
                  />
                  <span className="text-(--color-ink) dark:text-(--color-paper)">
                    {role}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <FormField
            id="fullName"
            label="Full name"
            value={form.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            error={errors.fullName}
            autoComplete="name"
          />
          <FormField
            id="email"
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            error={errors.email}
            autoComplete="email"
          />
          <PasswordField
            id="password"
            label="Password"
            hint="At least 8 characters."
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            error={errors.password}
            autoComplete="new-password"
          />
          <PasswordField
            id="confirmPassword"
            label="Confirm password"
            value={form.confirmPassword}
            onChange={(e) => update("confirmPassword", e.target.value)}
            error={errors.confirmPassword}
            autoComplete="new-password"
          />

          {form.role === "entrepreneur" && (
            <>
              <FormField
                id="businessName"
                label="Business name"
                value={form.businessName}
                onChange={(e) => update("businessName", e.target.value)}
                error={errors.businessName}
                autoComplete="organization"
              />
              <FormField
                id="description"
                label="Description"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                error={errors.description}
              />
              <FormField
                id="phoneNumber"
                label="Phone number"
                type="tel"
                value={form.phoneNumber}
                onChange={(e) => update("phoneNumber", e.target.value)}
                error={errors.phoneNumber}
                autoComplete="tel"
              />
              <FormField
                id="location"
                label="Location"
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                error={errors.location}
              />
            </>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={submitting}
          >
            {submitting ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-(--color-ink-soft) dark:text-(--color-paper)/60">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-(--color-honey-deep) hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
