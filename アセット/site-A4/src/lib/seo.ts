// title・description・JSON-LD・sitemap・llms.txt の材料。新しい主張は書かず、既存の文だけを使う。
import { loadPage, loadShared, type El } from './content';
import { PAGES, SITE_ORIGIN, pageByKey, type PageDef } from './pages';

const MAX_DESC = 120;
export const absUrl = (path: string) => `${SITE_ORIGIN}/${path === 'index.html' ? '' : path}`;
/** canonical は元サイトの URL 形（…/index.html）に揃える */
export const canonicalOf = (p: PageDef) => absUrl(p.path);

const SENT = /[^。！？]*[。！？][」』）)］】〕”’]*|[^。！？]+/g;
const TERMINAL = /[。！？][」』）)］】〕”’]*$/;
/** 改行・連続する空白を整える。全角どうしの間の空白は入れない（日本語の行末の改行は空白にしない） */
const tidy = (t: string) =>
  t.replace(/\u000b/g, '').replace(/\s*\n\s*/g, ' ').replace(/[ \u3000]+/g, ' ').trim()
    .replace(/([^\x00-\x7F]) ([^\x00-\x7F])/g, '$1$2');

/** 既存の文だけでできた description（120字以内・文の途中で切らない）。冒頭の段落・箇条書き・定義から、文の単位で足していく */
export function describe(key: string): string {
  if (key === 'news') return describe('index');
  const page = loadPage(key);
  if (key === 'index') return page.meta.description;
  const units: string[] = [];
  for (const e of page.elements as El[]) {
    const cls: string[] = e.classes ?? [];
    if (e.type === 'paragraph' && !cls.includes('Sign') && !cls.includes('Date')) units.push(...(tidy(e.text).match(SENT) ?? []).map((x) => x.trim()));
    else if (e.type === 'list') units.push(...e.items.map(tidy));
    else if (e.type === 'definition_list') for (const it of e.items) if (it.term) units.push(...it.definitions.map(tidy).filter(Boolean)); // 見出しの無い定義（SSL の説明）は冒頭に使わない
  }
  const start = units.findIndex((u) => u.length <= MAX_DESC);
  if (start < 0) throw new Error(`description を作れません: ${key}`);
  let out = '';
  for (const u of units.slice(start)) {
    if ((out + u).length > MAX_DESC) break;
    out += u;
    if (!TERMINAL.test(u)) break; // 文末の記号が無い見出し的な一文のあとには、続けて足さない
  }
  if (out.length > MAX_DESC) throw new Error(`description が ${MAX_DESC} 字を超えています: ${key}`);
  return out;
}

/** 元ページの title（meta title）。news は新設なので「新着情報│株式会社クレイス」 */
export function titleOf(key: string): string {
  return key === 'news' ? '新着情報│株式会社クレイス' : loadPage(key).meta.title;
}

/** パンくず（トップ → [親] → このページ） */
export function crumbs(p: PageDef): { name: string; path: string }[] {
  const top = pageByKey('index');
  const out = [{ name: top.name, path: top.path }];
  if (p.parent) { const par = pageByKey(p.parent); out.push({ name: par.name, path: par.path }); }
  if (p.key !== 'index') out.push({ name: p.name, path: p.path });
  return out;
}

export function breadcrumbLd(p: PageDef) {
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: crumbs(p).map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: absUrl(c.path) })),
  };
}

export function homeLd() {
  const shared = loadShared();
  const profile = loadPage('profile').elements.find((e: El) => e.type === 'table')!;
  const addr: string = profile.rows.find((r: string[]) => r[0] === '本社所在地')![1];
  const [zipLine, street] = addr.split('\n');
  const zip = zipLine.replace('〒', '');
  const m = /^(東京都)(千代田区)(.+)$/.exec(street)!;
  const tel = /電話：([\d-]+)/.exec(loadPage('policy').elements.map((e: El) => e.text ?? '').join('\n'))![1];
  const same = shared.footer.external_links.map((l: any) => l.href);
  const org = {
    '@context': 'https://schema.org', '@type': 'Organization',
    name: shared.header.logo.alt, url: `${SITE_ORIGIN}/`,
    logo: shared.header.logo.src,
    address: { '@type': 'PostalAddress', postalCode: zip, addressRegion: m[1], addressLocality: m[2], streetAddress: m[3], addressCountry: 'JP' },
    telephone: tel,
    sameAs: same,
  };
  const site = { '@context': 'https://schema.org', '@type': 'WebSite', name: shared.header.logo.alt, url: `${SITE_ORIGIN}/`, inLanguage: 'ja' };
  return [org, site];
}

/** JSON-LD を <script> に埋め込める文字列にする（</ を避ける） */
export const ldScript = (obj: unknown) => JSON.stringify(obj).replace(/</g, '\\u003c');

export const SITEMAP_PAGES = PAGES;
