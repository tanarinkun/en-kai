const topics = {
    casual: ["最近ハマっている飲み物は？", "今一番行きたい場所は？", "最近あった『ちょっと良いこと』", "スマホの待ち受け画面は何？", "最近、新しく買ったものは？"],
    business: ["今日この場で楽しみなことは？", "仕事での『最近の発見』は？", "皆さんの『仕事の必需品』は？", "集中力を高める方法は？"],
    rec: ["全員で深呼吸しましょう", "今の気分を『天気』で例えると？", "隣の人と挨拶しましょう"]
};

let currentMode = "";
let currentIndex = 0;
let timerInterval = null;
let timeLeft = 60;

function onStartClicked() {
    const radioButtons = document.getElementsByName("mode");
    for (let rb of radioButtons) if (rb.checked) { currentMode = rb.value; break; }
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('main-screen').style.display = 'block';
    resetTimer();
    showTopic();
}

function showTopic() {
    document.getElementById("topic-text").innerText = topics[currentMode][currentIndex];
}

function nextTopic() {
    currentIndex = (currentIndex + 1) % topics[currentMode].length;
    resetTimer();
    showTopic();
}

function toggleTimer() {
    const btn = document.getElementById("timer-start-btn");
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        btn.innerText = "スタート";
    } else {
        btn.innerText = "ストップ";
        timerInterval = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateTimerDisplay();
            } else {
                clearInterval(timerInterval);
                timerInterval = null;
                alert("時間終了です！");
            }
        }, 1000);
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    timeLeft = 60;
    updateTimerDisplay();
    document.getElementById("timer-start-btn").innerText = "スタート";
}

function updateTimerDisplay() {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    document.getElementById("timer-display").innerText = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

function toggleMenu() {
    document.getElementById('side-menu').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
}