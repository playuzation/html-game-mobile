// 규칙 검증: 88건반·주파수·난이도 범위·판정·힌트·버튼 비활성 규칙
// 실행: node games/note-guess/tools/test-game.mjs
import { NoteGame } from '../src/game.js';
import { LEVELS, PIANO, freq, noteName, pitchClass } from '../src/notes.js';

const res = [];
const check = (n, ok, d = '') => res.push(`${ok ? '✅' : '❌'} ${n}${d ? ' — ' + d : ''}`);

check('피아노 88건반 A0~C8', PIANO.high - PIANO.low + 1 === 88 && noteName(PIANO.low) === 'A0' && noteName(PIANO.high) === 'C8');
check('A4 = 440Hz, A0 = 27.5Hz, C8 ≈ 4186Hz', freq(69) === 440 && Math.abs(freq(21) - 27.5) < 1e-9 && Math.abs(freq(108) - 4186.01) < 0.01, `C4 ${freq(60).toFixed(2)}Hz`);

// 난이도별로 실제 출제되는 건반 범위
for (const [lv, want, lo, hi] of [['easy', 12, 'C4', 'B4'], ['normal', 48, 'C2', 'B5'], ['hard', 88, 'A0', 'C8']]) {
  const g = new NoteGame(lv);
  const seen = new Set();
  for (let k = 0; k < 40000; k++) seen.add(g.next());
  const list = [...seen].sort((a, b) => a - b);
  const ok = seen.size === want && noteName(list[0]) === lo && noteName(list[list.length - 1]) === hi;
  check(`${LEVELS[lv].label}: ${lo}~${hi} 의 ${want}건반만 출제`, ok, `${seen.size}개, ${noteName(list[0])}~${noteName(list[list.length - 1])}`);
}

// 같은 건반 연속 출제 없음
const g0 = new NoteGame('easy');
let repeat = false;
for (let k = 0; k < 5000; k++) {
  const prev = g0.midi;
  if (g0.next() === prev) repeat = true;
}
check('같은 건반이 연달아 나오지 않음', !repeat);

// 판정·힌트: 정답 F#(6) 고정
const g = new NoteGame('easy', () => 0.5); // 60 + floor(0.5*12) = 66 = F#4
check('고정 문제', noteName(g.midi) === 'F#4');
const a = g.guess(2); // D
check('D 선택 → 오답 + UP (F# 이 더 높음)', a.correct === false && a.hint === 'up');
const b = g.guess(10); // A#
check('A# 선택 → 오답 + DOWN', b.correct === false && b.hint === 'down');
check('이미 누른 버튼은 다시 눌러도 무시', g.guess(2) === null && g.wrong === 2);
const c = g.guess(6);
check('F# 선택 → 정답', c.correct && g.done && g.solved === 1 && g.firstTry === 0);
check('정답 후 입력 무시', g.guess(0) === null);
g.next();
check('다음 문제에서 누른 기록 초기화(모두 활성)', g.tried.size === 0 && !g.done);

// 한 번에 맞히기 · 연속 기록
const g2 = new NoteGame('hard');
for (let k = 0; k < 5; k++) {
  g2.guess(pitchClass(g2.midi));
  g2.next();
}
g2.guess((pitchClass(g2.midi) + 1) % 12);
g2.guess(pitchClass(g2.midi));
check('연속 정답 5 → 오답 섞이면 연속 0', g2.bestStreak === 5 && g2.streak === 0 && g2.firstTry === 5 && g2.solved === 6, `정확도 ${Math.round(g2.accuracy * 100)}%`);

// 힌트 방향은 항상 '같은 옥타브 안 C→B 순서' 기준
let hintOk = true;
for (let ans = 0; ans < 12; ans++)
  for (let pick = 0; pick < 12; pick++) {
    if (ans === pick) continue;
    const t = new NoteGame('easy', () => ans / 12 + 0.001);
    const r = t.guess(pick);
    if (r.hint !== (ans > pick ? 'up' : 'down')) hintOk = false;
  }
check('UP/DOWN 힌트 132가지 조합 모두 올바름', hintOk);

console.log(res.join('\n'));
if (res.some((l) => l.startsWith('❌'))) process.exit(1);
