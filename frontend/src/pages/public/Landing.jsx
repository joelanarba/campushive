import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import ServiceCard from "../../components/ServiceCard";
import heroImage from "../../assets/heroBg.jpg";

const CATEGORIES = [
  { label: "Beauty", slug: "beauty" },
  { label: "Food", slug: "food" },
  { label: "Tech", slug: "tech" },
  { label: "Academics", slug: "academics" },
];

// TODO: swap for a query helper from src/data/mockData.js once it's wired up
const POPULAR_SERVICES = [
  {
    id: "skin-fade-lineup",
    category: "Beauty",
    name: "Skin Fade + Line-up",
    provider: "Kwame's Barber Studio",
    price: "GH₵35",
  },
  {
    id: "knotless-braids-medium",
    category: "Beauty",
    name: "Knotless Braids (Medium)",
    provider: "Efua's Braids & Twists",
    price: "GH₵180",
  },
  {
    id: "graduation-portrait-session",
    category: "Beauty",
    name: "Graduation Portrait Session",
    provider: "Kojo Antwi Photography",
    price: "GH₵120",
  },
];

const STUDENT_STEPS = [
  {
    title: "Browse & search",
    body: "Explore services by category or search by exactly what you need.",
  },
  {
    title: "Check profiles",
    body: "View business info, listed services, and prices — only verified providers show up.",
  },
  {
    title: "Book a slot",
    body: "Pick an open time. Your slot is reserved the moment you confirm.",
  },
  {
    title: "Get your service",
    body: "Show up at your booked time — pay the provider directly when you meet.",
  },
];

const ENTREPRENEUR_STEPS = [
  {
    title: "Create your profile",
    body: "Add your business name, description, location, and contact details.",
  },
  {
    title: "Get verified",
    body: "An admin reviews your profile before your services go live to students.",
  },
  {
    title: "List services & slots",
    body: "Add what you offer, set prices, and open up bookable time slots.",
  },
  {
    title: "Manage bookings",
    body: "See who's booked, mark jobs complete, and cancel if you need to.",
  },
];

const STATS = [
  { num: "4", label: "Service categories" },
  { num: "100%", label: "Providers admin-verified" },
  { num: "1", label: "Campus, to start" },
  { num: "0", label: "Group chats needed" },
];

const WHY_CARDS = [
  {
    title: "Student-focused",
    body: "Verified students only — every account is made for campus life, not a generic marketplace.",
  },
  {
    title: "Real availability",
    body: "See open slots and book instantly, instead of waiting on a reply in a group chat.",
  },
  {
    title: "Campus convenience",
    body: "Find providers within walking distance, sorted by category, not by who posted last.",
  },
];

const SAFETY_CARDS = [
  {
    icon: "✓",
    title: "Verified profiles",
    body: "Every entrepreneur is reviewed by an admin before their services go live.",
  },
  {
    icon: "⛨",
    title: "Service guidelines",
    body: "Providers agree to clear expectations before they’re approved to list services.",
  },
  {
    icon: "⌂",
    title: "Campus-based",
    body: "Every provider on the platform is based on and around campus.",
  },
  {
    icon: "↺",
    title: "Easy cancellations",
    body: "Change of plans? Cancel from My Bookings and the slot reopens for someone else.",
  },
];

const FAQS = [
  {
    q: "How do I know a provider is verified?",
    a: "Every business profile is reviewed by an admin before it appears in search. Look for the green Verified badge on their profile.",
  },
  {
    q: "How does payment work?",
    a: "CampusHive doesn't process payments yet — you pay the provider directly when you meet for your service.",
  },
  {
    q: "Can I cancel a booking?",
    a: "Yes. Go to My Bookings and cancel any time before your appointment — this immediately frees the slot for someone else.",
  },
  {
    q: "What if a slot I want is already taken?",
    a: "Availability updates in real time, so a booked slot disappears from the calendar right away. Try another time or check back later.",
  },
  {
    q: "Is CampusHive available at my university?",
    a: "We're starting on one campus and plan to expand as more entrepreneurs and students join.",
  },
];

export default function Landing() {
  const [audience, setAudience] = useState("student");
  const steps = audience === "student" ? STUDENT_STEPS : ENTREPRENEUR_STEPS;

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[680px] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Campus students"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-stone-900/80 via-stone-900/60 to-orange-900/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-20">
          <div className="max-w-2xl animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4 text-orange-400" />
              The campus marketplace for student services
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-6">
              Find trusted student
              <br />
              entrepreneurs on your campus
            </h1>

            <p className="text-lg text-stone-200 leading-relaxed mb-8 max-w-xl">
              From tutoring to photography to design — discover, book, and
              support talented students near you. Verified profiles, easy
              scheduling, zero hassle.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/services"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 active:scale-[0.98] transition-all shadow-lg shadow-orange-500/30"
              >
                Find a service <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold hover:bg-white/20 transition-all"
              >
                List your business
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Browse by category */}
      <section className="py-14">
        <div className="mx-auto max-w-wrap px-6">
          <h2 className="mb-6 text-2xl font-semibold">Browse by category</h2>
          <ul className="grid list-none grid-cols-2 gap-4 p-0 md:grid-cols-4">
            {CATEGORIES.map((cat) => (
              <li key={cat.slug}>
                <Link
                  to={`/services?category=${cat.slug}`}
                  className="block rounded-lg border border-line bg-paper-raised px-4 py-6 text-center font-data font-medium text-ink no-underline hover:border-honey-deep dark:border-line-dark dark:bg-ink-raised dark:text-paper"
                >
                  {cat.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Popular right now */}
      <section className="pb-14">
        <div className="mx-auto max-w-wrap px-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-semibold">Popular right now</h2>
            <Link
              to="/services"
              className="font-data text-sm font-semibold text-honey-deep no-underline hover:underline"
            >
              See all services
            </Link>
          </div>
          <ul className="mt-6 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-3">
            {POPULAR_SERVICES.map((svc) => (
              <ServiceCard
                key={svc.id}
                category={svc.category}
                name={svc.name}
                provider={svc.provider}
                price={svc.price}
                to={`/providers/${svc.id}`}
              />
            ))}
          </ul>
        </div>
      </section>

      {/* How CampusHive works */}
      <section className="py-14 text-center">
        <div className="mx-auto max-w-wrap px-6">
          <h2 className="text-[1.75rem] font-semibold">How CampusHive works</h2>
          <p className="mx-auto mt-2 max-w-[32rem] text-ink-soft dark:text-paper/70">
            Simple and student-focused, whether you're booking a service or
            offering one.
          </p>

          <div
            role="tablist"
            aria-label="Choose your audience"
            className="mx-auto my-8 inline-flex gap-1 rounded-full bg-paper-raised p-[0.3rem] dark:bg-ink-raised"
          >
            <button
              type="button"
              role="tab"
              aria-selected={audience === "student"}
              onClick={() => setAudience("student")}
              className={`rounded-full px-[1.1rem] py-[0.55rem] font-data text-sm font-semibold ${
                audience === "student"
                  ? "bg-ink text-paper dark:bg-paper dark:text-ink"
                  : "bg-transparent text-ink-soft dark:text-paper/70"
              }`}
            >
              I need services
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={audience === "entrepreneur"}
              onClick={() => setAudience("entrepreneur")}
              className={`rounded-full px-[1.1rem] py-[0.55rem] font-data text-sm font-semibold ${
                audience === "entrepreneur"
                  ? "bg-ink text-paper dark:bg-paper dark:text-ink"
                  : "bg-transparent text-ink-soft dark:text-paper/70"
              }`}
            >
              I offer services
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5 text-left sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className="rounded-[10px] border border-line p-[1.4rem_1.1rem] dark:border-line-dark"
              >
                <div className="mb-3.5 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-honey font-data text-sm font-bold text-ink">
                  {i + 1}
                </div>
                <h3 className="mb-1 text-[0.98rem] font-semibold">
                  {step.title}
                </h3>
                <p className="text-[0.85rem] text-ink-soft dark:text-paper/70">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="pb-14">
        <div className="mx-auto max-w-wrap px-6">
          <div className="rounded-xl bg-ink px-6 py-9 dark:bg-ink-raised">
            <div className="grid grid-cols-2 gap-4 text-center lg:grid-cols-4">
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <p className="font-data text-[1.9rem] font-bold text-honey">
                    {stat.num}
                  </p>
                  <p className="mt-0.5 text-[0.82rem] text-paper/80">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why choose */}
      <section className="py-14">
        <div className="mx-auto max-w-wrap px-6">
          <h2 className="mb-6 text-2xl font-semibold">
            Why choose CampusHive?
          </h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {WHY_CARDS.map((card) => (
              <div
                key={card.title}
                className="rounded-[10px] bg-paper-raised p-6 dark:bg-ink-raised"
              >
                <h3 className="mb-2 text-base font-semibold">{card.title}</h3>
                <p className="text-[0.88rem] text-ink-soft dark:text-paper/70">
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety */}
      <section className="py-14">
        <div className="mx-auto max-w-wrap px-6">
          <div className="rounded-xl bg-moss-tint p-7 dark:bg-moss-deep/25 md:p-10">
            <div className="text-center">
              <h2 className="text-2xl font-semibold">
                Your safety is our priority
              </h2>
              <p className="mt-2 text-moss-deep dark:text-moss-tint">
                We've built multiple layers of protection so you can book with
                confidence.
              </p>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-5 text-center sm:grid-cols-2 lg:grid-cols-4">
              {SAFETY_CARDS.map((card) => (
                <div key={card.title}>
                  <div
                    aria-hidden="true"
                    className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[1.1rem] text-moss-deep dark:bg-ink-raised dark:text-moss-tint"
                  >
                    {card.icon}
                  </div>
                  <h3 className="mb-1 text-[0.92rem] font-semibold text-ink dark:text-paper">
                    {card.title}
                  </h3>
                  <p className="text-[0.8rem] text-ink-soft dark:text-paper/70">
                    {card.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14">
        <div className="mx-auto max-w-wrap px-6 text-center">
          <h2 className="text-2xl font-semibold">Frequently asked questions</h2>
          <div className="mx-auto mt-8 max-w-[42rem] text-left">
            {FAQS.map((item) => (
              <details
                key={item.q}
                className="faq-item border-b border-line dark:border-line-dark"
              >
                <summary className="flex cursor-pointer items-center justify-between py-[1.1rem] font-data text-[0.95rem] font-semibold">
                  {item.q}
                </summary>
                <p className="mb-[1.1rem] max-w-[38rem] text-sm text-ink-soft dark:text-paper/70">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
