import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import {
    Bell,
    Check,
    ChefHat,
    CircleCheck,
    Clock,
    MapPin,
    MessageSquare,
    Package,
    Phone,
    ShoppingBasket,
    Wallet,
    Trash2,
} from "lucide-react";
import {
    Badge,
    Button,
    Card,
    ConfirmDialog,
    EmptyState,
    Field,
    Food,
    Input,
    KitchenLogo,
    Modal,
    Price,
    Select,
    Switch,
    Textarea,
} from "../../components/ui";
import { CAMPUS, niceDay, FEE_RATE } from "../../config";
import { useAuth, useToast } from "../../context/Providers";
import { api } from "../../lib/api";
import { useAsync } from "../../lib/hooks";
import { CATEGORIES, INCOMING, MEALS, PREP_STAGES, SALES, stageIndex } from "../../lib/mockData";
import { fileToSquareDataUrl, fileToWideDataUrl } from "../../lib/upload";
import { money, read, timeAgo, write } from "../../lib/utils";

/* ---------- Vendor application (student side) ---------- */
const HYGIENE = [
    "My cooking area and surfaces are cleaned before every batch.",
    "I wash my hands and use clean utensils and containers.",
    "I keep cooked food covered and at safe temperatures.",
    "I never sell expired or spoiled food.",
    "I will tell customers about common allergens I know of (eggs, fish, nuts, gluten).",
    "I use clean, sealed packaging for handover.",
];
const fileCls =
    "block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-soft file:px-3 file:py-2 file:font-semibold file:text-brand-strong";

const toList = (s) =>
    String(s || "")
        .split(/[,\n]/)
        .map((x) => x.trim())
        .filter(Boolean);

export function Apply() {
    const [logo, setLogo] = useState(null);
    const auth = useAuth();
    const nav = useNavigate();
    const toast = useToast();
    const {
        register,
        handleSubmit,
        setError,
        watch,
        formState: { errors, isSubmitting },
    } = useForm({
        mode: "onTouched",
        defaultValues: {
            kitchen: auth.user?.kitchenName || "",
            hall: auth.user?.area || auth.user?.hall || "",
            sells: (auth.user?.sells || []).join(", "),
            payout: auth.user?.phone || "",
            checklist: [],
        },
    });
    const kitchenName = watch("kitchen") || auth.user?.kitchenName || "";
    const onSubmit = async (d) => {
        try {
            await api.applyVendor({
                ...d,
                sells: toList(d.sells),
                logo: logo || undefined,
                idDoc: d.idDoc?.[0]?.name,
                kitchenPhoto: d.kitchenPhoto?.[0]?.name,
            });
            await api.markVendor();
            if (auth.user) {
                const nextAccountType = auth.user.accountType === 'customer' ? 'both' : (auth.user.accountType || 'vendor');
                auth.updateUser({
                    ...auth.user,
                    isVendor: true,
                    role: auth.user.role === "admin" ? "admin" : "vendor",
                    accountType: nextAccountType,
                    kitchenName: d.kitchen,
                    sells: toList(d.sells),
                    logo: logo || auth.user.logo,
                });
            }
            toast("Your kitchen is now open! Welcome to your dashboard.");
            nav("/app/vendor", { replace: true });
        } catch (e) {
            setError("root", { message: e.message });
        }
    };
    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mx-auto max-w-lg space-y-5">
            <div>
                <h1 className="text-2xl font-extrabold">Set up your kitchen</h1>
                <p className="mt-1 text-sm text-ink-2">
                    Students order from your pot and collect on the day you agree with them.
                </p>
            </div>
            <Card className="space-y-4">
                <Field label="Kitchen name" error={errors.kitchen}>
                    <Input
                        invalid={errors.kitchen}
                        placeholder="e.g. Auntie Ama's Soup Pot"
                        {...register("kitchen", {
                            required: "Enter a kitchen name",
                            minLength: { value: 3, message: "Too short" },
                        })}
                    />
                </Field>
                <Field
                    label="Kitchen logo (optional)"
                    error={errors.logo}
                    hint="A photo of your kitchen or your own logo. Without one we show your kitchen initials."
                >
                    <div className="flex items-center gap-3">
                        <KitchenLogo vendor={{ name: kitchenName, logo }} size="h-14 w-14" />
                        <input
                            type="file"
                            accept="image/*"
                            className={fileCls}
                            onChange={async (e) => {
                                try {
                                    const f = e.target.files?.[0];
                                    if (!f) { setLogo(null); return }
                                    setLogo(await fileToSquareDataUrl(f, 256));
                                } catch (err) {
                                    setError("logo", { message: err.message });
                                }
                            }}
                        />
                    </div>
                </Field>
                <Field label="Where do you cook from?" error={errors.hall}>
                    <Select
                        invalid={errors.hall}
                        defaultValue=""
                        {...register("hall", { required: "Choose a location" })}
                    >
                        <option value="" disabled>Select…</option>
                        {CAMPUS.areas.map((h) => <option key={h}>{h}</option>)}
                    </Select>
                </Field>
                <Field
                    label="What do you cook?"
                    error={errors.sells}
                    hint="Your own dishes, separated by commas. e.g. Palm nut soup, Groundnut soup, Fufu"
                >
                    <Input
                        invalid={errors.sells}
                        placeholder="Palm nut soup, Groundnut soup, Fufu"
                        {...register("sells", {
                            required: "Tell us what you cook",
                            validate: (v) => toList(v).length > 0 || "Add at least one dish",
                        })}
                    />
                </Field>
                <Field
                    label="Tell students about your pot"
                    error={errors.about}
                    hint="At least 30 characters"
                >
                    <Textarea
                        invalid={errors.about}
                        {...register("about", {
                            required: "Tell us about your cooking",
                            minLength: { value: 30, message: "Add a bit more detail (30+ characters)" },
                        })}
                    />
                </Field>
                <Field label="Payout MoMo number" error={errors.payout}>
                    <Input
                        type="tel"
                        invalid={errors.payout}
                        {...register("payout", {
                            required: "Enter a payout number",
                            setValueAs: (v) => v.replace(/\s/g, ""),
                            pattern: { value: CAMPUS.phoneRe, message: "Enter a valid Ghana mobile number" },
                        })}
                    />
                </Field>
                <Field label="Photo of your student ID" error={errors.idDoc}>
                    <input
                        type="file"
                        accept="image/*,.pdf"
                        className={fileCls}
                        {...register("idDoc", { required: "Upload your student ID" })}
                    />
                </Field>
            </Card>

            <Card className="space-y-3">
                <h2 className="font-bold">Hygiene checklist</h2>
                <p className="text-xs text-ink-3">
                    Every item must be ticked before we can review your kitchen.
                </p>
                <fieldset className="space-y-2">
                    <legend className="sr-only">Hygiene checklist</legend>
                    {HYGIENE.map((h, i) => (
                        <label key={h} className="flex items-start gap-2 text-sm text-ink-2">
                            <input
                                type="checkbox"
                                value={i}
                                className="mt-1 h-4 w-4 accent-brand"
                                {...register("checklist", {
                                    validate: (v) =>
                                        (v || []).length === HYGIENE.length || "Please confirm every item",
                                })}
                            />
                            {h}
                        </label>
                    ))}
                </fieldset>
                {errors.checklist && (
                    <p role="alert" className="text-xs font-medium text-bad">{errors.checklist.message}</p>
                )}
                <Field
                    label="Photo of your cooking area"
                    error={errors.kitchenPhoto}
                    hint="Show where you prepare the food"
                >
                    <input
                        type="file"
                        accept="image/*"
                        className={fileCls}
                        {...register("kitchenPhoto", { required: "Upload a photo of your cooking area" })}
                    />
                </Field>
                <div>
                    <label className="flex items-start gap-2 text-sm text-ink-2">
                        <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 accent-brand"
                            {...register("hygiene", { required: "Please confirm" })}
                        />
                        <span>
                            I agree to the{" "}
                            <Link to="/app/legal/food-safety" className="font-semibold text-brand-strong underline">
                                Food Safety Standards
                            </Link>{" "}
                            and{" "}
                            <Link to="/app/legal/vendor-terms" className="font-semibold text-brand-strong underline">
                                Vendor Terms
                            </Link>.
                        </span>
                    </label>
                    {errors.hygiene && (
                        <p role="alert" className="mt-1 text-xs font-medium text-bad">{errors.hygiene.message}</p>
                    )}
                </div>
            </Card>
            {errors.root && (
                <p role="alert" className="rounded-lg bg-bad-soft p-3 text-sm font-medium text-bad">{errors.root.message}</p>
            )}
            <Button type="submit" className="w-full" loading={isSubmitting}>Open my kitchen</Button>
        </form>
    );
}

/* ---------- Chef order queue ---------- */
// The chef taps these in order; the student watches the same list advance.
const STAGE_ICON = {
    accepted: Check,
    shopping: ShoppingBasket,
    cooking: ChefHat,
    packing: Package,
    ready: Bell,
    collected: CircleCheck,
};

function StageBar({ order, onAdvance, busy }) {
    const cur = stageIndex(order.prepStage);
    const next = PREP_STAGES[cur + 1];
    return (
        <div className="space-y-3">
            <ol className="space-y-1.5">
                {PREP_STAGES.map((s, i) => {
                    const Icon = STAGE_ICON[s.id];
                    const done = i < cur;
                    const active = i === cur;
                    return (
                        <li key={s.id} className="flex items-center gap-2 text-sm">
                            <span
                                className={
                                    "grid h-6 w-6 shrink-0 place-items-center rounded-full " +
                                    (done ? "bg-ok text-on-solid" : active ? "bg-brand text-on-brand" : "bg-sunken text-ink-3")
                                }
                            >
                                <Icon className="h-3.5 w-3.5" />
                            </span>
                            <span className={done || active ? "font-semibold" : "text-ink-3"}>{s.label}</span>
                            {order.prepAt?.[s.id] && (
                                <span className="ml-auto text-[11px] text-ink-3">{timeAgo(order.prepAt[s.id])}</span>
                            )}
                        </li>
                    );
                })}
            </ol>
            {next ? (
                <Button size="sm" loading={busy} onClick={() => onAdvance(next.id)}>
                    Mark: {next.label}
                </Button>
            ) : (
                <p className="text-xs font-semibold text-ok">Collected. Nothing left to do.</p>
            )}
        </div>
    );
}

function OrderThread({ order, from, onSent }) {
    const [text, setText] = useState("");
    const [busy, setBusy] = useState(false);
    const toast = useToast();
    const messages = order.messages || [];

    const send = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        setBusy(true);
        try {
            await api.sendMessage(order.id, { text, from });
            setText("");
            onSent?.();
        } catch (err) {
            toast(err.message, "bad");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-semibold">
                <MessageSquare className="h-4 w-4 text-brand-strong" />
                Messages with {from === "vendor" ? order.customer : "the kitchen"}
            </p>
            {messages.length ? (
                <ul className="max-h-56 space-y-2 overflow-y-auto rounded-xl bg-sunken p-3">
                    {messages.map((m, i) => (
                        <li
                            key={i}
                            className={
                                "max-w-[85%] rounded-xl px-3 py-2 text-sm " +
                                (m.from === from ? "ml-auto bg-brand text-on-brand" : "bg-surface text-ink")
                            }
                        >
                            <span className="block">{m.text}</span>
                            <span className="mt-0.5 block text-[10px] opacity-70">{timeAgo(m.at)}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-xs text-ink-3">No messages yet.</p>
            )}
            <form onSubmit={send} className="flex gap-2">
                <Input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    maxLength={500}
                    placeholder="e.g. Your pot is on the fire, ready Thursday"
                    aria-label="Message"
                />
                <Button type="submit" size="sm" loading={busy} disabled={!text.trim()}>Send</Button>
            </form>
        </div>
    );
}

function HandoffCodeForm({ order, onVerified }) {
    const [code, setCode] = useState("");
    const [busy, setBusy] = useState(false);
    const toast = useToast();

    const verify = async (e) => {
        e.preventDefault();
        const clean = code.trim();
        if (clean.length !== 6) {
            toast("Please enter the 6-digit code", "bad");
            return;
        }
        setBusy(true);
        try {
            await api.completeByCode(order.id, clean);
            toast("Handoff verified! Payment released.");
            onVerified();
        } catch (err) {
            toast(err.message, "bad");
        } finally {
            setBusy(false);
        }
    };

    if ((order.stage || "accepted") === "collected") return null;

    return (
        <form onSubmit={verify} className="space-y-2 rounded-xl border border-line bg-surface p-3">
            <p className="text-xs font-bold text-ink">Handover Verification</p>
            <p className="text-xs text-ink-3">
                Enter the student's 6-digit pickup code to verify handoff and release escrow payment.
            </p>
            <div className="flex gap-2">
                <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="6-digit code"
                    maxLength={6}
                    className="text-center font-mono font-bold tracking-widest"
                />
                <Button type="submit" size="sm" loading={busy} disabled={code.length !== 6}>
                    Verify code
                </Button>
            </div>
        </form>
    );
}

export function VDashboard() {
    const auth = useAuth();
    const toast = useToast();
    const [open, setOpen] = useState(true);
    const [queue, setQueue] = useState(INCOMING);
    const [busyId, setBusyId] = useState(null);
    const [openOrder, setOpenOrder] = useState(null);
    const [filter, setFilter] = useState("active");
    const sells = auth.user?.sells || [];

    const decline = async (order) => {
        if (!window.confirm(`Decline and cancel order ${order.code}? Any paid funds will be refunded.`)) return;
        try {
            await api.cancelOrder(order.id);
            setQueue((q) => q.filter((x) => x.id !== order.id));
            setOpenOrder(null);
            toast(`Order ${order.code} cancelled and refunded`);
        } catch (err) {
            toast(err.message, "bad");
        }
    };

    const advance = async (order, stage) => {
        setBusyId(order.id);
        try {
            // Sample data is local, so mirror the same change into the queue here.
            await api.setPrepStage(order.id, stage).catch(() => {});
            setQueue((q) => q.map((o) => (o.id === order.id ? { ...o, stage, prepAt: { ...(o.prepAt || {}), [stage]: Date.now() } } : o)));
            toast(`${order.code} → ${PREP_STAGES.find((s) => s.id === stage)?.label}`);
        } finally {
            setBusyId(null);
        }
    };

    const list = useMemo(() => {
        const withStage = queue.map((o) => ({ prepStage: o.stage || "accepted", ...o }));
        if (filter === "active") return withStage.filter((o) => o.prepStage !== "collected");
        if (filter === "ready") return withStage.filter((o) => o.prepStage === "ready");
        return withStage;
    }, [queue, filter]);

    const newCount = queue.filter((o) => (o.stage || "accepted") === "accepted").length;
    const readyCount = queue.filter((o) => o.stage === "ready").length;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-extrabold">
                        {auth.user?.kitchenName || "Your kitchen"}
                    </h1>
                    <p className="mt-1 text-sm text-ink-2">
                        {newCount > 0 ? `${newCount} new order${newCount > 1 ? "s" : ""} to accept.` : "You are up to date."}
                        {readyCount > 0 ? ` ${readyCount} waiting for pickup.` : ""}
                    </p>
                    {sells.length > 0 && (
                        <p className="mt-1 text-xs text-ink-3">You cook: {sells.join(" · ")}</p>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {auth.user?.accountType !== "vendor" && (
                        <Button to="/app" variant="outline" size="sm">Order food</Button>
                    )}
                    <label className="flex items-center gap-3 text-sm font-semibold">
                        {open ? "Open for orders" : "Closed"}
                        <Switch checked={open} onChange={setOpen} label="Kitchen open" />
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[
                    ["In the pot", queue.filter((o) => o.stage !== "collected").length],
                    ["Ready for pickup", readyCount],
                    ["This week", money(386)],
                ].map(([l, v]) => (
                    <Card key={l} className="!p-2.5 sm:!p-4 overflow-hidden flex flex-col justify-between">
                        <p className="text-[11px] sm:text-xs font-semibold text-ink-3 truncate leading-tight">{l}</p>
                        <p className="num mt-1 text-xs xs:text-sm sm:text-lg md:text-xl font-black text-ink truncate whitespace-nowrap">{v}</p>
                    </Card>
                ))}
            </div>

            <div className="flex gap-2">
                {[
                    ["active", "In progress"],
                    ["ready", "Ready"],
                    ["all", "All"],
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

            <p className="text-xs text-ink-3">
                Sample orders. Once your back end is connected, real student orders appear here.
            </p>

            {list.length ? (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {list.map((o) => {
                        const stage = o.stage || "accepted";
                        const stageMeta = PREP_STAGES[stageIndex(stage)];
                        return (
                            <li key={o.id} className="flex flex-col justify-between rounded-3xl border border-line/70 bg-surface p-5 shadow-xs transition hover:shadow-md">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                        <p className="num font-bold">{o.code}</p>
                                        <p className="text-sm text-ink-2">
                                            {o.customer}
                                            {o.phone && (
                                                <a href={`tel:${o.phone}`} className="ml-2 inline-flex items-center gap-1 font-semibold text-brand-strong">
                                                    <Phone className="h-3 w-3" />{o.phone}
                                                </a>
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {o.paid && <Badge tone="ok">Paid</Badge>}
                                        <Badge tone={stageMeta.tone}>{stageMeta.label}</Badge>
                                    </div>
                                </div>

                                <p className="mt-2 font-semibold">{o.items}</p>
                                {o.note && (
                                    <p className="mt-1 rounded-lg bg-warn-soft px-2 py-1 text-xs text-warn">
                                        Note: {o.note}
                                    </p>
                                )}
                                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-2">
                                    <span className="num">{money(o.total)}</span>
                                    <span className="inline-flex items-center gap-1">
                                        <MapPin className="h-3.5 w-3.5" />{o.area}
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5" />Pickup {niceDay(o.pickupDay)}
                                    </span>
                                </p>

                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    {o.messages?.length > 0 && (
                                        <Badge tone="brand">
                                            <MessageSquare className="h-3 w-3" />
                                            {o.messages.length} message{o.messages.length > 1 ? "s" : ""}
                                        </Badge>
                                    )}
                                    {o.paid && stage !== "collected" && (
                                        <Badge tone="warn">
                                            <Wallet className="h-3 w-3" />
                                            STEW is holding {money(o.subtotal ?? o.total)}
                                        </Badge>
                                    )}
                                    {stage === "collected" && <Badge tone="ok">Released to you</Badge>}
                                    <Button size="sm" variant="outline" onClick={() => setOpenOrder(o)}>
                                        Open order
                                    </Button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <EmptyState
                    icon={ChefHat}
                    title={filter === "ready" ? "Nothing waiting for pickup" : "All caught up"}
                    text="New orders will show up here."
                />
            )}

            <Modal
                open={!!openOrder}
                onClose={() => setOpenOrder(null)}
                title={openOrder ? `Order ${openOrder.code}` : ""}
            >
                {openOrder && (
                    <div className="space-y-5">
                        <div className="rounded-xl bg-sunken p-3 text-sm">
                            <p className="font-bold">{openOrder.customer}</p>
                            <p className="text-ink-2">{openOrder.items}</p>
                            <p className="mt-1 text-xs text-ink-3">
                                {openOrder.area} · pickup {niceDay(openOrder.pickupDay)} · <span className="num">{money(openOrder.total)}</span>
                            </p>
                            {openOrder.note && <p className="mt-2 text-xs text-warn">Note: {openOrder.note}</p>}
                        </div>
                        <StageBar
                            order={{ prepStage: openOrder.stage || "accepted", prepAt: openOrder.prepAt }}
                            busy={busyId === openOrder.id}
                            onAdvance={(stage) => advance(openOrder, stage)}
                        />
                        {openOrder.paid && (openOrder.stage || "accepted") !== "collected" && (
                            <div className="space-y-2 rounded-xl bg-warn-soft p-3">
                                <p className="text-sm font-semibold text-warn">
                                    <Wallet className="mr-1 inline h-4 w-4" />
                                    STEW is holding {money(openOrder.subtotal ?? openOrder.total)} for this order.
                                </p>
                                <p className="text-xs text-warn">
                                    {(openOrder.stage || "accepted") === "ready"
                                        ? "Your food is ready — once the student confirms they collected it, your money is released."
                                        : "Money is released once the student confirms collection, after you mark the order ready."}
                                </p>
                                {(openOrder.stage === "ready" || openOrder.collectionNudgedAt) && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={async () => {
                                            await api.nudgeCollection(openOrder.id).catch(() => {});
                                            setQueue((q) => q.map((x) => (x.id === openOrder.id ? { ...x, collectionNudgedAt: Date.now() } : x)));
                                            toast("Reminder sent to the student");
                                        }}
                                    >
                                        Remind the student to confirm
                                    </Button>
                                )}
                            </div>
                        )}
                        <HandoffCodeForm
                            order={openOrder}
                            onVerified={() => {
                                setQueue((q) => q.map((x) => x.id === openOrder.id ? { ...x, stage: "collected" } : x));
                                setOpenOrder((prev) => prev ? { ...prev, stage: "collected" } : null);
                            }}
                        />
                        <OrderThread
                            order={openOrder}
                            from="vendor"
                            onSent={() => {
                                setQueue((q) =>
                                    q.map((x) =>
                                        x.id === openOrder.id
                                            ? { ...x, messages: [...(x.messages || []), { from: "vendor", text: "(sent)", at: Date.now() }] }
                                             : x
                                    )
                                );
                            }}
                        />
                        {(openOrder.stage || "accepted") !== "collected" && (
                            <div className="pt-2 border-t border-line flex justify-end">
                                <Button size="sm" variant="outline" className="text-bad hover:bg-bad-soft" onClick={() => decline(openOrder)}>
                                    Decline & refund order
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}

/* ---------- Menu ---------- */
function ItemForm({ onSave, item }) {
    const editing = !!item;
    const [image, setImage] = useState(item?.image || null);
    const [busy, setBusy] = useState(false);
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm({
        defaultValues: {
            name: item?.name || "",
            price: item?.price || undefined,
            stock: item?.left ?? item?.stock ?? 10,
            cat: item?.cat || CATEGORIES[0],
            desc: item?.desc || "",
        },
    });

    const pickImage = async (e) => {
        try {
            const f = e.target.files?.[0];
            if (!f) return;
            setBusy(true);
            setImage(await fileToWideDataUrl(f, 640));
        } catch (err) {
            setError("root", { message: err.message });
        } finally {
            setBusy(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit((d) => onSave({ ...d, image: image || null }))}
            noValidate
            className="space-y-3"
        >
            <Field
                label="Photo of the food"
                hint="This is what students see on your menu. A clear, well-lit photo sells better."
            >
                <div className="space-y-2">
                    {image ? (
                        <Food meal={{ name: "Dish preview", image }} frame="aspect-[16/10]" className="rounded-xl" />
                    ) : (
                        <div className="grid aspect-[16/10] w-full place-items-center rounded-xl border border-dashed border-line bg-sunken text-center text-xs text-ink-3">
                            No photo yet — students see a placeholder
                        </div>
                    )}
                    <input type="file" accept="image/*" className={fileCls} onChange={pickImage} disabled={busy} />
                    {busy && <p className="text-xs text-ink-3">Preparing the photo…</p>}
                    {image && (
                        <Button size="sm" variant="outline" onClick={() => setImage(null)}>Remove photo</Button>
                    )}
                </div>
            </Field>
            <Field label="Dish name" error={errors.name}>
                <Input invalid={errors.name} placeholder="e.g. Palm nut soup (abenkwan)" {...register("name", { required: "Enter a name" })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Price per portion (GH¢)" error={errors.price}>
                    <Input
                        type="number"
                        step="0.5"
                        invalid={errors.price}
                        {...register("price", {
                            required: "Enter a price",
                            valueAsNumber: true,
                            min: { value: 1, message: "Min GH¢ 1" },
                        })}
                    />
                </Field>
                <Field label="Portions available" error={errors.stock}>
                    <Input
                        type="number"
                        invalid={errors.stock}
                        {...register("stock", {
                            required: true,
                            valueAsNumber: true,
                            min: { value: 0, message: "Min 0" },
                        })}
                    />
                </Field>
            </div>
            <Field label="Kind of dish">
                <Select {...register("cat")}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </Select>
            </Field>
            <Field label="Description" error={errors.desc}>
                <Textarea
                    invalid={errors.desc}
                    placeholder="What is in the pot, how peppery it is, what it goes with."
                    {...register("desc", {
                        required: "Add a short description",
                        minLength: { value: 10, message: "A bit more detail please" },
                    })}
                />
            </Field>
            {errors.root && (
                <p role="alert" className="rounded-lg bg-bad-soft p-3 text-sm font-medium text-bad">{errors.root.message}</p>
            )}
            <Button type="submit" className="w-full" disabled={busy}>
                {editing ? "Save changes" : "Add dish"}
            </Button>
        </form>
    );
}

const MENU_KEY = "stew.kitchen.menu";

function useKitchenMenu(auth) {
    const [items, setItems] = useState(() => {
        const saved = read(MENU_KEY, null);
        const mine = MEALS.filter((m) => m.vendorId === "v1");
        const listed = (auth.user?.sells || []).map((name, i) => ({
            id: "signup-" + i,
            name,
            price: 0,
            left: 0,
            desc: "",
            on: false,
            needsDetails: true,
        }));
        const base = [...listed, ...mine];
        if (!saved) return base;
        const byId = new Map(base.map((x) => [x.id, x]));
        saved.forEach((s) => byId.set(s.id, { ...byId.get(s.id), ...s }));
        const extra = saved.filter((s) => !base.some((b) => b.id === s.id));
        return [...extra, ...[...byId.values()]];
    });
    useEffect(() => { write(MENU_KEY, items) }, [items]);
    return [items, setItems];
}

export function VMenu() {
    const toast = useToast();
    const auth = useAuth();
    const [items, setItems] = useKitchenMenu(auth);
    const [adding, setAdding] = useState(false);
    const [editing, setEditing] = useState(null);

    const save = (d) => {
        setItems((i) => [...i, { id: "n" + Date.now(), ...d, left: d.stock, on: true }]);
        setAdding(false);
        toast("Dish added");
    };
    const saveEdit = (d) => {
        setItems((i) => i.map((x) => (x.id === editing.id ? { ...x, ...d, left: d.stock, needsDetails: false } : x)));
        setEditing(null);
        toast("Dish updated");
    };
    const withoutPhoto = items.filter((m) => !m.image).length;

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-extrabold">What you cook</h1>
                    <p className="mt-1 text-xs text-ink-3">
                        {withoutPhoto > 0
                            ? `${withoutPhoto} dish${withoutPhoto === 1 ? "" : "es"} still need a photo`
                            : "Every dish has a photo"}
                    </p>
                </div>
                <Button onClick={() => setAdding(true)}>Add dish</Button>
            </div>

            <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
                {items.map((m) => (
                    <li key={m.id} className="flex flex-wrap items-center gap-3 p-4">
                        {m.image ? (
                            <Food meal={m} frame="aspect-[4/3]" className="w-20 shrink-0 rounded-xl" />
                        ) : (
                            <button
                                type="button"
                                onClick={() => setEditing(m)}
                                aria-label={`Add a food photo for ${m.name}`}
                                className="shrink-0 rounded-xl focus-visible:ring-2 focus-visible:ring-brand"
                            >
                                <Food
                                    meal={m}
                                    frame="aspect-[4/3]"
                                    className="w-20 border border-dashed border-brand/50 bg-brand-soft"
                                    rounded="rounded-xl"
                                    label="Add photo"
                                />
                            </button>
                        )}
                        <div className="min-w-0 flex-1">
                            <p className="truncate font-bold">{m.name}</p>
                            <p className="text-xs text-ink-3">
                                <Price v={m.price} /> · {m.left} portion{m.left === 1 ? "" : "s"} available
                            </p>
                            {m.needsDetails && (
                                <p className="mt-1 text-[11px] font-semibold text-warn">
                                    Finish this dish: price, description and photo
                                </p>
                            )}
                            <div className="mt-2 flex flex-wrap gap-2">
                                <Button size="sm" variant="outline" onClick={() => setEditing(m)}>
                                    {m.needsDetails ? "Finish dish" : "Edit"}
                                </Button>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <Switch
                                checked={m.on}
                                onChange={(v) => setItems((i) => i.map((x) => (x.id === m.id ? { ...x, on: v } : x)))}
                                label={`${m.name} available`}
                            />
                            <span className="text-[10px] font-semibold text-ink-3">{m.on ? "Cooking" : "Off menu"}</span>
                        </div>
                    </li>
                ))}
            </ul>

            <Modal open={adding} onClose={() => setAdding(false)} title="Add a dish">
                <ItemForm onSave={save} />
            </Modal>
            <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.name}>
                {editing && <ItemForm item={editing} onSave={saveEdit} />}
            </Modal>
        </div>
    );
}

/* ---------- Earnings + escrow ledger ---------- */
export function VEarnings() {
    const max = Math.max(...SALES.map((s) => s.v));
    const total = SALES.reduce((s, x) => s + x.v, 0);
    const ledger = useAsync(() => api.payouts(), []);
    const held = ledger.data?.held ?? 0;
    const released = ledger.data?.released ?? 0;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-extrabold">Earnings</h1>
                <p className="mt-1 text-sm text-ink-2">
                    You keep the full menu price. The {Math.round(FEE_RATE * 100)}% STEW fee is added to the
                    student's total, not taken out of your payout.
                </p>
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
                        <p className="text-xs font-semibold text-brand-strong">Waiting on collection</p>
                        <p className="num mt-1 text-2xl font-extrabold">{money(held)}</p>
                        <p className="mt-1 text-xs text-ink-2">
                            {ledger.data?.heldCount || 0} order{(ledger.data?.heldCount || 0) === 1 ? "" : "s"} paid by
                            students but not yet confirmed as collected. STEW is holding this money for you.
                        </p>
                    </Card>
                    <Card className="border-ok/40 bg-ok-soft">
                        <p className="text-xs font-semibold text-ok">Released to you</p>
                        <p className="num mt-1 text-2xl font-extrabold">{money(released)}</p>
                        <p className="mt-1 text-xs text-ink-2">
                            {ledger.data?.releasedCount || 0} collected order{(ledger.data?.releasedCount || 0) === 1 ? "" : "s"}{" "}
                            confirmed by the student. Paid out to your MoMo number.
                        </p>
                    </Card>
                </div>
            )}

            <Card className="space-y-1 text-sm">
                <p className="font-bold">How your money works</p>
                <p className="text-ink-2">
                    A student pays STEW, not you. We hold it while you cook. When the student confirms
                    they collected the food, we release your share. This protects you too: it is why a
                    student cannot simply claim they never got the food after you handed it over.
                </p>
                <p className="text-xs text-ink-3">
                    If a student has collected but not confirmed, nudge them from the order — you can also
                    contact STEW and we will chase it. {ledger.data?.note}
                </p>
            </Card>

            <p className="text-xs text-ink-3">Sales figures below are sample data.</p>
            <div className="grid gap-3 sm:grid-cols-3">
                <Card><p className="text-xs text-ink-3">This week</p><p className="num text-2xl font-extrabold">{money(total)}</p></Card>
                <Card><p className="text-xs text-ink-3">Best day</p><p className="text-2xl font-extrabold">{SALES.find((s) => s.v === max).d}</p></Card>
                <Card><p className="text-xs text-ink-3">Next payout</p><p className="text-2xl font-extrabold">{held > 0 ? money(held) : "—"}</p></Card>
            </div>
            <Card>
                <h2 className="mb-4 font-bold">Sales by day</h2>
                <div className="flex h-48 items-end gap-3" role="img" aria-label="Bar chart of sales by day">
                    {SALES.map((s) => (
                        <div key={s.d} className="flex flex-1 flex-col items-center gap-1">
                            <span className="num text-[11px] text-ink-3">{s.v}</span>
                            <div className="w-full rounded-t-lg bg-brand" style={{ height: `${(s.v / max) * 100}%` }} />
                            <span className="text-xs font-semibold text-ink-2">{s.d}</span>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}

/* ---------- Kitchen profile ---------- */
export function VKitchen() {
    const toast = useToast();
    const auth = useAuth();
    const [logo, setLogo] = useState(auth.user?.logo || null);
    const [busy, setBusy] = useState(false);
    const {
        register,
        handleSubmit,
        watch,
        setError,
        formState: { errors, isSubmitting },
    } = useForm({
        defaultValues: {
            kitchen: auth.user?.kitchenName || "",
            sells: (auth.user?.sells || []).join(", "),
            hall: auth.user?.area || auth.user?.hall || CAMPUS.areas[0],
            bio: auth.user?.bio || "",
            prep: auth.user?.prep || 6,
            payout: auth.user?.payout || "",
        },
    });
    const kitchenName = watch("kitchen") || "";

    const pickLogo = async (e) => {
        try {
            const f = e.target.files?.[0];
            if (!f) return;
            setBusy(true);
            setLogo(await fileToSquareDataUrl(f, 256));
        } catch (err) {
            setError("root", { message: err.message });
        } finally {
            setBusy(false);
        }
    };

    const save = async (d) => {
        await new Promise((r) => setTimeout(r, 400));
        if (auth.user) {
            auth.updateUser({
                ...auth.user,
                kitchenName: d.kitchen,
                sells: toList(d.sells),
                area: d.hall,
                bio: d.bio,
                prep: d.prep,
                payout: d.payout,
                logo: logo || null,
            });
        }
        toast("Kitchen profile saved");
    };

    return (
        <form onSubmit={handleSubmit(save)} noValidate className="max-w-lg space-y-5">
            <div>
                <h1 className="text-2xl font-extrabold">Kitchen profile</h1>
                <p className="mt-1 text-sm text-ink-2">This is what students see when they open your kitchen.</p>
            </div>

            <Card className="space-y-4">
                <div className="flex items-center gap-4">
                    <KitchenLogo
                        vendor={{ name: kitchenName || auth.user?.kitchenName, logo }}
                        size="h-20 w-20"
                        className="rounded-2xl"
                        text="text-2xl"
                    />
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">Kitchen logo</p>
                        <p className="text-xs text-ink-3">
                            Add a photo of your kitchen or your own logo. Without one we show your kitchen initials.
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <input type="file" accept="image/*" className={fileCls} onChange={pickLogo} disabled={busy} />
                            {logo && <Button size="sm" variant="outline" onClick={() => setLogo(null)}>Remove logo</Button>}
                        </div>
                    </div>
                </div>

                <Field label="Kitchen name" error={errors.kitchen}>
                    <Input invalid={errors.kitchen} {...register("kitchen", { required: "Enter a kitchen name", minLength: { value: 3, message: "Too short" } })} />
                </Field>
                <Field label="What do you cook?" error={errors.sells} hint="Your own dishes, separated by commas">
                    <Input
                        invalid={errors.sells}
                        placeholder="Palm nut soup, Groundnut soup, Fufu"
                        {...register("sells", { validate: (v) => toList(v).length > 0 || "Add at least one dish" })}
                    />
                </Field>
                <Field label="About your pot" error={errors.bio} hint="Shown on your kitchen page">
                    <Textarea
                        invalid={errors.bio}
                        maxLength={240}
                        placeholder="One pot of soup a week. Palm nut, groundnut and light soup, cooked slow."
                        {...register("bio", { maxLength: { value: 240, message: "Max 240 characters" } })}
                    />
                </Field>
                <Field label="Where do you cook from?">
                    <Select {...register("hall")}>
                        {CAMPUS.areas.map((h) => <option key={h}>{h}</option>)}
                    </Select>
                </Field>
                <Field label="Days you need to cook a batch" error={errors.prep} hint="Roughly how long a pot takes you">
                    <Input
                        type="number"
                        invalid={errors.prep}
                        {...register("prep", {
                            valueAsNumber: true,
                            min: { value: 1, message: "Min 1" },
                            max: { value: 30, message: "Max 30" },
                        })}
                    />
                </Field>
            </Card>

            {errors.root && (
                <p role="alert" className="rounded-lg bg-bad-soft p-3 text-sm font-medium text-bad">{errors.root.message}</p>
            )}
            <Button type="submit" loading={isSubmitting}>Save kitchen profile</Button>
        </form>
    );
}

/* ---------- Settings ---------- */
export function VSettings() {
    const toast = useToast();
    const auth = useAuth();
    const nav = useNavigate();
    const [askDelete, setAskDelete] = useState(false);
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({ defaultValues: { payout: auth.user?.payout || "" } });
    const [notify, setNotify] = useState(true);

    const handleDelete = async () => {
        setAskDelete(false);
        await auth.deleteAccount();
        toast("Your kitchen account has been deleted");
        nav("/app/signup");
    };

    return (
        <div className="max-w-lg space-y-6">
            <form
                onSubmit={handleSubmit(async (d) => {
                    await new Promise((r) => setTimeout(r, 400));
                    if (auth.user) auth.updateUser({ ...auth.user, payout: d.payout, notifyOrders: notify });
                    toast("Settings saved");
                })}
                noValidate
                className="space-y-5"
            >
                <div>
                    <h1 className="text-2xl font-extrabold">Settings</h1>
                    <p className="mt-1 text-sm text-ink-2">
                        Payouts and alerts. Your public kitchen profile lives under Kitchen.
                    </p>
                </div>
                <Card className="space-y-4">
                    <Field
                        label="Payout MoMo number"
                        error={errors.payout}
                        hint={`Where we send your earnings. You keep the full menu price; the ${Math.round(FEE_RATE * 100)}% STEW fee is added to the student's total.`}
                    >
                        <Input
                            type="tel"
                            invalid={errors.payout}
                            {...register("payout", {
                                required: "Required",
                                setValueAs: (v) => v.replace(/\s/g, ""),
                                pattern: { value: CAMPUS.phoneRe, message: "Enter a valid Ghana mobile number" },
                            })}
                        />
                    </Field>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold">New order notifications</p>
                            <p className="text-xs text-ink-3">Get told the moment an order lands.</p>
                        </div>
                        <Switch checked={notify} onChange={setNotify} label="Notifications" />
                    </div>
                </Card>
                <Button type="submit" loading={isSubmitting}>Save changes</Button>
            </form>

            <Card className="border-bad/30 bg-bad-soft/20 p-4 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-bad">Danger zone</p>
                <p className="text-xs text-ink-2">Permanently close your kitchen and delete your vendor account and menu listings.</p>
                <Button variant="danger" size="sm" className="mt-1" onClick={() => setAskDelete(true)}>
                    <Trash2 className="h-4 w-4" />Delete kitchen account
                </Button>
            </Card>

            <ConfirmDialog
                open={askDelete}
                onClose={() => setAskDelete(false)}
                onConfirm={handleDelete}
                title="Delete your kitchen account?"
                confirmLabel="Yes, delete my kitchen"
            >
                <p className="text-sm text-ink-2">
                    This will permanently close your kitchen, remove your active dishes, and delete your vendor account from STEW. This action cannot be undone.
                </p>
            </ConfirmDialog>
        </div>
    );
}
