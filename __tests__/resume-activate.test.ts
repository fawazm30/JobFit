import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      update: vi.fn(),
    },
    resumeVersion: {
      findUnique: vi.fn(),
    },
  },
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PATCH } from "@/app/api/resume/activate/route";

describe("Resume Activate API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: Unauthorized access
  it("should return 401 if user is not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const req = new Request("http://localhost/api/resume/activate", {
      method: "PATCH",
      body: JSON.stringify({ resumeVersionId: "version-1" }),
    });

    const res = await PATCH(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  // Test 2: Returns 404 if version not found
  it("should return 404 if resume version does not exist", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
    } as any);

    vi.mocked(prisma.resumeVersion.findUnique).mockResolvedValue(null);

    const req = new Request("http://localhost/api/resume/activate", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeVersionId: "nonexistent-version" }),
    });

    const res = await PATCH(req);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Version not found");
  });

  // Test 3: Successfully activates a resume version
  it("should activate resume version and update user fields", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
    } as any);

    vi.mocked(prisma.resumeVersion.findUnique).mockResolvedValue({
      id: "version-1",
      name: "Software Developer Resume",
      resumeUrl: "https://example.com/resume.pdf",
      resumeText: "John Doe software developer...",
      skills: ["JavaScript", "React", "TypeScript"],
      userId: "user-1",
      createdAt: new Date(),
    } as any);

    vi.mocked(prisma.user.update).mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      resumeUrl: "https://example.com/resume.pdf",
      resumeText: "John Doe software developer...",
      skills: ["JavaScript", "React", "TypeScript"],
    } as any);

    const req = new Request("http://localhost/api/resume/activate", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeVersionId: "version-1" }),
    });

    const res = await PATCH(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);

    // Verify user was updated with version data
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
      data: {
        resumeText: "John Doe software developer...",
        resumeUrl: "https://example.com/resume.pdf",
        skills: ["JavaScript", "React", "TypeScript"],
      },
    });
  });

  // Test 4: User skills are updated with version skills
  it("should update user skills when activating a version", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
    } as any);

    const newSkills = ["Python", "Django", "PostgreSQL"];

    vi.mocked(prisma.resumeVersion.findUnique).mockResolvedValue({
      id: "version-2",
      name: "Backend Developer Resume",
      resumeUrl: "https://example.com/backend-resume.pdf",
      resumeText: "Backend developer...",
      skills: newSkills,
      userId: "user-1",
      createdAt: new Date(),
    } as any);

    vi.mocked(prisma.user.update).mockResolvedValue({} as any);

    const req = new Request("http://localhost/api/resume/activate", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeVersionId: "version-2" }),
    });

    const res = await PATCH(req);

    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          skills: newSkills,
        }),
      })
    );
  });
});