// แท็บชิราคาวาโกะ: จัดแผนไป-กลับวันเดียวจากโอซาก้า ใช้ตารางจากไฟล์ Bus_JR_Line_Timetable (ข้อมูล ณ เม.ย. 2023)
// เวลาเป็นข้อความ "H:MM" แก้ตารางได้ที่ SGD ด้านล่าง · ธง: 1 ท้ายแถวรถไฟ = ◆ วิ่งเฉพาะบางวัน
// ธงของรถบัส: w = หยุด 1 ธ.ค.–31 มี.ค. (△) · d = หยุดเสาร์ อาทิตย์ วันหยุด (◆) · bad = ตัวเลขในไฟล์ดูผิด ไม่ใช้คำนวณ
const SGK="osaka_sgo_v1";
const SGB={kz:20,tky:10};   // เผื่อเวลาเปลี่ยนจากรถไฟไปป้ายบัส (นาที) ไม่อยู่ในไฟล์ เป็นค่าประมาณ
const SGX=90;               // โอซาก้า↔นาโกย่า ไม่อยู่ในไฟล์ ประมาณ: โอซาก้า→ชินโอซาก้า+ขึ้นชานชาลา ~15 + ชินคันเซ็น Nozomi ~50 + ต่อรถที่นาโกย่า ~25 (Hikari/Kodama ช้ากว่า ~55–67)
const SGD={
  // โอซาก้า → คานาซาวะ (Thunderbird) [เลขขบวน, ออก, ถึง, ◆]
  tbOut:[["1","6:30","9:13"],["3","7:00","9:38"],["5","7:40","10:25"],["7","8:10","11:02"],["9","8:42","11:14"],["11","9:12","11:58"],["13","9:42","12:20"],["15","10:12","12:56",1],["17","10:42","13:20"],["19","11:42","14:23"],["21","12:12","14:55"],["23","12:42","15:26"],["25","13:42","16:29"],["27","14:42","17:26"],["29","15:12","17:55",1],["31","15:42","18:27"],["33","16:42","19:16"],["35","17:12","19:55"],["37","17:42","20:13"],["39","18:12","20:56"],["41","18:42","21:23"],["43","19:12","21:53",1],["45","19:27","22:09"],["47","20:07","22:56"],["49","20:54","23:29"]],
  // คานาซาวะ → โอซาก้า
  tbBack:[["2","5:35","8:20"],["4","6:07","9:06",1],["6","6:45","9:22"],["8","7:15","10:03"],["10","8:05","10:39"],["12","8:15","11:06"],["14","9:02","11:37"],["16","9:54","12:37"],["18","10:56","13:37"],["20","11:24","14:05"],["22","12:14","15:05"],["24","13:20","16:04"],["26","13:54","16:37"],["28","14:20","17:06"],["30","14:57","17:36",1],["32","15:19","18:09"],["34","16:00","18:39"],["36","16:29","19:21"],["38","16:55","19:38"],["40","17:31","20:09"],["42","17:54","20:38"],["44","18:42","21:23"],["46","19:08","21:49",1],["48","19:47","22:31"],["50","20:47","23:28"]],
  // นาโกย่า → ทาคายาม่า (ไฮดะ) และขากลับ
  hidaOut:[["1","7:43","10:16"],["3","8:43","11:03"],["5","9:39","12:20"],["7","10:48","13:17"],["9","11:43","14:14"],["11","12:48","15:17"],["13","14:48","17:18"],["15","16:03","18:45"],["17","18:12","20:51"],["19","20:17","22:49"]],
  hidaBack:[["2","6:46","9:12"],["4","8:00","10:34"],["6","9:36","12:04"],["8","11:35","14:04"],["10","12:35","15:04"],["12","13:35","16:09"],["14","14:44","17:04"],["16","15:34","18:06"],["18","16:33","19:06"],["20","18:48","21:03"]],
  // รถบัส [ออก, ถึง, ธง]
  busKzSg:[["8:10","9:35"],["8:40","10:10"],["8:55","17:10",{bad:1}],["9:10","10:35"],["11:10","12:35"],["13:00","14:25"],["13:20","14:45"],["16:00","17:20"],["17:00","18:15"]],
  busSgKz:[["8:50","10:05"],["10:25","11:50"],["10:55","12:20"],["12:20","13:35"],["12:40","13:55"],["13:50","15:05"],["15:10","16:35"],["17:30","18:45"],["18:55","20:10",{w:1}]],
  busTkySg:[["7:50","8:50"],["8:20","9:20"],["8:50","9:40"],["10:50","11:40"],["11:20","12:20"],["11:50","13:02"],["12:50","13:50"],["13:20","14:20"],["13:50","15:02"],["14:30","15:30"],["14:50","16:02"],["16:30","17:30"],["17:50","18:47"],["19:00","19:57",{d:1}]],
  busSgTky:[["6:43","7:50"],["9:35","10:25"],["10:55","12:02"],["11:40","12:30"],["12:35","13:25"],["13:15","14:05"],["13:30","14:20"],["14:45","15:35"],["15:15","16:05"],["16:15","17:20"],["17:20","18:10"],["17:30","18:35"],["19:43","20:48",{d:1}]]
};
let SG={d:1,r:"kz",e:420,l:1350,s:150,ltd:0,sort:"stay",all:false,mode:"auto",P:{}},SGO=[];
try{SG={...SG,...JSON.parse(localStorage.getItem(SGK)||"{}")};localStorage.removeItem("osaka_plan_v1");localStorage.removeItem("osaka_places_v1")}catch(e){}
const sgSave=()=>{try{localStorage.setItem(SGK,JSON.stringify(SG))}catch(e){}};
const sgM=s=>{const a=s.split(":");return +a[0]*60+ +a[1]};
const sgT=m=>String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0");
const sgDur=m=>{const h=Math.floor(m/60),r=m%60;return (h?h+" ชม.":"")+(h&&r?" ":"")+(r?r+" นาที":"")||"0 นาที"};
const sgJ=t=>Math.floor(((t+324e5)%864e5)/6e4); // นาทีของวันตามเวลาญี่ปุ่น
function sgSet(k,v){SG[k]=k==="r"||k==="sort"||k==="mode"?v:+v;if(k!=="all")SG.all=false;if(k==="d"||k==="r"||k==="ltd")SG.P={};sgSave();renderPlan()}
function sgPick(k,v){if(v)SG.P[k]=+v;else delete SG.P[k];sgSave();renderPlan()}
function sgAdopt(i){const o=SGO[i];if(!o)return;SG.mode="manual";SG.P={t:o.T.d,b:o.B.d,r:o.R.d,u:o.U.d};sgSave();renderPlan();scrollTo(0,0)}
const sgCd=ts=>{const ms=ts-Date.now();if(ms<=0)return"ผ่านเวลานี้แล้ว";const d=Math.floor(ms/864e5),h=Math.floor(ms%864e5/36e5),m=Math.floor(ms%36e5/6e4);return(d?d+" วัน ":"")+h+" ชม. "+m+" นาที"};
function sgDay(){const t=F[0].arr+SG.d*864e5+324e5,x=new Date(t);return{m:x.getUTCMonth(),w:x.getUTCDay()}}

// หาชุดเดินทางที่เป็นไปได้ทั้งหมดจากเงื่อนไขที่เลือก
function sgLists(){
  const kz=SG.r==="kz",b=kz?SGB.kz:SGB.tky,ex=kz?0:SGX,dt=sgDay(),win=dt.m===11||dt.m<=2,wk=dt.w===0||dt.w===6,N=NIGHTS;
  let e=SG.e,l=SG.l;
  if(SG.d===0)e=Math.max(e,sgJ(F[0].arr)+150);          // วันแรก: เผื่อผ่านตม./รับกระเป๋า/เข้าเมือง
  if(SG.d===N)l=Math.min(l,sgJ(F[F.length-1].ap)-135);   // วันสุดท้าย: ต้องถึงโอซาก้าก่อนไปสนามบิน
  const ok=x=>{const f=x[2]||{};return !f.bad&&!(win&&f.w)&&!(wk&&f.d)};
  const tr=a=>a.filter(x=>SG.ltd||!x[3]).map(x=>({n:x[0],d:sgM(x[1]),a:sgM(x[2]),ltd:x[3]}));
  const bs=a=>a.filter(ok).map(x=>({d:sgM(x[0]),a:sgM(x[1]),f:x[2]||{}}));
  return{kz,b,ex,win,wk,N,e,l,out:tr(kz?SGD.tbOut:SGD.hidaOut),back:tr(kz?SGD.tbBack:SGD.hidaBack),go:bs(kz?SGD.busKzSg:SGD.busTkySg),rt:bs(kz?SGD.busSgKz:SGD.busSgTky)};
}
// หาชุดเดินทางที่เป็นไปได้ทั้งหมดจากเงื่อนไขที่เลือก
function sgBuild(){
  const L=sgLists(),{kz,b,ex,out,back,go,rt,e,l}=L,res=[];
  for(const B of go){
    const T=out.filter(t=>t.d-ex>=e&&t.a+b<=B.d).pop();   // รถไฟเที่ยวล่าสุดที่ยังทันบัสเที่ยวนี้
    if(!T)continue;
    for(const R of rt){
      if(R.d<B.a+SG.s)continue;
      const U=back.find(u=>u.d>=R.a+b);
      if(!U||U.a+ex>l)continue;
      res.push({T,B,R,U,leave:T.d-ex,home:U.a+ex,stay:R.d-B.a});
    }
  }
  res.sort(SG.sort==="early"?(p,q)=>p.home-q.home||q.stay-p.stay:(p,q)=>q.stay-p.stay||p.home-q.home);
  return{res,win:L.win,wk:L.wk,e,l,kz,N:L.N};
}
// โหมดเลือกเอง: เลือกขบวนทีละช่วง ระบบบอกเวลาที่เหลือ/ที่ขาดในแต่ละช่วงต่อรถ
function sgManual(){
  const L=sgLists(),{kz,b,ex,out,back,go,rt,l}=L,P=SG.P||{},mid=kz?"คานาซาวะ":"ทาคายาม่า";
  const T=out.find(x=>x.d===P.t),B=go.find(x=>x.d===P.b),R=rt.find(x=>x.d===P.r),U=back.find(x=>x.d===P.u);
  const sel=(k,arr,cur,fmt)=>`<select onchange="sgPick('${k}',this.value)"><option value="">– เลือก –</option>${arr.map(x=>`<option value="${x.d}" ${x.d===cur?"selected":""}>${fmt(x)}</option>`).join("")}</select>`;
  const hint=(x,min)=>min==null?"":x.d>=min?" ✓":" ⚠ ไม่ทัน";
  const f1=x=>kz?`${sgT(x.d)} ➔ ${sgT(x.a)} · Thunderbird ${x.n}${x.ltd?" ◆":""}`:`ออกโอซาก้า ${sgT(x.d-ex)} · ไฮดะ ${x.n} ${sgT(x.d)}➔${sgT(x.a)}${x.ltd?" ◆":""}`;
  const f4=x=>kz?`${sgT(x.d)} ➔ ถึงโอซาก้า ${sgT(x.a)} · Thunderbird ${x.n}${x.ltd?" ◆":""}`:`ไฮดะ ${x.n} ${sgT(x.d)}➔${sgT(x.a)} · ถึงโอซาก้า ≈${sgT(x.a+ex)}`;
  const g=x=>`${sgT(x.d)} ➔ ${sgT(x.a)}`;
  const ok=v=>`<b style="color:var(--grn)">${v}</b>`,bad=v=>`<b style="color:#b91c1c">${v}</b>`;
  const slack=m=>m>=0?ok("เหลือ "+sgDur(m)):bad("ไม่ทัน ขาด "+sgDur(-m));
  const rows=[];let good=true;
  if(T&&B){const m=B.d-(T.a+b);if(m<0)good=false;rows.push(`<div class="kv"><span>ต่อรถที่${mid} (เผื่อ ${b} นาที)</span>${slack(m)}</div>`)}
  if(B&&R){const m=R.d-B.a;if(m<0)good=false;rows.push(`<div class="kv"><span>เวลาเที่ยวที่ชิราคาวาโกะ</span>${m>=0?ok(sgDur(m)):bad("บัสกลับออกก่อนบัสไปถึง")}</div>`);if(m>=0)rows.push(`<div class="kv"><span>เทียบกับที่ตั้งไว้ (อย่างน้อย ${sgDur(SG.s)})</span>${m>=SG.s?ok("เกิน "+sgDur(m-SG.s)):bad("สั้นกว่า "+sgDur(SG.s-m))}</div>`)}
  if(R&&U){const m=U.d-(R.a+b);if(m<0)good=false;rows.push(`<div class="kv"><span>ต่อรถที่${mid}ขากลับ (เผื่อ ${b} นาที)</span>${slack(m)}</div>`)}
  if(U){const h=U.a+ex;rows.push(`<div class="kv"><span>ถึงโอซาก้า</span><b>${sgT(h)}</b></div><div class="kv"><span>เทียบเวลาที่ต้องกลับถึง (${sgT(l)})</span>${slack(l-h)}</div>`);if(h>l)good=false}
  if(T&&U)rows.push(`<div class="kv"><span>รวมเวลาเดินทางทั้งวัน</span><b>${sgDur((U.a+ex)-(T.d-ex))}</b></div>`);
  let cd="";
  if(T){const ts=Math.floor((F[0].arr+324e5)/864e5)*864e5-324e5+SG.d*864e5+(T.d-ex)*6e4;cd=`<div class="pinfo" style="background:#12301a">⏳ ออกจากโอซาก้า ${sgT(T.d-ex)} · เหลืออีก ${sgCd(ts)}</div>`}
  const full=T&&B&&R&&U&&good,o=full?{T,B,R,U,leave:T.d-ex,home:U.a+ex,stay:R.d-B.a}:null;
  if(o)SGO=[o];
  return `<div class="card fm" style="margin-top:12px"><div class="rvh" style="margin-top:0">✋ เลือกขบวนเอง</div>
    <label>1) ${kz?"Thunderbird ไปคานาซาวะ":"ขบวนไปทาคายาม่า"}${sel("t",out,P.t,f1)}</label>
    <label>2) รถบัสไปชิราคาวาโกะ${sel("b",go,P.b,x=>g(x)+hint(x,T?T.a+b:null))}</label>
    <label>3) รถบัสกลับ${mid}${sel("r",rt,P.r,x=>g(x)+hint(x,B?B.a:null))}</label>
    <label>4) ${kz?"Thunderbird กลับโอซาก้า":"ไฮดะกลับนาโกย่า"}${sel("u",back,P.u,x=>f4(x)+hint(x,R?R.a+b:null))}</label>
    <button class="btn o" style="min-height:42px;font-size:14px" onclick="SG.P={};sgSave();renderPlan()">ล้างที่เลือก</button></div>
  ${cd}${rows.length?`<div class="card" style="margin-top:10px"><div class="rvh" style="margin-top:0">⏱ เวลาที่เหลือในแต่ละช่วง</div>${rows.join("")}</div>`:`<div class="note" style="margin-top:10px">เลือกขบวนทีละช่วง ตัวเลือกที่ต่อไม่ทันจะมีป้าย ⚠ กำกับ แต่ยังเลือกได้</div>`}
  ${o?`<div class="card" style="margin-top:10px"><b>แผนของคุณ · อยู่ ${sgDur(o.stay)}</b><div class="tl">${sgSteps(o,kz).map(s=>`<div class="stp s"><div class="tt">${s[0]}</div><div class="sb"><b>${esc(s[1])}</b><small>${esc(s[2])}</small></div></div>`).join("")}</div><button class="btn o" style="min-height:42px;font-size:14px" onclick="sgCopy(0)">📋 คัดลอกแผนนี้ (ส่งเข้า LINE)</button></div>`:""}`;
}
function sgSteps(o,kz){
  const{T,B,R,U}=o,ltd=x=>x.ltd?" · ◆ วิ่งเฉพาะบางวัน ตรวจวันวิ่ง":"",mid=kz?"คานาซาวะ":"ทาคายาม่า";
  const wait=B.d-T.a,wait2=U.d-R.a;
  return[
    [sgT(o.leave),kz?"ออกจากสถานีโอซาก้า":"ออกจากโอซาก้า ต่อชินคันเซ็นไปนาโกย่า",kz?`JR Thunderbird ${T.n} ถึงคานาซาวะ ${sgT(T.a)}${ltd(T)}`:`ประมาณ ${sgDur(SGX)} (ไม่มีในไฟล์) แล้วขึ้นไฮดะ ${T.n} ออกนาโกย่า ${sgT(T.d)} ถึงทาคายาม่า ${sgT(T.a)}${ltd(T)}`],
    [sgT(B.d),`ขึ้นรถบัสที่${mid}ไปชิราคาวาโกะ`,`${kz?"ท่ารถบัสทางออกตะวันออก JR คานาซาวะ (ป้าย ②) · ":"ศูนย์รถบัสทาคายาม่า (Takayama Nohi Bus Center) · "}รอต่อรถ ${sgDur(wait)} หลังรถไฟถึง · บัสถึง ${sgT(B.a)}`],
    [sgT(B.a),"🏯 ถึงชิราคาวาโกะ",`มีเวลาเที่ยว ${sgDur(o.stay)} (จนถึง ${sgT(R.d)}) · ท่ารถอยู่ที่ Shirakawa-go Bus Terminal`],
    [sgT(R.d),`ขึ้นรถบัสกลับ${mid}`,`ถึง${mid} ${sgT(R.a)}${R.f.n?" · "+R.f.n:""}${R.f.d?" · ◆ ไม่วิ่งเสาร์ อาทิตย์ วันหยุด":""}`],
    [sgT(U.d),kz?`JR Thunderbird ${U.n} กลับโอซาก้า`:`ไฮดะ ${U.n} ไปนาโกย่า แล้วต่อกลับโอซาก้า`,`รอต่อรถ ${sgDur(wait2)} · ถึงโอซาก้า ${sgT(o.home)}${kz?"":" (รวมเวลาชินคันเซ็นโดยประมาณ)"}${ltd(U)}`]
  ];
}
function sgCopy(i){
  const o=SGO[i];if(!o)return;const kz=SG.r==="kz";
  const t=`🏯 ไปชิราคาวาโกะ (${kz?"ผ่านคานาซาวะ":"ผ่านนาโกย่า-ทาคายาม่า"})\n`+sgSteps(o,kz).map(s=>`${s[0]} ${s[1]}\n   ${s[2]}`).join("\n")+`\n⚠️ ตารางจากไฟล์ ณ เม.ย. 2023 ตรวจเวลาและจองรถบัสก่อนเดินทาง`;
  navigator.clipboard?navigator.clipboard.writeText(t).then(()=>toast("คัดลอกแผนแล้ว"),()=>toast("คัดลอกไม่สำเร็จ")):toast("คัดลอกไม่ได้");
}
function sgTable(){
  const kz=SG.r==="kz",row=(a,lab)=>`<div class="rvh">${lab}</div>`+a.map(x=>{const f=x[2]||{};return `<div class="kv"><span>${x[0]} ➔ ${x[1]}</span><b style="font-size:13px;font-weight:400;text-align:right">${f.bad?"⚠️ ไฟล์พิมพ์ 17:10 น่าจะผิด ไม่ใช้คำนวณ":f.w?"△ หยุด 1 ธ.ค.–31 มี.ค.":f.d?"◆ ไม่วิ่งเสาร์ อาทิตย์ วันหยุด":""}</b></div>`}).join("");
  const tt=(a,lab)=>`<div class="rvh">${lab}</div>`+a.map(x=>`<div class="kv"><span>${x[0]}</span><b style="font-weight:400">${x[1]} ➔ ${x[2]}${x[3]?" ◆":""}</b></div>`).join("");
  openSheet("ตารางจากไฟล์ (เม.ย. 2023)",(kz?row(SGD.busKzSg,"🚌 คานาซาวะ ➔ ชิราคาวาโกะ")+row(SGD.busSgKz,"🚌 ชิราคาวาโกะ ➔ คานาซาวะ")+tt(SGD.tbOut,"🚆 Thunderbird โอซาก้า ➔ คานาซาวะ")+tt(SGD.tbBack,"🚆 Thunderbird คานาซาวะ ➔ โอซาก้า"):row(SGD.busTkySg,"🚌 ทาคายาม่า ➔ ชิราคาวาโกะ")+row(SGD.busSgTky,"🚌 ชิราคาวาโกะ ➔ ทาคายาม่า")+tt(SGD.hidaOut,"🚆 ไฮดะ นาโกย่า ➔ ทาคายาม่า")+tt(SGD.hidaBack,"🚆 ไฮดะ ทาคายาม่า ➔ นาโกย่า"))+`<div class="note">◆ ที่ท้ายรถไฟ = วิ่งเฉพาะบางวัน · เวลาบางขบวนของวันเสาร์/วันหยุดต่างจากนี้ 1–2 นาที</div>`);
}
function renderPlan(){
  const{res,win,wk,e,l,kz,N}=sgBuild();SGO=res;
  const fd=i=>new Date(F[0].arr+i*864e5).toLocaleDateString("th-TH",{timeZone:"Asia/Tokyo",weekday:"short",day:"numeric",month:"short"});
  const opt=(a,v,f)=>a.map(x=>`<option value="${x[0]}" ${x[0]===v?"selected":""}>${f(x[0])}</option>`).join("");
  const range=(a,b,s)=>{const r=[];for(let m=a;m<=b;m+=s)r.push([m]);return r};
  const days=Array.from({length:N+1},(_,i)=>[i]),shown=SG.all?res:res.slice(0,6);
  const info=[SG.d===0?`🛬 วันแรก เครื่องลง ${tm(F[0].arr,"Asia/Tokyo")} ระบบเผื่อเวลาเข้าเมือง เริ่มออกจากโอซาก้าได้ไม่เร็วกว่า ${sgT(e)}`:"",SG.d===N?`🛫 วันสุดท้าย เครื่องออก ${tm(F[F.length-1].dep,"Asia/Tokyo")} ต้องกลับถึงโอซาก้าไม่เกิน ${sgT(l)}`:""].filter(Boolean);
  $("plan").innerHTML=`<h1>🏯 ไปชิราคาวาโกะ</h1><p class="sub">เลือกวันและเวลา ระบบหาเที่ยวรถไฟ+รถบัสไป-กลับวันเดียวจากโอซาก้าให้ จากตารางในไฟล์ที่อัปโหลด</p>
  <div class="pinfo" style="background:#7a4b00">⚠️ ตารางในไฟล์เป็นข้อมูล ณ เม.ย. 2023 ก่อนเดินทางจริงตรวจเวลาล่าสุดและจองที่นั่งรถบัส (ไฟล์ระบุว่าหลายเที่ยวต้องจองล่วงหน้า)</div>
  <div class="card fm" style="margin-top:10px">
    <label>วันที่ไป<select onchange="sgSet('d',this.value)">${opt(days,SG.d,i=>fd(i)+(i===0?" · วันถึง":i===N?" · วันกลับ":""))}</select></label>
    <div class="chips" style="padding-top:0"><button class="chip ${SG.mode==="auto"?"on":""}" onclick="sgSet('mode','auto')">🪄 ให้ระบบเลือก</button><button class="chip ${SG.mode==="manual"?"on":""}" onclick="sgSet('mode','manual')">✋ เลือกขบวนเอง</button></div>
    <div class="note" style="margin:0 0 4px">เส้นทาง</div>
    <div class="chips" style="padding-top:0"><button class="chip ${kz?"on":""}" onclick="sgSet('r','kz')">🚆 ผ่านคานาซาวะ</button><button class="chip ${kz?"":"on"}" onclick="sgSet('r','tky')">🚆 ผ่านนาโกย่า–ทาคายาม่า</button></div>
    <div class="g2"><label>ถึงสถานีโอซาก้าได้เร็วสุด<select onchange="sgSet('e',this.value)">${opt(range(300,720,30),SG.e,sgT)}</select></label>
    <label>ต้องกลับถึงโอซาก้าก่อน<select onchange="sgSet('l',this.value)">${opt(range(1080,1440,30),SG.l,sgT)}</select></label></div>
    <label style="${SG.mode==="manual"?"":""}">อยู่ชิราคาวาโกะอย่างน้อย${SG.mode==="manual"?" (ใช้เทียบในโหมดเลือกเอง)":""}<select onchange="sgSet('s',this.value)">${opt([[60],[90],[120],[150],[180],[240],[300]],SG.s,sgDur)}</select></label>
    <div class="chips" style="padding-top:0"><button class="chip ${SG.ltd?"on":""}" onclick="sgSet('ltd',${SG.ltd?0:1})">${SG.ltd?"✓ ":""}รวมขบวนรถไฟ ◆ (วิ่งเฉพาะบางวัน)</button></div>
    <div class="note" style="margin:0">${kz?"คานาซาวะเป็นเส้นทางหลักจากโอซาก้า (Thunderbird ราว 2 ชม. 45 นาที + บัสราว 1 ชม. 15–25 นาที)":"ต้องต่อชินคันเซ็นจากชินโอซาก้าไปนาโกย่าก่อน ส่วนนี้ไม่มีในไฟล์ ระบบใช้ค่าประมาณรวม ${SGX} นาที (ชินคันเซ็น Nozomi ราว 50 นาที + เปลี่ยนสถานี) ตรวจเที่ยวจริงใน Jorudan/Navitime"}</div>
  </div>
  ${info.map(x=>`<div class="pinfo">${x}</div>`).join("")}
  ${win?`<div class="pinfo" style="background:#12301a">❄️ ช่วง 1 ธ.ค.–31 มี.ค. ไฟล์ระบุว่าบัสบางเที่ยว (△) หยุด และไม่จอดป้ายโกกายามะ-สุกานุมะ ระบบตัดเที่ยวที่หยุดออกให้แล้ว</div>`:""}
  ${wk?`<div class="pinfo" style="background:#12301a">📅 วันนี้เป็นเสาร์/อาทิตย์ ระบบตัดบัสเที่ยว ◆ (ไม่วิ่งเสาร์ อาทิตย์ วันหยุด) ออกให้แล้ว วันหยุดนักขัตฤกษ์ให้เช็กเพิ่มเอง</div>`:""}
  ${SG.mode==="manual"?sgManual():`${res.length?`<div style="display:flex;justify-content:space-between;align-items:center;margin:14px 0 4px"><b>พบ ${res.length} แบบ</b><div class="chips" style="padding:0"><button class="chip ${SG.sort==="stay"?"on":""}" onclick="sgSet('sort','stay')">อยู่นานสุด</button><button class="chip ${SG.sort==="early"?"on":""}" onclick="sgSet('sort','early')">กลับเร็วสุด</button></div></div>`:`<div class="card" style="margin-top:12px">ไม่พบเที่ยวที่เข้าเงื่อนไข ลองลดเวลาที่อยู่ที่ชิราคาวาโกะ ขยับเวลากลับให้ดึกขึ้น หรือเลือกวันอื่น</div>`}
  ${shown.map((o,i)=>`<div class="card" style="margin-top:10px"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b>${i===0?"⭐ ":""}แบบที่ ${i+1} · อยู่ ${sgDur(o.stay)}</b><span class="note" style="margin:0">กลับถึง ${sgT(o.home)}</span></div>
    <div class="tl">${sgSteps(o,kz).map(s=>`<div class="stp s"><div class="tt">${s[0]}</div><div class="sb"><b>${esc(s[1])}</b><small>${esc(s[2])}</small></div></div>`).join("")}</div>
    <button class="btn o" style="min-height:42px;font-size:14px" onclick="sgCopy(${SGO.indexOf(o)})">📋 คัดลอกแผนนี้ (ส่งเข้า LINE)</button><button class="btn o" style="min-height:42px;font-size:14px;margin-top:6px" onclick="sgAdopt(${SGO.indexOf(o)})">✏️ ปรับแผนนี้เอง</button></div>`).join("")}
  ${res.length>6?`<button class="btn o" style="margin-top:10px" onclick="SG.all=!SG.all;renderPlan()">${SG.all?"แสดงเฉพาะ 6 แบบแรก":"แสดงทั้งหมด "+res.length+" แบบ"}</button>`:""}
  `}
  <button class="btn o" style="margin-top:10px" onclick="sgTable()">📄 ดูตารางเที่ยวรถที่ใช้คำนวณ</button>
  <div class="note">เวลาเผื่อเปลี่ยนรถ: ${kz?SGB.kz:SGB.tky} นาที (ค่าประมาณ ไม่อยู่ในไฟล์) · ระบบเลือกรถไฟเที่ยวล่าสุดที่ยังทันบัส และรถไฟขากลับเที่ยวแรกที่ทัน · เที่ยวบัส 8:55 จากคานาซาวะถูกตัดออก เพราะเวลาถึงในไฟล์พิมพ์เป็น 17:10 น่าจะผิด</div>`;
}
