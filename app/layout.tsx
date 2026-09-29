import type { Metadata } from 'next';
import localFont from 'next/font/local';
import Header from '@/components/Header';
import AccountProvider from '@/components/AccountProvider';
import CartFeedback from '@/components/CartFeedback';
import Footer from '@/components/Footer';
import LagartoIntroBootstrap from '@/components/LagartoIntroBootstrap';
import LagartoIntro from '@/components/LagartoIntro';
import AmbientExperience from '@/components/AmbientExperience';
import RouteTransition from '@/components/RouteTransition';
import './globals.css';
import '@/components/buttons.css';
import '@/components/section-images.css';
import '@/components/mobile-refinements.css';
const display=localFont({src:[{path:'../node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-700-normal.woff2',weight:'700',style:'normal'},{path:'../node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-700-italic.woff2',weight:'700',style:'italic'}],variable:'--font-display',display:'swap'});
const archivo=localFont({src:[{path:'../node_modules/@fontsource/archivo/files/archivo-latin-400-normal.woff2',weight:'400'},{path:'../node_modules/@fontsource/archivo/files/archivo-latin-600-normal.woff2',weight:'600'},{path:'../node_modules/@fontsource/archivo/files/archivo-latin-700-normal.woff2',weight:'700'}],variable:'--font-body',display:'swap'});
export const metadata: Metadata={title:{default:'TONY Sportswear · Tu equipo. Tu identidad.',template:'%s · TONY Sportswear'},description:'Uniformes deportivos y camisas full sublimadas en El Salvador. Dale forma a la identidad de tu equipo con Tony Sportswear.',robots:{index:false,follow:false}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es" data-scroll-behavior="smooth" className={`${display.variable} ${archivo.variable}`}><head><LagartoIntroBootstrap/></head><body><AccountProvider><a className="skip-link" href="#contenido">Saltar al contenido</a><Header/><CartFeedback/>{children}<Footer/><LagartoIntro/><AmbientExperience/><RouteTransition/></AccountProvider></body></html>}
