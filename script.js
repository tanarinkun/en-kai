/**
 * 1. お題データ
 */
const topics = {
    casual: [
        "最近ハマっている飲み物は？", 
        "今一番行きたい旅行先は？", 
        "最近あった『ちょっと良いこと』は？", 
        "スマホの待ち受け画面、何にしてる？",
        "自分を動物に例えると何？"
    ],
    business: [
        "今日この場で一番楽しみなことは？", 
        "仕事で最近発見した『ライフハック』は？", 
        "仕事中の集中力を高める方法は？",
        "今年中に達成したい目標は？",
        "おすすめのビジネスツールや本は？"
    ]
};

/**
 * 2. グローバル変数
 */
let currentMode = "";
let currentIndex = 0;
let timerInterval = null;
let initialTime = 60;
let timeLeft = 60;
let currentRating = 0;

/**
 * 3. 画面制御
 */
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    const target = document.getElementById(screenId);
    if(target) target.style.display = 'block';
    
    // サイドメニューが開いていれば閉じる
    if(document.getElementById('side-menu').classList.contains('active')) toggleMenu();
    window.scrollTo(0, 0);
}

function toggleMenu() {
    document.getElementById('side-menu').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
}

/**
 * 4. 進行ロジック
 */
function onStartClicked() {
    const radioButtons = document.getElementsByName("mode");
    for (let rb of radioButtons) {
        if (rb.checked) {
            currentMode = rb.value;
            break;
        }
    }
    showScreen('main-screen');
    currentIndex = 0;
    resetTimer();
    showTopic();
}

function showTopic() { 
    const textElement = document.getElementById("topic-text");
    textElement.innerText = topics[currentMode][currentIndex]; 
}

function nextTopic() { 
    currentIndex = (currentIndex + 1) % topics[currentMode].length; 
    resetTimer(); 
    showTopic(); 
}

/**
 * 5. タイマー処理
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
                alert("お時間です！次の人に回しましょう。");
                btn.innerText = "スタート";
            }
        }, 1000);
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    timeLeft = initialTime;
    updateTimerDisplay();
    document.getElementById("timer-start-btn").innerText = "スタート";
}

function updateTimerDisplay() {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    document.getElementById("timer-display").innerText = 
        `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    
    const bar = document.getElementById("timer-bar-fill");
    if (bar) bar.style.width = (timeLeft / initialTime * 100) + "%";
}

/**
 * 6. 評価・Firebase連携
 */
function finishSession() {
    currentRating = 0;
    document.querySelectorAll('.star').forEach(s => s.classList.remove('active'));
    document.getElementById('session-memo').value = "";
    showScreen('finish-screen');
}

function setRating(val) {
    currentRating = val;
    document.querySelectorAll('.star').forEach((s, idx) => {
        idx < val ? s.classList.add('active') : s.classList.remove('active');
    });
}

function showToast() {
    const toast = document.getElementById('toast-notification');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

async function saveSessionRecord() {
    if (currentRating === 0) {
        alert("今の盛り上がり(🔥)を選んでください！");
        return;
    }
    const saveBtn = document.getElementById('save-btn');
    saveBtn.innerText = "送信中...";
    saveBtn.disabled = true;

    try {
        await window.dbMethods.addDoc(window.dbMethods.collection(window.db, "sessions"), {
            mode: currentMode,
            rating: currentRating,
            memo: document.getElementById('session-memo').value,
            timestamp: Date.now()
        });
        
        showToast(); 
        showScreen('finish-thanks-screen'); 
        
    } catch (e) {
        console.error(e);
        alert("保存に失敗しました。");
    } finally {
        saveBtn.innerText = "クラウドに保存して終了";
        saveBtn.disabled = false;
    }
}

/**
 * 7. レポート表示機能
 */
async function showReport() {
    showScreen('report-screen');
    const statsDiv = document.getElementById('stats-summary');
    const memoList = document.getElementById('memo-list');
    statsDiv.innerHTML = "読込中...";
    memoList.innerHTML = "";

    try {
        // Firebaseから最新順にデータを取得
        const q = window.dbMethods.query(
            window.dbMethods.collection(window.db, "sessions"), 
            window.dbMethods.orderBy("timestamp", "desc")
        );
        const querySnapshot = await window.dbMethods.getDocs(q);
        
        let totalRating = 0;
        let count = 0;
        let html = "";

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            totalRating += data.rating;
            count++;
            
            const dateStr = new Date(data.timestamp).toLocaleString('ja-JP', {
                month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'
            });
            
            html += `
                <div class="memo-item">
                    <div style="font-weight:bold; color:var(--primary);">🔥 盛り上がり: ${data.rating}</div>
                    <div style="margin-bottom:4px;">${data.memo || '(メモなし)'}</div>
                    <div style="font-size:0.75rem; color:var(--text-sub);">${dateStr}</div>
                </div>`;
        });

        if (count === 0) {
            statsDiv.innerHTML = "まだデータがありません。";
        } else {
            statsDiv.innerHTML = `<strong>宴会回数:</strong> ${count}回<br><strong>盛り上がり平均:</strong> 🔥 ${(totalRating/count).toFixed(1)}`;
            memoList.innerHTML = html;
        }
    } catch (e) {
        console.error(e);
        statsDiv.innerHTML = "読み込みエラーが発生しました。";
    }
}