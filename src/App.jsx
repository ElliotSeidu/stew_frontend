import { Component, Suspense, lazy, useEffect } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import Landing from "./pages/marketing/Landing";
import Legal from "./pages/legal/Legal";
import { Button, Logo, ThemeToggle } from "./components/ui";
import {
    ForgotPassword,
    Login,
    ResetPassword,
    Signup,
    Verify,
} from "./pages/auth/Auth";
import AuthLayout from "./layouts/AuthLayout";
import CustomerLayout from "./layouts/CustomerLayout";
import DashLayout from "./layouts/DashLayout";
import { Protected } from "./components/guards";
import { useAuth } from "./context/Providers";
import Home from "./pages/customer/Home";
import Discover from "./pages/customer/Discover";
import VendorPage from "./pages/customer/VendorPage";
import { Cart, Checkout } from "./pages/customer/Cart";
import { Favorites, Account } from "./pages/customer/Account";
import { Support, NewCase } from "./pages/customer/Support";
import NotFound from "./pages/NotFound";
import { track } from "./lib/analytics";

const lazyPayloads = [];

function lazyRoute(loader, exportName) {
    const ctor = () => loader().then((m) => ({ default: m[exportName] }));
    const Comp = lazy(ctor);
    lazyPayloads.push([Comp, ctor]);
    return Comp;
}

function resetFailedChunks() {
    for (const [Comp, ctor] of lazyPayloads) {
        if (Comp?._payload && Comp._payload._status === 2) {
            Comp._payload._status = -1;
            Comp._payload._result = ctor;
        }
    }
}

const loadOrders = () => import("./pages/customer/Orders");
const Orders = lazyRoute(loadOrders, "Orders");
const OrderDetail = lazyRoute(loadOrders, "OrderDetail");
const PayOrder = lazyRoute(loadOrders, "PayOrder");
const Review = lazyRoute(loadOrders, "Review");

const loadVendor = () => import("./pages/vendor/Vendor");
const Apply = lazyRoute(loadVendor, "Apply");
const VDashboard = lazyRoute(loadVendor, "VDashboard");
const VKitchen = lazyRoute(loadVendor, "VKitchen");
const VMenu = lazyRoute(loadVendor, "VMenu");
const VEarnings = lazyRoute(loadVendor, "VEarnings");
const VSettings = lazyRoute(loadVendor, "VSettings");

const loadAdmin = () => import("./pages/admin/Admin");
const AOverview = lazyRoute(loadAdmin, "AOverview");
const AVendors = lazyRoute(loadAdmin, "AVendors");
const AOrders = lazyRoute(loadAdmin, "AOrders");
const ADisputes = lazyRoute(loadAdmin, "ADisputes");
const AModeration = lazyRoute(loadAdmin, "AModeration");
const ACompliance = lazyRoute(loadAdmin, "ACompliance");
const APayouts = lazyRoute(loadAdmin, "APayouts");
const AAudit = lazyRoute(loadAdmin, "AAudit");
const AConversations = lazyRoute(loadAdmin, "AConversations");
const AUsers = lazyRoute(loadAdmin, "AUsers");

function RouteFallback() {
    return (
        <div
            role="status"
            aria-live="polite"
            className="flex min-h-[40vh] items-center justify-center px-4 py-12 text-sm font-semibold text-ink-3"
        >
            Loading page…
        </div>
    );
}

class ChunkErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
        this.handleRetry = this.handleRetry.bind(this);
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentWillUnmount() {
        if (this.state.hasError) {
            resetFailedChunks();
        }
    }

    handleRetry() {
        resetFailedChunks();
        this.setState({ hasError: false });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div
                    role="alert"
                    className="mx-auto my-12 max-w-md rounded-2xl border border-line bg-surface p-6 text-center shadow-sm"
                >
                    <h2 className="text-base font-extrabold text-ink">
                        Could not load this page
                    </h2>
                    <p className="mt-1 text-sm text-ink-2">
                        Check your campus connection and try again.
                    </p>
                    <Button
                        variant="outline"
                        className="mt-4"
                        onClick={this.handleRetry}
                    >
                        Retry
                    </Button>
                </div>
            );
        }
        return this.props.children;
    }
}

function Root() {
    const { user } = useAuth();
    const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true;

    if (standalone) {
        if (!user) return <Navigate to="/app/login" replace />;
        if (user.isAdmin === true)
            return <Navigate to="/app/admin" replace />;
        if (
            user.accountType === "vendor" ||
            user.isVendor ||
            user.role === "vendor"
        ) {
            return <Navigate to="/app/vendor" replace />;
        }
        return <Navigate to="/app" replace />;
    }
    return <Landing />;
}

function VendorApplyLayout() {
    return (
        <div className="min-h-dvh bg-canvas">
            <header className="sticky top-0 z-30 border-b border-line bg-canvas">
                <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
                    <div className="flex items-center gap-2.5">
                        <Logo />
                        <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand-strong">
                            Kitchen Onboarding
                        </span>
                    </div>
                    <ThemeToggle />
                </div>
            </header>
            <main className="mx-auto max-w-4xl px-4 py-8">
                <Outlet />
            </main>
        </div>
    );
}

function RouteTracker() {
    const { pathname } = useLocation();
    useEffect(() => {
        track("page_view");
    }, [pathname]);
    return null;
}

export default function App() {
    const { pathname } = useLocation();
    return (
        <>
            <RouteTracker />
            <ChunkErrorBoundary key={pathname}>
                <Suspense fallback={<RouteFallback />}>
                    <Routes>
                <Route path="/" element={<Root />} />
                <Route path="/landing" element={<Landing />} />
                <Route path="/legal/:slug?" element={<Legal />} />

                <Route path="/app">
                    <Route path="legal/:slug?" element={<Legal />} />
                    <Route element={<AuthLayout />}>
                        <Route path="login" element={<Login />} />
                        <Route path="signup" element={<Signup />} />
                        <Route path="verify" element={<Verify />} />
                        <Route path="forgot" element={<ForgotPassword />} />
                        <Route path="reset" element={<ResetPassword />} />
                    </Route>

                    <Route
                        element={
                            <Protected roles={["customer"]}>
                                <CustomerLayout />
                            </Protected>
                        }
                    >
                        <Route index element={<Home />} />
                        <Route path="discover" element={<Discover />} />
                        <Route path="vendors/:id" element={<VendorPage />} />
                        <Route path="cart" element={<Cart />} />
                        <Route path="checkout" element={<Checkout />} />
                        <Route path="orders" element={<Orders />} />
                        <Route path="orders/:id" element={<OrderDetail />} />
                        <Route path="orders/:id/pay" element={<PayOrder />} />
                        <Route path="orders/:id/review" element={<Review />} />
                        <Route path="favorites" element={<Favorites />} />
                        <Route path="account" element={<Account />} />
                        <Route path="support" element={<Support />} />
                        <Route path="support/new" element={<NewCase />} />
                    </Route>

                    <Route
                        path="vendor/apply"
                        element={
                            <Protected>
                                <VendorApplyLayout />
                            </Protected>
                        }
                    >
                        <Route index element={<Apply />} />
                    </Route>

                    <Route
                        path="vendor"
                        element={
                            <Protected roles={["vendor"]}>
                                <DashLayout kind="vendor" />
                            </Protected>
                        }
                    >
                        <Route index element={<VDashboard />} />
                        <Route path="menu" element={<VMenu />} />
                        <Route path="kitchen" element={<VKitchen />} />
                        <Route path="earnings" element={<VEarnings />} />
                        <Route path="settings" element={<VSettings />} />
                    </Route>

                    <Route
                        path="admin"
                        element={
                            <Protected roles={["admin"]}>
                                <DashLayout kind="admin" />
                            </Protected>
                        }
                    >
                        <Route index element={<AOverview />} />
                        <Route path="vendors" element={<AVendors />} />
                        <Route path="orders" element={<AOrders />} />
                        <Route path="disputes" element={<ADisputes />} />
                        <Route path="moderation" element={<AModeration />} />
                        <Route path="compliance" element={<ACompliance />} />
                        <Route path="payouts" element={<APayouts />} />
                        <Route path="audit" element={<AAudit />} />
                        <Route path="conversations" element={<AConversations />} />
                        <Route path="users" element={<AUsers />} />
                    </Route>
                </Route>

                <Route path="*" element={<NotFound />} />
                    </Routes>
                </Suspense>
            </ChunkErrorBoundary>
        </>
    );
}
