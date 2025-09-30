document.addEventListener('DOMContentLoaded', () => {
  const codeArea = document.querySelector('.code-area');
  const highlightedCode = document.querySelector('.highlighted-code code');
  const lineNumbers = document.querySelector('.line-numbers');
  const saveFileBtn = document.getElementById('saveFileBtn');
  const addTabBtn = document.querySelector('.add-tab');
  const sidebarFileList = document.querySelector('.file-list');
  const folderDiv = document.querySelector('.folder-name');

  // --- Undo/Redo stacks ---
  let undoStack = [codeArea.value];
  let redoStack = [];
  let isTyping = false;

  // --- Tabs setup ---
  let tabCounter = 4;
  const tabContents = {
    "Untitled-1.txt": "",
    "Untitled-2.txt": "",
    "Untitled-3.txt": ""
  };

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
      if (active) tabContents[active.textContent.replace("○","").trim()] = codeArea.value;
      tabs.forEach(t => t.classList.remove("active"));
      target.classList.add("active");
      codeArea.value = tabContents[tabName] || "";
      updateTabIcon(target);
      updateHighlight();
      updateLineNumbers();
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

    // Download file
    const folderName = folderDiv.textContent.trim() || "DefaultFolder";
    const extension = name.includes(".") ? "" : ".txt";
    const fileName = `${folderName}_${name}${extension}`;
    const blob = new Blob([codeArea.value], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert(`Saved ${fileName}`);
    localStorage.setItem("files", JSON.stringify(tabContents));
    updateSidebar();
  });

  // Load saved files
  const saved = JSON.parse(localStorage.getItem("files"));
  if (saved) Object.assign(tabContents, saved);
  updateSidebar();
  switchTab(Object.keys(tabContents)[0]);

  // --- Undo/Redo ---
  codeArea.addEventListener('input', () => {
    if (!isTyping) undoStack.push(codeArea.value);
    updateHighlight();
    updateLineNumbers();
  });

  codeArea.addEventListener('keydown', (e) => {
    // Undo: Ctrl+Z
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      if (undoStack.length > 1) {
        redoStack.push(undoStack.pop());
        isTyping = true;
        codeArea.value = undoStack[undoStack.length-1];
        isTyping = false;
        updateHighlight();
        updateLineNumbers();
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
        updateHighlight();
        updateLineNumbers();
      }
    }
  });

  // --- Highlight and line numbers ---
  function updateHighlight() {
    let code = codeArea.value.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    highlightedCode.textContent = code;
    Prism.highlightElement(highlightedCode);
    highlightedCode.parentElement.scrollTop = codeArea.scrollTop;
    highlightedCode.parentElement.scrollLeft = codeArea.scrollLeft;
  }

  function updateLineNumbers() {
    const lines = codeArea.value.split('\n').length || 1;
    lineNumbers.innerHTML = '';
    for (let i = 1; i <= lines; i++) {
      const div = document.createElement('div');
      div.textContent = i;
      lineNumbers.appendChild(div);
    }
  }

  codeArea.addEventListener('scroll', () => {
    highlightedCode.parentElement.scrollTop = codeArea.scrollTop;
    highlightedCode.parentElement.scrollLeft = codeArea.scrollLeft;
    lineNumbers.scrollTop = codeArea.scrollTop;
  });

  // Initial run
  updateHighlight();
  updateLineNumbers();

});
