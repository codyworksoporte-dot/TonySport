'use client';

import {useEffect, useRef, useState} from 'react';
import {brandScreenLeather, brandScreenLogo, brandScreenWidth} from '@/lib/brand-screen';
import './brand-screen-art.css';

export default function BrandScreenArt({intro = false}: {intro?: boolean}) {
  const image = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (image.current?.complete && !image.current.naturalWidth) setFailed(true);
  }, []);

  return <div className="brand-screen-art" style={{background:brandScreenLeather}}>
    {failed
      ? <strong className="intro-wordmark-fallback">Tony <small>Sportswear</small></strong>
      : <img ref={image} src={brandScreenLogo} alt={intro ? 'Tony Sportswear' : ''} width="1108" height="643"
          style={{width:brandScreenWidth}} draggable={false} fetchPriority={intro ? 'high' : 'low'}
          onError={() => setFailed(true)}/>}
  </div>;
}
