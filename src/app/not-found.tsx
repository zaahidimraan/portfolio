import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-5 py-32 text-center">
      <p className="font-mono text-sm uppercase tracking-[0.2em] text-accent">404</p>
      <h1 className="text-2xl font-semibold">This page doesn&apos;t exist</h1>
      <p className="max-w-md text-muted">
        The page you&apos;re looking for was moved or never existed.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        Back to the homepage
      </Link>
    </main>
  );
}
