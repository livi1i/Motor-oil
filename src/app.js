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
  const label=state==='unknown'?'График уточняется':open?(open===branches.length?'Открыто':allKnown?'Открыто '+open+' из '+branches.length:'Открыт '+open+' адрес'):'Закрыто';
  const summary=sharedHours?label+' · '+sharedHours:label;
  const renderKey=JSON.stringify({summary,branches});
  if(renderKey===renderedHours)return;
  renderedHours=renderKey;
  hoursSummary.textContent=summary;
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
    video.src='/assets/videos/'+panels[active].file+'.mp4';
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
function chooseDirection(key,focus=false){if(!panels[key])return;const directionChanged=key!==active;active=key;syncServicesVisibility();updateHeaderHours();const data=panels[key];tabs.forEach(tab=>{const chosen=tab.dataset.direction===key;tab.classList.toggle('active',chosen);tab.setAttribute('aria-selected',chosen);if(chosen)tab.setAttribute('aria-current','true');else tab.removeAttribute('aria-current');tab.tabIndex=chosen?0:-1;if(chosen&&focus)tab.focus();});document.querySelector('#direction-panel').setAttribute('aria-labelledby','tab-'+key);document.querySelector('#hero-title').innerHTML=data.title;document.querySelector('#description').textContent=data.description;document.querySelector('#direction-action').innerHTML=(key==='sto'?'Услуги и цены':key==='oils'?'Каталог масел':data.action)+' <span aria-hidden="true">↗</span>';document.querySelector('#direction-action').href=key==='sto'?'#services':key==='oils'?'#oil-catalogue':'#locations';document.querySelector('#stage-fact').textContent=data.fact;if(directionChanged){changeVideo(data);replayStageIntro();}}
tabs.forEach((tab,index)=>{tab.addEventListener('click',()=>{if(active!==tab.dataset.direction)chooseDirection(tab.dataset.direction);returnToDirection();});tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(index+1)%tabs.length;if(event.key==='ArrowLeft')next=(index-1+tabs.length)%tabs.length;if(event.key==='Home')next=0;if(event.key==='End')next=tabs.length-1;if(next!==undefined){event.preventDefault();chooseDirection(tabs[next].dataset.direction,true);returnToDirection();}});});
const htmlEscape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function renderList(){const target=document.querySelector('#location-list');target.replaceChildren();locations.filter(loc=>filter==='all'||loc.type===filter).forEach(loc=>{const entry=document.createElement('article');entry.className='location-entry';entry.dataset.id=loc.id;const button=document.createElement('button');button.type='button';button.className='location-focus';button.innerHTML='<span class="location-type">'+htmlEscape(loc.type_label)+'</span><span class="location-address">'+htmlEscape(loc.address)+'</span>';button.setAttribute('aria-label','Показать на карте: '+loc.type_label+', '+loc.address);button.addEventListener('click',()=>focusLocation(loc));const link=document.createElement('a');link.className='location-link';link.href=loc.cardURL;link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label','Открыть в 2ГИС: '+loc.type_label+', '+loc.address);link.textContent='↗';entry.append(button,link);target.append(entry);});}
async function focusLocation(loc){document.querySelectorAll('.location-entry').forEach(el=>el.classList.toggle('selected',el.dataset.id===loc.id));await loadMap();if(map){map.setView([loc.lat,loc.lng],16,{animate:!reduced.matches});markers.get(loc.id)?.openPopup();}}
function setFilter(key){filter=key;document.querySelectorAll('[data-filter]').forEach(el=>{el.classList.toggle('selected',el.dataset.filter===filter);el.setAttribute('aria-pressed',el.dataset.filter===filter);});renderList();updateMarkers();}
document.querySelectorAll('[data-filter]').forEach(el=>el.addEventListener('click',()=>setFilter(el.dataset.filter)));document.querySelector('#direction-action').addEventListener('click',()=>setFilter(active));
function updateMarkers(){if(!map)return;group.clearLayers();markers.clear();const shown=locations.filter(loc=>filter==='all'||loc.type===filter);shown.forEach(loc=>{const icon=L.divIcon({className:'',html:'<div class="map-pin '+loc.type+'">'+({oils:'М',sto:'С',wash:'А'}[loc.type])+'</div>',iconSize:[32,32],iconAnchor:[16,32]});const marker=L.marker([loc.lat,loc.lng],{icon,alt:loc.type_label+', '+loc.address,keyboard:true,title:loc.type_label+', '+loc.address});marker.bindTooltip(htmlEscape(loc.type_label),{permanent:true,className:'location-tooltip',direction:loc.id==='70000001043352451'?'left':'right',offset:[loc.id==='70000001043352451'?-15:15,-17]});marker.bindPopup('<b>'+htmlEscape(loc.type_label)+'</b><br>'+htmlEscape(loc.address)+'<br><a href="'+htmlEscape(loc.cardURL)+'" target="_blank" rel="noopener">Открыть карточку в 2ГИС ↗</a>');marker.on('click',()=>{document.querySelectorAll('.location-entry').forEach(el=>el.classList.toggle('selected',el.dataset.id===loc.id));});group.addLayer(marker);markers.set(loc.id,marker);});if(shown.length===1)map.setView([shown[0].lat,shown[0].lng],16);else if(shown.length)map.fitBounds(group.getBounds(),{padding:[45,45],maxZoom:14,animate:false});}
function mountMap(){map=L.map('map',{scrollWheelZoom:false,zoomControl:true,attributionControl:true});L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'}).addTo(map).on('tileerror',()=>{document.querySelector('.map-error').hidden=false;}).on('tileload',()=>{document.querySelector('.map-error').hidden=true;});group=L.featureGroup().addTo(map);updateMarkers();new ResizeObserver(()=>map.invalidateSize()).observe(document.querySelector('#map'));}
let mapReady;
function loadMap(){
  if(mapReady)return mapReady;
  const addAsset=(tag,properties)=>new Promise((resolve,reject)=>{
    const element=Object.assign(document.createElement(tag),properties);
    element.addEventListener('load',resolve,{once:true});
    element.addEventListener('error',reject,{once:true});
    document.head.append(element);
  });
  mapReady=Promise.all([
    addAsset('link',{rel:'stylesheet',href:'/public/vendor/leaflet.css'}),
    addAsset('script',{src:'/public/vendor/leaflet.js'}),
  ]).then(mountMap).catch(()=>{document.querySelector('.map-error').hidden=false;});
  return mapReady;
}

async function loadLocations(){
  try{
    const response=await fetch('/data/research/locations.json');
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
const serviceSearch=document.querySelector('#service-search');
const serviceReset=document.querySelector('#service-reset');
const serviceExpand=document.querySelector('#service-expand');
const serviceCards=[...document.querySelectorAll('[data-service-group]')].map(card=>({
  card,
  name:card.dataset.serviceName,
  description:card.querySelector('.service-description').textContent,
  rows:[...card.querySelectorAll('[data-price-row]')],
  details:card.querySelector('.service-price-list'),
}));
const serviceNormalize=text=>text.toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/\s+/g,' ').trim();
const visibleDetails=()=>serviceCards.filter(({card,details})=>details&&!card.hidden).map(({details})=>details);

function updateExpandButton(){
  const details=visibleDetails();
  serviceExpand.hidden=details.length===0;
  serviceExpand.textContent=details.length&&details.every(item=>item.open)?'Свернуть все':'Раскрыть все';
}

function searchServices(){
  const query=serviceNormalize(serviceSearch.value);
  const words=query.split(' ').filter(Boolean);
  const matches=text=>words.every(word=>serviceNormalize(text).includes(word));
  let groups=0, rows=0;
  for(const item of serviceCards){
    const headingMatches=matches(item.name+' '+item.description);
    let matchingRows=0;
    for(const row of item.rows){
      const match=headingMatches||matches(row.textContent);
      row.hidden=!match;
      if(match)matchingRows++;
    }
    const match=headingMatches||matchingRows>0;
    item.card.hidden=!match;
    if(item.details)item.details.open=Boolean(query&&match);
    if(match){
      groups++;
      rows+=matchingRows;
    }
  }
  serviceReset.hidden=!query;
  document.querySelector('.service-empty').hidden=groups!==0;
  document.querySelector('#service-results').textContent=query?'Найдено разделов: '+groups+' · Работ: '+rows:'14 разделов · 77 работ в подробном прайсе';
  updateExpandButton();
}

serviceSearch.addEventListener('input',searchServices);
serviceReset.addEventListener('click',()=>{
  serviceSearch.value='';
  searchServices();
  serviceSearch.focus();
});
serviceExpand.addEventListener('click',()=>{
  const details=visibleDetails();
  const expand=!details.every(item=>item.open);
  details.forEach(item=>{item.open=expand;});
  updateExpandButton();
});

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
  details?.addEventListener('toggle',updateExpandButton);
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
