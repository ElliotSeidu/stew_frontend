import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    ChevronLeft,
    Clock,
    Flame,
    Heart,
    MapPin,
    Share2,
    ThumbsUp,
} from "lucide-react";
import {
    Badge,
    Button,
    Food,
    Input,
    KitchenLogo,
    Modal,
    Price,
    Qty,
    Verified,
} from "./ui";
import { useCart, useFavs, useToast } from "../context/Providers";
import { track } from "../lib/analytics";
import { cx, money } from "../lib/utils";

export function MealDetailModal({ meal, open, onClose, onAdd }) {
    const [qty, setQty] = useState(1);
    const [note, setNote] = useState("");
    const { isFav, toggle } = useFavs();
    const toast = useToast();

    useEffect(() => {
        if (open) {
            const prev = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = prev;
            };
        }
    }, [open]);

    if (!meal || !open) return null;
    const key = "m:" + meal.id;
    const out = meal.left === 0;
    const closed = !meal.open;

    const share = () => {
        if (navigator.share) {
            navigator
                .share({
                    title: meal.name,
                    text: `Check out ${meal.name} on STEW`,
                    url: window.location.href,
                })
                .catch(() => {});
        } else {
            navigator.clipboard?.writeText(window.location.href);
            toast("Link copied to clipboard");
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs overscroll-contain sm:items-center sm:p-4"
            onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label={meal.name}
                className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[2.5rem] border border-line/80 bg-surface shadow-2xl overscroll-contain sm:rounded-[2.5rem]"
            >
                {/* Top bar matching Screen 3 in insp.webp */}
                <div className="flex items-center justify-between px-6 pt-5 pb-3">
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Back"
                        className="grid h-10 w-10 place-items-center rounded-full bg-sunken text-ink transition hover:bg-line active:scale-95"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="text-base font-extrabold text-ink">
                        Details
                    </span>
                    <button
                        type="button"
                        onClick={share}
                        aria-label="Share"
                        className="grid h-10 w-10 place-items-center rounded-full bg-sunken text-ink transition hover:bg-line active:scale-95"
                    >
                        <Share2 className="h-4 w-4" />
                    </button>
                </div>

                {/* Scrollable details */}
                <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4">
                    {/* Large Hero Card for Food */}
                    <div className="relative overflow-hidden rounded-3xl bg-sunken aspect-[16/11] border border-line/60">
                        <Food
                            meal={meal}
                            frame=""
                            className="h-full w-full object-cover"
                        />
                        {meal.left > 0 && meal.left <= 5 && (
                            <Badge
                                tone="warn"
                                className="absolute left-3 top-3"
                            >
                                {meal.left} left
                            </Badge>
                        )}
                        {out && (
                            <Badge tone="bad" className="absolute left-3 top-3">
                                Sold out
                            </Badge>
                        )}
                    </div>

                    {/* Title & Price Row */}
                    <div className="flex items-start justify-between gap-3 pt-1">
                        <div className="min-w-0">
                            <h2 className="text-2xl font-black text-ink">
                                {meal.name}
                            </h2>
                            <p className="mt-1 text-sm font-bold text-ink-2">
                                From:{" "}
                                <span className="text-brand-strong">
                                    {money(meal.price)}
                                </span>
                            </p>
                            <Link
                                to={`/app/vendors/${meal.vendorId}`}
                                className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-3 hover:text-brand-strong hover:underline"
                            >
                                <MapPin className="h-3.5 w-3.5" />
                                <span>
                                    {meal.vendorName} · {meal.hall}
                                </span>
                            </Link>
                        </div>
                        <button
                            type="button"
                            onClick={() => toggle(key)}
                            aria-label={
                                isFav(key) ? "Remove favorite" : "Add favorite"
                            }
                            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sunken shadow-xs transition hover:bg-line active:scale-95"
                        >
                            <Heart
                                className={cx(
                                    "h-5 w-5",
                                    isFav(key)
                                        ? "fill-bad text-bad"
                                        : "text-ink-3"
                                )}
                            />
                        </button>
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center justify-around rounded-2xl bg-sunken/80 px-4 py-3 text-xs font-bold text-ink-2">
                        <span className="flex items-center gap-1.5 text-ink">
                            <ThumbsUp className="h-3.5 w-3.5 text-brand-strong" />
                            <span>{meal.rating || 4.8}</span>
                        </span>
                        <span className="h-4 w-px bg-line" />
                        <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-brand-strong" />
                            <span>Weekly batch</span>
                        </span>
                        <span className="h-4 w-px bg-line" />
                        <span className="flex items-center gap-1">
                            <Flame className="h-4 w-4 text-warn" />
                            <span>{meal.portion || "~380 kcal"}</span>
                        </span>
                    </div>

                    {/* Description */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-3">
                            Description
                        </h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
                            {meal.desc ||
                                "Authentic homemade Ghanaian pot prepared fresh for weekly batch pickup."}
                        </p>
                    </div>

                    {/* Special notes */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-ink-3">
                            Special instructions (optional)
                            <Input
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                maxLength={80}
                                placeholder="e.g. Less pepper, no wele, etc."
                                className="mt-1.5 text-xs"
                            />
                        </label>
                    </div>
                </div>

                {/* Bottom bar matching Screen 3 in insp.webp */}
                <div className="flex items-center gap-3 border-t border-line/80 bg-surface px-6 py-4">
                    <Qty
                        value={qty}
                        onChange={setQty}
                        min={1}
                        max={meal.left ?? Infinity}
                    />
                    <Button
                        size="lg"
                        className="flex-1 text-sm font-extrabold"
                        disabled={out || closed}
                        onClick={() => onAdd(meal, qty, note)}
                    >
                        {closed
                            ? "Kitchen Closed"
                            : out
                              ? "Sold Out"
                              : `Add to Tray · ${money(meal.price * qty)}`}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export function MealCard({ meal, onAdd, onOpenDetail, className = "" }) {
    const { isFav, toggle } = useFavs();
    const key = "m:" + meal.id;
    const out = meal.left === 0;
    const closed = !meal.open;

    const handleCardClick = () => {
        if (onOpenDetail) onOpenDetail(meal);
    };

    return (
        <article
            onClick={handleCardClick}
            className={cx(
                "group relative flex flex-col rounded-3xl border border-line/70 bg-surface/90 p-2.5 sm:p-3.5 shadow-xs transition-all duration-300 hover:border-brand/40 hover:bg-surface hover:shadow-md cursor-pointer",
                className
            )}
        >
            {/* Food Visual with floating favorite and status badge */}
            <div className="relative overflow-hidden rounded-2xl bg-sunken aspect-[4/3] w-full flex items-center justify-center">
                <Food
                    meal={meal}
                    frame=""
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Floating Favorite Button on Image */}
                <button
                    type="button"
                    aria-pressed={isFav(key)}
                    aria-label={
                        isFav(key)
                            ? "Remove from favorites"
                            : "Add to favorites"
                    }
                    onClick={(e) => {
                        e.stopPropagation();
                        toggle(key);
                    }}
                    className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-surface/85 backdrop-blur-md shadow-xs transition hover:scale-110 active:scale-90 text-ink"
                >
                    <Heart
                        className={cx(
                            "h-4 w-4",
                            isFav(key) ? "fill-bad text-bad" : "text-ink-3"
                        )}
                    />
                </button>

                {/* Badges */}
                {meal.left > 0 && meal.left <= 5 && (
                    <Badge
                        tone="warn"
                        className="absolute left-2 bottom-2 text-[10px] !py-0.5 !px-2 backdrop-blur-xs"
                    >
                        {meal.left} left
                    </Badge>
                )}
                {out && (
                    <Badge
                        tone="bad"
                        className="absolute left-2 bottom-2 text-[10px] !py-0.5 !px-2 backdrop-blur-xs"
                    >
                        Sold out
                    </Badge>
                )}
            </div>

            {/* Content Section below image */}
            <div className="pt-2.5 px-0.5 flex-1 flex flex-col justify-between space-y-1">
                <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-ink line-clamp-1 group-hover:text-brand-strong transition-colors leading-snug">
                        {meal.name}
                    </h3>
                    <div className="mt-1 flex items-center justify-between text-[11px] font-semibold text-ink-3">
                        <span className="truncate max-w-[85px] sm:max-w-[120px]">
                            {meal.vendorName}
                        </span>
                        <span className="flex items-center gap-0.5 text-ink-2 font-bold shrink-0">
                            <ThumbsUp className="h-3 w-3 text-brand-strong" />
                            <span>{meal.rating || 4.8}</span>
                        </span>
                    </div>
                </div>

                {/* Bottom Price & Add Action Row */}
                <div className="mt-2.5 flex items-center justify-between gap-1 border-t border-line/60 pt-2">
                    <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-3 block leading-none">
                            Price
                        </span>
                        <Price
                            v={meal.price}
                            className="text-sm sm:text-base font-black text-ink leading-tight"
                        />
                    </div>
                    <Button
                        size="sm"
                        className="!h-8 !px-3.5 text-xs font-black !rounded-full shadow-xs shrink-0"
                        disabled={out || closed}
                        onClick={(e) => {
                            e.stopPropagation();
                            onAdd(meal);
                        }}
                    >
                        {closed ? "Closed" : out ? "Out" : "Add"}
                    </Button>
                </div>
            </div>
        </article>
    );
}

export function VendorCard({ vendor }) {
    const { isFav, toggle } = useFavs();
    return (
        <div className="relative rounded-3xl border border-line/70 bg-surface/90 p-4 shadow-xs transition-all hover:border-brand/40 hover:bg-surface hover:shadow-md group">
            <Link
                to={`/app/vendors/${vendor.id}`}
                className="flex items-center gap-3.5"
            >
                <KitchenLogo
                    vendor={vendor}
                    size="h-14 w-14"
                    className="rounded-2xl shadow-xs transition-transform group-hover:scale-105"
                />
                <span className="min-w-0 flex-1">
                    <span className="block truncate font-extrabold text-sm sm:text-base text-ink group-hover:text-brand-strong transition-colors">
                        {vendor.name}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-ink-2">
                        <MapPin className="h-3 w-3 text-brand-strong" />
                        {vendor.hall}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-brand-strong">
                            <ThumbsUp className="h-3 w-3" />
                            {vendor.rating}
                        </span>
                        <Badge tone={vendor.open ? "ok" : "mute"}>
                            {vendor.open ? "Cooking now" : "Closed"}
                        </Badge>
                    </span>
                </span>
            </Link>
            <button
                type="button"
                aria-pressed={isFav("v:" + vendor.id)}
                aria-label="Favorite kitchen"
                onClick={() => toggle("v:" + vendor.id)}
                className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-surface shadow-xs transition hover:scale-105 active:scale-95"
            >
                <Heart
                    className={cx(
                        "h-4 w-4",
                        isFav("v:" + vendor.id)
                            ? "fill-bad text-bad"
                            : "text-ink-3"
                    )}
                />
            </button>
        </div>
    );
}

export function MealCardSkeleton({ className = "" }) {
    return (
        <div
            className={cx(
                "flex flex-col rounded-3xl border border-line/70 bg-surface p-2.5 sm:p-3.5 shadow-xs space-y-2.5",
                className
            )}
        >
            <div className="aspect-[4/3] w-full animate-pulse rounded-2xl bg-sunken" />
            <div className="space-y-1.5 px-0.5">
                <div className="h-4 w-3/4 animate-pulse rounded-full bg-sunken" />
                <div className="flex justify-between items-center">
                    <div className="h-3 w-1/3 animate-pulse rounded-full bg-sunken" />
                    <div className="h-3 w-10 animate-pulse rounded-full bg-sunken" />
                </div>
            </div>
            <div className="mt-auto flex items-center justify-between border-t border-line/60 pt-2 px-0.5">
                <div className="h-4 w-14 animate-pulse rounded-full bg-sunken" />
                <div className="h-8 w-14 animate-pulse rounded-full bg-sunken" />
            </div>
        </div>
    );
}

export function VendorCardSkeleton({ className = "" }) {
    return (
        <div
            className={cx(
                "flex items-center gap-3.5 rounded-3xl border border-line/70 bg-surface p-4 shadow-xs",
                className
            )}
        >
            <div className="h-14 w-14 shrink-0 animate-pulse rounded-2xl bg-sunken" />
            <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-sunken" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-sunken" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-sunken" />
            </div>
        </div>
    );
}

export function OrderCardSkeleton({ className = "" }) {
    return (
        <div
            className={cx(
                "rounded-3xl border border-line/70 bg-surface p-5 space-y-3 shadow-xs",
                className
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="h-4 w-20 animate-pulse rounded bg-sunken" />
                <div className="flex gap-1.5">
                    <div className="h-5 w-16 animate-pulse rounded-full bg-sunken" />
                    <div className="h-5 w-24 animate-pulse rounded-full bg-sunken" />
                </div>
            </div>
            <div className="h-4 w-1/2 animate-pulse rounded bg-sunken" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-sunken" />
            <div className="flex items-center justify-between border-t border-line/70 pt-2">
                <div className="h-3 w-28 animate-pulse rounded bg-sunken" />
                <div className="h-4 w-16 animate-pulse rounded bg-sunken" />
            </div>
        </div>
    );
}

export { Verified };

// Add-to-tray with the "one kitchen per tray" conflict dialog and meal detail modal
export function useTray() {
    const cart = useCart();
    const toast = useToast();
    const [pending, setPending] = useState(null);
    const [detailMeal, setDetailMeal] = useState(null);

    const add = (meal, qty = 1, note = "") => {
        if (cart.add(meal, qty, note) === "conflict")
            setPending({ meal, qty, note });
        else {
            toast(`${meal.name} added to tray`);
            track("add_to_tray");
        }
    };

    const openDetail = (meal) => setDetailMeal(meal);

    const modal = (
        <>
            <Modal
                open={!!pending}
                onClose={() => setPending(null)}
                title="Start a new tray?"
                footer={
                    <>
                        <Button
                            variant="outline"
                            onClick={() => setPending(null)}
                        >
                            Keep current tray
                        </Button>
                        <Button
                            onClick={() => {
                                cart.replace(
                                    pending.meal,
                                    pending.qty,
                                    pending.note
                                );
                                toast("New tray started");
                                setPending(null);
                            }}
                        >
                            Start new tray
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-ink-2">
                    Your tray has food from{" "}
                    <strong className="text-ink">{cart.vendorName}</strong>. A
                    tray can hold one kitchen's food at a time, so we can hand
                    it over together. Start a new tray with{" "}
                    <strong className="text-ink">
                        {pending?.meal.vendorName}
                    </strong>
                    ?
                </p>
            </Modal>

            {detailMeal && (
                <MealDetailModal
                    meal={detailMeal}
                    open={!!detailMeal}
                    onClose={() => setDetailMeal(null)}
                    onAdd={(m, qty, note) => {
                        add(m, qty, note);
                        setDetailMeal(null);
                    }}
                />
            )}
        </>
    );
    return { add, openDetail, modal };
}
