import { prisma } from "../lib/prisma";
import type { CreateBlogPostInput, UpdateBlogPostInput } from "../validators/blog.validator";

export function listPublishedPosts() {
  return prisma.blogPost.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
  });
}

export function getPublishedPostBySlug(slug: string) {
  return prisma.blogPost.findFirst({ where: { slug, isPublished: true } });
}

export function listAllPosts() {
  return prisma.blogPost.findMany({ orderBy: { createdAt: "desc" } });
}

export function getPostById(id: string) {
  return prisma.blogPost.findUnique({ where: { id } });
}

export function createPost(input: CreateBlogPostInput) {
  return prisma.blogPost.create({
    data: { ...input, publishedAt: input.isPublished ? new Date() : null },
  });
}

export async function updatePost(id: string, input: UpdateBlogPostInput) {
  // Stamp publishedAt the first time a post transitions to published; leave
  // it alone on subsequent edits so it reflects the original publish date.
  if (input.isPublished) {
    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (existing && !existing.publishedAt) {
      return prisma.blogPost.update({
        where: { id },
        data: { ...input, publishedAt: new Date() },
      });
    }
  }
  return prisma.blogPost.update({ where: { id }, data: input });
}

export function deletePost(id: string) {
  return prisma.blogPost.delete({ where: { id } });
}
