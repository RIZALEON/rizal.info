/* ЯLAB · Import X/Twitter archive panel (fusable). Mount: TBI_PANEL.mount(el)  ·  R:\IMPORT TWEETBACK
   Needs tbi-core.js first. Everything runs in this page; nothing is uploaded. */
(function(){"use strict";const T=window.TBI;let last=null,urls={};
const CSS=`/* RDRAGON-on-Neo theme (DS-THEME-00 tokens, fallbacks = theme.css values). GHOSTMACHINE social preview (.gm) keeps black + #39ff14. */
.tbi{font:12.5px/1.5 var(--ds-mono,ui-monospace,Menlo,monospace);color:var(--ds-fg,#eeeeee);background:var(--ds-bg,#0b0b0c);border:1px solid var(--ds-line,#2a2a2e);border-top:2px solid var(--ds-purple,#8b5cf6);border-radius:var(--ds-r,10px);padding:14px;max-width:720px;box-sizing:border-box}
.tbi *{box-sizing:border-box}.tbi h2{margin:0 0 10px;display:flex;gap:10px;align-items:center;font-size:15px;letter-spacing:.5px;color:var(--ds-gold,#d7af5f)}
.tbi .tile{width:44px;height:44px;border:1px solid var(--ds-line,#2a2a2e);border-radius:var(--ds-r,10px);object-fit:cover}
.tbi button{background:var(--ds-panel,#161616);color:var(--ds-fg,#eeeeee);border:1px solid var(--ds-purple,#8b5cf6);border-radius:var(--ds-r,10px);font:12px var(--ds-mono,ui-monospace,Menlo,monospace);padding:6px 12px;cursor:pointer;margin:4px 4px 4px 0;transition:border-color var(--ds-speed,.18s),color var(--ds-speed,.18s)}.tbi button:hover{border-color:var(--ds-gold,#d7af5f);color:var(--ds-gold,#d7af5f)}
.tbi button.alt{border-color:var(--ds-line,#2a2a2e);color:var(--ds-fg-dim,#a19cb3)}.tbi a{color:var(--ds-blue-2,#3b82f6)}
.tbi .drop{border:1px dashed var(--ds-purple,#8b5cf6);border-radius:var(--ds-r,10px);background:var(--ds-panel,#161616);padding:20px;text-align:center;margin:8px 0}.tbi .drop.on{background:var(--ds-panel-2,#1d1d21);border-color:var(--ds-gold,#d7af5f)}
.tbi textarea{width:100%;background:var(--ds-panel,#161616);color:var(--ds-fg,#eeeeee);border:1px solid var(--ds-line,#2a2a2e);border-radius:var(--ds-r,10px);font:12px var(--ds-mono,ui-monospace,Menlo,monospace);min-height:48px}
.tbi pre{background:var(--ds-panel,#161616);border:1px solid var(--ds-line,#2a2a2e);border-radius:var(--ds-r,10px);max-height:140px;overflow:auto;padding:8px;font-size:11.5px;color:var(--ds-fg-dim,#a19cb3)}
.tbi small{color:var(--ds-fg-dim,#a19cb3)}.tbi b{color:var(--ds-gold,#d7af5f)}.tbi label{display:block;margin:6px 0}
.tbi .post{border-left:2px solid #39ff14;padding:6px 10px;margin:8px 0;color:#39ff14;background:#000}.tbi .post .post{margin-left:12px;border-color:#39ff14}
.tbi img,.tbi video{max-width:100%;max-height:240px;border:1px solid var(--ds-line,#2a2a2e);border-radius:var(--ds-r,10px)}.tbi .hd{display:flex;gap:10px;align-items:center;background:#000;color:#39ff14;padding:10px;border:1px solid #39ff14;border-bottom:2px solid #39ff14;border-radius:0}
.tbi .av{width:56px;height:56px;border-radius:50%;object-fit:cover;border:2px solid #39ff14}.tbi .hd small{color:#39ff14}.tbi .hd b{color:#39ff14}`;
const TILE=`<img class="tile" alt="RDRAGON" src="${(document.currentScript&&document.currentScript.src||"").replace(/[^/]*$/,"")}rdragon-tile.jpg">`;
function mount(root){if(typeof root==="string")root=document.querySelector(root);if(!document.getElementById("tbi-css")){const s=document.createElement("style");s.id="tbi-css";s.textContent=CSS;document.head.appendChild(s)}
 root.innerHTML=`<div class="tbi">${`<h2>${TILE} Import X/Twitter archive</h2>`}
 <small>For banned accounts or anyone moving: your official X archive zip becomes a GHOSTMACHINE profile draft. Runs on this device only. DMs and private data are skipped.</small>
 <div class="drop" data-k="drop"><button data-k="pick">Import X/Twitter archive</button><br><small>or drag your zip(s) here — part1, part2… together. 50 GB+ is fine.</small><input type=file multiple accept=".zip" hidden data-k="file"></div>
 <b>Profile REBIRTH from Drive link</b><br><small>Paste "Anyone with the link" Google Drive links, one per line (part1, part2…). No Google sign-in is ever asked.</small>
 <textarea data-k="links" placeholder="https://drive.google.com/file/d/…/view?usp=sharing"></textarea>
 <button data-k="rebirth">Profile REBIRTH from Drive link</button>
 <label><input type=checkbox data-k="ts"> Text set only (tweet text, community media, articles + long posts; no tweet photos/videos, Grok or DMs)</label>
 <pre data-k="log">ready.</pre><div data-k="out"></div></div>`;
 const $=k=>root.querySelector(`[data-k="${k}"]`),log=m=>{$("log").textContent+="\n"+m;$("log").scrollTop=1e9};
 $("pick").onclick=()=>$("file").click();$("file").onchange=e=>run([...e.target.files].map(f=>T.blobSource(f)));
 const dz=$("drop");dz.ondragover=e=>{e.preventDefault();dz.classList.add("on")};dz.ondragleave=()=>dz.classList.remove("on");
 dz.ondrop=e=>{e.preventDefault();dz.classList.remove("on");run([...e.dataTransfer.files].filter(f=>/\.zip$/i.test(f.name)).map(f=>T.blobSource(f)))};
 $("rebirth").onclick=async()=>{const lines=$("links").value.split(/\s+/).filter(Boolean),help=(window.TBI_HELPER||"http://127.0.0.1:7337");const srcs=[];
  for(const l of lines){const id=T.driveId(l);if(!id){log("✗ not a Drive file link: "+l);return}
   try{srcs.push(await T.urlSource(help+"/drive/"+id,"drive-"+id))}catch(e){log(e.message==="PRIVATE"?"✗ This Drive file is private. Ask the owner to set sharing to \"Anyone with the link\", then paste it again.":/fetch/i.test(e.message)?"✗ The REBIRTH helper is not running. On this Mac run:  R:\\IMPORT TWEETBACK --serve":"✗ "+e.message);return}}
  run(srcs)};
 async function run(srcs){if(!srcs.length)return;$("out").innerHTML="";try{const r=await T.importArchive(srcs,{log});last=r;confirmCard(r)}catch(e){log("✗ "+(e.message==="NOT_ZIP"?"That file is not a zip archive.":e.message))}}
 async function confirmCard(r){const pf=r.profile.prof;
  $("out").innerHTML=`<div class="hd"><img class="av" src="${await url(pf.avatar&&pf.avatar.zip)}"><div><b>${esc(pf.name)}</b> <small>${esc(pf.handle)}</small></div></div><p><b>Add this profile, ${esc(pf.handle)}? Are you sure?</b></p><button data-k="ok">Add profile</button><button class="alt" data-k="no">Cancel</button>`;
  $("ok").onclick=()=>{log("Added "+pf.handle+" as an unsigned draft.");show(r)};
  $("no").onclick=()=>{last=null;Object.values(urls).forEach(u=>URL.revokeObjectURL(u));urls={};$("out").innerHTML="";log("Cancelled. Nothing was saved.")}}
 async function url(k){if(!k)return"";if(urls[k])return urls[k];const e=last.entries.get(k),b=new Blob([await T.entryBytes(e)],{type:/mp4$/.test(k)?"video/mp4":""});return urls[k]=URL.createObjectURL(b)}
 async function show({profile:p}){const kids={};p.posts.forEach(x=>x.par&&(kids[x.par]=kids[x.par]||[]).push(x));
  const TS=$("ts").checked;const card=async x=>`<div class="post"><small>${x.ts.slice(0,16).replace("T"," ")}</small><div>${esc(x.t)}</div>${(await Promise.all((TS?[]:x.media).map(async m=>m.type==="video"?`<video controls src="${await url(m.zip)}"></video>`:`<img src="${await url(m.zip)}">`))).join("")}${(await Promise.all((kids[x.id]||[]).map(card))).join("")}</div>`;
  const tops=p.posts.filter(x=>!x.par).reverse().slice(0,50);
  $("out").innerHTML=`<div class="hd"><img class="av" src="${await url(p.prof.avatar&&p.prof.avatar.zip)}"><div><b>${esc(p.prof.name)}</b> <small>${esc(p.prof.handle)}</small><br>${esc(p.prof.bio)}</div></div>
  <p><small>${p.counts.posts} posts · ${p.counts.media} photos/videos · ${p.counts.articles} articles (always included) · ${p.counts.private_entries_skipped} private files skipped · state: <b>unsigned draft</b></small></p>
  <button data-k="dl">Save profile draft</button><button class="alt" data-k="site">Export tweetback site</button><button class="alt" data-k="csp">Open in CryptoSocial panel</button><button class="alt" data-k="live">Make live… (ЯCASKET)</button>
  ${(await Promise.all(tops.map(card))).join("")}`;
  $("dl").onclick=()=>dl(p.id+".json",JSON.stringify(p,null,1));
  $("site").onclick=()=>log("Full site with media: R:\\IMPORT TWEETBACK <zip> --site  (writes site/index.html beside the media)");
  $("csp").onclick=()=>{const LS="rdragon.csp.v2",cur=JSON.parse(localStorage.getItem(LS)||"{}"),c=T.toCSP(p);localStorage.setItem("tbi.draft."+p.id,JSON.stringify(c));log("Draft saved for the CryptoSocial panel as tbi.draft."+p.id+" (your live panel was not changed).")};
  $("live").onclick=()=>{const req=T.casketRequest(p);if(window.RCASKET&&RCASKET.request){RCASKET.request(req);log("Sent one approval request to ЯCASKET.")}else{dl("casket-request.pending.json",JSON.stringify(req,null,1));log("ЯCASKET is not connected in this app; saved the request file instead. Nothing was signed.")}}}
 function dl(n,t){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([t]));a.download=n;a.click()}}
function esc(s){return String(s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c])}
window.TBI_PANEL={mount};
// R:\ prompt command (registers if the host shell exposes a command table)
const cmd={name:"IMPORT TWEETBACK",help:"Import an X/Twitter archive zip or Drive link into a GHOSTMACHINE profile draft",run:el=>mount(el||document.body.appendChild(document.createElement("div")))};
(window.R_COMMANDS=window.R_COMMANDS||{})["IMPORT TWEETBACK"]=cmd;if(window.RDOS&&RDOS.register)RDOS.register(cmd);
})();
