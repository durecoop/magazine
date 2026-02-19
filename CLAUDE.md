# 두레생협 매거진 프로젝트

상세 가이드는 `CLAUDE-PROMPT.md` 참조.

## 빠른 참고

- **이미지 URL**: `https://dureimg.ecoop.or.kr:9091/Delsys/DLOG/Goods/GoodsMaster/GoodsImage/{코드}C.jpg`
- **쇼핑몰**: https://ecoop.or.kr/DureShop/recommend.do
- **배포**: https://durecoop.github.io/magazine/2026/W{주차}/{파일명}.html
- **전화주문**: tel:1661-5110

## 카드뉴스 제작 워크플로우

1. 기획전 URL 또는 엑셀에서 상품 정보 수집
2. 이미지 코드 HTTP 상태 확인 (curl/python)
3. 9장 카드 구성: 히어로→인트로→인용→상품4장→추가→CTA
4. 테마별 색상 선택, 배경 장식 SVG 추가, OG 태그 작성
5. LOGO.png 복사, git push, Pages 링크 확인

## 디자인 규칙

- 폰트: 제목 `Noto Serif KR`, 본문 `Noto Sans KR`
- 반응형: `clamp()` 사용, 모바일 우선
- CTA 색상: 항상 `#2d5a3d` (두레 브랜드 그린)
- 강조 색상: `#f39c12` (쿠폰/배송), `#e74c3c` (할인율)
- 배경 장식: CSS pseudo-elements + inline SVG
