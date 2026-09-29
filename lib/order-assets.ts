import {accountStorageKey} from './auth';
import type {DesignAssets} from './order';
import {isAssetKey} from './studio';

const DATABASE='tony-team-artwork-v1';
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(accountStorageKey(DATABASE),1);
    request.onupgradeneeded=()=>request.result.createObjectStore('artwork');
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
}
export async function loadAssets(): Promise<DesignAssets> {
  const db=await openDatabase();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('artwork','readonly');
    const request=tx.objectStore('artwork').get('current');
    request.onsuccess=()=>{
      const raw=request.result as DesignAssets|undefined;
      const assets:DesignAssets={};
      for(const key of Object.keys(raw || {}).filter(isAssetKey).slice(0,64)){
        const value=raw?.[key];
        if(typeof value==='string' && value.length<6_000_000 && /^data:image\/(png|jpeg|webp);base64,/.test(value))assets[key]=value;
      }
      resolve(assets);
    };
    request.onerror=()=>reject(request.error);
    tx.oncomplete=()=>db.close();
    tx.onabort=()=>{db.close();reject(tx.error);};
  });
}
export async function saveAssets(assets:DesignAssets): Promise<void> {
  const db=await openDatabase();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('artwork','readwrite');
    tx.objectStore('artwork').put(assets,'current');
    tx.oncomplete=()=>{db.close();resolve();};
    tx.onerror=()=>{db.close();reject(tx.error);};
    tx.onabort=()=>{db.close();reject(tx.error);};
  });
}
