import { PRODUCT_TYPE_LABELS, ProductType } from "@/types/product-api";

interface ProductTypeTabsProps {
  value: ProductType | undefined;
  onChange: (type: ProductType | undefined) => void;
}

// Unisex products show up under both Men and Women, so it needs no tab of its own.
const tabs: Array<{ value: ProductType | undefined; label: string }> = [
  { value: undefined, label: "All" },
  { value: "MEN", label: PRODUCT_TYPE_LABELS.MEN },
  { value: "WOMEN", label: PRODUCT_TYPE_LABELS.WOMEN },
];

const ProductTypeTabs = ({ value, onChange }: ProductTypeTabsProps) => (
  <div
    role="tablist"
    aria-label="Shop by type"
    className="mb-6 flex gap-1 rounded-lg bg-white p-1.5 shadow-1"
  >
    {tabs.map((tab) => {
      const active = tab.value === value;
      return (
        <button
          key={tab.label}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => onChange(tab.value)}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors sm:flex-none sm:px-6 ${
            active ? "bg-blue text-white" : "text-dark hover:text-blue"
          }`}
        >
          {tab.label}
        </button>
      );
    })}
  </div>
);

export default ProductTypeTabs;
