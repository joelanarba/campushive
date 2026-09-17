import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { FormField } from "../../components/FormField";
import { ErrorSummary } from "../../components/ErrorSummary";
import Button from "../../components/Button";

export function ProfileSetup() {
  const { currentUser, getMyProfile, updateProfile } = useApp();
  const navigate = useNavigate();
  const profile = getMyProfile(currentUser.id);

  const [form, setForm] = useState({
    businessName: profile?.businessName || "",
    description: profile?.description || "",
    phoneNumber: profile?.phoneNumber || "",
    location: profile?.location || "",
  });
  const [errors, setErrors] = useState({});

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = {};
    if (!form.businessName.trim())
      nextErrors.businessName = "Enter your business name.";
    if (!form.location.trim())
      nextErrors.location = "Enter where students can find you on campus.";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    updateProfile(profile.id, form);
    navigate("/dashboard");
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <h1 className="font-data text-2xl font-semibold text-(--color-ink)">
        Set up your business profile
      </h1>
      <p className="mt-1 text-(--color-ink-soft)">
        This is what students will see once your account is verified.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6">
        <ErrorSummary errors={errors} />
        <FormField
          id="businessName"
          label="Business name"
          value={form.businessName}
          onChange={(e) => update("businessName", e.target.value)}
          error={errors.businessName}
        />
        <FormField
          id="description"
          label="Description"
          as="textarea"
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          hint="What you offer and what makes it worth booking."
        />
        <FormField
          id="location"
          label="Location on campus"
          value={form.location}
          onChange={(e) => update("location", e.target.value)}
          error={errors.location}
        />
        <FormField
          id="phoneNumber"
          label="Contact phone number"
          type="tel"
          value={form.phoneNumber}
          onChange={(e) => update("phoneNumber", e.target.value)}
        />
        <Button type="submit" variant="primary" className="w-full">
          Save and continue
        </Button>
      </form>
    </div>
  );
}
