// 진입점: 작업대·도감·진행도·힌트·저장 연결 (트리의 루트)
import { Alchemy, TARGET, emojiOf } from './alchemy.js';
import { Board } from './board.js';
import { BASE } from './recipes.js';

const $ = (id) => document.getElementById(id);
const SAVE_KEY = 'alchemy-found';

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(SAVE_KEY)) || null;
  } catch (e) {
    return null;
  }
};
const save = () => {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(game.found));
  } catch (e) {}
};

let game = new Alchemy(load());

const board = new Board($('board'), {
  emojiOf,
  onCombine(a, b) {
    const res = game.combine(a, b);
    if (!res) {
      toast(`${emojiOf(a)} + ${emojiOf(b)} … 아무 일도 없었다`);
      return null;
    }
    if (res.isNew) {
      save();
      toast(`✨ 새 발견! ${emojiOf(res.result)} ${res.result}`, true);
      if (navigator.vibrate) navigator.vibrate(30);
      renderLibrary(res.result);
      if (game.complete) setTimeout(() => ($('done').hidden = false), 900);
    } else toast(`${emojiOf(res.result)} ${res.result}`);
    progress();
    return res;
  },
});

// ---------- 도감 ----------
let filter = '';
function renderLibrary(fresh = null) {
  const list = $('library');
  const items = game.found.filter((n) => !filter || n.includes(filter));
  list.innerHTML = items
    .map((n) => `<button type="button" class="item ${n === fresh ? 'fresh' : ''} ${BASE.includes(n) ? 'base' : ''}" data-name="${n}"><span class="em">${emojiOf(n)}</span><span class="nm">${n}</span></button>`)
    .join('');
  if (fresh) list.querySelector('.fresh')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
// 도감 항목을 누르면 작업대 빈 자리에 꺼낸다 (도감은 손가락으로 스크롤)
$('library').addEventListener('click', (e) => {
  const b = e.target.closest('.item');
  if (!b) return;
  const s = board.freeSpot();
  board.add(b.dataset.name, s.x, s.y);
});
$('search').addEventListener('input', (e) => {
  filter = e.target.value.trim();
  renderLibrary();
});

function progress() {
  const n = game.progress;
  $('count').textContent = `${n} / ${TARGET}`;
  $('bar').style.width = `${(n / TARGET) * 100}%`;
}

// ---------- 버튼 ----------
$('hint').addEventListener('click', () => {
  const h = game.hint();
  if (!h) return toast('지금은 찾을 조합이 없어요');
  const [a, b] = h;
  toast(`💡 ${emojiOf(a)} ${a}에 무언가를 섞어 보세요… (${b === a ? '같은 것끼리!' : emojiOf(b) + ' ?'})`, true, 3200);
});
$('clear').addEventListener('click', () => {
  board.clear();
  placeBase();
});
$('reset').addEventListener('click', () => {
  if (!confirm('발견한 것을 모두 지우고 처음부터 할까요?')) return;
  game = new Alchemy();
  save();
  board.clear();
  placeBase();
  renderLibrary();
  progress();
});
$('done-close').addEventListener('click', () => ($('done').hidden = true));

function placeBase() {
  const r = $('board').getBoundingClientRect();
  BASE.forEach((n, i) => {
    const a = (i / BASE.length) * Math.PI * 2 - Math.PI / 2;
    const rad = Math.min(r.width, r.height) * 0.3;
    board.add(n, r.width / 2 + Math.cos(a) * rad, r.height / 2 + Math.sin(a) * rad);
  });
}

let toastTimer = null;
function toast(text, strong = false, ms = 1800) {
  const t = $('toast');
  t.textContent = text;
  t.classList.toggle('strong', strong);
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), ms);
}

renderLibrary();
progress();
placeBase();
if (game.progress === 0) toast('원소를 끌어서 다른 원소 위에 겹쳐 보세요! 아래 도감을 누르면 작업대로 꺼냅니다', true, 4000);
