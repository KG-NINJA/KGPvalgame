// main.js（安全版）
const taskEl = document.querySelector("#task-text");
const form = document.querySelector("#answer-form");
const textarea = document.querySelector("#user-answer");
const results = document.querySelector("#results");
const userOut = document.querySelector("#user-answer-display");
const idealOut = document.querySelector("#gpt-answer-display");
const scoreOut = document.querySelector("#score-display");
const shareBtn = document.querySelector("#share-button");

let tasks = [];
let currentTask = null;

const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const formatScore = v => `${v} 点`;

(async () => {
  try {
    const resp = await fetch("tasks.json?ver=" + Date.now()); // キャッシュ回避
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    console.log("tasks.json 読み込み結果:", data?.length, data?.[0]);

    // inputがあるものだけ採用（idealはURLが無い場合もあるため必須にしない）
    tasks = Array.isArray(data) ? data.filter(t => t && t.input) : [];
    if (tasks.length === 0) {
      taskEl.textContent = "タスクが空です。tasks.json の構造を {input, ideal} にしてください。";
      return;
    }
    currentTask = pick(tasks);
    taskEl.textContent = currentTask.input;
  } catch (e) {
    console.error(e);
    taskEl.textContent = "tasks.json の読み込みに失敗しました。パスと公開場所を確認してください。";
  }
})();

form.addEventListener("submit", e => {
  e.preventDefault();
  if (!currentTask) return;
  const ans = textarea.value.trim();
  if (!ans) return;

  // 簡易スコア（idealがURLでも動くように安全化）
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
    "あなたも挑戦→ https://username.github.io/kgpval-game/",
    "#KGPvalGame #KGNINJA"
  ].join("\n");
  shareBtn.onclick = () =>
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
});
