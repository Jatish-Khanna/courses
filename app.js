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



// ======== Flashcards from class questions (shown when no chapter is selected) ========
const FLASHCARD_DURATION_MS = 7000; // 7 seconds per card
let flashcardsByClass = {};
let flashcardTimerId = null;
let currentFlashcardIndex = 0;
let currentFlashcardClassId = null;
let isFlashcardMode = false;

// Custom flashcard content created manually (knowledge bytes per class)
const CUSTOM_FLASHCARDS = {
    class_6: [
        {
            chapterName: "ਪਾਠ 1: ਆਪਣੀਆਂ ਸੰਖਿਆਵਾਂ ਨੂੰ ਜਾਣਨਾ (Knowing Our Numbers)",
            text: "ਯਾਦ ਰੱਖੋ: ਸਥਾਨਮਾਨ (place value) ਵਿੱਚ ਜਿੰਨਾ ਖੱਬੇ ਵੱਲ ਜਾਈਏ, ਅੰਕ ਦਾ ਮੁੱਲ ਦਸ ਗੁਣਾ ਵੱਧਦਾ ਜਾਂਦਾ ਹੈ।"
        },
        {
            chapterName: "ਪਾਠ 2: ਪੂਰਨ ਸੰਖਿਆਵਾਂ (Whole Numbers)",
            text: "ਯਾਦ ਰੱਖੋ: ਪੂਰਨ ਸੰਖਿਆਵਾਂ ਵਿੱਚ 0 ਅਤੇ ਸਾਰੀਆਂ ਕੁਦਰਤੀ ਸੰਖਿਆਵਾਂ 1, 2, 3, ... ਸ਼ਾਮਲ ਹੁੰਦੀਆਂ ਹਨ।"
        },
        {
            chapterName: "ਪਾਠ 3: ਸੰਖਿਆਵਾਂ ਨਾਲ ਖੇਡ (Playing with Numbers)",
            text: "ਯਾਦ ਰੱਖੋ: ਜੇ ਕੋਈ ਸੰਖਿਆ 2 ਅਤੇ 3 ਦੋਵਾਂ ਨਾਲ ਭਾਗ ਖਾਂਦੀ ਹੈ, ਤਾਂ ਉਹ 6 ਨਾਲ ਵੀ ਭਾਗ ਖਾਂਦੀ ਹੈ।"
        },
        {
            chapterName: "ਪਾਠ 4: ਭਿੰਨ (Fractions)",
            text: "ਯਾਦ ਰੱਖੋ: ਜਦੋਂ ਦੋ ਭਿੰਨਾਂ ਦਾ denominator ਇੱਕੋ ਜਿਹਾ ਹੋਵੇ, ਤਾਂ ਵੱਡੀ ਭਿੰਨ ਉਹ ਹੈ ਜਿਸਦਾ numerator ਵੱਡਾ ਹੈ।"
        },
        {
            chapterName: "ਪਾਠ 5: ਦਸ਼ਮਲਵ (Decimals)",
            text: "ਯਾਦ ਰੱਖੋ: ਦਸ਼ਮਲਵ ਵਿੱਚ ਖੱਬੇ ਤੋਂ ਸੱਜੇ ਵਲ ਜਾ ਕੇ tenths, hundredths, thousandths ਦੇ ਸਥਾਨ ਆਉਂਦੇ ਹਨ।"
        },
        {
            chapterName: "ਪਾਠ 6: ਬੁਨਿਆਦੀ ਜਿਆਮਿਤੀ ਵਿਚਾਰ (Basic Geometrical Ideas)",
            text: "ਯਾਦ ਰੱਖੋ: ਰੇਖਖੰਡ (line segment) ਦੇ ਦੋ end points ਹੁੰਦੇ ਹਨ, ਜਦਕਿ ਰੇ (ray) ਦਾ ਕੇਵਲ ਇੱਕ ਸ਼ੁਰੂਆਤੀ ਬਿੰਦੂ ਹੁੰਦਾ ਹੈ।"
        },
        {
            chapterName: "ਪਾਠ 7: ਆਕਾਰਾਂ ਦੀ ਸਮਝ (Understanding Elementary Shapes)",
            text: "ਯਾਦ ਰੱਖੋ: ਵਰਗ ਦੇ ਚਾਰੋ ਕੋਣ 90° ਦੇ ਹੁੰਦੇ ਹਨ ਅਤੇ ਸਾਰੇ ਪਾਸੇ ਬਰਾਬਰ ਹੁੰਦੇ ਹਨ।"
        },
        {
            chapterName: "ਪਾਠ 8: ਪਰੀਮੀਟਰ ਅਤੇ ਖੇਤਰਫਲ (Perimeter and Area)",
            text: "ਯਾਦ ਰੱਖੋ: ਆਯਤ (rectangle) ਦਾ ਪਰਿਮਾਪ = 2 (ਲੰਬਾਈ + ਚੌੜਾਈ) ਹੋਂਦਾ ਹੈ।"
        },
        {
            chapterName: "ਪਾਠ 9: ਪੇਸ਼ਕਾਰੀ ਡਾਟਾ (Data Handling)",
            text: "ਯਾਦ ਰੱਖੋ: pictograph ਵਿੱਚ ਹਰ ਚਿੰਨ੍ਹ ਕਿਸੇ ਨਿਰਧਾਰਿਤ ਗਿਣਤੀ ਨੂੰ ਦਰਸਾਉਂਦਾ ਹੈ, ਇਸ ਲਈ key ਨੂੰ ਧਿਆਨ ਨਾਲ ਪੜ੍ਹਨਾ ਚਾਹੀਦਾ ਹੈ।"
        },
        {
            chapterName: "ਪਾਠ 10: ਪੂਰਨ ਸੰਖਿਆਵਾਂ ਦਾ ਦੁਹਰਾਵਾ",
            text: "ਯਾਦ ਰੱਖੋ: ਕਿਸੇ ਵੀ ਪੂਰਨ ਸੰਖਿਆ ਨੂੰ number line ’ਤੇ ਸੱਜੇ ਵੱਲ ਜਾ ਕੇ ਵਧਾਇਆ ਅਤੇ ਖੱਬੇ ਵੱਲ ਜਾ ਕੇ ਘਟਾਇਆ ਜਾਂਦਾ ਹੈ।"
        }
    ],
    class_7: [
        {
            chapterName: "ਪਾਠ 1: ਸੰਪੂਰਨ ਸੰਖਿਆਵਾਂ (Integers)",
            text: "ਯਾਦ ਰੱਖੋ: ਸੰਪੂਰਨ ਸੰਖਿਆਵਾਂ ਵਿੱਚ ਰਣਾਤਮਕ ਨੰਬਰ, ਧਨਾਤਮਕ ਨੰਬਰ ਅਤੇ 0 — ਤਿੰਨੇ ਸ਼ਾਮਲ ਹੁੰਦੇ ਹਨ।"
        },
        {
            chapterName: "ਪਾਠ 1: ਸੰਪੂਰਨ ਸੰਖਿਆਵਾਂ (Integers)",
            text: "ਯਾਦ ਰੱਖੋ: ਇੱਕੋ ਜਿਹੇ ਨਿਸ਼ਾਨ ਵਾਲੀਆਂ ਸੰਖਿਆਵਾਂ ਨੂੰ ਜੋੜਦੇ ਸਮੇਂ ਅੰਕ ਜੋੜ ਕੇ ਨਿਸ਼ਾਨ ਉਹੀ ਰੱਖਦੇ ਹਾਂ।"
        },
        {
            chapterName: "ਪਾਠ 2: ਭਿੰਨਾਂ ਅਤੇ ਦਸ਼ਮਲਵ (Fractions & Decimals)",
            text: "ਯਾਦ ਰੱਖੋ: ਕਿਸੇ ਭਿੰਨ ਨੂੰ ਦਸ਼ਮਲਵ ਵਿੱਚ ਲਿਖਣ ਲਈ ਅੰਸ਼ ਨੂੰ every denominator ਨਾਲ ਭਾਗ ਕਰਦੇ ਹਾਂ।"
        },
        {
            chapterName: "ਪਾਠ 2: ਭਿੰਨਾਂ ਅਤੇ ਦਸ਼ਮਲਵ (Fractions & Decimals)",
            text: "ਯਾਦ ਰੱਖੋ: ਇੱਕੋ ਜਿਹੇ numerator ਵਾਲੀਆਂ unit ਭਿੰਨਾਂ ਵਿੱਚ ਜਿੰਨਾ ਵੱਡਾ denominator, ਭਿੰਨ ਉਨ੍ਹਾ ਛੋਟੀ ਹੋਵੇਗੀ।"
        },
        {
            chapterName: "ਪਾਠ 8: ਰੈਸ਼ਨਲ ਨੰਬਰ (Rational Numbers)",
            text: "ਯਾਦ ਰੱਖੋ: ਹਰ ਰੈਸ਼ਨਲ ਨੰਬਰ ਨੂੰ a/b ਦੇ ਰੂਪ ਵਿੱਚ ਲਿਖਿਆ ਜਾ ਸਕਦਾ ਹੈ, ਜਿੱਥੇ a ਅਤੇ b ਸੰਪੂਰਨ ਹਨ ਤੇ b ≠ 0।"
        },
        {
            chapterName: "ਪਾਠ 3: ਡਾਟਾ ਹੈਂਡਲਿੰਗ",
            text: "ਯਾਦ ਰੱਖੋ: Mean = ਸਭ ਮੁੱਲਾਂ ਦਾ ਜੋੜ ÷ ਮੁੱਲਾਂ ਦੀ ਕੁੱਲ ਗਿਣਤੀ।"
        },
        {
            chapterName: "ਪਾਠ 4: ਸਰਲ ਸਮੀਕਰਨ (Simple Equations)",
            text: "ਯਾਦ ਰੱਖੋ: x + a = b ਹੋਵੇ ਤਾਂ x = b − a ਲਿਖ ਕੇ ਹੱਲ ਕਰ ਸਕਦੇ ਹਾਂ।"
        },
        {
            chapterName: "ਪਾਠ 6: ਤ੍ਰਿਭੁਜ ਅਤੇ ਇਸ ਦੇ ਗੁਣ (Triangles)",
            text: "ਯਾਦ ਰੱਖੋ: ਕਿਸੇ ਵੀ ਤ੍ਰਿਭੁਜ ਦੇ ਅੰਦਰਲੇ ਤਿੰਨ ਕੋਣਾਂ ਦਾ ਜੋੜ ਹਮੇਸ਼ਾ 180° ਹੁੰਦਾ ਹੈ।"
        },
        {
            chapterName: "ਪਾਠ 9: ਪਰਿਮਾਪ ਅਤੇ ਖੇਤਰਫਲ (Perimeter & Area)",
            text: "ਯਾਦ ਰੱਖੋ: ਵਰਗ ਦਾ ਖੇਤਰਫਲ = s² ਅਤੇ ਪਰਿਮਾਪ = 4s ਹੁੰਦਾ ਹੈ, ਜਿਥੇ s ਪਾਸੇ ਦੀ ਲੰਬਾਈ ਹੈ।"
        },
        {
            chapterName: "ਪਾਠ 10: ਬੀਜਗਣੀਤਿਕ ਵਯੰਜਕ (Algebraic Expressions)",
            text: "ਯਾਦ ਰੱਖੋ: ਕਿਸੇ ਵਯੰਜਕ ਵਿੱਚ ਵੈਰੀਏਬਲ ਦੇ ਸਾਹਮਣੇ ਆਇਆ ਅੰਕ ਉਸ ਦਾ coefficient ਕਿਹਾ ਜਾਂਦਾ ਹੈ।"
        }
    ],
    class_8: [
        {
            chapterName: "Chapter 1: Rational Numbers",
            text: "Remember: A rational number can always be written as p/q, where p and q are integers and q ≠ 0."
        },
        {
            chapterName: "Chapter 1: Rational Numbers",
            text: "Remember: The product of two rational numbers with the same sign is positive, with different signs is negative."
        },
        {
            chapterName: "Chapter 2: Linear Equations in One Variable",
            text: "Remember: To solve ax + b = c, first subtract b from both sides, then divide by a."
        },
        {
            chapterName: "Chapter 3: Understanding Quadrilaterals",
            text: "Remember: The sum of the interior angles of any quadrilateral is 360°."
        },
        {
            chapterName: "Chapter 5: Data Handling",
            text: "Remember: Mode is the value that occurs most frequently in a data set."
        },
        {
            chapterName: "Chapter 6: Squares and Square Roots",
            text: "Remember: A number ending in 2, 3, 7, or 8 cannot be a perfect square."
        },
        {
            chapterName: "Chapter 7: Cubes and Cube Roots",
            text: "Remember: The cube of any integer can be written as n × n × n = n³."
        },
        {
            chapterName: "Chapter 8: Comparing Quantities",
            text: "Remember: Percentage = (part ÷ whole) × 100."
        },
        {
            chapterName: "Chapter 9: Algebraic Expressions and Identities",
            text: "Remember: (a + b)² = a² + 2ab + b² is a very useful identity in algebra."
        },
        {
            chapterName: "Chapter 11: Mensuration",
            text: "Remember: The area of a parallelogram is base × height, just like a rectangle."
        }
    ]
};

function buildFlashcardsFromData() {
    const map = {};
    if (typeof CLASSES !== "undefined") {
        Object.keys(CLASSES).forEach((key) => {
            const cls = CLASSES[key];
            if (!cls) return;

            const custom = CUSTOM_FLASHCARDS[cls.id];
            if (custom && custom.length) {
                map[cls.id] = custom.slice(0, 10).map((card) => ({
                    classId: cls.id,
                    className: cls.name,
                    chapterId: card.chapterId || null,
                    chapterName: card.chapterName || "",
                    text: card.text,
                }));
            } else {
                map[cls.id] = [];
            }
        });
    }
    flashcardsByClass = map;
}

function renderCurrentFlashcard() {
    const container = document.getElementById("poem-content");
    if (!container || !isFlashcardMode || !currentFlashcardClassId) return;

    const cards = flashcardsByClass[currentFlashcardClassId] || [];
    if (!cards.length) return;

    const idx = currentFlashcardIndex % cards.length;
    const card = cards[idx];

    // Prefer custom text-based knowledge bytes if present
    if (card.text) {
        container.innerHTML = `
            <div class="flashcard flashcard-enter">
                <div class="flashcard-label">Knowledge byte</div>
                <div class="flashcard-class">${card.className}</div>
                <div class="flashcard-question">“${card.text}”</div>
                <div class="flashcard-answer-label">ਮਹੱਤਵਪੂਰਣ ਵਿਚਾਰ</div>
                <div class="flashcard-meta">${card.chapterName} • ਫਲੈਸ਼ਕਾਰਡ ${idx + 1} / ${cards.length}</div>
                <div class="flashcard-timer">
                    <div class="flashcard-timer-inner"></div>
                </div>
            </div>
        `;
        return;
    }

    // Fallback: Turn (question, answer) into a modified knowledge byte
    const qRaw = (card.question || "").trim();
    const ans = (card.answer || "").trim();

    let knowledgeLine = ans;

    if (qRaw) {
        let base = qRaw;

        // Remove trailing question mark if present
        if (base.endsWith("?")) {
            base = base.slice(0, -1).trim();
        }

        // If it's a definition-style question: "... ਕੀ ਹੁੰਦਾ ਹੈ?" or "... ਕੀ ਹੈ?"
        if (/ਕੀ ਹੁੰਦਾ ਹੈ\??$/.test(qRaw) || /ਕੀ ਹੈ\??$/.test(qRaw)) {
            let concept = qRaw
                .replace(/ਕੀ ਹੁੰਦਾ ਹੈ\??$/, "")
                .replace(/ਕੀ ਹੈ\??$/, "")
                .trim();
            knowledgeLine = `ਯਾਦ ਰੱਖੋ: ${concept} = ${ans}`;
        } else if (base.includes("=")) {
            // If it's a numeric/formula style: "... = ?"
            let line = base;
            line = line.replace("= ?", `= ${ans}`);
            line = line.replace(" =?", `= ${ans}`);
            if (line.endsWith("=")) {
                line = line + " " + ans;
            }
            knowledgeLine = `ਯਾਦ ਰੱਖੋ: ${line}`;
        } else {
            // Generic fallback: turn question into a tip-style statement
            knowledgeLine = `ਯਾਦ ਰੱਖੋ: ${ans} ← ${base}`;
        }
    }

    container.innerHTML = `
        <div class="flashcard flashcard-enter">
            <div class="flashcard-label">Knowledge byte</div>
            <div class="flashcard-class">${card.className}</div>
            <div class="flashcard-question">“${knowledgeLine}”</div>
            <div class="flashcard-answer-label">ਮਹੱਤਵਪੂਰਣ ਵਿਚਾਰ</div>
            <div class="flashcard-meta">${card.chapterName} • ਫਲੈਸ਼ਕਾਰਡ ${idx + 1} / ${cards.length}</div>
            <div class="flashcard-timer">
                <div class="flashcard-timer-inner"></div>
            </div>
        </div>
    `;
}
function showNextFlashcard() {
    const cards = flashcardsByClass[currentFlashcardClassId] || [];
    if (!cards.length) return;
    currentFlashcardIndex = (currentFlashcardIndex + 1) % cards.length;
    renderCurrentFlashcard();
}

function stopFlashcards() {
    isFlashcardMode = false;
    currentFlashcardClassId = null;
    if (flashcardTimerId !== null) {
        clearInterval(flashcardTimerId);
        flashcardTimerId = null;
    }
}

function startFlashcardsForClass(classId) {
    if (!flashcardsByClass || !Object.keys(flashcardsByClass).length) return;

    const targetClassId = classId || selectedClassId;
    const cards = flashcardsByClass[targetClassId];
    if (!cards || !cards.length) return;

    // Make sure any existing timer is cleared
    stopFlashcards();
    isFlashcardMode = true;
    currentFlashcardClassId = targetClassId;
    currentFlashcardIndex = 0;

    const emptyState = document.getElementById("poem-empty-state");
    const poemPanel = document.getElementById("poem-panel");
    const quizFab = document.getElementById("start-quiz-fab");

    if (emptyState) emptyState.classList.add("hidden");
    if (poemPanel) poemPanel.classList.remove("hidden");
    if (quizFab) quizFab.classList.add("hidden");

    // When flashcards are visible, there is no active chapter loaded
    currentChapterId = null;
    currentPoemData = null;

    const titleEl = document.getElementById("poem-title-text");
    if (titleEl) {
        // Show current class name as heading while in flashcard mode
        titleEl.textContent = currentClassData ? currentClassData.name : "";
    }

    // Disable prev/next chapter buttons while in flashcard mode
    const prevBtn = document.getElementById("prev-chapter-btn");
    const nextBtn = document.getElementById("next-chapter-btn");
    if (typeof setNavButtonState === "function") {
        setNavButtonState(prevBtn, false);
        setNavButtonState(nextBtn, false);
    }

    renderCurrentFlashcard();

    flashcardTimerId = setInterval(() => {
        // If a poem gets loaded in between, stop rotating flashcards
        if (!isFlashcardMode || currentPoemData) {
            stopFlashcards();
            return;
        }
        showNextFlashcard();
    }, FLASHCARD_DURATION_MS);
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

    // When a new class is chosen and no chapter is selected yet,
    // show that class's flashcards in the poem-content area.
    if (typeof startFlashcardsForClass === "function") {
        startFlashcardsForClass(classId);
    }
}

function clearPoemPanel() {
    // Hide poem panel and quiz button, show empty state
    document.getElementById("poem-panel").classList.add("hidden");
    document.getElementById("start-quiz-fab").classList.add("hidden");
    document.getElementById("poem-empty-state").classList.remove("hidden");

    // Stop any flashcard carousel when clearing the panel
    if (typeof stopFlashcards === "function") {
        stopFlashcards();
    }

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
  const init = function () {
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

    // Build flashcards from data.js and show them when no chapter is selected
    buildFlashcardsFromData();
    startFlashcardsForClass(selectedClassId);

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

  if (window.CONTENT_READY && typeof window.CONTENT_READY.then === "function") {
    window.CONTENT_READY.then(init);
  } else {
    init();
  }
};
function loadChapters() {
    const chapterList = document.getElementById("chapter-list");
    const floatingSymbols = document.getElementById("floating-symbols");
  
    if (!chapterList) return;
  
    chapterList.innerHTML = "";
    if (floatingSymbols) floatingSymbols.innerHTML = "";
  
    if (!currentClassData) return;
  
    const sortedChapters = [...currentClassData.chapters].sort(
      (a, b) =>
        (a.name.match(/\d+/)?.[0] || 0) -
        (b.name.match(/\d+/)?.[0] || 0)
    );
  
    // Progress at top
    showClassProgress();
  
    sortedChapters.forEach((chapter, index) => {
      const item = document.createElement("button");
      item.type = "button";
  
      const isCompleted = isChapterCompleted(selectedClassId, chapter.id);
      const hasQuestions = chapter.questions && chapter.questions.length > 0;
      const questionCount = chapter.questions?.length || 0;
      const chapterNumber = String(index + 1).padStart(2, "0");
  
      let stateLabel, stateClasses;
      if (isCompleted) {
        stateLabel = "ਮੁਕੰਮਲ";
        stateClasses =
          "bg-emerald-50 text-emerald-700 border-emerald-100";
      } else if (!hasQuestions) {
        stateLabel = "ਜਲਦੀ";
        stateClasses =
          "bg-slate-50 text-slate-500 border-slate-100";
      } else {
        stateLabel = "ਤਿਆਰ";
        stateClasses =
          "bg-indigo-50 text-indigo-700 border-indigo-100";
      }
  
      item.className =
        "chapter-card group w-full text-left rounded-2xl bg-white " +
        "border border-slate-100 px-3.5 py-3 shadow-sm " +
        (hasQuestions
          ? "hover:shadow-md hover:-translate-y-[1px] cursor-pointer transition"
          : "opacity-60 cursor-not-allowed");
  
      item.setAttribute("data-chapter-id", chapter.id);
  
      if (hasQuestions) {
        item.onclick = (e) => {
          if (typeof createRipple === "function") {
            createRipple(e);
          }
          loadPoem(chapter);
        };
      } else {
        item.title = "Coming Soon";
      }
  
      item.innerHTML = `
        <div class="flex gap-3">
          <!-- Icon / thumbnail -->
          <div class="mt-1">
            <div class="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
              <span class="text-[11px] font-semibold text-slate-600">
                #${chapterNumber}
              </span>
            </div>
          </div>
  
          <!-- Main text -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <h4 class="text-sm font-semibold text-slate-900 leading-snug line-clamp-2">
                ${chapter.name}
              </h4>
              <span
                class="inline-flex items-center px-2 py-[2px] rounded-full text-[11px] font-medium border ${stateClasses}"
              >
                ${stateLabel}
              </span>
            </div>
  
            <div class="mt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span>${questionCount} ਸਵਾਲ</span>
              ${
                isCompleted
                  ? `<span class="inline-flex items-center gap-1 text-emerald-600">
                       <span class="material-symbols-outlined text-[14px]">check_circle</span>
                       <span>Done</span>
                     </span>`
                  : ""
              }
            </div>
          </div>
        </div>
      `;
  
      chapterList.appendChild(item);
    });
  
    highlightSelectedChapterCard();
  }
  
function showClassProgress() {
    const chapterList = document.getElementById("chapter-list");
    if (!chapterList) return;

    const status = getClassCompletionStatus(selectedClassId);
    if (!status || status.total <= 0) return;

    const progressBar = document.createElement("div");
    progressBar.className =
        "mb-3 p-3 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 via-sky-50 to-violet-50 shadow-sm";

    progressBar.innerHTML = `
        <div class="flex justify-between items-center mb-2">
            <span class="text-xs font-semibold text-slate-800">
                ਪਾਠ ਤਰੱਕੀ
            </span>
            <span class="text-xs font-semibold text-slate-700">
                ${status.completed}/${status.total}
            </span>
        </div>
        <div class="w-full bg-indigo-100 h-2 rounded-full overflow-hidden">
            <div
                class="h-2 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 transition-all duration-500"
                style="width: ${status.percentage}%;"
            ></div>
        </div>
    `;

    chapterList.appendChild(progressBar);
}

function highlightSelectedChapterCard() {
    const cards = document.querySelectorAll("#chapter-list .chapter-card");
    cards.forEach((card) => {
        const id = card.getAttribute("data-chapter-id");
        if (id === currentChapterId) {
            card.classList.add("chapter-selected");
        } else {
            card.classList.remove("chapter-selected");
        }
    });
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
            "sidebar-submenu-link w-full text-left";
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

        if (isHidden && typeof closeOtherSidebarPanels === "function") {
            closeOtherSidebarPanels('class-list-panel');
        }

        panel.classList.toggle("hidden");

        // Rotate chevron icon
        chevron.style.transform = isHidden ? "rotate(180deg)" : "rotate(0deg)";
    };
}

function loadPoem(chapterData) {
    currentChapterId = chapterData.id;
    currentPoemData = chapterData;

    // Stop flashcards when an actual poem/chapter is opened
    if (typeof stopFlashcards === "function") {
        stopFlashcards();
    }

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

 // Highlight the selected card in sidebar
 if (typeof highlightSelectedChapterCard === "function") {
    highlightSelectedChapterCard();
}
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
    // Do not start poem reading while flashcards are being shown
    if (isFlashcardMode) return;

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

const teacherAdminToggle = document.getElementById('teacher-admin-toggle');
const teacherAdminPanel = document.getElementById('teacher-admin-panel');
const teacherAdminArrow = teacherAdminToggle
  ? teacherAdminToggle.querySelector('.sidebar-arrow')
  : null;

if (teacherAdminToggle && teacherAdminPanel) {
  teacherAdminToggle.addEventListener('click', () => {
    const isHidden = teacherAdminPanel.classList.contains('hidden');

    if (isHidden && typeof closeOtherSidebarPanels === "function") {
      closeOtherSidebarPanels('teacher-admin-panel');
    }

    teacherAdminPanel.classList.toggle('hidden');
    if (teacherAdminArrow) {
      teacherAdminArrow.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
    }
  });
}

// Hide when clicking outside (extended)
document.addEventListener('click', (e) => {
  const target = e.target;

  if (liveQuizToggle && liveQuizPanel &&
      !liveQuizToggle.contains(target) &&
      !liveQuizPanel.contains(target)) {
    liveQuizPanel.classList.add('hidden');
    if (liveQuizArrow) {
      liveQuizArrow.style.transform = 'rotate(0deg)';
    }
  }

  if (teacherAdminToggle && teacherAdminPanel &&
      !teacherAdminToggle.contains(target) &&
      !teacherAdminPanel.contains(target)) {
    teacherAdminPanel.classList.add('hidden');
    if (teacherAdminArrow) {
      teacherAdminArrow.style.transform = 'rotate(0deg)';
    }
  }

  const classToggleBtn = document.getElementById('class-toggle-btn');
  const classPanel = document.getElementById('class-list-panel');
  const classChevron = document.getElementById('chevron-icon');

  if (classToggleBtn && classPanel &&
      !classToggleBtn.contains(target) &&
      !classPanel.contains(target)) {
    classPanel.classList.add('hidden');
    if (classChevron) {
      classChevron.style.transform = 'rotate(0deg)';
    }
  }
});

// App sidebar collapse (icon-only mode)
const appSidebar = document.getElementById('app-sidebar');
const appSidebarToggle = document.getElementById('app-sidebar-toggle');

if (appSidebar && appSidebarToggle) {
  const appSidebarIcon = appSidebarToggle.querySelector('.material-symbols-outlined');
  appSidebarToggle.addEventListener('click', () => {
    const collapsed = appSidebar.classList.toggle('app-sidebar-collapsed');
    if (appSidebarIcon) {
      appSidebarIcon.textContent = collapsed ? 'chevron_right' : 'chevron_left';
    }
    // Close dropdown panels when collapsed
    const livePanel = document.getElementById('live-quiz-panel');
    const classPanel = document.getElementById('class-list-panel');
    const teacherPanel = document.getElementById('teacher-admin-panel');
    const classChevron = document.getElementById('chevron-icon');
    if (livePanel) livePanel.classList.add('hidden');
    if (classPanel) classPanel.classList.add('hidden');
    if (teacherPanel) teacherPanel.classList.add('hidden');
    if (classChevron) classChevron.style.transform = 'rotate(0deg)';
  });
}

// === Auto-reset collapsed sidebar on mobile/tablet (below lg breakpoint) ===
const mqSidebarReset = window.matchMedia('(max-width: 1023px)'); // Tailwind lg breakpoint

function resetSidebarForSmallScreen(e) {
  if (!e.matches) return; // only when entering small screens
  const sidebar = document.getElementById('app-sidebar');
  const toggleBtn = document.getElementById('app-sidebar-toggle');
  if (!sidebar) return;

  if (sidebar.classList.contains('app-sidebar-collapsed')) {
    sidebar.classList.remove('app-sidebar-collapsed');

    // Restore toggle icon to chevron_left
    const icon = toggleBtn
      ? toggleBtn.querySelector('.material-symbols-outlined')
      : null;
    if (icon) icon.textContent = 'chevron_left';
  }
}

// Run at load (in case user lands directly on mobile while collapsed)
resetSidebarForSmallScreen(mqSidebarReset);

// Trigger whenever viewport size changes
if (mqSidebarReset.addEventListener) {
  mqSidebarReset.addEventListener('change', resetSidebarForSmallScreen);
} else if (mqSidebarReset.addListener) {
  mqSidebarReset.addListener(resetSidebarForSmallScreen);
}


const liveQuizToggle = document.getElementById('live-quiz-toggle');
const liveQuizPanel = document.getElementById('live-quiz-panel');
const liveQuizArrow = liveQuizToggle ? liveQuizToggle.querySelector('.sidebar-arrow') : null;

if (liveQuizToggle && liveQuizPanel) {
  liveQuizToggle.addEventListener('click', () => {
    const isHidden = liveQuizPanel.classList.contains('hidden');

    if (isHidden && typeof closeOtherSidebarPanels === "function") {
      closeOtherSidebarPanels('live-quiz-panel');
    }

    liveQuizPanel.classList.toggle('hidden');
    if (liveQuizArrow) {
      liveQuizArrow.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
    }
  });
}

/**
 * Ensure only one sidebar submenu (quiz, class, admin) is open at a time.
 * `exceptId` can be 'live-quiz-panel', 'class-list-panel', or 'teacher-admin-panel'.
 */
function closeOtherSidebarPanels(exceptId) {
  const classPanel = document.getElementById('class-list-panel');
  const classChevron = document.getElementById('chevron-icon');

  const panels = [
    { id: 'live-quiz-panel', panel: liveQuizPanel, arrow: liveQuizArrow },
    { id: 'class-list-panel', panel: classPanel, arrow: classChevron },
    { id: 'teacher-admin-panel', panel: teacherAdminPanel, arrow: teacherAdminArrow }
  ];

  panels.forEach(({ id, panel, arrow }) => {
    if (!panel) return;
    if (id === exceptId) return;
    panel.classList.add('hidden');
    if (arrow) {
      arrow.style.transform = 'rotate(0deg)';
    }
  });
}



