// --- UI & Application Logic ---
let selectedClassId = null;
let currentClassData = null;
let currentChapterId, currentPoemData;
let pages = {};
let completedChapters = {}; // Track completed chapters per class

// Initialize completion tracking from sessionStorage
function initializeCompletionTracking() {
    const stored = sessionStorage.getItem("completedChapters");
    completedChapters = stored ? JSON.parse(stored) : {};
}

// ======== Sidebar collapse / expand ========
// ===== Sidebar collapse / expand =====
let isSidebarCollapsed = false;

function collapseSidebar() {
    const sidebar = document.getElementById("sidebar");
    const collapsedToggle = document.getElementById("sidebar-collapsed-toggle");
    const collapseBtn = document.getElementById("collapse-sidebar-btn");

    if (!sidebar || !collapsedToggle) return;

    sidebar.classList.add("sidebar-collapsed");
    collapsedToggle.classList.remove("hidden");
    collapsedToggle.classList.add("flex");
    isSidebarCollapsed = true;

    if (collapseBtn) {
        collapseBtn.setAttribute("aria-expanded", "false");
    }
}

function expandSidebar() {
    const sidebar = document.getElementById("sidebar");
    const collapsedToggle = document.getElementById("sidebar-collapsed-toggle");
    const collapseBtn = document.getElementById("collapse-sidebar-btn");

    if (!sidebar || !collapsedToggle) return;

    sidebar.classList.remove("sidebar-collapsed");
    collapsedToggle.classList.add("hidden");
    collapsedToggle.classList.remove("flex");
    isSidebarCollapsed = false;

    if (collapseBtn) {
        collapseBtn.setAttribute("aria-expanded", "true");
    }
}

function toggleSidebar() {
    if (isSidebarCollapsed) {
        expandSidebar();
    } else {
        collapseSidebar();
    }
}


// Save chapter completion status
function markChapterCompleted(classId, chapterId) {
    if (!completedChapters[classId]) {
        completedChapters[classId] = [];
    }
    if (!completedChapters[classId].includes(chapterId)) {
        completedChapters[classId].push(chapterId);
        sessionStorage.setItem(
            "completedChapters",
            JSON.stringify(completedChapters)
        );
    }
}

// Check if chapter is completed
function isChapterCompleted(classId, chapterId) {
    return (
        completedChapters[classId] &&
        completedChapters[classId].includes(chapterId)
    );
}

// Get completion status for a class
function getClassCompletionStatus(classId) {
    const classData = Object.values(CLASSES).find(
        (cls) => cls.id === classId
    );
    if (!classData) return { completed: 0, total: 0, percentage: 0 };

    const total = classData.chapters.length;
    const completed = completedChapters[classId]
        ? completedChapters[classId].length
        : 0;
    const percentage = Math.round((completed / total) * 100);

    return { completed, total, percentage };
}

// Ripple Effect
function createRipple(event) {
    const button = event.currentTarget;
    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${
        event.clientX - button.getBoundingClientRect().left - radius
    }px`;
    circle.style.top = `${
        event.clientY - button.getBoundingClientRect().top - radius
    }px`;
    circle.classList.add("ripple");

    const ripple = button.getElementsByClassName("ripple")[0];
    if (ripple) ripple.remove();

    button.appendChild(circle);
}

function showPage(pageName) {
    Object.values(pages).forEach(
        (page) => page && page.classList.remove("active")
    );
    if (pages[pageName]) pages[pageName].classList.add("active");
}

function highlightActiveSidebarClass() {
    document
        .querySelectorAll("#sidebar-class-buttons .chip")
        .forEach((btn) => {
            const checkIcon = btn.querySelector(".check-icon");
            if (btn.dataset.classId === selectedClassId) {
                btn.classList.add("active");
                checkIcon.classList.remove("hidden");
            } else {
                btn.classList.remove("active");
                checkIcon.classList.add("hidden");
            }
        });
}

function switchClassFromSidebar(classId) {
    let classKey = Object.keys(CLASSES).find(
        (key) => CLASSES[key].id === classId
    );
    if (!classKey) return;

    selectedClassId = classId;
    currentClassData = CLASSES[classKey];
    sessionStorage.setItem("selectedClassId", selectedClassId);

    highlightActiveSidebarClass();
    clearPoemPanel();
    loadChapters();
}

function clearPoemPanel() {
    document.getElementById("poem-panel").classList.add("hidden");
    document.getElementById("start-quiz-fab").classList.add("hidden");
    document.getElementById("poem-empty-state").classList.remove("hidden");

    const prevBtn = document.getElementById("prev-chapter-btn");
    const nextBtn = document.getElementById("next-chapter-btn");
    setNavButtonState(prevBtn, false);
    setNavButtonState(nextBtn, false);
}


function getNavigableChapters() {
    if (!currentClassData || !currentClassData.chapters) return [];

    // Same sort logic as loadChapters(), but only keep chapters that actually have questions
    return [...currentClassData.chapters]
        .filter((chapter) => chapter.questions && chapter.questions.length > 0)
        .sort(
            (a, b) =>
                (a.name.match(/\d+/)?.[0] || 0) -
                (b.name.match(/\d+/)?.[0] || 0)
        );
}

function setNavButtonState(btn, enabled) {
    if (!btn) return;
    btn.disabled = !enabled;
    if (!enabled) {
        btn.classList.add("opacity-50", "cursor-not-allowed");
    } else {
        btn.classList.remove("opacity-50", "cursor-not-allowed");
    }
}

function updateChapterNavButtons() {
    const prevBtn = document.getElementById("prev-chapter-btn");
    const nextBtn = document.getElementById("next-chapter-btn");

    if (!prevBtn || !nextBtn || !currentClassData || !currentChapterId) {
        // No active chapter – disable both
        setNavButtonState(prevBtn, false);
        setNavButtonState(nextBtn, false);
        return;
    }

    const chapters = getNavigableChapters();
    const index = chapters.findIndex((ch) => ch.id === currentChapterId);

    if (index === -1) {
        setNavButtonState(prevBtn, false);
        setNavButtonState(nextBtn, false);
        return;
    }

    const canPrev = index > 0;
    const canNext = index < chapters.length - 1;

    setNavButtonState(prevBtn, canPrev);
    setNavButtonState(nextBtn, canNext);
}

function goToSiblingChapter(offset) {
    if (!currentClassData || !currentChapterId) return;

    const chapters = getNavigableChapters();
    const index = chapters.findIndex((ch) => ch.id === currentChapterId);
    if (index === -1) return;

    const newIndex = index + offset;
    if (newIndex < 0 || newIndex >= chapters.length) return;

    const targetChapter = chapters[newIndex];
    if (targetChapter) {
        loadPoem(targetChapter);
    }
}


window.onload = function () {
    pages = {
        chapterSelection: document.getElementById("page-chapter-selection"),
    };

    // Initialize completion tracking from sessionStorage
    initializeCompletionTracking();

    selectedClassId = sessionStorage.getItem("selectedClassId");
    let classKey = selectedClassId
        ? Object.keys(CLASSES).find(
              (key) => CLASSES[key].id === selectedClassId
          )
        : undefined;

    if (!classKey) {
        classKey = Object.keys(CLASSES)[0];
        selectedClassId = CLASSES[classKey].id;
    }
    currentClassData = CLASSES[classKey];

    populateClassDropdown();
    loadChapters();
    showPage("chapterSelection");

    // === NEW: sidebar collapse button ===
    const collapseBtn = document.getElementById("collapse-sidebar-btn");
    const collapsedToggle = document.getElementById("sidebar-collapsed-toggle");

    if (collapseBtn) {
        collapseBtn.addEventListener("click", function (e) {
            // optional ripple if you already use createRipple
            if (typeof createRipple === "function") {
                createRipple(e);
            }
            collapseSidebar();
        });
    }

    if (collapsedToggle) {
        collapsedToggle.addEventListener("click", function () {
            expandSidebar();
        });
    }

    // === NEW: keyboard shortcut '.' to toggle sidebar ===
    document.addEventListener("keydown", function (event) {
        if (event.key !== ".") return;

        // Avoid triggering while typing in inputs / textareas
        const ae = document.activeElement;
        if (
            ae &&
            (ae.tagName === "INPUT" ||
                ae.tagName === "TEXTAREA" ||
                ae.isContentEditable)
        ) {
            return;
        }

        toggleSidebar();
    });

        // === NEW: Prev / Next chapter buttons ===
        const prevBtn = document.getElementById("prev-chapter-btn");
        const nextBtn = document.getElementById("next-chapter-btn");
    
        if (prevBtn) {
            prevBtn.addEventListener("click", function (e) {
                if (typeof createRipple === "function") {
                    createRipple(e);
                }
                goToSiblingChapter(-1); // previous
            });
        }
    
        if (nextBtn) {
            nextBtn.addEventListener("click", function (e) {
                if (typeof createRipple === "function") {
                    createRipple(e);
                }
                goToSiblingChapter(1); // next
            });
        }
    
};



function loadChapters() {
    const chapterList = document.getElementById("chapter-list");
    chapterList.innerHTML =
        '<p class="text-sm text-gray-400">Loading chapters...</p>';

    if (!currentClassData) return;

    const sortedChapters = [...currentClassData.chapters].sort(
        (a, b) =>
            (a.name.match(/\d+/)?.[0] || 0) -
            (b.name.match(/\d+/)?.[0] || 0)
    );
    chapterList.innerHTML = "";

    sortedChapters.forEach((chapter, index) => {
        const item = document.createElement("div");
        const isCompleted = isChapterCompleted(selectedClassId, chapter.id);
        const hasQuestions =
            chapter.questions && chapter.questions.length > 0;

        // Determine styling based on state
        let bgClass, borderClass, hoverClass, statusIcon, textClass;

        if (isCompleted) {
            // Completed: Vibrant Green
            bgClass = "bg-green-100";
            borderClass = "border-green-600";
            hoverClass = "hover:bg-green-150 hover:shadow-lg";
            statusIcon = "✅";
            textClass = "text-green-900";
        } else if (!hasQuestions) {
            // Coming soon: Light Gray
            bgClass = "bg-gray-100";
            borderClass = "border-gray-500";
            hoverClass = "";
            statusIcon = "🔒";
            textClass = "text-gray-600";
        } else {
            // Pending/Active: Vibrant Blue
            bgClass = "bg-blue-100";
            borderClass = "border-blue-600";
            hoverClass = "hover:bg-blue-150 hover:shadow-lg";
            statusIcon = "";
            textClass = "text-blue-900";
        }

        item.className = `w-full text-left p-3 mb-2 rounded-lg flex items-center justify-between ${bgClass} border-l-4 ${borderClass} ${hoverClass} shadow-sm transition-all duration-200`;

        item.innerHTML = `
            <div class="flex-1">
                <div class="font-bold text-base ${textClass}">${chapter.name}</div>
                <div class="text-xs ${textClass} opacity-75">${
            chapter.questions?.length || 0
        } ਸਵਾਲ</div>
            </div>
            <span class="text-xl">${statusIcon}</span>
        `;

        if (!hasQuestions) {
            item.classList.add("opacity-60", "cursor-not-allowed");
            item.title = "Coming Soon";
        } else {
            item.classList.add("cursor-pointer", "ripple-surface");
            item.onclick = (e) => {
                createRipple(e);
                loadPoem(chapter);
            };
        }
        chapterList.appendChild(item);
    });

    // Show class completion progress at the top
    showClassProgress();
}

function showClassProgress() {
    const status = getClassCompletionStatus(selectedClassId);
    const progressContainer = document.getElementById("chapter-list");

    if (status.total > 0) {
        const progressBar = document.createElement("div");
        progressBar.className =
            "mb-4 p-3 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200";
        progressBar.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-bold text-indigo-700">ਪਾਠ ਤਰੱਕੀ (Chapter Progress)</span>
                <span class="text-sm font-bold text-indigo-600">${status.completed}/${status.total}</span>
            </div>
            <div class="w-full bg-gray-300 rounded-full h-2">
                <div class="bg-gradient-to-r from-indigo-500 to-blue-500 h-2 rounded-full transition-all duration-300" style="width: ${status.percentage}%"></div>
            </div>
            <div class="text-xs text-indigo-600 mt-2 font-semibold">${status.percentage}% ✨</div>
        `;
        progressContainer.insertBefore(
            progressBar,
            progressContainer.firstChild
        );
    }
}

function populateClassDropdown() {
    // Update label
    const label = document.getElementById("current-class-label");
    label.textContent = currentClassData ? currentClassData.name : "ਜਮਾਤ";

    const panel = document.getElementById("class-list-panel");
    const items = document.getElementById("class-list-items");
    const chevron = document.getElementById("chevron-icon");

    items.innerHTML = "";

    Object.keys(CLASSES).forEach((key) => {
        const cls = CLASSES[key];
        const btn = document.createElement("button");

        btn.className =
            "w-full text-left px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition";
        btn.textContent = cls.name;

        btn.onclick = () => {
            switchClassFromSidebar(cls.id);
            label.textContent = cls.name;

            // Collapse panel
            panel.classList.add("hidden");
            chevron.style.transform = "rotate(0deg)";
        };

        items.appendChild(btn);
    });

    // Toggle open/close
    document.getElementById("class-toggle-btn").onclick = () => {
        const isHidden = panel.classList.contains("hidden");
        panel.classList.toggle("hidden");

        // Rotate chevron icon
        chevron.style.transform = isHidden ? "rotate(180deg)" : "rotate(0deg)";
    };
}

function loadPoem(chapterData) {
    currentChapterId = chapterData.id;
    currentPoemData = chapterData;

    // Stop any ongoing speech when switching poems
    if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
    }
    isReadingPoem = false;
    currentReadingLineIndex = -1;
    updatePoemReadButton();

    document.getElementById("poem-empty-state").classList.add("hidden");
    document.getElementById("poem-panel").classList.remove("hidden");
    document.getElementById("start-quiz-fab").classList.remove("hidden");

    document.getElementById("poem-title-text").textContent = chapterData.name;

    const poemLines = chapterData.poem
    .split("\n")
    .map(
        (line, idx) =>
            `<div class="poem-line" data-line-index="${idx}" onclick="readPoemLine(this)">${line.trim()}</div>`
    )
    .join("");
document.getElementById("poem-content").innerHTML = poemLines;

// Update next/prev button state based on this chapter
updateChapterNavButtons();
}

window.startQuiz = (e) => {
    createRipple(e);
    if (
        !currentPoemData ||
        !currentPoemData.questions ||
        currentPoemData.questions.length === 0
    ) {
        alert("No questions found for this chapter!");
        return;
    }
    // Store IDs so quiz.html can reconstruct from CLASSES
    sessionStorage.setItem("selectedClassId", selectedClassId);
    sessionStorage.setItem("currentChapterId", currentPoemData.id);
    // Keep old data for backward compatibility (not used by new quiz logic)
    sessionStorage.setItem(
        "currentChapterData",
        JSON.stringify(currentPoemData)
    );
    // Clear any previous student details so quiz always shows login first
    sessionStorage.removeItem("studentName");
    sessionStorage.removeItem("studentRoll");
    window.location.href = "quiz.html";
};

// ======== Text-to-Speech for Poem (Punjabi + auto-scroll) ========

let isReadingPoem = false;
let currentReadingLineIndex = -1;

let hasPunjabiOrHindiVoice = false;

function getPunjabiVoice() {
    if (!("speechSynthesis" in window)) return null;
    const synth = window.speechSynthesis;
    const voices = synth.getVoices();
    if (!voices || !voices.length) return null;

    // Punjabi first
    const pa = voices.find(
        (v) =>
            v.lang.toLowerCase().startsWith("pa") ||
            v.name.toLowerCase().includes("punjabi")
    );
    if (pa) {
        hasPunjabiOrHindiVoice = true;
        return pa;
    }

    // Then Hindi as a fallback – still Indic, better than English
    const hi = voices.find(
        (v) =>
            v.lang.toLowerCase().startsWith("hi") ||
            v.name.toLowerCase().includes("hindi")
    );
    if (hi) {
        hasPunjabiOrHindiVoice = true;
        return hi;
    }

    hasPunjabiOrHindiVoice = false;
    return null;
}

function updatePoemReadButton() {
    const btn = document.getElementById("poem-read-btn");
    if (!btn) return;
    const icon = btn.querySelector(".material-symbols-outlined");
    const label = btn.querySelector(".btn-label");

    if (isReadingPoem) {
        btn.classList.add("bg-indigo-600", "text-white");
        btn.classList.remove("bg-white", "text-indigo-700");
        if (icon) icon.textContent = "stop";
        if (label) label.textContent = "ਰੋਕੋ (Stop)";
    } else {
        btn.classList.remove("bg-indigo-600", "text-white");
        btn.classList.add("bg-white", "text-indigo-700");
        if (icon) icon.textContent = "volume_up";
        if (label) label.textContent = "ਕਵਿਤਾ ਸੁਣੋ";
    }
}

function clearActiveLine() {
    document
        .querySelectorAll("#poem-content .poem-line.active")
        .forEach((el) => el.classList.remove("active"));
}

function highlightAndScrollLine(index) {
    const container = document.getElementById("poem-content");
    if (!container) return;

    clearActiveLine();
    const lineEl = container.querySelector(
        `.poem-line[data-line-index="${index}"]`
    );
    if (!lineEl) return;

    lineEl.classList.add("active");
    // Auto-scroll: keep current line centered
    lineEl.scrollIntoView({
        behavior: "smooth",
        block: "center",
    });
}

// Read a single line when the user clicks it
window.readPoemLine = (el) => {
    const text = el.innerText.trim();
    if (!text) return;

    if (!("speechSynthesis" in window)) {
        alert(
            "ਤੁਹਾਡੇ ਬ੍ਰਾਊਜ਼ਰ ਵਿੱਚ ਆਵਾਜ਼ ਸਹਾਇਤਾ ਉਪਲਬਧ ਨਹੀਂ (speech not supported)."
        );
        return;
    }
    const synth = window.speechSynthesis;
    synth.cancel(); // stop any previous speech

    isReadingPoem = false;
    updatePoemReadButton();

    clearActiveLine();
    const idxAttr = el.getAttribute("data-line-index");
    if (idxAttr != null) {
        currentReadingLineIndex = parseInt(idxAttr, 10);
        highlightAndScrollLine(currentReadingLineIndex);
    }

    const utter = new SpeechSynthesisUtterance(text);
    // Force Punjabi language; browser will try to pick best matching voice
    utter.lang = "pa-IN";
    const voice = getPunjabiVoice();
    if (!voice) {
        alert(
            "ਤੁਹਾਡੇ ਬ੍ਰਾਊਜ਼ਰ ਜਾਂ ਸਿਸਟਮ ਵਿੱਚ ਪੰਜਾਬੀ / ਹਿੰਦੀ ਆਵਾਜ਼ ਇੰਸਟਾਲ ਨਹੀਂ ਹੈ। " +
                "ਇਸ ਲਈ ਇਹ ਕਵਿਤਾ ਨੂੰ ਅੰਗਰੇਜ਼ੀ ਲਹਜੇ ਨਾਲ ਪੜ੍ਹੇਗਾ।\n\n" +
                "ਕੋਸ਼ਿਸ਼ ਕਰੋ: Android/ਮੋਬਾਈਲ ’ਤੇ Punjabi TTS ਇੰਸਟਾਲ ਕਰਨਾ ਜਾਂ ਹੋਰ ਬ੍ਰਾਊਜ਼ਰ ਵਰਤਣਾ।"
        );
    }
    // We still set lang for the engine in case a suitable voice exists
    utter.lang = "pa-IN";
    if (voice) utter.voice = voice;

    utter.rate = 0.9;

    synth.speak(utter);
};

// Play / stop the entire poem (Punjabi) with auto-scroll line by line
window.togglePoemReading = () => {
    if (!currentPoemData || !currentPoemData.poem) return;

    if (!("speechSynthesis" in window)) {
        alert(
            "ਤੁਹਾਡੇ ਬ੍ਰਾਊਜ਼ਰ ਵਿੱਚ ਆਵਾਜ਼ ਸਹਾਇਤਾ ਉਪਲਬਧ ਨਹੀਂ (speech not supported)."
        );
        return;
    }

    const synth = window.speechSynthesis;

    // If currently reading, stop
    if (isReadingPoem) {
        synth.cancel();
        isReadingPoem = false;
        currentReadingLineIndex = -1;
        clearActiveLine();
        updatePoemReadButton();
        return;
    }

    // Start reading full poem line by line
    const lines = currentPoemData.poem
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

    if (!lines.length) return;

    isReadingPoem = true;
    currentReadingLineIndex = 0;
    updatePoemReadButton();
    synth.cancel();

    const voice = getPunjabiVoice();

    const speakNext = () => {
        if (!isReadingPoem || currentReadingLineIndex >= lines.length) {
            isReadingPoem = false;
            currentReadingLineIndex = -1;
            clearActiveLine();
            updatePoemReadButton();
            return;
        }

        const text = lines[currentReadingLineIndex];
        highlightAndScrollLine(currentReadingLineIndex);

        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = "pa-IN"; // Punjabi
        if (voice) utter.voice = voice;
        utter.rate = 0.9;

        utter.onend = () => {
            currentReadingLineIndex++;
            // Small safety delay between lines
            setTimeout(speakNext, 150);
        };

        synth.speak(utter);
    };

    speakNext();
};

// Some browsers load voices asynchronously; update button state when ready
if ("speechSynthesis" in window) {
    window.speechSynthesis.onvoiceschanged = () => {
        updatePoemReadButton();
    };
}
