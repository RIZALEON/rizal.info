/* BOTLATCH on-chain activity tracker — read-only. No keys, no signing. Rows come only from real Solana txs. */
(function(){
var MINT='BB9uA5BuacDnWyDf5Npc9nMb9yFbyThsNrQPBYJ5Q1Lv',POOL='HSroUxVkVKv6kX9e7dpoJtbFqKcL76BzrkuuRfAGxs9s',RPCS=['https://solana-rpc.publicnode.com','https://api.mainnet-beta.solana.com'],GT='https://api.geckoterminal.com/api/v2/networks/solana/pools/';
var TYPES=['mint','burn','buy','sell','swap','transfer','lp_add','lp_remove','pool_setup','create','other'];
var LABEL={transfer:'transfer/send',lp_add:'LP add',lp_remove:'LP remove',pool_setup:'pool setup',other:'other (no Я moved)'};
function sh(a){return a?a.slice(0,4)+'…'+a.slice(-4):'—'}
function acct(a){return a?'<a target=_blank rel=noopener href="https://solscan.io/account/'+a+'">'+sh(a)+'</a>':'—'}
function mt(t){return t?new Date(t*1000).toLocaleString('en-US',{timeZone:'America/Denver',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})+' MT':'?'}
async function rpc(m,p){var last;for(var u of RPCS){try{return await rpc1(u,m,p)}catch(e){last=e}}throw last}
async function rpc1(RPC,m,p){for(var i=0;i<3;i++){try{var r=await fetch(RPC,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:m,params:p})});if(r.status==403)throw 'forbidden';if(r.status==429){await new Promise(z=>setTimeout(z,1500*Math.pow(2,i)));continue}var j=await r.json();if(j.error)throw j.error;return j.result}catch(e){if(e==='forbidden'||i==2)throw e;await new Promise(z=>setTimeout(z,1500*Math.pow(2,i)))}}throw 'rate limited'}
function classify(sig,t){var m=t.meta,msg=t.transaction.message,ins=[];msg.instructions.concat(...(m.innerInstructions||[]).map(g=>g.instructions)).forEach(x=>{if(x.parsed&&typeof x.parsed=='object')ins.push(x.parsed.type)});
 var d={},pre={},post={};(m.preTokenBalances||[]).forEach(b=>{if(b.mint==MINT)pre[b.accountIndex]=b});(m.postTokenBalances||[]).forEach(b=>{if(b.mint==MINT)post[b.accountIndex]=b});
 Object.keys(Object.assign({},pre,post)).forEach(k=>{var b=post[k]||pre[k],v=(+((post[k]||{}).uiTokenAmount||{}).uiAmount||0)-(+((pre[k]||{}).uiTokenAmount||{}).uiAmount||0);if(Math.abs(v)>0)d[b.owner]=(d[b.owner]||0)+v});
 var logs=(m.logMessages||[]).join(' '),net=Object.values(d).reduce((a,b)=>a+b,0),ty,fee=msg.accountKeys[0].pubkey||msg.accountKeys[0];
 if(/IncreaseLiquidity/.test(logs))ty='lp_add';else if(/DecreaseLiquidity/.test(logs))ty='lp_remove';
 else if(net>1e-9&&ins.some(x=>/^mintTo/.test(x)))ty='mint';else if(net<-1e-9)ty='burn';
 else if(/InitializePool|OpenPosition/.test(logs))ty=(d[POOL]>0?'lp_add':'pool_setup');else if(/InitializeMint/i.test(logs))ty='create';
 else if(/swap/i.test(logs)){var v=d[fee]||0;ty=v>0?'buy':v<0?'sell':'swap'}
 else if(ins.some(x=>/^transfer/.test(x))&&Object.keys(d).length)ty='transfer';else ty='other';
 var neg=Object.keys(d).filter(k=>d[k]<0),pos=Object.keys(d).filter(k=>d[k]>0);
 return {sig:sig,time:t.blockTime,slot:t.slot,type:ty,amount:Math.max(0,...Object.values(d).map(Math.abs)),from:neg[0]||null,to:pos[0]||null,signer:fee}}
function mount(el){
 var rows={},filt='all',status='';
 el.innerHTML='<div class="t bl-act"><h3>ON-CHAIN ACTIVITY · Я / R TOKEN + ORCA POOL</h3><p class="k">Mint, burn, buy, sell, swap, transfer/send and LP moves, read from Solana mainnet. Read-only; every row links to its real transaction. Snapshot for RGENERATOR: <a href="/botlatch/contracts/activity.json">activity.json</a></p><div class="bl-f"></div><p class="k bl-s"></p><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr class="l"><td>Time</td><td>Type</td><td>Amount Я</td><td>From</td><td>To</td><td>Tx</td></tr></thead><tbody></tbody></table></div><p><button class="bl-req">Request in RWALLET</button> <span class="k">Buy, sell, swap or send opens in RWALLET for your Face ID through ЯCASKET. No keys and no signing on this page.</span></p></div>';
 var f=el.querySelector('.bl-f');f.innerHTML=['all'].concat(TYPES).map(t=>'<button data-t="'+t+'" style="margin:2px;padding:4px 10px;font-size:11px">'+(LABEL[t]||t)+'</button>').join('');
 f.onclick=e=>{var t=e.target.dataset.t;if(t){filt=t;draw()}};
 el.querySelector('.bl-req').onclick=()=>{var R=window.RWALLET_UNIFIED;if(R&&R.run)R.run('buy');else alert('RWALLET not connected. Open RWALLET to request a trade; it needs your Face ID.')};
 function draw(){var a=Object.values(rows).sort((x,y)=>(y.time||0)-(x.time||0)),c={};a.forEach(r=>c[r.type]=(c[r.type]||0)+1);
  el.querySelectorAll('.bl-f button').forEach(b=>{var t=b.dataset.t;b.style.opacity=t==filt?1:.55;b.textContent=(LABEL[t]||t)+' '+(t=='all'?a.length:(c[t]||0))});
  a=a.filter(r=>filt=='all'||r.type==filt);
  el.querySelector('tbody').innerHTML=a.length?a.map(r=>'<tr><td>'+mt(r.time)+'</td><td><b>'+(LABEL[r.type]||r.type)+'</b></td><td>'+(r.amount?(+r.amount).toLocaleString():'—')+'</td><td>'+acct(r.from)+'</td><td>'+acct(r.to)+'</td><td><a target=_blank rel=noopener href="https://solscan.io/tx/'+r.sig+'">'+r.sig.slice(0,8)+'…</a></td></tr>').join(''):'<tr><td colspan=6 class=k>No transactions of this type found on-chain.</td></tr>';
  el.querySelector('.bl-s').textContent=status}
 function snap(){return fetch('/botlatch/contracts/activity.json',{cache:'no-store'}).then(r=>r.json()).then(j=>{j.rows.forEach(r=>rows[r.sig]=r);status='Snapshot '+new Date(j.generated).toLocaleString('en-US',{timeZone:'America/Denver'})+' MT · '+j.rows.length+' txs';draw()}).catch(()=>{})}
 async function live(){try{var s=[];for(var a of [MINT,POOL])s=s.concat(await rpc('getSignaturesForAddress',[a,{limit:25}]));
  var n=s.filter(x=>!x.err&&!rows[x.signature]),k=0;for(var x of n.slice(0,10)){var t=await rpc('getTransaction',[x.signature,{encoding:'jsonParsed',maxSupportedTransactionVersion:0}]);if(t){rows[x.signature]=classify(x.signature,t);k++}await new Promise(z=>setTimeout(z,500))}
  status='Live check '+mt(Date.now()/1000)+' · '+Object.keys(rows).length+' txs · '+k+' new · auto-refresh 90 s'}catch(e){status='Public Solana RPC is limiting browser reads; showing the snapshot plus GeckoTerminal pool trades. Retry in 90 s.'}
  try{var g=await fetch(GT+POOL+'/trades',{headers:{accept:'application/json'}}).then(r=>r.ok?r.json():{data:[]});var gk=0;(g.data||[]).forEach(function(d){var a=d.attributes||{};if(!a.tx_hash||rows[a.tx_hash])return;var buy=a.kind==='buy';rows[a.tx_hash]={sig:a.tx_hash,time:Date.parse(a.block_timestamp)/1000,type:buy?'buy':'sell',amount:+(buy?a.to_token_amount:a.from_token_amount)||0,from:buy?POOL:a.tx_from_address,to:buy?a.tx_from_address:POOL,src:'geckoterminal'};gk++});if(gk)status+=' · +'+gk+' GeckoTerminal trades'}catch(e){}
  draw()}
 snap().then(live);setInterval(live,90000)}
function go(){document.querySelectorAll('[data-botlatch-activity]').forEach(mount)}
document.readyState=='loading'?document.addEventListener('DOMContentLoaded',go):go();
})();
