import { readRaw } from '../content';
import { cleanHtml } from './inline';
import { makeCtx } from './elements';

function rawForm(file: string): string {
  const raw = readRaw(file);
  const i = raw.indexOf('<form');
  const j = raw.indexOf('</form>');
  if (i < 0 || j < 0) throw new Error(`form not found: ${file}`);
  return raw.slice(i, j + '</form>'.length);
}

/** 必須の行（th に［必須］がある行）の入力に required を付ける */
function markRequired(tr: string): string {
  if (!tr.includes('［必須］')) return tr;
  return tr.replace(/<(input|select|textarea)\b/g, '<$1 required');
}

export function buildForm(file: 'form.html' | 'form_entry.html', from: string, kind: 'contact' | 'entry'): { html: string } {
  let f = rawForm(file);
  const ctx = makeCtx(from);
  f = f.replace(/<tr>[\s\S]*?<\/tr>/g, markRequired);
  f = cleanHtml(f, ctx);
  f = f.replace(/<tr>[\s\S]*?<\/tr>/g, (row) => {
    if (!row.includes('メールアドレス')) return row;
    const fieldId = row.includes('メールアドレス（確認）') ? 'mail-confirm' : 'mail';
    return row.replace(/(id|for)="mail"/g, `$1="${fieldId}"`).replace('type="text"', 'type="email"');
  });
  f = f
    .replace(/<form\b([^>]*)>/, `<form method="dialog" novalidate class="cform cform-${kind}" data-form="${kind}" data-entry-guard>`)
    .replace(/<table class="Table SPBlock">/g, '<table class="tbl tbl-form">')
    .replace(/<strong>(［必須］)/g, '<strong class="req">$1')
    .replace(/class="Ex"/g, 'class="ex"')
    .replace(/class="Name"/g, 'class="cell-name"')
    .replace(/class="FormPolicy"/g, 'class="form-policy"')
    .replace(/class="ConsultationBlock"/g, 'class="consult"')
    .replace(/class="FormPolicyHeadline"/g, 'class="hs-4"')
    .replace(/class="Headline5"/g, 'class="hs-5"')
    .replace(/class="Accept"/g, 'class="accept"')
    .replace(/<p class="GoSubmit"><input type="submit" id="submit" value="確認画面へ進む" class="Go" \/>/,
      `<p class="go-submit"><input type="submit" id="submit" value="確認画面へ進む" class="btn ${kind === 'entry' ? 'btn-entry' : 'btn-contact-solid'}">`)
    // 見出しは1段ずつ上げる（h4→h3, h5→h4, h6→h5）。ページの見出し階層を飛ばさないため
    .replace(/<h4\b/g, '<h3').replace(/<\/h4>/g, '</h3>')
    .replace(/<h5\b/g, '<h4').replace(/<\/h5>/g, '</h4>')
    .replace(/<h6\b/g, '<h5').replace(/<\/h6>/g, '</h5>')
    .replace(/<p class="accept"><input type="checkbox"/, '<p class="accept"><input type="checkbox" required');
  return { html: f };
}
