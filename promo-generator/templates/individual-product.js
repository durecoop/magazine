/**
 * 개별 품목 홍보 페이지 템플릿 (tomato_promo.html 기반)
 * 다크 테마 (#0a0a0a), 스크롤 스토리텔링
 * (2차 구현 대상 — 기본 스켈레톤)
 */

function render(data) {
  return `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8">
<title>${data.meta.title || '두레생협 품목 소개'}</title>
<style>body{background:#0a0a0a;color:#f0ece4;font-family:sans-serif;text-align:center;padding:80px 20px;word-break:keep-all;}
h1{font-size:32px;margin-bottom:16px;}p{color:#999;}</style>
</head><body>
<h1>개별 품목 템플릿</h1>
<p>2차 구현 예정입니다.</p>
</body></html>`;
}

module.exports = { render };
