import { useState } from 'react';
import styles from './Form.module.css';

export default function MissionForm({ mission, onSubmit, onCancel }) {
  const [name, setName] = useState(mission?.name ?? '');
  const [defaultRate, setDefaultRate] = useState(
    mission?.defaultRate != null ? String(mission.defaultRate) : '15'
  );
  const [status, setStatus] = useState(mission?.status ?? 'active');
  const [notes, setNotes] = useState(mission?.notes ?? '');

  const trimmedName = name.trim();
  const parsedRate = Number(defaultRate);
  const valid = trimmedName.length > 0 && !Number.isNaN(parsedRate) && parsedRate >= 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!valid) return;
    onSubmit({
      name: trimmedName,
      defaultRate: parsedRate,
      status,
      notes: notes.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.field}>
        <label className={styles.label}>Nom de la mission</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ex : Elite Coaching"
          autoFocus
          required
        />
      </div>

      <div className={styles.row2}>
        <div className={styles.field}>
          <label className={styles.label}>Taux par défaut</label>
          <div className={styles.suffixWrap}>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={defaultRate}
              onChange={(e) => setDefaultRate(e.target.value)}
              required
            />
            <span className={styles.suffix}>%</span>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Statut</label>
          <div className={styles.segmented} role="radiogroup">
            <button
              type="button"
              role="radio"
              aria-checked={status === 'active'}
              className={`${styles.segBtn} ${status === 'active' ? styles.segBtnActive : ''}`}
              onClick={() => setStatus('active')}
            >
              Active
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={status === 'completed'}
              className={`${styles.segBtn} ${status === 'completed' ? styles.segBtnActive : ''}`}
              onClick={() => setStatus('completed')}
            >
              Terminée
            </button>
          </div>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Notes</label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Informations complémentaires (facultatif)"
        />
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.ghostBtn} onClick={onCancel}>
          Annuler
        </button>
        <button type="submit" className={styles.primaryBtn} disabled={!valid}>
          {mission ? 'Enregistrer' : 'Créer la mission'}
        </button>
      </div>
    </form>
  );
}
