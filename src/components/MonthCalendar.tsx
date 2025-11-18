import React, { useState } from 'react';
import { IonButton } from '@ionic/react';

interface Props {
  value?: string; // YYYY-MM-DD
  onChange?: (date: string) => void;
}

const pad = (n: number) => (n < 10 ? '0' + n : '' + n);

const MonthCalendar: React.FC<Props> = ({ value, onChange }) => {
  const today = value ? new Date(value) : new Date();
  const [monthOffset, setMonthOffset] = useState(0);

  const base = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = base.getFullYear();
  const month = base.getMonth();

  const startDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: Array<string | null> = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(`${year}-${pad(month + 1)}-${pad(d)}`);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <IonButton size="small" onClick={() => setMonthOffset(m => m - 1)}>Prev</IonButton>
        <div style={{ fontWeight: 700 }}>{base.toLocaleString(undefined, { month: 'long' })} {year}</div>
        <IonButton size="small" onClick={() => setMonthOffset(m => m + 1)}>Next</IonButton>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(h => (
          <div key={h} style={{ textAlign: 'center', fontSize: 12, color: '#666' }}>{h}</div>
        ))}
        {cells.map((c, idx) => (
          <div key={idx} style={{ minHeight: 36 }}>
            {c ? (
              <button
                style={{ width: '100%', height: 36, borderRadius: 6, border: 'none', background: '#f4f5f8' }}
                onClick={() => onChange && onChange(c)}
              >
                {Number(c.split('-')[2])}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonthCalendar;
