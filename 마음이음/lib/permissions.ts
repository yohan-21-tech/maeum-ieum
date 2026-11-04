export type Actor={id:string;role:'teacher'|'parent'};
export type SecureReport={teacherId:string;parentId:string|null;sharedWithParent:boolean};
export function mayReadReport(report:SecureReport,user:Actor){return report.teacherId===user.id&&user.role==='teacher'||user.role==='parent'&&report.parentId===user.id&&report.sharedWithParent;}
export function mayWriteReport(report:Pick<SecureReport,'teacherId'>,user:Actor){return user.role==='teacher'&&report.teacherId===user.id;}
export function mayMessageStudent(teacherId:string,parentId:string|null,user:Actor,other:Actor){
 return user.role==='teacher'&&other.role==='parent'&&teacherId===user.id&&parentId===other.id||user.role==='parent'&&other.role==='teacher'&&parentId===user.id&&teacherId===other.id;
}
