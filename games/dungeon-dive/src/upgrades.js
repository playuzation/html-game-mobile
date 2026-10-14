// 층을 깰 때마다 고르는 강화 (아무것도 import 하지 않는 리프 모듈)
// stats 를 직접 바꾼다. max = 최대 중첩 수

export const UPGRADES = [
  { id: 'hp', icon: '❤️', name: '체력 강화', desc: '최대 체력 +1, 체력 1 회복', max: 5, apply: (s) => ((s.maxHp += 1), (s.hp += 1)) },
  { id: 'heal', icon: '🍖', name: '든든한 식사', desc: '체력을 모두 회복', max: 99, apply: (s) => (s.hp = s.maxHp) },
  { id: 'dmg', icon: '🗡️', name: '날카로운 검', desc: '공격력 +1', max: 3, apply: (s) => (s.dmg += 1) },
  { id: 'range', icon: '📏', name: '긴 칼날', desc: '공격 범위 +40%', max: 2, apply: (s) => (s.range += 0.4) },
  { id: 'jump', icon: '🪶', name: '깃털 신발', desc: '공중 점프 +1 (2단·3단 점프)', max: 2, apply: (s) => (s.jumps += 1) },
  { id: 'speed', icon: '👟', name: '질풍', desc: '이동 속도 +15%', max: 2, apply: (s) => (s.speed += 0.15) },
  { id: 'vamp', icon: '🩸', name: '흡혈', desc: '적 6마리를 쓰러뜨릴 때마다 체력 1 회복', max: 1, apply: (s) => (s.vamp = true) },
  { id: 'thorn', icon: '🛡️', name: '가시 장화', desc: '가시를 밟아도 다치지 않음', max: 1, apply: (s) => (s.thorn = true) },
  { id: 'dagger', icon: '🔪', name: '투척 단검', desc: '공격할 때 단검이 날아감', max: 1, apply: (s) => (s.dagger = true) },
  { id: 'magnet', icon: '🧲', name: '자석', desc: '가까운 동전이 끌려옴', max: 1, apply: (s) => (s.magnet = true) },
];

export function newStats(hp) {
  return { hp, maxHp: hp, dmg: 1, range: 1, jumps: 1, speed: 1, vamp: false, thorn: false, dagger: false, magnet: false, taken: {} };
}

// 아직 더 가질 수 있는 강화 중 3개
export function offer(stats, rng) {
  const pool = UPGRADES.filter((u) => (stats.taken[u.id] || 0) < u.max && !(u.id === 'heal' && stats.hp === stats.maxHp));
  const out = [];
  while (out.length < 3 && pool.length) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  return out;
}

export function take(stats, upgrade) {
  upgrade.apply(stats);
  stats.taken[upgrade.id] = (stats.taken[upgrade.id] || 0) + 1;
}
