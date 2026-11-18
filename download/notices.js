/* Я NOTIFICATIONS — update alerts from the signed ЯLAB appcasts (rlab-appcast.v1). Rtor-gated: only owner-signed feeds (.sig.json) count.
   Used by /potlatch/ (hub tile) and /download/. Read-only: no keys, no installs, no tracking.
   Feeds: same-origin /<app>/appcast.json → https://rizal.info → https://rizal.pw (GitHub Pages serves CORS *).
   "New" = the feed version differs from the one this browser last marked seen (localStorage only). */
(function(){
  var APPS=[{key:'rbowzr',title:'ЯBOWZR'},{key:'ybot',title:'ЯBOT'}];
  var ORIGINS=['', 'https://rizal.info', 'https://rizal.pw'];
  var SEEN_KEY='rlab.notices.seen.v1';
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function seen(){try{return JSON.parse(localStorage.getItem(SEEN_KEY)||'{}')||{};}catch(e){return {};}}
  function saveSeen(m){try{localStorage.setItem(SEEN_KEY,JSON.stringify(m));}catch(e){}}
  var gateP=null;
  function load1(src){return new Promise(function(ok){var d=document,x=d.createElement('script');x.src=src;x.onload=function(){ok(true)};x.onerror=function(){ok(false)};(d.head||d.documentElement).appendChild(x);});}
  function gate(){
    if(gateP) return gateP;
    gateP=(window.RTOR_VERIFY?Promise.resolve():load1('/rtor/rtor-verify.js?v=1.0')).then(function(){
      return window.RTOR_FEEDS?null:load1('/rtor/rtor-feeds.js?v=1.0');
    }).then(function(){return (window.RTOR_VERIFY&&window.RTOR_FEEDS)?window.RTOR_FEEDS:null;});
    return gateP;
  }
  function fetchFeed(key){
    var i=0;
    function next(err){
      if(i>=ORIGINS.length) return Promise.reject(err||new Error('no feed reachable'));
      var base=ORIGINS[i++], url=base+'/'+key+'/appcast.json';
      // Rtor gate (Rizal YES 2026-11-18): a feed counts only when <feed>.sig.json verifies (owner key e5833fdfbbfe). Unsigned = refused.
      return gate().then(function(F){
        if(!F) throw new Error('refused: signature missing/invalid (Rtor verify not loaded)');
        return F.fetchVerifiedJSON(url+'?t='+Date.now(),F.expectFor(url));
      }).then(function(v){
        if(!v.ok) throw new Error(v.status+' ('+v.why+')');
        return v.json;
      }).then(function(j){
        if(!j||String(j.schema||'').indexOf('rlab-appcast.')!==0) throw new Error('not an rlab appcast');
        return {feed:j,url:url,origin:base||location.origin};
      }).catch(function(e){return next(e);});
    }
    return next();
  }
  function entries(feed){
    var a=feed.apps||{}, out=[];
    var mac=a.macos||feed.app; if(mac) out.push({platform:'macos',e:mac});
    if(a.ios) out.push({platform:'ios',e:a.ios});
    if(a.android) out.push({platform:'android',e:a.android});
    return out;
  }
  var cache=null;
  function load(){
    if(cache) return cache;
    cache=Promise.all(APPS.map(function(app){
      return fetchFeed(app.key).then(function(r){return {app:app,ok:true,feed:r.feed,url:r.url,origin:r.origin};})
        .catch(function(e){return {app:app,ok:false,error:String(e&&e.message||e)};});
    }));
    return cache;
  }
  /* One row per app. First visit = baseline (saved silently, tagged LATEST); later visits tag NEW when a feed version changed. */
  function alertsFrom(results){
    var s=seen(), first=!Object.keys(s).length, list=[];
    results.forEach(function(r){
      if(!r.ok){list.push({key:r.app.key,kind:'error',title:r.app.title,text:(/^refused:/.test(r.error)?'Update '+r.error:'Feed unreachable · '+r.error),parts:[]});return;}
      var parts=[], changed=[];
      entries(r.feed).forEach(function(x){
        var id=r.app.key+':'+x.platform, v=x.e.version||'?', file=x.e.kind==='app'&&x.e.url;
        var was=s[id], isNew=!first&&was!==v;
        if(isNew) changed.push((PLAT[x.platform]||x.platform)+' '+v+(was?' (was '+was+')':''));
        parts.push({id:id,v:v,label:(PLAT[x.platform]||x.platform)+' '+v+(file?'':' notice'),isNew:isNew});
      });
      list.push({key:r.app.key,kind:changed.length?'new':'ok',title:r.app.title,parts:parts,
        text:changed.length?'New version available · '+changed.join(' · '):parts.map(function(p){return p.label;}).join(' · ')});
    });
    if(first){var m={};list.forEach(function(a){a.parts.forEach(function(p){m[p.id]=p.v;});});saveSeen(m);}
    return list;
  }
  var PLAT={macos:'Mac',ios:'iOS',android:'Android'};
  function render(el,results){
    var list=alertsFrom(results), n=list.filter(function(a){return a.kind==='new';}).length;
    var gen=results.filter(function(r){return r.ok;}).map(function(r){return r.app.title+' '+(r.feed.generated||'?').slice(0,10);}).join(' · ');
    el.innerHTML='<div class="nt-head"><span class="nt-bell">'+(n?'🔔':'🔕')+'</span><b>NOTIFICATIONS</b>'+
      (n?'<span class="nt-count">'+n+'</span>':'')+'<span class="nt-sp"></span>'+
      (n?'<button type="button" class="pill ghost nt-btn" data-nt="seen">Mark seen</button>':'<a class="nt-x" href="/download/">all downloads →</a>')+'</div>'+
      list.map(function(a){
        return '<div class="nt-row nt-'+a.kind+'"><div class="nt-t">'+esc(a.title)+'<span class="nt-tag">'+(a.kind==='new'?'NEW':a.kind==='error'?'ERROR':'LATEST')+'</span></div>'+
          '<div class="nt-x">'+esc(a.text)+'</div></div>';
      }).join('')+
      '<div class="nt-foot">signed feeds · '+esc(gen)+' · same alerts in-app: POTLATCH → NOTIFICATIONS (any IP route)</div>';
    var b=el.querySelector('[data-nt="seen"]');
    if(b) b.onclick=function(){var s=seen();list.forEach(function(a){a.parts.forEach(function(p){s[p.id]=p.v;});});saveSeen(s);render(el,results);};
  }
  window.RLabNotices={
    load:load, entries:entries,
    mount:function(el){
      if(!el) return;
      el.classList.add('nt');
      el.innerHTML='<div class="nt-head"><b>NOTIFICATIONS</b><span class="nt-sp"></span><span class="nt-x">checking feeds…</span></div>';
      load().then(function(r){render(el,r);});
    }
  };
  var css='.nt{background:var(--card,#16161a);border:1px solid var(--line,#2c2c2e);border-radius:16px;padding:12px 14px;margin:8px 0 16px}'+
    '.nt-head{display:flex;align-items:center;gap:8px;font:700 12px/1 var(--sans,sans-serif);letter-spacing:.12em}'+
    '.nt-sp{flex:1}.nt-count{background:#ff453a;color:#fff;border-radius:999px;padding:2px 7px;font-size:11px;letter-spacing:0}'+
    '.nt-btn{padding:6px 10px;font-size:11px}'+
    '.nt-row{margin-top:8px;background:var(--card2,#1c1c22);border-radius:12px;padding:8px 10px}'+
    '.nt-t{font:700 13px/1.3 var(--sans,sans-serif);display:flex;justify-content:space-between;gap:8px}'+
    '.nt-tag{font:700 9px/1.6 var(--sans,sans-serif);letter-spacing:.08em;color:#30d158}'+
    '.nt-new .nt-tag{color:#f0a830}.nt-error .nt-tag{color:#ff453a}'+
    '.nt-x{font:12px/1.4 var(--sans,sans-serif);color:var(--muted,#8e8e93)}.nt-n{font:11px/1.35 var(--sans,sans-serif);color:#666;margin-top:2px}'+
    '.nt-foot{margin-top:8px;font:10px/1.4 var(--mono,monospace);color:#555}';
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
})();
