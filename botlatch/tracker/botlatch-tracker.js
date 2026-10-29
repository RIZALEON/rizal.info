/* BOTLATCH tracker + converter widget (read-only). Renders snapshot.json. No network writes, no wallet, no trades. */
(function(){
 var CSS='.blt{font:14px/1.5 system-ui,sans-serif;color:#eee;background:#0b0b0b;border:1px solid #2a2a2a;border-radius:14px;padding:18px;max-width:960px;margin:0 auto}.blt h3{margin:0 0 4px;letter-spacing:.2em;font-size:13px;color:#f2b25c}.blt .g{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px;margin:12px 0}.blt .c{border:1px solid #222;border-radius:10px;padding:10px}.blt .n{font:800 26px/1.1 ui-monospace,monospace}.blt .u{color:#888;font-size:12px}.blt .gap{color:#e08a5c;font-size:12px}.blt .k{color:#9a9a9a;font-size:11px;word-break:break-word}.blt small{color:#777}.blt input,.blt select{background:#111;color:#eee;border:1px solid #333;border-radius:6px;padding:6px;width:9em}.blt .conv{border-top:1px solid #222;padding-top:12px;margin-top:6px}';
 function el(h){var d=document.createElement('div');d.innerHTML=h;return d.firstChild}
 function fmt(n){return n==null?'—':Number(n).toLocaleString()}
 function mount(node,url){
  if(!document.getElementById('blt-css')){var s=document.createElement('style');s.id='blt-css';s.textContent=CSS;document.head.appendChild(s)}
  fetch(url,{cache:'no-store'}).then(function(r){return r.json()}).then(function(S){
   var cards=S.categories.map(function(c){var k=Object.keys(c.kinds||{}).slice(0,6).map(function(x){return x+': '+c.kinds[x]}).join(' · ');
    return '<div class="c"><div class="u">'+c.category.toUpperCase()+'</div><b>'+c.label+'</b><div class="n">'+fmt(c.count)+'</div><div class="u">'+c.unit+'</div>'+(k?'<div class="k">'+k+'</div>':'')+(c.status!=='ledger'?'<div class="gap">'+c.status+'</div>':'')+'</div>'}).join('');
   var total=S.categories.filter(function(c){return c.status==='ledger'}).reduce(function(a,c){return a+(+c.count||0)},0);
   node.innerHTML='<div class="blt"><h3>BOTLATCH · MINT TRACKER</h3><small>RGENERATOR-linked · snapshot '+S.generated+' · '+fmt(total)+' tracked ledger records · sha '+S.sha256.slice(0,12)+'</small><div class="g">'+cards+'</div>'+
   '<div class="conv"><h3>CONVERTER</h3><small>Display math only. R credits are local game credit, not money (10 pts = 1 R, cap 100 R/day).</small><p><input id="bltIn" type="number" value="100" min="0"> <select id="bltFrom"><option value="pts">game points</option><option value="R">R credits</option></select> = <b id="bltOut"></b></p></div>'+
   '<small>'+S.note+'</small></div>';
   function conv(){var v=+node.querySelector('#bltIn').value||0,f=node.querySelector('#bltFrom').value;
    node.querySelector('#bltOut').textContent=f==='pts'?Math.min(v/10,100).toLocaleString()+' R (capped 100/day)':(v*10).toLocaleString()+' game points'}
   node.querySelector('#bltIn').oninput=conv;node.querySelector('#bltFrom').onchange=conv;conv();
  }).catch(function(){node.textContent='BOTLATCH snapshot unavailable.'})
 }
 window.BOTLATCH={mount:mount};
 document.querySelectorAll('[data-botlatch]').forEach(function(n){mount(n,n.getAttribute('data-botlatch'))});
})();
