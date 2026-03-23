const express = require('express');
const path = require('path');
const fs = require('fs');
const { fetchPlanProducts } = require('./lib/scraper');
const { groupByCategory, autoAssignTiers } = require('./lib/categorizer');
const { generateDescriptions, generateThemes } = require('./lib/ai-writer');
const weeklyTemplate = require('./templates/weekly-overview');
const individualTemplate = require('./templates/individual-product');
const timeSaleTemplate = require('./templates/time-sale');

const app = express();
const PORT = process.env.PORT || 3000;

// 섹션 내 상품들로부터 대표 카테고리명 추출
function guessSectionName(products) {
  if (!products || products.length === 0) return null;
  const names = products.map(p => p.name);
  const joined = names.join(' ');

  // 공통 키워드 매칭
  const patterns = [
    [/맛찬|반찬|무침|볶음|조림|나물|피클/i, '맛찬·반찬'],
    [/곰탕|설렁탕|도가니|사골/i, '건강탕'],
    [/장어|흑염소|추어|보양/i, '보양식'],
    [/돼지|목살|삼겹|앞다리|대패/i, '돼지고기'],
    [/한우|등심|채끝/i, '한우'],
    [/닭|북채|닭다리|닭가슴/i, '닭고기'],
    [/동물복지/i, '동물복지'],
    [/버섯|양송이|표고|새송이/i, '버섯'],
    [/바지락|새우|멸치|꽃게|홍합|해산물|꼬막/i, '해산물'],
    [/육수|알육수|양념|야채가루/i, '육수·양념'],
    [/과자|붕어빵|칩|팝|간식|초코/i, '간식'],
    [/우유|요구르트|식혜|차|음료|탄산|레몬|오미자|푸룬/i, '음료·유제품'],
    [/쌀|양배추|배|과일|채소/i, '농산물'],
    [/나시|팬티|반팔|모달|텐셀|의류/i, '생활용품'],
  ];

  for (const [re, name] of patterns) {
    if (re.test(joined)) return name;
  }
  return null;
}

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ===== API: URL에서 상품 파싱 =====
app.post('/api/fetch', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL이 필요합니다.' });

  try {
    // AJAX API로 상품 데이터 직접 가져오기
    const data = await fetchPlanProducts(url);

    // 섹션 기반 카테고리 분류 (ecoop 기획전 상세 번호 순서 유지)
    let categories;
    if (data.sections && data.sections.some(s => s.productNames.length > 0)) {
      // 섹션별로 그룹화 — 상품이 있는 섹션만
      // 섹션별로 그대로 유지 (관리자 기획전상세 번호 = 카테고리)
      categories = data.sections
        .filter(s => s.productNames.length > 0)
        .map(s => {
          const prods = data.products.filter(p => p.sectionNo === s.no);
          const name = `섹션 ${s.no}`;
          prods.forEach(p => p.category = name);
          return { name, products: prods, sectionImg: s.img };
        })
        .filter(c => c.products.length > 0);

      // 섹션에 속하지 않은 상품
      const assigned = new Set(categories.flatMap(c => c.products));
      const unassigned = data.products.filter(p => !assigned.has(p));
      if (unassigned.length > 0) {
        unassigned.forEach(p => p.category = '기타');
        categories.push({ name: '기타', products: unassigned });
      }
    } else {
      // 섹션 정보 없으면 기존 키워드 분류
      categories = groupByCategory(data.products);
    }
    autoAssignTiers(categories);

    // 캐시 저장
    const cacheFile = path.join(__dirname, 'data', `fetch_${Date.now()}.json`);
    fs.writeFileSync(cacheFile, JSON.stringify({ url, ...data, categories }, null, 2), 'utf-8');

    // 섹션 정보
    const sections = (data.sections || []).map(s => ({ no: s.no, img: s.img, productCount: s.productNames.length }));

    res.json({
      title: data.title,
      planUrl: url,
      productCount: data.products.length,
      categories,
      sections,
    });
  } catch (err) {
    console.error('페이지 가져오기 실패:', err.message);
    res.status(500).json({ error: `페이지를 가져올 수 없습니다: ${err.message}` });
  }
});

// ===== API: AI 설명 생성 =====
app.post('/api/generate-descriptions', async (req, res) => {
  const { products } = req.body;
  if (!products || !Array.isArray(products)) {
    return res.status(400).json({ error: '상품 목록이 필요합니다.' });
  }

  try {
    const results = await generateDescriptions(products);
    res.json({ results });
  } catch (err) {
    console.error('AI 생성 실패:', err.message);
    res.status(500).json({ error: `AI 생성 실패: ${err.message}` });
  }
});

// ===== API: AI 테마명 생성 =====
app.post('/api/generate-themes', async (req, res) => {
  const { categories } = req.body;
  if (!categories || !Array.isArray(categories)) {
    return res.status(400).json({ error: '카테고리 목록이 필요합니다.' });
  }

  try {
    const results = await generateThemes(categories);
    res.json({ results });
  } catch (err) {
    console.error('테마 생성 실패:', err.message);
    res.status(500).json({ error: `테마 생성 실패: ${err.message}` });
  }
});

// ===== API: HTML 생성 =====
app.post('/api/generate', (req, res) => {
  const { type, data } = req.body;

  let html;
  switch (type) {
    case 'weekly-overview':
      html = weeklyTemplate.render(data);
      break;
    case 'individual-product':
      html = individualTemplate.render(data);
      break;
    case 'time-sale':
      html = timeSaleTemplate.render(data);
      break;
    default:
      return res.status(400).json({ error: '알 수 없는 페이지 타입입니다.' });
  }

  res.json({ html });
});

// ===== API: HTML 파일 저장 =====
app.post('/api/save', (req, res) => {
  const { filename, html } = req.body;
  if (!filename || !html) {
    return res.status(400).json({ error: '파일명과 HTML이 필요합니다.' });
  }

  // 안전한 파일명 체크
  const safeName = filename.replace(/[^a-zA-Z0-9가-힣_\-\.]/g, '_');
  const outputPath = path.join('C:\\Users\\DURE', safeName);

  try {
    fs.writeFileSync(outputPath, html, 'utf-8');
    res.json({ path: outputPath, filename: safeName });
  } catch (err) {
    res.status(500).json({ error: `저장 실패: ${err.message}` });
  }
});

// ===== API: 미리보기용 HTML 반환 =====
app.post('/api/preview', (req, res) => {
  const { type, data } = req.body;

  let html;
  switch (type) {
    case 'weekly-overview':
      html = weeklyTemplate.render(data);
      break;
    case 'individual-product':
      html = individualTemplate.render(data);
      break;
    case 'time-sale':
      html = timeSaleTemplate.render(data);
      break;
    default:
      return res.status(400).json({ error: '알 수 없는 페이지 타입입니다.' });
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`\n  두레생협 홍보 페이지 생성기`);
  console.log(`  http://localhost:${PORT}\n`);
});
