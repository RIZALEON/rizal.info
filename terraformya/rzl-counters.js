/* ЯLAB counters 1.0: visitors + downloads, no cookies, no key, no account, no personal data.
   - visitors / browser loads: Abacus public counting API (abacus.jasoncameron.dev, CORS, keyless). Only counts on rizal.info / rizal.pw.
   - native downloads: GitHub Releases API download_count on rizalward/RZL-EGG (public, read-only, no token).
   Elements: [data-rzl-count="visits|loads|native|downloads"][data-app="dragon-skull|terraformya"]. */
(function(){
  "use strict";
  var API="https://abacus.jasoncameron.dev", NS="rizal-labs";
  var LIVE=/^(www\.)?(rizal\.info|rizal\.pw)$/.test(location.hostname);
  var NATIVE={ "dragon-skull":/^dragon-skull-/, "terraformya":/^(terraformya|teraformr)-/ };
  var SKIP=/(SHA256SUMS|appcast|\.sig$|\.json$)/i;
  function j(u){ return fetch(u,{cache:"no-store",credentials:"omit",referrerPolicy:"no-referrer"}).then(function(r){ if(r.status===404) return {value:0}; if(!r.ok) throw new Error(r.status); return r.json(); }); }
  function get(k){ return j(API+"/get/"+NS+"/"+k).then(function(d){return d.value|0;}).catch(function(){return null;}); }
  function hit(k){ return LIVE ? j(API+"/hit/"+NS+"/"+k).then(function(d){return d.value|0;}).catch(function(){return null;}) : get(k); }
  var ghP=null;
  function native(app){
    if(!ghP){ ghP=(function(){ try{ var c=JSON.parse(sessionStorage.getItem("rzl-gh-rel")||"null"); if(c&&Date.now()-c.t<600000) return Promise.resolve(c.d); }catch(e){}
      return fetch("https://api.github.com/repos/rizalward/RZL-EGG/releases?per_page=100",{credentials:"omit",referrerPolicy:"no-referrer"}).then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); })
        .then(function(rel){ var d=rel.map(function(x){return {tag:x.tag_name,assets:(x.assets||[]).map(function(a){return [a.name,a.download_count|0];})};}); try{ sessionStorage.setItem("rzl-gh-rel",JSON.stringify({t:Date.now(),d:d})); }catch(e){} return d; }); })(); }
    return ghP.then(function(d){ var re=NATIVE[app], n=0; d.forEach(function(r){ if(re&&re.test(r.tag)) r.assets.forEach(function(a){ if(!SKIP.test(a[0])) n+=a[1]; }); }); return n; }).catch(function(){ return null; });
  }
  function fmt(n){ return n==null ? "–" : Number(n).toLocaleString("en-US"); }
  function put(app,kind,n){ document.querySelectorAll('[data-rzl-count="'+kind+'"][data-app="'+app+'"]').forEach(function(e){ e.textContent=fmt(n); }); }
  /* mode "visit" = this page view counts once (per page load) · "read" = show only */
  function mount(app,mode){
    var seen=false; if(mode==="visit"){ try{ seen=!!sessionStorage.getItem("rzl-v-"+app); sessionStorage.setItem("rzl-v-"+app,"1"); }catch(e){} }   // once per tab: reloads (and the one-time service-worker reload) don't double count
    var v = (mode==="visit" && !seen) ? hit(app+"-web-visits") : get(app+"-web-visits");
    var l = get(app+"-web-loads"), nn = native(app);
    return Promise.all([v,l,nn]).then(function(r){ put(app,"visits",r[0]); put(app,"loads",r[1]); put(app,"native",r[2]);
      put(app,"downloads", (r[1]==null&&r[2]==null)?null:((r[1]||0)+(r[2]||0))); return {visits:r[0],loads:r[1],native:r[2]}; });
  }
  /* first full model/game load in this browser = one download (flag holds only "1") */
  function firstLoad(app){ var k="rzl-loaded-"+app; try{ if(localStorage.getItem(k)) return Promise.resolve(null); localStorage.setItem(k,"1"); }catch(e){}
    return hit(app+"-web-loads").then(function(n){ if(n!=null) put(app,"loads",n); return mount(app,"read"); }); }
  window.RZL_COUNTERS={mount:mount,firstLoad:firstLoad,live:LIVE,api:API,ns:NS};
  document.addEventListener("DOMContentLoaded",function(){ document.querySelectorAll("[data-rzl-mount]").forEach(function(e){ mount(e.getAttribute("data-app"), e.getAttribute("data-rzl-mount")); }); });
})();
