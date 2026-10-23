"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import Logo from "../Common/Logo";
import { PublicSettings, settingsApi } from "@/lib/api/settings.api";

const footerLinks = [
  {
    title: "Shop",
    links: [
      { label: "All Products", href: "/shop-with-sidebar" },
      { label: "Cart", href: "/cart" },
      { label: "Wishlist", href: "/wishlist" },
      { label: "Checkout", href: "/checkout" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "My Account", href: "/my-account" },
      { label: "Sign In", href: "/signin" },
      { label: "Create Account", href: "/signup" },
      { label: "My Returns", href: "/account/returns" },
    ],
  },
  {
    title: "Help & Support",
    links: [{ label: "Contact Us", href: "/contact" }],
  },
];

// Checkout takes card payments through Stripe.
const paymentCards = [
  { src: "/images/payment/payment-01.svg", alt: "Visa", width: 66, height: 22 },
  {
    src: "/images/payment/payment-03.svg",
    alt: "Mastercard",
    width: 33,
    height: 24,
  },
];

const Footer = () => {
  const year = new Date().getFullYear();
  // Store name and contact details from the admin dashboard (Settings / Store).
  const [store, setStore] = useState<PublicSettings | null>(null);

  useEffect(() => {
    let isActive = true;
    settingsApi
      .getPublic()
      .then((settings) => {
        if (isActive) setStore(settings);
      })
      .catch(() => {
        // Without settings the footer just leaves out the contact details
      });
    return () => {
      isActive = false;
    };
  }, []);

  return (
    <footer className="overflow-hidden">
      <div className="site-container">
        {/* <!-- footer menu start --> */}
        <div className="flex flex-wrap xl:flex-nowrap gap-10 xl:gap-19 xl:justify-between pt-17.5 xl:pt-22.5 pb-10 xl:pb-15">
          <div className="max-w-[330px] w-full">
            <Link href="/" className="inline-block mb-5">
              <Logo height={44} />
            </Link>
            {store?.description && (
              <p className="text-custom-sm mb-5">{store.description}</p>
            )}

            <ul className="flex flex-col gap-3">
              {store?.phone && (
                <li>
                  <a
                    href={`tel:${store.phone.replace(/\s+/g, "")}`}
                    className="flex items-center gap-3 ease-out duration-200 hover:text-blue"
                  >
                    <Phone size={18} className="text-blue" aria-hidden="true" />
                    {store.phone}
                  </a>
                </li>
              )}
              {store?.email && (
                <li>
                  <a
                    href={`mailto:${store.email}`}
                    className="flex items-center gap-3 ease-out duration-200 hover:text-blue"
                  >
                    <Mail size={18} className="text-blue" aria-hidden="true" />
                    {store.email}
                  </a>
                </li>
              )}
            </ul>
          </div>

          {footerLinks.map((group) => (
            <div key={group.title} className="w-full sm:w-auto">
              <h2 className="mb-7.5 text-custom-1 font-medium text-dark">
                {group.title}
              </h2>

              <ul className="flex flex-col gap-3.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      className="ease-out duration-200 hover:text-blue"
                      href={link.href}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {/* <!-- footer menu end --> */}
      </div>

      {/* <!-- footer bottom start --> */}
      <div className="py-5 xl:py-7.5 bg-gray-1">
        <div className="site-container">
          <div className="flex gap-5 flex-wrap items-center justify-between">
            <p className="text-dark font-medium">
              &copy; {year}
              {store?.storeName ? ` ${store.storeName}` : ""}. All rights
              reserved.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <p className="font-medium">We Accept:</p>

              <div className="flex flex-wrap items-center gap-6">
                {paymentCards.map((card) => (
                  <Image
                    key={card.alt}
                    src={card.src}
                    alt={card.alt}
                    width={card.width}
                    height={card.height}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* <!-- footer bottom end --> */}
    </footer>
  );
};

export default Footer;
