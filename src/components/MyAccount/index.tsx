"use client";

import { FormEvent, Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import Breadcrumb from "../Common/Breadcrumb";
import Orders from "../Orders";
import { ApiError } from "@/lib/api/client";
import { usersApi } from "@/lib/api/users.api";
import { clearAuthTokens } from "@/lib/auth-session";
import { endSession } from "@/lib/sign-out";
import {
  AUTHENTICATED_EVENT,
  hasAccessToken,
  requestAuthentication,
} from "@/lib/auth-prompt";
import { resetCart } from "@/redux/features/cart-slice";
import { AppDispatch } from "@/redux/store";
import { useDispatch } from "react-redux";
import ReviewManagement from "@/components/Reviews/ReviewManagement";
import AdminOrdersList from "@/components/Admin/Orders/AdminOrdersList";
import OrderStatsWidget from "@/components/Admin/Orders/OrderStatsWidget";
import MyReturnsList from "@/components/Returns/MyReturnsList";
import AddressBook from "./AddressBook";
import {
  UpdateProfileRequest,
  UserAddress,
  UserResponse,
} from "@/types/auth-api";
import { AddressResponse } from "@/types/order-api";

const ACCOUNT_TABS = [
  "overview",
  "orders",
  "returns",
  "addresses",
  "profile",
  "security",
  "reviews",
  "admin-orders",
] as const;

type AccountTab = (typeof ACCOUNT_TABS)[number];

const isAccountTab = (value: string | null): value is AccountTab =>
  (ACCOUNT_TABS as readonly string[]).includes(value ?? "");

const inputClass =
  "w-full rounded-lg border border-gray-3 bg-gray-1 px-4 py-3 text-dark outline-none transition focus:border-blue";

const getInitials = (user: UserResponse) =>
  `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() ||
  user.name?.[0]?.toUpperCase() ||
  "U";

const getErrorMessage = (error: unknown) => {
  if (error instanceof ApiError && error.status === 401) {
    clearAuthTokens();
    requestAuthentication();
    return "Your session has expired. Please sign in again.";
  }
  return error instanceof Error ? error.message : "Something went wrong.";
};

const MyAccountContent = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  // The tab lives in the URL (?tab=orders) so other pages can link straight to it.
  const tabParam = searchParams.get("tab");
  const activeTab: AccountTab = isAccountTab(tabParam) ? tabParam : "overview";
  const [profile, setProfile] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);

  const setActiveTab = (tab: AccountTab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "overview") params.delete("tab");
    else params.set("tab", tab);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const loadProfile = useCallback(async () => {
    if (!hasAccessToken()) {
      setProfile(null);
      setIsLoading(false);
      requestAuthentication();
      return;
    }
    setIsLoading(true);
    try {
      const user = await usersApi.getProfile();
      setProfile(user);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
    // Signing in from the prompt doesn't reload the page, so load the profile when it completes.
    const onAuthenticated = () => void loadProfile();
    window.addEventListener(AUTHENTICATED_EVENT, onAuthenticated);
    return () =>
      window.removeEventListener(AUTHENTICATED_EVENT, onAuthenticated);
  }, [loadProfile]);

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const request: UpdateProfileRequest = {
      firstName: String(formData.get("firstName") ?? "").trim(),
      lastName: String(formData.get("lastName") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      profileImage: String(formData.get("profileImage") ?? "").trim(),
    };

    setIsSavingProfile(true);
    try {
      setProfile(await usersApi.updateProfile(request));
      toast.success("Profile updated.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const oldPassword = String(formData.get("oldPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmNewPassword = String(
      formData.get("confirmNewPassword") ?? ""
    );

    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword === oldPassword) {
      toast.error("Your new password must be different from the current one.");
      return;
    }

    setIsSavingPassword(true);
    try {
      await usersApi.updatePassword({
        oldPassword,
        newPassword,
        confirmNewPassword,
      });
      form.reset();
      toast.success("Password updated.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await endSession();
    dispatch(resetCart());
    toast.success("You have been signed out.");
    router.replace("/");
  };

  const handleDeactivate = async () => {
    setIsDeactivating(true);
    try {
      // The server also revokes every session of the account, on all devices.
      await usersApi.deactivateAccount();
      await endSession();
      dispatch(resetCart());
      toast.success("Your account has been deactivated.");
      router.replace("/");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsDeactivating(false);
      setIsDeactivateOpen(false);
    }
  };

  // Keeps the overview's "Saved addresses" in step with changes made in the Addresses tab.
  const handleAddressesChange = useCallback((list: AddressResponse[]) => {
    const addresses: UserAddress[] = list.map((a) => ({
      id: a.id,
      street: a.street ?? "",
      city: a.city ?? "",
      state: a.state ?? "",
      zipCode: a.zipCode ?? "",
      country: a.country ?? "",
      isDefault: Boolean(a.isDefault),
    }));
    setProfile((current) => (current ? { ...current, addresses } : current));
  }, []);

  const isAdmin = Boolean(
    profile?.role?.some((r) => r.roleName.toUpperCase() === "ADMIN")
  );
  // ?tab=admin-orders typed by a non-admin falls back to the overview.
  const currentTab: AccountTab =
    activeTab === "admin-orders" && !isAdmin ? "overview" : activeTab;

  const tabs: { id: AccountTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "orders", label: "My orders" },
    { id: "returns", label: "My returns" },
    { id: "addresses", label: "Addresses" },
    ...(isAdmin
      ? [{ id: "admin-orders" as AccountTab, label: "Admin orders" }]
      : []),
    { id: "profile", label: "Profile details" },
    { id: "reviews", label: "Reviews" },
    { id: "security", label: "Security" },
  ];

  return (
    <>
      <Breadcrumb title="My Account" pages={["my account"]} />
      <section className="bg-gray-2 py-12 sm:py-16 lg:py-20">
        <div className="site-container">
          <div className="mb-8">
            <p className="text-sm font-medium uppercase tracking-wider text-blue">
              Account center
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-dark">
              My account
            </h1>
            <p className="mt-2 text-gray-600">
              Manage your personal information and account security.
            </p>
          </div>

          <div className="grid gap-7.5 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="h-fit rounded-xl bg-white p-5 shadow-1 sm:p-6">
              <div className="mb-5 flex items-center gap-3 border-b border-gray-3 pb-5">
                {profile?.profileImage ? (
                  // Any URL the customer entered, so next/image's allow-list doesn't apply.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.profileImage}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue/10 font-semibold text-blue">
                    {profile ? getInitials(profile) : "…"}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-medium text-dark">
                    {profile?.name ?? "Your account"}
                  </p>
                  <p className="truncate text-sm text-gray-500">
                    {profile?.email ?? ""}
                  </p>
                </div>
              </div>
              <nav aria-label="Account navigation" className="grid gap-1.5">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    aria-current={currentTab === tab.id ? "page" : undefined}
                    className={`rounded-lg px-4 py-3 text-left text-sm font-medium transition ${
                      currentTab === tab.id
                        ? "bg-blue text-white"
                        : "text-dark hover:bg-gray-1"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
              {profile && (
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  disabled={isSigningOut}
                  className="mt-5 w-full rounded-lg border border-gray-3 px-4 py-3 text-left text-sm font-medium text-dark transition hover:border-red hover:text-red disabled:opacity-60"
                >
                  {isSigningOut ? "Signing out…" : "Sign out"}
                </button>
              )}
            </aside>

            <div className="min-w-0">
              {isLoading ? (
                <div className="rounded-xl bg-white p-8 text-center text-gray-600 shadow-1">
                  Loading your profile…
                </div>
              ) : !profile ? (
                <div className="rounded-xl bg-white p-8 text-center shadow-1">
                  {hasAccessToken() ? (
                    <>
                      <h2 className="text-lg font-semibold text-dark">
                        We couldn&apos;t load your profile
                      </h2>
                      <p className="mt-2 text-sm text-gray-600">
                        Check your connection and try again.
                      </p>
                      <button
                        type="button"
                        onClick={() => void loadProfile()}
                        className="mt-5 rounded-lg bg-blue px-5 py-3 font-medium text-white hover:bg-blue-dark"
                      >
                        Try again
                      </button>
                    </>
                  ) : (
                    <>
                      <h2 className="text-lg font-semibold text-dark">
                        Sign in to view your account
                      </h2>
                      <p className="mt-2 text-sm text-gray-600">
                        Your orders, returns and profile are available once
                        you sign in.
                      </p>
                      <button
                        type="button"
                        onClick={requestAuthentication}
                        className="mt-5 rounded-lg bg-blue px-5 py-3 font-medium text-white hover:bg-blue-dark"
                      >
                        Sign in
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <>
                  {currentTab === "overview" && (
                    <div className="space-y-6">
                      <section className="rounded-xl bg-white p-6 shadow-1 sm:p-8">
                        <h2 className="text-xl font-semibold text-dark">
                          Welcome back, {profile.firstName || profile.name}
                        </h2>
                        <p className="mt-2 text-gray-600">
                          Your profile and account settings are all in one
                          place.
                        </p>
                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => setActiveTab("profile")}
                            className="rounded-lg border border-gray-3 p-5 text-left transition hover:border-blue"
                          >
                            <span className="font-medium text-dark">
                              Personal information
                            </span>
                            <span className="mt-1 block text-sm text-gray-500">
                              Update your name, phone, and profile image.
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab("security")}
                            className="rounded-lg border border-gray-3 p-5 text-left transition hover:border-blue"
                          >
                            <span className="font-medium text-dark">
                              Account security
                            </span>
                            <span className="mt-1 block text-sm text-gray-500">
                              Change your password and manage your account.
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab("returns")}
                            className="rounded-lg border border-gray-3 p-5 text-left transition hover:border-blue"
                          >
                            <span className="font-medium text-dark">
                              My returns
                            </span>
                            <span className="mt-1 block text-sm text-gray-500">
                              Track returned items, reviews, and refund progress.
                            </span>
                          </button>
                          {isAdmin && (
                            <Link
                              href="/admin/orders"
                              className="rounded-lg border border-blue/40 bg-blue-light-5/30 p-5 text-left transition hover:border-blue sm:col-span-2 block"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-semibold text-blue">
                                    Admin Orders Dashboard &rarr;
                                  </span>
                                  <span className="mt-1 block text-sm text-gray-600">
                                    Manage customer orders, update statuses, and view sales statistics.
                                  </span>
                                </div>
                                <span className="rounded bg-blue px-3 py-1 text-xs font-semibold text-white">
                                  Admin
                                </span>
                              </div>
                            </Link>
                          )}
                        </div>
                      </section>

                      <section className="rounded-xl bg-white p-6 shadow-1 sm:p-8">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h2 className="text-lg font-semibold text-dark">
                              Contact details
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                              Information associated with your account.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveTab("profile")}
                            className="text-sm font-medium text-blue hover:underline"
                          >
                            Edit profile
                          </button>
                        </div>
                        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                          <div>
                            <dt className="text-sm text-gray-500">Full name</dt>
                            <dd className="mt-1 font-medium text-dark">
                              {profile.name || "Not provided"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm text-gray-500">Email</dt>
                            <dd className="mt-1 font-medium text-dark">
                              {profile.email}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm text-gray-500">Phone</dt>
                            <dd className="mt-1 font-medium text-dark">
                              {profile.phone || "Not provided"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm text-gray-500">Member since</dt>
                            <dd className="mt-1 font-medium text-dark">
                              {profile.createdAt
                                ? new Date(profile.createdAt).toLocaleDateString()
                                : "—"}
                            </dd>
                          </div>
                        </dl>
                      </section>

                      <section className="rounded-xl bg-white p-6 shadow-1 sm:p-8">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h2 className="text-lg font-semibold text-dark">
                            Saved addresses
                          </h2>
                          <button
                            type="button"
                            onClick={() => setActiveTab("addresses")}
                            className="text-sm font-medium text-blue hover:underline"
                          >
                            {profile.addresses?.length
                              ? "Manage addresses"
                              : "Add address"}
                          </button>
                        </div>
                        {profile.addresses?.length ? (
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {profile.addresses.map((address) => (
                              <article
                                key={address.id}
                                className="rounded-lg border border-gray-3 p-4"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-medium text-dark">
                                    {address.isDefault
                                      ? "Default address"
                                      : "Address"}
                                  </p>
                                  {address.isDefault && (
                                    <span className="rounded-full bg-blue/10 px-2.5 py-1 text-xs font-medium text-blue">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <p className="mt-2 text-sm leading-6 text-gray-600">
                                  {address.street}
                                  <br />
                                  {[address.city, address.state, address.zipCode]
                                    .filter(Boolean)
                                    .join(", ")}
                                  <br />
                                  {address.country}
                                </p>
                              </article>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-3 text-sm text-gray-600">
                            No saved addresses yet.
                          </p>
                        )}
                      </section>
                    </div>
                  )}

                  {currentTab === "orders" && (
                    <section className="rounded-xl bg-white p-4 shadow-1 sm:p-7">
                      <h2 className="mb-5 text-xl font-semibold text-dark">
                        My orders
                      </h2>
                      <Orders />
                    </section>
                  )}

                  {currentTab === "returns" && (
                    <section className="rounded-xl bg-white p-4 shadow-1 sm:p-7">
                      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h2 className="text-xl font-semibold text-dark">
                            My returns
                          </h2>
                          <p className="mt-1 text-sm text-gray-500">
                            Track returned items, reviews, and refund progress.
                          </p>
                        </div>
                        <Link
                          href="/account/returns"
                          className="text-xs font-semibold text-blue hover:underline"
                        >
                          Dedicated Page &rarr;
                        </Link>
                      </div>
                      <MyReturnsList />
                    </section>
                  )}

                  {currentTab === "addresses" && (
                    <AddressBook onChange={handleAddressesChange} />
                  )}

                  {currentTab === "admin-orders" && (
                    <div className="space-y-6">
                      <OrderStatsWidget />
                      <AdminOrdersList />
                    </div>
                  )}

                  {currentTab === "profile" && (
                    <section className="rounded-xl bg-white p-6 shadow-1 sm:p-8">
                      <div className="mb-6">
                        <h2 className="text-xl font-semibold text-dark">
                          Personal information
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                          Keep your account details up to date.
                        </p>
                      </div>
                      <form
                        key={`${profile.firstName}-${profile.lastName}-${profile.phone}-${profile.profileImage}`}
                        onSubmit={handleProfileSubmit}
                        className="space-y-5"
                      >
                        <div className="grid gap-5 sm:grid-cols-2">
                          <label className="block text-sm font-medium text-dark">
                            First name
                            <input
                              className={`${inputClass} mt-2`}
                              type="text"
                              name="firstName"
                              defaultValue={profile.firstName}
                              minLength={3}
                              maxLength={50}
                              required
                            />
                          </label>
                          <label className="block text-sm font-medium text-dark">
                            Last name
                            <input
                              className={`${inputClass} mt-2`}
                              type="text"
                              name="lastName"
                              defaultValue={profile.lastName}
                              minLength={3}
                              maxLength={50}
                              required
                            />
                          </label>
                        </div>
                        <label className="block text-sm font-medium text-dark">
                          Email address
                          <input
                            className={`${inputClass} mt-2 bg-gray-2 text-gray-500`}
                            type="email"
                            value={profile.email}
                            readOnly
                          />
                        </label>
                        <label className="block text-sm font-medium text-dark">
                          Phone number
                          <input
                            className={`${inputClass} mt-2`}
                            type="tel"
                            name="phone"
                            defaultValue={profile.phone ?? ""}
                            maxLength={30}
                          />
                        </label>
                        <label className="block text-sm font-medium text-dark">
                          Profile image URL
                          <input
                            className={`${inputClass} mt-2`}
                            type="url"
                            name="profileImage"
                            defaultValue={profile.profileImage ?? ""}
                            placeholder="https://example.com/profile.jpg"
                          />
                        </label>
                        <button
                          type="submit"
                          disabled={isSavingProfile}
                          className="rounded-lg bg-blue px-6 py-3 font-medium text-white transition hover:bg-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isSavingProfile ? "Saving…" : "Save changes"}
                        </button>
                      </form>
                    </section>
                  )}

                  {currentTab === "reviews" && <ReviewManagement />}

                  {currentTab === "security" && (
                    <div className="space-y-6">
                      <section className="rounded-xl bg-white p-6 shadow-1 sm:p-8">
                        <div className="mb-6">
                          <h2 className="text-xl font-semibold text-dark">
                            Change password
                          </h2>
                          <p className="mt-1 text-sm text-gray-500">
                            Choose a strong password you don&apos;t use
                            elsewhere.
                          </p>
                        </div>
                        <form
                          onSubmit={handlePasswordSubmit}
                          className="space-y-5"
                        >
                          <label className="block text-sm font-medium text-dark">
                            Current password
                            <input
                              className={`${inputClass} mt-2`}
                              type="password"
                              name="oldPassword"
                              autoComplete="current-password"
                              required
                            />
                          </label>
                          <div className="grid gap-5 sm:grid-cols-2">
                            <label className="block text-sm font-medium text-dark">
                              New password
                              <input
                                className={`${inputClass} mt-2`}
                                type="password"
                                name="newPassword"
                                autoComplete="new-password"
                                minLength={8}
                                required
                              />
                            </label>
                            <label className="block text-sm font-medium text-dark">
                              Confirm new password
                              <input
                                className={`${inputClass} mt-2`}
                                type="password"
                                name="confirmNewPassword"
                                autoComplete="new-password"
                                minLength={8}
                                required
                              />
                            </label>
                          </div>
                          <button
                            type="submit"
                            disabled={isSavingPassword}
                            className="rounded-lg bg-blue px-6 py-3 font-medium text-white transition hover:bg-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isSavingPassword ? "Updating…" : "Update password"}
                          </button>
                        </form>
                      </section>

                      <section className="rounded-xl border border-red/20 bg-white p-6 shadow-1 sm:p-8">
                        <h2 className="text-lg font-semibold text-dark">
                          Deactivate account
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-gray-600">
                          Deactivating your account may restrict access to your
                          profile and services. This action should only be used
                          if you no longer want to use this account.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsDeactivateOpen(true)}
                          className="mt-5 rounded-lg border border-red px-5 py-3 font-medium text-red transition hover:bg-red hover:text-white"
                        >
                          Deactivate account
                        </button>
                      </section>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {isDeactivateOpen && (
        <div
          className="fixed inset-0 z-[100000] flex items-center justify-center bg-dark/70 px-4"
          role="presentation"
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="deactivate-account-title"
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-3 sm:p-8"
          >
            <h2
              id="deactivate-account-title"
              className="text-xl font-semibold text-dark"
            >
              Deactivate your account?
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              You will be signed out and will no longer be able to use this
              account. Continue?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeactivateOpen(false)}
                disabled={isDeactivating}
                className="rounded-lg border border-gray-3 px-4 py-2.5 font-medium text-dark hover:bg-gray-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDeactivate()}
                disabled={isDeactivating}
                className="rounded-lg bg-red px-4 py-2.5 font-medium text-white hover:bg-red/90 disabled:opacity-60"
              >
                {isDeactivating ? "Deactivating…" : "Yes, deactivate"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
};

// useSearchParams needs a Suspense boundary so Next.js can still prerender the page shell.
const MyAccount = () => (
  <Suspense
    fallback={
      <div className="py-20 text-center text-gray-600">Loading your account…</div>
    }
  >
    <MyAccountContent />
  </Suspense>
);

export default MyAccount;
