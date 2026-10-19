// 진입점: 문제 진행·버튼 활성/비활성·힌트 토글·난이도·기록 (트리의 루트)
import { NoteGame } from './game.js';
import { NAMES, ALT, LEVELS, MODES, freq, noteName } from './notes.js';
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
let mode = store.get('mode', 'single');
if (!MODES[mode]) mode = 'single';
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
  game = new NoteGame(level, Math.random, mode);
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
  say(mode === 'single' ? '어떤 음일까요?' : `${MODES[mode].label} 화음 — 구성음 ${game.answers.size}개를 모두 찾으세요`, '');
  paintKeyboard(keys, LEVELS[level]);
  play();
  stats();
}

function play(arpeggio = false) {
  synth.play(game.notes.map(freq), arpeggio ? { gap: 0.45, dur: 2.2 } : {});
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
  if (r.correct && !r.complete) {
    // 화음 구성음 하나 찾음: 그 버튼은 초록으로 고정
    pad.classList.add('right');
    pad.disabled = true;
    say(`⭕ ${NAMES[pc]} 맞아요! 남은 구성음 ${game.answers.size - game.found.size}개`, 'ok');
  } else if (r.correct) {
    pad.classList.add('right');
    pads().forEach((p) => (p.disabled = true));
    $('answer').textContent = answerText();
    paintKeyboard(keys, LEVELS[level], game.notes);
    say(game.tried.size === 0 ? '🎉 한 번에 정답!' : `⭕ 정답! (${game.tried.size}번 틀림)`, 'ok');
    $('next').hidden = false;
    if (navigator.vibrate) navigator.vibrate(25);
  } else {
    pad.disabled = true;
    pad.classList.add('wrong');
    const many = mode !== 'single';
    if (hints) {
      const tag = { up: '▲ UP', down: '▼ DOWN', both: '↕ 양쪽' }[r.hint];
      pad.querySelector('.hint').textContent = tag;
      const what = many ? '남은 구성음은' : '정답은';
      const text = {
        up: `${what} ${NAMES[pc]} 보다 높아요 ▲ UP`,
        down: `${what} ${NAMES[pc]} 보다 낮아요 ▼ DOWN`,
        both: `남은 구성음이 ${NAMES[pc]} 의 위아래 양쪽에 있어요 ↕`,
      }[r.hint];
      say(text, r.hint === 'both' ? 'up' : r.hint);
    } else say(`${NAMES[pc]} 은(는) ${many ? '구성음이' : ''} 아니에요`, 'no');
    play();
  }
  stats();
}

// 정답 표시: 근음은 'F#3', 화음은 'C#7 · 근음 C#4 (C# F G# B)'
function answerText() {
  if (mode === 'single') return noteName(game.midi);
  const tones = game.notes.map((m) => NAMES[m % 12]).join(' ');
  return `${NAMES[game.answer]}${MODES[mode].symbol} · 근음 ${noteName(game.midi)} (${tones})`;
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
  document.querySelectorAll('#modes button').forEach((b) => b.classList.toggle('on', b.dataset.mode === mode));
  $('arp').hidden = mode === 'single';
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
$('modes').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  mode = b.dataset.mode;
  store.set('mode', mode);
  renderSettings();
  if (game) {
    game.setMode(mode);
    newQuestion(false);
  }
});
$('arp').addEventListener('click', () => game && play(true));
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
