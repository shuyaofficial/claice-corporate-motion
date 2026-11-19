// content/*.json（正本・読み取り専用）の読み込みと、文章まわりの共通処理。
import fs from 'node:fs';
import path from 'node:path';

const CONTENT = path.resolve(process.cwd(), '..', 'content');

export interface El { type: string; [k: string]: any }
export interface PageContent {
  page: string;
  url: string;
  meta: { title: string; description: string; keywords?: string };
  elements: El[];
}

const cache = new Map<string, any>();
export function readJson<T = any>(name: string): T {
  if (!cache.has(name)) cache.set(name, JSON.parse(fs.readFileSync(path.join(CONTENT, name), 'utf8')));
  return cache.get(name) as T;
}
export const loadPage = (key: string): PageContent => readJson<PageContent>(`${key}.json`);
export const loadShared = () => readJson('_shared.json');
export const loadImageTexts = (): Record<string, string[]> => readJson('image_texts.json');
export const readRaw = (name: string): string => fs.readFileSync(path.join(CONTENT, 'raw', name), 'utf8');

/** HTML 用エスケープ */
export const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// 縦タブなど HTML に置けない制御文字を落とす（見た目に出ない文字なので、文章は変わらない）
const stripCtl = (s: string) => s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');

/** 改行を <br> にした安全な文字列 */
export const textToHtml = (s: string): string => esc(stripCtl(s)).replace(/\n/g, '<br>');

export const newsOf = (): { group: string; date: string; text: string; link: string | null; image: any }[] =>
  loadPage('index').elements.filter((e) => e.type === 'news') as any;

/** "2026.10.21" → "2026-10-21" */
export const isoDate = (d: string) => d.replace(/\./g, '-');

/** ページ名と「│」以降に分ける（見える h1 を2段で見せるため。文字は1つながりのまま） */
export function splitH1(text: string): [string, string] {
  const i = text.indexOf('│');
  return i < 0 ? [text, ''] : [text.slice(0, i), text.slice(i)];
}
