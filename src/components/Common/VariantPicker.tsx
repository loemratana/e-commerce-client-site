"use client";
import { ApiProduct } from "@/types/product-api";
import {
  findVariant,
  getColorOptions,
  getSizeOptions,
  sameColor,
} from "@/lib/variants";

export type VariantSelection = { color: string | null; sizeId: number | null };

interface VariantPickerProps {
  product: ApiProduct;
  selection: VariantSelection;
  onChange: (selection: VariantSelection) => void;
}

/** Color buttons, then the sizes that exist for that color. Sold-out options stay visible but disabled. */
const VariantPicker = ({ product, selection, onChange }: VariantPickerProps) => {
  const colors = getColorOptions(product);
  const sizes = getSizeOptions(product, selection.color);

  const pickColor = (color: string) => {
    // Keep the current size if the new color has it in stock, else jump to its first in-stock size.
    const options = getSizeOptions(product, color);
    const keep = options.find((option) => option.id === selection.sizeId && option.inStock);
    const next = keep ?? options.find((option) => option.inStock) ?? options[0];
    onChange({ color, sizeId: next?.id ?? null });
  };

  if (!colors.length && !sizes.length) return null;

  return (
    <div className="flex flex-col gap-4">
      {colors.length > 0 && (
        <div>
          <h4 className="mb-2 font-medium text-dark">
            Color: <span className="font-normal text-dark-4">{selection.color ?? "Select"}</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {colors.map(({ color, inStock }) => {
              const active = sameColor(color, selection.color);
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => pickColor(color)}
                  aria-pressed={active}
                  title={inStock ? color : `${color} (sold out)`}
                  className={`rounded-md border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "border-blue bg-blue text-white"
                      : "border-gray-3 bg-white text-dark hover:border-blue"
                  } ${inStock ? "" : "opacity-50 line-through"}`}
                >
                  {color}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div>
          <h4 className="mb-2 font-medium text-dark">Size:</h4>
          <div className="flex flex-wrap gap-2">
            {sizes.map(({ id, name, inStock }) => {
              const active = id === selection.sizeId;
              return (
                <button
                  key={id}
                  type="button"
                  disabled={!inStock}
                  onClick={() => onChange({ ...selection, sizeId: id })}
                  aria-pressed={active}
                  title={inStock ? name : `${name} (sold out)`}
                  className={`min-w-[44px] rounded-md border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:line-through ${
                    active
                      ? "border-blue bg-blue text-white"
                      : "border-gray-3 bg-white text-dark hover:border-blue"
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!findVariant(product, selection.color, selection.sizeId) && (
        <p className="text-sm text-red">This combination is not available.</p>
      )}
    </div>
  );
};

export default VariantPicker;
