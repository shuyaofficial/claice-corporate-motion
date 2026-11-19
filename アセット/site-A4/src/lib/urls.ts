// URL の相対化。dist をどの階層に置いても開けるよう、内部リンクと素材参照はすべて相対パスにする。
import dims from '../data/img-dims.json';

const ORIGIN = 'https://www.claice.com';
const dirOf = (p: string) => p.split('/').slice(0, -1);

/** from（dist 内のファイル）から to（dist 内のパス）への相対 URL */
export function relPath(from: string, to: string): string {
  const [toPath, hash = ''] = splitHash(to);
  const a = dirOf(from);
  const b = toPath.split('/');
  const file = b.pop() ?? '';
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  const up = '../'.repeat(a.length - i);
  const down = b.slice(i).join('/');
  const out = `${up}${down}${down ? '/' : ''}${file}`;
  return (out || './') + (hash ? `#${hash}` : '');
}
const splitHash = (u: string): [string, string] => {
  const i = u.indexOf('#');
  return i < 0 ? [u, ''] : [u.slice(0, i), u.slice(i + 1)];
};

/** 元サイトの URL（絶対・相対どちらも）を、ページ from からの相対 URL にする。外部は null */
export function internal(url: string, from: string): string | null {
  let rest: string;
  if (url.startsWith(ORIGIN)) rest = url.slice(ORIGIN.length).replace(/^\//, '');
  else if (/^[a-z][a-z0-9+.-]*:|^\/\//i.test(url)) return null;
  else rest = url;
  if (rest.startsWith('#')) return rest;
  let [p, h] = splitHash(rest);
  if (p === '' ) p = 'index.html';
  if (p.endsWith('/')) p += 'index.html';
  const target = p + (h ? `#${h.trim()}` : '');
  const [tp] = splitHash(target);
  if (tp === from) return h ? `#${h.trim()}` : relPath(from, target);
  return relPath(from, target);
}

/** ページ内で使う素材の相対 URL。src は元サイトのパス（assets/original 直下の相対パス）。 */
export function asset(src: string, from: string): string {
  return relPath(from, src.replace(/^\//, ''));
}

/** 元ページ(pageDir)の相対 src（例: img/x.jpg, ../common/img/y.png）を assets/original 直下のパスにする */
export function resolveSrc(srcRaw: string, pageDir: string): string {
  if (/^(https?:)?\/\//.test(srcRaw)) return srcRaw;
  const parts = (pageDir ? pageDir.split('/') : []).concat(srcRaw.split('/'));
  const out: string[] = [];
  for (const s of parts) {
    if (s === '..') out.pop();
    else if (s !== '.' && s !== '') out.push(s);
  }
  return out.join('/');
}

export const imgSize = (src: string): [number, number] | undefined => (dims as Record<string, [number, number]>)[src];

