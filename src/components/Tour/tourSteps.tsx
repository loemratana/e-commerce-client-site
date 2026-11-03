import { Step } from "onborda";

export const TOUR_NAME = "welcome";
export const TOUR_DONE_KEY = "welcomeTourDone";

type TourStepConfig = Omit<Step, "selector" | "icon"> & {
  /** Candidate targets in order; the first one visible on this screen size is used. */
  selectors: string[];
};

// Targets are ids in the header and on the home page product grid.
export const tourStepConfigs: TourStepConfig[] = [
  {
    title: "Search products",
    content: "Find products quickly using the search bar.",
    selectors: ["#tour-search", "#tour-search-mobile"],
    side: "bottom",
  },
  {
    title: "Browse categories",
    content: "Explore product categories and discover items.",
    selectors: ["#tour-categories", "#tour-menu"],
    side: "bottom-left",
  },
  {
    title: "Wishlist",
    content: "Save favorite products for later.",
    selectors: ["#tour-wishlist"],
    side: "bottom-right",
  },
  {
    title: "Shopping cart",
    content: "Review selected products and quantities.",
    selectors: ["#tour-cart"],
    side: "bottom-right",
  },
  {
    title: "Account menu",
    content: "Access your profile, orders, and account settings.",
    selectors: ["#tour-account"],
    side: "bottom-right",
  },
  {
    title: "Explore products",
    content: "Choose a product to view its details and options.",
    selectors: ["#tour-products"],
    side: "top",
  },
];

const isVisible = (selector: string) => {
  const element = document.querySelector(selector);
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

/** Steps whose target is on screen right now (some header items are hidden on phones). */
export const getVisibleTourSteps = (): Step[] =>
  tourStepConfigs.flatMap(({ selectors, ...step }) => {
    const selector = selectors.find(isVisible);
    return selector
      ? [{ ...step, icon: null, selector, showControls: true, pointerPadding: 8, pointerRadius: 10 }]
      : [];
  });
