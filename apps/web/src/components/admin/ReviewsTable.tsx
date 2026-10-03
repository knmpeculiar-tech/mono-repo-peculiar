"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/ui/Table";
import { ApiError } from "@/lib/api/client";
import { deleteReview, updateReview } from "@/lib/api/admin/reviews";
import type { Review } from "@/types/api";

export function ReviewsTable({
  reviews,
  productNameById,
}: {
  reviews: Review[];
  productNameById: Record<string, string>;
}) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleTogglePublish(review: Review) {
    setTogglingId(review.id);
    setErrorMessage(null);
    try {
      await updateReview(review.id, { isPublished: !review.isPublished });
      router.refresh();
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : "Couldn't update the review.");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteReview(deleteTarget.id);
      setDeleteTarget(null);
      router.refresh();
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : "Couldn't delete the review.");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {errorMessage ? <p className="text-danger text-caption">{errorMessage}</p> : null}
      <Table>
        <Thead>
          <Tr>
            <Th>Product</Th>
            <Th>Author</Th>
            <Th>Rating</Th>
            <Th>Title</Th>
            <Th>Status</Th>
            <Th />
          </Tr>
        </Thead>
        <Tbody>
          {reviews.map((review) => (
            <Tr key={review.id}>
              <Td>{productNameById[review.productId] ?? "Unknown product"}</Td>
              <Td>{review.authorName}</Td>
              <Td>{review.rating} / 5</Td>
              <Td>{review.title}</Td>
              <Td>
                <Badge variant={review.isPublished ? "success" : "neutral"}>
                  {review.isPublished ? "Published" : "Draft"}
                </Badge>
              </Td>
              <Td>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/admin/reviews/${review.id}`} className="text-brand text-sm hover:underline">
                    Edit
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleTogglePublish(review)}
                    disabled={togglingId === review.id}
                  >
                    {review.isPublished ? "Unpublish" : "Publish"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(review)}>
                    Delete
                  </Button>
                </div>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Delete this review?">
        <p className="text-body mb-4">This can&apos;t be undone.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
