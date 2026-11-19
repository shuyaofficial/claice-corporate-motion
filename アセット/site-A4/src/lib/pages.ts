// ページ台帳。出力パス・正本 JSON・見出し帯の背景を1か所で持つ。
export interface PageDef {
  key: string;            // content/<key>.json
  path: string;           // dist 内のファイル（ルート相対・先頭に / を付けない）
  name: string;           // パンくず・ナビに出す名前（元サイトの表記）
  bg?: string;            // 見出し帯の背景（静止画 web/band-<bg>-{640,1280}.webp ＋ PC 用ループ動画 video/<bg>.{webm,mp4}）
  parent?: string;        // パンくずの親（ページ key）
}

export const PAGES: PageDef[] = [
  { key: 'index', path: 'index.html', name: 'トップページ' },
  { key: 'about', path: 'about/index.html', name: 'クレイスについて', bg: 'about' },
  { key: 'business', path: 'business/index.html', name: '事業内容', bg: 'business' },
  { key: 'education', path: 'education/index.html', name: '教育システム', bg: 'education' },
  { key: 'recruit', path: 'recruit/index.html', name: '採用情報', bg: 'recruit' },
  { key: 'photo', path: 'photo/index.html', name: 'CLAICE Photo' },
  { key: 'profile', path: 'profile/index.html', name: '会社概要' },
  { key: 'policy', path: 'policy/index.html', name: 'プライバシーポリシー' },
  { key: 'form', path: 'form/index.html', name: 'お問い合せ' },
  { key: 'form_entry', path: 'form/entry.html', name: '採用応募フォーム', parent: 'recruit' },
  { key: 'news', path: 'news/index.html', name: '新着情報' },
];

export const SITE_ORIGIN = 'https://www.claice.com';
export const pageByKey = (key: string): PageDef => {
  const p = PAGES.find((x) => x.key === key);
  if (!p) throw new Error(`unknown page: ${key}`);
  return p;
};
