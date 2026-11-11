// แท็บชิราคาวาโกะ: จัดแผนไป-กลับวันเดียว หรือค้าง 1 คืน (พักที่ชิราคาวาโกะ / พักที่คานาซาวะ-ทาคายาม่า) จากโอซาก้า ใช้ตารางจากไฟล์ Bus_JR_Line_Timetable (ข้อมูล ณ เม.ย. 2023)
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
// n: 0=ไป-กลับวันเดียว 1=ค้าง 1 คืน · o: sg=พักที่ชิราคาวาโกะ mid=พักที่คานาซาวะ/ทาคายาม่า · m: วันที่ 2 ไม่ออกเดินทางก่อนเวลานี้ (นาที)
let SG={d:1,r:"kz",e:420,l:1350,s:150,ltd:0,sort:"stay",all:false,mode:"auto",n:0,o:"sg",m:540,P:{}},SGO=[];
try{SG={...SG,...JSON.parse(localStorage.getItem(SGK)||"{}")};localStorage.removeItem("osaka_plan_v1");localStorage.removeItem("osaka_places_v1")}catch(e){}
const sgSave=()=>{try{localStorage.setItem(SGK,JSON.stringify(SG))}catch(e){}};
const sgM=s=>{const a=s.split(":");return +a[0]*60+ +a[1]};
const sgT=m=>String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0");
const sgDur=m=>{const h=Math.floor(m/60),r=m%60;return (h?h+" ชม.":"")+(h&&r?" ":"")+(r?r+" นาที":"")||"0 นาที"};
const sgJ=t=>Math.floor(((t+324e5)%864e5)/6e4); // นาทีของวันตามเวลาญี่ปุ่น
const sgFd=i=>new Date(F[0].arr+i*864e5).toLocaleDateString("th-TH",{timeZone:"Asia/Tokyo",weekday:"short",day:"numeric",month:"short"});
function sgSet(k,v){
  SG[k]=k==="r"||k==="sort"||k==="mode"||k==="o"?v:+v;
  if(k!=="all")SG.all=false;
  if(k==="n"&&SG.n&&SG.d>=NIGHTS)SG.d=Math.max(0,NIGHTS-1);   // ค้างคืนต้องมีวันถัดไป
  if(k==="d"||k==="r"||k==="ltd"||k==="n"||k==="o")SG.P={};
  sgSave();renderPlan()}
function sgPick(k,v){if(v)SG.P[k]=+v;else delete SG.P[k];sgSave();renderPlan()}
function sgAdopt(i){const o=SGO[i];if(!o)return;SG.mode="manual";SG.P={t:o.T.d,b:o.B.d,r:o.R.d,u:o.U.d};sgSave();renderPlan();scrollTo(0,0)}
const sgCd=ts=>{const ms=ts-Date.now();if(ms<=0)return"ผ่านเวลานี้แล้ว";const d=Math.floor(ms/864e5),h=Math.floor(ms%864e5/36e5),m=Math.floor(ms%36e5/6e4);return(d?d+" วัน ":"")+h+" ชม. "+m+" นาที"};
function sgDay(i){const t=F[0].arr+(i==null?SG.d:i)*864e5+324e5,x=new Date(t);return{m:x.getUTCMonth(),w:x.getUTCDay()}}

// รายการเที่ยวรถของวันที่ i (ดัชนีวันนับจากวันถึง) ตามเงื่อนไขที่เลือก
function sgLists(i){
  if(i==null)i=SG.d;
  const kz=SG.r==="kz",b=kz?SGB.kz:SGB.tky,ex=kz?0:SGX,dt=sgDay(i),win=dt.m===11||dt.m<=2,wk=dt.w===0||dt.w===6,N=NIGHTS;
  let e=SG.e,l=SG.l;
  if(i===0)e=Math.max(e,sgJ(F[0].arr)+150);          // วันแรก: เผื่อผ่านตม./รับกระเป๋า/เข้าเมือง
  if(i===N)l=Math.min(l,sgJ(F[F.length-1].ap)-135);   // วันสุดท้าย: ต้องถึงโอซาก้าก่อนไปสนามบิน
  const ok=x=>{const f=x[2]||{};return !f.bad&&!(win&&f.w)&&!(wk&&f.d)};
  const tr=a=>a.filter(x=>SG.ltd||!x[3]).map(x=>({n:x[0],d:sgM(x[1]),a:sgM(x[2]),ltd:x[3]}));
  const bs=a=>a.filter(ok).map(x=>({d:sgM(x[0]),a:sgM(x[1]),f:x[2]||{}}));
  return{kz,b,ex,win,wk,N,e,l,i,out:tr(kz?SGD.tbOut:SGD.hidaOut),back:tr(kz?SGD.tbBack:SGD.hidaBack),go:bs(kz?SGD.busKzSg:SGD.busTkySg),rt:bs(kz?SGD.busSgKz:SGD.busSgTky)};
}
// รายการวัน 1 / วัน 2 และโหมดค้างคืน (ใช้ร่วมกันทั้งโหมดอัตโนมัติและเลือกเอง)
function sgCtx(){
  const ov=!!SG.n&&SG.d<NIGHTS,sg=ov&&SG.o==="sg",L=sgLists(SG.d),L2=ov?sgLists(SG.d+1):L;
  return{ov,sg,L,L2,rt:sg?L2.rt:L.rt,back:ov?L2.back:L.back,l:L2.l};
}
// หาชุดเดินทางที่เป็นไปได้ทั้งหมดจากเงื่อนไขที่เลือก
function sgBuild(){
  const C=sgCtx(),{ov,sg,L,L2}=C,{kz,b,ex,out,go,e}=L,res=[];
  for(const B of go){
    const T=out.filter(t=>t.d-ex>=e&&t.a+b<=B.d).pop();   // รถไฟเที่ยวล่าสุดที่ยังทันบัสเที่ยวนี้
    if(!T)continue;
    if(sg){
      // ค้างที่ชิราคาวาโกะ: วันที่ 2 ขึ้นบัสกลับไม่เร็วกว่าเวลาที่ตั้ง แล้วต่อรถไฟกลับ
      for(const R of L2.rt){
        if(R.d<SG.m)continue;
        const U=L2.back.find(u=>u.d>=R.a+b);
        if(!U||U.a+ex>L2.l)continue;
        res.push({T,B,R,U,ov,os:"sg",leave:T.d-ex,home:U.a+ex,stay:1440-B.a+R.d});
      }
    }else{
      // ไป-กลับวันเดียว หรือ ค้างที่เมืองต้นทาง (คานาซาวะ/ทาคายาม่า): วันแรกกลับบัสมาที่เมือง
      for(const R of L.rt){
        if(R.d<B.a+SG.s)continue;
        const U=ov?L2.back.find(u=>u.d>=SG.m):L.back.find(u=>u.d>=R.a+b);
        if(!U||U.a+ex>C.l)continue;
        res.push({T,B,R,U,ov,os:"mid",leave:T.d-ex,home:U.a+ex,stay:R.d-B.a});
      }
    }
  }
  res.sort(SG.sort==="early"?(p,q)=>p.home-q.home||q.stay-p.stay:(p,q)=>q.stay-p.stay||p.home-q.home);
  return{res,win:L.win||L2.win,wk:L.wk||L2.wk,e,l:C.l,kz,N:L.N,ov,sg};
}
// โหมดเลือกเอง: เลือกขบวนทีละช่วง ระบบบอกเวลาที่เหลือ/ที่ขาดในแต่ละช่วงต่อรถ
function sgManual(){
  const C=sgCtx(),{ov,sg,L,rt,back,l}=C,{kz,b,ex,out,go}=L,P=SG.P||{},mid=kz?"คานาซาวะ":"ทาคายาม่า";
  const T=out.find(x=>x.d===P.t),B=go.find(x=>x.d===P.b),R=rt.find(x=>x.d===P.r),U=back.find(x=>x.d===P.u);
  const conn=!ov||sg;   // ต่อรถไฟขากลับต่อจากบัสในวันเดียวกันหรือไม่ (ค้างที่เมืองต้นทางไม่ต้องต่อ)
  const ok=v=>`<b style="color:var(--grn)">${v}</b>`,bad=v=>`<b style="color:#b91c1c">${v}</b>`;
  const slack=m=>m>=0?ok("เหลือ "+sgDur(m)):bad("ไม่ทัน ขาด "+sgDur(-m));
  // ปุ่มเลือกขบวน: เวลาออกตัวใหญ่ + บรรทัดรอง (ถึงกี่โมง) + บรรทัดสถานะ (รอกี่นาที / ไม่ทัน) แตะซ้ำเพื่อยกเลิก
  const chip=(k,x,main,sub,st)=>`<button class="ob ${x.d===P[k]?"on":""} ${st&&st[0]==="w"&&st[2]?"no":""}" onclick="sgPick('${k}',${x.d===P[k]?0:x.d})"><b>${main}</b><small>${sub}</small>${st?`<small class="${st[0]}">${st[1]}</small>`:""}</button>`;
  const st=(prev,min,x,txtOk)=>prev?(x.d>=min?["ok",txtOk(x.d-min)]:["w","⚠ ไม่ทัน",1]):null;
  const s1=out.map(x=>chip("t",x,sgT(x.d-ex),kz?`ถึง ${sgT(x.a)}${x.ltd?" · ◆":""}`:`ไฮดะ ${x.n} · ถึง ${sgT(x.a)}${x.ltd?" ◆":""}`,null));
  const s2=go.map(x=>chip("b",x,sgT(x.d),`ถึง ${sgT(x.a)}`,st(T,T&&T.a+b,x,m=>"รอ "+sgDur(m))));
  const s3=rt.map(x=>chip("r",x,sgT(x.d),`ถึง ${sgT(x.a)}`,sg?null:B?(x.d>=B.a?["ok","อยู่ "+sgDur(x.d-B.a)]:["w","⚠ ก่อนบัสถึง",1]):null));
  const s4=back.map(x=>{const h=x.a+ex,late=h>l;return chip("u",x,sgT(x.d),`ถึงโอซาก้า ${kz?"":"≈"}${sgT(h)}${x.ltd?" ◆":""}`,conn&&R&&x.d<R.a+b?["w","⚠ ไม่ทัน",1]:late?["w","เกินเวลากลับ",1]:conn&&R?["ok","รอ "+sgDur(x.d-(R.a+b))]:null)});
  const step=(n,t,arr,empty)=>`<div class="stl"><span class="sn">${n}</span>${t}</div>${arr.length?`<div class="og">${arr.join("")}</div>`:`<div class="note">${empty}</div>`}`;
  const rows=[];let good=true;
  if(T&&B){const m=B.d-(T.a+b);if(m<0)good=false;rows.push(`<div class="kv"><span>ต่อรถที่${mid} (เผื่อ ${b} นาที)</span>${slack(m)}</div>`)}
  if(B&&R){
    if(sg)rows.push(`<div class="kv"><span>เวลาอยู่ชิราคาวาโกะ (ข้ามคืน)</span>${ok(sgDur(1440-B.a+R.d))}</div>`);
    else{const m=R.d-B.a;if(m<0)good=false;rows.push(`<div class="kv"><span>เวลาเที่ยวที่ชิราคาวาโกะ${ov?" (วันที่ 1)":""}</span>${m>=0?ok(sgDur(m)):bad("บัสกลับออกก่อนบัสไปถึง")}</div>`);if(m>=0)rows.push(`<div class="kv"><span>เทียบกับที่ตั้งไว้ (อย่างน้อย ${sgDur(SG.s)})</span>${m>=SG.s?ok("เกิน "+sgDur(m-SG.s)):bad("สั้นกว่า "+sgDur(SG.s-m))}</div>`)}
  }
  if(R&&U&&conn){const m=U.d-(R.a+b);if(m<0)good=false;rows.push(`<div class="kv"><span>ต่อรถที่${mid}ขากลับ (เผื่อ ${b} นาที)</span>${slack(m)}</div>`)}
  if(R&&!sg&&ov)rows.push(`<div class="kv"><span>ถึง${mid} วันที่ 1 (เข้าที่พัก)</span><b>${sgT(R.a)}</b></div>`);
  if(U){const h=U.a+ex;rows.push(`<div class="kv"><span>ถึงโอซาก้า</span><b>${sgT(h)}</b></div><div class="kv"><span>เทียบเวลาที่ต้องกลับถึง (${sgT(l)})</span>${slack(l-h)}</div>`);if(h>l)good=false}
  if(T&&U&&!ov)rows.push(`<div class="kv"><span>รวมเวลาเดินทางทั้งวัน</span><b>${sgDur((U.a+ex)-(T.d-ex))}</b></div>`);
  let cd="";
  if(T){const ts=Math.floor((F[0].arr+324e5)/864e5)*864e5-324e5+SG.d*864e5+(T.d-ex)*6e4;cd=`<div class="pinfo" style="background:#12301a">⏳ ออกจากโอซาก้า ${sgT(T.d-ex)} · เหลืออีก ${sgCd(ts)}</div>`}
  const full=T&&B&&R&&U&&good,o=full?{T,B,R,U,ov,os:SG.o,leave:T.d-ex,home:U.a+ex,stay:sg?1440-B.a+R.d:R.d-B.a}:null;
  if(o)SGO=[o];
  const dl=n=>ov?` · วันที่ ${n}`:"";
  return `<div class="card" style="margin-top:12px"><div style="display:flex;justify-content:space-between;align-items:center"><b>✋ เลือกขบวนเอง</b><button class="chip" style="min-height:34px" onclick="SG.P={};sgSave();renderPlan()">ล้างที่เลือก</button></div>
    <div class="note" style="margin:4px 0 0">แตะเพื่อเลือก แตะซ้ำเพื่อยกเลิก · ตัวใหญ่คือเวลาออก ตัวที่จางคือต่อรถไม่ทัน (ยังเลือกได้)</div>
    ${step(1,(kz?"รถไฟจากโอซาก้า (เวลาออกจากโอซาก้า)":"ออกจากโอซาก้า (ชินคันเซ็น + ไฮดะ)")+dl(1),s1,"ไม่มีเที่ยว")}
    ${step(2,`รถบัสจาก${mid}ไปชิราคาวาโกะ`+dl(1),s2,"ไม่มีบัสในวันนี้")}
    ${step(3,`รถบัสกลับจากชิราคาวาโกะไป${mid}`+dl(sg?2:1),s3,"ไม่มีบัสในวันนี้")}
    ${step(4,(kz?"รถไฟกลับโอซาก้า":"ไฮดะกลับนาโกย่า แล้วต่อกลับโอซาก้า")+dl(2),s4,"ไม่มีเที่ยว")}</div>
  ${cd}${rows.length?`<div class="card" style="margin-top:10px"><div class="rvh" style="margin-top:0">⏱ เวลาที่เหลือในแต่ละช่วง</div>${rows.join("")}</div>`:""}
  ${o?`<div class="card" style="margin-top:10px"><b>แผนของคุณ · ${ov?"ค้าง 1 คืน · ":""}อยู่ ${sgDur(o.stay)}</b><div class="tl">${sgSteps(o,kz).map(s=>`<div class="stp s"><div class="tt">${s[0]}</div><div class="sb"><b>${esc(s[1])}</b><small>${esc(s[2])}</small></div></div>`).join("")}</div><button class="btn o" style="min-height:42px;font-size:14px" onclick="sgCopy(0)">📋 คัดลอกแผนนี้ (ส่งเข้า LINE)</button></div>`:""}`;
}
function sgSteps(o,kz){
  const{T,B,R,U}=o,ltd=x=>x.ltd?" · ◆ วิ่งเฉพาะบางวัน ตรวจวันวิ่ง":"",mid=kz?"คานาซาวะ":"ทาคายาม่า",ov=!!o.ov,sg=ov&&o.os==="sg";
  const wait=B.d-T.a,wait2=U.d-R.a,d1=SG.d;
  const s=[
    [sgT(o.leave),kz?"ออกจากสถานีโอซาก้า":"ออกจากโอซาก้า ต่อชินคันเซ็นไปนาโกย่า",kz?`JR Thunderbird ${T.n} ถึงคานาซาวะ ${sgT(T.a)}${ltd(T)}`:`ประมาณ ${sgDur(SGX)} (ไม่มีในไฟล์) แล้วขึ้นไฮดะ ${T.n} ออกนาโกย่า ${sgT(T.d)} ถึงทาคายาม่า ${sgT(T.a)}${ltd(T)}`],
    [sgT(B.d),`ขึ้นรถบัสที่${mid}ไปชิราคาวาโกะ`,`${kz?"ท่ารถบัสทางออกตะวันออก JR คานาซาวะ (ป้าย ②) · ":"ศูนย์รถบัสทาคายาม่า (Takayama Nohi Bus Center) · "}รอต่อรถ ${sgDur(wait)} หลังรถไฟถึง · บัสถึง ${sgT(B.a)}`],
    [sgT(B.a),"🏯 ถึงชิราคาวาโกะ",sg?"เที่ยวต่อได้จนค่ำ แล้วเข้าที่พัก · ท่ารถอยู่ที่ Shirakawa-go Bus Terminal":`มีเวลาเที่ยว ${sgDur(o.stay)} (จนถึง ${sgT(R.d)}) · ท่ารถอยู่ที่ Shirakawa-go Bus Terminal`]
  ];
  if(sg)s.push(["🌙","พักค้างคืนที่ชิราคาวาโกะ",`${sgFd(d1)} → ${sgFd(d1+1)} · ต้องจองมินชุกุล่วงหน้า · วันที่ 2 ออกจากหมู่บ้านด้วยบัส ${sgT(R.d)}`]);
  s.push([sgT(R.d),`ขึ้นรถบัสกลับ${mid}`,`ถึง${mid} ${sgT(R.a)}${R.f.n?" · "+R.f.n:""}${R.f.d?" · ◆ ไม่วิ่งเสาร์ อาทิตย์ วันหยุด":""}`]);
  if(ov&&!sg)s.push(["🌙",`พักค้างคืนที่${mid}`,`${sgFd(d1)} → ${sgFd(d1+1)} · ถึง ${sgT(R.a)} เข้าที่พักได้เลย · เช้าวันที่ 2 เที่ยวในเมืองได้จนถึงเวลาขึ้นรถไฟ`]);
  s.push([sgT(U.d),kz?`JR Thunderbird ${U.n} กลับโอซาก้า`:`ไฮดะ ${U.n} ไปนาโกย่า แล้วต่อกลับโอซาก้า`,`${ov&&!sg?"":"รอต่อรถ "+sgDur(wait2)+" · "}ถึงโอซาก้า ${sgT(o.home)}${kz?"":" (รวมเวลาชินคันเซ็นโดยประมาณ)"}${ltd(U)}`]);
  return s;
}
function sgCopy(i){
  const o=SGO[i];if(!o)return;const kz=SG.r==="kz",sg=o.ov&&o.os==="sg";
  const t=`🏯 ไปชิราคาวาโกะ${o.ov?" ค้าง 1 คืน"+(sg?"ที่หมู่บ้าน":"ที่"+(kz?"คานาซาวะ":"ทาคายาม่า")):""} (${kz?"ผ่านคานาซาวะ":"ผ่านนาโกย่า-ทาคายาม่า"})\n`+sgSteps(o,kz).map(s=>`${s[0]} ${s[1]}\n   ${s[2]}`).join("\n")+`\n⚠️ ตารางจากไฟล์ ณ เม.ย. 2023 ตรวจเวลาและจองรถบัสก่อนเดินทาง${sg?" · อย่าลืมจองที่พัก":""}`;
  navigator.clipboard?navigator.clipboard.writeText(t).then(()=>toast("คัดลอกแผนแล้ว"),()=>toast("คัดลอกไม่สำเร็จ")):toast("คัดลอกไม่ได้");
}
function sgTable(){
  const C=sgCtx(),{ov,sg}=C,kz=SG.r==="kz",i1=SG.d,i2=sg?SG.d+1:SG.d,mid=kz?"คานาซาวะ":"ทาคายาม่า";
  const fl=i=>{const dt=sgDay(i);return{win:dt.m===11||dt.m<=2,wk:dt.w===0||dt.w===6}};
  const why=(f,i)=>{const{win,wk}=fl(i);return f.bad?"⚠ ไฟล์พิมพ์ผิด ไม่ใช้":win&&f.w?"△ หยุดช่วงนี้":wk&&f.d?"◆ เสาร์-อาทิตย์ไม่วิ่ง":""};
  const bus=(a,t,i)=>`<div class="rvh" style="margin-top:14px">${t} <span class="note">(${a.filter(x=>!why(x[2]||{},i)).length}/${a.length} เที่ยวใช้ได้${ov?" · ตามวันที่ "+sgFd(i):""})</span></div><div class="tg">${a.map(x=>{const f=x[2]||{},w=why(f,i);return `<div class="tc ${w?"no":""}"><b>${x[0]}</b> ➔ ${x[1]}${w?`<small style="text-decoration:none">${w}</small>`:""}</div>`}).join("")}</div>`;
  const trn=(a,t,pre)=>`<details class="dt"><summary>${t} <span class="note">(${a.length} ขบวน)</span></summary><div class="tg" style="margin-top:8px">${a.map(x=>`<div class="tc"><b>${x[1]}</b> ➔ ${x[2]}<small>${pre} ${x[0]}${x[3]?" · ◆ บางวัน":""}</small></div>`).join("")}</div></details>`;
  const f1=fl(i1),f2=fl(i2),win=f1.win||f2.win,wk=f1.wk||f2.wk;
  openSheet("ตารางเที่ยวรถ ("+(kz?"คานาซาวะ":"ทาคายาม่า")+")",
    `<div class="note" style="margin:0">ข้อมูลจากไฟล์ PDF ณ เม.ย. 2023 · วันที่เลือก: ${win?"อยู่ในช่วงหยุด △ ":""}${wk?"เสาร์/อาทิตย์ ":""}${!win&&!wk?"ไม่มีข้อจำกัดพิเศษ":""}${win||wk?"(เที่ยวที่ใช้ไม่ได้จะจางและขีดฆ่า)":""}</div>`
    +(kz?bus(SGD.busKzSg,"🚌 คานาซาวะ ➔ ชิราคาวาโกะ",i1)+bus(SGD.busSgKz,"🚌 ชิราคาวาโกะ ➔ คานาซาวะ",i2):bus(SGD.busTkySg,"🚌 ทาคายาม่า ➔ ชิราคาวาโกะ",i1)+bus(SGD.busSgTky,"🚌 ชิราคาวาโกะ ➔ ทาคายาม่า",i2))
    +`<div class="rvh" style="margin-top:14px">🚆 รถไฟ (แตะเพื่อเปิด)</div>`
    +(kz?trn(SGD.tbOut,"โอซาก้า ➔ คานาซาวะ","Thunderbird")+trn(SGD.tbBack,"คานาซาวะ ➔ โอซาก้า","Thunderbird"):trn(SGD.hidaOut,"นาโกย่า ➔ ทาคายาม่า","ไฮดะ")+trn(SGD.hidaBack,"ทาคายาม่า ➔ นาโกย่า","ไฮดะ"))
    +`<div class="note">◆ = วิ่งเฉพาะบางวัน · เวลาบางขบวนของวันเสาร์/วันหยุดต่างจากนี้ 1–2 นาที${kz?"":" · ส่วนชินคันเซ็นโอซาก้า↔นาโกย่าไม่อยู่ในไฟล์"}</div>`);
}
function renderPlan(){
  if(SG.n&&SG.d>=NIGHTS){SG.d=Math.max(0,NIGHTS-1);SG.P={};sgSave()}
  const{res,win,wk,e,l,kz,N,ov,sg}=sgBuild(),mid=kz?"คานาซาวะ":"ทาคายาม่า";SGO=res;
  const opt=(a,v,f)=>a.map(x=>`<option value="${x[0]}" ${x[0]===v?"selected":""}>${f(x[0])}</option>`).join("");
  const range=(a,b,s)=>{const r=[];for(let m=a;m<=b;m+=s)r.push([m]);return r};
  const days=Array.from({length:N+1-(ov?1:0)},(_,i)=>[i]),shown=SG.all?res:res.slice(0,6),lastD=ov?SG.d+1:SG.d;
  const dlab=i=>ov?sgFd(i)+" → "+sgFd(i+1)+(i===0?" · เริ่มวันถึง":i+1===N?" · กลับวันสุดท้าย":""):sgFd(i)+(i===0?" · วันถึง":i===N?" · วันกลับ":"");
  const info=[SG.d===0?`🛬 วันแรก เครื่องลง ${tm(F[0].arr,"Asia/Tokyo")} ระบบเผื่อเวลาเข้าเมือง เริ่มออกจากโอซาก้าได้ไม่เร็วกว่า ${sgT(e)}`:"",lastD===N?`🛫 วันสุดท้าย เครื่องออก ${tm(F[F.length-1].dep,"Asia/Tokyo")} ต้องกลับถึงโอซาก้าไม่เกิน ${sgT(l)}`:""].filter(Boolean);
  const stayNote=sg?"🏡 พักในหมู่บ้าน (มินชุกุ/บ้านกัสโชสึคุริ) มีจำนวนห้องน้อย ควรจองล่วงหน้า และมักรวมอาหารเย็น-เช้า · ข้อมูลที่พักไม่อยู่ในไฟล์ ตรวจราคา วันว่าง และเวลารับ-ส่งกับที่พักโดยตรง · ช่วงมกราคม–กุมภาพันธ์บางปีมีงานไลท์อัพเฉพาะบางวันที่ต้องจองแยก ตรวจเว็บทางการของหมู่บ้านก่อนล็อกวัน":`🏨 พักที่${mid}: วันแรกเที่ยวชิราคาวาโกะแล้วกลับบัสมานอนที่เมือง เช้าวันที่ 2 เที่ยวในเมืองต่อได้จนถึงเวลาขึ้นรถไฟ (ตั้งเวลาด้านล่าง) · ที่พักไม่อยู่ในไฟล์ ต้องจองเอง`;
  $("plan").innerHTML=`<h1>🏯 ไปชิราคาวาโกะ</h1><p class="sub">เลือกวันและเวลา ระบบหาเที่ยวรถไฟ+รถบัสจากโอซาก้า แบบไป-กลับวันเดียวหรือค้าง 1 คืน จากตารางในไฟล์ที่อัปโหลด</p>
  <div class="pinfo" style="background:#7a4b00">⚠️ ตารางในไฟล์เป็นข้อมูล ณ เม.ย. 2023 ก่อนเดินทางจริงตรวจเวลาล่าสุดและจองที่นั่งรถบัส (ไฟล์ระบุว่าหลายเที่ยวต้องจองล่วงหน้า)</div>
  <div class="card fm" style="margin-top:10px">
    <div class="note" style="margin:0 0 4px">รูปแบบการเดินทาง</div>
    <div class="chips" style="padding-top:0"><button class="chip ${ov?"":"on"}" onclick="sgSet('n',0)">☀️ ไป-กลับวันเดียว</button><button class="chip ${ov?"on":""}" onclick="sgSet('n',1)">🌙 ค้าง 1 คืน</button></div>
    ${ov?`<div class="note" style="margin:0 0 4px">พักที่ไหน</div><div class="chips" style="padding-top:0"><button class="chip ${sg?"on":""}" onclick="sgSet('o','sg')">🏡 ที่ชิราคาวาโกะ</button><button class="chip ${sg?"":"on"}" onclick="sgSet('o','mid')">🏨 ที่${mid}</button></div>`:""}
    <label>${ov?"วันที่ไป (คืนที่พัก)":"วันที่ไป"}<select onchange="sgSet('d',this.value)">${opt(days,SG.d,dlab)}</select></label>
    <div class="chips" style="padding-top:0"><button class="chip ${SG.mode==="auto"?"on":""}" onclick="sgSet('mode','auto')">🪄 ให้ระบบเลือก</button><button class="chip ${SG.mode==="manual"?"on":""}" onclick="sgSet('mode','manual')">✋ เลือกขบวนเอง</button></div>
    <div class="note" style="margin:0 0 4px">เส้นทาง</div>
    <div class="chips" style="padding-top:0"><button class="chip ${kz?"on":""}" onclick="sgSet('r','kz')">🚆 ผ่านคานาซาวะ</button><button class="chip ${kz?"":"on"}" onclick="sgSet('r','tky')">🚆 ผ่านนาโกย่า–ทาคายาม่า</button></div>
    <div class="g2"><label>ถึงสถานีโอซาก้าได้เร็วสุด${ov?" (วันที่ 1)":""}<select onchange="sgSet('e',this.value)">${opt(range(300,720,30),SG.e,sgT)}</select></label>
    <label>ต้องกลับถึงโอซาก้าก่อน${ov?" (วันที่ 2)":""}<select onchange="sgSet('l',this.value)">${opt(range(1080,1440,30),SG.l,sgT)}</select></label></div>
    ${ov?`<label>${sg?"วันที่ 2 ออกจากชิราคาวาโกะไม่เร็วกว่า":"วันที่ 2 ขึ้นรถไฟกลับจาก"+mid+"ไม่เร็วกว่า"}<select onchange="sgSet('m',this.value)">${opt(range(360,840,30),SG.m,sgT)}</select></label>`:""}
    ${sg?"":`<label>อยู่ชิราคาวาโกะอย่างน้อย${ov?" (วันที่ 1)":""}${SG.mode==="manual"?" (ใช้เทียบในโหมดเลือกเอง)":""}<select onchange="sgSet('s',this.value)">${opt([[60],[90],[120],[150],[180],[240],[300]],SG.s,sgDur)}</select></label>`}
    <div class="chips" style="padding-top:0"><button class="chip ${SG.ltd?"on":""}" onclick="sgSet('ltd',${SG.ltd?0:1})">${SG.ltd?"✓ ":""}รวมขบวนรถไฟ ◆ (วิ่งเฉพาะบางวัน)</button></div>
    <div class="note" style="margin:0">${kz?"คานาซาวะเป็นเส้นทางหลักจากโอซาก้า (Thunderbird ราว 2 ชม. 45 นาที + บัสราว 1 ชม. 15–25 นาที)":"ต้องต่อชินคันเซ็นจากชินโอซาก้าไปนาโกย่าก่อน ส่วนนี้ไม่มีในไฟล์ ระบบใช้ค่าประมาณรวม "+SGX+" นาที (ชินคันเซ็น Nozomi ราว 50 นาที + เปลี่ยนสถานี) ตรวจเที่ยวจริงใน Jorudan/Navitime"}</div>
  </div>
  ${ov?`<div class="pinfo" style="background:#5b3b1e">${stayNote}</div>`:""}
  ${info.map(x=>`<div class="pinfo">${x}</div>`).join("")}
  ${win?`<div class="pinfo" style="background:#12301a">❄️ ช่วง 1 ธ.ค.–31 มี.ค. ไฟล์ระบุว่าบัสบางเที่ยว (△) หยุด และไม่จอดป้ายโกกายามะ-สุกานุมะ ระบบตัดเที่ยวที่หยุดออกให้แล้ว</div>`:""}
  ${wk?`<div class="pinfo" style="background:#12301a">📅 ${ov?"มีวัน":"วันนี้เป็น"}เสาร์/อาทิตย์ ระบบตัดบัสเที่ยว ◆ (ไม่วิ่งเสาร์ อาทิตย์ วันหยุด) ออกให้แล้ว${ov?"ตามวันที่ของแต่ละวัน":""} วันหยุดนักขัตฤกษ์ให้เช็กเพิ่มเอง</div>`:""}
  ${SG.mode==="manual"?sgManual():`${res.length?`<div style="display:flex;justify-content:space-between;align-items:center;margin:14px 0 4px"><b>พบ ${res.length} แบบ</b><div class="chips" style="padding:0"><button class="chip ${SG.sort==="stay"?"on":""}" onclick="sgSet('sort','stay')">อยู่นานสุด</button><button class="chip ${SG.sort==="early"?"on":""}" onclick="sgSet('sort','early')">กลับเร็วสุด</button></div></div>`:`<div class="card" style="margin-top:12px">ไม่พบเที่ยวที่เข้าเงื่อนไข ลองลดเวลาที่อยู่ที่ชิราคาวาโกะ ขยับเวลากลับให้ดึกขึ้น${ov?" ปรับเวลาออกวันที่ 2 ให้เช้าขึ้น":""} หรือเลือกวันอื่น</div>`}
  ${shown.map((o,i)=>`<div class="card" style="margin-top:10px"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b>${i===0?"⭐ ":""}${o.ov?"🌙 ":""}แบบที่ ${i+1} · อยู่ ${sgDur(o.stay)}</b><span class="note" style="margin:0">กลับถึง ${sgT(o.home)}</span></div>
    <div class="tl">${sgSteps(o,kz).map(s=>`<div class="stp s"><div class="tt">${s[0]}</div><div class="sb"><b>${esc(s[1])}</b><small>${esc(s[2])}</small></div></div>`).join("")}</div>
    <button class="btn o" style="min-height:42px;font-size:14px" onclick="sgCopy(${SGO.indexOf(o)})">📋 คัดลอกแผนนี้ (ส่งเข้า LINE)</button><button class="btn o" style="min-height:42px;font-size:14px;margin-top:6px" onclick="sgAdopt(${SGO.indexOf(o)})">✏️ ปรับแผนนี้เอง</button></div>`).join("")}
  ${res.length>6?`<button class="btn o" style="margin-top:10px" onclick="SG.all=!SG.all;renderPlan()">${SG.all?"แสดงเฉพาะ 6 แบบแรก":"แสดงทั้งหมด "+res.length+" แบบ"}</button>`:""}
  `}
  <button class="btn o" style="margin-top:10px" onclick="sgTable()">📄 ดูตารางเที่ยวรถที่ใช้คำนวณ</button>
  <div class="note">เวลาเผื่อเปลี่ยนรถ: ${kz?SGB.kz:SGB.tky} นาที (ค่าประมาณ ไม่อยู่ในไฟล์) · ระบบเลือกรถไฟเที่ยวล่าสุดที่ยังทันบัส และรถไฟขากลับเที่ยวแรกที่ทัน · เที่ยวบัส 8:55 จากคานาซาวะถูกตัดออก เพราะเวลาถึงในไฟล์พิมพ์เป็น 17:10 น่าจะผิด</div>`;
}
