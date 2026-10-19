// 루트: 듣기 → 꾹 누르기 → 판정 화면 진행 (rules.js · beep.js 리프만 사용)
import { HoldGame, MIN, MAX, TOLERANCE } from './rules.js';
import { Beep } from './beep.js';

const $ = (id) => document.getElementById(id);
const game = new HoldGame();
const beep = new Beep();
let state = 'ready'; // ready → listening → wait → holding → result
let heard = false;
let timer = null;
let downAt = 0;
let holdId = null;

function setState(s) {
  state = s;
  document.body.dataset.state = s;
  $('listen').disabled = s === 'listening' || s === 'holding' || s === 'result';
  $('listen').innerHTML = heard ? '🔁 다시 듣기' : '🔊 삐 소리 듣기';
  $('hold').disabled = !(s === 'wait' || s === 'holding');
  $('next').hidden = s !== 'result';
  $('msg').textContent = {
    ready: `${MIN}~${MAX}초 사이 삐 소리를 먼저 들어 보세요`,
    listening: '🔊 듣는 중… 길이를 기억하세요',
    wait: '같은 시간만큼 버튼을 꾹 누르세요',
    holding: '누르는 중… 됐다 싶을 때 떼세요',
    result: '',
  }[s];
}

$('listen').addEventListener('click', () => {
  if ($('listen').disabled) return;
  const sec = beep.play(game.target);
  heard = true;
  setState('listening');
  clearTimeout(timer);
  timer = setTimeout(() => setState('wait'), sec * 1000);
});

// 꾹 누르기: pointerdown ~ pointerup 사이 시간 (손가락이 버튼 밖으로 나가도 계속 잼)
const hold = $('hold');
hold.addEventListener('pointerdown', (e) => {
  if (state !== 'wait') return;
  e.preventDefault();
  downAt = performance.now();
  holdId = e.pointerId;
  hold.setPointerCapture(e.pointerId);
  beep.play(null, 660, 0.1);
  setState('holding');
});
const release = (e) => {
  if (state !== 'holding' || e.pointerId !== holdId) return;
  const held = (performance.now() - downAt) / 1000;
  beep.stop();
  showResult(game.judge(held));
};
hold.addEventListener('pointerup', release);
hold.addEventListener('pointercancel', release);
hold.addEventListener('contextmenu', (e) => e.preventDefault()); // 길게 누르기 메뉴 방지

function showResult({ pass, diff, held, target }) {
  setState('result');
  const r = $('result');
  r.hidden = false;
  r.className = pass ? 'pass' : 'fail';
  $('verdict').textContent = pass ? 'PASS' : 'FAIL';
  $('r-target').textContent = `${target.toFixed(1)}초`;
  $('r-held').textContent = `${held.toFixed(2)}초`;
  $('r-diff').textContent = `${diff >= 0 ? '+' : ''}${diff.toFixed(2)}초`;
  $('r-note').textContent = pass ? `±${TOLERANCE}초 안에 들어왔어요!` : diff > 0 ? '조금 길게 눌렀어요' : '조금 짧게 뗐어요';
  // 오차 막대: 가운데가 목표, 초록 구간이 ±0.1초, 양끝 ±1초
  const pct = (Math.max(-1, Math.min(1, diff)) + 1) * 50;
  $('marker').style.left = `${pct}%`;
  stats();
}

$('next').addEventListener('click', () => {
  game.next();
  heard = false;
  $('result').hidden = true;
  setState('ready');
});

function stats() {
  $('s-pass').textContent = `${game.passes} / ${game.rounds}`;
  $('s-streak').textContent = game.streak;
  $('s-best').textContent = game.bestDiff === null ? '-' : `${game.bestDiff.toFixed(2)}초`;
}

$('start').addEventListener('click', () => {
  beep.unlock();
  $('intro').hidden = true;
});

$('zone').style.width = `${TOLERANCE * 100}%`; // -1~+1초 막대에서 ±0.1초 구간
$('zone').style.left = `${50 - TOLERANCE * 50}%`;
stats();
setState('ready');
