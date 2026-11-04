import {requirePageUser} from '@/lib/auth';import{Shell}from'@/components/shell';
export default async function DashboardLayout({children}:{children:React.ReactNode}){const user=await requirePageUser();return <Shell user={user}>{children}</Shell>}
