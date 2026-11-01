(() => {
  const L = document.documentElement.lang === 'tr' ? 'tr' : 'en';
  const loc = L === 'tr' ? 'tr-TR' : 'en-US';
  const t = (tr, en) => (L === 'tr' ? tr : en);
  const n = (x, d = 2) => Number.isFinite(x) ? x.toLocaleString(loc, { maximumFractionDigits: d }) : '—';
  const money = x => Number.isFinite(x) ? x.toLocaleString(loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';
  const pct = x => (L === 'tr' ? '%' + n(x) : n(x) + '%');
  const ok = (...a) => a.every(Number.isFinite);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const DAY = 864e5;
  const pd = s => { if (!s) return null; const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
  const fd = d => d.toLocaleDateString(loc, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long', timeZone: 'UTC' });
  const todayUTC = () => { const d = new Date(); return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); };
  const pad = x => String(x).padStart(2, '0');

  function ymdDiff(a, b) {
    let y = b.getUTCFullYear() - a.getUTCFullYear(), m = b.getUTCMonth() - a.getUTCMonth(), d = b.getUTCDate() - a.getUTCDate();
    if (d < 0) { m--; d += new Date(Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), 0)).getUTCDate(); }
    if (m < 0) { y--; m += 12; }
    return [y, m, d];
  }
  const ymd = a => t(`${a[0]} yıl ${a[1]} ay ${a[2]} gün`, `${a[0]} years, ${a[1]} months, ${a[2]} days`);

  const UNITS = {
    length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, yd: 0.9144, ft: 0.3048, in: 0.0254 },
    weight: { kg: 1, g: 0.001, mg: 1e-6, t: 1000, lb: 0.45359237, oz: 0.028349523125 },
    temp: { '°C': 1, '°F': 1, K: 1 },
    area: { 'm²': 1, 'km²': 1e6, 'cm²': 1e-4, ha: 1e4, 'dönüm': 1000, 'ft²': 0.09290304, acre: 4046.8564224 },
    volume: { L: 1, mL: 0.001, 'm³': 1000, 'gal (US)': 3.785411784, 'fl oz': 0.0295735295625, cup: 0.2365882365 },
    speed: { 'km/h': 1, 'm/s': 3.6, mph: 1.609344, knot: 1.852 }
  };
  const toC = (x, u) => u === '°F' ? (x - 32) * 5 / 9 : u === 'K' ? x - 273.15 : x;
  const fromC = (x, u) => u === '°F' ? x * 9 / 5 + 32 : u === 'K' ? x + 273.15 : x;

  const TRG = { AA: 4, BA: 3.5, BB: 3, CB: 2.5, CC: 2, DC: 1.5, DD: 1, FD: 0.5, FF: 0 };
  const ENG = { A: 4, 'A-': 3.7, 'B+': 3.3, B: 3, 'B-': 2.7, 'C+': 2.3, C: 2, 'C-': 1.7, 'D+': 1.3, D: 1, F: 0 };
  const tools = {
    net(v) {
      const f = document.getElementById('tool'), p = +f.dataset.penalty, g = {}, det = [];
      let any = false, all = 0; const used = {};
      for (const r of v.rows) {
        const d = parseFloat(r.d) || 0, y = parseFloat(r.y) || 0;
        if (d < 0 || y < 0) return 'Negatif değer girilemez.';
        if (d + y > +r.max) return `${r.label}: doğru + yanlış toplamı soru sayısını (${r.max}) geçemez.`;
        const x = d - y / p; g[r.group] = (g[r.group] || 0) + x; all += x;
        if (d || y) { any = true; used[r.group] = 1; det.push([`${r.label} neti`, n(x, 2)]); }
      }
      if (!any) return null;
      const tot = Object.entries(g).filter(([k]) => used[k]).map(([k, x]) => [`${k} toplam net`, n(x, 2)]);
      if (f.dataset.total) tot.unshift(['Toplam net', n(all, 2)]);
      return [...tot, ...det];
    },
    gpa(v) {
      const sc = L === 'tr' ? TRG : ENG; let cr = 0, pts = 0;
      for (const r of v.rows) { const c = parseFloat(r.credit); if (!(c > 0) || !(r.grade in sc)) continue; cr += c; pts += c * sc[r.grade]; }
      if (!cr) return null;
      const rows = [[t('Dönem ortalaması (ANO)', 'Semester GPA'), n(pts / cr, 2)], [t('Toplam kredi', 'Total credits'), n(cr)]];
      if (ok(v.prevgpa, v.prevcr) && v.prevcr > 0) rows.unshift([t('Genel ortalama (GANO)', 'Cumulative GPA'), n((pts + v.prevgpa * v.prevcr) / (cr + v.prevcr), 2)]);
      return rows;
    },
    karne(v) {
      let h = 0, s = 0;
      for (const r of v.rows) { const hh = parseFloat(r.hours), p = parseFloat(r.score); if (!(hh > 0) || !ok(p)) continue; if (p < 0 || p > 100) return 'Puanlar 0 ile 100 arasında olmalı.'; h += hh; s += hh * p; }
      if (!h) return null; const a = s / h;
      return [['Karne ortalaması', n(a, 2)], ['Belge durumu', a >= 85 ? 'Takdir Belgesi 🏆' : a >= 70 ? 'Teşekkür Belgesi 🎉' : 'Belge yok'], ['Toplam haftalık ders saati', n(h)]];
    },
    midterm(v) {
      const { mid, w, fin, pass, fmin } = v; if (!ok(mid, w) || w <= 0 || w >= 100) return null;
      const W = w / 100, rows = [];
      if (ok(fin)) {
        const avg = mid * W + fin * (1 - W), ps = (!ok(pass) || avg >= pass) && (!ok(fmin) || fin >= fmin);
        rows.push([t('Ortalamanız', 'Your overall grade'), n(avg, 2)], [t('Durum', 'Status'), ps ? t('Geçtiniz ✓', 'Target reached ✓') : t('Kaldınız ✗', 'Below target ✗')]);
      }
      if (ok(pass)) {
        let need = (pass - mid * W) / (1 - W); if (ok(fmin)) need = Math.max(need, fmin);
        rows.push([t('Geçmek için gereken final notu', 'Score needed on the final'), need > 100 ? t("100'ün üzerinde – bu durumda geçmek mümkün değil", 'Over 100% – not reachable') : n(Math.max(0, need), 2)]);
      }
      return rows.length ? rows : null;
    },
    percent(v) {
      const { a, b, mode } = v; if (!ok(a, b)) return null;
      if (mode === 'of') return [[t(`${n(b)} sayısının ${pct(a)} değeri`, `${pct(a)} of ${n(b)}`), n(a * b / 100, 4)]];
      if (mode === 'is') return b === 0 ? null : [[t(`${n(a)}, ${n(b)} sayısının yüzde kaçı?`, `${n(a)} is what percent of ${n(b)}?`), pct(a / b * 100)]];
      if (mode === 'add') return [[t('Sonuç', 'Result'), n(b * (1 + a / 100), 4)], [t('Eklenen', 'Added'), n(b * a / 100, 4)]];
      if (mode === 'sub') return [[t('Sonuç', 'Result'), n(b * (1 - a / 100), 4)], [t('Çıkarılan', 'Subtracted'), n(b * a / 100, 4)]];
      return a === 0 ? null : [[t('Değişim oranı', 'Percent change'), (b >= a ? '+' : '') + pct((b - a) / a * 100)], [t('Fark', 'Difference'), n(b - a, 4)]];
    },
    vat(v) {
      const { amount: a, rate: r, mode } = v; if (!ok(a, r)) return null;
      let net, tax, gross;
      if (mode === 'add') { net = a; tax = a * r / 100; gross = a + tax; } else { gross = a; net = a / (1 + r / 100); tax = gross - net; }
      const rows = [[t('KDV hariç tutar', 'Net amount (excl. VAT)'), money(net)], [t('KDV tutarı', 'VAT amount'), money(tax)], [t('KDV dahil tutar', 'Gross amount (incl. VAT)'), money(gross)]];
      return mode === 'add' ? [rows[2], rows[1], rows[0]] : rows;
    },
    loan(v) {
      const { amount: P, rate, months: N } = v; if (!ok(P, rate, N) || N <= 0) return null;
      const r = L === 'tr' ? rate / 100 : rate / 1200;
      const pay = r === 0 ? P / N : P * r / (1 - Math.pow(1 + r, -N));
      return [[t('Aylık taksit', 'Monthly payment'), money(pay)], [t('Toplam geri ödeme', 'Total repayment'), money(pay * N)], [t('Toplam faiz', 'Total interest'), money(pay * N - P)]];
    },
    compound(v) {
      const { principal: P, rate, years, monthly: c0 } = v; const c = Number.isFinite(c0) ? c0 : 0;
      if (!ok(P, rate, years)) return null;
      const r = rate / 1200, N = Math.round(years * 12), g = Math.pow(1 + r, N);
      const fv = P * g + (r === 0 ? c * N : c * (g - 1) / r), inv = P + c * N;
      return [[t('Dönem sonu bakiye', 'Future value'), money(fv)], [t('Toplam yatırılan', 'Total contributed'), money(inv)], [t('Toplam getiri (faiz)', 'Total interest earned'), money(fv - inv)]];
    },
    bmi(v) {
      const { unit, height: h, weight: w } = v; if (!ok(h, w) || h <= 0) return null;
      const imp = unit === 'imperial';
      const bmi = imp ? 703 * w / (h * h) : w / Math.pow(h / 100, 2);
      const cat = bmi < 18.5 ? t('Zayıf', 'Underweight') : bmi < 25 ? t('Normal kilolu', 'Normal weight') : bmi < 30 ? t('Fazla kilolu', 'Overweight') : t('Obez', 'Obese');
      const lo = imp ? 18.5 * h * h / 703 : 18.5 * Math.pow(h / 100, 2), hi = imp ? 24.9 * h * h / 703 : 24.9 * Math.pow(h / 100, 2);
      const u = imp ? 'lb' : 'kg';
      return [[t('Vücut kitle indeksi', 'Your BMI'), n(bmi, 1)], [t('Kategori', 'Category'), cat], [t('Boyunuz için normal aralık', 'Healthy range for your height'), `${n(lo, 1)} – ${n(hi, 1)} ${u}`]];
    },
    age(v) {
      const b = pd(v.birth), on = pd(v.on) || todayUTC(); if (!b) return null;
      if (b > on) return t('Doğum tarihi, hesaplama tarihinden sonra olamaz.', 'Birth date must be before the target date.');
      let nb = new Date(Date.UTC(on.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate()));
      if (nb < on) nb = new Date(Date.UTC(on.getUTCFullYear() + 1, b.getUTCMonth(), b.getUTCDate()));
      const days = Math.round((on - b) / DAY), toNext = Math.round((nb - on) / DAY);
      return [[t('Yaşınız', 'Your age'), ymd(ymdDiff(b, on))], [t('Toplam gün', 'Total days'), n(days, 0)], [t('Toplam hafta', 'Total weeks'), n(Math.floor(days / 7), 0)], [t('Doğduğunuz gün', 'Day you were born'), fd(b)], [t('Sonraki doğum gününe', 'Next birthday in'), toNext === 0 ? t('Bugün! 🎉', 'Today! 🎉') : t(`${toNext} gün`, `${toNext} days`)]];
    },
    datediff(v) {
      let s = pd(v.start), e = pd(v.end); if (!s || !e) return null;
      if (s > e) [s, e] = [e, s];
      const days = Math.round((e - s) / DAY) + (v.incl ? 1 : 0);
      let work = 0; const lim = Math.min(days, 200000);
      for (let i = 0; i < lim; i++) { const d = new Date(s.getTime() + i * DAY).getUTCDay(); if (d !== 0 && d !== 6) work++; }
      return [[t('Gün farkı', 'Days between'), n(days, 0) + t(' gün', ' days')], [t('Hafta', 'Weeks'), t(`${Math.floor(days / 7)} hafta ${days % 7} gün`, `${Math.floor(days / 7)} weeks ${days % 7} days`)], [t('Yıl / ay / gün', 'Years / months / days'), ymd(ymdDiff(s, e))], [t('İş günü (Pzt–Cum)', 'Business days (Mon–Fri)'), n(work, 0)]];
    },
    pregnancy(v) {
      const lmp = pd(v.lmp); if (!lmp) return null;
      const due = new Date(lmp.getTime() + 280 * DAY), el = Math.round((todayUTC() - lmp) / DAY);
      const rows = [[t('Tahmini doğum tarihi', 'Estimated due date'), fd(due)], [t('Tahmini döllenme tarihi', 'Estimated conception date'), fd(new Date(lmp.getTime() + 14 * DAY))]];
      if (el >= 0 && el <= 300) {
        const w = Math.floor(el / 7), d = el % 7, tri = w < 13 ? 1 : w < 27 ? 2 : 3;
        rows.splice(1, 0, [t('Bugün itibarıyla', 'As of today'), t(`${w} hafta ${d} günlük gebelik`, `${w} weeks ${d} days pregnant`)], [t('Trimester', 'Trimester'), t(`${tri}. trimester`, `Trimester ${tri}`)], [t('Doğuma kalan', 'Days until due date'), t(`${Math.max(0, 280 - el)} gün`, `${Math.max(0, 280 - el)} days`)]);
      }
      return rows;
    },
    discount(v) {
      const { price: p, pct: d, extra } = v; if (!ok(p, d)) return null;
      let f = p * (1 - d / 100); if (Number.isFinite(extra) && extra > 0) f *= 1 - extra / 100;
      return [[t('İndirimli fiyat', 'Final price'), money(f)], [t('Kazancınız', 'You save'), money(p - f)], [t('Toplam indirim oranı', 'Total discount'), pct((p - f) / p * 100)]];
    },
    tip(v) {
      const { bill: b, pct: p, people: k0 } = v; const k = Number.isFinite(k0) && k0 > 0 ? Math.round(k0) : 1; if (!ok(b, p)) return null;
      const tip = b * p / 100;
      return [['Total per person', money((b + tip) / k)], ['Tip amount', money(tip)], ['Total bill', money(b + tip)], ['Tip per person', money(tip / k)]];
    },
    severance(v) {
      const s = pd(v.start), e = pd(v.end), { salary, cap } = v; if (!s || !e || !ok(salary)) return null;
      if (e <= s) return 'Çıkış tarihi işe giriş tarihinden sonra olmalı.';
      const days = Math.round((e - s) / DAY) + 1;
      if (days < 365) return 'Kıdem tazminatı için aynı işverende en az 1 yıl çalışmış olmak gerekir.';
      const base = Number.isFinite(cap) && cap > 0 ? Math.min(salary, cap) : salary;
      const gross = base * days / 365, stamp = gross * 0.00759;
      const rows = [['Net kıdem tazminatı', money(stamp ? gross - stamp : gross) + ' ₺'], ['Brüt kıdem tazminatı', money(gross) + ' ₺'], ['Damga vergisi (binde 7,59)', money(stamp) + ' ₺'], ['Çalışma süresi', ymd(ymdDiff(s, new Date(e.getTime() + DAY)))]];
      if (base < salary) rows.push(['Not', 'Maaşınız tavanı aştığı için hesaplama tavan üzerinden yapıldı.']);
      return rows;
    },
    rent(v) {
      const { rent: r, rate } = v; if (!ok(r, rate)) return null;
      const nr = r * (1 + rate / 100);
      return [['Yeni kira bedeli', money(nr) + ' ₺'], ['Artış tutarı', money(nr - r) + ' ₺'], ['Yeni yıllık kira toplamı', money(nr * 12) + ' ₺']];
    },
    words(v) {
      const s = v.text || ''; const w = s.trim() ? s.trim().split(/\s+/).length : 0;
      const sent = s.trim() ? ((s.match(/[^.!?…]+[.!?…]+/g) || []).length || 1) : 0;
      const para = s.split(/\n\s*\n/).filter(x => x.trim()).length;
      const mins = x => x < 1 ? t('1 dakikadan az', 'under 1 min') : t(`${Math.ceil(x)} dk`, `${Math.ceil(x)} min`);
      return [[t('Kelime', 'Words'), n(w, 0)], [t('Karakter (boşluklu)', 'Characters'), n(s.length, 0)], [t('Karakter (boşluksuz)', 'Characters (no spaces)'), n(s.replace(/\s/g, '').length, 0)], [t('Cümle', 'Sentences'), n(sent, 0)], [t('Paragraf', 'Paragraphs'), n(para, 0)], [t('Okuma süresi', 'Reading time'), w ? mins(w / 200) : '—'], [t('Konuşma süresi', 'Speaking time'), w ? mins(w / 130) : '—']];
    },
    case(v) {
      const s = v.text || '', lc = L === 'tr' ? 'tr-TR' : 'en-US', lo = s.toLocaleLowerCase(lc), up = c => c.toLocaleUpperCase(lc);
      let o;
      if (v.mode === 'upper') o = s.toLocaleUpperCase(lc);
      else if (v.mode === 'lower') o = lo;
      else if (v.mode === 'title') o = lo.replace(/(^|[\s\-("'])(\S)/gu, (m, a, c) => a + up(c));
      else if (v.mode === 'sentence') o = lo.replace(/(^\s*|[.!?…]\s+)(\S)/gu, (m, a, c) => a + up(c));
      else o = [...s].map((c, i) => i % 2 ? up(c) : c.toLocaleLowerCase(lc)).join('');
      return { rows: [], text: o };
    },
    password(v) {
      const len = Math.min(128, Math.max(4, Math.round(v.len) || 16));
      const sets = [v.lower && 'abcdefghijkmnopqrstuvwxyz', v.upper && 'ABCDEFGHJKLMNPQRSTUVWXYZ', v.digits && '23456789', v.symbols && '!@#$%^&*()-_=+[]{};:,.?'].filter(Boolean);
      if (!sets.length) return t('En az bir karakter türü seçin.', 'Select at least one character type.');
      const pool = sets.join(''), rnd = new Uint32Array(len); crypto.getRandomValues(rnd);
      let pw = [...rnd].map(x => pool[x % pool.length]);
      sets.forEach((set, i) => { const r = new Uint32Array(2); crypto.getRandomValues(r); pw[r[0] % len] = set[r[1] % set.length]; });
      const bits = Math.round(len * Math.log2(pool.length));
      const str = bits < 45 ? t('Zayıf', 'Weak') : bits < 70 ? t('Orta', 'Medium') : bits < 100 ? t('Güçlü', 'Strong') : t('Çok güçlü', 'Very strong');
      return { rows: [[t('Şifre gücü', 'Strength'), `${str} (${bits} bit)`]], text: pw.join('') };
    },
    unit(v) {
      const { cat, val: x, from: f, to } = v; if (!ok(x) || !UNITS[cat] || !(f in UNITS[cat]) || !(to in UNITS[cat])) return null;
      const r = cat === 'temp' ? fromC(toC(x, f), to) : x * UNITS[cat][f] / UNITS[cat][to];
      return [[`${n(x, 6)} ${f} =`, `${n(r, 6)} ${to}`]];
    }
  };

  // Home page search
  const q = document.getElementById('q');
  if (q) q.addEventListener('input', () => {
    const s = q.value.toLocaleLowerCase(loc).trim();
    document.querySelectorAll('.card').forEach(c => { c.hidden = s && !c.textContent.toLocaleLowerCase(loc).includes(s); });
    document.querySelectorAll('.cat').forEach(sec => { sec.hidden = ![...sec.querySelectorAll('.card')].some(c => !c.hidden); });
  });

  const form = document.getElementById('tool');
  if (!form) return;
  const id = form.dataset.tool, out = document.getElementById('result');
  if (id === 'file') return;
  const now = new Date(), todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  form.querySelectorAll('input[data-today]').forEach(el => { if (!el.value) el.value = todayStr; });

  if (id === 'unit') {
    const cat = form.elements.cat, f = form.elements.from, to = form.elements.to;
    const fill = () => {
      const keys = Object.keys(UNITS[cat.value]).filter(k => L === 'tr' || k !== 'dönüm');
      const opt = keys.map(k => `<option>${k}</option>`).join('');
      f.innerHTML = opt; to.innerHTML = opt; to.selectedIndex = Math.min(1, keys.length - 1);
    };
    cat.addEventListener('change', fill); fill();
  }

  function read() {
    const v = {};
    v.rows = [...form.querySelectorAll('.rrow')].map(r => { const o = Object.assign({}, r.dataset); r.querySelectorAll('[data-col]').forEach(el => { o[el.dataset.col] = el.value; }); return o; });
    for (const el of form.elements) {
      if (!el.name) continue;
      if (el.type === 'checkbox') v[el.name] = el.checked;
      else if (el.type === 'number') v[el.name] = el.value === '' ? NaN : parseFloat(el.value);
      else v[el.name] = el.value;
    }
    return v;
  }
  function run() {
    let r; try { r = tools[id](read()); } catch (e) { r = null; }
    if (r == null) { out.innerHTML = `<p class="hint">${t('Değerleri girin, sonuç anında burada görünecek.', 'Enter your values and the result will appear here instantly.')}</p>`; return; }
    if (typeof r === 'string') { out.innerHTML = `<p class="hint warn">${esc(r)}</p>`; return; }
    const rows = Array.isArray(r) ? r : r.rows || [];
    let h = rows.length ? '<dl class="rows">' + rows.map((x, i) => `<div class="${i ? '' : 'main'}"><dt>${esc(x[0])}</dt><dd>${esc(x[1])}</dd></div>`).join('') + '</dl>' : '';
    if (r.text !== undefined) h += `<textarea readonly class="outtext" aria-label="${t('Sonuç', 'Result')}">${esc(r.text)}</textarea><button type="button" class="btn copy">${t('Kopyala', 'Copy')}</button>`;
    out.innerHTML = h;
  }
  out.addEventListener('click', e => {
    if (!e.target.classList.contains('copy')) return;
    const ta = out.querySelector('.outtext');
    (navigator.clipboard ? navigator.clipboard.writeText(ta.value) : Promise.reject()).catch(() => { ta.select(); document.execCommand('copy'); });
    e.target.textContent = t('Kopyalandı ✓', 'Copied ✓');
    setTimeout(() => { e.target.textContent = t('Kopyala', 'Copy'); }, 1500);
  });
  form.addEventListener('click', e => {
    if (e.target.classList.contains('addrow')) {
      const rs = form.querySelectorAll('.rgrid.dyn .rrow'), c = rs[rs.length - 1].cloneNode(true);
      c.querySelectorAll('input,select').forEach(el => { el.value = ''; }); rs[rs.length - 1].after(c); run();
    } else if (e.target.classList.contains('rm')) {
      const rs = form.querySelectorAll('.rgrid.dyn .rrow');
      if (rs.length > 1) e.target.closest('.rrow').remove(); else e.target.closest('.rrow').querySelectorAll('input,select').forEach(el => { el.value = ''; });
      run();
    }
  });
  form.addEventListener('submit', e => { e.preventDefault(); run(); });
  if (id !== 'password') form.addEventListener('input', run);
  else form.addEventListener('change', run);
  run();
})();
