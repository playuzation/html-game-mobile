// 게임 목록 레지스트리. 새 게임은 games/<id>/ 폴더를 만들고 여기에 한 줄 추가하면 타이틀에 나타난다.
export const GAMES = [
  {
    id: 'hop-road',
    title: 'HOP ROAD',
    desc: '차를 피하고 통나무를 타며 최대한 멀리 건너가는 아케이드',
    icon: '🐔',
    color: '#8fd765',
    tags: ['아케이드', '탭 · 스와이프'],
  },
  {
    id: 'star-keeper',
    title: '별지기 루미',
    desc: '7개의 방을 오가며 도구를 모아 능력을 얻는 사이드뷰 메트로배니아',
    icon: '⭐',
    color: '#7c6cf0',
    tags: ['메트로배니아', '십자키 · A/B'],
  },
];
