import { useLayoutEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import api from "../../services/api";
import { useApp } from "../../context/AppContext";
import { usePagedList } from "../../hooks/usePagedList";
import { useSessionMutation } from "../../hooks/useSessionMutation";
import { AdminNavigation } from "../../components/AdminNavigation";
import Button from "../../components/Button";
import { Modal } from "../../components/Modal";
import { FormField } from "../../components/FormField";
import { ErrorSummary } from "../../components/ErrorSummary";
import { RequestError } from "../../components/RequestError";
import { SuccessBanner } from "../../components/SuccessBanner";
import { Pagination } from "../../components/Pagination";

const fields = [
  { name: "category_name", label: "Category name", max: 150 },
  { name: "tag", label: "Tag", max: 50 },
  { name: "description", label: "Description", max: 2000 },
];
const emptyDraft = { category_name: "", tag: "", description: "" };
const inputClass =
  "w-full rounded-md border border-line bg-paper px-3 py-2 text-ink aria-invalid:border-clay dark:border-line-dark dark:bg-ink-raised dark:text-paper";

const AdminCategories = () => {
  const [page, setPage] = useState(1);
  const list = usePagedList(
    api.listCategories,
    { page, limit: 20 },
    "categories",
    setPage,
  );
  const {
    applyCategoryMutation,
    categoriesError,
    categoriesLoading,
    retryCategories,
  } = useApp();
  const { pending, run } = useSessionMutation();
  const [dialog, setDialog] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [errors, setErrors] = useState({});
  const [dialogError, setDialogError] = useState(null);
  const [pageError, setPageError] = useState(null);
  const [success, setSuccess] = useState(null);
  const headingRef = useRef(null);

  useLayoutEffect(() => {
    if (success || pageError) headingRef.current?.focus();
  }, [success, pageError]);

  const openDialog = (mode, category = null) => {
    if (pending) return;
    setSuccess(null);
    setPageError(null);
    setDialogError(null);
    setErrors({});
    setDraft(
      category
        ? {
            category_name: category.category_name,
            tag: category.tag,
            description: category.description,
          }
        : emptyDraft,
    );
    setDialog({ mode, category });
  };
  const closeDialog = () => {
    if (!pending) setDialog(null);
  };
  const missingCategory = () => {
    setDialog(null);
    setPageError(
      "This category no longer exists. The category list has been refreshed.",
    );
    applyCategoryMutation({
      deletedId: dialog.category.id,
      previousCategory: dialog.category,
    });
    list.reload();
  };

  const save = async (event) => {
    event.preventDefault();
    if (pending || !dialog) return;
    const body = Object.fromEntries(
      fields.map(({ name }) => [name, draft[name].trim()]),
    );
    const nextErrors = {};
    for (const { name, label, max } of fields) {
      if (!body[name]) nextErrors[name] = label + " is required.";
      else if (body[name].length > max)
        nextErrors[name] = label + " must be " + max + " characters or fewer.";
    }
    setErrors(nextErrors);
    setDialogError(null);
    if (Object.keys(nextErrors).length) return;
    const res = await run(() =>
      dialog.mode === "create"
        ? api.createCategory(body)
        : api.updateCategory(dialog.category.id, body),
    );
    if (!res) return;
    if (res.ok) {
      const category =
        res.data?.data?.category ||
        (dialog.category ? { ...dialog.category, ...body } : null);
      applyCategoryMutation({ category, previousCategory: dialog.category });
      setDialog(null);
      setDraft(emptyDraft);
      setSuccess({
        title:
          dialog.mode === "create" ? "Category created" : "Category updated",
        name: category?.category_name || body.category_name,
      });
      list.reload();
    } else if (res.status === 404 && dialog.category) {
      missingCategory();
    } else {
      const backendErrors = {};
      for (const detail of res.data?.errors || []) {
        if (fields.some(({ name }) => name === detail.field))
          backendErrors[detail.field] = detail.message;
      }
      setErrors(backendErrors);
      setDialogError(res.error || "Unable to save this category.");
    }
  };

  const remove = async () => {
    if (pending || !dialog?.category) return;
    setDialogError(null);
    const res = await run(() => api.deleteCategory(dialog.category.id));
    if (!res) return;
    if (res.ok) {
      // The selected ID is authoritative even when a successful response has no body.
      applyCategoryMutation({
        deletedId: dialog.category.id,
        previousCategory: dialog.category,
      });
      setDialog(null);
      setSuccess({
        title: "Category deleted",
        name: dialog.category.category_name,
      });
      list.reload();
    } else if (res.status === 404) missingCategory();
    else setDialogError(res.error || "Unable to delete this category.");
  };

  const deleting = dialog?.mode === "delete";
  return (
    <div className="mx-auto max-w-4xl p-6">
      <AdminNavigation />
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="text-2xl font-bold text-ink dark:text-paper">
            Categories
          </h1>
          <p className="mt-1 text-sm text-ink-soft dark:text-paper/70">
            Manage the categories used by campus services.
          </p>
        </div>
        <Button
          type="button"
          disabled={pending}
          onClick={() => openDialog("create")}>
          <Plus size={18} aria-hidden="true" /> Create category
        </Button>
      </div>
      {success && (
        <SuccessBanner title={success.title} onDismiss={() => setSuccess(null)}>
          {success.name}
        </SuccessBanner>
      )}
      <RequestError error={pageError} />
      <RequestError
        error={
          categoriesError
            ? "Category options could not be refreshed: " + categoriesError
            : null
        }
        onRetry={categoriesLoading ? undefined : retryCategories}
      />
      <section
        aria-label="Categories"
        className="overflow-hidden rounded-xl border border-line bg-paper dark:border-line-dark dark:bg-ink">
        {list.loading ? (
          <p role="status" className="p-8 text-center">
            Loading categories...
          </p>
        ) : list.error ? (
          <div className="p-4">
            <RequestError error={list.error} onRetry={list.reload} />
          </div>
        ) : list.items.length === 0 ? (
          <p className="p-8 text-center text-ink-soft dark:text-paper/70">
            No categories yet. Create a category to get started.
          </p>
        ) : (
          <ul className="divide-y divide-line dark:divide-line-dark">
            {list.items.map((category) => (
              <li
                key={category.id}
                className="flex flex-col justify-between gap-4 p-5 sm:flex-row">
                <div className="min-w-0">
                  <h2 className="break-words font-semibold">
                    {category.category_name}
                  </h2>
                  <p className="mt-1 break-words font-data text-xs text-honey-deep dark:text-honey">
                    Tag: {category.tag}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-ink-soft dark:text-paper/70">
                    {category.description}
                  </p>
                </div>
                <div className="flex shrink-0 items-start gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={pending}
                    onClick={() => openDialog("edit", category)}
                    aria-label={"Edit " + category.category_name}>
                    <Pencil size={16} aria-hidden="true" /> Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => openDialog("delete", category)}
                    aria-label={"Delete " + category.category_name}>
                    <Trash2
                      size={16}
                      className="text-clay dark:text-clay-tint"
                      aria-hidden="true"
                    />{" "}
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {!list.error && (
          <Pagination
            pagination={list.pagination}
            onPageChange={setPage}
            disabled={list.loading || pending}
          />
        )}
      </section>
      <Modal
        open={Boolean(dialog)}
        onClose={closeDialog}
        pending={pending}
        returnFocusRef={headingRef}
        title={
          deleting
            ? "Delete category?"
            : dialog?.mode === "edit"
              ? "Edit category"
              : "Create category"
        }
        footer={
          deleting ? (
            <>
              <Button
                type="button"
                variant="secondary"
                disabled={pending}
                onClick={closeDialog}>
                Go back
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={pending}
                onClick={remove}>
                {pending ? "Deleting..." : "Delete category"}
              </Button>
            </>
          ) : null
        }>
        {deleting ? (
          <>
            <p>
              Delete{" "}
              <strong className="break-words text-ink dark:text-paper">
                {dialog.category.category_name}
              </strong>
              ? This cannot be undone.
            </p>
            <p className="mt-3">
              Categories used by services cannot be deleted.
            </p>
            <RequestError error={dialogError} />
          </>
        ) : (
          <form id="field-category-form" noValidate onSubmit={save}>
            <ErrorSummary errors={errors} />
            <RequestError error={dialogError} />
            <fieldset disabled={pending}>
              <legend className="sr-only">Category details</legend>
              {fields.map(({ name, label, max }) => (
                <FormField
                  key={name}
                  id={"field-" + name}
                  label={label}
                  error={errors[name]}
                  hint={"Required. Maximum " + max + " characters."}>
                  {name === "description" ? (
                    <textarea
                      name={name}
                      required
                      maxLength={max}
                      rows={5}
                      value={draft[name]}
                      className={inputClass}
                      onChange={(event) =>
                        setDraft((old) => ({
                          ...old,
                          [name]: event.target.value,
                        }))
                      }
                    />
                  ) : (
                    <input
                      name={name}
                      required
                      maxLength={max}
                      value={draft[name]}
                      className={inputClass}
                      onChange={(event) =>
                        setDraft((old) => ({
                          ...old,
                          [name]: event.target.value,
                        }))
                      }
                    />
                  )}
                </FormField>
              ))}
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit">
                  {pending
                    ? "Saving..."
                    : dialog?.mode === "edit"
                      ? "Save changes"
                      : "Create category"}
                </Button>
              </div>
            </fieldset>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default AdminCategories;
