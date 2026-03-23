const categories = require('../config/categories.json');

/**
 * 상품명을 기반으로 카테고리를 자동 분류
 * @param {string} name - 상품명
 * @returns {string} 카테고리명
 */
function categorize(name) {
  const lower = name.toLowerCase();

  // 동물복지를 먼저 체크 (더 구체적인 카테고리 우선)
  if (categories['동물복지'].some(kw => lower.includes(kw))) return '동물복지';

  for (const [cat, keywords] of Object.entries(categories)) {
    if (cat === '동물복지') continue;
    if (keywords.some(kw => lower.includes(kw))) return cat;
  }

  return '기타';
}

/**
 * 상품 배열을 카테고리별로 그룹화
 * @param {Array} products
 * @returns {Array<{ name: string, products: Array }>}
 */
function groupByCategory(products) {
  const groups = {};
  const order = [];

  for (const p of products) {
    const cat = p.category || categorize(p.name);
    p.category = cat;
    if (!groups[cat]) {
      groups[cat] = [];
      order.push(cat);
    }
    groups[cat].push(p);
  }

  return order.map(name => ({ name, products: groups[name] }));
}

/**
 * 카테고리별 상품 수에 따라 tier 자동 지정
 * 카테고리당 3개 이하 → tier 1 (풀 카드)
 * 4~8개 → tier 2 (컴팩트 그리드)
 * 9개 이상 → 앞 3개 tier 1, 나머지 tier 2
 * 단독 카테고리에 1개만 → tier 1
 */
function autoAssignTiers(categoryGroups) {
  for (const group of categoryGroups) {
    const count = group.products.length;
    if (count <= 3) {
      group.products.forEach(p => p.tier = 1);
    } else if (count <= 8) {
      // 할인율 높은 순 정렬, 상위 2개는 tier 1, 나머지 tier 2
      const sorted = [...group.products].sort((a, b) => (b.discountRate || 0) - (a.discountRate || 0));
      const topNames = new Set(sorted.slice(0, 2).map(p => p.name));
      group.products.forEach(p => {
        p.tier = topNames.has(p.name) ? 1 : 2;
      });
    } else {
      const sorted = [...group.products].sort((a, b) => (b.discountRate || 0) - (a.discountRate || 0));
      const topNames = new Set(sorted.slice(0, 3).map(p => p.name));
      group.products.forEach(p => {
        p.tier = topNames.has(p.name) ? 1 : 2;
      });
    }
  }
  return categoryGroups;
}

module.exports = { categorize, groupByCategory, autoAssignTiers };
