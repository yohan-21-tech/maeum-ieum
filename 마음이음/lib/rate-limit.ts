// shortcut: per-process limit; use a shared gateway/Redis limit before multi-instance real-user deployment.
const buckets=new Map<string,{count:number;until:number}>();
export function allowRequest(key:string,max:number,windowMs=60_000,now=Date.now()){
 for(const [id,item] of buckets)if(item.until<=now)buckets.delete(id);
 const item=buckets.get(key);
 if(item&&item.count>=max)return false;
 if(item)item.count++;else{if(buckets.size>=10_000)return false;buckets.set(key,{count:1,until:now+windowMs});}
 return true;
}
