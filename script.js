/**
 * ==========================================================================
 * EN-KAI プロジェクト - 共通ロジック (script.js v6.2)
 * ==========================================================================
 */
const rawTopics = {
    icebreak: ["最近笑ったことは？", "子供の頃のあだ名は？", "今の気分を天気で言うと？", "好きな食べ物ベスト3！", "自分を動物に例えると？"],
    casual: ["一生これしか食べられないなら何？", "今一番行きたい旅行先は？", "昨日何食べた？", "スマホの待ち受け、何にしてる？"],
    business: ["仕事でやりがいを感じる瞬間は？", "尊敬している人は？", "今年の目標は？", "集中力を上げる方法は？"]
};

let activeTopics = [], currentMode = "icebreak", currentIndex = 0, timerInterval = null;
let initialTime = 60, timeLeft = 60, currentRating = 0;

/* 画面制御 */
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    const target = document.getElementById(id);
    if (target) target.style.display = 'block';
    const sideMenu = document.getElementById('side-menu');
    if (sideMenu && sideMenu.classList.contains('active')) toggleMenu();
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

/* 宴会メイン */
function onStartClicked() {
    const rbs = document.getElementsByName("mode");
    for (let rb of rbs) { if (rb.checked) { currentMode = rb.value; break; } }
    activeTopics = [...rawTopics[currentMode]].sort(() => Math.random() - 0.5);
    currentIndex = 0;
    showScreen('main-screen');
    resetTimer();
    updateTopicUI();
    document.getElementById('finish-trigger').innerText = "🛑 宴会をお開きにする";
}

function updateTopicUI() { document.getElementById("topic-text").innerText = activeTopics[currentIndex]; }

function nextTopic() {
    if (currentIndex < activeTopics.length - 1) { currentIndex++; resetTimer(); updateTopicUI(); }
    else { handleFinishClick(); }
}

/* タイマー */
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
    const btn = document.getElementById("timer-start-btn");
    if(btn) btn.innerText = "スタート";
}

function updateTimerDisplay() {
    const d = document.getElementById("timer-display"), b = document.getElementById("timer-bar-fill");
    if (d && b) {
        const m = Math.floor(timeLeft / 60), s = timeLeft % 60;
        d.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        b.style.width = (timeLeft / initialTime * 100) + "%";
    }
}

/* 終了・保存ロジック (バリデーション修正済み) */
function handleFinishClick() {
    const btn = document.getElementById('finish-trigger');
    if (btn.innerText === "🛑 宴会をお開きにする") { btn.innerText = "本当にお開きにしますか？"; }
    else { 
        currentRating = 0;
        document.querySelectorAll('.star').forEach(s => s.classList.remove('active'));
        document.getElementById('session-memo').value = "";
        document.getElementById('validation-error').style.display = 'none';
        showScreen('finish-screen'); 
    }
}

function setRating(v) {
    currentRating = v;
    document.querySelectorAll('.star').forEach((s, i) => s.classList.toggle('active', i < v));
    document.getElementById('validation-error').style.display = 'none';
}

async function saveSessionRecord() {
    const memo = document.getElementById('session-memo').value.trim();
    // バリデーション：満足度(🔥)だけ必須に変更
    if (currentRating === 0) {
        document.getElementById('validation-error').style.display = 'block';
        return;
    }

    const user = window.auth.currentUser;
    let finalName = "ゲスト";

    if(user) {
        // Firestoreからニックネームを優先取得
        const uDoc = await window.dbMethods.getDoc(window.dbMethods.doc(window.db, "users", user.uid));
        finalName = uDoc.exists() ? uDoc.data().nickname : user.displayName;
    }

    try {
        await window.dbMethods.addDoc(window.dbMethods.collection(window.db, "sessions"), {
            uid: user ? user.uid : "guest",
            userName: finalName,
            rating: currentRating,
            memo: memo, // テキストは空でも保存
            timestamp: Date.now()
        });
        showToast();
        showScreen('welcome-screen');
        if(user) loadProfileStats(user.uid);
        loadDashboardData();
    } catch (e) { alert("保存に失敗しました。"); }
}

/* プロフィール設定 (ニックネーム保存) */
async function saveNickname() {
    const user = window.auth.currentUser;
    const nick = document.getElementById('user-nickname-input').value.trim();
    if(!user || !nick) return;

    try {
        await window.dbMethods.setDoc(window.dbMethods.doc(window.db, "users", user.uid), {
            nickname: nick,
            updatedAt: Date.now()
        });
        showToast();
        // UI上の名前を即時更新
        document.getElementById('user-status').innerText = nick + " さん";
        showScreen('welcome-screen');
    } catch (e) { alert("保存に失敗しました。"); }
}

/* レポート・統計表示 */
async function showReport() {
    showScreen('report-screen');
    const listEl = document.getElementById('memo-list');
    const user = window.auth.currentUser;
    if(user) loadProfileStats(user.uid);
    loadGlobalStats();

    try {
        const q = window.dbMethods.query(
            window.dbMethods.collection(window.db, "sessions"),
            window.dbMethods.orderBy("timestamp", "desc"),
            window.dbMethods.limit(20)
        );
        const snap = await window.dbMethods.getDocs(q);
        let html = "";
        snap.forEach(doc => {
            const data = doc.data();
            const date = new Date(data.timestamp).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            // メモが空の場合は表示を調整
            const displayMemo = data.memo ? `<div class="memo-text">${data.memo}</div>` : "";
            html += `<div class="report-item">
                        <h4><span>👤 ${data.userName}</span> <span>🕒 ${date}</span></h4>
                        <div class="stars">${"🔥".repeat(data.rating)}</div>
                        ${displayMemo}
                    </div>`;
        });
        listEl.innerHTML = html || "まだ誰もレポートを投稿していません。";
    } catch (e) { listEl.innerHTML = "データの取得に失敗しました。"; }
}

/* 認証 */
async function handleLogin() {
    try { await window.authMethods.signInWithPopup(window.auth, window.provider); showToast(); }
    catch (e) { alert("ログイン失敗: " + e.message); }
}

async function handleLogout() { await window.authMethods.signOut(window.auth); location.reload(); }

async function loadProfileStats(uid) {
    try {
        const q = window.dbMethods.query(window.dbMethods.collection(window.db, "sessions"), window.dbMethods.where("uid", "==", uid));
        const snap = await window.dbMethods.getDocs(q);
        let total = 0, count = 0;
        snap.forEach(doc => { total += doc.data().rating; count++; });
        document.getElementById('stat-count').innerText = count;
        document.getElementById('stat-rate').innerText = count > 0 ? (total / count).toFixed(1) : "0.0";
    } catch(e) {}
}

async function loadGlobalStats() {
    try {
        const snap = await window.dbMethods.getDocs(window.dbMethods.collection(window.db, "sessions"));
        let totalStars = 0, totalCount = 0;
        snap.forEach(doc => { totalStars += doc.data().rating; totalCount++; });
        document.getElementById('global-count').innerText = totalCount;
        document.getElementById('global-stars').innerText = totalStars;
    } catch(e) {}
}

async function loadDashboardData() {
    const el = document.getElementById('ranking-list');
    try {
        const q = window.dbMethods.query(window.dbMethods.collection(window.db, "sessions"), window.dbMethods.orderBy("timestamp", "desc"), window.dbMethods.limit(5));
        const snap = await window.dbMethods.getDocs(q);
        let html = "";
        snap.forEach(doc => { 
            html += `<div style="padding:10px 0; border-bottom:1px solid var(--card-border); font-size:0.85rem; display:flex; justify-content:space-between;">
                        <span>✨ <b>${doc.data().userName}</b> さん</span>
                        <span style="color:var(--primary); font-weight:900;">🔥 ${doc.data().rating}</span>
                     </div>`; 
        });
        if(el) el.innerHTML = html || "活動を待っています！";
    } catch(e) {}
}

function showToast() {
    const t = document.getElementById('toast-notification');
    if (t) { t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3000); }
}

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('dark-mode') === 'enabled') document.body.classList.add('dark-mode');
    loadDashboardData();
});