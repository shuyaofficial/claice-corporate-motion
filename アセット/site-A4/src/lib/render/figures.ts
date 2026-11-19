// 画像の中にしか無かった文章（content/image_texts.json）を、HTML の文字＋CSS/SVG の図で描き直す。
// 文言は image_texts.json のとおり。図形はここで描く（画像の中に文字を入れない）。
import { esc } from '../content';

const li = (xs: string[]) => xs.map((x) => `<li>${esc(x)}</li>`).join('');

const ICON = {
  person: '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><circle cx="20" cy="13" r="7"/><path d="M6 36c0-8 6-13 14-13s14 5 14 13z"/></svg>',
  laptop: '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><rect x="7" y="9" width="26" height="17" rx="2"/><path d="M3 31h34l-3 3H6z"/></svg>',
  mail: '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><rect x="5" y="9" width="30" height="22" rx="2" fill="none" stroke-width="3"/><path d="M6 11l14 11 14-11" fill="none" stroke-width="3"/></svg>',
  tie: '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><path d="M12 5l8 6 8-6 2 5-7 5 4 20-7 4-7-4 4-20-7-5z"/></svg>',
  chat: '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><path d="M4 8h22v14H14l-6 5v-5H4z" fill="none" stroke-width="3" stroke-linejoin="round"/><path d="M30 16h6v14h-4v4l-5-4H16v-4" fill="none" stroke-width="3" stroke-linejoin="round"/></svg>',
  talk: '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="5"/><circle cx="29" cy="11" r="5"/><path d="M3 30c0-6 4-10 8-10s8 4 8 10zM21 30c0-6 4-10 8-10s8 4 8 10z"/></svg>',
  monitor: '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><rect x="4" y="6" width="32" height="22" rx="2"/><path d="M16 34h8M20 28v6" fill="none" stroke-width="3"/></svg>',
  handshake: '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><path d="M3 14l8-3 7 3-5 7 6 6 3-2 2 2-4 4-8-3-6-3zM37 14l-8-3-7 3 6 8-5 5 3 2 3-3 9-5z"/></svg>',
  shield: '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><path d="M20 3l14 5v10c0 9-6 15-14 19C12 33 6 27 6 18V8z" fill="none" stroke-width="2.5" stroke-linejoin="round"/><path d="M13 19l5 5 9-10" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

/** business: ESN の保証条件の図 */
export function esnFigure(): string {
  return `<figure class="fig fig-esn">
  <div class="esn-engineer">
    <span class="fig-icon" aria-hidden="true">${ICON.person}</span>
    <p><span class="esn-lead">数々のプログラムによって裏づけられた</span><strong class="esn-name">クレイスのエンジニア</strong></p>
  </div>
  <div class="esn-skills">
    <div class="esn-col">
      <p class="fig-label">ヒューマンスキル</p>
      <ul>${li(['プレゼンテーション', 'アクティブトーキング', 'ポジティブリスニング', 'ロジカルシンキング', 'ビジネスライティング', 'タイムマネージメント etc'])}</ul>
    </div>
    <div class="esn-col">
      <p class="fig-label">テクニカルスキル</p>
      <ul>${li(['CCNA', 'CCNP', 'LPICレベル1', 'LPICレベル2', 'ITIL', 'セキュリティー研修 etc'])}</ul>
    </div>
  </div>
  <p class="esn-plus"><span class="plus" aria-hidden="true"></span>お客様にご安心いただくための独自保障システム</p>
  <div class="esn-system">
    <div class="esn-system-head">
      <span class="fig-icon" aria-hidden="true">${ICON.handshake}</span>
      <p><strong>クレイスのESNシステム</strong><span>（エンジニア・ソリューション・ノーリスク）</span></p>
    </div>
    <p class="esn-terms"><span class="mark-line">派遣後、１ヶ月以内に解約のお申し出の場合、</span> <span class="mark-line"><em>１ヶ月間の御請求はいたしません。</em></span> <span class="mark-line">たとえ契約書にて金額が決まっていたとしても<em>ゼロ時間稼働</em>といたします。</span></p>
  </div>
</figure>`;
}

/** education: フォローアップ制度の図（フォローアップメンバー → 新入社員） */
export function followupFigure(): string {
  const rows: [keyof typeof ICON, string][] = [
    ['laptop', 'CCNA研修の技術的支援'],
    ['monitor', 'Microsoft Officeの基本的な使い方'],
    ['mail', '日報提出で使うビジネスメールの書き方'],
    ['tie', 'ビジネスマナー研修受講後のプレゼンテーション話し方や言葉使いの指導'],
    ['chat', '業務を行う中での疑問点や課題の相談'],
    ['talk', '新たな環境下での困りごとや悩みの相談'],
  ];
  return `<figure class="fig fig-followup">
  <p class="fu-side fu-from"><span class="fig-icon" aria-hidden="true">${ICON.person}</span><span class="fu-label">フォローアップメンバー</span></p>
  <ul class="fu-list">${rows.map(([i, t]) => `<li><span class="fig-icon" aria-hidden="true">${ICON[i]}</span><span>${esc(t)}</span></li>`).join('')}</ul>
  <p class="fu-side fu-to"><span class="fig-icon" aria-hidden="true">${ICON.person}</span><span class="fu-label">新入社員</span></p>
</figure>`;
}

/** education: 起業支援の流れの図 */
export function startingBusinessFigure(): string {
  return `<figure class="fig fig-start">
  <ul class="st-people">${['中途採用者（経験者）', '中途採用者（未経験者）', '新規卒業者'].map((t) => `<li><span class="fig-icon" aria-hidden="true">${ICON.person}</span>${esc(t)}</li>`).join('')}</ul>
  <div class="st-step st-train">
    <p class="st-title">研修</p>
    <ul>${li(['スキル研修', 'ビジネス基礎研修', 'セキュリティ研修'])}</ul>
  </div>
  <div class="st-step st-work">
    <p class="st-title">「仕事」へのチャレンジ</p>
    <p class="st-sub">研修・育成支援</p>
  </div>
  <div class="st-step st-founder">
    <p class="st-title">起業家支援</p>
    <ul>${li(['起業ノウハウの支援', '資金支援', '人的支援'])}</ul>
  </div>
  <p class="st-goal"><span>幸せな人生の創出</span><span>夢の実現</span></p>
</figure>`;
}

/** education: 3つの気持ち */
export function ideaFigure(): string {
  return `<figure class="fig fig-idea">
  <p class="idea-circle idea-top">感謝の<wbr>気持ち</p>
  <p class="idea-circle idea-left">素直な<wbr>気持ち</p>
  <p class="idea-circle idea-right">謙虚な<wbr>気持ち</p>
</figure>`;
}

/** about: 派遣基準賃金と協定賃金の図 */
export function equalFigure(): string {
  return `<figure class="fig fig-equal">
  <div class="eq-bars">
    <div class="eq-base">
      <p class="eq-block">厚生省が示す水準<span class="eq-x" aria-hidden="true">×</span>地域指数</p>
      <p class="eq-block">退職金相当額</p>
    </div>
    <span class="eq-lt" aria-hidden="true"></span>
    <p class="eq-agree">協定賃金</p>
  </div>
  <p class="eq-caption"><span>派遣基準賃金</span><span>株式会社クレイス</span></p>
</figure>`;
}

/** recruit: ホワイト企業認定のバナー（リンク先は元のまま） */
export function whiteBanner(href: string): string {
  return `<a class="white-banner" href="${esc(href)}" target="_blank" rel="noopener">
  <span class="wb-head"><span class="fig-icon" aria-hidden="true">${ICON.shield}</span><span>ホワイト企業認定</span></span>
  <span class="wb-big">ホワイト企業</span>
  <span class="wb-done">認定取得！</span>
  <span class="wb-quote">「家族や社会に応援される、次世代に残していきたい企業」</span>
</a>`;
}

/** recruit: 退職者の再雇用制度の写真。写真に焼き込まれていた吹き出しの文言は HTML の文字で重ねる */
export function rehirePhoto(imgHtml: string): string {
  return `<figure class="rehire-photo">${imgHtml}
  <p class="bubble bubble-a">「いつでも戻っておいで」と言ったのは本当なんです！</p>
  <p class="bubble bubble-b">まずはカフェスペースにお茶を飲みに来ませんか？</p>
</figure>`;
}
