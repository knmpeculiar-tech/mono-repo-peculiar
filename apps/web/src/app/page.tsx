import { AboutTeaser } from "@/components/home/AboutTeaser";
import { BlogTeaser } from "@/components/home/BlogTeaser";
import { Faq } from "@/components/home/Faq";
import { FeaturedProduct } from "@/components/home/FeaturedProduct";
import { Features } from "@/components/home/Features";
import { FinalCta } from "@/components/home/FinalCta";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Testimonials } from "@/components/home/Testimonials";
import { EmptyState } from "@/components/ui/EmptyState";
import { listBlogPosts } from "@/lib/api/blog";
import { listProducts } from "@/lib/api/products";
import { listProductReviews } from "@/lib/api/reviews";
import type { Review } from "@/types/api";

export const revalidate = 300;

export default async function HomePage() {
  const [products, posts] = await Promise.all([
    listProducts(revalidate),
    listBlogPosts(revalidate),
  ]);

  const featuredProduct = products[0];
  const reviews: Review[] = featuredProduct
    ? await listProductReviews(featuredProduct.id, revalidate)
    : [];

  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />

      <section id="shop" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        {featuredProduct ? (
          <FeaturedProduct product={featuredProduct} />
        ) : (
          <EmptyState
            title="Our first product is on its way"
            description="We're finalizing sizes and packs — check back shortly, or read the blog for updates."
          />
        )}
      </section>

      <Testimonials reviews={reviews} />
      <BlogTeaser posts={posts} />
      <Faq />
      <AboutTeaser />
      <FinalCta />
    </>
  );
}
