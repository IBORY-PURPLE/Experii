import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { hero, meta } from '@/content/landing';

export const alt = meta.ogAlt;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const fontDir = join(process.cwd(), 'node_modules/pretendard/dist/public/static');

export default async function OpengraphImage() {
  const [bold, regular] = await Promise.all([
    readFile(join(fontDir, 'Pretendard-Bold.otf')),
    readFile(join(fontDir, 'Pretendard-Regular.otf')),
  ]);
  const [line1, line2] = hero.headlines.h1;

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#ffffff', padding: '64px 72px', fontFamily: 'Pretendard', color: '#1a2233' }}>
        <div style={{ display: 'flex', flexDirection: 'column', width: 630 }}>
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 700, letterSpacing: '-0.03em' }}>Experii</div>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 64, fontSize: 48, fontWeight: 700, lineHeight: 1.28, letterSpacing: '-0.02em' }}>
            <span>{line1}</span>
            <span>{line2}</span>
          </div>
          <div style={{ display: 'flex', marginTop: 28, fontSize: 26, color: '#5b6676' }}>{hero.kicker}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, gap: 16 }}>
          <div style={{ display: 'flex', alignSelf: 'flex-end', fontSize: 20, fontWeight: 700, color: '#4e5968', padding: '6px 16px', borderRadius: 999, border: '2px solid #d5dae1' }}>{hero.badge}</div>
          <div style={{ display: 'flex', alignSelf: 'flex-start', fontSize: 24, padding: '12px 20px', borderRadius: 20, background: '#f2f4f7' }}>{hero.question}</div>
          <div style={{ display: 'flex', alignSelf: 'flex-end', fontSize: 24, padding: '12px 20px', borderRadius: 20, border: '2px dashed #8a94a3', color: '#5b6676' }}>{hero.before}</div>
          <div style={{ display: 'flex', alignSelf: 'flex-end', fontSize: 25, fontWeight: 700, lineHeight: 1.45, padding: '16px 22px', borderRadius: 22, border: '3px solid #3d5a99', wordBreak: 'keep-all' }}>{hero.after}</div>
          <div style={{ display: 'flex', alignSelf: 'flex-end', fontSize: 20, fontWeight: 700, color: '#9a5b13', background: '#f8f1e7', padding: '8px 16px', borderRadius: 999 }}>{hero.source}</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Pretendard', data: bold, weight: 700, style: 'normal' },
        { name: 'Pretendard', data: regular, weight: 400, style: 'normal' },
      ],
    },
  );
}
