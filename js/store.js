/* 青魚工具箱 — 工具商店邏輯
   注意：這是純前端的「趣味代碼鎖」，代碼寫在這支檔案裡，
   適合自用／分享給朋友的小遊戲感兌換，並非真正的付費或安全機制。
   想換代碼，直接改下面 STORE_ITEMS 的 code 欄位即可。 */
(() => {
  const STORE_ITEMS = [
    {
      id: 'pomodoro',
      icon: '🍅',
      name: '番茄鐘',
      desc: '25 分鐘專注、5 分鐘休息，內建循環與提示音',
      file: './tool-pomodoro.html',
      code: 'AOYU-TOMATO',
    },
    {
      id: 'noise',
      icon: '🌊',
      name: '海浪白噪音',
      desc: '海浪聲、白噪音、粉紅噪音，專注或入睡都好用',
      file: './tool-noise.html',
      code: 'AOYU-WAVE',
    },
    {
      id: 'dice',
      icon: '🎲',
      name: '骰子＆抽籤',
      desc: '擲骰子，或貼上名單讓它幫你抽一個',
      file: './tool-dice.html',
      code: 'AOYU-DICE',
    },
    {
      id: 'password',
      icon: '🔐',
      name: '密碼產生器',
      desc: '自訂長度與字元組合，一鍵複製',
      file: './tool-password.html',
      code: 'AOYU-LOCK',
    },
    {
      id: 'unit',
      icon: '📏',
      name: '單位換算器',
      desc: '長度、重量、溫度，常用單位快速換算',
      file: './tool-unit.html',
      code: 'AOYU-UNIT',
    },
    {
      id: 'bmi',
      icon: '⚖️',
      name: 'BMI 小算盤',
      desc: '輸入身高體重，馬上知道 BMI 落在哪個區間',
      file: './tool-bmi.html',
      code: 'AOYU-BMI',
    },
  ];

  const STORAGE_KEY = 'aoyu-store-unlocked';
  const grid = document.getElementById('storeGrid');
  const resetBtn = document.getElementById('resetUnlock');

  function getUnlocked() {
    try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); }
    catch (e) { return new Set(); }
  }
  function saveUnlocked(set) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  }

  function render() {
    const unlocked = getUnlocked();
    grid.innerHTML = '';
    STORE_ITEMS.forEach((item) => {
      const isUnlocked = unlocked.has(item.id);
      const card = document.createElement('div');
      card.className = 'store-card' + (isUnlocked ? ' unlocked' : '');
      card.innerHTML = `
        <div class="store-card-head">
          <div class="icon">${item.icon}</div>
          <div>
            <div class="title">${item.name}</div>
            <div class="badge">${isUnlocked ? '✅ 已解鎖' : '🔒 尚未解鎖'}</div>
          </div>
        </div>
        <div class="desc">${item.desc}</div>
        ${isUnlocked ? `
          <a class="btn" download href="${item.file}">下載工具</a>
          <a class="btn ghost" href="${item.file}" target="_blank" rel="noopener">預覽</a>
        ` : `
          <div class="code-row">
            <input type="text" placeholder="輸入兌換代碼" data-id="${item.id}" class="code-input">
            <button class="btn" type="button" data-redeem="${item.id}">兌換</button>
          </div>
        `}
      `;
      grid.appendChild(card);
    });

    grid.querySelectorAll('[data-redeem]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.redeem;
        const input = grid.querySelector(`.code-input[data-id="${id}"]`);
        const item = STORE_ITEMS.find((x) => x.id === id);
        const val = (input.value || '').trim().toUpperCase();
        if (val && item && val === item.code.toUpperCase()) {
          const set = getUnlocked();
          set.add(id);
          saveUnlocked(set);
          showToast(`🎉 已解鎖「${item.name}」`);
          render();
        } else {
          showToast('代碼不正確，再試一次');
          input.value = '';
          input.focus();
        }
      });
    });

    grid.querySelectorAll('.code-input').forEach((input) => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          grid.querySelector(`[data-redeem="${input.dataset.id}"]`).click();
        }
      });
    });
  }

  resetBtn.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    render();
    showToast('已清除解鎖紀錄');
  });

  render();
})();
