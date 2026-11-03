"use client";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Onborda, OnbordaProvider, Step, useOnborda } from "onborda";
import TourCard from "./TourCard";
import { TOUR_DONE_KEY, TOUR_NAME, getVisibleTourSteps } from "./tourSteps";

// Wait for the home page products to load before picking targets
const START_DELAY_MS = 1500;

const hasSeenTour = () => {
  try {
    return localStorage.getItem(TOUR_DONE_KEY) === "1";
  } catch {
    return true;
  }
};

/** Starts the welcome tour once, on a customer's first visit to the home page. */
const TourHost = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { startOnborda } = useOnborda();
  const [steps, setSteps] = useState<Step[]>([]);

  useEffect(() => {
    if (pathname !== "/" || hasSeenTour()) return;

    const timer = window.setTimeout(() => {
      const visibleSteps = getVisibleTourSteps();
      if (visibleSteps.length === 0) return;
      window.scrollTo({ top: 0 });
      setSteps(visibleSteps);
      startOnborda(TOUR_NAME);
    }, START_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [pathname, startOnborda]);

  return (
    <Onborda
      steps={[{ tour: TOUR_NAME, steps }]}
      cardComponent={TourCard}
      shadowRgb="0,0,0"
      shadowOpacity="0.55"
      cardTransition={{ duration: 0.3, type: "tween" }}
    >
      {children}
    </Onborda>
  );
};

const SiteTour = ({ children }: { children: React.ReactNode }) => (
  <OnbordaProvider>
    <TourHost>{children}</TourHost>
  </OnbordaProvider>
);

export default SiteTour;
