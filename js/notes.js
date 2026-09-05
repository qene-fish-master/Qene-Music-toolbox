/* 青魚工具箱 — 隨手記邏輯（存在 localStorage） */
(() => {
  const KEY = 'aoyu-notes';
  const noteInput = document.getElementById('noteInput');
  const saveBtn = document.getElementById('saveBtn');
  const noteList = document.getElementById('noteList');
  const emptyNote = document.getElementById('emptyNote');

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch (e) { return []; }
  }
  function save(notes) {
    localStorage.setItem(KEY, JSON.stringify(notes));
  }

  function fmtDate(ts) {
    const d = new Date(ts);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function render() {
    const notes = load();
    noteList.innerHTML = '';
    emptyNote.style.display = notes.length ? 'none' : 'block';
    notes.slice().reverse().forEach((n) => {
      const card = document.createElement('div');
      card.className = 'note-card';
      card.innerHTML = `
        <div class="text"></div>
        <div class="foot">
          <time></time>
          <button type="button">刪除</button>
        </div>`;
      card.querySelector('.text').textContent = n.text;
      card.querySelector('time').textContent = fmtDate(n.ts);
      card.querySelector('button').addEventListener('click', () => {
        const rest = load().filter(x => x.id !== n.id);
        save(rest);
        render();
      });
      noteList.appendChild(card);
    });
  }

  saveBtn.addEventListener('click', () => {
    const text = noteInput.value.trim();
    if (!text) { showToast('先寫點東西吧'); return; }
    const notes = load();
    notes.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, text, ts: Date.now() });
    save(notes);
    noteInput.value = '';
    render();
    showToast('已儲存');
  });

  render();
})();
