import { useState } from "react";
import { Link } from "react-router-dom";
import { categories } from "../../data/mockData";
import { useApp } from "../../context/AppContext";
import { FormField } from "../../components/FormField";
import { ErrorSummary } from "../../components/ErrorSummary";
import Button from "../../components/Button";

export function ManageServices() {
  const { currentUser, getMyProfile, services, addService, updateService } =
    useApp();
  const profile = getMyProfile(currentUser.id);
  const myServices = services.filter((s) => s.entrepreneurId === profile.id);

  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});

  function emptyForm() {
    return {
      title: "",
      description: "",
      price: "",
      durationMinutes: "",
      categoryId: categories[0].id,
    };
  }

  function startEdit(service) {
    setEditingId(service.id);
    setShowAddForm(false);
    setForm({
      title: service.title,
      description: service.description,
      price: service.price,
      durationMinutes: service.durationMinutes,
      categoryId: service.categoryId,
    });
    setErrors({});
  }

  function startAdd() {
    setShowAddForm(true);
    setEditingId(null);
    setForm(emptyForm());
    setErrors({});
  }

  function validate() {
    const next = {};
    if (!form.title.trim()) next.title = "Enter a service title.";
    if (!form.price || Number(form.price) <= 0)
      next.price = "Enter a price greater than 0.";
    if (!form.durationMinutes || Number(form.durationMinutes) <= 0)
      next.durationMinutes = "Enter how long the service takes, in minutes.";
    return next;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    const payload = {
      ...form,
      price: Number(form.price),
      durationMinutes: Number(form.durationMinutes),
      entrepreneurId: profile.id,
    };
    if (editingId) {
      updateService(editingId, payload);
      setEditingId(null);
    } else {
      addService(payload);
      setShowAddForm(false);
    }
  }

  const formOpen = showAddForm || editingId;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-data text-xs font-semibold uppercase tracking-wide text-(--color-ink-soft)">
            Dashboard
          </p>
          <h1 className="font-data mt-1 text-2xl font-semibold text-(--color-ink)">
            Your services
          </h1>
        </div>
        {!formOpen && (
          <Button variant="primary" onClick={startAdd}>
            Add service
          </Button>
        )}
      </div>

      {profile.verificationStatus !== "verified" && (
        <p className="mt-3 rounded-md border-l-4 border-(--color-honey-deep) bg-(--color-honey-tint) px-4 py-2 text-sm text-(--color-honey-deep)">
          Your services aren't visible to students yet — they'll appear once
          your profile is verified.
        </p>
      )}

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-6 rounded-md border border-(--color-line) p-5"
        >
          <h2 className="mb-4 font-display text-lg font-semibold text-(--color-ink)">
            {editingId ? "Edit service" : "New service"}
          </h2>
          <ErrorSummary errors={errors} />
          <FormField
            id="title"
            label="Title"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            error={errors.title}
          />
          <FormField
            id="description"
            label="Description"
            as="textarea"
            value={form.description}
            onChange={(e) =>
              setForm((p) => ({ ...p, description: e.target.value }))
            }
          />
          <FormField
            id="categoryId"
            label="Category"
            as="select"
            value={form.categoryId}
            onChange={(e) =>
              setForm((p) => ({ ...p, categoryId: e.target.value }))
            }
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              id="price"
              label="Price (GH₵)"
              type="number"
              min="0"
              value={form.price}
              onChange={(e) =>
                setForm((p) => ({ ...p, price: e.target.value }))
              }
              error={errors.price}
            />
            <FormField
              id="durationMinutes"
              label="Duration (minutes)"
              type="number"
              min="0"
              value={form.durationMinutes}
              onChange={(e) =>
                setForm((p) => ({ ...p, durationMinutes: e.target.value }))
              }
              error={errors.durationMinutes}
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit" variant="primary">
              {editingId ? "Save changes" : "Add service"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowAddForm(false);
                setEditingId(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {myServices.length === 0 && !formOpen ? (
        <div className="mt-6 rounded-md border border-dashed border-(--color-line) p-10 text-center">
          <p className="font-data font-semibold text-(--color-ink)">
            No services yet.
          </p>
          <p className="mt-1 text-sm text-(--color-ink-soft)">
            Add your first service to start taking bookings.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {myServices.map((service) => (
            <li
              key={service.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-(--color-line) p-4"
            >
              <div>
                <h3 className="font-display font-semibold text-(--color-ink)">
                  {service.title}
                </h3>
                <p className="text-sm text-(--color-ink-soft)">
                  GH₵{service.price} · {service.durationMinutes} min
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => startEdit(service)}>
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  as={Link}
                  to={`/dashboard/services/${service.id}/availability`}
                >
                  Availability
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
