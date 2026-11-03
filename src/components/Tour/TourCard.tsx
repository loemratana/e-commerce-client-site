"use client";
import React from "react";
import { CardComponentProps, useOnborda } from "onborda";
import { X } from "lucide-react";
import { TOUR_DONE_KEY } from "./tourSteps";

const markTourDone = () => {
  try {
    localStorage.setItem(TOUR_DONE_KEY, "1");
  } catch {
    // Private mode: the tour may show again next visit
  }
};

const TourCard = ({ step, currentStep, totalSteps, nextStep, prevStep, arrow }: CardComponentProps) => {
  const { closeOnborda } = useOnborda();
  const isLast = currentStep === totalSteps - 1;

  const finish = () => {
    markTourDone();
    closeOnborda();
  };

  return (
    <div className="w-[300px] max-w-[calc(100vw-32px)] rounded-lg bg-white p-5 shadow-3">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <p className="text-custom-xs text-dark-4">
            Step {currentStep + 1} of {totalSteps}
          </p>
          <h3 className="font-semibold text-dark">{step.title}</h3>
        </div>
        <button
          type="button"
          onClick={finish}
          aria-label="Close tour"
          className="-mr-1 -mt-1 flex h-8 w-8 items-center justify-center rounded-md text-dark-4 hover:bg-gray-1 hover:text-dark"
        >
          <X size={16} />
        </button>
      </div>

      <p className="text-custom-sm text-dark-4">{step.content}</p>

      <div className="mt-5 flex items-center justify-between">
        <button
          type="button"
          onClick={finish}
          className="text-custom-sm text-dark-4 hover:text-dark"
        >
          Skip
        </button>

        <div className="flex gap-2">
          {currentStep > 0 && (
            <button
              type="button"
              onClick={prevStep}
              className="rounded-md border border-gray-3 px-4 py-1.5 text-custom-sm font-medium text-dark hover:bg-gray-1"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={isLast ? finish : nextStep}
            className="rounded-md bg-blue px-4 py-1.5 text-custom-sm font-medium text-white hover:bg-blue-dark"
          >
            {isLast ? "Finish" : "Next"}
          </button>
        </div>
      </div>

      <span className="text-white">{arrow}</span>
    </div>
  );
};

export default TourCard;
