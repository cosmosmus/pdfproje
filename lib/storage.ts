import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const LOCAL_STORAGE_DIR = path.join(process.cwd(), "storage");

function isS3Configured(): boolean {
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
