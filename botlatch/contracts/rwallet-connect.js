/* BOTLATCH ⇄ RWALLET connect (read-only view). Uses RWALLET's own exposed interface (window.RWALLET_UNIFIED:
   addresses(), run(id)). Only works when this page runs inside RWALLET / ЯBOWZR / a local RWALLET host on 127.0.0.1.
   No keys ever enter this page. Any transaction becomes an RWALLET run() of a GATED command, which RWALLET turns into a
   ЯCASKET approval request (rzl.casket.request.v1) for the owner's own Face ID. This page never signs and never auto-approves. */
(function(){
 function U(){return window.RWALLET_UNIFIED||null}
 function E(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
 function rpc(m,p){return fetch('https://api.mainnet-beta.solana.com',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:m,params:p})}).then(function(r){return r.json()}).then(function(j){return j.result}).catch(function(){return null})}
 function pubBal(addr,mint){return rpc('getTokenAccountsByOwner',[addr,{mint:mint},{encoding:'jsonParsed'}]).then(function(r){if(!r)return 'unknown';return r.value.reduce(function(a,x){return a+(+x.account.data.parsed.info.tokenAmount.uiAmount||0)},0)})}
 function connect(node,mint){
  var u=U();
  if(!u){node.innerHTML='<p><b>RWALLET not detected.</b> Open this page inside RWALLET or ЯBOWZR to connect. Nothing here asks for keys or seed words.</p><p><label>Or view any public Solana address (read-only): <input id="rwAddr" placeholder="public address" size="44"></label> <button id="rwLook">View</button></p><div id="rwOut"></div>';
   node.querySelector('#rwLook').onclick=function(){var a=node.querySelector('#rwAddr').value.trim();if(!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a)){node.querySelector('#rwOut').textContent='Not a valid public address.';return}
    node.querySelector('#rwOut').textContent='reading…';pubBal(a,mint).then(function(b){node.querySelector('#rwOut').textContent='Я balance: '+(b==='unknown'?'unknown (RPC busy)':b.toLocaleString())})};return}
  (u.ready||Promise.resolve()).then(function(){
   var A=u.addresses().filter(function(a){return a.publicAddress});
   node.innerHTML='<p><b>RWALLET connected</b> · '+A.length+' public address(es) · keys stay in RWALLET</p><table>'+A.map(function(a){return '<tr><td>'+E(a.name)+'</td><td><code>'+E(a.publicAddress)+'</code></td><td class="b" data-a="'+E(a.publicAddress)+'">'+E(a.balance==null?'…':a.balance+' '+(a.unit||''))+'</td></tr>'}).join('')+'</table><p class="k">Pool positions: shown from RWALLET\'s cached holdings; live Orca position read pending (position NFT full address needed).</p>';
   node.querySelectorAll('[data-a]').forEach(function(td){pubBal(td.dataset.a,mint).then(function(b){if(b!=='unknown')td.textContent=b.toLocaleString()+' Я (live)'})});
  });
 }
 /* request(): hand a trade intent to RWALLET. RWALLET marks buy/sell/send/sign as GATED -> ЯCASKET approval preview. */
 function request(kind,detail){var u=U();if(!u)return Promise.resolve({status:'no-rwallet',note:'Open in RWALLET to request approval.'});
  var id={buy:'buy',sell:'sell',trade:'sign',swap:'sign'}[kind]||'sign';
  return u.run(id).then(function(r){return{status:r.status,request:r.out,detail:detail,note:'Sent to RWALLET for your own Face ID approval. Nothing is signed here.'}})}
 window.BOTLATCH_RWALLET={connect:connect,request:request,present:function(){return !!U()}};
})();
