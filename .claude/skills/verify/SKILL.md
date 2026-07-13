---
name: verify
description: Vitrin uygulamasını çalıştırıp değişiklikleri uçtan uca doğrulama tarifi
---

# Vitrin'i çalıştırıp doğrulama

Next.js 16 (Cache Components) + Prisma/Neon Postgres + R2. Yerel ve prod AYNI Neon DB'yi ve AYNI R2 bucket'ını kullanır (.env) — DB'ye yazan probe'larda dikkatli ol, değiştirdiğini eski değerine geri al.

## Başlatma

```bash
npm run dev -- -p 3789   # arka planda; ~10 sn'de hazır
curl -s -o /dev/null -w '%{http_code}' http://localhost:3789/   # 200 bekle
```

## İşe yarayan yüzeyler

- Public API'ler doğrudan curl'lenebilir: `/api/branding/logo|favicon|contact`, `/api/track`, `/doc/{slug}`.
- `/api/admin/*` rotaları admin session cookie ister; oturumsuz 401 döner (401 kontrolü de geçerli bir probe).
- İkili yanıtları (logo vb.) doğrulamak için R2'deki kaynak dosyayla `cmp` yap; R2'den dosya çekmek için `.env`'i `process.loadEnvFile('.env')` ile yükleyip `@aws-sdk/client-s3` kullan.

## DB'ye hızlı bakış

`psql` kurulu; URL tırnaklı olduğundan böyle al:

```bash
DBURL=$(grep '^DATABASE_URL=' .env | cut -d= -f2- | tr -d '"')
psql "$DBURL" -c '...'
```

## Tuzaklar

- `lib/` TypeScript'i `@/` alias'ı yüzünden `node --experimental-strip-types` ile doğrudan import EDİLEMEZ — API'yi HTTP'den test et, ya da generated Prisma client yerine psql kullan.
- Public branding rotalarında `Cache-Control: public, max-age=300` var — tarayıcıda bakarken bayat görebilirsin, curl her zaman taze çeker.
