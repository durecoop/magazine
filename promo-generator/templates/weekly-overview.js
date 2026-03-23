/**
 * 주간 홍보 페이지 — 백화점 전단 스타일
 */

function render(data) {
  const { meta, categories } = data;
  const planUrl = meta.planUrl || '#';
  const fontConfig = getFontConfig(meta.fontFamily);

  const pages = [];

  // 표지
  pages.push(renderCover(meta));

  // 프로모션 (텍스트 + 이미지 한 페이지)
  if (meta.promoTitle || meta.promoDesc || (meta.promoImages && meta.promoImages.length > 0)) {
    pages.push(renderPromo(meta));
  }

  // 카테고리 표지 + 상품 1개씩
  for (const cat of categories) {
    // 카테고리 표지 페이지
    pages.push(`
      <div class="pg cat-cover">
        <div class="orn"></div>
        <div class="cat-title">${esc(cat.name)}</div>
        ${cat.subtitle ? `<div class="cat-subtitle">${esc(cat.subtitle)}</div>` : ''}
      </div>`);

    for (const p of cat.products) {
      pages.push(`
        <div class="pg">
          <div class="item">
            <img src="${esc(p.imageUrl)}" alt="${esc(p.name)}">
            <div class="info">
              <div class="text-area">
                <div class="name">${esc(p.name)}</div>
                ${p.description ? `<div class="desc">${esc(p.description)}</div>` : ''}
                <div class="price-block">
                  ${p.origPrice ? `<span class="orig">${p.origPrice.toLocaleString()}원</span>` : ''}
                  <span class="price">${p.price ? p.price.toLocaleString() : ''}원</span>
                </div>
                ${p.discountRate ? `<span class="off">${p.discountRate}%</span>` : ''}
              </div>
              <a href="${esc(planUrl)}" class="buy">장보기</a>
            </div>
          </div>
        </div>`);
    }
  }

  // 마지막
  pages.push(`
    <div class="pg cta">
      <div class="cta-inner">
        <div class="orn"></div>
        <div class="cta-title">기획전 전체 보기</div>
        <a href="${esc(planUrl)}" class="buy cta-buy">기획전 바로가기 →</a>
        <div class="footer">두레생협 조합원 상담실 1661-5110</div>
      </div>
    </div>`);

  const pagesHtml = pages.map((h, i) =>
    `<div class="page${i === 0 ? ' current' : ''}" data-i="${i}"><div class="inner">${h}</div></div>`
  ).join('\n');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>${esc(meta.title || '두레생협 기획전')}</title>
<style>
${fontConfig.importUrl}
*{margin:0;padding:0;box-sizing:border-box}
html,body{
  width:100%;height:100%;overflow:hidden;
  position:fixed;top:0;left:0;
  touch-action:none;overscroll-behavior:none;
  font-family:${fontConfig.body};
  background:#bdb5a8;color:#1a1714;
  word-break:keep-all;-webkit-font-smoothing:antialiased;
}

.book{position:relative;width:100%;height:100%;overflow:hidden}
.page{
  position:absolute;top:0;left:0;width:100%;height:100%;
  background:#fcfaf6;overflow:hidden;
  transition:transform .5s cubic-bezier(.4,0,.2,1),opacity .5s;
}
.page.current{transform:translateX(0);opacity:1;z-index:2}
.page.prev{transform:translateX(-100%);opacity:0;z-index:1;pointer-events:none}
.page.next{transform:translateX(100%);opacity:0;z-index:0;pointer-events:none}

.inner{
  width:100%;height:100%;
  display:flex;align-items:center;justify-content:center;
  padding:32px 60px;
  transform-origin:center center;
}

/* === 표지 === */
.cover{text-align:center;max-width:460px}
.cover-label{font-size:10px;letter-spacing:5px;color:#b0a490;text-transform:uppercase;margin-bottom:32px;font-weight:400}
.orn{width:40px;height:1px;background:linear-gradient(90deg,transparent,#c0a070,transparent);margin:0 auto 32px}
.cover h1{
  font-family:${fontConfig.heading};
  font-size:32px;font-weight:600;line-height:1.5;
  margin-bottom:18px;color:#2a2420;
}
.cover h1 em{font-style:normal;color:#96704a}
.cover-sub{font-size:14px;color:#8a7e6e;line-height:2;margin-bottom:28px;font-weight:300}
.cover-coupon{
  display:inline-block;padding:10px 32px;
  border:1px solid #d0c0a8;color:#96704a;
  font-size:12px;font-weight:500;letter-spacing:1px;margin-bottom:16px;
}
.cover-period{font-size:10px;color:#b0a898;letter-spacing:1.5px;font-weight:300}
.cover-hint{margin-top:52px;font-size:10px;color:#c8c0b4;letter-spacing:3px;animation:pulse 3s infinite;font-weight:300}
@keyframes pulse{0%,100%{opacity:.2}50%{opacity:.7}}

/* === 프로모션 === */
.promo{text-align:center;max-width:440px}
.promo h2{font-family:${fontConfig.heading};font-size:22px;font-weight:600;margin-bottom:24px;line-height:1.5;color:#2a2420}
.promo-body{font-size:13px;color:#7a7060;line-height:2.2;margin-bottom:24px;font-weight:300}
.promo-notices{list-style:none;text-align:left;max-width:340px;margin:0 auto}
.promo-notices li{font-size:11px;color:#a09888;line-height:2.2;padding-left:14px;position:relative;font-weight:300}
.promo-notices li::before{content:'·';position:absolute;left:2px;color:#c0a070}

/* 프로모션 이미지 */
.promo-images{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-top:24px}
.promo-img{max-width:180px;max-height:160px;object-fit:contain;border-radius:2px}

/* === 카테고리 표지 === */
.cat-cover{text-align:center}
.cat-title{font-family:${fontConfig.heading};font-size:34px;font-weight:600;margin-bottom:16px;color:#2a2420}
.cat-subtitle{font-size:14px;color:#a09888;line-height:1.8;font-weight:300}

/* === 상품 카드 === */
.pg{display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;max-width:420px}

.item{
  display:flex;flex-direction:column;align-items:center;
  width:100%;text-align:center;
}
.item img{
  width:48vw;height:48vw;max-width:340px;max-height:340px;
  object-fit:cover;border-radius:2px;
  margin-bottom:24px;
  box-shadow:0 4px 24px rgba(40,30,20,0.08);
}
.item .info{
  display:flex;flex-direction:column;align-items:center;
  width:100%;
}
.item .info .text-area{width:100%}
.name{font-family:${fontConfig.heading};font-size:18px;font-weight:600;margin-bottom:8px;line-height:1.3;color:#2a2420}
.tagline{display:none}
.desc{font-size:12px;color:#96704a;line-height:1.8;margin-bottom:18px;font-weight:400}
.price-block{text-align:center;margin-bottom:6px}
.orig{font-size:14px;color:#b0a898;text-decoration:line-through;display:block;margin-bottom:4px;font-weight:300}
.price{font-size:24px;font-weight:700;color:#2a2420;display:block;letter-spacing:0.5px}
.off{
  font-size:15px;font-weight:600;color:#96704a;
  border:1px solid #c0a070;padding:4px 16px;
  display:inline-block;margin-top:10px;margin-bottom:20px;
  letter-spacing:0.5px;
}

.buy{
  display:block;width:100%;max-width:300px;
  text-align:center;padding:14px 0;
  background:#5c8a56;color:#fff;
  font-size:12px;font-weight:500;letter-spacing:2px;
  text-decoration:none;text-transform:uppercase;
  transition:all .2s;
  border-radius:2px;
  flex-shrink:0;
  margin-top:4px;
}
.buy:hover{background:#4a7a46}

/* === CTA === */
.cta .cta-inner{text-align:center}
.cta-title{font-family:${fontConfig.heading};font-size:22px;font-weight:600;margin-bottom:28px;color:#2a2420}
.cta-buy{max-width:300px;margin:0 auto;padding:15px 0;font-size:12px}
.footer{margin-top:48px;font-size:10px;color:#b0a898;letter-spacing:1px;font-weight:300}

/* === 네비 === */
.arr{
  position:fixed;top:50%;transform:translateY(-50%);z-index:50;
  width:36px;height:36px;
  background:rgba(252,250,246,.7);border:1px solid #e0d8cc;
  border-radius:50%;display:flex;align-items:center;justify-content:center;
  cursor:pointer;font-size:16px;color:#b0a490;transition:all .2s;
  backdrop-filter:blur(4px);
}
.arr:hover{color:#96704a;border-color:#96704a}
.arr.l{left:10px}.arr.r{right:10px}
.arr:disabled{opacity:.1;cursor:default}
.pn{position:fixed;bottom:16px;right:18px;z-index:50;font-size:9px;color:#c0b8a8;letter-spacing:2px;font-weight:300}

@media(max-width:640px){
  .inner{padding:24px 20px}
  .pg{max-width:100%}
  .cover h1{font-size:24px}
  .cover-sub{font-size:12px}
  .cat-title{font-size:26px}
  .item img{width:56vw;height:56vw;max-width:260px;max-height:260px}
  .name{font-size:16px}
  .desc{font-size:11px}
  .orig{font-size:12px}
  .price{font-size:20px}
  .off{font-size:13px;padding:3px 12px}
  .buy{max-width:240px;padding:12px 0;font-size:11px}
  .promo h2{font-size:18px}
  .promo-body{font-size:13px}
  .cta-title{font-size:18px}
  .cta-buy{max-width:100%}
  .arr{width:28px;height:28px;font-size:14px}
  .arr.l{left:4px}.arr.r{right:4px}
}
@media(min-width:900px){
  .cover h1{font-size:42px}
  .item img{max-width:340px}
}
${fontScaleCSS(meta.baseFontSize)}
</style>
</head>
<body>
<div class="book">${pagesHtml}</div>
<button class="arr l" id="pv" onclick="go(-1)">&#8249;</button>
<button class="arr r" id="nx" onclick="go(1)">&#8250;</button>
<div class="pn" id="pn">1 / ${pages.length}</div>
<script>
const P=document.querySelectorAll('.page'),T=P.length;let C=0;
function show(n){if(n<0||n>=T)return;C=n;P.forEach((p,i)=>{p.className='page';p.classList.add(i===C?'current':i<C?'prev':'next')});document.getElementById('pn').textContent=(C+1)+' / '+T;document.getElementById('pv').disabled=C===0;document.getElementById('nx').disabled=C===T-1}
function go(d){show(C+d)}
document.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key===' '){e.preventDefault();go(1)}if(e.key==='ArrowLeft'){e.preventDefault();go(-1)}});
let sx=0;document.addEventListener('touchstart',e=>{sx=e.touches[0].clientX},{passive:true});document.addEventListener('touchend',e=>{const d=e.changedTouches[0].clientX-sx;if(Math.abs(d)>40)go(d<0?1:-1)});document.addEventListener('touchmove',e=>{e.preventDefault()},{passive:false});
let wl=false;document.addEventListener('wheel',e=>{e.preventDefault();if(wl)return;const d=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;if(Math.abs(d)>15){go(d>0?1:-1);wl=true;setTimeout(()=>wl=false,400)}},{passive:false});
function fit(){const vh=window.innerHeight,vw=window.innerWidth;document.querySelectorAll('.inner').forEach(el=>{el.style.transform='';el.style.width='100%';const s=Math.min(vh/el.scrollHeight,vw/el.scrollWidth,1);if(s<.98){el.style.transform='scale('+s.toFixed(3)+')';el.style.width=(100/s).toFixed(1)+'%'}})}
window.addEventListener('resize',fit);fit();show(0);
</script>
</body>
</html>`;
}

function renderCover(meta) {
  return `<div class="cover">
    <div class="cover-label">${esc(meta.weekNumber ? meta.weekNumber + '주 기획전' : 'WEEKLY PLAN')}</div>
    <div class="orn"></div>
    <h1>${meta.heroTitle || esc(meta.title || '두레생협 기획전')}</h1>
    <div class="cover-sub">${meta.heroSub || ''}</div>
    ${meta.couponText ? `<div class="cover-coupon">🎟️ ${esc(meta.couponText)}</div>` : ''}
    ${meta.period ? `<div class="cover-period">${esc(meta.period)}</div>` : ''}
    <div class="cover-hint">← 넘겨서 보기 →</div>
  </div>`;
}

function renderPromo(meta) {
  const notices = (meta.promoNotices || '').split('\n').filter(l => l.trim());
  const images = meta.promoImages || [];
  return `<div class="promo">
    <div class="orn"></div>
    ${meta.promoTitle ? `<h2>${esc(meta.promoTitle)}</h2>` : ''}
    ${meta.promoDesc ? `<div class="promo-body">${esc(meta.promoDesc).replace(/\n/g, '<br>')}</div>` : ''}
    ${notices.length ? `<ul class="promo-notices">${notices.map(n => `<li>${esc(n.trim())}</li>`).join('')}</ul>` : ''}
    ${images.length ? `<div class="promo-images">${images.map(src => `<img src="${src}" class="promo-img">`).join('')}</div>` : ''}
  </div>`;
}

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fontScaleCSS(base) {
  base = parseInt(base) || 16;
  if (base === 16) return '';
  const s = base / 16, px = v => (v * s).toFixed(1) + 'px';
  return `
.cover h1{font-size:${px(34)}}.cover-sub{font-size:${px(15)}}
.name{font-size:${px(19)}}.tagline{font-size:${px(13)}}.desc{font-size:${px(12)}}
.price{font-size:${px(22)}}.buy{font-size:${px(13)}}
.cta-title{font-size:${px(22)}}.promo h2{font-size:${px(22)}}
@media(max-width:640px){.cover h1{font-size:${px(26)}}}
@media(min-width:900px){.cover h1{font-size:${px(42)}}}`;
}

function getFontConfig(f) {
  const c = {
    'noto-sans': {
      importUrl: "@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&family=Noto+Serif+KR:wght@400;600;700&display=swap');",
      body: "'Noto Sans KR',sans-serif", heading: "'Noto Serif KR',serif",
    },
    'noto-serif': {
      importUrl: "@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;500;600;700;900&display=swap');",
      body: "'Noto Serif KR',serif", heading: "'Noto Serif KR',serif",
    },
    'pretendard': {
      importUrl: "@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css');",
      body: "'Pretendard Variable',sans-serif", heading: "'Pretendard Variable',sans-serif",
    },
    'gmarket': {
      importUrl: "@font-face{font-family:'GmarketSans';font-weight:400;src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/GmarketSansMedium.woff') format('woff')}\n@font-face{font-family:'GmarketSans';font-weight:700;src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/GmarketSansBold.woff') format('woff')}",
      body: "'GmarketSans',sans-serif", heading: "'GmarketSans',sans-serif",
    },
    'nanumgothic': {
      importUrl: "@import url('https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700;800&display=swap');",
      body: "'Nanum Gothic',sans-serif", heading: "'Nanum Gothic',sans-serif",
    },
    'nanummyeongjo': {
      importUrl: "@import url('https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700;800&display=swap');",
      body: "'Nanum Myeongjo',serif", heading: "'Nanum Myeongjo',serif",
    },
  };
  return c[f] || c['noto-sans'];
}

module.exports = { render };
