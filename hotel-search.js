/* Getoh Hotel Discovery
 * Google Places content is fetched on demand and kept in memory only.
 * Firebase stores Place IDs, user-selected status and user-entered prices only.
 */
(() => {
  const $ = id => document.getElementById(id);
  const endpoint = () => window.GETOH_PLACES_API_URL || '';
  const escH = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeUrl = value => { try { const u = new URL(value); return /^https?:$/.test(u.protocol) ? u.href : ''; } catch (_) { return ''; } };
  const statusLabels = { primary: 'ตัวเลือกหลัก', backup: 'ตัวเลือกสำรอง', selected: 'เลือกแล้ว' };
  const statusClass = { primary: 'is-primary', backup: 'is-backup', selected: 'is-selected' };
  let searchResults = [];
  let saved = {};
  let details = {};
  let prices = {};
  let compareIds = new Set();
  let busy = false;

  async function request(path, method='GET', body) {
    const response = await fetch(`${DB}/${path}.json`, {
      method,
      headers: body !== undefined ? {'Content-Type':'application/json'} : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
    if (!response.ok) throw new Error(`Firebase HTTP ${response.status}`);
    return response.json();
  }
  async function places(body) {
    const url = endpoint();
    if (!url) throw new Error('ยังไม่ได้ตั้งค่า Google Places Proxy ใน getoh-config.js');
    const response = await fetch(url, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)});
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Google Places HTTP ${response.status}`);
    return data;
  }
  const bookingUrl = name => `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(name + ' Osaka Japan')}`;
  const agodaUrl = name => `https://www.agoda.com/search?text=${encodeURIComponent(name + ' Osaka Japan')}`;
  const priceText = p => p && Number.isFinite(Number(p.price)) ? `฿${Number(p.price).toLocaleString('th-TH',{maximumFractionDigits:2})}` : 'ยังไม่มีราคา';

  async function search() {
    const query = $('hotel-search-query').value.trim();
    if (query.length < 2) { $('hotel-search-feedback').textContent = 'พิมพ์ชื่อโรงแรมหรือย่านอย่างน้อย 2 ตัวอักษร'; return; }
    if (busy) return;
    busy = true; $('hotel-search-btn').disabled = true;
    $('hotel-search-feedback').textContent = 'กำลังค้นหาโรงแรมจาก Google Places…';
    $('hotel-search-results').innerHTML = '';
    try {
      const data = await places({mode:'hotelSearch', query});
      searchResults = Array.isArray(data.places) ? data.places : [];
      $('hotel-search-feedback').textContent = searchResults.length ? `พบ ${searchResults.length} แห่ง · Google Places` : 'ไม่พบโรงแรมที่ตรงกับคำค้น ลองใช้ชื่อย่านหรือชื่อภาษาอังกฤษ';
      renderSearch();
    } catch (error) {
      $('hotel-search-feedback').textContent = error.message || 'ค้นหาไม่สำเร็จ';
    } finally { busy = false; $('hotel-search-btn').disabled = false; }
  }
  function searchCard(place) {
    const already = !!saved[place.id];
    const rating = place.rating ? `★ ${Number(place.rating).toFixed(1)}${place.userRatingCount ? ` · ${Number(place.userRatingCount).toLocaleString('th-TH')} รีวิว` : ''}` : 'ยังไม่มีคะแนน';
    const maps = safeUrl(place.googleMapsUri);
    return `<article class="hotel-place-card"><div class="hotel-place-top"><span class="hotel-place-mark">STAY</span><span class="hotel-google-label">Google Maps</span></div><h4>${escH(place.name || 'โรงแรม')}</h4><p class="hotel-place-address">${escH(place.address || 'ไม่มีข้อมูลที่อยู่')}</p><div class="hotel-place-rating">${escH(rating)}</div><div class="hotel-place-actions">${maps ? `<a href="${escH(maps)}" target="_blank" rel="noopener">ดูแผนที่ ↗</a>` : ''}<button type="button" ${already?'disabled':''} data-save-place="${escH(place.id)}">${already?'บันทึกแล้ว':'เพิ่มในรายการ'}</button></div></article>`;
  }
  function renderSearch() {
    $('hotel-search-results').innerHTML = searchResults.map(searchCard).join('');
  }
  async function addPlace(placeId) {
    const place = searchResults.find(p => p.id === placeId);
    if (!place || saved[placeId]) return;
    const entry = {placeId, status:'backup', updatedAt:Date.now()};
    try {
      await request(`hotelSelections/${encodeURIComponent(placeId)}`, 'PUT', entry);
      saved[placeId] = entry;
      details[placeId] = place; // session-only Google Places content
      renderSearch(); renderSaved();
      if (typeof toast === 'function') toast('เพิ่มโรงแรมในรายการแล้ว');
    } catch (error) { if (typeof toast === 'function') toast('บันทึกโรงแรมไม่สำเร็จ: ' + error.message); }
  }
  async function loadPlace(placeId) {
    if (details[placeId]) return details[placeId];
    const data = await places({mode:'hotelDetails', placeId});
    details[placeId] = data.place;
    return data.place;
  }
  function savedCard(placeId, selection) {
    const place = details[placeId];
    if (!place) return `<article class="hotel-place-card hotel-place-loading"><p>กำลังโหลดรายละเอียดโรงแรม…</p></article>`;
    const price = prices[placeId];
    const rating = place.rating ? `★ ${Number(place.rating).toFixed(1)}/5` : 'ไม่มีคะแนน';
    const maps = safeUrl(place.googleMapsUri);
    const website = safeUrl(place.websiteUri);
    const status = selection.status || 'backup';
    const name = place.name || 'โรงแรม';
    return `<article class="hotel-place-card hotel-saved-card"><div class="hotel-place-top"><span class="hotel-status ${statusClass[status] || statusClass.backup}">${statusLabels[status] || statusLabels.backup}</span><span class="hotel-google-label">${escH(rating)}</span></div><h4>${escH(name)}</h4><p class="hotel-place-address">${escH(place.address || '')}</p><div class="hotel-price-block"><span>ราคาที่บันทึกใน Getoh · Firebase</span><strong>${priceText(price)}</strong><small>${price && price.priceDate ? `ราคา ณ ${escH(price.priceDate)}` : 'ยังไม่ได้บันทึกราคา'}${price && price.totalNights ? ` · ${Number(price.totalNights)} คืน` : ''}${price && price.roomType ? ` · ${escH(price.roomType)}` : ''}</small></div><label class="hotel-status-control">สถานะ<select data-status-place="${escH(placeId)}"><option value="primary" ${status==='primary'?'selected':''}>ตัวเลือกหลัก</option><option value="backup" ${status==='backup'?'selected':''}>ตัวเลือกสำรอง</option><option value="selected" ${status==='selected'?'selected':''}>เลือกแล้ว</option></select></label><div class="hotel-place-actions hotel-booking-actions">${maps?`<a href="${escH(maps)}" target="_blank" rel="noopener">Google Maps ↗</a>`:''}${website?`<a href="${escH(website)}" target="_blank" rel="noopener">เว็บไซต์โรงแรม ↗</a>`:''}<a href="${escH(bookingUrl(name))}" target="_blank" rel="noopener">Booking.com ↗</a><a href="${escH(agodaUrl(name))}" target="_blank" rel="noopener">Agoda ↗</a><button type="button" data-price-place="${escH(placeId)}">${price?'แก้ไขราคา':'บันทึกราคา'}</button><button type="button" class="hotel-remove" data-remove-place="${escH(placeId)}">นำออก</button></div><label class="hotel-compare-toggle"><input type="checkbox" data-compare-place="${escH(placeId)}" ${compareIds.has(placeId)?'checked':''}> เพิ่มในการเปรียบเทียบ</label><p class="hotel-live-note">ราคาจากเว็บไซต์จองไม่ได้เชื่อม API · กดลิงก์เพื่อตรวจสอบราคาเอง</p></article>`;
  }
  function renderSaved() {
    const ids = Object.keys(saved);
    $('hotel-saved-count').textContent = `${ids.length} แห่ง`;
    compareIds = new Set([...compareIds].filter(id => !!saved[id]));
    $('hotel-saved-list').innerHTML = ids.length ? ids.map(id => savedCard(id, saved[id])).join('') : '<div class="hotel-empty">ยังไม่มีโรงแรมที่บันทึกไว้ · ค้นหาแล้วกด “เพิ่มในรายการ”</div>';
    renderCompare();
    ids.forEach(id => { if (!details[id]) loadPlace(id).then(() => renderSaved()).catch(() => { const node = $('hotel-saved-list'); if (node) node.innerHTML = `<div class="hotel-empty">โหลดข้อมูลโรงแรมบางรายการไม่สำเร็จ กรุณารีเฟรช</div>`; }); });
  }
  function renderCompare() {
    const ids = [...compareIds].filter(id => saved[id] && details[id]);
    const wrap = $('hotel-compare-wrap');
    wrap.hidden = ids.length < 2;
    $('hotel-compare-list').innerHTML = ids.map(id => {
      const p = prices[id], d = details[id];
      return `<article class="hotel-compare-item"><b>${escH(d.name || 'โรงแรม')}</b><strong>${priceText(p)}</strong><small>${p && p.totalNights ? `${Number(p.totalNights)} คืน` : 'ยังไม่ระบุจำนวนคืน'} · ${p && p.priceDate ? `ราคา ณ ${escH(p.priceDate)}` : 'ไม่มีวันที่ราคา'}</small><small>${statusLabels[saved[id].status] || statusLabels.backup}</small></article>`;
    }).join('');
  }
  async function loadSaved() {
    try {
      const [selectionData, priceData] = await Promise.all([request('hotelSelections'), request('hotelPrices')]);
      saved = selectionData || {}; prices = priceData || {};
      renderSaved();
    } catch (error) {
      $('hotel-saved-list').innerHTML = `<div class="hotel-empty">โหลดข้อมูล Firebase ไม่สำเร็จ: ${escH(error.message)}</div>`;
    }
  }
  async function changeStatus(placeId, status) {
    if (!saved[placeId] || !statusLabels[status]) return;
    const next = {...saved[placeId], status, updatedAt:Date.now()};
    try { await request(`hotelSelections/${encodeURIComponent(placeId)}`, 'PUT', next); saved[placeId]=next; renderSaved(); }
    catch (error) { if (typeof toast === 'function') toast('เปลี่ยนสถานะไม่สำเร็จ: ' + error.message); }
  }
  async function editPrice(placeId) {
    const old = prices[placeId] || {};
    const raw = prompt('ราคาที่บันทึกใน Getoh (บาท) — ใส่เฉพาะตัวเลข', old.price ?? '');
    if (raw === null) return;
    const price = Number(raw);
    if (!Number.isFinite(price) || price < 0) { if (typeof toast === 'function') toast('กรุณาระบุราคาเป็นตัวเลขตั้งแต่ 0 ขึ้นไป'); return; }
    const nightsRaw = prompt('จำนวนคืน', old.totalNights || (window.OSAKA_CONFIG && window.OSAKA_CONFIG.flights ? 4 : 1));
    if (nightsRaw === null) return;
    const totalNights = Number(nightsRaw);
    if (!Number.isInteger(totalNights) || totalNights < 1 || totalNights > 60) { if (typeof toast === 'function') toast('จำนวนคืนไม่ถูกต้อง'); return; }
    const priceDate = prompt('วันที่อ้างอิงราคา (เช่น 17 พ.ย. 2026)', old.priceDate || new Date().toLocaleDateString('th-TH'));
    if (priceDate === null) return;
    const roomType = prompt('ประเภทห้อง (ไม่บังคับ)', old.roomType || '');
    if (roomType === null) return;
    const notes = prompt('หมายเหตุราคา (ไม่บังคับ)', old.notes || '');
    if (notes === null) return;
    const next = {price, currency:'THB', totalNights, priceDate:priceDate.trim(), roomType:roomType.trim(), notes:notes.trim(), source:'user', updatedAt:Date.now()};
    try {
      await request(`hotelPrices/${encodeURIComponent(placeId)}`, 'PUT', next);
      prices[placeId]=next;
      request(`hotelPriceHistory/${encodeURIComponent(placeId)}`, 'POST', next).catch(() => {});
      renderSaved(); if (typeof toast === 'function') toast('บันทึกราคาแล้ว');
    }
    catch (error) { if (typeof toast === 'function') toast('บันทึกราคาไม่สำเร็จ: ' + error.message); }
  }
  async function removePlace(placeId) {
    if (!confirm('นำโรงแรมนี้ออกจากรายการ Getoh? (ราคาใน Firebase จะยังคงเก็บไว้)')) return;
    try { await request(`hotelSelections/${encodeURIComponent(placeId)}`, 'DELETE'); delete saved[placeId]; renderSaved(); renderSearch(); }
    catch (error) { if (typeof toast === 'function') toast('นำออกไม่สำเร็จ: ' + error.message); }
  }

  $('hotel-search-btn').addEventListener('click', search);
  $('hotel-search-query').addEventListener('keydown', event => { if (event.key === 'Enter') search(); });
  $('hotel-search-results').addEventListener('click', event => { const button = event.target.closest('[data-save-place]'); if (button) addPlace(button.dataset.savePlace); });
  $('hotel-saved-list').addEventListener('change', event => { const select = event.target.closest('[data-status-place]'); if (select) changeStatus(select.dataset.statusPlace, select.value); const compare = event.target.closest('[data-compare-place]'); if (compare) { if (compare.checked && compareIds.size >= 4) { compare.checked = false; if (typeof toast === 'function') toast('เปรียบเทียบได้สูงสุด 4 โรงแรม'); return; } compare.checked ? compareIds.add(compare.dataset.comparePlace) : compareIds.delete(compare.dataset.comparePlace); renderCompare(); } });
  $('hotel-compare-clear').addEventListener('click', () => { compareIds.clear(); renderSaved(); });
  $('hotel-saved-list').addEventListener('click', event => {
    const price = event.target.closest('[data-price-place]'); if (price) editPrice(price.dataset.pricePlace);
    const remove = event.target.closest('[data-remove-place]'); if (remove) removePlace(remove.dataset.removePlace);
  });
  loadSaved();
})();
