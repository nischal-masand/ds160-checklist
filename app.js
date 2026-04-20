// ============================================
// DS-160 Document Checklist — Application Logic
// B1/B2 Visa · Figma Config · Company Sponsored
// ============================================

let CHECKLIST_DATA = [];


// ============================================
// State Management
// ============================================

const STORAGE_KEY = 'ds160-checklist-state';

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage might be unavailable
  }
}

let checkedState = loadState();


// ============================================
// Render Functions
// ============================================

function getItemKey(categoryId, itemIndex) {
  return `${categoryId}__${itemIndex}`;
}

function isItemChecked(categoryId, itemIndex) {
  return !!checkedState[getItemKey(categoryId, itemIndex)];
}

function getCategoryStats(category) {
  const total = category.items.length;
  let checked = 0;
  category.items.forEach((_, i) => {
    if (isItemChecked(category.id, i)) checked++;
  });
  return { total, checked };
}

function getTotalStats() {
  let total = 0;
  let checked = 0;
  CHECKLIST_DATA.forEach((cat) => {
    const stats = getCategoryStats(cat);
    total += stats.total;
    checked += stats.checked;
  });
  return { total, checked };
}

function renderCheckSvg() {
  return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
}

function renderChevronSvg() {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
}

function renderCategory(category, index) {
  const stats = getCategoryStats(category);
  const isComplete = stats.checked === stats.total;

  const itemsHtml = category.items.map((item, i) => {
    const checked = isItemChecked(category.id, i);
    return `
      <div class="checklist-item ${checked ? 'checked' : ''}"
           data-category="${category.id}"
           data-index="${i}"
           id="item-${category.id}-${i}">
        <div class="item-checkbox">
          ${renderCheckSvg()}
        </div>
        <div class="item-content">
          <div class="item-label">${item.label}</div>
        </div>
        ${item.tag ? `<span class="item-tag ${item.tag}">${item.tag}</span>` : ''}
      </div>
    `;
  }).join('');

  return `
    <div class="category open ${isComplete ? 'complete' : ''}"
         data-theme="${category.theme}"
         data-id="${category.id}"
         id="category-${category.id}"
         style="animation-delay: ${0.05 * index}s">
      <div class="category-header" id="header-${category.id}">
        <div class="category-icon">${category.icon}</div>
        <div class="category-info">
          <div class="category-name">${category.name}</div>
          <div class="category-desc">${category.description}</div>
        </div>
        <div class="category-counter" id="counter-${category.id}">${stats.checked}/${stats.total}</div>
        <div class="category-chevron">${renderChevronSvg()}</div>
      </div>
      <div class="category-items">
        <div class="items-list">
          ${itemsHtml}
        </div>
      </div>
    </div>
  `;
}

function renderAll() {
  const container = document.getElementById('checklist-container');
  container.innerHTML = CHECKLIST_DATA.map((cat, i) => renderCategory(cat, i)).join('');
  updateGlobalProgress();
  bindItemEvents();
  bindCategoryEvents();
}

function updateGlobalProgress() {
  const { total, checked } = getTotalStats();
  document.getElementById('progress-text').textContent = `${checked} of ${total} collected`;
  document.getElementById('category-count').textContent = `${CHECKLIST_DATA.length} categories`;

  const percent = total > 0 ? (checked / total) * 100 : 0;

  // Update floating progress bar
  const floatingBar = document.getElementById('floating-progress-bar');
  if (floatingBar) floatingBar.style.width = `${percent}%`;

  const floatingText = document.getElementById('floating-progress-text');
  if (floatingText) floatingText.textContent = `${checked} of ${total} collected`;

  // Update dot colors
  document.querySelectorAll('.chip-dot').forEach(dot => {
    if (percent === 100) {
      dot.style.background = 'var(--accent-emerald)';
    } else if (percent > 0) {
      dot.style.background = 'var(--accent-amber)';
    } else {
      dot.style.background = 'var(--text-muted)';
    }
  });

  // 🎉 Easter egg: celebrate at 100%
  if (percent === 100 && total > 0) {
    setTimeout(() => showEasterEgg(), 400);
  }
}


// ============================================
// 🎉 Easter Egg — Confetti + Modal
// ============================================

let easterEggShown = false;

function showEasterEgg() {
  if (easterEggShown) return;
  easterEggShown = true;
  launchConfetti();
  setTimeout(() => showCelebrationModal(), 600);
}

function launchConfetti() {
  const canvas = document.createElement('canvas');
  canvas.id = 'confetti-canvas';
  canvas.style.cssText = 'position:fixed;inset:0;z-index:10000;pointer-events:none;';
  document.body.appendChild(canvas);
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const ctx = canvas.getContext('2d');
  const particles = [];
  const colors = ['#5e6ad2', '#8c72e6', '#1fae62', '#e59c14', '#d64d50', '#22d3ee', '#f472b6', '#fb923c', '#FFD700', '#FF6B6B', '#fff'];

  for (let i = 0; i < 200; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    particles.push({
      x: Math.random() * canvas.width,
      y: -Math.random() * canvas.height * 0.6 - 20,
      w: Math.random() * 8 + 4,
      h: Math.random() * 5 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: Math.cos(angle) * speed * 0.4,
      vy: Math.random() * 0.8 + 0.3,
      gravity: 0.012 + Math.random() * 0.008,
      drag: 0.98 + Math.random() * 0.015,
      rot: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 3,
      // Flutter: sinusoidal sway
      swayAmp: Math.random() * 1.5 + 0.5,
      swayFreq: Math.random() * 0.03 + 0.01,
      swayOffset: Math.random() * Math.PI * 2,
      // Wobble: 3D tilt illusion
      wobbleFreq: Math.random() * 0.06 + 0.02,
      wobbleOffset: Math.random() * Math.PI * 2,
      opacity: 1,
      life: 0,
    });
  }

  let frame = 0;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;

    particles.forEach(p => {
      p.life++;

      // Gravity with terminal velocity
      p.vy += p.gravity;
      if (p.vy > 2.5) p.vy = 2.5;

      // Air drag
      p.vx *= p.drag;

      // Sinusoidal sway (wind drift)
      p.x += p.vx + Math.sin(p.life * p.swayFreq + p.swayOffset) * p.swayAmp;
      p.y += p.vy;

      // Rotation slows over time
      p.rot += p.rotSpeed * (1 - p.life * 0.001);

      // 3D wobble — squash width to simulate flipping
      const wobble = Math.cos(p.life * p.wobbleFreq + p.wobbleOffset);
      const displayW = p.w * Math.abs(wobble);

      // Fade out late
      if (frame > 350) p.opacity -= 0.004;
      if (p.y > canvas.height + 20 || p.opacity <= 0) return;

      alive = true;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;
      ctx.fillRect(-displayW / 2, -p.h / 2, displayW, p.h);
      ctx.restore();
    });

    frame++;
    if (alive && frame < 600) {
      requestAnimationFrame(animate);
    } else {
      canvas.remove();
    }
  }
  requestAnimationFrame(animate);
}

function showCelebrationModal() {
  const existing = document.getElementById('easter-egg-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'easter-egg-modal';
  overlay.innerHTML = `
    <div class="ee-backdrop"></div>
    <div class="ee-content">
      <img src="easter-egg.png" alt="See you soon!" class="ee-image" />
      <button class="ee-close" id="ee-close-btn">Nice! 🎉</button>
    </div>
  `;
  document.body.appendChild(overlay);

  // Animate in
  requestAnimationFrame(() => {
    overlay.classList.add('visible');
  });

  // Close handlers
  overlay.querySelector('.ee-backdrop').addEventListener('click', closeEasterEgg);
  overlay.querySelector('#ee-close-btn').addEventListener('click', closeEasterEgg);
}

function closeEasterEgg() {
  const modal = document.getElementById('easter-egg-modal');
  if (modal) {
    modal.classList.remove('visible');
    setTimeout(() => modal.remove(), 300);
  }
}

function updateCategoryState(categoryId) {
  const category = CHECKLIST_DATA.find((c) => c.id === categoryId);
  if (!category) return;

  const stats = getCategoryStats(category);
  const isComplete = stats.checked === stats.total;

  const counter = document.getElementById(`counter-${categoryId}`);
  if (counter) counter.textContent = `${stats.checked}/${stats.total}`;

  const catEl = document.getElementById(`category-${categoryId}`);
  if (catEl) {
    catEl.classList.toggle('complete', isComplete);
  }

  updateGlobalProgress();
}


// ============================================
// Event Handlers
// ============================================

function bindItemEvents() {
  document.querySelectorAll('.checklist-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      const categoryId = item.dataset.category;
      const index = parseInt(item.dataset.index, 10);
      const key = getItemKey(categoryId, index);

      const nowChecked = !checkedState[key];
      checkedState[key] = nowChecked;
      saveState(checkedState);

      item.classList.toggle('checked', nowChecked);

      if (nowChecked) {
        item.classList.add('just-checked');
        setTimeout(() => item.classList.remove('just-checked'), 400);
      }

      updateCategoryState(categoryId);
    });
  });
}

function bindCategoryEvents() {
  document.querySelectorAll('.category-header').forEach((header) => {
    header.addEventListener('click', (e) => {
      // Don't toggle if clicking a checkbox
      if (e.target.closest('.checklist-item')) return;
      const category = header.closest('.category');
      category.classList.toggle('open');
    });
  });
}

function expandAll() {
  document.querySelectorAll('.category').forEach((c) => c.classList.add('open'));
}

function collapseAll() {
  document.querySelectorAll('.category').forEach((c) => c.classList.remove('open'));
}

function resetAll() {
  if (!confirm('Reset all checkboxes? This will clear your progress.')) return;
  checkedState = {};
  saveState(checkedState);
  renderAll();
}

function showToast(message) {
  const toast = document.getElementById('toast');
  const text = document.getElementById('toast-text');
  text.textContent = message;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 2500);
}

function shareChecklist() {
  // Generate shareable text
  const lines = ['📋 DS-160 Document Checklist — B1/B2 Visa for Figma Config', ''];

  CHECKLIST_DATA.forEach((cat) => {
    const stats = getCategoryStats(cat);
    lines.push(`${cat.icon} ${cat.name} (${stats.checked}/${stats.total})`);
    cat.items.forEach((item, i) => {
      const checked = isItemChecked(cat.id, i);
      const box = checked ? '☑' : '☐';
      const tag = item.tag ? ` [${item.tag.toUpperCase()}]` : '';
      lines.push(`  ${box} ${item.label}${tag}`);
    });
    lines.push('');
  });

  const { total, checked } = getTotalStats();
  lines.push(`—————————————————`);
  lines.push(`Progress: ${checked}/${total} documents collected`);

  const text = lines.join('\n');

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Checklist copied to clipboard!');
    }).catch(() => {
      fallbackCopy(text);
    });
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    showToast('Checklist copied to clipboard!');
  } catch {
    showToast('Could not copy — please copy manually.');
  }
  document.body.removeChild(ta);
}

function printChecklist() {
  // Expand all before printing
  expandAll();
  setTimeout(() => window.print(), 200);
}


// ============================================
// Initialize
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('./data.json');
    CHECKLIST_DATA = await response.json();
    renderAll();
  } catch (error) {
    console.error('Failed to load checklist data:', error);
    document.getElementById('checklist-container').innerHTML = '<p style="text-align:center; padding: 40px; color: var(--accent-rose);">Failed to load checklist. Please start the server using <br><code>node server.js</code></p>';
  }

  document.getElementById('btn-expand-all').addEventListener('click', expandAll);
  document.getElementById('btn-collapse-all').addEventListener('click', collapseAll);
  document.getElementById('btn-reset').addEventListener('click', resetAll);
  document.getElementById('btn-share').addEventListener('click', shareChecklist);
  document.getElementById('btn-print').addEventListener('click', printChecklist);

  // Floating bar: show on scroll, hide at top
  const floatingEl = document.getElementById('floating-progress');
  if (floatingEl) {
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY > 150;
      floatingEl.classList.toggle('visible', scrolled);
      floatingEl.classList.toggle('scrolled', scrolled);
    }, { passive: true });
  }
});
