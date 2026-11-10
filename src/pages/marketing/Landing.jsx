import { useRef, useState } from "react";
import {
    ArrowRight,
    BadgeCheck,
    Bell,
    Check,
    ChefHat,
    Clock,
    Download,
    Flame,
    Mail,
    MapPin,
    Search,
    ShieldCheck,
    Smartphone,
    Wallet,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "../../components/Site";
import { Button, Food } from "../../components/ui";
import { CAMPUS } from "../../config";
import { api } from "../../lib/api";
import { useAsync, useInstall } from "../../lib/hooks";
import { money } from "../../lib/utils";

const HERO_VISUALS = [
    { name: "Palm nut soup", image: "/foods/palm-nut-soup.jpg" },
    { name: "Groundnut soup", image: "/foods/groundnut-soup.jpg" },
    { name: "Light soup", image: "/foods/light-soup.jpg" },
    { name: "Chicken stew", image: "/foods/chicken-stew.jpg" },
];

const STEPS = [
    {
        icon: Mail,
        t: "Sign up with your KNUST email",
        d: `Verify with a code sent to your ${CAMPUS.emailDomain} inbox. Only real KNUST students get in.`,
    },
    {
        icon: Search,
        t: "See what's cooking",
        d: "Browse the pots cooking this week. Every dish says how many portions are left.",
    },
    {
        icon: Wallet,
        t: "Pay with Mobile Money",
        d: "Approve the prompt on MTN MoMo, Telecel Cash or AT Money.",
    },
    {
        icon: MapPin,
        t: "Collect on your pickup day",
        d: "Follow your pot from shopping to cooked, then collect it on the day you chose.",
    },
];

const FEATURES = [
    {
        icon: Flame,
        t: "Soups, stews and swallows",
        d: "Your chef needs about a week to shop and cook a proper pot. Pick your collection day at checkout.",
    },
    {
        icon: BadgeCheck,
        t: "Verified student chefs",
        d: "Every kitchen is a KNUST student, reviewed before they can sell.",
    },
    {
        icon: MapPin,
        t: "Pickup Locations",
        d: "Choose your location on campus and pickup. No more guessing where to meet.",
    },
    {
        icon: Wallet,
        t: "MoMo payments",
        d: "Pay the way you already do. Prices and fees are shown in GH¢ before you confirm.",
    },
    {
        icon: Clock,
        t: "Follow your pot",
        d: "Accepted, shopping, cooking, packing, ready. You see each step as your chef taps it, and you can message them.",
    },
    {
        icon: ShieldCheck,
        t: "Reviews & disputes",
        d: "Rate your meal, and raise a case in a few taps if something is wrong.",
    },
];

const FAQ = [
    [
        "Who can use STEW?",
        `Current ${CAMPUS.short} students with a ${CAMPUS.emailDomain} email address. We ask for your student reference ID and phone number so chefs can trust who they are handing food to.`,
    ],
    [
        "Why do you need my reference ID and phone number?",
        "The reference ID helps confirm you are a student. Your phone number is used for order updates and handover. Chefs only see what they need to complete your order. See our Privacy Policy for details.",
    ],
    [
        "How do I pay?",
        "With Mobile Money (MTN MoMo, Telecel Cash or AT Money). You approve the payment on your phone.",
    ],
    [
        "What if my order is wrong or missing something?",
        'Open the order and tap "Report a problem". Food safety concerns are flagged as priority. Our Refund Policy explains what is covered.',
    ],
    [
        "Can I sell food on STEW?",
        "Yes. If you are a KNUST student who cooks or bakes, apply from the app. You will be asked about your kitchen, your hygiene practices and where to send payouts.",
    ],
    [
        "Can I install it on my phone?",
        "Yes. STEW is an installable web app. On Android tap Install; on iPhone use Share, then Add to Home Screen.",
    ],
    [
        "Which halls and areas are covered?",
        `${CAMPUS.halls.join(", ")}. More areas can be added as chefs join.`,
    ],
    [
        "Is my data safe?",
        "We collect only what we need, never sell your data and follow the Data Protection Act, 2012 (Act 843). Read the Privacy Policy for the full picture.",
    ],
];

const HERO_MS = 6000;

const HERO_SLIDES = [
    {
        icon: Flame,
        badge: "KNUST Student Food Network",
        title: (
            <>
                Order great food <br className="hidden sm:block" />
                near you with <span className="text-brand">STEW!</span>
            </>
        ),
        sub: "Fast, fresh homemade meals cooked by verified KNUST student chefs. Pay with MoMo, track your batch, and collect at your hall.",
        points: ["KNUST emails only", "Pay with MoMo", "Campus pickup points"],
        cta: { label: "Get Started", to: "/app/signup" },
        cta2: { label: "See how it works", href: "#how" },
    },
    {
        icon: BadgeCheck,
        badge: "Verified Student Chefs",
        title: (
            <>
                Eat from kitchens <br className="hidden sm:block" />
                you can <span className="text-brand">trust</span>
            </>
        ),
        sub: "Every kitchen belongs to a KNUST student, reviewed before they can sell. Follow your pot from shopping to cooked, step by step.",
        points: [
            "Reviewed kitchens",
            "Live order tracking",
            "Reviews & disputes",
        ],
        cta: { label: "Browse the menu", to: "/app" },
        cta2: { label: "See features", href: "#features" },
    },
    {
        icon: Wallet,
        badge: "MoMo Payments & Campus Pickup",
        title: (
            <>
                Pay with MoMo. <br className="hidden sm:block" />
                Collect at <span className="text-brand">your hall</span>
            </>
        ),
        sub: "Approve the prompt on MTN MoMo, Telecel Cash or AT Money, then pick your collection day at checkout. Prices shown in GH¢ before you confirm.",
        points: ["Mobile Money only", "Pickup locations", "Clear GH¢ pricing"],
        cta: { label: "See how it works", href: "#how" },
        cta2: { label: "View coverage", href: "#halls" },
    },
    {
        icon: ChefHat,
        badge: "For Student Chefs",
        title: (
            <>
                Cook? Turn your kitchen <br className="hidden sm:block" />
                into a <span className="text-brand">campus business</span>
            </>
        ),
        sub: "STEW gives you the storefront, the live order queue and MoMo payouts. Add your menu, set your prices, start cooking.",
        points: [
            "Your menu, your prices",
            "Live order queue",
            "Payouts to MoMo",
        ],
        cta: { label: "Become a vendor", to: "/app/signup" },
        cta2: { label: "How selling works", href: "#chefs" },
    },
];

function Section({ id, kicker, title, sub, children, className = "" }) {
    return (
        <section
            id={id}
            className={`mx-auto max-w-6xl px-4 py-16 md:py-20 ${className}`}
        >
            <div className="mb-10 max-w-2xl">
                {kicker && (
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-strong">
                        {kicker}
                    </p>
                )}
                <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
                    {title}
                </h2>
                {sub && <p className="mt-3 text-ink-2">{sub}</p>}
            </div>
            {children}
        </section>
    );
}

function HeroButton({ cta, primary }) {
    const target = cta.to ? { to: cta.to } : { href: cta.href };
    return primary ? (
        <Button
            {...target}
            size="lg"
            className="!h-11 !rounded-full !bg-white !px-5 text-sm font-bold !text-black shadow-lg transition-transform hover:!bg-white/90 active:scale-95 sm:!h-14 sm:!px-8 sm:text-base"
        >
            {cta.label}
            <ArrowRight className="h-4 w-4" />
        </Button>
    ) : (
        <Button
            {...target}
            size="lg"
            variant="outline"
            className="!h-11 !rounded-full !border-white/30 !bg-white/10 !px-5 text-sm font-bold !text-white backdrop-blur-md hover:!bg-white/20 sm:!h-14 sm:!px-7"
        >
            {cta.label}
        </Button>
    );
}

export default function Landing() {
    const { canInstall, install } = useInstall();
    const liveMealsRes = useAsync(() => api.meals(), []);
    const liveMeals = (liveMealsRes.data || [])
        .filter((m) => m.open && m.left > 0)
        .slice(0, 4);

    // Hero carousel state
    const [heroIndex, setHeroIndex] = useState(0);
    const [heroPaused, setHeroPaused] = useState(false);
    const touchX = useRef(0);

    const count = HERO_SLIDES.length;
    const goToSlide = (i) => setHeroIndex(i);
    const nextSlide = () => setHeroIndex((i) => (i + 1) % count);
    const prevSlide = () => setHeroIndex((i) => (i - 1 + count) % count);

    const onTouchStart = (e) => {
        touchX.current = e.touches[0].clientX;
    };
    const onTouchEnd = (e) => {
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (dx < -50) nextSlide();
        else if (dx > 50) prevSlide();
    };

    return (
        <div>
            <style>{`@keyframes stew-hero-bar{from{width:0}to{width:100%}}`}</style>
            <SiteHeader />
            <main>
                {/* HERO — AUTO-SWIPING CAROUSEL */}
                <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
                    <div
                        className="relative h-[38rem] overflow-hidden rounded-[2rem] border border-line/80 bg-black shadow-xl sm:rounded-[2.5rem] md:h-[42rem] dark:border-white/10"
                        onMouseEnter={() => setHeroPaused(true)}
                        onMouseLeave={() => setHeroPaused(false)}
                        onTouchStart={onTouchStart}
                        onTouchEnd={onTouchEnd}
                    >
                        {/* Slides track */}
                        <div
                            className="flex h-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                            style={{
                                transform: `translateX(-${heroIndex * 100}%)`,
                            }}
                        >
                            {HERO_SLIDES.map((s, i) => {
                                const meal =
                                    liveMeals[i % (liveMeals.length || 1)] ||
                                    HERO_VISUALS[i % HERO_VISUALS.length];
                                return (
                                    <div
                                        key={i}
                                        aria-hidden={i !== heroIndex}
                                        className="relative h-full w-full shrink-0"
                                    >
                                        {/* Photo */}
                                        <Food
                                            meal={meal}
                                            frame=""
                                            className="absolute inset-0 h-full w-full object-cover"
                                        />

                                        {/* Scrims */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />
                                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
                                        <div className="absolute inset-0 bg-gradient-to-tr from-brand/40 via-transparent to-transparent" />

                                        {/* Copy */}
                                        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-10 lg:p-14">
                                            <div className="max-w-xl space-y-4 text-white sm:space-y-5">
                                                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur-md sm:px-4">
                                                    <s.icon className="h-3.5 w-3.5 shrink-0 text-brand" />
                                                    {s.badge}
                                                </span>
                                                <h1 className="text-[1.9rem] font-bold leading-[1.1] tracking-tight sm:text-5xl sm:leading-[1.05] lg:text-6xl">
                                                    {s.title}
                                                </h1>
                                                <p className="line-clamp-3 max-w-lg text-sm font-medium leading-relaxed text-white/80 sm:line-clamp-none sm:text-base lg:text-lg">
                                                    {s.sub}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-2.5 pt-1 sm:gap-3">
                                                    <HeroButton
                                                        cta={s.cta}
                                                        primary
                                                    />
                                                    <HeroButton cta={s.cta2} />
                                                </div>
                                                <ul className="hidden flex-wrap gap-x-6 gap-y-2 pt-1 text-xs font-bold text-white/80 sm:flex">
                                                    {s.points.map((t) => (
                                                        <li
                                                            key={t}
                                                            className="flex items-center gap-1.5"
                                                        >
                                                            <Check className="h-4 w-4 text-brand" />
                                                            {t}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Progress bars + Skip */}
                        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 p-4 sm:gap-6 sm:p-8">
                            <div className="flex min-w-0 items-center gap-1 sm:gap-1.5">
                                {HERO_SLIDES.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => goToSlide(i)}
                                        aria-label={`Go to slide ${i + 1}: ${s.badge}`}
                                        className="flex h-6 w-8 items-center sm:w-14"
                                    >
                                        <span className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/30">
                                            <span
                                                key={
                                                    i === heroIndex
                                                        ? "on"
                                                        : "off"
                                                }
                                                className="absolute inset-y-0 left-0 rounded-full bg-white"
                                                style={
                                                    i === heroIndex
                                                        ? {
                                                              animation: `stew-hero-bar ${HERO_MS}ms linear forwards`,
                                                              animationPlayState:
                                                                  heroPaused
                                                                      ? "paused"
                                                                      : "running",
                                                          }
                                                        : {
                                                              width:
                                                                  i < heroIndex
                                                                      ? "100%"
                                                                      : "0%",
                                                          }
                                                }
                                                onAnimationEnd={nextSlide}
                                            />
                                        </span>
                                    </button>
                                ))}
                            </div>
                            <Button
                                to="/app"
                                variant="ghost"
                                size="sm"
                                className="!inline-flex !h-8 shrink-0 items-center justify-center whitespace-nowrap !rounded-full !bg-white/15 !px-3 text-xs leading-none !text-white backdrop-blur-md hover:!bg-white/25 sm:!px-4 sm:text-sm"
                            >
                                Skip to food
                            </Button>
                        </div>
                    </div>
                </div>

                {/* TRUST STRIP */}
                <div className="border-y border-line/70 bg-surface">
                    <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 md:grid-cols-4">
                        {[
                            [ShieldCheck, "Student-verified"],
                            [ChefHat, "Student chefs"],
                            [Wallet, "MoMo payments"],
                            [MapPin, "Pickup Location"],
                        ].map(([I, t]) => (
                            <div
                                key={t}
                                className="flex items-center gap-3 text-sm font-bold"
                            >
                                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-soft text-brand-strong">
                                    <I className="h-5 w-5" />
                                </span>
                                {t}
                            </div>
                        ))}
                    </div>
                </div>

                {/* HOW */}
                <Section
                    id="how"
                    kicker="How it works"
                    title="From hungry to fed in four steps"
                >
                    <ol className="grid gap-4 md:grid-cols-4">
                        {STEPS.map((s, i) => (
                            <li
                                key={s.t}
                                className="rounded-3xl border border-line/70 bg-surface p-6 shadow-xs"
                            >
                                <div className="mb-4 flex items-center justify-between">
                                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand text-on-brand shadow-xs">
                                        <s.icon className="h-5 w-5" />
                                    </span>
                                    <span className="num text-sm font-extrabold text-ink-3">
                                        0{i + 1}
                                    </span>
                                </div>
                                <h3 className="font-extrabold text-base">
                                    {s.t}
                                </h3>
                                <p className="mt-2 text-sm text-ink-2 font-medium">
                                    {s.d}
                                </p>
                            </li>
                        ))}
                    </ol>
                </Section>

                {/* FEATURES */}
                <div className="bg-sunken/40">
                    <Section
                        id="features"
                        kicker="Features"
                        title="Built for how campus actually eats"
                        sub="Fast on mid-range phones, clear about prices, and designed around halls, hostels and lecture timetables."
                    >
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {FEATURES.map((f) => (
                                <div
                                    key={f.t}
                                    className="rounded-3xl border border-line/70 bg-surface p-6 shadow-xs"
                                >
                                    <span className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-brand-soft text-brand-strong shadow-xs">
                                        <f.icon className="h-5 w-5" />
                                    </span>
                                    <h3 className="font-extrabold text-base">
                                        {f.t}
                                    </h3>
                                    <p className="mt-2 text-sm text-ink-2 font-medium">
                                        {f.d}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </Section>
                </div>

                {/* HALLS */}
                <Section
                    id="halls"
                    kicker="Coverage"
                    title="Wherever you stay on campus"
                    sub="Pick your hall or area when you sign up and you'll see the kitchens closest to you."
                >
                    <div className="flex flex-wrap gap-2.5">
                        {CAMPUS.halls.map((h) => (
                            <span
                                key={h}
                                className="rounded-full border border-line/70 bg-surface px-4 py-2 text-xs sm:text-sm font-bold shadow-xs"
                            >
                                <MapPin className="mr-1.5 inline h-3.5 w-3.5 text-brand-strong" />
                                {h}
                            </span>
                        ))}
                    </div>
                </Section>

                {/* MENU PREVIEW */}
                {liveMeals.length > 0 && (
                    <div className="bg-sunken/40">
                        <Section
                            kicker="On the menu"
                            title="What KNUST is eating"
                            sub="Live pots cooking on campus right now."
                        >
                            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                                {liveMeals.map((m) => (
                                    <div
                                        key={m.id}
                                        className="flex flex-col rounded-[1.75rem] border border-line/70 bg-surface p-3 sm:p-3.5 shadow-xs transition hover:shadow-md"
                                    >
                                        <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-sunken mb-2.5">
                                            <Food
                                                meal={m}
                                                frame=""
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 flex flex-col px-1">
                                            <p className="text-sm font-extrabold truncate text-ink">
                                                {m.name}
                                            </p>
                                            <p className="text-xs font-semibold text-ink-3">
                                                {m.vendorName}
                                            </p>
                                            <div className="mt-auto pt-3 flex items-center justify-between">
                                                <span className="num font-black text-ink text-sm sm:text-base">
                                                    {money(m.price)}
                                                </span>
                                                <Button
                                                    to="/app"
                                                    variant="outline"
                                                    size="sm"
                                                    className="!h-7 !px-3 text-xs"
                                                >
                                                    Order
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Section>
                    </div>
                )}

                {/* CHEFS */}
                <Section
                    id="chefs"
                    kicker="For student chefs"
                    title="Turn your kitchen into a campus business"
                    sub="If you cook, bake or blend for your hall, STEW gives you the storefront, the orders and the payouts."
                >
                    <div className="grid gap-8 md:grid-cols-2">
                        <ul className="space-y-4">
                            {[
                                [
                                    "Your menu, your prices",
                                    "Add items, set stock and switch availability on or off in a tap.",
                                ],
                                [
                                    "See orders as they land",
                                    "A live queue: accept, cook, mark ready.",
                                ],
                                [
                                    "Know your earnings",
                                    "Daily sales, analytics and payout history in one place.",
                                ],
                                [
                                    "Get paid to MoMo",
                                    "Add your payout number once.",
                                ],
                            ].map(([t, d]) => (
                                <li key={t} className="flex gap-3">
                                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ok-soft text-ok">
                                        <Check className="h-4 w-4" />
                                    </span>
                                    <div>
                                        <p className="font-bold">{t}</p>
                                        <p className="text-sm text-ink-2">
                                            {d}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <div className="rounded-2xl border border-line bg-surface p-6">
                            <h3 className="font-bold">How to start selling</h3>
                            <ol className="mt-4 space-y-3 text-sm text-ink-2">
                                <li>
                                    <strong className="text-ink">1.</strong>{" "}
                                    Create your student account.
                                </li>
                                <li>
                                    <strong className="text-ink">2.</strong>{" "}
                                    Open Account and choose “Become a vendor”.
                                </li>
                                <li>
                                    <strong className="text-ink">3.</strong>{" "}
                                    Tell us about your kitchen and hygiene
                                    practices.
                                </li>
                                <li>
                                    <strong className="text-ink">4.</strong> Get
                                    reviewed, then start cooking.
                                </li>
                            </ol>
                            <Button to="/app/signup" className="mt-6 w-full">
                                Create account to apply
                            </Button>
                        </div>
                    </div>
                </Section>

                {/* SAFETY */}
                <div className="bg-sunken">
                    <Section
                        kicker="Trust & safety"
                        title="Food you can trust, people you can reach"
                    >
                        <div className="grid gap-4 md:grid-cols-3">
                            {[
                                [
                                    ShieldCheck,
                                    "Food safety first",
                                    "Chefs agree to hygiene standards. Food safety reports are escalated as priority.",
                                    "/legal/food-safety",
                                    "Read food safety standards",
                                ],
                                [
                                    Bell,
                                    "Clear rules for everyone",
                                    "Respectful, honest, safe. Our guidelines apply to students and chefs alike.",
                                    "/legal/guidelines",
                                    "Read community guidelines",
                                ],
                                [
                                    BadgeCheck,
                                    "Your data stays yours",
                                    "We collect only what we need and never sell it.",
                                    "/legal/privacy",
                                    "Read privacy policy",
                                ],
                            ].map(([I, t, d, h, l]) => (
                                <div
                                    key={t}
                                    className="rounded-2xl border border-line bg-surface p-5"
                                >
                                    <I className="mb-3 h-6 w-6 text-brand-strong" />
                                    <h3 className="font-bold">{t}</h3>
                                    <p className="mt-2 text-sm text-ink-2">
                                        {d}
                                    </p>
                                    <a
                                        href={h}
                                        className="mt-3 inline-block text-sm font-bold text-brand-strong hover:underline"
                                    >
                                        {l} →
                                    </a>
                                </div>
                            ))}
                        </div>
                    </Section>
                </div>

                {/* INSTALL */}
                <Section
                    id="install"
                    kicker="Get the app"
                    title="Add STEW to your home screen"
                >
                    <div className="grid items-center gap-6 rounded-3xl border border-line bg-surface p-6 md:grid-cols-[1fr_auto] md:p-10">
                        <div>
                            <p className="flex items-center gap-2 font-bold">
                                <Smartphone className="h-5 w-5 text-brand-strong" />
                                Works like an app, no app store needed
                            </p>
                            <ul className="mt-3 space-y-1 text-sm text-ink-2">
                                <li>
                                    <strong className="text-ink">
                                        Android:
                                    </strong>{" "}
                                    tap Install, or Chrome menu → Add to Home
                                    screen.
                                </li>
                                <li>
                                    <strong className="text-ink">
                                        iPhone:
                                    </strong>{" "}
                                    Safari → Share → Add to Home Screen.
                                </li>
                                <li>
                                    The installed app opens straight into STEW.
                                    No landing page.
                                </li>
                            </ul>
                        </div>
                        {canInstall ? (
                            <Button size="lg" onClick={install}>
                                <Download className="h-4 w-4" />
                                Install STEW
                            </Button>
                        ) : (
                            <Button
                                to="/app/signup"
                                size="lg"
                                variant="outline"
                            >
                                Open in browser
                            </Button>
                        )}
                    </div>
                </Section>

                {/* FAQ */}
                <div className="bg-sunken">
                    <Section id="faq" kicker="FAQ" title="Questions, answered">
                        <div className="max-w-3xl space-y-3">
                            {FAQ.map(([q, a]) => (
                                <details
                                    key={q}
                                    className="group rounded-xl border border-line bg-surface p-4"
                                >
                                    <summary className="flex cursor-pointer items-center justify-between gap-4 font-bold">
                                        {q}
                                        <span
                                            className="text-xl text-brand-strong transition group-open:rotate-45"
                                            aria-hidden="true"
                                        >
                                            +
                                        </span>
                                    </summary>
                                    <p className="mt-3 text-sm text-ink-2">
                                        {a}
                                    </p>
                                </details>
                            ))}
                        </div>
                    </Section>
                </div>

                {/* FINAL CTA */}
                <div className="mx-auto max-w-6xl px-4 py-16">
                    <div className="rounded-3xl bg-brand px-6 py-12 text-center text-on-brand md:py-16">
                        <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
                            Hungry? See what's cooking.
                        </h2>
                        <p className="mx-auto mt-3 max-w-md opacity-80">
                            Sign up with your KNUST email in under a minute.
                        </p>
                        <Button
                            to="/app/signup"
                            size="lg"
                            className="mt-6 bg-on-brand text-white hover:brightness-110"
                        >
                            Create your account
                        </Button>
                    </div>
                </div>
            </main>
            <SiteFooter />
        </div>
    );
}
