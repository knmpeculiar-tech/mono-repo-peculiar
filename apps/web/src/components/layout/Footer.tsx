import Image from "next/image";
import Link from "next/link";
import { POLICY_LINKS } from "@/components/legal/LegalPage";

// Policy links on every page: customers expect them, and payment gateways
// (Razorpay) check for them during website verification.
export function Footer() {
  return (
    <footer className="border-border mt-16 border-t">
      <div className="text-caption mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6">
        {/* Top row: logo + nav links + social icons */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          {/* Logo & brand */}
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/knm.jpeg"
              alt="KNM logo"
              width={40}
              height={40}
              className="rounded-md"
            />
            <span className="text-sm font-semibold tracking-wide">
              Peculiar
            </span>
          </Link>

          {/* Nav links */}
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

          {/* Social links */}
          <div className="flex items-center gap-4">
            <a
              href="https://www.instagram.com/peculiars.in/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow us on Instagram"
              className="hover:text-brand transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a
              href="https://www.youtube.com/channel/UCsgBEoMBaDxWqUAjUgZRhMg"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Watch us on YouTube"
              className="hover:text-brand transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
              </svg>
            </a>
          </div>
        </div>

        {/* Bottom row: copyright + policy links */}
        <div className="border-border flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Peculiar. All rights reserved.</p>
          <nav aria-label="Policies">
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {POLICY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-brand">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}

