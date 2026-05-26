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

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { POST, DELETE } from "@/app/api/skills/route";

describe("Skills API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── POST (Add Skill) ───────────────────────────────────────────

  it("POST: should return 401 if not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const req = new Request("http://localhost/api/skills", {
      method: "POST",
      body: JSON.stringify({ skill: "React" }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("POST: should return 404 if user not found", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "ghost@example.com" },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const req = new Request("http://localhost/api/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill: "React" }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("User not found");
  });

  it("POST: should add a skill to empty skills list", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      skills: [],
    } as any);

    vi.mocked(prisma.user.update).mockResolvedValue({} as any);

    const req = new Request("http://localhost/api/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill: "React" }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.skills).toContain("React");
    expect(data.skills).toHaveLength(1);
  });

  it("POST: should add a skill to existing skills list", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      skills: ["JavaScript", "TypeScript"],
    } as any);

    vi.mocked(prisma.user.update).mockResolvedValue({} as any);

    const req = new Request("http://localhost/api/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill: "React" }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.skills).toContain("React");
    expect(data.skills).toContain("JavaScript");
    expect(data.skills).toContain("TypeScript");
    expect(data.skills).toHaveLength(3);
  });

  it("POST: should allow duplicate skills to be added", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      skills: ["React"],
    } as any);

    vi.mocked(prisma.user.update).mockResolvedValue({} as any);

    const req = new Request("http://localhost/api/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill: "React" }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.skills).toHaveLength(2);
  });

  it("POST: should call prisma update with correct skills array", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      skills: ["JavaScript"],
    } as any);

    vi.mocked(prisma.user.update).mockResolvedValue({} as any);

    const req = new Request("http://localhost/api/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill: "TypeScript" }),
    });

    await POST(req);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
      data: { skills: ["JavaScript", "TypeScript"] },
    });
  });

  // ─── DELETE (Remove Skill) ───────────────────────────────────────

  it("DELETE: should return 401 if not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const req = new Request("http://localhost/api/skills", {
      method: "DELETE",
      body: JSON.stringify({ skill: "React" }),
    });

    const res = await DELETE(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("DELETE: should return 404 if user not found", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "ghost@example.com" },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const req = new Request("http://localhost/api/skills", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill: "React" }),
    });

    const res = await DELETE(req);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("User not found");
  });

  it("DELETE: should remove a skill from the list", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      skills: ["JavaScript", "React", "TypeScript"],
    } as any);

    vi.mocked(prisma.user.update).mockResolvedValue({} as any);

    const req = new Request("http://localhost/api/skills", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill: "React" }),
    });

    const res = await DELETE(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.skills).not.toContain("React");
    expect(data.skills).toContain("JavaScript");
    expect(data.skills).toContain("TypeScript");
    expect(data.skills).toHaveLength(2);
  });

  it("DELETE: should return same list if skill does not exist", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      skills: ["JavaScript", "TypeScript"],
    } as any);

    vi.mocked(prisma.user.update).mockResolvedValue({} as any);

    const req = new Request("http://localhost/api/skills", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill: "Python" }),
    });

    const res = await DELETE(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.skills).toHaveLength(2);
    expect(data.skills).toContain("JavaScript");
    expect(data.skills).toContain("TypeScript");
  });

  it("DELETE: should return empty array when removing last skill", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      skills: ["React"],
    } as any);

    vi.mocked(prisma.user.update).mockResolvedValue({} as any);

    const req = new Request("http://localhost/api/skills", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill: "React" }),
    });

    const res = await DELETE(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.skills).toHaveLength(0);
  });

  it("DELETE: should handle null skills gracefully", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      skills: null,
    } as any);

    vi.mocked(prisma.user.update).mockResolvedValue({} as any);

    const req = new Request("http://localhost/api/skills", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill: "React" }),
    });

    const res = await DELETE(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.skills).toHaveLength(0);
  });
});