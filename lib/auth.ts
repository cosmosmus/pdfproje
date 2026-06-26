import { SignJWT, jwtVerify } from "jose";

const GATE_TOKEN_TTL_SECONDS = 90 * 24 * 60 * 60; // 90 days
const ADMIN_SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

function gateSecret(): Uint8Array {
  const secret = process.env.GATE_JWT_SECRET;
  if (!secret) throw new Error("GATE_JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export function gateCookieName(documentId: string): string {
  return `gate_${documentId}`;
}

export interface GatePayload {
  documentId: string;
  email: string;
  sid: string; // ViewerSession id
}

export async function signGateToken(payload: GatePayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${GATE_TOKEN_TTL_SECONDS}s`)
    .sign(gateSecret());
}

export async function verifyGateToken(
  token: string,
  expectedDocumentId: string
): Promise<GatePayload | null> {
  try {
    const { payload } = await jwtVerify(token, gateSecret());
    if (
      typeof payload.documentId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.sid !== "string" ||
      payload.documentId !== expectedDocumentId
    ) {
      return null;
    }
    return { documentId: payload.documentId, email: payload.email, sid: payload.sid };
  } catch {
    return null;
  }
}

export const GATE_TOKEN_MAX_AGE_SECONDS = GATE_TOKEN_TTL_SECONDS;

// --- Admin session (single-user dashboard auth) ---

const ADMIN_SESSION_COOKIE = "admin_session";

function adminSecret(): Uint8Array {
  const secret = process.env.GATE_JWT_SECRET;
  if (!secret) throw new Error("GATE_JWT_SECRET is not set");
  return new TextEncoder().encode(`admin:${secret}`);
}

export async function signAdminSession(email: string): Promise<string> {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_TTL_SECONDS}s`)
    .sign(adminSecret());
}

export async function verifyAdminSession(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, adminSecret());
    return typeof payload.email === "string" ? payload.email : null;
  } catch {
    return null;
  }
}

export { ADMIN_SESSION_COOKIE, ADMIN_SESSION_TTL_SECONDS };
