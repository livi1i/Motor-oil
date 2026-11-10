import { bindVkInquiry } from './vk-inquiry.js';
export const normalizeOil=value=>String(value??'').toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/\s+/g,' ').trim();
export function filterOils(items,{query='',brand='',volume='',sae=''}={}){const words=normalizeOil(query).split(' ').filter(Boolean);return items.filter(item=>(!brand||item.brand===brand)&&(!volume||item.volume_liters!==null&&String(item.volume_liters)===String(volume))&&(!sae||item.sae===sae)&&words.every(word=>normalizeOil([item.brand,item.name,item.sae,item.volume_liters].filter(x=>x!==null&&x!==undefined).join(' ')).includes(word)));}
export function oilRequest(item,values={}){const lines=['Здравствуйте! Хочу уточнить масло для автомобиля.'];if(item)lines.push('Интересует: '+[item.brand,item.name,item.sae,item.volume_liters!==null?item.volume_liters+' л':null].filter(Boolean).join(' ')+'.');if(values.car?.trim())lines.push('Автомобиль: '+values.car.trim());if(values.year?.trim())lines.push('Год: '+values.year.trim());if(values.engine?.trim())lines.push('Двигатель: '+values.engine.trim());if(values.question?.trim())lines.push('Вопрос: '+values.question.trim());lines.push('Прошу уточнить подходящие характеристики, упаковку, актуальную цену и наличие.');return lines.join('\n');}
const money=value=>value===null||value===undefined?'Уточнить цену':new Intl.NumberFormat('ru-RU').format(value)+' ₽';
function el(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;}

function frameGridPhoto(image, frame) {
  if (!frame?.canvas || !frame?.bounds) return;
  const [width, height] = frame.canvas;
  const [left, top, right, bottom] = frame.bounds;
  const visibleWidth = right - left;
  const visibleHeight = bottom - top;
  if (!(width > 0 && height > 0 && visibleWidth > 0 && visibleHeight > 0)) return;

  image.dataset.gridFramed = '';
  image.style.setProperty('--oil-visible-aspect', visibleWidth / visibleHeight);
  image.style.setProperty('--oil-canvas-height-scale', height / visibleHeight);
  image.style.setProperty('--oil-shift-x', `${-50 * (left + right) / width}%`);
  image.style.setProperty('--oil-shift-y', `${-50 * (top + bottom) / height}%`);
}

export async function mountOilCatalogue({openShops=()=>{}}={}){
 const grid=document.querySelector('#oil-grid'),result=document.querySelector('#oil-results'),empty=document.querySelector('#oil-empty'),more=document.querySelector('#oil-more'),reset=document.querySelector('#oil-reset');
 const query=document.querySelector('#oil-search'),brand=document.querySelector('#oil-brand'),volume=document.querySelector('#oil-volume'),sae=document.querySelector('#oil-sae'),dialog=document.querySelector('#oil-dialog');let items=[],shown=12,selected=null,opener=null;
 const entranceObserver=typeof IntersectionObserver==='function'?new IntersectionObserver((entries,observer)=>{
  if(grid.dataset.oilEntrance!=='pending'||!entries.some(entry=>entry.isIntersecting))return;
  grid.dataset.oilEntrance='playing';
  observer.disconnect();
 }):null;
 const filters=()=>({query:query.value,brand:brand.value,volume:volume.value,sae:sae.value});
 function photo(item, className) {
   if (!item.image?.path) return el('span', 'oil-no-photo', 'Изображение уточняется');
   const image = el('img', className);
   image.src = item.image.path;
   image.alt = [item.brand, item.name, item.sae].filter(Boolean).join(' ');
   image.loading = 'lazy';
   image.decoding = 'async';
   image.dataset.backgroundMode = item.image.background_mode || 'original';
   if (className === 'oil-card-image') frameGridPhoto(image, item.image.grid_frame);
   return image;
 }
 function openItem(item,button){selected=item;opener=button;const target=document.querySelector('#oil-detail');target.replaceChildren();const media=el('div','oil-detail-media');media.append(photo(item,'oil-detail-image'));const text=el('div','oil-detail-copy');text.append(el('p','oil-detail-brand',item.brand));const title=el('h2','',item.name);title.id='oil-dialog-title';text.append(title);const specs=el('p','oil-detail-spec',[item.sae,item.volume_liters!==null?item.volume_liters+' л':null].filter(Boolean).join(' · '));text.append(specs,el('p','oil-detail-price',money(item.price_rub)));if(item.price_valid_from)text.append(el('p','oil-price-date','Цена указана с '+item.price_valid_from.split('-').reverse().join('.')+'.')); if(item.image?.required_caption)text.append(el('p','oil-photo-note',item.image.required_caption));const overview=el('div','oil-detail-overview');overview.append(media,text);target.append(overview);document.querySelector('#oil-question').value='';document.querySelector('#oil-request-result').hidden=true;dialog.showModal();}
 function render(enter=false){
  entranceObserver?.disconnect();
  delete grid.dataset.oilEntrance;
  const found=filterOils(items,filters());
  grid.replaceChildren();
  for(const [index,item] of found.slice(0,shown).entries()){
   const article=el('article','oil-card');
   article.dataset.oilId=item.id;
   if(enter)article.style.setProperty('--oil-enter-delay',index*36+'ms');
   const button=el('button','oil-card-open');button.type='button';button.setAttribute('aria-label',[item.brand,item.name,item.sae,item.volume_liters!==null?item.volume_liters+' л':null,money(item.price_rub)].filter(Boolean).join(', '));const media=el('div','oil-card-media');media.append(photo(item,'oil-card-image'));const body=el('div','oil-card-body');body.append(el('span','oil-card-brand',item.brand),el('h3','oil-card-name',item.name),el('span','oil-card-spec',[item.sae,item.volume_liters!==null?item.volume_liters+' л':null].filter(Boolean).join(' · ')));if(item.image?.required_caption)body.append(el('span','oil-photo-note',item.image.required_caption));const bottom=el('div','oil-card-bottom');bottom.append(el('strong','oil-card-price',money(item.price_rub)),el('span','oil-card-arrow','↗'));button.append(media,body,bottom);button.addEventListener('click',()=>openItem(item,button));article.append(button);grid.append(article);
  }
  if(enter&&found.length){
   grid.dataset.oilEntrance=entranceObserver?'pending':'playing';
   entranceObserver?.observe(grid);
  }
  const active=Object.values(filters()).some(Boolean);result.textContent='Найдено: '+found.length;reset.hidden=!active;empty.hidden=found.length>0;empty.textContent=items.length?'Ничего не найдено. Измените параметры поиска.':'Проверяем данные и изображения товаров для витрины.';more.hidden=shown>=found.length;more.textContent='Показать ещё ('+Math.min(12,Math.max(0,found.length-shown))+')';}
 function changed(){shown=12;render();}
 query.addEventListener('input',changed);for(const control of [brand,volume,sae])control.addEventListener('change',changed);reset.addEventListener('click',()=>{query.value=brand.value=volume.value=sae.value='';changed();});more.addEventListener('click',()=>{shown+=12;render();});dialog.addEventListener('click',event=>{if(event.target===dialog){const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();}});dialog.addEventListener('close',()=>opener?.focus({preventScroll:true}));
 const requestText=document.querySelector('#oil-request-text');
 const resetVkInquiry=bindVkInquiry({
  text:requestText,
  status:document.querySelector('#oil-request-status'),
  copy:document.querySelector('#oil-copy'),
  chat:document.querySelector('#oil-request-vk'),
 });
 document.querySelector('#oil-request').addEventListener('submit',event=>{event.preventDefault();requestText.value=oilRequest(selected,{car:document.querySelector('#oil-car').value,year:document.querySelector('#oil-year').value,engine:document.querySelector('#oil-engine').value,question:document.querySelector('#oil-question').value});document.querySelector('#oil-request-result').hidden=false;resetVkInquiry();});
 for(const id of ['#oil-shop-link','#oil-request-shop'])document.querySelector(id).addEventListener('click',()=>{openShops();if(dialog.open)dialog.close();});
 try{const response=await fetch('./public/data/oils-catalogue.json');if(!response.ok)throw Error('catalogue');const data=await response.json();items=data.items||[];if(items.length){for(const [control,key,format] of [[brand,'brand',x=>x],[volume,'volume_liters',x=>x+' л'],[sae,'sae',x=>x]]){const values=[...new Set(items.map(item=>item[key]).filter(value=>value!==null&&value!==undefined&&value!==''))].sort((a,b)=>key==='volume_liters'?a-b:String(a).localeCompare(String(b)));for(const value of values){const option=el('option','',format(value));option.value=value;control.append(option);}}render(true);}else{result.textContent='Каталог подготавливается.';}}catch{result.textContent='Каталог временно недоступен.';empty.textContent='Попробуйте открыть его позже.';}
}
