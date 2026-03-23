const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

let ai = null;

function getAI() {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'YOUR_KEY_HERE') return null;
    ai = new GoogleGenAI({ apiKey: key });
  }
  return ai;
}

// ===== 로컬 자동 생성 (API 없이 동작) =====
const TAGLINES = {
  '건강탕': ['든든한 한 그릇', '깊은 맛 한 사발', '속이 편안해지는 맛', '따끈한 보양 한 끼', '정성 가득 곰탕'],
  '보양식': ['기력 충전 한 그릇', '몸이 좋아하는 맛', '계절의 보양', '자연이 키운 힘', '원기 회복 한 끼'],
  '닭고기': ['부드러운 한 입', '고소한 닭의 참맛', '자연방사 신선함', '식탁의 든든한 단백질'],
  '돼지고기': ['육즙 가득 한 점', '구울수록 고소한', '집밥의 완성', '한 입에 행복'],
  '한우': ['깊은 풍미 한우', '정직한 한우의 맛', '특별한 날의 한 끼', '부드러운 한우 한 점'],
  '버섯': ['숲의 향기 그대로', '자연을 담은 한 입', '향 좋은 제철 버섯'],
  '동물복지': ['행복한 농장에서', '바른 사육의 맛', '동물도 사람도 건강하게'],
  '해산물': ['바다의 신선함', '깊은 바다의 맛', '갯바람 머금은 맛', '바다가 키운 건강'],
  '육수·양념': ['요리의 첫 시작', '맛의 기본기', '간편한 깊은 맛'],
  '맛찬·반찬': ['밥도둑 반찬', '정성 담은 한 젓가락', '엄마 손맛 그대로', '매일 먹어도 질리지 않는'],
  '간식': ['입이 즐거운 시간', '건강한 단맛', '아이도 어른도 좋아하는'],
  '음료·유제품': ['한 잔의 여유', '자연이 만든 음료', '목을 적시는 건강'],
  '기타': ['생활을 채우는 선택', '알뜰한 살림살이'],
};

const TEMPLATES = {
  '건강탕': (name) => `속부터 따뜻하게, 간편한 한 끼`,
  '보양식': (name) => `정성 가득, 기력을 채우는 한 그릇`,
  '닭고기': (name) => `신선한 닭고기, 다양하게 즐기세요`,
  '돼지고기': (name) => `구울수록 살아나는 육즙의 맛`,
  '한우': (name) => `깊은 풍미, 특별한 식탁의 주인공`,
  '버섯': (name) => `향 좋은 버섯, 감칠맛을 더하다`,
  '동물복지': (name) => `건강하게 자란 만큼, 맛도 다릅니다`,
  '해산물': (name) => `바다의 감칠맛을 그대로 담았습니다`,
  '육수·양념': (name) => `간편하게 완성하는 깊은 맛`,
  '맛찬·반찬': (name) => `정성 담은 반찬, 밥 한 공기 뚝딱`,
  '간식': (name) => `안심하고 즐기는 건강한 간식`,
  '음료·유제품': (name) => `자연 원료로 만든 건강한 한 잔`,
  '기타': (name) => `두레생협이 엄선한 좋은 선택`,
};

function extractChips(product) {
  const chips = [];
  const name = product.name;

  // 용량/중량
  const weight = name.match(/\(([^)]*(?:g|kg|ml|L|개|입|알|P)[^)]*)\)/i);
  if (weight) chips.push(weight[1]);

  // 인증
  if (/무농약/.test(name)) chips.push('무농약');
  if (/유기농/.test(name)) chips.push('유기농');
  if (/무항생제/.test(name)) chips.push('무항생제');
  if (/동물복지/.test(name)) chips.push('동물복지');

  // 상태
  if (/냉동/.test(name)) chips.push('냉동');

  // 할인
  if (product.discountRate >= 10) chips.push(product.discountRate + '% 할인');

  // 카테고리 기반
  const cat = product.category || '';
  if (!chips.length) {
    if (/탕|곰탕|설렁탕|추어탕/.test(name)) chips.push('간편조리');
    if (/맛찬/.test(name)) chips.push('반찬');
    if (/구이|로스/.test(name)) chips.push('구이용');
    if (/보쌈/.test(name)) chips.push('보쌈용');
    if (/볶음|조림|무침|피클/.test(name)) chips.push('반찬');
  }

  return chips.slice(0, 3);
}

// 상품명으로 카테고리 추측
function guessCategory(name) {
  const n = name.toLowerCase();
  const map = [
    [/곰탕|설렁탕|도가니|사골/, '건강탕'],
    [/장어|흑염소|추어|보양/, '보양식'],
    [/닭|북채|닭다리|닭가슴/, '닭고기'],
    [/돼지|목살|삼겹|대패|앞다리/, '돼지고기'],
    [/한우|등심|채끝/, '한우'],
    [/동물복지/, '동물복지'],
    [/버섯|양송이|표고|새송이/, '버섯'],
    [/바지락|새우|멸치|꽃게|홍합|꼬막/, '해산물'],
    [/육수|알육수|양념|야채가루/, '육수·양념'],
    [/맛찬|무침|볶음|조림|나물|피클|비빔/, '맛찬·반찬'],
    [/과자|붕어빵|칩|팝|초코|간식|두부과자/, '간식'],
    [/우유|요구르트|식혜|유자차|레몬차|오미자|탄산|푸룬/, '음료·유제품'],
    [/쌀|양배추|배\(|신고배/, '기타'],
    [/나시|팬티|반팔|모달|텐셀/, '기타'],
  ];
  for (const [re, cat] of map) {
    if (re.test(n)) return cat;
  }
  return '기타';
}

function generateLocal(products) {
  return products.map(p => {
    const cat = guessCategory(p.name);
    const taglines = TAGLINES[cat] || TAGLINES['기타'];
    const tagline = taglines[Math.floor(Math.random() * taglines.length)];

    const templateFn = TEMPLATES[cat] || TEMPLATES['기타'];
    const description = templateFn(p.name);
    const chips = extractChips(p);

    return { name: p.name, tagline, description, chips };
  });
}

// ===== Gemini API 생성 =====
async function generateWithGemini(products) {
  const genai = getAI();
  if (!genai) throw new Error('API 키 없음');

  const productList = products.map((p, i) =>
    `${i + 1}. ${p.name} (${p.category}, ${p.price ? p.price.toLocaleString() + '원' : '가격 미정'}${p.discountRate ? ', ' + p.discountRate + '% 할인' : ''})`
  ).join('\n');

  const prompt = `두레생협 기획전 홍보 페이지에 들어갈 상품 소개 문구를 작성해주세요.

상품 목록:
${productList}

각 상품에 대해 다음을 JSON 배열로 반환해주세요:
- tagline: 한 줄 캐치프레이즈 (15자 이내, 감성적이고 따뜻한 톤)
- description: 한 줄 소개 (25자 이내, 감성적이고 간결하게)
- chips: 특성 태그 2~3개 배열 (예: ["냉동", "400g", "구이용"])

규칙:
- 과장 표현 금지 (초특가, 대박, 파격 등 사용 금지)
- 느낌표 최소 사용
- 두레생협의 따뜻하고 신뢰감 있는 톤 유지
- 실제 식재료 특성에 맞게 작성

JSON 배열만 반환하세요. 다른 텍스트 없이.`;

  const response = await genai.models.generateContent({
    model: 'gemini-2.0-flash-lite',
    contents: prompt,
  });

  const text = response.text.trim();
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('JSON 파싱 실패');

  const results = JSON.parse(jsonMatch[0]);
  return products.map((p, i) => ({
    name: p.name,
    tagline: results[i]?.tagline || '',
    description: results[i]?.description || '',
    chips: results[i]?.chips || [],
  }));
}

// ===== 메인: Gemini 시도 → 실패 시 로컬 폴백 =====
async function generateDescriptions(products) {
  try {
    const results = await generateWithGemini(products);
    console.log('[ai-writer] Gemini API로 생성 완료');
    return results;
  } catch (e) {
    console.log(`[ai-writer] Gemini 실패 (${e.message?.substring(0, 60)}...), 로컬 생성으로 대체`);
    return generateLocal(products);
  }
}

// ===== 테마명 생성 =====
const THEME_TEMPLATES = {
  '건강탕': { theme: '따뜻한 보양 한 그릇', subtitle: '속부터 든든하게 채우는 건강탕' },
  '보양식': { theme: '기력을 채우는 시간', subtitle: '자연의 힘으로 건강을 지키세요' },
  '닭고기': { theme: '고소한 닭의 참맛', subtitle: '신선한 닭고기로 만드는 다양한 요리' },
  '돼지고기': { theme: '육즙 가득 한 상', subtitle: '가족 식탁을 풍성하게' },
  '한우': { theme: '정직한 한우의 맛', subtitle: '소중한 식탁을 더 특별하게' },
  '버섯': { theme: '숲이 키운 감칠맛', subtitle: '향 좋은 제철 버섯을 만나보세요' },
  '동물복지': { theme: '행복한 농장에서 온', subtitle: '건강하게 자란 만큼 맛도 다릅니다' },
  '해산물': { theme: '바다가 키운 건강', subtitle: '신선한 해산물로 차리는 풍성한 식탁' },
  '육수·양념': { theme: '요리의 첫 시작', subtitle: '간편하게 깊은 맛을 더하세요' },
  '맛찬·반찬': { theme: '정성 담은 한 젓가락', subtitle: '매일 먹어도 질리지 않는 반찬' },
  '간식': { theme: '건강한 입이 즐거운 시간', subtitle: '안심하고 즐기는 간식' },
  '음료·유제품': { theme: '한 잔의 여유', subtitle: '자연 원료로 만든 건강한 음료' },
};

// 상품명 기반 테마 키워드 매칭 — 각 키워드에 여러 후보
const THEME_KEYWORDS = [
  { re: /곰탕|설렁탕|도가니|사골/, themes: [
    { theme: '따뜻한 보양 한 그릇', subtitle: '속부터 든든하게 채우는 건강탕' },
    { theme: '깊은 맛 한 사발', subtitle: '진하게 우려낸 정성 가득 한 그릇' },
    { theme: '속을 채우는 시간', subtitle: '오래 우린 국물의 깊은 맛' },
  ]},
  { re: /장어|흑염소|추어|보양/, themes: [
    { theme: '기력을 채우는 시간', subtitle: '자연의 힘으로 건강을 지키세요' },
    { theme: '몸이 기억하는 맛', subtitle: '자연에서 온 보양의 힘' },
    { theme: '계절의 보양', subtitle: '기운을 채워주는 한 끼' },
  ]},
  { re: /닭|북채|닭다리/, themes: [
    { theme: '고소한 닭의 참맛', subtitle: '신선한 닭고기로 만드는 다양한 요리' },
    { theme: '담백한 한 끼', subtitle: '부드럽고 고소한 닭고기' },
  ]},
  { re: /돼지|목살|삼겹|대패/, themes: [
    { theme: '육즙 가득 한 상', subtitle: '가족 식탁을 풍성하게' },
    { theme: '구울수록 깊어지는 맛', subtitle: '육즙 가득 고소한 돼지고기' },
    { theme: '불 위의 행복', subtitle: '한 점 한 점 즐기는 맛' },
  ]},
  { re: /한우|등심/, themes: [
    { theme: '정직한 한우의 맛', subtitle: '소중한 식탁을 더 특별하게' },
    { theme: '한우로 차린 한 상', subtitle: '깊은 풍미를 느껴보세요' },
  ]},
  { re: /버섯|양송이|표고/, themes: [
    { theme: '숲이 키운 감칠맛', subtitle: '향 좋은 제철 버섯을 만나보세요' },
    { theme: '자연이 빚은 향', subtitle: '감칠맛 가득한 버섯' },
  ]},
  { re: /동물복지/, themes: [
    { theme: '행복한 농장에서 온', subtitle: '건강하게 자란 만큼 맛도 다릅니다' },
    { theme: '바른 사육의 맛', subtitle: '동물도 사람도 건강하게' },
  ]},
  { re: /바지락|새우|멸치|꽃게|홍합|꼬막|해산물/, themes: [
    { theme: '바다가 키운 건강', subtitle: '신선한 해산물로 차리는 풍성한 식탁' },
    { theme: '갯바람 머금은 맛', subtitle: '바다의 감칠맛을 그대로' },
    { theme: '깊은 바다의 선물', subtitle: '자연 그대로의 신선함' },
  ]},
  { re: /육수|알육수|양념|야채가루/, themes: [
    { theme: '요리의 첫 시작', subtitle: '간편하게 깊은 맛을 더하세요' },
    { theme: '맛의 기본기', subtitle: '한 알로 완성하는 깊은 육수' },
  ]},
  { re: /맛찬|반찬|무침|볶음|조림|나물|피클/, themes: [
    { theme: '정성 담은 한 젓가락', subtitle: '매일 먹어도 질리지 않는 반찬' },
    { theme: '밥도둑 반찬', subtitle: '밥 한 공기가 뚝딱' },
    { theme: '엄마 손맛 그대로', subtitle: '식탁을 풍성하게 채우는 반찬' },
    { theme: '봄 내음 가득', subtitle: '제철 나물로 차린 한 상' },
  ]},
  { re: /과자|붕어빵|칩|팝|초코|간식/, themes: [
    { theme: '건강한 간식 시간', subtitle: '안심하고 즐기는 간식' },
    { theme: '입이 즐거운 시간', subtitle: '건강한 재료로 만든 간식' },
  ]},
  { re: /우유|요구르트|식혜|차|음료|탄산|레몬|오미자|푸룬/, themes: [
    { theme: '한 잔의 여유', subtitle: '자연 원료로 만든 건강한 음료' },
    { theme: '목을 적시는 건강', subtitle: '한 모금의 상쾌함' },
  ]},
  { re: /쌀|양배추|배|과일|채소/, themes: [
    { theme: '자연을 담은 먹거리', subtitle: '두레가 엄선한 신선한 농산물' },
    { theme: '들판의 건강', subtitle: '건강한 땅에서 자란 농산물' },
  ]},
  { re: /나시|팬티|반팔|모달|텐셀/, themes: [
    { theme: '편안한 일상', subtitle: '자연 소재로 만든 생활용품' },
    { theme: '피부가 좋아하는 소재', subtitle: '편안함을 입다' },
  ]},
];

function generateThemesLocal(categories) {
  const usedThemes = new Set();

  return categories.map(cat => {
    // 기존 이름으로 매칭
    const template = THEME_TEMPLATES[cat.name];
    if (template && !usedThemes.has(template.theme)) {
      usedThemes.add(template.theme);
      return { theme: template.theme, subtitle: template.subtitle };
    }

    // 상품명으로 키워드 매칭 — 중복 안 되는 후보 선택
    const allNames = cat.products.join(' ');
    for (const kw of THEME_KEYWORDS) {
      if (kw.re.test(allNames)) {
        const available = kw.themes.find(t => !usedThemes.has(t.theme));
        if (available) {
          usedThemes.add(available.theme);
          return { theme: available.theme, subtitle: available.subtitle };
        }
      }
    }

    // 매칭 실패 시 카테고리명 유지
    return { theme: cat.name, subtitle: '' };
  });
}

async function generateThemesWithGemini(categories) {
  const genai = getAI();
  if (!genai) throw new Error('API 키 없음');

  const catList = categories.map((c, i) =>
    `${i + 1}. "${c.name}" 카테고리: ${c.products.slice(0, 5).join(', ')}${c.products.length > 5 ? ' 외 ' + (c.products.length - 5) + '개' : ''}`
  ).join('\n');

  const prompt = `두레생협 기획전 홍보 페이지에서 카테고리별 테마명과 부제를 추천해주세요.

카테고리별 상품 목록:
${catList}

각 카테고리에 대해 다음을 JSON 배열로 반환해주세요:
- theme: 감성적인 테마명 (8자 이내, 따뜻하고 고급진 톤)
- subtitle: 한 줄 부제 (20자 이내)

규칙:
- 각 카테고리마다 반드시 서로 다른 테마명을 사용하세요 (절대 중복 금지)
- 과장 표현 금지 (초특가, 대박, 파격 금지)
- 느낌표 최소 사용
- 백화점 식품관 느낌의 품격 있는 톤
- 상품 특성을 반영

JSON 배열만 반환하세요.`;

  const response = await genai.models.generateContent({
    model: 'gemini-2.0-flash-lite',
    contents: prompt,
  });

  const text = response.text.trim();
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('JSON 파싱 실패');

  const results = JSON.parse(jsonMatch[0]);
  return categories.map((c, i) => ({
    theme: results[i]?.theme || c.name,
    subtitle: results[i]?.subtitle || '',
  }));
}

async function generateThemes(categories) {
  try {
    const results = await generateThemesWithGemini(categories);
    console.log('[ai-writer] Gemini 테마 생성 완료');
    return results;
  } catch (e) {
    console.log(`[ai-writer] Gemini 테마 실패, 로컬 생성으로 대체`);
    return generateThemesLocal(categories);
  }
}

module.exports = { generateDescriptions, generateThemes };
