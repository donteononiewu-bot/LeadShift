"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";
import { useSearchParams } from "next/navigation";
import {
  startFunnelSubmission,
  saveFunnelAnswer,
  completeFunnelSubmission,
  markFunnelRedirect,
} from "@/lib/actions/public-funnel";
import type { Database, FunnelQuestionType } from "@/lib/types/database";
import type { RouteLeadResult } from "@/lib/routing/types";

type Funnel = Database["public"]["Tables"]["funnels"]["Row"];
type FunnelPage = Database["public"]["Tables"]["funnel_pages"]["Row"];
type FunnelQuestion = Database["public"]["Tables"]["funnel_questions"]["Row"];

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function fireMetaPixelEvent(event: string) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", event);
  }
}

export function FunnelRuntime({
  funnel,
  pages,
  questionsByPage,
}: {
  funnel: Funnel;
  pages: FunnelPage[];
  questionsByPage: Record<string, FunnelQuestion[]>;
}) {
  const searchParams = useSearchParams();
  const [pageIndex, setPageIndex] = useState(0);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [contact, setContact] = useState({ name: "", email: "", phone: "" });
  const [result, setResult] = useState<RouteLeadResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const questionPageIds = useMemo(
    () => pages.filter((p) => p.page_type === "question").map((p) => p.id),
    [pages]
  );

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    startFunnelSubmission({
      funnelId: funnel.id,
      referrer: document.referrer || null,
      utmSource: searchParams.get("utm_source"),
      utmMedium: searchParams.get("utm_medium"),
      utmCampaign: searchParams.get("utm_campaign"),
      utmTerm: searchParams.get("utm_term"),
      utmContent: searchParams.get("utm_content"),
    }).then((res) => {
      if ("submissionId" in res) {
        setSubmissionId(res.submissionId);
      } else {
        setError(res.error);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const page = pages[pageIndex];
  if (!page) {
    return <CenteredMessage>This funnel isn&apos;t set up yet.</CenteredMessage>;
  }

  function goNext() {
    setPageIndex((i) => Math.min(i + 1, pages.length - 1));
  }

  async function handleQuestionAnswer(question: FunnelQuestion, value: unknown) {
    setAnswers((a) => ({ ...a, [question.id]: value }));
    if (submissionId) {
      await saveFunnelAnswer(submissionId, question.id, value);
    }
    goNext();
  }

  async function handleContactSubmit() {
    if (!submissionId) {
      setError("This funnel didn't start correctly — please refresh and try again.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await completeFunnelSubmission(submissionId, contact);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setResult(res);
      fireMetaPixelEvent("Lead");
      fireMetaPixelEvent("CompleteRegistration");
      goNext();
    } catch {
      setError("Something went wrong submitting your answers. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4 py-12"
      style={{ ["--funnel-color" as string]: funnel.primary_color }}
    >
      {funnel.meta_pixel_id && (
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
              n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${funnel.meta_pixel_id}');
              fbq('track', 'PageView');
            `,
          }}
        />
      )}
      {funnel.custom_head_script && (
        <Script
          id="funnel-head-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: funnel.custom_head_script }}
        />
      )}

      <div className="w-full max-w-lg">
        {funnel.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={funnel.logo_url} alt={funnel.name} className="mx-auto mb-6 h-10" />
        )}

        {questionPageIds.includes(page.id) && (
          <ProgressBar
            current={questionPageIds.indexOf(page.id) + 1}
            total={questionPageIds.length}
            color={funnel.primary_color}
          />
        )}

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        {page.page_type === "landing" && (
          <LandingPage page={page} color={funnel.primary_color} onNext={goNext} />
        )}

        {page.page_type === "question" && (
          <QuestionPage
            key={page.id}
            question={questionsByPage[page.id]?.[0]}
            color={funnel.primary_color}
            onAnswer={handleQuestionAnswer}
          />
        )}

        {page.page_type === "contact_info" && (
          <ContactPage
            page={page}
            contact={contact}
            onChange={setContact}
            onSubmit={handleContactSubmit}
            submitting={submitting}
            color={funnel.primary_color}
          />
        )}

        {page.page_type === "result" && (
          <ResultPage page={page} result={result} onNext={goNext} color={funnel.primary_color} />
        )}

        {page.page_type === "booking_redirect" && (
          <BookingRedirectPage
            page={page}
            result={result}
            submissionId={submissionId}
          />
        )}
      </div>

      {funnel.custom_body_script && (
        <div dangerouslySetInnerHTML={{ __html: funnel.custom_body_script }} />
      )}
    </div>
  );
}

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-center text-slate-500">
      {children}
    </div>
  );
}

function ProgressBar({ current, total, color }: { current: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="mb-8">
      <div className="mb-1 flex justify-between text-xs text-slate-400">
        <span>
          Question {current} of {total}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function primaryButtonStyle(color: string) {
  return { backgroundColor: color };
}

function LandingPage({
  page,
  color,
  onNext,
}: {
  page: FunnelPage;
  color: string;
  onNext: () => void;
}) {
  const content = page.content as { ctaText?: string };
  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold text-slate-900">{page.title}</h1>
      {page.subtitle && <p className="mt-3 text-lg text-slate-500">{page.subtitle}</p>}
      <button
        onClick={onNext}
        style={primaryButtonStyle(color)}
        className="mt-8 rounded-lg px-8 py-3 font-medium text-white transition hover:opacity-90"
      >
        {content.ctaText || "Get started"}
      </button>
    </div>
  );
}

function QuestionPage({
  question,
  color,
  onAnswer,
}: {
  question: FunnelQuestion | undefined;
  color: string;
  onAnswer: (question: FunnelQuestion, value: unknown) => void;
}) {
  const [textValue, setTextValue] = useState("");
  const [multiValue, setMultiValue] = useState<string[]>([]);

  if (!question) {
    return <CenteredMessage>This question isn&apos;t configured yet.</CenteredMessage>;
  }

  const type: FunnelQuestionType = question.question_type;

  if (type === "single_choice" || type === "dropdown" || type === "boolean") {
    const options =
      type === "boolean"
        ? [{ label: "Yes", value: "yes" }, { label: "No", value: "no" }]
        : question.options;
    return (
      <div>
        <h2 className="mb-6 text-center text-2xl font-semibold text-slate-900">
          {question.question_text}
        </h2>
        <div className="space-y-2">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onAnswer(question, opt.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-left transition hover:border-current"
              style={{ color }}
            >
              <span className="text-slate-900">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (type === "multiple_choice") {
    return (
      <div>
        <h2 className="mb-6 text-center text-2xl font-semibold text-slate-900">
          {question.question_text}
        </h2>
        <div className="space-y-2">
          {question.options.map((opt) => (
            <label
              key={opt.value}
              className="flex w-full items-center gap-3 rounded-lg border border-slate-300 px-4 py-3"
            >
              <input
                type="checkbox"
                checked={multiValue.includes(opt.value)}
                onChange={(e) =>
                  setMultiValue((v) =>
                    e.target.checked ? [...v, opt.value] : v.filter((x) => x !== opt.value)
                  )
                }
              />
              <span className="text-slate-900">{opt.label}</span>
            </label>
          ))}
        </div>
        <button
          onClick={() => onAnswer(question, multiValue)}
          disabled={question.is_required && multiValue.length === 0}
          style={primaryButtonStyle(color)}
          className="mt-6 w-full rounded-lg px-4 py-3 font-medium text-white disabled:opacity-40"
        >
          Continue
        </button>
      </div>
    );
  }

  // text, number, slider, date
  const inputType = type === "number" ? "number" : type === "slider" ? "range" : type === "date" ? "date" : "text";
  return (
    <div>
      <h2 className="mb-6 text-center text-2xl font-semibold text-slate-900">
        {question.question_text}
      </h2>
      <input
        type={inputType}
        value={textValue}
        onChange={(e) => setTextValue(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2"
      />
      <button
        onClick={() => onAnswer(question, textValue)}
        disabled={question.is_required && !textValue}
        style={primaryButtonStyle(color)}
        className="mt-6 w-full rounded-lg px-4 py-3 font-medium text-white disabled:opacity-40"
      >
        Continue
      </button>
    </div>
  );
}

function ContactPage({
  page,
  contact,
  onChange,
  onSubmit,
  submitting,
  color,
}: {
  page: FunnelPage;
  contact: { name: string; email: string; phone: string };
  onChange: (contact: { name: string; email: string; phone: string }) => void;
  onSubmit: () => void;
  submitting: boolean;
  color: string;
}) {
  const content = page.content as { intro?: string };
  const canSubmit = contact.name.trim() && contact.email.trim() && contact.phone.trim();

  return (
    <div>
      <h2 className="mb-2 text-center text-2xl font-semibold text-slate-900">
        {page.title || "Get your results"}
      </h2>
      {content.intro && <p className="mb-6 text-center text-slate-500">{content.intro}</p>}

      <div className="space-y-3">
        <input
          placeholder="Full name"
          value={contact.name}
          onChange={(e) => onChange({ ...contact, name: e.target.value })}
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2"
        />
        <input
          type="email"
          placeholder="Email"
          value={contact.email}
          onChange={(e) => onChange({ ...contact, email: e.target.value })}
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2"
        />
        <input
          type="tel"
          placeholder="Phone"
          value={contact.phone}
          onChange={(e) => onChange({ ...contact, phone: e.target.value })}
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2"
        />
      </div>

      <button
        onClick={onSubmit}
        disabled={!canSubmit || submitting}
        style={primaryButtonStyle(color)}
        className="mt-6 w-full rounded-lg px-4 py-3 font-medium text-white disabled:opacity-40"
      >
        {submitting ? "Submitting..." : "See my results"}
      </button>
    </div>
  );
}

function ResultPage({
  page,
  result,
  onNext,
  color,
}: {
  page: FunnelPage;
  result: RouteLeadResult | null;
  onNext: () => void;
  color: string;
}) {
  const content = page.content as { body?: string };
  return (
    <div className="text-center">
      <h2 className="text-2xl font-semibold text-slate-900">{page.title || "Your results"}</h2>
      {content.body && <p className="mt-3 text-slate-500">{content.body}</p>}
      {result && result.status === "unmatched" && (
        <p className="mt-3 text-sm text-slate-400">
          We&apos;ll have someone reach out to you shortly.
        </p>
      )}
      <button
        onClick={onNext}
        style={primaryButtonStyle(color)}
        className="mt-8 rounded-lg px-8 py-3 font-medium text-white transition hover:opacity-90"
      >
        Continue
      </button>
    </div>
  );
}

function BookingRedirectPage({
  page,
  result,
  submissionId,
}: {
  page: FunnelPage;
  result: RouteLeadResult | null;
  submissionId: string | null;
}) {
  const content = page.content as { message?: string; delaySeconds?: string };
  const delay = Number(content.delaySeconds ?? "2") * 1000;

  useEffect(() => {
    if (!result?.bookingCalendarUrl) return;
    const timer = setTimeout(async () => {
      fireMetaPixelEvent("Schedule");
      if (submissionId) await markFunnelRedirect(submissionId);
      window.location.href = result.bookingCalendarUrl!;
    }, delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.bookingCalendarUrl]);

  return (
    <div className="text-center">
      <h2 className="text-2xl font-semibold text-slate-900">
        {page.title || "Redirecting you now..."}
      </h2>
      <p className="mt-3 text-slate-500">
        {content.message || "Thanks! We're connecting you with the right specialist."}
      </p>
      {result?.bookingCalendarUrl ? (
        <a
          href={result.bookingCalendarUrl}
          className="mt-6 inline-block text-sm text-slate-400 underline"
        >
          Click here if you&apos;re not redirected automatically
        </a>
      ) : (
        <p className="mt-6 text-sm text-slate-400">We&apos;ll be in touch soon.</p>
      )}
    </div>
  );
}
