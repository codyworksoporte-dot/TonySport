'use client';

import { Children, cloneElement, isValidElement, useLayoutEffect, useRef, type HTMLAttributes, type ReactNode } from 'react';
import './reveal-text.css';

type Props = Omit<HTMLAttributes<HTMLHeadingElement>, 'children'> & { children: ReactNode; as?: 'h1' | 'h2' | 'h3' };

/** Splits text into words (kept unbreakable) and letters; emphasised words get the claw accent. */
function letters(nodes: ReactNode): ReactNode {
  return Children.map(nodes, node => {
    if (typeof node === 'string' || typeof node === 'number') {
      return String(node).split(/(\s+)/).map((word, index) => /^\s+$/.test(word) ? word : <span className="tony-reveal-word" key={index}>
        {[...word].map((letter, position) => <span className="tony-reveal-char" key={position}>{letter}</span>)}
      </span>);
    }
    if (isValidElement<{ children?: ReactNode; className?: string }>(node) && node.props.children !== undefined) {
      const accent = node.type === 'em' ? ` tony-reveal-accent${node.props.className ? ` ${node.props.className}` : ''}` : node.props.className;
      return cloneElement(node, { className: accent?.trim() }, letters(node.props.children));
    }
    return node;
  });
}

/**
 * A one-time letter-by-letter entrance for editorial headings: each letter rises
 * into place; on the main heading a claw stroke draws under the emphasised word. Screen readers
 * get the plain heading; server-rendered text stays readable without JavaScript.
 */
export default function RevealText({ children, as: Tag = 'h2', className = '', ...props }: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    const element = heading.current;
    if (!element) return;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const animations: Animation[] = [];
    let played = false;
    let inView = false;
    const effectsAllowed = () => !preference.matches && document.documentElement.dataset.tonyEffects !== 'off' && (() => {
      try { return localStorage.getItem('tony:ambient-effects:v1') !== 'off'; } catch { return true; }
    })();
    const finish = () => { animations.forEach(animation => animation.finish()); };
    const start = () => {
      if (!inView || played || !effectsAllowed() || document.hidden) return;
      const boot = (window as Window & { __tonyIntroBoot?: { pending: boolean } }).__tonyIntroBoot;
      // Wait for the intro, or for a section change to uncover the page.
      if (boot?.pending || document.querySelector('.lagarto-intro[open]') || document.documentElement.dataset.routeCover) return;
      played = true;
      const chars = [...element.querySelectorAll<HTMLElement>('.tony-reveal-char')];
      const step = Math.max(10, Math.min(24, 520 / Math.max(chars.length, 1)));
      chars.forEach((char, index) => {
        const tilt = index % 3 === 0 ? 7 : index % 3 === 1 ? -4 : 3;
        // Transform and opacity only: the compositor animates every letter without repainting it.
        animations.push(char.animate([
          { transform: `translate3d(0, 72%, 0) rotate(${tilt}deg) scale(.92)`, opacity: 0 },
          { transform: 'translate3d(0, -4%, 0) rotate(0deg) scale(1)', opacity: 1, offset: .7 },
          { transform: 'none', opacity: 1 },
        ], { duration: 640, delay: index * step, easing: 'cubic-bezier(.16, 1, .3, 1)', fill: 'backwards' }));
      });
      const settle = chars.length * step + 420;
      element.querySelectorAll<HTMLElement>('.tony-reveal-accent').forEach((accent, index) => {
        animations.push(accent.animate([{ '--claw': 0 }, { '--claw': 1 }] as Keyframe[], { duration: 520, delay: settle + index * 120, easing: 'cubic-bezier(.65, 0, .35, 1)', fill: 'backwards' }));
      });
    };
    const observer = new IntersectionObserver(entries => {
      inView = entries.some(entry => entry.isIntersecting);
      if (inView) start();
    }, { threshold: .15 });
    const rect = element.getBoundingClientRect();
    inView = rect.top < innerHeight * .95 && rect.bottom > 0;
    observer.observe(element);
    start();
    const preferenceChange = () => { if (!effectsAllowed()) finish(); else start(); };
    window.addEventListener('tony:intro-complete', start);
    window.addEventListener('tony:route-reveal', start);
    window.addEventListener('tony:effects-change', preferenceChange);
    preference.addEventListener('change', preferenceChange);
    return () => {
      observer.disconnect();
      animations.forEach(animation => animation.cancel());
      window.removeEventListener('tony:intro-complete', start);
      window.removeEventListener('tony:route-reveal', start);
      window.removeEventListener('tony:effects-change', preferenceChange);
      preference.removeEventListener('change', preferenceChange);
    };
  }, []);
  return <Tag {...props} ref={heading} className={`tony-reveal${Tag === 'h1' ? ' tony-reveal--signature' : ''} ${className}`}>
    <span className="sr-only">{children}</span>
    <span className="tony-reveal-visual" aria-hidden="true">{letters(children)}</span>
  </Tag>;
}
