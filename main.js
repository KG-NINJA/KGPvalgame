const form = document.querySelector("#answer-form");
const textarea = document.querySelector("#user-answer");
const resultsSection = document.querySelector("#results");
const userAnswerDisplay = document.querySelector("#user-answer-display");
const gptAnswerDisplay = document.querySelector("#gpt-answer-display");
const scoreDisplay = document.querySelector("#score-display");
const shareButton = document.querySelector("#share-button");

let tasks = [];
let currentTask = null;

const formatScore = (value) => `${value} 点`;

const buildShareUrl = (userAnswer, score) => {
  const message = [
    `お題: ${currentTask.input}`,
    `私の答え: 「${userAnswer}」`,
    `スコア: ${score}点`,
    "あなたも挑戦→ https://username.github.io/kgpval-game/",
    "#KGPvalGame #KGNINJA"
  ].join("\n");
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`;
};

// タスク読み込み
fetch("tasks.json")
  .then(resp => resp.json())
  .then(data => {
    tasks = data.filter(t => t.input);
    if (tasks.length === 0) {
      document.querySelector("#task-text").textContent = "タスクがありません。tasks.jsonを確認してください。";
      return;
    }
    currentTask = tasks[Math.floor(Math.random() * tasks.length)];
    document.querySelector("#task-text").textContent = currentTask.input;
  })
  .catch(err => {
    document.querySelector("#task-text").textContent = "tasks.jsonの読み込みに失敗しました。";
    console.error(err);
  });

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const trimmedAnswer = textarea.value.trim();
  if (!trimmedAnswer) return;

  const ideal = (currentTask.ideal || "").toLowerCase();
  const ans = trimmedAnswer.toLowerCase();

  const overlap = ideal ? ans.split(/\s+/).filter(w => ideal.includes(w)).length : 0;
  const score = ideal ? Math.min(100, Math.floor(overlap / ideal.split(/\s+/).length * 100)) : 0;

  userAnswerDisplay.textContent = trimmedAnswer;
  gptAnswerDisplay.textContent = currentTask.ideal || "模範解答なし";
  scoreDisplay.textContent = formatScore(score);
  resultsSection.hidden = false;

  shareButton.onclick = () => {
    const shareUrl = buildShareUrl(trimmedAnswer, score);
    window.open(shareUrl, "_blank", "noopener");
  };
  shareButton.disabled = false;
});