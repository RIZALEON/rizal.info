/* DRAGON SKULL web host: the Linux 1.0.0 scout-app.js shim, with the /engine fetch replaced by the in-browser rzl-wasm adapter */
(function(){
  "use strict";
  const BOT={rid:"DRAGON-SKULL-1",name:"DRAGON SKULL"};
  window.ROS_CURRENT=()=>BOT;
  const $=q=>document.querySelector(q);
  function pushTurn(role,text){const d=document.createElement("div");d.className="turn "+role;d.textContent=(role==="user"?"You: ":role==="bot"?BOT.name+": ":"")+text;$("#log").appendChild(d);d.scrollIntoView();return d;}
  window.pushTurn=pushTurn;
  window.ROS_SEND=async function(q){
    q=String(q||"").trim(); if(!q) return;
    window.pushTurn("user",q);
    const live=pushTurn("bot","…thinking");
    let r; try{ r=await window.RZL_WASM.chat(BOT,q,t=>{live.textContent=BOT.name+": "+t;});}catch(e){r="(engine error: "+e.message+")";}
    live.textContent=BOT.name+": "+r; return r;
  };
  function mb(n){return (n/1048576).toFixed(0);}
  function onp(p){
    const s=$("#ds-status"), pr=$("#ds-prog"), f=$("#ds-fill");
    if(p.phase==="download"){s.textContent="downloading";pr.textContent=mb(p.loaded)+" / "+mb(p.total)+" MB"+(p.retry?" · reconnecting…":"");f.style.width=(p.loaded/p.total*90).toFixed(1)+"%";}
    else if(p.phase==="nostore"){pr.dataset.note="Not enough browser storage to keep the model: it will download again next visit.";}
    else if(p.phase==="verify"){s.textContent="checking sha256";f.style.width="92%";}
    else if(p.phase==="engine"){s.textContent="starting engine";pr.textContent="loading model into memory…";f.style.width="95%";}
    else if(p.phase==="ready"){s.textContent="ready";s.title=(p.multithread?p.threads+" threads":"single thread");pr.textContent="";f.style.width="100%";}
  }
  async function start(){
    const b=$("#ds-load"); b.disabled=true; $("#ds-status").textContent="opening…";
    try{
      const r=await window.RZL_WASM.load(onp);
      if(r&&r.fresh&&window.RZL_COUNTERS) window.RZL_COUNTERS.firstLoad("dragon-skull");
      $("#ds-model").classList.add("done"); const m=$("#message"); m.disabled=false; m.placeholder="Message DRAGON SKULL"; $("#composer button").disabled=false; m.focus();
      pushTurn("sys","DRAGON SKULL is running in this browser. Nothing you type leaves this device."+($("#ds-prog").dataset.note?" "+$("#ds-prog").dataset.note:""));
    }catch(e){ $("#ds-status").textContent="error"; $("#ds-prog").textContent=e.message; b.disabled=false; b.textContent="Try again"; }
  }
  document.addEventListener("DOMContentLoaded",()=>{
    $("#chat-avatar").src="./ds-icon-192.png";
    $("#composer").addEventListener("submit",e=>{e.preventDefault();const m=$("#message");const v=m.value;m.value="";window.ROS_SEND(v);});
    $("#ds-load").addEventListener("click",start);
  });
  async function auto(){ try{ if(await window.RZL_WASM.isCached()){ $("#ds-load").textContent="Start (model already in this browser)"; start(); } else if(!/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) $("#ds-load").textContent="Load DRAGON SKULL (~900 MB, once)"; else $("#ds-load").textContent="Load anyway (~900 MB, needs lots of memory)"; }catch(e){} }
  if(window.RZL_WASM) auto(); else document.addEventListener("rzl-wasm-ready",auto,{once:true});
})();
