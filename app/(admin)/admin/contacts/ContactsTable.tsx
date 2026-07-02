"use client";

import { useState, useTransition } from "react";

export type ContactGroup =
  | "APP_MEMBER"
  | "UNKNOWN_CUSTOMER"
  | "CURRENT_CUSTOMER"
  | "POTENTIAL_CUSTOMER";

export type ContactRow = {
  email: string;
  group: ContactGroup;
  firstSeen: string;
};

const GROUP_LABELS: Record<ContactGroup, string> = {
  APP_MEMBER: "App Üyesi",
  UNKNOWN_CUSTOMER: "Tanınmayan Müşteri",
  CURRENT_CUSTOMER: "Cari Müşterisi",
  POTENTIAL_CUSTOMER: "Potansiyel Müşteri",
};

type FilterTab = "ALL" | "UNASSIGNED" | ContactGroup;

const TABS: { key: FilterTab; label: string }[] = [
  { key: "ALL", label: "Tümü" },
  { key: "UNASSIGNED", label: "Tanımlanmamış" },
  { key: "APP_MEMBER", label: "App Üyesi" },
  { key: "UNKNOWN_CUSTOMER", label: "Tanınmayan" },
  { key: "CURRENT_CUSTOMER", label: "Cari" },
  { key: "POTENTIAL_CUSTOMER", label: "Potansiyel" },
];

function isAssigned(group: ContactGroup) {
  return group !== "UNKNOWN_CUSTOMER";
}

export default function ContactsTable({ rows: initialRows }: { rows: ContactRow[] }) {
  const [rows, setRows] = useState<ContactRow[]>(initialRows);
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  const visible = rows.filter((r) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "UNASSIGNED") return !isAssigned(r.group);
    return r.group === activeTab;
  });

  const countUnassigned = rows.filter((r) => !isAssigned(r.group)).length;
  const countByGroup = (g: ContactGroup) => rows.filter((r) => r.group === g).length;

  async function changeGroup(email: string, group: ContactGroup) {
    startTransition(() => {
      setRows((prev) => prev.map((r) => (r.email === email ? { ...r, group } : r)));
    });
    setSaving((prev) => new Set(prev).add(email));
    await fetch(`/api/admin/contacts/${encodeURIComponent(email)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group }),
    });
    setSaving((prev) => {
      const next = new Set(prev);
      next.delete(email);
      return next;
    });
  }

  return (
    <div className="bg-surface rounded-[28px] p-6 md:p-8">

      {/* Filtre sekmeleri */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-5">
        {TABS.map((tab) => {
          const count =
            tab.key === "ALL"
              ? rows.length
              : tab.key === "UNASSIGNED"
              ? countUnassigned
              : countByGroup(tab.key as ContactGroup);

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-2 ${
                activeTab === tab.key
                  ? "bg-ink text-surface"
                  : "text-ink/50 hover:bg-surface-muted hover:text-ink"
              }`}
            >
              {tab.label}
              <span
                className={`text-xs font-medium ${activeTab === tab.key ? "text-surface/60" : "text-ink/35"}`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tablo */}
      <div className="overflow-x-auto">
        {visible.length === 0 ? (
          <p className="p-8 text-sm text-ink/40 text-center">Bu filtrede kimse yok.</p>
        ) : (
          <table className="w-full text-sm min-w-[560px] border-separate border-spacing-y-1.5">
            <thead>
              <tr className="text-left text-xs text-ink/40">
                <th className="font-medium pb-2 pl-4">E-posta</th>
                <th className="font-medium pb-2">İlk Görülme</th>
                <th className="font-medium pb-2">Grup</th>
                <th className="w-8 pb-2" />
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => {
                const assigned = isAssigned(row.group);
                const cell = `transition-colors px-4 py-3 ${
                  assigned
                    ? "bg-emerald-50/50 group-hover:bg-emerald-50/80"
                    : "bg-red-50/50 group-hover:bg-red-50/80"
                }`;
                return (
                  <tr key={row.email} className="group">
                    {/* E-posta + renk göstergesi */}
                    <td className={`${cell} rounded-l-2xl`}>
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            assigned ? "bg-emerald-500" : "bg-red-400"
                          }`}
                        />
                        <span className="font-medium text-ink">{row.email}</span>
                      </div>
                    </td>

                    {/* Tarih */}
                    <td className={`${cell} text-ink/40 text-xs font-mono whitespace-nowrap`}>
                      {new Date(row.firstSeen).toLocaleDateString("tr-TR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Grup dropdown */}
                    <td className={cell}>
                      <select
                        value={row.group}
                        onChange={(e) => changeGroup(row.email, e.target.value as ContactGroup)}
                        className={`text-xs font-medium rounded-full px-3 py-1.5 border cursor-pointer outline-none transition-all appearance-none pr-6 ${
                          assigned
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:border-emerald-300"
                            : "bg-red-50 border-red-200 text-red-600 hover:border-red-300"
                        }`}
                        style={{ backgroundImage: "none" }}
                      >
                        {(
                          Object.entries(GROUP_LABELS) as [ContactGroup, string][]
                        ).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Kayıt durumu */}
                    <td className={`${cell} rounded-r-2xl text-right`}>
                      {saving.has(row.email) && (
                        <svg
                          className="w-3.5 h-3.5 animate-spin text-ink/30 inline"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Alt özet */}
      <div className="pt-5 mt-2 border-t border-rule flex items-center gap-5">
        <span className="text-sm font-medium text-ink/50">
          <span className="font-bold text-ink">{rows.length}</span> kişi toplam
        </span>
        {countUnassigned > 0 && (
          <span className="text-sm font-medium text-red-500">
            <span className="font-bold">{countUnassigned}</span> tanımlanmamış
          </span>
        )}
        <span className="text-sm font-medium text-emerald-600">
          <span className="font-bold">{rows.length - countUnassigned}</span> atanmış
        </span>
      </div>
    </div>
  );
}
