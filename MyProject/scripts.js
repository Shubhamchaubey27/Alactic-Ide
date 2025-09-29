document.addEventListener('DOMContentLoaded', () => {
  const codeArea = document.querySelector('.code-area');
  const lineNumbers = document.querySelector('.line-numbers');
  const addTabBtn = document.querySelector('.add-tab');
  const newFileBtn = document.getElementById('newFileBtn');
  const saveFileBtn = document.getElementById('saveFileBtn');
  const openFileBtn = document.querySelector('button.btn:nth-of-type(3)'); // your Open File button
  const STORAGE_PREFIX = 'alactic_';

  let tabCounter = 4;
  const tabContents = {}; // in-memory contents

  // helper: get tab name from a .tab element
  function getTabName(tabEl) {
    if (!tabEl) return '';
    const clone = tabEl.cloneNode(true);
    const closeBtn = clone.querySelector('.close');
    if (closeBtn) closeBtn.remove();
    return clone.textContent.replace('{ }', '').trim();
  }

  function updateLineNumbers() {
    const lines = Math.max(1, codeArea.value.split('\n').length);
    lineNumbers.innerHTML = Array.from({ length: lines }, (_, i) => `<div>${i + 1}</div>`).join('');
  }

  function saveActiveToMemory() {
    const active = document.querySelector('.tab.active');
    if (!active) return;
    const name = getTabName(active);
    tabContents[name] = codeArea.value;
  }

  function switchTab(tabName) {
    const tabs = Array.from(document.querySelectorAll('.tab'));
    const target = tabs.find(t => getTabName(t) === tabName);
    if (!target) return;

    const active = document.querySelector('.tab.active');
    if (active && getTabName(active) !== tabName) {
      tabContents[getTabName(active)] = codeArea.value;
    }

    tabs.forEach(t => t.classList.remove('active'));
    target.classList.add('active');

    const fromMemory = tabContents[tabName];
    const fromStorage = localStorage.getItem(STORAGE_PREFIX + tabName);
    codeArea.value = (fromMemory !== undefined) ? fromMemory : (fromStorage || '');
    updateLineNumbers();
    codeArea.focus();
  }

  function attachTabEvents(tabEl) {
    if (!tabEl || tabEl.dataset.eventsAttached === '1') return;
    tabEl.dataset.eventsAttached = '1';

    tabEl.addEventListener('click', (e) => {
      if (e.target.closest('.close')) return;
      switchTab(getTabName(tabEl));
    });

    const closeBtn = tabEl.querySelector('.close');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const name = getTabName(tabEl);
        delete tabContents[name];
        localStorage.removeItem(STORAGE_PREFIX + name);
        tabEl.remove();
        const first = document.querySelector('.tab');
        if (first) switchTab(getTabName(first));
        else { codeArea.value = ''; updateLineNumbers(); }
      });
    }

    tabEl.addEventListener('dblclick', (e) => {
      if (e.target.closest('.close')) return;
      startRename(tabEl);
    });
  }

  function startRename(tabEl) {
    const oldName = getTabName(tabEl);
    if (!oldName) return;
    if (tabEl.querySelector('input')) return;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = oldName;
    input.style.width = Math.max(8, oldName.length + 3) + 'ch';

    tabEl.innerHTML = '';
    tabEl.appendChild(input);
    input.focus();
    input.select();

    function finishRename() {
      let newName = input.value.trim() || oldName;

      const otherNames = Array.from(document.querySelectorAll('.tab'))
        .filter(t => t !== tabEl)
        .map(getTabName);

      if (newName !== oldName && otherNames.includes(newName)) {
        alert('A tab with this name already exists.');
        input.focus();
        return;
      }

      tabContents[newName] = tabContents[oldName] || '';
      if (oldName in tabContents) delete tabContents[oldName];

      const storedOld = localStorage.getItem(STORAGE_PREFIX + oldName);
      if (storedOld !== null) {
        localStorage.setItem(STORAGE_PREFIX + newName, storedOld);
        localStorage.removeItem(STORAGE_PREFIX + oldName);
      } else {
        localStorage.setItem(STORAGE_PREFIX + newName, codeArea.value);
      }

      tabEl.innerHTML = `{ } ${newName} <span class="close">○</span>`;
      tabEl.dataset.eventsAttached = '0';
      attachTabEvents(tabEl);

      const active = document.querySelector('.tab.active');
      if (active && getTabName(active) === oldName) {
        const tabs = Array.from(document.querySelectorAll('.tab'));
        const target = tabs.find(t => getTabName(t) === newName);
        if (target) {
          tabs.forEach(t => t.classList.remove('active'));
          target.classList.add('active');
          codeArea.value = tabContents[newName] || '';
          updateLineNumbers();
        }
      }
    }

    input.addEventListener('blur', finishRename);
    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') input.blur();
      if (ev.key === 'Escape') {
        tabEl.innerHTML = `{ } ${oldName} <span class="close">○</span>`;
        tabEl.dataset.eventsAttached = '0';
        attachTabEvents(tabEl);
      }
    });
  }

  function createTabElement(name, makeActive = true) {
    const tab = document.createElement('div');
    tab.className = 'tab';
    tab.innerHTML = `{ } ${name} <span class="close">○</span>`;
    addTabBtn.insertAdjacentElement('beforebegin', tab);

    const stored = localStorage.getItem(STORAGE_PREFIX + name);
    tabContents[name] = stored !== null ? stored : tabContents[name] || '';

    if (makeActive) {
      const prev = document.querySelector('.tab.active');
      if (prev) prev.classList.remove('active');
      tab.classList.add('active');
      codeArea.value = tabContents[name] || '';
      updateLineNumbers();
      codeArea.focus();
    }

    attachTabEvents(tab);
    return tab;
  }

  // Initialize existing tabs
  document.querySelectorAll('.tab').forEach(tabEl => {
    const name = getTabName(tabEl);
    const s = localStorage.getItem(STORAGE_PREFIX + name);
    tabContents[name] = s !== null ? s : (tabContents[name] || '');
    attachTabEvents(tabEl);

    const match = name.match(/Untitled-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= tabCounter) tabCounter = num + 1;
    }
  });

  // Add-tab & New File
  addTabBtn.addEventListener('click', () => {
    const newName = `Untitled-${tabCounter++}`;
    createTabElement(newName, true);
  });

  newFileBtn.addEventListener('click', () => {
    const newName = `Untitled-${tabCounter++}`;
    createTabElement(newName, true);
  });

  // Save button
  saveFileBtn.addEventListener('click', () => {
    const active = document.querySelector('.tab.active');
    if (!active) { alert('No tab selected to save.'); return; }
    const name = getTabName(active);
    tabContents[name] = codeArea.value;
    localStorage.setItem(STORAGE_PREFIX + name, codeArea.value);
    alert(`Saved ${name} to localStorage.`);
  });

  // --- OPEN FILE FEATURE ---
  openFileBtn.addEventListener('click', () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.txt,.js,.html,.css,.json'; // allowed types

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        const newName = file.name;

        // check if tab with same name exists
        const existingTab = Array.from(document.querySelectorAll('.tab')).find(t => getTabName(t) === newName);
        if (existingTab) {
          switchTab(newName);
        } else {
          createTabElement(newName, true);
        }
        codeArea.value = content;
        const activeTab = document.querySelector('.tab.active');
        if (activeTab) tabContents[getTabName(activeTab)] = content;
        updateLineNumbers();
      };

      reader.readAsText(file);
    });

    fileInput.click();
  });

  // Scroll & input
  codeArea.addEventListener('scroll', () => {
    lineNumbers.scrollTop = codeArea.scrollTop;
  });
  codeArea.addEventListener('input', () => {
    updateLineNumbers();
    const active = document.querySelector('.tab.active');
    if (active) tabContents[getTabName(active)] = codeArea.value;
  });

  // initial UI
  const existingActive = document.querySelector('.tab.active');
  if (existingActive) {
    switchTab(getTabName(existingActive));
  } else {
    createTabElement('Untitled-1', true);
  }

  updateLineNumbers();
});
// --- SEARCH FEATURE ---
const searchBtn = document.querySelector('button.btn:nth-of-type(6)'); // your Search button

// Create search overlay
const searchOverlay = document.createElement('div');
searchOverlay.style.position = 'absolute';
searchOverlay.style.top = '10px';
searchOverlay.style.right = '10px';
searchOverlay.style.background = '#fff';
searchOverlay.style.border = '1px solid #ccc';
searchOverlay.style.padding = '5px';
searchOverlay.style.display = 'none';
searchOverlay.style.zIndex = '1000';
searchOverlay.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';

const searchInput = document.createElement('input');
searchInput.type = 'text';
searchInput.placeholder = 'Search...';
searchInput.style.width = '200px';

const nextBtn = document.createElement('button');
nextBtn.innerText = 'Next';

const closeBtn = document.createElement('button');
closeBtn.innerText = '×';
closeBtn.style.marginLeft = '5px';

searchOverlay.appendChild(searchInput);
searchOverlay.appendChild(nextBtn);
searchOverlay.appendChild(closeBtn);
document.body.appendChild(searchOverlay);

let searchMatches = [];
let currentMatchIndex = 0;

// Function to highlight all matches
function highlightMatches() {
  const text = codeArea.value;
  const query = searchInput.value;
  if (!query) return [];
  const regex = new RegExp(query, 'gi');
  let matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push({ start: match.index, end: match.index + match[0].length });
  }
  return matches;
}

function goToMatch(index) {
  if (!searchMatches.length) return;
  const match = searchMatches[index];
  codeArea.focus();
  codeArea.setSelectionRange(match.start, match.end);
  // Scroll to selection
  const linesBefore = codeArea.value.substring(0, match.start).split('\n').length;
  const lineHeight = 18; // approx line height
  codeArea.scrollTop = (linesBefore - 1) * lineHeight;
}

// Show search box on Ctrl+F5 or button click
function showSearchBox() {
  searchOverlay.style.display = 'block';
  searchInput.focus();
  searchInput.select();
}

// Close search box
function closeSearchBox() {
  searchOverlay.style.display = 'none';
  searchMatches = [];
  currentMatchIndex = 0;
}

// Button click
searchBtn.addEventListener('click', showSearchBox);

// Ctrl+F5
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'F5') {
    e.preventDefault();
    showSearchBox();
  }
  if (e.key === 'Escape' && searchOverlay.style.display === 'block') {
    closeSearchBox();
  }
});

// Search input actions
searchInput.addEventListener('input', () => {
  searchMatches = highlightMatches();
  currentMatchIndex = 0;
  if (searchMatches.length) goToMatch(currentMatchIndex);
});

nextBtn.addEventListener('click', () => {
  if (!searchMatches.length) return;
  currentMatchIndex = (currentMatchIndex + 1) % searchMatches.length;
  goToMatch(currentMatchIndex);
});

closeBtn.addEventListener('click', closeSearchBox);

// Enter key for next match
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    nextBtn.click();
  }
});

// Prevent default F5 reload
document.addEventListener('keydown', (e) => {
  if (e.key === 'F5') {
    e.preventDefault();
  }
});
// --- END SEARCH FEATURE ---

// --- THEME TOGGLE FEATURE ---
const themeToggleBtn = document.querySelector('button.btn:nth-of-type(5)'); // your Theme Toggle button
const LIGHT_THEME = 'light-theme';
const DARK_THEME = 'dark-theme';
const THEME_STORAGE_KEY = 'alactic_theme';

// Load saved theme or default to light
function loadTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || LIGHT_THEME;
  document.body.classList.remove(LIGHT_THEME, DARK_THEME);
  document.body.classList.add(savedTheme);
}
alert('alactic editor is open source. Visit');
loadTheme();

// Toggle theme
document.addEventListener("DOMContentLoaded", () => {
  const codeArea = document.querySelector(".code-area");
  const saveFileBtn = document.getElementById("saveFileBtn");
  const sidebarFileList = document.querySelector(".file-explorer .my-folder .file-list");

  // Load existing saved files
  let files = JSON.parse(localStorage.getItem("files")) || {};

  // Helper: get tab name
  function getActiveTabName() {
    const activeTab = document.querySelector(".tab.active");
    return activeTab ? activeTab.textContent.replace("○", "").trim() : null;
  }

  // Show files in sidebar
  function refreshSidebar() {
    sidebarFileList.innerHTML = "";
    Object.keys(files).forEach((filename) => {
      const li = document.createElement("li");
      li.className = "file-item";
      li.dataset.filename = filename;
      li.textContent = `📄 ${filename}`;
      li.addEventListener("click", () => {
        codeArea.value = files[filename];
        switchTab(filename);
      });
      sidebarFileList.appendChild(li);
    });
  }

  // Switch active tab
  function switchTab(filename) {
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.classList.remove("active");
      if (tab.textContent.includes(filename)) {
        tab.classList.add("active");
      }
    });
    codeArea.value = files[filename] || "";
  }

  // Save file
  saveFileBtn.addEventListener("click", () => {
    const filename = getActiveTabName();
    if (!filename) {
      alert("No active tab to save!");
      return;
    }

    const content = codeArea.value;
    files[filename] = content;

    // Save to localStorage
    localStorage.setItem("files", JSON.stringify(files));

    // Update sidebar
    refreshSidebar();

    // Small flash effect
    const folderName = document.querySelector(".folder-name");
    folderName.style.backgroundColor = "#007acc";
    setTimeout(() => (folderName.style.backgroundColor = "transparent"), 500);

    alert(`${filename} saved!`);
  });

  // Initial render
  refreshSidebar();
});
