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

  // シェア処理
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
