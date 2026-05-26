import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    resumeVersion: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { GET, POST } from "@/app/api/resume/versions/route";

describe("Resume Versions API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: Unauthorized access
  it("should return 401 if user is not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  // Test 2: Returns versions for authenticated user
  it("should return resume versions for authenticated user", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
    } as any);

    vi.mocked(prisma.resumeVersion.findMany).mockResolvedValue([
      {
        id: "version-1",
        name: "Software Developer Resume",
        resumeUrl: "https://example.com/resume.pdf",
        skills: ["JavaScript", "React"],
        createdAt: new Date(),
        userId: "user-1",
      },
    ] as any);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.versions).toHaveLength(1);
    expect(data.versions[0].name).toBe("Software Developer Resume");
  });

  // Test 3: Returns empty array when no versions
  it("should return empty array when user has no resume versions", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
    } as any);

    vi.mocked(prisma.resumeVersion.findMany).mockResolvedValue([]);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.versions).toHaveLength(0);
  });

  // Test 4: Returns 404 if user not found
  it("should return 404 if user not found in database", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "ghost@example.com" },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("User not found");
  });
});