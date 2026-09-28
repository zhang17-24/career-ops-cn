// Observed official request on 2026-09-10. No credentials, models or mock fallback.
export function parsePage(data) {
  if (data?.success !== true || data.statusCode !== 200 || !Array.isArray(data.data?.list)) throw new Error('小红书接口异常或结构变化');
  return data.data.list.filter(p => p && typeof p.positionName === 'string' && p.positionName.trim() && p.positionId != null && !(typeof p.positionId === 'number' && !Number.isSafeInteger(p.positionId)) && p.recruitStatus === 'in_recruitment').map(p => ({
    title:p.positionName, company:'小红书',
    url:'https://job.xiaohongshu.com/campus/position/'+encodeURIComponent(String(p.positionId)),
    location:typeof p.workplace === 'string' ? p.workplace : '',
    postedAt:p.publishTime ? Date.parse(p.publishTime) : undefined,
    description:[p.duty,p.qualification].filter(v=>typeof v==='string').join('\n').slice(0,4000)
  }));
}
export default { provider: { id:'company-dbbe8943-7e93-449c-bef8-1e820597a1e2', fetch:async(entry,ctx)=>{
  const jobs=[]; const max=Math.max(1,Math.min(Number(entry.max_pages)||1,10));
  for(let pageNum=1;pageNum<=max;pageNum++){
    const data=await ctx.fetchJson('https://job.xiaohongshu.com/websiterecruit/position/pageQueryPosition',{
      method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({positionName:'',pageNum,pageSize:10,recruitType:'campus',jobProjects:['campus_autumn_27']})
    });
    const page=parsePage(data); jobs.push(...page);
    if(data.data.list.length<10 || pageNum*10>=data.data.total) break;
  }
  return jobs;
}}};
