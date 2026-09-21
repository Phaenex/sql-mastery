"use client";

import Link from "next/link";
import { useState } from "react";
import HomeTerminal from "@/components/HomeTerminal";
import ModeToggle from "@/components/ModeToggle";
import DownloadNotesButton from "@/components/DownloadNotesButton";
import { getAllModules, getModuleBySlug, getModuleLessons } from "@/lib/lessons";
import { useShowcase } from "@/lib/mode";

// One-line descriptions keyed by slug. The module list itself is derived from
// the lesson data (getAllModules) so it can never go stale when modules are
// added; a missing description just renders blank.
const MODULE_DESCRIPTIONS: Record<string, string> = {
  "start-here": "New to all this? Start at zero.",
  "getting-started": "SELECT, WHERE, ORDER BY.",
  "data-analysis": "Aggregates, GROUP BY, HAVING.",
  "joining-tables": "INNER, LEFT, self-joins.",
  "subqueries-ctes": "Nested queries and WITH clauses.",
  "modifying-data": "INSERT, UPDATE, DELETE.",
  "functions": "String, date, math.",
  "window-functions": "RANK, LAG, running totals.",
  "database-objects": "Views, indexes, constraints.",
  "advanced": "Recursive CTEs, pivot, optimization.",
  "school-advanced": "Course notes: procs, dynamic SQL, JSON.",
  "set-design": "UNION/INTERSECT/EXCEPT, normalization, keys.",
  "window-advanced": "Frames, NTILE, FIRST_VALUE.",
  "recursive-queries": "Walk hierarchies and trees.",
  "performance-indexing": "EXPLAIN plans and useful indexes.",
  "capstone": "Put every piece together.",
};

const modules = getAllModules().map((m, i) => {
  const lessons = getModuleLessons(m.slug);
  return {
    num: String(i + 1).padStart(2, "0"),
    slug: m.slug,
    firstLesson: lessons[0]?.lessonSlug ?? "",
    // title is the slug used as the terminal-path display string; name is the
    // human-readable label used in aria-label so screen readers get context.
    title: m.slug,
    name: m.name,
    desc: MODULE_DESCRIPTIONS[m.slug] ?? "",
    lessons: lessons.length,
  };
});

interface PersistedProgress {
  state?: { completedLessons?: string[] };
}

function loadCompletedLessons(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem("sql-mastery-progress");
    if (!raw) return new Set();
    const parsed: PersistedProgress = JSON.parse(raw);
    return new Set(parsed.state?.completedLessons ?? []);
  } catch {
    return new Set();
  }
}

export default function HomePage() {
  const [completed] = useState(loadCompletedLessons);
  const showcase = useShowcase();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-mono text-sm">
      <main id="main" tabIndex={-1} className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 sm:py-16">
        {/* The visible "hero" is the terminal prompt, which carries no heading of its own,
            so the page had no h1 at all and the section labels below were <p>. A screen
            reader landing here got a flat list of links with no structure to skip between.
            sr-only because the design's opening statement is the prompt, not a title --
            this names the page for assistive tech without altering what is drawn.
            Mirrors python-mastery/app/page.tsx, which already does exactly this. */}
        <h1 className="sr-only">sql-mastery — learn SQL by writing it</h1>
        <section className="flex flex-wrap items-baseline justify-between gap-3">
          <div className="flex-1 min-w-0">
            <HomeTerminal modules={modules} />
          </div>
          <p className="text-xs text-muted-foreground">
            {'// type '}
            <span className="text-foreground/80">help</span>
            {' · ↑↓ history · tab completes'}
          </p>
        </section>

        <section className="mt-6 space-y-4">
          <ModeToggle />
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/start"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-accent text-accent hover:bg-accent/10 transition-colors text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              new here? start here →
            </Link>
            <Link href="/glossary" className="text-xs text-muted-foreground hover:text-foreground transition-colors">glossary</Link>
            <Link href="/next-steps" className="text-xs text-muted-foreground hover:text-foreground transition-colors">where to go next</Link>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground"># modules</h2>
          <ul className="mt-3 border-y border-border/60 divide-y divide-border/40">
            {modules.map((m) => {
              const doneCount = showcase
                ? m.lessons
                : Array.from(completed).filter((k) =>
                    k === m.slug || k.startsWith(`${m.slug}/`)
                  ).length;
              const status = doneCount === 0
                ? "─"
                : doneCount >= m.lessons
                ? "✓ complete"
                : `${doneCount}/${m.lessons}`;
              const statusClass = doneCount >= m.lessons
                ? "text-success"
                : doneCount > 0
                ? "text-accent"
                : "text-muted-foreground";
              return (
                <li key={m.slug} className="flex items-center gap-1">
                  <Link
                    href={`/learn/${m.slug}/${m.firstLesson}`}
                    className="group grid flex-1 grid-cols-[2.5rem_minmax(0,1fr)_5rem_7rem_1rem] gap-3 items-center py-2 px-2 -ml-2 rounded hover:bg-card/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    aria-label={`Open module: ${m.name}`}
                  >
                    <span className="text-muted-foreground">{m.num}</span>
                    <span className="min-w-0 truncate">
                      <span className="text-foreground">modules/{m.title}/</span>
                      <span className="text-muted-foreground hidden md:inline">  {m.desc}</span>
                    </span>
                    <span className="text-muted-foreground text-xs">{m.lessons} lessons</span>
                    <span className={`text-xs ${statusClass}`}>{status}</span>
                    <span className="text-muted-foreground group-hover:text-accent transition-colors">→</span>
                  </Link>
                  {(() => {
                    const mi = getModuleBySlug(m.slug);
                    const ml = getModuleLessons(m.slug);
                    return mi ? (
                      <DownloadNotesButton moduleInfo={mi} lessons={ml} compact />
                    ) : null;
                  })()}
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mt-10 grid sm:grid-cols-3 gap-4">
          <div>
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground"># playground</h2>
            <Link
              href="/playground"
              className="mt-3 block py-2 px-2 -mx-2 rounded hover:bg-card/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span className="text-foreground">playground/</span>
              <span className="ml-3 text-muted-foreground">→</span>
            </Link>
          </div>
          <div>
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground"># projects</h2>
            <Link
              href="/projects"
              className="mt-3 block py-2 px-2 -mx-2 rounded hover:bg-card/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span className="text-foreground">projects/</span>
              <span className="ml-3 text-muted-foreground">→</span>
            </Link>
          </div>
          <div>
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground"># stats</h2>
            <Link
              href="/stats"
              className="mt-3 block py-2 px-2 -mx-2 rounded hover:bg-card/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span className="text-foreground">stats/</span>
              <span className="ml-3 text-muted-foreground">→</span>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-5 text-xs">
        <div className="max-w-3xl mx-auto px-6 flex flex-wrap items-center justify-between gap-3 text-muted-foreground">
          <span>
            <span className="text-success">exit 0</span> · personal use · next.js + sql.js
          </span>
          <span className="flex flex-wrap gap-x-3 gap-y-1">
            <Link href="/start" className="hover:text-foreground transition-colors">start</Link>
            <Link href="/glossary" className="hover:text-foreground transition-colors">glossary</Link>
            <Link href="/next-steps" className="hover:text-foreground transition-colors">next steps</Link>
            <Link href="/playground" className="hover:text-foreground transition-colors">playground/</Link>
            <a href="https://damato-python.vercel.app" className="hover:text-foreground transition-colors">learn python →</a>
          </span>
        </div>
      </footer>
    </div>
  );
}
