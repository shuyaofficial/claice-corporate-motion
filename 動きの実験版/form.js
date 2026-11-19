// フォームの入力チェック（見た目のための補助）。必須が空のままなら、エラーを出して送信しない。
// 検討用フォーム。確認はこのページ内で行い、入力内容は送信・保存しない。
(() => {
  const MSG_TEXT = 'この項目は必須です。入力してください。';
  const MSG_PICK = 'この項目は必須です。選択してください。';
  const MSG_AGREE = '「個人情報の取り扱いについて」への同意が必要です。';

  document.querySelectorAll('form[data-form]').forEach((form) => {
    const alertBox = document.createElement('div');
    alertBox.className = 'form-alert';
    alertBox.setAttribute('role', 'alert');
    alertBox.setAttribute('tabindex', '-1');
    form.prepend(alertBox);
    let seq = 0;
    const review = document.createElement('section');
    review.className = 'form-review';
    review.hidden = true;
    form.after(review);
    function showReview() {
      const title = document.createElement('h3');
      title.textContent = '入力内容の確認';
      title.tabIndex = -1;
      const values = document.createElement('dl');
      for (const [label, value] of new FormData(form)) {
        if (!value.trim()) continue;
        const key = document.createElement('dt');
        const entry = document.createElement('dd');
        key.textContent = label;
        entry.textContent = value;
        values.append(key, entry);
      }
      const back = document.createElement('button');
      back.type = 'button';
      back.className = 'btn btn-line';
      back.textContent = '入力画面に戻る';
      back.addEventListener('click', () => {
        review.hidden = true;
        review.replaceChildren();
        form.hidden = false;
        form.querySelector('input:not([type="hidden"])').focus();
      });
      review.replaceChildren(title, values, back);
      form.hidden = true;
      review.hidden = false;
      title.focus();
    }

    const clear = () => {
      form.querySelectorAll('.field-error').forEach((n) => n.remove());
      form.querySelectorAll('[aria-invalid]').forEach((n) => { n.removeAttribute('aria-invalid'); n.removeAttribute('aria-describedby'); });
      alertBox.textContent = '';
    };
    const filled = (ctrls) => {
      const radio = ctrls.filter((c) => c.type === 'radio');
      if (radio.length) return radio.some((c) => c.checked);
      return ctrls.some((c) => c.value.trim() !== '');
    };
    const fail = (host, ctrls, message) => {
      const id = `err-${++seq}`;
      const p = document.createElement('p');
      p.className = 'field-error';
      p.id = id;
      p.textContent = message;
      host.appendChild(p);
      ctrls.forEach((c) => { c.setAttribute('aria-invalid', 'true'); c.setAttribute('aria-describedby', id); });
      return ctrls[0];
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      clear();
      const bad = [];
      // 行ごとに1つのエラーにまとめる（姓・名のように1行に複数の入力があっても、メッセージは1回）
      form.querySelectorAll('tr').forEach((tr) => {
        if (!tr.querySelector('.req')) return;
        const td = tr.querySelector('td');
        const ctrls = [...td.querySelectorAll('input, select, textarea')];
        const groups = new Map();
        ctrls.forEach((c) => { const g = groups.get(c.name) ?? []; g.push(c); groups.set(c.name, g); });
        const missing = [...groups.values()].filter((g) => !filled(g));
        if (!missing.length) return;
        const pickOnly = missing.every((g) => g[0].type === 'radio' || g[0].tagName === 'SELECT');
        bad.push(fail(td, missing.flat(), pickOnly ? MSG_PICK : MSG_TEXT));
      });
      for (const mail of form.querySelectorAll('input[type="email"]')) {
        if (mail.validity.typeMismatch) bad.push(fail(mail.closest('td'), [mail], 'メールアドレスの形式をご確認ください。'));
      }
      const confirmation = form.querySelector('#mail-confirm');
      if (confirmation?.value && confirmation.value !== form.querySelector('#mail').value) {
        bad.push(fail(confirmation.closest('td'), [confirmation], '確認用のメールアドレスが一致しません。'));
      }
      const agree = form.querySelector('.accept input[type="checkbox"]');
      if (agree && !agree.checked) bad.push(fail(agree.closest('.accept'), [agree], MSG_AGREE));
      if (bad.length) {
        alertBox.textContent = `入力内容に不足があります（${bad.length}件）。印の付いた項目をご確認ください。`;
        bad[0].focus();
      } else {
        showReview();
      }
    });
  });
})();
