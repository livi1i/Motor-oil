import { bindVkInquiry } from './vk-inquiry.js';
const tabs=[...document.querySelectorAll('[data-direction]')],video=document.querySelector('#direction-video'),toggle=document.querySelector('#video-toggle');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const panels={oils:{title:'Магазин масел<br>в Пскове',description:'Ищете масло для своего авто? Посмотрите каталог и напишите нам, чтобы уточнить наличие.',action:'Найти магазин',fact:'Два магазина в городе',file:'oils-nov09',alt:'Видео о моторном масле'},sto:{title:'СТО<br>в Пскове',description:'Ремонт автомобиля в Motor Oil. Выберите удобный адрес СТО и уточните работы, которые нужны вашей машине.',action:'Найти СТО',fact:'Два СТО в городе',file:'service-nov09',alt:'Видео об обслуживании автомобиля'},wash:{title:'Автомойка<br>в Пскове',description:'Автомойка Motor Oil находится на Инженерной улице. Посмотрите адрес на карте и постройте маршрут.',action:'Найти автомойку',fact:'Инженерная улица, 102',file:'wash-nov09',alt:'Автомобиль на автомойке'}};
let active='oils',locations=[],filter='all',map=null,markers=new Map(),group;
// Regular weekly hours from user confirmation and the verified Engineering Street service listing.
const dailyHours=Array(7).fill(['09:00','21:00']);
const shopHours=[...Array(5).fill(['09:00','20:00']),...Array(2).fill(['09:00','19:00'])];
const branchHours={
  '70000001043352451':dailyHours, // https://2gis.ru/pskov/firm/70000001043352451
  '12666903233200792':[...Array(6).fill(['09:00','19:00']),['09:00','16:00']],
  '12666903233200819':shopHours,
  '70000001053079552':shopHours,
  '70000001049590525':dailyHours,
};
const moscowClock=new Intl.DateTimeFormat('en-GB',{
  timeZone:'Europe/Moscow',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23',
});
const weekdays=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const hoursSummary=document.querySelector('#header-hours-summary');
const hoursAddresses=document.querySelector('#header-hours-addresses');
let renderedHours='';

function updateHeaderHours(){
  const now=Object.fromEntries(moscowClock.formatToParts().map(({type,value})=>[type,value]));
  const day=weekdays.indexOf(now.weekday);
  const time=now.hour+':'+now.minute;
  const branches=locations.filter(location=>location.type===active).map(location=>{
    const hours=branchHours[location.id]?.[day];
    const state=hours===undefined?'unknown':hours&&time>=hours[0]&&time<hours[1]?'open':'closed';
    return {address:location.address, hours:hours?.join('–')||'', state};
  });
  const open=branches.filter(branch=>branch.state==='open').length;
  const allKnown=branches.length>0&&branches.every(branch=>branch.state!=='unknown');
  const sharedHours=allKnown&&branches.every(branch=>branch.hours===branches[0].hours)?branches[0].hours:'';
  const state=open?'open':allKnown?'closed':'unknown';
  const partiallyOpen=allKnown&&open===1&&branches.length>1;
  const shownBranches=partiallyOpen?branches.filter(branch=>branch.state==='open'):branches;
  const schedules=[...new Set(shownBranches.map(branch=>branch.hours).filter(Boolean))];
  const label=state==='unknown'?'График уточняется':state==='open'?'Открыто':'Закрыто';
  const summary=[label,partiallyOpen?shownBranches[0].address.replace(' улица','').replace('Улица ',''):'',schedules.join(' / ')].filter(Boolean).join(' · ');
  const renderKey=JSON.stringify({summary,branches});
  if(renderKey===renderedHours)return;
  renderedHours=renderKey;
  hoursSummary.replaceChildren();
  const summaryText=document.createElement('span');summaryText.className='hours-summary-text';summaryText.textContent=summary;
  const chevron=document.createElement('span');chevron.className='hours-chevron';chevron.setAttribute('aria-hidden','true');chevron.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
  hoursSummary.append(summaryText,chevron);
  hoursSummary.setAttribute('aria-label',summary+'. Посмотреть график всех адресов');
  hoursSummary.dataset.state=state;
  const states={open:'Открыто',closed:'Закрыто',unknown:'График уточняется'};
  hoursAddresses.replaceChildren(...branches.map(branch=>{
    const item=document.createElement('li');
    const address=document.createElement('strong');
    address.textContent=branch.address;
    const status=document.createElement('span');
    status.dataset.state=branch.state;
    status.textContent=branch.hours?states[branch.state]+' · '+branch.hours:states[branch.state];
    item.append(address,status);
    return item;
  }));
}
setInterval(updateHeaderHours,30_000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateHeaderHours();});
const videoFallback=document.querySelector('.video-fallback');
const videoSymbol=document.querySelector('#video-toggle-symbol');

let videoInView=false;
let playbackIntent=null;

function forceMute(){
  video.muted=true;
  video.defaultMuted=true;
  video.volume=0;
}

function updatePlayback(){
  const paused=video.paused;
  toggle.setAttribute('aria-label',paused?'Смотреть видео без звука':'Пауза видео');
  videoSymbol.dataset.icon=paused?'play':'pause';

}

function syncVideo(){
  const visible=videoInView&&!document.hidden;
  const shouldPlay=visible&&(playbackIntent??!reduced.matches);
  video.autoplay=shouldPlay;
  if(visible&&!video.hasAttribute('src')){
    video.preload='metadata';
    video.src='./assets/videos/'+panels[active].file+'.mp4';
  }
  if(shouldPlay&&video.paused){
    forceMute();
    video.play().catch(updatePlayback);
  }else if(!shouldPlay&&!video.paused){
    video.pause();
  }
}

function changeVideo(data){
  playbackIntent=null;
  video.pause();
  video.autoplay=false;
  if(video.hasAttribute('src')){
    video.removeAttribute('src');
    video.load();
  }
  video.setAttribute('aria-label',data.alt);
  video.hidden=false;
  videoFallback.hidden=true;
  toggle.hidden=false;
  updatePlayback();
  syncVideo();
}

toggle.addEventListener('click',()=>{
  playbackIntent=video.paused;
  syncVideo();
});
video.addEventListener('play',updatePlayback);
video.addEventListener('pause',updatePlayback);
video.addEventListener('volumechange',()=>{if(!video.muted||video.volume!==0)forceMute();});
video.addEventListener('error',()=>{
  if(!video.hasAttribute('src'))return;
  video.hidden=true;
  videoFallback.hidden=false;
  toggle.hidden=true;
});
video.addEventListener('loadedmetadata',()=>{if(reduced.matches&&video.currentTime===0)video.currentTime=.01;});
document.addEventListener('visibilitychange',syncVideo);
reduced.addEventListener('change',syncVideo);
forceMute();
updatePlayback();

const heroWrap=document.querySelector('.hero-wrap');
function replayStageIntro(){
  if(reduced.matches)return;
  heroWrap.classList.remove('entering');
  // Commit removal before restarting the copy and video together, even within one frame.
  void heroWrap.offsetWidth;
  heroWrap.classList.add('entering');
}
function chooseDirection(key,focus=false){if(!panels[key])return;const directionChanged=key!==active;active=key;syncServicesVisibility();updateHeaderHours();const data=panels[key];tabs.forEach(tab=>{const chosen=tab.dataset.direction===key;tab.classList.toggle('active',chosen);tab.setAttribute('aria-selected',chosen);if(chosen)tab.setAttribute('aria-current','true');else tab.removeAttribute('aria-current');tab.tabIndex=chosen?0:-1;if(chosen&&focus)tab.focus();});document.querySelector('#direction-panel').setAttribute('aria-labelledby','tab-'+key);document.querySelector('#hero-title').innerHTML=data.title;document.querySelector('#description').textContent=data.description;document.querySelector('#direction-action').textContent=key==='sto'?'Услуги и цены':key==='oils'?'Каталог масел':data.action;document.querySelector('#direction-action').href=key==='sto'?'#services':key==='oils'?'#oil-catalogue':'#locations';document.querySelector('#stage-fact').textContent=data.fact;if(directionChanged){changeVideo(data);replayStageIntro();}}
tabs.forEach((tab,index)=>{tab.addEventListener('click',()=>{if(active!==tab.dataset.direction)chooseDirection(tab.dataset.direction);returnToDirection();});tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(index+1)%tabs.length;if(event.key==='ArrowLeft')next=(index-1+tabs.length)%tabs.length;if(event.key==='Home')next=0;if(event.key==='End')next=tabs.length-1;if(next!==undefined){event.preventDefault();chooseDirection(tabs[next].dataset.direction,true);returnToDirection();}});});
const htmlEscape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function renderList(){const target=document.querySelector('#location-list');target.replaceChildren();locations.filter(loc=>filter==='all'||loc.type===filter).forEach(loc=>{const entry=document.createElement('article');entry.className='location-entry';entry.dataset.id=loc.id;const button=document.createElement('button');button.type='button';button.className='location-focus';button.innerHTML='<span class="location-type">'+htmlEscape(loc.type_label)+'</span><span class="location-address">'+htmlEscape(loc.address)+'</span>';button.setAttribute('aria-label','Показать на карте: '+loc.type_label+', '+loc.address);button.addEventListener('click',()=>focusLocation(loc));const link=document.createElement('a');link.className='location-link';link.href=loc.cardURL;link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label','Открыть в 2ГИС: '+loc.type_label+', '+loc.address);link.textContent='↗';entry.append(button,link);target.append(entry);});}
let selectedLocation=null;
async function focusLocation(loc){
 selectedLocation=loc;
 document.querySelectorAll('.location-entry').forEach(entry=>{entry.classList.toggle('selected',entry.dataset.id===loc.id);});
 const selectedEntry=document.querySelector('.location-entry.selected');
 if(selectedEntry&&!reduced.matches){selectedEntry.getAnimations().forEach(animation=>animation.cancel());selectedEntry.animate([{transform:'translateY(0)'},{transform:'translateY(-7px)',offset:.45},{transform:'translateY(0)'}],{duration:450,easing:'cubic-bezier(.2,.7,.3,1)'});}
 const mapShell=document.querySelector('.map-shell');mapShell.classList.remove('map-changing');void mapShell.offsetWidth;mapShell.classList.add('map-changing');
 await loadMap();
 updateMarkers();
}
function setFilter(key){
 filter=key;selectedLocation=null;
 document.querySelectorAll('[data-filter]').forEach(button=>{button.classList.toggle('selected',button.dataset.filter===filter);button.setAttribute('aria-pressed',button.dataset.filter===filter);});
 renderList();updateMarkers();
}
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>setFilter(button.dataset.filter)));
document.querySelector('#direction-action').addEventListener('click',()=>setFilter(active));
function updateMarkers(){
 if(!map)return;
 const shown=locations.filter(loc=>filter==='all'||loc.type===filter);
 if(!shown.length)return;
 const center=selectedLocation||{lng:shown.reduce((sum,loc)=>sum+loc.lng,0)/shown.length,lat:shown.reduce((sum,loc)=>sum+loc.lat,0)/shown.length};
 const params=new URLSearchParams({ll:center.lng+','+center.lat,z:selectedLocation?'17':shown.length===1?'16':'12',l:'map',pt:shown.map(loc=>loc.lng+','+loc.lat+',pm2'+({oils:'rd',sto:'gr',wash:'bl'}[loc.type])+'m').join('~')});
 const next='https://yandex.ru/map-widget/v1/?'+params;
 if(map.src!==next)map.src=next;
 map.title=selectedLocation?selectedLocation.type_label+' — '+selectedLocation.address:'Адреса Motor Oil на Яндекс Картах';
 const mapLink=document.querySelector('#map-open-yandex');
 if(mapLink){mapLink.href='https://yandex.ru/maps/?'+params;mapLink.textContent=(selectedLocation?selectedLocation.address+' · ':'')+'Открыть Яндекс Карты ↗';}
}
function loadMap(){
 if(!map){
  map=document.createElement('iframe');map.className='yandex-map';map.loading='lazy';map.referrerPolicy='strict-origin-when-cross-origin';map.allowFullscreen=true;
  map.addEventListener('error',()=>{document.querySelector('.map-error').hidden=false;});
  document.querySelector('#map').replaceChildren(map);
  const mapLink=document.createElement('a');mapLink.id='map-open-yandex';mapLink.className='map-open-yandex';mapLink.target='_blank';mapLink.rel='noopener noreferrer';document.querySelector('.map-shell').append(mapLink);updateMarkers();
 }
 return Promise.resolve();
}

async function loadLocations(){
  try{
    const response=await fetch('./data/research/locations.json');
    if(!response.ok)throw Error('locations');
    const data=await response.json();
    locations=data.locations.map(location=>location.type==='wash'?{...location,type_label:'Автомойка'}:location);
    updateHeaderHours();
    renderList();
    if(typeof IntersectionObserver!=='function'){
      loadMap();
      return;
    }
    const observer=new IntersectionObserver(entries=>{
      if(!entries.some(entry=>entry.isIntersecting))return;
      observer.disconnect();
      loadMap();
    },{rootMargin:'250px'});
    observer.observe(document.querySelector('#map'));
  }catch{
    document.querySelector('#location-list').textContent='Адреса временно недоступны.';
    document.querySelector('.map-error').hidden=false;
  }
}
loadLocations();

// STO-only catalogue. All names and prices are generated directly from the accepted services.json.
function syncServicesVisibility(){document.querySelector('#oil-catalogue').hidden=active!=='oils';document.querySelector('.oils-nav').hidden=active!=='oils';const selected=active==='sto';document.querySelector('#services').hidden=!selected;document.querySelector('.sto-nav').hidden=!selected;}
const serviceImagePaths={"sto-fuel-01":"./assets/images/services-unique/sto-fuel-01.jpg","sto-fuel-02":"./assets/images/services-unique/sto-fuel-02.jpg","sto-fuel-03":"./assets/images/services-unique/sto-fuel-03.jpg","sto-fuel-04":"./assets/images/services-unique/sto-fuel-04.jpg","sto-fuel-05":"./assets/images/services-unique/sto-fuel-05.jpg","sto-fuel-06":"./assets/images/services-unique/sto-fuel-06.jpg","sto-engine-01":"./assets/images/services-unique/sto-engine-01.jpg","sto-engine-02":"./assets/images/services-unique/sto-engine-02.jpg","sto-engine-03":"./assets/images/services-unique/sto-engine-03.jpg","sto-engine-04":"./assets/images/services-unique/sto-engine-04.jpg","sto-engine-05":"./assets/images/services-unique/sto-engine-05.jpg","sto-engine-06":"./assets/images/services-unique/sto-engine-06.jpg","sto-engine-07":"./assets/images/services-unique/sto-engine-07.jpg","sto-engine-08":"./assets/images/services-unique/sto-engine-08.jpg","sto-engine-09":"./assets/images/services-unique/sto-engine-09.jpg","sto-engine-10":"./assets/images/services-unique/sto-engine-10.jpg","sto-engine-11":"./assets/images/services-unique/sto-engine-11.jpg","sto-engine-12":"./assets/images/services-unique/sto-engine-12.jpg","sto-engine-13":"./assets/images/services-unique/sto-engine-13.jpg","sto-engine-14":"./assets/images/services-unique/sto-engine-14.jpg","sto-engine-15":"./assets/images/services-unique/sto-engine-15.jpg","sto-engine-16":"./assets/images/services-unique/sto-engine-16.jpg","sto-steering-01":"./assets/images/services-unique/sto-steering-01.jpg","sto-steering-02":"./assets/images/services-unique/sto-steering-02.jpg","sto-steering-03":"./assets/images/services-unique/sto-steering-03.jpg","sto-steering-04":"./assets/images/services-realism/sto-steering-04.jpg","sto-steering-05":"./assets/images/services-unique/sto-steering-05.jpg","sto-cooling-01":"./assets/images/services-unique/sto-cooling-01.jpg","sto-cooling-02":"./assets/images/services-unique/sto-cooling-02-gloves-v2.jpg","sto-cooling-03":"./assets/images/services-unique/sto-cooling-03.jpg","sto-cooling-04":"./assets/images/services-unique/sto-cooling-04.jpg","sto-cooling-05":"./assets/images/services-unique/sto-cooling-05.jpg","sto-cooling-06":"./assets/images/services-realism/sto-cooling-06-no-faces.jpg","sto-suspension-01":"./assets/images/services-realism/sto-suspension-01-no-faces.jpg","sto-suspension-02":"./assets/images/services-realism/sto-suspension-02.jpg","sto-suspension-03":"./assets/images/services-unique/sto-suspension-03.jpg","sto-suspension-04":"./assets/images/services-unique/sto-suspension-04.jpg","sto-suspension-05":"./assets/images/services-unique/sto-suspension-05.jpg","sto-suspension-06":"./assets/images/services-unique/sto-suspension-06.jpg","sto-suspension-07":"./assets/images/services-unique/sto-suspension-07.jpg","sto-suspension-08":"./assets/images/services-realism/sto-suspension-08.jpg","sto-suspension-09":"./assets/images/services-unique/sto-suspension-09.jpg","sto-suspension-10":"./assets/images/services-unique/sto-suspension-10.jpg","sto-suspension-11":"./assets/images/services-unique/sto-suspension-11.jpg","sto-suspension-12":"./assets/images/services-unique/sto-suspension-12.jpg","sto-suspension-13":"./assets/images/services-unique/sto-suspension-13-gloves-v2.jpg","sto-suspension-14":"./assets/images/services-unique/sto-suspension-14.jpg","sto-suspension-15":"./assets/images/services-unique/sto-suspension-15.jpg","sto-suspension-16":"./assets/images/services-unique/sto-suspension-16.jpg","sto-suspension-17":"./assets/images/services-unique/sto-suspension-17.jpg","sto-suspension-18":"./assets/images/services-unique/sto-suspension-18.jpg","sto-suspension-19":"./assets/images/services-unique/sto-suspension-19.jpg","sto-suspension-20":"./assets/images/services-unique/sto-suspension-20.jpg","sto-suspension-21":"./assets/images/services-unique/sto-suspension-21.jpg","sto-suspension-22":"./assets/images/services-unique/sto-suspension-22.jpg","sto-suspension-23":"./assets/images/services-unique/sto-suspension-23.jpg","sto-suspension-24":"./assets/images/services-unique/sto-suspension-24.jpg","sto-diagnostics-01":"./assets/images/services-realism/sto-diagnostics-01.jpg","sto-diagnostics-02":"./assets/images/services-realism/sto-diagnostics-02-no-faces.jpg","sto-diagnostics-03":"./assets/images/services-unique/sto-diagnostics-03.jpg","sto-maintenance-01":"./assets/images/services-realism/sto-maintenance-01.jpg","sto-maintenance-02":"./assets/images/services-unique/sto-maintenance-02.jpg","sto-maintenance-03":"./assets/images/services-unique/sto-maintenance-03.jpg","sto-maintenance-04":"./assets/images/services-realism/sto-maintenance-04.jpg","sto-maintenance-05":"./assets/images/services-realism/sto-maintenance-05-no-faces.jpg","sto-maintenance-06":"./assets/images/services-unique/sto-maintenance-06.jpg","sto-maintenance-07":"./assets/images/services-unique/sto-maintenance-07.jpg","sto-maintenance-08":"./assets/images/services-unique/sto-maintenance-08.jpg","sto-maintenance-09":"./assets/images/services-realism/sto-maintenance-09.jpg","sto-maintenance-10":"./assets/images/services-unique/sto-maintenance-10.jpg","sto-maintenance-11":"./assets/images/services-realism/sto-maintenance-11-branded-hands-v2.jpg","sto-maintenance-12":"./assets/images/services-unique/sto-maintenance-12.jpg","sto-maintenance-13":"./assets/images/services-unique/sto-maintenance-13.jpg","sto-fluids-01":"./assets/images/services-realism/sto-fluids-01.jpg","sto-fluids-02":"./assets/images/services-realism/sto-fluids-02.jpg","sto-fluids-03":"./assets/images/services-realism/sto-fluids-03.jpg","sto-fluids-04":"./assets/images/services-realism/sto-fluids-04.jpg","group-tyres":"./assets/images/services-realism/group-tyres.jpg","group-lights":"./assets/images/services-unique/group-lights.jpg","group-heater":"./assets/images/services-realism/group-heater.jpg","group-fuel":"./assets/images/services-unique/group-fuel.jpg","group-engine":"./assets/images/services-unique/group-engine.jpg","group-ac":"./assets/images/services-realism/group-ac.jpg","group-transmission":"./assets/images/services-realism/group-transmission.jpg","group-steering":"./assets/images/services-unique/group-steering.jpg","group-cooling":"./assets/images/services-unique/group-cooling.jpg","group-alignment":"./assets/images/services-unique/group-alignment.jpg","group-suspension":"./assets/images/services-realism/group-suspension.jpg","group-diagnostics":"./assets/images/services-realism/group-diagnostics.jpg","group-maintenance":"./assets/images/services-unique/group-maintenance.jpg","group-fluids":"./assets/images/services-realism/group-fluids.jpg"};
function serviceIllustration(group,name,jobId=null){
 const figure=document.createElement('figure');figure.className='service-photo';
 const image=document.createElement('img');image.src=serviceImagePaths[jobId||'group-'+group];image.alt='Иллюстрация — '+name;image.width=900;image.height=600;image.loading='lazy';image.decoding='async';
 figure.append(image);return figure;
}
for(const group of document.querySelectorAll('[data-service-group]')){
 group.prepend(serviceIllustration(group.dataset.serviceGroup,group.dataset.serviceName));
 const details=group.querySelector('.service-price-list');
 if(!details)continue;
 const jobs=document.createElement('div');jobs.className='service-jobs';
 for(const row of details.querySelectorAll('[data-price-row]')){
  const tile=document.createElement('article');tile.className='service-job';tile.dataset.priceRow=row.dataset.priceRow;
  const heading=document.createElement('h4');heading.textContent=row.querySelector('th').childNodes[0].textContent.trim();
  const price=document.createElement('strong');price.textContent=row.querySelector('td').textContent;
  const button=document.createElement('button');button.type='button';button.className='service-job-action';button.textContent='Обсудить работу ↗';
  button.addEventListener('click',()=>{document.querySelector('#service-inquiry-name').textContent=heading.textContent;document.querySelector('#service-request-text').value='Здравствуйте! Интересует работа «'+heading.textContent+'». Подскажите стоимость и условия записи.';resetServiceInquiry();document.querySelector('#service-dialog').showModal();});
  tile.append(serviceIllustration(group.dataset.serviceGroup,heading.textContent,row.dataset.priceRow),heading);
  const condition=row.querySelector('.service-condition');if(condition)tile.append(condition.cloneNode(true));
  tile.append(price,button);jobs.append(tile);
 }
 details.querySelector('.service-detail').replaceChildren(jobs);
}
const serviceSearch=document.querySelector('#service-search');
const serviceReset=document.querySelector('#service-reset');
const serviceEmpty = document.querySelector('.service-empty');
const serviceExpand=document.querySelector('#service-expand');
serviceExpand.remove();
const serviceCards=[...document.querySelectorAll('[data-service-group]')].map(card=>({card,name:card.dataset.serviceName,description:card.querySelector('.service-description').textContent,rows:[...card.querySelectorAll('[data-price-row]')]}));
const categoryNav=document.createElement('div');categoryNav.className='service-categories';categoryNav.setAttribute('role','group');categoryNav.setAttribute('aria-label','Разделы услуг СТО');
const workGrid=document.createElement('div');workGrid.className='service-work-grid';
document.querySelector('.service-tools').after(categoryNav);
document.querySelector('.service-groups').after(workGrid);
let serviceCategory='all';
const categoryLabel=document.createElement('label');categoryLabel.className='service-category-label';categoryLabel.htmlFor='service-category';categoryLabel.textContent='Раздел услуг';
const categorySelect=document.createElement('select');categorySelect.id='service-category';categorySelect.className='service-category-select';categoryNav.append(categoryLabel,categorySelect);
categorySelect.addEventListener('change',()=>{serviceCategory=categorySelect.value;searchServices();});
for(const item of [{name:'Все направления',key:'all'},...serviceCards.map(item=>({name:item.name,key:item.card.dataset.serviceGroup}))]){
 const option=document.createElement('option');option.value=item.key;option.textContent=item.name;categorySelect.append(option);
}
for(const item of serviceCards){
 for(const row of item.rows){row.dataset.serviceCategory=item.card.dataset.serviceGroup;workGrid.append(row);}
 item.card.querySelector('.service-price-list')?.remove();
 if(item.rows.length){const button=document.createElement('button');button.type='button';button.className='service-category-open';button.textContent='Выбрать работу →';button.addEventListener('click',()=>{serviceCategory=item.card.dataset.serviceGroup;searchServices();categoryNav.scrollIntoView({behavior:reduced.matches?'auto':'smooth',block:'start'});});item.card.append(button);}
}
const serviceNormalize=text=>text.toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/\s+/g,' ').trim();
function searchServices(){
 const query=serviceNormalize(serviceSearch.value);const words=query.split(' ').filter(Boolean);const matches=text=>words.every(word=>serviceNormalize(text).includes(word));
 let groups=0,works=0;
 for(const item of serviceCards){
  const chosen=serviceCategory==='all'||serviceCategory===item.card.dataset.serviceGroup;
  item.card.hidden=!(chosen&&!query&&(serviceCategory==='all'||!item.rows.length));if(!item.card.hidden)groups++;
  for(const row of item.rows){row.hidden=!(chosen&&(Boolean(query)||serviceCategory!=='all')&&matches(item.name+' '+row.textContent));if(!row.hidden)works++;}
 }
 categorySelect.value=serviceCategory;
 workGrid.hidden=works===0;document.querySelector('.service-groups').hidden=groups===0;
 serviceEmpty.hidden=groups+works>0;
 document.querySelector('#service-results').textContent=works?'Найдено работ: '+works:groups?'Направлений: '+groups:'Ничего не найдено';
 serviceReset.hidden=!query;
}
serviceSearch.addEventListener('input',searchServices);
serviceReset.addEventListener('click',()=>{serviceSearch.value='';searchServices();serviceSearch.focus();});
searchServices();

const serviceDialog=document.querySelector('#service-dialog');
const serviceRequestText=document.querySelector('#service-request-text');
const serviceRequestName=document.querySelector('#service-inquiry-name');
const resetServiceInquiry=bindVkInquiry({
  text:serviceRequestText,
  status:document.querySelector('#service-request-status'),
  copy:document.querySelector('#service-copy'),
  chat:document.querySelector('#service-request-vk'),
});

for(const {card,name,details} of serviceCards){

  card.querySelector('[data-service-inquiry]').addEventListener('click',()=>{
    serviceRequestName.textContent=name;
    serviceRequestText.value='Здравствуйте! Интересует услуга «'+name+'». Подскажите, пожалуйста, стоимость и ближайшее время для записи.';
    resetServiceInquiry();
    serviceDialog.showModal();
  });
}

document.querySelector('#sto-locations-action').addEventListener('click',()=>setFilter('sto'));
if(location.hash==='#services'){chooseDirection('sto');requestAnimationFrame(()=>document.querySelector('#services').scrollIntoView());}

function returnToDirection(){document.querySelector('#directions').scrollIntoView({behavior:reduced.matches?'auto':'smooth',block:'start'});}

if(!reduced.matches&&typeof IntersectionObserver==='function'){
  const introObserver=new IntersectionObserver((entries,observer)=>{
    for(const entry of entries){
      if(!entry.isIntersecting)continue;
      entry.target.classList.replace('intro-pending','intro-playing');
      observer.unobserve(entry.target);
    }
  });
  for(const heading of document.querySelectorAll('#oil-catalogue .section-head,#services .section-head,#locations .section-head')){
    heading.classList.add('intro-pending');
    introObserver.observe(heading);
  }
}

const oilCatalogue=document.querySelector('#oil-catalogue');
let catalogueObserver;
let catalogueReady;
function loadOilCatalogue(){
  catalogueObserver?.disconnect();
  catalogueReady??=import('./catalogue.js')
    .then(({mountOilCatalogue})=>mountOilCatalogue({openShops:()=>setFilter('oils')}))
    .catch(()=>{document.querySelector('#oil-results').textContent='Каталог временно недоступен.';});
}
oilCatalogue.addEventListener('focusin',loadOilCatalogue,{once:true});
oilCatalogue.addEventListener('pointerdown',loadOilCatalogue,{once:true});
if(location.hash==='#oil-catalogue'){
  loadOilCatalogue();
  requestAnimationFrame(()=>oilCatalogue.scrollIntoView());
}else if(typeof IntersectionObserver==='function'){
  catalogueObserver=new IntersectionObserver(entries=>{
    if(entries.some(entry=>entry.isIntersecting))loadOilCatalogue();
  },{rootMargin:'0px 0px -96px 0px'});
  catalogueObserver.observe(oilCatalogue);
}else{
  loadOilCatalogue();
}

if(typeof IntersectionObserver==='function'){
  const videoObserver=new IntersectionObserver(([entry])=>{
    videoInView=entry.isIntersecting;
    syncVideo();
  },{threshold:.01});
  videoObserver.observe(video.parentElement);
}else{
  videoInView=true;
  syncVideo();
}

const scrollProgress = document.querySelector('.scroll-progress');
let scrollProgressFrame = 0;

function updateScrollProgress() {
  if (scrollProgressFrame) return;
  scrollProgressFrame = requestAnimationFrame(() => {
    scrollProgressFrame = 0;
    const page = document.documentElement;
    const scrollableHeight = page.scrollHeight - page.clientHeight;
    const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
    scrollProgress.style.setProperty('--scroll-progress', Math.min(1, Math.max(0, progress)));
  });
}

window.addEventListener('scroll', updateScrollProgress, { passive: true });
window.addEventListener('resize', updateScrollProgress);
if (typeof ResizeObserver === 'function') {
  new ResizeObserver(updateScrollProgress).observe(document.body);
}
updateScrollProgress();

// BlurFade-inspired, once-only reveals. Content remains visible without JavaScript.
if(!reduced.matches&&'IntersectionObserver' in window){
 const revealObserver=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;entry.target.classList.add('revealed');revealObserver.unobserve(entry.target);}},{threshold:.08});
 const watchReveal=node=>{if(node.matches?.('.service-card,.location-entry,.hero-foot,.oil-filters,.service-controls,.footer-main')){node.classList.add('reveal-ready');revealObserver.observe(node);}};
 document.querySelectorAll('.service-card,.location-entry,.hero-foot,.oil-filters,.service-controls,.footer-main').forEach(watchReveal);
 new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1)watchReveal(node);}).observe(document.querySelector('#location-list'),{childList:true});
 reduced.addEventListener('change',()=>{if(reduced.matches){document.querySelectorAll('.reveal-ready').forEach(node=>node.classList.add('revealed'));revealObserver.disconnect();}});
}




// Run decorative section lighting only while the section is visible.
const backdropObserver=new IntersectionObserver(entries=>{for(const entry of entries)entry.target.classList.toggle('backdrop-visible',entry.isIntersecting);},{rootMargin:'80px'});
document.querySelectorAll('.services,.oil-catalogue').forEach(section=>backdropObserver.observe(section));
