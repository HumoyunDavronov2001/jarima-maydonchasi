/* JM.views.car — TV kartasi va stol amallari */
window.JM = window.JM || {}; JM.views = JM.views || {};
(function () {
  const S = JM.store, U = JM.ui, $ = U.$;
  let cur = null, src = null, tab = null, near = null, fresh = false;

  async function open(id, source, nearRead) {
    const same = cur && cur.id === id;
    cur = await JM.api.get(id); src = source || null; near = nearRead || null; if (!same) tab = null; fresh = !same;
    JM.views.lot.select(id); render(); JM.views.lot.render(); document.querySelector('main').scrollTo({ top: 0, behavior: 'smooth' });
  }
  function close() { cur = null; src = null; near = null; JM.views.lot.select(null); render(); JM.views.lot.render(); }
  async function refresh() { if (cur) { cur = await JM.api.get(cur.id); render(); } }

  /* ---------- karta ---------- */
  function render() {
    const el = $('#focus');
    if (!cur) { el.innerHTML = ''; el.style.display = 'none'; return; }
    el.style.display = '';
    const v = cur, c = S.conds(v), b = c.bill, act = v.status === 'IN';
    const verdict = v.status === 'OUT' ? `<div class="verdict out">Chiqarilgan ${S.dt(v.releasedAt)}</div>`
      : v.status === 'TEMP_OUT' ? `<div class="verdict blk">Vaqtincha chiqarilgan ${S.dt(v.releasedAt)}</div>`
      : v.status === 'CANCELED' ? `<div class="verdict out">Kirish bekor qilingan: ${S.esc(v.cancel.reason)}</div>`
      : v.status === 'BLOCKED' ? `<div class="verdict blk">Bloklangan: ${S.esc(v.block.reason)}${v.block.pauseBilling ? '. Hisob to\u2018xtatilgan' : ''}</div>`
      : c.can ? `<div class="verdict ok">Chiqarishga tayyor</div>` : `<div class="verdict no">Chiqarish mumkin emas</div>`;
    const kind = src && src.cam ? src.cam : (v.status === 'OUT' ? 'out' : 'in');
    const live = !!(src && src.cam === 'out' && v.status !== 'OUT');
    const cap = kind === 'out' ? `Chiqish kamerasi, ${S.dt(v.releasedAt || new Date())}` : v.entryFrame ? `Kirish kamerasi, ${S.dt(v.enteredAt)}${v.conf ? ', ishonch ' + v.conf + '%' : ''}` : `Qo'lda kiritilgan, ${S.dt(v.enteredAt)}`;
    const p = v.protocol || {};
    const meta = `<div class="meta">
      <div><span>Kirgan</span><b>${S.dt(v.enteredAt)}</b></div><div><span>Muddat</span><b class="${S.daysIn(v) >= 30 ? 'warn' : ''}">${S.dur(v)}</b></div><div><span>Sektor</span><b class="${v.sector ? '' : 'warn'}">${S.esc(v.sector) || 'belgilanmagan'}</b></div>
      <div><span>Evakuator</span><b>${v.evac.needed ? (v.evac.truck ? S.prettyPlate(v.evac.truck) : "ro'yxatda yo'q") + (v.evac.km ? ', ' + v.evac.km + ' km' : '') + (v.evac.auto ? '' : ', qo\u2018lda') : "yo'q, o'zi keldi"}</b></div>
      <div><span>Protokol</span><b class="${p.no ? '' : 'warn'}">${p.no ? S.esc(p.no) + (p.article ? ', ' + S.esc(p.article) : '') : 'kutilmoqda'}</b></div><div><span>Sabab</span><b>${S.esc(p.reason) || '—'}</b></div>
      <div><span>Ushlagan xodim</span><b>${S.esc(p.officer) || '—'}</b></div><div><span>Egasi</span><b>${S.esc(p.owner) || '—'}${p.phone ? ', ' + S.esc(p.phone) : ''}</b></div><div><span>Kategoriya</span><b>${S.CATEGORIES[v.category]}${v.vin ? ', VIN ' + S.esc(v.vin) : ''}</b></div>
    </div>`;
    const main = !act ? (v.status === 'OUT' ? `<button class="primary" id="actPrint">Dalolatnoma</button>` : v.status === 'TEMP_OUT' ? `<button class="primary" id="tempRet">Qaytdi — saqlash davom etadi</button>` : v.status === 'BLOCKED' ? `<button class="primary" id="unblockBtn">Blokni olish (rahbar)</button>` : '')
      : b.debt > 0 && !(c.basis && c.basis.billing !== 'pay') ? `<button class="primary" id="payBtn">To'lov va oluvchi, ${S.fmt(b.debt)} so'm</button>`
      : c.can ? (JM.settings.gate.auto && v.plate ? `<span class="st ok">Tayyor — kamera o'qisa shlagbaum ochiladi</span>` : `<button class="primary go" id="releaseBtn">${v.plate ? 'Chiqarish' : "Qo'lda chiqarish — raqamsiz"}</button>`)
      : `<button class="primary" disabled>Shlagbaum yopiq</button>`;
    const li = (o, btn) => `<li class="${o.st}"><i></i><div><span>${S.esc(o.t)}</span>${btn ? `<span>${btn}</span>` : ''}</div></li>`;
    const permBtn = act ? (v.permission && v.permission.status === 'active' ? `<button class="tb" id="permBtn">Tahrirlash</button><button class="tb warn" id="permCancel">Bekor qilingan</button>` : `<button class="tb" id="permBtn">Kiritish</button>`) : '';
    const recBtn = act ? `<button class="tb" id="recBtn">${v.receiver ? 'Tahrirlash' : 'Kiritish'}</button>` : '';
    const missing = S.missingPhotos(v);

    el.innerHTML = `<div class="focus ${fresh ? 'anim' : ''}">
      <button class="xbtn" id="closeBtn" aria-label="Yopish">${U.icon('x')}</button>
      ${src && src.text ? `<div class="src">${S.esc(src.text)}</div>` : ''}
      ${near ? `<div class="src warn">Kamera <b>${S.prettyPlate(near)}</b> deb o'qidi, ro'yxatda yo'q. Shu mashinami? <button class="tb" id="nearYes">Ha, ${S.prettyPlate(v.plate)}</button></div>` : ''}
      <div class="hero">
        <div><div class="frame">${U.frame(v, kind, live ? new Date() : undefined, live)}</div><div class="cap">${cap}</div></div>
        <div><div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">${U.plate(v.plate, 'lg', v.vin)}<div><div style="font-size:16px;font-weight:600">${S.esc(v.brand) || (v.vin ? 'VIN ' + S.esc(v.vin) : 'Marka kiritilmagan')}${v.color ? ', ' + S.esc(v.color) : ''}</div>${v.waiting ? '<div class="warn" style="font-size:13px;font-weight:500">Egasi kutmoqda</div>' : ''}</div></div>
          ${meta}
          ${verdict}
          <div class="act">${main}
            ${act ? `<button class="tb" id="protoBtn">${v.protocol ? 'Protokol, ma\u2019lumotlar' : 'Protokolni kiritish'}</button>` : ''}
            ${act && !c.can && !v.waiting && !v.permission ? `<button class="tb" id="waitBtn">Egasi kutmoqda</button>` : ''}
            ${act && v.waiting ? `<button class="tb" id="waitOff">Kutish belgisini olish</button>` : ''}
            ${act && c.can && JM.settings.gate.auto ? `<button class="tb" id="towBtn">Evakuator bilan chiqadi</button><button class="tb" id="manualBtn">Qo'lda chiqarish</button>` : ''}
            ${act && !v.protocol && S.paidTotal(v) === 0 ? `<button class="tb warn" id="cancelBtn">Xato kirish</button>` : ''}
            ${act && c.can ? `<button class="tb" id="actPre">Dalolatnoma (stolda imzo)</button>` : ''}
            ${act ? `<button class="tb" id="tagBtn">QR yorliq</button>` : ''}
            ${v.status !== 'OUT' && v.status !== 'CANCELED' ? `<button class="tb warn" id="rahbarBtn">Rahbar amallari</button>` : ''}</div>
        </div>
      </div>
      ${timeline(v, c)}
      ${bill(v, b, c)}
      <ul class="conds">${li(c.pay)}${li(c.perm, permBtn)}${li(c.rec, recBtn)}</ul>
      <div class="tabs"><button data-tab="qabul" class="${tab === 'qabul' ? 'on' : ''}">Qabul: kalit, buyumlar, shikast</button><button data-tab="foto" class="${tab === 'foto' ? 'on' : ''}">Fotolar ${v.photos.length}${missing.length ? ' <span class="warn">(' + missing.length + ' ta yetishmaydi)</span>' : ''}</button><button data-tab="korik" class="${tab === 'korik' ? 'on' : ''}">Ko'rik jurnali ${v.accessLog.length || ''}</button><button data-tab="jur" class="${tab === 'jur' ? 'on' : ''}">Jurnal</button></div>
      ${tabHtml(v, missing)}
    </div>`;

    const on = (id, f) => { const e = document.getElementById(id); if (e) e.onclick = f; };
    on('closeBtn', close); on('payBtn', () => payModal()); on('protoBtn', () => protoModal()); on('permBtn', () => permModal()); on('permCancel', () => permCancelModal());
    on('recBtn', () => recModal()); on('waitBtn', async () => { await JM.api.setWaiting(v.id, true); refresh(); }); on('waitOff', async () => { await JM.api.setWaiting(v.id, false); refresh(); });
    on('cancelBtn', () => cancelModal()); on('towBtn', () => towModal()); on('manualBtn', () => manualModal()); on('releaseBtn', () => manualModal());
    on('actPrint', () => U.print(JM.print.act(v))); on('actPre', () => U.print(JM.print.act(v))); on('accessBtn', () => accessModal()); on('tempRet', () => JM.rahbar.tempReturn()); on('unblockBtn', () => JM.rahbar.unblock());
    on('rahbarBtn', () => rahbarMenu(v)); on('tagBtn', () => U.print(JM.print.tag(v)));
    el.querySelectorAll('[data-refund]').forEach(b => b.onclick = () => JM.rahbar.refund(b.dataset.refund));
    el.querySelectorAll('[data-receipt]').forEach(b => b.onclick = () => { const p = v.payments.find(x => x.id === b.dataset.receipt); U.print(p.method === 'transfer' ? JM.print.invoice(v, p) : JM.print.receipt(v, p)); }); on('nearYes', async () => { await JM.api.confirmNear(v.id, near); near = null; refresh(); });
    el.querySelectorAll('[data-tab]').forEach(t => t.onclick = () => { tab = tab === t.dataset.tab ? null : t.dataset.tab; render(); });
    const bar = el.querySelector('.tl .bar'); if (bar) requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = bar.dataset.w; }));
    if (fresh) el.querySelectorAll('[data-count]').forEach(n => U.countUp(n, +n.dataset.count, 520));
    fresh = false;
  }

  function timeline(v, c) {
    const steps = [
      ['Kirish', S.dm(v.enteredAt), 'done'],
      ['Qabul', v.acceptance ? S.dm(v.acceptance.signedAt) : S.missingPhotos(v).length ? `${4 - S.missingPhotos(v).length}/4 foto` : 'foto to\u2018liq', v.acceptance ? 'done' : S.missingPhotos(v).length ? 'cur' : 'done'],
      ['Protokol', v.protocol && v.protocol.no ? v.protocol.no : 'kutilmoqda', v.protocol && v.protocol.no ? 'done' : 'cur'],
      ["To'lov", c.pay.st === 'ok' ? S.fmt(c.bill.paid) : c.pay.st === 'wait' ? 'kutilmoqda' : S.fmt(c.bill.debt) + ' qarz', c.pay.st === 'ok' ? 'done' : c.pay.st === 'wait' ? 'cur' : 'bad'],
      ['Ruxsatnoma', c.perm.st === 'ok' ? (v.permission ? v.permission.no : c.basis ? S.BASIS[c.basis.type] : '') : v.permission && v.permission.status === 'canceled' ? 'bekor' : 'yo\u2018q', c.perm.st === 'ok' ? 'done' : v.permission && v.permission.status === 'canceled' ? 'bad' : ''],
      ['Oluvchi', v.receiver ? v.receiver.name.split(' ')[0] : 'yo\u2018q', v.receiver ? 'done' : ''],
      ['Chiqish', v.releasedAt ? S.dm(v.releasedAt) : c.can ? 'tayyor' : '', v.releasedAt ? 'done' : c.can ? 'cur' : ''],
    ];
    const done = steps.filter(s => s[2] === 'done').length;
    const pct = Math.round((done - 1) / (steps.length - 1) * 100);
    return `<div class="tl"><span class="bar" style="width:0" data-w="${Math.max(0, pct)}%"></span>${steps.map(s => `<div class="${s[2]}"><i></i><b>${s[0]}</b><small>${S.esc(s[1])}</small></div>`).join('')}</div>`;
  }

  function bill(v, b, c) {
    const t = v.tariff; let rows = '';
    if (S.daysIn(v) >= 30) rows += `<tr class="note"><td colspan="3">30 kundan oshdi, ${S.daysIn(v)} kun. Qonun bo'yicha keyingi tartib — YHXX ga ro'yxat, sud, realizatsiya.</td></tr>`;
    if (v.evac.needed && t.chargeEvac) rows += `<tr><td>Evakuatsiya${v.evac.truck ? ', ' + S.prettyPlate(v.evac.truck) : ''}</td><td class="q">${S.fmt(t.evacBase)}${v.evac.km ? ` + ${v.evac.km} km × ${S.fmt(t.evacKm)}` : ''}</td><td class="r">${S.fmt(b.evac)}</td></tr>`;
    const pausedH = Math.floor(S.pausedMs(v, S.storageEnd(v)) / 3600e3);
    rows += `<tr><td>Saqlash, ${S.dm(v.enteredAt)} dan${v.releasedAt ? ' ' + S.dm(v.releasedAt) + ' gacha' : ''}${pausedH ? `, <span class="warn">${pausedH} soat to\u2018xtatilgan</span>` : ''}</td><td class="q">${b.hours} to'liq soat × ${S.fmt(t.hour)}${b.days ? ` (${b.days} sutka)` : ''}</td><td class="r">${S.fmt(b.storage)}</td></tr>`;
    (v.exemptions || []).forEach(e => rows += `<tr class="paid"><td>Imtiyoz: ${S.esc(e.basis)}</td><td></td><td class="r">− ${S.fmt(e.amount)}</td></tr>`);
    rows += `<tr class="tot"><td>Jami</td><td></td><td class="r"><span data-count="${b.charged}">${S.fmt(b.charged)}</span></td></tr>`;
    (v.payments || []).forEach((p, i) => {
      if (p.amount < 0) rows += `<tr class="paid"><td>Qaytarildi ${S.dm(p.at)}, ${S.esc(p.reason || '')}${p.status === 'ok' ? (p.fiscal ? ', chek ' + p.fiscal.sign : '') : ', <span class="warn">chek yuborilmoqda</span>'}</td><td></td><td class="r">+ ${S.fmt(-p.amount)}</td></tr>`;
      else if (p.status === 'bank_wait') rows += `<tr class="paid"><td>O'tkazma ${S.dm(p.at)}, hisob-faktura ${p.invoice} — <span class="warn">bank tasdig'i kutilmoqda</span> <button class="tb" data-bank="${p.id}">Tasdiq keldi</button></td><td></td><td class="r">(${S.fmt(p.amount)})</td></tr>`;
      else rows += `<tr class="paid"><td>To'langan ${S.dm(p.at)}, ${S.METHODS[p.method]}${p.status === 'ok' ? (p.fiscal ? ', chek ' + p.fiscal.sign : p.method === 'transfer' ? ', bank tasdiqladi, hisob-faktura ' + p.invoice : '') + ` <button class="tb" data-receipt="${p.id}">${p.method === 'transfer' ? 'hisob-faktura' : 'chek'}</button>` + (v.status !== 'OUT' && !v.payments.some(x => x.refundOf === p.id) ? ` <button class="tb warn" data-refund="${p.id}">qaytarish</button>` : '') : p.status === 'pending' ? ', <span class="warn">chek yuborilmoqda</span>' : ', <span class="no">chek xatosi</span>'}</td><td></td><td class="r">− ${S.fmt(p.amount)}</td></tr>`;
    });
    if (v.status === 'IN' || v.status === 'BLOCKED') {
      if (c.basis && c.basis.billing === 'waive') rows += `<tr class="rem ok"><td colspan="3">Xizmat haqi olinmaydi — ${S.esc(c.basis.docNo)}</td></tr>`;
      else if (c.basis && c.basis.billing === 'later') rows += `<tr class="rem"><td>Keyin undiriladi</td><td></td><td class="r">${S.fmt(b.debt)}</td></tr>`;
      else rows += `<tr class="rem ${b.debt > 0 ? 'due' : 'ok'}"><td>${b.debt > 0 ? 'Qoldiq' : b.over > 0 ? "Ortiqcha to'langan" : "To'liq to'langan"}${b.debt > 0 && v.status === 'IN' ? `<button class="tb" id="payBtn2">To'lov qabul qilish</button>` : ''}</td><td></td><td class="r">${b.debt > 0 ? `<span data-count="${b.debt}">${S.fmt(b.debt)}</span>` : b.over > 0 ? S.fmt(b.over) : ''}</td></tr>`;
    }
    setTimeout(() => { const e = document.getElementById('payBtn2'); if (e) e.onclick = () => payModal(); document.querySelectorAll('[data-bank]').forEach(x => x.onclick = async () => { await JM.api.confirmBank(v.id, x.dataset.bank); refresh(); }); }, 0);
    return `<table class="bill"><tr><th>Hisob — ${S.CATEGORIES[v.category].toLowerCase()}</th><th></th><th class="r">so'm</th></tr>${rows}</table><p class="basis">Har bir to'liq soat uchun, joylashtirilgan paytdan (VMQ 149: 1-ilova 9-band, 3-ilova 9-band). Tarif ${S.fmt(t.hour)} so'm/soat, hokimlik chegarasi ${S.fmt(t.capHour)} — ${S.esc(t.decree)}.${b.nextHourAt && v.status === 'IN' ? ` <b>Keyingi to'liq soat ${S.tm(b.nextHourAt).slice(0, 5)} da</b> — hisob chiqish paytida yakunlanadi.` : ''}</p>`;
  }

  function tabHtml(v, missing) {
    if (tab === 'qabul') { const sl = v.seals || {}; const sealTxt = Object.keys(sl).length ? Object.entries({ eshik: 'eshiklar', yukxona: 'yukxona', kapot: 'kapot', bak: "bak qopqog'i" }).map(([k, t]) => `${t}: ${sl[k] ? "surg'uchlangan" : "<span class='no'>yo'q</span>"}`).join(', ') : "<span class='warn'>surg'uch qayd etilmagan</span>";
      return `<div class="sec"><div class="row"><span>Kalit: <b>${v.keys === null ? 'belgilanmagan' : v.keys ? 'bor' : "yo'q"}</b></span><span>Buyumlar (bayonnoma ro'yxati): <b>${v.items.length ? S.esc(v.items.join(', ')) : "yo'q"}</b></span><span>Shikast: <b>${S.esc(v.damage) || 'qayd etilmagan'}</b></span></div><div class="row" style="margin-top:6px"><span>Muhrlar: <b>${sealTxt}</b></span>${v.acceptance ? `<span>Qabul-topshirish dalolatnomasi: <b>${S.esc(v.acceptance.driver)}, ${S.prettyPlate(v.acceptance.truck)}, ${S.dm(v.acceptance.signedAt)}${v.acceptance.place ? ', ' + S.esc(v.acceptance.place) : ''}${v.acceptance.officerAct ? ', bayonnoma ' + S.esc(v.acceptance.officerAct) : ''}</b></span>` : "<span class='warn'>Qabul-topshirish dalolatnomasi imzolanmagan</span>"}</div><p class="hint">VMQ 149, 1-ilova 5–6-band: xodimning mol-mulk ro'yxatli dalolatnomasi, maydoncha vakilining qabul-topshirish dalolatnomasi va surg'uchlash. Hovli xodimi telefonda to'ldiradi.</p></div>`; }
    if (tab === 'foto') return `<div class="sec"><div class="thumbs">${v.entryFrame ? `<div>${U.frame(v, 'in')}<b>Kirish</b></div>` : ''}${(v.exits || []).some(e => e.frame) ? `<div>${U.frame(v, 'out')}<b>Chiqish</b></div>` : ''}${v.photos.map(p => `<div>${U.tile(p.kind, v)}<b>${S.esc(p.kind)}</b></div>`).join('')}${missing.map(k => `<div class="miss">${k}</div>`).join('')}</div><p class="hint">Fotolar hovli xodimi telefonidan keladi. Kadr — kameradan.</p></div>`;
    if (tab === 'korik') return `<div class="sec">${v.accessLog.length ? `<ul class="jur">${v.accessLog.map(a => `<li><span>${S.dt(a.at)}</span><span>${S.esc(a.who)}</span><span>${S.esc(a.purpose)}${a.items ? ': ' + S.esc(a.items) : ''}. Organ ruxsati: ${S.esc(a.organRef || '—')}. Mas'ul: ${S.esc(a.by)}</span></li>`).join('')}</ul>` : "<p class='mute'>Yozuvlar yo'q.</p>"}${v.status === 'IN' || v.status === 'BLOCKED' ? `<div class="act" style="margin-top:10px"><button class="ghost" id="accessBtn">Ko'rik yozuvi qo'shish</button></div>` : ''}<p class="hint">VMQ 149, 1-ilova 8-band: egasi mashina oldiga faqat joylashtirgan organ ruxsati bilan, mas'ul xodim ishtirokida, tashrif jurnaliga yozib. Jurnal IIB da ro'yxatga olingan.</p></div>`;
    if (tab === 'jur') return `<div class="sec"><ul class="jur">${[...v.log].reverse().map(l => `<li><span>${S.dt(l.at)}</span><span>${S.esc(l.who)}</span><span>${S.esc(l.text)}</span></li>`).join('')}</ul></div>`;
    return '';
  }

  /* ---------- to'lov + oluvchi ---------- */
  function payModal() {
    const v = cur, b = S.bill(v), r = v.receiver || {}, o = v.protocol || {};
    U.modal(`<h2>To'lov va oluvchi, ${v.plate ? S.prettyPlate(v.plate) : 'raqamsiz'}</h2>
      <div class="sum">${v.evac.needed && v.tariff.chargeEvac ? `<div><span>Evakuatsiya</span><span>${S.fmt(b.evac)}</span></div>` : ''}<div><span>Saqlash, ${b.hours} to'liq soat</span><span>${S.fmt(b.storage)}</span></div>${b.exempt ? `<div><span>Imtiyoz</span><span>− ${S.fmt(b.exempt)}</span></div>` : ''}${b.paid ? `<div><span>Avval to'langan</span><span>− ${S.fmt(b.paid)}</span></div>` : ''}<div><span>To'lanadi, so'm</span><span>${S.fmt(b.debt)}</span></div></div>
      <div class="form" style="margin-top:16px"><div class="full"><span class="mute" style="font-size:13px;display:block;margin-bottom:6px">Usul</span><div class="radios"><label><input type="radio" name="m" value="cash" checked>Naqd</label><label><input type="radio" name="m" value="card">Karta</label><label><input type="radio" name="m" value="transfer">O'tkazma (yuridik shaxs)</label></div></div>
        <label class="full"><span>Oluvchi F.I.O. — ruxsatnomadagi shaxs, hujjati oldingizda</span><input class="in" id="rName" value="${S.esc(r.name || o.owner || '')}"></label>
        <label><span>Hujjat turi</span><select class="in" id="rType">${Object.entries(S.DOC_TYPES).map(([k, t]) => `<option value="${k}" ${r.docType === k ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
        <label><span>Hujjat raqami</span><input class="in" id="rDoc" value="${S.esc(r.doc || '')}" placeholder="AD 1234567"></label>
        <label class="full"><span>Telefon</span><input class="in" id="rPhone" value="${S.esc(r.phone || o.phone || '')}"></label></div>
      <p class="hint" id="payHint">Naqd va karta — EPOS cheki darhol. O'tkazma — hisob-faktura, bank tasdig'i kelguncha to'langan hisoblanmaydi.</p>
      <div class="act"><button class="primary" id="payOk">Qabul qilish, chek chiqarish</button><button class="tb" id="mdClose">Bekor</button></div>`);
    document.querySelectorAll('input[name=m]').forEach(x => x.onchange = () => { $('#payOk').textContent = x.value === 'transfer' ? 'Hisob-faktura chiqarish' : 'Qabul qilish, chek chiqarish'; });
    $('#mdClose').onclick = U.close;
    $('#payOk').onclick = async () => {
      const name = U.val('rName'), doc = U.val('rDoc'); if (!name || !doc) return U.toast('Oluvchi F.I.O. va hujjat majburiy');
      const m = document.querySelector('input[name=m]:checked').value;
      const res = await JM.api.pay(v.id, { method: m, receiver: { name, docType: U.val('rType'), doc, phone: U.val('rPhone') } });
      if (res && res.error) return U.toast(res.error);
      U.close(); U.toast(m === 'transfer' ? `Hisob-faktura ${res.invoice} chiqarildi` : `Qabul qilindi: ${S.fmt(res.amount)} so'm`, 'ok'); refresh();
    };
  }

  /* ---------- ruxsatnoma ---------- */
  function permModal() {
    const v = cur, p = v.permission || {};
    U.modal(`<h2>Ruxsatnoma, ${v.plate ? S.prettyPlate(v.plate) : 'raqamsiz'}</h2><p class="hint" style="margin:0 0 12px">IIV «Jarima maydonchasi» kabinetida ko'ring va shu yerga ko'chiring. Tizim ruxsatnoma bermaydi va tekshirmaydi — kabinet asos.</p>
      <div class="form"><label><span>Ruxsatnoma raqami</span><input class="in" id="pNo" value="${S.esc(p.no || '')}" placeholder="RX-2609-00000"></label><label><span>Sana</span><input class="in" type="date" id="pDate" value="${S.esc(p.date || S.iso(new Date()))}"></label>
      <label class="full"><span>Bergan organ, xodim</span><input class="in" id="pIssuer" value="${S.esc(p.issuer || '')}" placeholder="Jizzax sh. YHXB, ..."></label>
      <label class="full"><span>Kimga berilgan (ruxsatnomadagi shaxs) — oluvchi shu bo'lishi kerak</span><input class="in" id="pWho" value="${S.esc(p.who || '')}"></label></div>
      <div class="act"><button class="primary" id="pOk">Saqlash</button><button class="tb" id="mdClose">Bekor</button></div>`);
    $('#mdClose').onclick = U.close;
    $('#pOk').onclick = async () => { const no = U.val('pNo'), issuer = U.val('pIssuer'); if (!no || !issuer) return U.toast('Raqam va organ majburiy'); await JM.api.setPermission(v.id, { no, date: U.val('pDate'), issuer, who: U.val('pWho') }); U.close(); refresh(); };
  }
  function permCancelModal() {
    const v = cur;
    U.modal(`<h2>Ruxsatnoma bekor qilinganmi?</h2><p class="hint" style="margin:0 0 12px">Faqat IIV kabinetida "bekor qilingan" ko'rinsa. Tayyorlik tushadi, shlagbaum ochilmaydi.</p><div class="form"><label class="full"><span>Sabab (kabinetdagi kabi)</span><input class="in" id="pcReason"></label></div><div class="act"><button class="primary" id="pcOk">Bekor qilingan deb belgilash</button><button class="tb" id="mdClose">Yopish</button></div>`);
    $('#mdClose').onclick = U.close;
    $('#pcOk').onclick = async () => { const r = U.val('pcReason'); if (!r) return U.toast('Sabab majburiy'); await JM.api.cancelPermission(v.id, r); U.close(); refresh(); };
  }

  /* ---------- oluvchi (alohida) ---------- */
  function recModal() {
    const v = cur, r = v.receiver || {}, o = v.protocol || {};
    U.modal(`<h2>Oluvchi, ${v.plate ? S.prettyPlate(v.plate) : 'raqamsiz'}</h2><div class="form"><label class="full"><span>F.I.O. — ruxsatnomadagi shaxs</span><input class="in" id="rName" value="${S.esc(r.name || o.owner || '')}"></label><label><span>Hujjat turi</span><select class="in" id="rType">${Object.entries(S.DOC_TYPES).map(([k, t]) => `<option value="${k}" ${r.docType === k ? 'selected' : ''}>${t}</option>`).join('')}</select></label><label><span>Hujjat raqami</span><input class="in" id="rDoc" value="${S.esc(r.doc || '')}"></label><label class="full"><span>Telefon</span><input class="in" id="rPhone" value="${S.esc(r.phone || o.phone || '')}"></label></div><p class="hint">Mashina haydab chiqadi — oluvchida haydovchilik guvohnomasi bo'lishi kerak, yoki evakuator bilan chiqadi.</p><div class="act"><button class="primary" id="rOk">Saqlash</button><button class="tb" id="mdClose">Bekor</button></div>`);
    $('#mdClose').onclick = U.close;
    $('#rOk').onclick = async () => { const name = U.val('rName'), doc = U.val('rDoc'); if (!name || !doc) return U.toast('F.I.O. va hujjat majburiy'); await JM.api.setReceiver(v.id, { name, docType: U.val('rType'), doc, phone: U.val('rPhone') }); U.close(); refresh(); };
  }

  /* ---------- protokol, ma'lumotlar, raqam, kategoriya, evakuatsiya ---------- */
  function protoModal() {
    const v = cur, p = v.protocol || {}, x = v.plate ? S.parsePlate(v.plate) : null;
    const paid = S.paidTotal(v) > 0;
    U.modal(`<h2>Protokol va ma'lumotlar, ${v.plate ? S.prettyPlate(v.plate) : 'raqamsiz'}</h2>
      <div class="form c3">
        <label><span>Davlat raqami (kamera xato o'qigan bo'lsa tuzating)</span><input class="in" id="fPlate" value="${S.esc(v.plate || '')}" placeholder="bo'sh — raqamsiz" style="text-transform:uppercase;font-weight:600"></label>
        <label><span>VIN / kuzov</span><input class="in" id="fVin" value="${S.esc(v.vin)}"></label>
        <label><span>Kategoriya (tarif)</span><select class="in" id="fCat" ${paid ? 'disabled' : ''}>${Object.entries(S.CATEGORIES).map(([k, t]) => `<option value="${k}" ${v.category === k ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
        <label><span>Marka, model</span><input class="in" id="fBrand" value="${S.esc(v.brand)}"></label><label><span>Rang</span><input class="in" id="fColor" value="${S.esc(v.color)}"></label><label><span>Sektor</span><input class="in" id="fSector" value="${S.esc(v.sector)}"></label>
        <h3 class="full" style="font-size:14px;margin-top:6px">Ushlab turish — IIV kabinetidan</h3>
        <label><span>Protokol raqami</span><input class="in" id="fNo" value="${S.esc(p.no || '')}"></label><label><span>Modda</span><input class="in" id="fArt" value="${S.esc(p.article || '')}"></label><label><span>Ushlagan xodim</span><input class="in" id="fOff" value="${S.esc(p.officer || '')}"></label>
        <label class="full"><span>Sabab</span><input class="in" id="fReason" value="${S.esc(p.reason || '')}"></label>
        <label><span>Egasi</span><input class="in" id="fOwner" value="${S.esc(p.owner || '')}"></label><label><span>Telefon</span><input class="in" id="fPhone" value="${S.esc(p.phone || '')}"></label>
        <h3 class="full" style="font-size:14px;margin-top:6px">Evakuatsiya${paid ? ' — to\u2018lovdan keyin faqat rahbar' : ''}</h3>
        <label class="chk"><input type="checkbox" id="fEvac" ${v.evac.needed ? 'checked' : ''} ${paid ? 'disabled' : ''}> Evakuator bilan keldi</label>
        <label><span>Evakuator raqami</span><input class="in" id="fTruck" value="${S.esc(v.evac.truck || '')}" ${paid ? 'disabled' : ''}></label>
        <label><span>Masofa, km</span><input class="in" id="fKm" value="${v.evac.km || ''}" ${paid ? 'disabled' : ''}></label>
        <h3 class="full" style="font-size:14px;margin-top:6px">Qabul</h3>
        <label><span>Kalit</span><select class="in" id="fKeys"><option value="" ${v.keys === null ? 'selected' : ''}>belgilanmagan</option><option value="1" ${v.keys === true ? 'selected' : ''}>bor</option><option value="0" ${v.keys === false ? 'selected' : ''}>yo'q</option></select></label>
        <label class="full" style="grid-column:2/-1"><span>Salondagi buyumlar (vergul bilan)</span><input class="in" id="fItems" value="${S.esc(v.items.join(', '))}"></label>
        <label class="full"><span>Shikast, holat</span><textarea class="in" id="fDamage">${S.esc(v.damage)}</textarea></label>
      </div>
      <div class="act"><button class="primary" id="fOk">Saqlash</button><button class="tb" id="mdClose">Bekor</button></div>`, true);
    $('#mdClose').onclick = U.close;
    $('#fOk').onclick = async () => {
      const d = { plate: U.val('fPlate'), vin: U.val('fVin'), brand: U.val('fBrand'), color: U.val('fColor'), sector: U.val('fSector'), damage: U.val('fDamage'), items: U.val('fItems').split(',').map(s => s.trim()).filter(Boolean), keys: U.val('fKeys') === '' ? null : U.val('fKeys') === '1',
        protocol: { no: U.val('fNo'), article: U.val('fArt'), officer: U.val('fOff'), reason: U.val('fReason'), owner: U.val('fOwner'), phone: U.val('fPhone') } };
      if (!paid) { d.category = U.val('fCat'); d.evac = { needed: U.val('fEvac'), truck: U.val('fTruck') || null, km: +U.val('fKm') || 0 }; }
      if (!d.protocol.no) delete d.protocol;
      const res = await JM.api.setProtocol(v.id, d); if (res && res.error) return U.toast(res.error);
      U.close(); refresh();
    };
  }

  /* ---------- rahbar menyusi ---------- */
  function rahbarMenu(v) {
    const act = v.status === 'IN';
    U.modal(`<h2>Rahbar amallari, ${v.plate ? S.prettyPlate(v.plate) : 'raqamsiz'}</h2><p class="hint" style="margin:0 0 12px">Har amal PIN bilan, sabab bilan, jurnalga rahbar nomidan. O'chirib bo'lmaydi.</p>
      <div class="form">${act ? `<button class="ghost" data-r="block">Bloklash</button>` : v.status === 'BLOCKED' ? `<button class="ghost" data-r="unblock">Blokni olish</button>` : ''}
      ${act || v.status === 'BLOCKED' ? `<button class="ghost" data-r="exempt">Imtiyoz, xizmat haqidan ozod</button><button class="ghost" data-r="fix">Tuzatish — kirish vaqti, evakuatsiya</button><button class="ghost" data-r="basis">Hujjat asosida chiqarish — sud, tergov, ko'chirish</button>` : ''}
      ${act ? `<button class="ghost" data-r="tempOut">Vaqtincha olib chiqish — ekspertiza</button>` : ''}
      ${act && S.paidTotal(v) === 0 && !v.protocol ? `<button class="ghost" data-r="cancelLate">Xato kirishni bekor qilish</button>` : ''}</div>
      <div class="act"><button class="tb" id="mdClose">Yopish</button></div>`);
    $('#mdClose').onclick = U.close;
    document.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { U.close(); JM.rahbar[b.dataset.r](); });
  }

  /* ---------- ko'rik jurnali (VMQ 149, 1-ilova 8-band) ---------- */
  function accessModal() {
    const v = cur, o = v.protocol || {};
    U.modal(`<h2>Ko'rik jurnali, ${v.plate ? S.prettyPlate(v.plate) : 'raqamsiz'}</h2><p class="hint" style="margin:0 0 12px">Mashina oldiga kirish faqat joylashtirgan organ ruxsati bilan va mas'ul xodim ishtirokida. Yozuv tashrif jurnaliga ham qo'lda kiritiladi.</p>
      <div class="form"><label class="full"><span>Kim (F.I.O., hujjat)</span><input class="in" id="aWho" value="${S.esc(o.owner ? o.owner + ', ' : '')}"></label>
      <label><span>Maqsad</span><select class="in" id="aPurpose"><option>Salondan buyum olish</option><option>Ko'rik (sug'urta, ekspert)</option><option>Holatni tekshirish</option><option>Boshqa</option></select></label>
      <label><span>Olingan buyumlar</span><input class="in" id="aItems" placeholder="bo'sh — olinmadi"></label>
      <label class="full"><span>Organ ruxsati (kim, qachon, qanday)</span><input class="in" id="aOrgan" placeholder="YHXB, xodim, sana, og'zaki / xat №"></label>
      <label class="full"><span>Mas'ul xodim (ishtirok etgan)</span><input class="in" id="aBy" value="A. Karimov"></label></div>
      <div class="act"><button class="primary" id="aOk">Jurnalga yozish</button><button class="tb" id="mdClose">Bekor</button></div>`);
    $('#mdClose').onclick = U.close;
    $('#aOk').onclick = async () => { const who = U.val('aWho'), organ = U.val('aOrgan'); if (!who || !organ) return U.toast('Kim va organ ruxsati majburiy'); await JM.api.addAccess(v.id, { who, purpose: U.val('aPurpose'), items: U.val('aItems'), organRef: organ, by: U.val('aBy') }); U.close(); tab = 'korik'; refresh(); };
  }

  /* ---------- xato kirish ---------- */
  function cancelModal() {
    const v = cur;
    U.modal(`<h2>Xato kirish, ${v.plate ? S.prettyPlate(v.plate) : 'raqamsiz'}</h2><p class="hint" style="margin:0 0 12px">Kamera ko'chadagi yoki darvozada burilgan mashinani o'qigan bo'lsa. 30 daqiqa ichida operator, keyin rahbar. To'lov yoki protokol bo'lsa bekor qilib bo'lmaydi.</p><div class="form"><label class="full"><span>Sabab</span><select class="in" id="cReason"><option>Ko'chadagi mashina, kirmagan</option><option>Darvozada burildi, kirmagan</option><option>Xizmat transporti, ro'yxatga kiritilmagan</option><option>Takroriy o'qish</option></select></label></div><div class="act"><button class="primary" id="cOk">Bekor qilish</button><button class="tb" id="mdClose">Yopish</button></div>`);
    $('#mdClose').onclick = U.close;
    $('#cOk').onclick = async () => { const res = await JM.api.cancelEntry(v.id, U.val('cReason'), false); if (res && res.error) return U.toast(res.error); U.close(); close(); };
  }

  /* ---------- qo'lda chiqarish, evakuator bilan ---------- */
  function manualModal() {
    const v = cur;
    U.modal(`<h2>Qo'lda chiqarish, ${v.plate ? S.prettyPlate(v.plate) : 'raqamsiz'}</h2><p class="hint" style="margin:0 0 12px">Shartlar bajarilgan. Kamera o'qimaydigan hollar uchun: raqamsiz, kamera uzilgan, raqam buzilgan. Jurnalga "kadrsiz" yoziladi.</p><div class="form"><label class="full"><span>Sabab</span><select class="in" id="mReason"><option>Raqamsiz mashina</option><option>Chiqish kamerasi uzilgan</option><option>Raqam o'qilmaydi (buzilgan, iflos)</option><option>Bitta darvoza, qo'lda</option></select></label></div><div class="act"><button class="primary go" id="mOk">Shlagbaumni ochish</button><button class="tb" id="mdClose">Bekor</button></div>`);
    $('#mdClose').onclick = U.close;
    $('#mOk').onclick = async () => { const res = await JM.api.releaseManual(v.id, { reason: U.val('mReason') }); if (res && res.error) return U.toast(res.error); U.close(); refresh(); };
  }
  function towModal() {
    const v = cur;
    U.modal(`<h2>Evakuator bilan chiqadi, ${v.plate ? S.prettyPlate(v.plate) : 'raqamsiz'}</h2><p class="hint" style="margin:0 0 12px">Mashina haydab chiqib bo'lmaydi. Begona evakuator raqamini yozing — kamera uni o'qiganda shlagbaum ochiladi; o'qimasa shu yerdan ochasiz.</p><div class="form"><label class="full"><span>Evakuator davlat raqami</span><input class="in" id="tTruck" placeholder="01 T 000 TT" style="text-transform:uppercase"></label></div><div class="act"><button class="primary go" id="tOk">Shlagbaumni ochish</button><button class="tb" id="mdClose">Bekor</button></div>`);
    $('#mdClose').onclick = U.close;
    $('#tOk').onclick = async () => { const t = U.val('tTruck'); if (!t) return U.toast('Evakuator raqami majburiy'); const res = await JM.api.releaseManual(v.id, { tow: true, truck: t, reason: 'evakuator bilan' }); if (res && res.error) return U.toast(res.error); U.close(); refresh(); };
  }

  /* ---------- qo'lda kirish ---------- */
  function manualEntry() {
    U.modal(`<h2>Qo'lda kiritish</h2><p class="hint" style="margin:0 0 12px">Raqamsiz, xorijiy yoki kamera uzilganda kelgan mashina. Kirish vaqtini aniq yozing — hisob shundan boshlanadi.</p>
      <div class="form c3"><label><span>Davlat raqami (bo'sh — raqamsiz)</span><input class="in" id="nPlate" style="text-transform:uppercase;font-weight:600"></label><label><span>VIN / kuzov</span><input class="in" id="nVin"></label><label><span>Kategoriya</span><select class="in" id="nCat">${Object.entries(S.CATEGORIES).map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select></label>
      <label><span>Marka</span><input class="in" id="nBrand"></label><label><span>Rang</span><input class="in" id="nColor"></label><label><span>Sektor</span><input class="in" id="nSector"></label>
      <label><span>Kirish sanasi</span><input class="in" type="date" id="nDate" value="${S.iso(new Date())}"></label><label><span>Vaqti</span><input class="in" type="time" id="nTime" value="${S.pad(new Date().getHours())}:${S.pad(new Date().getMinutes())}"></label><label><span>Sabab</span><select class="in" id="nReason"><option>Raqamsiz</option><option>Xorijiy raqam, kamera o'qimadi</option><option>Kamera uzilgan edi</option><option>Raqam buzilgan</option></select></label>
      <label class="chk"><input type="checkbox" id="nEvac" checked> Evakuator bilan keldi</label><label><span>Evakuator raqami</span><input class="in" id="nTruck"></label><label><span>Masofa, km</span><input class="in" id="nKm"></label></div>
      <div class="act"><button class="primary" id="nOk">Ro'yxatga olish</button><button class="tb" id="mdClose">Bekor</button></div>`, true);
    $('#mdClose').onclick = U.close;
    $('#nOk').onclick = async () => { const plate = U.val('nPlate'), vin = U.val('nVin'); if (!plate && !vin) return U.toast('Raqam yoki VIN — kamida bittasi');
      const v = await JM.api.createManual({ plate, vin, category: U.val('nCat'), brand: U.val('nBrand'), color: U.val('nColor'), sector: U.val('nSector'), enteredAt: new Date(U.val('nDate') + 'T' + U.val('nTime') + ':00'), reason: U.val('nReason'), evacNeeded: U.val('nEvac'), truck: U.val('nTruck'), km: +U.val('nKm') || 0 });
      if (v && v.error) return U.toast(v.error, 'alarm');
      U.close(); open(v.id); };
  }

  JM.views.car = { open, close, refresh, render, manualEntry, current: () => cur };
})();
