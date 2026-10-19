// 진입점: 라운드 진행·메트로놈·시각화·자물쇠·결과 연결 (트리의 루트)
import { BpmGame, ROUNDS, TRIES, MIN_BPM, MAX_BPM } from './game.js';
import { Metronome } from './metronome.js';
import { drawMetronome, updateBeats } from './visual.js';
import { DialLock } from './lock.js';

const $ = (id) => document.getElementById(id);
const canvas = $('metro');
const ctx = canvas.getContext('2d');
const beatEls = [...document.querySelectorAll('#beats i')];
const metro = new Metronome();
let game = null;
let best = null;
try {
  best = Number(localStorage.getItem('bpm-lock-best')) || null;
} catch (e) {}

const lock = new DialLock($('dial'), 120, () => {
  $('feedback').textContent = '';
  $('feedback').className = '';
});

// ---------- 진행 ----------
function startGame() {
  metro.unlock(); // 버튼 터치 안에서 오디오 허용
  game = new BpmGame();
  $('intro').hidden = true;
  $('end').hidden = true;
  startRound();
}

function startRound() {
  lock.set(120);
  lock.setDisabled(false);
  $('lockbox').classList.remove('open', 'fail');
  $('feedback').textContent = '';
  $('feedback').className = '';
  $('answer').textContent = '???';
  $('submit').hidden = false;
  $('next').hidden = true;
  metro.start(game.target);
  hud();
}

function submit() {
  if (!game || game.done) return;
  const r = game.guess(lock.value);
  if (!r.valid) return say(`${MIN_BPM}~${MAX_BPM} 사이로 맞춰 주세요`, 'warn');
  if (!r.finished) {
    say(`${r.direction === 'up' ? '⬆️ 더 빨라요' : '⬇️ 더 느려요'} · ${r.label} (남은 기회 ${r.left})`, r.direction);
    $('lockbox').classList.remove('shake');
    void $('lockbox').offsetWidth;
    $('lockbox').classList.add('shake');
    if (navigator.vibrate) navigator.vibrate(40);
  } else {
    $('answer').textContent = game.target;
    lock.setDisabled(true);
    $('submit').hidden = true;
    $('next').hidden = false;
    $('next').textContent = game.round >= ROUNDS ? '결과 보기' : '다음 라운드 ▶';
    if (r.ok) {
      $('lockbox').classList.add('open');
      say(`🔓 열렸다! 정답 ${game.target} BPM · +${r.score}점`, 'ok');
    } else {
      $('lockbox').classList.add('fail');
      say(`🔒 정답은 ${game.target} BPM · +${r.score}점`, 'warn');
    }
  }
  hud();
}

function nextRound() {
  game.next();
  if (game.over) return finish();
  startRound();
}

function finish() {
  metro.stop();
  const better = !best || game.total > best;
  if (better) {
    best = game.total;
    try {
      localStorage.setItem('bpm-lock-best', String(best));
    } catch (e) {}
  }
  $('res-total').textContent = game.total;
  $('res-rows').innerHTML = game.history
    .map((h, i) => `<tr><td>${i + 1}</td><td>${h.target}</td><td>${h.guesses.join(' → ')}</td><td>${h.score}</td></tr>`)
    .join('');
  $('res-best').textContent = better ? '✨ 최고 점수 갱신!' : `최고 점수 ${best}점`;
  $('end').hidden = false;
}

function say(text, kind = '') {
  $('feedback').textContent = text;
  $('feedback').className = kind;
}

function hud() {
  $('round').textContent = `라운드 ${Math.min(game.round, ROUNDS)} / ${ROUNDS}`;
  $('tries').textContent = '●'.repeat(TRIES - game.guesses.length) + '○'.repeat(game.guesses.length);
  $('total').textContent = `${game.total}점`;
}

$('start').addEventListener('click', startGame);
$('again').addEventListener('click', startGame);
$('submit').addEventListener('click', submit);
$('next').addEventListener('click', nextRound);
$('mute').addEventListener('click', () => {
  if (metro.running) {
    metro.stop();
    $('mute').textContent = '▶ 다시 듣기';
  } else if (game && !game.over) {
    metro.start(game.target);
    $('mute').textContent = '⏸ 멈춤';
  }
});
window.addEventListener('keydown', (e) => {
  if (e.code === 'Enter') ($('submit').hidden ? $('next') : $('submit')).click();
});
$('start-best').textContent = best ? `최고 점수 ${best} / ${ROUNDS * 100}` : '';

// ---------- 시각화 루프 ----------
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const r = canvas.getBoundingClientRect();
  canvas.width = Math.round(r.width * dpr);
  canvas.height = Math.round(r.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resize);
function frame() {
  const r = canvas.getBoundingClientRect();
  const ph = metro.running ? metro.phase() : null;
  drawMetronome(ctx, r.width, r.height, ph, metro.running);
  updateBeats(beatEls, ph, metro.running);
  if (game && !game.over) $('mute').textContent = metro.running ? '⏸ 멈춤' : '▶ 다시 듣기';
  requestAnimationFrame(frame);
}
resize();
requestAnimationFrame(frame);
