import { cookies } from 'next/headers';
import { App } from '@/components/App';
import { InviteGate } from '@/components/InviteGate';
import { adapterMode } from '@/lib/claude';
import { INVITE_COOKIE, VISITOR_COOKIE, isValidInvite, isVisitorId } from '@/lib/invite';

export const dynamic = 'force-dynamic';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const jar = await cookies();
  const invited =
    isValidInvite(jar.get(INVITE_COOKIE)?.value) && isVisitorId(jar.get(VISITOR_COOKIE)?.value);
  if (!invited) return <InviteGate wrongCode={(await searchParams).invite_error === '1'} />;
  return <App mock={adapterMode() === 'mock'} />;
}
