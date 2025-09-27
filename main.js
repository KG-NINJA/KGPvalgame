// DOMから要素を取得（必須）
const form = document.querySelector("#answer-form");
const textarea = document.querySelector("#user-answer");
const results = document.querySelector("#results");
const userOut = document.querySelector("#user-answer-display");
const idealOut = document.querySelector("#gpt-answer-display");
const scoreOut = document.querySelector("#score-display");
const shareBtn = document.querySelector("#share-button");
const taskEl = document.querySelector("#task-text");

let tasks = [];
let currentTask = null;

const formatScore = v => `${v} 点`;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

// tasks.json を読み込む
(async () => {
  try {
    const resp = await fetch("tasks.json?ver=" + Date.now()); // キャッシュ回避
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();

    tasks = Array.isArray(data) ? data.filter(t => t && t.input) : [];
    if (tasks.length === 0) {
      taskEl.textContent = "タスクが空です。tasks.json を確認してください。";
      return;
    }
    currentTask = pick(tasks);
    taskEl.textContent = currentTask.input;
  } catch (e) {
    console.error(e);
    taskEl.textContent = "tasks.json の読み込みに失敗しました。";
  }
})();

// 回答フォーム送信処理
form.addEventListener("submit", e => {
  e.preventDefault();
  if (!currentTask) return;
  const ans = textarea.value.trim();
  if (!ans) return;

  const ideal = String(currentTask.ideal || "").toLowerCase();
  const overlap = ideal ? ans.toLowerCase().split(/\s+/).filter(w => ideal.includes(w)).length : 0;
  const denom = ideal ? ideal.split(/\s+/).length : 1;
  const score = Math.min(100, Math.floor((overlap / denom) * 100));

  userOut.textContent = ans;
  idealOut.textContent = currentTask.ideal || "模範解答なし";
  scoreOut.textContent = formatScore(score);
  results.hidden = false;

  const msg = [
    `お題: ${currentTask.input}`,
    `私の答え: 「${ans}」`,
    `スコア: ${score}点`,
    "あなたも挑戦→ https://kg-ninja.github.io/KGPvalgame/",
    "#KGPvalGame #KGNINJA"
  ].join("\n");

  shareBtn.onclick = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener");
  };
});
