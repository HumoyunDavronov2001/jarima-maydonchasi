/* JM.print — chop etish shakllari */
window.JM = window.JM || {};
(function () {
  const S = JM.store, U = JM.ui;
  const P = {};
  const org = () => JM.settings.org;

  P.receipt = function (v, p) {
    const o = org(); const vat = v.tariff.vat ? Math.round(Math.abs(p.amount) * v.tariff.vat / (100 + v.tariff.vat)) : 0;
    const qr = qrcode(0, 'M'); qr.addData((p.fiscal && p.fiscal.url) || 'https://ofd.soliq.uz/check?t=EP000000000001'); qr.make();
    const items = p.items || [];
    return `<div class="receipt"><div class="c h">${S.esc(o.legal)}</div><div class="c">STIR ${S.esc(o.tin)}</div><div class="c">${S.esc(o.address)}</div><hr>
      <div class="row"><span>${p.amount < 0 ? 'QAYTARISH CHEKI' : 'CHEK'}</span><span>${S.dt(p.at)}</span></div><div class="row q"><span>Kassir</span><span>${S.esc(p.by || '')}</span></div><div class="row q"><span>TV</span><span>${v.plate ? S.prettyPlate(v.plate) : 'VIN ' + S.esc(v.vin)}</span></div><hr>
      ${items.map(i => `<div class="row"><span>${S.esc(i[0])}</span><span>${S.fmt(i[1])}</span></div>`).join('')}<hr>
      <div class="row tot"><span>JAMI</span><span>${S.fmt(Math.abs(p.amount))}</span></div><div class="row q"><span>shu jumladan QQS ${v.tariff.vat}%</span><span>${S.fmt(vat)}</span></div><div class="row"><span>${S.METHODS[p.method]}</span><span>${S.fmt(Math.abs(p.amount))}</span></div><hr>
      <div class="row q"><span>Fiskal belgi</span><span>${S.esc(p.fiscal ? p.fiscal.sign : '—')}</span></div><div class="row q"><span>Terminal</span><span>EP000000000001</span></div>
      <div class="qr">${qr.createSvgTag({ cellSize: 3, margin: 0, scalable: true })}</div><div class="c q">ofd.soliq.uz orqali tekshiring</div></div>`;
  };

  P.act = function (v) {
    const o = org(), c = S.conds(v), b = S.bill(v);
    const basis = c.basis ? `${S.BASIS[c.basis.type]}: ${S.esc(c.basis.docNo)}, ${S.esc(c.basis.org)}` : v.permission ? `Ruxsatnoma ${S.esc(v.permission.no)}, ${v.permission.date ? v.permission.date.split('-').reverse().join('.') + ', ' : ''}${S.esc(v.permission.issuer)}` : '—';
    const pays = v.payments.filter(p => p.status === 'ok');
    return `<h1>Transport vositasini jarima maydonchasidan topshirish dalolatnomasi</h1>
      <div class="c">№ D-${String(v.id).padStart(4, '0')}, ${S.dt(v.releasedAt || new Date())}<br>${S.esc(o.legal)}, STIR ${S.esc(o.tin)}, ${S.esc(o.address)}</div>
      <table><tr><th style="width:34%">Davlat raqami</th><td><b>${v.plate ? S.prettyPlate(v.plate) : 'raqamsiz'}</b>${v.vin ? ', VIN ' + S.esc(v.vin) : ''}</td></tr>
      <tr><th>Marka, rang, kategoriya</th><td>${S.esc(v.brand)}${v.color ? ', ' + S.esc(v.color) : ''}, ${S.CATEGORIES[v.category]}</td></tr>
      <tr><th>Ushlab turish asosi</th><td>${v.protocol ? `Bayonnoma ${S.esc(v.protocol.no)}${v.protocol.article ? ', ' + S.esc(v.protocol.article) : ''}${v.protocol.reason ? ', ' + S.esc(v.protocol.reason) : ''}. ${S.esc(v.protocol.officer || '')}` : 'kiritilmagan'}</td></tr>
      <tr><th>Joylashtirilgan</th><td>${S.dt(v.enteredAt)}${v.sector ? ', sektor ' + S.esc(v.sector) : ''}${v.evac.needed ? ', evakuator ' + (v.evac.truck ? S.prettyPlate(v.evac.truck) : '') + (v.evac.km ? ', ' + v.evac.km + ' km' : '') : ", o'zi keltirildi"}</td></tr>
      <tr><th>Chiqarilgan</th><td>${v.releasedAt ? S.dt(v.releasedAt) : '—'}, saqlash ${b.hours} to'liq soat</td></tr>
      <tr><th>Qabul qilishdagi holat</th><td>${S.esc(v.damage) || "shikast qayd etilmagan"}. Kalit: ${v.keys === null ? '—' : v.keys ? 'bor' : "yo'q"}. Buyumlar: ${v.items.length ? S.esc(v.items.join(', ')) : "yo'q"}. Fotolar: ${v.photos.length} ta</td></tr>
      <tr><th>Chiqarish asosi</th><td>${basis}</td></tr>
      <tr><th>Topshirildi</th><td>${v.receiver ? `${S.esc(v.receiver.name)}, ${S.DOC_TYPES[v.receiver.docType] || ''} ${S.esc(v.receiver.doc)}${v.receiver.phone ? ', ' + S.esc(v.receiver.phone) : ''}` : '—'}</td></tr></table>
      <table><tr><th>To'lov</th><th>Xizmat</th><th>Summa, so'm</th><th>Usul</th><th>Fiskal belgi / hujjat</th></tr>
      ${pays.map(p => `<tr><td>${S.dt(p.at)}</td><td>${(p.items || []).map(i => S.esc(i[0])).join(', ') || (p.amount < 0 ? 'Qaytarish' : '')}</td><td>${S.fmt(p.amount)}</td><td>${S.METHODS[p.method]}</td><td>${p.fiscal ? S.esc(p.fiscal.sign) : S.esc(p.invoice || '')}</td></tr>`).join('') || '<tr><td colspan="5">to\u2018lov yo\u2018q</td></tr>'}
      <tr><td colspan="2"><b>Jami: evakuatsiya ${S.fmt(b.evac)} + saqlash ${S.fmt(b.storage)}${b.exempt ? ' − imtiyoz ' + S.fmt(b.exempt) : ''}</b></td><td><b>${S.fmt(b.charged)}</b></td><td colspan="2">to'langan ${S.fmt(b.paid)}</td></tr></table>
      <p>Transport vositasi qabul qilishdagi holatda topshirildi. Ma'muriy jarima ushbu dalolatnomaga kirmaydi. VMQ 149-son, 1-ilova 11-band.</p>
      <div class="sig"><div>Maydoncha: ${S.esc(JM.settings.operator || 'Operator')}</div><div>Oluvchi: ${v.receiver ? S.esc(v.receiver.name) : ''}</div></div>`;
  };

  P.invoice = function (v, p) {
    const o = org(), b = S.bill(v);
    return `<h1>Hisob-faktura ${S.esc(p.invoice || '')}</h1><div class="c">${S.dt(p.at)}</div>
      <table><tr><th style="width:30%">Yetkazib beruvchi</th><td>${S.esc(o.legal)}, STIR ${S.esc(o.tin)}, ${S.esc(o.address)}</td></tr><tr><th>Xaridor</th><td>${v.protocol ? S.esc(v.protocol.owner) : ''}</td></tr><tr><th>TV</th><td>${v.plate ? S.prettyPlate(v.plate) : 'VIN ' + S.esc(v.vin)}, ${S.esc(v.brand)}</td></tr></table>
      <table><tr><th>Xizmat</th><th>Miqdor</th><th>Narx</th><th>Summa</th></tr>${b.evac ? `<tr><td>Evakuatsiya</td><td>1</td><td>${S.fmt(b.evac)}</td><td>${S.fmt(b.evac)}</td></tr>` : ''}<tr><td>Saqlash</td><td>${b.hours} soat</td><td>${S.fmt(v.tariff.hour)}</td><td>${S.fmt(b.storage)}</td></tr><tr><td colspan="3"><b>Jami</b></td><td><b>${S.fmt(p.amount)}</b></td></tr></table>
      <p>To'lov bank o'tkazmasi orqali. Bank tasdig'i kelguncha xizmat to'langan hisoblanmaydi.</p><div class="sig"><div>Rahbar</div><div>Bosh hisobchi</div></div>`;
  };

  P.info = function () {
    const o = org(), t = JM.settings.tariff;
    return `<h1>${S.esc(o.name)}</h1><div class="c">${S.esc(o.legal)}, ${S.esc(o.address)}</div>
      <h1 style="font-size:14px;text-align:left;margin-top:14px">Xizmat tariflari (VMQ 149, 3-ilova 5-d bandi bo'yicha e'lon)</h1>
      <table><tr><th>Kategoriya</th><th>Evakuatsiya, bazaviy</th><th>Evakuatsiya, 1 km</th><th>Saqlash, 1 soat</th><th>Hokimlik chegarasi, 1 soat</th></tr>${Object.entries(t.categories).map(([k, c]) => `<tr><td>${S.CATEGORIES[k]}</td><td>${S.fmt(c.evacBase)}</td><td>${S.fmt(c.evacKm)}</td><td>${S.fmt(c.hour)}</td><td>${S.fmt(c.capHour)}</td></tr>`).join('')}</table>
      <p>Asos: ${S.esc(t.decree)}. Saqlash har bir to'liq soat uchun, joylashtirilgan paytdan. To'lov naqd yoki karta, chek majburiy.</p>
      <p><b>Mashinani olish uchun:</b> 1) ma'muriy ish bo'yicha qaror va ruxsatnoma — my.gov.uz yoki YHXX ilovasi orqali ariza; 2) shaxsni tasdiqlovchi hujjat, haydovchilik guvohnomasi; 3) maydoncha xizmati to'lovi. Qabul va berish — kechayu kunduz.</p>
      <p>Mashina oldiga kirish — faqat joylashtirgan organ ruxsati bilan, xodim ishtirokida (tashrif jurnali).</p>`;
  };

  P.tag = function (v) {
    const qr = qrcode(0, 'M'); qr.addData(`jm://car/${v.id}`); qr.make();
    return `<div style="width:90mm;border:1.5px solid #000;border-radius:4mm;padding:6mm;display:flex;gap:6mm;align-items:center;font-family:Public Sans,sans-serif"><div style="width:32mm;height:32mm">${qr.createSvgTag({ cellSize: 3, margin: 0, scalable: true })}</div><div><div style="font-size:9pt;color:#444">${S.esc(JM.settings.org.name)}</div><div style="font-size:22pt;font-weight:700;margin:2mm 0">${v.plate ? S.prettyPlate(v.plate) : 'VIN ' + S.esc((v.vin || '').slice(-8))}</div><div style="font-size:10pt">${S.esc(v.brand || '')}${v.sector ? ', sektor ' + S.esc(v.sector) : ''}</div><div style="font-size:9pt;color:#444;margin-top:1mm">Kirgan ${S.dt(v.enteredAt)} · № ${String(v.id).padStart(4, '0')}</div></div></div><p style="font-size:9pt;color:#444;margin-top:4mm">Oynaning ichki tomoniga yopishtiriladi. Hovli xodimi telefonda skanerlab mashinani ochadi.</p>`;
  };

  P.zreport = function (shift, pays) {
    const by = m => pays.filter(p => p.method === m).reduce((a, p) => a + p.amount, 0);
    return `<h1>Smena hisoboti № ${shift.no}</h1><div class="c">${S.esc(shift.operator)}, ${S.dt(shift.startedAt)} — ${shift.closedAt ? S.dt(shift.closedAt) : 'ochiq'}${shift.z ? ', Z-hisobot № ' + shift.z : ''}</div>
      <table><tr><th>Naqd</th><th>Karta</th><th>O'tkazma</th><th>Qaytarishlar</th><th>Jami</th></tr><tr><td>${S.fmt(by('cash'))}</td><td>${S.fmt(by('card'))}</td><td>${S.fmt(by('transfer'))}</td><td>${S.fmt(pays.filter(p => p.amount < 0).reduce((a, p) => a + p.amount, 0))}</td><td><b>${S.fmt(pays.reduce((a, p) => a + p.amount, 0))}</b></td></tr></table>
      <table><tr><th>Vaqt</th><th>TV</th><th>Summa</th><th>Usul</th><th>Fiskal</th></tr>${pays.map(p => `<tr><td>${S.dt(p.at)}</td><td>${p.v.plate ? S.prettyPlate(p.v.plate) : 'VIN ' + S.esc(p.v.vin)}</td><td>${S.fmt(p.amount)}</td><td>${S.METHODS[p.method]}</td><td>${p.fiscal ? S.esc(p.fiscal.sign) : S.esc(p.invoice || '')}</td></tr>`).join('')}</table>
      <div class="sig"><div>Kassir</div><div>Rahbar</div></div>`;
  };

  JM.print = P;
})();
