import {z} from 'zod';
export const CONSENT_VERSION='2026-11-03';
export const consentSchema=z.object({privacy:z.literal(true),conversation:z.boolean(),emotion:z.boolean(),ai:z.boolean()}).strict();
export function consentRecord(value:z.infer<typeof consentSchema>){
 const now=new Date().toISOString();
 return {...value,version:CONSENT_VERSION,updatedAt:now,withdrawnAt:value.conversation&&value.emotion&&value.ai?null:now};
}
export function validAiConsent(json:string){
 try{const c=JSON.parse(json);return c.privacy===true&&c.conversation===true&&c.emotion===true&&c.ai===true&&c.version===CONSENT_VERSION&&typeof c.updatedAt==='string'&&Number.isFinite(Date.parse(c.updatedAt))&&c.withdrawnAt===null;}catch{return false;}
}
export function demoEnabled(){return process.env.ENABLE_DEMO==='1'&&(process.env.NODE_ENV!=='production'||process.env.ALLOW_PUBLIC_DEMO==='1');}
export const messageSchema=z.object({toId:z.string().min(1).max(100),original:z.string().trim().min(1).max(4000),refined:z.string().trim().min(1).max(4000).optional(),humanApproved:z.literal(true),confirmedWarning:z.boolean().optional()}).strict();
export const validDate=z.string().min(10).max(40).refine(v=>/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(v)&&Number.isFinite(Date.parse(v)),'유효한 날짜가 필요합니다.');
const summarySchema=z.object({summary:z.string().max(12000).optional(),verifiedFacts:z.array(z.string().max(6000)).max(50).optional(),unverifiedItems:z.array(z.string().max(2000)).max(50).optional(),timeline:z.array(z.object({date:z.string(),event:z.string()})).max(50).optional()}).passthrough().refine(v=>JSON.stringify(v).length<=30000);
export const reportPatchSchema=z.object({
 title:z.string().trim().min(2).max(120).optional(),content:z.string().trim().min(2).max(12000).optional(),
 checklistJson:z.array(z.object({id:z.string().max(100),question:z.string().max(2000),answer:z.string().max(4000),confirmed:z.boolean()}).strict()).max(50).refine(v=>JSON.stringify(v).length<=30000).optional(),
 aiReportJson:summarySchema.optional(),proposalsJson:z.array(z.object({id:z.string().max(100),title:z.string().max(200),body:z.string().max(6000),sources:z.array(z.object({id:z.string(),title:z.string(),url:z.string().url().optional()}).passthrough()).max(20).optional()}).passthrough()).max(20).refine(v=>JSON.stringify(v).length<=30000).optional(),
 chosenProposalId:z.string().max(100).nullable().optional(),status:z.enum(['draft','in_progress','resolved','reanalysis']).optional(),step:z.number().int().min(1).max(4).optional()
}).strict().refine(v=>Object.keys(v).length>0);
// Exclude raw teacher notes and private escalation drafts even after an explicit share.
export function parentReport<T extends {content:unknown;escalations?:unknown}>(report:T){return {...report,content:'',escalations:[]};}
