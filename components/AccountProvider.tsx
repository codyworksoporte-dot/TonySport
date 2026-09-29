'use client';
import {useEffect, type ReactNode} from 'react';
import {authEnabled, forgetAccount, restoreAccount, useAccount} from '@/lib/auth';
export default function AccountProvider({children}:{children:ReactNode}) {
  const account=useAccount();
  useEffect(()=>{
    if(!authEnabled)return;
    void restoreAccount();
    const visible=()=>{if(document.visibilityState==='visible')void restoreAccount();};
    document.addEventListener('visibilitychange',visible);
    return()=>document.removeEventListener('visibilitychange',visible);
  },[]);
  useEffect(()=>{
    if(!account.expiresAt)return;
    const timeout=window.setTimeout(forgetAccount,Math.max(0,account.expiresAt*1000-Date.now()));
    return()=>clearTimeout(timeout);
  },[account.expiresAt]);
  return children;
}
