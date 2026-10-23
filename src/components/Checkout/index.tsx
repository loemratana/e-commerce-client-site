"use client";
import React, { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Breadcrumb from "../Common/Breadcrumb";
import AddressSelector from "./AddressSelector";
import Coupon from "./Coupon";
import OrderList from "./OrderList";
import PaymentMethodSelector from "./PaymentMethodSelector";
import { addressesApi } from "@/lib/api/addresses.api";
import { ordersApi } from "@/lib/api/orders.api";
import { paymentsApi } from "@/lib/api/payments.api";
import { hasAccessToken, requestAuthentication } from "@/lib/auth-prompt";
import { formatPrice, getApiErrorMessage } from "@/lib/order-utils";
import { fetchCart, resetCart } from "@/redux/features/cart-slice";
import { useAppSelector } from "@/redux/store";
import { AppDispatch } from "@/redux/store";
import { useDispatch } from "react-redux";
import { AddressResponse, CouponResponse } from "@/types/order-api";
import { PaymentMethod } from "@/types/payment-api";

const Checkout = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const cartItems = useAppSelector((state) => state.cartReducer.items);
  const cartStatus = useAppSelector((state) => state.cartReducer.status);
  const subtotal = useAppSelector((state) => state.cartReducer.totalPrice);

  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [coupon, setCoupon] = useState<CouponResponse | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoadingMethods, setIsLoadingMethods] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);

  useEffect(() => {
    if (!hasAccessToken()) {
      requestAuthentication();
      setIsLoadingAddresses(false);
      setIsLoadingMethods(false);
      return;
    }

    void dispatch(fetchCart());
    paymentsApi
      .getMethods()
      .then((methods) => {
        setPaymentMethods(methods);
        if (methods.length === 1) setPaymentMethod(methods[0]);
      })
      .catch((error) =>
        toast.error(getApiErrorMessage(error, "Unable to load payment methods."))
      )
      .finally(() => setIsLoadingMethods(false));
    addressesApi
      .getAll()
      .then((list) => {
        setAddresses(list);
        const preferred = list.find((a) => a.isDefault) ?? list[0];
        if (preferred) setSelectedAddressId(preferred.id);
      })
      .catch((error) =>
        toast.error(getApiErrorMessage(error, "Unable to load your addresses."))
      )
      .finally(() => setIsLoadingAddresses(false));
  }, [dispatch]);

  // The coupon was validated against the old amount; make the user re-apply it.
  useEffect(() => {
    setCoupon(null);
  }, [subtotal]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!hasAccessToken()) {
      requestAuthentication();
      return;
    }
    if (!selectedAddressId) {
      toast.error("Please choose a shipping address.");
      return;
    }
    if (!paymentMethod) {
      toast.error("Please choose a payment method.");
      return;
    }

    setIsPlacing(true);
    try {
      const order = await ordersApi.checkout({
        addressId: selectedAddressId,
        couponCode: coupon?.code,
      });
      // The server empties the cart after checkout
      dispatch(resetCart());
      const orderPage = `/orders/${encodeURIComponent(order.orderNumber)}`;

      // The order exists now; if starting the payment fails, the order page offers "Pay now".
      try {
        const payment = await paymentsApi.initiate({
          orderNumber: order.orderNumber,
          method: paymentMethod,
        });
        if (payment.redirectUrl) {
          // Online payment (Stripe Checkout): the order is confirmed once the payment succeeds.
          window.location.assign(payment.redirectUrl);
          return;
        }
        toast.success(
          `Order ${order.orderNumber} placed. Pay ${formatPrice(order.totalOrderPrice)} on delivery.`
        );
      } catch (paymentError) {
        toast.error(
          getApiErrorMessage(
            paymentError,
            `Order ${order.orderNumber} was placed, but the payment couldn't be started. You can pay from the order page.`
          )
        );
      }
      router.push(orderPage);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to place your order."));
      // Stock may have changed; reload so the cart shows current quantities
      void dispatch(fetchCart());
    } finally {
      setIsPlacing(false);
    }
  };

  const isCartEmpty = cartStatus !== "loading" && cartItems.length === 0;
  // Archived products can't be ordered; the API would reject the whole checkout.
  const unavailableItems = cartItems.filter((item) => item.available === false);

  return (
    <>
      <Breadcrumb title={"Checkout"} pages={["checkout"]} />
      <section className="overflow-hidden py-20 bg-gray-2">
        <div className="site-container">
          {isCartEmpty ? (
            <div className="bg-white shadow-1 rounded-[10px] p-8.5 text-center">
              <p className="mb-5 text-dark">Your cart is empty.</p>
              <Link
                href="/shop-with-sidebar"
                className="inline-flex font-medium text-white bg-blue py-3 px-6 rounded-md hover:bg-blue-dark"
              >
                Continue shopping
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col lg:flex-row gap-7.5 xl:gap-11">
                {/* <!-- checkout left --> */}
                <div className="w-full lg:flex-1 lg:min-w-0">
                  <AddressSelector
                    addresses={addresses}
                    isLoading={isLoadingAddresses}
                    selectedId={selectedAddressId}
                    onSelect={setSelectedAddressId}
                    onCreated={(address) => {
                      setAddresses((list) => [...list, address]);
                      setSelectedAddressId(address.id);
                    }}
                  />

                  <div className="bg-white shadow-1 rounded-[10px] p-4 sm:p-8.5 mt-7.5">
                    <h3 className="font-medium text-xl text-dark mb-2.5">Payment</h3>
                    <PaymentMethodSelector
                      methods={paymentMethods}
                      isLoading={isLoadingMethods}
                      selected={paymentMethod}
                      onSelect={setPaymentMethod}
                    />
                    {paymentMethod !== "CASH_ON_DELIVERY" && (
                      <p className="mt-4 text-custom-sm text-dark-4">
                        Items are held for you for a limited time while you pay;
                        unpaid orders are cancelled automatically.
                      </p>
                    )}
                  </div>
                </div>

                {/* // <!-- checkout right --> */}
                <div className="w-full lg:w-[455px] lg:shrink-0">
                  <OrderList
                    items={cartItems}
                    subtotal={subtotal}
                    discount={coupon?.discountAmount ?? 0}
                  />

                  <Coupon
                    orderAmount={subtotal}
                    appliedCoupon={coupon}
                    onApply={setCoupon}
                    onRemove={() => setCoupon(null)}
                  />

                  {unavailableItems.length > 0 && (
                    <p className="mt-7.5 rounded-md bg-red-light-6 p-3 text-custom-sm text-red">
                      {unavailableItems.map((item) => item.title).join(", ")}{" "}
                      {unavailableItems.length === 1 ? "is" : "are"} no longer
                      available. Remove {unavailableItems.length === 1 ? "it" : "them"} from
                      your <Link href="/cart" className="underline">cart</Link> to continue.
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isPlacing || !selectedAddressId || !paymentMethod || cartItems.length === 0 || unavailableItems.length > 0}
                    className="w-full flex justify-center font-medium text-white bg-blue py-3 px-6 rounded-md ease-out duration-200 hover:bg-blue-dark mt-7.5 disabled:opacity-60"
                  >
                    {isPlacing
                      ? "Placing order…"
                      : paymentMethod === "STRIPE"
                        ? "Continue to payment"
                        : "Place order"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </section>
    </>
  );
};

export default Checkout;
