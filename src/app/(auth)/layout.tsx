import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-full flex-1">
      <div className="relative hidden w-[48%] overflow-hidden lg:block">
        <Image
          src="/menu/menu-bucket.jpg"
          alt="Fried chicken bucket meal"
          fill
          priority
          className="object-cover"
          sizes="48vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1008]/95 via-[#2a1810]/55 to-[#1a1008]/25" />
        <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            OrderLine
          </Link>
          <div className="animate-fade-up">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-amber-100/80">
              Restaurant POS
            </p>
            <h1 className="mt-3 max-w-sm text-3xl font-semibold leading-tight">
              Take orders, run the kitchen, and keep every table moving.
            </h1>
          </div>
          <p className="text-sm text-amber-50/80">
            POS · Kitchen display · Menu & deals · Multi-tenant
          </p>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-6 py-12">
        <div
          className="pointer-events-none absolute inset-0 lg:hidden"
          aria-hidden
        >
          <Image
            src="/menu/menu-bucket.jpg"
            alt=""
            fill
            priority
            className="object-cover opacity-25"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-background/85" />
        </div>
        <div className="relative z-10 w-full max-w-md animate-fade-up">
          {children}
        </div>
      </div>
    </div>
  );
}
