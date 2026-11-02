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
    salary(v) {
      const g = v.gross; if (!ok(g) || g <= 0) return null;
      const MIN = 33030, CAP = 297270, B = [[190000, .15], [400000, .20], [1500000, .27], [5300000, .35], [Infinity, .40]];
      const tax = m => { let t0 = 0, prev = 0; for (const [lim, r] of B) { if (m <= lim) return t0 + (m - prev) * r; t0 += (lim - prev) * r; prev = lim; } };
      const ret = v.type === 'retired', sgkR = ret ? .075 : .14, unR = ret ? 0 : .01;
      const minBase = MIN * (1 - .15);
      let cum = 0, cumMin = 0; const months = [];
      for (let i = 0; i < 12; i++) {
        const sb = Math.min(g, CAP), sgk = sb * sgkR, un = sb * unR, base = g - sgk - un;
        const gv = Math.max(0, (tax(cum + base) - tax(cum)) - (tax(cumMin + minBase) - tax(cumMin)));
        const st = Math.max(0, (g - MIN) * .00759);
        cum += base; cumMin += minBase;
        months.push({ sgk, un, gv, st, net: g - sgk - un - gv - st });
      }
      const m = months[(+v.month || 1) - 1], avg = months.reduce((a, x) => a + x.net, 0) / 12;
      const MN = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
      return { rows: [[`${MN[(+v.month || 1) - 1]} ayı net maaş`, money(m.net) + ' ₺'], ['Yıllık ortalama net', money(avg) + ' ₺'], [ret ? 'SGDP primi (%7,5)' : 'SGK işçi primi (%14)', money(m.sgk) + ' ₺'], ...(ret ? [] : [['İşsizlik sigortası (%1)', money(m.un) + ' ₺']]), ['Gelir vergisi', money(m.gv) + ' ₺'], ['Damga vergisi', money(m.st) + ' ₺'], ['Yıllık toplam net', money(avg * 12) + ' ₺']],
        table: [['Ay', 'Gelir vergisi', 'Net maaş'], ...months.map((x, i) => [MN[i], money(x.gv), money(x.net)])] };
    },
    notice(v) {
      const s = pd(v.start), e = pd(v.end); if (!s || !e || !ok(v.salary)) return null;
      if (e <= s) return 'Çıkış tarihi işe giriş tarihinden sonra olmalı.';
      const days = Math.round((e - s) / DAY) + 1, mo = days / 30.4375;
      const wk = mo < 6 ? 2 : mo < 18 ? 4 : mo < 36 ? 6 : 8, gross = v.salary / 30 * wk * 7;
      const gv = gross * (+v.gv || 15) / 100, st = gross * .00759;
      return [['Net ihbar tazminatı', money(gross - gv - st) + ' ₺'], ['İhbar süresi', `${wk} hafta (${wk * 7} gün)`], ['Brüt ihbar tazminatı', money(gross) + ' ₺'], [`Gelir vergisi (%${v.gv || 15})`, money(gv) + ' ₺'], ['Damga vergisi', money(st) + ' ₺'], ['Çalışma süresi', ymd(ymdDiff(s, new Date(e.getTime() + DAY)))]];
    },
    leave(v) {
      const s = pd(v.start), on = pd(v.on) || todayUTC(); if (!s) return null;
      if (on <= s) return 'Hesaplanacak tarih işe giriş tarihinden sonra olmalı.';
      const d = ymdDiff(s, on), y = d[0];
      if (y < 1) return `Henüz 1 yılı doldurmadınız (${ymd(d)}). Yıllık izne 1 yıl çalıştıktan sonra hak kazanılır.`;
      let days = y <= 5 ? 14 : y < 15 ? 20 : 26, note = '';
      const b = pd(v.birth);
      if (b) { const age = ymdDiff(b, on)[0]; if ((age < 18 || age > 50) && days < 20) { days = 20; note = `${age} yaşında olduğunuz için en az 20 gün`; } }
      const next = new Date(Date.UTC(s.getUTCFullYear() + y + 1, s.getUTCMonth(), s.getUTCDate()));
      const rows = [['Yıllık izin hakkınız', `${days} iş günü`], ['Kıdem', ymd(d)], ['Bir sonraki hak ediş', fd(next)]];
      if (note) rows.push(['Not', note]);
      return rows;
    },
    obp(v) {
      const d = v.dip; if (!ok(d)) return null; if (d < 50 || d > 100) return 'Diploma notu 50 ile 100 arasında olmalı.';
      const o = d * 5, k = v.prev ? .06 : .12;
      return [['OBP', n(o, 2)], ['YKS yerleştirme puanına katkı', '+' + n(o * k, 2)], ['Kullanılan katsayı', String(k).replace('.', ',')]];
    },
    raise(v) {
      const { old: o, val, inf, mode } = v; if (!ok(o, val) || o <= 0) return null;
      const nw = mode === 'new' ? val : o * (1 + val / 100), pr = (nw - o) / o * 100;
      const rows = [[mode === 'new' ? t('Zam oranı', 'Raise percentage') : t('Yeni maaş', 'New salary'), mode === 'new' ? pct(pr) : money(nw)], [t('Zam tutarı', 'Raise amount'), money(nw - o)], [t('Yıllık fark (12 ay)', 'Yearly difference (12 months)'), money((nw - o) * 12)]];
      if (ok(inf)) { const real = ((1 + pr / 100) / (1 + inf / 100) - 1) * 100; rows.push([t('Reel zam (enflasyondan arındırılmış)', 'Real raise (after inflation)'), (real >= 0 ? '+' : '') + pct(real)]); }
      return rows;
    },
    zodiac(v) {
      const b = pd(v.birth); if (!b) return null;
      const md = (b.getUTCMonth() + 1) * 100 + b.getUTCDate();
      const Z = [[120, 'Oğlak', 'Capricorn', '♑', 'Toprak', 'Earth', '22 Ara – 19 Oca', 'Dec 22 – Jan 19'], [219, 'Kova', 'Aquarius', '♒', 'Hava', 'Air', '20 Oca – 18 Şub', 'Jan 20 – Feb 18'], [321, 'Balık', 'Pisces', '♓', 'Su', 'Water', '19 Şub – 20 Mar', 'Feb 19 – Mar 20'], [420, 'Koç', 'Aries', '♈', 'Ateş', 'Fire', '21 Mar – 19 Nis', 'Mar 21 – Apr 19'], [521, 'Boğa', 'Taurus', '♉', 'Toprak', 'Earth', '20 Nis – 20 May', 'Apr 20 – May 20'], [621, 'İkizler', 'Gemini', '♊', 'Hava', 'Air', '21 May – 20 Haz', 'May 21 – Jun 20'], [723, 'Yengeç', 'Cancer', '♋', 'Su', 'Water', '21 Haz – 22 Tem', 'Jun 21 – Jul 22'], [823, 'Aslan', 'Leo', '♌', 'Ateş', 'Fire', '23 Tem – 22 Ağu', 'Jul 23 – Aug 22'], [923, 'Başak', 'Virgo', '♍', 'Toprak', 'Earth', '23 Ağu – 22 Eyl', 'Aug 23 – Sep 22'], [1023, 'Terazi', 'Libra', '♎', 'Hava', 'Air', '23 Eyl – 22 Eki', 'Sep 23 – Oct 22'], [1122, 'Akrep', 'Scorpio', '♏', 'Su', 'Water', '23 Eki – 21 Kas', 'Oct 23 – Nov 21'], [1222, 'Yay', 'Sagittarius', '♐', 'Ateş', 'Fire', '22 Kas – 21 Ara', 'Nov 22 – Dec 21'], [1232, 'Oğlak', 'Capricorn', '♑', 'Toprak', 'Earth', '22 Ara – 19 Oca', 'Dec 22 – Jan 19']];
      const z = Z.find(x => md < x[0]);
      return [[t('Burcunuz', 'Your sign'), `${z[3]} ${t(z[1], z[2])}`], [t('Element', 'Element'), t(z[4], z[5])], [t('Tarih aralığı', 'Date range'), t(z[6], z[7])]];
    },
    calorie(v) {
      const { age, h, w } = v; if (!ok(age, h, w) || age <= 0) return null;
      const bmr = 10 * w + 6.25 * h - 5 * age + (v.sex === 'f' ? -161 : 5), td = bmr * (+v.act || 1.2), k = x => n(Math.round(x), 0) + ' kcal';
      return [[t('Günlük kalori ihtiyacı (kiloyu korumak)', 'Daily calories to maintain weight'), k(td)], [t('Bazal metabolizma (BMR)', 'Basal metabolic rate (BMR)'), k(bmr)], [t('Kilo vermek için (yaklaşık −0,5 kg/hafta)', 'To lose weight (~0.5 kg/week)'), k(Math.max(bmr, td - 500))], [t('Kilo almak için (yaklaşık +0,25 kg/hafta)', 'To gain weight (~0.25 kg/week)'), k(td + 300)]];
    },
    idealw(v) {
      const h = v.h; if (!ok(h) || h < 120 || h > 230) return h ? t('Boyu 120-230 cm arasında girin.', 'Enter a height between 120 and 230 cm.') : null;
      const i = h / 2.54 - 60, f = v.sex === 'f', kg = x => n(x, 1) + ' kg';
      const dev = f ? 45.5 + 2.3 * i : 50 + 2.3 * i, rob = f ? 49 + 1.7 * i : 52 + 1.9 * i, mil = f ? 53.1 + 1.36 * i : 56.2 + 1.41 * i, ham = f ? 45.5 + 2.2 * i : 48 + 2.7 * i;
      const m2 = Math.pow(h / 100, 2);
      return [[t('Sağlıklı kilo aralığı (VKİ 18,5–24,9)', 'Healthy weight range (BMI 18.5–24.9)'), `${n(18.5 * m2, 1)} – ${n(24.9 * m2, 1)} kg`], [t('Formüllerin ortalaması', 'Average of formulas'), kg((dev + rob + mil + ham) / 4)], ['Devine', kg(dev)], ['Robinson', kg(rob)], ['Miller', kg(mil)], ['Hamwi', kg(ham)]];
    },
    desi(v) {
      const { l, w, h } = v; if (!ok(l, w, h)) return null;
      const q = ok(v.qty) && v.qty > 0 ? Math.round(v.qty) : 1, one = l * w * h / (+v.div || 3000), tot = one * q;
      const rows = [[t('Toplam desi', 'Total dimensional weight'), n(tot, 2) + t(' desi', ' kg')], [t('Paket başı desi', 'Per parcel'), n(one, 2) + t(' desi', ' kg')], [t('Hacim', 'Volume'), n(l * w * h / 1e6 * q, 4) + ' m³']];
      if (ok(v.kg)) rows.splice(1, 0, [t('Ücretlendirmeye esas', 'Chargeable weight'), `${n(Math.max(tot, v.kg), 2)} ${t(tot >= v.kg ? '(desi)' : '(kg)', tot >= v.kg ? '(dimensional)' : '(actual)')}`]);
      return rows;
    },
    area(v) {
      let tot = 0, cnt = 0;
      for (const r of v.rows) { const a = parseFloat(r.a), b = parseFloat(r.b); if (a > 0 && b > 0) { tot += a * b; cnt++; } }
      if (!cnt) return null;
      const rows = [[t('Toplam alan', 'Total area'), n(tot, 2) + ' m²'], [t('Fit kare', 'Square feet'), n(tot * 10.7639, 1) + ' ft²'], [t('Alan sayısı', 'Rooms'), String(cnt)]];
      if (ok(v.price)) rows.splice(1, 0, [t('Tahmini maliyet', 'Estimated cost'), money(tot * v.price)], [t('%10 fire payıyla', 'With 10% waste'), money(tot * 1.1 * v.price)]);
      return rows;
    },
    fuel(v) {
      const { km, cons, price } = v; if (!ok(km, cons, price)) return null;
      const d = km * (v.round ? 2 : 1), lt = d * cons / 100, cost = lt * price;
      const rows = [[t('Toplam yakıt masrafı', 'Total fuel cost'), money(cost)], [t('Harcanacak yakıt', 'Fuel needed'), n(lt, 2) + ' L'], [t('Toplam mesafe', 'Total distance'), n(d, 0) + ' km'], [t('Km başı maliyet', 'Cost per km'), money(cost / d)]];
      if (ok(v.people) && v.people > 1) rows.splice(1, 0, [t('Kişi başı', 'Per person'), money(cost / Math.round(v.people))]);
      return rows;
    },
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
    if (r.table) h += '<div class="tblwrap"><table class="rtable"><thead><tr>' + r.table[0].map(c => `<th>${esc(c)}</th>`).join('') + '</tr></thead><tbody>' + r.table.slice(1).map(row => '<tr>' + row.map(c => `<td>${esc(c)}</td>`).join('') + '</tr>').join('') + '</tbody></table></div>';
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
