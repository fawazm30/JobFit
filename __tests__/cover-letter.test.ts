import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    jobPosting: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [{ type: "text", text: "<p>Dear Hiring Manager</p>" }],
      }),
    };
  },
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { GET, PATCH } from "@/app/api/jobs/[id]/cover-letter/route";
import { POST } from "@/app/api/jobs/[id]/generate-cover-letter/route";

describe("Cover Letter API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── GET ─────────────────────────────────────────────────────────

  it("GET: should return 401 if not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const req = new Request("http://localhost/api/jobs/job-1/cover-letter");
    const res = await GET(req, { params: Promise.resolve({ id: "job-1" }) });
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("GET: should return 404 if job not found", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
    } as any);

    vi.mocked(prisma.jobPosting.findFirst).mockResolvedValue(null);

    const req = new Request("http://localhost/api/jobs/job-1/cover-letter");
    const res = await GET(req, { params: Promise.resolve({ id: "job-1" }) });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Job not found");
  });

  it("GET: should return cover letter for job", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
    } as any);

    vi.mocked(prisma.jobPosting.findFirst).mockResolvedValue({
      id: "job-1",
      coverLetter: "<p>Dear Hiring Manager...</p>",
    } as any);

    const req = new Request("http://localhost/api/jobs/job-1/cover-letter");
    const res = await GET(req, { params: Promise.resolve({ id: "job-1" }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.coverLetter).toBe("<p>Dear Hiring Manager...</p>");
  });

  it("GET: should return null cover letter if not yet generated", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
    } as any);

    vi.mocked(prisma.jobPosting.findFirst).mockResolvedValue({
      id: "job-1",
      coverLetter: null,
    } as any);

    const req = new Request("http://localhost/api/jobs/job-1/cover-letter");
    const res = await GET(req, { params: Promise.resolve({ id: "job-1" }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.coverLetter).toBeNull();
  });

  // ─── PATCH ───────────────────────────────────────────────────────

  it("PATCH: should return 401 if not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const req = new Request("http://localhost/api/jobs/job-1/cover-letter", {
      method: "PATCH",
      body: JSON.stringify({ coverLetter: "<p>My cover letter</p>" }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "job-1" }) });
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("PATCH: should save cover letter successfully", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
    } as any);

    vi.mocked(prisma.jobPosting.update).mockResolvedValue({
      id: "job-1",
      coverLetter: "<p>My cover letter</p>",
    } as any);

    const req = new Request("http://localhost/api/jobs/job-1/cover-letter", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coverLetter: "<p>My cover letter</p>" }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "job-1" }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.job.coverLetter).toBe("<p>My cover letter</p>");
  });

  it("PATCH: should update existing cover letter", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
    } as any);

    vi.mocked(prisma.jobPosting.update).mockResolvedValue({
      id: "job-1",
      coverLetter: "<p>Updated cover letter</p>",
    } as any);

    const req = new Request("http://localhost/api/jobs/job-1/cover-letter", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coverLetter: "<p>Updated cover letter</p>" }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "job-1" }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.job.coverLetter).toBe("<p>Updated cover letter</p>");
    expect(prisma.jobPosting.update).toHaveBeenCalledWith({
      where: { id: "job-1" },
      data: { coverLetter: "<p>Updated cover letter</p>" },
    });
  });

  // ─── POST (Generate) ─────────────────────────────────────────────

  it("POST generate: should return 401 if not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const req = new Request("http://localhost/api/jobs/job-1/generate-cover-letter", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: "job-1" }) });
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("POST generate: should return 400 if no resume uploaded", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      resumeText: null,
    } as any);

    const req = new Request("http://localhost/api/jobs/job-1/generate-cover-letter", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: "job-1" }) });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("No resume uploaded");
  });

  it("POST generate: should return 404 if job not found", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      resumeText: "My resume text...",
      skills: ["JavaScript"],
    } as any);

    vi.mocked(prisma.jobPosting.findFirst).mockResolvedValue(null);

    const req = new Request("http://localhost/api/jobs/job-1/generate-cover-letter", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: "job-1" }) });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Job not found");
  });

  it("POST generate: should generate cover letter using Claude", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      resumeText: "Fawaz Mansoor software developer...",
      skills: ["JavaScript", "React"],
    } as any);

    vi.mocked(prisma.jobPosting.findFirst).mockResolvedValue({
      id: "job-1",
      title: "Software Developer",
      company: "Acme Corp",
      description: "We are looking for a software developer...",
      userId: "user-1",
    } as any);

    // Get the mock instance and override create
    const instance = new (vi.mocked(Anthropic))();
    vi.mocked(instance.messages.create).mockResolvedValue({
      content: [{ type: "text", text: "<p>Dear Hiring Manager,</p><p>I am excited to apply...</p>" }],
    } as any);

    const req = new Request("http://localhost/api/jobs/job-1/generate-cover-letter", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: "job-1" }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.coverLetter).toContain("Dear Hiring Manager");
  });

  it("POST generate: should strip markdown fences from Claude response", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      resumeText: "My resume...",
      skills: ["JavaScript"],
    } as any);

    vi.mocked(prisma.jobPosting.findFirst).mockResolvedValue({
      id: "job-1",
      title: "Developer",
      company: "Acme",
      description: "Job description...",
      userId: "user-1",
    } as any);

    const instance = new (vi.mocked(Anthropic))();
    vi.mocked(instance.messages.create).mockResolvedValue({
      content: [{ type: "text", text: "```html\n<p>Dear Hiring Manager</p>\n```" }],
    } as any);

    const req = new Request("http://localhost/api/jobs/job-1/generate-cover-letter", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: "job-1" }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.coverLetter).not.toContain("```");
    expect(data.coverLetter).toContain("<p>Dear Hiring Manager</p>");
  });
});