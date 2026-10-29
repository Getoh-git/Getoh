// แท็บเตรียมตัว: ที่พักที่จอง / วันแรก-วันสุดท้าย / เช็กลิสต์ (เก็บในเครื่องนี้ ไม่ซิงค์ข้ามเครื่อง)
const PK="osaka_prep_v1";
let P={bk:{},ck:{}};try{P={...P,...JSON.parse(localStorage.getItem(PK)||"{}")}}catch(e){}
const psave=()=>{try{localStorage.setItem(PK,JSON.stringify(P))}catch(e){}};
const CK=[["📄 เอกสาร",["พาสปอร์ต","กรอก Visit Japan Web","เซฟใบยืนยันตั๋วและที่พักไว้ในเครื่อง","ประกันการเดินทาง"]],["💴 เงินและเน็ต",["แลกเยน / บัตรที่ใช้ต่างประเทศได้","eSIM หรือ Pocket WiFi","แอปแผนที่ รถไฟ แปลภาษา"]],["🎒 ของใช้",["ปลั๊กแบนญี่ปุ่น + พาวเวอร์แบงก์","เสื้อกันหนาว ถุงเท้า ฮีทเทค (ก.พ. ราว 2–9°C)","ยาประจำตัว","ถุงพับสำหรับของที่ซื้อ"]],["🛫 ก่อนออกบ้าน",["เช็กอินออนไลน์","ชั่งน้ำหนักกระเป๋าตามสายการบิน","ไปสนามบินตามเวลาแนะนำ"]]];
const tm=(t,z)=>new Date(t).toLocaleTimeString("th-TH",{timeZone:z,hour:"2-digit",minute:"2-digit"});
function bkSet(k,v){P.bk[k]=v;psave()}
function ckTog(k){P.ck[k]=!P.ck[k];psave();renderPrep()}
function cpy(k){const v=P.bk[k]||"";if(!v)return toast("ยังไม่ได้กรอก");navigator.clipboard?navigator.clipboard.writeText(v).then(()=>toast("คัดลอกแล้ว"),()=>toast("คัดลอกไม่สำเร็จ")):toast("คัดลอกไม่ได้")}
function renderPrep(){
  const b=P.bk,H=all(),h=H.find(x=>x.id===+b.hid),a=F[0],r=F[F.length-1],leave=r.ap-90*6e4;
  const inp=(k,l,ph,cp)=>`<label>${l}<div style="display:flex;gap:6px"><input value="${esc(b[k]||"")}" placeholder="${ph||""}" onchange="bkSet('${k}',this.value)">${cp?`<button class="btn o" style="width:auto;min-height:44px" onclick="cpy('${k}')">คัดลอก</button>`:""}</div></label>`;
  const tot=CK.reduce((n,g)=>n+g[1].length,0),done=CK.reduce((n,g)=>n+g[1].filter(x=>P.ck[x]).length,0);
  $("prep").innerHTML=`<h1>✈️ เตรียมตัว</h1><p class="sub">ข้อมูลในแท็บนี้เก็บในเครื่องนี้เท่านั้น</p>
  <div class="card"><div class="rvh" style="margin-top:0">🏨 ที่พักที่จอง</div>
    <label>เลือกโรงแรม<select onchange="bkSet('hid',this.value);renderPrep()"><option value="">– ยังไม่เลือก –</option>${H.map(x=>`<option value="${x.id}" ${x.id===+b.hid?"selected":""}>${esc(x.name)}</option>`).join("")}</select></label>
    ${h?`<div class="kv"><span>ราคารวม ${NIGHTS} คืน</span><b>${price(h)}</b></div>`:""}
    ${inp("addr","ที่อยู่ (ภาษาญี่ปุ่น ไว้โชว์คนขับแท็กซี่)","〒...",1)}${inp("addrEn","ที่อยู่ (อังกฤษ)","",1)}${inp("tel","เบอร์โทรโรงแรม","+81...",1)}
    <div class="g2">${inp("cin","เช็กอินตั้งแต่","15:00")}${inp("cout","เช็กเอาต์ก่อน","11:00")}</div>${inp("link","ลิงก์ใบยืนยันการจอง","https://...")}
    ${/^https?:\/\//i.test(b.link||"")?`<a class="btn o" href="${esc(b.link)}" target="_blank" rel="noopener">เปิดใบยืนยันการจอง</a>`:""}</div>
  <div class="card" style="margin-top:10px"><div class="rvh" style="margin-top:0">🛬 วันแรก ${esc(a.depD||"")}</div>
    <div class="kv"><span>เครื่องลง ${esc(a.to)}</span><b>${tm(a.arr,"Asia/Tokyo")} (เวลาญี่ปุ่น)</b></div>
    <div class="note">ผ่านตม./รับกระเป๋าใช้เวลาราว 1 ชม. ทำให้ออกจากสนามบินประมาณสิบโมง โรงแรมส่วนใหญ่ยังไม่ให้เข้าห้อง (เช็กอิน ${esc(b.cin||"ดูในใบจอง")}) ให้ฝากกระเป๋าที่โรงแรมก่อนแล้วไปเที่ยวต่อ รถไฟ Nankai จาก KIX ไปนัมบะ/ชินอิมามิยะได้ตรง ตรวจเวลาและค่าโดยสารจริงก่อนเดินทาง</div></div>
  <div class="card" style="margin-top:10px"><div class="rvh" style="margin-top:0">🛫 วันสุดท้าย ${esc(r.depD||"")}</div>
    <div class="kv"><span>เครื่องออก ${esc(r.from)}</span><b>${tm(r.dep,"Asia/Tokyo")}</b></div>
    <div class="kv"><span>ควรถึงสนามบิน</span><b>${tm(r.ap,"Asia/Tokyo")}</b></div>
    <div class="kv"><span>ควรออกจากย่านที่พักไม่ช้ากว่า</span><b style="color:var(--grn)">${tm(leave,"Asia/Tokyo")}</b></div>
    <div class="note">คำนวณจากเวลาถึงสนามบินลบ 90 นาที (เดินทางราว 45–60 นาที เผื่อเวลา) ขากลับใช้เทอร์มินัล 2 ซึ่งต้องต่อรถ shuttle จาก T1 ให้ตรวจกับสายการบินอีกครั้ง หลังเช็กเอาต์ ${esc(b.cout||"")} ฝากกระเป๋าที่โรงแรมได้</div></div>
  <div class="card" style="margin-top:10px"><div class="rvh" style="margin-top:0">✅ เช็กลิสต์ (${done}/${tot})</div>${CK.map(g=>`<div class="note" style="margin:10px 0 4px"><b>${g[0]}</b></div>`+g[1].map(x=>`<div class="kv" style="cursor:pointer" onclick="ckTog(this.dataset.k)" data-k="${esc(x)}"><span>${P.ck[x]?"☑️":"⬜"} ${esc(x)}</span></div>`).join("")).join("")}</div>`;
}
