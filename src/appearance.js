import { mountSiteMascot } from './site-mascot.js';

const root=document.documentElement;
root.dataset.theme='dark';
try{localStorage.removeItem('motor-oil-theme')}catch{}
const motion=matchMedia('(prefers-reduced-motion: reduce)');
const header=document.querySelector('.header');
const headerObserver=new ResizeObserver(()=>{root.style.setProperty('--sticky-header-height',`${header.offsetHeight+16}px`);});headerObserver.observe(header);

// Transparent glyphs are cut from the original artwork ahead of time.
const brandPieces = [[49,30,56,31],[120,30,56,31],[186,30,50,31],[248,30,56,31],[316,30,55,31],[352,40,47,41]];
for (const crop of document.querySelectorAll('.logo-crop')) {
  const logo = crop.closest('.logo');
  const pieces = brandPieces.map(([x,y,width,height], index) => {
    const piece = document.createElement('img');
    piece.src = './assets/images/brand-glyph-' + (index + 1) + '.png';
    piece.alt = '';
    piece.className = 'brand-glyph ' + (index === 5 ? 'brand-glyph-oil' : 'brand-glyph-letter');
    piece.style.setProperty('--glyph-delay', 45 * index + 'ms');
    Object.assign(piece.style, {
      left: (x - 48) / 354 * 100 + '%',
      top: (y - 26) / 58 * 100 + '%',
      width: width / 354 * 100 + '%',
      height: height / 58 * 100 + '%',
    });
    return piece;
  });
  Promise.all(pieces.map(piece => piece.decode())).then(() => {
    crop.replaceChildren(...pieces);
    crop.classList.add('brand-animated');
    if (!logo.closest('.header')) return;
    function playLogo() {
      if (!motion.matches) crop.classList.add('brand-playing');
    }
    crop.addEventListener('animationend', event => {
      if (event.animationName === 'brandOilGlide') crop.classList.remove('brand-playing');
    });
    motion.addEventListener('change', () => crop.classList.remove('brand-playing'));
    logo.addEventListener('pointerenter', playLogo);
    logo.addEventListener('focus', playLogo);
    playLogo();
  }).catch(() => { /* Keep the original logo if an image could not load. */ });
}
// Transparent overlay scroll rail: no reserved browser gutter.
const rail=document.createElement('div');rail.className='page-scrollbar';rail.setAttribute('aria-hidden','true');const thumb=document.createElement('div');thumb.className='page-scroll-thumb';rail.append(thumb);document.body.append(rail);
let scrollFrame=0;function paintScroll(){scrollFrame=0;const max=document.documentElement.scrollHeight-innerHeight;const height=Math.min(110,Math.max(34,innerHeight*innerHeight/document.documentElement.scrollHeight));rail.hidden=max<=0;thumb.style.height=height+'px';thumb.style.transform='translateY('+((innerHeight-height)*scrollY/Math.max(1,max))+'px)';}
function queueScroll(){if(!scrollFrame)scrollFrame=requestAnimationFrame(paintScroll);}
addEventListener('scroll',queueScroll,{passive:true});addEventListener('resize',queueScroll);new ResizeObserver(queueScroll).observe(document.body);paintScroll();
let drag=null;thumb.addEventListener('pointerdown',event=>{drag={y:event.clientY,scroll:scrollY};thumb.setPointerCapture(event.pointerId);event.preventDefault();});thumb.addEventListener('pointermove',event=>{if(!drag)return;const range=innerHeight-thumb.offsetHeight;scrollTo({top:drag.scroll+(event.clientY-drag.y)/range*(document.documentElement.scrollHeight-innerHeight),behavior:'instant'});});thumb.addEventListener('pointerup',()=>drag=null);thumb.addEventListener('lostpointercapture',()=>drag=null);

// Play the card entrance when scrolling brings it into view.
const offerGrid = document.querySelector('.about-offer-grid');
if (offerGrid && !motion.matches && 'IntersectionObserver' in window) {
  const cards = [...offerGrid.querySelectorAll('.about-offer')];
  const reveal = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting)
      .sort((a, b) => cards.indexOf(a.target) - cards.indexOf(b.target));
    visible.forEach(({ target }, index) => {
      target.style.setProperty('--offer-delay', index * 240 + 'ms');
      target.classList.replace('offer-pending', 'offer-entering');
      reveal.unobserve(target);
    });
  }, { threshold: .22, rootMargin: '0px 0px -64px' });
  cards.forEach(card => {
    card.classList.add('offer-pending');
    reveal.observe(card);
  });
  offerGrid.addEventListener('focusin', event => {
    const card = event.target.closest('.about-offer');
    card.classList.remove('offer-pending', 'offer-entering');
    reveal.unobserve(card);
  });
  offerGrid.addEventListener('animationend', event => {
    if (event.animationName === 'aboutOfferRise') event.target.classList.remove('offer-entering');
  });
}

mountSiteMascot();
