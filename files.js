(() => {
  const form = document.getElementById('tool');
  if (!form || form.dataset.tool !== 'file') return;
  const L = document.documentElement.lang === 'tr' ? 'tr' : 'en', t = (a, b) => (L === 'tr' ? a : b);
  const op = form.dataset.op, out = document.getElementById('result');
  const inp = form.querySelector('input[type=file]'), drop = form.querySelector('.drop'), list = form.querySelector('.flist');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = b => (b < 1048576 ? Math.max(1, Math.round(b / 1024)) + ' KB' : (b / 1048576).toFixed(1) + ' MB');
  const base = n => n.replace(/\.[^.]+$/, '');
  let files = [];

  function render() {
    list.innerHTML = files.map((f, i) => `<li><span>${op === 'img2pdf' ? '🖼️' : '📄'} ${esc(f.name)} <small>${fmt(f.size)}</small></span><span>` +
      (files.length > 1 ? `<button type="button" data-up="${i}" aria-label="up">↑</button><button type="button" data-down="${i}" aria-label="down">↓</button>` : '') +
      `<button type="button" data-del="${i}" aria-label="remove">×</button></span></li>`).join('');
  }
  function add(fl) { const a = [...fl]; files = inp.multiple ? files.concat(a) : a.slice(0, 1); render(); out.innerHTML = ''; }
  inp.addEventListener('change', () => { add(inp.files); inp.value = ''; });
  ['dragover', 'dragenter'].forEach(e => drop.addEventListener(e, ev => { ev.preventDefault(); drop.classList.add('on'); }));
  ['dragleave', 'drop'].forEach(e => drop.addEventListener(e, ev => { ev.preventDefault(); drop.classList.remove('on'); }));
  drop.addEventListener('drop', ev => add(ev.dataTransfer.files));
  list.addEventListener('click', e => {
    const d = e.target.dataset, sw = (a, b) => { [files[a], files[b]] = [files[b], files[a]]; };
    if (d.del !== undefined) files.splice(+d.del, 1);
    else if (d.up !== undefined && +d.up > 0) sw(+d.up - 1, +d.up);
    else if (d.down !== undefined && +d.down < files.length - 1) sw(+d.down, +d.down + 1);
    else return;
    render();
  });

  const status = (m, warn) => { out.innerHTML = `<p class="hint${warn ? ' warn' : ''}">${m}</p>`; };
  const need = n => { if (!window[n]) throw new Error(t('Gerekli bileşen yüklenemedi. İnternet bağlantınızı kontrol edip sayfayı yenileyin.', 'A required component failed to load. Check your connection and reload the page.')); };
  const pdfjs = () => { need('pdfjsLib'); pdfjsLib.GlobalWorkerOptions.workerSrc = '/lib/pdf.worker.js'; return pdfjsLib; };
  const loadPdfLib = async f => { need('PDFLib'); return PDFLib.PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true }); };

  function parseRange(s, max) {
    const r = [];
    for (const part of s.split(',')) {
      const p = part.trim(); if (!p) continue;
      const m = p.match(/^(\d+)\s*-\s*(\d*)$/);
      if (m) { const a = +m[1], b = m[2] ? +m[2] : max; for (let i = Math.max(1, a); i <= Math.min(b, max); i++) r.push(i - 1); }
      else if (/^\d+$/.test(p)) { if (+p >= 1 && +p <= max) r.push(+p - 1); }
      else throw new Error(t('Sayfa aralığı anlaşılamadı. Örnek: 1-3, 5, 8-', 'Could not read the page range. Example: 1-3, 5, 8-'));
    }
    return r;
  }

  // ---- minimal JPEG → PDF writer
  function jpegsToPdf(imgs, mode) {
    const enc = new TextEncoder(), parts = [], offs = []; let len = 0;
    const push = x => { const b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); len += b.length; };
    const obj = (n, body) => { offs[n] = len; push(`${n} 0 obj\n`); body(); push('\nendobj\n'); };
    push('%PDF-1.4\n');
    const N = imgs.length;
    obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'));
    obj(2, () => push(`<< /Type /Pages /Count ${N} /Kids [${imgs.map((_, i) => `${3 + 3 * i} 0 R`).join(' ')}] >>`));
    imgs.forEach((im, i) => {
      const p = 3 + 3 * i; let pw, ph, dw, dh, x = 0, y = 0;
      if (mode === 'a4') {
        const land = im.w > im.h; pw = land ? 842 : 595; ph = land ? 595 : 842;
        const s = Math.min((pw - 48) / im.w, (ph - 48) / im.h); dw = im.w * s; dh = im.h * s; x = (pw - dw) / 2; y = (ph - dh) / 2;
      } else { pw = dw = im.w * 0.75; ph = dh = im.h * 0.75; }
      const cs = `q ${dw.toFixed(2)} 0 0 ${dh.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm /Im0 Do Q`;
      obj(p, () => push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw.toFixed(2)} ${ph.toFixed(2)}] /Resources << /XObject << /Im0 ${p + 2} 0 R >> >> /Contents ${p + 1} 0 R >>`));
      obj(p + 1, () => push(`<< /Length ${cs.length} >>\nstream\n${cs}\nendstream`));
      obj(p + 2, () => { push(`<< /Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.bytes.length} >>\nstream\n`); push(im.bytes); push('\nendstream'); });
    });
    const xref = len, total = 3 * N + 3;
    push(`xref\n0 ${total}\n0000000000 65535 f \n` + offs.slice(1, total).map(o => String(o).padStart(10, '0') + ' 00000 n \n').join(''));
    push(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
    return new Blob(parts, { type: 'application/pdf' });
  }
  async function toJpeg(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error(t(`${file.name} okunamadı. JPG, PNG veya WEBP kullanın.`, `Could not read ${file.name}. Use JPG, PNG or WEBP.`))); i.src = url; });
      const s = Math.min(1, 4000 / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
      const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
      const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.92));
      return { bytes: new Uint8Array(await blob.arrayBuffer()), w: c.width, h: c.height };
    } finally { URL.revokeObjectURL(url); }
  }

  // ---- minimal DOCX writer / reader
  const xe = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  async function makeDocx(paras) {
    need('JSZip'); const z = new JSZip();
    z.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
    z.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
    const body = paras.map(p => p === '\f' ? '<w:p><w:r><w:br w:type="page"/></w:r></w:p>' : `<w:p><w:r><w:t xml:space="preserve">${xe(p)}</w:t></w:r></w:p>`).join('');
    z.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`);
    return z.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }
  async function docxToHtml(buf) {
    need('JSZip'); let z;
    try { z = await JSZip.loadAsync(buf); } catch (e) { throw new Error(t('Bu dosya .docx formatında değil. Eski .doc dosyalarını Word\'de .docx olarak kaydedip tekrar deneyin.', 'This is not a .docx file. Save old .doc files as .docx in Word and try again.')); }
    const xml = await z.file('word/document.xml')?.async('string'); if (!xml) throw new Error(t('Word belgesi okunamadı.', 'Could not read the Word document.'));
    const doc = new DOMParser().parseFromString(xml, 'application/xml'), body = [...doc.getElementsByTagName('*')].find(n => n.localName === 'body');
    const kids = (n, name) => [...n.childNodes].filter(c => c.localName === name), kid = (n, name) => kids(n, name)[0];
    const attr = (n, a) => n && (n.getAttribute('w:' + a) || n.getAttribute(a));
    const runs = p => [...p.getElementsByTagName('*')].filter(n => n.localName === 'r').map(r => {
      const pr = kid(r, 'rPr'); let s = '';
      for (const c of r.childNodes) { if (c.localName === 't') s += esc(c.textContent); else if (c.localName === 'tab') s += '&emsp;'; else if (c.localName === 'br') s += attr(c, 'type') === 'page' ? '<div class="pb"></div>' : '<br>'; }
      const on = n => { const e = pr && kid(pr, n); return e && attr(e, 'val') !== '0' && attr(e, 'val') !== 'false'; };
      if (on('b')) s = `<b>${s}</b>`; if (on('i')) s = `<i>${s}</i>`; if (pr && kid(pr, 'u') && attr(kid(pr, 'u'), 'val') !== 'none') s = `<u>${s}</u>`;
      return s;
    }).join('');
    const para = p => {
      const pr = kid(p, 'pPr'), st = attr(pr && kid(pr, 'pStyle'), 'val') || '', jc = attr(pr && kid(pr, 'jc'), 'val');
      const al = jc === 'center' ? ' style="text-align:center"' : jc === 'right' || jc === 'end' ? ' style="text-align:right"' : jc === 'both' ? ' style="text-align:justify"' : '';
      const h = st.match(/^(heading|balk|başlık|titre|berschrift)\s*(\d)/i), html = runs(p) || '&nbsp;';
      if (/^(title|konuBal|puesto)/i.test(st)) return `<h1${al}>${html}</h1>`;
      if (h) return `<h${Math.min(6, +h[2] + 1)}${al}>${html}</h${Math.min(6, +h[2] + 1)}>`;
      if (pr && kid(pr, 'numPr')) return `<p class="li"${al}>• ${html}</p>`;
      return `<p${al}>${html}</p>`;
    };
    const walk = n => [...n.childNodes].map(c => {
      if (c.localName === 'p') return para(c);
      if (c.localName === 'tbl') return '<table>' + kids(c, 'tr').map(tr => '<tr>' + kids(tr, 'tc').map(tc => `<td>${walk(tc)}</td>`).join('') + '</tr>').join('') + '</table>';
      if (c.localName === 'sdt') { const sc = kid(c, 'sdtContent'); return sc ? walk(sc) : ''; }
      return '';
    }).join('');
    const imgs = Object.keys(z.files).some(k => k.startsWith('word/media/'));
    return { html: walk(body), imgs };
  }

  const ops = {
    async merge() {
      if (files.length < 2) throw new Error(t('En az 2 PDF dosyası seçin.', 'Select at least 2 PDF files.'));
      need('PDFLib'); const doc = await PDFLib.PDFDocument.create();
      for (const f of files) { status(t(`${esc(f.name)} ekleniyor…`, `Adding ${esc(f.name)}…`)); const src = await loadPdfLib(f); (await doc.copyPages(src, src.getPageIndices())).forEach(p => doc.addPage(p)); }
      return [[new Blob([await doc.save()], { type: 'application/pdf' }), t('birlestirilmis.pdf', 'merged.pdf'), t(`${doc.getPageCount()} sayfa`, `${doc.getPageCount()} pages`)]];
    },
    async split(v) {
      const f = files[0], src = await loadPdfLib(f), n = src.getPageCount();
      if (v.mode === 'each') {
        need('JSZip'); const z = new JSZip();
        for (let i = 0; i < n; i++) { const d = await PDFLib.PDFDocument.create(); const [p] = await d.copyPages(src, [i]); d.addPage(p); z.file(`${base(f.name)}-${i + 1}.pdf`, await d.save()); }
        return [[await z.generateAsync({ type: 'blob' }), base(f.name) + t('-sayfalar.zip', '-pages.zip'), t(`${n} ayrı PDF`, `${n} separate PDFs`)]];
      }
      const idx = parseRange(v.range || '', n);
      if (!idx.length) throw new Error(t(`Geçerli sayfa numaraları girin (bu belgede 1–${n} arası).`, `Enter valid page numbers (1–${n} in this file).`));
      const d = await PDFLib.PDFDocument.create(); (await d.copyPages(src, idx)).forEach(p => d.addPage(p));
      return [[new Blob([await d.save()], { type: 'application/pdf' }), base(f.name) + t('-secilen-sayfalar.pdf', '-selected-pages.pdf'), t(`${idx.length} sayfa`, `${idx.length} pages`)]];
    },
    async rotate(v) {
      const f = files[0], d = await loadPdfLib(f), n = d.getPageCount();
      const idx = v.range && v.range.trim() ? parseRange(v.range, n) : d.getPageIndices();
      idx.forEach(i => { const p = d.getPage(i); p.setRotation(PDFLib.degrees((p.getRotation().angle + +v.angle) % 360)); });
      return [[new Blob([await d.save()], { type: 'application/pdf' }), base(f.name) + t('-dondurulmus.pdf', '-rotated.pdf'), t(`${idx.length} sayfa döndürüldü`, `${idx.length} pages rotated`)]];
    },
    async img2pdf(v) {
      const imgs = [];
      for (const [i, f] of files.entries()) { status(t(`Görsel ${i + 1}/${files.length} hazırlanıyor…`, `Preparing image ${i + 1}/${files.length}…`)); imgs.push(await toJpeg(f)); }
      return [[jpegsToPdf(imgs, v.size), files.length === 1 ? base(files[0].name) + '.pdf' : t('gorseller.pdf', 'images.pdf'), t(`${imgs.length} sayfa`, `${imgs.length} pages`)]];
    },
    async pdf2img(v) {
      const lib = pdfjs(), f = files[0], pdf = await lib.getDocument({ data: await f.arrayBuffer() }).promise, sc = +v.quality || 2, out = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        status(t(`Sayfa ${i}/${pdf.numPages} dönüştürülüyor…`, `Converting page ${i}/${pdf.numPages}…`));
        const pg = await pdf.getPage(i), vp = pg.getViewport({ scale: sc }), c = document.createElement('canvas');
        c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
        const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
        await pg.render({ canvasContext: ctx, viewport: vp }).promise;
        out.push(await new Promise(r => c.toBlob(r, 'image/jpeg', 0.92)));
      }
      if (out.length === 1) return [[out[0], base(f.name) + '.jpg', t('1 görsel', '1 image')]];
      need('JSZip'); const z = new JSZip(); out.forEach((b, i) => z.file(`${base(f.name)}-${i + 1}.jpg`, b));
      return [[await z.generateAsync({ type: 'blob' }), base(f.name) + '-jpg.zip', t(`${out.length} görsel (ZIP)`, `${out.length} images (ZIP)`)]];
    },
    async pdf2word() {
      const lib = pdfjs(), f = files[0], pdf = await lib.getDocument({ data: await f.arrayBuffer() }).promise, paras = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        status(t(`Sayfa ${i}/${pdf.numPages} okunuyor…`, `Reading page ${i}/${pdf.numPages}…`));
        const tc = await (await pdf.getPage(i)).getTextContent(); let line = '', lastY = null; const lines = [];
        for (const it of tc.items) {
          if (!('str' in it)) continue;
          const y = Math.round(it.transform[5]);
          if (lastY !== null && Math.abs(y - lastY) > 2 && line) { lines.push(line); line = ''; }
          line += it.str; lastY = y;
          if (it.hasEOL) { lines.push(line); line = ''; lastY = null; }
        }
        if (line) lines.push(line);
        paras.push(...lines.map(s => s.replace(/\s+$/, ''))); if (i < pdf.numPages) paras.push('\f');
      }
      if (!paras.some(p => p.trim() && p !== '\f')) throw new Error(t('Bu PDF\'te seçilebilir metin bulunamadı. Taranmış (fotoğraf) bir belge olabilir.', 'No selectable text found. This may be a scanned (image-only) document.'));
      return [[await makeDocx(paras), base(f.name) + '.docx', t(`${pdf.numPages} sayfa metin`, `${pdf.numPages} pages of text`)]];
    },
    async word2pdf() {
      const f = files[0], { html, imgs } = await docxToHtml(await f.arrayBuffer());
      const css = '@page{size:A4;margin:2cm}body{font-family:Calibri,Carlito,Arial,sans-serif;font-size:11pt;line-height:1.4;color:#000}h1{font-size:20pt}h2{font-size:16pt}h3{font-size:13pt}p{margin:0 0 6pt}table{border-collapse:collapse;width:100%;margin:6pt 0}td{border:1px solid #999;padding:4pt;vertical-align:top}.pb{page-break-after:always}';
      return { word: `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(base(f.name))}</title><style>${css}</style></head><body>${html}</body></html>`, imgs };
    }
  };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!files.length) return status(t('Önce bir dosya seçin.', 'Please choose a file first.'), true);
    const v = {}; for (const el of form.elements) if (el.name) v[el.name] = el.value;
    const btn = form.querySelector('button[type=submit]'); btn.disabled = true;
    status(t('İşleniyor… Dosyanız cihazınızdan çıkmıyor.', 'Processing… your file never leaves your device.'));
    try {
      const r = await ops[op](v);
      if (r.word) {
        out.innerHTML = `<div class="done"><p><b>${t('Belge hazır ✓', 'Document ready ✓')}</b> ${t('Aşağıdaki butona basın ve açılan pencerede <b>Hedef: PDF olarak kaydet</b> seçin.', 'Click the button below and choose <b>Save as PDF</b> as the destination.')}</p>` +
          (r.imgs ? `<p class="hint warn">${t('Not: Belgedeki resimler bu sürümde PDF\'e aktarılmaz.', 'Note: images in the document are not included in this version.')}</p>` : '') +
          `<button type="button" class="btn" id="printpdf">⬇ ${t('PDF olarak kaydet', 'Save as PDF')}</button><iframe class="preview" title="preview"></iframe></div>`;
        const fr = out.querySelector('iframe'); fr.srcdoc = r.word;
        out.querySelector('#printpdf').onclick = () => fr.contentWindow.print();
      } else {
        out.innerHTML = '<div class="done"><p><b>' + t('Hazır ✓', 'Done ✓') + '</b></p>' + r.map(([b, n, info]) => { const u = URL.createObjectURL(b); return `<a class="btn dl" href="${u}" download="${esc(n)}">⬇ ${esc(n)}</a><p class="help">${info ? esc(info) + ' · ' : ''}${fmt(b.size)}</p>`; }).join('') + '</div>';
      }
    } catch (err) {
      const m = String(err && err.message || err);
      status(/password|encrypt/i.test(m) ? t('Bu PDF şifreli. Şifresini kaldırıp tekrar deneyin.', 'This PDF is password-protected. Remove the password and try again.') : /Invalid PDF|No PDF header|parse/i.test(m) ? t('Dosya geçerli bir PDF değil veya bozuk.', 'The file is not a valid PDF or is damaged.') : esc(m), true);
    } finally { btn.disabled = false; }
  });
})();
