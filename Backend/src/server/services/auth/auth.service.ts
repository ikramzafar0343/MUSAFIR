import { randomBytes, timingSafeEqual } from "node:crypto";

import bcrypt from "bcrypt";

import { brandName } from "@/constants/brand";
import { ADMIN_ROLES, type Role, ROLES } from "@/constants/roles";
import { AppError } from "@/lib/app-error";
import { hmacSha256Hex, sha256Hex, timingSafeHexEqual } from "@/lib/crypto";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { accountRepository } from "@/server/database/repositories/account/account.repository";
import { sessionRepository } from "@/server/database/repositories/session/session.repository";
import { sendMail } from "@/server/mail/mailer";

export type AuthUser = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: Role;
  readonly avatarUrl: string | null;
};

function toAuthUser(row: { id: string; name: string; email: string; role: Role; avatar_url: string | null }): AuthUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatarUrl: row.avatar_url,
  };
}

function passcodesMatch(input: string, expected: string): boolean {
  const left = input.trim().padStart(4, "0");
  const right = expected.trim().padStart(4, "0");
  if (left.length !== 4 || right.length !== 4) {
    return false;
  }
  return timingSafeEqual(Buffer.from(left), Buffer.from(right));
}

export class AuthService {
  async register(input: { name: string; email: string; password: string }): Promise<{ user: AuthUser; sessionToken: string }> {
    const email = input.email.toLowerCase().trim();
    const existing = await accountRepository.findByEmail(email);
    if (existing) {
      throw AppError.conflict("Email is already registered");
    }
    const passwordHash = await bcrypt.hash(input.password, 12);
    const account = await accountRepository.insert({
      name: input.name.trim(),
      email,
      passwordHash,
      role: ROLES.CUSTOMER,
    });
    const sessionToken = await this.createSession(account.id);
    return { user: toAuthUser(account), sessionToken };
  }

  async login(input: { email: string; password: string }): Promise<{ user: AuthUser; sessionToken: string }> {
    const account = await accountRepository.findByEmail(input.email.toLowerCase().trim());
    if (!account) {
      throw AppError.unauthenticated("Invalid email or password");
    }
    const valid = await bcrypt.compare(input.password, account.password_hash);
    if (!valid) {
      throw AppError.unauthenticated("Invalid email or password");
    }
    await accountRepository.markLogin(account.id);
    const sessionToken = await this.createSession(account.id);
    return { user: toAuthUser(account), sessionToken };
  }

  async requestAdminLogin(input: { email: string; password: string }): Promise<{
    challengeId: string;
  }> {
    const account = await accountRepository.findByEmail(input.email.toLowerCase().trim());
    if (!account) {
      throw AppError.unauthenticated("Invalid email or password");
    }
    if (!ADMIN_ROLES.includes(account.role)) {
      throw AppError.unauthorized("Admin access required");
    }
    const valid = await bcrypt.compare(input.password, account.password_hash);
    if (!valid) {
      throw AppError.unauthenticated("Invalid email or password");
    }
    const challengeId = randomBytes(24).toString("hex");
    await accountRepository.setAdminChallenge(account.id, {
      challengeId,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    logger.info({ userId: account.id }, "Admin passcode challenge issued");
    return { challengeId };
  }

  async verifyAdminOtp(input: { challengeId: string; otp: string }): Promise<{ user: AuthUser; sessionToken: string }> {
    const account = await accountRepository.findByAdminChallenge(input.challengeId);
    if (!account) {
      throw AppError.unauthenticated("Invalid verification session");
    }
    if (!account.admin_login_otp_expires || account.admin_login_otp_expires.getTime() < Date.now()) {
      throw AppError.expired("Passcode session expired");
    }
    if (!passcodesMatch(input.otp, getEnv().ADMIN_PASSCODE)) {
      throw AppError.unauthenticated("Invalid passcode");
    }
    await accountRepository.clearAdminChallenge(account.id);
    const sessionToken = await this.createSession(account.id);
    return { user: toAuthUser(account), sessionToken };
  }

  async createSession(accountId: string): Promise<string> {
    const env = getEnv();
    const token = randomBytes(32).toString("hex");
    await sessionRepository.insert({
      tokenHash: sha256Hex(token),
      accountId,
      expiresAt: new Date(Date.now() + env.SESSION_TTL_SECONDS * 1000),
    });
    return token;
  }

  async getUserFromSession(token: string | undefined): Promise<AuthUser | null> {
    if (!token) {
      return null;
    }
    const session = await sessionRepository.findValidByTokenHash(sha256Hex(token));
    if (!session) {
      return null;
    }
    const account = await accountRepository.findById(session.account_id);
    if (!account) {
      return null;
    }
    return toAuthUser(account);
  }

  async logout(token: string | undefined): Promise<void> {
    if (!token) {
      return;
    }
    await sessionRepository.deleteByTokenHash(sha256Hex(token));
  }

  createPasswordResetToken(email: string, passwordHash: string): string {
    const expires = String(Date.now() + 60 * 60 * 1000);
    const encodedEmail = Buffer.from(email, "utf8").toString("base64url");
    const signature = hmacSha256Hex(getEnv().SESSION_SECRET, `${email}|${expires}|${passwordHash}`);
    return `${encodedEmail}.${expires}.${signature}`;
  }

  async requestPasswordReset(email: string): Promise<{ resetPath?: string | undefined }> {
    const normalized = email.toLowerCase().trim();
    const account = await accountRepository.findByEmail(normalized);
    if (!account) {
      return {};
    }
    const token = this.createPasswordResetToken(account.email, account.password_hash);
    const resetPath = `/reset-password?token=${encodeURIComponent(token)}`;
    const sent = await sendMail({
      to: account.email,
      subject: `Reset your ${brandName} password`,
      text: `Use this link to choose a new password. It expires in one hour.\n\n${getEnv().APP_URL}${resetPath}`,
    });
    if (!sent && getEnv().NODE_ENV !== "production") {
      return { resetPath };
    }
    return {};
  }

  async resetPassword(input: { token: string; password: string }): Promise<void> {
    const [encodedEmail, expires, signature] = input.token.split(".");
    if (!encodedEmail || !expires || !signature) {
      throw AppError.unauthenticated("This reset link is not valid");
    }
    if (Number(expires) < Date.now()) {
      throw AppError.expired("This reset link has expired");
    }
    const email = Buffer.from(encodedEmail, "base64url").toString("utf8").toLowerCase().trim();
    const account = await accountRepository.findByEmail(email);
    if (!account) {
      throw AppError.unauthenticated("This reset link is not valid");
    }
    const expected = hmacSha256Hex(getEnv().SESSION_SECRET, `${account.email}|${expires}|${account.password_hash}`);
    if (!timingSafeHexEqual(signature, expected)) {
      throw AppError.unauthenticated("This reset link is not valid");
    }
    await accountRepository.updatePassword(account.id, await bcrypt.hash(input.password, 12));
  }

  async updateProfile(accountId: string, input: { name: string; email: string }): Promise<AuthUser> {
    const email = input.email.toLowerCase().trim();
    const existing = await accountRepository.findByEmail(email);
    if (existing && existing.id !== accountId) {
      throw AppError.conflict("Email is already registered");
    }
    const updated = await accountRepository.updateProfile(accountId, {
      name: input.name.trim(),
      email,
    });
    if (!updated) {
      throw AppError.notFound("Account not found");
    }
    return toAuthUser(updated);
  }

  async changePassword(accountId: string, input: { currentPassword: string; password: string }): Promise<void> {
    const account = await accountRepository.findById(accountId);
    if (!account) {
      throw AppError.notFound("Account not found");
    }
    const valid = await bcrypt.compare(input.currentPassword, account.password_hash);
    if (!valid) {
      throw AppError.unauthenticated("Current password is incorrect");
    }
    await accountRepository.updatePassword(accountId, await bcrypt.hash(input.password, 12));
  }

  async seedAdmin(): Promise<AuthUser> {
    const env = getEnv();
    const email = env.SEED_ADMIN_EMAIL.toLowerCase().trim();
    const account = await accountRepository.syncSeedAdmin({
      name: env.SEED_ADMIN_NAME,
      email,
      passwordHash: await bcrypt.hash(env.SEED_ADMIN_PASSWORD, 12),
      role: ROLES.SUPER_ADMIN,
    });
    return toAuthUser(account);
  }
}

export const authService = new AuthService();
