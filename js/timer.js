/* 青魚工具箱 — 計時器邏輯 */
(() => {
  const display = document.getElementById('display');
  const presets = document.getElementById('presets');
  const customMin = document.getElementById('customMin');
  const setCustom = document.getElementById('setCustom');
  const startBtn = document.getElementById('startBtn');
  const startIcon = document.getElementById('startIcon');
  const resetBtn = document.getElementById('resetBtn');
  const statusHint = document.getElementById('statusHint');
  const beepToggleBtn = document.getElementById('beepToggleBtn');
  const beepIcon = document.getElementById('beepIcon');

  const ICON_PLAY = '<path d="M8 5v14l11-7z"/>';
  const ICON_PAUSE = '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>';

  let totalSeconds = 5 * 60;
  let remaining = totalSeconds;
  let running = false;
  let tickHandle = null;
  let lastTs = 0;
  let soundOn = true;

  function render() {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    display.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  presets.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-min]');
    if (!btn || running) return;
    [...presets.children].forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    totalSeconds = Number(btn.dataset.min) * 60;
    remaining = totalSeconds;
    render();
  });

  setCustom.addEventListener('click', () => {
    const v = Math.round(Number(customMin.value));
    if (!v || v <= 0 || v > 999) { showToast('請輸入 1–999 之間的分鐘數'); return; }
    [...presets.children].forEach(b => b.classList.remove('active'));
    totalSeconds = v * 60;
    remaining = totalSeconds;
    render();
    showToast(`已設定為 ${v} 分鐘`);
  });

  function tick(ts) {
    if (!running) return;
    if (!lastTs) lastTs = ts;
    const delta = ts - lastTs;
    if (delta >= 1000) {
      lastTs = ts;
      remaining = Math.max(0, remaining - 1);
      render();
      if (remaining === 0) {
        finish();
        return;
      }
    }
    tickHandle = requestAnimationFrame(tick);
  }

  function start() {
    if (remaining <= 0) { remaining = totalSeconds; }
    running = true;
    lastTs = 0;
    startIcon.innerHTML = ICON_PAUSE;
    statusHint.textContent = '計時中…';
    tickHandle = requestAnimationFrame(tick);
  }
  function pause() {
    running = false;
    cancelAnimationFrame(tickHandle);
    startIcon.innerHTML = ICON_PLAY;
    statusHint.textContent = '已暫停';
  }
  function finish() {
    running = false;
    cancelAnimationFrame(tickHandle);
    startIcon.innerHTML = ICON_PLAY;
    statusHint.textContent = '時間到！';
    if (soundOn) playBeep();
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    showToast('⏰ 時間到囉');
  }

  startBtn.addEventListener('click', () => {
    if (running) pause(); else start();
  });
  resetBtn.addEventListener('click', () => {
    pause();
    remaining = totalSeconds;
    render();
    statusHint.textContent = '設定好時間後按下開始';
  });

  beepToggleBtn.addEventListener('click', () => {
    soundOn = !soundOn;
    beepIcon.textContent = soundOn ? '🔔' : '🔕';
    showToast(soundOn ? '提示音已開啟' : '提示音已靜音');
  });

  // 用 Web Audio API 產生提示音，不需要外部音檔
  let audioCtx = null;
  function playBeep() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const now = audioCtx.currentTime;
      [0, 0.35, 0.7].forEach((offset, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = i === 2 ? 880 : 660;
        gain.gain.setValueAtTime(0.0001, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.3, now + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.28);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.3);
      });
    } catch (e) { /* 靜音環境或不支援時忽略 */ }
  }

  render();
})();
