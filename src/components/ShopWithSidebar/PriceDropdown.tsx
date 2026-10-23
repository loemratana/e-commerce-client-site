"use client";

import { useEffect, useState } from "react";
import RangeSlider from "react-range-slider-input";
import "react-range-slider-input/dist/style.css";

const MIN_PRICE = 0;
const MAX_PRICE = 1000;

interface PriceDropdownProps {
  minPrice?: number;
  maxPrice?: number;
  onChange: (range: { minPrice?: number; maxPrice?: number }) => void;
}

const PriceDropdown = ({
  minPrice,
  maxPrice,
  onChange,
}: PriceDropdownProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [draftRange, setDraftRange] = useState<[number, number]>([
    minPrice ?? MIN_PRICE,
    maxPrice ?? MAX_PRICE,
  ]);

  useEffect(() => {
    setDraftRange([minPrice ?? MIN_PRICE, maxPrice ?? MAX_PRICE]);
  }, [minPrice, maxPrice]);

  const applyRange = () => {
    onChange({
      minPrice: draftRange[0] > MIN_PRICE ? draftRange[0] : undefined,
      maxPrice: draftRange[1] < MAX_PRICE ? draftRange[1] : undefined,
    });
  };

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
        <span className="font-medium">Price</span>
        <svg
          className={`h-6 w-6 transition-transform ${isOpen ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m5 9 7 7 7-7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="px-6 py-5">
          <RangeSlider
            min={MIN_PRICE}
            max={MAX_PRICE}
            step={5}
            value={draftRange}
            onInput={setDraftRange}
            onThumbDragEnd={applyRange}
            onRangeDragEnd={applyRange}
            className="range-slider"
          />
          <div className="mt-5 flex items-center justify-between text-xs text-dark-4">
            <span className="rounded border border-gray-3/80 px-3 py-1.5">
              ${draftRange[0]}
            </span>
            <span className="rounded border border-gray-3/80 px-3 py-1.5">
              ${draftRange[1]}
            </span>
          </div>
          <button
            type="button"
            onClick={applyRange}
            className="mt-4 w-full rounded-md bg-blue py-2 text-sm font-medium text-white transition-colors hover:bg-blue-dark"
          >
            Apply price
          </button>
        </div>
      )}
    </section>
  );
};

export default PriceDropdown;
