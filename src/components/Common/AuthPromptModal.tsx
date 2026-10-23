"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AUTH_REQUIRED_EVENT,
  dismissAuthenticationPrompt,
  isAuthenticationPromptRequested,
} from "@/lib/auth-prompt";

const AuthPromptModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const openPrompt = () => setIsOpen(true);
    window.addEventListener(AUTH_REQUIRED_EVENT, openPrompt);
    if (isAuthenticationPromptRequested()) openPrompt();

    return () => window.removeEventListener(AUTH_REQUIRED_EVENT, openPrompt);
  }, []);

  if (!isOpen) return null;

  const closePrompt = () => {
    dismissAuthenticationPrompt();
    setIsOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-dark/70 px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closePrompt();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-prompt-title"
        className="w-full max-w-md rounded-xl bg-white p-7 text-center shadow-3"
      >
        <h2 id="auth-prompt-title" className="text-xl font-semibold text-dark">
          Sign in to access your cart
        </h2>
        <p className="mt-3 text-gray-600">
          You need an account to use your cart. Sign in or create an account to
          continue.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/signin"
            onClick={closePrompt}
            className="flex-1 rounded-md bg-blue px-5 py-3 font-medium text-white transition-colors hover:bg-blue-dark"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            onClick={closePrompt}
            className="flex-1 rounded-md bg-dark px-5 py-3 font-medium text-white transition-colors hover:bg-opacity-95"
          >
            Register
          </Link>
        </div>

        <button
          type="button"
          onClick={closePrompt}
          className="mt-5 text-sm text-gray-600 underline hover:text-dark"
        >
          Continue browsing
        </button>
      </section>
    </div>
  );
};

export default AuthPromptModal;
