// 88건반 미니 피아노: 난이도 범위 표시 + 정답 건반 강조 (SVG)
import { PIANO, isBlack, noteName } from './notes.js';

const SVG = 'http://www.w3.org/2000/svg';
const WHITE_W = 10;
const WHITE_H = 56;

export function buildKeyboard(svg) {
  svg.innerHTML = '';
  const whites = [];
  const blacks = [];
  let x = 0;
  for (let m = PIANO.low; m <= PIANO.high; m++) {
    if (isBlack(m)) blacks.push({ m, x: x - WHITE_W * 0.32 });
    else {
      whites.push({ m, x });
      x += WHITE_W;
    }
  }
  svg.setAttribute('viewBox', `0 0 ${x} ${WHITE_H + 12}`);
  const keys = new Map();
  const add = (k, black) => {
    const r = document.createElementNS(SVG, 'rect');
    r.setAttribute('x', k.x);
    r.setAttribute('y', 0);
    r.setAttribute('width', black ? WHITE_W * 0.64 : WHITE_W - 0.6);
    r.setAttribute('height', black ? WHITE_H * 0.62 : WHITE_H);
    r.setAttribute('rx', 1);
    r.setAttribute('class', black ? 'k b' : 'k w');
    svg.appendChild(r);
    keys.set(k.m, r);
  };
  whites.forEach((k) => add(k, false));
  blacks.forEach((k) => add(k, true));
  // C 마다 옥타브 표시
  for (const k of whites) {
    if (k.m % 12 !== 0) continue;
    const t = document.createElementNS(SVG, 'text');
    t.setAttribute('x', k.x + WHITE_W / 2);
    t.setAttribute('y', WHITE_H + 10);
    t.setAttribute('class', 'lbl');
    t.textContent = noteName(k.m);
    svg.appendChild(t);
  }
  return keys;
}

// answer: 정답 건반 하나 또는 화음 구성 건반 배열
export function paintKeyboard(keys, { low, high }, answer = null) {
  const ans = new Set([].concat(answer ?? []));
  for (const [m, r] of keys) {
    r.classList.toggle('out', m < low || m > high);
    r.classList.toggle('ans', ans.has(m));
  }
}
