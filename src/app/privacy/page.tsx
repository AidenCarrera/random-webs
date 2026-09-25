import type { Metadata } from "next";
import Link from "next/link";

const LAST_UPDATED = "July 26, 2026";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Random Webs uses anonymous analytics, browser storage, and third-party services.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Policy | Random Webs",
    description:
      "How Random Webs uses anonymous analytics, browser storage, and third-party services.",
    url: "/privacy",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

type SectionProps = {
  title: string;
  children: React.ReactNode;
};

const SECTION_TITLES = [
  "Information you provide",
  "Analytics",
  "Browser storage",
  "Files",
  "Third-party services",
  "Cookies",
  "Children",
  "Changes",
];

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function Section({ title, children }: SectionProps) {
  const number = String(SECTION_TITLES.indexOf(title) + 1).padStart(2, "0");

  return (
    <section
      id={slugify(title)}
      className="group scroll-mt-8 border-t border-white/8 pt-10 sm:grid sm:grid-cols-[3.5rem_1fr]"
    >
      <span
        aria-hidden="true"
        className="block font-mono text-xs tabular-nums tracking-[0.2em] text-white/30 transition-colors duration-300 group-hover:text-white/70 sm:pt-0.5"
      >
        {number}
      </span>
      <div>
        <h2 className="mt-3 text-sm font-black uppercase tracking-[0.22em] text-white sm:mt-0">
          {title}
        </h2>
        <div className="mt-4 max-w-[62ch] space-y-4 text-sm leading-7 text-zinc-400 sm:text-base sm:leading-8 [&_a]:rounded-sm">
          {children}
        </div>
      </div>
    </section>
  );
}

export default function PrivacyPolicy() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050506] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-112 bg-[radial-gradient(60rem_22rem_at_50%_-6rem,rgba(167,139,250,0.14),transparent_70%)]"
      />
      <div className="relative mx-auto max-w-6xl px-6 py-16 sm:px-8 sm:py-24 lg:grid lg:grid-cols-[14rem_1fr] lg:gap-16">
        <aside className="lg:sticky lg:top-16 lg:self-start">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/3 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-white/60 transition-colors duration-300 hover:border-white/25 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            <span
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:-translate-x-0.5"
            >
              ←
            </span>
            Random Webs
          </Link>

          <nav aria-label="Sections" className="mt-12 hidden lg:block">
            <ol className="space-y-1 border-l border-white/8">
              {SECTION_TITLES.map((title, index) => (
                <li key={title}>
                  <a
                    href={`#${slugify(title)}`}
                    className="-ml-px flex gap-3 border-l border-transparent py-1.5 pl-4 text-[0.8rem] text-white/45 transition-colors duration-200 hover:border-white/60 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    <span className="font-mono text-[0.7rem] tabular-nums text-white/25">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <article>
          <h1 className="mt-12 text-2xl font-black uppercase tracking-[0.24em] text-white sm:text-4xl sm:tracking-[0.28em] lg:mt-0">
            Privacy Policy
          </h1>

          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/8 px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-white/45">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
            Last updated {LAST_UPDATED}
          </p>

          <p className="mt-10 max-w-[62ch] text-base leading-8 text-zinc-300 sm:text-lg sm:leading-9">
            Random Webs is a personal collection of interactive web experiments.
            There are no accounts, sign-ups, or newsletters. This policy
            explains the limited data involved when you use the site.
          </p>

          <div className="mt-14 space-y-10">
            <Section title="Information you provide">
              <p>
                Random Webs does not ask you to provide your name, email
                address, or other identifying information. Content you create
                within experiments is generally processed locally in your
                browser.
              </p>
            </Section>

            <Section title="Analytics">
              <p>
                Random Webs uses{" "}
                <a
                  href="https://vercel.com/docs/analytics/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white underline underline-offset-4 transition-colors duration-300 hover:text-white/70"
                >
                  Vercel Web Analytics
                </a>{" "}
                to understand which pages are visited. Vercel Web Analytics does
                not use third-party cookies or track visitors across different
                websites.
              </p>

              <p>
                It provides aggregated information such as page views, referring
                sites, browsers, devices, and approximate locations. Random Webs
                does not use analytics to identify individual visitors.
              </p>
            </Section>

            <Section title="Browser storage">
              <p>
                Some experiments use local storage to save settings and
                progress. This information remains in your browser and can be
                removed by clearing the site&apos;s stored data.
              </p>
            </Section>

            <Section title="Files">
              <p>
                Experiments that let you open images or other files process them
                locally in your browser. These files are not uploaded to Random
                Webs.
              </p>
            </Section>

            <Section title="Third-party services">
              <p>
                The Repo Visualizer requests public repository information from
                the GitHub API when you choose to load a repository. Because
                this request is sent directly from your browser, GitHub may
                receive standard technical information associated with the
                request.
              </p>

              <p>
                A few experiments load fonts or background textures hosted
                elsewhere, such as Google Fonts and Transparent Textures. Your
                browser requests these files as the page loads, so those
                providers may receive standard technical information associated
                with the request.
              </p>

              <p>
                Random Webs is hosted by Vercel, which processes standard
                request and technical information needed to deliver the site,
                maintain security, and prevent abuse.
              </p>
            </Section>

            <Section title="Cookies">
              <p>Random Webs does not intentionally set cookies.</p>
            </Section>

            <Section title="Children">
              <p>
                Random Webs does not knowingly collect personal information from
                children.
              </p>
            </Section>

            <Section title="Changes">
              <p>
                This policy may be updated if the site or its data practices
                change. The date at the top will show when it was last revised.
              </p>
            </Section>
          </div>
        </article>
      </div>
    </main>
  );
}
