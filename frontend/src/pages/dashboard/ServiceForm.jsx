import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import api from "../../services/api";
import { useApp } from "../../context/AppContext";
import Button from "../../components/Button";
import { FormField } from "../../components/FormField";
import { RequestError } from "../../components/RequestError";
import { ErrorSummary } from "../../components/ErrorSummary";

const ServiceForm = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const {
    categories = [],
    categoriesLoading,
    categoriesError,
    categoryPagination,
    loadMoreCategories,
    retryCategories,
    knownCategories,
    removedCategoryIds,
  } = useApp();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryNotice, setCategoryNotice] = useState(null);

  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [loadRevision, setLoadRevision] = useState(0);
  const [globalError, setGlobalError] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      is_active: true,
      location_type: "provider_location",
    },
  });

  const selectedId = watch("category_id");
  const preservedCategory = removedCategoryIds.has(selectedId)
    ? null
    : knownCategories.get(selectedId) ||
      (selectedCategory?.id === selectedId ? selectedCategory : null);
  const categoryOptions =
    preservedCategory &&
    !categories.some((category) => category.id === preservedCategory.id)
      ? [preservedCategory, ...categories]
      : categories;

  useEffect(() => {
    if (selectedId && removedCategoryIds.has(selectedId)) {
      setValue("category_id", "", { shouldDirty: true, shouldValidate: true });
      setSelectedCategory(null);
      setCategoryNotice("This category was removed. Choose another category.");
    } else if (selectedId) setCategoryNotice(null);
  }, [selectedId, removedCategoryIds, setValue]);

  useEffect(() => {
    if (isEditing) {
      let active = true;
      setLoading(true);
      setLoadError(null);
      const fetchService = async () => {
        const res = await api.getMyService(id);
        if (!active) return;
        if (res.ok) {
          const svc = res.data.data.service;
          setSelectedCategory(svc.category);
          reset({
            title: svc.title,
            description: svc.description,
            price: svc.price,
            duration_minutes: svc.duration_minutes,
            location_type: svc.location_type,
            category_id: svc.category_id,
            is_active: svc.is_active,
          });
        } else {
          setLoadError(res.error || "Failed to load service");
        }
        setLoading(false);
      };
      fetchService();
      return () => {
        active = false;
      };
    }
  }, [id, isEditing, reset, loadRevision]);

  const onSubmit = async (data) => {
    if (submitting) return;
    setSubmitting(true);
    setGlobalError(null);

    // Ensure numbers are cast properly
    const payload = {
      ...data,
      price: String(data.price),
      duration_minutes: parseInt(data.duration_minutes, 10),
    };

    const res = isEditing
      ? await api.updateMyService(id, payload)
      : await api.createMyService(payload);

    if (res.ok) {
      navigate("/dashboard/entrepreneur");
    } else {
      setGlobalError(res.error || "Failed to save service");
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  if (loadError)
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <RequestError
          error={loadError}
          onRetry={() => setLoadRevision((value) => value + 1)}
        />
      </div>
    );

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link
        to="/dashboard/entrepreneur"
        className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink dark:text-paper/70 dark:hover:text-paper mb-8 no-underline">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold text-ink dark:text-paper mb-8">
        {isEditing ? "Edit Service" : "Create New Service"}
      </h1>

      <form
        id="field-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 bg-paper-raised dark:bg-ink-raised p-6 md:p-8 rounded-2xl border border-line dark:border-line-dark shadow-sm">
        <ErrorSummary errors={{ form: globalError }} />

        <FormField label="Service Title" error={errors.title?.message}>
          <input
            {...register("title", { required: "Title is required" })}
            placeholder="e.g., Knotless Braids (Medium)"
            className="w-full rounded-md border border-line bg-transparent px-3 py-2 text-ink dark:border-line-dark dark:text-paper"
          />
        </FormField>

        <FormField label="Category" error={errors.category_id?.message}>
          <select
            {...register("category_id", { required: "Category is required" })}
            className="w-full rounded-md border border-line bg-transparent px-3 py-2 text-ink dark:border-line-dark dark:text-paper">
            <option value="">Select a category...</option>
            {categoryOptions.map((c) => (
              <option
                key={c.id}
                value={c.id}
                className="bg-white text-black dark:bg-zinc-900 dark:text-white">
                {c.category_name}
              </option>
            ))}
          </select>
        </FormField>

        <RequestError error={categoryNotice} />
        <RequestError
          error={categoriesError}
          onRetry={categoriesLoading ? undefined : retryCategories}
        />
        {categoriesLoading ? (
          <p role="status">Loading categories...</p>
        ) : (
          categoryPagination?.page < categoryPagination?.total_pages && (
            <button
              type="button"
              onClick={loadMoreCategories}
              className="text-sm underline">
              Load more categories
            </button>
          )
        )}

        <FormField label="Description" error={errors.description?.message}>
          <textarea
            {...register("description", {
              required: "Description is required",
            })}
            rows={4}
            placeholder="Describe what is included in this service..."
            className="w-full rounded-md border border-line bg-transparent px-3 py-2 text-ink dark:border-line-dark dark:text-paper"
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Price (GH₵)" error={errors.price?.message}>
            <input
              type="number"
              step="0.01"
              min="0"
              {...register("price", { required: "Price is required" })}
              className="w-full rounded-md border border-line bg-transparent px-3 py-2 text-ink dark:border-line-dark dark:text-paper"
            />
          </FormField>

          <FormField
            label="Duration (Minutes)"
            error={errors.duration_minutes?.message}>
            <input
              type="number"
              min="1"
              {...register("duration_minutes", {
                required: "Duration is required",
              })}
              className="w-full rounded-md border border-line bg-transparent px-3 py-2 text-ink dark:border-line-dark dark:text-paper"
            />
          </FormField>
        </div>

        <FormField label="Location Type" error={errors.location_type?.message}>
          <select
            {...register("location_type", {
              required: "Location type is required",
            })}
            className="w-full rounded-md border border-line bg-transparent px-3 py-2 text-ink dark:border-line-dark dark:text-paper">
            <option
              value="provider_location"
              className="w-full rounded-md border border-line bg-white px-3 py-2 text-ink dark:border-line-dark dark:bg-zinc-900 dark:text-paper">
              Provider's Location (Students come to you)
            </option>
            <option
              value="customer_location"
              className="w-full rounded-md border border-line bg-white px-3 py-2 text-ink dark:border-line-dark dark:bg-zinc-900 dark:text-paper">
              Customer's Location (You go to students)
            </option>
            <option
              value="online"
              className="w-full rounded-md border border-line bg-white px-3 py-2 text-ink dark:border-line-dark dark:bg-zinc-900 dark:text-paper">
              Online / Virtual
            </option>
          </select>
        </FormField>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            {...register("is_active")}
            className="w-4 h-4 rounded text-honey-deep focus:ring-honey-deep"
          />
          <span className="text-sm font-medium text-ink dark:text-paper">
            Service is active and visible to students
          </span>
        </label>

        <div className="pt-4 flex justify-end gap-3">
          <Button
            to="/dashboard/entrepreneur"
            variant="secondary"
            type="button">
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Save Service"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ServiceForm;
