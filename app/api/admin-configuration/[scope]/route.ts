import { NextResponse } from 'next/server';import { authFetch,getVerifiedUser,isSameOrigin } from '@/lib/auth-server';
async function proxy(request:Request,context:{params:Promise<{scope:string}>}){
 const {scope}=await context.params,method=request.method;
 if(!['base','student','staff','lesson-plan','language','notification','email','sms','payment'].includes(scope))return NextResponse.json({message:'Unknown configuration profile'},{status:404});
 if(method!=='GET'&&!isSameOrigin(request))return NextResponse.json({message:'Cross-origin request denied'},{status:403});
 try{const {user,accessToken}=await getVerifiedUser();if(!user)return NextResponse.json({message:'Unauthenticated'},{status:401});if(user.role!=='admin')return NextResponse.json({message:'Admin access required'},{status:403});let body:string|undefined;if(method==='PUT'){try{body=JSON.stringify(await request.json());}catch{return NextResponse.json({message:'Invalid JSON'},{status:400});}}const result=await authFetch('/admin-configuration/'+scope,{method,body,headers:{Authorization:`Bearer ${accessToken}`,...(body?{'Content-Type':'application/json'}:{})}});return NextResponse.json(await result.json(),{status:result.status,headers:{'Cache-Control':'no-store'}});}catch{return NextResponse.json({message:'Configuration temporarily unavailable. Please retry.'},{status:503});}
}
export const GET=proxy,PUT=proxy;
