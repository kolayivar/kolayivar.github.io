(() => {
  'use strict';
  const WORDS = ['kalem','kitap','bulut','çiçek','gölge','orman','nehir','deniz','güneş','yolcu','sahil','fener','biber','kavun','kiraz','düğme','perde','kolye','köprü','badem','keman','radyo','çanta','dünya','bahçe','sokak','pasta','şeker','sabah','akşam','mutlu','güzel','huzur','sevgi','şarkı','sarma','fırın','bilet','sıcak','soğuk','kumru','duvar','diken','dalga','balık','köpek','armut','çilek','bavul','davet','resim','çizgi','rakam','tarih','zaman','hafta','aylar','masal','bilgi','cevap','fikir','kağıt','sabır','vatan','tablo','başak','saçak','denge','buluş','pazar','payda','makas','çorap','tavan','çimen','karga','martı','ekmek','tatlı','özgür','güven','sınav','sözcü','çınar','böcek','sinek','küfür','çevre','görev','banka','şehir','maçta','giriş','çıkış','dönem','süreç','örnek','kural','doğru','kalın','narin','kızıl','siyah','beyaz','bahar','çorba','kaşık','tabak','hayal','evren','duman','çocuk','bebek','düğün','yemek','yazar','çizim','ölçüm','koşul','sınır','durak','meyve','sebze','turşu','sucuk','limon','ceviz','börek','kekik','şubat','yağış','iklim','yazın','şafak','öğlen','erken','özlem','sevin','korku','barış','savaş','şükür','saygı','metal','ahşap','beton','durum','anlam','yanıt','seçim','karar','neden','sonuç','adres','roman','metin','cümle','satır','sayfa','dergi','haber','dosya'];
  const SIZE=5, MAX=6, DAY=86400000, EPOCH=Date.UTC(2025,0,1);
  const tr=s=>s.toLocaleLowerCase('tr-TR');
  const dateKey=(d=new Date())=>{
    const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);
    const v=type=>p.find(x=>x.type===type).value;
    return `${v('year')}-${v('month')}-${v('day')}`;
  };
  const shiftDate=(key,days)=>{const d=new Date(`${key}T12:00:00+03:00`);d.setUTCDate(d.getUTCDate()+days);return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;};
  const today=dateKey(), dayNumber=Math.floor((Date.parse(`${today}T12:00:00+03:00`)-EPOCH)/DAY), answer=WORDS[((dayNumber%WORDS.length)+WORDS.length)%WORDS.length];
  const board=document.querySelector('#game-board'), keyboard=document.querySelector('#keyboard'), message=document.querySelector('#game-message');
  let guesses=[], current='', done=false, states={};
  try { states=JSON.parse(localStorage.getItem('gk-states')||'{}'); } catch {}
  const saved=states[today];
  if(saved){guesses=saved.guesses||[];done=!!saved.done;}
  document.querySelector('#today-date').textContent=new Intl.DateTimeFormat('tr-TR',{timeZone:'Europe/Istanbul',day:'numeric',month:'long'}).format(new Date());
  document.querySelector('#year').textContent=new Date().getFullYear();

  function renderBoard(){
    board.replaceChildren();
    for(let r=0;r<MAX;r++)for(let c=0;c<SIZE;c++){
      const cell=document.createElement('div');cell.className='tile';cell.setAttribute('role','gridcell');
      if(guesses[r]){const ch=Array.from(guesses[r])[c]||'';cell.textContent=ch;cell.classList.add('filled',score(guesses[r])[c]);}
      else if(!done&&r===guesses.length&&Array.from(current)[c]){cell.textContent=Array.from(current)[c];cell.classList.add('filled');}
      board.append(cell);
    }
  }
  function score(word){
    const g=Array.from(word), a=Array.from(answer), out=Array(SIZE).fill('absent'), remaining={};
    for(let i=0;i<SIZE;i++)if(g[i]===a[i])out[i]='correct';else remaining[a[i]]=(remaining[a[i]]||0)+1;
    for(let i=0;i<SIZE;i++)if(out[i]!=='correct'&&remaining[g[i]]>0){out[i]='present';remaining[g[i]]--;}
    return out;
  }
  const rows=[['E','R','T','Y','U','I','O','P','Ğ','Ü'],['A','S','D','F','G','H','J','K','L','Ş','İ'],['ENTER','Z','C','V','B','N','M','Ö','Ç','⌫']];
  function renderKeyboard(){
    keyboard.replaceChildren();
    rows.forEach(row=>{const div=document.createElement('div');div.className='key-row';row.forEach(k=>{const b=document.createElement('button');b.type='button';b.className='key';b.textContent=k==='ENTER'?'GÖNDER':k==='⌫'?'⌫':k;if(k==='ENTER'||k==='⌫')b.classList.add('wide');b.setAttribute('aria-label',k==='⌫'?'Son harfi sil':k==='ENTER'?'Tahmini gönder':k);b.addEventListener('click',()=>k==='ENTER'?submit():k==='⌫'?removeLetter():addLetter(k));div.append(b);});keyboard.append(div);});
    const keyStatus={};guesses.forEach(g=>score(g).forEach((s,i)=>{const ch=Array.from(g)[i];if(keyStatus[ch]!=='correct'&&(s==='correct'||(s==='present'&&keyStatus[ch]!=='correct')))keyStatus[ch]=s;}));
    keyboard.querySelectorAll('.key').forEach(b=>{const k=b.textContent;if(keyStatus[k])b.classList.add(keyStatus[k]);});
  }
  function persist(){states[today]={guesses,done};try{localStorage.setItem('gk-states',JSON.stringify(states));}catch{}}
  function addLetter(ch){if(done||Array.from(current).length>=SIZE)return;current+=tr(ch);renderBoard();}
  function removeLetter(){if(done)return;current=Array.from(current).slice(0,-1).join('');renderBoard();}
  function submit(){
    if(done)return;
    if(Array.from(current).length!==SIZE){toast('Beş harfli bir kelime yaz.');return;}
    const guess=tr(current);guesses.push(guess);current='';
    if(guess===answer){done=true;message.textContent=guesses.length===1?'Harika! İlk tahminde buldun.':`${guesses.length}. tahminde buldun. Güzel oyun!`;}
    else if(guesses.length===MAX){done=true;message.textContent=`Bugünün kelimesi: ${answer.toLocaleUpperCase('tr-TR')}`;}
    else message.textContent=guesses.length===MAX-1?'Son tahminin!':'Güzel gidiyor, devam et.';
    persist();renderBoard();renderKeyboard();updateStats();
    if(done){if(window.kvTrack)window.kvTrack('word_puzzle_completed',{result:guesses.includes(answer)?'solved':'missed'});document.querySelector('#share-button').disabled=false;}
  }
  let toastTimer;function toast(t){message.textContent=t;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{if(!done)message.textContent='Bir kelime yazıp Enter\'a bas.';},1700);}
  document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey)return;if(e.key==='Enter')submit();else if(e.key==='Backspace')removeLetter();else if(Array.from(e.key).length===1&&/^[a-zçğıöşü]$/i.test(e.key))addLetter(e.key);});
  function updateStats(){
    const days=Object.keys(states).sort();const count=days.filter(d=>states[d]?.done).length;let streak=0;let cursor=states[today]?.done?today:shiftDate(today,-1);
    while(states[cursor]?.done){streak++;cursor=shiftDate(cursor,-1);}
    document.querySelector('#streak').textContent=streak;document.querySelector('#played').textContent=count;
  }
  function shareText(){const symbols={correct:'🟩',present:'🟨',absent:'⬜'};const grid=guesses.map(g=>score(g).map(s=>symbols[s]).join('')).join('\n');return `Günün Kelimesi ${today}\n${guesses.length}/${MAX}\n\n${grid}\n\ngunun-kelimesi`}
  document.querySelector('#share-button').addEventListener('click',async()=>{const text=shareText();try{if(navigator.share)await navigator.share({text});else{await navigator.clipboard.writeText(text);document.querySelector('#share-note').textContent='Sonuç panoya kopyalandı!';}}catch(e){if(e.name!=='AbortError')document.querySelector('#share-note').textContent='Paylaşım açılamadı.';}});
  document.querySelector('#help-button').addEventListener('click',()=>document.querySelector('#nasil-oynanir').scrollIntoView({behavior:'smooth'}));
  renderBoard();renderKeyboard();updateStats();
  if(saved?.done){document.querySelector('#share-button').disabled=false;message.textContent=guesses.includes(answer)?'Bugünkü kelimeyi buldun. Yarın görüşürüz!':`Bugünün kelimesi: ${answer.toLocaleUpperCase('tr-TR')}`;}
  else if(saved?.guesses?.length){message.textContent='Kaldığın yerden devam et.';}
})();
