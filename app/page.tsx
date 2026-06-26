import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-shell gap-6">
      <p className="font-display font-extrabold text-3xl text-ink">Vitrin</p>
      <Link
        href="/admin"
        className="bg-signal text-ink font-medium rounded-lg px-5 py-2.5 hover:bg-signal-dim transition-colors"
      >
        Kontrol Odasına Git
      </Link>
    </div>
  );
}
