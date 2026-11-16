// เกมบล็อก (แนว Block Blast) — ลากชิ้นส่วนวางบนกระดาน 8×8 เติมแถว/คอลัมน์ให้เต็มเพื่อระเบิด
// โหมดออฟไลน์: เก็บคะแนนในเครื่อง · โหมดออนไลน์: ลีดเดอร์บอร์ดกลางใน Firebase /game/scores
(function(){
const W=360,H=500,N=8,C=40,BX=20,BY=72,TY=404,OFF=74; // กระดาน 8×8 ช่องละ 40 · ถาดชิ้นส่วนอยู่ล่าง · ชิ้นที่ลากลอยเหนือนิ้ว OFF px
const COL=["#E8896B","#F08CB0","#6DBE5C","#3E8FC0","#F2B84B","#8A6BC2","#D8432F"];
const SH=[["#"],["##"],["#","#"],["###"],["#","#","#"],["####"],["#","#","#","#"],["#####"],["#","#","#","#","#"],
  ["##","##"],["###","###","###"],["##","##","##"],["###","###"],
  ["#.","##"],[".#","##"],["##","#."],["##",".#"],
  ["#..","#..","###"],["..#","..#","###"],["###","#..","#.."],["###","..#","..#"],
  ["###",".#."],[".#.","###"],["#.","##","#."],[".#","##",".#"],
  [".##","##."],["##",".##"],["#.","##",".#"],[".#","##","#."],
  ["#.","#.","##"],[".#",".#","##"],["##","#.","#."],["##",".#",".#"],["###","#.."],["###","..#"],["#..","###"],["..#","###"]];
const LS={m:"getoh_game_mode",n:"getoh_game_nick",b:"getoh_block_best"};
const ls=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}};
let root,cv,cx,panel,raf=0,open=false;
let mode=ls(LS.m)||(navigator.onLine?"on":"off"),nick=ls(LS.n)||"",best=+ls(LS.b)||0;
let S={st:"menu",g:grid(),pcs:[null,null,null],sc:0,combo:0,drag:null,fx:[],pop:null};
function grid(){return Array.from({length:N},()=>Array(N).fill(0))}
const esc2=t=>String(t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

function css(){
  if(document.getElementById("gm-css"))return;
  const s=document.createElement("style");s.id="gm-css";
  s.textContent=`#gm{position:fixed;inset:0;z-index:70;background:#12301a;color:#F6F5E6;display:flex;flex-direction:column;align-items:center;overflow-y:auto;padding:env(safe-area-inset-top,0px) 12px calc(16px + env(safe-area-inset-bottom,0px))}
#gm .gm-bar{width:100%;max-width:420px;display:flex;justify-content:space-between;align-items:center;padding:6px 0}
#gm .gm-bar b{font:400 18px 'DotGothic16','Sarabun',sans-serif;color:#B8CC2C}
#gm .gm-x{min-width:44px;min-height:44px;border:0;border-radius:14px;background:#1d4a2a;color:#F6F5E6;font-size:18px;cursor:pointer}
#gm canvas{width:min(100%,420px,calc((100vh - 120px)*.72));aspect-ratio:${W}/${H};border-radius:20px;touch-action:none;background:#0d2214;display:block;user-select:none;-webkit-user-select:none}
#gm .gm-p{width:100%;max-width:420px;margin-top:12px}
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
  root=document.createElement("div");root.id="gm";root.setAttribute("role","dialog");root.setAttribute("aria-modal","true");root.setAttribute("aria-label","เกมบล็อก");
  root.innerHTML=`<div class="gm-bar"><b>🧩 เกมบล็อก</b><button class="gm-x" aria-label="ปิดเกม">✕</button></div><canvas width="${W}" height="${H}" aria-label="กระดานเกมบล็อก ลากชิ้นส่วนจากด้านล่างไปวางบนกระดาน"></canvas><div class="gm-p"></div>`;
  document.body.appendChild(root);
  cv=root.querySelector("canvas");cx=cv.getContext("2d");panel=root.querySelector(".gm-p");
  root.querySelector(".gm-x").onclick=close;
  cv.addEventListener("pointerdown",down);cv.addEventListener("pointermove",move);cv.addEventListener("pointerup",up);cv.addEventListener("pointercancel",()=>{S.drag=null});
}

// ---------- ชิ้นส่วน ----------
function mk(rows,color){const cells=[];rows.forEach((r,i)=>[...r].forEach((ch,j)=>{if(ch==="#")cells.push([i,j])}));return{cells,h:rows.length,w:rows[0].length,color}}
const fits=(p,r0,c0,g=S.g)=>p.cells.every(([r,c])=>{const y=r0+r,x=c0+c;return y>=0&&y<N&&x>=0&&x<N&&!g[y][x]});
const anyFit=p=>{for(let r=0;r<N;r++)for(let c=0;c<N;c++)if(fits(p,r,c))return true;return false};
function refill(){
  for(let t=0;t<40;t++){
    const a=[0,1,2].map(()=>mk(SH[Math.random()*SH.length|0],1+(Math.random()*COL.length|0)));
    if(a.some(anyFit)||t===39){S.pcs=a;return}
  }
}
function lines(g){ // แถว/คอลัมน์ที่เต็ม
  const R=[],Cc=[];for(let i=0;i<N;i++){if(g[i].every(Boolean))R.push(i);if(g.every(r=>r[i]))Cc.push(i)}return[R,Cc]}

// ---------- ควบคุม ----------
const pos=e=>{const r=cv.getBoundingClientRect();return[(e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height]};
function down(e){
  e.preventDefault();const[x,y]=pos(e);
  if(S.st==="menu")return start();
  if(S.st!=="play"||y<TY-14)return;
  const i=Math.min(2,Math.max(0,Math.floor(x/120)));if(!S.pcs[i])return;
  try{cv.setPointerCapture(e.pointerId)}catch(_){}
  S.drag={i,x,y};
}
function move(e){if(S.drag){const[x,y]=pos(e);S.drag.x=x;S.drag.y=y}}
function target(d){ // ชิ้นที่ลากอยู่ → ตำแหน่งช่องบนกระดาน
  const p=S.pcs[d.i];
  const tx=d.x-p.w*C/2,ty=d.y-OFF-p.h*C/2;
  return[Math.round((ty-BY)/C),Math.round((tx-BX)/C)];
}
function up(){
  if(!S.drag)return;const d=S.drag;S.drag=null;const p=S.pcs[d.i];if(!p)return;
  const[r0,c0]=target(d);if(fits(p,r0,c0))place(d.i,r0,c0);
}
function place(i,r0,c0){
  const p=S.pcs[i];p.cells.forEach(([r,c])=>{S.g[r0+r][c0+c]=p.color});
  let gain=p.cells.length;
  const[R,Cc]=lines(S.g),n=R.length+Cc.length;
  if(n){
    S.combo++;
    const clear=new Set();R.forEach(r=>{for(let c=0;c<N;c++)clear.add(r*N+c)});Cc.forEach(c=>{for(let r=0;r<N;r++)clear.add(r*N+c)});
    clear.forEach(k=>{const r=k/N|0,c=k%N;S.fx.push({r,c,col:S.g[r][c],t:0});S.g[r][c]=0});
    gain+=10*n*(n+1)/2+(S.combo>1?10*S.combo:0);
    if(S.g.every(r=>r.every(v=>!v)))gain+=100; // เคลียร์หมดกระดาน
    S.pop={txt:(n>1?n+" แถว! ":"")+(S.combo>1?"คอมโบ ×"+S.combo+" ":"")+"+"+gain,t:0};
  }else S.combo=0;
  S.sc+=gain;S.pcs[i]=null;
  if(S.pcs.every(v=>!v))refill();
  if(!S.pcs.some(v=>v&&anyFit(v)))over();
}
function start(){
  if(mode==="on"){const v=document.getElementById("gm-nick");if(v){nick=v.value.replace(/[<>]/g,"").trim().slice(0,12);ls(LS.n,nick)}}
  S={st:"play",g:grid(),pcs:[null,null,null],sc:0,combo:0,drag:null,fx:[],pop:null};refill();panel.innerHTML="";
}
function over(){
  S.st="over";if(S.sc>best){best=S.sc;ls(LS.b,String(best))}panelOver(S.sc);
}

// ---------- วาด ----------
function rr(x,y,w,h,r){cx.beginPath();cx.moveTo(x+r,y);cx.arcTo(x+w,y,x+w,y+h,r);cx.arcTo(x+w,y+h,x,y+h,r);cx.arcTo(x,y+h,x,y,r);cx.arcTo(x,y,x+w,y,r);cx.closePath()}
function blk(x,y,s,ci,a=1){
  cx.globalAlpha=a;cx.fillStyle=COL[ci-1];rr(x+1,y+1,s-2,s-2,s*.16);cx.fill();
  cx.fillStyle="rgba(255,255,255,.28)";rr(x+3,y+3,s-6,(s-6)*.34,s*.1);cx.fill();
  cx.fillStyle="rgba(0,0,0,.16)";cx.fillRect(x+3,y+s-s*.2-2,s-6,s*.14);cx.globalAlpha=1;
}
function draw(dt){
  cx.clearRect(0,0,W,H);cx.fillStyle="#0d2214";cx.fillRect(0,0,W,H);
  cx.textBaseline="alphabetic";cx.textAlign="left";
  cx.fillStyle="#9fb394";cx.font="13px 'Sarabun',sans-serif";cx.fillText("คะแนน",20,26);cx.textAlign="right";cx.fillText("สูงสุด",W-20,26);
  cx.font="30px 'DotGothic16',monospace";cx.fillStyle="#D6E65A";cx.textAlign="left";cx.fillText(String(S.sc),20,58);
  cx.textAlign="right";cx.fillStyle="#F6F5E6";cx.fillText(String(Math.max(best,S.sc)),W-20,58);
  // กระดาน
  cx.fillStyle="#1d4a2a";rr(BX-6,BY-6,N*C+12,N*C+12,14);cx.fill();
  let pv=null,pr=0,pc=0,hl=new Set();
  if(S.drag&&S.pcs[S.drag.i]){
    const p=S.pcs[S.drag.i];[pr,pc]=target(S.drag);
    if(fits(p,pr,pc)){pv=p;const g=S.g.map(r=>r.slice());p.cells.forEach(([r,c])=>{g[pr+r][pc+c]=1});
      const[R,Cc]=lines(g);R.forEach(r=>{for(let c=0;c<N;c++)hl.add(r*N+c)});Cc.forEach(c=>{for(let r=0;r<N;r++)hl.add(r*N+c)})}
  }
  for(let r=0;r<N;r++)for(let c=0;c<N;c++){
    const x=BX+c*C,y=BY+r*C;
    cx.fillStyle=(r+c)%2?"#173c22":"#1a4527";rr(x+1,y+1,C-2,C-2,6);cx.fill();
    if(S.g[r][c])blk(x,y,C,S.g[r][c]);
    if(hl.has(r*N+c)){cx.fillStyle="rgba(246,245,230,.28)";rr(x+1,y+1,C-2,C-2,6);cx.fill()}
  }
  if(pv)pv.cells.forEach(([r,c])=>blk(BX+(pc+c)*C,BY+(pr+r)*C,C,pv.color,.65));
  // เอฟเฟกต์ระเบิด
  S.fx=S.fx.filter(f=>(f.t+=dt)<.4);
  for(const f of S.fx){const k=f.t/.4,s=C*(1-k*.6),o=(C-s)/2;cx.globalAlpha=1-k;cx.fillStyle="#F6F5E6";rr(BX+f.c*C+o,BY+f.r*C+o,s,s,6);cx.fill();cx.globalAlpha=1}
  if(S.pop){S.pop.t+=dt;const k=S.pop.t/1.1;if(k>=1)S.pop=null;else{cx.globalAlpha=1-k*k;cx.font="22px 'DotGothic16','Sarabun',sans-serif";cx.textAlign="center";cx.fillStyle="#12301a";cx.lineWidth=5;cx.strokeStyle="#F6F5E6";cx.strokeText(S.pop.txt,W/2,BY+N*C/2-k*30);cx.fillText(S.pop.txt,W/2,BY+N*C/2-k*30);cx.globalAlpha=1}}
  // ถาดชิ้นส่วน
  cx.fillStyle="#12301a";rr(8,TY-14,W-16,H-TY+6,16);cx.fill();
  S.pcs.forEach((p,i)=>{
    if(!p||(S.drag&&S.drag.i===i&&S.st==="play"))return;
    const s=Math.min(24,100/Math.max(p.w,p.h)),ox=60+i*120-p.w*s/2,oy=TY+46-p.h*s/2;
    const ok=anyFit(p);p.cells.forEach(([r,c])=>blk(ox+c*s,oy+r*s,s,p.color,ok?1:.35));
  });
  if(S.drag&&S.pcs[S.drag.i]){const p=S.pcs[S.drag.i],ox=S.drag.x-p.w*C/2,oy=S.drag.y-OFF-p.h*C/2;p.cells.forEach(([r,c])=>blk(ox+c*C,oy+r*C,C,p.color))}
  if(S.st==="menu"){cx.fillStyle="rgba(13,34,20,.72)";cx.fillRect(0,0,W,H);cx.fillStyle="#F6F5E6";cx.textAlign="center";cx.font="24px 'DotGothic16','Sarabun',sans-serif";cx.fillText("เติมแถวให้เต็ม",W/2,H/2-8);cx.fillText("แล้วบล็อกจะระเบิด",W/2,H/2+26)}
  if(S.st==="over"){cx.fillStyle="rgba(13,34,20,.7)";cx.fillRect(0,0,W,H);cx.fillStyle="#F6F5E6";cx.textAlign="center";cx.font="28px 'DotGothic16','Sarabun',sans-serif";cx.fillText("วางต่อไม่ได้แล้ว",W/2,H/2-6);cx.fillStyle="#D6E65A";cx.font="40px 'DotGothic16',monospace";cx.fillText(String(S.sc),W/2,H/2+44)}
}
let lt=0;
function loop(ts){if(!open)return;const dt=Math.min(.05,lt?(ts-lt)/1000:.016);lt=ts;draw(dt);raf=requestAnimationFrame(loop)}

// ---------- เมนู / ผลลัพธ์ / ออนไลน์ ----------
function modeSeg(){return `<div class="gm-seg" role="group" aria-label="โหมดเกม"><button data-m="off" class="${mode==="off"?"on":""}">📴 ออฟไลน์</button><button data-m="on" class="${mode==="on"?"on":""}">🌐 ออนไลน์</button></div>`}
function bindSeg(after){panel.querySelectorAll(".gm-seg button").forEach(b=>b.onclick=()=>{mode=b.dataset.m;ls(LS.m,mode);after()})}
function menu(){
  S={st:"menu",g:grid(),pcs:[null,null,null],sc:0,combo:0,drag:null,fx:[],pop:null};refill();
  panel.innerHTML=modeSeg()+(mode==="on"
    ?`<p class="gm-note">ลากชิ้นส่วนจากด้านล่างไปวางบนกระดาน ส่งคะแนนขึ้นลีดเดอร์บอร์ดกลางให้ทุกคนในทริปเห็น ต้องมีอินเทอร์เน็ต</p><input id="gm-nick" maxlength="12" placeholder="ชื่อเล่น (ไม่เกิน 12 ตัวอักษร)" autocomplete="nickname" value="${esc2(nick)}">`
    :`<p class="gm-note">ลากชิ้นส่วนจากด้านล่างไปวางบนกระดาน เล่นได้ไม่ต้องใช้เน็ต เก็บคะแนนสูงสุดไว้ในเครื่องนี้ · สูงสุดตอนนี้ <b>${best}</b></p>`)
    +`<button class="gm-go" id="gm-start">เริ่มเล่น</button>`+(mode==="on"?`<ol class="gm-lb" id="gm-lb"><li><span>กำลังโหลดอันดับ…</span></li></ol>`:"");
  bindSeg(menu);panel.querySelector("#gm-start").onclick=start;
  if(mode==="on")board();
}
function panelOver(sc){
  panel.innerHTML=`<div class="gm-res">${sc} คะแนน</div><p class="gm-note" style="text-align:center">${sc>0&&sc>=best?"🏆 สถิติใหม่ในเครื่องนี้ · ":""}สูงสุด ${best}</p>
  ${mode==="on"?`<p class="gm-note" id="gm-st" style="text-align:center">กำลังส่งคะแนน…</p><ol class="gm-lb" id="gm-lb"></ol>`:""}
  <button class="gm-go" id="gm-again">เล่นอีกครั้ง</button><button class="gm-go alt" id="gm-menu">เปลี่ยนโหมด / ชื่อ</button>`;
  panel.querySelector("#gm-again").onclick=start;panel.querySelector("#gm-menu").onclick=menu;
  if(mode==="on")submit(sc);
}
async function submit(sc){
  const st=panel.querySelector("#gm-st");
  if(!nick){if(st)st.textContent="ใส่ชื่อเล่นที่เมนูก่อน จึงจะส่งคะแนนได้";return board()}
  if(sc<=0){if(st)st.textContent="ยังไม่มีคะแนนให้ส่ง";return board()}
  try{
    if(typeof dbx!=="function")throw 0;
    await dbx("POST","/game/scores",{n:nick,s:Math.min(99999,sc),t:Date.now()});
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
function openGame(){build();open=true;root.style.display="flex";document.body.style.overflow="hidden";addEventListener("keydown",key);menu();lt=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);const x=root.querySelector(".gm-x");if(x)x.focus()}
function close(){open=false;cancelAnimationFrame(raf);if(root)root.style.display="none";document.body.style.overflow="";removeEventListener("keydown",key)}
function key(e){if(open&&e.code==="Escape")close()}
window.gameOpen=openGame;
})();
