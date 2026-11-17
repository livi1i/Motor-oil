const root=document.documentElement;
root.dataset.theme='dark';
try{localStorage.removeItem('motor-oil-theme')}catch{}
const motion=matchMedia('(prefers-reduced-motion: reduce)');
if(!motion.matches){
 const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){entry.target.classList.add('heading-visible');observer.unobserve(entry.target);}}},{threshold:.25});
 document.querySelectorAll('h2').forEach(heading=>{heading.classList.add('heading-accent');observer.observe(heading);});
}
const header=document.querySelector('.header');
const headerObserver=new ResizeObserver(()=>{root.style.setProperty('--sticky-header-height',`${header.offsetHeight+16}px`);});headerObserver.observe(header);

// Exact source-art letter bounds; no slicing through a glyph.
for(const crop of document.querySelectorAll('.logo-crop')){
 const bounds=[[49,30,56,31],[120,30,56,31],[186,30,50,31],[248,30,56,31],[316,30,55,31],[352,40,47,41]];
 const ns='http://www.w3.org/2000/svg';const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','48 26 354 58');svg.setAttribute('aria-hidden','true');
 const uid='brand-'+Math.random().toString(36).slice(2);
 svg.innerHTML='<defs><filter id="'+uid+'-white" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 1.5 3 0.5 0 -3"/></filter><filter id="'+uid+'-red" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 5 -5 0 0 -.5"/></filter></defs>';
 bounds.forEach(([x,y,w,h],i)=>{const group=document.createElementNS(ns,'g');group.classList.add(i===5?'brand-oil':'brand-letter');group.style.setProperty('--glyph-delay',i*85+'ms');const part=document.createElementNS(ns,'svg');for(const [key,value] of Object.entries({x,y,width:w,height:h,viewBox:[x,y,w,h].join(' ')}))part.setAttribute(key,value);const image=document.createElementNS(ns,'image');image.setAttribute('href','./assets/images/brand-source.png');image.setAttribute('width','948');image.setAttribute('height','468');image.setAttribute('filter','url(#'+uid+(i===5?'-red':'-white')+')');part.append(image);group.append(part);svg.append(group);});
 crop.replaceChildren(svg);crop.classList.add('brand-animated');
}
// Transparent overlay scroll rail: no reserved browser gutter.
const rail=document.createElement('div');rail.className='page-scrollbar';rail.setAttribute('aria-hidden','true');const thumb=document.createElement('div');thumb.className='page-scroll-thumb';rail.append(thumb);document.body.append(rail);
let scrollFrame=0;function paintScroll(){scrollFrame=0;const max=document.documentElement.scrollHeight-innerHeight;const height=Math.min(110,Math.max(34,innerHeight*innerHeight/document.documentElement.scrollHeight));rail.hidden=max<=0;thumb.style.height=height+'px';thumb.style.transform='translateY('+((innerHeight-height)*scrollY/Math.max(1,max))+'px)';}
function queueScroll(){if(!scrollFrame)scrollFrame=requestAnimationFrame(paintScroll);}
addEventListener('scroll',queueScroll,{passive:true});addEventListener('resize',queueScroll);new ResizeObserver(queueScroll).observe(document.body);paintScroll();
let drag=null;thumb.addEventListener('pointerdown',event=>{drag={y:event.clientY,scroll:scrollY};thumb.setPointerCapture(event.pointerId);event.preventDefault();});thumb.addEventListener('pointermove',event=>{if(!drag)return;const range=innerHeight-thumb.offsetHeight;scrollTo({top:drag.scroll+(event.clientY-drag.y)/range*(document.documentElement.scrollHeight-innerHeight),behavior:'instant'});});thumb.addEventListener('pointerup',()=>drag=null);thumb.addEventListener('lostpointercapture',()=>drag=null);
