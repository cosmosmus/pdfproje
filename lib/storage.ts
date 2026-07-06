import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const LOCAL_STORAGE_DIR = path.join(process.cwd(), "storage");

export function isS3Configured(): boolean {
  return Boolean(
    process.env.S3_ENDPOINT &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY &&
      process.env.S3_BUCKET
  );
}

function s3Client(): S3Client {
  return new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: "auto",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  });
}

/**
 * Persists a file (PDF or thumbnail) under the given key. Uses R2/S3 when
 * configured (S3_ENDPOINT etc. set in env), otherwise falls back to local
 * disk under /storage so the app is fully runnable without cloud credentials
 * during development.
 */
export async function saveDocumentFile(
  key: string,
  buffer: Buffer,
  contentType: string = "application/pdf"
): Promise<void> {
  if (isS3Configured()) {
    await s3Client().send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );
    return;
  }

  const filePath = path.join(LOCAL_STORAGE_DIR, key);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, buffer);
}

/**
 * Presigned PUT URL for direct browser→R2 uploads. Serverless platformlarda
 * (Vercel, 4.5MB istek limiti) büyük PDF'ler sunucu üzerinden geçemez; dosya
 * tarayıcıdan doğrudan bucket'a gider. İmza content-type'ı da bağlar.
 * Yalnızca S3 modunda çağrılabilir — önce isS3Configured() kontrol edilmeli.
 */
export async function presignUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 600
): Promise<string> {
  return getSignedUrl(
    s3Client(),
    new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, ContentType: contentType }),
    { expiresIn: expiresInSeconds }
  );
}

/** Returns the object's size in bytes, or null if it doesn't exist. */
export async function statDocumentFile(key: string): Promise<number | null> {
  if (isS3Configured()) {
    try {
      const head = await s3Client().send(
        new HeadObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key })
      );
      return head.ContentLength ?? 0;
    } catch {
      return null;
    }
  }
  try {
    const { stat } = await import("fs/promises");
    const s = await stat(path.join(LOCAL_STORAGE_DIR, key));
    return s.size;
  } catch {
    return null;
  }
}

export async function readDocumentFile(key: string): Promise<Buffer> {
  if (isS3Configured()) {
    const result = await s3Client().send(
      new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key })
    );
    const bytes = await result.Body!.transformToByteArray();
    return Buffer.from(bytes);
  }

  const filePath = path.join(LOCAL_STORAGE_DIR, key);
  return readFile(filePath);
}
