"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { addressesApi } from "@/lib/api/addresses.api";
import { getApiErrorMessage } from "@/lib/order-utils";
import { AddressRequest, AddressResponse } from "@/types/order-api";

const inputClass =
  "w-full rounded-lg border border-gray-3 bg-gray-1 px-4 py-3 text-dark outline-none transition focus:border-blue";

// Max lengths match AddressRequest / the addresses table in the API.
const FIELDS: { name: keyof Omit<AddressRequest, "isDefault">; label: string; maxLength: number; autoComplete: string; wide?: boolean }[] = [
  { name: "street", label: "Street address", maxLength: 150, autoComplete: "street-address", wide: true },
  { name: "city", label: "City", maxLength: 100, autoComplete: "address-level2" },
  { name: "state", label: "State / Province", maxLength: 100, autoComplete: "address-level1" },
  { name: "zipCode", label: "Zip / Postal code", maxLength: 20, autoComplete: "postal-code" },
  { name: "country", label: "Country", maxLength: 100, autoComplete: "country-name" },
];

// Default first, then newest.
const sortAddresses = (list: AddressResponse[]) =>
  [...list].sort((a, b) => Number(Boolean(b.isDefault)) - Number(Boolean(a.isDefault)) || b.id - a.id);

type EditorState = { mode: "create" } | { mode: "edit"; address: AddressResponse } | null;

type Props = {
  /** Lets the account page keep the overview's address list in sync. */
  onChange?: (addresses: AddressResponse[]) => void;
};

const AddressBook = ({ onChange }: Props) => {
  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editor, setEditor] = useState<EditorState>(null);
  const [isSaving, setIsSaving] = useState(false);
  // Id of the address whose delete / make-default request is running.
  const [busyId, setBusyId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AddressResponse | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const list = sortAddresses(await addressesApi.getAll());
      setAddresses(list);
      onChange?.(list);
    } catch (error) {
      setLoadError(getApiErrorMessage(error, "Unable to load your addresses."));
    } finally {
      setIsLoading(false);
    }
  }, [onChange]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editor) return;
    const formData = new FormData(event.currentTarget);
    const request: AddressRequest = {
      street: String(formData.get("street") ?? "").trim(),
      city: String(formData.get("city") ?? "").trim(),
      state: String(formData.get("state") ?? "").trim(),
      zipCode: String(formData.get("zipCode") ?? "").trim(),
      country: String(formData.get("country") ?? "").trim(),
    };
    const missing = FIELDS.find((field) => !request[field.name]);
    if (missing) {
      toast.error(`${missing.label} is required.`);
      return;
    }
    // Only send isDefault when it's being turned on; the API won't unset the current default.
    if (formData.get("isDefault") === "on") request.isDefault = true;

    setIsSaving(true);
    try {
      if (editor.mode === "create") {
        await addressesApi.create(request);
        toast.success("Address added.");
      } else {
        await addressesApi.update(editor.address.id, request);
        toast.success("Address updated.");
      }
      setEditor(null);
      // Reload: making one address default changes the others too.
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to save your address."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetDefault = async (address: AddressResponse) => {
    setBusyId(address.id);
    try {
      await addressesApi.setDefault(address.id);
      toast.success("Default address updated.");
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to set your default address."));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (address: AddressResponse) => {
    setBusyId(address.id);
    try {
      await addressesApi.remove(address.id);
      toast.success("Address deleted.");
      if (editor?.mode === "edit" && editor.address.id === address.id) setEditor(null);
      // If it was the default, the API promotes another address.
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to delete your address."));
    } finally {
      setBusyId(null);
      setConfirmDelete(null);
    }
  };

  const editing = editor?.mode === "edit" ? editor.address : null;

  return (
    <section className="rounded-xl bg-white p-6 shadow-1 sm:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-dark">Addresses</h2>
          <p className="mt-1 text-sm text-gray-500">
            Your default address is selected automatically at checkout.
          </p>
        </div>
        {!editor && !isLoading && !loadError && (
          <button
            type="button"
            onClick={() => setEditor({ mode: "create" })}
            className="rounded-lg bg-blue px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-dark"
          >
            Add address
          </button>
        )}
      </div>

      {editor && (
        <form
          key={editing ? `edit-${editing.id}` : "create"}
          onSubmit={handleSubmit}
          noValidate
          className="mb-6 rounded-lg border border-blue/30 bg-blue-light-5/20 p-5"
        >
          <h3 className="mb-4 font-medium text-dark">
            {editing ? "Edit address" : "New address"}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map((field) => (
              <label
                key={field.name}
                className={`block text-sm font-medium text-dark ${field.wide ? "sm:col-span-2" : ""}`}
              >
                {field.label}
                <input
                  className={`${inputClass} mt-2`}
                  name={field.name}
                  defaultValue={editing?.[field.name] ?? ""}
                  maxLength={field.maxLength}
                  autoComplete={field.autoComplete}
                  required
                />
              </label>
            ))}
          </div>
          {!editing?.isDefault && (
            <label className="mt-4 flex items-center gap-2 text-sm text-dark">
              <input
                type="checkbox"
                name="isDefault"
                defaultChecked={!editing && addresses.length === 0}
                className="h-4 w-4"
              />
              Use as my default address
            </label>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-blue px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving…" : editing ? "Save address" : "Add address"}
            </button>
            <button
              type="button"
              onClick={() => setEditor(null)}
              disabled={isSaving}
              className="rounded-lg border border-gray-3 px-5 py-2.5 text-sm font-medium text-dark hover:bg-gray-1"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-600">Loading your addresses…</p>
      ) : loadError ? (
        <div className="rounded-lg border border-red/30 bg-red-light-6 p-4 text-sm text-red">
          {loadError}{" "}
          <button type="button" onClick={() => void load()} className="font-medium underline">
            Try again
          </button>
        </div>
      ) : addresses.length === 0 ? (
        !editor && (
          <div className="rounded-lg border border-dashed border-gray-3 p-8 text-center">
            <p className="font-medium text-dark">No saved addresses yet</p>
            <p className="mt-1 text-sm text-gray-500">
              Add one now to check out faster.
            </p>
          </div>
        )
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => {
            const isBusy = busyId === address.id;
            return (
              <article
                key={address.id}
                className={`flex flex-col rounded-lg border p-4 ${address.isDefault ? "border-blue" : "border-gray-3"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-dark">
                    {address.isDefault ? "Default address" : "Address"}
                  </p>
                  {address.isDefault && (
                    <span className="rounded-full bg-blue/10 px-2.5 py-1 text-xs font-medium text-blue">
                      Default
                    </span>
                  )}
                </div>
                <p className="mt-2 flex-1 text-sm leading-6 text-gray-600">
                  {address.street}
                  <br />
                  {[address.city, address.state, address.zipCode].filter(Boolean).join(", ")}
                  <br />
                  {address.country}
                </p>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-gray-3 pt-3 text-sm font-medium">
                  <button
                    type="button"
                    onClick={() => setEditor({ mode: "edit", address })}
                    disabled={isBusy || isSaving}
                    className="text-blue hover:underline disabled:opacity-50"
                  >
                    Edit
                  </button>
                  {!address.isDefault && (
                    <button
                      type="button"
                      onClick={() => void handleSetDefault(address)}
                      disabled={isBusy}
                      className="text-blue hover:underline disabled:opacity-50"
                    >
                      {isBusy ? "Saving…" : "Make default"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(address)}
                    disabled={isBusy}
                    className="ml-auto text-red hover:underline disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-dark/70 px-4" role="presentation">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-address-title"
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-3 sm:p-8"
          >
            <h2 id="delete-address-title" className="text-xl font-semibold text-dark">
              Delete this address?
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              {[confirmDelete.street, confirmDelete.city, confirmDelete.country].filter(Boolean).join(", ")}
            </p>
            {confirmDelete.isDefault && addresses.length > 1 && (
              <p className="mt-2 text-sm text-gray-600">
                Your most recently added address will become the default.
              </p>
            )}
            <p className="mt-2 text-sm text-gray-500">
              Past orders keep the address they were shipped to.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                disabled={busyId !== null}
                className="rounded-lg border border-gray-3 px-4 py-2.5 font-medium text-dark hover:bg-gray-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(confirmDelete)}
                disabled={busyId !== null}
                className="rounded-lg bg-red px-4 py-2.5 font-medium text-white hover:bg-red/90 disabled:opacity-60"
              >
                {busyId === confirmDelete.id ? "Deleting…" : "Delete address"}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
};

export default AddressBook;
