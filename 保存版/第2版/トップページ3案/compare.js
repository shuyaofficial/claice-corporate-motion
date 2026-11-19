'use strict';

const form = document.querySelector('#survey');
const questions = [...form.querySelectorAll('fieldset.q')];
const saveState = document.querySelector('#save-state');
const copyState = document.querySelector('#copy-state');
const manualCopy = document.querySelector('#manual');
const answerText = document.querySelector('#answer-text');
const count = document.querySelector('#count');
const storagePrefix = 'claice-homepage-review-edition2/';
const controls = [...form.querySelectorAll('input, textarea')];
const checkboxGroups = questions.filter(question => question.querySelector('input[type="checkbox"]'));
let storageAvailable = true;

function collectAnswers() {
  return questions.map(question => ({
    title: question.querySelector('legend').textContent.trim(),
    selected: [...question.querySelectorAll('input:checked')].map(input => input.value),
    note: question.querySelector('textarea').value.trim()
  })).filter(answer => answer.selected.length || answer.note);
}

function refreshSummary() {
  const answers = collectAnswers();
  const lines = ['【クレイス トップページ3案 第2版の回答】'];
  for (const answer of answers) {
    const choices = answer.selected.length ? answer.selected.join('／') : '（選択なし）';
    lines.push('- ' + answer.title + '　' + choices);
    if (answer.note) lines.push('  メモ：' + answer.note);
  }
  if (!answers.length) lines.push('（まだ回答がありません）');
  count.textContent = '回答 ' + answers.length + ' / ' + questions.length;
  answerText.value = lines.join('\n');
  copyState.textContent = '';
}

function controlKey(control) {
  const question = control.closest('[data-q]').dataset.q;
  const part = control.type === 'checkbox' ? 'choice/' + control.value : control.type;
  return storagePrefix + question + '/' + part;
}

function modeKey(group) {
  return storagePrefix + group.dataset.q + '/mode';
}

// Rank ordinary selections within the most recent exclusive choice. Each ordinary
// choice has its own key so two tabs adding different choices can both succeed.
function checkboxMode(group) {
  const stored = localStorage.getItem(modeKey(group));
  if (stored !== null) return stored.split('\n');
  const previous = [...group.querySelectorAll('[data-exclusive]')]
    .find(input => localStorage.getItem(controlKey(input)) === 'true');
  return previous ? ['legacy-exclusive', previous.value] : ['', ''];
}

function restoreCheckboxGroup(group) {
  const [generation, exclusive] = checkboxMode(group);
  const prefix = generation ? generation + '/' : '';
  let usedOrdinary = false;
  for (const input of group.querySelectorAll('input:not([data-exclusive])')) {
    const stored = localStorage.getItem(controlKey(input));
    input.checked = stored === prefix + 'true';
    if (input.checked || stored === prefix + 'false') usedOrdinary = true;
  }
  for (const input of group.querySelectorAll('[data-exclusive]')) {
    input.checked = !usedOrdinary && input.value === exclusive;
  }
}

function restoreAnswers() {
  if (!storageAvailable) {
    refreshSummary();
    return;
  }
  try {
    for (const group of checkboxGroups) restoreCheckboxGroup(group);
    for (const control of controls) {
      if (control.type === 'checkbox') continue;
      const stored = localStorage.getItem(controlKey(control));
      if (control.type === 'textarea') {
        if (control.value !== (stored ?? '')) control.value = stored ?? '';
      } else {
        control.checked = control.value === stored;
      }
    }
    saveState.textContent = collectAnswers().length
      ? 'このブラウザに保存した回答を表示しています。'
      : '入力した回答は、このブラウザに保存されます。';
  } catch {
    storageAvailable = false;
    saveState.textContent = '保存した回答を読み込めませんでした。記入後に回答をコピーしてください。';
  }
  refreshSummary();
}

function applyCheckboxLocally(control, group) {
  if (!control.checked) return;
  const selector = control.hasAttribute('data-exclusive') ? 'input:checked' : '[data-exclusive]:checked';
  for (const other of group.querySelectorAll(selector)) {
    if (other !== control) other.checked = false;
  }
}

function persistCheckbox(control, group) {
  if (control.hasAttribute('data-exclusive')) {
    const generation = crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random();
    localStorage.setItem(modeKey(group), generation + '\n' + (control.checked ? control.value : ''));
  } else {
    const [generation] = checkboxMode(group);
    const prefix = generation ? generation + '/' : '';
    localStorage.setItem(controlKey(control), prefix + control.checked);
  }
  restoreCheckboxGroup(group);
}

function saveAnswer(event) {
  const control = event.target;
  if (!controls.includes(control)) return;
  const group = control.closest('fieldset');
  if (control.type === 'checkbox') applyCheckboxLocally(control, group);
  if (storageAvailable) {
    try {
      if (control.type === 'checkbox') persistCheckbox(control, group);
      else localStorage.setItem(controlKey(control), control.value);
      saveState.textContent = 'このブラウザに回答を保存しました。';
    } catch {
      storageAvailable = false;
      saveState.textContent = 'このブラウザでは保存できません。閉じる前に回答をコピーしてください。';
    }
  }
  refreshSummary();
}

async function copyAnswers() {
  restoreAnswers();
  if (!collectAnswers().length) {
    copyState.textContent = '選択肢を選ぶか、コメントを記入してください。';
    return;
  }
  try {
    await navigator.clipboard.writeText(answerText.value);
    copyState.textContent = 'コピーしました。チャットの入力欄に貼り付けてください。';
  } catch {
    manualCopy.open = true;
    answerText.focus();
    answerText.select();
    copyState.textContent = '回答文を選択しました。端末のコピー操作で控えてください。';
  }
}

function clearAnswers() {
  if (!window.confirm('このブラウザに保存した第2版の回答を消しますか？')) return;
  for (const control of controls) {
    if (control.type === 'textarea') control.value = '';
    else control.checked = false;
  }
  try {
    for (const key of new Set([...controls.map(controlKey), ...checkboxGroups.map(modeKey)])) localStorage.removeItem(key);
    storageAvailable = true;
    saveState.textContent = '第2版の回答を消しました。';
  } catch {
    saveState.textContent = '画面の入力を消しました。ブラウザの保存データにはアクセスできませんでした。';
  }
  refreshSummary();
}

const deviceButtons = document.querySelectorAll('[data-device]');
const previews = document.querySelectorAll('img[data-plan]');

function showDevice(device) {
  document.documentElement.dataset.view = device;
  for (const button of deviceButtons) {
    button.setAttribute('aria-pressed', String(device === button.dataset.device));
  }
  for (const image of previews) {
    image.width = device === 'pc' ? 1440 : 390;
    image.height = device === 'pc' ? 900 : 844;
    image.src = 'assets/' + image.dataset.plan + '-' + device + '.webp';
    const title = image.closest('article').querySelector('h2').textContent.trim();
    image.alt = title + 'の' + (device === 'pc' ? 'PC' : 'スマホ') + '画面';
  }
}

for (const button of deviceButtons) {
  button.addEventListener('click', () => showDevice(button.dataset.device));
}
form.addEventListener('input', saveAnswer);
window.addEventListener('storage', event => {
  if (event.key === null || event.key.startsWith(storagePrefix)) restoreAnswers();
});
document.querySelector('#copy').addEventListener('click', copyAnswers);
document.querySelector('#clear').addEventListener('click', clearAnswers);
document.querySelector('a[href="#history"]').addEventListener('click', () => {
  document.querySelector('#history').open = true;
});
showDevice(window.matchMedia('(max-width: 600px)').matches ? 'sp' : 'pc');
restoreAnswers();
