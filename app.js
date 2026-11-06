'use strict';
(() => {
 const data=window.STUDY_DATA,$=id=>document.getElementById(id),KEY='konuyu-anla-bmo-exam-v1';
 const all=data.flatMap(s=>s.items.map((q,i)=>({...q,id:`${s.page}.${i+1}`})));
 const total=all.length;
 function sanitize(obj){const out={answers:{},finished:!!obj?.finished,lastPage:13};for(const q of all)if(Number.isInteger(obj?.answers?.[q.id])&&obj.answers[q.id]>=0&&obj.answers[q.id]<4)out.answers[q.id]=obj.answers[q.id];if(obj?.lastPage>=13&&obj.lastPage<=78)out.lastPage=Math.trunc(obj.lastPage);return out;}
 let state=sanitize(null);try{state=sanitize(JSON.parse(localStorage.getItem(KEY)));}catch{}
 let current=Number(location.hash.match(/^#sayfa-(\d+)$/)?.[1])||state.lastPage;if(current<13||current>78)current=13;
 let filter='all',query='',timer;
 function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
 function notify(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(timer);timer=setTimeout(()=>$('toast').hidden=true,3000);}
 function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{notify('Kayıt yapılamadı; ilerlemeni yedekleyebilirsin.');}}
 const answered=q=>Object.hasOwn(state.answers,q.id);
 const wrong=q=>state.answers[q.id]!==q.correct;
 function stats(){
  const n=all.filter(answered).length,c=all.filter(q=>state.answers[q.id]===q.correct).length;
  $('learned-count').textContent=n;$('progress').value=n;$('progress-percent').textContent='%'+Math.round(n/total*100);$('review-count').textContent=state.finished?total-c:total-n;
  const section=data.find(s=>s.page===current);$('page-completion').textContent=`${section.items.filter((_,i)=>Object.hasOwn(state.answers,`${current}.${i+1}`)).length} / ${section.items.length} cevaplandı`;
  $('finish').textContent=state.finished?'Sonucumu göster':'Sınavı bitir';
  const result=$('exam-result');result.hidden=!state.finished;result.replaceChildren();
  if(state.finished){result.append(el('span','eyebrow','SINAV SONUCUN'),el('h2','',`Puanın: ${(100*c/total).toFixed(1)} / 100`),el('p','',`${c} doğru · ${n-c} yanlış · ${total-n} boş. Her soru eşit puanlıdır; yanlış cevap doğruları götürmez.`));const reset=el('button','restart','Yeni sınav başlat');reset.onclick=()=>{if(!confirm('Cevapların silinerek yeni sınav başlayacak. Devam edilsin mi?'))return;state={answers:{},finished:false,lastPage:13};save();navigate(13);};result.append(reset);}
 }
 function renderList(){const list=$('page-list');list.replaceChildren();for(const s of data){const qs=s.items.map((q,i)=>({...q,id:`${s.page}.${i+1}`}));if(filter==='review'&&!qs.some(q=>state.finished?wrong(q):!answered(q)))continue;if(query&&!`${s.page} ${s.title} ${s.items.map(q=>q.q).join(' ')}`.toLocaleLowerCase('tr').includes(query))continue;const b=el('button','page-link'+(s.page===current?' active':''));b.setAttribute('aria-label',`PDF sayfa ${s.page}: ${s.title}`);if(s.page===current)b.setAttribute('aria-current','page');b.append(el('span','page-number',s.page),el('span','page-link-title',s.title),el('span','page-state',`${qs.filter(answered).length}/${qs.length}`));b.onclick=()=>navigate(s.page);list.append(b);}if(!list.children.length)list.append(el('p','empty','Bu filtrede sayfa bulunamadı.'));}
 function render(){
  const s=data.find(s=>s.page===current);state.lastPage=current;save();$('page-tag').textContent=`PDF SAYFA ${current}`;$('page-position').textContent=`${current-12} / 66`;$('page-title').textContent=s.title;$('page-description').textContent=state.finished?'Cevaplarını ve açıklamalarını incele.':`${s.items.length} test sorusu · Her soruda tek doğru seçenek var.`;
  document.title=`Sayfa ${current} · Test | Konuyu Anla`;
  const container=$('questions');container.replaceChildren();
  s.items.forEach((q,i)=>{const id=`${current}.${i+1}`,selected=state.answers[id],card=el('article','question-card'),meta=el('div','question-meta');meta.append(el('span','question-id',`SORU ${id}`),el('span','',`Kaynak PDF · Sayfa ${current}`));
   if(state.finished||selected!==undefined)meta.append(el('span','status '+(selected===q.correct?'learned':'review'),selected===q.correct?'✓ Doğru':selected===undefined?'Boş':'✕ Yanlış'));
   card.append(meta,el('div','question-text',q.q));const field=el('fieldset','choices');field.append(el('legend','sr-only',`Soru ${id} seçenekleri`));
   q.options.forEach((option,j)=>{const label=el('label','choice'+(selected===j?' selected':'')+((state.finished||selected!==undefined)&&q.correct===j?' correct':'')+((state.finished||selected!==undefined)&&selected===j&&j!==q.correct?' incorrect':''));const radio=document.createElement('input');radio.type='radio';radio.id=`choice-${id}-${j}`;radio.name=`q-${id}`;radio.value=j;radio.checked=selected===j;radio.disabled=state.finished;radio.onchange=()=>{state.answers[id]=j;save();render();document.getElementById(`choice-${id}-${j}`)?.focus({preventScroll:true});};label.append(radio,el('span','choice-letter','ABCD'[j]),el('span','choice-text',option));field.append(label);});card.append(field);
   if(state.finished||selected!==undefined){const details=el('details','answer');details.open=true;details.append(el('summary','',`Doğru cevap: ${'ABCD'[q.correct]} · Açıklamayı göster`),el('div','answer-body',q.a));card.append(details);}if(!state.finished){const clear=el('button','text-button','Seçimi kaldır');clear.onclick=()=>{delete state.answers[id];save();render();};card.append(clear);}
   container.append(card);
  });
  for(const id of ['prev','prev-top'])$(id).disabled=current===13;for(const id of ['next','next-top'])$(id).disabled=current===78;stats();renderList();
 }
 function closeMenu(){$('sidebar').classList.remove('open');$('backdrop').classList.remove('visible');$('backdrop').hidden=true;$('menu-toggle').setAttribute('aria-expanded','false');}
 function navigate(n){if(n<13||n>78)return;current=n;history.replaceState(null,'',`#sayfa-${n}`);render();closeMenu();scrollTo({top:0,behavior:'instant'});}
 for(const id of ['prev','prev-top'])$(id).onclick=()=>navigate(current-1);for(const id of ['next','next-top'])$(id).onclick=()=>navigate(current+1);
 $('finish').onclick=()=>{if(!state.finished){state.finished=true;save();render();}closeMenu();$('exam-result').scrollIntoView({behavior:'smooth',block:'start'});};
 $('search').oninput=e=>{query=e.target.value.trim().toLocaleLowerCase('tr');renderList();};
 for(const b of document.querySelectorAll('[data-filter]'))b.onclick=()=>{filter=b.dataset.filter;for(const x of document.querySelectorAll('[data-filter]')){x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));}renderList();};
 $('shuffle').onclick=()=>{let pool=data.filter(s=>s.page!==current&&s.items.some((q,i)=>state.finished?wrong({...q,id:`${s.page}.${i+1}`}):!answered({id:`${s.page}.${i+1}`})));if(!pool.length)pool=data.filter(s=>s.page!==current);navigate(pool[Math.floor(Math.random()*pool.length)].page);};
 $('menu-toggle').onclick=()=>{const open=!$('sidebar').classList.contains('open');$('sidebar').classList.toggle('open',open);$('backdrop').hidden=!open;$('backdrop').classList.toggle('visible',open);$('menu-toggle').setAttribute('aria-expanded',String(open));};$('backdrop').onclick=closeMenu;
 window.addEventListener('hashchange',()=>{const n=Number(location.hash.match(/^#sayfa-(\d+)$/)?.[1]);if(n>=13&&n<=78)navigate(n);});
 window.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)||e.ctrlKey||e.metaKey||e.altKey)return;if(e.key==='/'){e.preventDefault();if(innerWidth<=760)$('menu-toggle').click();$('search').focus();}});
 $('export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({version:'exam-1',...state})],{type:'application/json'}));const a=el('a');a.href=url;a.download='bmo-test-cevaplarim.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 $('import').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>4000000)throw Error();const obj=JSON.parse(await file.text());if(obj.version!=='exam-1')throw Error();state=sanitize(obj);save();navigate(state.lastPage);notify('Sınav yedeğin yüklendi.');}catch{notify('Geçerli bir sınav yedeği seç.');}e.target.value='';};
 render();
})();
