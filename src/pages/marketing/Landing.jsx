import {
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
import { MEALS } from "../../lib/mockData";
import { useInstall } from "../../lib/hooks";
import { money } from "../../lib/utils";

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

export default function Landing() {
    const { canInstall, install } = useInstall();
    const sample = MEALS.filter((m) => m.open && m.left > 0).slice(0, 3);
    return (
        <div>
            <SiteHeader />
            <main>
                {/* HERO MATCHING SCREEN 1 IN INSP.WEBP */}
                <div className="mx-auto max-w-6xl px-4 py-6 md:py-12">
                    <div className="relative overflow-hidden rounded-[2.5rem] bg-surface dark:bg-[#141518] p-8 text-ink dark:text-white shadow-xl sm:p-12 lg:p-16 border border-line/80 dark:border-white/10">
                        {/* Status / Skip bar on top matching Screen 1 in insp.webp */}
                        <div className="mb-8 flex items-center justify-between text-xs font-bold text-ink-3 dark:text-zinc-400">
                            <div className="flex items-center gap-1.5">
                                <span className="h-1.5 w-12 rounded-full bg-brand" />
                                <span className="h-1.5 w-12 rounded-full bg-brand" />
                                <span className="h-1.5 w-12 rounded-full bg-brand" />
                            </div>
                            <Button to="/app" variant="ghost" size="sm" className="!h-8 !px-3 text-xs text-ink-2 hover:text-ink hover:bg-sunken dark:text-zinc-300 dark:hover:text-white dark:hover:bg-white/10 !rounded-full">
                                Skip to food
                            </Button>
                        </div>

                        <div className="grid items-center gap-12 lg:grid-cols-12">
                            {/* Left content */}
                            <div className="space-y-6 lg:col-span-7">
                                <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft/70 px-4 py-1.5 text-xs font-bold text-brand-strong backdrop-blur-md border border-brand/20 dark:bg-white/10 dark:text-brand dark:border-white/10">
                                    <Flame className="h-3.5 w-3.5 text-brand-strong dark:text-brand" />
                                    KNUST Student Food Network
                                </span>

                                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] text-ink dark:text-white">
                                    Order great food <br />
                                    near you with <span className="text-brand">STEW !</span>
                                </h1>

                                <p className="text-base sm:text-lg text-ink-2 dark:text-zinc-300 max-w-lg font-medium leading-relaxed">
                                    Fast, fresh homemade meals cooked by verified KNUST student chefs. Pay with MoMo, track your batch, and collect at your hall.
                                </p>

                                <div className="flex flex-wrap items-center gap-4 pt-2">
                                    <Button
                                        to="/app/signup"
                                        size="lg"
                                        className="!h-14 !px-8 text-base font-black !rounded-full shadow-lg shadow-brand/20 hover:scale-105 active:scale-95 transition-transform"
                                    >
                                        Get Started
                                    </Button>
                                    <Button
                                        href="#how"
                                        size="lg"
                                        variant="outline"
                                        className="!h-14 !px-7 text-sm font-bold !rounded-full border-line/80 bg-sunken/60 text-ink hover:bg-line/40 dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                                    >
                                        See how it works
                                    </Button>
                                </div>

                                <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-xs font-bold text-ink-2 dark:text-zinc-300">
                                    {["KNUST emails only", "Pay with MoMo", "Campus Pickup points"].map((t) => (
                                        <li key={t} className="flex items-center gap-1.5">
                                            <Check className="h-4 w-4 text-brand-strong dark:text-brand" />
                                            {t}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Right Hero Visual Showcase */}
                            <div className="relative lg:col-span-5 flex justify-center">
                                <div className="relative w-full max-w-sm rounded-[2rem] bg-sunken/60 dark:bg-gradient-to-b dark:from-white/10 dark:to-white/5 p-4 backdrop-blur-md border border-line/80 dark:border-white/15 shadow-xl">
                                    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-canvas border border-line/60 dark:border-white/10">
                                        <Food meal={sample[0]} frame="" className="h-full w-full object-cover" />
                                        <div className="absolute right-3 top-3 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-xs font-black text-brand border border-white/10 flex items-center gap-1">
                                            <Flame className="h-3.5 w-3.5 text-warn" />
                                            <span>100% Homemade</span>
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-black text-lg text-ink dark:text-white">{sample[0]?.name || 'Palm nut soup'}</h3>
                                            <span className="num font-black text-brand-strong dark:text-brand text-lg">{money(sample[0]?.price || 45)}</span>
                                        </div>
                                        <p className="text-xs text-ink-3 dark:text-zinc-300 font-medium">{sample[0]?.vendorName || "Auntie Ama's Soup Pot"}</p>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between border-t border-line/70 dark:border-white/10 pt-3 text-xs font-bold text-ink-2 dark:text-zinc-300">
                                        <span className="flex items-center gap-1">
                                            <ShieldCheck className="h-4 w-4 text-brand-strong dark:text-brand" /> Verified Chef
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-4 w-4 text-amber-500 dark:text-amber-400" /> Weekly Batch
                                        </span>
                                    </div>
                                </div>
                            </div>
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
                                <h3 className="font-extrabold text-base">{s.t}</h3>
                                <p className="mt-2 text-sm text-ink-2 font-medium">{s.d}</p>
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
                                    <h3 className="font-extrabold text-base">{f.t}</h3>
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
                <div className="bg-sunken/40">
                    <Section
                        kicker="On the menu"
                        title="What KNUST is eating"
                        sub="Sample items for illustration. Real menus appear once you sign in."
                    >
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                            {MEALS.slice(0, 4).map((m) => (
                                <div
                                    key={m.id}
                                    className="flex flex-col rounded-[1.75rem] border border-line/70 bg-surface p-3 sm:p-3.5 shadow-xs transition hover:shadow-md"
                                >
                                    <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-sunken mb-2.5">
                                        <Food meal={m} frame="" className="h-full w-full object-cover" />
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
                                            <Button to="/app" variant="outline" size="sm" className="!h-7 !px-3 text-xs">
                                                Order
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Section>
                </div>

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
                            className="mt-6 bg-on-brand text-brand hover:brightness-110 text-white"
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
