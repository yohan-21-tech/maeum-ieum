import{db}from'@/lib/db';import{secure,ok}from'@/lib/api';import{reveal}from'@/lib/crypto';
export async function GET(req:Request){const a=await secure(req);if('error'in a)return a.error;
 const where=a.user.role==='teacher'?{teacherId:a.user.id}:{parentId:a.user.id,sharedWithParent:true,humanApprovedAt:{not:null}};
 const links=await db.student.findMany({where:a.user.role==='teacher'?{teacherId:a.user.id}:{parentId:a.user.id},select:{teacherId:true,parentId:true}});
 const counterpartIds=[...new Set(links.map(s=>a.user.role==='teacher'?s.parentId:s.teacherId).filter((id):id is string=>!!id))];
 const [reports,diaries,messages,demo,other]=await Promise.all([
  db.report.findMany({where,orderBy:{updatedAt:'desc'},take:5,select:{id:true,title:true,status:true,step:true,sharedWithParent:true,updatedAt:true}}),
  a.user.role==='teacher'?db.diaryEntry.findMany({where:{teacherId:a.user.id},orderBy:{date:'desc'},take:3,select:{id:true,content:true,date:true}}):Promise.resolve([]),
  db.message.count({where:{toId:a.user.id}}),
  db.demoState.findUnique({where:{id:'main'}}),
  db.user.findMany({where:{id:{in:counterpartIds}},select:{id:true,name:true,role:true}})
 ]);
 return ok({reports,diaries:diaries.map(x=>({...x,content:reveal(x.content)})),messageCount:messages,demoStage:demo?.stage||0,contacts:other});}
