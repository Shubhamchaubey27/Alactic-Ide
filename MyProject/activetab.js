document.addEventListener('DOMContentLoaded', () => {
  // Function to highlight the active tab
  function highlightActiveTab() {
    const tabs = document.querySelectorAll('.tab');
    const activeTab = document.querySelector('.tab.active');

    tabs.forEach(tab => {
      if (tab === activeTab) {
        tab.style.backgroundColor = '#d1c4b2'; // darker color
        tab.style.fontWeight = 'bold';
      } else {
        tab.style.backgroundColor = '#fff'; // normal color
        tab.style.fontWeight = 'normal';
      }
    });
  }

  // Initially highlight the active tab
  highlightActiveTab();

  // Observe changes to tab classes (when switchTab runs in your main JS)
  const tabContainer = document.querySelector('.tabs');
  const observer = new MutationObserver(() => {
    highlightActiveTab();
  });

  observer.observe(tabContainer, { attributes: true, subtree: true, attributeFilter: ['class'] });
});
// --- SAVE FILE TO LOCAL COMPUTER ---
function saveActiveTabToComputer() {
    const activeTab = document.querySelector('.tab.active');
    if (!activeTab) {
        alert('No active file to save.');
        return;
    }

    const filename = getTabName(activeTab);
    const content = codeArea.value;

    // Create a blob and trigger download
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Optional: save in localStorage too
    localStorage.setItem(STORAGE_PREFIX + filename, content);
    console.log(`File "${filename}" saved to computer.`);
}

// Override your Save File button
saveFileBtn.removeEventListener('click', saveFileBtn); // remove previous listener
saveFileBtn.addEventListener('click', saveActiveTabToComputer);
// --- SAVE FILE WITH FOLDER NAME FEATURE ---
document.addEventListener('DOMContentLoaded', () => {
  const saveFileBtn = document.getElementById('saveFileBtn');
  const codeArea = document.querySelector('.code-area');
  const folderDiv = document.querySelector('.folder-name');

  function downloadFile(fileName, content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  saveFileBtn.addEventListener('click', () => {
    const activeTab = document.querySelector('.tab.active');
    if (!activeTab) {
      alert('No active tab to save.');
      return;
    }

    const tabName = activeTab.textContent.replace('○', '').trim();
    const folderName = folderDiv.textContent.trim() || 'DefaultFolder';
    const extension = tabName.includes('.') ? '' : '.txt'; // default extension if not provided
    const fileName = `${folderName}_${tabName}${extension}`;

    downloadFile(fileName, codeArea.value);
    alert(`Saved ${fileName}`);
  });
});
const codeArea = document.querySelector('.code-area');

// Undo/Redo stacks
let undoStack = [];
let redoStack = [];
let isTyping = false;

// Save initial state
undoStack.push(codeArea.value);

// Push current state to undo stack
function pushToUndo() {
    undoStack.push(codeArea.value);
    redoStack = [];
}

// Input listener
codeArea.addEventListener('input', () => {
    if (!isTyping) pushToUndo();
});

// Keyboard shortcuts
codeArea.addEventListener('keydown', (e) => {
    // Undo: Ctrl+Z
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (undoStack.length > 1) {
            redoStack.push(undoStack.pop());
            isTyping = true;
            codeArea.value = undoStack[undoStack.length - 1];
            isTyping = false;
        }
    }

    // Redo: Ctrl+Y or Ctrl+Shift+Z
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault();
        if (redoStack.length > 0) {
            const last = redoStack.pop();
            isTyping = true;
            codeArea.value = last;
            undoStack.push(last);
            isTyping = false;
        }
    }
});
document.addEventListener("DOMContentLoaded", () => {
    const codeArea = document.querySelector(".code-area");
    const saveFileBtn = document.getElementById("saveFileBtn");
    const addTabBtn = document.querySelector(".add-tab");
    const sidebarFileList = document.querySelector(".file-list");
    const folderName = document.querySelector(".folder-name");

    let tabCounter = 4;
    const tabContents = {
        "Untitled-1.txt": "",
        "Untitled-2.txt": "",
        "Untitled-3.txt": ""
    };

    // Language icon map
    const languageMap = {
        js: "⚡", ts: "🔷", py: "🐍", java: "☕",
        html: "🌐", css: "🎨", json: "🗄️", md: "📄",
        txt: "📄", c: "📘", cpp: "📘", php: "🐘",
        rb: "💎", go: "🐹", dart: "🎯", swift: "🕊️",
        rs: "🦀", sh: "🐚", sql: "🗄️", lua: "🌙",
        r: "📊", kt: "🤖"
    };

    function getIcon(filename) {
        const ext = filename.split(".").pop().toLowerCase();
        return languageMap[ext] || "📄";
    }

    function getActiveTab() {
        return document.querySelector(".tab.active");
    }

    function updateTabIcon(tab) {
        if (!tab) return;
        // Check if icon span exists
        let iconSpan = tab.querySelector(".icon");
        const text = tab.textContent.replace("○", "").trim();
        if (!iconSpan) {
            iconSpan = document.createElement("span");
            iconSpan.className = "icon";
            tab.prepend(iconSpan);
        }
        iconSpan.textContent = getIcon(text);
    }

    function switchTab(tabName) {
        const tabs = document.querySelectorAll(".tab");
        const target = Array.from(tabs).find(t => t.textContent.replace("○", "").trim() === tabName);
        if (target) {
            const active = getActiveTab();
            if (active) {
                const activeName = active.textContent.replace("○", "").trim();
                tabContents[activeName] = codeArea.value;
            }
            tabs.forEach(t => t.classList.remove("active"));
            target.classList.add("active");
            codeArea.value = tabContents[tabName] || "";
            updateTabIcon(target);
        }
    }

    function attachTabEvents(tab) {
        const closeBtn = tab.querySelector(".close");
        tab.addEventListener("click", () => switchTab(tab.textContent.replace("○", "").trim()));
        closeBtn.addEventListener("click", e => {
            e.stopPropagation();
            const name = tab.textContent.replace("○", "").trim();
            delete tabContents[name];
            tab.remove();
            updateSidebar();
            const firstTab = document.querySelector(".tab");
            if (firstTab) switchTab(firstTab.textContent.replace("○", "").trim());
            else codeArea.value = "";
        });

        // Double-click rename
        tab.addEventListener("dblclick", () => {
            const oldName = tab.textContent.replace("○", "").trim();
            const input = document.createElement("input");
            input.type = "text";
            input.value = oldName;
            tab.innerHTML = "";
            tab.appendChild(input);
            input.focus();

            input.addEventListener("blur", () => {
                const newName = input.value.trim() || oldName;
                tab.textContent = newName + " ";
                const close = document.createElement("span");
                close.className = "close";
                close.textContent = "○";
                tab.appendChild(close);
                attachTabEvents(tab);
                updateTabIcon(tab);
            });

            input.addEventListener("keydown", e => { if (e.key === "Enter") input.blur(); });
        });
    }

    function updateSidebar() {
        sidebarFileList.innerHTML = "";
        Object.keys(tabContents).forEach(name => {
            if (!name.startsWith("Untitled")) {
                const li = document.createElement("li");
                li.textContent = `${getIcon(name)} ${name}`;
                li.addEventListener("click", () => switchTab(name));
                sidebarFileList.appendChild(li);
            }
        });
    }

    // Initialize existing tabs
    document.querySelectorAll(".tab").forEach(tab => {
        attachTabEvents(tab);
        updateTabIcon(tab);
    });

    // New tab button
    addTabBtn.addEventListener("click", () => {
        const newName = `Untitled-${tabCounter++}.txt`;
        const newTab = document.createElement("div");
        newTab.className = "tab";
        newTab.innerHTML = newName + " <span class='close'>○</span>";
        addTabBtn.insertAdjacentElement("beforebegin", newTab);
        tabContents[newName] = "";
        attachTabEvents(newTab);
        updateTabIcon(newTab);
        switchTab(newName);
    });

    // Save file button
    saveFileBtn.addEventListener("click", () => {
        const active = getActiveTab();
        if (!active) return alert("No active tab!");
        const name = active.textContent.replace("○", "").trim();
        tabContents[name] = codeArea.value;
        localStorage.setItem("files", JSON.stringify(tabContents));
        updateTabIcon(active);
        updateSidebar();
        folderName.style.backgroundColor = "#007acc";
        setTimeout(() => folderName.style.backgroundColor = "transparent", 500);
        alert(`${name} saved!`);
    });

    // Load saved files
    const saved = JSON.parse(localStorage.getItem("files"));
    if (saved) Object.assign(tabContents, saved);
    updateSidebar();
    switchTab(Object.keys(tabContents)[0]);
});

const textarea = document.querySelector(".code-area");
const highlightedCode = document.querySelector(".highlighted-code code");

// Sync textarea → highlighted Prism preview
function updateHighlight() {
  // escape HTML to show correctly
  let code = textarea.value.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  highlightedCode.textContent = code;

  Prism.highlightElement(highlightedCode);

  // Keep scroll in sync
  highlightedCode.parentElement.scrollTop = textarea.scrollTop;
  highlightedCode.parentElement.scrollLeft = textarea.scrollLeft;
}

textarea.addEventListener("input", updateHighlight);
textarea.addEventListener("scroll", updateHighlight);

// Initial run
updateHighlight();

function setLanguageByExtension(fileName) {
  let lang = "javascript"; // default
  if (fileName.endsWith(".html")) lang = "markup";
  if (fileName.endsWith(".css")) lang = "css";
  if (fileName.endsWith(".js")) lang = "javascript";
  if (fileName.endsWith(".py")) lang = "python";
  if (fileName.endsWith(".json")) lang = "json";

  highlightedCode.className = "language-" + lang;
  updateHighlight();
}

// Example:
setLanguageByExtension("test.html");
