'use client';

import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/Icon';

type InstallPrompt = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

export default function InstallWebsite() {
  const prompt = useRef<InstallPrompt | null>(null);
  const guide = useRef<HTMLDialogElement>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)');
    const sync = () => setInstalled(standalone.matches || Boolean((navigator as Navigator & {standalone?: boolean}).standalone));
    const remember = (event: Event) => { event.preventDefault(); prompt.current = event as InstallPrompt; };
    const done = () => { prompt.current = null; setInstalled(true); guide.current?.close(); };
    sync();
    standalone.addEventListener('change', sync);
    window.addEventListener('beforeinstallprompt', remember);
    window.addEventListener('appinstalled', done);
    return () => {
      standalone.removeEventListener('change', sync);
      window.removeEventListener('beforeinstallprompt', remember);
      window.removeEventListener('appinstalled', done);
    };
  }, []);

  async function install() {
    const invitation = prompt.current;
    if (!invitation) { guide.current?.showModal(); return; }
    prompt.current = null;
    try { await invitation.prompt(); await invitation.userChoice; }
    catch { guide.current?.showModal(); }
  }

  if (installed) return null;
  return <>
    <button className="home-install" type="button" onClick={install}><Icon name="download" size={17}/>Instalar esta web</button>
    <dialog ref={guide} className="home-install-guide" aria-labelledby="install-title"
      onClick={event => { if (event.target === event.currentTarget) guide.current?.close(); }}>
      <div>
        <button type="button" aria-label="Cerrar instrucciones" className="home-circle" onClick={() => guide.current?.close()}><Icon name="close"/></button>
        <h2 id="install-title">Instalá la web de Tony</h2>
        <p><strong>iPhone o iPad</strong>En Safari, tocá Compartir y luego Agregar a inicio.</p>
        <p><strong>Android</strong>En el menú del navegador, elegí Instalar aplicación o Agregar a la pantalla principal.</p>
        <p><strong>Computadora</strong>Buscá la opción de instalar esta página en la barra de direcciones o en el menú de tu navegador.</p>
        <a href="#app-tony" onClick={() => guide.current?.close()}>Ver la app para Android y iPhone <Icon name="down" size={17}/></a>
      </div>
    </dialog>
  </>;
}
