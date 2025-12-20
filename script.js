/**
 * お題データの定義
 */
const topics = {
    casual: ["最近ハマっている飲み物は？", "今一番行きたい場所は？", "最近あった『ちょっと良いこと』", "スマホの待ち受け画面は何？", "最近、新しく買ったものは？"],
    business: ["今日この場で楽しみなことは？", "仕事での『最近の発見』は？", "皆さんの『仕事の必需品』は？", "集中力を高める方法は？"],
    rec: ["全員で深呼吸しましょう", "今の気分を『天気』で例えると？", "隣の人と挨拶しましょう"]
};

// 内部管理用の変数
let currentMode = "";      // 現在のモード
let currentIndex = 0;      // 現在のお題番号
let timerInterval = null;  // タイマー管理用
let initialTime = 60;      // 1分
let timeLeft = 60;         // 残り時間

/**
 * 画面切り替え関数
 * @param {string} screenId 表示するセクションのID
 */
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    const target = document.getElementById(screenId);
    if (target) target.style.display = 'block';
    window.scrollTo(0, 0);
}

/**
 * 配列をランダムに入れ替える
 */
function shuffleTopics(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

/**
 * モードを選んで開始する時の処理
 */
function onStartClicked() {
    const radioButtons = document.getElementsByName("mode");
    for (let rb of radioButtons) if (rb.checked) { currentMode = rb.value; break; }
    
    shuffleTopics(topics[currentMode]);
    showScreen('main-screen');
    currentIndex = 0;
    resetTimer();
    showTopic();
}

/**
 * お題の表示
 */
function showTopic() {
    document.getElementById("topic-text").innerText = topics[currentMode][currentIndex];
}

/**
 * 次のお題への切り替え
 */
function nextTopic() {
    currentIndex = (currentIndex + 1) % topics[currentMode].length;
    if (currentIndex === 0) shuffleTopics(topics[currentMode]);
    resetTimer();
    showTopic();
}

/**
 * タイマーのON/OFF切り替え
 */
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
                
                // 終了時演出：バイブとフラッシュ
                if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                document.body.style.backgroundColor = "#fff";
                setTimeout(() => { document.body.style.backgroundColor = "var(--bg)"; }, 200);

                alert("時間終了です！");
                btn.innerText = "スタート";
            }
        }, 1000);
    }
}

/**
 * タイマーの初期化
 */
function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    timeLeft = initialTime;
    updateTimerDisplay();
    document.getElementById("timer-start-btn").innerText = "スタート";
}

/**
 * タイマー表示（数字とバー）の更新
 */
function updateTimerDisplay() {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    const timerElement = document.getElementById("timer-display");
    timerElement.innerText = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    
    if (timeLeft <= 10 && timeLeft > 0) {
        timerElement.classList.add("timer-warning");
    } else {
        timerElement.classList.remove("timer-warning");
    }
    
    const bar = document.getElementById("timer-bar-fill");
    if (bar) {
        const percent = (timeLeft / initialTime) * 100;
        bar.style.width = percent + "%";
        bar.style.background = timeLeft <= 10 ? "#e74c3c" : "var(--primary)";
    }
}

/**
 * メニューの開閉制御
 */
function toggleMenu() {
    document.getElementById('side-menu').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
}