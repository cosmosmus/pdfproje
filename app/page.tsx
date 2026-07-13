import { redirect } from "next/navigation";

export default function Home() {
  // Girişli kullanıcı panele, girişsiz kullanıcı /admin üzerinden login'e düşer.
  redirect("/admin");
}
