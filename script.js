/**
 * ==========================================================================
 * EN-KAI CORE SCRIPT (v12.0.0)
 * 開発者: たなりんくん / パートナー: Gemini
 * ==========================================================================
 */

// --- データベース ---
const topics = {
    icebreak: ["初対面での鉄板ネタは？", "最近一番笑った出来事", "子供の頃の意外な夢", "自分を動物に例えるなら？", "得意料理（または好物）"],
    casual: ["3億円当たったらどう隠す？", "明日地球が終わるなら何食べる？", "最近の個人的な重大ニュース", "誰にも言えない変な癖", "今の悩みを聞いてくれ！"],
    business: ["仕事で最も嬉しかった瞬間", "尊敬するプロフェッショナル", "5年後の自分はどうなってる？", "今の業務のこだわり", "新人に伝えたい仕事の極意"]
};
const missions = ["全員を1人ずつ褒める", "語尾に『～だわさ』をつける", "最近買った高いものを白状", "1分間、右隣の人を尊敬する", "全力でかっこいいポーズ"];

// --- 状態管理 ---
let state = {
    mode: 'icebreak',
    activeTopics: [],
    currIdx: 0,
    timer: null,
    timeLeft: 60,
    members: [],
    rating: 0
};

// --- 初期化 & ナビゲーション ---
window.nav = (id) => {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'block';
    if(document.getElementById('side-menu').classList.contains('active')) toggleMenu();
    window.scrollTo({top: 0, behavior: 'smooth'});
};

window.toggleMenu = () => {
    document.getElementById('side-menu').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
};

window.toggleDark = () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('dark', document.body.classList.contains('dark-mode'));
    toast(document.body.classList.contains('dark-mode') ? "Dark Mode ON" : "Light Mode ON");
};

// --- 設定制御 ---
window.setMode = (mode, id) => {
    state.mode = mode;
    document.querySelectorAll('.mode-chip').forEach(c => c.classList.remove('active'));
    document.getElementById(id).classList.add('active');
};

window.startEnkai = () => {
    const nameVal = document.getElementById('names').value.trim();
    if(!nameVal) { toast("メンバーを入力してください"); return; }
    
    state.members = nameVal.split(/[\s　]+/);
    state.activeTopics = [...topics[state.mode]].sort(() => Math.random() - 0.5);
    state.currIdx = 0;
    
    document.getElementById('slot-ui').style.display = document.getElementById('slot-sw').checked ? 'block' : 'none';
    
    nav('main-screen');
    renderQ();
    timerReset();
};

// --- メイン進行 ---
function renderQ() {
    document.getElementById('topic-disp').innerText = state.activeTopics[state.currIdx];
    document.getElementById('q-count').innerText = `Q ${state.currIdx + 1} / ${state.activeTopics.length}`;
    document.getElementById('fin-btn').innerText = "🛑 終了";
}

window.nextQ = () => {
    if(state.currIdx < state.activeTopics.length - 1) {
        state.currIdx++; renderQ(); timerReset();
    } else {
        finishCheck();
    }
};

window.prevQ = () => {
    if(state.currIdx > 0) { state.currIdx--; renderQ(); timerReset(); }
};

window.finishCheck = () => {
    const btn = document.getElementById('fin-btn');
    if(btn.innerText === "🛑 終了") {
        btn.innerText = "本当にお開き？";
        btn.style.borderColor = "var(--primary)";
    } else {
        nav('finish-screen');
    }
};

// --- タイマーロジック ---
window.timerToggle = () => {
    const btn = document.getElementById('t-play');
    if(state.timer) {
        clearInterval(state.timer); state.timer = null; btn.innerText = "▶️";
    } else {
        btn.innerText = "⏸️";
        state.timer = setInterval(() => {
            if(state.timeLeft > 0) {
                state.timeLeft--;
                document.getElementById('timer-num').innerText = `00:${state.timeLeft.toString().padStart(2,'0')}`;
                document.getElementById('progress-bar').style.width = (state.timeLeft/60)*100 + "%";
            } else {
                clearInterval(state.timer); state.timer = null; btn.innerText = "▶️";
                toast("タイムアップ！⏰");
            }
        }, 1000);
    }
};

window.timerReset = () => {
    clearInterval(state.timer); state.timer = null;
    state.timeLeft = 60;
    document.getElementById('timer-num').innerText = "01:00";
    document.getElementById('progress-bar').style.width = "100%";
    document.getElementById('t-play').innerText = "▶️";
};

// --- スロットロジック (アニメーション強化) ---
window.spin = () => {
    const t = document.getElementById('s-target');
    const k = document.getElementById('s-task');
    let count = 0;
    const itv = setInterval(() => {
        t.innerText = state.members[Math.floor(Math.random() * state.members.length)];
        k.innerText = missions[Math.floor(Math.random() * missions.length)];
        if(++count > 15) clearInterval(itv);
    }, 70);
};

// --- Firebase & レポート ---
window.setRate = (v) => {
    state.rating = v;
    document.querySelectorAll('.fire-icon').forEach((f, i) => f.classList.toggle('active', i < v));
};

window.save = async () => {
    if(state.rating === 0) { toast("ファイヤを選択してください"); return; }
    try {
        await window.fb.addDoc(window.fb.collection(window.db, "sessions"), {
            rating: state.rating,
            memo: document.getElementById('memo').value,
            timestamp: Date.now()
        });
        toast("保存完了！");
        setTimeout(() => location.reload(), 1000);
    } catch(e) { toast("エラーが発生しました"); }
};

window.openReport = async () => {
    nav('report-screen');
    const list = document.getElementById('report-list');
    list.innerHTML = "<div style='text-align:center; padding:50px;'>Loading...</div>";
    
    try {
        const q = window.fb.query(window.fb.collection(window.db, "sessions"), window.fb.orderBy("timestamp", "desc"), window.fb.limit(10));
        const snap = await window.fb.getDocs(q);
        
        let count = snap.size;
        let totalF = 0;
        let html = "";
        
        snap.forEach(doc => {
            const d = doc.data();
            totalF += d.rating;
            html += `
                <div class="report-item">
                    <div style="display:flex; justify-content:space-between;">
                        <span>${"🔥".repeat(d.rating)}</span>
                        <small style="opacity:0.5;">${new Date(d.timestamp).toLocaleDateString()}</small>
                    </div>
                    <p style="margin:10px 0 0; font-size:0.9rem;">${d.memo || "楽しかった！"}</p>
                </div>`;
        });
        
        // 統計アニメーション (requestAnimationFrameによる簡易実装)
        animateNum('total-s', count);
        animateNum('total-f', totalF);
        list.innerHTML = html || "まだレポートがありません。";
    } catch(e) { list.innerHTML = "取得に失敗しました。"; }
};

function animateNum(id, target) {
    let curr = 0;
    const el = document.getElementById(id);
    const step = () => {
        curr += Math.ceil(target / 20);
        if(curr >= target) { el.innerText = target; }
        else { el.innerText = curr; requestAnimationFrame(step); }
    };
    step();
}

// --- ユーティリティ ---
function toast(m) {
    const t = document.getElementById('toast');
    t.innerText = m; t.classList.add('active');
    setTimeout(() => t.classList.remove('active'), 3000);
}

window.login = async () => {
    try { await window.fb.signInWithPopup(window.auth, window.provider); toast("Welcome!"); } catch(e) { toast("Error"); }
};

window.logout = async () => {
    if(confirm("ログアウトしますか？")) { await window.fb.signOut(window.auth); location.reload(); }
};

window.sendFb = () => {
    const text = document.getElementById('fb-text').value;
    if(!text) return;
    toast("送信しました。ありがとう！");
    document.getElementById('fb-text').value = "";
    setTimeout(() => nav('welcome-screen'), 1000);
};

// --- 起動 ---
document.addEventListener('DOMContentLoaded', () => {
    if(localStorage.getItem('dark') === 'true') document.body.classList.add('dark-mode');
});