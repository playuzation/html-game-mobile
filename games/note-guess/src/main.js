// 진입점: 문제 진행·버튼 활성/비활성·힌트 토글·난이도·기록 (트리의 루트)
import { NoteGame } from './game.js';
import { NAMES, ALT, LEVELS, freq, noteName } from './notes.js';
import { Synth } from './synth.js';
import { buildKeyboard, paintKeyboard } from './keyboard.js';

const $ = (id) => document.getElementById(id);
const synth = new Synth();
const store = {
  get(k, d) {
    try {
      const v = localStorage.getItem('note-guess-' + k);
      return v === null ? d : JSON.parse(v);
    } catch (e) {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem('note-guess-' + k, JSON.stringify(v));
    } catch (e) {}
  },
};

let level = store.get('level', 'easy');
let hints = store.get('hints', true);
let game = null;
const keys = buildKeyboard($('piano'));

// 12개 버튼: C(가장 낮음) → B(가장 높음)
$('pads').innerHTML = NAMES.map(
  (n, i) => `<button type="button" class="pad ${n.includes('#') ? 'sharp' : ''}" data-pc="${i}">
    <b>${n}</b>${ALT[n] ? `<small>${ALT[n]}</small>` : ''}<em class="hint"></em></button>`,
).join('');

function pads() {
  return [...document.querySelectorAll('.pad')];
}

// ---------- 진행 ----------
function start() {
  synth.unlock(); // 시작 버튼 터치 안에서 오디오 허용
  $('intro').hidden = true;
  game = new NoteGame(level);
  newQuestion(false);
}

function newQuestion(advance = true) {
  if (advance) game.next();
  pads().forEach((p) => {
    p.disabled = false;
    p.classList.remove('wrong', 'right');
    p.querySelector('.hint').textContent = '';
  });
  $('next').hidden = true;
  $('answer').textContent = '?';
  say('어떤 음일까요?', '');
  paintKeyboard(keys, LEVELS[level]);
  play();
  stats();
}

function play() {
  synth.play(freq(game.midi));
  const b = $('replay');
  b.classList.remove('ping');
  void b.offsetWidth;
  b.classList.add('ping');
}

function pick(pad) {
  if (!game || game.done) return;
  const pc = Number(pad.dataset.pc);
  const r = game.guess(pc);
  if (!r) return;
  if (r.correct) {
    pad.classList.add('right');
    pads().forEach((p) => (p.disabled = true));
    $('answer').textContent = noteName(game.midi);
    paintKeyboard(keys, LEVELS[level], game.midi);
    say(game.tried.size === 0 ? '🎉 한 번에 정답!' : `⭕ 정답! (${game.tried.size}번 틀림)`, 'ok');
    $('next').hidden = false;
    if (navigator.vibrate) navigator.vibrate(25);
  } else {
    pad.disabled = true;
    pad.classList.add('wrong');
    if (hints) {
      pad.querySelector('.hint').textContent = r.hint === 'up' ? '▲ UP' : '▼ DOWN';
      say(r.hint === 'up' ? `${NAMES[pc]} 보다 높아요 ▲ UP` : `${NAMES[pc]} 보다 낮아요 ▼ DOWN`, r.hint);
    } else say(`${NAMES[pc]} 은(는) 아니에요`, 'no');
    play();
  }
  stats();
}

function say(text, kind) {
  $('feedback').textContent = text;
  $('feedback').className = kind;
}

function stats() {
  const acc = game.accuracy;
  $('stat-solved').textContent = game.solved;
  $('stat-acc').textContent = acc === null ? '-' : `${Math.round(acc * 100)}%`;
  $('stat-streak').textContent = `${game.streak} (최고 ${game.bestStreak})`;
}

// ---------- 설정 ----------
function renderSettings() {
  document.querySelectorAll('#levels button').forEach((b) => b.classList.toggle('on', b.dataset.lv === level));
  $('range').textContent = LEVELS[level].desc;
  $('hints').checked = hints;
  document.body.classList.toggle('nohint', !hints);
}
$('levels').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  level = b.dataset.lv;
  store.set('level', level);
  renderSettings();
  if (game) {
    game.setLevel(level);
    newQuestion(false);
  } else paintKeyboard(keys, LEVELS[level]);
});
$('hints').addEventListener('change', (e) => {
  hints = e.target.checked;
  store.set('hints', hints);
  renderSettings();
  if (!hints) pads().forEach((p) => (p.querySelector('.hint').textContent = ''));
});

$('pads').addEventListener('click', (e) => {
  const p = e.target.closest('.pad');
  if (p && !p.disabled) pick(p);
});
$('replay').addEventListener('click', () => game && play());
$('next').addEventListener('click', () => newQuestion());
$('start').addEventListener('click', start);
window.addEventListener('keydown', (e) => {
  if (!game) return;
  if (e.code === 'Space') {
    e.preventDefault();
    play();
  }
  if (e.code === 'Enter' && !$('next').hidden) newQuestion();
});

renderSettings();
paintKeyboard(keys, LEVELS[level]);
