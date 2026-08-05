const toggle=document.querySelector('[data-menu-toggle]');
const nav=document.querySelector('[data-navlinks]');
if(toggle&&nav){toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));});nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');}));}
document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
const reveals=document.querySelectorAll('.reveal');
if('IntersectionObserver'in window){const io=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');io.unobserve(entry.target);}});},{threshold:.12});reveals.forEach(el=>io.observe(el));}else{reveals.forEach(el=>el.classList.add('visible'));}

const lightboxLinks=document.querySelectorAll('[data-lightbox]');if(lightboxLinks.length){const overlay=document.createElement('div');overlay.className='lightbox-overlay';overlay.innerHTML='<button class="lightbox-close" aria-label="Fermer">×</button><img alt="Image agrandie">';document.body.appendChild(overlay);const image=overlay.querySelector('img');const close=()=>overlay.classList.remove('open');lightboxLinks.forEach(link=>link.addEventListener('click',e=>{e.preventDefault();image.src=link.href;overlay.classList.add('open');}));overlay.addEventListener('click',e=>{if(e.target===overlay||e.target.classList.contains('lightbox-close'))close();});document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});}
