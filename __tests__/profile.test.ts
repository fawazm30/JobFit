import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { GET, PATCH, DELETE } from "@/app/api/profile/route";

describe("Profile API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: GET - Unauthorized
  it("should return 401 if user is not authenticated on GET", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  // Test 2: GET - Returns user profile
  it("should return user profile data", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      name: "Fawaz",
      email: "test@example.com",
      password: "hashed-password",
    } as any);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.name).toBe("Fawaz");
    expect(data.email).toBe("test@example.com");
    expect(data.hasPassword).toBe(true);
  });

  // Test 3: GET - hasPassword is false for Google users
  it("should return hasPassword false for Google users", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      name: "Fawaz",
      email: "test@example.com",
      password: null,
    } as any);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.hasPassword).toBe(false);
  });

  // Test 4: PATCH - Unauthorized
  it("should return 401 if user is not authenticated on PATCH", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const req = new Request("http://localhost/api/profile", {
      method: "PATCH",
      body: JSON.stringify({ name: "New Name" }),
    });

    const res = await PATCH(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  // Test 5: PATCH - Updates name and email
  it("should update user name and email", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
    } as any);

    vi.mocked(prisma.user.update).mockResolvedValue({
      id: "user-1",
      name: "New Name",
      email: "newemail@example.com",
    } as any);

    const req = new Request("http://localhost/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Name", email: "newemail@example.com" }),
    });

    const res = await PATCH(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
      data: { name: "New Name", email: "newemail@example.com" },
    });
  });

  // Test 6: DELETE - Unauthorized
  it("should return 401 if user is not authenticated on DELETE", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const res = await DELETE();
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  // Test 7: DELETE - Successfully deletes account
  it("should delete user account successfully", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
    } as any);

    vi.mocked(prisma.user.delete).mockResolvedValue({} as any);

    const res = await DELETE();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
    });
  });
});