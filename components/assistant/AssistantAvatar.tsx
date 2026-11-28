import type {CSSProperties} from 'react';
import TonyWordmark from '../TonyWordmark';

export default function AssistantAvatar({size = 44}: {size?: number}) {
  return <span className="ta-avatar ta-avatar--tony" style={{'--ta-avatar': `${size}px`} as CSSProperties} aria-hidden="true">
    <TonyWordmark/>
  </span>;
}
