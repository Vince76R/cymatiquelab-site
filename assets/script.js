const toggle=document.querySelector('[data-menu-toggle]');
const nav=document.querySelector('[data-navlinks]');
if(toggle&&nav){toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));});nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');}));}
document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
const reveals=document.querySelectorAll('.reveal');
if('IntersectionObserver'in window){const io=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');io.unobserve(entry.target);}});},{threshold:.12});reveals.forEach(el=>io.observe(el));}else{reveals.forEach(el=>el.classList.add('visible'));}

const lightboxLinks=document.querySelectorAll('[data-lightbox]');if(lightboxLinks.length){const overlay=document.createElement('div');overlay.className='lightbox-overlay';overlay.innerHTML='<button class="lightbox-close" aria-label="Fermer">×</button><img alt="Image agrandie">';document.body.appendChild(overlay);const image=overlay.querySelector('img');const close=()=>overlay.classList.remove('open');lightboxLinks.forEach(link=>link.addEventListener('click',e=>{e.preventDefault();image.src=link.href;overlay.classList.add('open');}));overlay.addEventListener('click',e=>{if(e.target===overlay||e.target.classList.contains('lightbox-close'))close();});document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});}

/* CymatiqueLab — consentement marketing + Meta Pixel */
(()=>{
  const META_PIXEL_ID='1604448031073152';
  const CONSENT_KEY='cymatiquelab_marketing_consent_v1';
  const ACCEPTED='accepted';
  const REFUSED='refused';

  const readConsent=()=>{try{return localStorage.getItem(CONSENT_KEY);}catch(_){return null;}};
  const writeConsent=value=>{try{localStorage.setItem(CONSENT_KEY,value);}catch(_){/* stockage indisponible */}};

  const loadMetaPixel=()=>{
    if(window.__cymatiquelabMetaPixelLoaded)return;
    window.__cymatiquelabMetaPixelLoaded=true;
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init',META_PIXEL_ID);
    fbq('track','PageView');
  };

  const style=document.createElement('style');
  style.textContent=`
    .cl-consent{position:fixed;left:18px;right:18px;bottom:18px;z-index:9999;display:none;max-width:860px;margin:auto;padding:18px;border:1px solid rgba(255,255,255,.18);border-radius:22px;background:rgba(6,6,16,.96);box-shadow:0 24px 80px rgba(0,0,0,.5);backdrop-filter:blur(18px);color:#f8f4e9}
    .cl-consent.open{display:block}.cl-consent-grid{display:grid;grid-template-columns:1fr auto;gap:18px;align-items:center}.cl-consent strong{display:block;margin-bottom:4px;font-size:16px}.cl-consent p{margin:0;color:#bbb9d5;font-size:14px;line-height:1.5}.cl-consent a{color:#ffe68a;text-decoration:underline;text-underline-offset:2px}.cl-consent-actions{display:flex;gap:9px;flex-wrap:wrap;justify-content:flex-end}.cl-consent button{min-height:42px;padding:0 16px;border-radius:999px;border:1px solid rgba(255,255,255,.22);font:inherit;font-weight:800;cursor:pointer}.cl-consent .cl-refuse{background:rgba(255,255,255,.06);color:#f8f4e9}.cl-consent .cl-accept{border-color:transparent;color:#090914;background:linear-gradient(135deg,#ffe68a,#b28cff 55%,#20d9ff)}.cl-cookie-settings{border:0;background:transparent;color:inherit;font:inherit;font-size:12px;text-decoration:underline;text-underline-offset:2px;cursor:pointer;padding:0}.cl-cookie-settings:hover{color:#f8f4e9}@media(max-width:680px){.cl-consent{left:10px;right:10px;bottom:10px;padding:16px}.cl-consent-grid{grid-template-columns:1fr}.cl-consent-actions{justify-content:stretch}.cl-consent-actions button{flex:1}}
  `;
  document.head.appendChild(style);

  const banner=document.createElement('div');
  banner.className='cl-consent';
  banner.setAttribute('role','dialog');
  banner.setAttribute('aria-label','Préférences de confidentialité');
  banner.innerHTML=`<div class="cl-consent-grid"><div><strong>Votre confidentialité, votre choix.</strong><p>Avec votre accord, CymatiqueLab utilise le Pixel Meta pour mesurer l'utilisation du site et améliorer ses publicités. Vous pouvez accepter ou refuser. <a href="/pages/confidentialite">En savoir plus</a>.</p></div><div class="cl-consent-actions"><button type="button" class="cl-refuse">Refuser</button><button type="button" class="cl-accept">Accepter</button></div></div>`;
  document.body.appendChild(banner);

  const showBanner=()=>banner.classList.add('open');
  const hideBanner=()=>banner.classList.remove('open');

  banner.querySelector('.cl-accept').addEventListener('click',()=>{writeConsent(ACCEPTED);loadMetaPixel();hideBanner();});
  banner.querySelector('.cl-refuse').addEventListener('click',()=>{writeConsent(REFUSED);if(window.fbq){try{fbq('consent','revoke');}catch(_){}}hideBanner();});

  const footerBottom=document.querySelector('.footer-bottom');
  if(footerBottom){
    const settings=document.createElement('button');
    settings.type='button';
    settings.className='cl-cookie-settings';
    settings.textContent='Préférences de témoins';
    settings.addEventListener('click',showBanner);
    footerBottom.append(document.createTextNode(' · '),settings);
  }

  const consent=readConsent();
  if(consent===ACCEPTED)loadMetaPixel();
  else if(consent!==REFUSED)showBanner();
})();
