import Link from "next/link";

export default function NotFound() {
  return <main className="grid min-h-screen place-items-center p-5"><section className="panel max-w-md p-8 text-center"><p className="eyebrow">404</p><h1 className="mt-2 text-2xl font-extrabold">We couldn’t find that page.</h1><p className="mt-3 text-sm leading-6 text-muted">Return to Cart2Class and sign in to your authorized portal.</p><Link href="/login" className="mt-6 inline-block text-sm font-bold text-brand hover:underline">Go to sign in</Link></section></main>;
}
