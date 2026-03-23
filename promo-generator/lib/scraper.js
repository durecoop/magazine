const { parse } = require('node-html-parser');

const IMG_BASE = 'https://dureimg.ecoop.or.kr:9091/Delsys/DLOG/Goods/GoodsMaster/GoodsImage/';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

/**
 * ecoop.or.kr 기획전 URL에서 planNo를 추출
 */
function extractPlanNo(url) {
  const m = url.match(/returnNo=(\d+)/);
  return m ? m[1] : null;
}

/**
 * ecoop 기획전 페이지에서 제목을 파싱
 */
function parsePlanTitle(root) {
  for (const sel of ['.plan_tit', '.event_tit', '.plan-title', 'h2', 'h1']) {
    const el = root.querySelector(sel);
    if (el) {
      const text = el.text.trim();
      if (text && text.length > 1 && text.length < 200) return text;
    }
  }
  return '두레생협 기획전';
}

/**
 * HTML에서 상품 목록을 직접 파싱 (서버사이드 렌더링된 상품)
 */
function parseProductsFromHtml(root) {
  const items = root.querySelectorAll('ul.product_type1 > li');
  const products = [];

  for (const li of items) {
    // 상품명
    const titleEl = li.querySelector('.title');
    if (!titleEl) continue;
    const name = titleEl.text.trim();
    if (!name) continue;

    // 이미지
    const img = li.querySelector('img[src*="GoodsImage"]');
    const imageUrl = img ? img.getAttribute('src') : '';

    // 할인율 태그
    const tagEl = li.querySelector('.tag .bg_y');
    let discountRate = 0;
    if (tagEl) {
      const tagText = tagEl.text.trim();
      const m = tagText.match(/(\d+)%/);
      if (m) discountRate = parseInt(m[1]);
    }

    // 가격: 조합원 가격 블록
    const priceDls = li.querySelectorAll('dl.price');
    let origPrice = 0;
    let price = 0;

    if (priceDls.length > 0) {
      const dd = priceDls[0].querySelector('dd.won');
      if (dd) {
        // 원가 (취소선 가격)
        const saleSpan = dd.querySelector('span.sale');
        if (saleSpan) {
          origPrice = parsePrice(saleSpan.text);
        }

        // 할인가: dd 내 직접 텍스트에서 숫자 추출 (span.sale 제외)
        const wonSpans = dd.querySelectorAll('span.roboto');
        for (const s of wonSpans) {
          if (!s.classList.contains('sale')) {
            const p = parsePrice(s.text);
            if (p > 0) { price = p; break; }
          }
        }

        // 할인가 없으면 원가를 할인가로
        if (!price && origPrice) {
          price = origPrice;
          origPrice = 0;
        }
      }
    }

    // 상품번호: addBasketV2(..., 'goodsNo', ...) 또는 moveProdDetail(...)
    let goodsNo = '';
    const cartLink = li.querySelector('a.cart');
    if (cartLink) {
      const onclick = cartLink.getAttribute('onclick') || '';
      const m = onclick.match(/addBasket[^(]*\([^,]*,\s*'[^']*',\s*'(\d+)'/);
      if (m) goodsNo = m[1];
    }
    if (!goodsNo) {
      const detailLink = li.querySelector('a[onclick*="moveProdDetail"]');
      if (detailLink) {
        const onclick = detailLink.getAttribute('onclick') || '';
        const m = onclick.match(/moveProdDetail\([^,]*,\s*'?(\d+)/);
        if (m) goodsNo = m[1];
      }
    }

    // 품절 체크
    const soldOutEl = li.querySelector('.sold_out, .ico_soldout');
    if (soldOutEl) continue;

    products.push({
      name,
      imageUrl,
      price,
      origPrice: origPrice > price ? origPrice : null,
      discountRate,
      tagline: '',
      description: '',
      chips: [],
      tier: 1,
      soldOut: false,
      goodsNo,
    });
  }

  return products;
}

/**
 * 기획전 페이지에서 상품 목록을 가져옴
 * 1차: HTML 직접 파싱 (SSR 상품)
 * 2차 fallback: AJAX API 호출
 *
 * @param {string} planUrl - 기획전 페이지 URL
 * @returns {Promise<{ planUrl, title, products }>}
 */
async function fetchPlanProducts(planUrl) {
  const planNo = extractPlanNo(planUrl);
  if (!planNo) throw new Error('URL에서 기획전 번호(returnNo)를 찾을 수 없습니다.');

  // 1) 페이지 HTML 가져오기
  const pageResp = await fetch(planUrl, {
    headers: {
      'User-Agent': UA,
      'Accept': 'text/html',
      'Accept-Language': 'ko-KR,ko;q=0.9',
    }
  });

  if (!pageResp.ok) throw new Error(`페이지 로드 실패: HTTP ${pageResp.status}`);

  const html = await pageResp.text();
  const root = parse(html);
  const title = parsePlanTitle(root);

  // 2) 기획전 상세 섹션 파싱 (이미지 + 상품 그룹)
  const sections = parseSections(root, planNo);
  console.log(`[scraper] 섹션 파싱: ${sections.length}개 섹션`);

  // 3) HTML에서 직접 상품 파싱 (SSR)
  let products = parseProductsFromHtml(root);
  console.log(`[scraper] HTML 파싱: ${products.length}개 상품 발견`);

  // 4) HTML에 상품이 없으면 AJAX API fallback
  if (products.length === 0) {
    console.log('[scraper] HTML에 상품 없음, AJAX API 시도...');
    try {
      products = await fetchFromAjaxApi(planNo, planUrl);
      console.log(`[scraper] AJAX API: ${products.length}개 상품 발견`);
    } catch (e) {
      console.warn('[scraper] AJAX API 실패:', e.message);
    }
  }

  // 상품에 섹션 번호 매핑
  for (const sec of sections) {
    for (const pName of sec.productNames) {
      const found = products.find(p => p.name === pName && !p.sectionNo);
      if (found) {
        found.sectionNo = sec.no;
        found.sectionImg = sec.img;
      }
    }
  }

  return { planUrl, title, products, sections };
}

/**
 * AJAX API fallback
 */
async function fetchFromAjaxApi(planNo, referer) {
  const apiUrl = 'https://ecoop.or.kr/DureShop/plan/ajaxGiftGoodsList.do';
  const params = new URLSearchParams({
    pMobile: 'shop',
    pMallCd: 'SP',
    pPlanNo: planNo,
    pSearch: '',
  });

  const resp = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'User-Agent': UA,
      'Accept': 'application/json',
      'Accept-Language': 'ko-KR,ko;q=0.9',
      'Referer': referer,
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: params.toString(),
  });

  if (!resp.ok) throw new Error(`API 호출 실패: HTTP ${resp.status}`);

  const data = await resp.json();
  const goods = data.goods || [];

  return goods
    .filter(g => g.goodsNm)
    .map(g => {
      const origPrice = parsePrice(g.oldAmt);
      const price = parsePrice(g.saleAmt);
      let discountRate = parseInt(g.dcRate) || 0;

      if (!discountRate && origPrice > price && origPrice > 0) {
        discountRate = Math.round((1 - price / origPrice) * 100);
      }

      let imageUrl = '';
      if (g.goodsImg) {
        imageUrl = g.goodsImg.startsWith('http') ? g.goodsImg : IMG_BASE + g.goodsImg;
      }

      return {
        name: g.goodsNm.trim(),
        imageUrl,
        price,
        origPrice: origPrice > price ? origPrice : null,
        discountRate,
        tagline: '',
        description: '',
        chips: g.gmbreedingNm ? [g.gmbreedingNm] : [],
        tier: 1,
        soldOut: g.stopYn === 'Y',
        goodsNo: g.goodsNo,
      };
    })
    .filter(p => !p.soldOut);
}

function parsePrice(str) {
  if (!str) return 0;
  return parseInt(String(str).replace(/[,\s원]/g, ''), 10) || 0;
}

/**
 * 기획전 상세 섹션 파싱 (book0~bookN div 순서)
 */
function parseSections(root, planNo) {
  const inner = root.querySelector('.event_prod .inner');
  if (!inner) return [];

  const sections = [];
  let cur = null;
  let secNo = 0;

  const children = inner.childNodes.filter(n => n.tagName);
  for (const child of children) {
    const id = child.getAttribute?.('id') || '';

    // book div → 새 섹션 시작
    if (id.startsWith('book')) {
      const img = child.querySelector('img[src*="planDetail"]');
      secNo++;
      cur = { no: secNo, img: img?.getAttribute('src') || '', productNames: [] };
      sections.push(cur);
      continue;
    }

    // UL.product_type1 → 현재 섹션에 상품 추가
    if (cur && child.tagName === 'UL' && child.classNames?.includes('product_type1')) {
      child.querySelectorAll('li .title').forEach(t => {
        const name = t.text.trim();
        if (name) cur.productNames.push(name);
      });
    }
  }

  return sections;
}

module.exports = { fetchPlanProducts, extractPlanNo };
