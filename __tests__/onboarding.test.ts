import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      update: vi.fn(),
    },
  },
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { POST } from "@/app/api/onboarding/route";

describe("Onboarding API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: Unauthorized access
  it("should return 401 if user is not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const req = new Request("http://localhost/api/onboarding", {
      method: "POST",
      body: JSON.stringify({
        industries: ["Technology"],
        locations: ["Calgary"],
        jobTypes: ["full-time"],
        jobTitles: ["Software Developer"],
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  // Test 2: Successfully saves onboarding data
  it("should save onboarding data successfully", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
    } as any);

    vi.mocked(prisma.user.update).mockResolvedValue({} as any);

    const req = new Request("http://localhost/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        industries: ["Technology"],
        locations: ["Calgary"],
        jobTypes: ["full-time"],
        jobTitles: ["Software Developer"],
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  // Test 3: Saves correct data to database
  it("should call prisma update with correct data", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
    } as any);

    vi.mocked(prisma.user.update).mockResolvedValue({} as any);

    const industries = ["Technology", "Healthcare", "Education"];
    const jobTypes = ["full-time", "part-time", "contract"];

    const req = new Request("http://localhost/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        industries,
        locations: ["Calgary"],
        jobTypes,
        jobTitles: ["Software Developer"],
      }),
    });

    await POST(req);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
      data: {
        industries,
        locations: ["Calgary"],
        jobTypes,
        jobTitles: ["Software Developer"],
        onboardingComplete: true,
      },
    });
  });

  // Test 4: Sets onboardingComplete to true
  it("should set onboardingComplete to true", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
    } as any);

    vi.mocked(prisma.user.update).mockResolvedValue({} as any);

    const req = new Request("http://localhost/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        industries: ["Technology"],
        locations: ["Calgary"],
        jobTypes: ["full-time"],
        jobTitles: [],
      }),
    });

    await POST(req);

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          onboardingComplete: true,
        }),
      })
    );
  });

  // ✅ Test 5: Handles empty job titles
  it("should handle empty job titles array", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { email: "test@example.com" },
    } as any);

    vi.mocked(prisma.user.update).mockResolvedValue({} as any);

    const req = new Request("http://localhost/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        industries: ["Technology"],
        locations: ["Calgary"],
        jobTypes: ["full-time"],
        jobTitles: [],
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });
});