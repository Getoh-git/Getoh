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
}


// ---------- Flight Monitor: ตรวจสอบเมื่อผู้ใช้กดเท่านั้น ----------
const FM_ENDPOINT = "https://asia-northeast1-osaka-trip-b03a0.cloudfunctions.net/flightMonitor";
let FM_BUSY = false;
let FM_DATA = null;
const fmFlights = () => (window.OSAKA_CONFIG && window.OSAKA_CONFIG.flights || []).map(f => ({
  no: String(f.no || "").trim().toUpperCase(),
  title: f.title || "",
  from: f.from || "",
  to: f.to || "",
  dep: f.dep || "",
  arr: f.arr || ""
}));
const fmDate = v => {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(+d) ? "—" : d.toLocaleString("th-TH", { dateStyle:"medium", timeStyle:"short", timeZone:"Asia/Bangkok" });
};
const fmTime = (v, zone) => {
  if (!v) return "ยังไม่มีข้อมูล";
  const d = new Date(v);
  return Number.isNaN(+d) ? "ยังไม่มีข้อมูล" : d.toLocaleString("th-TH", { dateStyle:"short", timeStyle:"short", timeZone:zone || "Asia/Tokyo" });
};
const fmStatus = s => {
  const x = String(s || "").toLowerCase();
  if (/cancel/.test(x)) return ["ยกเลิก", "danger"];
  if (/landed|arrived/.test(x)) return ["ถึงแล้ว", "success"];
  if (/airborne|en.?route|in.?flight/.test(x)) return ["อยู่ระหว่างบิน", "info"];
  if (/delay/.test(x)) return ["ล่าช้า", "warning"];
  if (/scheduled|filed|expected|on.?time/.test(x)) return ["ตามกำหนด", "success"];
  return ["ยังไม่มีสถานะ", "muted"];
};
function fmFlightCard(f, data) {
  const d = data || {};
  const [label, tone] = fmStatus(d.status);
  const delay = Number.isFinite(Number(d.departureDelayMinutes)) ? Number(d.departureDelayMinutes) : null;
  const arrivalDelay = Number.isFinite(Number(d.arrivalDelayMinutes)) ? Number(d.arrivalDelayMinutes) : null;
  const stat = d.status ? `<span class="fm-pill ${tone}">${esc(label)}</span>` : `<span class="fm-pill muted">ยังไม่ตรวจสอบ</span>`;
  const delayText = delay === null ? "—" : delay <= 0 ? "ตรงเวลา" : `ช้า ${delay} นาที`;
  const arrText = arrivalDelay === null ? "—" : arrivalDelay <= 0 ? "ตรงเวลา" : `ช้า ${arrivalDelay} นาที`;
  return `<article class="fm-flight">
    <div class="fm-top"><div><b>${esc(f.title)} · ${esc(f.no)}</b><small>${esc(f.from)} → ${esc(f.to)}</small></div>${stat}</div>
    <div class="fm-route"><div><small>กำหนดออก</small><b>${fmTime(f.dep, "Asia/Bangkok")}</b><small>เวลาจริง/คาดการณ์: ${fmTime(d.actualOut || d.estimatedOut, "Asia/Bangkok")}</small></div><span>✈</span><div><small>กำหนดถึง</small><b>${fmTime(f.arr, "Asia/Tokyo")}</b><small>เวลาจริง/คาดการณ์: ${fmTime(d.actualIn || d.estimatedIn, "Asia/Tokyo")}</small></div></div>
    <div class="fm-delays"><span>ออก: <b>${esc(delayText)}</b></span><span>ถึง: <b>${esc(arrText)}</b></span></div>
    ${d.checkedAt ? `<small class="fm-muted">ตรวจสอบล่าสุด ${fmDate(d.checkedAt)} · ${esc(d.source || "Flight data")}</small>` : ""}
    ${d.message ? `<small class="fm-muted">${esc(d.message)}</small>` : ""}
  </article>`;
}
function fmHistoryCard(f, h) {
  const x = h || {};
  const n = Number(x.sampleSize) || 0;
  return `<article class="fm-history">
    <div class="fm-top"><b>${esc(f.no)} · ประวัติย้อนหลัง 12 เดือน</b><span class="fm-pill ${n ? "info" : "muted"}">${n ? `${n} เที่ยวบิน` : "ไม่มีข้อมูล"}</span></div>
    <div class="fm-metrics">
      <div><b>${n && x.onTimeRate != null ? `${Math.round(x.onTimeRate)}%` : "—"}</b><small>ออกตรงเวลา</small></div>
      <div><b>${n && x.averageDepartureDelay != null ? `${Math.round(x.averageDepartureDelay)} นาที` : "—"}</b><small>ดีเลย์เฉลี่ย* </small></div>
      <div><b>${n && x.averageArrivalDelay != null ? `${Math.round(x.averageArrivalDelay)} นาที` : "—"}</b><small>ดีเลย์ถึงเฉลี่ย*</small></div>
    </div>
    <small class="fm-muted">${n ? `คำนวณจาก ${n} เที่ยวบินที่มีข้อมูลเวลาจริง · *นับเฉพาะเที่ยวบินที่ล่าช้า` : "ยังไม่มีประวัติที่ยืนยันเวลาออก/ถึงจริง"}</small>
  </article>`;
}
function fmRender() {
  const root = document.getElementById("flight-monitor");
  if (!root) return;
  const flights = fmFlights(), current = FM_DATA && FM_DATA.current || {}, history = FM_DATA && FM_DATA.history || {};
  root.innerHTML = `
    <style>
      .fm-wrap{margin-top:12px}.fm-head{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
      .fm-head h2{font-size:18px;margin:0}.fm-intro{font-size:13px;color:var(--mut);margin:5px 0 12px}
      .fm-refresh{width:auto;min-width:150px;min-height:44px}.fm-refresh:disabled{opacity:.55;cursor:wait}
      .fm-flight,.fm-history{background:var(--bg);border:1px solid var(--line);border-radius:14px;padding:12px;margin-top:9px}
      .fm-top{display:flex;justify-content:space-between;align-items:center;gap:8px}.fm-top small{display:block;color:var(--mut);font-size:12px}
      .fm-pill{display:inline-flex;border-radius:999px;padding:4px 9px;font-size:12px;font-weight:700;white-space:nowrap}
      .fm-pill.success{background:rgba(52,211,153,.16);color:var(--grn)}.fm-pill.warning{background:rgba(251,191,36,.16);color:var(--amb)}
      .fm-pill.danger{background:rgba(248,113,113,.16);color:#f87171}.fm-pill.info{background:rgba(56,189,248,.16);color:var(--sky)}
      .fm-pill.muted{background:var(--card);color:var(--mut)}
      .fm-route{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center;margin:13px 0 9px}
      .fm-route>div:last-child{text-align:right}.fm-route b{display:block;font-size:14px}.fm-route small{display:block;color:var(--mut);font-size:11px}.fm-route>span{font-size:20px;color:var(--sky)}
      .fm-delays{display:flex;justify-content:space-between;gap:8px;border-top:1px solid var(--line);padding-top:8px;font-size:13px}
      .fm-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}
      .fm-metrics>div{background:var(--card);border-radius:10px;padding:9px 6px;text-align:center}
      .fm-metrics b{display:block;font-size:17px}.fm-metrics small,.fm-muted{display:block;color:var(--mut);font-size:11px}
      .fm-note{font-size:12px;color:var(--mut);margin:9px 0 0;line-height:1.55}
      @media(min-width:600px){.fm-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.fm-flight,.fm-history{margin-top:9px}}
    </style>
    <div class="card fm-wrap">
      <div class="fm-head"><h2>✈️ Flight Monitor</h2><button class="btn fm-refresh" onclick="fmRefresh()" ${FM_BUSY ? "disabled" : ""}>${FM_BUSY ? "กำลังตรวจสอบ…" : "↻ ตรวจสอบเที่ยวบิน"}</button></div>
      <p class="fm-intro">ติดตามเวลาออก–ถึงจริงและสถานะเที่ยวบินขาไป/ขากลับ ตรวจสอบเมื่อกดปุ่มเท่านั้น</p>
      <div class="fm-grid">${flights.map(f => fmFlightCard(f, current[f.no])).join("")}</div>
      <div class="rvh">📊 ประวัติความตรงต่อเวลา</div>
      <div class="fm-grid">${flights.map(f => fmHistoryCard(f, history[f.no])).join("")}</div>
      <p class="fm-note">สถิติย้อนหลังคำนวณจากเที่ยวบินที่มีเวลาออกจริง/ถึงจริงในช่วง 12 เดือนก่อนวันเดินทาง ไม่ใช่การคาดการณ์เที่ยวบินในอนาคต ข้อมูลอาจไม่ครอบคลุมทุกเที่ยวบินและขึ้นอยู่กับผู้ให้บริการข้อมูล</p>
      ${FM_DATA && FM_DATA.checkedAt ? `<p class="fm-note">อัปเดตข้อมูลล่าสุด: ${fmDate(FM_DATA.checkedAt)} · ข้อมูลจาก ${esc(FM_DATA.source || "FlightAware AeroAPI")}</p>` : `<p class="fm-note">ยังไม่มีข้อมูลสถานะ กด “ตรวจสอบเที่ยวบิน” เพื่อโหลดข้อมูลล่าสุด</p>`}
      ${FM_DATA && FM_DATA.error ? `<p class="fm-note" style="color:#f87171">${esc(FM_DATA.error)}</p>` : ""}
    </div>`;
}
async function fmRefresh() {
  if (FM_BUSY) return;
  const flights = fmFlights();
  if (!flights.length || flights.some(f => !f.no || !f.dep || !f.arr)) return toast("ข้อมูลเที่ยวบินใน hotels.js ไม่ครบ");
  FM_BUSY = true; fmRender();
  try {
    const response = await fetch(FM_ENDPOINT, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ flights })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
    FM_DATA = result;
    fmRender();
    toast("อัปเดตสถานะและประวัติเที่ยวบินแล้ว");
  } catch (e) {
    FM_DATA = { ...(FM_DATA || {}), error: e.message || "ตรวจสอบเที่ยวบินไม่สำเร็จ" };
    fmRender(); toast("ตรวจสอบเที่ยวบินไม่สำเร็จ");
  } finally {
    FM_BUSY = false; fmRender();
  }
}
