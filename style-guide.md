# 두레생협 생활의 발견 - 카드뉴스 스타일 가이드

## 디자인 원칙

1. **단일 톤** - 색을 많이 쓰지 않고, 브라운/베이지 계열로 통일
2. **고급스러움** - 미니멀하고 품격있는 느낌
3. **감성적** - 생협 가치를 담은 스토리텔링
4. **여백** - 충분한 여백으로 읽기 편하게

---

## 컬러 팔레트

```css
:root {
    --brown-dark: #4a3f35;    /* 메인 텍스트, 헤더 배경, 버튼 */
    --brown: #6b5d52;         /* 본문 텍스트 */
    --brown-light: #8b7d72;   /* 보조 텍스트, 라벨 */
    --beige: #c4b5a5;         /* 강조 라인, 아이콘 */
    --beige-light: #e8e0d5;   /* 배경 (이벤트 섹션) */
    --cream: #f7f4f0;         /* 배경 (스토리 섹션) */
    --white: #fdfcfa;         /* 메인 배경 */
}
```

---

## 타이포그래피

- **폰트**: Gowun Batang (단일 폰트)
- **행간**: 1.9 (넉넉하게)
- **자간**: -0.01em

```html
<link href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&display=swap" rel="stylesheet">
```

### 폰트 크기
| 요소 | 크기 |
|------|------|
| 히어로 제목 | 32px, 700 |
| 섹션 제목 | 22-24px, 700 |
| 본문 | 15-17px, 400 |
| 라벨 | 12-13px, letter-spacing: 2-3px |
| 가격 | 26px, 700 |

---

## 글쓰기 스타일

### 톤앤매너
- 담담하고 진솔한 어투
- 감성적이지만 과하지 않게
- 생산자와 조합원의 연결 강조
- 짧은 문장, 줄바꿈 활용

### 예시 문구

**히어로 (도입부)**
```
예측보다 수요가 적었습니다.
하지만 농산물은 이미 수확되었고,
생산자의 마음은 조합원을 향해 있습니다.
```

**생산자 스토리**
```
"왁스 한 번 바르지 않았습니다.
조합원 가족이 드실 거니까요.
제 가족에게 먹이듯 키웠습니다."
```

**상품 설명**
```
제주 바람을 맞고 자란 양배추입니다.
장기하 닮은 생산자가 정성껏 키웠습니다.
아삭한 식감, 단맛이 일품입니다.
```

**CTA (마무리)**
```
조합원의 선택이
생산자의 내일이 됩니다.
```

---

## 레이아웃 구조

### 슬라이드 순서
1. 히어로 (프로젝트 소개)
2. 생산자 스토리 (원형 사진 + 인용문)
3. 상품 카드들 (각 1슬라이드)
4. 이벤트 (증정 행사)
5. CTA (마무리 + 주문 버튼)
6. 푸터

### 슬라이드 CSS
```css
.slide {
    min-height: calc(100vh - 56px);
    scroll-snap-align: start;
    scroll-snap-stop: always;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 40px 30px;
}
```

---

## 상품 카드 구조

```html
<section class="product slide">
    <a href="[주문링크]" class="product-link">
        <img src="[이미지URL]" alt="[상품명]" class="product-img">
        <p class="product-label">[라벨 · 인증]</p>
        <h3 class="product-name">[상품명]</h3>
        <p class="product-desc">
            [감성적인 상품 설명 3줄]
        </p>
        <p class="product-meta">[평점 · 추천율]</p>
        <div class="product-price">
            <div>
                <span class="price-original">[원가]</span>
                <span class="price-sale">[할인가]</span>
            </div>
            <span class="price-discount">[할인율]</span>
        </div>
    </a>
</section>
```

---

## 피해야 할 것

- 화려한 색상 뱃지
- 과도한 이모지
- 여러 폰트 혼용
- "최저가", "파격 할인" 등 자극적 표현
- 너무 긴 문장

---

## 홍보 문구 작성법

70자 이내, 감성적 톤 유지

**좋은 예시:**
> 제주에서 조합원을 믿고 보낸 농산물, 함께 나눠주세요. 최대 25% 할인, 한정 수량.

> 수확은 했는데 수요가 적었습니다. 제주 생산자를 응원해주세요.

---

## 템플릿 파일

기본 템플릿: `2026/W07/jeju.html` 참조
