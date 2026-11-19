// 差し込み枠。いまは全部 enabled: false で、HTML には何も出ない。
// 値（と、その出典となる事実）が入ったら enabled を true にする。新しい数値や説明文はここに足してから使う。
export interface StatItem { label: string; value: string; unit?: string; note?: string }
export interface FaqItem { question: string; answer: string }

export const slots = {
  /** 「数字で見るクレイス」: トップの「クレイスについて」の次に出る */
  stats: {
    enabled: false,
    heading: '数字で見るクレイス',
    items: [] as StatItem[],
  },
  /** 「採用FAQ」: 採用情報ページの「採用担当者から」の次に出る */
  faq: {
    enabled: false,
    heading: '採用FAQ',
    items: [] as FaqItem[],
  },
  /** 「カジュアル面談の入口」: 採用情報ページの募集要項の次に出る */
  casual: {
    enabled: false,
    heading: 'カジュアル面談',
    body: '',
    buttonLabel: '',
    href: '',
  },
};
