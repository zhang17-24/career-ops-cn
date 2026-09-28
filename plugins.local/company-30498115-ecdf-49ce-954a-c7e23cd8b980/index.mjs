// Official API observed 2026-09-11; internet 2027 campus only.
export function parsePage(d) {
 if(d?.code!==200||!Array.isArray(d.data?.list)) throw new Error('网易接口异常或结构变化');
 return d.data.list.map(p=>{
  if(!p||typeof p.positionName!=='string'||!p.positionName.trim()||!/^\d+$/.test(String(p.id))||(typeof p.id==='number'&&!Number.isSafeInteger(p.id))||String(p.projectId)!=='103') throw new Error('网易岗位字段异常');
  return {title:p.positionName,company:'网易',url:'https://campus.163.com/app/detail/index?id='+p.id+'&projectId=103',location:typeof p.workPlaceName==='string'?p.workPlaceName:'',postedAt:typeof p.updateTime==='number'&&Number.isFinite(p.updateTime)?p.updateTime:undefined,description:[p.positionDescription,p.positionRequirement].filter(v=>typeof v==='string').join('\n').slice(0,4000)};
 });
}
export default {provider:{id:'company-30498115-ecdf-49ce-954a-c7e23cd8b980',fetch:async(entry,ctx)=>{
 const jobs=[];const max=Math.max(1,Math.min(Math.floor(Number(entry.max_pages)||1),10));
 for(let page=1;page<=max;page++){
  const d=await ctx.fetchJson('https://campus.163.com/api/campuspc/position/getJobList?pageSize=10&currentPage='+page+'&projectId=103');
  jobs.push(...parsePage(d));
  if(d.data.list.length<10||page*10>=d.data.total) break;
 }
 return [...new Map(jobs.map(j=>[j.url,j])).values()];
}}};
