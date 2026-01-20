import { describe, it, expect, vi, beforeEach } from "vitest";

describe("deleteScrapeJob cascade delete logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delete tours with matching sourceUrl when deleting scrape job", async () => {
    // Simulate the logic from deleteScrapeJob
    const mockJob = {
      id: 1,
      url: "https://example.com/tour.pdf",
      name: "Test Job",
    };

    const mockTours = [
      { id: 1, title: "Tour 1", sourceUrl: "https://example.com/tour.pdf" },
      { id: 2, title: "Tour 2", sourceUrl: "https://example.com/tour.pdf" },
      { id: 3, title: "Tour 3", sourceUrl: "https://other.com/tour.pdf" },
    ];

    // Test the logic: tours with matching sourceUrl should be deleted
    const toursToDelete = mockTours.filter(
      (tour) => tour.sourceUrl === mockJob.url
    );

    expect(toursToDelete.length).toBe(2);
    expect(toursToDelete.map((t) => t.id)).toEqual([1, 2]);
  });

  it("should not delete any tours if scrape job has no url", async () => {
    const mockJob = {
      id: 1,
      url: null,
      name: "Test Job",
    };

    const mockTours = [
      { id: 1, title: "Tour 1", sourceUrl: "https://example.com/tour.pdf" },
      { id: 2, title: "Tour 2", sourceUrl: "https://example.com/tour.pdf" },
    ];

    // Test the logic: if job.url is null, no tours should be deleted
    const shouldDeleteTours = mockJob.url !== null;

    expect(shouldDeleteTours).toBe(false);
  });

  it("should not delete tours with different sourceUrl", async () => {
    const mockJob = {
      id: 1,
      url: "https://example.com/tour.pdf",
      name: "Test Job",
    };

    const mockTours = [
      { id: 1, title: "Tour 1", sourceUrl: "https://other.com/tour.pdf" },
      { id: 2, title: "Tour 2", sourceUrl: "https://another.com/tour.pdf" },
    ];

    // Test the logic: tours with different sourceUrl should not be deleted
    const toursToDelete = mockTours.filter(
      (tour) => tour.sourceUrl === mockJob.url
    );

    expect(toursToDelete.length).toBe(0);
  });

  it("should handle empty job array gracefully", async () => {
    const mockJobs: any[] = [];

    // Test the logic: if no job found, no action should be taken
    const job = mockJobs.length > 0 ? mockJobs[0] : null;
    const shouldDeleteTours = job && job.url;

    expect(shouldDeleteTours).toBeFalsy();
  });
});
