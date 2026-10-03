import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-border mt-16 border-t">
      <div className="text-caption mx-auto flex max-w-6xl flex-col gap-2 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>&copy; {new Date().getFullYear()} Peculiar. All rights reserved.</p>
        <nav className="flex gap-5" aria-label="Footer">
          <Link href="/#shop" className="hover:text-brand">
            Shop
          </Link>
          <Link href="/about" className="hover:text-brand">
            About
          </Link>
          <Link href="/blog" className="hover:text-brand">
            Blog
          </Link>
        </nav>
      </div>
    </footer>
  );
}
