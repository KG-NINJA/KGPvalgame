const form = document.querySelector("#answer-form");
const textarea = document.querySelector("#user-answer");
const resultsSection = document.querySelector("#results");
const userAnswerDisplay = document.querySelector("#user-answer-display");
const gptAnswerDisplay = document.querySelector("#gpt-answer-display");
const scoreDisplay = document.querySelector("#score-display");
const shareButton = document.querySelector("#share-button");
const taskText = document.querySelector("#task-text");

let tasks = [];
let answers = {};
let currentTask = null;

const formatScore = (value) => `${value} 点`;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const summarizePrompt = (prompt) => {
  if (!prompt) return "";
  const trimmed = prompt.replace(/\s+/g, " ").trim();
  return trimmed.length > 80 ? `${trimmed.slice(0, 77)}…` : trimmed;
};

const buildShareUrl = (userAnswer, score) => {
  const message = [
    `お題: ${summarizePrompt(currentTask.input)}`,
    `私の答え: 「${userAnswer}」`,
    `スコア: ${score}点`,
    "あなたも挑戦→ https://username.github.io/gdpval-game/",
    "#GDPvalGame #KGNINJA"
  ].join("\n");
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`;
};

const normalise = (text) => text
  .toLowerCase()
  .replace(/https?:\S+/g, " ")
  .replace(/["'`、。！？!?,.;:()\[\]{}<>]/g, " ")
  .split(/\s+/)
  .filter(Boolean);

const buildNGramSet = (tokens, size) => {
  if (tokens.length < size) {
    return new Set();
  }
  const grams = new Set();
  for (let i = 0; i <= tokens.length - size; i += 1) {
    grams.add(tokens.slice(i, i + size).join(" "));
  }
  return grams;
};

const jaccard = (setA, setB) => {
  if (!setA.size || !setB.size) return 0;
  let intersection = 0;
  setA.forEach((item) => {
    if (setB.has(item)) intersection += 1;
  });
  const union = setA.size + setB.size - intersection;
  return union ? intersection / union : 0;
};

const seededJitter = (text, min, max) => {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 33 + text.charCodeAt(i)) >>> 0;
  }
  const span = max - min + 1;
  return min + (hash % span);
};

const getIdealEntry = (task) => {
  if (!task || !task.answer_id) return null;
  return answers[task.answer_id] || null;
};

const getIdealText = (task) => {
  const entry = getIdealEntry(task);
  if (!entry) return null;
  const content = entry.ideal_text;
  if (typeof content === "string" && content.trim()) {
    return content.trim();
  }
  return null;
};

const fallbackScore = (answer) => clamp(42 + seededJitter(answer, -12, 18), 0, 72);

const evaluateAnswer = (answer, task) => {
  const reference = getIdealText(task);
  if (!reference) {
    return fallbackScore(answer);
  }

  const answerTokens = normalise(answer);
  const referenceTokens = normalise(reference);

  if (!answerTokens.length) {
    return 0;
  }
  if (!referenceTokens.length) {
    return fallbackScore(answer);
  }

  const uniA = new Set(answerTokens);
  const uniB = new Set(referenceTokens);
  const biA = buildNGramSet(answerTokens, 2);
  const biB = buildNGramSet(referenceTokens, 2);

  const unigramScore = jaccard(uniA, uniB);
  const bigramScore = jaccard(biA, biB);

  const lengthRatio = Math.min(answerTokens.length, referenceTokens.length) /
    Math.max(answerTokens.length, referenceTokens.length);

  let score = 15;
  score += unigramScore * 55;
  score += bigramScore * 25;
  score += lengthRatio * 25;
  score += seededJitter(answer + reference, -5, 5);

  return clamp(Math.round(score), 0, 100);
};

const renderTask = () => {
  if (!currentTask) return;
  taskText.textContent = currentTask.input;
  textarea.value = "";
  resultsSection.hidden = true;
  shareButton.disabled = true;
};

Promise.all([
  fetch("tasks.json").then((resp) => resp.json()),
  fetch("answers.json").then((resp) => resp.json()),
])
  .then(([taskData, answerData]) => {
    answers = answerData;
    tasks = taskData.filter((task) => {
      if (!task.input) return false;
      if (!task.answer_id) return true; // allow fallback if answer missing later
      return true;
    });

    const viableTasks = tasks.filter((task) => getIdealText(task));
    // fall back to all tasks if none have ideal text
    const pool = viableTasks.length ? viableTasks : tasks;

    if (!pool.length) {
      taskText.textContent = "タスクがありません。tasks.jsonを確認してください。";
      return;
    }

    currentTask = pool[Math.floor(Math.random() * pool.length)];
    renderTask();
  })
  .catch((error) => {
    taskText.textContent = "タスクの読み込みに失敗しました。";
    console.error(error);
  });

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const trimmedAnswer = textarea.value.trim();
  if (!trimmedAnswer || !currentTask) {
    textarea.focus();
    return;
  }

  const score = evaluateAnswer(trimmedAnswer, currentTask);
  userAnswerDisplay.textContent = trimmedAnswer;

  const reference = getIdealText(currentTask);
  const entry = getIdealEntry(currentTask);
  const refFiles = entry?.reference_files?.length
    ? entry.reference_files
    : currentTask.reference_files || [];

  if (reference) {
    gptAnswerDisplay.textContent = reference;
  } else if (refFiles.length) {
    gptAnswerDisplay.textContent = `参照: ${refFiles[0]}`;
  } else {
    gptAnswerDisplay.textContent = "参照ファイルを確認してください";
  }

  scoreDisplay.textContent = formatScore(score);
  resultsSection.hidden = false;

  shareButton.onclick = () => {
    const shareUrl = buildShareUrl(trimmedAnswer, score);
    window.open(shareUrl, "_blank", "noopener");
  };
  shareButton.disabled = false;
});
