import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/product/ProductGallery";
import { PackagesIcon } from "@/components/icons";
import { LayerTech } from "@/components/product/LayerTech";
import { ProductFaq } from "@/components/product/ProductFaq";
import { ReviewList } from "@/components/product/ReviewList";
import { TrustStrip } from "@/components/product/TrustStrip";
import { ReviewStars } from "@/components/product/ReviewStars";
import { VariantSelector } from "@/components/product/VariantSelector";
import { JsonLd } from "@/components/seo/JsonLd";
import { ApiError } from "@/lib/api/client";
import { getProductBySlug, listProducts } from "@/lib/api/products";
import { listProductReviews } from "@/lib/api/reviews";
import { BRAND_FACTS } from "@/lib/brandFacts";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/seo/jsonld";
import { resolveStorageUrl } from "@/lib/storage";

export const revalidate = 60;

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

async function loadProduct(slug: string) {
  try {
    return await getProductBySlug(slug, revalidate);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function generateStaticParams() {
  const products = await listProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) return {};

  const imageUrl = product.images[0] ? resolveStorageUrl(product.images[0].storagePath) : undefined;

  return {
    title: product.name,
    description: product.description ?? undefined,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.description ?? undefined,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) {
    notFound();
  }

  const reviews = await listProductReviews(product.id, revalidate);
  const imageUrls = product.images.map((image) => resolveStorageUrl(image.storagePath));
  const primaryImageUrl = imageUrls[0] ?? null;
  const averageRating =
    reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <JsonLd data={productJsonLd(product, imageUrls, reviews)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "/" },
          { name: product.name, url: `/products/${product.slug}` },
        ])}
      />

      <div className="grid gap-8 md:grid-cols-2 md:gap-12">
        <ProductGallery images={product.images} productName={product.name} />

        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-heading-1">{product.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              {averageRating !== null ? (
                <a href="#reviews" className="flex items-center gap-2 hover:underline">
                  <ReviewStars rating={averageRating} />
                  <span className="text-caption">
                    {reviews.length} review{reviews.length === 1 ? "" : "s"}
                  </span>
                </a>
              ) : null}
              {/* Proof of scale beside the rating, where shoppers look first. */}
              <span className="text-caption flex items-center gap-1.5">
                <PackagesIcon className="h-4 w-4" />
                <span>
                  <strong className="text-foreground font-semibold">{BRAND_FACTS.packsSold}</strong>{" "}
                  packs sold
                </span>
              </span>
            </div>
          </div>

          {product.description ? (
            <p className="text-body text-muted-foreground">{product.description}</p>
          ) : null}

          <VariantSelector
            productSlug={product.slug}
            productName={product.name}
            imageUrl={primaryImageUrl}
            variants={product.variants}
          />

          <TrustStrip />
        </div>
      </div>

      <section id="reviews" className="mt-16 scroll-mt-24 pt-12 sm:mt-20 sm:pt-14">
        <p className="eyebrow mb-2 sm:mb-3">Customer Reviews</p>
        <h2 className="text-heading-2 mb-8 sm:mb-10">
          What our customers say
        </h2>
        <ReviewList reviews={reviews} />
      </section>

      <LayerTech />


      <ProductFaq />
    </div>
  );
}
