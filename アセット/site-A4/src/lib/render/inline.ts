// 元 HTML 断片（content/*.json の *_html）を、新サイトの相当部品に直す。文章は変えない。
import { esc } from '../content';
import { internal, imgSize, resolveSrc, asset } from '../urls';

export interface Ctx {
  /** 出力中のページのファイル（dist 内パス。例: about/index.html） */
  from: string;
  /** 元ページのディレクトリ（src_raw の解決用。例: about） */
  pageDir: string;
}

const CLASS_MAP: Record<string, string> = {
  Text: '', Red: 'accent', inBlock: 'nb', inlineblock: 'nb', td_heading: 'td-head',
  Small: 'small', Bold: 'bold', Address: 'address',
};
const mapClass = (c: string): string =>
  c.split(/\s+/).map((x) => (x in CLASS_MAP ? CLASS_MAP[x] : x)).filter(Boolean).join(' ');

const attr = (attrs: string, name: string): string | null => {
  const m = new RegExp(`(?:^|\\s)${name}="([^"]*)"`, 'i').exec(attrs);
  return m ? m[1] : null;
};

/** <a> の href を相対にし、外部は別タブ + noopener にする */
function rewriteAnchor(attrs: string, ctx: Ctx): string {
  const href = attr(attrs, 'href');
  if (href === null) return `<a${attrs}>`;
  const blank = attr(attrs, 'target') === '_blank';
  const rel = internal(href, ctx.from);
  if (rel === null) return `<a href="${esc(href)}" target="_blank" rel="noopener">`;
  return blank ? `<a href="${esc(rel)}" target="_blank" rel="noopener">` : `<a href="${esc(rel)}">`;
}

/** 本文中の <img>。素材は dist 内の相対パス、実寸の属性を付ける（引き伸ばしは CSS で止める） */
function rewriteImg(attrs: string, ctx: Ctx): string {
  const srcRaw = attr(attrs, 'src') ?? '';
  const alt = attr(attrs, 'alt') ?? '';
  const cls = mapClass(attr(attrs, 'class') ?? '');
  const abs = /^https:\/\/www\.claice\.com\//.test(srcRaw);
  const path = abs ? srcRaw.replace(/^https:\/\/www\.claice\.com\//, '') : resolveSrc(srcRaw, ctx.pageDir);
  const size = imgSize(path);
  const wh = size ? ` width="${size[0]}" height="${size[1]}"` : '';
  const altText = cls === 'address' && !alt ? 'メールアドレスの画像' : alt;
  return `<img${cls ? ` class="${cls}"` : ''} src="${esc(asset(path, ctx.from))}" alt="${esc(altText)}"${wh} loading="lazy" decoding="async">`;
}

export function cleanHtml(html: string, ctx: Ctx): string {
  let s = html.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
  s = s.replace(/<br\s+class="No(?:SP|PC)"\s*\/?>/g, '');
  s = s.replace(/<br\s*\/?>/g, '<br>');
  s = s.replace(/<script\b[\s\S]*?<\/script>/gi, '');
  // 表のセル内の見出し（h5）は、見出し階層を飛ばさないよう段落にする
  s = s.replace(/<h5 class="td_heading">([\s\S]*?)<\/h5>/g, '<p class="td-head">$1</p>');
  s = s.replace(/<a\b([^>]*)>/g, (_m, a) => rewriteAnchor(a, ctx));
  s = s.replace(/<img\b([^>]*?)\/?>/g, (_m, a) => rewriteImg(a, ctx));
  s = s.replace(/<(\w+)([^>]*?)\sclass="([^"]*)"/g, (m, tag, rest, c) => {
    if (tag === 'img' || tag === 'a') return m;
    const mapped = mapClass(c);
    return mapped ? `<${tag}${rest} class="${mapped}"` : `<${tag}${rest}`;
  });
  return s;
}
