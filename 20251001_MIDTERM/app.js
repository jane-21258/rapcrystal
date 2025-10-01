const HARDCODED_QUERIES = {
  friends: "Yuki Chiba Omote",
  "getting ready": "YEN Fly Girl",
  "making money": "Yuki Chiba BANK",
  drink: "LEX BABY",
  cheating: "Awich IO What You Want",
  "crying over partner": "Will Halo regret",
  "tired of being broke": "セブン勤務freestyle(feat.店長) hedo",
  hustle: "ANARCHY Let It Go",
  party: "JP THE WAVY Cho Wavy De Gomenne",
  study: "MIYACHI",
  "late night": "Daichi Yamamoto Paradise"
};
const BTN = {
  play:  "▶︎ 再生 / Play",
  pause: "⏸ 一時停止 / Pause"
};

const BACKUP_QUERIES = {
  friends: [],
  "getting ready": ["3Li Yen Fly Girl","3Li¥en Fly Girl"],
  "making money": [],
  drink: [],
  cheating: [],
  "crying over partner": ["DAOKO かけてあげる","Nujabes Shing02 Luv sic"],
  "tired of being broke": ["KOHH 貧乏","JP THE WAVY 稼ぐ"],
  hustle: ["hedo freestyle","AKLO RGTO"],
  party: ["BAD HOP Life Style"],
  study: [],
  "late night": []
};

const JP_ARTIST_ALLOWLIST = [
  "KOHH","Yuki Chiba","Awich","IO","Jin Dogg","LEX","hedo","ANARCHY","AKLO",
  "tofubeats","Daichi Yamamoto","BAD HOP","ISSUGI","JP THE WAVY","MIYACHI",
  "Nujabes","Shing02","chelmico","3Li¥en","3Li Yen","Will Halo","DAOKO","YEN"
];

const looksJP = (s="") => /[\u3040-\u30ff\u4e00-\u9faf]/.test(s);
const allowMain = (name="") => JP_ARTIST_ALLOWLIST.some(a => (name||"").toLowerCase().includes(a.toLowerCase()));

function jsonp(url, t=8000){
  return new Promise(res=>{
    const cb="dz_"+Math.random().toString(36).slice(2), s=document.createElement("script");
    let done=false; const end=d=>{ if(done) return; done=true; try{delete window[cb]}catch{} s.remove(); res(d) };
    window[cb]=d=>end(d);
    s.src=`${url}${url.includes("?")?"&":"?"}output=jsonp&callback=${cb}`;
    s.onerror=()=>end(null); document.body.appendChild(s);
    setTimeout(()=>end(null), t);
  });
}
async function qDeezer(q){ const r=await jsonp(`https://api.deezer.com/search?q=${encodeURIComponent(q)}`); return r?.data||[]; }
const pickStrict = L => L.find(t => t?.preview && allowMain(t.artist?.name) && !(/,|&|feat/i.test(t.artist?.name) && t.artist?.name.split(/,|&|feat\.?/i).length>3))||null;
const pickRelax  = L => L.find(t => t?.preview && (allowMain(t.artist?.name)||looksJP(t.artist?.name)||looksJP(t.title)))||null;

async function best(q){
  let l = await qDeezer(`${q} japan`); let t = pickStrict(l); if(t) return t;
  l = await qDeezer(q);                 t = pickStrict(l);   if(t) return t;
  l = await qDeezer(`${q} japan`);      t = pickRelax(l);    if(t) return t;
  l = await qDeezer(q);                 t = pickRelax(l);    if(t) return t;
  return null;
}

function norm(text){
  const q=(text||"").toLowerCase().trim(); if(!q) return "";
  const map=[
    {k:"friends",v:["friends","友だち","ともだち","hang"]},
    {k:"getting ready",v:["getting ready","準備"]},
    {k:"making money",v:["making money","稼"]},
    {k:"drink",v:["drink","飲","酒","beer"]},
    {k:"cheating",v:["cheat","cheating","浮気"]},
    {k:"crying over partner",v:["cry","crying","泣","失恋"]},
    {k:"tired of being broke",v:["no money","broke","お金ない","貧乏","tired of being broke"]},
    {k:"hustle",v:["hustle","頑張","grind"]},
    {k:"party",v:["party","パーティ"]},
    {k:"study",v:["study","勉強","作業","chill"]},
    {k:"late night",v:["late night","深夜","drive","夜"]}
  ];
  for(const r of map) if(r.v.some(k=>q.includes(k))) return r.k;
  return q;
}
function queriesFor(text){
  const key=norm(text); if(!key) return [];
  const p=HARDCODED_QUERIES[key]; const b=BACKUP_QUERIES[key]||[];
  return p ? [p,...b] : [text];
}

const $=s=>document.querySelector(s);
const moodSelect=$("#moodSelect"), moodInput=$("#moodInput"),
      suggestBtn=$("#suggestBtn"), playPause=$("#playPause"),
      volumeEl=$("#volume"), nowPlaying=$("#nowPlaying");

let audio=new Audio(); audio.crossOrigin="anonymous";
let ctx,srcNode,analyser,gainNode,fftData;

function ensureGraph(){
  if(ctx) return;
  ctx=new (window.AudioContext||window.webkitAudioContext)();
  srcNode=ctx.createMediaElementSource(audio);
  analyser=ctx.createAnalyser(); analyser.fftSize=1024; fftData=new Uint8Array(analyser.frequencyBinCount);
  gainNode=ctx.createGain(); gainNode.gain.value=parseFloat(volumeEl?.value||"0.8");
  srcNode.connect(gainNode).connect(analyser).connect(ctx.destination);
}
volumeEl?.addEventListener("input",()=>{ ensureGraph(); if(gainNode) gainNode.gain.value=parseFloat(volumeEl.value) });

let sketch=p=>{
  let w,h,cx,cy,R;
  p.setup=()=>{ const host=$("#canvasHost"); const c=p.createCanvas(host.clientWidth,host.clientHeight); c.parent("canvasHost");
    p.noStroke(); w=p.width; h=p.height; cx=w/2; cy=h/2; R=Math.min(w,h)*0.42; };
  p.windowResized=()=>{ const host=$("#canvasHost"); p.resizeCanvas(host.clientWidth,host.clientHeight);
    w=p.width; h=p.height; cx=w/2; cy=h/2; R=Math.min(w,h)*0.42; };
  p.draw=()=>{ p.clear(); p.push(); p.translate(cx,cy);
    const t=p.millis()/1000, pulse=6*Math.sin(t*2.2);
    p.fill(255,45,179,22); p.circle(0,0,R*1.7+pulse);
    if(analyser) analyser.getByteFrequencyData(fftData);
    const N=analyser?fftData.length:0, rings=90;
    for(let i=0;i<rings;i++){ const a=(i/rings)*Math.PI*2, idx=analyser?Math.floor((i/rings)*(N-1)):0, m=analyser?fftData[idx]/255:0.1;
      const rr=R*(0.62+0.33*m), x=Math.cos(a)*rr, y=Math.sin(a)*rr;
      p.fill(255,45,179,110+100*m); p.circle(x,y,3+7*m); }
    p.pop(); };
};
new p5(sketch);

function esc(s){ return (s||"").replace(/[&<>"']/g,c=>({ "&":"&amp;","<":"&lt;","&gt;":"&gt;",'"':"&quot;","'":"&#39;" }[c])); }
function qText(){ return (moodSelect?.value||"").trim() || (moodInput?.value||"").trim(); }
function setNP(t, q){
  const a=t.artist?.name||"", ti=t.title||"", link=t.link||`https://www.deezer.com/search/${encodeURIComponent(`${a} ${ti}`)}`;
  nowPlaying.innerHTML = `
    <div class="label">今日の気分 / Today’s mood</div>
    <div><b>${esc(q)}</b></div><br>
    <div class="label">再生中 / Now Playing</div>
    <div class="title">${esc(a)} — ${esc(ti)}</div>
    <div><a href="${link}" target="_blank" rel="noopener">Deezerで開く</a></div>
  `;
}

async function runSuggest(q){
  const mood=q||qText(); if(!mood){ nowPlaying.textContent="気分を選ぶか入力してね"; return; }
  ensureGraph(); try{ await ctx?.resume?.(); }catch{}
  nowPlaying.textContent="探しています…";

  let track=null;
  for(const s of queriesFor(mood)){ track=await best(s); if(track?.preview) break; }

  if(!track?.preview){
    nowPlaying.textContent="プレビュー見つからず…  cant find it sorry";
    playPause.textContent="▶︎ 再生"; return;
  }

  try{
    audio.pause(); audio.src=track.preview; await audio.play();
    document.body.classList.add("playing"); playPause.textContent="⏸ 一時停止"; setNP(track,mood);
  }catch{
    nowPlaying.textContent="再生に失敗…";
    playPause.textContent="▶︎ 再生";
  }finally{
    setTimeout(()=>document.body.classList.remove("playing"),900);
  }
}

$("#suggestBtn")?.addEventListener("click",()=>runSuggest());
$("#moodSelect")?.addEventListener("change",e=>runSuggest(e.target.value));
$("#moodInput")?.addEventListener("keydown",e=>{ if(e.key==="Enter") runSuggest(e.target.value) });
$("#playPause")?.addEventListener("click",async()=>{
  if(!audio.src) return; ensureGraph(); 
  try{ await ctx?.resume?.(); }catch{}
  if(audio.paused){ await audio.play(); playPause.textContent="⏸ 一時停止 pause"; 
    document.body.classList.add("playing"); }
  else{ audio.pause(); playPause.textContent="▶︎ 再生 play"; 
    document.body.classList.remove("playing"); }
});
