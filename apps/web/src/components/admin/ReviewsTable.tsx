"use client";

import Link from "next/link";
import { errorMessage, useToast } from "@/components/admin/feedback/AdminFeedback";
import { ConfirmDialog } from "@/components/admin/feedback/ConfirmDialog";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/ui/Table";
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
  const toast = useToast();
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleTogglePublish(review: Review) {
    setTogglingId(review.id);
    try {
      await updateReview(review.id, { isPublished: !review.isPublished });
      toast.success(review.isPublished ? "Review hidden from the store" : "Review published");
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't update the review."));
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteReview(deleteTarget.id);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
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
      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete this review?"
        confirmLabel="Delete review"
        pendingLabel="Deleting…"
        successMessage="Review deleted"
        onConfirm={handleDelete}
      >
        This can&apos;t be undone.
      </ConfirmDialog>
    </div>
  );
}
