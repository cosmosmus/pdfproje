export default function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display font-extrabold text-xl tracking-tight text-ink mb-4">
      {children}
    </h2>
  );
}
