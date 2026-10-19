// 규칙 검증: 88건반·주파수·난이도 범위·판정·힌트·버튼 비활성 규칙
// 실행: node games/note-guess/tools/test-game.mjs
import { NoteGame } from '../src/game.js';
import { LEVELS, MODES, PIANO, NAMES, freq, noteName, pitchClass } from '../src/notes.js';

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

// ---------- 화음 모드 ----------
const want = { maj: 'C E G', min: 'C D# G', maj7: 'C E G B', dom7: 'C E G A#' };
for (const [mode, tones] of Object.entries(want)) {
  const t = new NoteGame('easy', () => 0, mode); // 근음 C4
  check(`${MODES[mode].label}: C 화음 = ${tones}`, t.notes.map((m) => NAMES[m % 12]).join(' ') === tones && noteName(t.midi) === 'C4');
}

// 처음 모드는 근음 하나
check('기본 모드 = 근음(음 하나)', new NoteGame('easy').mode === 'single' && new NoteGame('easy').notes.length === 1);

// 구성음을 모두 찾아야 끝남 · 맞힌 구성음/틀린 음 재입력 무시
const c7 = new NoteGame('easy', () => 0.5, 'dom7'); // F#4 7 = F# A# C# E
check('F#7 구성음', c7.notes.map((m) => NAMES[m % 12]).join(' ') === 'F# A# C# E', c7.notes.map(noteName).join(' '));
const s1 = c7.guess(6);
check('구성음 하나 → 정답이지만 아직 미완료', s1.correct && !s1.complete && !c7.done);
check('찾은 구성음 다시 누르면 무시', c7.guess(6) === null);
const w1 = c7.guess(0); // C: 남은 A#(10) C#(1) E(4) → 모두 C 보다 높음
check('남은 구성음이 모두 높으면 UP', w1.hint === 'up');
const w2 = c7.guess(3); // D#: 남은 1, 4, 10 → 양쪽
check('남은 구성음이 양쪽이면 ↕', w2.hint === 'both');
c7.guess(1);
c7.guess(4);
const w3 = c7.guess(11); // B: 남은 A#(10) → 낮음
check('남은 구성음이 모두 낮으면 DOWN', w3.hint === 'down');
const fin = c7.guess(10);
check('마지막 구성음 → 완료, 틀린 적 있으면 한 번에 맞힘 아님', fin.complete && c7.done && c7.solved === 1 && c7.firstTry === 0 && c7.wrong === 3);

// 화음 힌트 전수 검사: 모든 근음·모드·찾은 순서에서 힌트가 남은 음 기준으로 맞는지
let allOk = true;
for (const mode of ['maj', 'min', 'maj7', 'dom7'])
  for (let root = 0; root < 12; root++) {
    const t = new NoteGame('easy', () => root / 12 + 0.001, mode);
    const ans = [...t.answers];
    t.guess(ans[0]); // 첫 구성음 찾아 둠
    for (let pc = 0; pc < 12; pc++) {
      if (t.answers.has(pc) || t.tried.has(pc)) continue;
      const left = ans.filter((a) => !t.found.has(a));
      const expect = left.some((a) => a > pc) && left.some((a) => a < pc) ? 'both' : left.some((a) => a > pc) ? 'up' : 'down';
      if (t.guess(pc).hint !== expect) allOk = false;
    }
  }
check('화음 4종 × 근음 12개 힌트 전수 검사', allOk);

// 근음 범위: 화음 윗음이 C8 를 넘지 않음 (상 난이도)
let topOk = true;
let rootLow = 999;
for (const mode of ['maj7', 'dom7', 'maj']) {
  const t = new NoteGame('hard', Math.random, mode);
  for (let k = 0; k < 20000; k++) {
    t.next();
    if (Math.max(...t.notes) > PIANO.high) topOk = false;
    rootLow = Math.min(rootLow, t.midi);
  }
}
check('상: 화음 맨 윗음이 C8 이하, 근음은 A0 부터', topOk && rootLow === PIANO.low);
const easyRoots = new Set();
const te = new NoteGame('easy', Math.random, 'maj7');
for (let k = 0; k < 5000; k++) easyRoots.add(te.next());
check('하: 화음 모드에서도 근음은 C4~B4 12개', easyRoots.size === 12 && Math.min(...easyRoots) === 60 && Math.max(...easyRoots) === 71);

// 한 번만 듣기: 틀리면 바로 끝 (놓친 문제로 기록, 정확도에 포함, 연속 끊김)
const o = new NoteGame('easy', () => 0.5); // F#4
o.guess(6);
o.next();
o.guess((o.answer + 1) % 12);
o.giveUp();
check('한 번만: 틀리면 문제 끝 · 이후 입력 무시', o.done && o.guess(o.answer) === null);
check('한 번만: 놓친 문제 기록 · 정확도 1/2 · 연속 0', o.missed === 1 && o.solved === 1 && o.accuracy === 0.5 && o.streak === 0 && o.bestStreak === 1);
o.giveUp();
check('이미 끝난 문제에 giveUp 중복 기록 없음', o.missed === 1);

console.log(res.join('\n'));
if (res.some((l) => l.startsWith('❌'))) process.exit(1);
