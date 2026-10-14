# MINI ARCADE 🕹️

모바일에서 가볍게 즐기는 HTML5 미니 게임 모음. 빌드 도구 없이 순수 HTML + JS(ES Modules)로 동작합니다.

## 📱 모바일로 확인하기

`push` 할 때마다 GitHub Actions가 GitHub Pages로 자동 배포합니다.

**플레이 주소:** https://playuzation.github.io/html-game-mobile/

<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https%3A%2F%2Fplayuzation.github.io%2Fhtml-game-mobile%2F" alt="QR" width="200">

휴대폰 카메라로 위 QR을 스캔하면 타이틀 화면이 열립니다. PC 브라우저로 접속하면 화면 우측 하단에 QR 패널이 떠서 휴대폰으로 넘겨볼 수 있습니다.

배포 상태: [Actions 탭](https://github.com/playuzation/html-game-mobile/actions/workflows/pages.yml)

## 게임 목록

### 🐔 HOP ROAD
'길건너 친구들' 스타일 아케이드. 탭 = 앞으로, 스와이프 = 방향 이동 (PC: 방향키/WASD).

### ⭐ 별지기 루미
사이드뷰 메트로배니아. 7개의 방을 오가며 도구를 모아 스킬을 얻고 강화해, 별 조각 3개를 별의 제단에 바칩니다.
상단 🎮 버튼으로 화면 조작키(십자키 + A/B)를 켜고 끌 수 있습니다.

| 입력 | 화면 버튼 | 키보드 |
| --- | --- | --- |
| 이동 | 십자키 ◀ ▶ | ← → / A D |
| 점프 (공중에서 다시 누르면 다단 점프) | A | Z / Space / K |
| 도구 (바위 깨기 · 대시) | B | X / J / Shift |
| 제단에 바치기 | 십자키 ▲ | ↑ / W |

| 도구 | 효과 |
| --- | --- |
| ⛏️ 곡괭이 | 금 간 바위 파괴 |
| 🪶 깃털 | 2단 점프 |
| 🧣 바람 망토 | 대시 (낮은 통로의 가시 건너기) |
| 🔩 강철 날 | 곡괭이 강화 — 단단한 바위 파괴 |
| 💎 바람 보석 | 대시 강화 — 수정 벽 파괴 |
| 🕊️ 하얀 깃털 | 3단 점프 |

엔딩까지의 **최소 방 이동은 정확히 31회**입니다. 레벨을 바꾸면 아래 도구로 다시 검증하세요.

```
node games/star-keeper/tools/verify-route.mjs
```

이 스크립트는 레벨 데이터와 게임 규칙(`world.js`)을 그대로 읽어 모든 (방, 입장 문, 보유 도구) 상태를 탐색하고,
최소 이동 횟수가 31인지와 갇혀서 빠져나올 수 없는 위치가 없는지를 확인합니다.

### 🃏 원카드
컴퓨터 1~3명(난이도 쉬움/보통)과 겨루는 트럼프 카드 원카드. 브라우저 안에서 규칙 기반 AI가 판단합니다.

- 같은 무늬나 숫자를 내고, 낼 카드가 없으면 덱에서 1장 뽑기. 조커는 언제나 낼 수 있음
- 공격: A +3 (♠A +5) · 2 +2 · 흑백 조커 +5 · 컬러 조커 +7 — 공격 카드로 막으면 누적
- J 건너뛰기 · Q 방향 전환 · K 한 장 더 · 7 무늬 바꾸기
- 1장 남으면 3초 안에 **원카드!** — 상대가 1장일 때 먼저 누르면 상대 +1장
- 손패 20장이면 파산

```
node games/one-card/tools/simulate.mjs 5000   # AI끼리 대전: 카드 보존·규칙 위반·교착 검사
```

### 🎋 윷놀이
컴퓨터 1~3명(난이도 쉬움/보통)과 겨루는 윷놀이. 말 4개를 먼저 모두 완주시키면 승리.

- 도 1 · 개 2 · 걸 3 · 윷 4 · 모 5 · 빽도 -1 (표시된 가락 하나만 배가 나올 때)
- 윷·모 또는 잡기 → 한 번 더. 나온 결과는 원하는 순서로 말에 나눠 쓰기
- 모서리(모·뒷모)·방에 멈추면 지름길, 내 말 위로 가면 업기, 상대 말 위로 가면 잡기
- 참먹이(출발점)에 도착하거나 지나가면 완주

```
node games/yut/tools/simulate.mjs 5000   # AI끼리 대전: 말 보존·칸 충돌·교착 검사
```

### 🌍 세계 일주 마블
부루마블 방식의 보드게임. 컴퓨터 1~3명과 정해진 라운드(10/20/30) 동안 겨루고, 끝나면 **총자산(현금 + 땅값 + 건물값)** 순으로 순위를 매깁니다.

- 시작 자금 300만, 출발지 통과 월급 20만
- 빈 도시·관광지는 구매, 내 도시에 다시 멈추면 별장 → 빌딩 → 호텔 건설
- 남의 땅은 통행료 (같은 색 도시 독점 시 1.5배). 돈이 모자라면 싼 땅부터 반값 매각, 그래도 모자라면 파산
- 더블 한 번 더(3연속 무인도) · 무인도 3턴 또는 더블 탈출 · 황금열쇠 16종 · 사회복지기금 납부/수령 · 우주여행

```
node games/world-marble/tools/simulate.mjs 3000   # AI끼리 대전: 현금·소유권·라운드 제한·순위 검사
```

### 🗡️ DUNGEON DIVE
사이드뷰 로그라이크 플랫포머. 매번 무작위로 만들어지는 던전 10층을 내려가며, 죽으면 처음부터(영구 사망). 층을 깰 때마다 무작위 강화 3개 중 하나를 고릅니다. 5층·10층은 보스.

- 조작: 십자키 ◀ ▶ 이동 · A 점프(길게 누르면 높이) · B 칼 공격 · ▼+A 발판 내려가기 · 적 밟기
- 적: 슬라임(순찰) · 박쥐(추적 비행) · 궁수(화살) · 골렘 보스(점프 후 충격파)
- 강화 10종: 체력·회복·공격력·사거리·다단 점프·속도·흡혈·가시 장화·투척 단검·자석
- 층은 방 조각 템플릿을 무작위로 이어(좌우 반전 포함) 만들고, 시작→출구 도달 검사를 통과해야 사용

```
node games/dungeon-dive/tools/verify-levels.mjs 500   # 조각 단독 통과 + 5000개 층 도달 가능성 검사
```

## 구조

```
index.html, title.js     타이틀 화면 (게임 선택)
games.js                 게임 목록 레지스트리
common/share.js          데스크톱용 QR 패널 (공용 리프)
games/
├─ hop-road/             index.html + src/ (main → game → world/player, renderer, input / config)
└─ star-keeper/
   ├─ index.html
   ├─ src/main.js        루트: 캔버스·레이아웃·HUD·조작키 토글
   │  ├─ game.js         규칙: 방 이동·도구·블록 파괴·위험 지형·제단
   │  │  ├─ player.js    물리: 달리기·다단 점프·대시·충돌 (충돌 대상은 주입)
   │  │  └─ world.js     방 파싱·타일 규칙 (게임과 검증 도구의 공통 규칙)
   │  ├─ renderer.js     캔버스 그리기
   │  └─ input.js        키보드 + 화면 십자키/A·B
   │  (rooms.js 레벨 데이터, config.js 물리 상수 — 아무것도 import 하지 않는 리프)
   └─ tools/verify-route.mjs   31회 최소 경로 검증
├─ one-card/
   ├─ index.html
   ├─ src/main.js        루트: 화면·사람 입력·컴퓨터 차례·원카드 타이머
   │  ├─ game.js         진행 상태 (UI 없이 동작)
   │  ├─ ai.js           컴퓨터 판단
   │  └─ (rules.js 규칙 → cards.js 카드 정의 리프)
   └─ tools/simulate.mjs       대량 대전 검증
├─ yut/
   ├─ index.html
   ├─ src/main.js        루트: 윷판(SVG)·사람 입력·컴퓨터 차례
   │  ├─ game.js         진행 상태 (UI 없이 동작)
   │  ├─ ai.js           컴퓨터 판단
   │  └─ (board.js 윷판·이동, yut.js 윷가락 — 리프)
   └─ tools/simulate.mjs       대량 대전 검증
├─ world-marble/
   ├─ index.html
   ├─ src/main.js        루트: 보드·사람 입력·컴퓨터 차례·이동 애니메이션
   │  ├─ game.js         진행 상태 (UI 없이 동작)
   │  ├─ ai.js           컴퓨터 판단
   │  └─ (board.js 칸·금액 규칙, cards.js 황금열쇠 — 리프)
   └─ tools/simulate.mjs       대량 대전 검증
└─ dungeon-dive/
   ├─ index.html
   ├─ src/main.js        루트: 화면 배치·루프·HUD·조작키·강화 선택/결과
   │  ├─ game.js         런 진행: 층·전투·줍기·강화·죽음/클리어
   │  │  ├─ player.js    플레이어 물리·공격 ─┐
   │  │  ├─ entities.js  적·투사체 ─────────┼─ physics.js 타일 충돌
   │  │  ├─ level.js     층 생성·도달 검사 ←─┘  (chunks.js 조각 템플릿)
   │  │  └─ upgrades.js  강화 목록 (리프)
   │  ├─ renderer.js     캔버스 그리기
   │  └─ input.js        키보드 + 화면 십자키/A·B
   │  (config.js 상수, rng.js 시드 난수 — 리프)
   └─ tools/verify-levels.mjs  층 도달 가능성 검증
```

각 게임은 자기 폴더 안에서만 import 하며, 공용으로는 `common/` 리프 모듈만 참조합니다 (순환 참조 없음).

### 새 게임 추가하기

1. `games/<id>/index.html` 로 게임을 만들고, 타이틀로 돌아가는 링크는 `../../` 로 둡니다.
2. `games.js` 의 `GAMES` 배열에 `{ id, title, desc, icon, color, tags }` 를 한 줄 추가합니다.

## 로컬 실행

```
python3 -m http.server 8000
# http://localhost:8000
```
