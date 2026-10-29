import json,time,urllib.request,datetime
RPC='https://api.mainnet-beta.solana.com';MINT='BB9uA5BuacDnWyDf5Npc9nMb9yFbyThsNrQPBYJ5Q1Lv';POOL='HSroUxVkVKv6kX9e7dpoJtbFqKcL76BzrkuuRfAGxs9s'
def rpc(m,p):
    for i in range(6):
        try:
            r=urllib.request.Request(RPC,json.dumps({"jsonrpc":"2.0","id":1,"method":m,"params":p}).encode(),{"Content-Type":"application/json"})
            j=json.load(urllib.request.urlopen(r,timeout=30))
            if 'error' in j: raise Exception(j['error'])
            return j['result']
        except Exception as e: time.sleep(2**i)
    return None
sigs={}
for a in (MINT,POOL):
    for s in rpc('getSignaturesForAddress',[a,{"limit":100}]) or []: sigs[s['signature']]=s
rows=[]
for sig,s in sorted(sigs.items(),key=lambda x:-(x[1].get('blockTime') or 0)):
    if s.get('err'): continue
    t=rpc('getTransaction',[sig,{"encoding":"jsonParsed","maxSupportedTransactionVersion":0}]);time.sleep(0.4)
    if not t: continue
    m=t['meta'];ins=[]
    for x in t['transaction']['message']['instructions']+[i for g in (m.get('innerInstructions') or []) for i in g['instructions']]:
        if isinstance(x.get('parsed'),dict): ins.append(x['parsed'])
    pre={(b['accountIndex']):b for b in m.get('preTokenBalances',[]) if b['mint']==MINT}
    post={(b['accountIndex']):b for b in m.get('postTokenBalances',[]) if b['mint']==MINT}
    d={}
    for k in set(pre)|set(post):
        b=post.get(k) or pre[k];v=float((post.get(k) or {}).get('uiTokenAmount',{}).get('uiAmount') or 0)-float((pre.get(k) or {}).get('uiTokenAmount',{}).get('uiAmount') or 0)
        if abs(v)>0: d[b.get('owner')]=d.get(b.get('owner'),0)+v
    types=[i.get('type') for i in ins]
    logs=' '.join(m.get('logMessages') or [])
    net=sum(d.values())
    if 'IncreaseLiquidity' in logs: ty='lp_add'
    elif 'DecreaseLiquidity' in logs: ty='lp_remove'
    elif net>1e-9 and any(x in ('mintTo','mintToChecked') for x in types): ty='mint'
    elif net<-1e-9: ty='burn'
    elif 'InitializePool' in logs or 'OpenPosition' in logs: ty='pool_setup'
    elif 'InitializeMint' in logs or 'initializeMint' in str(types): ty='create'
    elif 'Swap' in logs or 'swap' in logs.lower() and POOL in str(t['transaction']['message']['accountKeys']):
        fee=t['transaction']['message']['accountKeys'][0]['pubkey'];v=d.get(fee,0)
        ty='buy' if v>0 else 'sell' if v<0 else 'swap'
    elif any(x in ('transfer','transferChecked') for x in types) and d: ty='transfer'
    elif 'initializeMint' in str(types) or 'InitializeMint' in logs: ty='create'
    else: ty='other'
    if ty=='pool_setup' and d.get(POOL,0)>0: ty='lp_add'
    neg=[k for k,v in d.items() if v<0];pos=[k for k,v in d.items() if v>0]
    rows.append({"sig":sig,"time":t.get('blockTime'),"slot":t['slot'],"type":ty,"amount":round(max([abs(v) for v in d.values()] or [0]),6),"from":neg[0] if neg else None,"to":pos[0] if pos else None,"ix":sorted(set(__import__("re").findall(r"Instruction: (\w+)",logs)))[:6],"signer":t['transaction']['message']['accountKeys'][0]['pubkey']})
out={"schema":"rzl.botlatch.activity.v1","mint":MINT,"pool":POOL,"source":"Solana mainnet RPC getSignaturesForAddress + getTransaction(jsonParsed)","generated":datetime.datetime.now(datetime.timezone.utc).isoformat(),"signatures_seen":len(sigs),"rows":rows}
json.dump(out,open('rizal.info/botlatch/contracts/activity.json','w'),indent=1)
print(len(sigs),len(rows),{r['type'] for r in rows})
