// Game corner: 🧩 Block Puzzle (Block Blast style) + 🏃 City Runner · offline (saved on this device) / online (Firebase leaderboard)
(function(){
const FD="'Lexend','Nunito',system-ui,-apple-system,'Segoe UI',sans-serif";
const LS={m:"getoh_game_mode",n:"getoh_game_nick",block:"getoh_block_best",run:"getoh_run_best",snd:"getoh_game_sound"};
const ls=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}};
const esc2=t=>String(t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const img=s=>{const i=new Image();i.src=s;return i};
let root,cv,cx,panel,bar,sndBtn,raf=0,lt=0,open=false,cur=null,k=1,st="menu";
let mode=ls(LS.m)||"off",nick=ls(LS.n)||"";
const best={block:+ls(LS.block)||0,run:+ls(LS.run)||0};
let muted=ls(LS.snd)==="0",AC=null;
const rr=(x,y,w,h,r)=>{cx.beginPath();cx.moveTo(x+r,y);cx.arcTo(x+w,y,x+w,y+h,r);cx.arcTo(x+w,y+h,x,y+h,r);cx.arcTo(x,y+h,x,y,r);cx.arcTo(x,y,x+w,y,r);cx.closePath()};

/* ---------- text on canvas: always shrinks to fit the width ---------- */
let FT={}; // cache of fitted font sizes (measureText every frame is slow)
function fitP(key,s,maxW,px,w){let p=FT[key];if(p===undefined){p=px;cx.font=`${w} ${p}px ${FD}`;while(p>9&&cx.measureText(s).width>maxW){p--;cx.font=`${w} ${p}px ${FD}`}if(Object.keys(FT).length>300)FT={};FT[key]=p}return p}
function fitT(s,x,y,maxW,px,w=600){const p=fitP(s+"|"+maxW+"|"+px+"|"+w,s,maxW,px,w);cx.font=`${w} ${p}px ${FD}`;cx.fillText(s,x,y)}
function bigT(s,x,y,maxW,px,col,w=700){ // outlined text for pop-ups
  const p=fitP("b"+s+"|"+maxW+"|"+px+"|"+w,s,maxW,px,w);cx.font=`${w} ${p}px ${FD}`;
  cx.lineJoin="round";cx.lineWidth=Math.max(3,p/4);cx.strokeStyle="#33496A";cx.strokeText(s,x,y);cx.fillStyle=col;cx.fillText(s,x,y)}
try{document.fonts&&document.fonts.addEventListener&&document.fonts.addEventListener("loadingdone",()=>{FT={}})}catch(e){}

/* ---------- sound (tiny synth, no files) + haptics ---------- */
function snd(f,d=.1,type="sine",v=.06,slide=0){
  if(muted)return;
  try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();if(AC.state==="suspended")AC.resume();
    const o=AC.createOscillator(),g=AC.createGain(),t=AC.currentTime;o.type=type;o.frequency.setValueAtTime(f,t);
    if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,f+slide),t+d);
    g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+d)}catch(e){}}
const later=(fn,ms)=>setTimeout(()=>{if(open)fn()},ms);
const vibe=p=>{if(!muted)try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}};

const CITIES=[["Osaka","Takoyaki time!"],["Kyoto","Temple trails"],["Nara","Mind the deer"],["Kobe","Harbor breeze"],["Kanazawa","Lantern lanes"],["Shirakawa-go","Snowy village"]];
const SCN=["osaka","kyoto","nara","kobe","kanazawa","shirakawa"],SC=SCN.map(n=>img(n+"-scene.svg")),walk=img("couple-walk.png"),jump=img("couple-jump.png");
/* ---------- render caches: pre-rasterised scenes / blocks / emoji (per-frame SVG, gradient and emoji drawing is what made the games feel heavy) ---------- */
let SCC=[],SPR={},BL=null;
const clearCaches=()=>{SCC=[];SPR={};BL=null};
function scn(i){const im=SC[i];if(!im||!im.complete)return null;let c=SCC[i];
  if(!c){try{const w=Math.max(1,Math.round(360*k)),h=Math.max(1,Math.round(210*k));c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d").drawImage(im,0,0,w,h);SCC[i]=c}catch(e){return null}}
  return c}
function emo(ch,px){const bs=Math.ceil(px*1.5),sz=Math.max(2,Math.round(bs*k)),key=ch+"|"+px+"|"+sz;let c=SPR[key];
  if(!c){c=document.createElement("canvas");c.width=c.height=sz;const o=cx;cx=c.getContext("2d");cx.scale(sz/bs,sz/bs);cx.font=`${px}px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif`;cx.textAlign="center";cx.textBaseline="alphabetic";cx.fillText(ch,bs/2,bs*.8);cx=o;SPR[key]=c}
  return[c,bs]}
function emoAt(ch,px,x,y){const[c,bs]=emo(ch,px);cx.drawImage(c,x-bs/2,y-bs*.8,bs,bs)}

/* ================= Game 1: Block Puzzle ================= */
const B=(()=>{
  const W=360,H=500,N=8,C=40,BX=20,BY=84,TY=428,OFF=74;
  const COL=[["#FFB59A","#E8896B","#B5583F"],["#FFB0CC","#F08CB0","#B85A82"],["#9BE08A","#6DBE5C","#3F8A3A"],["#7CC4F0","#3E8FC0","#25628F"],["#FFE08A","#F2B84B","#B9831F"],["#B79BEA","#8A6BC2","#5C3F94"],["#FF8A73","#D8432F","#A12A1B"]];
  const BG=[["#3F5F86","#1E2B42"],["#6A4A5E","#2A1C28"],["#4A6A5A","#1C2B24"],["#3F5F86","#1B2A40"],["#7A5A3A","#2E2014"],["#4A6482","#1D2A3A"]];
  const SH=[["#"],["##"],["#","#"],["###"],["#","#","#"],["####"],["#","#","#","#"],["#####"],["#","#","#","#","#"],["##","##"],["###","###","###"],["##","##","##"],["###","###"],
    ["#.","##"],[".#","##"],["##","#."],["##",".#"],["#..","#..","###"],["..#","..#","###"],["###","#..","#.."],["###","..#","..#"],
    ["###",".#."],[".#.","###"],["#.","##","#."],[".#","##",".#"],[".##","##."],["##",".##"],["#.","##",".#"],[".#","##","#."],
    ["#.","#.","##"],[".#",".#","##"],["##","#.","#."],["##",".#",".#"],["###","#.."],["###","..#"],["#..","###"],["..#","###"]];
  const PRAISE=["","Nice!","Great!","Awesome!","Incredible!"];
  let S;const grid=()=>Array.from({length:N},()=>Array(N).fill(0));
  const mk=(rows,c)=>{const cells=[];rows.forEach((r,i)=>[...r].forEach((ch,j)=>{if(ch==="#")cells.push([i,j])}));return{cells,h:rows.length,w:rows[0].length,color:c}};
  const fits=(p,r0,c0,g=S.g)=>p.cells.every(([r,c])=>{const y=r0+r,x=c0+c;return y>=0&&y<N&&x>=0&&x<N&&!g[y][x]});
  const anyFit=p=>{for(let r=0;r<N;r++)for(let c=0;c<N;c++)if(fits(p,r,c))return true;return false};
  const lines=g=>{const R=[],Cc=[];for(let i=0;i<N;i++){if(g[i].every(Boolean))R.push(i);if(g.every(r=>r[i]))Cc.push(i)}return[R,Cc]};
  function refill(){for(let t=0;t<40;t++){const a=[0,1,2].map(()=>mk(SH[Math.random()*SH.length|0],1+(Math.random()*COL.length|0)));if(a.some(anyFit)||t===39){S.pcs=a;return}}}
  const target=d=>{const p=S.pcs[d.i];return[Math.round((d.y-OFF-p.h*C/2-BY)/C),Math.round((d.x-p.w*C/2-BX)/C)]};
  function okc(){S.ok=S.pcs.map(p=>p?anyFit(p):false)}
  function reset(){S={g:grid(),pcs:[null,null,null],sc:0,disp:0,combo:0,maxCombo:0,miss:0,lines:0,drag:null,fx:[],pt:[],pop:null,shake:0,flash:0,stage:0,fade:1,banner:0};refill();okc()}
  function place(i,r0,c0){
    const p=S.pcs[i];p.cells.forEach(([r,c])=>{S.g[r0+r][c0+c]=p.color});let gain=p.cells.length;
    snd(240+p.cells.length*22,.09,"triangle",.07);
    const[R,Cc]=lines(S.g),n=R.length+Cc.length;
    if(n){
      S.combo++;S.miss=0;S.maxCombo=Math.max(S.maxCombo,S.combo);S.lines+=n;
      const clear=new Set();R.forEach(r=>{for(let c=0;c<N;c++)clear.add(r*N+c)});Cc.forEach(c=>{for(let r=0;r<N;r++)clear.add(r*N+c)});
      clear.forEach(q=>{const r=q/N|0,c=q%N,col=S.g[r][c];S.fx.push({r,c,t:0});
        for(let j=0;j<4;j++)S.pt.push({x:BX+c*C+C/2,y:BY+r*C+C/2,vx:(Math.random()-.5)*260,vy:-80-Math.random()*180,col:COL[col-1][0],l:.7+Math.random()*.5});S.g[r][c]=0});
      gain+=10*n*(n+1)/2+(S.combo>1?10*S.combo:0);
      const clean=S.g.every(r=>r.every(v=>!v));if(clean)gain+=100;
      S.pop={txt:clean?"Board cleared!":PRAISE[Math.min(4,n)],sub:(S.combo>1?"Combo ×"+S.combo+"   ":"")+"+"+gain,t:0};
      S.shake=.12+.05*Math.min(n,4);S.flash=clean?.5:.2;
      for(let j=0;j<Math.min(n+2,6);j++)later(()=>snd(500+j*95+S.combo*18,.15,"sine",.07),j*65);
      vibe(n>1?[18,30,18]:18);
    }else{S.miss++;if(S.miss>=3)S.combo=0} // combo survives up to 2 moves without a clear
    S.sc+=gain;S.pcs[i]=null;if(S.pcs.every(v=>!v))refill();okc();
    const ns=Math.floor(S.sc/400)%SC.length;
    if(ns!==S.stage){S.stage=ns;S.fade=0;S.banner=2;[523,659,784,1046].forEach((f,j)=>later(()=>snd(f,.2,"triangle",.07),j*90))}
    if(!S.ok.some(Boolean))api.end();
  }
  function blkRaw(x,y,s,ci,a=1){
    const[l,b,d]=COL[ci-1];cx.globalAlpha=a;
    const g=cx.createLinearGradient(0,y,0,y+s);g.addColorStop(0,l);g.addColorStop(.45,b);g.addColorStop(1,d);
    cx.fillStyle=g;rr(x+1,y+1,s-2,s-2,s*.2);cx.fill();
    cx.fillStyle="rgba(255,255,255,.32)";rr(x+s*.14,y+s*.12,s*.72,s*.2,s*.1);cx.fill();
    cx.strokeStyle="rgba(0,0,0,.28)";cx.lineWidth=1;rr(x+1.5,y+1.5,s-3,s-3,s*.2);cx.stroke();cx.globalAlpha=1;
  }
  function blkSpr(ci,s){const sz=Math.max(2,Math.round(s*k)),key=ci+"|"+sz;let c=SPR[key];
    if(!c){c=document.createElement("canvas");c.width=c.height=sz;const o=cx;cx=c.getContext("2d");cx.scale(sz/s,sz/s);blkRaw(0,0,s,ci,1);cx=o;SPR[key]=c}return c}
  function blk(x,y,s,ci,a=1){cx.globalAlpha=a;cx.drawImage(blkSpr(ci,s),x,y,s,s);cx.globalAlpha=1}
  function boardLayer(){if(BL)return BL;const sz=N*C+14,w=Math.max(2,Math.round(sz*k)),lc=document.createElement("canvas");lc.width=lc.height=w;
    const o=cx;cx=lc.getContext("2d");cx.scale(w/sz,w/sz);cx.translate(-(BX-7),-(BY-7));
    cx.fillStyle="rgba(10,28,16,.8)";rr(BX-7,BY-7,N*C+14,N*C+14,16);cx.fill();cx.strokeStyle="rgba(184,204,44,.55)";cx.lineWidth=2;cx.stroke();
    for(let r=0;r<N;r++)for(let c=0;c<N;c++){cx.fillStyle=(r+c)%2?"rgba(255,255,255,.05)":"rgba(255,255,255,.09)";rr(BX+c*C+1.5,BY+r*C+1.5,C-3,C-3,7);cx.fill()}
    cx=o;BL=lc;return lc}
  const NOSET=new Set();
  const api={W,H,maxW:420,key:"block",path:"/game/scores",title:"🧩 Block Puzzle",
    desc:"Drag pieces onto the 8×8 board. Fill a full row or column to clear it. Chain clears for combos, and the city changes every 400 points.",
    score:()=>S?S.sc:0,
    sub:()=>S?`Lines cleared: ${S.lines} · Best combo: ×${S.maxCombo||0}`:"",
    reset,
    down(x,y){
      if(st==="menu")return api.begin();
      if(st!=="play"||y<TY-14)return;const i=Math.min(2,Math.max(0,Math.floor(x/120)));if(!S.pcs[i])return;S.drag={i,x,y};snd(420,.05,"sine",.04);return true},
    move(x,y){if(S&&S.drag){S.drag.x=x;S.drag.y=y}},
    up(){if(!S||!S.drag)return;const d=S.drag;S.drag=null;const p=S.pcs[d.i];if(!p)return;const[r0,c0]=target(d);if(fits(p,r0,c0))place(d.i,r0,c0);else snd(150,.12,"sawtooth",.03)},
    cancel(){if(S)S.drag=null},
    draw(dt){
      if(!S)reset();
      S.disp+=(S.sc-S.disp)*Math.min(1,dt*9);if(Math.abs(S.sc-S.disp)<.6)S.disp=S.sc;
      S.fade=Math.min(1,S.fade+dt/1.2);S.banner=Math.max(0,S.banner-dt);
      const stage=S.stage;
      cx.save();
      if(S.shake>0){S.shake-=dt;const m=S.shake*18;cx.translate((Math.random()-.5)*m,(Math.random()-.5)*m)}
      const bgc=BG[stage],gr=cx.createLinearGradient(0,0,0,H);gr.addColorStop(0,bgc[0]);gr.addColorStop(1,bgc[1]);cx.fillStyle=gr;cx.fillRect(-10,-10,W+20,H+20);
      // faint skyline of the current city behind the header
      cx.imageSmoothingEnabled=true;
      const pb=scn((stage+SC.length-1)%SC.length),cb=scn(stage),sy=BY-8-210;
      if(S.fade<1&&pb){cx.globalAlpha=.3*(1-S.fade);cx.drawImage(pb,0,sy,W,210)}
      if(cb){cx.globalAlpha=.3*S.fade;cx.drawImage(cb,0,sy,W,210)}
      cx.globalAlpha=1;cx.imageSmoothingEnabled=true;
      // header: score / city + combo / best
      cx.textBaseline="alphabetic";cx.textAlign="left";cx.fillStyle="#c5d6ba";fitT("Score",20,26,100,14,500);
      cx.textAlign="right";fitT("Best",W-20,26,100,14,500);
      cx.textAlign="center";cx.fillStyle="#c5d6ba";fitT(CITIES[stage][0],W/2,26,110,14,500);
      cx.textAlign="left";cx.fillStyle="#F4C896";fitT(String(Math.round(S.disp)),20,64,150,34,700);
      cx.textAlign="right";cx.fillStyle="#FBF4E6";fitT(String(Math.max(best.block,S.sc)),W-20,64,150,34,700);
      if(S.combo>1){cx.textAlign="center";cx.fillStyle="#FFB347";fitT("Combo ×"+S.combo,W/2,60,110,17,700)}
      // board
      cx.drawImage(boardLayer(),BX-7,BY-7,N*C+14,N*C+14);
      let pv=null,pr=0,pc=0,hl=NOSET;
      if(S.drag&&S.pcs[S.drag.i]){const p=S.pcs[S.drag.i];[pr,pc]=target(S.drag);const hk=S.drag.i+":"+pr+":"+pc+":"+S.sc;
        if(S.hk!==hk){S.hk=hk;S.hv=null;S.hh=NOSET;
          if(fits(p,pr,pc)){S.hv=p;const g=S.g.map(r=>r.slice());p.cells.forEach(([r,c])=>{g[pr+r][pc+c]=1});const[R,Cc]=lines(g),h=new Set();R.forEach(r=>{for(let c=0;c<N;c++)h.add(r*N+c)});Cc.forEach(c=>{for(let r=0;r<N;r++)h.add(r*N+c)});S.hh=h}}
        pv=S.hv;hl=S.hh}else S.hk=null;
      for(let r=0;r<N;r++)for(let c=0;c<N;c++){const x=BX+c*C,y=BY+r*C;
        if(S.g[r][c])blk(x,y,C,S.g[r][c]);
        if(hl.has(r*N+c)){cx.fillStyle="rgba(246,245,230,.34)";rr(x+1,y+1,C-2,C-2,7);cx.fill()}}
      if(pv)pv.cells.forEach(([r,c])=>blk(BX+(pc+c)*C,BY+(pr+r)*C,C,pv.color,.6));
      S.fx=S.fx.filter(f=>(f.t+=dt)<.35);
      for(const f of S.fx){const q=f.t/.35,s=C*(1-q*.5),o=(C-s)/2;cx.globalAlpha=1-q;cx.fillStyle="#FBF4E6";rr(BX+f.c*C+o,BY+f.r*C+o,s,s,7);cx.fill();cx.globalAlpha=1}
      S.pt=S.pt.filter(p=>(p.l-=dt)>0);for(const p of S.pt){p.vy+=520*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;cx.globalAlpha=Math.min(1,p.l*2);cx.fillStyle=p.col;cx.fillRect(p.x-3,p.y-3,6,6)}cx.globalAlpha=1;
      // city banner when you reach a new stage
      if(S.banner>0&&st==="play"){cx.globalAlpha=Math.min(1,S.banner);cx.textAlign="center";
        bigT(CITIES[stage][0],W/2,BY+96,W-50,32,"#FBF4E6");bigT(CITIES[stage][1],W/2,BY+122,W-50,16,"#F4C896",500);cx.globalAlpha=1}
      // combo / praise pop-up
      if(S.pop){S.pop.t+=dt;const q=S.pop.t/1.2;if(q>=1)S.pop=null;else{cx.globalAlpha=Math.min(1,(1-q)*2.2);cx.textAlign="center";const yy=BY+N*C/2+30-q*44;
        bigT(S.pop.txt,W/2,yy,W-50,32,"#FBF4E6");bigT(S.pop.sub,W/2,yy+30,W-50,19,"#F4C896",600);cx.globalAlpha=1}}
      // piece tray
      cx.fillStyle="rgba(10,28,16,.92)";rr(8,TY-16,W-16,H-TY+8,18);cx.fill();
      S.pcs.forEach((p,i)=>{if(!p||(S.drag&&S.drag.i===i))return;const s=Math.min(24,100/p.w,70/p.h),ox=60+i*120-p.w*s/2,oy=TY+24-p.h*s/2,ok=S.ok[i];p.cells.forEach(([r,c])=>blk(ox+c*s,oy+r*s,s,p.color,ok?1:.3))});
      if(S.drag&&S.pcs[S.drag.i]){const p=S.pcs[S.drag.i],ox=S.drag.x-p.w*C/2,oy=S.drag.y-OFF-p.h*C/2;cx.fillStyle="rgba(0,0,0,.25)";p.cells.forEach(([r,c])=>{rr(ox+c*C+4,oy+r*C+10,C-6,C-6,8);cx.fill()});p.cells.forEach(([r,c])=>blk(ox+c*C,oy+r*C,C,p.color))}
      if(S.flash>0){cx.globalAlpha=Math.min(.6,S.flash);cx.fillStyle="#fff";cx.fillRect(-10,-10,W+20,H+20);cx.globalAlpha=1;S.flash=Math.max(0,S.flash-dt*1.6)}
      cx.restore();
      if(st!=="play"){cx.fillStyle="rgba(30,43,66,.82)";cx.fillRect(0,0,W,H);cx.textAlign="center";cx.fillStyle="#FBF4E6";
        if(st==="menu"){fitT("Fill a row or column",W/2,H/2-30,W-60,26,700);fitT("to clear it",W/2,H/2+4,W-60,26,700);cx.fillStyle="#F4C896";fitT("Drag the pieces onto the board",W/2,H/2+46,W-60,16,400);cx.fillStyle="#c5d6ba";fitT("Tap anywhere to start",W/2,H/2+76,W-60,14,400)}
        else{fitT("No moves left",W/2,H/2-26,W-60,28,700);cx.fillStyle="#F4C896";fitT(String(S.sc),W/2,H/2+34,W-60,52,700);cx.fillStyle="#c5d6ba";fitT("points",W/2,H/2+62,W-60,15,400)}}
    }};
  return api;
})();

/* ================= Game 2: City Runner ================= */
const R=(()=>{
  const W=360,H=200,GY=182,PX=46;
  const ST=[["Osaka","📦","🐙"],["Kyoto","⛩️","🍡"],["Nara","🦌","🍪"],["Kobe","⚓","🥩"],["Kanazawa","🏮","✨"],["Shirakawa-go","⛄","🍵"]];
  let S;const score=()=>Math.floor(S.dist/8)+S.bonus;
  function reset(){S={t:0,dist:0,bonus:0,items:0,sp:125,y:GY,vy:0,jumps:0,obs:[],col:[],pw:[],pt:[],gap:230,stage:0,zones:1,fade:1,banner:1.6,shield:0,mag:0,inv:0,streak:0,mt:0,mult:1}}
  function jumpNow(){ // up to 2 jumps; release early for a short hop
    if(S.y>=GY-.5){S.vy=-340;S.jumps=1;snd(380,.12,"square",.035,320)}
    else if(S.jumps<2){S.vy=-300;S.jumps=2;snd(520,.12,"square",.035,380)}}
  const burst=(x,y,col,n=8)=>{for(let i=0;i<n;i++)S.pt.push({x,y,vx:(Math.random()-.5)*160,vy:-30-Math.random()*110,l:.4+Math.random()*.3,col})};
  function step(dt){
    S.t+=dt;S.sp=Math.min(300,125+S.t*4);S.dist+=S.sp*dt;S.banner=Math.max(0,S.banner-dt);S.inv=Math.max(0,S.inv-dt);S.mag=Math.max(0,S.mag-dt);
    if(S.mt>0){S.mt-=dt;if(S.mt<=0){S.streak=0;S.mult=1}}
    const wasAir=S.y<GY-.5;
    S.vy+=920*dt;S.y+=S.vy*dt;if(S.y>=GY){S.y=GY;S.vy=0;S.jumps=0;if(wasAir)burst(PX+18,GY,"rgba(51,73,106,.5)",5)}
    const zone=Math.floor(score()/300),ns=zone%ST.length;
    if(ns!==S.stage){S.stage=ns;S.zones=zone+1;S.banner=2;S.fade=0;[523,659,784].forEach((f,j)=>later(()=>snd(f,.18,"triangle",.06),j*90))}
    S.fade=Math.min(1,S.fade+dt/1.2);
    S.gap-=S.sp*dt;
    if(S.gap<=0){
      const fly=S.t>6&&Math.random()<.25;
      if(fly){ // flying bird: stay low and run under it to grab the treats
        S.obs.push({x:W+12,w:24,n:1,fly:1,y:GY-62});[-30,0,30].forEach(dx=>S.col.push({x:W+12+dx,y:GY-14,got:0}))
      }else{
        const n=Math.random()<.35?2:1;S.obs.push({x:W+12,w:18*n,n});
        if(Math.random()<.7){const cxm=W+12+9*n;[[-24,40],[0,60],[24,40]].forEach(([dx,h])=>S.col.push({x:cxm+dx,y:GY-h,got:0}))}
        if(S.t>5&&Math.random()<.12)S.pw.push({x:W+12+9*n,y:GY-72,type:Math.random()<.5?"🛡️":"🧲",got:0});
      }
      S.gap=(170+Math.random()*130)*(S.sp/150)}
    for(const o of S.obs)o.x-=S.sp*dt;for(const c of S.col)c.x-=S.sp*dt;for(const p of S.pw)p.x-=S.sp*dt;
    if(S.mag>0){const px=PX+18,py=S.y-20;for(const c of S.col){const dx=px-c.x,dy=py-c.y,d=Math.hypot(dx,dy);if(d<130&&d>1){c.x+=dx/d*340*dt;c.y+=dy/d*340*dt}}}
    S.pt=S.pt.filter(p=>(p.l-=dt)>0);for(const p of S.pt){p.vy+=400*dt;p.x+=p.vx*dt;p.y+=p.vy*dt}
    S.obs=S.obs.filter(o=>o.x>-40&&!o.dead);S.col=S.col.filter(c=>c.x>-30&&!c.got);S.pw=S.pw.filter(p=>p.x>-30&&!p.got);
    const bx=PX+7,bw=22,by=S.y-38,bh=36;
    for(const o of S.obs){
      const hit=o.fly?(bx<o.x+o.w-3&&bx+bw>o.x+3&&by<o.y+9&&by+bh>o.y-9):(bx<o.x+o.w-4&&bx+bw>o.x+4&&by+bh>GY-18);
      if(!hit||S.inv>0)continue;
      if(S.shield){S.shield=0;S.inv=1.3;o.dead=1;burst(o.x+o.w/2,o.fly?o.y:GY-10,"#7CC4F0",12);snd(200,.25,"sawtooth",.06,-80);vibe(40)}
      else return api.end();
    }
    for(const c of S.col)if(!c.got&&bx<c.x+9&&bx+bw>c.x-9&&by<c.y+9&&by+bh>c.y-9){
      c.got=1;S.items++;S.streak++;S.mt=2.2;S.mult=Math.min(5,1+Math.floor(S.streak/4));S.bonus+=10*S.mult;
      burst(c.x,c.y,"#B5421F",6);snd(760+Math.min(S.streak,12)*40,.09,"sine",.06)}
    for(const p of S.pw)if(!p.got&&bx<p.x+11&&bx+bw>p.x-11&&by<p.y+11&&by+bh>p.y-11){
      p.got=1;if(p.type==="🛡️")S.shield=1;else S.mag=7;S.banner=0;burst(p.x,p.y,"#F2B84B",10);snd(660,.2,"triangle",.07,500);vibe(15)}
  }
  const api={W,H,maxW:560,key:"run",path:"/game/run",title:"🏃 City Runner",
    desc:"Tap to jump and tap again in mid-air to double jump. Hold for a higher jump. Grab treats for combos, pick up 🛡️ shields and 🧲 magnets, and run under flying birds. The city changes as you go.",
    score:()=>S?score():0,
    sub:()=>S?`Treats: ${S.items} · Cities visited: ${S.zones}`:"",
    reset,
    down(){if(st==="menu")return api.begin();if(st==="play"){jumpNow();return true}return false},
    move(){},
    up(){if(S&&st==="play"&&S.vy<-150)S.vy=-150},
    cancel(){},
    keydown(e){if(e.code==="Space"||e.code==="ArrowUp"){e.preventDefault();if(!e.repeat){if(st==="play")jumpNow();else if(st==="menu")api.begin()}}},
    keyup(e){if(e.code==="Space"||e.code==="ArrowUp")api.up()},
    draw(dt){
      if(!S)reset();if(st==="play")step(dt);if(st!=="play"&&st!=="over"&&st!=="menu")return;
      const t=ST[S.stage];cx.imageSmoothingEnabled=true;cx.clearRect(0,0,W,H);cx.fillStyle="#F4DCC4";cx.fillRect(0,0,W,H);
      const pb=scn((S.stage+SC.length-1)%SC.length),cb=scn(S.stage);
      if(S.fade<1&&pb)cx.drawImage(pb,0,H-210,W,210);cx.globalAlpha=S.fade;if(cb)cx.drawImage(cb,0,H-210,W,210);cx.globalAlpha=1;
      cx.fillStyle="rgba(51,73,106,.55)";const off=Math.floor(S.dist)%32;for(let x=-off;x<W;x+=32)cx.fillRect(x,H-9,16,3);
      cx.textBaseline="alphabetic";
      for(const o of S.obs){if(o.fly)emoAt("🐦",24,o.x+12,o.y+8+Math.sin(S.t*9)*3);else for(let i=0;i<o.n;i++)emoAt(t[1],24,o.x+9+i*18,GY+2)}
      for(const c of S.col)emoAt(t[2],24,c.x,c.y+8);
      for(const p of S.pw)emoAt(p.type,24,p.x,p.y+8+Math.sin(S.t*6)*3);
      const air=S.y<GY-.5,fr=Math.floor(S.t*8)%2;
      cx.save();if(S.inv>0)cx.globalAlpha=Math.floor(S.t*14)%2?.35:.9;
      if(air&&jump.complete)cx.drawImage(jump,0,0,57,68,PX,S.y-46,38,45);else if(walk.complete)cx.drawImage(walk,57*(1+fr),0,57,68,PX,S.y-46-(fr?1:0),38,45);
      cx.restore();
      if(S.shield){cx.strokeStyle="rgba(60,140,200,.85)";cx.lineWidth=2.5;cx.beginPath();cx.arc(PX+19,S.y-23,27,0,7);cx.stroke()}
      for(const p of S.pt){cx.globalAlpha=Math.min(1,p.l*3);cx.fillStyle=p.col;cx.fillRect(p.x-2,p.y-2,4,4)}cx.globalAlpha=1;
      cx.imageSmoothingEnabled=true;
      // HUD
      cx.fillStyle="#33496A";cx.textAlign="left";fitT(String(score()),10,26,110,22,700);cx.textAlign="right";fitT("Best "+Math.max(best.run,score()),W-10,24,150,15,500);
      if(st==="play"){
        if(S.mult>1){cx.textAlign="left";cx.fillStyle="#A12A1B";fitT("Treat combo ×"+S.mult,10,46,130,14,700)}
        cx.textAlign="right";cx.font="16px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif";
        let rx=W-10;if(S.shield){cx.fillText("🛡️",rx,48);rx-=24}
        if(S.mag>0){cx.fillText("🧲",rx,48);cx.fillStyle="rgba(51,73,106,.7)";cx.fillRect(rx-26-S.mag/7*30,40,S.mag/7*30,4)}
      }
      if(S.banner>0&&st==="play"){cx.globalAlpha=Math.min(1,S.banner);cx.fillStyle="#33496A";cx.textAlign="center";fitT(CITIES[S.stage][0],W/2,76,W-40,26,700);fitT(CITIES[S.stage][1],W/2,96,W-40,14,500);cx.globalAlpha=1}
      if(st==="menu"){cx.fillStyle="rgba(51,73,106,.68)";cx.fillRect(0,0,W,H);cx.fillStyle="#FBF4E6";cx.textAlign="center";fitT("Tap to start running",W/2,H/2-6,W-40,26,700);cx.fillStyle="#F4C896";fitT("Tap = jump · tap again in the air = double jump",W/2,H/2+24,W-30,13,400)}
      if(st==="over"){cx.fillStyle="rgba(51,73,106,.7)";cx.fillRect(0,0,W,H);cx.fillStyle="#FBF4E6";cx.textAlign="center";fitT("You tripped!",W/2,H/2-10,W-40,26,700);cx.fillStyle="#F4C896";fitT(String(score()),W/2,H/2+36,W-40,38,700)}
    }};
  return api;
})();
const GAMES={block:B,run:R};
B.begin=R.begin=()=>start();B.end=R.end=()=>over();

/* ================= Screen shell ================= */
function css(){
  if(document.getElementById("gm-css"))return;
  if(!document.querySelector('link[href*="Lexend"]')){const l=document.createElement("link");l.rel="stylesheet";l.href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&display=swap";document.head.appendChild(l)}
  const s=document.createElement("style");s.id="gm-css";
  s.textContent=`#gm{position:fixed;inset:0;z-index:70;background:#33496A;color:#FBF4E6;font-family:${FD};font-size:16px;line-height:1.5;display:flex;flex-direction:column;align-items:center;overflow-y:auto;padding:env(safe-area-inset-top,0px) 12px calc(16px + env(safe-area-inset-bottom,0px));overflow-wrap:anywhere}
#gm .gm-bar{width:100%;max-width:420px;display:flex;align-items:center;gap:8px;padding:6px 0}
#gm .gm-bar b{flex:1;min-width:0;font:600 18px ${FD};color:#F4C896;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#gm .gm-bar button{flex:none;min-width:44px;min-height:44px;border:0;border-radius:14px;background:#3F5F86;color:#FBF4E6;font-size:18px;cursor:pointer}
#gm canvas{border-radius:20px;touch-action:none;background:#0f2a18;display:block;user-select:none;-webkit-user-select:none;margin:0 auto}
#gm .gm-p{width:100%;max-width:420px;margin-top:12px}
#gm .gm-seg{display:grid;grid-template-columns:1fr 1fr;gap:6px;background:#3F5F86;border-radius:16px;padding:4px}
#gm .gm-seg button{min-height:46px;border:0;border-radius:12px;background:none;color:#dbe9d0;font:500 15px ${FD};cursor:pointer}
#gm .gm-seg button.on{background:#E8A66E;color:#33496A;font-weight:700}
#gm .gm-note{font-size:14px;color:#c9d8bf;margin:8px 2px;line-height:1.55}
#gm input{width:100%;box-sizing:border-box;min-height:48px;border-radius:14px;border:2px solid #4A6A92;background:#0d2214;color:#FBF4E6;padding:0 14px;font:400 16px ${FD};margin-top:8px}
#gm .gm-go{width:100%;min-height:54px;margin-top:10px;border:0;border-radius:16px;background:#E8A66E;color:#33496A;font:700 17px ${FD};cursor:pointer}
#gm .gm-go.alt{background:#3F5F86;color:#FBF4E6;font-weight:500;font-size:15px}
#gm .gm-card{display:block;width:100%;text-align:left;margin-top:10px;padding:14px 16px;border:2px solid #4A6A92;border-radius:20px;background:#3F5F86;color:#FBF4E6;font:inherit;cursor:pointer}
#gm .gm-card b{display:block;font-size:20px;font-weight:600;margin-bottom:4px}#gm .gm-card span{display:block;font-size:14px;color:#c9d8bf;line-height:1.5}#gm .gm-card i{display:block;font:600 15px ${FD};font-style:normal;color:#F4C896;margin-top:8px}
#gm .gm-res{text-align:center;font:700 32px ${FD};color:#F4C896;margin:2px 0}
#gm .gm-lb{margin:10px 0 0;padding:0;list-style:none}
#gm .gm-lb li{display:flex;gap:10px;align-items:baseline;padding:8px 6px;border-top:1px dashed rgba(233,234,210,.22)}
#gm .gm-lb li.me{background:rgba(184,204,44,.16);border-radius:10px}
#gm .gm-lb li b{flex:none;width:28px;color:#E8A66E;font-weight:600}#gm .gm-lb li span{flex:1;min-width:0;overflow-wrap:anywhere}#gm .gm-lb li i{flex:none;font:600 17px ${FD};font-style:normal;color:#F4C896}
#gm button:focus-visible,#gm input:focus-visible{outline:3px solid #F4C896;outline-offset:2px}
#gm{overscroll-behavior:contain}#gm button,#gm summary{touch-action:manipulation;-webkit-tap-highlight-color:transparent}
#gm .gm-set{margin-top:12px;border:1px solid #4A6A92;border-radius:16px;padding:0 12px 10px}#gm .gm-set summary{cursor:pointer;min-height:44px;display:flex;align-items:center;font-weight:600;color:#F4C896}
body.gm-open>*:not(#gm):not(script):not(style):not(link){visibility:hidden}body.gm-open *{animation-play-state:paused!important}`;
  document.head.appendChild(s);
}
function build(){
  if(root)return;css();
  root=document.createElement("div");root.id="gm";root.setAttribute("role","dialog");root.setAttribute("aria-modal","true");root.setAttribute("aria-label","Game corner");
  root.innerHTML=`<div class="gm-bar"><button class="gm-back" aria-label="Back to game list">←</button><b></b><button class="gm-snd" aria-label="Toggle sound"></button><button class="gm-x" aria-label="Close games">✕</button></div><canvas></canvas><div class="gm-p"></div>`;
  document.body.appendChild(root);
  bar=root.querySelector(".gm-bar b");cv=root.querySelector("canvas");cx=cv.getContext("2d",{alpha:false});panel=root.querySelector(".gm-p");sndBtn=root.querySelector(".gm-snd");
  const paintSnd=()=>{sndBtn.textContent=muted?"🔇":"🔊";sndBtn.setAttribute("aria-pressed",String(!muted))};paintSnd();
  sndBtn.onclick=()=>{muted=!muted;ls(LS.snd,muted?"0":"1");paintSnd();if(!muted)snd(660,.1,"triangle",.06)};
  root.querySelector(".gm-x").onclick=close;root.querySelector(".gm-back").onclick=()=>chooser();
  let rect=null; // measure the canvas once per touch, not on every pointermove
  const P=e=>{const r=rect||cv.getBoundingClientRect(),G=GAMES[cur];return[(e.clientX-r.left)*G.W/r.width,(e.clientY-r.top)*G.H/r.height]};
  cv.addEventListener("pointerdown",e=>{if(!cur)return;e.preventDefault();rect=cv.getBoundingClientRect();const[x,y]=P(e);if(GAMES[cur].down(x,y)){try{cv.setPointerCapture(e.pointerId)}catch(_){}}});
  cv.addEventListener("pointermove",e=>{if(cur&&rect){const[x,y]=P(e);GAMES[cur].move(x,y)}});
  cv.addEventListener("pointerup",()=>{rect=null;if(cur)GAMES[cur].up()});
  cv.addEventListener("pointercancel",()=>{rect=null;if(cur)GAMES[cur].cancel()});
  addEventListener("resize",()=>{rect=null;fit()});
}
function fit(){ // sharp canvas, but capped at 2x so phones don't have to fill a huge bitmap every frame
  if(!cur||!cv||cv.style.display==="none")return;const G=GAMES[cur],dpr=Math.min(2,window.devicePixelRatio||1);
  cv.style.width=`min(100%,${G.maxW}px,calc((100vh - 190px)*${G.W/G.H}))`;cv.style.aspectRatio=`${G.W}/${G.H}`;
  const w=cv.getBoundingClientRect().width||G.W,nw=Math.round(w*dpr),nh=Math.round(w*dpr*G.H/G.W);
  if(cv.width!==nw||cv.height!==nh){cv.width=nw;cv.height=nh;clearCaches()}
  k=cv.width/G.W;
}
function frame(ts){
  if(!open||!cur)return;const dt=Math.min(.05,lt?(ts-lt)/1000:.016);lt=ts;
  cx.setTransform(k,0,0,k,0,0);cx.save();GAMES[cur].draw(dt);cx.restore();
  raf=requestAnimationFrame(frame);
}
const modeSeg=()=>`<div class="gm-seg" role="group" aria-label="Game mode"><button data-m="off" class="${mode==="off"?"on":""}">📴 Offline</button><button data-m="on" class="${mode==="on"?"on":""}">🌐 Online</button></div>`;
function bindSeg(after){panel.querySelectorAll(".gm-seg button").forEach(b=>b.onclick=()=>{mode=b.dataset.m;ls(LS.m,mode);after()})}

/* one screen: pick a game and it starts right away (score mode lives in a small drawer below the list) */
function chooser(keep){
  cancelAnimationFrame(raf);cur=null;st="menu";cv.style.display="none";root.querySelector(".gm-back").style.display="none";bar.textContent="🎮 Choose a game";
  panel.innerHTML=Object.values(GAMES).map(g=>`<button class="gm-card" data-g="${g.key}"><b>${g.title}</b><span>${g.desc}</span><i>Best: ${best[g.key]} · Tap to play</i></button>`).join("")
    +`<details class="gm-set"${mode==="on"||keep===true?" open":""}><summary>⚙️ Score mode: ${mode==="on"?"Online":"Offline"}</summary>${modeSeg()}`
    +(mode==="on"?`<input id="gm-nick" maxlength="12" placeholder="Nickname (up to 12 characters)" autocomplete="nickname" value="${esc2(nick)}"><p class="gm-note">Your score is posted to the shared leaderboard. Needs an internet connection.</p>`
      :`<p class="gm-note">No internet needed. Your best score is saved on this device.</p>`)+`</details>`;
  panel.querySelectorAll(".gm-card").forEach(b=>b.onclick=()=>pick(b.dataset.g));
  bindSeg(()=>chooser(true));
  const ni=panel.querySelector("#gm-nick");if(ni)ni.oninput=()=>{nick=ni.value.replace(/[<>]/g,"").trim().slice(0,12);ls(LS.n,nick)};
}
function pick(g){cur=g;cv.style.display="block";root.querySelector(".gm-back").style.display="";bar.textContent=GAMES[g].title;fit();st="menu";start();lt=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(frame)}
function start(){
  if(st==="play")return;
  GAMES[cur].reset();st="play";
  panel.innerHTML=`<button class="gm-go alt" id="gm-end">🏁 End game</button>`;panel.querySelector("#gm-end").onclick=over;
}
function over(){
  if(st!=="play")return;st="over";const G=GAMES[cur],sc=G.score(),isBest=sc>0&&sc>best[cur];
  if(sc>best[cur]){best[cur]=sc;ls(LS[cur],String(sc))}
  snd(330,.35,"sawtooth",.05,-200);vibe(60);
  panel.innerHTML=`<div class="gm-res">${sc} points</div><p class="gm-note" style="text-align:center">${isBest?"🏆 New personal best! · ":""}Best: ${best[cur]}${G.sub?`<br>${G.sub()}`:""}</p>
  ${mode==="on"?`<p class="gm-note" id="gm-st" style="text-align:center">Submitting your score…</p><ol class="gm-lb" id="gm-lb"></ol>`:""}
  <button class="gm-go" id="gm-again">Play again</button><button class="gm-go alt" id="gm-pick">🎮 All games</button>`;
  panel.querySelector("#gm-again").onclick=()=>{st="menu";start()};panel.querySelector("#gm-pick").onclick=()=>chooser();
  if(mode==="on")submit(sc);
}
async function submit(sc){
  const el=panel.querySelector("#gm-st"),G=GAMES[cur];
  if(!nick){if(el)el.textContent="Add a nickname in ⚙️ Score mode (game list) to post your score.";return board()}
  if(sc<=0){if(el)el.textContent="No score to submit yet.";return board()}
  try{if(typeof dbx!=="function")throw 0;await dbx("POST",G.path,{n:nick,s:Math.min(99999,sc),t:Date.now()},"",6000);if(el)el.textContent="✅ Score submitted!"}
  catch(e){if(el)el.innerHTML=`⚠️ Couldn't submit (you may be offline, or the database rules aren't set up). Your score is still saved on this device. <button class="gm-go alt" id="gm-retry" style="margin-top:8px">Try again</button>`;
    const r=panel.querySelector("#gm-retry");if(r)r.onclick=()=>{el.textContent="Submitting your score…";submit(sc)}}
  board();
}
async function board(){
  const G=GAMES[cur];if(!G)return;
  try{if(typeof dbx!=="function")throw 0;
    const o=await dbx("GET",G.path,undefined,'?orderBy="s"&limitToLast=10',6000);
    const L=Object.values(o||{}).filter(x=>x&&typeof x.s==="number").sort((a,b)=>b.s-a.s).slice(0,10),el=document.getElementById("gm-lb");if(!el)return;
    const M=["🥇","🥈","🥉"];
    el.innerHTML=L.length?L.map((x,i)=>{const n=String(x.n||"Anonymous").slice(0,12);return`<li${nick&&n===nick?' class="me"':""}><b>${M[i]||i+1}</b><span>${esc2(n)}</span><i>${x.s}</i></li>`}).join(""):"<li><span>No scores yet. Be the first!</span></li>";
  }catch(e){const el=document.getElementById("gm-lb");if(el)el.innerHTML="<li><span>Couldn't load the leaderboard right now (offline?). You can still play offline.</span></li>"}
}
function key(e){
  if(!open)return;if(e.code==="Escape")return close();
  if(cur&&GAMES[cur].keydown&&!(e.target&&e.target.tagName==="INPUT"))GAMES[cur].keydown(e);
}
function keyU(e){if(open&&cur&&GAMES[cur].keyup&&!(e.target&&e.target.tagName==="INPUT"))GAMES[cur].keyup(e)}
function openGame(){build();open=true;document.body.classList.add("gm-open");root.style.display="flex";document.body.style.overflow="hidden";addEventListener("keydown",key);addEventListener("keyup",keyU);chooser();root.querySelector(".gm-x").focus();
  try{document.fonts&&document.fonts.load("600 16px Lexend")}catch(e){}}
function close(){open=false;cancelAnimationFrame(raf);cur=null;if(root)root.style.display="none";document.body.classList.remove("gm-open");document.body.style.overflow="";removeEventListener("keydown",key);removeEventListener("keyup",keyU);
  try{typeof tick==="function"&&tick()}catch(e){}}
document.addEventListener("visibilitychange",()=>{if(!open||!cur)return;cancelAnimationFrame(raf);if(!document.hidden){lt=0;raf=requestAnimationFrame(frame)}});
window.gameOpen=openGame;
})();
