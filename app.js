
const DEFAULT_URL="content.json";
let data=null,currentIndex=0,score=0,completed=new Set(),mediaRecorder=null,mediaChunks=[];
let settings=JSON.parse(localStorage.getItem("df-settings")||"{}");

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));

async function loadData(){
  const saved=localStorage.getItem("df-content");
  if(saved){try{data=JSON.parse(saved);return;}catch(e){}}
  data=await (await fetch(DEFAULT_URL)).json();
}
function saveData(){localStorage.setItem("df-content",JSON.stringify(data))}
function showView(id){$$(".view").forEach(v=>v.classList.remove("active"));$(id).classList.add("active");window.scrollTo({top:0,behavior:"smooth"})}
function syncBrand(){
  $("#appTitle").textContent=data.appTitle;
  $("#subtitle").textContent=data.subtitle;
  $("#miniTitle").textContent=data.subtitle;
  $("#tagline").textContent=data.tagline;
  $("#intro").textContent=data.intro;
}
function applySettings(){
  document.body.classList.toggle("inclusive",!!settings.inclusive);
  document.body.classList.toggle("reduce-motion",!!settings.reduceMotion);
  document.body.classList.toggle("large-text",!!settings.largeText);
  $("#inclusiveToggle").checked=!!settings.inclusive;
  $("#motionToggle").checked=!!settings.reduceMotion;
  $("#largeTextToggle").checked=!!settings.largeText;
}
function renderMap(){
  const map=$("#missionMap");map.innerHTML="";
  data.missions.forEach((m,i)=>{
    const b=document.createElement("button");
    b.className="mission-node"+(completed.has(i)?" done":"");
    b.innerHTML=`<span class="node-icon">${m.icon||"⭐"}</span><div><strong>Misi ${i+1}</strong><div>${esc(m.title)}</div><small>${completed.has(i)?"Selesai ⭐":"Tekan untuk mula"}</small></div>`;
    b.onclick=()=>openMission(i);map.appendChild(b);
  });
  $("#scoreText").textContent=`${score} / ${data.missions.length}`;
}
function resetAreas(){
  ["#chooseArea","#dragArea","#bridgeArea","#catchArea","#speakArea"].forEach(id=>$(id).classList.add("hidden"));
  $("#feedback").className="feedback hidden";$("#nextBtn").classList.add("hidden");$("#promptPreview").classList.add("hidden");
}
function openMission(i){
  currentIndex=i;const m=data.missions[i];resetAreas();showView("#missionView");
  $("#missionCounter").textContent=`Misi ${i+1} daripada ${data.missions.length}`;
  $("#progressBar").style.width=`${((i+1)/data.missions.length)*100}%`;
  $("#missionTitle").textContent=m.title;$("#instructionBox").textContent=m.instruction;$("#missionScore").textContent=score;
  $("#missionBg").src=m.background||"assets/backgrounds/home-bg.png";
  if(m.type==="choose") renderChoose(m);
  else if(m.type==="drag") renderDrag(m);
  else if(m.type==="bridge") renderBridge(m);
  else if(m.type==="catch") renderCatch(m);
  else renderSpeak(m);
}
function optionHTML(o){return o.image?`<img src="${esc(o.image)}" alt="${esc(o.label)}"><span>${esc(o.label)}</span>`:`<span class="big-emoji">${esc(o.emoji||"🖼️")}</span><span>${esc(o.label)}</span>`}
function renderChoose(m){
  $("#chooseArea").classList.remove("hidden");const w=$("#options");w.innerHTML="";
  let opts=[...m.options]; if(settings.inclusive) opts=opts.slice(0,2);
  opts.forEach(o=>{const b=document.createElement("button");b.className="option-card";b.innerHTML=optionHTML(o);b.onclick=()=>checkChoice(b,o,m.prompt);w.appendChild(b)})
}
function checkChoice(btn,o,prompt){
  if(btn.dataset.locked)return;
  if(o.correct){
    btn.classList.add("correct");success(prompt);
    $$(".option-card").forEach(x=>x.dataset.locked="1");
  }else{
    btn.classList.add("wrong");feedback("Cuba sekali lagi. Dengar dengan teliti.","try");setTimeout(()=>btn.classList.remove("wrong"),600)
  }
}
function renderDrag(m){
  $("#dragArea").classList.remove("hidden");const wrap=$("#dragOptions");wrap.innerHTML="";
  let opts=[...m.options];if(settings.inclusive)opts=opts.slice(0,2);
  opts.forEach((o,j)=>{const d=document.createElement("div");d.className="drag-item";d.draggable=true;d.dataset.idx=j;d.innerHTML=optionHTML(o);d.addEventListener("dragstart",e=>e.dataTransfer.setData("text/plain",j));wrap.appendChild(d)});
  const dz=$("#dropZone");
  dz.ondragover=e=>{e.preventDefault();dz.classList.add("over")};
  dz.ondragleave=()=>dz.classList.remove("over");
  dz.ondrop=e=>{e.preventDefault();dz.classList.remove("over");const idx=+e.dataTransfer.getData("text/plain");const o=opts[idx];if(o?.correct)success(m.prompt);else feedback("Belum tepat. Cuba seret makanan lain.","try")};
  [...wrap.children].forEach((el,j)=>{el.onclick=()=>{const o=opts[j]; if(o.correct)success(m.prompt); else feedback("Belum tepat. Cuba makanan lain.","try")}})
}
function renderBridge(m){
  $("#bridgeArea").classList.remove("hidden");const pl=$("#bridgePlanks");pl.innerHTML="";
  for(let i=0;i<5;i++){const d=document.createElement("div");d.className="plank";pl.appendChild(d)}
  const wrap=$("#bridgeOptions");wrap.innerHTML="";
  m.options.forEach(o=>{const b=document.createElement("button");b.className="option-card";b.innerHTML=optionHTML(o);b.onclick=()=>{if(o.correct){activateBridge();success(m.prompt)}else feedback("Cuba lagi. Dengar ayat sekali lagi.","try")};wrap.appendChild(b)})
}
function activateBridge(){$$("#bridgePlanks .plank").forEach((p,i)=>setTimeout(()=>p.classList.add("active"),i*140))}
function renderCatch(m){
  $("#catchArea").classList.remove("hidden");const box=$("#catchBox");box.innerHTML="";
  const items=[...m.options,...m.options];
  items.forEach((o,i)=>{const d=document.createElement("div");d.className="catch-food";d.style.left=(6+(i*16)%82)+"%";d.style.animationDelay=(i*.55)+"s";d.style.animationDuration=(4.8+(i%3)*.7)+"s";d.innerHTML=o.image?`<img src="${esc(o.image)}" alt="${esc(o.label)}">`:`<div style="font-size:4rem">${esc(o.emoji||"🍽️")}</div>`;d.onclick=()=>{if(o.correct){success(m.prompt);box.innerHTML=""}else feedback("Itu bukan makanan yang disebut. Cuba lagi!","try")};box.appendChild(d)})
}
function renderSpeak(m){
  $("#speakArea").classList.remove("hidden");$("#promptPreview").textContent=m.prompt;$("#promptPreview").classList.remove("hidden");
  $("#completeSpeakBtn").classList.remove("hidden");
}
function success(prompt){
  if(!completed.has(currentIndex)){completed.add(currentIndex);score++;$("#missionScore").textContent=score}
  $("#promptPreview").textContent=prompt;$("#promptPreview").classList.remove("hidden");feedback("Hebat! Jawapan kamu betul. ⭐","ok");$("#nextBtn").classList.remove("hidden");confetti()
}
function feedback(t,type){$("#feedback").textContent=t;$("#feedback").className=`feedback ${type}`}
function nextMission(){
  if(currentIndex<data.missions.length-1)openMission(currentIndex+1);
  else{
    renderMap();showView("#mapView");setTimeout(()=>alert(score>=data.passingScore?`Tahniah! Kamu berjaya dengan ${score} bintang! 🏆`:`Kamu mendapat ${score} bintang. Cuba lagi untuk capai ${data.passingScore} bintang.`),200)
  }
}
function speakText(text,slow=false){
  const m=data.missions[currentIndex]||{};
  if(m.audioUrl){const a=new Audio(m.audioUrl);a.playbackRate=slow?.8:1;a.play().catch(()=>tts(text,slow));return}
  tts(text,slow)
}
function tts(text,slow=false){
  if(!("speechSynthesis" in window)){alert("Pelayar ini tidak menyokong suara sistem.");return}
  speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=data.settings.voiceLang||"ms-MY";u.rate=slow?(data.settings.slowRate||.72):(data.settings.voiceRate||.92);
  const voices=speechSynthesis.getVoices();const ms=voices.find(v=>v.lang?.toLowerCase().startsWith("ms"));if(ms)u.voice=ms;speechSynthesis.speak(u)
}
async function startRecording(){
  try{
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});mediaChunks=[];mediaRecorder=new MediaRecorder(stream);
    mediaRecorder.ondataavailable=e=>mediaChunks.push(e.data);
    mediaRecorder.onstop=()=>{const blob=new Blob(mediaChunks,{type:mediaRecorder.mimeType||"audio/webm"});$("#playback").src=URL.createObjectURL(blob);$("#playback").classList.remove("hidden");stream.getTracks().forEach(t=>t.stop())};
    mediaRecorder.start();$("#recordBtn").classList.add("hidden");$("#stopRecordBtn").classList.remove("hidden")
  }catch(e){alert("Mikrofon tidak dapat digunakan. Pastikan laman dibuka melalui HTTPS dan kebenaran mikrofon diberikan.")}
}
function stopRecording(){if(mediaRecorder?.state==="recording")mediaRecorder.stop();$("#recordBtn").classList.remove("hidden");$("#stopRecordBtn").classList.add("hidden")}
function confetti(){
  if(settings.reduceMotion)return;const wrap=$("#confetti");wrap.innerHTML="";
  const colors=["#ff5ebc","#7b49ff","#ffd84a","#41d49a","#46cfff"];
  for(let i=0;i<40;i++){const p=document.createElement("span");p.className="confetti-piece";p.style.left=Math.random()*100+"%";p.style.background=colors[i%colors.length];p.style.animationDelay=Math.random()*.4+"s";p.style.transform=`rotate(${Math.random()*360}deg)`;wrap.appendChild(p)}
  setTimeout(()=>wrap.innerHTML="",2200)
}
function renderTeacher(){
  $("#editTitle").value=data.appTitle;$("#editSubtitle").value=data.subtitle;$("#editTagline").value=data.tagline;$("#editIntro").value=data.intro;$("#editPass").value=data.passingScore;
  $("#editVoiceLang").value=data.settings.voiceLang||"ms-MY";$("#editVoiceRate").value=data.settings.voiceRate||.92;$("#editSlowRate").value=data.settings.slowRate||.72;
  const wrap=$("#missionEditorList");wrap.innerHTML="";
  data.missions.forEach((m,i)=>{
    const d=document.createElement("div");d.className="mission-editor";
    d.innerHTML=`<div class="mission-editor-grid">
      <label>Nama misi<input data-k="title" data-i="${i}" value="${esc(m.title)}"></label>
      <label>Jenis<select data-k="type" data-i="${i}">
        <option value="choose"${m.type==="choose"?" selected":""}>Pilih gambar</option>
        <option value="drag"${m.type==="drag"?" selected":""}>Seret ke beg</option>
        <option value="bridge"${m.type==="bridge"?" selected":""}>Jambatan</option>
        <option value="catch"${m.type==="catch"?" selected":""}>Food Catch</option>
        <option value="speak"${m.type==="speak"?" selected":""}>Rakaman sebutan</option>
      </select></label></div>
      <label>Arahan<textarea data-k="instruction" data-i="${i}" rows="2">${esc(m.instruction)}</textarea></label>
      <label>Ayat / teks audio<textarea data-k="prompt" data-i="${i}" rows="2">${esc(m.prompt)}</textarea></label>
      <label>Fail audio MP3/WAV (opsyen)<input data-k="audioUrl" data-i="${i}" value="${esc(m.audioUrl||"")}" placeholder="assets/audio/misi1.mp3"></label>
      <label>Latar belakang<input data-k="background" data-i="${i}" value="${esc(m.background||"assets/backgrounds/home-bg.png")}"></label>
      ${m.type!=="speak"?renderOptionEditor(m.options||[],i):""}
      <button class="game-btn danger remove-mission" data-i="${i}">Buang misi</button>`;
    wrap.appendChild(d)
  });
  wrap.querySelectorAll("[data-k]").forEach(el=>el.addEventListener("change",e=>{const i=+e.target.dataset.i,k=e.target.dataset.k;data.missions[i][k]=e.target.value;saveData();renderTeacher()}));
  wrap.querySelectorAll("[data-ok]").forEach(el=>el.addEventListener("input",e=>{const i=+e.target.dataset.i,j=+e.target.dataset.j,k=e.target.dataset.ok;if(k==="correct")data.missions[i].options[j][k]=e.target.checked;else data.missions[i].options[j][k]=e.target.value;saveData()}));
  wrap.querySelectorAll(".remove-mission").forEach(b=>b.onclick=()=>{data.missions.splice(+b.dataset.i,1);saveData();renderTeacher()})
}
function renderOptionEditor(options,i){
  return `<div><b>Pilihan jawapan</b>${options.map((o,j)=>`<div class="mission-editor-grid">
    <label>Label<input data-ok="label" data-i="${i}" data-j="${j}" value="${esc(o.label||"")}"></label>
    <label>Imej / path<input data-ok="image" data-i="${i}" data-j="${j}" value="${esc(o.image||"")}"></label>
    <label>Emoji jika tiada imej<input data-ok="emoji" data-i="${i}" data-j="${j}" value="${esc(o.emoji||"")}"></label>
    <label class="check-row"><input type="checkbox" data-ok="correct" data-i="${i}" data-j="${j}" ${o.correct?"checked":""}><span>Jawapan betul</span></label>
  </div>`).join("")}</div>`
}
function downloadJSON(){const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="dora-foodventure-aktiviti.json";a.click();URL.revokeObjectURL(a.href)}

document.addEventListener("DOMContentLoaded",async()=>{
  await loadData();syncBrand();applySettings();renderMap();
  $("#startBtn").onclick=()=>{score=0;completed.clear();renderMap();showView("#mapView")};
  $("#teacherBtn").onclick=()=>{renderTeacher();showView("#teacherView")};
  $("#homeBtn").onclick=()=>showView("#homeView");
  $("#backToMapBtn").onclick=()=>{renderMap();showView("#mapView")};
  $("#nextBtn").onclick=nextMission;
  $("#listenBtn").onclick=()=>speakText(data.missions[currentIndex].prompt,false);
  $("#slowBtn").onclick=()=>speakText(data.missions[currentIndex].prompt,true);
  $("#repeatBtn").onclick=()=>speakText(data.missions[currentIndex].prompt,false);
  $("#audioTestBtn").onclick=()=>tts("Hai, kawan-kawan. Jom kita mulakan misi pemakanan sihat.",false);
  $("#inclusiveBtn").onclick=()=>{settings.inclusive=!settings.inclusive;localStorage.setItem("df-settings",JSON.stringify(settings));applySettings();alert(settings.inclusive?"Mod Mesra Saya diaktifkan.":"Mod Mesra Saya dimatikan.")};
  $("#settingsBtn").onclick=()=>$("#settingsDialog").showModal();
  $("#howBtn").onclick=()=>$("#howDialog").showModal();
  $("#settingsDialog").addEventListener("close",()=>{settings.inclusive=$("#inclusiveToggle").checked;settings.reduceMotion=$("#motionToggle").checked;settings.largeText=$("#largeTextToggle").checked;localStorage.setItem("df-settings",JSON.stringify(settings));applySettings()});
  $("#recordBtn").onclick=startRecording;$("#stopRecordBtn").onclick=stopRecording;
  $("#completeSpeakBtn").onclick=()=>{success(data.missions[currentIndex].prompt);$("#completeSpeakBtn").classList.add("hidden")};
  $$(".teacher-tab").forEach(b=>b.onclick=()=>{$$(".teacher-tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");$$(".tab-panel").forEach(x=>x.classList.remove("active"));$("#tab-"+b.dataset.tab).classList.add("active")});
  $("#saveGeneralBtn").onclick=()=>{data.appTitle=$("#editTitle").value.trim()||data.appTitle;data.subtitle=$("#editSubtitle").value.trim()||data.subtitle;data.tagline=$("#editTagline").value.trim()||data.tagline;data.intro=$("#editIntro").value.trim()||data.intro;data.passingScore=+$("#editPass").value||4;saveData();syncBrand();alert("Maklumat aktiviti disimpan.")};
  $("#saveAccessBtn").onclick=()=>{data.settings.voiceLang=$("#editVoiceLang").value.trim()||"ms-MY";data.settings.voiceRate=+$("#editVoiceRate").value||.92;data.settings.slowRate=+$("#editSlowRate").value||.72;saveData();alert("Tetapan audio disimpan.")};
  $("#previewBtn").onclick=()=>{renderMap();showView("#homeView")};
  $("#exportBtn").onclick=downloadJSON;
  $("#importInput").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const imp=JSON.parse(await f.text());if(!imp.missions||!Array.isArray(imp.missions))throw new Error();data=imp;saveData();syncBrand();renderTeacher();alert("Aktiviti berjaya diimport.")}catch(err){alert("Fail JSON tidak sah.")}};
  $("#resetBtn").onclick=()=>{if(confirm("Pulihkan kandungan asal?")){localStorage.removeItem("df-content");location.reload()}};
  $("#addMissionBtn").onclick=()=>{data.missions.push({id:"m"+Date.now(),title:"Misi Baharu",type:"choose",icon:"⭐",instruction:"Dengar dan pilih jawapan yang betul.",prompt:"Ayat baharu.",background:"assets/backgrounds/home-bg.png",options:[{label:"Pilihan A",image:"assets/foods/apple.png",correct:true},{label:"Pilihan B",image:"assets/foods/banana.png",correct:false}]});saveData();renderTeacher()};
  if("serviceWorker" in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("service-worker.js").catch(()=>{})
});
