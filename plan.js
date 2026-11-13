// แท็บชิราคาวาโกะ: จัดแผนไป-กลับวันเดียว หรือค้าง 1 คืน (พักที่ชิราคาวาโกะ / พักที่คานาซาวะ-ทาคายาม่า) จากโอซาก้า ใช้ตารางจากไฟล์ Bus_JR_Line_Timetable (ข้อมูล ณ เม.ย. 2023)
// เวลาเป็นข้อความ "H:MM" แก้ตารางได้ที่ SGD ด้านล่าง · ธง: 1 ท้ายแถวรถไฟ = ◆ วิ่งเฉพาะบางวัน
// ธงของรถบัส: w = หยุด 1 ธ.ค.–31 มี.ค. (△) · d = หยุดเสาร์ อาทิตย์ วันหยุด (◆) · bad = ตัวเลขในไฟล์ดูผิด ไม่ใช้คำนวณ
const SGK="osaka_sgo_v1";
const SGB={kz:20,tky:10};   // เผื่อเวลาเปลี่ยนจากรถไฟไปป้ายบัส (นาที) ไม่อยู่ในไฟล์ เป็นค่าประมาณ
const SGX=90;               // โอซาก้า↔นาโกย่า ไม่อยู่ในไฟล์ ประมาณ: โอซาก้า→ชินโอซาก้า+ขึ้นชานชาลา ~15 + ชินคันเซ็น Nozomi ~50 + ต่อรถที่นาโกย่า ~25 (Hikari/Kodama ช้ากว่า ~55–67)
const SGD_BUILTIN={
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
// ===== โหลดตารางเที่ยวรถจาก sgo-data.json (สร้าง/อัปเดตโดย scripts/update_sgo.py ผ่าน GitHub Actions) =====
// ถ้าไฟล์ไม่มี โหลดไม่ได้ หรือรูปแบบไม่ผ่านการตรวจ จะใช้ SGD_BUILTIN ด้านบนแทนเสมอ
let SGD=SGD_BUILTIN,SGMETA={label:"เม.ย. 2023",train:"เม.ย. 2023",links:[]};
function sgValid(d){
  try{
    if(!d||typeof d!=="object")return false;
    const T=/^([01]?\d|2[0-3]):[0-5]\d$/,M=x=>{const a=x.split(":");return +a[0]*60+ +a[1]};
    for(const k of Object.keys(SGD_BUILTIN)){
      const a=d[k],b=SGD_BUILTIN[k];
      if(!Array.isArray(a)||a.length<3||a.length<b.length*0.5||a.length>b.length*2.5)return false;   // เที่ยวหายหรือเกินผิดปกติ = ไม่เชื่อ
      const tr=k[0]!=="b";   // รถไฟ [เลขขบวน, ออก, ถึง, ◆] · บัส [ออก, ถึง, ธง]
      for(const r of a){
        if(!Array.isArray(r))return false;
        const dep=tr?r[1]:r[0],arr=tr?r[2]:r[1],fl=tr?null:r[2];
        if(tr&&typeof r[0]!=="string")return false;
        if(typeof dep!=="string"||typeof arr!=="string"||!T.test(dep)||!T.test(arr))return false;
        if(M(arr)<=M(dep)&&!(fl&&fl.bad))return false;
        if(fl&&(typeof fl!=="object"||Object.keys(fl).some(x=>!["w","d","bad"].includes(x))))return false;
      }
    }
    return true;
  }catch(e){return false}
}
async function sgLoadData(){
  try{
    const r=await fetch("sgo-data.json",{cache:"no-cache"});
    if(!r.ok)return;
    const j=await r.json();
    if(!j||!sgValid(j.data)){console.warn("sgo-data.json ไม่ผ่านการตรวจ ใช้ข้อมูลในตัวแทน");return}
    SGD=j.data;
    const m=j.meta||{};
    SGMETA={label:String(m.label||m.updated||"ไม่ระบุ"),train:String(m.trainLabel||"เม.ย. 2023"),links:(Array.isArray(m.links)?m.links:[]).filter(x=>x&&/^https:\/\//.test(x.u))};
    if(typeof renderPlan==="function"&&$("plan"))renderPlan();
  }catch(e){}   // ออฟไลน์/เปิดจาก file:// → ใช้ข้อมูลในตัว
}
const sgLinks=()=>SGMETA.links.map(x=>` <a href="${esc(x.u)}" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">${esc(x.t||"ตารางจริง")}</a>`).join(" ·");
sgLoadData();
// n: 0=ไป-กลับวันเดียว 1=ค้าง 1 คืน · o: sg=นอนที่ชิราคาวาโกะ mid=เที่ยวก่อนแล้วนอนที่คานาซาวะ/ทาคายาม่า pre=นอนที่เมืองก่อนแล้วเที่ยววันถัดไป · m: วันที่ 2 ไม่ออกเดินทางก่อนเวลานี้ (นาที) · pm: (pre) วันที่ 2 ขึ้นบัสไปชิราคาวาโกะไม่เร็วกว่า
let SG={d:1,r:"kz",e:420,l:1350,s:150,ltd:0,sort:"stay",all:false,mode:"auto",n:0,o:"sg",m:540,pm:420,P:{}},SGO=[];
try{SG={...SG,...JSON.parse(localStorage.getItem(SGK)||"{}")};localStorage.removeItem("osaka_plan_v1");localStorage.removeItem("osaka_places_v1")}catch(e){}
const sgSave=()=>{try{localStorage.setItem(SGK,JSON.stringify(SG))}catch(e){}};
const sgM=s=>{const a=s.split(":");return +a[0]*60+ +a[1]};
const sgT=m=>String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0");
const sgDur=m=>{const h=Math.floor(m/60),r=m%60;return (h?h+" ชม.":"")+(h&&r?" ":"")+(r?r+" นาที":"")||"0 นาที"};
const sgJ=t=>Math.floor(((t+324e5)%864e5)/6e4); // นาทีของวันตามเวลาญี่ปุ่น
const sgFd=i=>new Date(F[0].arr+i*864e5).toLocaleDateString("th-TH",{timeZone:"Asia/Tokyo",weekday:"short",day:"numeric",month:"short"});
const sgTm=(k,v,mn,mx)=>`<span style="display:flex;align-items:center;gap:8px;margin-top:6px"><button class="chip" style="min-height:38px;min-width:42px" onclick="sgSet('${k}',${Math.max(mn,v-30)})" aria-label="เร็วขึ้น">−</button><b style="min-width:56px;text-align:center;font-size:17px">${sgT(v)}</b><button class="chip" style="min-height:38px;min-width:42px" onclick="sgSet('${k}',${Math.min(mx,v+30)})" aria-label="ช้าลง">+</button></span>`;
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
  const ov=!!SG.n&&SG.d<NIGHTS,sg=ov&&SG.o==="sg",pre=ov&&SG.o==="pre",L=sgLists(SG.d),L2=ov?sgLists(SG.d+1):L;
  return{ov,sg,pre,L,L2,go:pre?L2.go:L.go,rt:sg||pre?L2.rt:L.rt,back:ov?L2.back:L.back,l:L2.l};
}
// หาชุดเดินทางที่เป็นไปได้ทั้งหมดจากเงื่อนไขที่เลือก
function sgBuild(){
  const C=sgCtx(),{ov,sg,pre,L,L2}=C,{kz,b,ex,out,go,e}=L,res=[];
  if(pre){
    // นอนที่เมืองก่อน: วันที่ 1 นั่งรถไฟไปเมือง (เที่ยวแรกที่ออกได้หลังเวลาที่ตั้ง) · วันที่ 2 ขึ้นบัสเช้าไปเที่ยว แล้วกลับโอซาก้า
    const T=out.find(t=>t.d-ex>=e);
    if(T)for(const B of L2.go){
      if(B.d<SG.pm)continue;
      for(const R of L2.rt){
        if(R.d<B.a+SG.s)continue;
        const U=L2.back.find(u=>u.d>=R.a+b);
        if(!U||U.a+ex>L2.l)continue;
        res.push({T,B,R,U,ov,os:"pre",leave:T.d-ex,home:U.a+ex,stay:R.d-B.a});
      }
    }
  }else for(const B of go){
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
  return{res,win:L.win||L2.win,wk:L.wk||L2.wk,e,l:C.l,kz,N:L.N,ov,sg,pre};
}
// โหมดเลือกเอง: เลือกขบวนทีละช่วง ระบบบอกเวลาที่เหลือ/ที่ขาดในแต่ละช่วงต่อรถ
function sgManual(){
  const C=sgCtx(),{ov,sg,pre,L,go,rt,back,l}=C,{kz,b,ex,out}=L,P=SG.P||{},mid=kz?"คานาซาวะ":"ทาคายาม่า";
  const T=out.find(x=>x.d===P.t),B=go.find(x=>x.d===P.b),R=rt.find(x=>x.d===P.r),U=back.find(x=>x.d===P.u);
  const conn=!ov||sg||pre;   // ต่อรถไฟขากลับต่อจากบัสในวันเดียวกันหรือไม่ (ค้างที่เมืองต้นทางไม่ต้องต่อ)
  const ok=v=>`<b style="color:var(--grn)">${v}</b>`,bad=v=>`<b style="color:#b91c1c">${v}</b>`;
  const slack=m=>m>=0?ok("เหลือ "+sgDur(m)):bad("ไม่ทัน ขาด "+sgDur(-m));
  // ปุ่มเลือกขบวน: เวลาออกตัวใหญ่ + บรรทัดรอง (ถึงกี่โมง) + บรรทัดสถานะ (รอกี่นาที / ไม่ทัน) แตะซ้ำเพื่อยกเลิก
  const chip=(k,x,main,sub,st)=>`<button class="ob ${x.d===P[k]?"on":""} ${st&&st[0]==="w"&&st[2]?"no":""}" onclick="sgPick('${k}',${x.d===P[k]?0:x.d})"><b>${main}</b><small>${sub}</small>${st?`<small class="${st[0]}">${st[1]}</small>`:""}</button>`;
  const st=(prev,min,x,txtOk)=>prev?(x.d>=min?["ok",txtOk(x.d-min)]:["w","⚠ ไม่ทัน",1]):null;
  const s1=out.map(x=>chip("t",x,sgT(x.d-ex),kz?`ถึง ${sgT(x.a)}${x.ltd?" · ◆":""}`:`ไฮดะ ${x.n} · ถึง ${sgT(x.a)}${x.ltd?" ◆":""}`,null));
  const s2=go.map(x=>chip("b",x,sgT(x.d),`ถึง ${sgT(x.a)}`,pre?null:st(T,T&&T.a+b,x,m=>"รอ "+sgDur(m))));
  const s3=rt.map(x=>chip("r",x,sgT(x.d),`ถึง ${sgT(x.a)}`,sg?null:B?(x.d>=B.a?["ok","อยู่ "+sgDur(x.d-B.a)]:["w","⚠ ก่อนบัสถึง",1]):null));
  const s4=back.map(x=>{const h=x.a+ex,late=h>l;return chip("u",x,sgT(x.d),`ถึงโอซาก้า ${kz?"":"≈"}${sgT(h)}${x.ltd?" ◆":""}`,conn&&R&&x.d<R.a+b?["w","⚠ ไม่ทัน",1]:late?["w","เกินเวลากลับ",1]:conn&&R?["ok","รอ "+sgDur(x.d-(R.a+b))]:null)});
  const step=(n,t,arr,empty)=>`<div class="stl"><span class="sn">${n}</span>${t}</div>${arr.length?`<div class="og">${arr.join("")}</div>`:`<div class="note">${empty}</div>`}`;
  const rows=[];let good=true;
  if(T&&B&&!pre){const m=B.d-(T.a+b);if(m<0)good=false;rows.push(`<div class="kv"><span>ต่อรถที่${mid} (เผื่อ ${b} นาที)</span>${slack(m)}</div>`)}
  if(B&&R){
    if(sg)rows.push(`<div class="kv"><span>เวลาอยู่ชิราคาวาโกะ (ข้ามคืน)</span>${ok(sgDur(1440-B.a+R.d))}</div>`);
    else{const m=R.d-B.a;if(m<0)good=false;rows.push(`<div class="kv"><span>เวลาเที่ยวที่ชิราคาวาโกะ${ov?(pre?" (วันที่ 2)":" (วันที่ 1)"):""}</span>${m>=0?ok(sgDur(m)):bad("บัสกลับออกก่อนบัสไปถึง")}</div>`);if(m>=0)rows.push(`<div class="kv"><span>เทียบกับที่ตั้งไว้ (อย่างน้อย ${sgDur(SG.s)})</span>${m>=SG.s?ok("เกิน "+sgDur(m-SG.s)):bad("สั้นกว่า "+sgDur(SG.s-m))}</div>`)}
  }
  if(R&&U&&conn){const m=U.d-(R.a+b);if(m<0)good=false;rows.push(`<div class="kv"><span>ต่อรถที่${mid}ขากลับ (เผื่อ ${b} นาที)</span>${slack(m)}</div>`)}
  if(T&&pre)rows.push(`<div class="kv"><span>ถึง${mid} วันที่ 1 (เข้าที่พัก)</span><b>${sgT(T.a)}</b></div>`);
  if(R&&!sg&&!pre&&ov)rows.push(`<div class="kv"><span>ถึง${mid} วันที่ 1 (เข้าที่พัก)</span><b>${sgT(R.a)}</b></div>`);
  if(U){const h=U.a+ex;rows.push(`<div class="kv"><span>ถึงโอซาก้า${ov?" ("+sgFd(SG.d+1)+")":""}</span><b>${sgT(h)}</b></div><div class="kv"><span>เทียบเวลาที่ต้องกลับถึง (${sgT(l)})</span>${slack(l-h)}</div>`);if(h>l)good=false}
  if(T&&U&&!ov)rows.push(`<div class="kv"><span>รวมเวลาเดินทางทั้งวัน</span><b>${sgDur((U.a+ex)-(T.d-ex))}</b></div>`);
  let cd="";
  if(T){const ts=Math.floor((F[0].arr+324e5)/864e5)*864e5-324e5+SG.d*864e5+(T.d-ex)*6e4;cd=`<div class="pinfo" style="background:#12301a">⏳ ออกจากโอซาก้า ${sgT(T.d-ex)} · เหลืออีก ${sgCd(ts)}</div>`}
  const full=T&&B&&R&&U&&good,o=full?{T,B,R,U,ov,os:SG.o,leave:T.d-ex,home:U.a+ex,stay:sg?1440-B.a+R.d:R.d-B.a}:null;
  SGO=o?[o]:[];
  const dl=n=>ov?` · วันที่ ${n} (${sgFd(SG.d+n-1)})`:"";
  return `<div class="card" style="margin-top:12px"><div style="display:flex;justify-content:space-between;align-items:center"><b>✋ เลือกขบวนเอง</b><button class="chip" style="min-height:34px" onclick="SG.P={};sgSave();renderPlan()">ล้างที่เลือก</button></div>
    <div class="note" style="margin:4px 0 0">แตะเพื่อเลือก แตะซ้ำเพื่อยกเลิก · ตัวใหญ่คือเวลาออก ตัวที่จางคือต่อรถไม่ทัน (ยังเลือกได้)</div>
    ${step(1,(kz?"รถไฟจากโอซาก้า (เวลาออกจากโอซาก้า)":"ออกจากโอซาก้า (ชินคันเซ็น + ไฮดะ)")+dl(1),s1,"ไม่มีเที่ยว")}
    ${step(2,`รถบัสจาก${mid}ไปชิราคาวาโกะ`+dl(pre?2:1),s2,"ไม่มีบัสในวันนี้")}
    ${step(3,`รถบัสกลับจากชิราคาวาโกะไป${mid}`+dl(sg||pre?2:1),s3,"ไม่มีบัสในวันนี้")}
    ${step(4,(kz?"รถไฟกลับโอซาก้า":"ไฮดะกลับนาโกย่า แล้วต่อกลับโอซาก้า")+dl(2),s4,"ไม่มีเที่ยว")}</div>
  ${cd}${rows.length?`<div class="card" style="margin-top:10px"><div class="rvh" style="margin-top:0">⏱ เวลาที่เหลือในแต่ละช่วง</div>${rows.join("")}</div>`:""}
  ${o?`<div class="card" style="margin-top:10px"><b>แผนของคุณ · ${ov?"ค้าง 1 คืน · ":""}อยู่ ${sgDur(o.stay)}</b><div class="tl">${sgSteps(o,kz).map(s=>`<div class="stp s"><div class="tt">${s[0]}</div><div class="sb"><b>${esc(s[1])}</b>${s[2]?`<small>${esc(s[2])}</small>`:""}</div></div>`).join("")}</div><button class="btn o" style="min-height:42px;font-size:14px" onclick="sgCopy(0)">📋 คัดลอกแผนนี้ (ส่งเข้า LINE)</button></div>`:""}`;
}
function sgSteps(o,kz){
  const{T,B,R,U}=o,ltd=x=>x.ltd?" · ◆ วิ่งเฉพาะบางวัน ตรวจวันวิ่ง":"",mid=kz?"คานาซาวะ":"ทาคายาม่า",ov=!!o.ov,sg=ov&&o.os==="sg",pre=ov&&o.os==="pre";
  const wait=B.d-T.a,wait2=U.d-R.a,d1=SG.d;
  if(pre)return[
    ["📅","วันที่ 1 · "+sgFd(d1),""],
    [sgT(o.leave),kz?"ออกจากสถานีโอซาก้า":"ออกจากโอซาก้า ต่อชินคันเซ็นไปนาโกย่า",kz?`JR Thunderbird ${T.n} ถึงคานาซาวะ ${sgT(T.a)}${ltd(T)}`:`ประมาณ ${sgDur(SGX)} (ไม่มีในไฟล์) แล้วขึ้นไฮดะ ${T.n} ออกนาโกย่า ${sgT(T.d)} ถึงทาคายาม่า ${sgT(T.a)}${ltd(T)}`],
    ["🌙",`นอนที่${mid}`,`ถึง ${sgT(T.a)} เข้าที่พัก เตรียมขึ้นบัสเช้าวันถัดไป`],
    ["📅","วันที่ 2 · "+sgFd(d1+1),""],
    [sgT(B.d),`ขึ้นรถบัสที่${mid}ไปชิราคาวาโกะ`,`${kz?"ท่ารถบัสทางออกตะวันออก JR คานาซาวะ (ป้าย ②) · ":"ศูนย์รถบัสทาคายาม่า (Takayama Nohi Bus Center) · "}บัสถึง ${sgT(B.a)}`],
    [sgT(B.a),"🏯 ถึงชิราคาวาโกะ",`มีเวลาเที่ยว ${sgDur(o.stay)} (จนถึง ${sgT(R.d)}) · ท่ารถอยู่ที่ Shirakawa-go Bus Terminal`],
    [sgT(R.d),`ขึ้นรถบัสกลับ${mid}`,`ถึง${mid} ${sgT(R.a)}${R.f.n?" · "+R.f.n:""}${R.f.d?" · ◆ ไม่วิ่งเสาร์ อาทิตย์ วันหยุด":""}`],
    [sgT(U.d),kz?`JR Thunderbird ${U.n} กลับโอซาก้า`:`ไฮดะ ${U.n} ไปนาโกย่า แล้วต่อกลับโอซาก้า`,`รอต่อรถ ${sgDur(wait2)} · ถึงโอซาก้า ${sgT(o.home)}${kz?"":" (รวมเวลาชินคันเซ็นโดยประมาณ)"}${ltd(U)}`]
  ];
  const s=[
    [sgT(o.leave),kz?"ออกจากสถานีโอซาก้า":"ออกจากโอซาก้า ต่อชินคันเซ็นไปนาโกย่า",kz?`JR Thunderbird ${T.n} ถึงคานาซาวะ ${sgT(T.a)}${ltd(T)}`:`ประมาณ ${sgDur(SGX)} (ไม่มีในไฟล์) แล้วขึ้นไฮดะ ${T.n} ออกนาโกย่า ${sgT(T.d)} ถึงทาคายาม่า ${sgT(T.a)}${ltd(T)}`],
    [sgT(B.d),`ขึ้นรถบัสที่${mid}ไปชิราคาวาโกะ`,`${kz?"ท่ารถบัสทางออกตะวันออก JR คานาซาวะ (ป้าย ②) · ":"ศูนย์รถบัสทาคายาม่า (Takayama Nohi Bus Center) · "}รอต่อรถ ${sgDur(wait)} หลังรถไฟถึง · บัสถึง ${sgT(B.a)}`],
    [sgT(B.a),"🏯 ถึงชิราคาวาโกะ",sg?"เที่ยวต่อได้จนค่ำ แล้วเข้าที่พัก · ท่ารถอยู่ที่ Shirakawa-go Bus Terminal":`มีเวลาเที่ยว ${sgDur(o.stay)} (จนถึง ${sgT(R.d)}) · ท่ารถอยู่ที่ Shirakawa-go Bus Terminal`]
  ];
  if(sg)s.push(["🌙","นอนที่ชิราคาวาโกะ","จองมินชุกุล่วงหน้า"],["📅","วันที่ 2 · "+sgFd(d1+1),""]);
  s.push([sgT(R.d),`ขึ้นรถบัสกลับ${mid}`,`ถึง${mid} ${sgT(R.a)}${R.f.n?" · "+R.f.n:""}${R.f.d?" · ◆ ไม่วิ่งเสาร์ อาทิตย์ วันหยุด":""}`]);
  if(ov&&!sg)s.push(["🌙",`นอนที่${mid}`,`เช้าวันที่ 2 เที่ยวในเมืองได้จนถึงเวลาขึ้นรถไฟ`],["📅","วันที่ 2 · "+sgFd(d1+1),""]);
  s.push([sgT(U.d),kz?`JR Thunderbird ${U.n} กลับโอซาก้า`:`ไฮดะ ${U.n} ไปนาโกย่า แล้วต่อกลับโอซาก้า`,`${ov&&!sg?"":"รอต่อรถ "+sgDur(wait2)+" · "}ถึงโอซาก้า ${sgT(o.home)}${kz?"":" (รวมเวลาชินคันเซ็นโดยประมาณ)"}${ltd(U)}`]);
  if(ov)s.unshift(["📅","วันที่ 1 · "+sgFd(d1),""]);
  return s;
}
function sgCopy(i){
  const o=SGO[i];if(!o)return;const kz=SG.r==="kz",sg=o.ov&&o.os==="sg";
  const t=`🏯 ไปชิราคาวาโกะ${o.ov?(sg?" ค้าง 1 คืนที่หมู่บ้าน":o.os==="pre"?" นอนที่"+(kz?"คานาซาวะ":"ทาคายาม่า")+"ก่อน แล้วเที่ยววันถัดไป":" ค้าง 1 คืนที่"+(kz?"คานาซาวะ":"ทาคายาม่า")):""} (${kz?"ผ่านคานาซาวะ":"ผ่านนาโกย่า-ทาคายาม่า"})\n`+sgSteps(o,kz).map(s=>`${s[0]} ${s[1]}${s[2]?"\n   "+s[2]:""}`).join("\n")+`\n⚠️ ตารางจากไฟล์ ณ เม.ย. 2023 ตรวจเวลาและจองรถบัสก่อนเดินทาง${sg?" · อย่าลืมจองที่พัก":""}`;
  navigator.clipboard?navigator.clipboard.writeText(t).then(()=>toast("คัดลอกแผนแล้ว"),()=>toast("คัดลอกไม่สำเร็จ")):toast("คัดลอกไม่ได้");
}
function sgTable(){
  const C=sgCtx(),{ov,sg,pre}=C,kz=SG.r==="kz",i1=pre?SG.d+1:SG.d,i2=sg||pre?SG.d+1:SG.d,mid=kz?"คานาซาวะ":"ทาคายาม่า";
  const fl=i=>{const dt=sgDay(i);return{win:dt.m===11||dt.m<=2,wk:dt.w===0||dt.w===6}};
  const why=(f,i)=>{const{win,wk}=fl(i);return f.bad?"⚠ ไฟล์พิมพ์ผิด ไม่ใช้":win&&f.w?"△ หยุดช่วงนี้":wk&&f.d?"◆ เสาร์-อาทิตย์ไม่วิ่ง":""};
  const bus=(a,t,i)=>`<div class="rvh" style="margin-top:14px">${t} <span class="note">(${a.filter(x=>!why(x[2]||{},i)).length}/${a.length} เที่ยวใช้ได้${ov?" · ตามวันที่ "+sgFd(i):""})</span></div><div class="tg">${a.map(x=>{const f=x[2]||{},w=why(f,i);return `<div class="tc ${w?"no":""}"><b>${x[0]}</b> ➔ ${x[1]}${w?`<small style="text-decoration:none">${w}</small>`:""}</div>`}).join("")}</div>`;
  const trn=(a,t,pre)=>`<details class="dt"><summary>${t} <span class="note">(${a.length} ขบวน)</span></summary><div class="tg" style="margin-top:8px">${a.map(x=>`<div class="tc"><b>${x[1]}</b> ➔ ${x[2]}<small>${pre} ${x[0]}${x[3]?" · ◆ บางวัน":""}</small></div>`).join("")}</div></details>`;
  const f1=fl(i1),f2=fl(i2),win=f1.win||f2.win,wk=f1.wk||f2.wk;
  openSheet("ตารางเที่ยวรถ ("+(kz?"คานาซาวะ":"ทาคายาม่า")+")",
    `<div class="note" style="margin:0">ตารางเที่ยวรถ ณ ${esc(SGMETA.label)} · วันที่เลือก: ${win?"อยู่ในช่วงหยุด △ ":""}${wk?"เสาร์/อาทิตย์ ":""}${!win&&!wk?"ไม่มีข้อจำกัดพิเศษ":""}${win||wk?"(เที่ยวที่ใช้ไม่ได้จะจางและขีดฆ่า)":""}</div>`
    +(kz?bus(SGD.busKzSg,"🚌 คานาซาวะ ➔ ชิราคาวาโกะ",i1)+bus(SGD.busSgKz,"🚌 ชิราคาวาโกะ ➔ คานาซาวะ",i2):bus(SGD.busTkySg,"🚌 ทาคายาม่า ➔ ชิราคาวาโกะ",i1)+bus(SGD.busSgTky,"🚌 ชิราคาวาโกะ ➔ ทาคายาม่า",i2))
    +`<div class="rvh" style="margin-top:14px">🚆 รถไฟ (แตะเพื่อเปิด)</div>`
    +(kz?trn(SGD.tbOut,"โอซาก้า ➔ คานาซาวะ","Thunderbird")+trn(SGD.tbBack,"คานาซาวะ ➔ โอซาก้า","Thunderbird"):trn(SGD.hidaOut,"นาโกย่า ➔ ทาคายาม่า","ไฮดะ")+trn(SGD.hidaBack,"ทาคายาม่า ➔ นาโกย่า","ไฮดะ"))
    +`<div class="note">◆ = วิ่งเฉพาะบางวัน · เวลาบางขบวนของวันเสาร์/วันหยุดต่างจากนี้ 1–2 นาที${kz?"":" · ส่วนชินคันเซ็นโอซาก้า↔นาโกย่าไม่อยู่ในไฟล์"}</div>`);
}
// ไม่มีเที่ยวที่เข้าเงื่อนไข: บอกเหตุผล + ปุ่มลองทางอื่น
function sgEmpty(){
  const C=sgCtx(),{ov,sg,pre,L}=C,{b,ex,out,go,e}=L,maxD=NIGHTS-(ov?1:0),mid=L.kz?"คานาซาวะ":"ทาคายาม่า";
  const head=SG.d===0?`🛬 วันถึง เครื่องลง ${tm(F[0].arr,"Asia/Tokyo")} ออกจากโอซาก้าได้เร็วสุด ${sgT(e)} · `:"";
  const outOk=pre?out.some(t=>t.d-ex>=e):go.some(B=>out.some(t=>t.d-ex>=e&&t.a+b<=B.d));
  const why=!outOk?(pre?`หลังเวลา ${sgT(e)} ไม่มีรถไฟไป${mid}`:`หลังเวลา ${sgT(e)} ไม่มีรถไฟ+บัสไปชิราคาวาโกะที่ต่อทัน`)
    :pre?`วันที่ 2 ไม่มีบัสไป-กลับชิราคาวาโกะที่ต่อรถไฟกลับโอซาก้าทันตามเวลาที่ตั้งไว้ (หรือเที่ยวสั้นกว่า ${sgDur(SG.s)}) ลองขยับเวลาใน ⚙️ ตั้งค่าละเอียด`
    :!ov?`ไปถึงแล้วไม่มีบัสกลับที่ต่อรถไฟกลับโอซาก้าทันภายในวันเดียว (หรือเที่ยวสั้นกว่าที่ตั้งไว้ ${sgDur(SG.s)})`
    :!sg?`ถึงชิราคาวาโกะช้าเกินกว่าจะนั่งบัสกลับมานอนที่เมืองได้ทัน`
    :`วันที่ 2 กลับถึงโอซาก้าไม่ทันเวลาที่ตั้งไว้ ลองขยับเวลา "ต้องกลับถึงโอซาก้าก่อน" หรือเวลาออกวันที่ 2 ใน ⚙️ ตั้งค่าละเอียด`;
  const bt=(t,f)=>`<button class="btn o" style="min-height:42px;font-size:14px;margin-top:6px" onclick="${f}">${t}</button>`;
  return `<div class="card" style="margin-top:12px"><b>ไม่พบเที่ยวที่เข้าเงื่อนไขในวันนี้</b><div class="note" style="margin:4px 0 0">${head}${why}</div>
    ${SG.d+1<=maxD?bt("➡️ ลองไปวันถัดไป ("+sgFd(SG.d+1)+")","sgSet('d',"+(SG.d+1)+")"):""}
    ${!ov?bt("🌙 ลองค้าง 1 คืน","sgSet('n',1)"):!sg?bt("🏡 ลองพักที่ชิราคาวาโกะแทน","sgSet('o','sg')"):""}</div>`;
}
// ===== แผนเที่ยวทั้งทริป (หน้าเดียว): เลือกวัน → แตะที่ที่อยากไป → แตะเวลาเพื่อปรับ =====
// วันที่ไปชิราคาวาโกะ: เวลารถไฟ/บัสดึงมาจากตารางเดินรถ (หน้า "ตัวเลือกรถอื่น") แล้วใส่ที่เที่ยวในหมู่บ้านได้เหมือนวันอื่น
// m = เวลาที่ใช้เริ่มต้น (นาที) เป็นค่าประมาณของผม แก้ได้ที่ TPC · a = ย่าน (ใช้เตือนเรื่องเวลาเดินทางข้ามเมือง)
const TPK="osaka_trip_v1";
const TPE=10;     // ควรถึงท่ารถก่อนบัสกลับกี่นาที
const TPN=1080;   // นอนที่หมู่บ้าน: เที่ยววันแรกถึง 18:00 (โดยประมาณ)
let TP={v:"trip",d:0,sgOn:0,D:{}};
try{TP={...TP,...JSON.parse(localStorage.getItem(TPK)||"{}")}}catch(e){}
const tpSave=()=>{try{localStorage.setItem(TPK,JSON.stringify(TP))}catch(e){}};
const TPA={sg:"🏯 ในชิราคาวาโกะ",osaka:"🏙️ โอซาก้า",kyoto:"⛩️ เกียวโต",nara:"🦌 นารา",kanazawa:"🏮 คานาซาวะ",other:"🧭 เมืองอื่น",misc:"🍜 อาหาร / พัก"};
const TPC=[
  {id:"s-walk",a:"sg",e:"🏘️",n:"เดินชมหมู่บ้านโอกิมาจิ",m:60},
  {id:"s-wada",a:"sg",e:"🏠",n:"บ้านวาดะ",m:30},
  {id:"s-lunch",a:"sg",e:"🍜",n:"มื้อกลางวันในหมู่บ้าน",m:45},
  {id:"s-shiro",a:"sg",e:"📸",n:"จุดชมวิวชิโรยามะ",m:75},
  {id:"s-minka",a:"sg",e:"🌾",n:"พิพิธภัณฑ์กลางแจ้ง Gassho Minkaen",m:60},
  {id:"s-kanda",a:"sg",e:"🏠",n:"บ้านคันดะ",m:30},
  {id:"s-nagase",a:"sg",e:"🏠",n:"บ้านนากาเสะ",m:30},
  {id:"s-myo",a:"sg",e:"⛩️",n:"วัดเมียวเซนจิ",m:30},
  {id:"s-cafe",a:"sg",e:"☕",n:"คาเฟ่ / ซื้อของฝาก",m:30},
  {id:"doton",a:"osaka",e:"🦀",n:"ด็อตมบุริ / ป้ายกลิโกะ",m:90},
  {id:"castle",a:"osaka",e:"🏯",n:"ปราสาทโอซาก้า",m:120},
  {id:"kuromon",a:"osaka",e:"🍢",n:"ตลาดคุโรมง",m:60},
  {id:"shinsekai",a:"osaka",e:"🗼",n:"ชินเซไก / ซึเทนคาคุ",m:90},
  {id:"umeda",a:"osaka",e:"🌇",n:"Umeda Sky Building",m:60},
  {id:"shop",a:"osaka",e:"🛍️",n:"ช้อปปิ้งชินไซบาชิ–นัมบะ",m:120},
  {id:"kaiyukan",a:"osaka",e:"🐠",n:"พิพิธภัณฑ์สัตว์น้ำไคยูคัน",m:150},
  {id:"dendentown",a:"osaka",e:"🎮",n:"เดนเด็นทาวน์",m:60},
  {id:"usj",a:"osaka",e:"🎢",n:"Universal Studios Japan",m:480},
  {id:"fushimi",a:"kyoto",e:"⛩️",n:"ฟูชิมิ อินาริ",m:120},
  {id:"kiyomizu",a:"kyoto",e:"🌸",n:"คิโยมิสึเดระ + ฮิกาชิยาม่า",m:150},
  {id:"arashi",a:"kyoto",e:"🎋",n:"อาราชิยาม่า (ป่าไผ่)",m:150},
  {id:"kinkaku",a:"kyoto",e:"✨",n:"คินคะคุจิ",m:60},
  {id:"gion",a:"kyoto",e:"🏮",n:"ย่านกิอง",m:60},
  {id:"nishiki",a:"kyoto",e:"🍡",n:"ตลาดนิชิกิ",m:60},
  {id:"nara",a:"nara",e:"🦌",n:"สวนกวางนารา + โทไดจิ",m:150},
  {id:"k-kenroku",a:"kanazawa",e:"🌳",n:"สวนเคนโรคุเอ็น",m:90,h:"หน้าหนาวมีเชือกค้ำกิ่งไม้ (ยูกิซึริ) ถ่ายรูปสวย"},
  {id:"k-castle",a:"kanazawa",e:"🏯",n:"สวนปราสาทคานาซาวะ",m:60},
  {id:"k-seison",a:"kanazawa",e:"🏡",n:"วิลล่าเซซอนคาคุ",m:45},
  {id:"k-higashi",a:"kanazawa",e:"🏮",n:"ย่านชาญะฮิงาชิ",m:90},
  {id:"k-kazue",a:"kanazawa",e:"🌉",n:"ย่านชาญะคาซูเอะมาจิ (ริมแม่น้ำ)",m:45},
  {id:"k-omicho",a:"kanazawa",e:"🦀",n:"ตลาดโอมิโจ",m:75,h:"ร้านส่วนใหญ่ปิดช่วงเย็น ควรไปเช้า–บ่าย"},
  {id:"k-sushi",a:"kanazawa",e:"🍣",n:"ซูชิ / ข้าวหน้าอาหารทะเล",m:60},
  {id:"k-museum",a:"kanazawa",e:"🎨",n:"พิพิธภัณฑ์ศิลปะร่วมสมัยศตวรรษที่ 21",m:90,h:"ปกติปิดวันจันทร์ ตรวจวันหยุดอีกครั้ง"},
  {id:"k-nagamachi",a:"kanazawa",e:"🗡️",n:"ย่านซามูไรนางามาจิ",m:60},
  {id:"k-ninja",a:"kanazawa",e:"🥷",n:"วัดเมียวริวจิ (วัดนินจา)",m:60,h:"ต้องจองรอบเข้าชมล่วงหน้า"},
  {id:"k-gold",a:"kanazawa",e:"✨",n:"ทองคำเปลว (ทดลองทำ / ไอศกรีมทอง)",m:60},
  {id:"k-suzuki",a:"kanazawa",e:"⚪",n:"พิพิธภัณฑ์ D.T. Suzuki",m:45},
  {id:"k-oyama",a:"kanazawa",e:"⛩️",n:"ศาลเจ้าโอยามะ",m:30},
  {id:"k-station",a:"kanazawa",e:"🚪",n:"ประตูสึซึมิ + ซื้อของฝากที่สถานี",m:45},
  {id:"himeji",a:"other",e:"🏰",n:"ปราสาทฮิเมจิ",m:180},
  {id:"kobe",a:"other",e:"🥩",n:"โกเบ (ท่าเรือ / เนื้อโกเบ)",m:180},
  {id:"hotel",a:"misc",e:"🏨",n:"ฝากกระเป๋า / เช็กอินโรงแรม",m:30},
  {id:"lunch",a:"misc",e:"🍜",n:"มื้อกลางวัน",m:60},
  {id:"dinner",a:"misc",e:"🍽️",n:"มื้อเย็น",m:90},
  {id:"cafe",a:"misc",e:"☕",n:"พักคาเฟ่",m:30}
];
// ชุดแนะนำ: กดปุ่มเดียวเติมหลายที่ตามลำดับ (แก้/ลบทีหลังได้)
const TPP={
  osaka:["shinsekai","kuromon","doton","castle"],
  kyoto:["fushimi","kiyomizu","gion","nishiki"],
  kanazawa:["k-omicho","k-castle","k-kenroku","k-higashi"],
  sg:["s-walk","s-wada","s-lunch","s-shiro"]
};
const TPH={kanazawa:"🚆 ไป-กลับจากโอซาก้าราว 2 ชม. 10–30 นาทีต่อเที่ยว (Thunderbird ไปสึรุกะ แล้วต่อชินคันเซ็น) ระบบเผื่อเวลาเดินทางให้แล้ว · ไม่มีรถตรงแล้วตั้งแต่ มี.ค. 2024"};
// ===== เชื่อมกับระบบโรงแรม: ที่พักของทริป = โรงแรมที่เลือกไว้ในแท็บเตรียมตัว (P.bk.hid) =====
// ใช้พิกัดโรงแรมจากแผนที่ (lat/lng) ถ้ายังไม่ปักหมุดจะใช้จุดกลางย่านโดยประมาณ · ตัวเลขเวลาเดินทางเป็นค่าประมาณจากระยะทางตรง
const HC={Umeda:[34.7055,135.4983],Namba:[34.6660,135.5010],Ebisu:[34.6525,135.5063],"Shin-Imamiya":[34.6475,135.5000]};
const OSK=[34.7025,135.4959];                                   // สถานีโอซาก้า (JR) ใช้เป็นจุดขึ้นรถไปเมืองอื่น
const HAIR={Umeda:70,Namba:45,Ebisu:45,"Shin-Imamiya":40};     // ที่พัก → สนามบินคันไซ (นาที โดยประมาณ) ย่านอื่นใช้ 60
const TPL={doton:[34.6687,135.5013],castle:[34.6873,135.5262],kuromon:[34.6615,135.5063],shinsekai:[34.6525,135.5063],umeda:[34.7052,135.4903],shop:[34.6720,135.5015],kaiyukan:[34.6545,135.4289],dendentown:[34.6595,135.5058],usj:[34.6654,135.4323],
  fushimi:[34.9671,135.7727],kiyomizu:[34.9949,135.7850],arashi:[35.0094,135.6668],kinkaku:[35.0394,135.7292],gion:[35.0037,135.7756],nishiki:[35.0050,135.7649],
  nara:[34.6880,135.8400],
  "k-kenroku":[36.5621,136.6627],"k-castle":[36.5658,136.6590],"k-seison":[36.5612,136.6658],"k-higashi":[36.5726,136.6663],"k-kazue":[36.5738,136.6618],"k-omicho":[36.5715,136.6577],"k-sushi":[36.5715,136.6577],"k-museum":[36.5608,136.6584],"k-nagamachi":[36.5628,136.6531],"k-ninja":[36.5566,136.6499],"k-gold":[36.5722,136.6660],"k-suzuki":[36.5589,136.6569],"k-oyama":[36.5655,136.6560],"k-station":[36.5780,136.6478]}; // พิกัดที่ในโอซาก้า
const tpR=m=>Math.ceil(m/5)*5;
const tpKm=(a,b)=>{const r=Math.PI/180,dl=(b[1]-a[1])*r,dp=(b[0]-a[0])*r,x=Math.sin(dp/2)**2+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(dl/2)**2;return 12742*Math.asin(Math.sqrt(x))};
const tpMove=km=>Math.min(60,Math.max(15,tpR(10+3.5*km)));   // เวลาเดินทางในเมือง (นาที) จากระยะ กม.
function tpHotel(){
  try{
    const id=+(P.bk&&P.bk.hid);if(!id)return null;
    const h=all().find(x=>x.id===id);if(!h)return null;
    const ex=hasLL(h);
    return{h,ex,ll:ex?[h.lat,h.lng]:(HC[h.area]||null),air:HAIR[h.area]||60};
  }catch(e){return null}
}
const tpAcc=H=>H&&H.ll?Math.min(45,tpR(10+3.5*tpKm(H.ll,OSK))):20;   // ที่พัก → สถานีโอซาก้า (นาที)
const tpEx=H=>H&&H.ll?Math.max(-10,tpAcc(H)-20):0;                   // ส่วนต่างจากค่ากลางที่ใช้ในตารางข้ามเมือง
const tpGap=(pa,a,pl,cl)=>pa===a&&pl&&cl?tpMove(tpKm(pl,cl)):tpBuf(pa,a);
function tpHid(v){if(typeof bkSet==="function")bkSet("hid",v);renderPlan()}
function tpChips(pk,H,i){
  let L=TPC.filter(c=>c.a===pk).map(c=>({c,km:pk==="osaka"&&H&&H.ll&&TPL[c.id]?tpKm(H.ll,TPL[c.id]):null}));
  if(H&&L.some(x=>x.km!=null))L.sort((p,q)=>(p.km==null)-(q.km==null)||p.km-q.km);   // ใกล้ที่พักก่อน
  return L.map(({c,km})=>{const has=tpDL(i).some(x=>x.id===c.id);return `<button class="chip ${has?"on":""}" onclick="tpAdd('${c.id}')">${has?"✓ ":""}${c.e} ${c.n}${km!=null?` · ${km.toFixed(1)} กม.`:""}</button>`}).join("");
}
function tpHotelBox(H){
  let hs=[];try{hs=all()}catch(e){}
  if(!hs.length)return "";
  const cur=H?H.h.id:0,fv=hs.filter(h=>favs.has(h.id)),rest=hs.filter(h=>!favs.has(h.id));
  const op=a=>a.map(h=>`<option value="${h.id}" ${h.id===cur?"selected":""}>${esc(h.name)} · ${esc(h.area||"")}</option>`).join("");
  const sel=`<select onchange="tpHid(this.value)" style="width:100%;min-height:44px;border:1px solid var(--line);border-radius:12px;padding:0 10px;font-size:15px;background:#fff;margin-top:6px"><option value="">– ยังไม่เลือก (ใช้ค่ากลางโอซาก้า) –</option>${fv.length?`<optgroup label="★ ที่ชอบ">${op(fv)}</optgroup>`:""}<optgroup label="ทั้งหมด">${op(rest)}</optgroup></select>`;
  const info=H?`<div class="note" style="margin:6px 0 0">${esc(H.h.area||"")} · ไปสถานีโอซาก้า ~${tpAcc(H)} นาที · ไปสนามบิน ~${H.air} นาที · ระบบใช้คำนวณเวลาเดินทางจากที่พัก (ตัวเลือกเดียวกับแท็บเตรียมตัว)</div>${H.ex?"":`<div class="note" style="margin:4px 0 0;color:#9a3412">⚠ โรงแรมนี้ยังไม่ได้ปักหมุด ใช้ตำแหน่งกลางย่านโดยประมาณ <button class="chip" style="min-height:32px;padding:0 10px" onclick="placeFor(${H.h.id})">📍 ปักหมุด</button></div>`}`:`<div class="note" style="margin:6px 0 0">เลือกโรงแรมแล้วระบบจะคำนวณเวลาเดินทางจากที่พัก แนะนำที่ใกล้ที่พัก และเผื่อเวลาไป-กลับสถานี/สนามบินให้</div>`;
  return `<div class="card" style="margin-bottom:10px"><b>🏨 ที่พักของทริป</b>${sel}${info}</div>`;
}
// ที่พักไหนเดินทางสะดวกตามแผนที่วางไว้ (ดูจากที่ในโอซาก้าที่เลือก + วันไปเมืองอื่น)
function tpFit(){
  let hs=[];try{hs=all()}catch(e){}
  const days=[];let far=0;
  for(let i=0;i<=NIGHTS;i++){
    const L=((TP.D[i]&&TP.D[i].v)||[]).slice().sort((p,q)=>p.t-q.t);
    const os=L.filter(x=>x.a==="osaka"&&TPL[x.id]).map(x=>TPL[x.id]);
    if(os.length)days.push({f:os[0],l:os[os.length-1]});
    if(L.some(x=>x.a&&x.a!=="osaka"&&x.a!=="sg"))far++;
  }
  if(!days.length&&!far)return[];
  return hs.map(h=>{
    const ll=hasLL(h)?[h.lat,h.lng]:(HC[h.area]||null);if(!ll)return null;
    const acc=Math.min(45,tpR(10+3.5*tpKm(ll,OSK)));
    const m=days.reduce((a,d)=>a+tpMove(tpKm(ll,d.f))+tpMove(tpKm(d.l,ll)),0)+far*2*acc;
    return{h,m};
  }).filter(Boolean).sort((a,b)=>a.m-b.m);
}
function tpFitBox(H){
  const R=tpFit();if(!R.length)return "";
  const rows=R.slice(0,5).map(r=>`<div class="kv" onclick="detail(${r.h.id})" style="cursor:pointer"><span>${H&&H.h.id===r.h.id?"✓ ":""}<b>${esc(r.h.name)}</b> · ${esc(r.h.area||"")}</span><span style="text-align:right">~${sgDur(r.m)}${r.h.price!=null?` · ≈ ${night(r.h)}/คืน`:""}</span></div>`).join("");
  return `<details class="dt" style="margin-top:12px"><summary>🧭 ที่พักไหนเดินทางสะดวกตามแผนนี้</summary><div style="margin-top:8px">${rows}<div class="note">เวลาเดินทางรวมจากที่พัก→ที่แรก และที่สุดท้าย→ที่พัก ของทุกวัน (ที่ในโอซาก้า) + ไป-กลับสถานีโอซาก้าในวันไปเมืองอื่น · คำนวณคร่าว ๆ จากระยะทางตรง ไม่ใช่ตารางรถไฟจริง · แตะเพื่อดูรายละเอียดโรงแรม</div></div></details>`;
}
// เวลาเดินทางระหว่างที่ (นาที โดยประมาณ): ย่านเดียวกัน 15 (ในหมู่บ้าน 10) · ข้ามเมืองตามตาราง · อื่นๆ 90 · ที่พักอยู่โอซาก้า
const tpBuf=(a,b)=>a===b?(a==="sg"?10:15):({"kyoto|osaka":60,"kanazawa|osaka":150,"kanazawa|kyoto":150,"kanazawa|nara":210,"nara|osaka":50,"kyoto|nara":50}[[a,b].sort().join("|")]||90);
function tpWin(i){
  const H=tpHotel(),at=H?H.air:45;                                        // เวลาที่พัก↔สนามบิน (ค่ากลาง 45 นาที)
  const m0=i===0?sgJ(F[0].arr)+150+(at-45):0;                            // วันแรก: เผื่อผ่านตม./รับกระเป๋า/เข้าเมือง
  return{s:i===0?m0:540,e:i===NIGHTS?sgJ(F[F.length-1].ap)-(90+at):1260,m0};  // วันสุดท้าย: ต้องออกจากเมืองไปสนามบิน
}
// แผนรุ่นก่อนเก็บเป็น "เวลาที่ใช้" (m) แปลงเป็นเวลาเริ่ม/จบให้อัตโนมัติ
try{for(const k in TP.D){
  const D=TP.D[k],L=(D&&D.v)||[];if(!L.some(x=>x.t==null))continue;
  let cur=Math.max(D.s||540,+k===0?sgJ(F[0].arr)+150:0),pa="osaka";
  L.forEach((x,j)=>{if(x.t!=null)return;const a=x.a||pa,bf=j?tpBuf(pa,a):(a!=="osaka"?tpBuf("osaka",a):0);x.t=cur+bf;x.u=x.t+(x.m||60);cur=x.u;pa=a;delete x.m});
}}catch(e){}
const tpRound=m=>Math.ceil(m/15)*15;
function tpDL(i){return(TP.D[i]||(TP.D[i]={v:[]})).v}
// แผนเดินทางชิราคาวาโกะที่ใช้อยู่ (วันที่เลือกในแผน + ตัวเลือกรถในหน้า "ตัวเลือกรถอื่น")
function tpSgPlan(){
  if(!TP.sgOn)return null;
  try{if(SG.mode==="manual"){sgManual();return SGO[0]||null}return sgBuild().res[0]||null}catch(e){return null}
}
const tpSgKind=i=>!TP.sgOn?"":i===SG.d?"out":(SG.n&&i===SG.d+1&&SG.d<NIGHTS?"back":"");
// ช่วงที่ติดเดินทาง [เริ่ม, จบ] ของวัน (ช่วงอื่นของวันยังใส่แผนได้)
function tpBlocks(i,o){
  const k=tpSgKind(i);if(!k||!o)return[];
  return k==="out"?[[o.leave,o.ov?1440:o.home]]:[[0,o.home]];
}
// ช่วงที่อยู่ในหมู่บ้านของวัน i (ไว้ใส่ที่เที่ยวในหมู่บ้าน) · null = วันนี้ไม่ได้อยู่หมู่บ้าน
function tpVWin(i,o){
  const k=tpSgKind(i);if(!k||!o)return null;
  if(!o.ov)return k==="out"?[o.B.a,o.R.d-TPE]:null;
  if(o.os==="sg")return k==="out"?[o.B.a,TPN]:[360,o.R.d-TPE];
  if(o.os==="mid")return k==="out"?[o.B.a,o.R.d-TPE]:null;
  return k==="back"?[o.B.a,o.R.d-TPE]:null;
}
// วันไปชิราคาวาโกะที่ "นอนที่คานาซาวะ" (เดินทางไปคานาซาวะแล้วนอนที่นั่น): ที่เที่ยวในคานาซาวะต้องไม่ถูกดันไปหลังเที่ยงคืน และไม่ต้องคิดรถไฟกลับโอซาก้า
const tpStay=(i,o)=>!!(o&&o.ov&&(o.os==="pre"||o.os==="mid")&&SG.r==="kz"&&tpSgKind(i)==="out");
// ช่วงที่ยังเดินทางไปไม่ถึงคานาซาวะ (ที่เที่ยวในคานาซาวะต้องอยู่นอกช่วงนี้)
const tpKBlock=o=>o.os==="pre"?[[o.leave,o.T&&typeof o.T.a==="number"?o.T.a:o.leave]]:[[o.leave,o.R&&typeof o.R.a==="number"?o.R.a:1440]];
// ปรับเวลาออกจากที่พัก (วันไปชิราคาวาโกะ): เลื่อนไปขบวนรถไฟก่อนหน้า/ถัดไป
function tpSgLeave(dm){
  const o=tpSgPlan();if(!o)return;
  const L=sgLists(SG.d),c=L.out.map(x=>x.d-L.ex).sort((a,b)=>a-b);
  const nx=dm<0?c.filter(v=>v<o.leave).pop():c.find(v=>v>o.leave);
  if(nx==null){toast("ไม่มีขบวนรถไฟอื่นในทิศทางนี้");return}
  const old=o.leave;sgSet("e",nx);
  const n=tpSgPlan();if(n&&n.leave===old)toast("ยังใช้ขบวนเดิม (ขบวนอื่นไม่ทันบัสหรือเงื่อนไขของวันนั้น)");
}
// เวลาออกจากที่พักของวัน: ระบบตั้งให้ (09:00 · ที่ไกลอย่างคานาซาวะ 07:30 · วันแรก = เวลาเข้าเมืองได้) หรือผู้ใช้ปรับเองด้วยปุ่ม − +
function tpDepT(i){
  const L=(TP.D[i]&&TP.D[i].v)||[],w=tpWin(i),c=TP.D[i]&&TP.D[i].s;
  const far=L.some(x=>tpRide("osaka",x.a||"osaka")>0),def=i===0?w.s:(far?450:w.s);   // วันไปคานาซาวะ (แม้มีคาเฟ่เป็นอันแรก) ออกเช้า 07:30
  const au=typeof c!=="number";
  return{t:au?def:(i===0?Math.max(c,w.m0):c),auto:au,def};
}
// ===== เดินทางไกลด้วยรถไฟ (คานาซาวะ): ระบบคำนวณ "ต้องถึงสถานีกี่โมง → รถไฟออก → ถึงปลายทาง" =====
const TPW=15;                                                    // ถึงสถานีก่อนรถออก (ที่นั่งจองทุกขบวน ต้องหาชานชาลา/ผ่านเกต)
const TPRIDE={"osaka|kanazawa":140,"kyoto|kanazawa":120};       // นาทีบนรถ รวมเปลี่ยนรถที่ทสึรุกะ (Thunderbird ~80 + เปลี่ยน ~10 + ชินคันเซ็น ~35–40)
const tpRide=(p,q)=>TPRIDE[p+"|"+q]||TPRIDE[q+"|"+p]||0;
const r5=m=>Math.ceil(m/5)*5;
const TPCN={osaka:"โอซาก้า",kyoto:"เกียวโต",kanazawa:"คานาซาวะ"};
// วันไปชิราคาวาโกะ: "พักคาเฟ่" ที่ใส่เป็นอันแรกของวัน ถือเป็นแวะก่อนขึ้นรถ จัดย้อนจากเวลารถไฟออก
function tpPreN(i,o){
  if(!o||tpSgKind(i)!=="out"||typeof o.leave!=="number")return 0;
  const L=(TP.D[i]&&TP.D[i].v)||[];let n=0;
  while(n<L.length&&L[n].id==="cafe")n++;
  return n;
}
// จัดเวลาให้อัตโนมัติ: เรียงตามลำดับในรายการ ต่อจากที่ก่อนหน้า + เวลาเดินทาง · เลี่ยงช่วงไปชิราคาวาโกะ
function tpFlow(i,o){
  const L=(TP.D[i]&&TP.D[i].v)||[];if(!L.length)return false;
  const w=tpWin(i),bl=tpBlocks(i,o),vw=tpVWin(i,o),H=tpHotel(),ex=tpEx(H),acc=tpAcc(H),n0=tpPreN(i,o),stay=tpStay(i,o);
  let end=null,pa="osaka",pl=null,px=null,ch=false;
  const set=(x,t,u)=>{if(x.t!==t||x.u!==u){x.t=t;x.u=u;ch=true}};
  L.forEach(x=>{delete x.pin;delete x.tr;delete x.rt});          // tr = ขาไป (ก่อนถึงที่นี่) · rt = ขากลับ (หลังที่นี่)
  if(n0){                                                         // แวะคาเฟ่ก่อนขึ้นรถ: ย้อนจากเวลารถออก → ถึงสถานีก่อน → ไปสถานี 15 นาที
    let e=o.leave-TPW-15;
    for(let k=n0-1;k>=0;k--){const x=L[k],d=Math.max(15,x.u-x.t);set(x,e-d,e);e=e-d-10}
    end=L[n0-1].u;px=L[n0-1];
  }
  L.forEach((x,idx)=>{
    if(idx<n0){pa=x.a||pa;pl=TPL[x.id]||pl;return}
    const d=Math.max(15,x.u-x.t),a=x.a||pa,cl=TPL[x.id]||(pa===a?pl:null),rd=pa!==a?tpRide(pa,a):0,sk=stay&&a==="kanazawa";let t;
    if(end==null){
      const base=tpDepT(i).t;let g=0;
      if(a==="sg")g=vw?0:tpBuf("osaka",a);
      else if(a==="osaka")g=i===0||!(H&&H.ll&&cl)?0:tpMove(tpKm(H.ll,cl));            // จากที่พักไปที่แรก
      else if(sk)g=(o.T&&typeof o.T.a==="number"?o.T.a:base)+15-base;
      else if(tpRide("osaka",a)){                                                     // ไปคานาซาวะ: ที่พัก → สถานี → รถไฟ
        const s=r5(base+(i===0?0:acc)),dp=s+TPW,ar=dp+tpRide("osaka",a);
        x.tr={f:"osaka",s,d:dp,a:ar};g=ar+15-base;
      }else g=tpBuf("osaka",a)+(i===0?0:ex);
      t=a==="sg"&&vw?vw[0]:base+g;
    }else if(rd&&a!=="sg"&&pa!=="sg"&&!sk){                                                // ข้ามเมืองด้วยรถไฟ ระหว่างวัน
      const s=r5(end+15),dp=s+TPW,ar=dp+rd;
      if(pa==="kanazawa"&&px)px.rt={to:a,s,d:dp,a:ar};else x.tr={f:pa,s,d:dp,a:ar};
      t=ar+15;
    }else{
      t=end+tpGap(pa,a,pl,cl);if(a==="sg"&&vw)t=Math.max(t,vw[0]);
    }
    if(sk&&o.T&&typeof o.T.a==="number")t=Math.max(t,o.T.a+15);
    t=tpRound(t);
    if(a!=="sg")for(const b of (sk?tpKBlock(o):bl))if(t<b[1]&&t+d>b[0])t=tpRound(b[1]+30);
    set(x,t,t+d);
    end=x.u;pa=a;pl=cl;px=x;
  });
  if(px&&pa==="kanazawa"&&!stay&&tpRide("kanazawa","osaka")&&!px.rt){                          // จบวันที่คานาซาวะ: คำนวณขากลับ
    const s=r5(end+15),dp=s+TPW;px.rt={to:"osaka",s,d:dp,a:dp+tpRide("kanazawa","osaka")};
  }
  return ch;
}
function tpView(v){TP.v=v;tpSave();renderPlan();scrollTo(0,0)}
function tpDay(i){TP.d=i;tpSave();renderPlan()}
function tpFl(){tpFlow(TP.d,tpSgPlan());tpSave();renderPlan()}
function tpAdd(id){
  const c=TPC.find(x=>x.id===id);if(!c)return;
  const L=tpDL(TP.d),k=L.findIndex(x=>x.id===id);
  if(k>=0)L.splice(k,1);else L.push({id,n:c.n,e:c.e,t:0,u:c.m,a:c.a==="misc"?"":c.a,h:c.h||""});
  tpFl();
}
function tpAddC(){
  const el=$("tpc"),n=((el&&el.value)||"").trim().slice(0,40);if(!n){toast("พิมพ์ชื่อที่ก่อน");return}
  tpDL(TP.d).push({id:"c"+Date.now(),n,e:"📍",t:0,u:60,a:"",h:""});tpFl();
}
function tpPreset(a){
  const L=tpDL(TP.d);let n=0;
  (TPP[a]||[]).forEach(id=>{const c=TPC.find(x=>x.id===id);if(c&&!L.some(x=>x.id===id)){L.push({id,n:c.n,e:c.e,t:0,u:c.m,a:c.a,h:c.h||""});n++}});
  tpFl();toast(n?"เติมแผนแนะนำ "+n+" ที่แล้ว":"มีครบแล้ว");
}
function tpPa(a){TP.pa=a;TPSY=0;tpSave();renderPlan()}
// ===== UI state ของหน้าแผนเที่ยว (ไม่เก็บลงเครื่อง) =====
let TPX=-1,TPS=0,TPSY=0,TPSA=0,TPG=0,TPD=null;   // การ์ดที่ขยายอยู่ · แผงเพิ่มที่เปิดอยู่ · ตำแหน่งเลื่อนของแผง · เล่นแอนิเมชันเปิดแผง · กล่องค้นหาคันไซเปิดอยู่ · ข้อมูลตอนลาก
function tpOpen(k){                                // แตะการ์ดเพื่อขยาย/ย่อ (ไม่วาดใหม่ทั้งหน้า)
  TPX=TPX===k?-1:k;
  document.querySelectorAll("#plan .pc").forEach(c=>{const on=+c.dataset.k===TPX;c.classList.toggle("open",on);const h=c.querySelector(".pc-h");if(h)h.setAttribute("aria-expanded",on)});
}
function tpSheet(on){TPS=on?1:0;TPSY=0;TPSA=on?1:0;renderPlan()}
function tpMvTo(k,to){const L=tpDL(TP.d);if(to===k||to<0||to>=L.length)return;const x=L.splice(k,1)[0];L.splice(to,0,x);TPX=to;tpFl()}
// ลากเรียงลำดับ: จับที่ ⋮⋮ แล้วลากขึ้น/ลง เส้นสีฟ้าบอกตำแหน่งที่จะวาง
function tpDragStart(e,k){
  if(e.button!=null&&e.button>0)return;
  const card=e.currentTarget.closest(".pc"),cards=[...document.querySelectorAll("#plan .pc")];if(!card)return;
  e.preventDefault();
  TPD={k,card,cards,y0:e.clientY,s0:scrollY,y:e.clientY,to:k,id:e.pointerId,el:e.currentTarget,raf:0};
  TPD.mid=cards.map(c=>{const r=c.getBoundingClientRect();return r.top+scrollY+r.height/2});
  card.classList.add("drag");
  try{e.currentTarget.setPointerCapture(e.pointerId)}catch(_){}
  addEventListener("pointermove",tpDragMove);addEventListener("pointerup",tpDragEnd);addEventListener("pointercancel",tpDragEnd);
  tpDragTick();
}
function tpDragMove(e){if(TPD&&e.pointerId===TPD.id)TPD.y=e.clientY}
function tpDragTick(){
  const d=TPD;if(!d)return;
  const h=innerHeight;let sp=0;
  if(d.y<110)sp=-Math.min(16,(110-d.y)/5);else if(d.y>h-170)sp=Math.min(16,(d.y-(h-170))/5);
  if(sp)scrollBy(0,sp);
  const dy=d.y-d.y0+(scrollY-d.s0);
  d.card.style.transform="translateY("+dy+"px)";
  const c=d.mid[d.k]+dy;let to=0;
  d.cards.forEach((_,j)=>{if(j!==d.k&&d.mid[j]<c)to++});
  d.to=to;
  const others=d.cards.filter((_,j)=>j!==d.k);
  d.cards.forEach(x=>x.classList.remove("ins-b","ins-a"));
  if(to<others.length)others[to].classList.add("ins-b");else if(others.length)others[others.length-1].classList.add("ins-a");
  d.raf=requestAnimationFrame(tpDragTick);
}
function tpDragEnd(e){
  const d=TPD;if(!d||(e&&e.pointerId!==d.id))return;
  TPD=null;cancelAnimationFrame(d.raf);
  removeEventListener("pointermove",tpDragMove);removeEventListener("pointerup",tpDragEnd);removeEventListener("pointercancel",tpDragEnd);
  try{d.el.releasePointerCapture(d.id)}catch(_){}
  d.card.style.transform="";d.card.classList.remove("drag");d.cards.forEach(x=>x.classList.remove("ins-b","ins-a"));
  if(d.to!==d.k)tpMvTo(d.k,d.to);
}
function tpCenter(sel){const p=document.querySelector(sel);if(!p)return;const a=p.querySelector(".on");if(!a)return;const pr=p.getBoundingClientRect(),ar=a.getBoundingClientRect();p.scrollLeft+=ar.left-pr.left-(pr.width-ar.width)/2}
addEventListener("keydown",e=>{if(e.key==="Escape"&&TPS&&!$("plan").classList.contains("hide"))tpSheet(0)});
// รายการที่เที่ยวในแผงเพิ่ม: ปุ่มใหญ่ 2 คอลัมน์ บอกเวลาที่ใช้/ระยะจากที่พัก และติ๊กเมื่อเลือกแล้ว
function tpPicks(pk,H,i){
  let L=TPC.filter(c=>c.a===pk).map(c=>({c,km:pk==="osaka"&&H&&H.ll&&TPL[c.id]?tpKm(H.ll,TPL[c.id]):null}));
  if(H&&L.some(x=>x.km!=null))L.sort((p,q)=>(p.km==null)-(q.km==null)||p.km-q.km);
  const dl=tpDL(i);
  return L.map(({c,km})=>{const has=dl.some(x=>x.id===c.id);return `<button class="pk ${has?"on":""}" onclick="tpAdd('${c.id}')" aria-pressed="${has}"><span class="pk-e">${c.e}</span><span class="pk-n">${esc(c.n)}<small>ใช้เวลา ${sgDur(c.m)}${km!=null?` · ห่างที่พัก ${km.toFixed(1)} กม.`:""}</small></span><span class="pk-c" aria-hidden="true">${has?"✓":"+"}</span></button>`}).join("");
}
function tpRm(k){tpDL(TP.d).splice(k,1);TPX=-1;tpFl()}
function tpMv(k,dir){const L=tpDL(TP.d),j=k+dir;if(j<0||j>=L.length)return;[L[k],L[j]]=[L[j],L[k]];delete L[k].pin;delete L[j].pin;if(TPX===k)TPX=j;tpFl()}
function tpDur(k,dm){const x=tpDL(TP.d)[k];x.u=x.t+Math.min(720,Math.max(15,x.u-x.t+dm));tpFl()}
function tpDepSet(dm){const i=TP.d,D=TP.D[i]||(TP.D[i]={v:[]}),w=tpWin(i);D.s=Math.min(780,Math.max(i===0?w.m0:330,tpRound(tpDepT(i).t+dm)));tpFl()}
function tpSortRoute(){
  const L=tpDL(TP.d),H=tpHotel(),gr={};let ch=false;
  L.forEach((x,k)=>{if(TPL[x.id])(gr[x.a]=gr[x.a]||[]).push(k)});
  Object.keys(gr).forEach(a=>{
    const ks=gr[a];if(ks.length<3)return;
    const rest=ks.map(k=>L[k]),out=[];
    let cur=a==="osaka"&&H&&H.ll&&TP.d>0?H.ll:TPL[rest[0].id];
    while(rest.length){let bi=0,bd=1e9;rest.forEach((x,j)=>{const d=tpKm(cur,TPL[x.id]);if(d<bd){bd=d;bi=j}});const x=rest.splice(bi,1)[0];out.push(x);cur=TPL[x.id]}
    ks.forEach((k,j)=>{if(L[k]!==out[j])ch=true;L[k]=out[j]});
  });
  if(!ch){toast("ลำดับนี้ใกล้กันที่สุดอยู่แล้ว");return}
  tpFl();toast("เรียงตามเส้นทางให้แล้ว");
}
function tpDepAuto(){const D=TP.D[TP.d];if(D)delete D.s;tpFl()}
function tpSg(on){TP.sgOn=on?1:0;tpSave();renderPlan()}
function tpSgDay(i){TP.sgOn=1;if(SG.n&&i>=NIGHTS)SG.n=0;tpSave();sgSet("d",i)}
function tpMode(k){if(k==="day")sgSet("n",0);else{sgSet("n",1);sgSet("o","sg")}}
function tpClear(){if(!confirm("ล้างแผนของวันนี้ทั้งหมด?"))return;TP.D[TP.d]={v:[]};tpSave();renderPlan()}
const tpRow=(t,a,b,x,ctl)=>`<div class="stp s"${x?` style="${x}"`:""}><div class="tt">${t}</div><div class="sb"><b>${a}</b>${b?`<small>${b}</small>`:""}</div>${ctl||""}</div>`;
// รายการของวัน i เรียงตามเวลา: แถวคงที่ (เครื่องบิน/เดินทางชิราคาวาโกะ) + ที่ที่เลือกเอง
function tpItems(i,o){
  const H=tpHotel(),acc=tpAcc(H),k=tpSgKind(i),w=tpWin(i),it=[],last=i===NIGHTS,mid=SG.r==="kz"?"คานาซาวะ":"ทาคายาม่า",fl=F[F.length-1],f=(t,a,b)=>it.push({t,f:1,a,b:b||""});
  const busStop=(d,n)=>f(d-10,"🚏 ถึงป้ายบัส"+n+"ก่อน","ซื้อ/จองตั๋วบัส เผื่อเดินไปป้าย"),
    trainBack=()=>{if(o&&o.U&&typeof o.U.d==="number"){if(!o.R||o.U.d-TPW>=o.R.a)f(o.U.d-TPW,"🚉 ถึงสถานี"+mid+"ก่อน","ต่อรถไฟกลับโอซาก้า · ที่นั่งจองทุกขบวน");f(o.U.d,"🚆 รถไฟกลับโอซาก้า","ออกจาก"+mid)}};
  if(i===0)f(sgJ(F[0].arr),"🛬 เครื่องลง","เริ่มเที่ยวได้ประมาณ "+sgT(w.m0));
  if(last)f(w.e,"🧳 ออกไปสนามบิน","เครื่องออก "+sgT(sgJ(fl.dep)));
  if(k&&o){
    if(k==="out"){
      {const pn=tpPreN(i,o),L0=(TP.D[i]&&TP.D[i].v)||[];
        it.push({t:pn?L0[0].t-10:o.leave-TPW-acc,f:1,dep:1,sg:1,a:"🏨 ออกจากที่พัก",b:pn?"แวะคาเฟ่ก่อนขึ้นรถ":"ไปสถานีโอซาก้า ~"+acc+" นาที"});
        f(o.leave-TPW,"🚉 ถึงสถานีโอซาก้าก่อน","ซื้อ/ถือตั๋ว หาชานชาลา · ที่นั่งจองทุกขบวน")}
      f(o.leave,o.os==="pre"&&o.ov?"🚆 ออกจากโอซาก้าไปนอนที่"+mid:"🚆 ออกจากโอซาก้า");
      if(!(o.ov&&o.os==="pre")){
        if(o.T&&typeof o.T.a==="number")f(o.T.a,"📍 ถึงสถานี"+mid);
        if(o.B&&typeof o.B.d==="number"){busStop(o.B.d,mid);f(o.B.d,"🚌 บัสออกไปชิราคาวาโกะ","จาก"+mid)}
        f(o.B.a,"📍 ถึงชิราคาวาโกะ");
      }else if(o.T&&typeof o.T.a==="number")f(o.T.a,"📍 ถึงสถานี"+mid);
      if(!o.ov){busStop(o.R.d,"ชิราคาวาโกะ");f(o.R.d,"🚌 ขึ้นบัสกลับ");trainBack();f(o.home,"🏠 ถึงโอซาก้า");if(H)f(o.home+acc,"🏨 ถึงที่พักประมาณ")}
      else if(o.os==="mid")f(o.R.d,"🚌 ขึ้นบัสกลับไป"+mid),f(1320,"🌙 นอนที่"+mid);
      else f(1320,"🌙 นอนที่"+(o.os==="sg"?"ชิราคาวาโกะ":mid));
    }else{
      if(o.os==="pre"){busStop(o.B.d,mid);f(o.B.d,"🚌 ขึ้นบัสไปชิราคาวาโกะ"),f(o.B.a,"📍 ถึงชิราคาวาโกะ")}
      if(o.os!=="mid"){busStop(o.R.d,"ชิราคาวาโกะ");f(o.R.d,"🚌 ขึ้นบัสกลับ")}
      trainBack();f(o.home,"🏠 ถึงโอซาก้า");if(H)f(o.home+acc,"🏨 ถึงที่พักประมาณ");
    }
  }
  ((TP.D[i]&&TP.D[i].v)||[]).forEach((x,j)=>{
    it.push({t:x.t,u:x.u,x,k:j});
    if(x.tr){const c=TPCN[x.tr.f]||"โอซาก้า",r=tpRide(x.tr.f,"kanazawa");
      f(x.tr.s,"🚉 ถึงสถานี"+c+"ก่อน","ซื้อ/ถือตั๋ว หาชานชาลา · ที่นั่งจองทุกขบวน");
      f(x.tr.d,"🚆 รถไฟออกจาก"+c+" (เลือกขบวนที่ออกหลังเวลานี้)","Thunderbird → ทสึรุกะ → ชินคันเซ็นไปคานาซาวะ ~"+sgDur(r)+" รวมเปลี่ยนรถ");
      f(x.tr.a,"📍 ถึงสถานีคานาซาวะ")}
    if(x.rt){const c=TPCN[x.rt.to]||"โอซาก้า";
      f(x.rt.s,"🚉 ถึงสถานีคานาซาวะก่อน","ซื้อของฝาก/หาชานชาลา · ที่นั่งจองทุกขบวน");
      f(x.rt.d,"🚆 รถไฟกลับ"+c+" (ขบวนแรกที่ทัน)","ชินคันเซ็น → ทสึรุกะ → Thunderbird ~"+sgDur(x.rt.a-x.rt.d));
      f(x.rt.a,"🏠 ถึง"+c);if(x.rt.to==="osaka"&&H)f(x.rt.a+acc,"🏨 ถึงที่พักประมาณ")}
  });
  if(!k&&((TP.D[i]&&TP.D[i].v)||[]).length)it.push({t:tpDepT(i).t,f:1,dep:1,a:i===0?"เริ่มออกเที่ยว":"ออกจากที่พักไปเที่ยว",b:""});
  return it.sort((p,q)=>p.t-q.t||(q.f?1:0)-(p.f?1:0));
}
function tpCopy(){
  const o=tpSgPlan(),H=tpHotel(),L=["🗓️ แผนเที่ยวโอซาก้า"];if(H)L.push("🏨 ที่พัก: "+H.h.name+" ("+(H.h.area||"")+")");
  for(let i=0;i<=NIGHTS;i++){
    L.push("",`📅 วัน ${i+1} · ${sgFd(i)}`);
    tpFlow(i,o);const it=tpItems(i,o);
    if(!it.some(r=>!r.f))L.push("ยังไม่วางแผน");
    it.forEach(r=>L.push(r.f?`${sgT(r.t)} ${r.a}`:`${sgT(r.t)}-${sgT(r.u)} ${r.x.n}`));
  }
  const t=L.join("\n");
  navigator.clipboard?navigator.clipboard.writeText(t).then(()=>toast("คัดลอกแผนทั้งทริปแล้ว"),()=>toast("คัดลอกไม่สำเร็จ")):toast("คัดลอกไม่ได้");
}
function renderTrip(){
  const oldSh=document.getElementById("shb");if(oldSh)TPSY=oldSh.scrollTop;
  const i=Math.min(TP.d,NIGHTS),o=tpSgPlan();if(tpFlow(i,o))tpSave();
  const kind=tpSgKind(i),w=tpWin(i),last=i===NIGHTS,bl=tpBlocks(i,o),vw=tpVWin(i,o),it=tpItems(i,o);
  const dayChips=Array.from({length:NIGHTS+1},(_,j)=>{
    const n=((TP.D[j]&&TP.D[j].v)||[]).length,k=tpSgKind(j),bd=k?"🏯":n?n:"";
    return `<button class="dtab ${j===i?"on":""}" onclick="tpDay(${j})" aria-label="วัน ${j+1} ${sgFd(j)}"${j===i?' aria-current="true"':""}><b>วัน ${j+1}${bd?` <em>${bd}</em>`:""}</b><small>${sgFd(j)}</small></button>`;
  }).join("");
  const H=tpHotel();
  let prev=null,pa="osaka",users=0,la="",lu=0,pl=null,lc=null,lx=null;
  const dp=tpDepT(i),stay=tpStay(i,o);
  const stepper=(f1,f2,val,l1,l2,extra)=>`<div class="stepper"><button class="sbtn" onclick="${f1}" aria-label="${l1}">−</button><b>${val}</b><button class="sbtn" onclick="${f2}" aria-label="${l2}">+</button>${extra||""}</div>`;
  const depHtml=`<div class="stp s fx"><div class="fx-top"><span class="fx-ic">🏨</span><div class="sb"><b>${i===0?"เริ่มออกเที่ยว":"ออกจากที่พักไปเที่ยว"}</b><small>${dp.auto?"ระบบตั้งให้ · กด − + เพื่อปรับ":"ตั้งเอง"}</small></div></div>${stepper("tpDepSet(-30)","tpDepSet(30)",sgT(dp.t),"เร็วขึ้น","ช้าลง",dp.auto?"":`<button class="sbtn" onclick="tpDepAuto()">⟲ อัตโนมัติ</button>`)}</div>`;
  const sgDep=t=>`<div class="stp s fx"><div class="fx-top"><span class="fx-ic">🏨</span><div class="sb"><b>ออกจากที่พัก</b><small>${stay?"ไปนอนที่คานาซาวะ":"ไปสถานีโอซาก้า"} · กด − + เลือกขบวนก่อนหน้า/ถัดไป</small></div></div>${stepper("tpSgLeave(-1)","tpSgLeave(1)",sgT(t),"ขบวนก่อนหน้า","ขบวนถัดไป")}</div>`;
  const gc={};tpDL(i).forEach(x=>{if(TPL[x.id])gc[x.a]=(gc[x.a]||0)+1});
  const sortBtn=Object.values(gc).some(n=>n>=3)?`<button class="btn o" style="min-height:40px;font-size:14px;margin:0 0 8px" onclick="tpSortRoute()">🧭 เรียงตามเส้นทางให้ (ที่ใกล้กันก่อน)</button>`:"";
  const rows=it.map(r=>{
    if(r.dep)return r.sg?sgDep(r.t):depHtml;
    if(r.f)return tpRow(sgT(r.t),r.a,r.b,"background:#f3f1e3");
    users++;
    const x=r.x,a=x.a||pa,wn=[],dur=x.u-x.t,cl=TPL[x.id]||(pa===a?pl:null),from=prev?(prev.a===a?pl:null):(a==="osaka"&&H&&H.ll&&i>0?H.ll:null);
    let tr="";
    if(TPL[x.id]&&from){const km=tpKm(from,TPL[x.id]);if(km>=0.3)tr=`🚇 จาก${prev?"ที่ก่อนหน้า":"ที่พัก"} ~${tpMove(km)} นาที (${km.toFixed(1)} กม.)`}
    if(prev){
      if(x.t<prev.u)wn.push("⚠ เวลาซ้อนกับที่ก่อนหน้า");
      else if(a!==prev.a&&a!=="sg"&&prev.a!=="sg"&&x.t-prev.u<tpBuf(prev.a,a))wn.push("🚆 เดินทางอาจไม่ทัน");
    }
    if(x.a==="sg"){if(!vw)wn.push("⚠ วันนี้ไม่ได้อยู่ในหมู่บ้าน");else if(x.t<vw[0]||x.u>vw[1])wn.push("⚠ นอกเวลาที่อยู่หมู่บ้าน")}
    else if((stay&&a==="kanazawa"?tpKBlock(o):bl).some(b=>x.t<b[1]&&x.u>b[0]))wn.push("⚠ ตรงกับเวลาเดินทาง");
    if(stay&&a==="kanazawa"&&x.u>1320)wn.push("⚠ เลยเวลานอน (22:00)");
    if(i===0&&x.t<w.m0)wn.push("⚠ ยังเข้าเมืองไม่ถึง");
    if(last&&x.u>w.e)wn.push("⚠ ไม่ทันไปสนามบิน");
    prev={u:x.u,a};pa=a;la=a;lu=x.u;pl=cl;lc=cl;lx=x;
    const open=TPX===r.k;
    return `<div class="stp s pc ${open?"open":""} ${wn.length?"warn":""}" data-k="${r.k}"><div class="pc-main"><span class="pc-grip" onpointerdown="tpDragStart(event,${r.k})" title="ลากเพื่อเรียงลำดับ" aria-hidden="true">⋮⋮</span><button class="pc-h" onclick="tpOpen(${r.k})" aria-expanded="${open}"><span class="pc-t"><b>${sgT(x.t)}</b><small>${sgT(x.u)}</small></span><span class="pc-b"><b>${x.e} ${esc(x.n)}</b>${tr?`<small>${tr}</small>`:""}${wn.length?`<small class="bad">${wn.join(" · ")}</small>`:""}</span><span class="pc-chev" aria-hidden="true">⌄</span></button></div>
      <div class="pc-ctl">${x.h?`<div class="pc-hint">ℹ️ ${esc(x.h)}</div>`:""}<div class="stepper"><span>ใช้เวลา</span><button class="sbtn" onclick="tpDur(${r.k},-15)" aria-label="ลดเวลา 15 นาที">−</button><b>${sgDur(dur)}</b><button class="sbtn" onclick="tpDur(${r.k},15)" aria-label="เพิ่มเวลา 15 นาที">+</button></div><div class="pc-act"><button class="sbtn" onclick="tpMv(${r.k},-1)">▲ เลื่อนขึ้น</button><button class="sbtn" onclick="tpMv(${r.k},1)">▼ เลื่อนลง</button><button class="sbtn del" onclick="tpRm(${r.k})">🗑 ลบ</button></div></div></div>`;
  }).join("");
  let back=0,bk2="";
  if(users&&!kind&&!last&&la&&la!=="sg"){
    if(la==="osaka"){if(H&&H.ll&&lc){back=lu+tpMove(tpKm(lc,H.ll));bk2="🏨 กลับถึงที่พัก"}}
    else if(!(lx&&lx.rt)){back=lu+tpBuf(la,"osaka")+tpEx(H);bk2=H?"🏨 กลับถึงที่พัก":"🚆 กลับถึงโอซาก้า"}
  }
  const backNote=back?`<div class="note" style="margin:0 0 6px;${back>1380?"color:#b91c1c;font-weight:700":""}">${bk2}ประมาณ ${sgT(back)}${back>1380?" · ค่อนข้างดึก":""}</div>`:"";
  let sgBox="";
  if(kind){
    const md=!SG.n?"day":SG.o==="sg"?"sg":"",mc=(k,t)=>`<button class="chip ${md===k?"on":""}" onclick="tpMode('${k}')">${t}</button>`;
    sgBox=`<div class="card" style="background:var(--bg);margin-top:10px"><b>🏯 วันนี้ไปชิราคาวาโกะ</b>
      ${!o?`<div class="note" style="margin:4px 0 0;color:#9a3412">ยังหาเที่ยวรถของวันนี้ไม่ได้ ลองเปลี่ยนเป็นนอนที่หมู่บ้าน หรือย้ายไปวันอื่น</div>`:""}
      ${kind==="out"?`<div class="chips" style="padding:6px 0 0;flex-wrap:wrap">${mc("day","☀️ ไป-กลับวันเดียว")}${mc("sg","🌙 นอนที่หมู่บ้าน 1 คืน")}</div>`:`<div class="note" style="margin:4px 0 0">วันนี้เดินทางกลับจากชิราคาวาโกะ</div>`}
      <div style="display:flex;gap:8px;margin-top:8px"><button class="btn o" style="min-height:40px;font-size:14px" onclick="tpView('sg')">🔍 ดูตัวเลือกรถอื่น</button><button class="btn o" style="min-height:40px;font-size:14px" onclick="tpSg(0)">ยกเลิก</button></div></div>`;
  }
  const areas=Object.keys(TPA).filter(a=>a!=="sg"||vw),pk=areas.includes(TP.pa)?TP.pa:(areas.includes("osaka")?"osaka":areas[0]);
  const tabs=areas.map(a=>`<button class="chip ${a===pk?"on":""}" onclick="tpPa('${a}')">${TPA[a]}</button>`).join("");
  const sheet=TPS?`<div class="sh-bg" onclick="tpSheet(0)"></div><div class="sh ${TPSA?"in":""}" role="dialog" aria-modal="true" aria-label="เพิ่มที่เที่ยว"><div class="sh-h"><div><b>เพิ่มที่เที่ยว</b><small>วัน ${i+1} · ${sgFd(i)} · แตะเพื่อเพิ่ม แตะอีกครั้งเพื่อเอาออก</small></div><button class="btn sh-done" onclick="tpSheet(0)">เสร็จ${users?` · ${users} ที่`:""}</button></div><div class="sh-tabs">${tabs}</div><div class="sh-body" id="shb">${TPH[pk]?`<div class="note" style="margin:2px 0 6px">${TPH[pk]}</div>`:""}${TPP[pk]?`<button class="btn o" style="min-height:44px;font-size:14px;margin-top:4px" onclick="tpPreset('${pk}')">✨ เติมแผนแนะนำ ${TPP[pk].length} ที่ (${TPA[pk].replace(/^\S+\s/,"")})</button>`:""}<div class="pk-g">${tpPicks(pk,H,i)}</div><div class="sh-cu"><input id="tpc" placeholder="หรือพิมพ์ชื่อที่เอง" onkeydown="if(event.key==='Enter')tpAddC()"><button class="btn o" onclick="tpAddC()">เพิ่ม</button></div></div></div>`:"";
  TPSA=0;
  const ov=Array.from({length:NIGHTS+1},(_,j)=>{
    const k=tpSgKind(j),L=((TP.D[j]&&TP.D[j].v)||[]).slice().sort((p,q)=>p.t-q.t).map(x=>x.n);
    const t=(k?"🏯 ชิราคาวาโกะ":"")+(k&&L.length?" · ":"")+(L.length?L.map(esc).join(" → "):(k?"":"ยังไม่วางแผน"));
    return `<div class="kv" onclick="tpDay(${j})" style="cursor:pointer"><span><b>วัน ${j+1}</b> ${sgFd(j)}</span><span style="text-align:right;flex:1;margin-left:12px">${t}</span></div>`;
  }).join("");
  const hotelBox=tpHotelBox(H),fitBox=tpFitBox(H);
  const more=`<details class="dt" style="margin-top:12px"><summary>🏨 ที่พัก · 💾 บันทึก/โหลดแผน</summary><div style="margin-top:8px">${hotelBox}${plBox()}${fitBox}${users?`<button class="btn o" style="min-height:44px;font-size:14px;margin-top:10px" onclick="tpClear()">🗑 ล้างแผนวันนี้</button>`:""}</div></details>`;
  const gdBox=`<details class="dt" ${TPG?"open":""} ontoggle="TPG=this.open?1:0;if(TPG)gdLoad()" style="margin-top:12px"><summary>🌏 ค้นหาร้านและที่เที่ยวในคันไซ</summary><section id="getoh-live-data" style="margin-top:8px"><p class="note" style="margin-top:0">ข้อมูลสถานที่และอากาศจาก Getoh Data Engine · อัปเดตจาก data/kansai.json</p><div id="gd-panel"><div class="note">กำลังโหลดข้อมูล Kansai…</div></div></section></details>`;
  $("plan").innerHTML=`<h1>🗓️ แผนเที่ยว</h1><p class="sub">เลือกวัน แล้วกด + เพิ่มที่เที่ยว ระบบจัดเวลาให้เอง</p>
  <div class="pl-days" role="tablist" aria-label="เลือกวัน">${dayChips}</div>
  <div class="card"><b style="font-size:18px">วัน ${i+1} · ${sgFd(i)}${i===0?" · วันถึง":last?" · วันกลับ":""}</b>
    <div class="tl">${rows}</div>
    ${users?`<div class="note" style="margin:0 0 6px">เวลาจัดให้อัตโนมัติ · แตะการ์ดเพื่อปรับเวลา · ลาก ⋮⋮ เพื่อเรียงลำดับ</div>`:`<div class="empty"><div style="font-size:32px">🌱</div><b>ยังไม่มีแผนวันนี้</b><p>เลือกที่ที่อยากไป ระบบจะจัดเวลาและเวลาเดินทางให้</p><button class="btn" onclick="tpSheet(1)">+ เพิ่มที่เที่ยวแรก</button></div>`}
    ${sortBtn}${backNote}${sgBox}
    ${!TP.sgOn&&!last?`<button class="btn o" style="min-height:44px;font-size:14px;margin-top:10px" onclick="tpSgDay(${i})">🏯 วันนี้ไปชิราคาวาโกะ</button>`:""}</div>
  <details class="dt" style="margin-top:12px"><summary>👀 ดูทั้งทริปในหน้าเดียว</summary><div style="margin-top:8px">${ov}
  <button class="btn o" style="min-height:44px;font-size:14px;margin-top:8px" onclick="tpCopy()">📋 คัดลอกแผนทั้งทริป (ส่งเข้า LINE)</button></div></details>
  ${more}
  ${gdBox}
  <div class="note">แผนเก็บในเครื่องนี้ · ตรวจเวลาเปิด-ปิดของแต่ละที่ก่อนไป</div>
  ${users&&!TPS?`<button class="fab" onclick="tpSheet(1)">+ เพิ่มที่เที่ยว</button>`:""}${sheet}`;
  const shb=document.getElementById("shb");if(shb)shb.scrollTop=TPSY;
  tpCenter(".pl-days");tpCenter(".sh-tabs");
  if(TPG)gdLoad();
}
// ===== บันทึก / โหลดแผน (แชร์ผ่าน Firebase /plans): ทุกคนที่มีลิงก์เห็นและโหลดไปแก้เป็นแผนของตัวเองได้ · แผนที่บันทึกแล้วแก้/เขียนทับไม่ได้ แต่ลบได้ (กฎใน firebase-rules.json: สร้างใหม่หรือลบเท่านั้น) =====
const PLK="osaka_plans_v1",PLRK="osaka_plans_cache_v1";
const plLoadLS=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k)||"null");return v==null?d:v}catch(e){return d}};
let PLM=plLoadLS(PLK,[]);if(!Array.isArray(PLM))PLM=[];                 // แผนที่บันทึกจากเครื่องนี้ (sh=1 เมื่ออัปโหลดแล้ว)
let PLR=plLoadLS(PLRK,{});if(!PLR||typeof PLR!=="object"||Array.isArray(PLR))PLR={};   // แผนจากฐานข้อมูล (แคชไว้ดูตอนออฟไลน์)
let PLC=null,plLast=0,plBusy=false;
const plInv=()=>{PLC=null};
const plLS=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}};
const plId=()=>"p"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const plWhen=ts=>ts?new Date(ts).toLocaleString("th-TH",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}):"";
const plCount=p=>p.days.reduce((n,d)=>n+d.it.filter(r=>!r.f).length,0);
const plClone=o=>JSON.parse(JSON.stringify(o));
// ลายนิ้วมือของแผนทำงาน (ที่เที่ยว+เวลา+ไปชิราคาวาโกะหรือไม่) ใช้เช็กว่าแผนทำงานตรงกับแผนที่บันทึกแล้วหรือยัง
function plSig(D,sgOn){
  const o=[];for(let i=0;i<=NIGHTS;i++)o.push([D&&D[i]&&D[i].s!=null?D[i].s:-1,((D&&D[i]&&D[i].v)||[]).map(x=>[x.id,x.n,x.t,x.u,x.a||""])]);
  return JSON.stringify([o,sgOn?1:0]);
}
// ล้างข้อมูลจากฐานข้อมูล (ใครก็เขียนได้) ให้เป็นชนิดและความยาวที่ปลอดภัยก่อนนำไปใช้/แสดง · Firebase ตัด array/object ว่างทิ้ง จึงเติมค่าเริ่มต้นกลับ
function plClean(r,id){
  try{
    if(!r||typeof r!=="object"||!/^[A-Za-z0-9_]+$/.test(String(id)))return null;
    const str=(v,n)=>String(v==null?"":v).slice(0,n),num=v=>Number.isFinite(+v)?+v:0;
    const arr=v=>Array.isArray(v)?v:(v&&typeof v==="object"?Object.values(v):[]);
    const days=[];
    for(let i=0;i<=NIGHTS;i++){
      const d=arr(r.days)[i]||{};
      days.push({l:str(d.l,30)||sgFd(i),it:arr(d.it).slice(0,60).filter(x=>x&&typeof x==="object").map(x=>x.f?{t:num(x.t),f:1,a:str(x.a,60),b:str(x.b,100)}:{t:num(x.t),u:num(x.u),n:str(x.n,60),e:str(x.e,8),h:str(x.h,100)})});
    }
    const rd=(r.d&&typeof r.d==="object")?r.d:{},rD=(rd.D&&typeof rd.D==="object")?rd.D:{},D={};
    for(let i=0;i<=NIGHTS;i++){
      const v=rD[i]&&rD[i].v;
      D[i]={v:arr(v).slice(0,40).filter(x=>x&&typeof x==="object").map(x=>{
        const t=num(x.t),o={id:str(x.id,40),n:str(x.n,60),e:str(x.e,8),t,u:Math.max(num(x.u),t+15),a:TPA[x.a]?x.a:"",h:str(x.h,100)};
        return o})};if(rD[i]&&rD[i].s!=null)D[i].s=num(rD[i].s);
    }
    const rs=(rd.SG&&typeof rd.SG==="object")?rd.SG:{},SGc={};
    ["d","e","l","s","ltd","n","m","pm"].forEach(k=>{if(rs[k]!=null)SGc[k]=num(rs[k])});
    ["r","sort","mode","o"].forEach(k=>{if(rs[k]!=null)SGc[k]=str(rs[k],12)});
    SGc.all=!!rs.all;SGc.P={};
    if(rs.P&&typeof rs.P==="object")Object.keys(rs.P).forEach(k=>{if(/^[a-z]$/.test(k))SGc.P[k]=num(rs.P[k])});
    const sgOn=rd.sgOn?1:0;
    return{id:String(id),name:str(r.name,40)||"(ไม่มีชื่อ)",ts:num(r.ts),hid:str(r.hid,12),hn:str(r.hn,60),days,d:{D,sgOn,SG:SGc},sig:plSig(D,sgOn)};
  }catch(e){return null}
}
function plBuild(){
  const m={};
  PLM.forEach(p=>{const c=p&&plClean(p,p.id);if(c)m[c.id]=c});
  Object.keys(PLR).forEach(id=>{const c=plClean(PLR[id],id);if(c)m[id]=c});   // ฐานข้อมูลมาก่อน
  PLC=m;return m;
}
const plFind=id=>(PLC||plBuild())[id]||null;
const plAll=()=>Object.values(PLC||plBuild()).sort((x,y)=>y.ts-x.ts);
const plShared=id=>!!PLR[id];
function plName(el){
  let n=((el&&el.value)||"").trim().slice(0,40);
  if(!n){const ns=plAll().map(p=>p.name);let k=plAll().length+1;while(ns.includes("แผน "+k))k++;n="แผน "+k}
  return n;
}
function plSnap(name){
  const o=tpSgPlan(),H=tpHotel(),days=[];
  for(let i=0;i<=NIGHTS;i++){
    tpFlow(i,o);
    days.push({l:sgFd(i),it:tpItems(i,o).map(r=>r.f?{t:r.t,f:1,a:r.a,b:r.b}:{t:r.t,u:r.u,n:r.x.n,e:r.x.e,h:r.x.h||""})});
  }
  tpSave();
  return{id:plId(),name,ts:Date.now(),hid:(P.bk&&P.bk.hid)||"",hn:H?H.h.name:"",days,d:plClone({D:TP.D,sgOn:TP.sgOn,SG})};
}
// เก็บในเครื่องก่อนเสมอ แล้วอัปโหลดขึ้นฐานข้อมูล (สร้างใหม่ได้อย่างเดียว ไม่เขียนทับ) · อัปโหลดไม่ได้จะลองใหม่เองตอนซิงค์
async function plUp(p){
  const {sh,...body}=p;
  try{await dbx("PUT","/plans/"+p.id,body);PLR[p.id]=body;p.sh=1;plLS(PLRK,PLR);plLS(PLK,PLM);plInv();return true}catch(e){return false}
}
async function plSave(){
  const snap=plSnap(plName($("spn")));
  if(!plCount(plClean(snap,snap.id))&&!TP.sgOn){toast("ยังไม่มีที่เที่ยวในแผน");return}
  PLM.push(snap);if(!plLS(PLK,PLM)){PLM.pop();toast("บันทึกไม่สำเร็จ (พื้นที่ในเครื่องเต็ม?)");return}
  plInv();renderPlan();
  const ok=await plUp(snap);
  toast(ok?"บันทึก \""+snap.name+"\" และแชร์ให้ทุกคนแล้ว (แก้ไขไม่ได้)":"บันทึกในเครื่องแล้ว แต่ยังแชร์ไม่ได้ (ออฟไลน์ หรือยังไม่ได้เปิดกฎ /plans ใน Firebase) จะลองใหม่ให้เอง");
  renderPlan();
}
async function plSaveCopy(id){
  const p=plFind(id);if(!p)return;
  let n=plName($("svn"));
  if(!((($("svn")||{}).value||"").trim()))n=p.name+" (สำเนา)";
  const c={id:plId(),name:n,ts:Date.now(),hid:p.hid,hn:p.hn,days:plClone(p.days),d:plClone(p.d)};
  PLM.push(c);if(!plLS(PLK,PLM)){PLM.pop();toast("บันทึกไม่สำเร็จ (พื้นที่ในเครื่องเต็ม?)");return}
  plInv();TP.vid=c.id;tpSave();renderPlan();
  const ok=await plUp(c);
  toast(ok?"บันทึกเป็นแผนใหม่ \""+c.name+"\" และแชร์แล้ว":"บันทึกเป็นแผนใหม่ในเครื่องแล้ว (ยังแชร์ไม่ได้ จะลองใหม่ให้เอง)");renderPlan();
}
function plOpen(id){TP.v="saved";TP.vid=id;tpSave();renderPlan();scrollTo(0,0)}
function plLoad(id){
  const p=plFind(id);if(!p)return;
  const cur=plSig(TP.D,TP.sgOn),has=Object.values(TP.D||{}).some(d=>d&&d.v&&d.v.length)||TP.sgOn;
  if(has&&cur!==p.sig&&!plAll().some(q=>q.sig===cur)&&!confirm("โหลด \""+p.name+"\" มาเป็นแผนทำงานของคุณ? แผนที่กำลังทำอยู่ยังไม่ได้บันทึก และจะถูกแทนที่ (แผนที่บันทึกไว้ของใครก็ไม่เปลี่ยน)"))return;
  TP.D=plClone(p.d.D);TP.sgOn=p.d.sgOn;
  Object.assign(SG,plClone(p.d.SG));sgSave();
  const hh=+p.hid;let hex=false;try{hex=!!hh&&all().some(h=>h.id===hh)}catch(e){}
  if(hex&&typeof bkSet==="function"){
    const cu=+(P.bk&&P.bk.hid);
    if(!cu)bkSet("hid",String(hh));
    else if(cu!==hh&&confirm("แผนนี้ใช้ที่พัก "+(p.hn||"โรงแรมอื่น")+"\nเปลี่ยนที่พักของทริปเป็นโรงแรมนี้ด้วยไหม?\n(ยกเลิก = คงที่พักเดิมของคุณ)"))bkSet("hid",String(hh));
  }
  TP.v="trip";TP.d=0;tpSave();renderPlan();scrollTo(0,0);
  toast("โหลดมาเป็นแผนทำงานแล้ว แก้ได้เลย แล้วกดบันทึกเป็นแผนใหม่");
}
async function plDel(id){
  const p=plFind(id);if(!p)return;
  const sh=plShared(id);
  if(!confirm("ลบแผน \""+p.name+"\" ?"+(sh?"\nแผนนี้แชร์อยู่ ลบแล้วคนอื่นจะไม่เห็นและโหลดไม่ได้อีก และกู้คืนไม่ได้":"")))return;
  if(sh){try{await dbx("DELETE","/plans/"+id)}catch(e){toast("ลบไม่สำเร็จ (ออฟไลน์ หรือยังไม่ได้อัปเดตกฎ /plans ใน Firebase)");return}}
  delete PLR[id];PLM=PLM.filter(x=>x.id!==id);plLS(PLRK,PLR);plLS(PLK,PLM);plInv();
  if(TP.vid===id)TP.v="trip";tpSave();toast("ลบแผนแล้ว");renderPlan();
}
function plCopy(id){
  const p=plFind(id);if(!p)return;
  const L=["🗓️ "+p.name];if(p.hn)L.push("🏨 ที่พัก: "+p.hn);
  p.days.forEach((d,i)=>{L.push("",`📅 วัน ${i+1} · ${d.l}`);if(!d.it.some(r=>!r.f))L.push("ยังไม่วางแผน");d.it.forEach(r=>L.push(r.f?`${sgT(r.t)} ${r.a}`:`${sgT(r.t)}-${sgT(r.u)} ${r.n}`))});
  const t=L.join("\n");
  navigator.clipboard?navigator.clipboard.writeText(t).then(()=>toast("คัดลอกแผนแล้ว"),()=>toast("คัดลอกไม่สำเร็จ")):toast("คัดลอกไม่ได้");
}
// ซิงค์กับฐานข้อมูล: ดึงแผนของทุกคน + อัปโหลดแผนที่ค้างในเครื่อง · วาดหน้าใหม่เฉพาะเมื่อรายการเปลี่ยน
async function plSync(){
  if(plBusy)return;plBusy=true;plLast=Date.now();
  try{
    const r=(await dbx("GET","/plans"))||{},before=Object.keys(PLR).sort().join();
    PLR=(r&&typeof r==="object")?r:{};plInv();
    for(const p of PLM.slice()){if(PLR[p.id])p.sh=1;else if(p.sh)PLM=PLM.filter(x=>x!==p);else await plUp(p)}   // sh=1 แต่ไม่อยู่ในฐานข้อมูลแล้ว = มีคนลบไปแล้ว
    plLS(PLRK,PLR);plLS(PLK,PLM);plInv();
    if(Object.keys(PLR).sort().join()!==before){
      const pn=$("p-plan");
      if(pn&&!pn.classList.contains("hide")){const v=($("spn")||{}).value,w=($("svn")||{}).value;renderPlan();if(v&&$("spn"))$("spn").value=v;if(w&&$("svn"))$("svn").value=w}
    }
  }catch(e){}
  plBusy=false;
}
const plBtn="min-height:36px;padding:0 10px;font-size:14px;flex:none";
function plBox(){
  const L=plAll();
  const list=L.map(p=>`<div class="kv" style="flex-wrap:wrap;gap:6px;align-items:center"><div style="flex:1;min-width:150px"><b>${esc(p.name)}</b><div style="color:var(--mut);font-size:13px">${plShared(p.id)?"🌐 แชร์แล้ว":"📱 เฉพาะเครื่องนี้"} · ${plWhen(p.ts)} · ${plCount(p)} ที่${p.hn?" · 🏨 "+esc(p.hn):""}</div></div><div style="display:flex;gap:6px"><button class="chip" style="${plBtn}" onclick="plOpen('${p.id}')">👁 ดู</button><button class="chip" style="${plBtn}" onclick="plLoad('${p.id}')">📂 โหลดมาแก้</button><button class="chip" style="${plBtn}" onclick="plDel('${p.id}')" aria-label="ลบ">🗑</button></div></div>`).join("");
  return `<div class="card" style="margin-bottom:10px"><b>💾 บันทึกแผน</b>
    <div style="display:flex;gap:8px;margin-top:6px"><input id="spn" maxlength="40" placeholder="ชื่อแผน (เช่น แผน A)" style="flex:1;min-width:0;min-height:42px;border:1px solid var(--line);border-radius:12px;padding:0 12px;font-size:15px"><button class="btn g" style="width:auto;min-height:42px;padding:0 14px;font-size:14px" onclick="plSave()">บันทึกเป็นแผนใหม่</button></div>
    <div class="note" style="margin:6px 0 0">🌐 แผนที่บันทึกแชร์ให้ทุกคนที่มีลิงก์เห็นและโหลดไปแก้เป็นแผนของตัวเองได้ · 🔒 แผนที่บันทึกแล้วแก้ไม่ได้ แต่ลบได้ (ใครมีลิงก์ก็ลบได้ กู้คืนไม่ได้) ถ้าจะปรับให้ "โหลดมาแก้" แล้วบันทึกเป็นแผนใหม่</div>
    ${list?`<details class="dt" style="margin-top:8px"><summary>แผนที่บันทึกไว้ (${L.length})</summary><div style="margin-top:6px">${list}</div></details>`:""}
</div>`;
}
function renderSaved(){
  const p=plFind(TP.vid);if(!p){TP.v="trip";renderTrip();return}
  const days=p.days.map((d,i)=>{
    const rows=d.it.map(r=>r.f?tpRow(sgT(r.t),esc(r.a),esc(r.b),"background:#f3f1e3"):tpRow(sgT(r.t)+"–"+sgT(r.u),esc(r.e+" "+r.n),r.h?esc(r.h):"","")).join("");
    return `<div class="card" style="margin-bottom:10px"><b>วัน ${i+1} · ${esc(d.l)}</b><div class="tl">${rows||`<div class="note">ไม่มีรายการ</div>`}</div></div>`;
  }).join("");
  $("plan").innerHTML=`<button class="chip" style="margin-bottom:8px" onclick="tpView('trip')">← กลับแผนทำงาน</button><h1>👁 ${esc(p.name)}</h1>
  <p class="sub">🔒 แก้ไขไม่ได้ · ${plShared(p.id)?"🌐 แชร์แล้ว":"📱 เฉพาะเครื่องนี้"} · บันทึกเมื่อ ${plWhen(p.ts)}${p.hn?" · 🏨 "+esc(p.hn):""} · ${plCount(p)} ที่</p>
  <div style="display:flex;gap:8px;margin-bottom:10px"><button class="btn" style="min-height:44px;font-size:14px" onclick="plLoad('${p.id}')">📂 โหลดมาแก้</button><button class="btn o" style="min-height:44px;font-size:14px" onclick="plCopy('${p.id}')">📋 คัดลอก</button><button class="btn o" style="min-height:44px;font-size:14px;width:auto;flex:none;padding:0 14px" onclick="plDel('${p.id}')" aria-label="ลบ">🗑</button></div>
  ${days}
  <div class="card" style="margin-bottom:10px"><b>💾 บันทึกสำเนาเป็นแผนใหม่</b><div style="display:flex;gap:8px;margin-top:6px"><input id="svn" maxlength="40" placeholder="ชื่อแผนใหม่ (เว้นว่าง = ชื่อเดิม + สำเนา)" style="flex:1;min-width:0;min-height:42px;border:1px solid var(--line);border-radius:12px;padding:0 12px;font-size:15px"><button class="btn g" style="width:auto;min-height:42px;padding:0 14px;font-size:14px" onclick="plSaveCopy('${p.id}')">บันทึกใหม่</button></div></div>
  <div class="note">แผนนี้เป็นภาพ ณ เวลาที่บันทึก ไม่เปลี่ยนตามข้อมูลโรงแรมหรือตารางรถที่แก้ภายหลัง · ตรวจเวลาเปิด-ปิดของแต่ละที่อีกครั้งก่อนไป</div>`;
}
plSync();setInterval(()=>{if(!document.hidden)plSync()},20000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)plSync()});
function renderPlan(){if(Date.now()-plLast>15000)plSync();if(TP.v==="sg")renderSG();else if(TP.v==="saved")renderSaved();else renderTrip()}
function renderSG(){
  if(SG.n&&SG.d>=NIGHTS){SG.d=Math.max(0,NIGHTS-1);SG.P={};sgSave()}
  const{res,win,wk,e,l,kz,N,ov,sg,pre}=sgBuild(),mid=kz?"คานาซาวะ":"ทาคายาม่า";SGO=res;
  const opt=(a,v,f)=>a.map(x=>`<option value="${x[0]}" ${x[0]===v?"selected":""}>${f(x[0])}</option>`).join("");
  const range=(a,b,s)=>{const r=[];for(let m=a;m<=b;m+=s)r.push([m]);return r};
  const eLab=`<label onclick="event.preventDefault()">${pre?"วันที่ 1 ออกจากโอซาก้าไม่เร็วกว่า (เช่น 13:00 = ออกบ่าย)":"ถึงสถานีโอซาก้าได้เร็วสุด"+(ov?" (วันที่ 1)":"")}${sgTm('e',SG.e,300,1080)}</label>`;
  const days=Array.from({length:N+1-(ov?1:0)},(_,i)=>[i]),shown=SG.all?res:res.slice(0,3),lastD=ov?SG.d+1:SG.d;
  const dlab=i=>ov?sgFd(i)+" → "+sgFd(i+1)+(i===0?" · เริ่มวันถึง":i+1===N?" · กลับวันสุดท้าย":""):sgFd(i)+(i===0?" · วันถึง":i===N?" · วันกลับ":"");
  const info=[SG.d===0?`🛬 วันแรก เครื่องลง ${tm(F[0].arr,"Asia/Tokyo")} ระบบเผื่อเวลาเข้าเมือง เริ่มออกจากโอซาก้าได้ไม่เร็วกว่า ${sgT(e)}`:"",lastD===N?`🛫 วันสุดท้าย เครื่องออก ${tm(F[F.length-1].dep,"Asia/Tokyo")} ต้องกลับถึงโอซาก้าไม่เกิน ${sgT(l)}`:""].filter(Boolean);
  const stayNote=pre?`🌙 วันแรกเดินทางไปนอนที่${mid} วันที่ 2 ขึ้นบัสเช้าไปเที่ยวชิราคาวาโกะ แล้วกลับโอซาก้าตอนเย็น · ตั้งเวลาออกจากโอซาก้าวันแรกด้านบน · ที่พักไม่อยู่ในไฟล์ ต้องจองเอง`:sg?"🏡 มินชุกุในหมู่บ้านมีห้องน้อย ควรจองล่วงหน้า (ข้อมูลที่พักไม่อยู่ในไฟล์) · ช่วง ม.ค.–ก.พ. บางปีมีงานไลท์อัพต้องจองแยก":`🏨 วันแรกเที่ยวชิราคาวาโกะแล้วนั่งบัสกลับมานอนที่${mid} · ที่พักไม่อยู่ในไฟล์ ต้องจองเอง`;
  $("plan").innerHTML=`<button class="chip" style="margin-bottom:8px" onclick="tpView('trip')">← กลับแผนเที่ยว</button><h1>🏯 ตัวเลือกรถไปชิราคาวาโกะ</h1><p class="sub">เลือกวันและเวลา ระบบหาเที่ยวรถไฟ+รถบัสจากโอซาก้า แบบไป-กลับวันเดียวหรือค้าง 1 คืน จากตารางในไฟล์ที่อัปโหลด · ที่เลือกที่นี่จะไปอยู่ในแผนเที่ยวให้อัตโนมัติ</p>
  <div class="pinfo" style="background:#7a4b00">⚠️ ตารางรถบัสเป็นข้อมูล ณ ${esc(SGMETA.label)} (รถไฟ ณ ${esc(SGMETA.train)}) ก่อนเดินทางจริงตรวจเวลาล่าสุดและจองที่นั่งรถบัส หลายเที่ยวต้องจองล่วงหน้า${sgLinks()}</div>
  <div class="card fm" style="margin-top:10px">
    <div class="note" style="margin:0 0 4px">รูปแบบการเดินทาง</div>
    <div class="chips" style="padding-top:0"><button class="chip ${ov?"":"on"}" onclick="sgSet('n',0)">☀️ ไป-กลับวันเดียว</button><button class="chip ${ov?"on":""}" onclick="sgSet('n',1)">🌙 ค้าง 1 คืน</button></div>
    ${ov?`<div class="note" style="margin:0 0 4px">แบบค้างคืน</div><div class="chips" style="padding-top:0"><button class="chip ${sg?"on":""}" onclick="sgSet('o','sg')">🏡 นอนที่ชิราคาวาโกะ</button><button class="chip ${!sg&&!pre?"on":""}" onclick="sgSet('o','mid')">🏨 เที่ยวก่อน แล้วนอนที่${mid}</button><button class="chip ${pre?"on":""}" onclick="sgSet('o','pre')">🌙 นอนที่${mid}ก่อน แล้วเที่ยววันถัดไป</button></div>`:""}
    <div class="note" style="margin:0 0 4px">${ov?"ไปวันไหน (นอนคืนนั้น แล้วกลับวันถัดไป)":"ไปวันไหน"}</div>
    <div class="chips" style="padding-top:0">${days.map(x=>`<button class="chip ${x[0]===SG.d?"on":""}" onclick="sgSet('d',${x[0]})">${sgFd(x[0])}${x[0]===0?" · วันถึง":!ov&&x[0]===N?" · วันกลับ":""}</button>`).join("")}</div>
    ${pre?eLab:""}
    <details class="dt" style="background:var(--bg)"><summary>⚙️ ตั้งค่าละเอียด (เส้นทาง · เวลา · เลือกขบวนเอง)</summary><div style="margin-top:10px">
    <div class="chips" style="padding-top:0"><button class="chip ${SG.mode==="auto"?"on":""}" onclick="sgSet('mode','auto')">🪄 ให้ระบบเลือก</button><button class="chip ${SG.mode==="manual"?"on":""}" onclick="sgSet('mode','manual')">✋ เลือกขบวนเอง</button></div>
    <div class="note" style="margin:0 0 4px">เส้นทาง</div>
    <div class="chips" style="padding-top:0"><button class="chip ${kz?"on":""}" onclick="sgSet('r','kz')">🚆 ผ่านคานาซาวะ</button><button class="chip ${kz?"":"on"}" onclick="sgSet('r','tky')">🚆 ผ่านนาโกย่า–ทาคายาม่า</button></div>
    <div class="g2">${pre?"":eLab}
    <label onclick="event.preventDefault()">ต้องกลับถึงโอซาก้าก่อน${ov?" (วันที่ 2)":""}${sgTm('l',SG.l,1080,1440)}</label></div>
    ${ov&&!pre?`<label onclick="event.preventDefault()">${sg?"วันที่ 2 ออกจากชิราคาวาโกะไม่เร็วกว่า":"วันที่ 2 ขึ้นรถไฟกลับจาก"+mid+"ไม่เร็วกว่า"}${sgTm('m',SG.m,360,840)}</label>`:""}
    ${pre?`<label onclick="event.preventDefault()">วันที่ 2 ขึ้นบัสไปชิราคาวาโกะไม่เร็วกว่า${sgTm('pm',SG.pm,360,720)}</label>`:""}
    ${sg?"":`<label>อยู่ชิราคาวาโกะอย่างน้อย${ov?(pre?" (วันที่ 2)":" (วันที่ 1)"):""}${SG.mode==="manual"?" (ใช้เทียบในโหมดเลือกเอง)":""}<select onchange="sgSet('s',this.value)">${opt([[60],[90],[120],[150],[180],[240],[300]],SG.s,sgDur)}</select></label>`}
    <div class="chips" style="padding-top:0"><button class="chip ${SG.ltd?"on":""}" onclick="sgSet('ltd',${SG.ltd?0:1})">${SG.ltd?"✓ ":""}รวมขบวนรถไฟ ◆ (วิ่งเฉพาะบางวัน)</button></div>
    <div class="note" style="margin:0">${kz?"คานาซาวะเป็นเส้นทางหลักจากโอซาก้า (Thunderbird ราว 2 ชม. 45 นาที + บัสราว 1 ชม. 15–25 นาที)":"ต้องต่อชินคันเซ็นจากชินโอซาก้าไปนาโกย่าก่อน ส่วนนี้ไม่มีในไฟล์ ระบบใช้ค่าประมาณรวม "+SGX+" นาที (ชินคันเซ็น Nozomi ราว 50 นาที + เปลี่ยนสถานี) ตรวจเที่ยวจริงใน Jorudan/Navitime"}</div>
    </div></details>
  </div>
  ${ov?`<div class="pinfo" style="background:#5b3b1e">${stayNote}</div>`:""}
  ${info.map(x=>`<div class="pinfo">${x}</div>`).join("")}
  ${win?`<div class="pinfo" style="background:#12301a">❄️ ช่วง 1 ธ.ค.–31 มี.ค. ไฟล์ระบุว่าบัสบางเที่ยว (△) หยุด และไม่จอดป้ายโกกายามะ-สุกานุมะ ระบบตัดเที่ยวที่หยุดออกให้แล้ว</div>`:""}
  ${wk?`<div class="pinfo" style="background:#12301a">📅 ${(()=>{const C=sgCtx(),a=[];if(C.L.wk)a.push(sgFd(SG.d));if(ov&&C.L2.wk)a.push(sgFd(SG.d+1));return a.join(" และ ")})()} เป็นเสาร์/อาทิตย์ ระบบตัดบัสเที่ยว ◆ (ไม่วิ่งเสาร์ อาทิตย์ วันหยุด) ออกให้แล้ว วันหยุดนักขัตฤกษ์ให้เช็กเพิ่มเอง</div>`:""}
  ${SG.mode==="manual"?sgManual():`${res.length?`<div style="display:flex;justify-content:space-between;align-items:center;margin:14px 0 4px"><b>พบ ${res.length} แบบ</b><div class="chips" style="padding:0"><button class="chip ${SG.sort==="stay"?"on":""}" onclick="sgSet('sort','stay')">อยู่นานสุด</button><button class="chip ${SG.sort==="early"?"on":""}" onclick="sgSet('sort','early')">กลับเร็วสุด</button></div></div>`:sgEmpty()}
  ${shown.map((o,i)=>`<div class="card" style="margin-top:10px"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b>${i===0?"⭐ ":""}แบบที่ ${i+1}${o.ov?"":" · อยู่ "+sgDur(o.stay)}</b><span class="note" style="margin:0">${o.ov?"ถึงหมู่บ้าน "+sgT(o.B.a)+" · ":""}กลับถึงโอซาก้า ${sgT(o.home)}</span></div>
    <div class="tl">${sgSteps(o,kz).map(s=>`<div class="stp s"><div class="tt">${s[0]}</div><div class="sb"><b>${esc(s[1])}</b>${s[2]?`<small>${esc(s[2])}</small>`:""}</div></div>`).join("")}</div>
    <button class="btn o" style="min-height:42px;font-size:14px" onclick="sgCopy(${SGO.indexOf(o)})">📋 คัดลอกแผนนี้ (ส่งเข้า LINE)</button><button class="btn o" style="min-height:42px;font-size:14px;margin-top:6px" onclick="sgAdopt(${SGO.indexOf(o)})">✏️ ปรับแผนนี้เอง</button></div>`).join("")}
  ${res.length>3?`<button class="btn o" style="margin-top:10px" onclick="SG.all=!SG.all;renderPlan()">${SG.all?"แสดงเฉพาะ 3 แบบแรก":"แสดงทั้งหมด "+res.length+" แบบ"}</button>`:""}
  `}
  <button class="btn o" style="margin-top:10px" onclick="sgTable()">📄 ดูตารางเที่ยวรถที่ใช้คำนวณ</button>
  <div class="note">เวลาเผื่อเปลี่ยนรถ: ${kz?SGB.kz:SGB.tky} นาที (ค่าประมาณ ไม่อยู่ในไฟล์) · ระบบเลือกรถไฟเที่ยวล่าสุดที่ยังทันบัส และรถไฟขากลับเที่ยวแรกที่ทัน · เที่ยวบัส 8:55 จากคานาซาวะถูกตัดออก เพราะเวลาถึงในไฟล์พิมพ์เป็น 17:10 น่าจะผิด</div>`;
}


// ===== Getoh Kansai Data Engine + Place Discovery (v2) =====
// ค้นหาได้ทั้งไทย/อังกฤษ/ญี่ปุ่น · แยกประเภทร้านช้อปปิ้ง · กรองทันทีที่พิมพ์ · เรียงตามความใกล้
let GD_DATA = null, GD_LOADING = null, GD_VIEW = [], GD_POS = null, GD_TIMER = 0;
let GD_CATEGORY = "shopping", GD_CITY = "all", GD_QUERY = "", GD_GROUP = "all", GD_SHOW_HIDDEN = false;
let GD_MIN_RATING = 0, GD_SORT = "complete", GD_LIMIT = 40;
const GD_GOOGLE = Object.create(null);
const GD_CATS = {attractions:"🏯 ที่เที่ยว",restaurants:"🍜 ร้านอาหาร",cafes:"☕ คาเฟ่",shopping:"🛍️ ช้อปปิ้ง",transport:"🚉 ขนส่ง"};
const GD_CITIES = ["osaka","kyoto","nara","kobe","kanazawa"];
const GD_CITY_TH = {osaka:"โอซาก้า",kyoto:"เกียวโต",nara:"นารา",kobe:"โกเบ",kanazawa:"คานาซาวะ",all:"ทุกเมือง"};
const GD_PLACEHOLDER = {
  shopping:"ค้นหา เช่น ดองกิ · ยูนิโคล่ · ร้านยา · ห้าง · ไดโซ",
  restaurants:"ค้นหา เช่น ราเมน · ซูชิ · ยากินิกุ · อุด้ง",
  cafes:"ค้นหา เช่น กาแฟ · สตาร์บัคส์ · ชา",
  attractions:"ค้นหา เช่น วัด · ศาลเจ้า · ปราสาท · พิพิธภัณฑ์",
  transport:"ค้นหา เช่น ชื่อสถานี · station",
  all:"ค้นหาทุกหมวด เช่น ดองกิ · ราเมน · วัด"
};

// ---------- ประเภทร้านช้อปปิ้ง ----------
const GD_GROUPS = {
  department:["🏬","ห้าง/ศูนย์การค้า"], supermarket:["🛒","ซูเปอร์มาร์เก็ต"], drugstore:["💊","ร้านยา/ความงาม"],
  variety:["💴","ร้านร้อยเยน/ดองกิ"], electronics:["🔌","อิเล็กทรอนิกส์/มือถือ"], fashion:["👕","เสื้อผ้า/แฟชั่น"],
  souvenir:["🎁","ของฝาก/งานคราฟต์"], books_hobby:["📚","หนังสือ/ของเล่น"], home:["🏠","ของใช้บ้าน/DIY"],
  food_drink:["🍰","ขนม/เบเกอรี่/เครื่องดื่ม"], other:["🛍️","อื่น ๆ"], convenience:["🏪","ร้านสะดวกซื้อ"], service:["🔧","ร้านบริการ/รถยนต์"]
};
const GD_HIDDEN_GROUPS = ["convenience","service"]; // ซ่อนไว้ใน "ทั้งหมด" จนกว่าจะพิมพ์ค้นหาหรือเลือกประเภทนั้น
const GD_SUBTYPE_GROUP = {
  department_store:"department", mall:"department", supermarket:"supermarket", greengrocer:"supermarket", convenience:"convenience",
  chemist:"drugstore", cosmetics:"drugstore", perfumery:"drugstore", variety_store:"variety", general:"variety", discount:"variety",
  electronics:"electronics", mobile_phone:"electronics", computer:"electronics", video_games:"electronics", camera:"electronics", hifi:"electronics",
  clothes:"fashion", shoes:"fashion", bag:"fashion", jewelry:"fashion", boutique:"fashion", fashion_accessories:"fashion", watches:"fashion", kimono:"fashion",
  gift:"souvenir", souvenir:"souvenir", antiques:"souvenir", art:"souvenir", craft:"souvenir",
  books:"books_hobby", stationery:"books_hobby", toys:"books_hobby", games:"books_hobby", musical_instrument:"books_hobby",
  doityourself:"home", houseware:"home", furniture:"home", hardware:"home", bed:"home", interior_decoration:"home", kitchen:"home",
  bakery:"food_drink", confectionery:"food_drink", alcohol:"food_drink", wine:"food_drink", tea:"food_drink", coffee:"food_drink", seafood:"food_drink", butcher:"food_drink", deli:"food_drink", rice:"food_drink", pastry:"food_drink", beverages:"food_drink", chocolate:"food_drink",
  car:"service", car_repair:"service", car_parts:"service", tyres:"service", motorcycle:"service", hairdresser:"service", beauty:"service", massage:"service",
  laundry:"service", dry_cleaning:"service", tobacco:"service", pawnbroker:"service", funeral_directors:"service", copyshop:"service", travel_agency:"service"
};
const GD_CONVENIENCE_RE = /セブン|ローソン|ファミリーマート|ファミマ|ミニストップ|デイリーヤマザキ|ヤマザキ|ポプラ|サークルK|ampm|7-?eleven|lawson|family ?mart|ministop|circle ?k|daily ?yamazaki|コンビニ/i;
// ใช้เดาประเภทจากชื่อร้านเมื่อข้อมูลเก่ายังไม่มี subtype (เรียงตามลำดับความสำคัญ)
const GD_NAME_GROUP = [
  ["service", /トヨタ|レクサス|ホンダ|honda|toyota|lexus|bmw|porsche|maserati|volkswagen|suzuki|スズキ|マツダ|mazda|ネッツ|netz|日産|nissan|ダイハツ|スバル|モータース|オートバックス|タイヤ|ガリバー|gulliver|自動車|バイク|美容|ヘア|hair|salon|サロン|理容|クリーニング|ランドリー|laundry|cleaning|接骨|整骨|質店|たばこ|タバコ|tobacco|ほぐし|エステ|esthe|新聞|フォト/i],
  ["drugstore", /ドラッグ|薬局|薬|ウェルシア|welcia|コクミン|kokumin|ココカラ|cocokara|サンドラッグ|sundrug|スギ薬局|ツルハ|マツモトキヨシ|matsumoto ?kiyoshi|ダックス/i],
  ["variety", /ダイソー|daiso|セリア|seria|キャンドゥ|can\s?do|ドン・?キホーテ|don ?quijote|ドンキ|ザ・?ビッグ|the big|100円|百円/i],
  ["department", /イオンモール|aeon ?mall|百貨店|高島屋|髙島屋|大丸|阪急百貨|伊勢丹|そごう|ビエラ|vierra|モール|プラザ|plaza|\bmall\b/i],
  ["supermarket", /スーパー|supermarket|イオン|aeon|フレスコ|fresco|成城石井|seijo|^life$|^ライフ$|関西スーパー|イズミヤ|izumiya|コープ|co-?op|生協|阪急オアシス|oasis|オークワ|okuwa|ダイエー|daiei|トーホー|toho|ヤオヒコ|生鮮|マルヨネ|西友|seiyu/i],
  ["electronics", /ヨドバシ|yodobashi|ビックカメラ|bic ?camera|エディオン|edion|ケーズデンキ|k's ?denki|ジョーシン|joshin|ソフトバンク|softbank|ドコモ|docomo|電機|電化|電器|カメラ|camera|パソコン|ノジマ|nojima|ヤマダ/i],
  ["fashion", /ユニクロ|uniqlo|ジーユー|西松屋|nishimatsuya|aoki|青山|リーガル|regal|きもの|着物|呉服|服|靴|シューズ|shoes|バッグ|jewel|宝石|時計|ブティック|boutique|ファッション|fashion|しまむら/i],
  ["souvenir", /お土産|土産|みやげ|souvenir|gift|ギフト|工芸|本舗|アンテナショップ|antenna/i],
  ["books_hobby", /書店|書房|ブックス|\bbooks?\b|本屋|tsutaya|ツタヤ|蔦屋|文具|文房具|stationery|玩具|おもちゃ|\btoy|アニメイト|animate|ゲーム|ホビー|hobby|レコード|楽器/i],
  ["home", /コーナン|kohnan|カインズ|cainz|ナフコ|nafco|ホームセンター|home ?center|家具|ふとん|布団|インテリア|ニトリ|nitori|無印|muji|園芸|ガラス/i],
  ["food_drink", /パン|ベーカリー|ブーランジェリー|ブランジェリー|boulangerie|bakery|製菓|菓子|餅|酒|リカー|liquor|ワイン|wine|茶|精肉|肉|米穀|豆|醤油|油店|寿司|漬|やまや|魚|豆腐|コーヒー|珈琲|チョコ|ケーキ|cake|スイーツ|パティスリー|ほっかほっか/i]
];
function gdGroup(p) {
  if (p._cat && p._cat !== "shopping") return "other";
  if (p._g) return p._g;
  const text = [p.name, p.name_en, p.brand, p.brand_en].filter(Boolean).join(" ");
  const sub = String(p.subtype || p.shop || "").toLowerCase();
  let g = GD_CONVENIENCE_RE.test(text) ? "convenience" : (GD_SUBTYPE_GROUP[sub] || "");
  if (!g) for (const [k, re] of GD_NAME_GROUP) { if (re.test(text)) { g = k; break; } }
  return (p._g = g || "other");
}

// ---------- ตัวช่วยค้นหา: ไทย / อังกฤษ / ญี่ปุ่น ----------
function gdNorm(s) {
  return String(s ?? "").normalize("NFKC").toLowerCase()
    .replace(/[\u30a1-\u30f6]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60)) // คาตาคานะ → ฮิรางานะ ให้ ファミ = ふぁみ
    .replace(/[\u0e47-\u0e4c]/g, "")                                              // ตัดวรรณยุกต์/การันต์ ให้ ลอว์สัน ≈ ลอวสน
    .replace(/[\s・·･\-‐–—_.,'’"()（）\[\]\/]+/g, "");
}
const GD_ALIASES = [];
(function () {
  const A = (keys, terms, group) => GD_ALIASES.push({keys: keys.map(gdNorm).filter(Boolean), terms: (terms || []).map(gdNorm).filter(Boolean), group: group || null});
  // เมือง
  A(["โอซาก้า","โอซากา","大阪"], ["osaka","大阪"]);
  A(["เกียวโต","京都"], ["kyoto","京都"]);
  A(["นารา","奈良"], ["nara","奈良"]);
  A(["โกเบ","โคเบ","神戸"], ["kobe","神戸"]);
  A(["คานาซาวะ","คานาซาว่า","金沢"], ["kanazawa","金沢"]);
  // ประเภทร้านช้อปปิ้ง
  A(["ห้าง","ห้างสรรพสินค้า","ศูนย์การค้า","มอลล์","department","departmentstore","mall"], ["百貨店","イオンモール","モール","高島屋","大丸","阪急百貨店"], "department");
  A(["ซูเปอร์","ซุปเปอร์","ซูเปอร์มาร์เก็ต","ซุปเปอร์มาร์เก็ต","supermarket","super"], ["スーパー","フレスコ","成城石井","イオン","イズミヤ","コープ","阪急オアシス"], "supermarket");
  A(["ยา","ร้านยา","ดรักสโตร์","ดรั๊กสโตร์","drugstore","drug","pharmacy","เครื่องสำอาง","ความงาม","cosmetics"], ["ドラッグ","薬","ウェルシア","welcia","コクミン","kokumin","ココカラ","サンドラッグ","スギ薬局","ツルハ","マツモトキヨシ"], "drugstore");
  A(["ร้อยเยน","ร้านร้อยเยน","100เยน","100yen"], ["ダイソー","セリア","キャンドゥ","100円","百円"], "variety");
  A(["ไดโซ","ไดโซะ","daiso"], ["ダイソー","daiso"]);
  A(["เซเรีย","seria"], ["セリア","seria"]);
  A(["แคนดู","cando"], ["キャンドゥ","cando"]);
  A(["ดองกิ","ดอนกิ","ดองกิโฮเต้","ดอนกิโฮเต้","donki","donquijote","ドンキ"], ["ドンキホーテ","donquijote","ドンキ"]);
  A(["เสื้อผ้า","แฟชั่น","fashion","clothes","รองเท้า","กระเป๋า","เครื่องประดับ"], ["ユニクロ","uniqlo","服","靴","バッグ","着物"], "fashion");
  A(["ยูนิโคล่","ยูนิโคล","uniqlo"], ["ユニクロ","uniqlo"]);
  A(["มูจิ","muji"], ["無印良品","muji","無印"]);
  A(["อิเล็กทรอนิกส์","อีเล็กทรอนิกส์","อุปกรณ์ไฟฟ้า","เครื่องใช้ไฟฟ้า","กล้อง","มือถือ","คอมพิวเตอร์","ไอที","electronics","camera"], ["ヨドバシ","ビックカメラ","エディオン","ケーズデンキ","ジョーシン","電機","電化","カメラ"], "electronics");
  A(["โยโดบาชิ","yodobashi"], ["ヨドバシ","yodobashi"]);
  A(["บิ๊กคาเมร่า","บิกคาเมร่า","biccamera"], ["ビックカメラ","biccamera"]);
  A(["ของฝาก","ซูเวนีร์","ของที่ระลึก","งานคราฟต์","หัตถกรรม","souvenir","gift"], ["お土産","土産","みやげ","ギフト","工芸","本舗"], "souvenir");
  A(["หนังสือ","ร้านหนังสือ","เครื่องเขียน","ของเล่น","การ์ตูน","มังงะ","อนิเมะ","อะนิเมะ","books","book","toy","anime"], ["書店","書房","ブックス","本屋","tsutaya","蔦屋","玩具","おもちゃ","アニメイト","animate","文具"], "books_hobby");
  A(["ทสึทายะ","ซึทายะ","tsutaya"], ["tsutaya","ツタヤ","蔦屋"]);
  A(["อนิเมท","animate"], ["アニメイト","animate"]);
  A(["ของใช้","ของใช้ในบ้าน","โฮมเซ็นเตอร์","เฟอร์นิเจอร์","diy","home","homecenter"], ["コーナン","カインズ","ナフコ","ホームセンター","家具","ニトリ"], "home");
  A(["ขนม","เบเกอรี่","ขนมปัง","เค้ก","ของหวาน","เหล้า","สาเก","ไวน์","เครื่องดื่ม","ชา","bakery","sweets","wine","sake","liquor","tea"], ["パン","ベーカリー","ブーランジェリー","boulangerie","製菓","菓子","酒","リカー","ワイン","茶","スイーツ"], "food_drink");
  A(["สะดวกซื้อ","คอนวีเนียนสโตร์","คอนวีเนียน","คอนบินิ","คอมบินิ","convenience"], ["コンビニ","セブン","ローソン","ファミリーマート","ミニストップ","デイリーヤマザキ"], "convenience");
  A(["เซเว่น","เซเว่นอีเลฟเว่น","7-eleven","7eleven","seven","7-11"], ["セブン","7eleven"]);
  A(["ลอว์สัน","ลอสัน","โลว์สัน","โลสัน","lawson"], ["ローソン","lawson"]);
  A(["แฟมิลี่มาร์ท","แฟมิลี่มาร์ต","แฟมิลีมาร์ท","แฟมิมา","familymart"], ["ファミリーマート","ファミマ","familymart"]);
  A(["อิออน","ไอออน","aeon"], ["イオン","aeon"]);
  A(["มัตสึโมโตะ","มัตสึโมโต้","มัตสึโมโตะคิโยชิ","มัตสึคิโย","matsukiyo"], ["マツモトキヨシ","matsumotokiyoshi","マツキヨ"]);
  A(["ซันดรัก","sundrug"], ["サンドラッグ","sundrug"]);
  // อาหาร / คาเฟ่ / ที่เที่ยว / ขนส่ง
  A(["ราเมน","ราเมง","ramen"], ["ラーメン","拉麺","麺","ramen","中華そば"]);
  A(["ซูชิ","sushi"], ["寿司","すし","sushi","鮨"]);
  A(["ยากินิกุ","ยากินิคุ","ปิ้งย่าง","yakiniku"], ["焼肉","焼き肉","yakiniku"]);
  A(["อุด้ง","อูด้ง","udon"], ["うどん","udon"]);
  A(["โซบะ","soba"], ["そば","蕎麦","soba"]);
  A(["ทงคัตสึ","ทงคัทสึ","หมูทอด","tonkatsu"], ["とんかつ","tonkatsu","カツ"]);
  A(["ทาโกะยากิ","takoyaki"], ["たこ焼","takoyaki"]);
  A(["โอโคโนมิยากิ","okonomiyaki"], ["お好み焼","okonomiyaki"]);
  A(["อิซากายะ","izakaya"], ["居酒屋","izakaya"]);
  A(["แกงกะหรี่","กะหรี่","curry"], ["カレー","curry"]);
  A(["กาแฟ","คาเฟ่","coffee","cafe"], ["珈琲","コーヒー","カフェ","cafe","coffee","喫茶"]);
  A(["สตาร์บัคส์","สตาบัค","สตาร์บัค","starbucks"], ["スターバックス","starbucks","スタバ"]);
  A(["วัด","temple"], ["寺","temple"]);
  A(["ศาลเจ้า","shrine"], ["神社","shrine","大社","宮"]);
  A(["ปราสาท","castle"], ["城","castle"]);
  A(["พิพิธภัณฑ์","museum"], ["博物館","美術館","museum","記念館"]);
  A(["สวน","สวนสาธารณะ","park","garden"], ["公園","庭園","庭","park","garden"]);
  A(["สถานี","station"], ["駅","station"]);
})();
function gdAliasFor(tok) {
  return GD_ALIASES.filter(a => a.keys.some(k => k === tok || (tok.length >= 3 && k.startsWith(tok))));
}
let GD_QCACHE = {q: null, toks: []};
function gdParseQuery(q) {
  q = String(q || "").trim();
  if (GD_QCACHE.q === q) return GD_QCACHE.toks;
  const toks = q.split(/\s+/).map(gdNorm).filter(Boolean).map(n => ({n, al: gdAliasFor(n)}));
  GD_QCACHE = {q, toks};
  return toks;
}
function gdHay(p) {
  if (p._h) return p._h;
  // ไม่ใส่ชื่อหมวด/ประเภท (เช่น "ร้านร้อยเยน/ดองกิ") ลงไป ไม่งั้นค้นแบรนด์หนึ่งแล้วได้ร้านอื่นในหมวดเดียวกันปนมา
  return (p._h = gdNorm([p.name, p.name_en, p.name_th, p.brand, p.brand_en, p.city, p.address, p.subtype, p.cuisine, p.category, p.description].filter(Boolean).join(" ")));
}
function gdMatch(p, toks) {
  if (!toks.length) return true;
  const h = gdHay(p), g = p._cat === "shopping" ? gdGroup(p) : "";
  return toks.every(t => h.includes(t.n) || t.al.some(a => (a.group && g === a.group) || a.terms.some(x => h.includes(x))));
}

// ---------- ข้อมูลพื้นฐาน ----------
const gdEsc = v => typeof esc === "function" ? esc(String(v ?? "")) : String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function gdArray(v) { if (Array.isArray(v)) return v; if (v && typeof v === "object") return Object.values(v); return []; }
function gdCategories(data) {
  const cat = data && data.categories || {}, pl = data && data.places || {}, out = {};
  Object.keys(GD_CATS).forEach(k => { const a = gdArray(cat[k]); out[k] = a.length ? a : gdArray(pl[k]); });
  return out;
}
function gdIndex() { // ใส่ชื่อหมวดให้ทุกรายการ (ใช้ตอนค้นหาข้ามหมวด)
  const cats = gdCategories(GD_DATA);
  Object.keys(cats).forEach(k => cats[k].forEach(p => { p._cat = k; }));
}
function gdCityName(v) {
  const s = String(v || "").toLowerCase();
  if (s.includes("osaka") || s.includes("โอซาก้า") || s.includes("大阪")) return "osaka";
  if (s.includes("kyoto") || s.includes("เกียวโต") || s.includes("京都")) return "kyoto";
  if (s.includes("nara") || s.includes("นารา") || s.includes("奈良")) return "nara";
  if (s.includes("kobe") || s.includes("โกเบ") || s.includes("神戸")) return "kobe";
  if (s.includes("kanazawa") || s.includes("คานาซาวะ") || s.includes("คานาซาว่า") || s.includes("金沢")) return "kanazawa";
  return s || "other";
}
const gdCityLabel = v => GD_CITY_TH[v] || v;
const gdHasGoogle = () => !!window.GETOH_PLACES_API_URL;
const gdKey = p => String(p.id || p.osm_id || p.name);
function gdRating(p) { const g = GD_GOOGLE[gdKey(p)] || {}; const n = Number(g.rating ?? p.rating ?? p.google_rating); return Number.isFinite(n) && n > 0 ? n : null; }
function gdReviewCount(p) { const g = GD_GOOGLE[gdKey(p)] || {}; const n = Number(g.userRatingCount ?? p.user_rating_count ?? p.review_count); return Number.isFinite(n) && n >= 0 ? n : null; }
function gdCoord(p) { const la = Number(p.latitude ?? p.lat), lo = Number(p.longitude ?? p.lon); return Number.isFinite(la) && Number.isFinite(lo) ? [la, lo] : null; }
function gdDist(p) {
  if (!GD_POS) return null; const c = gdCoord(p); if (!c) return null;
  const R = 6371, r = x => x * Math.PI / 180, dLa = r(c[0] - GD_POS.lat), dLo = r(c[1] - GD_POS.lon);
  const a = Math.sin(dLa / 2) ** 2 + Math.cos(r(GD_POS.lat)) * Math.cos(r(c[0])) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
const gdFmtDist = d => d < 1 ? Math.round(d * 1000 / 10) * 10 + " ม." : d < 100 ? d.toFixed(1) + " กม." : "ไกลมาก";
function gdComplete(p) { return (p.name_en ? 2 : 0) + (p.opening_hours ? 2 : 0) + (p.website ? 1 : 0) + (p.phone ? 1 : 0) + (p.address ? 1 : 0) + (p.wikidata ? 3 : 0); }
const gdTitle = p => { const en = p.name_th || p.name_en; return en && gdNorm(en) !== gdNorm(p.name) ? en : (p.name || "ไม่มีชื่อ"); };
const gdSub = p => { const en = p.name_th || p.name_en; return en && gdNorm(en) !== gdNorm(p.name) ? (p.name || "") : ""; };
const gdToast = m => { try { typeof toast === "function" ? toast(m) : 0; } catch (e) {} };

// ---------- โหลด / ตั้งค่า ----------
async function gdLoad(force = false) {
  const host = document.getElementById("gd-panel"); if (!host) return;
  if (GD_DATA && !force) { gdRender(); return; }
  if (GD_LOADING && !force) { await GD_LOADING; gdRender(); return; }
  GD_LOADING = (async () => { try { const r = await fetch("data/kansai.json?ts=" + Date.now(), {cache: "no-store"}); if (!r.ok) throw Error("HTTP " + r.status); GD_DATA = await r.json(); gdIndex(); } catch (e) { console.warn("Getoh Kansai data load failed", e); GD_DATA = null; } })();
  await GD_LOADING; GD_LOADING = null; gdRender();
}
function gdSetCategory(k) { if (k !== "all" && !GD_CATS[k]) return; GD_CATEGORY = k; GD_GROUP = "all"; GD_LIMIT = 40; gdRender(); }
function gdSetCity(k) { GD_CITY = k; GD_LIMIT = 40; gdRender(); }
function gdSetGroup(k) { GD_GROUP = k; GD_LIMIT = 40; gdRenderList(); }
function gdOnInput(v) { clearTimeout(GD_TIMER); GD_TIMER = setTimeout(() => { GD_QUERY = String(v || ""); GD_LIMIT = 40; gdRenderList(); }, 120); }
function gdSetRating(v) { GD_MIN_RATING = Number(v) || 0; GD_LIMIT = 40; gdRenderList(); }
function gdSetSort(v) { if (v === "near" && !GD_POS) { gdNear(); return; } GD_SORT = v; gdRenderList(); }
function gdShowMore() { GD_LIMIT += 40; gdRenderList(); }
function gdToggleHidden() { GD_SHOW_HIDDEN = !GD_SHOW_HIDDEN; GD_LIMIT = 40; gdRenderList(); }
function gdClear() { GD_QUERY = ""; GD_GROUP = "all"; GD_MIN_RATING = 0; GD_SHOW_HIDDEN = false; GD_SORT = "complete"; GD_LIMIT = 40; gdRender(); }
function gdWiden() { GD_CITY = "all"; GD_CATEGORY = "all"; GD_GROUP = "all"; GD_LIMIT = 40; gdRender(); }
function gdNear() {
  if (!navigator.geolocation) { gdToast("เบราว์เซอร์นี้ไม่รองรับตำแหน่ง"); return; }
  gdToast("กำลังหาตำแหน่งของคุณ…");
  navigator.geolocation.getCurrentPosition(pos => {
    GD_POS = {lat: pos.coords.latitude, lon: pos.coords.longitude}; GD_SORT = "near";
    const R = 6371, r = x => x * Math.PI / 180, dLa = r(34.6937 - GD_POS.lat), dLo = r(135.5023 - GD_POS.lon);
    const far = 2 * R * Math.asin(Math.sqrt(Math.sin(dLa / 2) ** 2 + Math.cos(r(GD_POS.lat)) * Math.cos(r(34.6937)) * Math.sin(dLo / 2) ** 2));
    if (far > 300) gdToast("ตำแหน่งปัจจุบันอยู่ไกลจากคันไซ ปุ่มนี้จะมีประโยชน์เมื่อไปถึงญี่ปุ่นแล้ว");
    gdRender();
  }, () => gdToast("เปิดตำแหน่งไม่ได้ ตรวจสิทธิ์ตำแหน่งในเบราว์เซอร์"), {enableHighAccuracy: false, timeout: 10000, maximumAge: 120000});
}
function gdAdd(i) {
  const p = GD_VIEW[i]; if (!p) return;
  const n = gdTitle(p).trim().slice(0, 40); if (!n) return;
  const L = tpDL(TP.d); if (L.some(x => String(x.n || "").toLowerCase() === n.toLowerCase())) { gdToast("มีสถานที่นี้ในแผนวันนี้แล้ว"); return; }
  L.push({id: "gd" + Date.now(), n, e: "📍", t: 0, u: 60, a: TP.pa || "", h: ""}); tpFl(); gdToast("เพิ่ม " + n + " ในแผนวันนี้แล้ว");
}

// ---------- Google Places (ทางเลือก ใช้เมื่อตั้ง proxy แล้ว) ----------
function gdGoogleHtml(g) {
  const rating = Number(g.rating), count = Number(g.userRatingCount);
  const reviews = gdArray(g.reviews).slice(0, 5).map(rv => `<div style="padding:8px 0;border-top:1px solid var(--line)"><b style="color:var(--amb)">${"★".repeat(Math.max(0, Math.min(5, Number(rv.rating) || 0)))}</b> <span class="note">${rv.authorAttribution?.uri && /^https:\/\//.test(rv.authorAttribution.uri) ? `<a href="${gdEsc(rv.authorAttribution.uri)}" target="_blank" rel="noopener" style="color:var(--sky)">${gdEsc(rv.authorAttribution?.displayName || "ผู้รีวิว Google")}</a>` : gdEsc(rv.authorAttribution?.displayName || "ผู้รีวิว Google")} · ${gdEsc(rv.relativePublishTimeDescription || "")}</span><div style="font-size:13px;margin-top:3px">${gdEsc(rv.text?.text || rv.text || "")}</div></div>`).join("");
  return `<div style="margin-top:6px"><b>${gdEsc(g.name || "Google Places match")}</b>${g.address ? `<div class="note">${gdEsc(g.address)}</div>` : ""}<div><b style="color:var(--amb)">★ ${Number.isFinite(rating) ? rating.toFixed(1) : "ไม่มีคะแนน"}/5</b> <span class="note">${Number.isFinite(count) ? count.toLocaleString("th-TH") + " รีวิว" : ""}</span>${g.googleMapsUri ? ` · <a href="${gdEsc(g.googleMapsUri)}" target="_blank" rel="noopener" style="color:var(--sky)">Google Maps ↗</a>` : ""}${g.websiteUri ? ` · <a href="${gdEsc(g.websiteUri)}" target="_blank" rel="noopener" style="color:var(--sky)">เว็บไซต์ ↗</a>` : ""}</div></div>${reviews || '<div class="note">Google Places ไม่ส่งรีวิวสำหรับสถานที่นี้</div>'}<div class="note">ข้อมูลและรีวิวจาก Google · แสดงตามเงื่อนไขการระบุแหล่งที่มาของ Google</div>`;
}
async function gdGoogleLookup(i) {
  const p = GD_VIEW[i]; if (!p) return;
  const endpoint = window.GETOH_PLACES_API_URL;
  if (!endpoint) { gdToast("ยังไม่ได้ตั้งค่า Google Places Proxy · ดูวิธีตั้งค่าใน README"); return; }
  const card = document.getElementById("gd-g-" + i); if (card) card.innerHTML = '<span class="note">กำลังค้นหาข้อมูล Google Places…</span>';
  try {
    const r = await fetch(endpoint, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({query: [p.name_en || p.name, p.city, "Japan"].filter(Boolean).join(" "), ...(gdCoord(p) ? {latitude: gdCoord(p)[0], longitude: gdCoord(p)[1]} : {})})});
    const data = await r.json(); if (!r.ok) throw Error(data.error || ("HTTP " + r.status));
    const place = data.place || data; if (!place || !place.id) throw Error("ไม่พบสถานที่ที่ตรงกัน");
    GD_GOOGLE[gdKey(p)] = place; gdRenderList();
  } catch (e) { console.warn("Google Places lookup failed", e); const c = document.getElementById("gd-g-" + i); if (c) c.innerHTML = `<span class="note">ดึงข้อมูลไม่สำเร็จ: ${gdEsc(e.message || "ลองใหม่อีกครั้ง")}</span>`; }
}

// ---------- กรอง / เรียง ----------
function gdCompute() {
  const cats = gdCategories(GD_DATA);
  const src = GD_CATEGORY === "all" ? Object.values(cats).flat() : (cats[GD_CATEGORY] || []);
  const toks = gdParseQuery(GD_QUERY);
  const byCity = src.filter(p => GD_CITY === "all" || gdCityName(p.city || p.address) === GD_CITY);
  const base = byCity.filter(p => gdMatch(p, toks));
  const isShop = GD_CATEGORY === "shopping";
  const hideOn = isShop && GD_GROUP === "all" && !GD_SHOW_HIDDEN && !toks.length;
  const counts = {}; if (isShop) base.forEach(p => { const g = gdGroup(p); counts[g] = (counts[g] || 0) + 1; });
  let list = base;
  if (isShop && GD_GROUP !== "all") list = list.filter(p => gdGroup(p) === GD_GROUP);
  else if (hideOn) list = list.filter(p => !GD_HIDDEN_GROUPS.includes(gdGroup(p)));
  const hiddenN = hideOn ? base.length - list.length : 0;
  if (GD_MIN_RATING && gdHasGoogle()) list = list.filter(p => { const n = gdRating(p); return n !== null && n >= GD_MIN_RATING; });
  list = list.slice();
  const nm = p => String(p.name_en || p.name || "");
  if (GD_SORT === "near" && GD_POS) list.sort((a, b) => (gdDist(a) ?? 1e9) - (gdDist(b) ?? 1e9));
  else if (GD_SORT === "rating") list.sort((a, b) => (gdRating(b) || 0) - (gdRating(a) || 0));
  else if (GD_SORT === "reviews") list.sort((a, b) => (gdReviewCount(b) || 0) - (gdReviewCount(a) || 0));
  else if (GD_SORT === "name") list.sort((a, b) => nm(a).localeCompare(nm(b)));
  else list.sort((a, b) => gdComplete(b) - gdComplete(a) || nm(a).localeCompare(nm(b)));
  return {list, counts, hiddenN, baseN: base.length, srcN: src.length, byCityN: byCity.length, toks, isShop};
}

// ---------- วาดหน้าจอ ----------
function gdCard(p, i) {
  const key = gdKey(p), g = GD_GOOGLE[key] || {}, rating = gdRating(p), count = gdReviewCount(p), c = gdCoord(p), d = gdDist(p);
  const sub = gdSub(p), grp = p._cat === "shopping" ? GD_GROUPS[gdGroup(p)] : null;
  const tags = [grp ? grp[0] + " " + grp[1] : "", GD_CATEGORY === "all" && GD_CATS[p._cat] ? GD_CATS[p._cat] : "", p.city || "", d !== null ? "📏 " + gdFmtDist(d) : ""].filter(Boolean)
    .map(t => `<span style="display:inline-block;padding:2px 8px;margin:0 6px 4px 0;border:1px solid var(--line);border-radius:999px;font-size:12px;color:var(--mut)">${gdEsc(t)}</span>`).join("");
  const lines = [p.address ? "📍 " + p.address : "", p.opening_hours ? "🕒 " + String(p.opening_hours).replace(/^24\/7$/, "เปิด 24 ชม.") : "", p.phone ? "☎ " + p.phone : ""].filter(Boolean)
    .map(t => `<div class="note" style="margin:2px 0">${gdEsc(t)}</div>`).join("");
  const lk = (href, label) => `<a href="${gdEsc(href)}" target="_blank" rel="noopener" style="color:var(--sky);font-size:13px">${label}</a>`;
  const links = [
    c ? lk(`https://www.google.com/maps/search/?api=1&query=${c[0]},${c[1]}`, "📍 แผนที่") : "",
    c ? lk(`https://www.google.com/maps/dir/?api=1&destination=${c[0]},${c[1]}`, "🧭 นำทาง") : "",
    lk("https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(gdTitle(p) + " " + (p.city || "Japan")), "⭐ รีวิวใน Google Maps"),
    p.website && /^https?:\/\//i.test(p.website) ? lk(p.website, "🌐 เว็บไซต์") : ""
  ].filter(Boolean).join("");
  const gBtn = gdHasGoogle() ? `<button class="chip" style="min-height:34px" onclick="gdGoogleLookup(${i})">⭐ โหลดคะแนน Google</button>` : "";
  return `<article style="padding:12px 0;border-top:1px solid var(--line)">
   <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><div style="min-width:0"><b>${gdEsc(gdTitle(p))}</b>${sub ? `<div class="note" style="margin:0">${gdEsc(sub)}</div>` : ""}</div>${rating !== null ? `<span style="white-space:nowrap;color:var(--amb);font-weight:700">★ ${rating.toFixed(1)}${count !== null ? ` <small class="note">(${count.toLocaleString("th-TH")})</small>` : ""}</span>` : ""}</div>
   <div style="margin-top:4px">${tags}</div>${lines}
   <div style="display:flex;gap:12px;flex-wrap:wrap;margin:6px 0">${links}</div>
   <div style="display:flex;gap:6px;flex-wrap:wrap"><button class="chip" style="min-height:34px" onclick="gdAdd(${i})">＋ เพิ่มในแผนวันนี้</button>${gBtn}</div>
   <div id="gd-g-${i}">${g.id ? gdGoogleHtml(g) : ""}</div></article>`;
}
function gdRenderList() {
  const listEl = document.getElementById("gd-list"); if (!listEl || !GD_DATA) return;
  const r = gdCompute(), shown = r.list.slice(0, GD_LIMIT); GD_VIEW = shown;
  // ชิปประเภทย่อย (เฉพาะช้อปปิ้ง)
  const subEl = document.getElementById("gd-sub");
  if (subEl) {
    if (!r.isShop) subEl.innerHTML = "";
    else {
      const visibleAll = GD_SHOW_HIDDEN || r.toks.length ? r.baseN : r.baseN - GD_HIDDEN_GROUPS.reduce((n, k) => n + (r.counts[k] || 0), 0);
      const chip = (k, label, n, muted) => `<button class="chip ${GD_GROUP === k ? "on" : ""}" style="${muted && GD_GROUP !== k ? "opacity:.7" : ""}${n === 0 && GD_GROUP !== k ? ";opacity:.4" : ""}" onclick="gdSetGroup('${k}')">${label} (${n})</button>`;
      subEl.innerHTML = chip("all", "ทั้งหมด", visibleAll) + Object.keys(GD_GROUPS).filter(k => (r.counts[k] || 0) > 0 || GD_GROUP === k).map(k => chip(k, GD_GROUPS[k][0] + " " + GD_GROUPS[k][1], r.counts[k] || 0, GD_HIDDEN_GROUPS.includes(k))).join("");
    }
  }
  const metaEl = document.getElementById("gd-meta");
  if (metaEl) {
    const bits = [`<b>${GD_CATEGORY === "all" ? "🔎 ทุกหมวด" : GD_CATS[GD_CATEGORY]}</b> · พบ ${r.list.length.toLocaleString("th-TH")} รายการ${shown.length < r.list.length ? " (แสดง " + shown.length + ")" : ""}`];
    if (r.hiddenN) bits.push(`<button class="chip" style="min-height:30px;font-size:12px" onclick="gdToggleHidden()">ซ่อนร้านสะดวกซื้อ/ร้านบริการ ${r.hiddenN} รายการ · แตะเพื่อแสดง</button>`);
    else if (r.isShop && GD_SHOW_HIDDEN && GD_GROUP === "all" && !r.toks.length) bits.push(`<button class="chip on" style="min-height:30px;font-size:12px" onclick="gdToggleHidden()">กำลังแสดงร้านสะดวกซื้อ/ร้านบริการ · แตะเพื่อซ่อน</button>`);
    metaEl.innerHTML = bits.join(" ");
  }
  let empty = "";
  if (!r.list.length) {
    if (GD_CITY !== "all" && GD_CATEGORY !== "all" && !r.byCityN && !r.toks.length)
      empty = `<div class="note" style="padding:12px 0">ยังไม่มีข้อมูล${GD_CATS[GD_CATEGORY].replace(/^\S+\s/, "")}ของ${gdCityLabel(GD_CITY)}ในไฟล์ (รอบดึงข้อมูลล่าสุดของเมืองนี้ไม่สำเร็จ ระบบจะลองใหม่ในรอบถัดไป) ลองเลือกเมืองอื่นหรือ "ทุกเมือง"</div><button class="chip" onclick="gdSetCity('all')">ดูทุกเมือง</button>`;
    else {
      let other = 0; if (r.toks.length) { const cats = gdCategories(GD_DATA); Object.values(cats).flat().forEach(p => { if (gdMatch(p, r.toks)) other++; }); }
      const srcAll = GD_CATEGORY === "all" ? Object.values(gdCategories(GD_DATA)).flat() : (gdCategories(GD_DATA)[GD_CATEGORY] || []);
      const missing = r.toks.length && GD_CITY === "all" ? GD_CITIES.filter(c => !srcAll.some(x => gdCityName(x.city || x.address) === c)).map(gdCityLabel) : [];
      const missNote = missing.length ? `<div class="note">หมายเหตุ: ข้อมูลหมวดนี้ยังไม่มีของ${missing.join(", ")} ร้านที่หาไม่เจออาจอยู่ในเมืองเหล่านั้น (ลองค้นใน Google Maps ได้)</div>` : "";
      empty = missNote + `<div class="note" style="padding:12px 0">ไม่พบ${GD_QUERY.trim() ? ` "${gdEsc(GD_QUERY.trim())}"` : "รายการ"}ตามตัวกรองนี้</div>${other && (GD_CITY !== "all" || GD_CATEGORY !== "all" || GD_GROUP !== "all") ? `<button class="chip" onclick="gdWiden()">🔎 พบ ${other} รายการในเมือง/หมวดอื่น · ดูทั้งหมด</button>` : `<div class="note">ลองพิมพ์ชื่อแบรนด์ (เช่น ดองกิ ไดโซ ยูนิโคล่) ประเภทร้าน (เช่น ร้านยา ห้าง) หรือชื่อภาษาอังกฤษ/ญี่ปุ่น</div>`}`;
    }
  }
  listEl.innerHTML = shown.map(gdCard).join("") + empty;
  const moreEl = document.getElementById("gd-more");
  if (moreEl) moreEl.innerHTML = r.list.length > GD_LIMIT ? `<button class="btn o" style="margin-top:8px" onclick="gdShowMore()">แสดงเพิ่มอีก ${Math.min(40, r.list.length - GD_LIMIT)} รายการ (เหลือ ${r.list.length - GD_LIMIT})</button>` : "";
}
function gdRender() {
  const host = document.getElementById("gd-panel"); if (!host) return;
  if (!GD_DATA) { host.innerHTML = `<div class="note">ยังโหลด data/kansai.json ไม่ได้ · ตรวจว่าไฟล์อยู่ในโฟลเดอร์ data และเปิดผ่าน GitHub Pages หรือเว็บเซิร์ฟเวอร์</div><button class="chip" onclick="gdLoad(true)">ลองโหลดอีกครั้ง</button>`; return; }
  const cats = gdCategories(GD_DATA), all = Object.values(cats).flat();
  const cities = ["all", ...GD_CITIES.filter(c => all.some(x => gdCityName(x.city || x.address) === c) || Object.keys(GD_DATA.weather || {}).some(k => gdCityName(k) === c))];
  if (!cities.includes(GD_CITY)) GD_CITY = "all";
  const inCity = a => a.filter(x => GD_CITY === "all" || gdCityName(x.city || x.address) === GD_CITY).length;
  const srcNow = GD_CATEGORY === "all" ? all : (cats[GD_CATEGORY] || []);
  const cityCount = c => c === "all" ? srcNow.length : srcNow.filter(x => gdCityName(x.city || x.address) === c).length;
  const cityBtns = cities.map(c => { const n = cityCount(c); return `<button class="chip ${GD_CITY === c ? "on" : ""}" style="${n === 0 && GD_CITY !== c ? "opacity:.45" : ""}" onclick="gdSetCity('${c}')">${gdCityLabel(c)} (${n})</button>`; }).join("");
  const catBtns = `<button class="chip ${GD_CATEGORY === "all" ? "on" : ""}" onclick="gdSetCategory('all')">🔎 ทุกหมวด (${inCity(all)})</button>` + Object.entries(GD_CATS).map(([k, v]) => `<button class="chip ${GD_CATEGORY === k ? "on" : ""}" onclick="gdSetCategory('${k}')">${v} (${inCity(cats[k])})</button>`).join("");
  const weather = GD_DATA.weather || {}, wx = Object.entries(weather).filter(([k]) => GD_CITY === "all" || gdCityName(k) === GD_CITY);
  const meta = GD_DATA.meta || {}, updated = GD_DATA.updated_at || meta.last_attempt_at || meta.updated_at || "";
  const date = updated ? new Date(updated).toLocaleString("th-TH", {dateStyle: "medium", timeStyle: "short"}) : "ยังไม่มีวันที่อัปเดต";
  const st = meta.status || meta.last_run_status || "unknown", status = st === "success" ? "อัปเดตสำเร็จ" : st === "partial" ? "อัปเดตบางส่วน" : st === "not_run" ? "รอการอัปเดตครั้งแรก" : st;
  const fails = gdArray(meta.failures);
  const wxHtml = wx.map(([k, w]) => { const ds = gdArray(w.daily).slice(0, 5).map(d => `<span style="display:inline-block;margin:4px 8px 4px 0;font-size:12px">${gdEsc(d.date || "")} · ${d.temperature_min_c ?? "–"}°/${d.temperature_max_c ?? "–"}° · ฝน ${d.precipitation_probability_max ?? "–"}%</span>`).join(""); return `<div style="padding:8px 0;border-top:1px solid var(--line)"><b>${gdCityLabel(gdCityName(w.city || k))}</b><div>${ds || '<span class="note">ยังไม่มีพยากรณ์</span>'}</div></div>`; }).join("");
  const sorts = [["complete", "ข้อมูลครบก่อน"], ["name", "ชื่อ A–Z"], ["near", "📍 ใกล้ฉัน" + (GD_POS ? "" : " (ขอตำแหน่ง)")]].concat(gdHasGoogle() ? [["rating", "คะแนน Google สูงสุด"], ["reviews", "รีวิว Google มากสุด"]] : []);
  if (!sorts.some(s => s[0] === GD_SORT)) GD_SORT = "complete";
  const inputStyle = "min-width:0;min-height:42px;border:1px solid var(--line);border-radius:10px;padding:8px 10px;font-size:14px";
  host.innerHTML = `<div class="note">สถานะ: <b>${gdEsc(status)}</b> · ${gdEsc(date)} · ทั้งหมด ${all.length.toLocaleString("th-TH")} รายการ${fails.length ? ` · <details style="display:inline"><summary style="display:inline;cursor:pointer">ดูรายละเอียด (${fails.length})</summary><div style="margin-top:4px">${fails.map(f => `<div>${gdEsc(f)}</div>`).join("")}</div></details>` : ""}</div>
 <div class="chips" style="flex-wrap:wrap;padding:4px 0">${cityBtns}</div><div class="chips" style="flex-wrap:wrap;padding:4px 0">${catBtns}</div>
 <input id="gd-q" type="search" autocomplete="off" value="${gdEsc(GD_QUERY)}" oninput="gdOnInput(this.value)" placeholder="${gdEsc(GD_PLACEHOLDER[GD_CATEGORY] || GD_PLACEHOLDER.all)}" style="${inputStyle};width:100%;margin:8px 0 4px">
 <div id="gd-sub" class="chips" style="flex-wrap:wrap;padding:4px 0"></div>
 <div style="display:flex;align-items:center;gap:8px;margin:6px 0"><span class="note" style="margin:0">เรียงตาม</span><select onchange="gdSetSort(this.value)" style="flex:1;${inputStyle};min-height:40px">${sorts.map(s => `<option value="${s[0]}" ${GD_SORT === s[0] ? "selected" : ""}>${s[1]}</option>`).join("")}</select>${gdHasGoogle() ? `<select onchange="gdSetRating(this.value)" style="${inputStyle};min-height:40px"><option value="0" ${GD_MIN_RATING === 0 ? "selected" : ""}>ทุกคะแนน</option><option value="3" ${GD_MIN_RATING === 3 ? "selected" : ""}>3★+</option><option value="4" ${GD_MIN_RATING === 4 ? "selected" : ""}>4★+</option><option value="4.5" ${GD_MIN_RATING === 4.5 ? "selected" : ""}>4.5★+</option></select>` : ""}<button class="chip" onclick="gdClear()">ล้าง</button></div>
 <div id="gd-meta" style="margin-top:6px"></div>
 ${gdHasGoogle() ? '<div class="note">ตัวกรอง/การเรียงตามดาวใช้กับรายการที่กด "โหลดคะแนน Google" แล้วเท่านั้น</div>' : ""}
 <div id="gd-list"></div><div id="gd-more"></div>
 <details style="margin-top:10px"><summary style="cursor:pointer;font-weight:700">🌤️ พยากรณ์อากาศ</summary><div style="margin-top:8px">${wxHtml || '<div class="note">ยังไม่มีข้อมูลอากาศสำหรับตัวกรองนี้</div>'}</div></details>
 <div class="note" style="margin-top:8px">ข้อมูลพื้นฐาน: © OpenStreetMap contributors (ODbL) · เวลาเปิด-ปิดมาจากชุมชน OSM โปรดเช็กอีกครั้งก่อนไป · อากาศ: Open-Meteo${gdHasGoogle() ? " · คะแนน/รีวิว: Google Places" : ""}</div>
 <button class="chip" style="margin-top:6px" onclick="gdLoad(true)">↻ โหลดข้อมูลล่าสุด</button>`;
  gdRenderList();
}
