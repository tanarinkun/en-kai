// ===============================
// EN-KAI メインロジック
// ===============================

// 状態管理
let currentStep = 0;

// 会話フェーズ（必要最低限）
const steps = [
  {
    title: "まずは軽く",
    message: "最近あった、ちょっとした出来事を一人ずつ話してみよう。"
  },
  {
    title: "少し広げる",
    message: "最近ハマっていることや、気になっていることはある？"
  },
  {
    title: "場を温める",
    message: "子どもの頃に好きだったものを思い出してみよう。"
  },
  {
    title: "締めに向けて",
    message: "今日集まってよかったと思ったことを一つだけ。"
  }
];

// DOM取得
const startBtn = document.getElementById("startBtn");
const endScreen = document.getElementById("endScreen");
const closeBtn = document.getElementById("closeBtn");
const mainArea = document.querySelector(".main-area");

// 表示更新
function renderStep() {
  mainArea.innerHTML = `
    <h2>${steps[currentStep].title}</h2>
    <p>${steps[currentStep].message}</p>
    <button id="nextBtn">次へ</button>
  `;

  document.getElementById("nextBtn").addEventListener("click", nextStep);
}

// 次のステップへ
function nextStep() {
  currentStep++;

  if (currentStep < steps.length) {
    renderStep();
  } else {
    showEndScreen();
  }
}

// 終了画面表示
function showEndScreen() {
  mainArea.innerHTML = "";
  endScreen.classList.remove("hidden");
}

// イベント
startBtn.addEventListener("click", () => {
  renderStep();
});

closeBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});
