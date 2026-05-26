import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { PATCH } from "@/app/api/profile/password/route";

describe("Profile Password API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: Unauthorized
  it("should return 401 if not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const req = new Request("http://localhost/api/profile/password", {
      method: "PATCH",
      body: JSON.stringify({
        currentPassword: "oldpass",
        newPassword: "newpass",
      }),
    });

    const res = await PATCH(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  // Test 2: No password set (Google user)
  it("should return 400 if user has no password set", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      password: null,
    } as any);

    const req = new Request("http://localhost/api/profile/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: "oldpass",
        newPassword: "newpass",
      }),
    });

    const res = await PATCH(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("No password set");
  });

  // Test 3: Wrong current password
  it("should return 400 if current password is incorrect", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      password: "hashed-password",
    } as any);

    vi.mocked(bcrypt.compare).mockResolvedValue(false as any);

    const req = new Request("http://localhost/api/profile/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: "wrongpassword",
        newPassword: "newpassword123",
      }),
    });

    const res = await PATCH(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Current password is incorrect");
  });

  // Test 4: Successfully changes password
  it("should change password successfully", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      password: "hashed-old-password",
    } as any);

    vi.mocked(bcrypt.compare).mockResolvedValue(true as any);
    vi.mocked(bcrypt.hash).mockResolvedValue("hashed-new-password" as any);
    vi.mocked(prisma.user.update).mockResolvedValue({} as any);

    const req = new Request("http://localhost/api/profile/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: "correctpassword",
        newPassword: "newpassword123",
      }),
    });

    const res = await PATCH(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  // Test 5: New password is hashed before saving
  it("should hash the new password before saving", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      password: "hashed-old-password",
    } as any);

    vi.mocked(bcrypt.compare).mockResolvedValue(true as any);
    vi.mocked(bcrypt.hash).mockResolvedValue("hashed-new-password" as any);
    vi.mocked(prisma.user.update).mockResolvedValue({} as any);

    const req = new Request("http://localhost/api/profile/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: "correctpassword",
        newPassword: "newpassword123",
      }),
    });

    await PATCH(req);

    expect(bcrypt.hash).toHaveBeenCalledWith("newpassword123", 10);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
      data: { password: "hashed-new-password" },
    });
  });

  // Test 6: User not found
  it("should return 400 if user not found", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "ghost@example.com" },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const req = new Request("http://localhost/api/profile/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: "oldpass",
        newPassword: "newpass",
      }),
    });

    const res = await PATCH(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("No password set");
  });

  // Test 7: Current password is verified against stored hash
  it("should verify current password against stored hash", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      password: "hashed-old-password",
    } as any);

    vi.mocked(bcrypt.compare).mockResolvedValue(true as any);
    vi.mocked(bcrypt.hash).mockResolvedValue("hashed-new-password" as any);
    vi.mocked(prisma.user.update).mockResolvedValue({} as any);

    const req = new Request("http://localhost/api/profile/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: "correctpassword",
        newPassword: "newpassword123",
      }),
    });

    await PATCH(req);

    expect(bcrypt.compare).toHaveBeenCalledWith(
      "correctpassword",
      "hashed-old-password"
    );
  });
});