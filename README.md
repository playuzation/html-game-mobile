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
