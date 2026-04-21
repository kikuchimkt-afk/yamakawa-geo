// ===========================
// 山川 一問一答 地理 - Quiz App
// ===========================

(function () {
  'use strict';

  // --- Data Configuration ---
  const DATA_FILES = [
    { file: 'data/part1_chapter1.json', partNum: 1, chapterNum: 1 },
    { file: 'data/part1_chapter2.json', partNum: 1, chapterNum: 2 },
    { file: 'data/part1_chapter3.json', partNum: 1, chapterNum: 3 },
    { file: 'data/part1_chapter4.json', partNum: 1, chapterNum: 4 },
    { file: 'data/part1_chapter5.json', partNum: 1, chapterNum: 5 },
    { file: 'data/part1_chapter6.json', partNum: 1, chapterNum: 6 },
    { file: 'data/part1_chapter7.json', partNum: 1, chapterNum: 7 },
    { file: 'data/part2_chapter1.json', partNum: 2, chapterNum: 1 },
    { file: 'data/part2_chapter2.json', partNum: 2, chapterNum: 2 },
    { file: 'data/part2_chapter3.json', partNum: 2, chapterNum: 3 },
    { file: 'data/part2_chapter4.json', partNum: 2, chapterNum: 4 },
    { file: 'data/part2_chapter5.json', partNum: 2, chapterNum: 5 },
    { file: 'data/part2_chapter6.json', partNum: 2, chapterNum: 6 },
    { file: 'data/part3_chapter1.json', partNum: 3, chapterNum: 1 },
    { file: 'data/part3_chapter2.json', partNum: 3, chapterNum: 2 },
    { file: 'data/part3_chapter3.json', partNum: 3, chapterNum: 3 },
    { file: 'data/part4_chapter1.json', partNum: 4, chapterNum: 1 },
    { file: 'data/part4_chapter2.json', partNum: 4, chapterNum: 2 },
    { file: 'data/part4_chapter3.json', partNum: 4, chapterNum: 3 }
    // 今後ここに章を追加
  ];

  // --- State ---
  let quizData = null;
  let currentQuestions = [];
  let currentIndex = 0;
  let correctCount = 0;
  let answered = false;
  let currentPartTitle = '';
  let currentChapterTitle = '';
  let currentSectionTitle = '';

  // --- DOM References ---
  const screens = {
    title: document.getElementById('screen-title'),
    quiz: document.getElementById('screen-quiz'),
    result: document.getElementById('screen-result')
  };

  const els = {
    chapterSelectArea: document.getElementById('chapter-select-area'),
    partChapter: document.getElementById('quiz-part-chapter'),
    section: document.getElementById('quiz-section'),
    currentNum: document.getElementById('quiz-current-num'),
    totalNum: document.getElementById('quiz-total-num'),
    progressFill: document.getElementById('progress-fill'),
    questionCard: document.getElementById('question-card'),
    questionId: document.getElementById('question-id'),
    questionText: document.getElementById('question-text'),
    questionImageArea: document.getElementById('question-image-area'),
    optionsArea: document.getElementById('options-area'),
    feedbackArea: document.getElementById('feedback-area'),
    feedbackContent: document.getElementById('feedback-content'),
    btnNext: document.getElementById('btn-next'),
    btnBack: document.getElementById('btn-back'),
    resultIcon: document.getElementById('result-icon'),
    resultPercent: document.getElementById('result-percent'),
    resultCorrect: document.getElementById('result-correct'),
    resultTotal: document.getElementById('result-total'),
    resultMessage: document.getElementById('result-message'),
    scoreRing: document.getElementById('score-ring'),
    btnRetry: document.getElementById('btn-retry'),
    btnHome: document.getElementById('btn-home')
  };

  // --- Utility Functions ---
  function shuffleArray(arr) {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  function showScreen(name) {
    Object.keys(screens).forEach(key => {
      screens[key].classList.remove('active');
    });
    screens[name].classList.add('active');
  }

  // --- Data Loading ---
  async function loadAllData() {
    const allData = [];
    for (const config of DATA_FILES) {
      try {
        const response = await fetch(config.file);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        allData.push(data);
      } catch (err) {
        console.error(`Failed to load ${config.file}:`, err);
      }
    }
    return allData;
  }

  // --- Title Screen ---
  function renderChapterSelect(allData) {
    els.chapterSelectArea.innerHTML = '';

    allData.forEach(data => {
      const card = document.createElement('div');
      card.className = 'chapter-card';

      const totalQuestions = data.sections.reduce((sum, s) => sum + s.questions.length, 0);

      let sectionsHTML = '';
      data.sections.forEach(section => {
        sectionsHTML += `
          <button class="section-select-btn" data-part="${data.part.number}" data-chapter="${data.chapter.number}" data-section="${section.number}">
            ${section.number}. ${section.title}（${section.questions.length}問）
          </button>
        `;
      });

      card.innerHTML = `
        <div class="chapter-card-header">
          <span class="chapter-card-part">第${toRoman(data.part.number)}部 ${data.part.title}</span>
          <span class="chapter-card-count">${totalQuestions}問</span>
        </div>
        <div class="chapter-card-title">第${data.chapter.number}章 ${data.chapter.title}</div>
        <div class="chapter-card-sections">
          ${sectionsHTML}
          <button class="btn-start-all" data-part="${data.part.number}" data-chapter="${data.chapter.number}" data-section="all">
            全問チャレンジ（${totalQuestions}問）
          </button>
        </div>
      `;

      els.chapterSelectArea.appendChild(card);
    });

    // Event listeners for section/all buttons
    document.querySelectorAll('.section-select-btn, .btn-start-all').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const partNum = parseInt(btn.dataset.part);
        const chapterNum = parseInt(btn.dataset.chapter);
        const sectionNum = btn.dataset.section;

        const targetData = allData.find(d => d.part.number === partNum && d.chapter.number === chapterNum);
        if (!targetData) return;

        startQuiz(targetData, sectionNum);
      });
    });
  }

  function toRoman(num) {
    const roman = ['', 'I', 'II', 'III', 'IV', 'V'];
    return roman[num] || num.toString();
  }

  // --- Quiz Logic ---
  function startQuiz(data, sectionNum) {
    quizData = data;
    currentPartTitle = `第${toRoman(data.part.number)}部 ${data.part.title}`;
    currentChapterTitle = `第${data.chapter.number}章 ${data.chapter.title}`;

    if (sectionNum === 'all') {
      currentQuestions = [];
      data.sections.forEach(s => {
        currentQuestions.push(...s.questions);
      });
      currentSectionTitle = '全セクション';
    } else {
      const section = data.sections.find(s => s.number === parseInt(sectionNum));
      if (!section) return;
      currentQuestions = [...section.questions];
      currentSectionTitle = `${section.number}. ${section.title}`;
    }

    currentIndex = 0;
    correctCount = 0;
    answered = false;

    els.partChapter.textContent = `${currentPartTitle} ─ ${currentChapterTitle}`;
    els.section.textContent = currentSectionTitle;
    els.totalNum.textContent = currentQuestions.length;

    showScreen('quiz');
    renderQuestion();
  }

  function renderQuestion() {
    answered = false;
    const q = currentQuestions[currentIndex];

    // Update progress
    els.currentNum.textContent = currentIndex + 1;
    const progress = ((currentIndex) / currentQuestions.length) * 100;
    els.progressFill.style.width = progress + '%';

    // Question info
    els.questionId.textContent = q.id;
    els.questionText.textContent = q.question;

    // Image
    els.questionImageArea.innerHTML = '';
    const imgSrc = q.imagePath || q.image;
    if (q.hasImage && imgSrc) {
      const img = document.createElement('img');
      img.src = imgSrc;
      img.alt = '問題図';
      img.loading = 'lazy';
      img.style.maxWidth = '100%';
      img.style.borderRadius = '8px';
      img.style.marginTop = '12px';
      els.questionImageArea.appendChild(img);
    }

    // Shuffle options
    const shuffledOptions = shuffleArray(q.options);

    // Render options
    els.optionsArea.innerHTML = '';
    const labels = ['A', 'B', 'C', 'D'];
    shuffledOptions.forEach((option, idx) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.innerHTML = `
        <span class="option-label">${labels[idx]}</span>
        <span class="option-text">${option}</span>
      `;
      btn.addEventListener('click', () => handleAnswer(btn, option, q.answer));
      els.optionsArea.appendChild(btn);
    });

    // Hide feedback
    els.feedbackArea.style.display = 'none';

    // Animate card
    els.questionCard.style.animation = 'none';
    requestAnimationFrame(() => {
      els.questionCard.style.animation = 'slideUp 0.4s ease';
    });
  }

  function handleAnswer(selectedBtn, selectedOption, correctAnswer) {
    if (answered) return;
    answered = true;

    const isCorrect = selectedOption === correctAnswer;
    if (isCorrect) correctCount++;

    // Mark all buttons
    const allBtns = els.optionsArea.querySelectorAll('.option-btn');
    allBtns.forEach(btn => {
      btn.classList.add('disabled');
      const text = btn.querySelector('.option-text').textContent;
      if (text === correctAnswer) {
        btn.classList.add('correct');
      }
    });

    if (!isCorrect) {
      selectedBtn.classList.add('incorrect');
    }

    // Show feedback
    els.feedbackArea.style.display = 'block';
    els.feedbackContent.className = 'feedback-content ' + (isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      els.feedbackContent.innerHTML = '✅ 正解！';
    } else {
      els.feedbackContent.innerHTML = `❌ 不正解… 正解は <strong>${correctAnswer}</strong>`;
    }

    // Update next button text
    if (currentIndex >= currentQuestions.length - 1) {
      els.btnNext.textContent = '結果を見る';
    } else {
      els.btnNext.textContent = '次の問題へ';
    }
  }

  function nextQuestion() {
    currentIndex++;
    if (currentIndex >= currentQuestions.length) {
      showResult();
    } else {
      renderQuestion();
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // --- Result Screen ---
  function showResult() {
    const percent = Math.round((correctCount / currentQuestions.length) * 100);

    showScreen('result');

    // Icon
    if (percent >= 90) {
      els.resultIcon.textContent = '🏆';
    } else if (percent >= 70) {
      els.resultIcon.textContent = '🎯';
    } else if (percent >= 50) {
      els.resultIcon.textContent = '📖';
    } else {
      els.resultIcon.textContent = '💪';
    }

    // Score numbers
    els.resultCorrect.textContent = correctCount;
    els.resultTotal.textContent = currentQuestions.length;

    // Animated percent counter
    let currentPercent = 0;
    const interval = setInterval(() => {
      currentPercent++;
      els.resultPercent.textContent = currentPercent;
      if (currentPercent >= percent) {
        clearInterval(interval);
      }
    }, 20);

    // Score ring animation
    const circumference = 2 * Math.PI * 52; // r=52
    const offset = circumference - (percent / 100) * circumference;
    setTimeout(() => {
      els.scoreRing.style.strokeDashoffset = offset;
    }, 100);

    // Change ring color based on score
    if (percent >= 80) {
      els.scoreRing.style.stroke = 'var(--success)';
    } else if (percent >= 50) {
      els.scoreRing.style.stroke = 'var(--warning)';
    } else {
      els.scoreRing.style.stroke = 'var(--error)';
    }

    // Message
    if (percent === 100) {
      els.resultMessage.textContent = '完璧です！すべての問題に正解しました。この調子で次の章に進みましょう！';
    } else if (percent >= 80) {
      els.resultMessage.textContent = '素晴らしい成績です！間違えた問題を復習して、完璧を目指しましょう。';
    } else if (percent >= 60) {
      els.resultMessage.textContent = 'よく頑張りました！もう一度挑戦して、さらに得点を伸ばしましょう。';
    } else {
      els.resultMessage.textContent = 'まだ伸びしろがあります！テキストを見直して、もう一度挑戦してみましょう。';
    }
  }

  // --- Event Listeners ---
  els.btnNext.addEventListener('click', nextQuestion);

  els.btnBack.addEventListener('click', () => {
    showScreen('title');
  });

  els.btnRetry.addEventListener('click', () => {
    startQuiz(quizData, 'all');
  });

  els.btnHome.addEventListener('click', () => {
    showScreen('title');
    // Reset score ring
    els.scoreRing.style.strokeDashoffset = 326.73;
  });

  // --- Initialize ---
  async function init() {
    const allData = await loadAllData();
    if (allData.length === 0) {
      els.chapterSelectArea.innerHTML = '<p style="color:var(--text-secondary);text-align:center;">データの読み込みに失敗しました。</p>';
      return;
    }
    renderChapterSelect(allData);
  }

  init();
})();
