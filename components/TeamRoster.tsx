'use client';

import { useMemo, useState } from 'react';
import { playerComplete, SIZES, type OrderErrors, type Player } from '@/lib/order';
import Icon from './Icon';
import './team-roster.css';

type TeamRosterProps = {
  players: Player[];
  errors: OrderErrors;
  onChange: (players: Player[]) => void;
  onEditQuantity: () => void;
};

export default function TeamRoster({ players, errors, onChange, onEditQuantity }: TeamRosterProps) {
  const [bulkSize, setBulkSize] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const complete = players.filter(playerComplete).length;
  const emptySizes = players.filter(player => !player.size).length;
  const duplicates = useMemo(() => {
    const numbers = new Map<number, number[]>();
    players.forEach((player, index) => {
      if (!/^\d{1,2}$/.test(player.number)) return;
      const number = Number(player.number);
      numbers.set(number, [...(numbers.get(number) ?? []), index + 1]);
    });
    return [...numbers].filter(([, rows]) => rows.length > 1);
  }, [players]);

  function updatePlayer(index: number, change: Partial<Player>) {
    onChange(players.map((player, playerIndex) => playerIndex === index ? { ...player, ...change } : player));
  }

  function applySize() {
    if (!bulkSize || !emptySizes) return;
    onChange(players.map(player => player.size ? player : { ...player, size: bulkSize }));
    setAnnouncement(`Talla ${bulkSize} asignada a ${emptySizes} ${emptySizes === 1 ? 'jugador' : 'jugadores'}. Las tallas que ya habías elegido se conservaron.`);
  }

  return (
    <section className="team-roster" aria-labelledby="roster-heading">
      <header className="roster-heading">
        <div>
          <p className="roster-kicker">TU EQUIPO, NOMBRE POR NOMBRE</p>
          <h3 id="roster-heading">{players.length} jugadores. <em>Una identidad.</em></h3>
          <p className="roster-intro">Escribe cada nombre tal como irá en la prenda. Los porteros están incluidos en esta cantidad.</p>
        </div>
        <button type="button" className="roster-edit-quantity" onClick={onEditQuantity}>
          Cambiar cantidad <Icon name="arrow" />
        </button>
      </header>

      <div className="roster-progress-row">
        <span><strong>{complete}<span>/{players.length}</span></strong> jugadores completos</span>
        <progress max={Math.max(players.length, 1)} value={complete} aria-label={`${complete} de ${players.length} jugadores completos`} />
        {complete === players.length && players.length > 0 && <span className="roster-ready"><Icon name="check" /> Nómina lista</span>}
      </div>

      <div className="roster-bulk">
        <div>
          <label htmlFor="roster-bulk-size">¿Varios usan la misma talla?</label>
          <p>Asigna una talla a los espacios vacíos y ajusta cada jugador después.</p>
        </div>
        <div className="roster-bulk-controls">
          <select id="roster-bulk-size" value={bulkSize} onChange={event => setBulkSize(event.target.value)}>
            <option value="">Elegir talla</option>
            {SIZES.map(size => <option key={size} value={size}>{size}</option>)}
          </select>
          <button type="button" disabled={!bulkSize || emptySizes === 0} onClick={applySize}>Aplicar a tallas vacías <Icon name="plus" /></button>
        </div>
      </div>
      <p className="roster-announcement" role="status">{announcement}</p>

      {duplicates.length > 0 && (
        <div className="roster-duplicates" role="status">
          <span className="roster-warning-icon" aria-hidden="true">!</span>
          <div>
            <strong>Hay dorsales repetidos</strong>
            <p>{duplicates.map(([number, rows]) => `Dorsal ${number}: jugadores ${rows.join(', ')}`).join(' · ')}.</p>
            <p>Puedes continuar si es intencional; revisaremos esta información con tu equipo.</p>
          </div>
        </div>
      )}

      <div className={`roster-scroll${players.length > 8 ? ' roster-scroll-long' : ''}`}>
        <div className="roster-columns" aria-hidden="true">
          <span>#</span><span>Nombre en la prenda</span><span>Talla</span><span>Dorsal</span><span>Rol</span><span />
        </div>
        <ol className="roster-list">
          {players.map((player, index) => {
            const nameId = `player-${index}-name`;
            const sizeId = `player-${index}-size`;
            const numberId = `player-${index}-number`;
            const isComplete = playerComplete(player);
            return (
              <li key={player.id} className={`roster-player${isComplete ? ' roster-player-complete' : ''}`}>
                <div className="roster-player-index"><span className="roster-mobile-label">Jugador </span>{String(index + 1).padStart(2, '0')}</div>
                <div className="roster-field roster-name">
                  <label htmlFor={nameId}><span className="roster-field-label">Nombre en la prenda</span><span className="sr-only">Nombre del jugador {index + 1}</span></label>
                  <input id={nameId} aria-label={`Nombre del jugador ${index + 1}`} value={player.name} onChange={event => updatePlayer(index, { name: event.target.value })} maxLength={24} autoComplete="off" placeholder="Nombre o apellido" aria-invalid={Boolean(errors[nameId])} aria-describedby={errors[nameId] ? `${nameId}-error` : undefined} />
                  {errors[nameId] && <p className="roster-error" id={`${nameId}-error`}>{errors[nameId]}</p>}
                </div>
                <div className="roster-field roster-size">
                  <label htmlFor={sizeId}><span className="roster-field-label">Talla</span><span className="sr-only">Talla del jugador {index + 1}</span></label>
                  <select id={sizeId} aria-label={`Talla del jugador ${index + 1}`} value={player.size} onChange={event => updatePlayer(index, { size: event.target.value })} aria-invalid={Boolean(errors[sizeId])} aria-describedby={errors[sizeId] ? `${sizeId}-error` : undefined}>
                    <option value="">Elegir</option>
                    {SIZES.map(size => <option key={size} value={size}>{size}</option>)}
                  </select>
                  {errors[sizeId] && <p className="roster-error" id={`${sizeId}-error`}>{errors[sizeId]}</p>}
                </div>
                <div className="roster-field roster-number">
                  <label htmlFor={numberId}><span className="roster-field-label">Dorsal</span><span className="sr-only">Número del jugador {index + 1}</span></label>
                  <input id={numberId} aria-label={`Número del jugador ${index + 1}`} value={player.number} onChange={event => updatePlayer(index, { number: event.target.value.replace(/\D/g, '').slice(0, 2) })} inputMode="numeric" pattern="[0-9]{1,2}" maxLength={2} autoComplete="off" placeholder="0–99" aria-invalid={Boolean(errors[numberId])} aria-describedby={errors[numberId] ? `${numberId}-error` : undefined} />
                  {errors[numberId] && <p className="roster-error" id={`${numberId}-error`}>{errors[numberId]}</p>}
                </div>
                <div className="roster-field roster-role">
                  <label htmlFor={`player-${index}-role`}><span className="roster-field-label">Rol</span><span className="sr-only">Rol del jugador {index + 1}</span></label>
                  <select id={`player-${index}-role`} aria-label={`Rol del jugador ${index + 1}`} value={player.role} onChange={event => updatePlayer(index, { role: event.target.value === 'goalkeeper' ? 'goalkeeper' : 'field' })}>
                    <option value="field">Campo</option>
                    <option value="goalkeeper">Portero</option>
                  </select>
                </div>
                <span className="roster-player-status" aria-label={`Jugador ${index + 1} ${isComplete ? 'completo' : 'pendiente'}`} role="img">
                  {isComplete ? <Icon name="check" /> : <span aria-hidden="true" />}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      <div className="roster-footnote"><Icon name="shield" /><p>Un espacio por uniforme. Puedes volver a cambiar la cantidad sin perder los datos que ya escribiste.</p></div>
    </section>
  );
}
