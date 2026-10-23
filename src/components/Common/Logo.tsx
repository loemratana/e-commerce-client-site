"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { settingsApi } from "@/lib/api/settings.api";

// system-logo.png is 344x441
const LOGO_RATIO = 344 / 441;

type LogoProps = {
  /** Icon height in px; the store name scales with it. */
  height?: number;
  priority?: boolean;
};

// Shop icon plus the store name set in the admin dashboard (Settings / Store).
const Logo = ({ height = 40, priority = false }: LogoProps) => {
  const [storeName, setStoreName] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    settingsApi
      .getPublic()
      .then((settings) => {
        if (isActive) setStoreName(settings.storeName);
      })
      .catch(() => {
        // The icon alone still works as a logo
      });
    return () => {
      isActive = false;
    };
  }, []);

  return (
    <span className="flex items-center gap-2.5">
      <Image
        src="/images/logo/system-logo.png"
        alt={storeName ?? "Logo"}
        width={Math.round(height * LOGO_RATIO)}
        height={height}
        priority={priority}
        className="shrink-0"
      />
      {storeName && (
        <span
          className="font-semibold text-dark leading-none whitespace-nowrap"
          style={{ fontSize: Math.round(height * 0.5) }}
        >
          {storeName}
        </span>
      )}
    </span>
  );
};

export default Logo;
