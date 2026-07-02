"use client";

export default function LogoutButton() {
  return (
    <button
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        window.location.href = "/admin/login";
      }}
      className="text-xs text-ink/45 hover:text-danger transition-colors"
    >
      Çıkış yap
    </button>
  );
}
