// เกมวิ่งข้ามฉาก — แตะ/Space เพื่อกระโดด · โหมดออฟไลน์ (เก็บคะแนนในเครื่อง) / ออนไลน์ (ลีดเดอร์บอร์ดกลางใน Firebase /game/scores)
(function(){
const W=360,H=200,GY=182,PX=46,ST=[ // [ไฟล์ฉาก, ชื่อเมือง, สิ่งกีดขวาง, ของเก็บ]
  ["osaka","โอซาก้า","📦","🐙"],["kyoto","เกียวโต","⛩️","🍡"],["nara","นารา","🦌","🍪"],
  ["kobe","โกเบ","⚓","🥩"],["kanazawa","คานาซาวะ","🏮","✨"],["shirakawa","ชิราคาวาโกะ","⛄","🍵"]];
const LS={m:"getoh_game_mode",n:"getoh_game_nick",b:"getoh_game_best"};
const ls=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}};
const img=s=>{const i=new Image();i.src=s;return i};
const bg=ST.map(s=>img(s[0]+"-scene.svg")),walk=img("couple-walk.png"),jump=img("couple-jump.png");
let root,cv,cx,panel,raf=0,last=0,open=false;
let mode=ls(LS.m)||(navigator.onLine?"on":"off"),nick=ls(LS.n)||"",best=+ls(LS.b)||0;
let S={st:"menu"};

function css(){
  if(document.getElementById("gm-css"))return;
  const s=document.createElement("style");s.id="gm-css";
  s.textContent=`#gm{position:fixed;inset:0;z-index:70;background:#12301a;color:#F6F5E6;display:flex;flex-direction:column;align-items:center;overflow-y:auto;padding:env(safe-area-inset-top,0px) 12px calc(16px + env(safe-area-inset-bottom,0px))}
#gm .gm-bar{width:100%;max-width:560px;display:flex;justify-content:space-between;align-items:center;padding:10px 0}
#gm .gm-bar b{font:400 18px 'DotGothic16','Sarabun',sans-serif;color:#B8CC2C}
#gm .gm-x{min-width:44px;min-height:44px;border:0;border-radius:14px;background:#1d4a2a;color:#F6F5E6;font-size:18px;cursor:pointer}
#gm canvas{width:100%;max-width:560px;aspect-ratio:${W}/${H};image-rendering:pixelated;border-radius:18px;touch-action:manipulation;background:#DCE76F;display:block}
#gm .gm-p{width:100%;max-width:560px;margin-top:12px}
#gm .gm-seg{display:grid;grid-template-columns:1fr 1fr;gap:6px;background:#1d4a2a;border-radius:16px;padding:4px}
#gm .gm-seg button{min-height:46px;border:0;border-radius:12px;background:none;color:#cfe0c4;font:inherit;font-size:15px;cursor:pointer}
#gm .gm-seg button.on{background:#B8CC2C;color:#12301a;font-weight:700}
#gm .gm-note{font-size:13px;color:#9fb394;margin:8px 2px;line-height:1.45}
#gm input{width:100%;box-sizing:border-box;min-height:46px;border-radius:14px;border:2px solid #26602f;background:#0d2214;color:#F6F5E6;padding:0 14px;font:inherit;font-size:16px;margin-top:8px}
#gm .gm-go{width:100%;min-height:52px;margin-top:10px;border:0;border-radius:16px;background:#B8CC2C;color:#12301a;font:700 17px 'Sarabun',sans-serif;cursor:pointer}
#gm .gm-go.alt{background:#1d4a2a;color:#F6F5E6;font-weight:400;font-size:15px}
#gm .gm-res{text-align:center;font:400 30px 'DotGothic16','Sarabun',sans-serif;color:#D6E65A;margin:2px 0}
#gm .gm-lb{margin:10px 0 0;padding:0;list-style:none}
#gm .gm-lb li{display:flex;gap:10px;align-items:baseline;padding:8px 4px;border-top:1px dashed rgba(233,234,210,.22)}
#gm .gm-lb li b{flex:none;width:24px;color:#B8CC2C;font-weight:400}#gm .gm-lb li span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#gm .gm-lb li i{font:400 17px 'DotGothic16',sans-serif;font-style:normal;color:#D6E65A}
#gm button:focus-visible,#gm input:focus-visible{outline:3px solid #D6E65A;outline-offset:2px}`;
  document.head.appendChild(s);
}
function build(){
  if(root)return;css();
  root=document.createElement("div");root.id="gm";root.setAttribute("role","dialog");root.setAttribute("aria-modal","true");root.setAttribute("aria-label","เกมวิ่งข้ามฉาก");
  root.innerHTML=`<div class="gm-bar"><b>🎮 วิ่งข้ามฉาก</b><button class="gm-x" aria-label="ปิดเกม">✕</button></div><canvas width="${W}" height="${H}" aria-label="พื้นที่เล่นเกม แตะหรือกด Space เพื่อกระโดด"></canvas><div class="gm-p"></div>`;
  document.body.appendChild(root);
  cv=root.querySelector("canvas");cx=cv.getContext("2d");cx.imageSmoothingEnabled=false;panel=root.querySelector(".gm-p");
  root.querySelector(".gm-x").onclick=close;
  cv.addEventListener("pointerdown",e=>{e.preventDefault();act()});
}
const act=()=>{if(S.st==="menu")start();else if(S.st==="play")jumpNow();else if(S.st==="over")start()};
function key(e){if(!open)return;if(e.code==="Escape")return close();if(e.code==="Space"||e.code==="ArrowUp"){e.preventDefault();if(e.repeat)return;if(!(e.target&&e.target.tagName==="INPUT"))act()}}
function jumpNow(){if(S.y>=GY-.5){S.vy=-330}}

function start(){
  if(mode==="on"){const v=document.getElementById("gm-nick");if(v){nick=v.value.replace(/[<>]/g,"").trim().slice(0,12);ls(LS.n,nick)}}
  S={st:"play",t:0,dist:0,items:0,sp:120,y:GY,vy:0,obs:[],col:[],gap:90,stage:0,shown:0,banner:1.6,sub:false};
  panel.innerHTML="";last=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);
}
const score=()=>Math.floor(S.dist/8)+S.items*10;
function loop(ts){
  if(!open||S.st!=="play")return;
  const dt=Math.min(.033,last?(ts-last)/1000:.016);last=ts;step(dt);draw();
  if(S.st==="play")raf=requestAnimationFrame(loop);
}
function step(dt){
  S.t+=dt;S.sp=Math.min(270,120+S.t*4);S.dist+=S.sp*dt;S.banner=Math.max(0,S.banner-dt);
  S.vy+=900*dt;S.y+=S.vy*dt;if(S.y>=GY){S.y=GY;S.vy=0}
  const ns=Math.floor(score()/300)%ST.length;if(ns!==S.stage){S.stage=ns;S.banner=1.8;S.fade=0}
  S.fade=Math.min(1,(S.fade==null?1:S.fade)+dt/1.2);
  S.gap-=S.sp*dt;
  if(S.gap<=0){
    S.obs.push({x:W+12,w:18,h:22});
    if(Math.random()<.7)S.col.push({x:W+12+(Math.random()*60|0)+30,y:GY-(Math.random()<.5?34:62),got:0});
    S.gap=(150+Math.random()*130)*(S.sp/150);
  }
  for(const o of S.obs)o.x-=S.sp*dt;for(const c of S.col)c.x-=S.sp*dt;
  S.obs=S.obs.filter(o=>o.x>-30);S.col=S.col.filter(c=>c.x>-30&&!c.got);
  const bx=PX+6,bw=22,by=S.y-38,bh=36;
  for(const o of S.obs)if(bx<o.x+o.w-3&&bx+bw>o.x+3&&by<GY&&by+bh>GY-o.h+4)return over();
  for(const c of S.col)if(!c.got&&bx<c.x+8&&bx+bw>c.x-8&&by<c.y+8&&by+bh>c.y-8){c.got=1;S.items++}
}
function draw(){
  const st=ST[S.stage];
  cx.clearRect(0,0,W,H);
  if(S.fade<1){cx.drawImage(bg[(S.stage+ST.length-1)%ST.length],0,H-210,W,210)}
  cx.globalAlpha=S.fade==null?1:S.fade;cx.drawImage(bg[S.stage],0,H-210,W,210);cx.globalAlpha=1;
  cx.fillStyle="rgba(18,48,26,.55)"; // เส้นพื้นวิ่ง
  const off=Math.floor(S.dist)%32;for(let x=-off;x<W;x+=32)cx.fillRect(x,H-9,16,3);
  cx.font="24px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif";cx.textAlign="center";cx.textBaseline="alphabetic";
  for(const o of S.obs)cx.fillText(st[2],o.x+o.w/2,GY+2);
  for(const c of S.col)cx.fillText(st[3],c.x,c.y+8);
  const air=S.y<GY-.5,fr=Math.floor(S.t*8)%2;
  if(air&&jump.complete)cx.drawImage(jump,0,0,57,68,PX,S.y-46,38,45);
  else if(walk.complete)cx.drawImage(walk,57*(1+fr),0,57,68,PX,S.y-46-(fr?1:0),38,45);
  cx.textAlign="left";cx.font="20px 'DotGothic16',monospace";cx.fillStyle="#12301a";cx.fillText(String(score()),10,24);
  cx.textAlign="right";cx.fillText("สูงสุด "+Math.max(best,score()),W-10,24);
  if(S.banner>0){cx.globalAlpha=Math.min(1,S.banner);cx.textAlign="center";cx.fillText(st[1],W/2,58);cx.globalAlpha=1}
}
function over(){
  S.st="over";cancelAnimationFrame(raf);const sc=score();
  if(sc>best){best=sc;ls(LS.b,String(best))}
  draw();cx.fillStyle="rgba(18,48,26,.6)";cx.fillRect(0,0,W,H);cx.fillStyle="#F6F5E6";cx.textAlign="center";cx.font="26px 'DotGothic16',monospace";cx.fillText("ชนแล้ว!",W/2,H/2);
  panelOver(sc);
}
const esc2=t=>String(t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function modeSeg(){return `<div class="gm-seg" role="group" aria-label="โหมดเกม"><button data-m="off" class="${mode==="off"?"on":""}">📴 ออฟไลน์</button><button data-m="on" class="${mode==="on"?"on":""}">🌐 ออนไลน์</button></div>`}
function bindSeg(after){panel.querySelectorAll(".gm-seg button").forEach(b=>b.onclick=()=>{mode=b.dataset.m;ls(LS.m,mode);after()})}
function menu(){
  S={st:"menu"};
  panel.innerHTML=modeSeg()+(mode==="on"
    ?`<p class="gm-note">ส่งคะแนนขึ้นลีดเดอร์บอร์ดกลาง ทุกคนในทริปเห็นพร้อมกัน ต้องมีอินเทอร์เน็ต</p><input id="gm-nick" maxlength="12" placeholder="ชื่อเล่น (ไม่เกิน 12 ตัวอักษร)" autocomplete="nickname" value="${esc2(nick)}">`
    :`<p class="gm-note">เล่นได้ไม่ต้องใช้เน็ต เก็บคะแนนสูงสุดไว้ในเครื่องนี้ · สูงสุดตอนนี้ <b>${best}</b></p>`)
    +`<button class="gm-go" id="gm-start">เริ่มเล่น (แตะจอหรือกด Space เพื่อกระโดด)</button>`+(mode==="on"?`<ol class="gm-lb" id="gm-lb"><li><span>กำลังโหลดอันดับ…</span></li></ol>`:"");
  bindSeg(menu);panel.querySelector("#gm-start").onclick=start;
  if(mode==="on")board();
  cx.clearRect(0,0,W,H);cx.drawImage(bg[0],0,H-210,W,210);
  if(walk.complete)cx.drawImage(walk,57,0,57,68,PX,GY-46,38,45);
  cx.fillStyle="#12301a";cx.font="18px 'DotGothic16',monospace";cx.textAlign="center";cx.fillText("แตะเพื่อเริ่ม",W/2,70);
}
function panelOver(sc){
  panel.innerHTML=`<div class="gm-res">${sc} คะแนน</div><p class="gm-note" style="text-align:center">${sc>=best&&sc>0?"🏆 สถิติใหม่ในเครื่องนี้ · ":""}สูงสุด ${best} · เก็บของ ${S.items} ชิ้น</p>
  ${mode==="on"?`<p class="gm-note" id="gm-st" style="text-align:center">กำลังส่งคะแนน…</p><ol class="gm-lb" id="gm-lb"></ol>`:""}
  <button class="gm-go" id="gm-again">เล่นอีกครั้ง</button><button class="gm-go alt" id="gm-menu">เปลี่ยนโหมด / ชื่อ</button>`;
  panel.querySelector("#gm-again").onclick=start;panel.querySelector("#gm-menu").onclick=menu;
  if(mode==="on")submit(sc)
}
async function submit(sc){
  const st=panel.querySelector("#gm-st");
  if(!nick){if(st)st.textContent="ใส่ชื่อเล่นที่เมนูก่อน จึงจะส่งคะแนนได้";return board()}
  if(sc<=0){if(st)st.textContent="ยังไม่มีคะแนนให้ส่ง";return board()}
  try{
    if(typeof dbx!=="function")throw 0;
    await dbx("POST","/game/scores",{n:nick,s:sc,t:Date.now()});
    if(st)st.textContent="✅ ส่งคะแนนแล้ว";
  }catch(e){
    if(st)st.innerHTML=`⚠️ ส่งไม่สำเร็จ (เน็ตหลุดหรือยังไม่ได้ตั้งกติกาฐานข้อมูล) คะแนนยังบันทึกในเครื่องแล้ว <button class="gm-go alt" id="gm-retry" style="margin-top:8px">ลองส่งอีกครั้ง</button>`;
    const r=panel.querySelector("#gm-retry");if(r)r.onclick=()=>{if(st)st.textContent="กำลังส่งคะแนน…";submit(sc)};
  }
  board();
}
async function board(){
  try{
    if(typeof dbx!=="function")throw 0;
    const o=await dbx("GET","/game/scores",undefined,'?orderBy="s"&limitToLast=10');
    const L=Object.values(o||{}).filter(x=>x&&typeof x.s==="number").sort((a,b)=>b.s-a.s).slice(0,10);
    const el=document.getElementById("gm-lb");if(!el)return;
    el.innerHTML=L.length?L.map((x,i)=>`<li><b>${i+1}</b><span>${esc2(String(x.n||"ไม่ระบุ").slice(0,12))}</span><i>${x.s}</i></li>`).join(""):"<li><span>ยังไม่มีใครส่งคะแนน เป็นคนแรกเลย</span></li>";
  }catch(e){const el=document.getElementById("gm-lb");if(el)el.innerHTML="<li><span>โหลดอันดับไม่ได้ตอนนี้ (ออฟไลน์?) เล่นต่อแบบออฟไลน์ได้</span></li>"}
}
function openGame(){build();open=true;root.style.display="flex";document.body.style.overflow="hidden";addEventListener("keydown",key);menu();
  const x=root.querySelector(".gm-x");if(x)x.focus()}
function close(){open=false;cancelAnimationFrame(raf);if(root)root.style.display="none";document.body.style.overflow="";removeEventListener("keydown",key);S={st:"menu"}}
document.addEventListener("visibilitychange",()=>{if(!open||S.st!=="play")return;cancelAnimationFrame(raf);if(!document.hidden){last=0;raf=requestAnimationFrame(loop)}}); // พักเกมตอนสลับแท็บ
window.gameOpen=openGame;
})();
