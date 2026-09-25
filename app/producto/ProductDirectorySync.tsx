'use client';
import {useEffect} from 'react';

export default function ProductDirectorySync(){
  useEffect(()=>{
    const reveal=()=>{
      const id=window.location.hash.slice(1);
      if(!id.startsWith('categoria-')&&!id.startsWith('opcion-'))return;
      const target=document.getElementById(id),category=target?.closest('details');
      if(category){category.open=true;requestAnimationFrame(()=>target?.scrollIntoView({block:'start',behavior:'instant'}));}
    };
    reveal();window.addEventListener('hashchange',reveal);window.addEventListener('popstate',reveal);
    return()=>{window.removeEventListener('hashchange',reveal);window.removeEventListener('popstate',reveal);};
  },[]);
  return null;
}
