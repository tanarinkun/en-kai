/**
 * ==========================================================================
 * EN-KAI CORE SCRIPT (v16.2.0)
 * 修正：初期表示バグ修正、感謝ポップアップ、プライバシー保護アイコン機能
 * + add-on：リップル/軽いハプ/画面遷移OUT/スクロールカード/レポート段差/フィードバック
 * ==========================================================================
 */

(function() {
    console.log("System initializing v16.2.0...");

    const topics = {
        icebreak: ["第一印象、お互いどう感じました？", "最近一番笑ったことを教えてください", "自分を家電に例えるなら何？", "好きな食べ物ベスト3は？", "最近ハマっている趣味"],
        casual: ["3億円当たったら、まず何に使う？", "明日世界が終わるなら何食べる？", "ここだけの秘密を1つ公開！", "最近の個人的な大ニュース", "人生で一番の失敗談"],
        business: ["仕事で最も達成感を感じる瞬間は？", "尊敬するリーダーの条件とは？", "5年後の自分はどうなっていたい？", "今の仕事を選んだ理由", "仕事中のリフレッシュ方法"]
    };
    const missions = ["全員を1人ずつ褒める", "語尾に『～だぜ』をつける", "今の所持金を告白する", "全力でかっこいいポーズ", "スマホの待受画面を見せる"];

    // 画面タイトル定義
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

    // צור号データ
    const titlesData = [
        { count: 0, label: "新人幹事候補" },
        { count: 1, label: "ビギナー幹事" },
        { count: 3, label: "見習い幹事" },
        { count: 5, label: "空気読み職人" },
        { count: 10, label: "盛り上げ隊長" },
        { count: 20, label: "宴会マスター" },
        { count: 30, label: "伝説の幹事" }
    ];

    // アイコン用カラーパレット（プライバシー重視）
    const iconColors = [
        { name: 'Blue', code: '#3498db' },
        { name: 'Green', code: '#2ecc71' },
        { name: 'Purple', code: '#9b59b6' },
        { name: 'Orange', code: '#e67e22' },
        { name: 'Red', code: '#e74c3c' },
        { name: 'Dark', code: '#34495e' }
    ];

    let state = {
        mode: 'icebreak',
        activeTopics: [],
        currIdx: 0,
        members: [],
        rating: 0,
        userName: "ゲスト",
        userColor: "#bdc3c7", // デフォルト：グレー
        isLoggedIn: false,
        partyCount: 0,
        selectedTitle: "新人幹事候補",
        specialTitle: "",
        isSpecialTitleActive: false
    };

    // デバッグやフィードバック送信で参照できるように（安全な範囲だけ）
    window.state = state;

    // ===== add-on共通 =====
    const prefersReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function haptic(ms = 8) {
        if (prefersReduce) return;
        try { if (navigator.vibrate) navigator.vibrate(ms); } catch(e) {}
    }

    function popOnce(el, cls) {
        if (!el || prefersReduce) return;
        el.classList.remove(cls);
        void el.offsetWidth;
        el.classList.add(cls);
    }

    function enableRipple(selector) {
        document.querySelectorAll(selector).forEach(el => {
            if (el.dataset.rippleDone) return;
            el.dataset.rippleDone = "1";
            el.classList.add("ripple");

            el.addEventListener("click", (ev) => {
                if (prefersReduce) return;
                const rect = el.getBoundingClientRect();
                const x = ev.clientX - rect.left;
                const y = ev.clientY - rect.top;

                const s = document.createElement("span");
                s.className = "rip";
                s.style.left = x + "px";
                s.style.top = y + "px";
                el.appendChild(s);

                setTimeout(() => s.remove(), 600);
            }, { passive: true });
        });
    }

    function setupRevealCards() {
        const cards = Array.from(document.querySelectorAll('.card'));
        if (!cards.length) return;

        cards.forEach(c => c.classList.add('reveal-ready'));

        if (prefersReduce || !('IntersectionObserver' in window)) {
            cards.forEach(c => {
                c.classList.remove('reveal-ready');
                c.classList.add('reveal-in');
            });
            return;
        }

        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (!e.isIntersecting) return;
                const el = e.target;
                el.classList.add('reveal-in');
                el.classList.remove('reveal-ready');
                io.unobserve(el);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });

        cards.forEach(c => io.observe(c));
    }

    function observeStaggerList() {
        const list = document.getElementById('report-list');
        if (!list || !('MutationObserver' in window)) return;

        const mo = new MutationObserver(() => {
            const items = Array.from(list.children);
            items.forEach((el, idx) => {
                if (el.dataset.staggerDone) return;
                el.dataset.staggerDone = "1";
                el.style.animationDelay = (Math.min(idx, 12) * 45) + "ms";
                el.classList.add('stagger-in');
            });
        });
        mo.observe(list, { childList: true, subtree: false });
    }

    // --- 【必須修正①】画面遷移 & 初期表示保証 ---
    const _baseNav = function(id) {
        console.log("Navigating to:", id);
        const screens = document.querySelectorAll('.screen');

        // 全画面を非表示
        screens.forEach(s => {
            s.style.display = 'none';
            s.classList.remove('active');
            s.classList.remove('screen-out'); // add-on: out演出クラスも除去
        });

        const target = document.getElementById(id);
        if (target) {
            target.style.display = 'block';
            const label = document.getElementById('current-page-name');
            if(label) label.innerText = pageTitlesJp[id] || 'EN-KAI';
        } else {
            const welcome = document.getElementById('welcome-screen');
            if(welcome) welcome.style.display = 'block';
        }

        closeAllModals();
        window.scrollTo(0, 0);

        if (id === 'profile-screen') {
            fetchUserStats();
            renderColorPicker();
        }
    };

    // add-on: 画面遷移 OUT → nav
    window.nav = function(id) {
        if (prefersReduce) return _baseNav(id);

        const current = Array.from(document.querySelectorAll('.screen'))
            .find(s => s && s.style && s.style.display === 'block');

        if (current) {
            current.classList.add('screen-out');
            setTimeout(() => _baseNav(id), 140);
        } else {
            _baseNav(id);
        }
    };

    // --- モーダル・サイドメニュー制御 ---
    window.closeAllModals = function() {
        const sideMenu = document.getElementById('side-menu');
        const overlay = document.getElementById('overlay');
        const confirmModal = document.getElementById('confirm-modal');
        const guideModal = document.getElementById('first-guide-modal');
        const thanksModal = document.getElementById('thanks-modal');
        const feedbackModal = document.getElementById('feedback-modal'); // ★追加

        if(sideMenu) sideMenu.classList.remove('active');
        if(overlay) overlay.classList.remove('active');
        if(confirmModal) confirmModal.classList.remove('active');
        if(guideModal) guideModal.classList.remove('active');
        if(thanksModal) thanksModal.classList.remove('active');
        if(feedbackModal) feedbackModal.classList.remove('active'); // ★追加
    };

    window.toggleMenu = function() {
        haptic(6);
        document.getElementById('side-menu').classList.toggle('active');
        document.getElementById('overlay').classList.toggle('active');
    };

    // 初回ガイド
    function checkFirstVisit() {
        if (!localStorage.getItem('enkai_visited_v2')) {
            setTimeout(() => {
                const guide = document.getElementById('first-guide-modal');
                if(guide) {
                    guide.classList.add('active');
                    document.getElementById('overlay').classList.add('active');
                }
            }, 800);
        }
    }

    window.closeFirstGuide = function() {
        localStorage.setItem('enkai_visited_v2', 'true');
        closeAllModals();
        window.nav('welcome-screen');
    };

    window.finishCheck = function() {
        document.getElementById('confirm-modal').classList.add('active');
        document.getElementById('overlay').classList.add('active');
    };

    // --- 【必須修正③】プロフィール & カラーシステム ---
    function renderColorPicker() {
        const container = document.getElementById('color-picker-container');
        if (!container) return;

        container.innerHTML = "";
        iconColors.forEach(color => {
            const btn = document.createElement('div');
            btn.className = 'color-dot';
            btn.style.backgroundColor = color.code;
            btn.style.width = '30px';
            btn.style.height = '30px';
            btn.style.borderRadius = '50%';
            btn.style.display = 'inline-block';
            btn.style.margin = '5px';
            btn.style.cursor = 'pointer';
            btn.style.border = (state.userColor === color.code) ? '3px solid var(--primary)' : '2px solid transparent';

            btn.onclick = () => selectColor(color.code);
            container.appendChild(btn);
        });
    }

    async function selectColor(code) {
        state.userColor = code;
        updateIconUI();
        renderColorPicker();
        await saveUserConfig();
        toast("アイコン色を変更しました");
    }

    function updateIconUI() {
        const sImg = document.getElementById('side-img-src');
        const pImg = document.getElementById('p-img-src');

        if (state.isLoggedIn) {
            if(sImg) {
                sImg.src = "";
                sImg.style.backgroundColor = state.userColor;
                sImg.style.borderRadius = "50%";
            }
            if(pImg) {
                pImg.src = "";
                pImg.style.backgroundColor = state.userColor;
                pImg.style.borderRadius = "50%";
            }
        } else {
            if(sImg) sImg.style.backgroundColor = "#bdc3c7";
            if(pImg) pImg.style.backgroundColor = "#bdc3c7";
        }
    }

    async function fetchUserStats() {
        if (!state.isLoggedIn || !window.fb) return;

        const countEl = document.getElementById('stat-count');
        const selector = document.getElementById('title-selector');

        try {
            const q = window.fb.query(
                window.fb.collection(window.db, "sessions"),
                window.fb.where("uid", "==", window.auth.currentUser.uid)
            );
            const snap = await window.fb.getDocs(q);
            state.partyCount = snap.size;
            if(countEl) countEl.innerText = state.partyCount;

            const userDoc = await window.fb.getDoc(window.fb.doc(window.db, "users", window.auth.currentUser.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                state.selectedTitle = data.selectedTitle || "ビギナー幹事";
                state.isSpecialTitleActive = data.isSpecialTitleActive || false;
                state.userColor = data.userColor || "#3498db";
                state.userName = data.displayName || window.auth.currentUser.displayName || "名無し幹事";
            }

            checkSpecialTitles();

            if(selector) {
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
            }

            updateBadgeUI();
            updateIconUI();
        } catch (e) { console.error("Error fetching stats:", e); }
    }

    function checkSpecialTitles() {
        const now = new Date();
        const specialArea = document.getElementById('special-title-area');
        state.specialTitle = "";

        if (now.getMonth() === 11) {
            state.specialTitle = "年末幹事王";
        }

        if (state.specialTitle && specialArea) {
            specialArea.style.display = 'block';
            document.getElementById('special-title-name').innerText = "✨ " + state.specialTitle;
            document.getElementById('special-title-sw').checked = state.isSpecialTitleActive;
        } else if(specialArea) {
            specialArea.style.display = 'none';
        }
    }

    function updateBadgeUI() {
        const mainBadge = document.getElementById('p-main-badge');
        const specBadge = document.getElementById('p-special-badge');
        const sideBadge = document.getElementById('side-title-badge');

        if(mainBadge) mainBadge.innerText = state.selectedTitle;
        if(sideBadge) {
            sideBadge.innerText = state.selectedTitle;
            sideBadge.style.display = 'inline-block';
        }

        if (state.specialTitle && state.isSpecialTitleActive && specBadge) {
            specBadge.innerText = state.specialTitle;
            specBadge.style.display = 'inline-block';
        } else if(specBadge) {
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
            displayName: state.userName,
            userColor: state.userColor
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
        haptic(6);
        state.mode = mode;
        document.querySelectorAll('.mode-chip').forEach(c => c.classList.remove('active'));
        const chip = document.getElementById(id);
        if(chip) chip.classList.add('active');
    };

    window.toggleNameInput = function() {
        const area = document.getElementById('name-input-area');
        const sw = document.getElementById('slot-sw');
        if(area && sw) area.style.display = sw.checked ? 'block' : 'none';
    };

    window.startEnkai = function() {
        const isSlot = document.getElementById('slot-sw').checked;
        const namesInp = document.getElementById('names');
        const names = namesInp ? namesInp.value.trim() : "";
        if (isSlot && !names) { toast("メンバー名を入力してください"); return; }

        state.members = names ? names.split(/[\s　]+/) : ["参加者"];
        state.activeTopics = topics[state.mode].slice().sort(() => Math.random() - 0.5);
        state.currIdx = 0;

        const slotUi = document.getElementById('slot-ui');
        if(slotUi) slotUi.style.display = isSlot ? 'block' : 'none';
        window.nav('main-screen');
        renderQ();
    };

    function renderQ() {
        const disp = document.getElementById('topic-disp');
        const count = document.getElementById('q-count');
        if(disp) disp.innerText = state.activeTopics[state.currIdx];
        if(count) count.innerText = `Progress ${state.currIdx + 1} / ${state.activeTopics.length}`;
    }

    // add-on: next/prevにふわっと差し替え
    const _baseNextQ = function() {
        if (state.currIdx < state.activeTopics.length - 1) {
            state.currIdx++; renderQ();
        } else { window.nav('finish-screen'); }
    };

    const _basePrevQ = function() {
        if (state.currIdx > 0) { state.currIdx--; renderQ(); }
    };

    window.nextQ = function() {
        haptic(10);
        _baseNextQ();
        popOnce(document.getElementById('topic-disp'), 'swap-up');
        popOnce(document.getElementById('q-count'), 'swap-up');
    };

    window.prevQ = function() {
        haptic(8);
        _basePrevQ();
        popOnce(document.getElementById('topic-disp'), 'swap-down');
        popOnce(document.getElementById('q-count'), 'swap-down');
    };

    // add-on: スロット演出（ブラー/ジッタはCSSに依存）
    window.spin = function() {
        haptic(16);

        const t = document.getElementById('s-target'), k = document.getElementById('s-task');
        if(!t || !k) return;

        t.classList.add('slot-spinning','slot-jitter');
        k.classList.add('slot-spinning','slot-jitter');

        let c = 0;
        const itv = setInterval(() => {
            t.innerText = state.members[Math.floor(Math.random() * state.members.length)];
            k.innerText = missions[Math.floor(Math.random() * missions.length)];
            if (++c > 15) {
                clearInterval(itv);
                setTimeout(() => {
                    t.classList.remove('slot-spinning','slot-jitter');
                    k.classList.remove('slot-spinning','slot-jitter');
                }, 120);
            }
        }, 60);
    };

    window.setRate = function(v) {
        haptic(5);
        state.rating = v;
        const icons = document.querySelectorAll('.fire-icon');
        const before = document.querySelectorAll('.fire-icon.active').length;

        icons.forEach((icon, i) => icon.classList.toggle('active', i < v));
        for (let i = before; i < v; i++) popOnce(icons[i], 'fire-pop');
    };

    // --- 【必須修正②】レポート保存 & 感謝メッセージ ---
    window.save = async function() {
        if (state.rating === 0) { toast("評価を選んでください"); return; }
        if (!window.fb) { toast("保存エラー"); return; }

        const btn = document.querySelector('.btn-save');
        if(btn) btn.disabled = true;

        try {
            await window.fb.addDoc(window.fb.collection(window.db, "sessions"), {
                uid: window.auth.currentUser ? window.auth.currentUser.uid : "guest",
                partyName: document.getElementById('party-name').value || "無題の宴",
                userName: state.userName,
                rating: state.rating,
                memo: document.getElementById('memo').value,
                timestamp: Date.now(),
                title: state.selectedTitle,
                userColor: state.userColor,
                specialTitle: state.isSpecialTitleActive ? state.specialTitle : ""
            });

            showThanksModal();
        } catch(e) {
            console.error(e);
            toast("保存に失敗しました");
            if(btn) btn.disabled = false;
        }
    };

    function showThanksModal() {
        const modal = document.getElementById('thanks-modal') || createThanksModal();
        modal.classList.add('active');
        document.getElementById('overlay').classList.add('active');

        setTimeout(() => {
            location.reload();
        }, 3500);
    }

    function createThanksModal() {
        const m = document.createElement('div');
        m.id = 'thanks-modal';
        m.className = 'modal';
        m.style.cssText = "position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:var(--bg-card); padding:30px; border-radius:15px; z-index:2000; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.3); display:none;";
        m.innerHTML = `
            <div style="font-size:3rem; margin-bottom:15px;">✨</div>
            <h3 style="margin-bottom:10px;">ご利用ありがとうございます！</h3>
            <p style="color:var(--text-sub);">またのご利用をお待ちしています。</p>
            <p style="font-size:0.7rem; margin-top:20px; opacity:0.6;">間もなくホームに戻ります...</p>
        `;
        document.body.appendChild(m);
        m.classList.add = function(c) { if(c==='active') m.style.display = 'block'; };
        return m;
    }

    window.openReport = async function() {
        window.nav('report-screen');
        const list = document.getElementById('report-list');
        if(!list) return;

        list.innerHTML = "<p style='text-align:center;'>読込中...</p>";

        try {
            const q = window.fb.query(window.fb.collection(window.db, "sessions"), window.fb.orderBy("timestamp", "desc"), window.fb.limit(15));
            const snap = await window.fb.getDocs(q);
            let html = "";

            snap.forEach(doc => {
                const d = doc.data();
                const badgeHtml = d.title ? `<span class="badge badge-normal" style="font-size:0.6rem;">${d.title}</span>` : "";
                const specialHtml = d.specialTitle ? `<span class="badge badge-special" style="font-size:0.6rem;">${d.specialTitle}</span>` : "";
                const userColor = d.userColor || "#bdc3c7";

                html += `<div class="card" style="padding:15px; margin-bottom:12px;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div style="display:flex; gap:10px;">
                            <div style="width:35px; height:35px; border-radius:50%; background:${userColor}; flex-shrink:0;"></div>
                            <div>
                                <b>${d.partyName}</b><br>
                                <small>${d.userName} 様 ${badgeHtml}${specialHtml}</small>
                            </div>
                        </div>
                        <div style="font-size:0.8rem;">${"🔥".repeat(d.rating)}</div>
                    </div>
                    <p style="margin:8px 0 0; font-size:0.85rem; color:var(--text-sub); border-top:1px solid var(--border); padding-top:8px;">${d.memo || ""}</p>
                </div>`;
            });

            list.innerHTML = html || "まだ記録がありません";

            // add-on: 段差アニメ監視（このタイミングで確実に動く）
            observeStaggerList();

        } catch(e) {
            list.innerHTML = "読込に失敗しました";
        }
    };

    // 認証
    window.login = async function() {
        if (!window.fb) return;
        try {
            await window.fb.signInWithPopup(window.auth, new window.fb.GoogleAuthProvider());
            location.reload();
        } catch(e) { toast("ログイン失敗"); }
    };

    window.logout = async function() {
        if (confirm("ログアウトしますか？")) {
            await window.fb.signOut(window.auth);
            location.reload();
        }
    };

    // ===== Feedback Modal + Mailto =====
    window.openFeedbackModal = function() {
        try {
            const overlay = document.getElementById('overlay');
            const modal = document.getElementById('feedback-modal');
            if (!overlay || !modal) {
                toast("フィードバックフォームが見つかりません");
                return;
            }

            overlay.classList.add('active');
            modal.classList.add('active');

            const msg = document.getElementById('fb-message');
            if (msg) setTimeout(() => msg.focus(), 50);
        } catch(e) {}
    };

    window.sendFeedback = function() {
        const to = "rin.tk.uni@gmail.com";
        const name = (document.getElementById('fb-name')?.value || "").trim();
        const msg  = (document.getElementById('fb-message')?.value || "").trim();

        if (!msg) { toast("内容を入力してね"); return; }

        const dark = document.body.classList.contains('dark-mode') ? "dark" : "light";
        const subject = `EN-KAI フィードバック${name ? "（" + name + "）" : ""}`;
        const body =
`【フィードバック】
${msg}

【任意情報】
name: ${name || "-"}
user: ${state.userName || "-"}
mode: ${state.mode || "-"}
theme: ${dark}
ua: ${navigator.userAgent}
`;

        const url = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        location.href = url;
        toast("メール作成画面を開いたよ");
    };

    function toast(m) {
        const t = document.getElementById('toast');
        if(!t) return;
        t.innerText = m; t.classList.add('active');
        setTimeout(() => t.classList.remove('active'), 3000);
    }

    window.toggleDark = function() {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('dark', document.body.classList.contains('dark-mode'));
    };

    // --- 【必須修正①】起動・認証ハンドリング ---
    document.addEventListener('DOMContentLoaded', () => {
        console.log("DOM loaded.");
        if (localStorage.getItem('dark') === 'true') document.body.classList.add('dark-mode');

        // 1. 最初に必ず初期画面を表示
        window.nav('welcome-screen');
        checkFirstVisit();

        // add-on: ここでまとめて演出を有効化（重複DOMContentLoaded禁止）
        enableRipple(".btn-common");
        enableRipple(".nav-link");
        enableRipple(".mode-chip");
        setupRevealCards();

        const checkAuth = setInterval(() => {
            if (window.fb && window.auth) {
                clearInterval(checkAuth);
                window.fb.onAuthStateChanged(window.auth, async (user) => {
                    const lBtn = document.getElementById('login-btn'), loBtn = document.getElementById('logout-btn');
                    const nInp = document.getElementById('display-name'), prompt = document.getElementById('login-prompt');
                    const pLBtn = document.getElementById('p-login-btn'), sIcon = document.getElementById('side-user-icon');
                    const tSelector = document.getElementById('title-selector');

                    if (user) {
                        state.isLoggedIn = true;
                        state.userName = user.displayName || "名無し幹事";

                        if(lBtn) lBtn.style.display = 'none';
                        if(loBtn) loBtn.style.display = 'block';
                        if(nInp) nInp.disabled = false;
                        if(prompt) prompt.style.display = 'none';
                        if(pLBtn) pLBtn.style.display = 'none';
                        if(tSelector) tSelector.disabled = false;
                        if(sIcon) sIcon.style.display = 'block';

                        await fetchUserStats();
                    } else {
                        state.isLoggedIn = false;
                        state.userName = "ゲスト";
                        state.userColor = "#bdc3c7";

                        if(lBtn) lBtn.style.display = 'block';
                        if(loBtn) loBtn.style.display = 'none';
                        if(nInp) nInp.disabled = true;
                        if(prompt) prompt.style.display = 'block';
                        if(pLBtn) pLBtn.style.display = 'block';
                        if(tSelector) tSelector.disabled = true;
                        if(sIcon) sIcon.style.display = 'none';
                    }

                    if(nInp) nInp.value = state.userName;
                    const nameLabel = document.getElementById('side-name-label');
                    if(nameLabel) nameLabel.innerText = state.userName + " 様";

                    updateIconUI();
                });
            }
        }, 200);

        // 予備：万が一の空白回避
        setTimeout(() => {
            const visibleScreens = Array.from(document.querySelectorAll('.screen')).filter(s => s.style.display === 'block');
            if (visibleScreens.length === 0) {
                console.warn("Screen recovery triggered");
                window.nav('welcome-screen');
            }
        }, 2000);
    });

})();
