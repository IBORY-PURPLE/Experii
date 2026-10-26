import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Landing } from '@/components/Landing';
import type { HeroVariant } from '@/lib/signup-schema';

const VARIANTS = ['h2', 'h3'] as const satisfies readonly HeroVariant[];

export const dynamicParams = false;

export function generateStaticParams() {
  return VARIANTS.map((variant) => ({ variant }));
}

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  robots: { index: false, follow: true },
};

export default async function VariantPage({ params }: { params: Promise<{ variant: string }> }) {
  const { variant } = await params;
  if (!(VARIANTS as readonly string[]).includes(variant)) notFound();
  return <Landing variant={variant as HeroVariant} />;
}
