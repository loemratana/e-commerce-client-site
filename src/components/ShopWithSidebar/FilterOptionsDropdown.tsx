"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type FilterOption = {
  id: number;
  name: string;
};

interface FilterOptionsDropdownProps {
  label: string;
  options: FilterOption[];
  value?: number;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  onChange: (value?: number) => void;
}

const FilterOptionsDropdown = ({
  label,
  options,
  value,
  isLoading = false,
  error = null,
  onRetry,
  onChange,
}: FilterOptionsDropdownProps) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <section className="overflow-hidden rounded-lg bg-white shadow-1">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className={`flex w-full items-center justify-between px-6 py-3.5 text-left text-dark ${
          isOpen ? "shadow-filter" : ""
        }`}
      >
        <span className="font-medium">{label}</span>
        <ChevronDown
          size={20}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="flex max-h-64 flex-col gap-3 overflow-y-auto px-6 py-5">
          {isLoading ? (
            <p className="text-sm text-gray-500">Loading {label.toLowerCase()}...</p>
          ) : error ? (
            <div className="text-sm text-red-600" role="alert">
              <p>{error.message}</p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-1 font-medium underline"
                >
                  Try again
                </button>
              )}
            </div>
          ) : options.length ? (
            options.map((option) => {
              const selected = value === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onChange(selected ? undefined : option.id)}
                  className={`group flex items-center gap-2.5 text-left text-sm transition-colors hover:text-blue ${
                    selected ? "font-medium text-blue" : "text-dark"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                      selected
                        ? "border-blue bg-blue text-white"
                        : "border-gray-3 bg-white group-hover:border-blue"
                    }`}
                  >
                    {selected && <Check size={12} strokeWidth={3} />}
                  </span>
                  <span>{option.name}</span>
                </button>
              );
            })
          ) : (
            <p className="text-sm text-gray-500">No {label.toLowerCase()} available.</p>
          )}
        </div>
      )}
    </section>
  );
};

export default FilterOptionsDropdown;
