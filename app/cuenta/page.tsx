import type {Metadata} from 'next';
import {Suspense} from 'react';
import AccountExperience from '@/components/AccountExperience';
export const metadata:Metadata={title:'Mi cuenta · Tony Sportswear',referrer:'no-referrer'};
export default function AccountPage(){return <main id="contenido" className="internal-page account-page"><Suspense fallback={<p role="status">Cargando tu cuenta…</p>}><AccountExperience/></Suspense></main>;}
