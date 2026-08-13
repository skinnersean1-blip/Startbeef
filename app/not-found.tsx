import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="flex flex-col items-center gap-6 text-center w-full max-w-md">
        <div>
          <p className="text-beef-text-muted text-xs tracking-widest mb-2">OPINION MARKET</p>
          <Link href="/">
            <h1 className="text-5xl font-bold tracking-tighter mb-6 hover:text-beef-gold transition-colors">BEEF</h1>
          </Link>
        </div>
        <div className="card-beef w-full py-10">
          <p className="text-5xl font-bold mb-4">404</p>
          <p className="text-beef-text-muted text-sm mb-6">This page doesn&apos;t exist. Maybe the beef got squashed.</p>
          <Link href="/" className="btn-primary px-8 py-3">
            BACK TO BEEF
          </Link>
        </div>
      </div>
    </div>
  );
}
