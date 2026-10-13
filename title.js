// 타이틀 화면: 레지스트리를 읽어 게임 카드를 그린다
import { GAMES } from './games.js';
import { setupShare } from './common/share.js';

const list = document.getElementById('list');

for (const g of GAMES) {
  const a = document.createElement('a');
  a.className = 'card';
  a.href = `games/${g.id}/`;
  a.style.setProperty('--accent', g.color);
  a.innerHTML = `
    <div class="icon">${g.icon}</div>
    <div class="body">
      <h2></h2>
      <p></p>
      <div class="tags">${g.tags.map(() => '<span></span>').join('')}</div>
    </div>
    <div class="go">▶</div>`;
  a.querySelector('h2').textContent = g.title;
  a.querySelector('p').textContent = g.desc;
  a.querySelectorAll('.tags span').forEach((s, i) => (s.textContent = g.tags[i]));
  list.appendChild(a);
}

document.getElementById('count').textContent = GAMES.length;
setupShare(document.getElementById('share'), document.getElementById('qr'), document.getElementById('share-url'));
