/* 青魚工具箱 — 共用邏輯 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* 離線快取非必要功能，註冊失敗不影響使用 */
    });
  });
}

function showToast(msg, ms = 2200) {
  let el = document.getElementById('aoyu-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'aoyu-toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), ms);
}

function fmtTime(sec) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
