export default function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2.5 font-sans text-base font-bold tracking-tight text-ink mb-3">
      <span className="w-2.5 h-2.5 rounded-full bg-ember shrink-0" />
      {children}
    </h2>
  );
}
