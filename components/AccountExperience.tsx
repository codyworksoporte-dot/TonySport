'use client';
import Link from 'next/link';
import {useRouter,useSearchParams} from 'next/navigation';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {accountRequest,authEnabled,restoreAccount,safeAccountReturn,useAccount} from '@/lib/auth';
import {TonyFace} from './TonyArt';
import './account.css';

type Mode='login'|'registro'|'recuperar'|'verify'|'reset'|'cambiar';
const headings:Record<Mode,string>={login:'INICIA SESIÓN.',registro:'TU CUENTA TONY.',recuperar:'RECUPERA TU ACCESO.',verify:'CONFIRMA TU CORREO.',reset:'UNA NUEVA CONTRASEÑA.',cambiar:'CAMBIA TU CONTRASEÑA.'};
export default function AccountExperience(){
  const queryParams=useSearchParams();
  const account=useAccount(),router=useRouter();const[mode,setMode]=useState<Mode>('login'),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[currentPassword,setCurrentPassword]=useState('');
  const[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState(''),[privateFocus,setPrivateFocus]=useState(false),[showPassword,setShowPassword]=useState(false),[returnTo,setReturnTo]=useState('/');
  const token=useRef(''),status=useRef<HTMLParagraphElement>(null),pending=useRef(false);
  useEffect(()=>{
    const fragment=new URLSearchParams(location.hash.slice(1));
    const action=fragment.get('accion')||queryParams.get('accion');if(action&&action in headings)setMode(action as Mode);
    setReturnTo(safeAccountReturn(queryParams.get('volver')));if(fragment.has('token'))token.current=fragment.get('token')||'';
    if(fragment.has('token'))history.replaceState(null,'',location.pathname+location.search);
  },[queryParams]);
  function switchMode(next:Mode){setMode(next);setError('');setMessage('');setPassword('');setCurrentPassword('');setShowPassword(false);const url=new URL(location.href);url.searchParams.set('accion',next);history.replaceState(null,'',url.pathname+url.search);}
  async function submit(event:FormEvent){
    event.preventDefault();if(pending.current)return;pending.current=true;setBusy(true);setError('');setMessage('');
    try{
      const action={login:'login',registro:'register',recuperar:'recover',verify:'verify',reset:'reset',cambiar:'change'}[mode];
      const result=await accountRequest(action,{email,password,currentPassword,token:token.current});
      setPassword('');setCurrentPassword('');setMessage(result.message||'Listo.');
      if(mode==='login'){router.replace(returnTo==='/'?'/cuenta':returnTo);setMessage('Ya iniciaste sesión.');}
      if(mode==='verify'||mode==='reset'||mode==='cambiar'){token.current='';setMode('login');}
    }catch(reason){setError(reason instanceof Error?reason.message:'No pudimos completar esta acción.');}
    finally{pending.current=false;setBusy(false);requestAnimationFrame(()=>status.current?.focus());}
  }
  async function resend(){if(pending.current)return;pending.current=true;setBusy(true);setError('');try{const result=await accountRequest('resend',{email});setMessage(result.message||'Revisa tu correo.');}catch(reason){setError(reason instanceof Error?reason.message:'No pudimos enviar el correo.');}finally{pending.current=false;setBusy(false);}}
  async function logout(){if(pending.current)return;pending.current=true;setBusy(true);setError('');try{await accountRequest('logout');setMode('login');setMessage('Sesión cerrada.');}catch(reason){setError(reason instanceof Error?reason.message:'No pudimos cerrar la sesión. Reintenta para cerrarla también en el servidor.');}finally{pending.current=false;setBusy(false);}}
  const loggedIn=account.status==='authenticated';
  const dashboard=loggedIn&&!['cambiar','verify','reset'].includes(mode);
  const needsPassword=mode==='login'||mode==='registro'||mode==='reset'||mode==='cambiar';
  return <section className="account-card section-wrap" data-private={privateFocus&&!showPassword} aria-busy={busy}>
    <TonyFace className="account-face"/><p className="eyebrow">TONY SPORTSWEAR · TU IDENTIDAD</p><h1>{dashboard?'TU EQUIPO EMPIEZA AQUÍ.':headings[mode]}</h1>
    {!authEnabled?<><p>El acceso con correo estará disponible cuando Tony active las cuentas. Mientras tanto, puedes explorar el catálogo y consultar con el equipo.</p><Link className="button primary" href="/colecciones">Explorar las colecciones ↗</Link><a className="text-link" href="https://wa.me/50370155571" target="_blank" rel="noopener noreferrer">Consultar por WhatsApp ↗</a></>:account.status==='loading'?<p role="status">Comprobando tu sesión…</p>:dashboard?<><p>Sesión iniciada como <strong className="account-email">{account.user?.email}</strong></p><Link className="button primary" href="/configurador">Crear mi uniforme ↗</Link><div className="account-options"><Link href="/carrito">Mi carrito</Link><Link href="/recientes">Mis recientes</Link><button type="button" onClick={()=>switchMode('cambiar')}>Cambiar contraseña</button><button type="button" disabled={busy} onClick={()=>void logout()}>Cerrar sesión</button></div><p className="account-note">Los diseños se guardan en este navegador y se separan por cuenta. No se sincronizan automáticamente entre dispositivos.</p></>:<>
      <p>{mode==='registro'?'Registra tu correo y confírmalo para crear uniformes y preparar pedidos.':mode==='recuperar'?'Te enviaremos un enlace para elegir una nueva contraseña.':mode==='verify'?'Confirma que este correo es tuyo para activar tu cuenta.':mode==='reset'?'Elige una frase segura que puedas recordar.':mode==='cambiar'?'Confirma tu contraseña actual para actualizarla.':'Explora sin registrarte. Inicia sesión para crear, guardar y pedir.'}</p>
      {mode==='cambiar'&&!loggedIn?<><p>Inicia sesión antes de cambiar la contraseña.</p><button type="button" className="button primary" onClick={()=>switchMode('login')}>Iniciar sesión</button></>:<form onSubmit={submit}>
        {['login','registro','recuperar'].includes(mode)&&<label>Correo electrónico<input type="email" autoComplete="email" inputMode="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@correo.com"/></label>}
        {mode==='cambiar'&&<label>Contraseña actual<input type="password" autoComplete="current-password" required value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} onFocus={()=>setPrivateFocus(true)} onBlur={()=>setPrivateFocus(false)}/></label>}
        {needsPassword&&<label><span id="account-password-label">{mode==='reset'||mode==='cambiar'?'Nueva contraseña':'Contraseña'}</span><div className="account-password"><input aria-labelledby="account-password-label" type={showPassword?'text':'password'} autoComplete={mode==='login'?'current-password':'new-password'} required minLength={mode==='login'?1:15} value={password} onChange={e=>setPassword(e.target.value)} onFocus={()=>setPrivateFocus(true)} onBlur={()=>setPrivateFocus(false)} aria-describedby={mode==='login'?undefined:'password-help'}/><button type="button" aria-pressed={showPassword} aria-label={showPassword?'Ocultar contraseña':'Mostrar contraseña'} onClick={()=>setShowPassword(value=>!value)}>{showPassword?'Ocultar':'Ver'}</button></div>{mode!=='login'&&<small id="password-help">Al menos 15 caracteres. Usa una frase; máximo 72 bytes (las tildes y emojis ocupan más).</small>}</label>}
        <button type="submit" className="button primary" disabled={busy||(mode==='verify'||mode==='reset')&&!token.current}>{busy?'Un momento…':mode==='login'?'Iniciar sesión':mode==='registro'?'Crear cuenta y verificar correo':mode==='recuperar'?'Enviar enlace de recuperación':mode==='verify'?'Confirmar mi correo':'Guardar nueva contraseña'}</button>
        {(mode==='verify'||mode==='reset')&&!token.current&&<p>Este enlace no contiene una clave válida. Solicita uno nuevo.</p>}
      </form>}
      <div className="account-options"><button type="button" disabled={busy} onClick={()=>switchMode(mode==='login'?'registro':'login')}>{mode==='login'?'Crear una cuenta':'Ya tengo cuenta · Iniciar sesión'}</button><button type="button" disabled={busy} onClick={()=>switchMode('recuperar')}>Olvidé mi contraseña</button>{mode==='registro'&&message&&<button type="button" disabled={busy||!email} onClick={()=>void resend()}>Reenviar confirmación</button>}</div>
      <Link className="account-note" href="/privacidad">Cómo cuidamos tus datos</Link>
    </>}
    <p ref={status} tabIndex={-1} role={error?'alert':'status'} className={`account-status${error?' is-error':''}`}>{error||message}</p>
    {account.error&&<p>{account.error} <button type="button" onClick={()=>void restoreAccount()}>Reintentar conexión</button></p>}
  </section>;
}
