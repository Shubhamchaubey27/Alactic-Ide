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

