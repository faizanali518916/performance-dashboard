import { createHash, randomBytes } from "crypto";
import { compare, hash } from "bcryptjs";

export const hashPassword = (password: string) => hash(password, 12);
export const verifyPassword = (password: string, digest: string) => compare(password, digest);
export const randomToken = () => randomBytes(32).toString("base64url");
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
