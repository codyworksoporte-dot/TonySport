'use client';
import {useEffect, useRef, useState} from 'react';
import Link from 'next/link';
import {useAccount} from '@/lib/auth';
import {captureLocalPrivacyScope, eraseLocalPrivacyData} from '@/lib/privacy-storage';
import './privacy-controls.css';

export default function PrivacyControls() {
  const account = useAccount();
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [pendingPayment, setPendingPayment] = useState(false);
  const running = useRef(false);
  const startButton = useRef<HTMLButtonElement>(null), cancelButton = useRef<HTMLButtonElement>(null);
  const wasConfirming = useRef(false);
  const scope = captureLocalPrivacyScope();
  const confirming = confirmation === scope;
  useEffect(() => {
    if (confirming) cancelButton.current?.focus();
    else if (wasConfirming.current) startButton.current?.focus();
    wasConfirming.current = confirming;
  }, [confirming]);
  async function erase() {
    if (running.current || scope !== confirmation || scope !== captureLocalPrivacyScope()) return;
    running.current = true;
    setBusy(true);
    setNotice('');
    try {
      const result = await eraseLocalPrivacyData(scope);
      setPendingPayment(result.paymentPending);
      setNotice('Se borraron los borradores, los diseños del carrito y las referencias de pedidos guardados en este navegador.');
      setConfirmation(null);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'No se pudo completar el borrado. Inténtalo otra vez.');
    } finally {
      running.current = false;
      setBusy(false);
    }
  }
  return <div id="borrar-datos-locales" className="privacy-controls">
    <p>Este control borra de este navegador los borradores de pedidos y reseñas, las imágenes del editor, el carrito y las referencias de pedidos de {account.user ? 'tu cuenta' : 'la visita sin cuenta'}. Para borrar una cuenta o datos ya enviados a Tony, utiliza las opciones de esta página.</p>
    {confirming ? <>
      <p id="privacy-confirm-local">Descarga lo que quieras conservar y cierra las demás pestañas donde estés editando. El borrado es definitivo. Si tienes un pago en curso, se conservará la información necesaria para retomarlo en esta pestaña.</p>
      <div className="privacy-controls-actions">
        <button ref={cancelButton} type="button" className="button outline" disabled={busy} onClick={() => setConfirmation(null)}>Cancelar</button>
        <button type="button" className="button primary" aria-describedby="privacy-confirm-local" disabled={busy} onClick={() => void erase()}>{busy ? 'Borrando…' : 'Confirmar borrado local'}</button>
      </div>
    </> : <button ref={startButton} type="button" className="button outline" disabled={busy || account.status === 'loading'} onClick={() => {setNotice(''); setPendingPayment(false); setConfirmation(scope);}}>Borrar mis datos de este navegador</button>}
    <p role="status">{notice}{pendingPayment && <> Conservamos el acceso a tu pago en curso. <Link href="/configurador">Volver al pedido</Link>.</>}</p>
  </div>;
}
