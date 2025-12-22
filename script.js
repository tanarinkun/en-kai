/**
 * ==========================================================================
 * EN-KAI CORE SCRIPT (v16.1.0)
 * 修正：称号システム、アニメーション強化、プロフィール機能拡充
 * ==========================================================================
 */

(function() {
    console.log("System initializing...");

    const topics = {
        icebreak: ["第一印象、お互いどう感じました？", "最近一番笑ったことを教えてください", "自分を家電に例えるなら何？", "好きな食べ物ベスト3は？", "最近ハマっている趣味"],
        casual: ["3億円当たったら、まず何に使う？", "明日世界が終わるなら何食べる？", "ここだけの秘密を1つ公開！", "最近の個人的な大ニュース", "人生で一番の失敗談"],
        business: ["仕事で最も達成感を感じる瞬間は？", "尊敬するリーダーの条件とは？", "5年後の自分はどうなっていたい？", "今の仕事を選んだ理由", "仕事中のリフレッシュ方法"]
    };
    const missions = ["全員を1人ずつ褒める", "語尾に『～だぜ』をつける", "今の所持金を告白する", "全力でかっこいいポーズ", "スマホの待受画面を見せる"];

    // 【②】日本語画面名
    const pageTitlesJp = {
        'welcome-screen': 'ホーム',
        'start-screen': '宴会準備',
        'main-screen': '宴会中',
        'finish-screen': 'お開き',
        'profile-screen': 'プロフィール',
        'guide-screen': '使い方',
        'report-screen': '宴会レポート',
        'about-screen': '制作者'
    };

    // 【⑦】通常称号データ定義
    const titlesData = [
        { count: 0, label: "新人幹事候補" },
        { count: 1, label: "ビギナー幹事" },
        { count: 3, label: "見習い幹事" },
        { count: 5, label: "空気読み職人" },
        { count: 10, label: "盛り上げ隊長" },
        { count: 20, label: "宴会マスター" },
        { count: 30, label: "伝説の幹事" }
    ];

    let state = {
        mode: 'icebreak',
        activeTopics: [],
        currIdx: 0,
        members: [],
        rating: 0,
        userName: "ゲスト",
        isLoggedIn: false,
        partyCount: 0,
        selectedTitle: "新人幹事候補",
        specialTitle: "", // 期間限定称号
        isSpecialTitleActive: false
    };

    // --- 【①】画面遷移 & 【②】タイトル更新 ---
    window.nav = function(id) {
        console.log("Navigating to:", id);
        const screens = document.querySelectorAll('.screen');
        
        // 既存の画面を非表示にする
        screens.forEach(s => s.style.display = 'none');

        const target = document.getElementById(id);
        if (target) {
            target.style.display = 'block'; // CSSアニメーションが発火
            const label = document.getElementById('current-page-name');
            if(label) label.innerText = pageTitlesJp[id] || 'EN-KAI';
        }
        
        closeAllModals();
        window.scrollTo(0, 0);

        // プロフィール画面ならデータ再読込
        if (id === 'profile-screen') fetchUserStats();
    };

    // --- モーダル・サイドメニュー制御 ---
    window.closeAllModals = function() {
        document.getElementById('side-menu').classList.remove('active');
        document.getElementById('overlay').classList.remove('active');
        document.getElementById('confirm-modal').classList.remove('active');
        document.getElementById('first-guide-modal').classList.remove('active');
    };

    window.toggleMenu = function() {
        document.getElementById('side-menu').classList.toggle('active');
        document.getElementById('overlay').classList.toggle('active');
    };

    // 【③】初回ガイド
    function checkFirstVisit() {
        if (!localStorage.getItem('enkai_visited_v2')) {
            setTimeout(() => {
                document.getElementById('first-guide-modal').classList.add('active');
                document.getElementById('overlay').classList.add('active');
            }, 800);
        }
    }

    // 【③】ガイド終了後にホームへ遷移
    window.closeFirstGuide = function() {
        localStorage.setItem('enkai_visited_v2', 'true');
        closeAllModals();
        window.nav('welcome-screen');
    };

    // 【⑪】お開き確認モーダル表示
    window.finishCheck = function() {
        document.getElementById('confirm-modal').classList.add('active');
        document.getElementById('overlay').classList.add('active');
    };

    // --- 【⑥】【⑦】【⑨】称号 & プロフィールシステム ---

    async function fetchUserStats() {
        if (!state.isLoggedIn || !window.fb) return;
        
        const countEl = document.getElementById('stat-count');
        const selector = document.getElementById('title-selector');
        
        try {
            // 開催数の取得
            const q = window.fb.query(
                window.fb.collection(window.db, "sessions"), 
                window.fb.where("uid", "==", window.auth.currentUser.uid)
            );
            const snap = await window.fb.getDocs(q);
            state.partyCount = snap.size;
            countEl.innerText = state.partyCount;

            // ユーザー設定の取得（選択中称号など）
            const userDoc = await window.fb.getDoc(window.fb.doc(window.db, "users", window.auth.currentUser.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                state.selectedTitle = data.selectedTitle || "ビギナー幹事";
                state.isSpecialTitleActive = data.isSpecialTitleActive || false;
            }

            // 【⑨】期間限定称号の判定
            checkSpecialTitles();

            // 称号セレクトボックスの更新（獲得済みのみ）
            selector.innerHTML = "";
            titlesData.forEach(t => {
                if (state.partyCount >= t.count) {
                    const opt = document.createElement('option');
                    opt.value = t.label;
                    opt.innerText = t.label;
                    if (t.label === state.selectedTitle) opt.selected = true;
                    selector.appendChild(opt);
                }
            });

            updateBadgeUI();
        } catch (e) { console.error(e); }
    }

    // 【⑨】期間限定称号ロジック
    function checkSpecialTitles() {
        const now = new Date();
        const specialArea = document.getElementById('special-title-area');
        state.specialTitle = "";

        // 条件A: 12月
        if (now.getMonth() === 11) {
            state.specialTitle = "年末幹事王";
        }
        // 条件B: 連続3日（簡易的に当日開催歴がある場合など。本来は履歴走査が必要）
        // ここでは12月称号を優先表示例とします

        if (state.specialTitle) {
            specialArea.style.display = 'block';
            document.getElementById('special-title-name').innerText = "✨ " + state.specialTitle;
            document.getElementById('special-title-sw').checked = state.isSpecialTitleActive;
        } else {
            specialArea.style.display = 'none';
        }
    }

    // バッジUIの更新
    function updateBadgeUI() {
        const mainBadge = document.getElementById('p-main-badge');
        const specBadge = document.getElementById('p-special-badge');
        const sideBadge = document.getElementById('side-title-badge');

        mainBadge.innerText = state.selectedTitle;
        sideBadge.innerText = state.selectedTitle;
        sideBadge.style.display = 'inline-block';

        if (state.specialTitle && state.isSpecialTitleActive) {
            specBadge.innerText = state.specialTitle;
            specBadge.style.display = 'inline-block';
        } else {
            specBadge.style.display = 'none';
        }
    }

    window.changeSelectedTitle = async function() {
        const val = document.getElementById('title-selector').value;
        state.selectedTitle = val;
        updateBadgeUI();
        saveUserConfig();
    };

    window.toggleSpecialTitle = function() {
        state.isSpecialTitleActive = document.getElementById('special-title-sw').checked;
        updateBadgeUI();
        saveUserConfig();
    };

    async function saveUserConfig() {
        if (!state.isLoggedIn) return;
        await window.fb.setDoc(window.fb.doc(window.db, "users", window.auth.currentUser.uid), {
            selectedTitle: state.selectedTitle,
            isSpecialTitleActive: state.isSpecialTitleActive,
            displayName: state.userName
        }, { merge: true });
    }

    window.updateProfileName = function() {
        if (!state.isLoggedIn) return;
        state.userName = document.getElementById('display-name').value.trim() || "ゲスト";
        document.getElementById('side-name-label').innerText = state.userName + " 様";
        saveUserConfig();
        toast("名前を保存しました");
    };

    // --- 宴会進行ロジック ---
    window.setMode = function(mode, id) {
        state.mode = mode;
        document.querySelectorAll('.mode-chip').forEach(c => c.classList.remove('active'));
        document.getElementById(id).classList.add('active');
    };

    window.toggleNameInput = function() {
        document.getElementById('name-input-area').style.display = 
            document.getElementById('slot-sw').checked ? 'block' : 'none';
    };

    window.startEnkai = function() {
        const isSlot = document.getElementById('slot-sw').checked;
        const names = document.getElementById('names').value.trim();
        if (isSlot && !names) { toast("メンバー名を入力してください"); return; }
        
        state.members = names ? names.split(/[\s　]+/) : ["参加者"];
        state.activeTopics = topics[state.mode].slice().sort(() => Math.random() - 0.5);
        state.currIdx = 0;
        
        document.getElementById('slot-ui').style.display = isSlot ? 'block' : 'none';
        window.nav('main-screen');
        renderQ();
    };

    function renderQ() {
        document.getElementById('topic-disp').innerText = state.activeTopics[state.currIdx];
        document.getElementById('q-count').innerText = `Progress ${state.currIdx + 1} / ${state.activeTopics.length}`;
    }

    window.nextQ = function() {
        if (state.currIdx < state.activeTopics.length - 1) { 
            state.currIdx++; renderQ(); 
        } else { window.nav('finish-screen'); }
    };

    window.prevQ = function() { if (state.currIdx > 0) { state.currIdx--; renderQ(); } };

    window.spin = function() {
        const t = document.getElementById('s-target'), k = document.getElementById('s-task');
        let c = 0;
        const itv = setInterval(() => {
            t.innerText = state.members[Math.floor(Math.random() * state.members.length)];
            k.innerText = missions[Math.floor(Math.random() * missions.length)];
            if (++c > 15) clearInterval(itv);
        }, 60);
    };

    window.setRate = function(v) {
        state.rating = v;
        document.querySelectorAll('.fire-icon').forEach((icon, i) => icon.classList.toggle('active', i < v));
    };

    // 【⑩】レポート保存時に称号も含める
    window.save = async function() {
        if (state.rating === 0) { toast("評価を選んでください"); return; }
        if (!window.fb) { toast("保存エラー"); return; }
        try {
            await window.fb.addDoc(window.fb.collection(window.db, "sessions"), {
                uid: window.auth.currentUser ? window.auth.currentUser.uid : "guest",
                partyName: document.getElementById('party-name').value || "無題の宴",
                userName: state.userName, 
                rating: state.rating,
                memo: document.getElementById('memo').value, 
                timestamp: Date.now(),
                title: state.selectedTitle, // 保存時点の称号
                specialTitle: state.isSpecialTitleActive ? state.specialTitle : ""
            });
            toast("宴会を記録しました！✨");
            setTimeout(() => location.reload(), 1200);
        } catch(e) { toast("保存に失敗しました"); }
    };

    window.openReport = async function() {
        window.nav('report-screen');
        const list = document.getElementById('report-list');
        list.innerHTML = "<p style='text-align:center;'>読込中...</p>";
        try {
            const q = window.fb.query(window.fb.collection(window.db, "sessions"), window.fb.orderBy("timestamp", "desc"), window.fb.limit(15));
            const snap = await window.fb.getDocs(q);
            let html = "";
            snap.forEach(doc => {
                const d = doc.data();
                const badgeHtml = d.title ? `<span class="badge badge-normal" style="font-size:0.6rem;">${d.title}</span>` : "";
                const specialHtml = d.specialTitle ? `<span class="badge badge-special" style="font-size:0.6rem;">${d.specialTitle}</span>` : "";
                
                html += `<div class="card" style="padding:15px; margin-bottom:12px;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <b>${d.partyName}</b><br>
                            <small>${d.userName} 様 ${badgeHtml}${specialHtml}</small>
                        </div>
                        <div style="font-size:0.8rem;">${"🔥".repeat(d.rating)}</div>
                    </div>
                    <p style="margin:8px 0 0; font-size:0.85rem; color:var(--text-sub); border-top:1px solid var(--border); padding-top:8px;">${d.memo || ""}</p>
                </div>`;
            });
            list.innerHTML = html || "まだ記録がありません";
        } catch(e) { list.innerHTML = "読込に失敗しました"; }
    };

    // 認証
    window.login = async function() { 
        if (!window.fb) return;
        try { await window.fb.signInWithPopup(window.auth, new window.fb.GoogleAuthProvider()); } catch(e) { toast("ログイン失敗"); } 
    };

    window.logout = async function() { 
        if (confirm("ログアウトしますか？")) { await window.fb.signOut(window.auth); location.reload(); } 
    };

    function toast(m) {
        const t = document.getElementById('toast');
        t.innerText = m; t.classList.add('active');
        setTimeout(() => t.classList.remove('active'), 3000);
    }

    window.toggleDark = function() {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('dark', document.body.classList.contains('dark-mode'));
    };

    // --- 起動処理 ---
    document.addEventListener('DOMContentLoaded', () => {
        if (localStorage.getItem('dark') === 'true') document.body.classList.add('dark-mode');
        checkFirstVisit();
        
        const checkAuth = setInterval(() => {
            if (window.fb && window.auth) {
                clearInterval(checkAuth);
                window.fb.onAuthStateChanged(window.auth, user => {
                    const lBtn = document.getElementById('login-btn'), loBtn = document.getElementById('logout-btn');
                    const nInp = document.getElementById('display-name'), prompt = document.getElementById('login-prompt');
                    const pLBtn = document.getElementById('p-login-btn'), sIcon = document.getElementById('side-user-icon');
                    const pIconSrc = document.getElementById('p-img-src'), sIconSrc = document.getElementById('side-img-src');
                    const tSelector = document.getElementById('title-selector');

                    if (user) {
                        state.isLoggedIn = true;
                        state.userName = user.displayName;
                        lBtn.style.display = 'none'; loBtn.style.display = 'block';
                        nInp.disabled = false; prompt.style.display = 'none'; pLBtn.style.display = 'none';
                        tSelector.disabled = false;
                        if(user.photoURL) {
                            sIcon.style.display = 'block'; pIconSrc.style.display = 'block';
                            sIconSrc.src = user.photoURL; pIconSrc.src = user.photoURL;
                        }
                    } else {
                        state.isLoggedIn = false;
                        state.userName = "ゲスト";
                        lBtn.style.display = 'block'; loBtn.style.display = 'none';
                        nInp.disabled = true; prompt.style.display = 'block'; pLBtn.style.display = 'block';
                        tSelector.disabled = true;
                        sIcon.style.display = 'none'; pIconSrc.style.display = 'none';
                    }
                    nInp.value = state.userName;
                    document.getElementById('side-name-label').innerText = state.userName + " 様";
                    fetchUserStats();
                });
            }
        }, 200);
    });
})();