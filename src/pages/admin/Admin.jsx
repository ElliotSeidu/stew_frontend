import { useState, useMemo } from "react";
import {
    Badge,
    Button,
    Card,
    EmptyState,
    Switch,
    ErrorState,
    Stars,
} from "../../components/ui";
import { useToast } from "../../context/Providers";
import { api, auditLog } from "../../lib/api";
import { useAsync } from "../../lib/hooks";
import {
    DISPUTES,
    PENDING_VENDORS,
    USERS,
    VENDORS,
    PREP_STAGES,
    stageIndex,
} from "../../lib/mockData";
import { money, timeAgo } from "../../lib/utils";
import { niceDay } from "../../config";
import { MessageSquare, ReceiptText, ThumbsUp, Wallet } from "lucide-react";

export function AOverview() {
    const ledger = useAsync(() => api.payouts(), []);
    const held = ledger.data?.held ?? 0;
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-extrabold">Overview</h1>
            <p className="text-xs text-ink-3">
                Live control plane. Privileged operations are recorded in the
                audit log.
            </p>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                    ["Orders today", 148],
                    ["Active vendors", VENDORS.length],
                    ["Open disputes", DISPUTES.length],
                    ["Pending applications", PENDING_VENDORS.length],
                ].map(([l, v]) => (
                    <Card key={l}>
                        <p className="text-xs text-ink-3">{l}</p>
                        <p className="num mt-1 text-2xl font-extrabold">{v}</p>
                    </Card>
                ))}
            </div>

            {/* Money we are holding on behalf of students and chefs. */}
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

            <Card className="border-bad/40 bg-bad-soft">
                <p className="font-bold text-bad">
                    Priority:{" "}
                    {DISPUTES.filter((d) => d.priority === "high").length} food
                    safety case needs review
                </p>
            </Card>
        </div>
    );
}

export function AVendors() {
    const toast = useToast();
    const [tab, setTab] = useState("pending");
    const [pending, setPending] = useState(PENDING_VENDORS);
    const [activeList, setActiveList] = useState(
        VENDORS.map((v) => ({ ...v, active: v.open }))
    );

    const act = (id, msg) => {
        setPending((l) => l.filter((x) => x.id !== id));
        toast(msg);
    };

    const toggleVendor = (id, active) => {
        setActiveList((l) =>
            l.map((v) => (v.id === id ? { ...v, active } : v))
        );
        toast(
            active ? "Vendor activated" : "Vendor suspended",
            active ? "ok" : "bad"
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-extrabold">Vendors</h1>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant={tab === "pending" ? "primary" : "outline"}
                        onClick={() => setTab("pending")}
                    >
                        Applications ({pending.length})
                    </Button>
                    <Button
                        size="sm"
                        variant={tab === "active" ? "primary" : "outline"}
                        onClick={() => setTab("active")}
                    >
                        Active Vendors ({activeList.length})
                    </Button>
                </div>
            </div>

            {tab === "pending" ? (
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
                                            {v.hall} · {v.cat} · {v.submitted}
                                        </p>
                                    </div>
                                    <Badge tone="warn">
                                        Pending verification
                                    </Badge>
                                </div>
                                <div className="mt-3 flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() =>
                                            act(v.id, `${v.name} approved`)
                                        }
                                    >
                                        Approve
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                            act(v.id, `${v.name} rejected`)
                                        }
                                    >
                                        Reject
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <EmptyState
                        title="No pending applications"
                        text="All applications have been reviewed."
                    />
                )
            ) : (
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
                                        <span className="inline-flex items-center gap-1 font-semibold text-xs text-ink">
                                            <ThumbsUp className="h-3 w-3 text-brand-strong" /> {v.rating}{" "}
                                            <span className="font-normal text-ink-3">
                                                ({v.reviews})
                                            </span>
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <Badge tone={v.active ? "ok" : "bad"}>
                                            {v.active ? "Active" : "Suspended"}
                                        </Badge>
                                    </td>
                                    <td className="p-3">
                                        <Switch
                                            checked={v.active}
                                            label={`Toggle ${v.name}`}
                                            onChange={(checked) =>
                                                toggleVendor(v.id, checked)
                                            }
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export function AOrders() {
    const toast = useToast();
    const orders = useAsync(() => api.orders(), []);
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
        </div>
    );
}

export function ADisputes() {
    const toast = useToast();
    const [list, setList] = useState(
        [...DISPUTES].sort(
            (a, b) =>
                (a.priority === "high" ? -1 : 1) -
                (b.priority === "high" ? -1 : 1)
        )
    );
    const close = (id, msg) => {
        setList((l) => l.filter((x) => x.id !== id));
        toast(msg);
    };
    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-extrabold">Disputes</h1>
            {list.length ? (
                <ul className="space-y-3">
                    {list.map((d) => (
                        <li
                            key={d.id}
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
                                Order {d.order} · {d.vendor}
                            </p>
                            <div className="mt-3 flex gap-2">
                                <Button
                                    size="sm"
                                    onClick={() => close(d.id, "Refund issued")}
                                >
                                    Refund
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                        close(d.id, "Case dismissed")
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
            ) : (
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
    const [logs] = useState(() => auditLog());
    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-extrabold">Audit trail</h1>
                <p className="mt-1 text-xs text-ink-3">
                    project.md §42: Append-only log of all financial, order, and
                    moderation actions.
                </p>
            </div>

            {logs.length ? (
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
        </div>
    );
}

export function AUsers() {
    const [users, setUsers] = useState(USERS);
    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-extrabold">Users</h1>
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
                        {users.map((u) => (
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
                                    {u.role === 'admin' ? (
                                        <Badge tone="brand">Protected Admin</Badge>
                                    ) : (
                                        <Switch
                                            checked={u.active}
                                            label={`${u.name} active`}
                                            onChange={(v) =>
                                                setUsers((l) =>
                                                    l.map((x) =>
                                                        x.id === u.id
                                                            ? { ...x, active: v }
                                                            : x
                                                    )
                                                )
                                            }
                                        />
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
