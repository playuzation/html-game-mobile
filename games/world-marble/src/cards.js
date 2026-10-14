// 황금열쇠 카드 (아무것도 import 하지 않는 리프 모듈)
// kind: money(+/-), fund(기금에 납부), move(칸 이동), back(뒤로), repair(건물 수리비), birthday, tax(현금의 %)

export const CARDS = [
  { kind: 'money', amount: 20, text: '복권 당첨! 20만 원을 받습니다.' },
  { kind: 'money', amount: 10, text: '장학금 10만 원을 받습니다.' },
  { kind: 'money', amount: 30, text: '노벨 평화상 수상! 상금 30만 원.' },
  { kind: 'money', amount: 15, text: '주식 배당금 15만 원을 받습니다.' },
  { kind: 'fund', amount: 5, text: '과속 벌금 5만 원을 기금에 냅니다.' },
  { kind: 'fund', amount: 10, text: '병원비 10만 원을 기금에 냅니다.' },
  { kind: 'fund', amount: 15, text: '해외 유학비 15만 원을 기금에 냅니다.' },
  { kind: 'move', to: 0, text: '출발지로 이동해 월급을 받습니다.' },
  { kind: 'move', to: 8, noSalary: true, text: '무인도에 표류! 무인도로 갑니다.' },
  { kind: 'move', to: 24, text: '우주여행 초대권! 우주여행 칸으로 이동합니다.' },
  { kind: 'move', to: 31, text: '서울 올림픽 관람! 서울로 이동합니다.' },
  { kind: 'move', to: 16, text: '복지기금 수령 칸으로 이동합니다.' },
  { kind: 'back', steps: 3, text: '길을 잃었다! 뒤로 3칸 이동.' },
  { kind: 'repair', amount: 3, text: '건물 수리비: 건물 1단계당 3만 원을 냅니다.' },
  { kind: 'birthday', amount: 5, text: '생일 축하! 모든 플레이어에게 5만 원씩 받습니다.' },
  { kind: 'tax', rate: 0.1, text: '종합소득세: 현금의 10%를 기금에 냅니다.' },
];
