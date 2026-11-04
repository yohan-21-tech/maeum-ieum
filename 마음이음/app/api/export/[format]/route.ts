import{db}from'@/lib/db';import{secure,fail}from'@/lib/api';import{reveal}from'@/lib/crypto';
const escapeCsv=(s:string)=>'"'+s.replace(/"/g,'""')+'"';
const escapeIcs=(s:string)=>s.replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
export async function GET(req:Request,{params}:{params:Promise<{format:string}>}){const a=await secure(req,['teacher']);if('error'in a)return a.error;const{format}=await params;if(!['csv','ics'].includes(format))return fail('지원하지 않는 형식입니다.',404);
 const rows=await db.diaryEntry.findMany({where:{teacherId:a.user.id},include:{student:{select:{alias:true}}},orderBy:{date:'desc'}});
 if(format==='csv'){
 const csv='날짜,학생별칭,태그,내용,AI요약\r\n'+rows.map(d=>[d.date.toISOString().slice(0,10),d.student.alias,d.tags,reveal(d.content),reveal(d.aiSummary)].map(escapeCsv).join(',')).join('\r\n');
 return new Response('\uFEFF'+csv,{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="diaries.csv"'}});
 }
 const out=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//MAEUM//EN',...rows.flatMap(d=>['BEGIN:VEVENT',`UID:${d.id}@maeum`, `DTSTART;VALUE=DATE:${d.date.toISOString().slice(0,10).replace(/-/g,'')}`,`SUMMARY:${escapeIcs('교사 일지 - '+d.student.alias)}`,`DESCRIPTION:${escapeIcs(reveal(d.content))}`,'END:VEVENT']),'END:VCALENDAR'].join('\r\n');
 return new Response(out,{headers:{'Content-Type':'text/calendar; charset=utf-8','Content-Disposition':'attachment; filename="diaries.ics"'}});
}
