'use client';
import {useEffect} from 'react';
import {useRouter} from 'next/navigation';

export default function CategoryAliases({paths}: {paths:Record<string,string>}) {
  const router = useRouter();
  useEffect(()=>{
    const follow = () => {
      const href = paths[window.location.hash.slice(1)];
      if (typeof href==='string') router.replace(href);
    };
    follow();
    window.addEventListener('hashchange',follow);
    return ()=>window.removeEventListener('hashchange',follow);
  },[router,paths]);
  return null;
}
