"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

export type SelectOption = {
  label: string;
  value: string;
};

interface CustomSelectProps {
  options: SelectOption[];
  value?: string;
  onSelect: (option: SelectOption) => void;
}

const CustomSelect = ({ options, value, onSelect }: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(
    value ?? options[0]?.value ?? ""
  );
  const selectRef = useRef<HTMLDivElement>(null);

  const activeValue = value !== undefined ? value : internalValue;

  const selectedOption =
    options.find((option) => option.value === activeValue) ?? options[0];

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSelect = (option: SelectOption) => {
    setInternalValue(option.value);
    setIsOpen(false);
    onSelect(option);
  };

  return (
    <div
      ref={selectRef}
      className="custom-select relative shrink-0 w-[140px] sm:w-[170px] md:w-[190px]"
    >
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center justify-between w-full h-[46px] rounded-l-[5px] border border-gray-3 border-r-0 bg-gray-1 pl-3.5 sm:pl-4 pr-2.5 py-2.5 text-xs sm:text-sm font-medium text-dark transition-colors hover:bg-gray-2 focus:outline-none after:hidden"
      >
        <span className="truncate text-left" title={selectedOption?.label}>
          {selectedOption?.label ?? "All Categories"}
        </span>
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`ml-1.5 shrink-0 text-dark-4 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-[99999] w-56 sm:w-64 rounded-xl border border-gray-3 bg-white p-1.5 shadow-2xl">
          <div className="px-3 py-1.5 border-b border-gray-2 mb-1">
            <span className="text-2xs font-semibold uppercase tracking-wider text-dark-4">
              Categories
            </span>
          </div>

          <ul
            role="listbox"
            className="max-h-64 overflow-y-auto space-y-0.5 no-scrollbar"
          >
            {options.map((option) => {
              const isSelected = selectedOption?.value === option.value;
              return (
                <li key={option.value} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option)}
                    className={`group flex w-full items-center justify-between rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-left transition-colors ${
                      isSelected
                        ? "bg-blue/10 font-semibold text-blue"
                        : "text-dark hover:bg-gray-1 hover:text-blue"
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && (
                      <Check
                        size={16}
                        aria-hidden="true"
                        className="text-blue shrink-0 ml-2"
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
