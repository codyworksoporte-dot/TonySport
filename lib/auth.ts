'use client';
import {useSyncExternalStore} from 'react';

const base = (process.env.NEXT_PUBLIC_TONY_API_BASE || '').replace(/\/+$/, '');
export const authEnabled = process.env.NEXT_PUBLIC_TONY_AUTH_ENABLED === 'true' && !!base;
const tokenKey = 'tony:account:token:v1', event = 'tony:account-changed';
export type AccountUser = {id:string;email:string};
type AuthState = {user:AccountUser|null;status:'loading'|'guest'|'authenticated';error:string;expiresAt:number};
const initial:AuthState = {user:null,status:authEnabled?'loading':'guest',error:'',expiresAt:0};
let state:AuthState = initial, memoryToken = '', pending:Promise<void>|null = null;
type AuthResponse = {ok:boolean;error?:string;message?:string;token?:string;user?:AccountUser;expiresAt?:number};
function notify(next:AuthState) {
  state=next;
  if(typeof window!=='undefined') for(const name of [event,'tony:cart-changed','tony-pedido-updated']) window.dispatchEvent(new Event(name));
}
export function accountToken() {try{return sessionStorage.getItem(tokenKey)||memoryToken;}catch{return memoryToken;}}
// A payment return must recover the account token after this page reloads.
export function accountTokenPersisted(token:string):boolean {
  try{return !!token && sessionStorage.getItem(tokenKey)===token;}catch{return false;}
}
export function forgetAccount() {
  memoryToken='';try{sessionStorage.removeItem(tokenKey);}catch{/* Memory-only sessions. */}
  notify({user:null,status:'guest',error:'',expiresAt:0});
}
export function accountStorageKey(key:string) {return authEnabled ? `${key}:account:${state.user?.id||'signed-out'}` : key;}
export async function accountRequest(action:string, data:Record<string,string> = {}):Promise<AuthResponse> {
  if(!authEnabled) throw new Error('Las cuentas estarán disponibles cuando Tony active el servicio de correo. Puedes seguir explorando y consultar con el equipo.');
  const url=new URL(`${base}/auth.php`);
  if(url.username||url.password||(url.protocol!=='https:'&&!(url.protocol==='http:'&&['localhost','127.0.0.1'].includes(url.hostname)))) throw new Error('La conexión de cuentas debe ser segura.');
  const headers:Record<string,string>={'Content-Type':'application/json'};
  const token=accountToken();if(token)headers.Authorization=`Bearer ${token}`;
  const response=await fetch(url,{method:'POST',body:JSON.stringify({...data,action}),headers,credentials:'omit',redirect:'error',cache:'no-store',signal:AbortSignal.timeout(20000)});
  let result:AuthResponse;try{result=await response.json();}catch{throw new Error('No pudimos conectar con las cuentas de Tony. Inténtalo más tarde.');}
  if(!result||typeof result!=='object'||Array.isArray(result))throw new Error('El servicio de cuentas no respondió correctamente.');
  // A slow session check must never restore a session after logout or replace a newer login.
  if(action==='session'&&token!==accountToken())return {ok:true};
  if(!response.ok||result.ok!==true){if(response.status===401&&action!=='login')forgetAccount();throw new Error(result.error||'No pudimos completar la solicitud.');}
  if(action==='login'||action==='session'){
    if(!result.user||!/^[a-f0-9]{32}$/.test(result.user.id)||!result.expiresAt||result.expiresAt*1000<=Date.now()) throw new Error('El servicio no confirmó una sesión válida.');
    if(action==='login'){
      if(!result.token||!/^[a-f0-9]{64}$/.test(result.token))throw new Error('El servicio no confirmó el acceso.');
      memoryToken=result.token;try{sessionStorage.setItem(tokenKey,memoryToken);}catch{/* Keep the token in memory. */}
    }
    notify({user:result.user,status:'authenticated',error:'',expiresAt:result.expiresAt});
  }
  if(['logout','change','reset'].includes(action))forgetAccount();
  return result;
}
export function restoreAccount():Promise<void> {
  if(!authEnabled)return Promise.resolve();
  if(pending)return pending;
  if(!accountToken()){forgetAccount();return Promise.resolve();}
  pending=accountRequest('session').then(()=>{}).catch(error=>{
    notify({user:null,status:'guest',expiresAt:0,error:error instanceof Error?error.message:'No pudimos comprobar tu sesión.'});
  }).finally(()=>{pending=null;});
  return pending;
}
const subscribe=(listener:()=>void)=>{window.addEventListener(event,listener);return()=>window.removeEventListener(event,listener);};
export function useAccount(){return useSyncExternalStore(subscribe,()=>state,()=>initial);}
export function safeAccountReturn(value:string|null) {
  if(!value||!/^\/(configurador(?:\/archivo)?|carrito|recientes|resenas)(?:[/?#]|$)/.test(value)||value.includes('\\'))return '/';
  return value;
}
