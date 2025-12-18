const topics = {
  casual: [
    "最近ハマっている飲み物は？",
    "最近あったちょっと良いこと",
    "おすすめのコンビニ商品",
    "子どもの頃好きだった遊び",
    "最近笑った出来事"
  ],
  business: [
    "最近の仕事での発見",
    "仕事で大切にしていること",
    "今後挑戦したいこと",
    "理想の働き方",
    "最近学んだこと"
  ],
  rec: [
    "今の気分を天気で例えると？",
    "最近体を動かした？",
    "好きな音は？",
    "深呼吸してみよう",
    "今ここで見えるものを一つ"
  ]
};

let currentMode = null;
let index = 0;

function selectMode(mode, btn) {
  currentMode = mode;
  index = 0;

  document.querySelectorAll(".mode-btn").forEach(b =>
    b.classList.remove("active")
  );
  btn.classList.add("active");

  document.getElementById("topic-text").textContent =
    topics[mode][index];
}

function nextTopic() {
  if (!currentMode) return;
  index = (index + 1) % topics[currentMode].length;
  document.getElementById("topic-text").textContent =
    topics[currentMode][index];
}
