"use client";
import { Fragment, useState, useEffect } from "react";
import "../css/euclid-circular-a-font.css";
import "../css/style.css";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

import { ModalProvider } from "../context/QuickViewModalContext";
import { CartModalProvider } from "../context/CartSidebarModalContext";
import { ReduxProvider } from "@/redux/provider";
import QuickViewModal from "@/components/Common/QuickViewModal";
import CartSidebarModal from "@/components/Common/CartSidebarModal";
import { PreviewSliderProvider } from "../context/PreviewSliderContext";
import PreviewSliderModal from "@/components/Common/PreviewSlider";

import ScrollToTop from "@/components/Common/ScrollToTop";
import PreLoader from "@/components/Common/PreLoader";
import { Toaster } from "react-hot-toast";
import AuthPromptModal from "@/components/Common/AuthPromptModal";
import { settingsApi } from "@/lib/api/settings.api";
import { getCurrency, setCurrency } from "@/lib/currency";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState<boolean>(true);
  // Bumped when the store currency turns out to differ from the one pages rendered with.
  const [currencyRevision, setCurrencyRevision] = useState(0);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  // Store currency from the admin dashboard; usually arrives while the preloader is still showing.
  useEffect(() => {
    settingsApi
      .getPublic()
      .then(({ currency }) => {
        if (currency && currency !== getCurrency()) {
          setCurrency(currency);
          setCurrencyRevision((value) => value + 1);
        }
      })
      // Keep the last known (or default) currency if the API is unreachable.
      .catch(() => undefined);
  }, []);

  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body>
        {loading ? (
          <PreLoader />
        ) : (
          <>
            <ReduxProvider>
              <CartModalProvider>
                <ModalProvider>
                  <PreviewSliderProvider>
                    <Header />
                    <Fragment key={currencyRevision}>{children}</Fragment>

                    <QuickViewModal />
                    <CartSidebarModal />
                    <PreviewSliderModal />
                    <AuthPromptModal />
                    <Toaster position="top-right" />
                  </PreviewSliderProvider>
                </ModalProvider>
              </CartModalProvider>
            </ReduxProvider>
            <ScrollToTop />
            <Footer />
          </>
        )}
      </body>
    </html>
  );
}
