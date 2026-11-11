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
// n: 0=ไป-กลับวันเดียว 1=ค้าง 1 คืน · o: sg=นอนที่ชิราคาวาโกะ mid=เที่ยวก่อนแล้วนอนที่คานาซาวะ/ทาคายาม่า pre=นอนที่เมืองก่อนแล้วเที่ยววันถัดไป · m: วันที่ 2 ไม่ออกเดินทางก่อนเวลานี้ (นาที) · pm: (pre) วันที่ 2 ขึ้นบัสไปชิราคาวาโกะไม่เร็วกว่า
let SG={d:1,r:"kz",e:420,l:1350,s:150,ltd:0,sort:"stay",all:false,mode:"auto",n:0,o:"sg",m:540,pm:420,P:{}},SGO=[];
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
    `<div class="note" style="margin:0">ข้อมูลจากไฟล์ PDF ณ เม.ย. 2023 · วันที่เลือก: ${win?"อยู่ในช่วงหยุด △ ":""}${wk?"เสาร์/อาทิตย์ ":""}${!win&&!wk?"ไม่มีข้อจำกัดพิเศษ":""}${win||wk?"(เที่ยวที่ใช้ไม่ได้จะจางและขีดฆ่า)":""}</div>`
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
  osaka:["kuromon","castle","shinsekai","doton"],
  kyoto:["fushimi","kiyomizu","gion","nishiki"],
  kanazawa:["k-omicho","k-kenroku","k-castle","k-higashi"],
  sg:["s-walk","s-wada","s-lunch","s-shiro"]
};
const TPH={kanazawa:"🚆 ไป-กลับจากโอซาก้าราว 2 ชม. 10–30 นาทีต่อเที่ยว (Thunderbird ไปสึรุกะ แล้วต่อชินคันเซ็น) ระบบเผื่อเวลาเดินทางให้แล้ว · ไม่มีรถตรงแล้วตั้งแต่ มี.ค. 2024"};
// ===== เชื่อมกับระบบโรงแรม: ที่พักของทริป = โรงแรมที่เลือกไว้ในแท็บเตรียมตัว (P.bk.hid) =====
// ใช้พิกัดโรงแรมจากแผนที่ (lat/lng) ถ้ายังไม่ปักหมุดจะใช้จุดกลางย่านโดยประมาณ · ตัวเลขเวลาเดินทางเป็นค่าประมาณจากระยะทางตรง
const HC={Umeda:[34.7055,135.4983],Namba:[34.6660,135.5010],Ebisu:[34.6525,135.5063],"Shin-Imamiya":[34.6475,135.5000]};
const OSK=[34.7025,135.4959];                                   // สถานีโอซาก้า (JR) ใช้เป็นจุดขึ้นรถไปเมืองอื่น
const HAIR={Umeda:70,Namba:45,Ebisu:45,"Shin-Imamiya":40};     // ที่พัก → สนามบินคันไซ (นาที โดยประมาณ) ย่านอื่นใช้ 60
const TPL={doton:[34.6687,135.5013],castle:[34.6873,135.5262],kuromon:[34.6615,135.5063],shinsekai:[34.6525,135.5063],umeda:[34.7052,135.4903],shop:[34.6720,135.5015],kaiyukan:[34.6545,135.4289],dendentown:[34.6595,135.5058],usj:[34.6654,135.4323]}; // พิกัดที่ในโอซาก้า
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
const tpGap=(pa,a,pl,cl)=>pa==="osaka"&&a==="osaka"&&pl&&cl?tpMove(tpKm(pl,cl)):tpBuf(pa,a);
function tpHid(v){if(typeof bkSet==="function")bkSet("hid",v);renderPlan()}
function tpChips(pk,H,i){
  let L=TPC.filter(c=>c.a===pk).map(c=>({c,km:H&&H.ll&&TPL[c.id]?tpKm(H.ll,TPL[c.id]):null}));
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
// จัดเวลาให้อัตโนมัติ: เรียงตามลำดับในรายการ ต่อจากที่ก่อนหน้า + เวลาเดินทาง · เลี่ยงช่วงไปชิราคาวาโกะ · ที่ล็อกเวลา (pin) ไม่ถูกเลื่อน
function tpFlow(i,o){
  const L=(TP.D[i]&&TP.D[i].v)||[];if(!L.length)return false;
  const w=tpWin(i),bl=tpBlocks(i,o),vw=tpVWin(i,o),H=tpHotel(),ex=tpEx(H);
  let end=null,pa="osaka",pl=null,ch=false;
  L.forEach(x=>{
    const d=Math.max(15,x.u-x.t),a=x.a||pa,cl=TPL[x.id]||(a==="osaka"?pl:null);let t;
    if(x.pin!=null)t=x.pin;
    else{
      if(end==null){
        const far=tpBuf("osaka",a)>=150,base=i===0?w.s:(far?450:w.s);   // ที่ไกล (คานาซาวะ) ออกเช้าขึ้น 07:30
        let g=0;
        if(a==="sg")g=vw?0:tpBuf("osaka",a);
        else if(a==="osaka")g=i===0||!(H&&H.ll&&cl)?0:tpMove(tpKm(H.ll,cl));   // จากที่พักไปที่แรก
        else g=tpBuf("osaka",a)+(i===0?0:ex);                                  // ไปเมืองอื่น: ปรับตามระยะที่พัก→สถานี
        t=a==="sg"&&vw?vw[0]:base+g;
      }else{
        t=end+tpGap(pa,a,pl,cl);if(a==="sg"&&vw)t=Math.max(t,vw[0]);
      }
      t=tpRound(t);
      if(a!=="sg")for(const b of bl)if(t<b[1]&&t+d>b[0])t=tpRound(b[1]+30);
    }
    if(x.t!==t||x.u!==t+d){x.t=t;x.u=t+d;ch=true}
    end=x.u;pa=a;pl=a==="osaka"?cl:null;
  });
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
function tpPa(a){TP.pa=a;tpSave();renderPlan()}
function tpRm(k){tpDL(TP.d).splice(k,1);tpFl()}
function tpMv(k,dir){const L=tpDL(TP.d),j=k+dir;if(j<0||j>=L.length)return;[L[k],L[j]]=[L[j],L[k]];delete L[k].pin;delete L[j].pin;tpFl()}
function tpDur(k,dm){const x=tpDL(TP.d)[k];x.u=x.t+Math.min(720,Math.max(15,x.u-x.t+dm));tpFl()}
function tpPin(k,v){const x=tpDL(TP.d)[k];if(v==="auto")delete x.pin;else x.pin=+v;tpFl()}
function tpSg(on){TP.sgOn=on?1:0;tpSave();renderPlan()}
function tpSgDay(i){TP.sgOn=1;if(SG.n&&i>=NIGHTS)SG.n=0;tpSave();sgSet("d",i)}
function tpMode(k){if(k==="day")sgSet("n",0);else{sgSet("n",1);sgSet("o","sg")}}
function tpClear(){if(!confirm("ล้างแผนของวันนี้ทั้งหมด?"))return;TP.D[TP.d]={v:[]};tpSave();renderPlan()}
const tpRow=(t,a,b,x,ctl)=>`<div class="stp s"${x?` style="${x}"`:""}><div class="tt">${t}</div><div class="sb"><b>${a}</b>${b?`<small>${b}</small>`:""}</div>${ctl||""}</div>`;
// รายการของวัน i เรียงตามเวลา: แถวคงที่ (เครื่องบิน/เดินทางชิราคาวาโกะ) + ที่ที่เลือกเอง
function tpItems(i,o){
  const H=tpHotel(),acc=tpAcc(H),k=tpSgKind(i),w=tpWin(i),it=[],last=i===NIGHTS,mid=SG.r==="kz"?"คานาซาวะ":"ทาคายาม่า",fl=F[F.length-1],f=(t,a,b)=>it.push({t,f:1,a,b:b||""});
  if(i===0)f(sgJ(F[0].arr),"🛬 เครื่องลง","เริ่มเที่ยวได้ประมาณ "+sgT(w.m0));
  if(last)f(w.e,"🧳 ออกไปสนามบิน","เครื่องออก "+sgT(sgJ(fl.dep)));
  if(k&&o){
    if(k==="out"){
      if(H)f(o.leave-acc,"🏨 ออกจากที่พัก","ไปสถานีโอซาก้า ~"+acc+" นาที");
      f(o.leave,o.os==="pre"&&o.ov?"🚆 ออกจากโอซาก้าไปนอนที่"+mid:"🚆 ออกจากโอซาก้า");
      if(!(o.ov&&o.os==="pre"))f(o.B.a,"📍 ถึงชิราคาวาโกะ");
      if(!o.ov){f(o.R.d,"🚌 ขึ้นบัสกลับ");f(o.home,"🏠 ถึงโอซาก้า");if(H)f(o.home+acc,"🏨 ถึงที่พักประมาณ")}
      else if(o.os==="mid")f(o.R.d,"🚌 ขึ้นบัสกลับไป"+mid),f(1320,"🌙 นอนที่"+mid);
      else f(1320,"🌙 นอนที่"+(o.os==="sg"?"ชิราคาวาโกะ":mid));
    }else{
      if(o.os==="pre")f(o.B.d,"🚌 ขึ้นบัสไปชิราคาวาโกะ"),f(o.B.a,"📍 ถึงชิราคาวาโกะ");
      if(o.os!=="mid")f(o.R.d,"🚌 ขึ้นบัสกลับ");
      f(o.home,"🏠 ถึงโอซาก้า");if(H)f(o.home+acc,"🏨 ถึงที่พักประมาณ");
    }
  }
  ((TP.D[i]&&TP.D[i].v)||[]).forEach((x,j)=>it.push({t:x.t,u:x.u,x,k:j}));
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
function tpOpts(v,min){
  const a=[];for(let m=Math.max(300,min||0);m<=1500;m+=15)a.push(m);
  if(!a.includes(v))a.push(v);a.sort((p,q)=>p-q);
  return a.map(m=>`<option value="${m}" ${m===v?"selected":""}>${sgT(m)}</option>`).join("");
}
function renderTrip(){
  const i=Math.min(TP.d,NIGHTS),o=tpSgPlan();if(tpFlow(i,o))tpSave();
  const kind=tpSgKind(i),w=tpWin(i),last=i===NIGHTS,bl=tpBlocks(i,o),vw=tpVWin(i,o),it=tpItems(i,o);
  const dayChips=Array.from({length:NIGHTS+1},(_,j)=>{
    const n=((TP.D[j]&&TP.D[j].v)||[]).length,k=tpSgKind(j);
    return `<button class="chip ${j===i?"on":""}" onclick="tpDay(${j})">วัน ${j+1} · ${sgFd(j)}${k?" · 🏯":n?" · "+n+" ที่":""}</button>`;
  }).join("");
  const selS="background:transparent;border:0;font:inherit;color:inherit;text-align:center;-webkit-appearance:none;appearance:none;padding:0";
  const H=tpHotel();
  let prev=null,pa="osaka",users=0,la="",lu=0,pl=null,lc=null;
  const cb="min-height:32px;min-width:36px;padding:0 8px;font-size:14px;flex:none";
  const rows=it.map(r=>{
    if(r.f)return tpRow(sgT(r.t),r.a,r.b,"background:#f3f1e3");
    users++;
    const x=r.x,a=x.a||pa,wn=[],dur=x.u-x.t,cl=TPL[x.id]||(a==="osaka"?pl:null),from=prev?pl:(H&&H.ll&&i>0?H.ll:null);
    let tr="";
    if(a==="osaka"&&TPL[x.id]&&from){const km=tpKm(from,TPL[x.id]);if(km>=0.3)tr=`🚇 จาก${prev?"ที่ก่อนหน้า":"ที่พัก"} ~${tpMove(km)} นาที (${km.toFixed(1)} กม.)`}
    if(prev){
      if(x.t<prev.u)wn.push("⚠ เวลาซ้อนกับที่ก่อนหน้า");
      else if(a!==prev.a&&a!=="sg"&&prev.a!=="sg"&&x.t-prev.u<tpBuf(prev.a,a))wn.push("🚆 เดินทางอาจไม่ทัน");
    }
    if(x.a==="sg"){if(!vw)wn.push("⚠ วันนี้ไม่ได้อยู่ในหมู่บ้าน");else if(x.t<vw[0]||x.u>vw[1])wn.push("⚠ นอกเวลาที่อยู่หมู่บ้าน")}
    else if(bl.some(b=>x.t<b[1]&&x.u>b[0]))wn.push("⚠ ตรงกับเวลาไปชิราคาวาโกะ");
    if(i===0&&x.t<w.m0)wn.push("⚠ ยังเข้าเมืองไม่ถึง");
    if(last&&x.u>w.e)wn.push("⚠ ไม่ทันไปสนามบิน");
    prev={u:x.u,a};pa=a;la=a;lu=x.u;pl=a==="osaka"?cl:null;lc=pl;
    return `<div class="stp s" style="flex-wrap:wrap;${wn.length?"border-color:#b91c1c":""}"><div style="flex:none;display:flex;align-items:center;gap:3px;background:var(--sky);border-radius:999px;padding:5px 10px;font-weight:700;font-size:14px;color:#1a2308">${x.pin!=null?"📌 ":""}<select onchange="tpPin(${r.k},this.value)" style="${selS}"><option value="auto">⟲ อัตโนมัติ</option>${tpOpts(x.t)}</select>–${sgT(x.u)}</div><div class="sb"><b>${x.e} ${esc(x.n)}</b>${x.h?`<small>${esc(x.h)}</small>`:""}${tr?`<small>${tr}</small>`:""}${wn.length?`<small style="color:#b91c1c">${wn.join(" · ")}</small>`:""}</div><div style="flex-basis:100%;display:flex;gap:6px;align-items:center;justify-content:flex-end"><button class="chip" style="${cb}" onclick="tpMv(${r.k},-1)" aria-label="เลื่อนขึ้น">▲</button><button class="chip" style="${cb}" onclick="tpMv(${r.k},1)" aria-label="เลื่อนลง">▼</button><button class="chip" style="${cb}" onclick="tpDur(${r.k},-15)" aria-label="ลดเวลา">−</button><span style="font-size:13px;min-width:62px;text-align:center">${sgDur(dur)}</span><button class="chip" style="${cb}" onclick="tpDur(${r.k},15)" aria-label="เพิ่มเวลา">+</button><button class="chip" style="${cb}" onclick="tpRm(${r.k})" aria-label="ลบ">✕</button></div></div>`;
  }).join("");
  let back=0,bk2="";
  if(users&&!kind&&!last&&la&&la!=="sg"){
    if(la==="osaka"){if(H&&H.ll&&lc){back=lu+tpMove(tpKm(lc,H.ll));bk2="🏨 กลับถึงที่พัก"}}
    else{back=lu+tpBuf(la,"osaka")+tpEx(H);bk2=H?"🏨 กลับถึงที่พัก":"🚆 กลับถึงโอซาก้า"}
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
  const picker=`<div class="chips" style="padding:0 0 6px">${tabs}</div>${TPH[pk]?`<div class="note" style="margin:2px 0 6px">${TPH[pk]}</div>`:""}<div class="chips" style="flex-wrap:wrap;padding-top:0">${tpChips(pk,H,i)}</div>${TPP[pk]?`<button class="btn o" style="min-height:40px;font-size:14px;margin-top:8px" onclick="tpPreset('${pk}')">✨ เติมแผนแนะนำ ${TPP[pk].length} ที่ (${TPA[pk].replace(/^\S+\s/,"")})</button>`:""}`;
  const ov=Array.from({length:NIGHTS+1},(_,j)=>{
    const k=tpSgKind(j),L=((TP.D[j]&&TP.D[j].v)||[]).slice().sort((p,q)=>p.t-q.t).map(x=>x.n);
    const t=(k?"🏯 ชิราคาวาโกะ":"")+(k&&L.length?" · ":"")+(L.length?L.map(esc).join(" → "):(k?"":"ยังไม่วางแผน"));
    return `<div class="kv" onclick="tpDay(${j})" style="cursor:pointer"><span><b>วัน ${j+1}</b> ${sgFd(j)}</span><span style="text-align:right;flex:1;margin-left:12px">${t}</span></div>`;
  }).join("");
  const hotelBox=tpHotelBox(H),fitBox=tpFitBox(H);
  $("plan").innerHTML=`<h1>🗓️ แผนเที่ยว</h1><p class="sub">เลือกวัน → เลือกเมือง → แตะที่ที่อยากไป · ระบบจัดเวลาให้เอง</p>
  ${hotelBox}${plBox()}
  <div class="chips" style="flex-wrap:wrap;padding:0 0 8px">${dayChips}</div>
  <div class="card"><b>วัน ${i+1} · ${sgFd(i)}${i===0?" · วันถึง":last?" · วันกลับ":""}</b>
    <div class="tl">${rows}</div>
    ${users?`<div class="note" style="margin:0 0 6px">▲▼ สลับลำดับ · − + ปรับเวลาที่ใช้ · แตะเวลาเพื่อล็อกเวลาเอง (เวลาที่ใช้เป็นค่าประมาณ)</div>`:`<div class="note" style="margin:0 0 6px">ยังไม่มีที่เที่ยวในวันนี้ แตะเลือกจากด้านล่างได้เลย</div>`}
    ${backNote}${sgBox}
    <div class="rvh" style="margin-top:12px">➕ เพิ่มที่เที่ยว (แตะอีกครั้งเพื่อเอาออก)</div>${picker}
    <div style="display:flex;gap:8px;margin-top:10px"><input id="tpc" placeholder="หรือพิมพ์ชื่อที่เอง" style="flex:1;min-height:42px;border:1px solid var(--line);border-radius:12px;padding:0 12px;font-size:15px"><button class="btn o" style="min-height:42px;width:auto;padding:0 14px" onclick="tpAddC()">เพิ่ม</button></div>
    ${!TP.sgOn&&!last?`<button class="btn o" style="min-height:42px;font-size:14px;margin-top:10px" onclick="tpSgDay(${i})">🏯 วันนี้ไปชิราคาวาโกะ</button>`:""}
    ${users?`<button class="btn o" style="min-height:40px;font-size:14px;margin-top:6px" onclick="tpClear()">ล้างแผนวันนี้</button>`:""}</div>
  ${fitBox}
  <details class="dt" style="margin-top:12px"><summary>👀 ดูทั้งทริปในหน้าเดียว</summary><div style="margin-top:8px">${ov}
  <button class="btn o" style="min-height:42px;font-size:14px;margin-top:8px" onclick="tpCopy()">📋 คัดลอกแผนทั้งทริป (ส่งเข้า LINE)</button></div></details>
  <div class="note">แผนเก็บไว้ในเครื่องนี้ (ยังไม่ซิงค์ข้ามเครื่อง) · ตรวจเวลาเปิด-ปิดของแต่ละที่อีกครั้งก่อนไป</div>`;
}
// ===== บันทึก / โหลดแผน (แชร์ผ่าน Firebase /plans): ทุกคนที่มีลิงก์เห็นและโหลดไปแก้เป็นแผนของตัวเองได้ · แผนที่บันทึกแล้วแก้/เขียนทับ/ลบไม่ได้ (กฎใน firebase-rules.json ให้สร้างใหม่ได้อย่างเดียว) =====
const PLK="osaka_plans_v1",PLRK="osaka_plans_cache_v1",PLHK="osaka_plans_hide_v1";
const plLoadLS=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k)||"null");return v==null?d:v}catch(e){return d}};
let PLM=plLoadLS(PLK,[]);if(!Array.isArray(PLM))PLM=[];                 // แผนที่บันทึกจากเครื่องนี้ (sh=1 เมื่ออัปโหลดแล้ว)
let PLR=plLoadLS(PLRK,{});if(!PLR||typeof PLR!=="object"||Array.isArray(PLR))PLR={};   // แผนจากฐานข้อมูล (แคชไว้ดูตอนออฟไลน์)
let PLH=new Set(plLoadLS(PLHK,[])),PLC=null,plLast=0,plBusy=false;
const plInv=()=>{PLC=null};
const plLS=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}};
const plId=()=>"p"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const plWhen=ts=>ts?new Date(ts).toLocaleString("th-TH",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}):"";
const plCount=p=>p.days.reduce((n,d)=>n+d.it.filter(r=>!r.f).length,0);
const plClone=o=>JSON.parse(JSON.stringify(o));
// ลายนิ้วมือของแผนทำงาน (ที่เที่ยว+เวลา+ไปชิราคาวาโกะหรือไม่) ใช้เช็กว่าแผนทำงานตรงกับแผนที่บันทึกแล้วหรือยัง
function plSig(D,sgOn){
  const o=[];for(let i=0;i<=NIGHTS;i++)o.push(((D&&D[i]&&D[i].v)||[]).map(x=>[x.id,x.n,x.t,x.u,x.a||"",x.pin==null?-1:x.pin]));
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
        if(x.pin!=null)o.pin=num(x.pin);return o})};
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
const plAll=()=>Object.values(PLC||plBuild()).filter(p=>!PLH.has(p.id)).sort((x,y)=>y.ts-x.ts);
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
function plHide(id){
  const p=plFind(id);if(!p||!confirm("ซ่อนแผน \""+p.name+"\" จากเครื่องนี้?\n(แผนยังอยู่ในฐานข้อมูล คนอื่นยังเห็นและโหลดได้)"))return;
  PLH.add(id);plLS(PLHK,[...PLH]);if(TP.vid===id)TP.v="trip";tpSave();renderPlan();
}
function plUnhide(){PLH=new Set();plLS(PLHK,[]);renderPlan()}
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
    for(const p of PLM){if(!PLR[p.id])await plUp(p);else p.sh=1}
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
  const L=plAll(),hid=PLH.size;
  const list=L.map(p=>`<div class="kv" style="flex-wrap:wrap;gap:6px;align-items:center"><div style="flex:1;min-width:150px"><b>${esc(p.name)}</b><div style="color:var(--mut);font-size:13px">${plShared(p.id)?"🌐 แชร์แล้ว":"📱 เฉพาะเครื่องนี้"} · ${plWhen(p.ts)} · ${plCount(p)} ที่${p.hn?" · 🏨 "+esc(p.hn):""}</div></div><div style="display:flex;gap:6px"><button class="chip" style="${plBtn}" onclick="plOpen('${p.id}')">👁 ดู</button><button class="chip" style="${plBtn}" onclick="plLoad('${p.id}')">📂 โหลดมาแก้</button><button class="chip" style="${plBtn}" onclick="plHide('${p.id}')" aria-label="ซ่อน">🙈</button></div></div>`).join("");
  return `<div class="card" style="margin-bottom:10px"><b>💾 บันทึกแผน</b>
    <div style="display:flex;gap:8px;margin-top:6px"><input id="spn" maxlength="40" placeholder="ชื่อแผน (เช่น แผน A)" style="flex:1;min-width:0;min-height:42px;border:1px solid var(--line);border-radius:12px;padding:0 12px;font-size:15px"><button class="btn g" style="width:auto;min-height:42px;padding:0 14px;font-size:14px" onclick="plSave()">บันทึกเป็นแผนใหม่</button></div>
    <div class="note" style="margin:6px 0 0">🌐 แผนที่บันทึกแชร์ให้ทุกคนที่มีลิงก์เห็นและโหลดไปแก้เป็นแผนของตัวเองได้ · 🔒 แผนที่บันทึกแล้วแก้ไม่ได้ (ของเราและของคนอื่น) ถ้าจะปรับให้ "โหลดมาแก้" แล้วบันทึกเป็นแผนใหม่</div>
    ${list?`<details class="dt" style="margin-top:8px"><summary>แผนที่บันทึกไว้ (${L.length})</summary><div style="margin-top:6px">${list}</div></details>`:""}
    ${hid?`<button class="chip" style="${plBtn};margin-top:8px" onclick="plUnhide()">↩️ แสดงแผนที่ซ่อนไว้ (${hid})</button>`:""}</div>`;
}
function renderSaved(){
  const p=plFind(TP.vid);if(!p){TP.v="trip";renderTrip();return}
  const days=p.days.map((d,i)=>{
    const rows=d.it.map(r=>r.f?tpRow(sgT(r.t),esc(r.a),esc(r.b),"background:#f3f1e3"):tpRow(sgT(r.t)+"–"+sgT(r.u),esc(r.e+" "+r.n),r.h?esc(r.h):"","")).join("");
    return `<div class="card" style="margin-bottom:10px"><b>วัน ${i+1} · ${esc(d.l)}</b><div class="tl">${rows||`<div class="note">ไม่มีรายการ</div>`}</div></div>`;
  }).join("");
  $("plan").innerHTML=`<button class="chip" style="margin-bottom:8px" onclick="tpView('trip')">← กลับแผนทำงาน</button><h1>👁 ${esc(p.name)}</h1>
  <p class="sub">🔒 แก้ไขไม่ได้ · ${plShared(p.id)?"🌐 แชร์แล้ว":"📱 เฉพาะเครื่องนี้"} · บันทึกเมื่อ ${plWhen(p.ts)}${p.hn?" · 🏨 "+esc(p.hn):""} · ${plCount(p)} ที่</p>
  <div style="display:flex;gap:8px;margin-bottom:10px"><button class="btn" style="min-height:44px;font-size:14px" onclick="plLoad('${p.id}')">📂 โหลดมาแก้</button><button class="btn o" style="min-height:44px;font-size:14px" onclick="plCopy('${p.id}')">📋 คัดลอก</button></div>
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
  const eLab=`<label>${pre?"วันที่ 1 ออกจากโอซาก้าไม่เร็วกว่า (เช่น 13:00 = ออกบ่าย)":"ถึงสถานีโอซาก้าได้เร็วสุด"+(ov?" (วันที่ 1)":"")}<select onchange="sgSet('e',this.value)">${opt(range(300,1080,30),SG.e,sgT)}</select></label>`;
  const days=Array.from({length:N+1-(ov?1:0)},(_,i)=>[i]),shown=SG.all?res:res.slice(0,3),lastD=ov?SG.d+1:SG.d;
  const dlab=i=>ov?sgFd(i)+" → "+sgFd(i+1)+(i===0?" · เริ่มวันถึง":i+1===N?" · กลับวันสุดท้าย":""):sgFd(i)+(i===0?" · วันถึง":i===N?" · วันกลับ":"");
  const info=[SG.d===0?`🛬 วันแรก เครื่องลง ${tm(F[0].arr,"Asia/Tokyo")} ระบบเผื่อเวลาเข้าเมือง เริ่มออกจากโอซาก้าได้ไม่เร็วกว่า ${sgT(e)}`:"",lastD===N?`🛫 วันสุดท้าย เครื่องออก ${tm(F[F.length-1].dep,"Asia/Tokyo")} ต้องกลับถึงโอซาก้าไม่เกิน ${sgT(l)}`:""].filter(Boolean);
  const stayNote=pre?`🌙 วันแรกเดินทางไปนอนที่${mid} วันที่ 2 ขึ้นบัสเช้าไปเที่ยวชิราคาวาโกะ แล้วกลับโอซาก้าตอนเย็น · ตั้งเวลาออกจากโอซาก้าวันแรกด้านบน · ที่พักไม่อยู่ในไฟล์ ต้องจองเอง`:sg?"🏡 มินชุกุในหมู่บ้านมีห้องน้อย ควรจองล่วงหน้า (ข้อมูลที่พักไม่อยู่ในไฟล์) · ช่วง ม.ค.–ก.พ. บางปีมีงานไลท์อัพต้องจองแยก":`🏨 วันแรกเที่ยวชิราคาวาโกะแล้วนั่งบัสกลับมานอนที่${mid} · ที่พักไม่อยู่ในไฟล์ ต้องจองเอง`;
  $("plan").innerHTML=`<button class="chip" style="margin-bottom:8px" onclick="tpView('trip')">← กลับแผนเที่ยว</button><h1>🏯 ตัวเลือกรถไปชิราคาวาโกะ</h1><p class="sub">เลือกวันและเวลา ระบบหาเที่ยวรถไฟ+รถบัสจากโอซาก้า แบบไป-กลับวันเดียวหรือค้าง 1 คืน จากตารางในไฟล์ที่อัปโหลด · ที่เลือกที่นี่จะไปอยู่ในแผนเที่ยวให้อัตโนมัติ</p>
  <div class="pinfo" style="background:#7a4b00">⚠️ ตารางในไฟล์เป็นข้อมูล ณ เม.ย. 2023 ก่อนเดินทางจริงตรวจเวลาล่าสุดและจองที่นั่งรถบัส (ไฟล์ระบุว่าหลายเที่ยวต้องจองล่วงหน้า)</div>
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
    <label>ต้องกลับถึงโอซาก้าก่อน${ov?" (วันที่ 2)":""}<select onchange="sgSet('l',this.value)">${opt(range(1080,1440,30),SG.l,sgT)}</select></label></div>
    ${ov&&!pre?`<label>${sg?"วันที่ 2 ออกจากชิราคาวาโกะไม่เร็วกว่า":"วันที่ 2 ขึ้นรถไฟกลับจาก"+mid+"ไม่เร็วกว่า"}<select onchange="sgSet('m',this.value)">${opt(range(360,840,30),SG.m,sgT)}</select></label>`:""}
    ${pre?`<label>วันที่ 2 ขึ้นบัสไปชิราคาวาโกะไม่เร็วกว่า<select onchange="sgSet('pm',this.value)">${opt(range(360,720,30),SG.pm,sgT)}</select></label>`:""}
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
