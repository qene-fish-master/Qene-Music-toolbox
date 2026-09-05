/* 青魚工具箱 — 播放器邏輯 */
(() => {
  const fileInput = document.getElementById('fileInput');
  const uploadZone = document.getElementById('uploadZone');
  const playlistEl = document.getElementById('playlist');
  const emptyNote = document.getElementById('emptyNote');

  const mediaEl = document.getElementById('mediaEl');
  const stageKaraoke = document.getElementById('stageKaraoke');
  const stageBgEls = document.querySelectorAll('.stage-bg');
  const disc = document.getElementById('disc');
  const nowTitle = document.getElementById('nowTitle');
  const nowSub = document.getElementById('nowSub');

  const seek = document.getElementById('seek');
  const curTime = document.getElementById('curTime');
  const durTime = document.getElementById('durTime');
  const playBtn = document.getElementById('playBtn');
  const playIcon = document.getElementById('playIcon');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  const modeSegment = document.getElementById('modeSegment');
  const loopToggle = document.getElementById('loopToggle');
  const bgModeHint = document.getElementById('bgModeHint');
  const karaokeModeHint = document.getElementById('karaokeModeHint');
  const wakeNote = document.getElementById('wakeNote');

  const ICON_PLAY = '<path d="M8 5v14l11-7z"/>';
  const ICON_PAUSE = '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>';

  let tracks = []; // {id, name, mime, blob}
  let currentIndex = -1;
  let mode = 'bg'; // 'bg' | 'karaoke'
  let wakeLock = null;
  let objectUrl = null;

  // ---------- 初始化：讀取已儲存的播放清單 ----------
  async function init() {
    tracks = await AoyuDB.getAll();
    renderPlaylist();
    if (tracks.length) {
      loadTrack(0, { autoplay: false });
    }
  }

  // ---------- 匯入檔案 ----------
  uploadZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []);
    for (const f of files) {
      const rec = await AoyuDB.addFile(f);
      tracks.push(rec);
    }
    fileInput.value = '';
    renderPlaylist();
    if (currentIndex === -1 && tracks.length) loadTrack(0, { autoplay: false });
    showToast(`已加入 ${files.length} 個檔案`);
  });

  ['dragover', 'dragleave', 'drop'].forEach(evt => {
    uploadZone.addEventListener(evt, (e) => {
      e.preventDefault();
      uploadZone.classList.toggle('drag', evt === 'dragover');
    });
  });
  uploadZone.addEventListener('drop', async (e) => {
    const files = Array.from(e.dataTransfer.files || []).filter(f => /^(video|audio)\//.test(f.type));
    for (const f of files) {
      const rec = await AoyuDB.addFile(f);
      tracks.push(rec);
    }
    renderPlaylist();
    if (currentIndex === -1 && tracks.length) loadTrack(0, { autoplay: false });
  });

  // ---------- 播放清單 UI ----------
  function renderPlaylist() {
    playlistEl.innerHTML = '';
    emptyNote.style.display = tracks.length ? 'none' : 'block';
    tracks.forEach((t, i) => {
      const row = document.createElement('div');
      row.className = 'track-row' + (i === currentIndex ? ' playing' : '');
      const isVideo = (t.mime || '').startsWith('video');
      row.innerHTML = `
        <div class="num">${i === currentIndex ? '🎵' : i + 1}</div>
        <div class="meta">
          <div class="name">${escapeHtml(t.name)}</div>
          <div class="type">${isVideo ? '影片' : '音檔'}</div>
        </div>
        <button class="del" aria-label="移除" data-id="${t.id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>`;
      row.addEventListener('click', (e) => {
        if (e.target.closest('.del')) return;
        loadTrack(i, { autoplay: true });
      });
      row.querySelector('.del').addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = e.currentTarget.dataset.id;
        await AoyuDB.removeFile(id);
        const idx = tracks.findIndex(t => t.id === id);
        if (idx === currentIndex) {
          mediaEl.pause();
          mediaEl.removeAttribute('src');
          currentIndex = -1;
        } else if (idx < currentIndex) {
          currentIndex--;
        }
        tracks.splice(idx, 1);
        renderPlaylist();
      });
      playlistEl.appendChild(row);
    });
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ---------- 載入 / 播放曲目 ----------
  function loadTrack(index, { autoplay }) {
    if (index < 0 || index >= tracks.length) return;
    currentIndex = index;
    const t = tracks[index];
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(t.blob);
    mediaEl.src = objectUrl;
    mediaEl.loop = false;

    nowTitle.textContent = t.name;
    nowSub.textContent = mode === 'bg' ? '背景播放中' : '卡拉OK模式';
    renderPlaylist();
    updateMediaSession(t);

    if (autoplay) {
      mediaEl.play().catch(() => showToast('請先點一下播放鍵'));
    }
  }

  function playPause() {
    if (currentIndex === -1) {
      if (tracks.length) loadTrack(0, { autoplay: true });
      return;
    }
    if (mediaEl.paused) mediaEl.play().catch(() => showToast('無法播放，請重試'));
    else mediaEl.pause();
  }

  function playNext(auto) {
    if (!tracks.length) return;
    let next = currentIndex + 1;
    if (next >= tracks.length) {
      if (loopToggle.checked) next = 0;
      else { mediaEl.pause(); return; }
    }
    loadTrack(next, { autoplay: true });
  }
  function playPrev() {
    if (!tracks.length) return;
    let prev = currentIndex - 1;
    if (prev < 0) prev = loopToggle.checked ? tracks.length - 1 : 0;
    loadTrack(prev, { autoplay: true });
  }

  playBtn.addEventListener('click', playPause);
  nextBtn.addEventListener('click', () => playNext(false));
  prevBtn.addEventListener('click', playPrev);

  mediaEl.addEventListener('play', () => {
    playIcon.innerHTML = ICON_PAUSE;
    disc.classList.add('spin');
    nowSub.textContent = mode === 'bg' ? '背景播放中' : '卡拉OK模式播放中';
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
  });
  mediaEl.addEventListener('pause', () => {
    playIcon.innerHTML = ICON_PLAY;
    disc.classList.remove('spin');
    if (currentIndex !== -1) nowSub.textContent = '已暫停';
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
  });
  mediaEl.addEventListener('ended', () => playNext(true));
  mediaEl.addEventListener('timeupdate', () => {
    if (!isFinite(mediaEl.duration)) return;
    seek.max = mediaEl.duration;
    seek.value = mediaEl.currentTime;
    curTime.textContent = fmtTime(mediaEl.currentTime);
    durTime.textContent = fmtTime(mediaEl.duration);
  });
  seek.addEventListener('input', () => {
    mediaEl.currentTime = Number(seek.value);
  });

  // ---------- 模式切換：背景播放 / 卡拉OK ----------
  modeSegment.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-mode]');
    if (!btn) return;
    setMode(btn.dataset.mode);
  });

  function setMode(newMode) {
    mode = newMode;
    [...modeSegment.querySelectorAll('button')].forEach(b => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });
    bgModeHint.style.display = mode === 'bg' ? 'block' : 'none';
    karaokeModeHint.style.display = mode === 'karaoke' ? 'block' : 'none';

    if (mode === 'karaoke') {
      stageKaraoke.style.display = 'block';
      stageBgEls[0].style.display = 'none';
      requestWakeLock();
    } else {
      stageKaraoke.style.display = 'none';
      stageBgEls[0].style.display = 'flex';
      releaseWakeLock();
    }
    if (currentIndex !== -1) {
      nowSub.textContent = mediaEl.paused ? '已暫停' : (mode === 'bg' ? '背景播放中' : '卡拉OK模式播放中');
    }
  }

  loopToggle.addEventListener('change', () => {
    showToast(loopToggle.checked ? '已開啟循環播放' : '已關閉循環播放');
  });

  // 卡拉OK模式下畫面被切走（例如切 App）就暫停，並提醒使用者
  document.addEventListener('visibilitychange', () => {
    if (mode === 'karaoke' && document.hidden && !mediaEl.paused) {
      mediaEl.pause();
      showToast('卡拉OK模式離開畫面已暫停，回來後請按播放');
    }
    if (mode === 'karaoke' && !document.hidden) requestWakeLock();
  });

  // ---------- Screen Wake Lock（卡拉OK模式保持螢幕亮著）----------
  async function requestWakeLock() {
    if (!('wakeLock' in navigator)) return;
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeNote.style.display = 'flex';
      wakeLock.addEventListener('release', () => { wakeNote.style.display = 'none'; });
    } catch (e) {
      wakeNote.style.display = 'none';
    }
  }
  function releaseWakeLock() {
    if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
    wakeNote.style.display = 'none';
  }

  // ---------- Media Session（鎖定畫面／通知列控制，背景播放的關鍵）----------
  function updateMediaSession(track) {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.name,
      artist: '青魚工具箱',
      album: mode === 'karaoke' ? '卡拉OK模式' : '背景播放',
      artwork: [
        { src: './icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: './icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    });
    navigator.mediaSession.setActionHandler('play', () => mediaEl.play());
    navigator.mediaSession.setActionHandler('pause', () => mediaEl.pause());
    navigator.mediaSession.setActionHandler('previoustrack', playPrev);
    navigator.mediaSession.setActionHandler('nexttrack', () => playNext(false));
    navigator.mediaSession.setActionHandler('seekto', (d) => {
      if (d.seekTime != null) mediaEl.currentTime = d.seekTime;
    });
  }

  setMode('bg');
  init();
})();
