const track=document.querySelector('#review-track');
const textList=document.querySelector('#review-text-list');
const buttons=[...document.querySelectorAll('[data-review-type]')];
const previous=document.querySelector('#reviews-prev'),next=document.querySelector('#reviews-next');
const dialog=document.querySelector('#review-photo-dialog');
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const data=await fetch('./data/reviews/photo-reviews.json').then(response=>{if(!response.ok)throw Error('Reviews unavailable');return response.json();}).catch(()=>({reviews:[]}));
function render(type){
 buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.reviewType===type)));
 const reviews=data.reviews.filter(review=>review.type===type && [4,5].includes(review.rating));document.querySelector('.review-arrows').hidden=reviews.length<=1;track.replaceChildren();
 for(const review of reviews){
  const card=document.createElement('article');card.className='review-card';
  const photo=document.createElement('button');photo.type='button';photo.className='review-photo';photo.setAttribute('aria-label','Увеличить фотографию: '+review.author);
  const image=document.createElement('img');image.src=review.photo;image.alt='Фотография из отзыва '+review.author;image.loading='lazy';image.decoding='async';image.width=640;image.height=480;photo.append(image);
  const zoom=document.createElement('span');zoom.className='review-zoom';zoom.textContent='Посмотреть фото ↗';photo.append(zoom);
  photo.addEventListener('click',()=>{const large=document.querySelector('#review-photo-large');large.src=review.photo;large.alt=image.alt;document.querySelector('#review-photo-caption').textContent=review.author+' · '+review.address;dialog.showModal();});
  const body=document.createElement('div');body.className='review-copy';
  const address=document.createElement('p');address.className='review-address';address.textContent=review.address;
  const quote=document.createElement('blockquote');quote.textContent='«'+review.quote+'»';
  const author=document.createElement('p');author.className='review-author';author.textContent=review.author;
  const date=document.createElement('p');date.className='review-date';date.textContent=review.date+' · '+review.source;
  const source=document.createElement('a');source.href=review.url;source.target='_blank';source.rel='noopener noreferrer';source.className='review-source';source.textContent='Читать отзыв в '+review.source+' ↗';
  const rating=document.createElement('p');rating.className='review-rating';rating.setAttribute('aria-label','Оценка автора: '+review.rating+' из 5');rating.innerHTML='<span aria-hidden="true">'+ '★'.repeat(review.rating)+'</span><strong>'+review.rating+' / 5</strong>';
  body.append(address,rating,quote,author,date,source);card.append(photo,body);track.append(card);
 }
 if(!reviews.length){const p=document.createElement('p');p.textContent='Отзывы временно недоступны.';track.append(p);}
 renderTextReviews(type);
 track.scrollLeft=0;requestAnimationFrame(updateArrows);
}
function renderTextReviews(type) {
 const entries = (data.textReviews ?? []).filter(review => review.type === type && [4,5].includes(review.rating));
 textList.closest('.review-text-column').hidden = !entries.length;
 textList.replaceChildren(...entries.map(review => {
   const card = document.createElement('article');
   card.className = 'review-text-card';
   const rating = document.createElement('p');
   rating.className = 'review-rating';
   rating.setAttribute('aria-label', 'Оценка автора: ' + review.rating + ' из 5');
   rating.textContent = '★ '.repeat(review.rating).trim() + '  ·  ' + review.rating + '/5';
   const quote = document.createElement('blockquote');
   quote.textContent = '«' + review.quote + '»';
   const source = document.createElement('a');
   source.href = review.url;
   source.target = '_blank';
   source.rel = 'noopener noreferrer';
   source.className = 'review-text-source';
   source.textContent = review.author + ' · ' + review.source;
   card.append(rating, quote, source);
   return card;
 }));
}
function updateArrows(){previous.disabled=track.scrollLeft<2;next.disabled=track.scrollLeft+track.clientWidth>=track.scrollWidth-2;}
function move(direction){track.scrollBy({left:direction*(track.querySelector('.review-card')?.getBoundingClientRect().width+20||track.clientWidth),behavior:reduce.matches?'instant':'smooth'});}
buttons.forEach(button=>button.addEventListener('click',()=>render(button.dataset.reviewType)));
previous.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));track.addEventListener('scroll',updateArrows,{passive:true});new ResizeObserver(updateArrows).observe(track);
track.addEventListener('keydown',event=>{if(event.target===track&&['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();move(event.key==='ArrowRight'?1:-1);}});
dialog.addEventListener('click',event=>{if(event.target===dialog){const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();}});
render('oils');
