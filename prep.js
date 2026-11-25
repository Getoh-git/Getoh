// แท็บเตรียมตัว: ที่พักที่จอง / วันแรก-วันสุดท้าย / เช็กลิสต์ (เก็บในเครื่องนี้ ไม่ซิงค์ข้ามเครื่อง)
const PK="osaka_prep_v1";
let P={bk:{},ck:{}};try{P={...P,...JSON.parse(localStorage.getItem(PK)||"{}")}}catch(e){}
const psave=()=>{try{localStorage.setItem(PK,JSON.stringify(P))}catch(e){}};
const CK=[["📄 เอกสาร",["พาสปอร์ต","กรอก Visit Japan Web","เซฟใบยืนยันตั๋วและที่พักไว้ในเครื่อง","ประกันการเดินทาง"]],["💴 เงินและเน็ต",["แลกเยน / บัตรที่ใช้ต่างประเทศได้","eSIM หรือ Pocket WiFi","แอปแผนที่ รถไฟ แปลภาษา"]],["🎒 ของใช้",["ปลั๊กแบนญี่ปุ่น + พาวเวอร์แบงก์","เสื้อกันหนาว ถุงเท้า ฮีทเทค (ก.พ. ราว 2–9°C)","ยาประจำตัว","ถุงพับสำหรับของที่ซื้อ","เป้ใบเล็กสำหรับคืนที่คานาซาวะ (ของหนักเก็บไว้ที่ห้องโรงแรมโอซาก้า)"]],["🛫 ก่อนออกบ้าน",["เช็กอินออนไลน์","ชั่งน้ำหนักกระเป๋าตามสายการบิน","ไปสนามบินตามเวลาแนะนำ"]]];
const tm=(t,z)=>new Date(t).toLocaleTimeString("th-TH",{timeZone:z,hour:"2-digit",minute:"2-digit"});
function bkSet(k,v){P.bk[k]=v;psave()}
function ckTog(k){P.ck[k]=!P.ck[k];psave();renderPrep()}
function cpy(k){const v=P.bk[k]||"";if(!v)return toast("ยังไม่ได้กรอก");navigator.clipboard?navigator.clipboard.writeText(v).then(()=>toast("คัดลอกแล้ว"),()=>toast("คัดลอกไม่สำเร็จ")):toast("คัดลอกไม่ได้")}
function renderPrep(){
  const b=P.bk,H=all(),h=H.find(x=>x.id===+b.hid),h2=H.find(x=>x.id===+b.hid2),a=F[0],r=F[F.length-1],leave=r.ap-90*6e4;
  const inp=(k,l,ph,cp)=>`<label>${l}<div style="display:flex;gap:6px"><input value="${esc(b[k]||"")}" placeholder="${ph||""}" onchange="bkSet('${k}',this.value)">${cp?`<button class="btn o" style="width:auto;min-height:44px" onclick="cpy('${k}')">คัดลอก</button>`:""}</div></label>`;
  const tot=CK.reduce((n,g)=>n+g[1].length,0),done=CK.reduce((n,g)=>n+g[1].filter(x=>P.ck[x]).length,0);
  $("prep").innerHTML=`<h1>✈️ เตรียมตัว</h1><p class="sub">ข้อมูลในแท็บนี้เก็บในเครื่องนี้เท่านั้น</p>
  <div class="card"><div class="rvh" style="margin-top:0">🏨 โอซาก้า · พักยาว ไม่เช็กเอาต์</div>
    <label>เลือกโรงแรม<select onchange="bkSet('hid',this.value);renderPrep()"><option value="">– ยังไม่เลือก –</option>${H.filter(x=>cityOf(x)==="Osaka").map(x=>`<option value="${x.id}" ${x.id===+b.hid?"selected":""}>${esc(x.name)}${x.booked?" ✅":""}</option>`).join("")}</select></label>
    ${h?`<div class="kv"><span>ราคารวม ${nightsOf(h)} คืน</span><b>${price(h)}</b></div>`:""}
    ${inp("addr","ที่อยู่ (ภาษาญี่ปุ่น ไว้โชว์คนขับแท็กซี่)","〒...",1)}${inp("addrEn","ที่อยู่ (อังกฤษ)","",1)}${inp("tel","เบอร์โทรโรงแรม","+81...",1)}
    <div class="g2">${inp("cin","เช็กอินตั้งแต่","15:00")}${inp("cout","เช็กเอาต์ก่อน","11:00")}</div>${inp("link","ลิงก์ใบยืนยันการจอง","https://...")}
    ${/^https?:\/\//i.test(b.link||"")?`<a class="btn o" href="${esc(b.link)}" target="_blank" rel="noopener">เปิดใบยืนยันการจอง</a>`:""}</div>
  <div class="card" style="margin-top:10px"><div class="rvh" style="margin-top:0">🏮 คานาซาวะ · 1 คืน (${esc(mpDate(1))} → ${esc(mpDate(2))})</div>
    <label>เลือกโรงแรม<select onchange="bkSet('hid2',this.value);renderPrep()"><option value="">– ยังไม่เลือก –</option>${H.filter(x=>cityOf(x)==="Kanazawa").map(x=>`<option value="${x.id}" ${x.id===+b.hid2?"selected":""}>${esc(x.name)}${x.booked?" ✅":""}</option>`).join("")}</select></label>
    ${h2?`<div class="kv"><span>ราคารวม ${nightsOf(h2)} คืน</span><b>${price(h2)}</b></div>`:""}
    ${inp("addr2","ที่อยู่ (ภาษาญี่ปุ่น)","〒...",1)}${inp("tel2","เบอร์โทรโรงแรม","+81...",1)}
    <div class="note">โรงแรมโอซาก้าพักยาว ไม่เช็กเอาต์ ตอนไปคานาซาวะพกเป้ใบเล็ก ของหนักเก็บไว้ที่ห้องโอซาก้า</div></div>
  <div class="card" style="margin-top:10px"><div class="rvh" style="margin-top:0">🛬 วันแรก ${esc(a.depD||"")}</div>
    <div class="kv"><span>เครื่องลง ${esc(a.to)}</span><b>${tm(a.arr,"Asia/Tokyo")} (เวลาญี่ปุ่น)</b></div>
    <div class="note">ผ่านตม./รับกระเป๋าใช้เวลาราว 1 ชม. ทำให้ออกจากสนามบินประมาณสิบโมง โรงแรมส่วนใหญ่ยังไม่ให้เข้าห้อง (เช็กอิน ${esc(b.cin||"ดูในใบจอง")}) ให้ฝากกระเป๋าที่โรงแรมก่อนแล้วไปเที่ยวต่อ รถไฟ Nankai จาก KIX ไปนัมบะ/ชินอิมามิยะได้ตรง ตรวจเวลาและค่าโดยสารจริงก่อนเดินทาง</div></div>
  <div class="card" style="margin-top:10px"><div class="rvh" style="margin-top:0">🛫 วันสุดท้าย ${esc(r.depD||"")}</div>
    <div class="kv"><span>เครื่องออก ${esc(r.from)}</span><b>${tm(r.dep,"Asia/Tokyo")}</b></div>
    <div class="kv"><span>ควรถึงสนามบิน</span><b>${tm(r.ap,"Asia/Tokyo")}</b></div>
    <div class="kv"><span>ควรออกจากย่านที่พักไม่ช้ากว่า</span><b style="color:var(--grn)">${tm(leave,"Asia/Tokyo")}</b></div>
    <div class="note">คำนวณจากเวลาถึงสนามบินลบ 90 นาที (เดินทางราว 45–60 นาที เผื่อเวลา) ขากลับใช้เทอร์มินัล 2 ซึ่งต้องต่อรถ shuttle จาก T1 ให้ตรวจกับสายการบินอีกครั้ง วันนี้เช็กเอาต์โรงแรมโอซาก้า (ก่อน ${esc(b.cout||"เวลาในใบจอง")}) ถ้ายังไม่ถึงเวลาไปสนามบิน ฝากกระเป๋าที่โรงแรมได้</div></div>
  <div id="flight-monitor"></div>
  <div class="card" style="margin-top:10px"><div class="rvh" style="margin-top:0">✅ เช็กลิสต์ (${done}/${tot})</div>${CK.map(g=>`<div class="note" style="margin:10px 0 4px"><b>${g[0]}</b></div>`+g[1].map(x=>`<div class="kv" style="cursor:pointer" onclick="ckTog(this.dataset.k)" data-k="${esc(x)}"><span>${P.ck[x]?"☑️":"⬜"} ${esc(x)}</span></div>`).join("")).join("")}</div>`;
  fmRender();
}


// ---------- Flight Monitor (แบบลิงก์): ไม่เรียก API ใด ๆ ไม่มีค่าใช้จ่าย ----------
// แสดงเวลาตามตั๋วจาก OSAKA_CONFIG.flights + ปุ่มเปิดหน้าสถานะเที่ยวบินจริงในแท็บใหม่
const FM_ZONE = { DMK: "Asia/Bangkok", BKK: "Asia/Bangkok", KIX: "Asia/Tokyo", ITM: "Asia/Tokyo", NRT: "Asia/Tokyo", HND: "Asia/Tokyo" };
const FM_ZONE_LABEL = { "Asia/Bangkok": "เวลาไทย", "Asia/Tokyo": "เวลาญี่ปุ่น" };
const fmFlights = () => ((window.OSAKA_CONFIG && window.OSAKA_CONFIG.flights) || (window.OSAKA && window.OSAKA.flights) || []).map(f => ({
  no: String(f.no || "").trim().toUpperCase(),
  title: f.title || "",
  from: f.from || "",
  to: f.to || "",
  dep: f.dep || "",
  arr: f.arr || ""
}));
const fmTime = (v, zone) => {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(+d) ? "—" : d.toLocaleString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: zone });
};
const fmLinks = no => {
  const n = encodeURIComponent(no);
  return [
    ["Google", `https://www.google.com/search?q=${n}+flight+status`],
    ["FlightAware", `https://www.flightaware.com/live/flight/${n}`],
    ["Flightradar24", `https://www.flightradar24.com/data/flights/${encodeURIComponent(no.toLowerCase())}`]
  ];
};
function fmFlightCard(f) {
  const zFrom = FM_ZONE[f.from] || "Asia/Tokyo", zTo = FM_ZONE[f.to] || "Asia/Tokyo";
  return `<article class="fm-flight">
    <div class="fm-top"><div><b>${esc(f.title)} · ${esc(f.no)}</b><small>${esc(f.from)} → ${esc(f.to)}</small></div><span class="fm-pill muted">ตามตั๋ว</span></div>
    <div class="fm-route"><div><small>กำหนดออก (${FM_ZONE_LABEL[zFrom]})</small><b>${fmTime(f.dep, zFrom)}</b></div><span>✈</span><div><small>กำหนดถึง (${FM_ZONE_LABEL[zTo]})</small><b>${fmTime(f.arr, zTo)}</b></div></div>
    <div class="fm-links">${fmLinks(f.no).map(l => `<a class="btn o" href="${esc(l[1])}" target="_blank" rel="noopener noreferrer">${esc(l[0])} ↗</a>`).join("")}</div>
  </article>`;
}
function fmRender() {
  const root = document.getElementById("flight-monitor");
  if (!root) return;
  const flights = fmFlights().filter(f => f.no && f.dep && f.arr);
  root.innerHTML = `
    <style>
      .fm-wrap{margin-top:12px}.fm-head h2{font-size:18px;margin:0}.fm-intro{font-size:13px;color:var(--mut);margin:5px 0 12px}
      .fm-flight{background:var(--bg);border:1px solid var(--line);border-radius:14px;padding:12px;margin-top:9px}
      .fm-top{display:flex;justify-content:space-between;align-items:center;gap:8px}.fm-top small{display:block;color:var(--mut);font-size:12px}
      .fm-pill{display:inline-flex;border-radius:999px;padding:4px 9px;font-size:12px;font-weight:700;white-space:nowrap}
      .fm-pill.muted{background:var(--card);color:var(--mut)}
      .fm-route{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center;margin:13px 0 12px}
      .fm-route>div:last-child{text-align:right}.fm-route b{display:block;font-size:14px}.fm-route small{display:block;color:var(--mut);font-size:11px}.fm-route>span{font-size:20px;color:var(--sky)}
      .fm-links{display:flex;flex-wrap:wrap;gap:6px;border-top:1px solid var(--line);padding-top:10px}
      .fm-links .btn{width:auto;min-height:40px;padding:0 12px;font-size:13px;text-decoration:none;display:inline-flex;align-items:center}
      .fm-note{font-size:12px;color:var(--mut);margin:9px 0 0;line-height:1.55}
      @media(min-width:600px){.fm-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}}
    </style>
    <div class="card fm-wrap">
      <div class="fm-head"><h2>✈️ Flight Monitor</h2></div>
      <p class="fm-intro">เวลาตามตั๋วของเที่ยวบินไป–กลับ กดปุ่มเพื่อเปิดหน้าสถานะเที่ยวบินจริงในแท็บใหม่</p>
      <div class="fm-grid">${flights.map(fmFlightCard).join("")}</div>
      <p class="fm-note">ข้อมูลสถานะมาจากเว็บภายนอก (Google, FlightAware, Flightradar24) เว็บนี้ไม่ได้เก็บหรือเรียกข้อมูลเที่ยวบินเอง ควรตรวจกับสายการบินอีกครั้งก่อนออกเดินทาง</p>
    </div>`;
}
