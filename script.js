/**
 * ==========================================================================
 * EN-KAI 実行制御スクリプト (script.js v10.9.0)
 * ==========================================================================
 */

// --- 話題・ミッションデータ ---
const rawTopics = {
    icebreak: ["最近一番笑ったこと", "子供の頃の意外な夢", "自分を動物に例えると？", "スマホの待ち受け画面の理由", "得意料理（または食べたい料理）"],
    casual: ["3億円当たったらどう隠す？", "明日から世界が終わるなら何食べる？", "最近の個人的大ニュース", "他人に理解されない変な癖", "今の悩みを聞いてくれ！"],
    business: ["仕事で一番嬉しかった瞬間", "尊敬するプロフェッショナル", "5年後の自分はどうなってる？", "今の業務のこだわりポイント", "新人に教えたい仕事のコツ"]
};
const slotMissions = ["全員を1人ずつ褒める", "語尾に『～だわさ』をつける", "最近買った高いものを告白", "1分間、右隣の人を尊敬の眼差しで見つめる", "全力でかっこいいポーズをとる"];

// --- 状態管理変数 ---
let activeTopics = [];
let currentMode = "icebreak";
let currentIndex = 0;
let timerInterval = null;
let timeLeft = 60;
const initialTime = 60;
let currentRating = 0;
let members = [];

// --- 【重要】全体統計の読み込みとアニメーション演出 ---
async function loadGlobalStats() {
    const sessionEl = document.getElementById('global-session-count');
    const fireEl = document.getElementById('global-fire-count');
    if (!sessionEl || !fireEl) return;

    try {
        const querySnapshot = await window.dbMethods.getDocs(window.dbMethods.collection(window.db, "sessions"));
        let totalSessions = querySnapshot.size;
        let totalFires = 0;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            totalFires += (data.rating || 0);
        });

        // 数字がカウントアップする演出
        animateNumber(sessionEl, totalSessions);
        animateNumber(fireEl, totalFires);
    } catch (e) {
        console.error("統計ロード失敗:", e);
    }
}

function animateNumber(element, target) {
    let current = 0;
    const duration = 1500; // 1.5秒かけてカウントアップ
    const stepTime = 50;
    const increment = Math.ceil(target / (duration / stepTime));
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.innerText = target.toLocaleString();
            clearInterval(timer);
        } else {
            element.innerText = current.toLocaleString();
        }
    }, stepTime);
}

// --- 画面ナビゲーション ---
function showScreen(id) {
    // 全画面を隠す
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    // 指定した画面を表示
    const target = document.getElementById(id);
    if (target) target.style.display = 'block';
    
    // サイドメニューが開いていれば閉じる
    if (document.getElementById('side-menu').classList.contains('active')) {
        toggleMenu();
    }
    // 画面の一番上へ
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleMenu() {
    document.getElementById('side-menu').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    showToast(document.body.classList.contains('dark-mode') ? "ダークモード ON" : "ライトモード ON");
}

// --- 宴会メインロジック ---
function onStartClicked() {
    const nameInput = document.getElementById('member-names').value.trim();
    members = nameInput ? nameInput.split(/[\s　]+/) : ["ゲスト1", "ゲスト2"];
    
    // スロット使用有無
    const isSlotEnabled = document.getElementById('slot-toggle').checked;
    document.getElementById('slot-container').style.display = isSlotEnabled ? 'block' : 'none';
    
    // お題のシャッフル準備
    activeTopics = [...rawTopics[currentMode]].sort(() => Math.random() - 0.5);
    currentIndex = 0;
    
    showScreen('main-screen');
    updateTopicUI();
    resetTimer();
    showToast("🔥 宴会開始！");
}

function updateTopicUI() {
    document.getElementById("topic-text").innerText = activeTopics[currentIndex];
    document.getElementById("step-info").innerText = `Q ${currentIndex + 1} / ${activeTopics.length}`;
    document.getElementById('finish-trigger').innerText = "🛑 終了";
}

function nextTopic() {
    if (currentIndex < activeTopics.length - 1) {
        currentIndex++;
        updateTopicUI();
        resetTimer();
    } else {
        handleFinishClick();
    }
}

function prevTopic() {
    if (currentIndex > 0) {
        currentIndex--;
        updateTopicUI();
        resetTimer();
    }
}

// --- ミッションスロット ---
function spinSlot() {
    const textEl = document.getElementById('slot-text');
    const targetEl = document.getElementById('slot-target');
    let count = 0;
    
    const interval = setInterval(() => {
        textEl.innerText = slotMissions[Math.floor(Math.random() * slotMissions.length)];
        targetEl.innerText = members[Math.floor(Math.random() * members.length)];
        
        if (++count > 15) {
            clearInterval(interval);
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]); // 振動演出
        }
    }, 80);
}

// --- タイマー機能 ---
function toggleTimer() {
    const btn = document.getElementById("timer-play-btn");
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        btn.innerText = "▶️";
    } else {
        btn.innerText = "⏸️";
        timerInterval = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateTimerDisplay();
            } else {
                clearInterval(timerInterval);
                timerInterval = null;
                btn.innerText = "▶️";
                showToast("タイムアップ！⏰");
            }
        }, 1000);
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    timeLeft = initialTime;
    updateTimerDisplay();
    document.getElementById("timer-play-btn").innerText = "▶️";
}

function updateTimerDisplay() {
    const display = document.getElementById("timer-display-compact");
    const bar = document.getElementById("timer-bar-fill");
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    display.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    bar.style.width = (timeLeft / initialTime) * 100 + "%";
}

// --- Firebase連携（保存・レポート） ---
async function saveSessionRecord() {
    if (currentRating === 0) {
        showToast("🔥 満足度をタップしてね！");
        return;
    }
    const memo = document.getElementById('session-memo').value.trim();
    try {
        await window.dbMethods.addDoc(window.dbMethods.collection(window.db, "sessions"), {
            rating: currentRating,
            memo: memo,
            mode: currentMode,
            timestamp: Date.now()
        });
        showToast("レポートを送信しました！");
        setTimeout(() => location.reload(), 1200);
    } catch (e) {
        console.error(e);
        showToast("保存に失敗しました");
    }
}

async function showReport() {
    showScreen('report-screen');
    loadGlobalStats(); // 統計の最新化
    
    const listEl = document.getElementById('memo-list');
    listEl.innerHTML = "<p style='text-align:center; padding:20px;'>読み込み中...</p>";
    
    try {
        const q = window.dbMethods.query(
            window.dbMethods.collection(window.db, "sessions"),
            window.dbMethods.orderBy("timestamp", "desc"),
            window.dbMethods.limit(10)
        );
        const snap = await window.dbMethods.getDocs(q);
        let html = "";
        snap.forEach(d => {
            const data = d.data();
            const date = new Date(data.timestamp).toLocaleDateString();
            html += `
                <div class="card" style="margin-bottom:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:1.2rem;">${"🔥".repeat(data.rating)}</span>
                        <small style="opacity:0.6;">${date}</small>
                    </div>
                    <p style="margin-top:8px; font-size:0.9rem;">${data.memo || "(ノーコメント)"}</p>
                </div>
            `;
        });
        listEl.innerHTML = html || "<p style='text-align:center;'>まだデータがありません</p>";
    } catch(e) {
        listEl.innerHTML = "<p style='text-align:center;'>読み込みエラー</p>";
    }
}

// --- 認証・ユーティリティ ---
async function handleLogin() {
    try {
        await window.authMethods.signInWithPopup(window.auth, window.provider);
        showToast("ログイン成功！");
    } catch (e) {
        showToast("ログイン失敗");
    }
}

async function handleLogout() {
    if(confirm("ログアウトしますか？")) {
        await window.authMethods.signOut(window.auth);
        location.reload();
    }
}

function sendFeedback() {
    const content = document.getElementById('feedback-content').value;
    if(!content) return;
    showToast("フィードバックを送信しました！");
    document.getElementById('feedback-content').value = "";
    setTimeout(() => showScreen('welcome-screen'), 1000);
}

function selectChip(el, mode) {
    document.querySelectorAll('.mode-item').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    currentMode = mode;
}

function setRating(val) {
    currentRating = val;
    document.querySelectorAll('.star-icon').forEach((s, i) => {
        s.classList.toggle('active', i < val);
    });
}

function handleFinishClick() {
    const btn = document.getElementById('finish-trigger');
    if (btn.innerText === "🛑 終了") {
        btn.innerText = "本当にお開き？";
        btn.style.borderColor = "var(--primary)";
    } else {
        showScreen('finish-screen');
    }
}

function showToast(msg) {
    const toast = document.getElementById('toast-notification');
    toast.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// --- 初期化 ---
document.addEventListener('DOMContentLoaded', () => {
    // グローバル関数への紐付け（HTMLのonclickから呼べるようにする）
    window.showScreen = showScreen;
    window.toggleMenu = toggleMenu;
    window.toggleDarkMode = toggleDarkMode;
    window.onStartClicked = onStartClicked;
    window.nextTopic = nextTopic;
    window.prevTopic = prevTopic;
    window.spinSlot = spinSlot;
    window.toggleTimer = toggleTimer;
    window.resetTimer = resetTimer;
    window.setRating = setRating;
    window.saveSessionRecord = saveSessionRecord;
    window.showReport = showReport;
    window.selectChip = selectChip;
    window.handleFinishClick = handleFinishClick;
    window.handleLogin = handleLogin;
    window.handleLogout = handleLogout;
    window.sendFeedback = sendFeedback;

    // 初回統計ロード
    loadGlobalStats();
});