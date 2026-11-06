'use strict';
(() => {
 const data=window.STUDY_DATA;
 const $=id=>document.getElementById(id);
 if(!Array.isArray(data)||data.length!==66){$('page-title').textContent='Sorular yüklenemedi';$('page-description').textContent='Sayfayı yenileyip tekrar dene.';return;}
 const KEY='konuyu-anla-bmo-v1';
 const allItems=data.flatMap(s=>s.items.map((item,i)=>({...item,id:`${s.page}.${i+1}`})));
 const validIDs=new Set(allItems.map(q=>q.id));
 let state={answers:{},ratings:{},lastPage:13},storageOK=true;
 const sanitize=obj=>{
  const safe={answers:{},ratings:{},lastPage:13};
  if(!obj||typeof obj!=='object'||Array.isArray(obj))return safe;
  for(const id of validIDs){
   if(typeof obj.answers?.[id]==='string')safe.answers[id]=obj.answers[id].slice(0,20000);
   if(['learned','review'].includes(obj.ratings?.[id]))safe.ratings[id]=obj.ratings[id];
  }
  if(Number.isInteger(obj.lastPage)&&obj.lastPage>=13&&obj.lastPage<=78)safe.lastPage=obj.lastPage;
  return safe;
 };
 try{state=sanitize(JSON.parse(localStorage.getItem(KEY)||'null'));}catch{storageOK=false;}
 let current=Math.min(78,Math.max(13,Number(location.hash.match(/^#sayfa-(\d+)$/)?.[1])||state.lastPage));
 let filter='all',query='',toastTimer;
 function notify(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{$('toast').hidden=true;},3200);}
 function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));storageOK=true;}catch{if(storageOK)notify('Tarayıcıya kaydedilemedi. İlerlemeni yedekleyebilirsin.');storageOK=false;}}
 function groupFor(page){if(page<=24)return '02 / Sistem performansı';if(page<=37)return '03 / Performans hesapları';if(page<=57)return '04 / ISA ve mimariler';return '05 / İkili sayılar ve taşma';}
 const getPageState=s=>{const r=s.items.map((_,i)=>state.ratings[`${s.page}.${i+1}`]);return r.includes('review')?'review':r.every(v=>v==='learned')?'learned':'pending';};
 function renderList(){
  const list=$('page-list');list.replaceChildren();let lastGroup='',count=0;
  for(const s of data){
   if(filter==='review'&&getPageState(s)!=='review')continue;
   const haystack=`${s.page} ${s.title} ${s.items.map(q=>q.q).join(' ')}`.toLocaleLowerCase('tr');
   if(query&&!haystack.includes(query))continue;
   const group=groupFor(s.page);
   if(group!==lastGroup){const label=document.createElement('div');label.className='group-label';label.textContent=group;list.append(label);lastGroup=group;}
   const button=document.createElement('button');button.className='page-link'+(s.page===current?' active':'');button.dataset.page=s.page;button.setAttribute('aria-label',`PDF sayfa ${s.page}: ${s.title}`);if(s.page===current)button.setAttribute('aria-current','page');
   const number=document.createElement('span');number.className='page-number';number.textContent=s.page;
   const title=document.createElement('span');title.className='page-link-title';title.textContent=s.title;
   const status=document.createElement('span');const st=getPageState(s);status.className='page-state '+st;status.textContent=st==='learned'?'✓':st==='review'?'↻':'';status.setAttribute('aria-label',st==='learned'?'Tamamlandı':st==='review'?'Tekrar edilecek':'Henüz tamamlanmadı');
   button.append(number,title,status);button.addEventListener('click',()=>navigate(s.page));list.append(button);count++;
  }
  if(!count){const empty=document.createElement('p');empty.className='empty';empty.textContent=query?'Aramana uyan sayfa bulunamadı.':'Tekrar listende henüz soru yok. Zorlandığın soruları “Tekrar edeceğim” ile işaretle.';list.append(empty);}
 }
 function renderStats(){
  const learned=Object.values(state.ratings).filter(x=>x==='learned').length;
  const reviews=Object.values(state.ratings).filter(x=>x==='review').length;
  $('learned-count').textContent=learned;$('progress').value=learned;$('progress-percent').textContent='%'+Math.round(learned/133*100);$('review-count').textContent=reviews;
  const section=data.find(s=>s.page===current);const done=section.items.filter((_,i)=>state.ratings[`${current}.${i+1}`]==='learned').length;
  $('page-completion').textContent=`${done} / ${section.items.length} soru öğrenildi`;
 }
 function textContentForQuestion(parent,text){
  const roman=/(?=\b(?:I|II|III|IV|V|VI)\))/;
  if(text.startsWith('I)')){
   const chunks=text.split(roman).filter(Boolean);const ol=document.createElement('ol');ol.className='statements';ol.type='I';
   chunks.forEach(chunk=>{const li=document.createElement('li');li.textContent=chunk.replace(/^(?:I|II|III|IV|V|VI)\)\s*/,'');ol.append(li);});parent.append(ol);
  }else{parent.textContent=text;}
 }
 function renderPage(){
  const s=data.find(s=>s.page===current);state.lastPage=current;persist();
  $('page-tag').textContent=`PDF SAYFA ${current}`;$('page-position').textContent=`${current-12} / 66`;$('page-title').textContent=s.title;$('page-description').textContent=`${s.items.length} kapsamlı soru · Önce kendin dene, sonra açıklamayı aç.`;
  document.title=`Sayfa ${current} · ${s.title} | Konuyu Anla`;
  const container=$('questions');container.replaceChildren();
  s.items.forEach((item,i)=>{
   const id=`${current}.${i+1}`;const card=document.createElement('article');card.className='question-card';card.dataset.id=id;
   const meta=document.createElement('div');meta.className='question-meta';
   const badge=document.createElement('span');badge.className='question-id';badge.textContent=`SORU ${id}`;
   const source=document.createElement('span');source.textContent=`Kaynak PDF · Sayfa ${current}`;
   const status=document.createElement('span');status.className='status';meta.append(badge,source,status);
   const question=document.createElement('div');question.className='question-text';textContentForQuestion(question,item.q);
   const label=document.createElement('label');label.className='draft-label';label.htmlFor=`draft-${id}`;label.textContent='Kendi cevabın';
   const hint=document.createElement('span');hint.textContent='Otomatik kaydedilir';label.append(hint);
   const draft=document.createElement('textarea');draft.className='draft';draft.id=`draft-${id}`;draft.maxLength=20000;draft.rows=3;draft.placeholder='Cevabını ve nedenini kendi cümlelerinle yaz…';draft.value=state.answers[id]||'';
   draft.addEventListener('input',()=>{state.answers[id]=draft.value;persist();});
   const details=document.createElement('details');details.className='answer';
   const summary=document.createElement('summary');summary.textContent='Açıklamalı cevabı göster';
   const answer=document.createElement('div');answer.className='answer-body';answer.textContent=item.a;details.append(summary,answer);
   details.addEventListener('toggle',()=>{summary.textContent=details.open?'Açıklamalı cevabı gizle':'Açıklamalı cevabı göster';});
   const self=document.createElement('div');self.className='self-check';const prompt=document.createElement('span');prompt.textContent='Kendini değerlendir';const buttons=document.createElement('div');buttons.className='rating-buttons';
   function updateRating(){
    const r=state.ratings[id];status.className='status '+(r||'');status.textContent=r==='learned'?'✓ Öğrenildi':r==='review'?'↻ Tekrar edilecek':'';
    for(const b of buttons.children){const selected=b.dataset.rating===r;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));}
   }
   for(const [rating,title] of [['review','↻ Tekrar edeceğim'],['learned','✓ Anladım']]){
    const b=document.createElement('button');b.className='rating';b.dataset.rating=rating;b.textContent=title;b.addEventListener('click',()=>{if(state.ratings[id]===rating)delete state.ratings[id];else state.ratings[id]=rating;persist();updateRating();renderStats();renderList();});buttons.append(b);
   }
   self.append(prompt,buttons);card.append(meta,question,label,draft,details,self);container.append(card);updateRating();
  });
  for(const id of ['prev','prev-top'])$(id).disabled=current===13;for(const id of ['next','next-top'])$(id).disabled=current===78;
  renderStats();renderList();
 }
 function closeMenu(){$('sidebar').classList.remove('open');$('backdrop').classList.remove('visible');$('backdrop').hidden=true;$('menu-toggle').setAttribute('aria-expanded','false');}
 function navigate(n){if(n<13||n>78)return;current=n;history.replaceState(null,'',`#sayfa-${n}`);renderPage();closeMenu();window.scrollTo({top:0,behavior:'instant'});}
 for(const id of ['prev','prev-top'])$(id).addEventListener('click',()=>navigate(current-1));
 for(const id of ['next','next-top'])$(id).addEventListener('click',()=>navigate(current+1));
 $('search').addEventListener('input',e=>{query=e.target.value.trim().toLocaleLowerCase('tr');renderList();});
 for(const b of document.querySelectorAll('[data-filter]'))b.addEventListener('click',()=>{filter=b.dataset.filter;for(const x of document.querySelectorAll('[data-filter]')){x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));}renderList();});
 $('shuffle').addEventListener('click',()=>{let pool=data.filter(s=>s.page!==current&&getPageState(s)==='review');if(!pool.length)pool=data.filter(s=>s.page!==current&&getPageState(s)!=='learned');if(!pool.length)pool=data.filter(s=>s.page!==current);navigate(pool[Math.floor(Math.random()*pool.length)].page);});
 $('menu-toggle').addEventListener('click',()=>{const open=!$('sidebar').classList.contains('open');$('sidebar').classList.toggle('open',open);$('backdrop').hidden=!open;$('backdrop').classList.toggle('visible',open);$('menu-toggle').setAttribute('aria-expanded',String(open));});
 $('backdrop').addEventListener('click',closeMenu);
 window.addEventListener('hashchange',()=>{const page=Number(location.hash.match(/^#sayfa-(\d+)$/)?.[1]);if(page>=13&&page<=78&&page!==current)navigate(page);});
 window.addEventListener('keydown',e=>{const typing=['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName);if(e.key==='Escape')closeMenu();if(typing||e.ctrlKey||e.metaKey||e.altKey)return;if(e.key==='/'){e.preventDefault();if(innerWidth<=760)$('menu-toggle').click();$('search').focus();}if(e.key==='ArrowRight')navigate(current+1);if(e.key==='ArrowLeft')navigate(current-1);});
 $('export').addEventListener('click',()=>{const file=new Blob([JSON.stringify({version:1,...state},null,2)],{type:'application/json'});const a=document.createElement('a');const url=URL.createObjectURL(file);a.href=url;a.download='konuyu-anla-ilerleme.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('İlerleme yedeğin indirildi.');});
 $('import').addEventListener('change',async e=>{
  const file=e.target.files[0];if(!file)return;
  try{if(file.size>4000000)throw new Error();const obj=JSON.parse(await file.text());if(obj.version!==1||!obj.answers||!obj.ratings)throw new Error();const imported=sanitize(obj);state.answers={...state.answers,...imported.answers};state.ratings={...state.ratings,...imported.ratings};persist();renderPage();notify('Yedek mevcut ilerlemenle birleştirildi.');}catch{notify('Bu dosya geçerli bir Konuyu Anla yedeği değil.');}e.target.value='';
 });
 renderPage();
 if(!storageOK)notify('Kalıcı kayıt kullanılamıyor. İlerlemeni yedekleyebilirsin.');
})();
