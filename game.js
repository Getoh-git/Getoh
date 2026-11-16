// มุมเกม: 🧩 เกมบล็อก (แนว Block Blast) + 🏃 วิ่งข้ามฉาก · โหมดออฟไลน์ (เก็บในเครื่อง) / ออนไลน์ (ลีดเดอร์บอร์ด Firebase)
(function(){
const FD="'DotGothic16','Sarabun',sans-serif",FS="'Sarabun',system-ui,sans-serif";
const LS={m:"getoh_game_mode",n:"getoh_game_nick",block:"getoh_block_best",run:"getoh_run_best"};
const ls=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}};
const esc2=t=>String(t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const img=s=>{const i=new Image();i.src=s;return i};
let root,cv,cx,panel,bar,raf=0,lt=0,open=false,cur=null,k=1,st="menu";
let mode=ls(LS.m)||(navigator.onLine?"on":"off"),nick=ls(LS.n)||"";
const best={block:+ls(LS.block)||0,run:+ls(LS.run)||0};
const rr=(x,y,w,h,r)=>{cx.beginPath();cx.moveTo(x+r,y);cx.arcTo(x+w,y,x+w,y+h,r);cx.arcTo(x+w,y+h,x,y+h,r);cx.arcTo(x,y+h,x,y,r);cx.arcTo(x,y,x+w,y,r);cx.closePath()};
function fitT(s,x,y,maxW,px,font=FD){ // ตัวหนังสือบนผืนผ้าใบ: ย่อให้พอดีความกว้างเสมอ ไม่ล้น
  let p=px;cx.font=`${p}px ${font}`;while(p>9&&cx.measureText(s).width>maxW){p--;cx.font=`${p}px ${font}`}cx.fillText(s,x,y)}
const SCN=["osaka","kyoto","nara","kobe","kanazawa","shirakawa"],SC=SCN.map(n=>img(n+"-scene.svg")),walk=img("couple-walk.png"),jump=img("couple-jump.png");

/* ================= เกมที่ 1: บล็อก ================= */
const B=(()=>{
  const W=360,H=500,N=8,C=40,BX=20,BY=84,TY=428,OFF=74;
  const COL=[["#FFB59A","#E8896B","#B5583F"],["#FFB0CC","#F08CB0","#B85A82"],["#9BE08A","#6DBE5C","#3F8A3A"],["#7CC4F0","#3E8FC0","#25628F"],["#FFE08A","#F2B84B","#B9831F"],["#B79BEA","#8A6BC2","#5C3F94"],["#FF8A73","#D8432F","#A12A1B"]];
  const SH=[["#"],["##"],["#","#"],["###"],["#","#","#"],["####"],["#","#","#","#"],["#####"],["#","#","#","#","#"],["##","##"],["###","###","###"],["##","##","##"],["###","###"],
    ["#.","##"],[".#","##"],["##","#."],["##",".#"],["#..","#..","###"],["..#","..#","###"],["###","#..","#.."],["###","..#","..#"],
    ["###",".#."],[".#.","###"],["#.","##","#."],[".#","##",".#"],[".##","##."],["##",".##"],["#.","##",".#"],[".#","##","#."],
    ["#.","#.","##"],[".#",".#","##"],["##","#.","#."],["##",".#",".#"],["###","#.."],["###","..#"],["#..","###"],["..#","###"]];
  let S;const grid=()=>Array.from({length:N},()=>Array(N).fill(0));
  const mk=(rows,c)=>{const cells=[];rows.forEach((r,i)=>[...r].forEach((ch,j)=>{if(ch==="#")cells.push([i,j])}));return{cells,h:rows.length,w:rows[0].length,color:c}};
  const fits=(p,r0,c0,g=S.g)=>p.cells.every(([r,c])=>{const y=r0+r,x=c0+c;return y>=0&&y<N&&x>=0&&x<N&&!g[y][x]});
  const anyFit=p=>{for(let r=0;r<N;r++)for(let c=0;c<N;c++)if(fits(p,r,c))return true;return false};
  const lines=g=>{const R=[],Cc=[];for(let i=0;i<N;i++){if(g[i].every(Boolean))R.push(i);if(g.every(r=>r[i]))Cc.push(i)}return[R,Cc]};
  function refill(){for(let t=0;t<40;t++){const a=[0,1,2].map(()=>mk(SH[Math.random()*SH.length|0],1+(Math.random()*COL.length|0)));if(a.some(anyFit)||t===39){S.pcs=a;return}}}
  const target=d=>{const p=S.pcs[d.i];return[Math.round((d.y-OFF-p.h*C/2-BY)/C),Math.round((d.x-p.w*C/2-BX)/C)]};
  function reset(){S={g:grid(),pcs:[null,null,null],sc:0,combo:0,drag:null,fx:[],pt:[],pop:null,shake:0};refill()}
  function place(i,r0,c0){
    const p=S.pcs[i];p.cells.forEach(([r,c])=>{S.g[r0+r][c0+c]=p.color});let gain=p.cells.length;
    const[R,Cc]=lines(S.g),n=R.length+Cc.length;
    if(n){
      S.combo++;const clear=new Set();R.forEach(r=>{for(let c=0;c<N;c++)clear.add(r*N+c)});Cc.forEach(c=>{for(let r=0;r<N;r++)clear.add(r*N+c)});
      clear.forEach(q=>{const r=q/N|0,c=q%N,col=S.g[r][c];S.fx.push({r,c,t:0});
        for(let j=0;j<3;j++)S.pt.push({x:BX+c*C+C/2,y:BY+r*C+C/2,vx:(Math.random()-.5)*220,vy:-60-Math.random()*160,col:COL[col-1][0],l:.7+Math.random()*.4});S.g[r][c]=0});
      gain+=10*n*(n+1)/2+(S.combo>1?10*S.combo:0);S.shake=.25;
      if(S.g.every(r=>r.every(v=>!v)))gain+=100;
      S.pop={txt:(n>1?n+" แถว! ":"")+(S.combo>1?"คอมโบ ×"+S.combo+" ":"")+"+"+gain,t:0};
    }else S.combo=0;
    S.sc+=gain;S.pcs[i]=null;if(S.pcs.every(v=>!v))refill();
    if(!S.pcs.some(v=>v&&anyFit(v)))api.end();
  }
  function blk(x,y,s,ci,a=1){
    const[l,b,d]=COL[ci-1];cx.globalAlpha=a;
    const g=cx.createLinearGradient(0,y,0,y+s);g.addColorStop(0,l);g.addColorStop(.45,b);g.addColorStop(1,d);
    cx.fillStyle=g;rr(x+1,y+1,s-2,s-2,s*.2);cx.fill();
    cx.fillStyle="rgba(255,255,255,.32)";rr(x+s*.14,y+s*.12,s*.72,s*.2,s*.1);cx.fill();
    cx.strokeStyle="rgba(0,0,0,.28)";cx.lineWidth=1;rr(x+1.5,y+1.5,s-3,s-3,s*.2);cx.stroke();cx.globalAlpha=1;
  }
  const api={W,H,maxW:420,key:"block",path:"/game/scores",title:"🧩 เกมบล็อก",
    desc:"ลากชิ้นส่วนไปวางบนกระดาน 8×8 เติมแถวหรือคอลัมน์ให้เต็มเพื่อระเบิด",
    score:()=>S?S.sc:0,reset,
    down(x,y){
      if(st==="menu")return api.begin();
      if(st!=="play"||y<TY-14)return;const i=Math.min(2,Math.max(0,Math.floor(x/120)));if(!S.pcs[i])return;S.drag={i,x,y};return true},
    move(x,y){if(S&&S.drag){S.drag.x=x;S.drag.y=y}},
    up(){if(!S||!S.drag)return;const d=S.drag;S.drag=null;const p=S.pcs[d.i];if(!p)return;const[r0,c0]=target(d);if(fits(p,r0,c0))place(d.i,r0,c0)},
    cancel(){if(S)S.drag=null},
    draw(dt){
      if(!S)reset();
      const stage=Math.floor(S.sc/400)%SC.length;
      cx.save();
      if(S.shake>0){S.shake-=dt;const m=S.shake*18;cx.translate((Math.random()-.5)*m,(Math.random()-.5)*m)}
      const bgc=[["#1d4a2a","#0d2214"],["#4a2a44","#1f0f1e"],["#1d4a3a","#0a2018"],["#1d3f66","#0b1a2e"],["#4a3a1d","#1f180b"],["#2d4a5e","#0f1d27"]][stage];
      const gr=cx.createLinearGradient(0,0,0,H);gr.addColorStop(0,bgc[0]);gr.addColorStop(1,bgc[1]);cx.fillStyle=gr;cx.fillRect(-10,-10,W+20,H+20); // พื้นหลังเปลี่ยนโทนทุก 400 คะแนน
      cx.textBaseline="alphabetic";cx.textAlign="left";cx.fillStyle="#9fb394";fitT("คะแนน",20,28,120,13,FS);cx.textAlign="right";fitT("สูงสุด",W-20,28,120,13,FS);
      cx.textAlign="left";cx.fillStyle="#D6E65A";fitT(String(S.sc),20,64,150,34);cx.textAlign="right";cx.fillStyle="#F6F5E6";fitT(String(Math.max(best.block,S.sc)),W-20,64,150,34);
      cx.fillStyle="rgba(10,28,16,.78)";rr(BX-7,BY-7,N*C+14,N*C+14,16);cx.fill();cx.strokeStyle="rgba(184,204,44,.55)";cx.lineWidth=2;cx.stroke();
      let pv=null,pr=0,pc=0;const hl=new Set();
      if(S.drag&&S.pcs[S.drag.i]){const p=S.pcs[S.drag.i];[pr,pc]=target(S.drag);
        if(fits(p,pr,pc)){pv=p;const g=S.g.map(r=>r.slice());p.cells.forEach(([r,c])=>{g[pr+r][pc+c]=1});const[R,Cc]=lines(g);R.forEach(r=>{for(let c=0;c<N;c++)hl.add(r*N+c)});Cc.forEach(c=>{for(let r=0;r<N;r++)hl.add(r*N+c)})}}
      for(let r=0;r<N;r++)for(let c=0;c<N;c++){const x=BX+c*C,y=BY+r*C;
        cx.fillStyle=(r+c)%2?"rgba(255,255,255,.05)":"rgba(255,255,255,.09)";rr(x+1.5,y+1.5,C-3,C-3,7);cx.fill();
        if(S.g[r][c])blk(x,y,C,S.g[r][c]);
        if(hl.has(r*N+c)){cx.fillStyle="rgba(246,245,230,.3)";rr(x+1,y+1,C-2,C-2,7);cx.fill()}}
      if(pv)pv.cells.forEach(([r,c])=>blk(BX+(pc+c)*C,BY+(pr+r)*C,C,pv.color,.6));
      S.fx=S.fx.filter(f=>(f.t+=dt)<.35);
      for(const f of S.fx){const q=f.t/.35,s=C*(1-q*.5),o=(C-s)/2;cx.globalAlpha=1-q;cx.fillStyle="#F6F5E6";rr(BX+f.c*C+o,BY+f.r*C+o,s,s,7);cx.fill();cx.globalAlpha=1}
      S.pt=S.pt.filter(p=>(p.l-=dt)>0);for(const p of S.pt){p.vy+=520*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;cx.globalAlpha=Math.min(1,p.l*2);cx.fillStyle=p.col;cx.fillRect(p.x-3,p.y-3,6,6)}cx.globalAlpha=1;
      if(S.pop){S.pop.t+=dt;const q=S.pop.t/1.1;if(q>=1)S.pop=null;else{cx.globalAlpha=1-q*q;cx.textAlign="center";cx.lineWidth=6;cx.strokeStyle="#12301a";cx.lineJoin="round";cx.font=`24px ${FD}`;
        let s=S.pop.txt,p=24;while(p>12&&cx.measureText(s).width>W-50){p--;cx.font=`${p}px ${FD}`}const yy=BY+N*C/2-q*34;cx.strokeText(s,W/2,yy);cx.fillStyle="#F6F5E6";cx.fillText(s,W/2,yy);cx.globalAlpha=1}}
      cx.fillStyle="rgba(10,28,16,.92)";rr(8,TY-16,W-16,H-TY+8,18);cx.fill();
      S.pcs.forEach((p,i)=>{if(!p||(S.drag&&S.drag.i===i))return;const s=Math.min(24,100/p.w,70/p.h),ox=60+i*120-p.w*s/2,oy=TY+24-p.h*s/2,ok=anyFit(p);p.cells.forEach(([r,c])=>blk(ox+c*s,oy+r*s,s,p.color,ok?1:.3))});
      if(S.drag&&S.pcs[S.drag.i]){const p=S.pcs[S.drag.i],ox=S.drag.x-p.w*C/2,oy=S.drag.y-OFF-p.h*C/2;cx.fillStyle="rgba(0,0,0,.25)";p.cells.forEach(([r,c])=>{rr(ox+c*C+4,oy+r*C+10,C-6,C-6,8);cx.fill()});p.cells.forEach(([r,c])=>blk(ox+c*C,oy+r*C,C,p.color))}
      cx.restore();
      if(st!=="play"){cx.fillStyle="rgba(13,34,20,.78)";cx.fillRect(0,0,W,H);cx.textAlign="center";cx.fillStyle="#F6F5E6";
        if(st==="menu"){fitT("เติมแถวให้เต็ม",W/2,H/2-10,W-60,28);fitT("แล้วบล็อกจะระเบิด",W/2,H/2+28,W-60,28)}
        else{fitT("วางต่อไม่ได้แล้ว",W/2,H/2-8,W-60,28);cx.fillStyle="#D6E65A";fitT(String(S.sc),W/2,H/2+46,W-60,44)}}
    }};
  return api;
})();

/* ================= เกมที่ 2: วิ่งข้ามฉาก ================= */
const R=(()=>{
  const W=360,H=200,GY=182,PX=46;
  const ST=[["โอซาก้า","📦","🐙"],["เกียวโต","⛩️","🍡"],["นารา","🦌","🍪"],["โกเบ","⚓","🥩"],["คานาซาวะ","🏮","✨"],["ชิราคาวาโกะ","⛄","🍵"]];
  let S;const score=()=>Math.floor(S.dist/8)+S.items*10;
  function reset(){S={t:0,dist:0,items:0,sp:125,y:GY,vy:0,jumps:0,obs:[],col:[],gap:90,stage:0,fade:1,banner:1.6}}
  function jumpNow(){if(S.y>=GY-.5){S.vy=-340;S.jumps=1}else if(S.jumps<2){S.vy=-300;S.jumps=2}} // กระโดดได้ 2 ครั้งกลางอากาศ
  function step(dt){
    S.t+=dt;S.sp=Math.min(280,125+S.t*4);S.dist+=S.sp*dt;S.banner=Math.max(0,S.banner-dt);
    S.vy+=920*dt;S.y+=S.vy*dt;if(S.y>=GY){S.y=GY;S.vy=0;S.jumps=0}
    const ns=Math.floor(score()/300)%ST.length;if(ns!==S.stage){S.stage=ns;S.banner=1.8;S.fade=0}S.fade=Math.min(1,S.fade+dt/1.2);
    S.gap-=S.sp*dt;
    if(S.gap<=0){const n=Math.random()<.35?2:1;S.obs.push({x:W+12,w:18*n,n});
      if(Math.random()<.7){const cxm=W+12+9*n;[[-24,40],[0,60],[24,40]].forEach(([dx,h])=>S.col.push({x:cxm+dx,y:GY-h,got:0}))}
      S.gap=(170+Math.random()*130)*(S.sp/150)}
    for(const o of S.obs)o.x-=S.sp*dt;for(const c of S.col)c.x-=S.sp*dt;
    S.obs=S.obs.filter(o=>o.x>-40);S.col=S.col.filter(c=>c.x>-30&&!c.got);
    const bx=PX+7,bw=22,by=S.y-38,bh=36;
    for(const o of S.obs)if(bx<o.x+o.w-4&&bx+bw>o.x+4&&by+bh>GY-18)return api.end();
    for(const c of S.col)if(!c.got&&bx<c.x+9&&bx+bw>c.x-9&&by<c.y+9&&by+bh>c.y-9){c.got=1;S.items++}
  }
  const api={W,H,maxW:560,key:"run",path:"/game/run",title:"🏃 วิ่งข้ามฉาก",
    desc:"แตะเพื่อกระโดด (กระโดดซ้ำกลางอากาศได้) เก็บของเพื่อเพิ่มคะแนน ฉากเปลี่ยนตามเมือง",
    score:()=>S?score():0,reset,
    down(){if(st==="menu")return api.begin();if(st==="play")jumpNow();return false},move(){},up(){},cancel(){},
    keydown(e){if(e.code==="Space"||e.code==="ArrowUp"){e.preventDefault();if(!e.repeat){if(st==="play")jumpNow();else if(st==="menu")api.begin()}}},
    draw(dt){
      if(!S)reset();if(st==="play")step(dt);if(st!=="play"&&st!=="over"&&st!=="menu")return;
      const t=ST[S.stage];cx.imageSmoothingEnabled=false;cx.clearRect(0,0,W,H);cx.fillStyle="#DCE76F";cx.fillRect(0,0,W,H);
      const pb=SC[(S.stage+SC.length-1)%SC.length],cb=SC[S.stage];
      if(S.fade<1&&pb.complete)cx.drawImage(pb,0,H-210,W,210);cx.globalAlpha=S.fade;if(cb.complete)cx.drawImage(cb,0,H-210,W,210);cx.globalAlpha=1;
      cx.fillStyle="rgba(18,48,26,.55)";const off=Math.floor(S.dist)%32;for(let x=-off;x<W;x+=32)cx.fillRect(x,H-9,16,3);
      cx.font="24px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif";cx.textAlign="center";cx.textBaseline="alphabetic";
      for(const o of S.obs)for(let i=0;i<o.n;i++)cx.fillText(t[1],o.x+9+i*18,GY+2);
      for(const c of S.col)cx.fillText(t[2],c.x,c.y+8);
      const air=S.y<GY-.5,fr=Math.floor(S.t*8)%2;
      if(air&&jump.complete)cx.drawImage(jump,0,0,57,68,PX,S.y-46,38,45);else if(walk.complete)cx.drawImage(walk,57*(1+fr),0,57,68,PX,S.y-46-(fr?1:0),38,45);
      cx.imageSmoothingEnabled=true;cx.fillStyle="#12301a";cx.textAlign="left";fitT(String(score()),10,24,110,20);cx.textAlign="right";fitT("สูงสุด "+Math.max(best.run,score()),W-10,24,150,16);
      if(S.banner>0&&st==="play"){cx.globalAlpha=Math.min(1,S.banner);cx.textAlign="center";fitT(t[0],W/2,60,W-40,22);cx.globalAlpha=1}
      if(st==="menu"){cx.fillStyle="rgba(18,48,26,.6)";cx.fillRect(0,0,W,H);cx.fillStyle="#F6F5E6";cx.textAlign="center";fitT("แตะเพื่อเริ่มวิ่ง",W/2,H/2+6,W-40,24)}
      if(st==="over"){cx.fillStyle="rgba(18,48,26,.65)";cx.fillRect(0,0,W,H);cx.fillStyle="#F6F5E6";cx.textAlign="center";fitT("ชนแล้ว!",W/2,H/2-6,W-40,26);cx.fillStyle="#D6E65A";fitT(String(score()),W/2,H/2+34,W-40,34)}
    }};
  return api;
})();
const GAMES={block:B,run:R};
B.begin=R.begin=()=>start();B.end=R.end=()=>over();

/* ================= โครงหน้าจอ ================= */
function css(){
  if(document.getElementById("gm-css"))return;
  const s=document.createElement("style");s.id="gm-css";
  s.textContent=`#gm{position:fixed;inset:0;z-index:70;background:#12301a;color:#F6F5E6;display:flex;flex-direction:column;align-items:center;overflow-y:auto;padding:env(safe-area-inset-top,0px) 12px calc(16px + env(safe-area-inset-bottom,0px));overflow-wrap:anywhere}
#gm .gm-bar{width:100%;max-width:420px;display:flex;align-items:center;gap:8px;padding:6px 0}
#gm .gm-bar b{flex:1;min-width:0;font:400 17px ${FD};color:#B8CC2C;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#gm .gm-bar button{flex:none;min-width:44px;min-height:44px;border:0;border-radius:14px;background:#1d4a2a;color:#F6F5E6;font-size:18px;cursor:pointer}
#gm canvas{border-radius:20px;touch-action:none;background:#0f2a18;display:block;user-select:none;-webkit-user-select:none;margin:0 auto}
#gm .gm-p{width:100%;max-width:420px;margin-top:12px}
#gm .gm-seg{display:grid;grid-template-columns:1fr 1fr;gap:6px;background:#1d4a2a;border-radius:16px;padding:4px}
#gm .gm-seg button{min-height:46px;border:0;border-radius:12px;background:none;color:#cfe0c4;font:inherit;font-size:15px;cursor:pointer}
#gm .gm-seg button.on{background:#B8CC2C;color:#12301a;font-weight:700}
#gm .gm-note{font-size:13px;color:#b3c4a8;margin:8px 2px;line-height:1.5}
#gm input{width:100%;box-sizing:border-box;min-height:46px;border-radius:14px;border:2px solid #26602f;background:#0d2214;color:#F6F5E6;padding:0 14px;font:inherit;font-size:16px;margin-top:8px}
#gm .gm-go{width:100%;min-height:52px;margin-top:10px;border:0;border-radius:16px;background:#B8CC2C;color:#12301a;font:700 17px ${FS};cursor:pointer}
#gm .gm-go.alt{background:#1d4a2a;color:#F6F5E6;font-weight:400;font-size:15px}
#gm .gm-card{display:block;width:100%;text-align:left;margin-top:10px;padding:14px 16px;border:2px solid #26602f;border-radius:20px;background:#1d4a2a;color:#F6F5E6;font:inherit;cursor:pointer}
#gm .gm-card b{display:block;font-size:19px;margin-bottom:4px}#gm .gm-card span{display:block;font-size:13px;color:#b3c4a8;line-height:1.5}#gm .gm-card i{display:block;font:400 14px ${FD};font-style:normal;color:#D6E65A;margin-top:6px}
#gm .gm-res{text-align:center;font:400 30px ${FD};color:#D6E65A;margin:2px 0}
#gm .gm-lb{margin:10px 0 0;padding:0;list-style:none}
#gm .gm-lb li{display:flex;gap:10px;align-items:baseline;padding:8px 4px;border-top:1px dashed rgba(233,234,210,.22)}
#gm .gm-lb li b{flex:none;width:24px;color:#B8CC2C;font-weight:400}#gm .gm-lb li span{flex:1;min-width:0;overflow-wrap:anywhere}#gm .gm-lb li i{flex:none;font:400 17px ${FD};font-style:normal;color:#D6E65A}
#gm button:focus-visible,#gm input:focus-visible{outline:3px solid #D6E65A;outline-offset:2px}`;
  document.head.appendChild(s);
}
function build(){
  if(root)return;css();
  root=document.createElement("div");root.id="gm";root.setAttribute("role","dialog");root.setAttribute("aria-modal","true");root.setAttribute("aria-label","มุมเกม");
  root.innerHTML=`<div class="gm-bar"><button class="gm-back" aria-label="กลับไปเลือกเกม">←</button><b></b><button class="gm-x" aria-label="ปิดเกม">✕</button></div><canvas></canvas><div class="gm-p"></div>`;
  document.body.appendChild(root);
  bar=root.querySelector(".gm-bar b");cv=root.querySelector("canvas");cx=cv.getContext("2d");panel=root.querySelector(".gm-p");
  root.querySelector(".gm-x").onclick=close;root.querySelector(".gm-back").onclick=chooser;
  const P=e=>{const r=cv.getBoundingClientRect(),G=GAMES[cur];return[(e.clientX-r.left)*G.W/r.width,(e.clientY-r.top)*G.H/r.height]};
  cv.addEventListener("pointerdown",e=>{if(!cur)return;e.preventDefault();const[x,y]=P(e);if(GAMES[cur].down(x,y)){try{cv.setPointerCapture(e.pointerId)}catch(_){}}});
  cv.addEventListener("pointermove",e=>{if(cur){const[x,y]=P(e);GAMES[cur].move(x,y)}});
  cv.addEventListener("pointerup",()=>{if(cur)GAMES[cur].up()});
  cv.addEventListener("pointercancel",()=>{if(cur)GAMES[cur].cancel()});
  addEventListener("resize",fit);
}
function fit(){ // ผืนผ้าใบความละเอียดสูง (ตาม devicePixelRatio) → ภาพคม
  if(!cur||!cv||cv.style.display==="none")return;const G=GAMES[cur],dpr=Math.min(3,window.devicePixelRatio||1);
  cv.style.width=`min(100%,${G.maxW}px,calc((100vh - 190px)*${G.W/G.H}))`;cv.style.aspectRatio=`${G.W}/${G.H}`;
  const w=cv.getBoundingClientRect().width||G.W;cv.width=Math.round(w*dpr);cv.height=Math.round(w*dpr*G.H/G.W);k=cv.width/G.W;
}
function frame(ts){
  if(!open)return;const dt=Math.min(.05,lt?(ts-lt)/1000:.016);lt=ts;
  if(cur){cx.setTransform(k,0,0,k,0,0);cx.save();GAMES[cur].draw(dt);cx.restore()}
  raf=requestAnimationFrame(frame);
}
const modeSeg=()=>`<div class="gm-seg" role="group" aria-label="โหมดเกม"><button data-m="off" class="${mode==="off"?"on":""}">📴 ออฟไลน์</button><button data-m="on" class="${mode==="on"?"on":""}">🌐 ออนไลน์</button></div>`;
function bindSeg(after){panel.querySelectorAll(".gm-seg button").forEach(b=>b.onclick=()=>{mode=b.dataset.m;ls(LS.m,mode);after()})}

function chooser(){
  cur=null;st="menu";cv.style.display="none";root.querySelector(".gm-back").style.display="none";bar.textContent="🎮 เลือกเกม";
  panel.innerHTML=Object.values(GAMES).map(g=>`<button class="gm-card" data-g="${g.key}"><b>${g.title}</b><span>${g.desc}</span><i>สูงสุด ${best[g.key]}</i></button>`).join("")+`<p class="gm-note">ทุกเกมเล่นได้ทั้งแบบออฟไลน์ (เก็บคะแนนในเครื่อง) และออนไลน์ (ลีดเดอร์บอร์ดกลางของทริป)</p>`;
  panel.querySelectorAll(".gm-card").forEach(b=>b.onclick=()=>pick(b.dataset.g));
}
function pick(g){cur=g;cv.style.display="block";root.querySelector(".gm-back").style.display="";bar.textContent=GAMES[g].title;GAMES[g].reset();menu()}
function menu(){
  st="menu";const G=GAMES[cur];G.reset();fit();
  panel.innerHTML=modeSeg()+`<p class="gm-note">${G.desc}</p>`+(mode==="on"
    ?`<input id="gm-nick" maxlength="12" placeholder="ชื่อเล่น (ไม่เกิน 12 ตัวอักษร)" autocomplete="nickname" value="${esc2(nick)}"><p class="gm-note">ส่งคะแนนขึ้นลีดเดอร์บอร์ดกลาง ต้องมีอินเทอร์เน็ต</p>`
    :`<p class="gm-note">ไม่ต้องใช้เน็ต เก็บคะแนนสูงสุดไว้ในเครื่องนี้ · สูงสุดตอนนี้ <b>${best[cur]}</b></p>`)
    +`<button class="gm-go" id="gm-start">เริ่มเล่น</button>`+(mode==="on"?`<ol class="gm-lb" id="gm-lb"><li><span>กำลังโหลดอันดับ…</span></li></ol>`:"");
  bindSeg(menu);panel.querySelector("#gm-start").onclick=start;if(mode==="on")board();
}
function start(){
  if(st==="play")return;
  if(mode==="on"){const v=document.getElementById("gm-nick");if(v){nick=v.value.replace(/[<>]/g,"").trim().slice(0,12);ls(LS.n,nick)}}
  GAMES[cur].reset();st="play";
  panel.innerHTML=`<button class="gm-go alt" id="gm-end">🏁 จบเกม</button>`;panel.querySelector("#gm-end").onclick=over;
}
function over(){
  if(st!=="play")return;st="over";const G=GAMES[cur],sc=G.score();
  if(sc>best[cur]){best[cur]=sc;ls(LS[cur],String(sc))}
  panel.innerHTML=`<div class="gm-res">${sc} คะแนน</div><p class="gm-note" style="text-align:center">${sc>0&&sc>=best[cur]?"🏆 สถิติใหม่ในเครื่องนี้ · ":""}สูงสุด ${best[cur]}</p>
  ${mode==="on"?`<p class="gm-note" id="gm-st" style="text-align:center">กำลังส่งคะแนน…</p><ol class="gm-lb" id="gm-lb"></ol>`:""}
  <button class="gm-go" id="gm-again">เล่นอีกครั้ง</button><button class="gm-go alt" id="gm-menu">เปลี่ยนโหมด / ชื่อ</button><button class="gm-go alt" id="gm-pick">เลือกเกมอื่น</button>`;
  panel.querySelector("#gm-again").onclick=()=>{st="menu";start()};panel.querySelector("#gm-menu").onclick=menu;panel.querySelector("#gm-pick").onclick=chooser;
  if(mode==="on")submit(sc);
}
async function submit(sc){
  const el=panel.querySelector("#gm-st"),G=GAMES[cur];
  if(!nick){if(el)el.textContent="ใส่ชื่อเล่นที่เมนูก่อน จึงจะส่งคะแนนได้";return board()}
  if(sc<=0){if(el)el.textContent="ยังไม่มีคะแนนให้ส่ง";return board()}
  try{if(typeof dbx!=="function")throw 0;await dbx("POST",G.path,{n:nick,s:Math.min(99999,sc),t:Date.now()});if(el)el.textContent="✅ ส่งคะแนนแล้ว"}
  catch(e){if(el)el.innerHTML=`⚠️ ส่งไม่สำเร็จ (เน็ตหลุดหรือยังไม่ได้ตั้งกติกาฐานข้อมูล) คะแนนยังบันทึกในเครื่องแล้ว <button class="gm-go alt" id="gm-retry" style="margin-top:8px">ลองส่งอีกครั้ง</button>`;
    const r=panel.querySelector("#gm-retry");if(r)r.onclick=()=>{el.textContent="กำลังส่งคะแนน…";submit(sc)}}
  board();
}
async function board(){
  const G=GAMES[cur];if(!G)return;
  try{if(typeof dbx!=="function")throw 0;
    const o=await dbx("GET",G.path,undefined,'?orderBy="s"&limitToLast=10');
    const L=Object.values(o||{}).filter(x=>x&&typeof x.s==="number").sort((a,b)=>b.s-a.s).slice(0,10),el=document.getElementById("gm-lb");if(!el)return;
    el.innerHTML=L.length?L.map((x,i)=>`<li><b>${i+1}</b><span>${esc2(String(x.n||"ไม่ระบุ").slice(0,12))}</span><i>${x.s}</i></li>`).join(""):"<li><span>ยังไม่มีใครส่งคะแนน เป็นคนแรกเลย</span></li>";
  }catch(e){const el=document.getElementById("gm-lb");if(el)el.innerHTML="<li><span>โหลดอันดับไม่ได้ตอนนี้ (ออฟไลน์?) เล่นต่อแบบออฟไลน์ได้</span></li>"}
}
function key(e){
  if(!open)return;if(e.code==="Escape")return close();
  if(cur&&GAMES[cur].keydown&&!(e.target&&e.target.tagName==="INPUT"))GAMES[cur].keydown(e);
}
function openGame(){build();open=true;root.style.display="flex";document.body.style.overflow="hidden";addEventListener("keydown",key);chooser();lt=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);root.querySelector(".gm-x").focus()}
function close(){open=false;cancelAnimationFrame(raf);if(root)root.style.display="none";document.body.style.overflow="";removeEventListener("keydown",key)}
document.addEventListener("visibilitychange",()=>{if(!open)return;cancelAnimationFrame(raf);if(!document.hidden){lt=0;raf=requestAnimationFrame(frame)}});
window.gameOpen=openGame;
})();
