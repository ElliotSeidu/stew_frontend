import { useState, useMemo, useRef } from "react";
import {
    Badge,
    Button,
    Card,
    EmptyState,
    Field,
    Input,
    Modal,
    Select,
    Switch,
    ErrorState,
    Stars,
    TruncationNotice,
} from "../../components/ui";
import { useToast } from "../../context/Providers";
import { api } from "../../lib/api";
import { useAsync, usePagedList } from "../../lib/hooks";
import { PREP_STAGES, stageIndex } from "../../lib/mockData";
import { money, timeAgo } from "../../lib/utils";
import { niceDay } from "../../config";
import { MessageSquare, ReceiptText, ThumbsUp, Wallet } from "lucide-react";

export function AOverview() {
    const ledger = useAsync(() => api.payouts(), []);
    const orders = useAsync(() => api.orders(), []);
    const vendors = useAsync(() => api.adminVendors(), []);
    const cases = useAsync(() => api.cases(), []);

    const held = ledger.data?.held ?? 0;
    const [todayStart] = useState(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d.getTime();
    });
    const ordersToday = useMemo(
        () =>
            ledger.data?.ordersToday ??
            (orders.data || []).filter((o) => (o.createdAt || 0) >= todayStart).length,
        [ledger.data?.ordersToday, orders.data, todayStart]
    );
    const activeVendorsCount = useMemo(
        () =>
            ledger.data?.activeVendorsCount ??
            (vendors.data || []).filter((v) => v.active !== false).length,
        [ledger.data?.activeVendorsCount, vendors.data]
    );
    const pendingVendorsCount = useMemo(
        () =>
            ledger.data?.pendingVendorsCount ??
            (vendors.data || []).filter((v) => v.active === false).length,
        [ledger.data?.pendingVendorsCount, vendors.data]
    );
    const openDisputes = cases.data || [];
    const openDisputesCount = ledger.data?.openDisputesCount ?? openDisputes.length;
    const highPriorityCount =
        ledger.data?.highPriorityDisputesCount ??
        openDisputes.filter((d) => d.priority === "high").length;
    const anyTruncated = Boolean(
        orders.data?._pagination?.truncated ||
        vendors.data?._pagination?.truncated ||
        cases.data?._pagination?.truncated
    );

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-extrabold">Overview</h1>
            <p className="text-xs text-ink-3">
                Live control plane. Privileged operations are recorded in the
                audit log.
            </p>
            {anyTruncated && (
                <div className="rounded-2xl border border-brand/30 bg-brand-soft px-4 py-2.5 text-xs text-brand-strong">
                    KPI totals reflect full database counts; open individual tabs to page beyond the first 200 items.
                </div>
            )}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                    ["Orders today", ordersToday],
                    ["Active vendors", activeVendorsCount],
                    ["Open disputes", openDisputesCount],
                    ["Suspended / pending kitchens", pendingVendorsCount],
                ].map(([l, v]) => (
                    <Card key={l}>
                        <p className="text-xs text-ink-3">{l}</p>
                        <p className="num mt-1 text-2xl font-extrabold">{v}</p>
                    </Card>
                ))}
            </div>

            {ledger.loading && !ledger.data ? (
                <Card className="border-brand/40 bg-brand-soft space-y-2">
                    <div className="h-4 w-28 animate-pulse rounded bg-brand/20" />
                    <div className="h-8 w-36 animate-pulse rounded bg-brand/20" />
                    <div className="h-3 w-3/4 animate-pulse rounded bg-brand/20" />
                </Card>
            ) : (
                <Card className="border-brand/40 bg-brand-soft">
                    <p className="text-xs font-semibold text-brand-strong">
                        Held in escrow
                    </p>
                    <p className="num mt-1 text-2xl font-extrabold">
                        {money(held)}
                    </p>
                    <p className="mt-1 text-xs text-ink-2">
                        Paid by students and not yet released to a chef, across{" "}
                        {ledger.data?.heldCount ?? 0} order
                        {(ledger.data?.heldCount ?? 0) === 1 ? "" : "s"}. This money
                        belongs to students/chefs until the student confirms
                        collection. Do not treat it as STEW revenue.
                    </p>
                </Card>
            )}

            {highPriorityCount > 0 && (
                <Card className="border-bad/40 bg-bad-soft">
                    <p className="font-bold text-bad">
                        Priority: {highPriorityCount} food safety case
                        {highPriorityCount === 1 ? "" : "s"} need review
                    </p>
                </Card>
            )}
        </div>
    );
}

export function AVendors() {
    const toast = useToast();
    const [tab, setTab] = useState("active");
    const [approveTarget, setApproveTarget] = useState(null);
    const [verificationMethod, setVerificationMethod] = useState("in_person");
    const [verificationNote, setVerificationNote] = useState("");
    const [approving, setApproving] = useState(false);
    const vendors = usePagedList((p) => api.adminVendors(p), (v) => v.id);

    const allVendors = vendors.data || [];
    const pending = allVendors.filter((v) => v.active === false);
    const activeList = allVendors.filter((v) => v.active !== false);

    const toggleVendor = async (vendor, active) => {
        if (active) {
            setVerificationMethod("in_person");
            setVerificationNote("");
            setApproveTarget(vendor);
            return;
        }
        try {
            await api.updateAdminVendor(vendor.id, { active: false });
            toast("Vendor suspended", "bad");
            vendors.retry();
        } catch (err) {
            toast(err.message, "bad");
        }
    };

    const confirmApprove = async (e) => {
        e.preventDefault();
        if (!approveTarget) return;
        setApproving(true);
        try {
            await api.updateAdminVendor(approveTarget.id, {
                active: true,
                verificationMethod,
                ...(verificationNote.trim()
                    ? { verificationNote: verificationNote.trim() }
                    : {}),
            });
            toast("Vendor activated", "ok");
            setApproveTarget(null);
            vendors.retry();
        } catch (err) {
            toast(err.message, "bad");
        } finally {
            setApproving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-extrabold">Vendors</h1>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant={tab === "active" ? "primary" : "outline"}
                        onClick={() => setTab("active")}
                    >
                        Active Vendors ({activeList.length})
                    </Button>
                    <Button
                        size="sm"
                        variant={tab === "pending" ? "primary" : "outline"}
                        onClick={() => setTab("pending")}
                    >
                        Suspended / Pending ({pending.length})
                    </Button>
                </div>
            </div>

            {vendors.error ? (
                <ErrorState onRetry={vendors.retry} />
            ) : tab === "pending" ? (
                pending.length ? (
                    <ul className="space-y-3">
                        {pending.map((v) => (
                            <li
                                key={v.id}
                                className="rounded-2xl border border-line bg-surface p-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-bold">{v.name}</p>
                                        <p className="text-sm text-ink-2">
                                            {v.hall} · {v.bio || "Kitchen"}
                                        </p>
                                    </div>
                                    <Badge tone="warn">Inactive</Badge>
                                </div>
                                <div className="mt-3 flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => toggleVendor(v, true)}
                                    >
                                        Activate kitchen
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <EmptyState
                        title="No suspended or pending kitchens"
                        text="All registered kitchens are currently active."
                    />
                )
            ) : activeList.length ? (
                <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-line text-xs text-ink-3">
                            <tr>
                                <th className="p-3">Vendor</th>
                                <th className="p-3">Operating hall</th>
                                <th className="p-3">Rating</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Suspension / Active</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeList.map((v) => (
                                <tr
                                    key={v.id}
                                    className="border-b border-line last:border-0"
                                >
                                    <td className="p-3 font-semibold">
                                        {v.name}
                                    </td>
                                    <td className="p-3 text-ink-2">{v.hall}</td>
                                    <td className="p-3">
                                        {Number(v.reviews) > 0 && Number(v.rating) > 0 ? (
                                            <span className="inline-flex items-center gap-1 font-semibold text-xs text-ink">
                                                <ThumbsUp className="h-3 w-3 text-brand-strong" /> {v.rating}{" "}
                                                <span className="font-normal text-ink-3">
                                                    ({v.reviews})
                                                </span>
                                            </span>
                                        ) : (
                                            <span className="text-xs text-ink-3">No ratings yet</span>
                                        )}
                                    </td>
                                    <td className="p-3">
                                        <Badge tone={v.active ? "ok" : "bad"}>
                                            {v.active ? "Active" : "Suspended"}
                                        </Badge>
                                    </td>
                                    <td className="p-3">
                                        <Switch
                                            checked={v.active !== false}
                                            label={`Toggle ${v.name}`}
                                            onChange={(checked) =>
                                                toggleVendor(v, checked)
                                            }
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <EmptyState
                    title="No active vendors yet"
                    text="Kitchens will appear here once student chefs set up their kitchens."
                />
            )}
            <TruncationNotice
                pagination={vendors.pagination}
                shown={(vendors.data || []).length}
                onLoadMore={vendors.loadMore}
                loadingMore={vendors.loadingMore}
                label="vendors"
            />
            <Modal
                open={!!approveTarget}
                onClose={() => setApproveTarget(null)}
                title={
                    approveTarget
                        ? `Approve ${approveTarget.name}`
                        : "Approve kitchen"
                }
            >
                <form onSubmit={confirmApprove} className="space-y-4">
                    <p className="text-sm text-ink-2">
                        Record how you verified this student chef before
                        activating their kitchen. STEW never collects ID photos.
                    </p>
                    <Field label="Verification method">
                        <Select
                            value={verificationMethod}
                            onChange={(e) =>
                                setVerificationMethod(e.target.value)
                            }
                            required
                        >
                            <option value="in_person">In-person check</option>
                            <option value="video_call">Video call</option>
                            <option value="vouched">
                                Vouched by campus admin
                            </option>
                        </Select>
                    </Field>
                    <Field label="Verification note (optional)">
                        <Input
                            value={verificationNote}
                            onChange={(e) =>
                                setVerificationNote(e.target.value)
                            }
                            placeholder="e.g. Met at Legon Hall kitchen"
                            maxLength={500}
                        />
                    </Field>
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setApproveTarget(null)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={approving}>
                            {approving ? "Activating…" : "Activate kitchen"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

export function AOrders() {
    const toast = useToast();
    const orders = usePagedList((p) => api.orders(p), (o) => o.id);
    const [filter, setFilter] = useState("all");

    const list = useMemo(() => {
        const raw = orders.data || [];
        if (filter === "active")
            return raw.filter(
                (o) => o.status !== "delivered" && o.status !== "cancelled"
            );
        if (filter === "delivered")
            return raw.filter((o) => o.status === "delivered");
        if (filter === "cancelled")
            return raw.filter((o) => o.status === "cancelled");
        return raw;
    }, [orders.data, filter]);

    const refund = async (orderId) => {
        if (
            !window.confirm(
                `Initiate cancellation and refund for order ${orderId}?`
            )
        )
            return;
        try {
            await api.cancelOrder(orderId);
            toast(`Order ${orderId} cancelled & refund initiated`);
            orders.retry();
        } catch (e) {
            toast(e.message, "bad");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-extrabold">
                        Order inspection
                    </h1>
                    <p className="mt-1 text-xs text-ink-3">
                        Inspect order states, verify pickup codes, and trigger
                        refunds.
                    </p>
                </div>
                <div className="flex gap-2">
                    {[
                        ["all", "All"],
                        ["active", "In progress"],
                        ["delivered", "Delivered"],
                        ["cancelled", "Cancelled"],
                    ].map(([id, label]) => (
                        <Button
                            key={id}
                            size="sm"
                            variant={filter === id ? "primary" : "outline"}
                            onClick={() => setFilter(id)}
                        >
                            {label}
                        </Button>
                    ))}
                </div>
            </div>

            {orders.error ? (
                <ErrorState onRetry={orders.retry} />
            ) : orders.loading && !orders.data ? (
                <ul className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <li key={i} className="rounded-2xl border border-line bg-surface p-4 space-y-3">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1.5">
                                    <div className="h-5 w-40 animate-pulse rounded bg-sunken" />
                                    <div className="h-3 w-56 animate-pulse rounded bg-sunken" />
                                </div>
                                <div className="flex gap-2">
                                    <div className="h-6 w-16 animate-pulse rounded-full bg-sunken" />
                                    <div className="h-6 w-20 animate-pulse rounded-full bg-sunken" />
                                </div>
                            </div>
                            <div className="h-10 animate-pulse rounded-xl bg-sunken" />
                            <div className="flex justify-between">
                                <div className="h-3 w-36 animate-pulse rounded bg-sunken" />
                                <div className="h-7 w-24 animate-pulse rounded-lg bg-sunken" />
                            </div>
                        </li>
                    ))}
                </ul>
            ) : list.length ? (
                <ul className="space-y-3">
                    {list.map((o) => {
                        const stage = o.prepStage || "accepted";
                        const stageMeta = PREP_STAGES[stageIndex(stage)];
                        const ps = o.payment?.status || "pending";
                        return (
                            <li
                                key={o.id}
                                className="rounded-2xl border border-line bg-surface p-4 space-y-3"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                        <span className="num text-base font-extrabold">
                                            {o.id}
                                        </span>
                                        <span className="ml-2 text-sm font-semibold text-ink-2">
                                            from {o.vendorName}
                                        </span>
                                        <p className="text-xs text-ink-3">
                                            Customer: {o.customer || o.email} ·{" "}
                                            {o.phone || "—"} · {o.area}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <Badge
                                            tone={
                                                ps === "paid"
                                                    ? "brand"
                                                    : ps === "released"
                                                      ? "ok"
                                                      : "warn"
                                            }
                                        >
                                            {ps}
                                        </Badge>
                                        <Badge tone={stageMeta.tone}>
                                            {stageMeta.label}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-sunken p-3 text-xs">
                                    <div>
                                        <span className="font-semibold">
                                            Items:{" "}
                                        </span>
                                        <span className="text-ink-2">
                                            {(o.lines || [])
                                                .map(
                                                    (l) => `${l.qty}× ${l.name}`
                                                )
                                                .join(", ")}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span>
                                            Pickup:{" "}
                                            <strong className="text-ink">
                                                {niceDay(o.pickupDay)}
                                            </strong>
                                        </span>
                                        <span>
                                            Total:{" "}
                                            <strong className="num text-ink">
                                                {money(o.total)}
                                            </strong>
                                        </span>
                                        {o.handoffCode && (
                                            <span className="rounded bg-brand-soft px-2 py-0.5 font-mono font-bold text-brand-strong">
                                                Code: {o.handoffCode}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-xs text-ink-3">
                                    <span>
                                        Created {timeAgo(o.createdAt)}{" "}
                                        {o.payment?.reference &&
                                            `· Ref: ${o.payment.reference}`}
                                    </span>
                                    {o.status !== "cancelled" &&
                                        o.status !== "delivered" && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-bad hover:bg-bad-soft"
                                                onClick={() => refund(o.id)}
                                            >
                                                Cancel & Refund
                                            </Button>
                                        )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <EmptyState
                    icon={ReceiptText}
                    title="No orders found"
                    text="Orders will appear here as students transact."
                />
            )}
            <TruncationNotice
                pagination={orders.pagination}
                shown={(orders.data || []).length}
                onLoadMore={orders.loadMore}
                loadingMore={orders.loadingMore}
                label="orders"
            />
        </div>
    );
}

export function ADisputes() {
    const toast = useToast();
    const cases = useAsync(() => api.cases(), []);
    const [resolvingCode, setResolvingCode] = useState(null);
    const resolvingRef = useRef(new Set());

    const list = useMemo(() => {
        const raw = cases.data || [];
        return [...raw].sort(
            (a, b) =>
                (a.priority === "high" ? -1 : 1) -
                (b.priority === "high" ? -1 : 1)
        );
    }, [cases.data]);

    const close = async (code, action, msg) => {
        if (resolvingRef.current.has(code)) return;
        resolvingRef.current.add(code);
        setResolvingCode(code);
        try {
            await api.resolveCase(code, action);
            toast(msg);
            cases.retry();
        } catch (err) {
            toast(err.message, "bad");
        } finally {
            resolvingRef.current.delete(code);
            setResolvingCode((prev) => (prev === code ? null : prev));
        }
    };

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-extrabold">Disputes</h1>
            {cases.error ? (
                <ErrorState onRetry={cases.retry} />
            ) : list.length ? (
                <ul className="space-y-3">
                    {list.map((d) => (
                        <li
                            key={d.code || d.id}
                            className={`rounded-2xl border p-4 ${d.priority === "high" ? "border-bad bg-bad-soft" : "border-line bg-surface"}`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="num font-bold">{d.code}</span>
                                <Badge
                                    tone={
                                        d.priority === "high" ? "bad" : "mute"
                                    }
                                >
                                    {d.priority === "high"
                                        ? "Priority"
                                        : "Normal"}
                                </Badge>
                            </div>
                            <p className="mt-1 font-semibold">{d.type}</p>
                            <p className="text-sm text-ink-2">
                                {d.order ? `Order ${d.order}` : "General support"}{" "}
                                {d.vendor ? `· ${d.vendor}` : ""}
                            </p>
                            {d.note && (
                                <p className="mt-1 text-xs text-ink-2">{d.note}</p>
                            )}
                            <div className="mt-3 flex gap-2">
                                <Button
                                    size="sm"
                                    disabled={resolvingCode === d.code}
                                    loading={resolvingCode === d.code}
                                    onClick={() => close(d.code, "refund", "Refund issued")}
                                >
                                    Refund
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={resolvingCode === d.code}
                                    loading={resolvingCode === d.code}
                                    onClick={() =>
                                        close(d.code, "dismiss", "Case dismissed")
                                    }
                                >
                                    Dismiss
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <EmptyState title="No open disputes" />
            )}
        </div>
    );
}

export function AModeration() {
    const toast = useToast();
    const queue = useAsync(() => api.moderationQueue(), []);

    const act = async (orderId, decision, reason) => {
        try {
            await api.moderateReview(orderId, decision, reason);
            toast(
                decision === "visible"
                    ? "Review approved for public display"
                    : "Review hidden from marketplace"
            );
            queue.retry();
        } catch (e) {
            toast(e.message, "bad");
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-extrabold">Review moderation</h1>
                <p className="mt-1 text-xs text-ink-3">
                    ADM-005: Verified customer reviews require moderation before
                    appearing publicly.
                </p>
            </div>

            {queue.error ? (
                <ErrorState onRetry={queue.retry} />
            ) : queue.loading && !queue.data ? (
                <ul className="space-y-3">
                    {[1, 2].map((i) => (
                        <li key={i} className="rounded-2xl border border-line bg-surface p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="h-4 w-44 animate-pulse rounded bg-sunken" />
                                <div className="h-4 w-24 animate-pulse rounded bg-sunken" />
                            </div>
                            <div className="flex gap-1.5">
                                {[1, 2, 3].map((t) => (
                                    <div key={t} className="h-5 w-16 animate-pulse rounded-full bg-sunken" />
                                ))}
                            </div>
                            <div className="h-12 w-full animate-pulse rounded-xl bg-sunken" />
                            <div className="flex gap-2">
                                <div className="h-8 w-28 animate-pulse rounded-lg bg-sunken" />
                                <div className="h-8 w-24 animate-pulse rounded-lg bg-sunken" />
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (queue.data || []).length ? (
                <ul className="space-y-3">
                    {queue.data.map((r) => (
                        <li
                            key={r.orderId}
                            className="rounded-2xl border border-line bg-surface p-4 space-y-3"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-sm">
                                    Order {r.orderId} ·{" "}
                                    {r.vendorName || r.vendorId}
                                </span>
                                <div className="flex items-center gap-1">
                                    <Stars
                                        value={r.rating}
                                        size="h-4 w-4"
                                    />
                                    <span className="text-xs font-bold">
                                        {r.rating}.0
                                    </span>
                                </div>
                            </div>
                            {r.tags?.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {r.tags.map((t) => (
                                        <span
                                            key={t}
                                            className="rounded-full bg-sunken px-2.5 py-0.5 text-[11px] font-semibold text-ink-2"
                                        >
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            )}
                            {r.text && (
                                <p className="rounded-xl bg-sunken p-3 text-sm text-ink-2">
                                    {r.text}
                                </p>
                            )}
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    onClick={() =>
                                        act(
                                            r.orderId,
                                            "visible",
                                            "Approved by admin"
                                        )
                                    }
                                >
                                    Approve & publish
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                        act(
                                            r.orderId,
                                            "hidden",
                                            "Moderated by admin"
                                        )
                                    }
                                >
                                    Hide review
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <EmptyState
                    icon={MessageSquare}
                    title="Moderation queue is clear"
                    text="All customer reviews have been reviewed."
                />
            )}
        </div>
    );
}

export function ACompliance() {
    const records = useAsync(() => api.allCompliance(), []);

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-extrabold">Vendor compliance</h1>
                <p className="mt-1 text-xs text-ink-3">
                    ADM-007: FDA Food Hygiene permit records and campus kitchen
                    safety permits.
                </p>
            </div>

            {records.error ? (
                <ErrorState onRetry={records.retry} />
            ) : records.loading && !records.data ? (
                <div className="overflow-x-auto rounded-2xl border border-line bg-surface p-4 space-y-3">
                    <div className="h-5 w-full animate-pulse rounded bg-sunken" />
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center justify-between gap-4 py-2 border-b border-line last:border-0">
                            <div className="h-4 w-32 animate-pulse rounded bg-sunken" />
                            <div className="h-4 w-24 animate-pulse rounded bg-sunken" />
                            <div className="h-4 w-28 animate-pulse rounded bg-sunken" />
                            <div className="h-4 w-24 animate-pulse rounded bg-sunken" />
                            <div className="h-6 w-16 animate-pulse rounded-full bg-sunken" />
                        </div>
                    ))}
                </div>
            ) : (records.data || []).length ? (
                <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-line text-xs text-ink-3">
                            <tr>
                                <th className="p-3">Vendor</th>
                                <th className="p-3">Permit type</th>
                                <th className="p-3">Permit number</th>
                                <th className="p-3">Validity</th>
                                <th className="p-3">Verification</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(records.data || []).map((c, i) => (
                                <tr
                                    key={i}
                                    className="border-b border-line last:border-0"
                                >
                                    <td className="p-3 font-semibold">
                                        {c.vendorName || c.vendorId}
                                    </td>
                                    <td className="p-3 text-ink-2">
                                        {c.type || "FDA permit"}
                                    </td>
                                    <td className="p-3 font-mono text-xs">
                                        {c.number || "Pending upload"}
                                    </td>
                                    <td className="p-3 text-xs text-ink-3">
                                        {c.expiresAt
                                            ? `Valid until ${c.expiresAt}`
                                            : "Not set"}
                                    </td>
                                    <td className="p-3">
                                        {c.number ? (
                                            <Badge tone="ok">Verified</Badge>
                                        ) : (
                                            <Badge tone="warn">
                                                Needs upload
                                            </Badge>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <EmptyState
                    title="No compliance records yet"
                    text="Vendor food hygiene permits will appear here as kitchens submit them."
                />
            )}
        </div>
    );
}

export function APayouts() {
    const toast = useToast();
    const ledger = useAsync(() => api.payouts(), []);
    const batches = useAsync(() => api.payoutBatches(), []);
    const [busy, setBusy] = useState(false);

    const createBatch = async () => {
        setBusy(true);
        try {
            const res = await api.createPayoutBatch();
            toast(`Payout batch ${res.id} created for ${money(res.amount)}`);
            ledger.retry();
            batches.retry();
        } catch (e) {
            toast(e.message, "bad");
        } finally {
            setBusy(false);
        }
    };

    const held = ledger.data?.held ?? 0;
    const released = ledger.data?.released ?? 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-extrabold">
                        Settlements & Payouts
                    </h1>
                    <p className="mt-1 text-xs text-ink-3">
                        §16.5: Batch settlements are aggregated rather than
                        dispatched per order.
                    </p>
                </div>
                <Button size="sm" loading={busy} onClick={createBatch}>
                    Create payout batch
                </Button>
            </div>

            {ledger.loading && !ledger.data ? (
                <div className="grid gap-3 sm:grid-cols-2">
                    <Card className="border-brand/40 bg-brand-soft space-y-2">
                        <div className="h-4 w-36 animate-pulse rounded bg-brand/20" />
                        <div className="h-8 w-28 animate-pulse rounded bg-brand/20" />
                        <div className="h-3 w-48 animate-pulse rounded bg-brand/20" />
                    </Card>
                    <Card className="border-ok/40 bg-ok-soft space-y-2">
                        <div className="h-4 w-32 animate-pulse rounded bg-ok/20" />
                        <div className="h-8 w-28 animate-pulse rounded bg-ok/20" />
                        <div className="h-3 w-48 animate-pulse rounded bg-ok/20" />
                    </Card>
                </div>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                    <Card className="border-brand/40 bg-brand-soft">
                        <p className="text-xs font-semibold text-brand-strong">
                            Held in Escrow (Uncollected)
                        </p>
                        <p className="num mt-1 text-2xl font-extrabold">
                            {money(held)}
                        </p>
                        <p className="mt-1 text-xs text-ink-2">
                            {ledger.data?.heldCount ?? 0} orders waiting for student
                            pickup confirmation.
                        </p>
                    </Card>
                    <Card className="border-ok/40 bg-ok-soft">
                        <p className="text-xs font-semibold text-ok">
                            Released for Payout
                        </p>
                        <p className="num mt-1 text-2xl font-extrabold">
                            {money(released)}
                        </p>
                        <p className="mt-1 text-xs text-ink-2">
                            {ledger.data?.releasedCount ?? 0} orders verified by
                            student collection.
                        </p>
                    </Card>
                </div>
            )}

            <section>
                <h2 className="mb-3 text-lg font-extrabold">Payout Batches</h2>
                {batches.loading && !batches.data ? (
                    <ul className="space-y-3">
                        {[1, 2].map((i) => (
                            <li key={i} className="rounded-2xl border border-line bg-surface p-4 flex flex-wrap items-center justify-between gap-3">
                                <div className="space-y-1.5">
                                    <div className="h-4 w-28 animate-pulse rounded bg-sunken" />
                                    <div className="h-3 w-40 animate-pulse rounded bg-sunken" />
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-6 w-20 animate-pulse rounded bg-sunken" />
                                    <div className="h-6 w-16 animate-pulse rounded-full bg-sunken" />
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (batches.data || []).length ? (
                    <ul className="space-y-3">
                        {batches.data.map((b) => (
                            <li
                                key={b.id}
                                className="rounded-2xl border border-line bg-surface p-4 flex flex-wrap items-center justify-between gap-3"
                            >
                                <div>
                                    <span className="num font-bold text-sm">
                                        {b.id}
                                    </span>
                                    <span className="ml-2 font-mono text-xs text-ink-3">
                                        {b.providerReference}
                                    </span>
                                    <p className="mt-1 text-xs text-ink-2">
                                        {b.orderCount} orders settled ·{" "}
                                        {timeAgo(b.createdAt)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="num font-extrabold text-base">
                                        {money(b.amount)}
                                    </span>
                                    <Badge tone="ok">{b.status}</Badge>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <EmptyState
                        icon={Wallet}
                        title="No payout batches yet"
                        text="Create a payout batch once orders are confirmed and released."
                    />
                )}
            </section>
        </div>
    );
}

export function AAudit() {
    const audit = usePagedList((p) => api.auditLogs(p), (e) => e.id);
    const logs = audit.data || [];

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-extrabold">Audit trail</h1>
                <p className="mt-1 text-xs text-ink-3">
                    project.md §42: Append-only log of all financial, order, and
                    moderation actions.
                </p>
            </div>

            {audit.error ? (
                <ErrorState onRetry={audit.retry} />
            ) : logs.length ? (
                <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-line text-xs text-ink-3">
                            <tr>
                                <th className="p-3">ID</th>
                                <th className="p-3">Actor</th>
                                <th className="p-3">Action</th>
                                <th className="p-3">Entity</th>
                                <th className="p-3">Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((e) => (
                                <tr
                                    key={e.id}
                                    className="border-b border-line last:border-0"
                                >
                                    <td className="p-3 font-mono text-xs text-ink-3">
                                        {e.id}
                                    </td>
                                    <td className="p-3 font-semibold text-xs">
                                        {e.actor}
                                    </td>
                                    <td className="p-3">
                                        <Badge tone="brand">{e.action}</Badge>
                                    </td>
                                    <td className="p-3 font-mono text-xs">
                                        {e.entityType}:{e.entityId}
                                    </td>
                                    <td className="p-3 text-xs text-ink-3">
                                        {timeAgo(e.at)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <EmptyState
                    title="Audit log is empty"
                    text="System actions will be recorded here."
                />
            )}
            <TruncationNotice
                pagination={audit.pagination}
                shown={logs.length}
                onLoadMore={audit.loadMore}
                loadingMore={audit.loadingMore}
                label="audit events"
            />
        </div>
    );
}

export function AUsers() {
    const toast = useToast();
    const users = usePagedList((p) => api.adminUsers(p), (u) => u.id);
    const list = users.data || [];

    const toggleActive = async (u, nextActive) => {
        try {
            await api.updateAdminUser(u.id, { active: nextActive });
            toast(
                nextActive ? `${u.name} activated` : `${u.name} suspended`,
                nextActive ? "ok" : "bad"
            );
            users.retry();
        } catch (err) {
            toast(err.message, "bad");
        }
    };

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-extrabold">Users</h1>
            {users.error ? (
                <ErrorState onRetry={users.retry} />
            ) : list.length ? (
                <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-line text-xs text-ink-3">
                            <tr>
                                <th className="p-3">Name</th>
                                <th className="p-3">Email</th>
                                <th className="p-3">Role</th>
                                <th className="p-3">Active</th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.map((u) => (
                                <tr
                                    key={u.id}
                                    className="border-b border-line last:border-0"
                                >
                                    <td className="p-3 font-semibold">{u.name}</td>
                                    <td className="p-3 text-ink-2">{u.email}</td>
                                    <td className="p-3">
                                        <Badge>{u.role}</Badge>
                                    </td>
                                    <td className="p-3">
                                        {u.isAdmin ? (
                                            <Badge tone="brand">Protected Admin</Badge>
                                        ) : (
                                            <Switch
                                                checked={u.active !== false}
                                                label={`${u.name} active`}
                                                onChange={(v) => toggleActive(u, v)}
                                            />
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <EmptyState
                    title="No users found"
                    text="Registered student accounts will appear here."
                />
            )}
            <TruncationNotice
                pagination={users.pagination}
                shown={list.length}
                onLoadMore={users.loadMore}
                loadingMore={users.loadingMore}
                label="users"
            />
        </div>
    );
}

export function AConversations() {
    const toast = useToast();
    const [q, setQ] = useState("");
    const [appliedQ, setAppliedQ] = useState("");
    const [selected, setSelected] = useState(null);
    const [reason, setReason] = useState("safety");
    const [messagesData, setMessagesData] = useState(null);
    const [loadingMsgs, setLoadingMsgs] = useState(false);

    const convos = useAsync(
        () => api.adminConversations(appliedQ ? { q: appliedQ } : {}),
        [appliedQ]
    );
    const list = convos.data?.results || [];

    const openConversation = (c) => {
        setSelected(c);
        setReason("safety");
        setMessagesData(null);
    };

    const loadMessages = async (e) => {
        e.preventDefault();
        if (!selected) return;
        setLoadingMsgs(true);
        try {
            const res = await api.adminConversationMessages(
                selected.orderId,
                reason
            );
            setMessagesData(res);
        } catch (err) {
            toast(err.message || "Could not load conversation", "bad");
        } finally {
            setLoadingMsgs(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-extrabold">Conversations</h1>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        setAppliedQ(q.trim());
                    }}
                    className="flex gap-2"
                >
                    <Input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search order, customer, kitchen"
                        aria-label="Search conversations"
                    />
                    <Button type="submit" size="sm" variant="secondary">
                        Search
                    </Button>
                </form>
            </div>
            {convos.error ? (
                <ErrorState onRetry={convos.retry} />
            ) : list.length ? (
                <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-line text-xs text-ink-3">
                            <tr>
                                <th className="p-3">Order</th>
                                <th className="p-3">Customer</th>
                                <th className="p-3">Kitchen</th>
                                <th className="p-3">Messages</th>
                                <th className="p-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.map((c) => (
                                <tr
                                    key={c.orderId}
                                    className="border-b border-line last:border-0"
                                >
                                    <td className="num p-3 font-semibold">
                                        {c.orderId}
                                    </td>
                                    <td className="p-3">{c.customerName}</td>
                                    <td className="p-3 text-ink-2">
                                        {c.vendorName}
                                    </td>
                                    <td className="num p-3">{c.messageCount}</td>
                                    <td className="p-3">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => openConversation(c)}
                                        >
                                            Review
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <EmptyState
                    title="No conversations found"
                    text="Orders with customer-kitchen messages will appear here."
                />
            )}
            <Modal
                open={!!selected}
                onClose={() => setSelected(null)}
                title={
                    selected
                        ? `Conversation ${selected.orderId}`
                        : "Conversation"
                }
            >
                {!messagesData ? (
                    <form onSubmit={loadMessages} className="space-y-4">
                        <p className="text-sm text-ink-2">
                            Select a review reason. Viewing unmasked order chat
                            messages is recorded in the audit log.
                        </p>
                        <Field label="Reason for viewing">
                            <Select
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                required
                            >
                                <option value="safety">Safety</option>
                                <option value="fraud">Fraud</option>
                                <option value="dispute">Dispute</option>
                                <option value="security">Security</option>
                                <option value="other">Other</option>
                            </Select>
                        </Field>
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setSelected(null)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loadingMsgs}>
                                {loadingMsgs ? "Loading…" : "View messages"}
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-3">
                        <p className="text-xs text-ink-3">
                            {messagesData.customerName} ↔{" "}
                            {messagesData.vendorName} · Reason:{" "}
                            {messagesData.reason}
                        </p>
                        <ul className="max-h-72 space-y-2 overflow-y-auto rounded-xl bg-sunken p-3">
                            {(messagesData.messages || []).map((m, idx) => (
                                <li
                                    key={idx}
                                    className="rounded-xl bg-surface px-3 py-2 text-sm text-ink"
                                >
                                    <span className="block text-[11px] font-semibold text-ink-3">
                                        {m.from} · {timeAgo(m.at)}
                                    </span>
                                    <span className="block whitespace-pre-wrap">
                                        {m.text}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </Modal>
        </div>
    );
}

export function ASecurity() {
    const [email, setEmail] = useState("");
    const [ip, setIp] = useState("");
    const [reason, setReason] = useState("");
    const [filters, setFilters] = useState({});
    const [extraRows, setExtraRows] = useState([]);
    const [loadingMore, setLoadingMore] = useState(false);

    const sec = useAsync(() => api.adminFailedLogins(filters), [filters]);
    const summary = sec.data?.summary || {
        total24h: 0,
        uniqueIps24h: 0,
        topTargetedEmails: [],
    };
    const rows = extraRows.length ? extraRows : sec.data?.results || [];
    const hasMore =
        extraRows.length > 0
            ? extraRows.length < (sec.data?.count || 0)
            : !!sec.data?.hasMore;

    const applyFilters = (e) => {
        e.preventDefault();
        setExtraRows([]);
        setFilters({
            ...(email.trim() ? { email: email.trim() } : {}),
            ...(ip.trim() ? { ip: ip.trim() } : {}),
            ...(reason ? { reason } : {}),
        });
    };

    const loadMore = async () => {
        const offset = rows.length;
        setLoadingMore(true);
        try {
            const res = await api.adminFailedLogins({ ...filters, offset });
            setExtraRows([...rows, ...(res.results || [])]);
        } finally {
            setLoadingMore(false);
        }
    };

    return (
        <div className="space-y-5">
            <h1 className="text-2xl font-extrabold">Security · Failed Logins</h1>
            <div className="grid gap-3 sm:grid-cols-3">
                <Card className="p-4">
                    <p className="text-xs text-ink-3">Failed logins (24h)</p>
                    <p className="num mt-1 text-2xl font-extrabold">
                        {summary.total24h}
                    </p>
                </Card>
                <Card className="p-4">
                    <p className="text-xs text-ink-3">Unique IPs (24h)</p>
                    <p className="num mt-1 text-2xl font-extrabold">
                        {summary.uniqueIps24h}
                    </p>
                </Card>
                <Card className="p-4">
                    <p className="text-xs text-ink-3">Top targeted (24h)</p>
                    <p className="mt-1 truncate text-sm font-semibold">
                        {summary.topTargetedEmails?.[0]
                            ? `${summary.topTargetedEmails[0].email} (${summary.topTargetedEmails[0].count})`
                            : "None"}
                    </p>
                </Card>
            </div>

            <form
                onSubmit={applyFilters}
                className="flex flex-wrap items-end gap-2"
            >
                <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Filter email"
                    aria-label="Filter email"
                />
                <Input
                    value={ip}
                    onChange={(e) => setIp(e.target.value)}
                    placeholder="Filter IP"
                    aria-label="Filter IP"
                />
                <Select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    aria-label="Filter reason"
                >
                    <option value="">All reasons</option>
                    <option value="invalid_credentials">
                        Invalid credentials
                    </option>
                    <option value="unknown_account">Unknown account</option>
                    <option value="inactive_account">Inactive account</option>
                    <option value="invalid_login_code">
                        Invalid login code
                    </option>
                    <option value="invalid_reset_code">
                        Invalid reset code
                    </option>
                    <option value="invalid_email_domain">
                        Invalid email domain
                    </option>
                </Select>
                <Button type="submit" size="sm" variant="secondary">
                    Filter
                </Button>
            </form>

            {sec.error ? (
                <ErrorState onRetry={sec.retry} />
            ) : rows.length ? (
                <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-line text-xs text-ink-3">
                            <tr>
                                <th className="p-3">Time</th>
                                <th className="p-3">Email</th>
                                <th className="p-3">IP</th>
                                <th className="p-3">Reason</th>
                                <th className="p-3">Endpoint</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((ev) => (
                                <tr
                                    key={ev.id}
                                    className="border-b border-line last:border-0"
                                >
                                    <td className="p-3 text-xs text-ink-3">
                                        {timeAgo(ev.createdAt)}
                                    </td>
                                    <td className="p-3 font-medium">
                                        {ev.emailAttempted}
                                    </td>
                                    <td className="num p-3 text-ink-2">
                                        {ev.ipAddress || "—"}
                                    </td>
                                    <td className="p-3">
                                        <Badge tone="warn">{ev.reason}</Badge>
                                    </td>
                                    <td className="p-3 text-xs text-ink-3">
                                        {ev.endpoint}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <EmptyState
                    title="No failed login events"
                    text="Failed authentication attempts will appear here."
                />
            )}
            {hasMore && (
                <div className="flex justify-center">
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={loadMore}
                        disabled={loadingMore}
                    >
                        {loadingMore ? "Loading…" : "Load more"}
                    </Button>
                </div>
            )}
        </div>
    );
}
