// content/*.json の要素 → HTML 文字列。見た目の違いはクラス名で表し、CSS 側で決める。
import { esc, textToHtml, type El } from '../content';
import { internal, imgSize, resolveSrc, asset } from '../urls';
import { cleanHtml, type Ctx } from './inline';

export interface RenderCtx extends Ctx {
  /** 直前に出した見出しの深さ（h1 → h2 → h3 と飛ばさないため） */
  prev: { level: number };
}
export const makeCtx = (from: string): RenderCtx => ({
  from,
  pageDir: from.includes('/') ? from.split('/').slice(0, -1).join('/') : '',
  prev: { level: 1 },
});

const hasClass = (el: El, c: string) => (el.classes ?? []).includes(c);

/** 元の見出し（h3〜h6）を h2〜h5 に付け直す。直前より2段以上深くしない */
export function headingLevel(orig: number, ctx: RenderCtx): number {
  const lv = Math.max(2, Math.min(orig - 1, ctx.prev.level + 1));
  ctx.prev.level = lv;
  return lv;
}

export function heading(el: El, ctx: RenderCtx, extraClass = '', id?: string): string {
  const lv = headingLevel(el.level, ctx);
  const cls = [`hs-${el.level}`, extraClass].filter(Boolean).join(' ');
  const idAttr = id ? ` id="${esc(id)}"` : '';
  return `<h${lv} class="${cls}"${idAttr}>${textToHtml(el.text)}</h${lv}>`;
}

export function paragraph(el: El, ctx: RenderCtx, extraClass = ''): string {
  const cls = [
    hasClass(el, 'Sign') ? 'sign' : '', hasClass(el, 'Date') ? 'date' : '',
    hasClass(el, 'Center') ? 'center' : '', hasClass(el, 'FormNotice') ? 'notice' : '', extraClass,
  ].filter(Boolean).join(' ');
  return `<p${cls ? ` class="${cls}"` : ''}>${cleanHtml(el.html ?? esc(el.text), ctx)}</p>`;
}

export function list(el: El, ctx: RenderCtx): string {
  const tag = el.ordered ? 'ol' : 'ul';
  const cls = hasClass(el, 'Guideline') ? 'guide-list' : hasClass(el, 'PDFdownload') ? 'pdf-list' : el.ordered ? 'num-list' : 'plain-list';
  const items = (el.items_html ?? el.items).map((h: string) => `<li>${cleanHtml(h, ctx)}</li>`).join('');
  return `<${tag} class="${cls}">${items}</${tag}>`;
}

export function table(el: El, ctx: RenderCtx, extraClass = ''): string {
  const cls = ['tbl', hasClass(el, 'OnedaySchedule') ? 'tbl-schedule' : '', extraClass].filter(Boolean).join(' ');
  const caption = el.caption ? `<caption>${textToHtml(el.caption)}</caption>` : '';
  const rows = el.rows.map((row: string[], r: number) => {
    const cells = (el.cells_html ?? [])[r] ?? row.map((t) => textToHtml(t));
    return '<tr>' + cells.map((c: string, i: number) => {
      const html = el.cells_html ? cleanHtml(c, ctx) : c;
      return el.th?.[r]?.[i] ? `<th scope="row">${html}</th>` : `<td>${html}</td>`;
    }).join('') + '</tr>';
  }).join('');
  return `<table class="${cls}">${caption}<tbody>${rows}</tbody></table>`;
}

export function definitionList(el: El, ctx: RenderCtx, extraClass = ''): string {
  const cls = ['dl', extraClass].filter(Boolean).join(' ');
  const onlyItem = el.items.length === 1 ? el.items[0] : null;
  if (onlyItem?.term && !onlyItem.definitions.some((value: string) => value.trim())) {
    return `<p class="standalone-term">${cleanHtml(onlyItem.term_html ?? esc(onlyItem.term), ctx)}</p>`;
  }
  const body = el.items.map((it: any) => {
    const dt = it.term ? `<dt>${cleanHtml(it.term_html ?? esc(it.term), ctx)}</dt>` : '';
    const dds = (it.definitions_html ?? it.definitions).map((d: string) => (d.trim() ? `<dd>${cleanHtml(d, ctx)}</dd>` : '')).join('');
    return dt + dds;
  }).join('');
  return `<dl class="${cls}">${body}</dl>`;
}

export function pageNav(el: El, ctx: RenderCtx): string {
  const items = el.items.map((it: any) => `<li><a href="${esc(it.href_raw.trim())}">${esc(it.text)}</a></li>`).join('');
  return `<nav class="page-nav" aria-label="ページ内メニュー"><ul>${items}</ul></nav>`;
}

/** 写真。実寸を超えて引き伸ばさない（CSS の max-width と width/height 属性） */
export function image(el: El, ctx: RenderCtx, cls = '', altOverride?: string): string {
  const path = resolveSrc(el.src_raw, ctx.pageDir);
  const size = imgSize(path);
  const wh = size ? ` width="${size[0]}" height="${size[1]}"` : '';
  const alt = altOverride ?? el.alt ?? '';
  const cap = size && cls.includes('photo') ? ` style="max-width:${size[0]}px"` : ''; // 実寸より大きく引き伸ばさない
  const img = `<img${cls ? ` class="${cls}"` : ''} src="${esc(asset(path, ctx.from))}" alt="${esc(alt)}"${wh}${cap} loading="lazy" decoding="async">`;
  if (!el.link) return img;
  const rel = internal(el.link, ctx.from);
  return rel === null
    ? `<a href="${esc(el.link)}" target="_blank" rel="noopener">${img}</a>`
    : `<a href="${esc(rel)}">${img}</a>`;
}

/** 画像だったボタン（alt が文言）を、文字のボタンにする */
export function buttonFromImage(el: El, ctx: RenderCtx): string {
  const label = el.alt as string;
  const rel = internal(el.link, ctx.from);
  const external = rel === null;
  const href = external ? el.link : rel!;
  const kind = /エントリー/.test(label) ? 'btn-entry' : /お問い合せ/.test(label) ? 'btn-contact' : 'btn-line';
  const ext = external ? ' target="_blank" rel="noopener"' : '';
  const guard = kind === 'btn-entry' ? ' data-entry-guard' : ''; // 固定のエントリーボタンは、ページ内のエントリー入口が見えている間は隠す
  return `<p class="btn-row"><a class="btn ${kind}" href="${esc(href)}"${ext}${guard}>${esc(label)}<span class="arr" aria-hidden="true">→</span></a></p>`;
}
