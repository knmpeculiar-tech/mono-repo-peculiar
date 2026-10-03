"use client";

import Link from "next/link";
import { ConfirmDialog } from "@/components/admin/feedback/ConfirmDialog";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/ui/Table";
import { deleteBlogPost } from "@/lib/api/admin/blog";
import type { BlogPost } from "@/types/api";

export function BlogTable({ posts }: { posts: BlogPost[] }) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);

  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteBlogPost(deleteTarget.id);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <Table>
        <Thead>
          <Tr>
            <Th>Title</Th>
            <Th>Slug</Th>
            <Th>Status</Th>
            <Th>Published</Th>
            <Th />
          </Tr>
        </Thead>
        <Tbody>
          {posts.map((post) => (
            <Tr key={post.id}>
              <Td>{post.title}</Td>
              <Td className="text-muted-foreground">{post.slug}</Td>
              <Td>
                <Badge variant={post.isPublished ? "success" : "neutral"}>
                  {post.isPublished ? "Published" : "Draft"}
                </Badge>
              </Td>
              <Td className="text-muted-foreground">
                {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : "—"}
              </Td>
              <Td>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/admin/blog/${post.id}`} className="text-brand text-sm hover:underline">
                    Edit
                  </Link>
                  <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(post)}>
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
        title="Delete this post?"
        confirmLabel="Delete post"
        pendingLabel="Deleting…"
        successMessage="Post deleted"
        onConfirm={handleDelete}
      >
        This can&apos;t be undone.
      </ConfirmDialog>
    </div>
  );
}
