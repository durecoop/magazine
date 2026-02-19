# 두레생협 매거진 프로젝트 프롬프트

## 프로젝트 개요
두레생협 주간 홍보 매거진 및 카드뉴스 제작 프로젝트

**프로젝트 경로:** `D:\project\magazine`

---

## 핵심 정보

### 상품 이미지 URL 패턴
```
https://dureimg.ecoop.or.kr:9091/Delsys/DLOG/Goods/GoodsMaster/GoodsImage/{상품코드}C.jpg
```
- 상품코드는 숫자 (예: 57305, 20708)
- 이미지 존재 여부는 HTTP HEAD 요청으로 확인 (200=OK, 404=없음)

### 주요 링크
- **쇼핑몰:** https://ecoop.or.kr/DureShop/recommend.do
- **상담실 전화:** tel:1661-5110

### 가격 정보 소스
- 엑셀 파일: `D:\2026년_{주차}주.xlsx`
- 컬럼 구조: 대분류(0), 중분류(1), 상품코드(2), 상품명(3), 판매가(4), 기획가격(5), 할인율(6)...

---

## 디자인 패턴

### 카드뉴스 (scroll-snap)
```html
<div class="card-container" style="scroll-snap-type: y mandatory;">
    <div class="card" style="scroll-snap-align: start;">
        <!-- 카드 내용 -->
    </div>
</div>
```

### 반응형 폰트
```css
font-size: clamp(14px, 4vw, 18px);
```

### 고정 헤더 + 프로모션 바
- 헤더 높이: 60px
- 프로모 바: 40px
- 콘텐츠 padding-top: 100px

### 인디케이터 (우측 점)
```html
<div class="indicator">
    <div class="dot active"></div>
    <div class="dot"></div>
    ...
</div>
```

---

## 주요 파일 구조

```
D:\project\magazine\
└── 2026\
    ├── W07\                          # 7주차 (설 명절)
    │   ├── saturday-delivery-thu.html   # 목요일 토요배송 안내
    │   ├── saturday-delivery-fri.html   # 금요일 토요배송 마감
    │   ├── saturday-delivery-phone.html # 전화주문 전용
    │   ├── gift-set.html               # 선물세트
    │   └── ...
    │
    └── W08\                          # 8주차 (명절 후)
        ├── killer-items-card.html      # 킬러아이템 카드뉴스
        ├── post-holiday-card.html      # 명절후유증 카드뉴스
        ├── saturday-delivery-thu.html  # 목요일 버전
        ├── saturday-delivery-fri.html  # 금요일 버전
        └── LOGO.png
```

---

## 자주 사용하는 작업

### 1. 이미지 코드 확인 (Python)
```python
import urllib.request
import ssl
ssl._create_default_https_context = ssl._create_unverified_context

def check_image(code):
    url = f'https://dureimg.ecoop.or.kr:9091/Delsys/DLOG/Goods/GoodsMaster/GoodsImage/{code}C.jpg'
    try:
        req = urllib.request.Request(url, method='HEAD')
        resp = urllib.request.urlopen(req, timeout=5)
        return 200
    except urllib.error.HTTPError as e:
        return e.code
    except:
        return 0
```

### 2. 엑셀에서 상품 정보 읽기
```python
import pandas as pd
df = pd.read_excel('D:/2026년_8주.xlsx', header=1)
# 컬럼: iloc[:,2]=상품코드, iloc[:,3]=상품명, iloc[:,4]=판매가, iloc[:,5]=기획가격
```

### 3. 전화주문 링크 변환
```html
<!-- 기존 쇼핑몰 링크 -->
<a href="https://ecoop.or.kr/DureShop/recommend.do">

<!-- 전화주문으로 변경 -->
<a href="tel:1661-5110">
```

---

## 서브에이전트 활용

### Explore 에이전트
코드베이스 탐색, 파일 검색에 사용
```
Task tool: subagent_type="Explore"
- 파일 패턴 검색: "src/**/*.html"
- 코드 키워드 검색
- 구조 파악
```

### Bash 에이전트
터미널 명령 실행
```
Task tool: subagent_type="Bash"
- git 작업
- 파일 복사/이동
- Python 스크립트 실행
```

### Plan 에이전트
구현 계획 설계
```
Task tool: subagent_type="Plan"
- 복잡한 기능 구현 전 계획 수립
- 파일 구조 설계
```

---

## 작업 이력 (W08 기준)

### 완료된 수정사항
1. **프로바이오틱스 → 비타민1000 교체**
   - 기존 41515/41516 코드 이미지 오류
   - 57676C.jpg (비타민1000, 14,500원) 사용

2. **식혜 → 순수감귤쥬스 교체**
   - 기존 40137 코드 이미지 404
   - 42633C.jpg (순수감귤쥬스, 3,900원) 사용

3. **황태포 가격 수정**
   - 1380C.jpg, 7,200원 (할인 없음)

4. **정상 작동 상품 코드**
   - 57305: 6년근 홍삼캔디 (6,700원)
   - 58927: 영광법성포굴비 (101,700원)
   - 20708: 발아참기름 (31,500원)
   - 20710: 발아들기름 (26,000원)
   - 21166: 원삼유정란 (5,800원)

---

## 토요배송 안내 문구

### 목요일 버전 (D-1)
- "내일 오전 11시 30분 마감"
- "1일 남았습니다"

### 금요일 버전 (당일)
- "오늘 오전 11시 30분 마감"
- "금일 마감입니다"

### 전화주문 버전
- 모든 링크 → `tel:1661-5110`
- "전화주문만 가능합니다"
- "쇼핑몰 주문 불가"

---

## 문자 홍보 템플릿

### 목요일
```
[두레생협] 토요배송 안내
📦 내일(금) 오전 11시 30분 마감!
☎ 전화주문: 1661-5110
🚚 토요일 배송
```

### 금요일
```
[두레생협] 토요배송 마감 임박!
⏰ 오늘 오전 11시 30분 마감
☎ 전화주문: 1661-5110
```

---

## GitHub Pages 배포

**URL 패턴:** `https://durecoop.github.io/magazine/2026/W{주차}/{파일명}.html`

예시:
- https://durecoop.github.io/magazine/2026/W08/killer-items-card.html
- https://durecoop.github.io/magazine/2026/W08/post-holiday-card.html

---

## 이미지 생성 (Google Gemini)

### API Key
```
AIzaSyBhdT81iYdBY9QO6I-NcvjVopKKEUI-L1U
```

### 사용 예시 (Python)
```python
import google.generativeai as genai
from PIL import Image
import io

genai.configure(api_key="AIzaSyBhdT81iYdBY9QO6I-NcvjVopKKEUI-L1U")

# 이미지 생성
model = genai.ImageGenerationModel("imagen-3.0-generate-002")
result = model.generate_images(
    prompt="친환경 유기농 채소 바구니, 따뜻한 조명, 생협 스타일",
    number_of_images=1
)

# 저장
for i, image in enumerate(result.images):
    image._pil_image.save(f"generated_{i}.png")
```

### 활용 용도
- 매거진 배경 이미지
- 카드뉴스 일러스트
- 시즌별 프로모션 이미지
- 상품 카테고리 아이콘

---

## 웹 디자인 스킬

### 색상 팔레트
각 카드뉴스는 테마에 따라 고유 색상 계열을 사용한다.

| 테마 | Primary | Dark | 용도 예시 |
|------|---------|------|----------|
| 건강/저당 | `#1abc9c` | `#0e8c73` | 건강식품, 유기농 |
| 장보기/실용 | `#e67e22` | `#d35400` | 식재료, 장보기 |
| 명절/할인 | `#c0392b` | `#922b21` | 명절기획, 킬러아이템 |
| 힐링/케어 | `#667eea` | `#764ba2` | 명절후유증, 자기돌봄 |
| **공통 CTA** | `#2d5a3d` | `#1e4a2d` | 마지막 카드 (두레 브랜드 그린) |
| **공통 강조** | `#f39c12` | `#e67e22` | 배송료 무료, 쿠폰, 절약금액 |
| **할인율 뱃지** | `#e74c3c` | — | 10%↓, 30%↓ 등 |

### 타이포그래피
```css
/* 제목/감성 카피 */
font-family: 'Noto Serif KR', serif;   /* 세리프: 감성, 신뢰 */
font-weight: 600~700;

/* 본문/설명 */
font-family: 'Noto Sans KR', sans-serif; /* 산세리프: 가독성 */
font-weight: 300~500;

/* 반응형 폰트 크기 규칙 */
h1 (히어로):      clamp(36px, 12vw, 52px)
h2 (섹션 제목):    clamp(20px, 6vw, 26px)
본문:             clamp(15px, 4.5vw, 18px)
캡션/설명:        clamp(13px, 4vw, 15px)
레이블:           11~12px, letter-spacing: 3~4px
```

### 카드뉴스 9장 구성 공식
```
카드 1: 히어로      — 메인 카피 + 배경 장식 + 쿠폰/배송 뱃지
카드 2: 인트로      — 왜 이 상품인지 설명 (공감 유도)
카드 3: 감성 인용    — 큰따옴표 + 인용문 (감성 설득)
카드 4: 주력 상품 1  — 대형 카드 or 리스트 (임팩트 상품)
카드 5: 주력 상품 2  — 2x1 그리드 or 리스트 (카테고리별)
카드 6: 주력 상품 3  — 대형 카드 (할인율 큰 상품 강조)
카드 7: 보조 상품    — 2x2 그리드 (간편식/반찬 등)
카드 8: 추가 상품    — 2x2 그리드 ("이것도 담아보세요")
카드 9: CTA         — 행동 유도 버튼 + 쿠폰/배송 정보
```

### 배경 장식 패턴 (CSS + SVG)
```css
/* 히어로 카드: 3단 레이어 */
.card-1 { overflow: hidden }
.card-1 > * { position: relative; z-index: 1 }         /* 텍스트 위로 */
.card-1::before { /* 반복 SVG 패턴 (원형, 잎사귀) */ }
.card-1::after  { /* 보케 글로우 (radial-gradient) */ }
<svg class="hero-deco"> /* 테마별 일러스트 (잎, 밥그릇 등) */

/* 인트로 카드: 코너 장식 */
.card-2::before { /* 우상단 보태니컬/곡물 SVG */ }

/* 인용 카드: 글로우 효과 */
.card-3::after  { /* 우하단 소프트 글로우 */ }

/* CTA 카드: 라이트 효과 */
.card-cta::before { /* 상단 라디얼 라이트 */ }
```

### 상품 카드 레이아웃 유형

**대형 카드 (product-big)** — 할인율 크거나 주력 상품
```
┌─────────────────────┐
│   [상품 이미지 4:3]   │
│                     │
│  상품명              │
│  설명 텍스트          │
│  ̶원̶가̶  할인가         │
│  [절약금액 뱃지]      │
└─────────────────────┘
```

**리스트형 (meat-list, fish-grid)** — 같은 카테고리 3~4개
```
┌──────┬──────────────┐
│ [img] │ 상품명        │
│ 70px  │ 설명          │
│       │ 가격          │
└──────┴──────────────┘
```

**2x2 그리드 (side-grid, more-grid)** — 보조/추가 상품
```
┌──────┬──────┐
│ [img] │ [img] │
│ 이름  │ 이름  │
│ 가격  │ 가격  │
├──────┼──────┤
│ [img] │ [img] │
│ 이름  │ 이름  │
│ 가격  │ 가격  │
└──────┴──────┘
```

### 설득 디자인 원칙
1. **사회적 증거**: "가장 많이 예약했어요", "조합원님들이 가장 많이 찾는"
2. **손실 회피**: "쿠폰 마감 임박!", "이번 주까지만"
3. **구체적 절약**: "34,300원 더 아껴요" (금액 명시)
4. **감성 공감**: "명절 보내느라 고생하셨죠", "속도 편하게"
5. **간편함 강조**: "전자레인지 2분이면 끝", "데우기만 하면"
6. **시각적 대비**: 원가 취소선 + 할인가 크고 빨갛게

### OG 메타 태그 (카카오톡 미리보기)
```html
<meta property="og:title" content="두레생협 | {테마 한줄}">
<meta property="og:description" content="{핵심 상품 + 혜택} 🎟️/🚚">
<meta property="og:image" content="{대표 상품 이미지 URL}">
<meta property="og:url" content="https://durecoop.github.io/magazine/2026/W{주차}/{파일명}.html">
<meta property="og:type" content="website">
<meta property="og:site_name" content="두레생협 생활의 발견">
```

### CSS 애니메이션
```css
/* CTA 버튼 맥박 효과 */
@keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.03)} }

/* 스크롤 힌트 바운스 */
@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
```

### 체크리스트 (새 카드뉴스 제작 시)
- [ ] W{주차} 폴더 생성 + LOGO.png 복사
- [ ] 기획전/엑셀에서 상품 선정 (8~16개)
- [ ] 모든 상품 이미지 코드 HTTP 200 확인
- [ ] 테마별 색상 팔레트 선택
- [ ] 9장 카드 구성 (히어로→인트로→인용→상품4장→추가→CTA)
- [ ] 배경 장식 SVG + CSS 추가
- [ ] OG 메타 태그 작성
- [ ] 모든 상품 링크 → 기획전 URL 연결
- [ ] 주차 번호, 쿠폰/배송 정보 반영
- [ ] GitHub Pages 배포 후 링크 확인

---

## 다음 작업 시 참고

1. 새 주차 작업 시 `2026/W{주차}/` 폴더 생성
2. 엑셀 파일에서 기획가격 확인 후 상품 선정
3. 이미지 코드 HTTP 상태 확인 필수
4. LOGO.png 파일 복사 필요
5. 필요시 Gemini API로 이미지 생성 가능
