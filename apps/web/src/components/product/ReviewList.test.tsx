import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Review } from "@/types/api";
import { ReviewList } from "./ReviewList";

function makeReviews(count: number): Review[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `r${index + 1}`,
    productId: "p1",
    authorName: `Reviewer ${index + 1}`,
    rating: 5,
    title: `Review title ${index + 1}`,
    body: "Body",
    isPublished: true,
    imagePaths: [],
    videoPaths: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

describe("ReviewList", () => {
  it("shows 5 reviews at first, then 5 more per click, until all are shown", () => {
    render(<ReviewList reviews={makeReviews(12)} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(5);

    fireEvent.click(screen.getByRole("button", { name: "Show more reviews (7 more)" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(10);

    fireEvent.click(screen.getByRole("button", { name: "Show more reviews (2 more)" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(12);
    expect(screen.queryByRole("button", { name: /show more/i })).not.toBeInTheDocument();
  });

  it("moves focus to the first newly revealed review", () => {
    render(<ReviewList reviews={makeReviews(7)} />);
    fireEvent.click(screen.getByRole("button", { name: /show more/i }));
    expect(document.activeElement).toBe(screen.getAllByRole("listitem")[5]);
  });

  it("has no button when there are 5 or fewer reviews", () => {
    render(<ReviewList reviews={makeReviews(5)} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows an empty state with no reviews", () => {
    render(<ReviewList reviews={[]} />);
    expect(screen.getByText("No reviews yet.")).toBeInTheDocument();
  });
});
