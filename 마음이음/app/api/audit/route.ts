import {secure,ok} from '@/lib/api';
import {db} from '@/lib/db';
export async function GET(req:Request){
 const a=await secure(req);if('error'in a)return a.error;
 const logs=await db.auditLog.findMany({where:{userId:a.user.id},orderBy:{createdAt:'desc'},take:100,select:{id:true,action:true,detail:true,createdAt:true}});
 return ok({logs});
}
