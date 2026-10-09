# HOP ROAD 🐔

모바일에서 가볍게 즐기는 '길건너 친구들' 스타일 HTML5 게임. 빌드 도구 없이 순수 HTML + JS(ES Modules)로 동작합니다.

## 📱 모바일로 확인하기

`push` 할 때마다 GitHub Actions가 GitHub Pages로 자동 배포합니다.

**플레이 주소:** https://playuzation.github.io/html-game-mobile/

<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https%3A%2F%2Fplayuzation.github.io%2Fhtml-game-mobile%2F" alt="QR" width="200">

휴대폰 카메라로 위 QR을 스캔하면 바로 실행됩니다. PC 브라우저로 접속해도 화면 우측 하단에 QR 패널이 떠서 휴대폰으로 넘겨볼 수 있습니다.

배포 상태: [Actions 탭](https://github.com/playuzation/html-game-mobile/actions/workflows/pages.yml)

> 최초 1회 배포가 실패하면 **Settings → Pages → Build and deployment → Source** 를 `GitHub Actions` 로 지정한 뒤 워크플로를 다시 실행하세요.
> 기본 브랜치가 아닌 브랜치에서의 배포는 `github-pages` 환경 보호 규칙에 막힐 수 있습니다 (Settings → Environments → github-pages 에서 허용 브랜치 추가).

## 조작법

| 입력 | 동작 |
| --- | --- |
| 탭 / ↑ / W / Space | 앞으로 |
| 스와이프 ←→↓ / 방향키 / WASD | 좌·우·뒤 |

차에 치이거나, 물에 빠지거나, 너무 오래 머물러 화면 아래로 밀려나면 게임 오버입니다.

## 구조

```
index.html          화면/HUD/오버레이
src/main.js         루트: 캔버스·루프·UI 연결
├─ game.js          규칙: 이동·충돌·카메라·점수
│  ├─ world.js      레인 생성, 차/통나무 이동
│  └─ player.js     플레이어 점프 상태
├─ renderer.js      캔버스 그리기
├─ input.js         탭/스와이프/키보드
└─ share.js         데스크톱용 QR 패널
config.js           공용 상수 (리프, 아무것도 import 하지 않음)
```

## 로컬 실행

```
python3 -m http.server 8000
# http://localhost:8000
```
