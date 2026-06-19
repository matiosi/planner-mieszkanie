import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export interface UploadPolicy {
  allowedTypes: readonly string[];
  maxBytes: number;
}

export const IMAGE_UPLOAD_POLICY: UploadPolicy = {
  allowedTypes: ["image/jpeg", "image/png", "image/webp"],
  maxBytes: 10 * 1024 * 1024,
};

export const PLAN_UPLOAD_POLICY: UploadPolicy = {
  allowedTypes: ["image/jpeg", "image/png", "image/webp"],
  maxBytes: 20 * 1024 * 1024,
};

export const DOCUMENT_UPLOAD_POLICY: UploadPolicy = {
  allowedTypes: [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  maxBytes: 50 * 1024 * 1024,
};

export function assertUpload(file: File, policy: UploadPolicy) {
  if (!policy.allowedTypes.includes(file.type)) {
    throw new Error("Nieobsługiwany typ pliku.");
  }
  if (file.size > policy.maxBytes) {
    throw new Error(`Plik może mieć maksymalnie ${Math.round(policy.maxBytes / 1024 / 1024)} MB.`);
  }
}

export function extensionForMime(contentType: string) {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "application/pdf") return "pdf";
  if (contentType.includes("wordprocessingml")) return "docx";
  if (contentType.includes("spreadsheetml")) return "xlsx";
  if (contentType === "application/msword") return "doc";
  if (contentType === "application/vnd.ms-excel") return "xls";
  return "jpg";
}

export function safeStoragePath(userId: string, projectId: string, folder: string, contentType: string) {
  return `users/${userId}/projects/${projectId}/${folder}/${crypto.randomUUID()}.${extensionForMime(contentType)}`;
}

function isPrivateIPv4(ip: string) {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true;
  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

function isPrivateIPv6(ip: string) {
  const normalized = ip.toLowerCase();
  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:") ||
    normalized.startsWith("::ffff:127.") ||
    normalized.startsWith("::ffff:10.") ||
    normalized.startsWith("::ffff:192.168.")
  );
}

async function assertPublicHttpUrl(rawUrl: string) {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Nieprawidłowy URL.");
  }

  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Dozwolone są tylko adresy http/https.");
  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost")) throw new Error("Ten host jest niedozwolony.");

  const directIp = isIP(hostname);
  const addresses = directIp ? [{ address: hostname }] : await lookup(hostname, { all: true });
  for (const entry of addresses) {
    if (isIP(entry.address) === 4 && isPrivateIPv4(entry.address)) throw new Error("Adres wskazuje na sieć prywatną.");
    if (isIP(entry.address) === 6 && isPrivateIPv6(entry.address)) throw new Error("Adres wskazuje na sieć prywatną.");
  }

  return url.toString();
}

export async function safeFetchExternalResource(
  rawUrl: string,
  options: {
    accept: readonly string[];
    maxBytes: number;
    timeoutMs?: number;
    headers?: HeadersInit;
  }
) {
  let currentUrl = await assertPublicHttpUrl(rawUrl);
  const timeoutMs = options.timeoutMs ?? 12000;

  for (let redirects = 0; redirects <= 3; redirects++) {
    const response = await fetch(currentUrl, {
      headers: options.headers,
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Redirect bez adresu docelowego.");
      currentUrl = await assertPublicHttpUrl(new URL(location, currentUrl).toString());
      continue;
    }

    if (!response.ok) throw new Error(`Nie udało się pobrać zasobu (${response.status}).`);

    const contentType = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (!options.accept.includes(contentType)) throw new Error("Nieobsługiwany typ pobranego zasobu.");

    const length = Number(response.headers.get("content-length") ?? "0");
    if (length > options.maxBytes) throw new Error("Pobrany zasób jest za duży.");

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > options.maxBytes) throw new Error("Pobrany zasób jest za duży.");
    return { buffer, contentType, finalUrl: currentUrl };
  }

  throw new Error("Za dużo przekierowań.");
}
