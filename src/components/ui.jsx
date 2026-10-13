import { forwardRef, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
    Check,
    ChevronDown,
    Eye,
    EyeOff,
    LoaderCircle,
    Minus,
    Moon,
    Plus,
    SearchX,
    ShieldCheck,
    Sun,
    ThumbsUp,
    TriangleAlert,
    UtensilsCrossed,
    X,
} from "lucide-react";
import { cx, money } from "../lib/utils";
import { imageFor } from "../lib/images";
import { initials } from "../lib/upload";
import { useTheme } from "../context/Providers";

export function Logo({ className = "", word = true }) {
    return (
        <span className={cx("inline-flex items-center gap-2", className)}>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-on-brand">
                <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <path d="M4 11h16a1 1 0 0 1 1 1v1a7 7 0 0 1-7 7H10a7 7 0 0 1-7-7v-1a1 1 0 0 1 1-1Z" />
                    <path d="M7 4c0 1.5 1.5 2 1.5 3" />
                    <path d="M12 3c0 1.5 1.5 2 1.5 3" />
                    <path d="M17 4c0 1.5 1.5 2 1.5 3" />
                </svg>
            </span>
            {word && (
                <span className="text-xl font-extrabold tracking-tight text-ink">
                    STEW
                </span>
            )}
        </span>
    );
}

const V = {
    primary:
        "bg-brand text-on-brand hover:brightness-95 active:brightness-90 shadow-sm hover:shadow",
    soft: "bg-brand-soft text-brand-strong hover:brightness-95",
    outline: "border border-line bg-surface text-ink hover:bg-sunken shadow-sm",
    danger: "bg-bad text-on-solid hover:brightness-95 shadow-sm",
    ghost: "text-ink-2 hover:bg-sunken",
};

const S = {
    md: "h-11 px-5 text-sm",
    sm: "h-9 px-3.5 text-xs",
    lg: "h-13 px-7 text-base",
};

export function Button({
    variant = "primary",
    size = "md",
    to,
    href,
    loading,
    disabled,
    className = "",
    children,
    ...p
}) {
    const c = cx(
        "inline-flex items-center justify-center gap-2 rounded-full font-bold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        V[variant],
        S[size],
        className
    );
    if (to)
        return (
            <Link to={to} className={c} {...p}>
                {children}
            </Link>
        );
    if (href)
        return (
            <a href={href} className={c} {...p}>
                {children}
            </a>
        );
    return (
        <button
            type="button"
            className={c}
            disabled={disabled || loading}
            {...p}
        >
            {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
}

export function Field({ label, error, hint, children }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink-2">
                {label}
            </span>
            {children}
            {hint && !error && (
                <span className="mt-1 block text-xs text-ink-3">{hint}</span>
            )}
            {error && (
                <span
                    role="alert"
                    className="mt-1 block text-xs font-medium text-bad"
                >
                    {error.message || error}
                </span>
            )}
        </label>
    );
}

const base =
    "w-full rounded-2xl border bg-surface px-4 text-sm text-ink placeholder:text-ink-3 transition focus:outline-none focus:ring-2 focus:ring-brand/30";

const st = (e) =>
    e ? "border-bad focus:border-bad" : "border-line/70 focus:border-brand";

export const Input = forwardRef(
    ({ invalid, className = "", type, ...p }, ref) => {
        const [showPassword, setShowPassword] = useState(false);

        if (type === "password") {
            return (
                <div className="relative w-full">
                    <input
                        ref={ref}
                        type={showPassword ? "text" : "password"}
                        aria-invalid={!!invalid}
                        className={cx(
                            base,
                            st(invalid),
                            "h-11 pr-11",
                            className
                        )}
                        {...p}
                    />
                    <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink-3 hover:text-ink focus:outline-none"
                        aria-label={
                            showPassword ? "Hide password" : "Show password"
                        }
                        title={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </button>
                </div>
            );
        }

        return (
            <input
                ref={ref}
                type={type}
                aria-invalid={!!invalid}
                className={cx(base, st(invalid), "h-11", className)}
                {...p}
            />
        );
    }
);

export const PasswordInput = Input;

export const Select = forwardRef(
    ({ invalid, className = "", children, wrapperClassName = "", ...p }, ref) => {
        const isAuto = className.includes("w-auto") || className.includes("!w-auto");
        return (
            <div className={cx("relative", isAuto ? "inline-block w-auto" : "w-full", wrapperClassName)}>
                <select
                    ref={ref}
                    aria-invalid={!!invalid}
                    className={cx(
                        base,
                        st(invalid),
                        "h-11 pr-10 appearance-none cursor-pointer bg-surface text-ink font-semibold dark:bg-[#141518] dark:text-white",
                        className
                    )}
                    {...p}
                >
                    {children}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-3" />
            </div>
        );
    }
);

export const Textarea = forwardRef(({ invalid, className = "", ...p }, ref) => (
    <textarea
        ref={ref}
        aria-invalid={!!invalid}
        className={cx(
            base,
            st(invalid),
            "min-h-24 rounded-2xl py-3",
            className
        )}
        {...p}
    />
));

const BT = {
    brand: "bg-brand-soft text-brand-strong",
    ok: "bg-ok-soft text-ok",
    warn: "bg-warn-soft text-warn",
    bad: "bg-bad-soft text-bad",
    mute: "bg-sunken text-ink-2",
};

export const Badge = ({ tone = "mute", className = "", children }) => (
    <span
        className={cx(
            "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold shadow-xs",
            BT[tone],
            className
        )}
    >
        {children}
    </span>
);

export const Verified = () => (
    <Badge tone="ok">
        <ShieldCheck className="h-3 w-3" />
        Verified KNUST chef
    </Badge>
);

export const Card = ({ className = "", ...p }) => (
    <div
        className={cx(
            "rounded-3xl border border-line/70 bg-surface p-5 shadow-sm transition-shadow",
            className
        )}
        {...p}
    />
);

export const Skeleton = ({ className = "" }) => (
    <div className={cx("animate-pulse rounded-2xl bg-sunken", className)} />
);

export const Price = ({ v, className = "" }) => (
    <span className={cx("num whitespace-nowrap font-extrabold", className)}>
        {money(v)}
    </span>
);

export const Chip = ({ active, className = "", ...p }) => (
    <button
        type="button"
        aria-pressed={!!active}
        className={cx(
            "shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold transition shadow-xs",
            active
                ? "border-brand bg-brand text-on-brand shadow-sm"
                : "border-line/70 bg-surface text-ink-2 hover:bg-sunken",
            className
        )}
        {...p}
    />
);

export function EmptyState({ icon: Icon = SearchX, title, text, action }) {
    return (
        <div className="grid place-items-center rounded-2xl border border-dashed border-line px-6 py-12 text-center">
            <span className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-brand-strong">
                <Icon className="h-6 w-6" />
            </span>
            <h3 className="text-lg font-bold">{title}</h3>
            {text && <p className="mt-1 max-w-sm text-sm text-ink-2">{text}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

export function ErrorState({ message = "Something went wrong.", onRetry }) {
    return (
        <div className="grid place-items-center rounded-2xl border border-line bg-bad-soft px-6 py-10 text-center">
            <TriangleAlert className="mb-2 h-8 w-8 text-bad" />
            <p className="font-bold text-bad">{message}</p>
            <p className="mt-1 text-sm text-ink-2">
                Check your connection and try again.
            </p>
            {onRetry && (
                <Button variant="outline" className="mt-4" onClick={onRetry}>
                    Retry
                </Button>
            )}
        </div>
    );
}

export function Stars({ value = 0, onChange, size = "h-5 w-5" }) {
    return (
        <div
            className="inline-flex items-center gap-1.5"
            role={onChange ? "radiogroup" : "img"}
            aria-label={`${value} out of 5 rating`}
        >
            {[1, 2, 3, 4, 5].map((n) => {
                const active = n <= Math.round(value);
                return onChange ? (
                    <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={value === n}
                        aria-label={`${n} out of 5`}
                        onClick={() => onChange(n)}
                        className={cx(
                            "flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-black transition-all active:scale-95",
                            active
                                ? "bg-brand text-on-brand shadow-xs"
                                : "bg-sunken text-ink-3 hover:bg-line"
                        )}
                    >
                        <ThumbsUp className="h-3.5 w-3.5" />
                        <span>{n}</span>
                    </button>
                ) : (
                    <span
                        key={n}
                        className={cx(
                            "inline-flex items-center",
                            active ? "text-brand-strong" : "text-ink-3/30"
                        )}
                    >
                        <ThumbsUp
                            className={cx(size, active && "fill-current")}
                        />
                    </span>
                );
            })}
        </div>
    );
}

export function Stepper({ steps, current }) {
    return (
        <ol className="flex items-start">
            {steps.map((s, i) => (
                <li
                    key={s}
                    className="flex flex-1 flex-col items-center text-center"
                >
                    <div className="flex w-full items-center">
                        <span
                            className={cx(
                                "h-1 flex-1",
                                i === 0
                                    ? "opacity-0"
                                    : i <= current
                                      ? "bg-ok"
                                      : "bg-line"
                            )}
                        />
                        <span
                            className={cx(
                                "grid h-7 w-7 place-items-center rounded-full text-xs font-bold",
                                i <= current
                                    ? "bg-ok text-on-solid"
                                    : "bg-sunken text-ink-3"
                            )}
                        >
                            {i < current ? (
                                <Check className="h-4 w-4" />
                            ) : (
                                i + 1
                            )}
                        </span>
                        <span
                            className={cx(
                                "h-1 flex-1",
                                i === steps.length - 1
                                    ? "opacity-0"
                                    : i < current
                                      ? "bg-ok"
                                      : "bg-line"
                            )}
                        />
                    </div>
                    <span
                        className={cx(
                            "mt-2 px-1 text-[11px] font-semibold",
                            i <= current ? "text-ink" : "text-ink-3"
                        )}
                    >
                        {s}
                    </span>
                </li>
            ))}
        </ol>
    );
}

export function Qty({
    value,
    onChange,
    min = 0,
    max = Infinity,
    className = "",
}) {
    return (
        <div
            className={cx(
                "inline-flex items-center gap-2.5 rounded-full border border-line/70 bg-sunken px-2 py-1 shadow-sm",
                className
            )}
        >
            <button
                type="button"
                aria-label="Decrease quantity"
                className="grid h-8 w-8 place-items-center rounded-full bg-surface text-ink shadow-xs transition hover:bg-line active:scale-95 disabled:opacity-40"
                disabled={value <= min}
                onClick={() => onChange(value - 1)}
            >
                <Minus className="h-3.5 w-3.5" />
            </button>
            <span
                className="num min-w-6 text-center text-sm font-extrabold text-ink"
                aria-live="polite"
            >
                {String(value).padStart(2, "0")}
            </span>
            <button
                type="button"
                aria-label="Increase quantity"
                className="grid h-8 w-8 place-items-center rounded-full bg-ink text-surface dark:bg-brand dark:text-on-brand shadow-xs transition hover:opacity-90 active:scale-95 disabled:opacity-40"
                disabled={value >= max}
                onClick={() => onChange(value + 1)}
            >
                <Plus className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}

export function Switch({ checked, onChange, label }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            onClick={() => onChange(!checked)}
            className={cx(
                "relative h-7 w-12 shrink-0 rounded-full transition",
                checked ? "bg-brand" : "bg-line"
            )}
        >
            <span
                className={cx(
                    "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all",
                    checked ? "left-6" : "left-1"
                )}
            />
        </button>
    );
}

export function Modal({ open, onClose, title, children, footer }) {
    const ref = useRef(null);
    useEffect(() => {
        if (!open) return;
        const prev = document.activeElement;
        const onKey = (e) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        const prevBody = document.body.style.overflow;
        const prevHtml = document.documentElement.style.overflow;
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
        ref.current?.focus();
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prevBody;
            document.documentElement.style.overflow = prevHtml;
            prev?.focus?.();
        };
    }, [open, onClose]);
    if (!open) return null;
    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs overscroll-contain sm:items-center sm:p-4"
            style={{ touchAction: "none" }}
            onMouseDown={(e) => e.target === e.currentTarget && onClose()}
            onTouchMove={(e) => e.target === e.currentTarget && e.preventDefault()}
        >
            <div
                ref={ref}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                style={{ touchAction: "pan-y" }}
                className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-line bg-surface p-5 shadow-2xl outline-none sm:rounded-3xl"
            >
                <div className="mb-3 flex items-start justify-between gap-3">
                    <h2 className="text-lg font-extrabold">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg hover:bg-sunken"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                {children}
                {footer && (
                    <div className="mt-5 flex flex-wrap justify-end gap-2">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

export function ThemeToggle() {
    const { dark, setMode } = useTheme();
    return (
        <button
            type="button"
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => setMode(dark ? "light" : "dark")}
            className="grid h-10 w-10 place-items-center rounded-full border border-line text-ink-2 hover:bg-sunken"
        >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
    );
}

// Confirm before an action that is annoying to undo (logging out, cancelling an order).
export function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title,
    children,
    confirmLabel = "Confirm",
    busy,
}) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title={title}
            footer={
                <>
                    <Button
                        variant="outline"
                        onClick={onClose}
                    >{`Go back`}</Button>
                    <Button variant="danger" loading={busy} onClick={onConfirm}>
                        {confirmLabel}
                    </Button>
                </>
            }
        >
            {children}
        </Modal>
    );
}

// Real photo for a dish. When there is no photo we show a neutral plate placeholder rather
// than an emoji, so a missing photo reads as "missing" instead of looking intentional.
//
// `frame` sets the predictable box shape (an aspect ratio) so grids line up. `className`
// sizes that box, e.g. className="w-24" with frame="aspect-[4/3]". Leave frame="" and the
// caller owns the whole box, which is what a fixed h-24 or h-12 thumbnail needs.
// Pass frame="" to let the caller size it.
export function Food({
    meal,
    frame = "aspect-[16/10]",
    className = "",
    rounded = "",
    label = "No photo yet",
}) {
    const src = meal?.image || imageFor(meal?.id);
    if (!src) {
        return (
            <div
                className={cx(
                    "grid place-items-center bg-sunken",
                    frame,
                    className,
                    rounded
                )}
                role="img"
                aria-label={label}
            >
                <span className="flex flex-col items-center gap-1 px-2 text-center text-ink-3">
                    <UtensilsCrossed className="h-4 w-4" aria-hidden="true" />
                    <span className="text-[10px] font-semibold leading-tight">
                        {label}
                    </span>
                </span>
            </div>
        );
    }
    return (
        <span
            className={cx(
                "block overflow-hidden bg-sunken",
                frame,
                className,
                rounded
            )}
        >
            <img
                src={src}
                alt={meal?.name || "Dish"}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
            />
        </span>
    );
}

// A kitchen's identity mark. Uses the uploaded logo when the chef added one, otherwise
// falls back to the kitchen's initials on the brand colour -- never an emoji.
export function KitchenLogo({
    vendor,
    size = "h-14 w-14",
    className = "",
    text = "text-lg",
}) {
    const name = vendor?.name || vendor?.kitchenName || "Kitchen";
    const src = vendor?.logo;
    return (
        <span
            className={cx(
                "grid shrink-0 place-items-center overflow-hidden rounded-xl bg-brand text-on-brand",
                size,
                className
            )}
            aria-hidden="true"
        >
            {src ? (
                <img src={src} alt="" className="h-full w-full object-cover" />
            ) : (
                <span className={cx("font-extrabold tracking-tight", text)}>
                    {initials(name)}
                </span>
            )}
        </span>
    );
}
