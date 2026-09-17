import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import ServiceCard from "../../components/ServiceCard";
import heroImage from "../../assets/heroBg.jpg";
import { useApp } from "../../context/AppContext";

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
    title: "List your services",
    body: "Add what you do, how long it takes, your price, and an image.",
  },
  {
    title: "Set your hours",
    body: "Open up time slots on your calendar. Students book them directly.",
  },
];

const FAQ = [
  {
    q: "How do I know the providers are real students?",
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
  const { services = [], categories = [] } = useApp();
  
  // Use up to 4 categories for the grid
  const displayCategories = categories.slice(0, 4);
  // Use up to 3 services for popular section
  const popularServices = services.slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink pt-20 text-paper sm:pt-32">
        <div className="absolute inset-0 z-0 opacity-40">
          <img
            src={heroImage}
            alt="Students on campus"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-transparent"></div>
        </div>

        <div className="relative z-10 mx-auto max-w-wrap px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4 text-honey" />
            The campus marketplace for student services
          </div>

          <h1 className="mx-auto max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-6xl">
            Book trusted student services on campus.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-paper/80">
            From barbers and braiders to photographers and tutors. Skip the
            DMs, see real prices, and book open slots instantly.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/services"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-honey px-[1.1rem] py-[0.65rem] font-data font-semibold text-ink no-underline transition-colors duration-150 hover:bg-honey-deep hover:text-white sm:w-auto"
            >
              Find a service <ArrowRight size={18} />
            </Link>
            <Link
              to="/register"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-transparent bg-transparent px-[1.1rem] py-[0.65rem] font-data font-semibold text-paper no-underline transition-colors duration-150 hover:bg-paper-raised/10 sm:w-auto"
            >
              List your business
            </Link>
          </div>
        </div>

        {/* Categories row */}
        <div className="relative z-10 mt-20 border-t border-line-dark/30 bg-ink-raised/50 py-10 backdrop-blur-sm">
          <div className="mx-auto max-w-wrap px-6">
            <h2 className="mb-6 text-2xl font-semibold">Browse by category</h2>
            <ul className="grid list-none grid-cols-2 gap-4 p-0 md:grid-cols-4">
              {displayCategories.map((cat) => (
                <li key={cat.tag}>
                  <Link
                    to={"/services?category=${cat.tag}"}
                    className="block rounded-lg border border-line bg-paper-raised px-4 py-6 text-center font-data font-medium text-ink no-underline hover:border-honey-deep dark:border-line-dark dark:bg-ink-raised dark:text-paper"
                  >
                    {cat.category_name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Popular Services */}
      <div className="bg-paper py-20 dark:bg-ink">
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
              {popularServices.map((svc) => (
                <ServiceCard
                  key={svc.id}
                  category={svc.category?.category_name || "Uncategorized"}
                  name={svc.title}
                  provider={svc.entrepreneur?.business_name || "Unknown Provider"}
                  price={"GH₵${svc.price}"}
                  to={"/services/${svc.id}"}
                />
              ))}
            </ul>
          </div>
        </section>
      </div>

      {/* How CampusHive works */}
      <section className="py-14 text-center">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-2xl font-semibold">How CampusHive works</h2>
          <div className="mx-auto mt-6 flex max-w-fit rounded-full border border-line p-1 dark:border-line-dark">
            <button
              onClick={() => setAudience("student")}
              className={`rounded-full px-5 py-2 font-data text-sm font-semibold transition-colors ${
                audience === "student"
                  ? "bg-ink text-paper dark:bg-paper dark:text-ink"
                  : "text-ink hover:bg-paper-raised dark:text-paper dark:hover:bg-ink-raised"
              }`}
            >
              For students
            </button>
            <button
              onClick={() => setAudience("entrepreneur")}
              className={`rounded-full px-5 py-2 font-data text-sm font-semibold transition-colors ${
                audience === "entrepreneur"
                  ? "bg-ink text-paper dark:bg-paper dark:text-ink"
                  : "text-ink hover:bg-paper-raised dark:text-paper dark:hover:bg-ink-raised"
              }`}
            >
              For entrepreneurs
            </button>
          </div>

          <ol className="mx-auto mt-10 grid list-none grid-cols-1 gap-8 p-0 text-left md:grid-cols-2">
            {steps.map((step, index) => (
              <li key={index} className="flex items-start gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-honey-tint font-data text-sm font-bold text-ink dark:bg-honey-deep/20 dark:text-paper">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-base font-semibold text-ink dark:text-paper">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm text-ink-soft dark:text-paper/70">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-paper-raised py-16 dark:bg-ink-raised">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="mb-10 text-center text-2xl font-semibold">
            Frequently asked questions
          </h2>
          <dl className="flex flex-col gap-8">
            {FAQ.map((item, index) => (
              <div key={index}>
                <dt className="font-semibold text-ink dark:text-paper">
                  {item.q}
                </dt>
                <dd className="mt-2 text-ink-soft dark:text-paper/70">
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-[2rem] font-semibold text-ink dark:text-paper">
            Ready to get started?
          </h2>
          <p className="mt-4 text-ink-soft dark:text-paper/80">
            Join the campus marketplace today. Find what you need, or list your
            business and start getting booked.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              to="/services"
              className="rounded-md bg-honey px-[1.1rem] py-[0.65rem] font-data font-semibold text-ink no-underline hover:bg-honey-deep hover:text-white"
            >
              Browse services
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

