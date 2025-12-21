/**
 * ==========================================================================
 * EN-KAI プロジェクト - 共通ロジック (script.js v4.8)
 * ==========================================================================
 */

const rawTopics = {
    icebreak: ["最近笑ったことは？", "子供の頃のあだ名は？", "今の気分を天気で言うと？", "好きな食べ物ベスト3！", "自分を動物に例えると？"],
    casual: ["一生これしか食べられないなら何？", "今一番行きたい旅行先は？", "スマホの待ち受け、何にしてる？", "昨日何食べた？"],
    business: ["仕事で一番やりがいを感じる瞬間は？", "尊敬している人は誰？", "集中力を上げる方法は？", "今年の目標は？"]
};

let activeTopics = [], currentMode = "icebreak", currentIndex = 0, timerInterval = null;
let initialTime = 60, timeLeft = 60, currentRating = 0;

/* 画面切り替え */
function showScreen(id) {
    const screens = document.querySelectorAll('.screen');
    if (screens.length === 0) {
        location.href = `index.html?screen=${id}`;
        return;
    }
    screens.forEach(s => s.style.display = 'none');
    const target = document.getElementById(id);
    if (target) target.style.display = 'block';
    
    if (document.getElementById('side-menu').classList.contains('active')) toggleMenu();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleMenu() {
    document.getElementById('side-menu').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
}

function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('dark-mode', isDark ? 'enabled' : 'disabled');
}

/* 宴会開始 */
function onStartClicked() {
    const rbs = document.getElementsByName("mode");
    for (let rb of rbs) { if (rb.checked) { currentMode = rb.value; break; } }
    activeTopics = [...rawTopics[currentMode]].sort(() => Math.random() - 0.5);
    currentIndex = 0;
    showScreen('main-screen');
    resetTimer();
    updateTopicUI();
}

function updateTopicUI() {
    const t = document.getElementById("topic-text");
    if (t) t.innerText = activeTopics[currentIndex];
}

function nextTopic() {
    if (currentIndex < activeTopics.length - 1) { currentIndex++; resetTimer(); updateTopicUI(); }
    else { handleFinishClick(); }
}

function toggleTimer() {
    const btn = document.getElementById("timer-start-btn");
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; btn.innerText = "スタート"; }
    else {
        btn.innerText = "ストップ";
        timerInterval = setInterval(() => {
            if (timeLeft > 0) { timeLeft--; updateTimerDisplay(); }
            else { clearInterval(timerInterval); timerInterval = null; btn.innerText = "スタート"; }
        }, 1000);
    }
}

function resetTimer() {
    clearInterval(timerInterval); timerInterval = null; timeLeft = initialTime;
    updateTimerDisplay(); 
    if(document.getElementById("timer-start-btn")) document.getElementById("timer-start-btn").innerText = "スタート";
}

function updateTimerDisplay() {
    const d = document.getElementById("timer-display"), b = document.getElementById("timer-bar-fill");
    if (d && b) {
        const m = Math.floor(timeLeft / 60), s = timeLeft % 60;
        d.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        b.style.width = (timeLeft / initialTime * 100) + "%";
    }
}

function handleFinishClick() { showScreen('finish-screen'); }

function setRating(v) {
    currentRating = v;
    document.querySelectorAll('.star').forEach((s, i) => s.classList.toggle('active', i < v));
}

async function saveSessionRecord() {
    const memo = document.getElementById('session-memo').value;
    const user = window.auth.currentUser;
    await window.dbMethods.addDoc(window.dbMethods.collection(window.db, "sessions"), {
        uid: user ? user.uid : "guest",
        userName: user ? user.displayName : "ゲスト",
        rating: currentRating, memo: memo, timestamp: Date.now()
    });
    showToast();
    showScreen('welcome-screen');
}

async function handleLogin() { await window.authMethods.signInWithPopup(window.auth, window.authMethods.provider); }
async function handleLogout() { await window.auth.signOut(); location.reload(); }

function showToast() {
    const t = document.getElementById('toast-notification');
    if (t) { t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3000); }
}

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('dark-mode') === 'enabled') document.body.classList.add('dark-mode');
    const params = new URLSearchParams(window.location.search);
    if (params.get('screen')) showScreen(params.get('screen'));
});