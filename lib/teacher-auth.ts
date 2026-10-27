import { env } from "cloudflare:workers";

const COOKIE_NAME = "dtpl_teacher_session";
const SESSION_AGE_SECONDS = 60 * 60 * 8;

function bytesToHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function parseCookies(request: Request) {
  return Object.fromEntries(
    (request.headers.get("cookie") || "")
      .split(";")
      .map((part) => part.trim().split("="))
      .filter(([name, value]) => Boolean(name && value))
      .map(([name, ...value]) => [name, decodeURIComponent(value.join("="))]),
  );
}

async function sign(payload: string) {
  if (!env.SESSION_SECRET) throw new Error("SESSION_SECRET não configurado.");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return bytesToHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
}

export async function createTeacherSessionCookie() {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_AGE_SECONDS;
  const payload = String(expiresAt);
  const token = `${payload}.${await sign(payload)}`;
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_AGE_SECONDS}`;
}

export function clearTeacherSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export async function isTeacherAuthenticated(request: Request) {
  const token = parseCookies(request)[COOKIE_NAME];
  if (!token) return false;
  const [expiresAt, signature] = token.split(".");
  if (!expiresAt || !signature || Number(expiresAt) < Math.floor(Date.now() / 1000)) return false;
  const expected = await sign(expiresAt);
  if (signature.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < signature.length; index += 1) {
    difference |= signature.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return difference === 0;
}

export function passwordIsConfigured() {
  return Boolean(env.TEACHER_PASSWORD && env.SESSION_SECRET);
}

export function teacherPasswordMatches(password: string) {
  const expected = env.TEACHER_PASSWORD || "";
  if (!expected || password.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < password.length; index += 1) {
    difference |= password.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return difference === 0;
}
