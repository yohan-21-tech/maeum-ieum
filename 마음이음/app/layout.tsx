import './globals.css';
import type {Metadata} from 'next';
export const metadata:Metadata={title:'마음이음 | 교사·학부모 소통',description:'초등교사·학부모의 협력적 소통을 돕는 AI 지원 서비스 데모'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ko"><body>{children}</body></html>;}
