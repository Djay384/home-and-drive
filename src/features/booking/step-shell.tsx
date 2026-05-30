import { motion } from "motion/react";
import type { ReactNode } from "react";

export function StepShell({
  eyebrow,
  title,
  description,
  children,
  onBack,
  wide,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  onBack?: () => void;
  wide?: boolean;
}) {
  return (
    <motion.section
      key={typeof title === "string" ? title : undefined}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: [0.19, 1, 0.22, 1] }}
      className="min-h-screen flex flex-col justify-center py-20 px-6 sm:px-12 bg-surface"
    >
      <div className={`${wide ? "max-w-screen-xl" : "max-w-3xl"} mx-auto w-full`}>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-8 text-xs uppercase tracking-widest text-neutral-500 hover:text-brand transition-colors inline-flex items-center gap-2"
          >
            <span aria-hidden>←</span> Retour
          </button>
        )}
        <div className="max-w-[48ch] space-y-4">
          {eyebrow && (
            <span className="text-xs uppercase tracking-widest text-brand font-medium">
              {eyebrow}
            </span>
          )}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium font-serif leading-tight text-balance text-neutral-900">
            {title}
          </h1>
          {description && (
            <p className="text-base md:text-lg text-neutral-600 text-pretty max-w-[52ch]">
              {description}
            </p>
          )}
        </div>
        <div className="mt-12">{children}</div>
      </div>
    </motion.section>
  );
}
