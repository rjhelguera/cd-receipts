// Served at /t.js. __ORIGIN__ is replaced with the tracker's own origin.
//
// On any page:   <script src="https://go.yoursite.com/t.js"></script>
//   - remembers the visitor id (?ytc=…) from a tracked link in localStorage + a first-party cookie on YOUR domain
//   - reports a page view
//   - appends ?client_reference_id=<visitor id> to Stripe Payment Links on the page, so Stripe sales match automatically
//   - watches forms: when a form with an email field is submitted, records a lead
// On a thank-you page after a purchase:   <script src="https://go.yoursite.com/t.js" data-sale="497"></script>
//   (or call  yt.sale({amount: 497, email: '...'})  yourself, or  yt.lead('name@example.com')  after a signup)
export const SNIPPET = `(function(){
var O='__ORIGIN__',K='ytc',S=document.currentScript||{dataset:{}},D=S.dataset||{};
function g(n){var m=document.cookie.match('(?:^|; )'+n+'=([^;]*)');return m?decodeURIComponent(m[1]):''}
function set(v){try{localStorage.setItem(K,v)}catch(e){}var d=location.hostname.split('.');var dom=d.length>2?d.slice(-2).join('.'):location.hostname;document.cookie=K+'='+encodeURIComponent(v)+'; Path=/; Max-Age=31536000; SameSite=Lax; Domain=.'+dom+(location.protocol==='https:'?'; Secure':'')}
var q=new URLSearchParams(location.search),c=q.get(K);
if(c&&/^[A-Za-z0-9_-]{6,40}$/.test(c))set(c);
var cid=c||g(K)||(function(){try{return localStorage.getItem(K)||''}catch(e){return ''}})();
var code=q.get('utm_content')||'';if(code)try{localStorage.setItem(K+'_code',code)}catch(e){}else{try{code=localStorage.getItem(K+'_code')||''}catch(e){}}
function post(p,b){b.cid=cid;b.code=b.code||code;try{var s=JSON.stringify(b);if(navigator.sendBeacon){navigator.sendBeacon(O+p,new Blob([s],{type:'application/json'}))}else{fetch(O+p,{method:'POST',headers:{'content-type':'application/json'},body:s,keepalive:true})}}catch(e){}}
var yt=window.yt=window.yt||{};
yt.id=function(){return cid};
yt.lead=function(email,name){if(email)post('/api/lead',{email:email,name:name||''})};
yt.sale=function(o){o=o||{};post('/api/sale',{amount:o.amount||D.sale||0,email:o.email||D.email||'',currency:o.currency||D.currency||'USD',offer:o.offer||D.offer||'',id:o.id||'',source:'snippet'})};
if(cid){post('/api/event',{kind:D.event||'view',page:location.pathname});
  if(D.sale!==undefined&&!sessionStorage.getItem(K+'_sold_'+location.pathname)){yt.sale({});try{sessionStorage.setItem(K+'_sold_'+location.pathname,'1')}catch(e){}}
  if(D.lead!==undefined&&D.email)yt.lead(D.email);
  // Stripe Payment Links: carry the visitor id into Stripe as client_reference_id
  var a=document.querySelectorAll('a[href*="buy.stripe.com"],a[href*="checkout.stripe.com"]');for(var i=0;i<a.length;i++){try{var u=new URL(a[i].href);if(!u.searchParams.get('client_reference_id')){u.searchParams.set('client_reference_id',cid);a[i].href=u.toString()}}catch(e){}}
  // Calendly / ConvertKit / generic links: add ytc + utm_content so the next page can keep the thread
  var l=document.querySelectorAll('a[href*="calendly.com"],a[data-yt-pass]');for(var j=0;j<l.length;j++){try{var v=new URL(l[j].href);v.searchParams.set('utm_content',code||'');v.searchParams.set(K,cid);l[j].href=v.toString()}catch(e){}}
}
// forms: any submitted form with an email field becomes a lead (turn off with data-forms="off")
if(D.forms!=='off')document.addEventListener('submit',function(e){try{var f=e.target;var el=f.querySelector('input[type=email],input[name*=email i]');if(el&&el.value){var n=f.querySelector('input[name*=name i]');yt.lead(el.value,n?n.value:'')}}catch(x){}},true);
// hidden fields: <input name="ytc"> / <input name="utm_content"> get filled so your form tool receives them too
var h=document.querySelectorAll('input[name=ytc]');for(var k=0;k<h.length;k++)h[k].value=cid;
var hc=document.querySelectorAll('input[name=utm_content]');for(var m=0;m<hc.length;m++)if(!hc[m].value)hc[m].value=code;
})();`;
