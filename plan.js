// แท็บแผนรายวัน: ตารางสถานที่ + ลิงก์เส้นทางจุดต่อจุด (Google Maps โหมดขนส่งสาธารณะ) เก็บในเครื่องนี้
const PLK="osaka_plan_v1",AIR="Kansai International Airport";
const PLAN0=[[["11:30","Shinsekai Tsutenkaku","ตัวอย่าง: ฝากกระเป๋าที่โรงแรมก่อน"],["18:00","Dotonbori","ตัวอย่าง"]],[["10:00","Osaka Castle","ตัวอย่าง"],["16:00","Umeda Sky Building","ตัวอย่าง"]],[["08:30","Universal Studios Japan","ตัวอย่าง"]],[["10:00","Kuromon Market","ตัวอย่าง"],["14:00","Shinsaibashi-suji Shopping Street","ตัวอย่าง"]],[["09:30","Kuromon Market","ตัวอย่าง: วันบิน ต้องออกจากย่านที่พักตามเวลาในแท็บเตรียมตัว"]]];
const mk=a=>a.map(d=>d.map(x=>({t:x[0],n:x[1],m:x[2]})));
let PL=null;try{PL=JSON.parse(localStorage.getItem(PLK)||"null")}catch(e){}
if(!Array.isArray(PL))PL=mk(PLAN0);
const plSave=()=>{try{localStorage.setItem(PLK,JSON.stringify(PL))}catch(e){}};
function plSet(d,i,k,v){PL[d][i][k]=v;plSave()}
function plAdd(d){PL[d].push({t:"",n:"",m:""});plSave();renderPlan()}
function plDel(d,i){PL[d].splice(i,1);plSave();renderPlan()}
function plReset(){if(!confirm("รีเซ็ตเป็นแผนตัวอย่าง? ข้อมูลที่แก้ไว้จะหาย"))return;PL=mk(PLAN0);plSave();renderPlan()}
const dirUrl=(a,b)=>`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(a)}&destination=${encodeURIComponent(b)}&travelmode=transit`;
const leg=(a,b)=>a&&b?`<a class="btn o" style="min-height:38px;font-size:13px;margin:4px 0" href="${esc(dirUrl(a,b))}" target="_blank" rel="noopener">🚆 ${esc(a.replace(/ Osaka$/,""))} ➔ ${esc(b.replace(/ Osaka$/,""))} · ดูเส้นทาง</a>`:"";
function renderPlan(){
  const hid=(JSON.parse(localStorage.getItem("osaka_prep_v1")||"{}").bk||{}).hid,h=(typeof all==="function"?all():[]).find(x=>x.id===+hid),HN=h?h.name+" Osaka":"";
  while(PL.length<=NIGHTS)PL.push([]);
  $("plan").innerHTML=`<h1>🗓 แผนรายวัน</h1><p class="sub">แก้ได้ทุกช่อง · เส้นทางเปิดใน Google Maps (ขนส่งสาธารณะ) ได้เวลาและค่าโดยสารจริงของวันนั้น</p>`+
  (h?"":`<div class="note">เลือกที่พักในแท็บเตรียมตัวก่อน จะมีเส้นทางจากโรงแรมไปจุดแรกของแต่ละวัน</div>`)+
  PL.slice(0,NIGHTS+1).map((day,d)=>{
    const dt=new Date(F[0].arr+d*864e5).toLocaleDateString("th-TH",{timeZone:"Asia/Tokyo",weekday:"short",day:"numeric",month:"short"});
    const pts=day.map(x=>x.n?x.n+" Osaka":""),first=pts.find(Boolean),last=[...pts].reverse().find(Boolean);
    let rows=day.map((x,i)=>{const prev=i?pts[i-1]:"";return (i&&prev&&pts[i]?leg(prev,pts[i]):"")+
      `<div style="display:grid;grid-template-columns:70px 1fr 40px;gap:6px;margin-top:6px"><input type="time" value="${esc(x.t)}" onchange="plSet(${d},${i},'t',this.value)"><input value="${esc(x.n)}" placeholder="ชื่อสถานที่ (อังกฤษค้นเจอง่าย)" onchange="plSet(${d},${i},'n',this.value);renderPlan()"><button class="x" onclick="plDel(${d},${i})" aria-label="ลบ">✕</button></div><input style="margin-top:4px" value="${esc(x.m)}" placeholder="โน้ต" onchange="plSet(${d},${i},'m',this.value)">`}).join("");
    const start=d===0?AIR:HN,end=d===NIGHTS?AIR:HN;
    return `<div class="card" style="margin-top:10px"><div class="rvh" style="margin-top:0">วันที่ ${d+1} · ${dt}</div>${d===0?`<div class="note">เครื่องลง ${tm(F[0].arr,"Asia/Tokyo")}</div>`:""}${d===NIGHTS?`<div class="note">ควรออกจากย่านที่พักไม่ช้ากว่า ${tm(F[F.length-1].ap-90*6e4,"Asia/Tokyo")}</div>`:""}
    ${leg(start,first)}${rows}${leg(last,end)}<button class="btn o" style="margin-top:8px" onclick="plAdd(${d})">➕ เพิ่มสถานที่</button></div>`}).join("")+
  `<button class="btn o" style="margin-top:12px" onclick="plReset()">↩️ รีเซ็ตเป็นแผนตัวอย่าง</button>`;
}
