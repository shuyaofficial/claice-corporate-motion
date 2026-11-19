// AI 検索向けの案内。社名・既存の文から1行の説明・各ページへのリンクと既存の文1つずつ。新しい主張は書かない。
import { SITEMAP_PAGES, canonicalOf, describe } from '../lib/seo';
import { loadShared } from '../lib/content';

const firstSentence = (s: string) => (s.match(/^[^。！]+[。！]?/) ?? [s])[0];

export const GET = () => {
  const name = loadShared().header.logo.alt;
  const lines = [
    `# ${name}`,
    '',
    `> ${firstSentence(describe('index'))}`,
    '',
    '## ページ',
    ...SITEMAP_PAGES.filter((p) => p.key !== 'index').map((p) => `- [${p.name}](${canonicalOf(p)}): ${firstSentence(describe(p.key))}`),
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
