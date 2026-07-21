const gridSize = document.getElementById("gridSize");
const hiddenCount = document.getElementById("hiddenCount");
const revealToggle = document.getElementById("revealToggle");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const finishBtn = document.getElementById("finishBtn");
const playAgainBtn = document.getElementById("playAgainBtn");
const downloadBtn = document.getElementById("downloadBtn");
const setupPanel = document.getElementById("setupPanel");
const gamePanel = document.getElementById("gamePanel");
const board = document.getElementById("board");
const gameTitle = document.getElementById("gameTitle");
const targetStat = document.getElementById("targetStat");
const foundStat = document.getElementById("foundStat");
const guessStat = document.getElementById("guessStat");
const accuracyStat = document.getElementById("accuracyStat");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const remaining = document.getElementById("remaining");
const message = document.getElementById("message");
const resultPanel = document.getElementById("resultPanel");
const resultTitle = document.getElementById("resultTitle");
const resultSummary = document.getElementById("resultSummary");
const resultIcon = document.getElementById("resultIcon");

let game = null;
let lastResult = null;

function parseSize(value){
  const [w,h] = value.split("x").map(Number);
  return {w,h,total:w*h};
}

function updateHiddenOptions(){
  const {total} = parseSize(gridSize.value);
  const max = Math.floor(total/2);
  const current = Number(hiddenCount.value) || 2;
  hiddenCount.innerHTML = "";
  for(let n=2;n<=max;n++){
    const option=document.createElement("option");
    option.value=n; option.textContent=`${n} target${n>1?"s":""}`;
    hiddenCount.appendChild(option);
  }
  hiddenCount.value = String(Math.min(Math.max(current,2),max));
}
gridSize.addEventListener("change", updateHiddenOptions);
updateHiddenOptions();

revealToggle.addEventListener("click",()=>{
  const active = revealToggle.classList.toggle("active");
  revealToggle.setAttribute("aria-pressed", active);
  revealToggle.dataset.active = active;
});

function sampleUnique(total,count){
  const values=Array.from({length:total},(_,i)=>i+1);
  for(let i=values.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [values[i],values[j]]=[values[j],values[i]];
  }
  return values.slice(0,count);
}

function startGame(){
  const {w,h,total}=parseSize(gridSize.value);
  const count=Number(hiddenCount.value);
  game={
    w,h,total,count,
    hidden:new Set(sampleUnique(total,count)),
    guesses:new Set(),
    found:new Set(),
    revealMode: revealToggle.dataset.active==="true",
    startedAt:new Date()
  };
  setupPanel.classList.add("hidden");
  gamePanel.classList.remove("hidden");
  resultPanel.classList.add("hidden");
  gameTitle.textContent=`${w} × ${h} Grid`;
  board.style.gridTemplateColumns=`repeat(${w},1fr)`;
  renderBoard();
  updateStats();
  window.scrollTo({top:document.querySelector(".game-card").offsetTop-90,behavior:"smooth"});
}

function renderBoard(showAll=false){
  board.innerHTML="";
  for(let n=1;n<=game.total;n++){
    const cell=document.createElement("button");
    cell.className="cell";
    cell.textContent=n;
    cell.setAttribute("aria-label",`Cell ${n}`);
    const guessed=game.guesses.has(n);
    const isHidden=game.hidden.has(n);
    if(game.found.has(n)){
      cell.classList.add("found");
      cell.textContent="✓";
    } else if(showAll && isHidden){
      cell.classList.add("missed");
      cell.textContent="H";
    } else if(game.revealMode && isHidden && game.guesses.size===0){
      cell.classList.add("reveal");
      cell.textContent="•";
    }
    if(guessed) cell.disabled=true;
    if(!guessed) cell.addEventListener("click",()=>makeGuess(n,cell));
    board.appendChild(cell);
  }
}

function makeGuess(n,cell){
  game.guesses.add(n);
  cell.disabled=true;
  if(game.hidden.has(n)){
    game.found.add(n);
    cell.classList.add("found");
    cell.textContent="✓";
    message.innerHTML="<strong>Target found! 🎯</strong><span>Great choice. Keep searching for the remaining targets.</span>";
  } else {
    message.innerHTML="<strong>Not this time.</strong><span>That cell was empty. Try another number.</span>";
  }
  updateStats();
  if(game.found.size===game.count) finishGame(true);
}

function updateStats(){
  const found=game.found.size, guesses=game.guesses.size;
  const accuracy=guesses ? Math.round(found/guesses*100) : 0;
  const progress=Math.round(found/game.count*100);
  targetStat.textContent=game.count;
  foundStat.textContent=found;
  guessStat.textContent=`${guesses} / ${game.total}`;
  accuracyStat.textContent=`${accuracy}%`;
  remaining.textContent=game.count-found;
  progressBar.style.width=`${progress}%`;
  progressText.textContent=`${progress}%`;
}

function finishGame(auto=false){
  if(!game) return;
  renderBoard(true);
  const found=game.found.size;
  const accuracy=game.guesses.size ? Math.round(found/game.guesses.size*100) : 0;
  const complete=found===game.count;
  lastResult={
    date:new Date(),
    grid:`${game.w}x${game.h}`,
    hidden:[...game.hidden].sort((a,b)=>a-b),
    found:[...game.found].sort((a,b)=>a-b),
    guesses:[...game.guesses],
    accuracy,
    complete
  };
  resultTitle.textContent=complete ? "Perfect Hunt!" : "Hunt Complete";
  resultIcon.textContent=complete ? "✓" : "✦";
  resultSummary.textContent=`You found ${found} out of ${game.count} hidden targets (${accuracy}% accuracy). ${complete ? "Excellent work — every target was found!" : "The missed targets are now shown in red."}`;
  resultPanel.classList.remove("hidden");
  finishBtn.classList.add("hidden");
  message.innerHTML=complete
    ? "<strong>All targets found! 🏆</strong><span>You completed the challenge.</span>"
    : "<strong>Results revealed.</strong><span>Start a new game whenever you're ready.</span>";
  if(auto) resultPanel.scrollIntoView({behavior:"smooth",block:"center"});
}

function resetToSetup(){
  game=null;
  resultPanel.classList.add("hidden");
  finishBtn.classList.remove("hidden");
  gamePanel.classList.add("hidden");
  setupPanel.classList.remove("hidden");
}

function downloadResult(){
  if(!lastResult)return;
  const r=lastResult;
  const text=[
    "GUNDOWN GAME RESULT",
    "===================",
    `Date: ${r.date.toLocaleDateString()}`,
    `Time: ${r.date.toLocaleTimeString()}`,
    `Grid: ${r.grid}`,
    "",
    `Hidden locations: ${r.hidden.join(", ")}`,
    `Found locations: ${r.found.join(", ")}`,
    "",
    `${r.found.length} out of ${r.hidden.length} found (${r.accuracy}%)`
  ].join("\n");
  const blob=new Blob([text],{type:"text/plain"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  const stamp=r.date.toISOString().slice(0,16).replace(/[-:T]/g,"");
  a.download=`gundown_${stamp}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

startBtn.addEventListener("click",startGame);
restartBtn.addEventListener("click",resetToSetup);
playAgainBtn.addEventListener("click",resetToSetup);
finishBtn.addEventListener("click",()=>finishGame(false));
downloadBtn.addEventListener("click",downloadResult);

const helpModal=document.getElementById("helpModal");
document.getElementById("helpBtn").addEventListener("click",()=>helpModal.classList.remove("hidden"));
document.getElementById("closeHelp").addEventListener("click",()=>helpModal.classList.add("hidden"));
document.getElementById("closeHelp2").addEventListener("click",()=>helpModal.classList.add("hidden"));
helpModal.addEventListener("click",e=>{if(e.target===helpModal)helpModal.classList.add("hidden")});
