
const DEFAULT_URL = "content.json";
let data = null;
let currentIndex = 0;
let score = 0;
let completed = new Set();
let mediaRecorder = null;
let mediaChunks = [];
let appSettings = JSON.parse(localStorage.getItem("foodventure-settings") || "{}");

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

async function loadData(){
  const saved = localStorage.getItem("foodventure-content");
  if(saved){
    try{ data = JSON.parse(saved); return; }catch(e){}
  }
  const r = await fetch(DEFAULT_URL);
  data = await r.json();
}
function saveData(){ localStorage.setItem("foodventure-content", JSON.stringify(data)); }
function setView(id){
  $$(".view").forEach(v=>v.classList.remove("active"));
  $(id).classList.add("active");
  window.scrollTo({top:0,behavior:"smooth"});
}
function applySettings(){
  document.body.classList.toggle("inclusive", !!appSettings.inclusive);
  document.body.classList.toggle("reduce-motion", !!appSettings.reduceMotion);
  document.body.classList.toggle("large-text", !!appSettings.largeText);
  $("#inclusiveToggle").checked = !!appSettings.inclusive;
  $("#motionToggle").checked = !!appSettings.reduceMotion;
  $("#largeTextToggle").checked = !!appSettings.largeText;
}
function syncBrand(){
  $("#appTitle").textContent = data.appTitle;
  $("#brandTitle").textContent = data.appTitle.replace(/^.*?:\s*/,"");
  $("#tagline").textContent = data.tagline;
}
function renderMap(){
  const map=$("#missionMap"); map.innerHTML="";
  data.missions.forEach((m,i)=>{
    const b=document.createElement("button");
    b.className="mission-node"+(completed.has(i)?" done":"");
    b.innerHTML=`<span class="icon">${["🍎","🎒","🌉","🥕","🎙️"][i]||"⭐"}</span><div><strong>Misi ${i+1}</strong><div>${escapeHtml(m.title)}</div></div><small>${completed.has(i)?"Selesai ⭐":"Tekan untuk mula"}</small>`;
    b.onclick=()=>openMission(i);
    map.appendChild(b);
  });
  $("#scoreText").textContent=`${score} / ${data.missions.length}`;
}
function openMission(i){
  currentIndex=i;
  const m=data.missions[i];
  setView("#missionView");
  $("#missionCounter").textContent=`Misi ${i+1} daripada ${data.missions.length}`;
  $("#progressBar").style.width=`${((i+1)/data.missions.length)*100}%`;
  $("#missionTitle").textContent=m.title;
  $("#instructionBox").textContent=m.instruction;
  $("#missionScore").textContent=score;
  $("#feedback").className="feedback hidden";
  $("#nextBtn").classList.add("hidden");
  $("#promptPreview").classList.add("hidden");
  $("#speakArea").classList.toggle("hidden",m.type!=="speak");
  $("#options").innerHTML="";
  if(m.type==="speak"){
    $("#promptPreview").textContent=m.prompt;
    $("#promptPreview").classList.remove("hidden");
    $("#nextBtn").classList.remove("hidden");
  }else{
    let opts=[...m.options];
    if(appSettings.inclusive) opts=opts.slice(0,2);
    opts.forEach(o=>{
      const b=document.createElement("button");
      b.className="option-card";
      b.innerHTML=`<span class="emoji">${o.emoji||"🖼️"}</span><span>${escapeHtml(o.label)}</span>`;
      b.onclick=()=>checkAnswer(b,o);
      $("#options").appendChild(b);
    });
  }
}
function checkAnswer(btn,opt){
  if(btn.dataset.locked) return;
  if(opt.correct){
    btn.classList.add("correct");
    $("#feedback").textContent="Hebat! Jawapan kamu betul. ⭐";
    $("#feedback").className="feedback ok";
    if(!completed.has(currentIndex)){ score++; completed.add(currentIndex); }
    $("#missionScore").textContent=score;
    $("#promptPreview").textContent=data.missions[currentIndex].prompt;
    $("#promptPreview").classList.remove("hidden");
    $("#nextBtn").classList.remove("hidden");
    $$(".option-card").forEach(x=>x.dataset.locked="1");
  }else{
    btn.classList.add("wrong");
    $("#feedback").textContent="Cuba sekali lagi. Dengar dengan teliti.";
    $("#feedback").className="feedback try";
    setTimeout(()=>btn.classList.remove("wrong"),700);
  }
}
function nextMission(){
  if(currentIndex<data.missions.length-1) openMission(currentIndex+1);
  else{
    completed.add(currentIndex);
    renderMap();
    setView("#mapView");
    const passed=score>=data.passingScore;
    setTimeout(()=>alert(passed?`Tahniah! Kamu berjaya dengan ${score} bintang! 🏆`:`Kamu dapat ${score} bintang. Cuba lagi untuk capai ${data.passingScore} bintang.`),100);
  }
}
function speak(text, slow=false){
  const m=data.missions[currentIndex]||{};
  if(m.audioUrl){
    const a=new Audio(m.audioUrl); a.playbackRate=slow?.8:1; a.play().catch(()=>fallbackSpeak(text,slow));
  }else fallbackSpeak(text,slow);
}
function fallbackSpeak(text,slow=false){
  if(!("speechSynthesis" in window)){ alert("Pelayar ini tidak menyokong suara sistem."); return; }
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);
  u.lang=data.settings.standardVoiceLang||"ms-MY";
  u.rate=slow?.72:.92;
  const voices=speechSynthesis.getVoices();
  const ms=voices.find(v=>v.lang?.toLowerCase().startsWith("ms"));
  if(ms) u.voice=ms;
  speechSynthesis.speak(u);
}
async function startRecording(){
  try{
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});
    mediaChunks=[];
    mediaRecorder=new MediaRecorder(stream);
    mediaRecorder.ondataavailable=e=>mediaChunks.push(e.data);
    mediaRecorder.onstop=()=>{
      const blob=new Blob(mediaChunks,{type:mediaRecorder.mimeType||"audio/webm"});
      $("#playback").src=URL.createObjectURL(blob);
      $("#playback").classList.remove("hidden");
      stream.getTracks().forEach(t=>t.stop());
    };
    mediaRecorder.start();
    $("#recordBtn").classList.add("hidden"); $("#stopRecordBtn").classList.remove("hidden");
  }catch(e){ alert("Mikrofon tidak dapat digunakan. Pastikan laman dibuka melalui HTTPS dan kebenaran mikrofon diberikan."); }
}
function stopRecording(){
  if(mediaRecorder?.state==="recording") mediaRecorder.stop();
  $("#recordBtn").classList.remove("hidden"); $("#stopRecordBtn").classList.add("hidden");
}
function renderTeacher(){
  $("#editTitle").value=data.appTitle;
  $("#editTagline").value=data.tagline;
  $("#editPass").value=data.passingScore;
  $("#editInclusive").checked=!!data.settings.inclusiveModeDefault;
  $("#editReduceMotion").checked=!!data.settings.reduceMotionDefault;
  $("#editVoiceLang").value=data.settings.standardVoiceLang||"ms-MY";
  const wrap=$("#missionEditorList"); wrap.innerHTML="";
  data.missions.forEach((m,i)=>{
    const div=document.createElement("div"); div.className="mission-editor";
    div.innerHTML=`
      <div class="mission-editor-grid">
        <label>Nama misi<input data-k="title" data-i="${i}" value="${escapeAttr(m.title)}"></label>
        <label>Jenis<select data-k="type" data-i="${i}"><option value="choose"${m.type==="choose"?" selected":""}>Pilih gambar</option><option value="speak"${m.type==="speak"?" selected":""}>Rakaman sebutan</option></select></label>
      </div>
      <label>Arahan<textarea data-k="instruction" data-i="${i}" rows="2">${escapeHtml(m.instruction)}</textarea></label>
      <label>Ayat / audio teks<textarea data-k="prompt" data-i="${i}" rows="2">${escapeHtml(m.prompt)}</textarea></label>
      <label>Fail audio (URL/path)<input data-k="audioUrl" data-i="${i}" value="${escapeAttr(m.audioUrl||"")}" placeholder="assets/audio/misi1.mp3"></label>
      ${m.type==="choose"?renderOptionEditor(m.options||[],i):""}
      <button class="danger remove-mission" data-i="${i}">Buang misi</button>`;
    wrap.appendChild(div);
  });
  wrap.querySelectorAll("[data-k]").forEach(el=>el.addEventListener("input",e=>{
    const i=+e.target.dataset.i,k=e.target.dataset.k; data.missions[i][k]=e.target.value; saveData(); syncBrand();
  }));
  wrap.querySelectorAll("[data-ok]").forEach(el=>el.addEventListener("input",e=>{
    const i=+e.target.dataset.i,j=+e.target.dataset.j,k=e.target.dataset.ok;
    if(k==="correct") data.missions[i].options[j][k]=e.target.checked;
    else data.missions[i].options[j][k]=e.target.value;
    saveData();
  }));
  wrap.querySelectorAll(".remove-mission").forEach(b=>b.onclick=()=>{data.missions.splice(+b.dataset.i,1);saveData();renderTeacher();});
}
function renderOptionEditor(options,i){
  return `<div class="options-editor"><strong>Pilihan jawapan</strong>${options.map((o,j)=>`
    <div class="mission-editor-grid">
      <label>Label<input data-ok="label" data-i="${i}" data-j="${j}" value="${escapeAttr(o.label||"")}"></label>
      <label>Emoji / ikon<input data-ok="emoji" data-i="${i}" data-j="${j}" value="${escapeAttr(o.emoji||"")}"></label>
      <label class="toggle-row"><input type="checkbox" data-ok="correct" data-i="${i}" data-j="${j}" ${o.correct?"checked":""}><span>Jawapan betul</span></label>
    </div>`).join("")}</div>`;
}
function downloadJSON(){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="foodventure-aktiviti.json"; a.click(); URL.revokeObjectURL(a.href);
}
function escapeHtml(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function escapeAttr(s=""){return escapeHtml(s);}

document.addEventListener("DOMContentLoaded", async()=>{
  await loadData(); syncBrand(); applySettings(); renderMap();
  $("#startBtn").onclick=()=>{score=0;completed.clear();renderMap();setView("#mapView")};
  $("#teacherBtn").onclick=()=>{renderTeacher();setView("#teacherView")};
  $("#homeBtn").onclick=()=>setView("#homeView");
  $("#backToMapBtn").onclick=()=>{renderMap();setView("#mapView")};
  $("#nextBtn").onclick=nextMission;
  $("#listenBtn").onclick=()=>speak(data.missions[currentIndex].prompt,false);
  $("#slowBtn").onclick=()=>speak(data.missions[currentIndex].prompt,true);
  $("#repeatBtn").onclick=()=>speak(data.missions[currentIndex].prompt,false);
  $("#audioTestBtn").onclick=()=>fallbackSpeak("Hai, kawan-kawan. Jom kita mulakan misi pemakanan sihat.",false);
  $("#inclusiveBtn").onclick=()=>{appSettings.inclusive=!appSettings.inclusive;localStorage.setItem("foodventure-settings",JSON.stringify(appSettings));applySettings();alert(appSettings.inclusive?"Mod Mesra Saya diaktifkan.":"Mod Mesra Saya dimatikan.");};
  $("#settingsBtn").onclick=()=>$("#settingsDialog").showModal();
  $("#howBtn").onclick=()=>$("#howDialog").showModal();
  $("#settingsDialog").addEventListener("close",()=>{appSettings.inclusive=$("#inclusiveToggle").checked;appSettings.reduceMotion=$("#motionToggle").checked;appSettings.largeText=$("#largeTextToggle").checked;localStorage.setItem("foodventure-settings",JSON.stringify(appSettings));applySettings();});
  $("#recordBtn").onclick=startRecording; $("#stopRecordBtn").onclick=stopRecording;
  $$(".teacher-tab").forEach(b=>b.onclick=()=>{$$(".teacher-tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");$$(".tab-panel").forEach(x=>x.classList.remove("active"));$("#tab-"+b.dataset.tab).classList.add("active");});
  $("#saveGeneralBtn").onclick=()=>{data.appTitle=$("#editTitle").value.trim()||data.appTitle;data.tagline=$("#editTagline").value.trim()||data.tagline;data.passingScore=+$("#editPass").value||4;saveData();syncBrand();alert("Maklumat aktiviti disimpan.");};
  $("#saveAccessBtn").onclick=()=>{data.settings.inclusiveModeDefault=$("#editInclusive").checked;data.settings.reduceMotionDefault=$("#editReduceMotion").checked;data.settings.standardVoiceLang=$("#editVoiceLang").value.trim()||"ms-MY";saveData();alert("Tetapan disimpan.");};
  $("#previewBtn").onclick=()=>{renderMap();setView("#homeView")};
  $("#exportBtn").onclick=downloadJSON;
  $("#importInput").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const imported=JSON.parse(await f.text());if(!imported.missions||!Array.isArray(imported.missions))throw new Error();data=imported;saveData();syncBrand();renderTeacher();alert("Aktiviti berjaya diimport.");}catch(err){alert("Fail JSON tidak sah.");}};
  $("#resetBtn").onclick=()=>{if(confirm("Pulihkan kandungan asal?")){localStorage.removeItem("foodventure-content");location.reload();}};
  $("#addMissionBtn").onclick=()=>{data.missions.push({id:"m"+Date.now(),title:"Misi Baharu",type:"choose",instruction:"Dengar dan pilih jawapan yang betul.",prompt:"Ayat baharu.",audioUrl:"",options:[{label:"Pilihan A",emoji:"🍎",correct:true},{label:"Pilihan B",emoji:"🍩",correct:false}]});saveData();renderTeacher();};
  if("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("service-worker.js").catch(()=>{});
});
