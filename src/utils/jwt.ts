import { createHmac, timingSafeEqual } from "node:crypto";

export type JwtPayload = Record<string, string | number | boolean>;
export type VerifiedJwtPayload = JwtPayload & {
  iat?: number;
  exp?: number;
};

const TOKEN_EXPIRES_IN_SECONDS = 7 * 24 * 60 * 60;

const toBase64Url = (value: unknown) => {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
};

const fromBase64Url = <T>(value: string): T => {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
};

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV !== "production") {
    return "local-development-jwt-secret";
  }

  throw new Error("JWT_SECRET is required");
};

export const generateJwtToken = (
  payload: JwtPayload,
  expiresInSeconds = TOKEN_EXPIRES_IN_SECONDS,
) => {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + expiresInSeconds;
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const encodedHeader = toBase64Url(header);
  const encodedPayload = toBase64Url({
    ...payload,
    iat: issuedAt,
    exp: expiresAt,
  });
  const signature = createHmac("sha256", getJwtSecret())
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

export const verifyJwtToken = (token: string): VerifiedJwtPayload | null => {
  try {
    const [encodedHeader, encodedPayload, signature, extraPart] =
      token.split(".");

    if (!encodedHeader || !encodedPayload || !signature || extraPart) {
      return null;
    }

    const header = fromBase64Url<{ alg?: string; typ?: string }>(encodedHeader);

    if (header.alg !== "HS256" || header.typ !== "JWT") {
      return null;
    }

    const expectedSignature = createHmac("sha256", getJwtSecret())
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest("base64url");
    const signatureBuffer = Buffer.from(signature);
    const expectedSignatureBuffer = Buffer.from(expectedSignature);

    if (
      signatureBuffer.length !== expectedSignatureBuffer.length ||
      !timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
    ) {
      return null;
    }

    const payload = fromBase64Url<VerifiedJwtPayload>(encodedPayload);
    const currentTime = Math.floor(Date.now() / 1000);

    if (typeof payload.exp === "number" && payload.exp <= currentTime) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
};
