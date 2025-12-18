// --------------------
// 話題データ
// --------------------
const topics = {
    casual: [
        "最近ハマっている飲み物は？☕️", "今一番行きたい場所はどこですか？✈️",
        "最近あった『ちょっと良いこと』✨", "おすすめのコンビニスイーツは？🍰",
        "最近笑った出来事は？😆", "スマホの待ち受け画面は何？📱",
        "子供の頃に好きだったお菓子は？🍭", "最近、新しく買ったものは？🛍️",
        "こだわりのマイルールは？⭐", "家でのリラックス方法は？🏠",
        "最近見て面白かった動画は？📺", "明日が急に休みになったら？💤",
        "得意料理は何ですか？🍳", "好きな季節とその理由は？🌸",
        "感動した食べ物は？😋", "自分へのご褒美といえば？💎",
        "地元の自慢できるところは？🗾", "好きな動物を一つ選ぶなら？🐶",
        "歩いていて見つけた面白いものは？🚶", "今の気分を色に例えると？🎨"
    ],
    business: [
        "今日この場で楽しみなことは？🤝", "仕事での『最近の発見』は？💡",
        "皆さんの『仕事の必需品』は？✒️", "今の仕事を選んだきっかけは？🌱",
        "仕事中、集中するコツは？🎧", "尊敬する人はいますか？✨",
        "最近読んで役立った本は？📚", "仕事での『小さな成功』は？🏆",
        "便利なツールはありますか？💻", "人前で話すときに気をつけることは？🎤",
        "理想の働き方は？⏳", "挑戦したいスキルは？🚀",
        "仕事の合間のリフレッシュ法は？☕", "チームで大切にしていることは？👥",
        "最近受けた刺激は？🌍", "自分の仕事を一言で言うと？💬",
        "朝の欠かせないルーティンは？☀️", "会話で心がけていることは？🗣️",
        "記憶に残っている仕事は？📊", "今の業界の面白い点は？🔍"
    ],
    rec: [
        "まずは全員で深呼吸しましょう😮💨", "今の気分を『天気』で例えると？☀️",
        "隣の人と挨拶しましょう👋", "最近、体を動かしましたか？🏃",
        "来る途中で気づいたことは？🚲", "好きな音楽は何ですか？🎵",
        "「お疲れ様」と声を掛け合いましょう🍵", "最近、空を見上げましたか？☁️",
        "一番好きな「音」は？🔔", "魔法が使えるなら何をする？🪄",
        "自分の名前の由来は？📛", "最近「ありがとう」と言った？🙏",
        "会場で気になるものは？👀", "今の室温は大丈夫？🌡️",
        "肩の力を抜いてみましょう🍃", "今日自分にかけたい言葉は？📣",
        "好きな食べ物を想像して…🍕", "見える範囲で「好きな色」は？🌈",
        "新しく覚えた言葉は？📖", "隣の人に会釈しましょう😊"
    ]
};

// --------------------
// 画面切り替え
// --------------------
let currentMode = "";
let currentIndex = 0;

function switchScreen(targetId) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });
    const target = document.getElementById(targetId);
    target.style.display = 'block';
    setTimeout(() => target.classList.add('active'), 50);
}

// --------------------
// スタート画面ボタン
// --------------------
function onStartClicked() {
    const radioButtons = document.getElementsByName("mode");
    for (let rb of radioButtons) {
        if (rb.checked) { currentMode = rb.value; break; }
    }
    currentIndex = 0;
    showTopic();
    switchScreen('main-screen');
}

// --------------------
// 戻るボタン
// --------------------
function goBack() { switchScreen('start-screen'); }

// --------------------
// トピック表示
// --------------------
function showTopic() {
    const list = topics[currentMode];
    const textElement = document.getElementById("topic-text");
    textElement.style.opacity = 0;
    setTimeout(() => {
        textElement.innerText = list[currentIndex];
        textElement.style.opacity = 1;
    }, 200);
}

function nextTopic() {
    currentIndex++;
    if (currentIndex >= topics[currentMode].length) currentIndex = 0;
    showTopic();
}

// --------------------
// メニューボタン
// --------------------
function toggleMenu() {
    const menu = document.getElementById('header-menu');
    if (menu.classList.contains('menu-hidden')) {
        menu.classList.remove('menu-hidden');
    } else {
        menu.classList.add('menu-hidden');
    }
}

// --------------------
// テーマボタン
// --------------------
const themeButtons = document.querySelectorAll('.theme-btn');
themeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        themeButtons.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        const theme = btn.dataset.theme;
        document.body.setAttribute('data-theme', theme);
    });
});

// --------------------
// ロゴクリックでホーム
// --------------------
const logos = document.querySelectorAll('.logo-link');
logos.forEach(logo => {
    logo.addEventListener('click', e => {
        e.preventDefault();
        window.location.href = 'index.html';
    });
});
