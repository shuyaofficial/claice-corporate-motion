// 下層ページの本文を、content/*.json の要素から組み立てる。
// 文章は1字も変えない。見出し帯（h1・リード・ページ内メニュー）と、章ごとの HTML を返す。
import { loadPage, textToHtml, esc, splitH1, type El } from '../content';
import { resolveSrc } from '../urls';
import * as E from './elements';
import * as F from './figures';
import { cleanHtml } from './inline';

export interface Section { id?: string; title: string; html: string }
export interface SubPage {
  h1: [string, string];
  lead: string;               // 見出し帯のリード（元の h2 直下の段落。無ければ空）
  nav: string;                // ページ内メニュー（元の nav）
  sections: Section[];
}

const isHidden = (e: El) => e.type === 'heading' && e.hidden;
const imgPath = (e: El, ctx: E.RenderCtx) => resolveSrc(e.src_raw, ctx.pageDir);
const hasClass = (e: El, c: string) => (e.classes ?? []).includes(c);

/** 連続する同じ box の要素を1つのかたまりにする */
function byBox(els: El[]): El[][] {
  const out: El[][] = [];
  for (const e of els) {
    const last = out[out.length - 1];
    if (last && last[0].box === e.box) last.push(e); else out.push([e]);
  }
  return out;
}

const CHARTS: Record<string, () => string> = {
  'business/img/esn_chart.png': F.esnFigure,
  'education/img/followup_chart2021.png': F.followupFigure,
  'education/img/startingbusiness_chart.png': F.startingBusinessFigure,
  'education/img/idea_chart.png': F.ideaFigure,
  'about/img/equal_chart.svg': F.equalFigure,
};

/** 1要素 → HTML。画像は用途で出し分ける（図・ボタン・バナー・写真） */
function el(e: El, ctx: E.RenderCtx, o: { statement?: boolean; alt?: string } = {}): string {
  switch (e.type) {
    case 'heading': return isHidden(e) ? '' : E.heading(e, ctx);
    case 'paragraph': return E.paragraph(e, ctx, o.statement ? 'statement' : '');
    case 'list': return E.list(e, ctx);
    case 'table': return E.table(e, ctx);
    case 'definition_list': return E.definitionList(e, ctx);
    case 'nav': return '';
    case 'image': {
      if (e.inline) return '';                       // 段落の html の中に既にある
      const p = imgPath(e, ctx);
      if (CHARTS[p]) return CHARTS[p]();
      if (hasClass(e, 'LinkBtn') || (e.wrapper_classes ?? []).includes('LinkBtn')) return E.buttonFromImage(e, ctx);
      if (p === 'recruit/img/banner_white.jpg') return F.whiteBanner(e.link);
      if (p === 'recruit/img/rehire_image.jpg') return F.rehirePhoto(E.image(e, ctx, 'photo', ''));
      return E.image(e, ctx, hasClass(e, 'Portrait') ? 'photo' : '', o.alt);
    }
    default: return '';
  }
}

const join = (els: El[], ctx: E.RenderCtx, o = {}) => els.map((e) => el(e, ctx, o)).join('\n');

/** 写真（または図）＋本文の2段組 */
const media = (fig: string, body: string, side: 'left' | 'right' = 'left') =>
  `<div class="media media-${side}"><div class="media-fig">${fig}</div><div class="media-body prose">${body}</div></div>`;

function mediaBlock(els: El[], ctx: E.RenderCtx, o = {}): string {
  const i = els.findIndex((e) => e.type === 'image' && (hasClass(e, 'Portrait') || hasClass(e, 'Chart300')));
  if (i < 0) return `<div class="blk prose">${join(els, ctx, o)}</div>`;
  const fig = el(els[i], ctx);
  const rest = els.filter((_, k) => k !== i);
  return media(fig, join(rest, ctx, o));
}

/** 章（level 3 の見出し＋その章の要素）に分ける */
function splitSections(els: El[]): { head: El; body: El[] }[] {
  const out: { head: El; body: El[] }[] = [];
  for (const e of els) {
    if (e.type === 'heading' && e.level === 3 && !isHidden(e) && (e.anchor || out.length === 0 || e.section)) out.push({ head: e, body: [] });
    else if (out.length) out[out.length - 1].body.push(e);
  }
  return out;
}

type SectionFn = (body: El[], ctx: E.RenderCtx) => string;

const defaultSection: SectionFn = (body, ctx) => byBox(body).map((g) => mediaBlock(g, ctx)).join('\n');

// ---------- ページごとの章の組み立て ----------
const about: Record<string, SectionFn> = {
  greeting: (b, ctx) => mediaBlock(b, ctx),
  philosophy1: (b, ctx) => statementsThen(b, ctx),
  philosophy2: (b, ctx) => statementsThen(b, ctx),
  equal: (b, ctx) => byBox(b).map((g) => mediaBlock(g, ctx)).join('\n'),
};

/** 理念・方針の短い宣言文（クラス無しの段落）を大きく見せ、残りを本文にする */
function statementsThen(b: El[], ctx: E.RenderCtx): string {
  const st = b.filter((e) => e.type === 'paragraph' && !(e.classes ?? []).length);
  const rest = b.filter((e) => !st.includes(e));
  return `<div class="statements">${st.map((e) => E.paragraph(e, ctx, 'statement')).join('')}</div>\n<div class="blk prose">${join(rest, ctx)}</div>`;
}

const education: Record<string, SectionFn> = {
  education: (b, ctx) => mediaBlock(b, ctx),
  qualification: (b, ctx) => mediaBlock(b, ctx),
  idea: (b, ctx) => mediaBlock(b, ctx),
  followup: (b, ctx) => followup(b, ctx),
  startingbusiness: (b, ctx) => `<div class="blk prose">${join(b, ctx)}</div>`,
};

function followup(b: El[], ctx: E.RenderCtx): string {
  const firstVoice = b.findIndex((e) => e.type === 'heading' && e.level === 5);
  const intro = b.slice(0, firstVoice);
  const rest = b.slice(firstVoice);
  const voices: El[][] = [];
  for (const e of rest) {
    if (e.type === 'heading' && e.level === 5) voices.push([e]); else voices[voices.length - 1].push(e);
  }
  // 導入: h4・p・図・h4・p
  const introHtml = `<div class="blk prose">${join(intro, ctx)}</div>`;
  const voiceHtml = voices.map((v) => {
    const title = v.find((e) => e.type === 'heading')!;
    const lead = v.find((e) => e.type === 'paragraph')!;
    const photo = v.find((e) => e.type === 'image');
    const qas = v.filter((e) => e.type === 'definition_list');
    const lv = E.headingLevel(5, ctx);
    return `<article class="voice">
  <header class="voice-head">${photo ? E.image(photo, ctx, 'voice-photo', '') : ''}
    <div><h${lv} class="hs-5">${textToHtml(title.text)}</h${lv}>${E.paragraph(lead, ctx, 'voice-lead')}</div></header>
  <div class="qa-list">${qas.map((q) => E.definitionList(q, ctx, 'qa')).join('')}</div>
</article>`;
  }).join('\n');
  return introHtml + `\n<div class="voices">${voiceHtml}</div>`;
}

const business: Record<string, SectionFn> = {
  service: (body, ctx) => {
    const chart = `<figure id="network" class="signal-chart">
      <figcaption><span>ネットワークの通信経路</span><span class="signal-key">信号</span></figcaption>
      <img class="signal-image" width="840" height="224" src="img/signal-still.webp" data-gif="img/signal-flow.gif" alt="端末からネットワーク機器を経由してサーバーへ信号が流れる図">
      <div class="signal-labels" aria-hidden="true"><span>端末</span><span>ネットワーク機器</span><span>サーバー</span></div>
      <ol class="service-phases" aria-label="サービスの工程"><li>設計</li><li>構築</li><li>運用</li></ol>
    </figure>`;
    return `<div class="blk prose">${body.map((item) => (item.type === 'table' ? chart : '') + el(item, ctx)).join('\n')}</div>`;
  },
  engineer: (b, ctx) => mediaBlock(b, ctx),
  esn: (b, ctx) => `<div class="blk prose">${join(b, ctx)}</div>`,
};

const recruit: Record<string, SectionFn> = {
  message: (b, ctx) => {
    const banner = b.find((e) => e.type === 'image')!;
    const rest = b.filter((e) => e !== banner);
    return media(el(banner, ctx), join(rest, ctx), 'right');
  },
  newgraduates: (b, ctx) => {
    const banners = b.filter((e) => e.type === 'image');
    const rest = b.filter((e) => e.type !== 'image');
    return `<div class="blk prose">${join(rest, ctx)}</div>
<ul class="banner-row">${banners.map((e) => `<li>${E.image(e, ctx, 'banner')}</li>`).join('')}</ul>`;
  },
  career: (b, ctx) => `<div class="blk prose">${join(b, ctx)}</div>`,
  shcedule: (b, ctx) => `<ol class="steps">${b.map((e) => `<li class="step">${E.definitionList(e, ctx)}</li>`).join('')}</ol>`,
  oneday: (b, ctx) => oneday(b, ctx),
  rehire: (b, ctx) => {
    const photo = b.find((e) => e.type === 'image' && imgPath(e, ctx).endsWith('rehire_image.jpg'))!;
    const story = b.filter((e) => e.box === 16);
    const rest = b.filter((e) => e !== photo && !story.includes(e));
    return media(el(photo, ctx), join(story, ctx)) + `\n<div class="blk prose">${join(rest, ctx)}</div>`;
  },
};

function oneday(b: El[], ctx: E.RenderCtx): string {
  const entry = b.filter((e) => e.type === 'image' && hasClass({ ...e, classes: e.wrapper_classes }, 'LinkBtn'));
  const body = b.filter((e) => !entry.includes(e));
  const intro = body.filter((e, i) => i === 0 && e.type === 'paragraph');
  const rest = body.filter((e) => !intro.includes(e));
  const people: El[][] = [];
  for (const e of rest) {
    if (e.type === 'heading' && e.level === 5) people.push([e]); else people[people.length - 1].push(e);
  }
  const html = people.map((p) => {
    const title = p.find((e) => e.type === 'heading' && e.level === 5)!;
    const lead = p.find((e) => e.type === 'paragraph' && hasClass(e, 'OnedayLead'))!;
    const photo = p.find((e) => e.type === 'image')!;
    const msgT = p.find((e) => e.type === 'heading' && e.level === 6)!;
    const msgP = p.find((e) => e.type === 'paragraph' && hasClass(e, 'MessageText'))!;
    const tbl = p.find((e) => e.type === 'table')!;
    const lv = E.headingLevel(5, ctx);
    const lv2 = E.headingLevel(6, ctx);
    return `<article class="person">
  <header><h${lv} class="hs-5">${textToHtml(title.text)}</h${lv}>${E.paragraph(lead, ctx, 'person-lead')}</header>
  <div class="person-msg">${E.image(photo, ctx, 'staff-photo', '')}
    <div><h${lv2} class="hs-6">${textToHtml(msgT.text)}</h${lv2}>${E.paragraph(msgP, ctx)}</div></div>
  ${E.table(tbl, ctx)}
</article>`;
  }).join('\n');
  return `<div class="blk prose">${join(intro, ctx)}</div>\n<div class="people">${html}</div>\n${join(entry, ctx)}`;
}

const photo: Record<string, SectionFn> = {
  family: (b, ctx) => `<div class="cards cards-family">${byBox(b).map((g) => familyCard(g, ctx)).join('')}</div>`,
  event: (b, ctx) => `<div class="cards cards-photo">${byBox(b).map((g) => photoCard(g, ctx)).join('')}</div>`,
  office: (b, ctx) => `<div class="cards cards-photo">${byBox(b).map((g) => photoCard(g, ctx)).join('')}</div>`,
  officetour: (b, ctx) => `<div class="blk prose">${join(b, ctx)}</div>`,
};

function familyCard(g: El[], ctx: E.RenderCtx): string {
  const img = g.find((e) => e.type === 'image')!;
  const tbl = g.find((e) => e.type === 'table')!;
  const rest = g.filter((e) => e !== img && e !== tbl);
  const name = tbl.rows[0][1];
  const lvH = E.headingLevel(4, ctx);
  const [h, ...ps] = rest;
  return `<article class="card card-family">
  <div class="card-top">${E.image(img, ctx, 'card-img', `社員紹介の写真（${name}）`)}${E.table(tbl, ctx, 'tbl-profile')}</div>
  <h${lvH} class="hs-4">${textToHtml(h.text)}</h${lvH}>${ps.map((p) => E.paragraph(p, ctx)).join('')}</article>`;
}

function photoCard(g: El[], ctx: E.RenderCtx): string {
  const img = g.find((e) => e.type === 'image')!;
  const h = g.find((e) => e.type === 'heading')!;
  const ps = g.filter((e) => e.type === 'paragraph');
  const lvH = E.headingLevel(4, ctx);
  return `<article class="card card-photo">${E.image(img, ctx, 'card-img', h.text.replace(/\n/g, ''))}
  <div class="card-body"><h${lvH} class="hs-4">${textToHtml(h.text)}</h${lvH}>${ps.map((p) => E.paragraph(p, ctx)).join('')}</div></article>`;
}

const profile: Record<string, SectionFn> = {
  profile: (b, ctx) => `<div class="blk">${join(b, ctx)}</div>`,
  access: (b, ctx) => {
    const link = b.find((e) => e.type === 'link')!;
    const ps = b.filter((e) => e.type === 'paragraph');
    const dls = b.filter((e) => e.type === 'definition_list');
    const rel = esc(link.href);
    return `<div class="access">
  <div class="map-card"><svg viewBox="0 0 320 180" aria-hidden="true" focusable="false"><path d="M0 60h320M0 120h320M80 0v180M200 0v180M260 0v180" stroke="var(--line)" stroke-width="2" fill="none"/><path d="M0 150L320 30" stroke="var(--line-strong)" stroke-width="6" fill="none"/><path d="M160 36c-14 0-24 10-24 23 0 17 24 43 24 43s24-26 24-43c0-13-10-23-24-23z" fill="var(--blue)"/><circle cx="160" cy="59" r="8" fill="var(--white)"/></svg>
    <p class="btn-row"><a class="btn btn-contact" href="${rel}" target="_blank" rel="noopener">${esc(link.text)}<span class="arr" aria-hidden="true">→</span></a></p></div>
  <div class="access-body">${ps.map((p) => E.paragraph(p, ctx, hasClass(p, 'CorpName') ? 'corp' : '')).join('')}
    <div class="traffic">${dls.map((d) => E.definitionList(d, ctx, 'dl-traffic')).join('')}</div></div>
</div>`;
  },
};

const policy: Record<string, SectionFn> = {
  profile: (b, ctx) => byBox(b).map((g) => `<div class="blk prose legal box-${g[0].box}">${join(g, ctx)}</div>`).join('\n'),
};

const BY_PAGE: Record<string, Record<string, SectionFn>> = { about, business, education, recruit, photo, profile, policy };

/** ページ（content/<key>.json）を、見出し帯と章に分けて組み立てる */
export function buildSubPage(key: string, from: string): SubPage {
  const page = loadPage(key);
  const ctx = E.makeCtx(from);
  const els = page.elements;
  const h1 = els.find((e) => e.type === 'heading' && e.level === 1)!;
  const h2i = els.findIndex((e) => e.type === 'heading' && e.level === 2);
  const lead = els[h2i + 1]?.type === 'paragraph' && els[h2i + 1].box === els[h2i].box ? els[h2i + 1] : null;
  const nav = els.find((e) => e.type === 'nav');
  const main = els.filter((e) => e !== h1 && e !== els[h2i] && e !== lead && e !== nav);
  const secs = splitSections(main);
  const fns = BY_PAGE[key] ?? {};
  return {
    h1: splitH1(h1.text),
    lead: lead ? `<p>${cleanHtml(lead.html ?? esc(lead.text), ctx)}</p>` : '',
    nav: nav ? E.pageNav(nav, ctx) : '',
    sections: secs.map(({ head, body }) => {
      const id = head.anchor ?? undefined;
      const fn = (id && fns[id]) || defaultSection;
      const lvH = E.headingLevel(3, ctx);
      const title = `<h${lvH} class="sec-title"${id ? ` id="${id}-h"` : ''}>${textToHtml(head.text)}</h${lvH}>`;
      return { id, title: head.text, html: `${title}\n<div class="sec-body">${fn(body, ctx)}</div>` };
    }),
  };
}
