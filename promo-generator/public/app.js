// ===== STATE =====
const state = {
  currentStep: 1,
  products: [],        // 전체 상품 배열
  categories: [],      // 카테고리별 그룹
  pageType: 'weekly-overview',
  meta: {
    title: '',
    weekNumber: '',
    planUrl: '',
    period: '',
    couponText: '',
    heroTitle: '',
    heroSub: '',
    filename: '',
    baseFontSize: 16,
    fontFamily: 'noto-sans',
    promoTitle: '',
    promoDesc: '',
    promoNotices: '',
    promoImages: [],
  },
  generatedHtml: '',
  sections: [],
};

// ===== STEP NAVIGATION =====
const tabs = document.querySelectorAll('.step-tab');
const panels = document.querySelectorAll('.step-panel');

function goToStep(n) {
  if (n < 1 || n > 5) return;
  state.currentStep = n;

  tabs.forEach(t => {
    const s = parseInt(t.dataset.step);
    t.classList.toggle('active', s === n);
    if (s <= n) {
      t.classList.remove('disabled');
      t.classList.toggle('done', s < n);
    }
  });

  panels.forEach(p => {
    p.classList.toggle('active', p.id === `step-${n}`);
  });

  // Step-specific init
  if (n === 3) renderCategoryView();
  if (n === 5) refreshPreview();
}

tabs.forEach(t => {
  t.addEventListener('click', () => {
    if (t.classList.contains('disabled')) return;
    goToStep(parseInt(t.dataset.step));
  });
});

document.querySelectorAll('[data-nav]').forEach(btn => {
  btn.addEventListener('click', () => {
    const dir = btn.dataset.nav;
    goToStep(state.currentStep + (dir === 'next' ? 1 : -1));
  });
});

// ===== STEP 1: FETCH =====
const btnFetch = document.getElementById('btn-fetch');
const urlInput = document.getElementById('plan-url');
const fetchStatus = document.getElementById('fetch-status');

btnFetch.addEventListener('click', async () => {
  const url = urlInput.value.trim();
  if (!url) {
    fetchStatus.innerHTML = '<div class="status-msg error">URL을 입력하세요.</div>';
    return;
  }

  btnFetch.disabled = true;
  fetchStatus.innerHTML = '<div class="status-msg info"><span class="loading-spinner"></span> 페이지를 불러오는 중...</div>';

  try {
    const resp = await fetch('/api/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error);

    state.meta.title = data.title;
    state.meta.planUrl = url;
    state.sections = data.sections || [];
    loadProducts(data.categories);
    loadSections(data.sections || []);

    fetchStatus.innerHTML = `<div class="status-msg success">${data.productCount}개 상품을 불러왔습니다.</div>`;
    goToStep(2);
  } catch (err) {
    fetchStatus.innerHTML = `<div class="status-msg error">${err.message}</div>`;
  } finally {
    btnFetch.disabled = false;
  }
});

// JSON 직접 입력
document.getElementById('btn-json-load').addEventListener('click', () => {
  const raw = document.getElementById('json-input').value.trim();
  if (!raw) return;

  try {
    const products = JSON.parse(raw);
    if (!Array.isArray(products)) throw new Error('배열 형식이어야 합니다.');

    // 카테고리로 그룹화
    const groups = {};
    const order = [];
    for (const p of products) {
      const cat = p.category || '기타';
      p.selected = true;
      p.tier = p.tier || 1;
      p.tagline = p.tagline || '';
      p.description = p.description || '';
      p.chips = p.chips || [];
      if (!groups[cat]) { groups[cat] = []; order.push(cat); }
      groups[cat].push(p);
    }
    const categories = order.map(name => ({ name, products: groups[name] }));
    loadProducts(categories);
    fetchStatus.innerHTML = `<div class="status-msg success">${products.length}개 상품을 불러왔습니다.</div>`;
    goToStep(2);
  } catch (err) {
    fetchStatus.innerHTML = `<div class="status-msg error">JSON 파싱 오류: ${err.message}</div>`;
  }
});

function loadProducts(categories) {
  state.categories = categories.map((c, i) => ({
    id: 'cat_' + i,
    name: c.name,
    subtitle: c.subtitle || '',
    sectionImg: c.sectionImg || '',
    products: c.products,
  }));
  state.products = [];
  for (const cat of state.categories) {
    for (const p of cat.products) {
      p.selected = p.selected !== false;
      p.category = cat.name;
      p._catId = cat.id;  // 고유 ID로 연결
      state.products.push(p);
    }
  }
  renderProductTable();
}

// ===== STEP 2: PRODUCT TABLE =====
const productTbody = document.getElementById('product-tbody');
const productCount = document.getElementById('product-count');

const ALL_CATEGORIES = [
  '건강탕', '보양식', '돼지고기', '한우', '닭고기', '동물복지',
  '해산물', '버섯', '육수·양념', '맛찬·반찬', '간식', '음료·유제품', '기타'
];

function renderProductTable() {
  productTbody.innerHTML = '';
  const searchTerm = (document.getElementById('product-search')?.value || '').trim().toLowerCase();
  const sectionFilter = document.getElementById('section-filter')?.value || '';
  const selected = state.products.filter(p => p.selected).length;
  productCount.textContent = `${selected} / ${state.products.length}개 선택`;

  for (let i = 0; i < state.products.length; i++) {
    const p = state.products[i];

    // 검색 필터
    const matchSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm);
    const matchSection = !sectionFilter || String(p.sectionNo) === sectionFilter;

    const tr = document.createElement('tr');
    if (!matchSearch || !matchSection) tr.style.display = 'none';
    tr.innerHTML = `
      <td><input type="checkbox" data-idx="${i}" class="product-check" ${p.selected ? 'checked' : ''}></td>
      <td>${p.imageUrl ? `<img class="thumb" src="${esc(p.imageUrl)}" alt="">` : '<span style="color:#ccc;">—</span>'}</td>
      <td class="name-cell">${esc(p.name)}</td>
      <td><input type="text" data-idx="${i}" data-field="tagline" value="${esc(p.tagline)}" placeholder="태그라인"></td>
      <td>${p.origPrice ? formatPrice(p.origPrice) : '—'}</td>
      <td class="price-cell">${p.price ? formatPrice(p.price) : '—'}</td>
      <td>${p.discountRate ? `<span class="discount-badge">${p.discountRate}%</span>` : '—'}</td>
      <td>
        <select data-idx="${i}" data-field="category">
          ${ALL_CATEGORIES.map(c => `<option value="${c}" ${c === p.category ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
      </td>
      <td>
        <select data-idx="${i}" data-field="tier" class="tier-select">
          <option value="1" ${p.tier === 1 ? 'selected' : ''}>1 풀</option>
          <option value="2" ${p.tier === 2 ? 'selected' : ''}>2 그리드</option>
          <option value="3" ${p.tier === 3 ? 'selected' : ''}>3 마키</option>
        </select>
      </td>
    `;
    productTbody.appendChild(tr);
  }

  // Event delegation
  productTbody.onclick = null;
  productTbody.onchange = (e) => {
    const el = e.target;
    const idx = parseInt(el.dataset.idx);
    if (isNaN(idx)) return;

    if (el.classList.contains('product-check')) {
      state.products[idx].selected = el.checked;
      const sel = state.products.filter(p => p.selected).length;
      productCount.textContent = `${sel} / ${state.products.length}개 선택`;
    } else if (el.dataset.field === 'tagline') {
      state.products[idx].tagline = el.value;
    } else if (el.dataset.field === 'category') {
      state.products[idx].category = el.value;
    } else if (el.dataset.field === 'tier') {
      state.products[idx].tier = parseInt(el.value);
    }

    rebuildCategories();
  };
}

// ===== 섹션 이미지 + 필터 =====
function loadSections(sections) {
  // 섹션 필터 드롭다운
  const sel = document.getElementById('section-filter');
  sel.innerHTML = '<option value="">전체 섹션</option>';
  sections.forEach(s => {
    if (s.productCount > 0) {
      sel.innerHTML += `<option value="${s.no}">섹션 ${s.no} (${s.productCount}개)</option>`;
    }
  });

  // 섹션 이미지 미리보기 (클릭 시 해당 섹션 필터)
  const wrap = document.getElementById('section-images');
  wrap.innerHTML = '';
  sections.forEach(s => {
    if (!s.img || !s.img.includes('UF_')) return; // 이미지 없는 섹션 스킵
    const img = document.createElement('img');
    img.src = s.img;
    img.title = `섹션 ${s.no} (${s.productCount}개)`;
    img.style.cssText = 'height:60px;border-radius:6px;cursor:pointer;flex-shrink:0;border:2px solid transparent;transition:border-color .2s;';
    img.onclick = () => {
      sel.value = s.no;
      sel.dispatchEvent(new Event('change'));
      // 선택 표시
      wrap.querySelectorAll('img').forEach(i => i.style.borderColor = 'transparent');
      img.style.borderColor = 'var(--accent)';
    };
    wrap.appendChild(img);
  });
}

// 검색 필터
document.getElementById('product-search').addEventListener('input', () => renderProductTable());
document.getElementById('section-filter').addEventListener('change', () => {
  // 섹션 이미지 하이라이트
  const no = document.getElementById('section-filter').value;
  document.querySelectorAll('#section-images img').forEach(img => {
    img.style.borderColor = img.title.includes(`섹션 ${no} `) ? 'var(--accent)' : 'transparent';
  });
  renderProductTable();
});

// 검색결과만 선택
document.getElementById('btn-select-filtered').addEventListener('click', () => {
  const rows = productTbody.querySelectorAll('tr');
  rows.forEach(tr => {
    if (tr.style.display !== 'none') {
      const idx = parseInt(tr.querySelector('.product-check')?.dataset.idx);
      if (!isNaN(idx)) state.products[idx].selected = true;
    }
  });
  renderProductTable();
});

document.getElementById('btn-show-all').addEventListener('click', () => {
  document.getElementById('product-search').value = '';
  document.getElementById('section-filter').value = '';
  document.querySelectorAll('#section-images img').forEach(i => i.style.borderColor = 'transparent');
  renderProductTable();
});

document.getElementById('btn-select-all').addEventListener('click', () => {
  state.products.forEach(p => p.selected = true);
  renderProductTable();
});

document.getElementById('btn-deselect-all').addEventListener('click', () => {
  state.products.forEach(p => p.selected = false);
  renderProductTable();
});

// AI 설명 생성
document.getElementById('btn-ai-desc').addEventListener('click', async () => {
  const selected = state.products.filter(p => p.selected);
  if (selected.length === 0) return alert('선택된 상품이 없습니다.');

  const btn = document.getElementById('btn-ai-desc');
  btn.disabled = true;
  btn.textContent = '생성 중...';

  try {
    const resp = await fetch('/api/generate-descriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products: selected }),
    });

    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error);

    // 결과 반영
    for (let i = 0; i < data.results.length; i++) {
      const r = data.results[i];
      const prod = selected[i];
      if (r.tagline) prod.tagline = r.tagline;
      if (r.description) prod.description = r.description;
      if (r.chips && r.chips.length > 0) prod.chips = r.chips;
    }

    renderProductTable();
    alert(`${data.results.length}개 상품의 설명이 생성되었습니다.`);
  } catch (err) {
    alert('AI 생성 실패: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'AI 설명 생성';
  }
});

function rebuildCategories() {
  const selectedProducts = state.products.filter(p => p.selected);

  // 고유 ID 기준으로 상품 매핑 (이름이 같아도 별개 카테고리 유지)
  const updated = [];
  for (const cat of state.categories) {
    const prods = selectedProducts.filter(p => p._catId === cat.id);
    if (prods.length > 0) {
      updated.push({ id: cat.id, name: cat.name, subtitle: cat.subtitle || '', sectionImg: cat.sectionImg || '', products: prods });
    }
  }

  // 미배정 상품
  const assigned = new Set(updated.flatMap(c => c.products));
  const unassigned = selectedProducts.filter(p => !assigned.has(p));
  if (unassigned.length > 0) {
    const etc = updated.find(c => c.name === '기타');
    if (etc) etc.products.push(...unassigned);
    else updated.push({ id: 'cat_etc', name: '기타', subtitle: '', products: unassigned });
  }

  state.categories = updated;
}

// ===== STEP 3: CATEGORY VIEW (버튼 순서 이동 + 아코디언) =====
const catWrap = document.getElementById('category-list');

function renderCategoryView() {
  rebuildCategories();
  catWrap.innerHTML = '';

  for (let ci = 0; ci < state.categories.length; ci++) {
    const cat = state.categories[ci];
    const tierLabel = (t) => t === 1 ? '풀' : t === 2 ? '그리드' : '마키';
    const tierClass = (t) => t === 1 ? 't1' : t === 2 ? 't2' : 't3';
    const isFirst = ci === 0;
    const isLast = ci === state.categories.length - 1;

    const row = document.createElement('div');
    row.className = 'cat-row';
    row.dataset.idx = ci;

    row.innerHTML = `
      <div class="cat-header">
        <div style="display:flex;flex-direction:column;gap:2px;margin-right:8px;">
          <button class="cat-move-btn" data-cat-move="${ci}" data-dir="-1" ${isFirst ? 'disabled' : ''}>▲</button>
          <button class="cat-move-btn" data-cat-move="${ci}" data-dir="1" ${isLast ? 'disabled' : ''}>▼</button>
        </div>
        ${cat.sectionImg ? `<img src="${esc(cat.sectionImg)}" style="height:36px;border-radius:4px;flex-shrink:0;" title="기획전 섹션 이미지">` : ''}
        <input class="cat-name-input" data-cat-name="${ci}" value="${esc(cat.name)}" style="font-size:15px;font-weight:700;border:1px solid transparent;border-radius:6px;padding:4px 8px;background:transparent;font-family:inherit;width:140px;transition:border-color .2s;" onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='transparent'">
        <span class="cat-count">${cat.products.length}개</span>
        <button class="cat-delete-btn" data-cat-delete="${ci}">삭제</button>
        <button class="cat-toggle" data-cat-toggle="${ci}">▲</button>
      </div>
      <div class="cat-detail open" id="cat-detail-${ci}">
        <div class="form-group" style="margin-bottom:12px;">
          <label>부제</label>
          <input type="text" data-cat-idx="${ci}" class="cat-subtitle" value="${esc(cat.subtitle || '')}" placeholder="예: 3개 이상 담으면 10% 할인 쿠폰 자동 적용">
        </div>
        <div class="cat-products">
          ${cat.products.map((p, pi) => {
            const prodIdx = state.products.indexOf(p);
            return `
            <div class="cat-prod-row">
              ${p.imageUrl ? `<img src="${esc(p.imageUrl)}" alt="">` : ''}
              <span class="cat-prod-name">${esc(p.name)}</span>
              <span class="cat-prod-price">${p.price ? p.price.toLocaleString() + '원' : ''}</span>
              <select class="cat-prod-move" data-prod-idx="${prodIdx}" style="font-size:11px;padding:2px 4px;border:1px solid var(--border);border-radius:4px;font-family:inherit;background:#fff;">
                ${state.categories.map(c => `<option value="${c.id}" ${c.id === cat.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
              </select>
            </div>`;
          }).join('')}
        </div>
      </div>
    `;
    catWrap.appendChild(row);
  }
}

// AI 테마명 추천
document.getElementById('btn-ai-theme').addEventListener('click', async () => {
  const btn = document.getElementById('btn-ai-theme');
  btn.disabled = true;
  btn.textContent = '생성 중...';

  try {
    const cats = state.categories.map(c => ({
      name: c.name,
      products: c.products.map(p => p.name),
    }));

    const resp = await fetch('/api/generate-themes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories: cats }),
    });

    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error);

    // 결과 반영
    for (let i = 0; i < data.results.length && i < state.categories.length; i++) {
      const r = data.results[i];
      if (r.theme) {
        state.categories[i].name = r.theme;
        state.categories[i].products.forEach(p => p.category = r.theme);
      }
      if (r.subtitle) state.categories[i].subtitle = r.subtitle;
    }

    renderCategoryView();
    alert('테마명이 생성되었습니다.');
  } catch (err) {
    alert('테마 생성 실패: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'AI 테마명 추천';
  }
});

// 클릭 이벤트 — 한 번만 등록
catWrap.addEventListener('click', (e) => {
  // 순서 이동
  const moveBtn = e.target.closest('[data-cat-move]');
  if (moveBtn) {
    const idx = parseInt(moveBtn.dataset.catMove);
    const dir = parseInt(moveBtn.dataset.dir);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= state.categories.length) return;
    [state.categories[idx], state.categories[newIdx]] = [state.categories[newIdx], state.categories[idx]];
    renderCategoryView();
    return;
  }

  // 삭제
  const delBtn = e.target.closest('[data-cat-delete]');
  if (delBtn) {
    e.stopPropagation();
    const idx = parseInt(delBtn.dataset.catDelete);
    const cat = state.categories[idx];
    if (!confirm(`"${cat.name}" 카테고리(${cat.products.length}개 상품)를 삭제할까요?`)) return;
    for (const p of cat.products) p.selected = false;
    state.categories.splice(idx, 1);
    renderCategoryView();
    renderProductTable();
    return;
  }

  // 아코디언 토글
  const togBtn = e.target.closest('[data-cat-toggle]');
  if (togBtn) {
    const idx = togBtn.dataset.catToggle;
    const detail = document.getElementById('cat-detail-' + idx);
    const isOpen = detail.classList.toggle('open');
    togBtn.textContent = isOpen ? '▲' : '▼';
    return;
  }
});

catWrap.addEventListener('input', (e) => {
  if (e.target.classList.contains('cat-subtitle')) {
    const idx = parseInt(e.target.dataset.catIdx);
    state.categories[idx].subtitle = e.target.value;
  }
  if (e.target.dataset.catName !== undefined) {
    const idx = parseInt(e.target.dataset.catName);
    const newName = e.target.value.trim();
    if (newName) {
      const oldName = state.categories[idx].name;
      state.categories[idx].name = newName;
      state.categories[idx].products.forEach(p => p.category = newName);
    }
  }
});

// 개별 상품 카테고리 이동
catWrap.addEventListener('change', (e) => {
  if (e.target.classList.contains('cat-prod-move')) {
    const prodIdx = parseInt(e.target.dataset.prodIdx);
    const newCatId = e.target.value;
    const targetCat = state.categories.find(c => c.id === newCatId);
    if (!isNaN(prodIdx) && state.products[prodIdx] && targetCat) {
      state.products[prodIdx]._catId = newCatId;
      state.products[prodIdx].category = targetCat.name;
      renderCategoryView();
    }
  }
});

// ===== STEP 4: PAGE TYPE =====
document.querySelectorAll('.page-type-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.page-type-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    state.pageType = card.dataset.type;
  });
});

// ===== STEP 4+: 실시간 미리보기 =====
// 글씨 크기 슬라이더
document.getElementById('set-font-size').addEventListener('input', (e) => {
  document.getElementById('fs-value').textContent = e.target.value;
});

// 글씨체 미리보기
const FONT_MAP = {
  'noto-sans': { title: "'Noto Serif KR', serif", body: "'Noto Sans KR', sans-serif" },
  'noto-serif': { title: "'Noto Serif KR', serif", body: "'Noto Serif KR', serif" },
  'pretendard': { title: "'Pretendard Variable', sans-serif", body: "'Pretendard Variable', sans-serif" },
  'gmarket': { title: "'GmarketSans', sans-serif", body: "'GmarketSans', sans-serif" },
  'nanumgothic': { title: "'Nanum Gothic', sans-serif", body: "'Nanum Gothic', sans-serif" },
  'nanummyeongjo': { title: "'Nanum Myeongjo', serif", body: "'Nanum Myeongjo', serif" },
};

document.getElementById('set-font-family').addEventListener('change', (e) => {
  const fm = FONT_MAP[e.target.value] || FONT_MAP['noto-sans'];
  document.getElementById('font-preview-title').style.fontFamily = fm.title;
  document.getElementById('font-preview-body').style.fontFamily = fm.body;
});

// 프로모션 이미지 업로드 (base64 변환)
document.getElementById('set-promo-images').addEventListener('change', (e) => {
  const preview = document.getElementById('promo-image-preview');
  const files = Array.from(e.target.files);

  for (const file of files) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target.result;
      state.meta.promoImages.push(b64);

      // 미리보기 썸네일
      const wrap = document.createElement('div');
      wrap.style.cssText = 'position:relative;width:80px;height:80px;';
      const img = document.createElement('img');
      img.src = b64;
      img.style.cssText = 'width:80px;height:80px;object-fit:cover;border-radius:8px;';
      const del = document.createElement('button');
      del.textContent = '×';
      del.style.cssText = 'position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;background:#c44;color:#fff;border:none;cursor:pointer;font-size:12px;line-height:1;';
      del.onclick = () => {
        const idx = state.meta.promoImages.indexOf(b64);
        if (idx > -1) state.meta.promoImages.splice(idx, 1);
        wrap.remove();
      };
      wrap.appendChild(img);
      wrap.appendChild(del);
      preview.appendChild(wrap);
    };
    reader.readAsDataURL(file);
  }
});

function collectMeta() {
  state.meta.weekNumber = document.getElementById('set-week').value;
  state.meta.period = document.getElementById('set-period').value;
  state.meta.couponText = document.getElementById('set-coupon').value;
  state.meta.planUrl = document.getElementById('set-plan-url').value || state.meta.planUrl;
  state.meta.heroTitle = document.getElementById('set-hero-title').value;
  state.meta.heroSub = document.getElementById('set-hero-sub').value;
  state.meta.filename = document.getElementById('set-filename').value;
  state.meta.baseFontSize = parseInt(document.getElementById('set-font-size').value) || 16;
  state.meta.fontFamily = document.getElementById('set-font-family').value;
  state.meta.promoTitle = document.getElementById('set-promo-title').value;
  state.meta.promoDesc = document.getElementById('set-promo-desc').value;
  state.meta.promoNotices = document.getElementById('set-promo-notices').value;
  // promoImages는 파일 선택 시 이미 state에 저장됨

  if (!state.meta.filename) {
    if (state.pageType === 'weekly-overview' && state.meta.weekNumber) {
      state.meta.filename = `dure_plan_w${state.meta.weekNumber}.html`;
    } else {
      state.meta.filename = `dure_promo_${new Date().toISOString().slice(0, 10)}.html`;
    }
  }
}

function buildData() {
  collectMeta();
  rebuildCategories();
  return {
    meta: { ...state.meta, title: state.meta.title },
    categories: state.categories,
  };
}

async function refreshPreview() {
  const data = buildData();
  const frame = document.getElementById('preview-frame');

  try {
    const resp = await fetch('/api/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: state.pageType, data }),
    });

    const html = await resp.text();
    state.generatedHtml = html;

    // Write to iframe
    frame.srcdoc = html;
  } catch (err) {
    console.error('미리보기 실패:', err);
  }
}

document.getElementById('btn-refresh-preview').addEventListener('click', refreshPreview);

// Device toggle
document.querySelectorAll('.device-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.device-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const frame = document.getElementById('preview-frame');
    frame.classList.toggle('mobile', btn.dataset.device === 'mobile');
  });
});

// Save
document.getElementById('btn-save').addEventListener('click', async () => {
  collectMeta();
  if (!state.generatedHtml) await refreshPreview();

  const saveStatus = document.getElementById('save-status');
  try {
    const resp = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: state.meta.filename,
        html: state.generatedHtml,
      }),
    });

    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error);

    saveStatus.innerHTML = `<div class="status-msg success" style="margin-top:8px;">저장 완료: ${data.path}</div>`;
  } catch (err) {
    saveStatus.innerHTML = `<div class="status-msg error" style="margin-top:8px;">${err.message}</div>`;
  }
});

// Copy HTML
document.getElementById('btn-copy-html').addEventListener('click', async () => {
  if (!state.generatedHtml) await refreshPreview();
  await navigator.clipboard.writeText(state.generatedHtml);
  alert('HTML이 클립보드에 복사되었습니다.');
});

// Open in new tab
document.getElementById('btn-new-tab').addEventListener('click', () => {
  if (!state.generatedHtml) return;
  const win = window.open('', '_blank');
  win.document.write(state.generatedHtml);
  win.document.close();
});

// ===== UTIL =====
function esc(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function formatPrice(n) {
  return n ? n.toLocaleString() + '원' : '—';
}

// Init: populate planUrl field when going to step 4
const origGoToStep = goToStep;
// Override is inline already — the settings fields sync on step 4 entry via collectMeta on preview
