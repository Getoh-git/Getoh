// แท็บแผนรายวัน: ตารางสถานที่ + ลิงก์เส้นทางจุดต่อจุด (Google Maps โหมดขนส่งสาธารณะ) เก็บในเครื่องนี้
const PLK="osaka_plan_v1",AIR="Kansai International Airport";
const PLAN0=[[["11:30","Shinsekai Tsutenkaku","ตัวอย่าง: ฝากกระเป๋าที่โรงแรมก่อน"],["18:00","Dotonbori","ตัวอย่าง"]],[["10:00","Osaka Castle","ตัวอย่าง"],["16:00","Umeda Sky Building","ตัวอย่าง"]],[["08:30","Universal Studios Japan","ตัวอย่าง"]],[["10:00","Kuromon Market","ตัวอย่าง"],["14:00","Shinsaibashi-suji Shopping Street","ตัวอย่าง"]],[["09:30","Kuromon Market","ตัวอย่าง: วันบิน ต้องออกจากย่านที่พักตามเวลาในแท็บเตรียมตัว"]]];
const mk=a=>a.map(d=>d.map(x=>({t:x[0],n:x[1],m:x[2]})));
let PL=null;try{PL=JSON.parse(localStorage.getItem(PLK)||"null")}catch(e){}
if(!Array.isArray(PL))PL=mk(PLAN0);
const plSave=()=>{try{localStorage.setItem(PLK,JSON.stringify(PL))}catch(e){}};
function plReset(){if(!confirm("รีเซ็ตเป็นแผนตัวอย่าง? ข้อมูลที่แก้ไว้จะหาย"))return;PL=mk(PLAN0);plSave();renderPlan()}
let planDay=0;
const pday=d=>{planDay=d;renderPlan()};
function plEdit(d,i){
  const x=i>=0?PL[d][i]:{t:"",n:"",m:""};
  openSheet(i>=0?"แก้ไขสถานที่":"เพิ่มสถานที่",`<div class="fm"><label>เวลา<input id="pf-t" type="time" value="${esc(x.t)}"></label><label>ชื่อสถานที่ (พิมพ์อังกฤษ ค้นเจอง่ายกว่า)<input id="pf-n" value="${esc(x.n)}" placeholder="เช่น Osaka Castle"></label><label>โน้ต<input id="pf-m" value="${esc(x.m)}"></label></div>
  <button class="btn" onclick="plSaveF(${d},${i})">บันทึก</button>${i>=0?`<button class="btn o" style="margin-top:8px" onclick="PL[${d}].splice(${i},1);plSave();closeSheet();renderPlan()">🗑 ลบสถานที่นี้</button>`:""}`);
}
function plSaveF(d,i){
  const o={t:$("pf-t").value,n:$("pf-n").value.trim(),m:$("pf-m").value.trim()};
  if(!o.n){toast("ใส่ชื่อสถานที่ก่อน");return}
  if(i>=0)PL[d][i]=o;else PL[d].push(o);
  PL[d].sort((p,q)=>(p.t||"99:99").localeCompare(q.t||"99:99"));
  plSave();closeSheet();renderPlan();
}
const dirUrl=(a,b)=>`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(a)}&destination=${encodeURIComponent(b)}&travelmode=transit`;
const lbl=t=>t.replace(/ Osaka$/,"");
const leg=(a,b)=>a&&b?`<a class="lg" href="${esc(dirUrl(a,b))}" target="_blank" rel="noopener">🚆 ดูเส้นทางไป ${esc(lbl(b))} ›</a>`:"";
function renderPlan(){
  const hid=(JSON.parse(localStorage.getItem("osaka_prep_v1")||"{}").bk||{}).hid,h=(typeof all==="function"?all():[]).find(x=>x.id===+hid),HN=h?h.name+" Osaka":"";
  while(PL.length<=NIGHTS)PL.push([]);
  if(planDay>NIGHTS)planDay=0;
  const d=planDay,day=PL[d],N=NIGHTS,fd=i=>new Date(F[0].arr+i*864e5).toLocaleDateString("th-TH",{timeZone:"Asia/Tokyo",weekday:"short",day:"numeric",month:"short"});
  const pts=day.map(x=>x.n+" Osaka"),start=d===0?AIR:HN,end=d===N?AIR:HN;
  const node=(ic,t)=>`<div class="nd">${ic} ${esc(t)}</div>`;
  const info=d===0?`🛬 เครื่องลง ${tm(F[0].arr,"Asia/Tokyo")} · ผ่านตม.และรับกระเป๋าราว 1 ชม.`:d===N?`🛫 เครื่องออก ${tm(F[F.length-1].dep,"Asia/Tokyo")} · ควรออกจากย่านที่พักไม่ช้ากว่า ${tm(F[F.length-1].ap-90*6e4,"Asia/Tokyo")}`:"";
  $("plan").innerHTML=`<h1>🗓 แผนรายวัน</h1><div class="chips">${PL.slice(0,N+1).map((_,i)=>`<button class="chip ${i===d?"on":""}" onclick="pday(${i})">วัน ${i+1} · ${fd(i)}</button>`).join("")}</div>
  ${info?`<div class="pinfo">${info}</div>`:""}
  ${h||d===0?"":`<div class="note">เลือกที่พักในแท็บเตรียมตัว จะมีเส้นทางจากโรงแรมให้</div>`}
  <div class="tl">${start?node(d===0?"🛬":"🏨",lbl(start)):""}${start&&day.length?leg(start,pts[0]):""}
  ${day.map((x,i)=>`<div class="stp" onclick="plEdit(${d},${i})"><div class="tt">${esc(x.t||"–")}</div><div class="sb"><b>${esc(x.n)}</b>${x.m?`<small>${esc(x.m)}</small>`:""}</div><span class="ed">✎</span></div>${i<day.length-1?leg(pts[i],pts[i+1]):""}`).join("")||`<div class="note" style="padding:14px 0">ยังไม่มีสถานที่ในวันนี้</div>`}
  ${end&&day.length?leg(pts[pts.length-1],end):""}${end?node(d===N?"🛫":"🏨",lbl(end)):""}</div>
  <button class="btn" onclick="plEdit(${d},-1)">➕ เพิ่มสถานที่</button>
  <button class="btn o" style="margin-top:8px;min-height:40px;font-size:13px" onclick="plReset()">↩️ รีเซ็ตเป็นแผนตัวอย่าง</button>`;
}
