'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {type ReactNode, useEffect, useState} from 'react';
import {authEnabled, useAccount} from '@/lib/auth';
import {TonyFace} from './TonyArt';
import './account.css';
export default function AccountGate({children,inline=false}:{children:ReactNode;inline?:boolean}){
  const account=useAccount(),path=usePathname();const[returnTo,setReturnTo]=useState(path);
  useEffect(()=>{setReturnTo(path+location.search+location.hash);},[path]);
  if(!authEnabled||account.status==='authenticated')return <div className="account-gate-content" key={account.user?.id||'guest'}>{children}</div>;
  const Heading=inline?'h2':'h1';
  const content=<section className="account-card section-wrap"><TonyFace className="account-face"/><p className="eyebrow">TU CUENTA TONY</p><Heading>ENTRA Y<br/><em>HAZLO TUYO.</em></Heading><p>Puedes explorar todos los productos. Para crear uniformes, guardar diseños o pedir, inicia sesión con tu correo.</p>{account.status==='loading'?<p role="status">Comprobando tu sesión…</p>:<><Link className="button primary" href={`/cuenta?volver=${encodeURIComponent(returnTo)}`}>Iniciar sesión o crear cuenta ↗</Link><Link className="text-link" href="/colecciones">Seguir explorando las colecciones ↗</Link>{account.error&&<p role="alert">{account.error}</p>}</>}</section>;
  return inline?content:<main id="contenido" className="internal-page account-page">{content}</main>;
}
