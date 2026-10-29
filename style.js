// style.js — แนะนำสีเสื้อผ้าให้เข้ากับสถานที่จากรูปถ่าย
// ประมวลผลในเบราว์เซอร์ทั้งหมด รูปไม่ถูกอัปโหลดไปไหน ไม่ต้องใช้ API
(function(){
"use strict";
const $=id=>document.getElementById(id);
const esc=t=>String(t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));

// ---------- คณิตศาสตร์สี ----------
const hex2rgb=h=>{const n=parseInt(h.slice(1),16);return [n>>16&255,n>>8&255,n&255]};
const rgb2hex=(r,g,b)=>"#"+[r,g,b].map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,"0")).join("");
function rgb2lab(r,g,b){
  const f=v=>{v/=255;return v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4)};
  const R=f(r),G=f(g),B=f(b);
  let X=(R*0.4124564+G*0.3575761+B*0.1804375)/0.95047,Y=R*0.2126729+G*0.7151522+B*0.0721750,Z=(R*0.0193339+G*0.1191920+B*0.9503041)/1.08883;
  const q=t=>t>0.008856?Math.cbrt(t):7.787*t+16/116;
  X=q(X);Y=q(Y);Z=q(Z);
  return [116*Y-16,500*(X-Y),200*(Y-Z)];
}
const dE=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
function rgb2hsl(r,g,b){
  r/=255;g/=255;b/=255;
  const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;let h=0,s=0;
  if(mx!==mn){const d=mx-mn;s=l>0.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h*=60}
  return [h,s,l];
}
function hsl2rgb(h,s,l){
  h=((h%360)+360)%360;
  const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;
  const [r,g,b]=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
  return [(r+m)*255,(g+m)*255,(b+m)*255];
}

// ---------- ชุดสีที่มีชื่อ (ให้หาซื้อ/เทียบได้ง่าย) ----------
const mk=(n,hex,w)=>{const rgb=hex2rgb(hex);return {n,hex,w:w||0,rgb,lab:rgb2lab(...rgb)}};
const CH=[ // สีสด/มีสี
  mk("แดงสด","#D62828"),mk("แดงเลือดหมู","#7A1F2B"),mk("ส้มสด","#F77F00"),mk("ส้มอิฐ","#B5523B"),
  mk("เหลืองมัสตาร์ด","#D4A017"),mk("เหลืองนวล","#F2E394"),mk("เขียวสด","#2E9E4F"),mk("เขียวมิ้นต์","#A8D5BA"),
  mk("เขียวขี้ม้า","#5E6B3A"),mk("เขียวเข้ม","#1F4D3A"),mk("เขียวเทอร์ควอยซ์","#1B9AAA"),mk("ฟ้าอ่อน","#A8D0F0"),
  mk("ฟ้าสด","#3A86FF"),mk("น้ำเงินโคบอลต์","#1F4FBF"),mk("ม่วงลาเวนเดอร์","#B9A3E3"),mk("ม่วงเข้ม","#5B2A86"),
  mk("ชมพูพาสเทล","#F7C6D0"),mk("ชมพูบานเย็น","#D81B7A"),mk("ชมพูกุหลาบฝุ่น","#C98B96"),
  mk("น้ำตาลช็อกโกแลต","#5C3A21"),mk("คาราเมล","#B07A3F")
];
const NE=[ // สีกลาง (w: +1 อุ่น, -1 เย็น)
  mk("ขาว","#F7F7F2",0),mk("ครีม","#EFE5D0",1),mk("เบจ","#D8C3A0",1),mk("กากี","#A39A6B",1),mk("น้ำตาลแทน","#B08968",1),
  mk("เทาอ่อน","#C4C7CC",0),mk("เทาเข้ม","#4A4F57",0),mk("กรมท่า","#1F2A44",-1),mk("ยีนส์ฟอก","#8FAAC8",-1),
  mk("ยีนส์เข้ม","#3F6190",-1),mk("ดำ","#1C1C1C",0)
];
const neutral=n=>NE.includes(n);
const byName=n=>NE.find(x=>x.n===n);
function nearest(list,rgb){
  const lab=rgb2lab(...rgb);let b=null,bd=1e9;
  for(const c of list){const d=dE(c.lab,lab);if(d<bd){bd=d;b=c}}
  return b;
}
const nameOf=rgb=>nearest(CH.concat(NE),rgb).n;

// ---------- วิเคราะห์สีในรูป ----------
// d = ข้อมูลพิกเซล RGBA (Uint8ClampedArray หรืออาร์เรย์)
function analyzePixels(d){
  const B=new Map();let tot=0;
  for(let i=0;i+3<d.length;i+=4){
    if(d[i+3]<200)continue;
    const key=((d[i]>>4)<<8)|((d[i+1]>>4)<<4)|(d[i+2]>>4);
    let e=B.get(key);if(!e){e={n:0,r:0,g:0,b:0};B.set(key,e)}
    e.n++;e.r+=d[i];e.g+=d[i+1];e.b+=d[i+2];tot++;
  }
  if(!tot)return null;
  const E=[...B.values()].map(e=>{const r=e.r/e.n,g=e.g/e.n,b=e.b/e.n;return {n:e.n,r,g,b,lab:rgb2lab(r,g,b)}}).sort((a,b)=>b.n-a.n);
  const reps=[];
  for(const e of E){
    if(reps.length>=6||e.n<tot*0.004)break;
    if(reps.every(p=>dE(p.lab,e.lab)>26))reps.push({lab:e.lab,n:0,r:0,g:0,b:0});
  }
  if(!reps.length)reps.push({lab:E[0].lab,n:0,r:0,g:0,b:0});
  for(const e of E){
    let bi=0,bd=1e9;
    reps.forEach((p,i)=>{const x=dE(p.lab,e.lab);if(x<bd){bd=x;bi=i}});
    const p=reps[bi];p.n+=e.n;p.r+=e.r*e.n;p.g+=e.g*e.n;p.b+=e.b*e.n;
  }
  const pal=reps.filter(p=>p.n>0).map(p=>{
    const r=p.r/p.n,g=p.g/p.n,b=p.b/p.n,lab=rgb2lab(r,g,b);
    return {rgb:[r,g,b],hex:rgb2hex(r,g,b),lab,chroma:Math.hypot(lab[1],lab[2]),share:p.n/tot};
  }).sort((a,b)=>b.share-a.share);
  let L=0,C=0,A=0,Bb=0;
  for(const p of pal){L+=p.lab[0]*p.share;C+=p.chroma*p.share;A+=p.lab[1]*p.share;Bb+=p.lab[2]*p.share}
  let anchor=null,bs=0;
  for(const p of pal){if(p.chroma>=16&&p.share>=0.06){const s=p.share*p.chroma;if(s>bs){bs=s;anchor=p}}}
  const h=anchor?rgb2hsl(...anchor.rgb)[0]:null;
  const warm=anchor?((h<70||h>=330)?1:(h>=150&&h<270?-1:0)):(Bb>2?1:Bb<-2?-1:0);
  return {pal,L,C,h,anchor,warm};
}

// ---------- กฎแนะนำชุด ----------
function pickByGap(list,L0,minGap,warm,bonus){
  let best=null,bs=-1e9;
  for(const n of list){
    const gap=Math.abs(n.lab[0]-L0);
    let s=Math.min(gap,45);
    if(gap<minGap)s-=40;
    if(warm!==0)s+=n.w===warm?8:(n.w===-warm?-8:0);
    if(bonus&&bonus[n.n])s+=bonus[n.n];
    if(s>bs){bs=s;best=n}
  }
  return best;
}
const SHOES=["ขาว","ครีม","น้ำตาลแทน","ดำ","กรมท่า","เทาเข้ม"].map(byName);
const CLASSIC={"ขาว":6,"ดำ":5,"น้ำตาลแทน":4,"ครีม":3};
const MODES={
  contrast:{label:"เด่นตัดฉาก",desc:"เสื้อสีตรงข้ามกับสีเด่นของฉาก ให้คุณเด่นในรูป"},
  match:{label:"กลมกลืน",desc:"เสื้อโทนใกล้สีฉาก ภาพดูเป็นเนื้อเดียวกัน"},
  safe:{label:"ปลอดภัย",desc:"สีกลางทั้งชุด มีสีฉากเป็นจุดเล็ก ๆ ที่ถุงเท้า"}
};
function recommend(sc,mode){
  if(mood!=="auto")return recommendMood(sc,mode);
  const bright=sc.L>58,warm=sc.warm;
  const sceneName=sc.anchor?nameOf(sc.anchor.rgb):null;
  let shirt,shirtWhy;
  if(mode==="safe"){
    shirt=bright?byName("กรมท่า"):(sc.L<38?byName("ขาว"):byName("ครีม"));
    shirtWhy=`สีกลางที่ไม่แย่งฉาก ${bright?"ฉากสว่างจึงใช้สีเข้ม":sc.L<38?"ฉากค่อนข้างมืดจึงใช้สีสว่าง":"ฉากแสงปานกลางจึงใช้สีนวล"}`;
  }else if(mode==="contrast"){
    const h=sc.h==null?(warm>0?215:8):sc.h+180;
    shirt=nearest(CH,hsl2rgb(h,0.62,bright?0.40:0.60));
    shirtWhy=`สีตรงข้ามกับ${sceneName?`สี${sceneName}ในฉาก`:"โทนของฉาก"} ทำให้คุณเด่นออกจากพื้นหลัง${sc.h==null?" (ฉากนี้สีกลาง จึงเลือกสีจัดมาตัด)":""}`;
  }else{
    const h=sc.h==null?(warm>0?32:210):sc.h;
    shirt=nearest(CH,hsl2rgb(h,0.40,bright?0.46:0.68));
    shirtWhy=`โทนเดียวกับ${sceneName?`สี${sceneName}`:"สี"}ของฉาก แต่ ${bright?"เข้มกว่า":"อ่อนกว่า"}เล็กน้อย ดูกลมกลืนเป็นภาพเดียวกัน`;
  }
  const pants=pickByGap(NE.filter(n=>n!==shirt),shirt.lab[0],24,warm);
  const pantsWhy=`สีกลาง ${pants.lab[0]<shirt.lab[0]?"เข้มกว่า":"อ่อนกว่า"}เสื้อพอดี ชุดไม่กลืนกัน${warm!==0&&pants.w===warm?" และโทนเข้ากับฉาก":""}`;
  const shoes=pickByGap(SHOES.filter(n=>n!==pants),pants.lab[0],22,warm,CLASSIC);
  const shoesWhy=`${shoes.lab[0]>pants.lab[0]?"สว่างกว่า":"เข้มกว่า"}กางเกง รองเท้าไม่จมไปกับขา${shoes.n==="ขาว"?" และเป็นสีที่หาง่าย":""}`;
  let socks,socksWhy;
  if(mode==="contrast"&&!neutral(shirt)){socks=shirt;socksWhy="ซ้ำสีเสื้อเป็นจุดเล็ก ๆ ผูกชุดให้ดูมีจังหวะ"}
  else if(mode==="safe"&&sc.anchor&&dE(nearest(CH,sc.anchor.rgb).lab,sc.anchor.lab)<=30){socks=nearest(CH,sc.anchor.rgb);socksWhy="หยิบสีเด่นของฉากมาเป็นจุดสีเล็ก ๆ ชุดที่เหลือเรียบ"}
  else if(shoes.lab[0]>70){socks=byName("ขาว");socksWhy="ถุงเท้าขาวคู่รองเท้าสีอ่อน ดูสะอาด"}
  else{socks=pants;socksWhy="สีเดียวกับกางเกง ขาดูต่อเนื่องและเรียวขึ้น"}
  return {shirt:{c:shirt,why:shirtWhy},pants:{c:pants,why:pantsWhy},socks:{c:socks,why:socksWhy},shoes:{c:shoes,why:shoesWhy}};
}

// ---------- Mood สี (พาเลต 4 สีต่อโทน) ----------
const MOODS={
  warm:["Warm","อบอุ่น",["FFE194","FFB085","90AACB","F77575"]],cool:["Cool","เย็นสบาย",["CFE9F7","3282B8","00909E","010038"]],
  soft:["Soft","ละมุน",["EEC089","D7D0B6","8A9DA4","4B4D63"]],powerful:["Powerful","พลัง",["FFCA03","F3950D","CD1818","0F2C67"]],
  modern:["Modern","โมเดิร์น",["F5E8C7","9E7777","E5B299","7D5A50"]],futuristic:["Futuristic","ล้ำสมัย",["FFE459","F43B86","3D087B","11052C"]],
  natural:["Natural","ธรรมชาติ",["F4E5C2","0B8457","096C47","323232"]],exclusive:["Exclusive","หรูหรา",["E0C097","B85C38","5C3D2E","2D2424"]],
  popular:["Popular","ยอดนิยม",["9D9D9D","F8F0DF","FEFBF3","79B4B7"]],romantic:["Romantic","โรแมนติก",["F2AAAA","E36387","A6DCEF","251F44"]],
  vintage:["Vintage","วินเทจ",["CAE4DB","CDC7BE","87A7B3","766161"]],traditional:["Traditional","คลาสสิก",["393232","E48257","F2EDD7","3A6351"]],
  dark:["Dark","ดาร์ก",["525252","414141","CA3E47","311D3F"]]
};
let mood="auto";
const DEF={pal:[],L:55,C:0,h:null,anchor:null,warm:0};
function recommendMood(sc,mode){
  const M=MOODS[mood],P=M[2].map(h=>{const rgb=hex2rgb("#"+h);return {n:nameOf(rgb),hex:"#"+h,rgb,lab:rgb2lab(...rgb)}});
  const ref=sc.anchor?sc.anchor.lab:[sc.L,0,0],ch=c=>Math.hypot(c.lab[1],c.lab[2]),gap=(x,y)=>Math.abs(x.lab[0]-y.lab[0]);
  const best=(L,f)=>L.reduce((a,b)=>f(b)>f(a)?b:a);
  const shirt=mode==="contrast"?best(P,c=>dE(c.lab,ref)):mode==="match"?best(P,c=>-dE(c.lab,ref)):best(P,c=>-ch(c));
  let rest=P.filter(c=>c!==shirt);
  const pants=best(rest,c=>gap(c,shirt));rest=rest.filter(c=>c!==pants);
  const shoes=best(rest,c=>gap(c,pants)),socks=rest.find(c=>c!==shoes);
  const sw={contrast:"ต่างจากสีฉากมากที่สุดในโทนนี้",match:"ใกล้สีฉากที่สุดในโทนนี้",safe:"จัดน้อยที่สุดในโทนนี้ ใส่ง่าย"}[mode]+(sc.anchor?"":" (ยังไม่มีรูป จึงเทียบกับโทนกลาง)");
  return {shirt:{c:shirt,why:`จากโทน ${M[0]} · ${sw}`},pants:{c:pants,why:`${pants.lab[0]<shirt.lab[0]?"เข้มกว่า":"อ่อนกว่า"}เสื้อชัดเจน ชุดไม่กลืนกัน`},
    socks:{c:socks,why:"สีที่เหลือในโทน ผูกชุดให้ครบพาเลต"},shoes:{c:shoes,why:`${shoes.lab[0]>pants.lab[0]?"สว่างกว่า":"เข้มกว่า"}กางเกง รองเท้าไม่จมไปกับขา`}};
}
// ---------- หน้าจอ ----------
const ROLES=[["shirt","เสื้อ"],["pants","กางเกง / กระโปรง"],["socks","ถุงเท้า"],["shoes","รองเท้า"]];
let S=null,mode="contrast";
function figure(o){
  const sk="#cbd5e1",st='stroke="rgba(0,0,0,.45)" stroke-width="1"';
  const c=k=>o[k].c.hex;
  return `<svg viewBox="0 0 120 214" width="108" height="192" role="img" aria-label="ภาพชุดที่แนะนำ">
<circle cx="60" cy="20" r="14" fill="${sk}"/><rect x="54" y="32" width="12" height="9" fill="${sk}"/>
<circle cx="14" cy="104" r="5" fill="${sk}"/><circle cx="106" cy="104" r="5" fill="${sk}"/>
<polygon points="40,108 60,108 58,178 43,178" fill="${c("pants")}" ${st}/><polygon points="60,108 80,108 77,178 62,178" fill="${c("pants")}" ${st}/>
<polygon points="42,40 78,40 94,58 104,100 92,103 82,72 80,112 40,112 38,72 28,103 16,100 26,58" fill="${c("shirt")}" ${st}/>
<rect x="43" y="178" width="15" height="14" fill="${c("socks")}" ${st}/><rect x="62" y="178" width="15" height="14" fill="${c("socks")}" ${st}/>
<path d="M40 192 H60 Q62 206 56 208 H36 Q34 198 40 192 Z" fill="${c("shoes")}" ${st}/><path d="M60 192 H80 Q86 198 84 208 H64 Q58 206 60 192 Z" fill="${c("shoes")}" ${st}/>
</svg>`;
}
function sceneText(sc){
  const t=sc.warm>0?"โทนอุ่น":sc.warm<0?"โทนเย็น":"โทนกลาง";
  const l=sc.L>62?"สว่าง":sc.L<38?"ค่อนข้างมืด":"แสงปานกลาง";
  const c=sc.C>35?"สีสดจัด":sc.C>18?"สีสดปานกลาง":"สีนุ่ม/ซีด";
  return `${t} · ${l} · ${c}`;
}
function render(){
  const box=$("sres");if(!box)return;
  const sc=S?S.scene:DEF,o=(S||mood!=="auto")?recommend(sc,mode):null;
  const sw=h=>`<i style="width:14px;height:14px;border-radius:50%;background:#${h};margin-left:-4px;border:1px solid rgba(0,0,0,.18)"></i>`;
  const mchips=`<button class="chip ${mood==="auto"?"on":""}" onclick="styleMood('auto')">✨ ตามภาพ</button>`+Object.keys(MOODS).map(k=>`<button class="chip ${k===mood?"on":""}" style="display:inline-flex;align-items:center;gap:8px" onclick="styleMood('${k}')"><span style="display:inline-flex;padding-left:4px">${MOODS[k][2].map(sw).join("")}</span>${MOODS[k][0]} ${MOODS[k][1]}</button>`).join("");
  let h="";
  if(S){
    const pal=sc.pal.map(p=>`<div style="flex:${Math.max(p.share,0.05)};background:${p.hex};color:${p.lab[0]>60?"#111":"#fff"}">${p.share>=0.08?Math.round(p.share*100)+"%":""}</div>`).join("");
    h+=`<div class="card" style="margin-top:12px"><div style="display:flex;gap:12px;align-items:center"><img src="${S.url}" alt="" style="width:92px;height:92px;object-fit:cover;border-radius:12px;flex:none"><div style="min-width:0"><b>สีในรูป</b><div class="note" style="margin:2px 0 0">${esc(sceneText(sc))}</div></div></div><div class="pal">${pal}</div></div>`;
  }
  h+=`<div class="card" style="margin-top:12px"><b>🎨 Mood สี</b><div class="note" style="margin:2px 0 0">เลือกโทนสี ระบบจะจัดชุดจาก 4 สีของโทนนั้น (เลือก "ตามภาพ" เพื่อให้ดูจากสีในรูปอย่างเดียว)</div><div class="chips">${mchips}</div></div>`;
  if(o){
    const chips=Object.keys(MODES).map(k=>`<button class="chip ${k===mode?"on":""}" onclick="stylePick('${k}')">${MODES[k].label}</button>`).join("");
    const rows=ROLES.map(([k,label])=>`<div style="display:flex;gap:10px;align-items:flex-start;padding:9px 0;border-bottom:1px solid var(--line)"><span class="sw" style="background:${o[k].c.hex}"></span><div style="flex:1;min-width:0"><div style="font-size:13px;color:var(--mut)">${label}</div><b>${esc(o[k].c.n)}</b> <span class="note" style="margin:0">${o[k].c.hex.toUpperCase()}</span><div class="note" style="margin:2px 0 0">${esc(o[k].why)}</div></div></div>`).join("");
    const desc=mood==="auto"?MODES[mode].desc:`จัดชุดจากโทน ${MOODS[mood][0]} · ${S?"เลือกเสื้อแบบ"+MODES[mode].label:"ยังไม่ได้เลือกรูป จึงจัดจากโทนสีอย่างเดียว"}`;
    h+=`<div class="card" style="margin-top:12px"><div class="chips" style="padding:0 0 6px">${chips}</div><div class="note" style="margin:0 0 8px">${esc(desc)}</div><div style="display:flex;gap:12px;align-items:flex-start"><div style="flex:none">${figure(o)}</div><div style="flex:1;min-width:0">${rows}</div></div><div class="note" style="margin-top:10px">ระบบดูเฉพาะสีในรูป ไม่ได้รู้จักชื่อสถานที่ และไม่ได้คิดสีผิวหรือแสงจริงตอนถ่าย ชื่อสีเป็นการประมาณ ดูรหัสสีประกอบ ถ้าชุดมีลาย ให้ใช้สีที่แนะนำเป็นสีหลักของชุด</div></div>`;
  }
  box.innerHTML=h;
}
window.styleMood=k=>{if(k==="auto"||MOODS[k]){mood=k;render()}};
window.stylePick=m=>{if(MODES[m]){mode=m;render()}};
function load(file){
  const url=URL.createObjectURL(file),im=new Image();
  im.onload=()=>{
    try{
      const k=Math.min(1,120/Math.max(im.naturalWidth,im.naturalHeight)),w=Math.max(1,Math.round(im.naturalWidth*k)),h=Math.max(1,Math.round(im.naturalHeight*k));
      const cv=document.createElement("canvas");cv.width=w;cv.height=h;
      const cx=cv.getContext("2d");cx.drawImage(im,0,0,w,h);
      const sc=analyzePixels(cx.getImageData(0,0,w,h).data);
      if(!sc){URL.revokeObjectURL(url);toast("อ่านสีจากรูปนี้ไม่ได้");return}
      if(S&&S.url)URL.revokeObjectURL(S.url);
      S={url,scene:sc};render();
    }catch(e){URL.revokeObjectURL(url);toast("วิเคราะห์รูปไม่สำเร็จ")}
  };
  im.onerror=()=>{URL.revokeObjectURL(url);toast("เปิดไฟล์รูปนี้ไม่ได้ (ลองรูป JPG/PNG หรือแคปหน้าจอแล้วอัปโหลดแทน)")};
  im.src=url;
}
const inp=$("sf");
render();
if(inp)inp.addEventListener("change",e=>{const f=e.target.files&&e.target.files[0];e.target.value="";if(f)load(f)});
window.styleLab={analyzePixels,recommend,nameOf,setScene:(sc,url)=>{S={url:url||"",scene:sc};render()},getMode:()=>mode}; // สำหรับทดสอบ
})();
