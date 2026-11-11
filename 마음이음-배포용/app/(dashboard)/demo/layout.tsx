import {redirect} from 'next/navigation';import {demoEnabled} from '@/lib/security';
// 정식 운영(ENABLE_DEMO=0)에서는 시나리오 데모 화면에 들어올 수 없다.
export default function DemoLayout({children}:{children:React.ReactNode}){if(!demoEnabled())redirect('/home');return children;}
