// Every public storefront fetch (products, reviews, blog) carries this tag so
// an admin change can expire all of them at once — see refreshStorefront.ts.
// One tag for the whole storefront rather than one per resource: the site is
// a handful of pages, so precision isn't worth the risk of missing one.
export const STOREFRONT_TAG = "storefront";
