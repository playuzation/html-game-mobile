// 데스크톱에서 접속 시: 현재 주소의 QR 코드를 보여줘 휴대폰으로 바로 열 수 있게 함
export function setupShare(panel, img, link) {
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  if (isTouch) return;
  const url = location.href;
  img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + encodeURIComponent(url);
  link.textContent = url;
  link.href = url;
  panel.hidden = false;
}
