import { describeUserAgent } from "@/lib/user-agent";
import { countryFlagUrl } from "@/lib/country-flag";
import CountryFlagImg from "../_components/CountryFlagImg";

type LoginRow = {
  id: string;
  createdAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  country: string | null;
  city: string | null;
};

const cell = "bg-shell/60 group-hover:bg-surface-muted transition-colors p-4";

export default function LoginHistory({ logins }: { logins: LoginRow[] }) {
  return (
    <div className="bg-surface rounded-[28px] p-6">
      <h2 className="font-display font-extrabold text-lg tracking-tight mb-1">Son Girişler</h2>
      <p className="text-sm text-ink/45 mb-4">
        Hesabına yapılan son girişler. Tanımadığın bir giriş görürsen şifreni değiştir.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[560px] border-separate border-spacing-y-1.5">
          <thead>
            <tr className="text-left text-xs text-ink/40">
              <th className="font-medium pb-2 pl-4">Tarih</th>
              <th className="font-medium pb-2">Konum</th>
              <th className="font-medium pb-2">IP</th>
              <th className="font-medium pb-2">Cihaz</th>
            </tr>
          </thead>
          <tbody>
            {logins.map((l) => (
              <tr key={l.id} className="group">
                <td className={`${cell} rounded-l-2xl font-mono text-xs text-ink/50 whitespace-nowrap`}>
                  {l.createdAt.toLocaleString("tr-TR")}
                </td>
                <td className={`${cell} text-ink/60 whitespace-nowrap`} title={l.city ? "IP tabanlı tahmini konum" : undefined}>
                  <span className="inline-flex items-center gap-1.5">
                    {countryFlagUrl(l.country) && (
                      <CountryFlagImg src={countryFlagUrl(l.country)!} className="w-4 h-3 rounded-[2px] object-cover shrink-0" />
                    )}
                    {l.country ?? "—"}
                    {l.city && <span className="text-ink/40 text-xs"> · {l.city}</span>}
                  </span>
                </td>
                <td className={`${cell} font-mono text-xs text-ink/50 whitespace-nowrap`}>{l.ipAddress ?? "—"}</td>
                <td className={`${cell} rounded-r-2xl text-ink/40 text-xs`}>{describeUserAgent(l.userAgent)}</td>
              </tr>
            ))}
            {logins.length === 0 && (
              <tr>
                <td className="p-4 text-ink/40" colSpan={4}>
                  Henüz giriş kaydı yok — bir sonraki girişinden itibaren burada listelenecek.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
