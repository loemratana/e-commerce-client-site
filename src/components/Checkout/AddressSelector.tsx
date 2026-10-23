import React, { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { addressesApi } from "@/lib/api/addresses.api";
import { formatAddress, getApiErrorMessage } from "@/lib/order-utils";
import { AddressResponse } from "@/types/order-api";

const inputClass =
  "rounded-md border border-gray-3 bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20";

type Props = {
  addresses: AddressResponse[];
  isLoading: boolean;
  selectedId: number | null;
  onSelect: (id: number) => void;
  onCreated: (address: AddressResponse) => void;
};

const AddressSelector = ({
  addresses,
  isLoading,
  selectedId,
  onSelect,
  onCreated,
}: Props) => {
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isFormOpen = showForm || (!isLoading && addresses.length === 0);

  // A <form> can't be nested in the checkout form, so this collects fields on click.
  const handleSave = async (event: FormEvent<HTMLButtonElement>) => {
    const container = event.currentTarget.closest("[data-address-form]");
    if (!container) return;

    const field = (name: string) =>
      (container.querySelector(`[name="${name}"]`) as HTMLInputElement | null)
        ?.value.trim() ?? "";
    const request = {
      street: field("street"),
      city: field("city"),
      state: field("state"),
      zipCode: field("zipCode"),
      country: field("country"),
      isDefault: addresses.length === 0,
    };

    if (!request.street || !request.city || !request.country) {
      toast.error("Street, city and country are required.");
      return;
    }

    setIsSaving(true);
    try {
      const address = await addressesApi.create(request);
      onCreated(address);
      setShowForm(false);
      toast.success("Address saved.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to save your address."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-9">
      <h2 className="font-medium text-dark text-xl sm:text-2xl mb-5.5">
        Shipping address
      </h2>

      <div className="bg-white shadow-1 rounded-[10px] p-4 sm:p-8.5">
        {isLoading ? (
          <p className="text-custom-sm text-dark-4">Loading your addresses…</p>
        ) : (
          <div className="flex flex-col gap-3">
            {addresses.map((address) => (
              <label
                key={address.id}
                className={`flex cursor-pointer items-start gap-3.5 rounded-md border py-3.5 px-5 duration-200 ${
                  selectedId === address.id
                    ? "border-blue bg-gray-1"
                    : "border-gray-3 hover:bg-gray-1"
                }`}
              >
                <input
                  type="radio"
                  name="addressId"
                  className="mt-1 accent-blue"
                  checked={selectedId === address.id}
                  onChange={() => onSelect(address.id)}
                />
                <span>
                  <span className="block text-dark">{formatAddress(address)}</span>
                  {address.isDefault && (
                    <span className="text-custom-xs text-blue">Default address</span>
                  )}
                </span>
              </label>
            ))}
          </div>
        )}

        {!isLoading && addresses.length > 0 && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="mt-5 font-medium text-blue hover:underline"
          >
            {showForm ? "Cancel" : "+ Add a new address"}
          </button>
        )}

        {isFormOpen && (
          <div data-address-form className="mt-5 border-t border-gray-3 pt-5">
            <div className="mb-5">
              <label htmlFor="street" className="block mb-2.5">
                Street address <span className="text-red">*</span>
              </label>
              <input
                id="street"
                name="street"
                placeholder="House number and street name"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col lg:flex-row gap-5 sm:gap-8 mb-5">
              <div className="w-full">
                <label htmlFor="city" className="block mb-2.5">
                  Town / City <span className="text-red">*</span>
                </label>
                <input id="city" name="city" className={inputClass} />
              </div>
              <div className="w-full">
                <label htmlFor="state" className="block mb-2.5">
                  State / Province
                </label>
                <input id="state" name="state" className={inputClass} />
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-5 sm:gap-8 mb-5">
              <div className="w-full">
                <label htmlFor="zipCode" className="block mb-2.5">
                  ZIP / Postal code
                </label>
                <input id="zipCode" name="zipCode" className={inputClass} />
              </div>
              <div className="w-full">
                <label htmlFor="country" className="block mb-2.5">
                  Country <span className="text-red">*</span>
                </label>
                <input id="country" name="country" className={inputClass} />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex font-medium text-white bg-blue py-3 px-6 rounded-md ease-out duration-200 hover:bg-blue-dark disabled:opacity-60"
            >
              {isSaving ? "Saving…" : "Save address"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressSelector;
