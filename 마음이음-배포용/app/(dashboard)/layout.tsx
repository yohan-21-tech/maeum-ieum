import {requirePageUser} from '@/lib/auth';import{Shell}from'@/components/shell';import{demoEnabled}from'@/lib/security';
export default async function DashboardLayout({children}:{children:React.ReactNode}){const user=await requirePageUser();return <Shell user={user} demo={demoEnabled()}>{children}</Shell>}
