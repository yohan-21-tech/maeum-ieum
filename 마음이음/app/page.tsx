import {redirect} from 'next/navigation';import{currentUser}from'@/lib/auth';
export default async function Index(){const user=await currentUser();redirect(user?'/home':'/login');}
