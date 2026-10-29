/* rzl-wasm adapter 1.0.0: replaces the /engine fetch of rzl-llama-direct with llama.cpp running in this browser (wllama, WebAssembly).
   No key, no login, no server. The model comes once from Hugging Face (pinned revision), is sha256-checked here, and is kept
   in this browser's own storage (OPFS, or Cache API as fallback) so later visits work offline. */
import { Wllama } from "../../vendor/wllama/index.js";
const MODEL = {
  url: "https://huggingface.co/unsloth/granite-4.0-h-1b-GGUF/resolve/74f5511840300fdee7c70ccfc5bd57ecde0c8bbc/granite-4.0-h-1b-Q4_K_M.gguf",
  name: "granite-4.0-h-1b-Q4_K_M.gguf",
  size: 901162560,
  sha256: "fd3b85f09520df9d898e2bbcf5da22fc518dbf9d662bb52e214d946c72aafacc"
};
const CFG = { n_ctx: 4096, max_tokens: 256, temperature: 0.7 };           // same as the Linux launcher (-c 4096) + adapter
const q = new URLSearchParams(location.search);
if (q.get("model")) { MODEL.url = new URL(q.get("model"), location.href).href; }   // test/mirror override; sha still enforced

/* ---- streaming SHA-256 (no dependency) ---- */
const K = new Uint32Array([0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);
class Sha256 {
  constructor(){ this.h=new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]); this.buf=new Uint8Array(64); this.n=0; this.len=0; this.w=new Uint32Array(64); }
  blk(d,o){ const w=this.w,h=this.h; for(let i=0;i<16;i++){w[i]=(d[o+4*i]<<24)|(d[o+4*i+1]<<16)|(d[o+4*i+2]<<8)|d[o+4*i+3];}
    for(let i=16;i<64;i++){const a=w[i-15],b=w[i-2];w[i]=(((a>>>7)|(a<<25))^((a>>>18)|(a<<14))^(a>>>3))+w[i-7]+(((b>>>17)|(b<<15))^((b>>>19)|(b<<13))^(b>>>10))+w[i-16]|0;}
    let A=h[0],B=h[1],C=h[2],D=h[3],E=h[4],F=h[5],G=h[6],H=h[7];
    for(let i=0;i<64;i++){const t1=H+(((E>>>6)|(E<<26))^((E>>>11)|(E<<21))^((E>>>25)|(E<<7)))+((E&F)^(~E&G))+K[i]+w[i]|0;const t2=(((A>>>2)|(A<<30))^((A>>>13)|(A<<19))^((A>>>22)|(A<<10)))+((A&B)^(A&C)^(B&C))|0;H=G;G=F;F=E;E=D+t1|0;D=C;C=B;B=A;A=t1+t2|0;}
    h[0]+=A;h[1]+=B;h[2]+=C;h[3]+=D;h[4]+=E;h[5]+=F;h[6]+=G;h[7]+=H; }
  update(d){ let o=0; this.len+=d.length; if(this.n){const k=Math.min(64-this.n,d.length);this.buf.set(d.subarray(0,k),this.n);this.n+=k;o=k;if(this.n<64)return;this.blk(this.buf,0);this.n=0;}
    for(;o+64<=d.length;o+=64)this.blk(d,o); if(o<d.length){this.buf.set(d.subarray(o),0);this.n=d.length-o;} }
  hex(){ const bits=this.len*8, pad=new Uint8Array(((this.n<56)?56:120)-this.n+8); pad[0]=0x80; const dv=new DataView(pad.buffer); dv.setUint32(pad.length-8,Math.floor(bits/2**32)); dv.setUint32(pad.length-4,bits>>>0); this.update(pad);
    return Array.from(this.h,x=>(x>>>0).toString(16).padStart(8,"0")).join(""); }
}

/* ---- storage: OPFS first, Cache API fallback ---- */
const VERIFIED_KEY = "ds-model-verified";       // stores only the sha256 string, no personal data
async function opfsDir(){ try{ if(!navigator.storage||!navigator.storage.getDirectory) return null; return await navigator.storage.getDirectory(); }catch(e){ return null; } }
async function cached(){
  if (localStorage.getItem(VERIFIED_KEY) !== MODEL.sha256) return null;
  const dir = await opfsDir();
  if (dir) { try{ const f = await (await dir.getFileHandle(MODEL.name)).getFile(); if (f.size === MODEL.size) return f; }catch(e){} }
  try{ const c = await caches.open("dragon-skull-model-v1"); const r = await c.match(MODEL.url); if (r) { const b = await r.blob(); if (b.size === MODEL.size) return b; } }catch(e){}
  return null;
}
async function roomFor(n){ try{ const e = await navigator.storage.estimate(); return (e.quota - e.usage) > n * 1.05; }catch(e){ return true; } }
async function download(onp, noStore){
  if (navigator.storage && navigator.storage.persist) { try{ await navigator.storage.persist(); }catch(e){} }
  const total = MODEL.size, sha = new Sha256();
  const dir = (noStore || !(await roomFor(MODEL.size))) ? null : await opfsDir(); let fh = null, wr = null, mem = null;
  if (dir) { try{ fh = await dir.getFileHandle(MODEL.name + ".part", { create: true }); wr = await fh.createWritable(); }catch(e){ wr = null; } }
  if (!wr) mem = [];
  let got = 0, fails = 0;
  while (got < total) {                                    // resumes with HTTP Range after dropped connections (mobile / flaky networks)
    try {
      const h = got ? { Range: "bytes=" + got + "-" } : {};
      const r = await fetch(MODEL.url, { credentials: "omit", referrerPolicy: "no-referrer", headers: h, cache: "no-store" });
      if (!(r.status === 200 && got === 0) && r.status !== 206) throw new Error("model download HTTP " + r.status);
      const rd = r.body.getReader();
      for (;;) { const { done, value } = await rd.read(); if (done) break; sha.update(value); got += value.length;
        if (wr) await wr.write(value); else mem.push(value); onp && onp({ phase: "download", loaded: got, total }); fails = 0; }
      if (got < total) throw new Error("connection ended early");
    } catch (e) {
      if (e && e.name === "QuotaExceededError" && wr) {            // browser storage full: retry once without saving (works, but downloads again next visit)
        try{ await wr.abort(); }catch(_){} try{ await dir.removeEntry(MODEL.name + ".part"); }catch(_){}
        onp && onp({ phase: "nostore" }); return download(onp, true);
      }
      if (++fails > 12) { if (wr) { try{ await wr.abort(); }catch(_){} } throw new Error("download failed: " + e.message); }
      onp && onp({ phase: "download", loaded: got, total, retry: fails });
      await new Promise(s => setTimeout(s, Math.min(15000, 500 * 2 ** fails)));
    }
  }
  onp && onp({ phase: "verify", loaded: got, total });
  const hex = sha.hex();
  if (got !== MODEL.size || hex !== MODEL.sha256) {
    if (wr) { try{ await wr.abort(); }catch(e){} try{ await dir.removeEntry(MODEL.name + ".part"); }catch(e){} }
    throw new Error("model check failed (size " + got + ", sha256 " + hex.slice(0,12) + "…): refusing to run");
  }
  let file;
  if (wr) { await wr.close(); try{ await fh.move(MODEL.name); fh = await dir.getFileHandle(MODEL.name); }catch(e){ /* move unsupported: keep .part name */ }
    file = await fh.getFile(); }
  else { file = new Blob(mem); mem = null; if (!noStore && await roomFor(MODEL.size)) { try{ const c = await caches.open("dragon-skull-model-v1"); await c.put(MODEL.url, new Response(file)); }catch(e){} } else { onp && onp({ phase: "nostore" }); return { file, fresh: true }; } }
  localStorage.setItem(VERIFIED_KEY, MODEL.sha256);
  return { file, fresh: true };
}

/* ---- engine ---- */
let wll = null, ready = false, loading = null; const hist = [];
async function load(onp){
  if (ready) return { fresh: false };
  if (loading) return loading;
  loading = (async () => {
    let file = await cached(), fresh = false;
    if (!file) { const d = await download(onp); file = d.file; fresh = true; }
    onp && onp({ phase: "engine" });
    wll = new Wllama({ default: new URL("../../vendor/wllama/wllama.wasm", import.meta.url).href }, { suppressNativeLog: true });
    const gpu = q.get("gpu") === "1";                                    // CPU by default; WebGPU opt-in (?gpu=1)
    const p = { n_ctx: CFG.n_ctx, n_gpu_layers: gpu ? 999 : 0 };
    if (q.get("threads")) p.n_threads = Math.max(1, +q.get("threads") | 0);
    await wll.loadModel([file], p);
    ready = true; onp && onp({ phase: "ready", threads: wll.getNumThreads ? wll.getNumThreads() : 1, multithread: wll.isMultithread ? wll.isMultithread() : false });
    return { fresh };
  })();
  try { return await loading; } finally { loading = null; }
}
async function chat(bot, text, onToken){
  if (!ready) throw new Error("model not loaded yet");
  hist.push({ role: "user", content: String(text) });
  // system prompt: verbatim from the DRAGON SKULL 1.0.0 Linux adapter (plugins/rzl-llama-direct/llama-direct.js)
  const msgs = [{ role: "system", content: `You are ${bot.name}, a helpful local bot (ID ${bot.rid}) running offline. Answer briefly.` }].concat(hist.slice(-8));
  document.dispatchEvent(new CustomEvent("thundr-adapter", { detail: { bot: bot.rid, state: "thinking" } }));
  const t0 = performance.now(); let first = null, out = "";
  try {
    await wll.createChatCompletion({ messages: msgs, max_tokens: CFG.max_tokens, temperature: CFG.temperature, stream: true,
      onData: (c) => { const d = c && c.choices && c.choices[0] && c.choices[0].delta && c.choices[0].delta.content; if (d) { if (first === null) first = performance.now() - t0; out += d; onToken && onToken(out); } } });
  } catch (e) { document.dispatchEvent(new CustomEvent("thundr-adapter", { detail: { bot: bot.rid, state: "error" } })); hist.pop(); throw e; }
  const t = out.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  hist.push({ role: "assistant", content: t });
  window.RZL_WASM.last = { ttft_ms: first, total_ms: performance.now() - t0, chars: t.length };
  document.dispatchEvent(new CustomEvent("thundr-adapter", { detail: { bot: bot.rid, state: "idle" } }));
  return t;
}
async function forget(){ localStorage.removeItem(VERIFIED_KEY); const dir = await opfsDir(); if (dir) { for (const n of [MODEL.name, MODEL.name + ".part"]) { try{ await dir.removeEntry(n); }catch(e){} } } try{ await caches.delete("dragon-skull-model-v1"); }catch(e){} }
window.RZL_WASM = { version: "1.0.0", model: MODEL, load, chat, forget, isCached: async () => !!(await cached()), get ready(){ return ready; } };
document.dispatchEvent(new Event("rzl-wasm-ready"));
