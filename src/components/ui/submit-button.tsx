"use client";

import { useFormStatus } from "react-dom";
import { clsx } from "clsx";

export function SubmitButton({
  children,
  pendingText,
  className,
}: {
  children: React.ReactNode;
  pendingText: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={clsx(
        "flex w-full items-center justify-center rounded-lg bg-brand-600 px-4 py-2.5 font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
    >
      {pending ? pendingText : children}
    </button>
  );
}
