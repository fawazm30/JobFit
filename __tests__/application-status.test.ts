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
      update: vi.fn(),
    },
  },
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PATCH } from "@/app/api/jobs/[id]/application-status/route";

describe("Application Status API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: Unauthorized access
  it("should return 401 if user is not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const req = new Request("http://localhost/api/jobs/job-1/application-status", {
      method: "PATCH",
      body: JSON.stringify({ applicationStatus: "applied" }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "job-1" }) });
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  // Test 2: Successfully updates status
  it("should update application status successfully", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
    } as any);

    vi.mocked(prisma.jobPosting.update).mockResolvedValue({
      id: "job-1",
      applicationStatus: "applied",
    } as any);

    const req = new Request("http://localhost/api/jobs/job-1/application-status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationStatus: "applied" }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "job-1" }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.job.applicationStatus).toBe("applied");
  });

  // Test 3: Can clear status by setting null
  it("should clear application status when null is passed", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
    } as any);

    vi.mocked(prisma.jobPosting.update).mockResolvedValue({
      id: "job-1",
      applicationStatus: null,
    } as any);

    const req = new Request("http://localhost/api/jobs/job-1/application-status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationStatus: null }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "job-1" }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.job.applicationStatus).toBeNull();
  });

  // Test 4: All valid statuses are accepted
  it.each([
    "interested",
    "applied",
    "interview",
    "offer",
    "rejected",
    "ghosted",
  ])("should accept '%s' as a valid status", async (status) => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
    } as any);

    vi.mocked(prisma.jobPosting.update).mockResolvedValue({
      id: "job-1",
      applicationStatus: status,
    } as any);

    const req = new Request("http://localhost/api/jobs/job-1/application-status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationStatus: status }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "job-1" }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.job.applicationStatus).toBe(status);
  });
});