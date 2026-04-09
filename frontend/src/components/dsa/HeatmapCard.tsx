import React from 'react';

export type HeatmapCardProps = {
  title: string;
  cells: number[];
  className?: string;
};

type HeatDay = { date: Date; value: number };

const fmtDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
const fmtMonth = new Intl.DateTimeFormat('en-US', { month: 'short' });

const colorFor = (value: number) => {
  if (value >= 4) return '#1B4332';
  if (value === 3) return '#40916C';
  if (value === 2) return '#74C69D';
  if (value === 1) return '#C7E9C0';
  return '#E5E7EB';
};

const addDays = (d: Date, delta: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + delta);
  return x;
};

const CELL = 10;
const GAP = 3;
const RADIUS = 2;

export const HeatmapCard: React.FC<HeatmapCardProps> = React.memo(({ title, cells, className }) => {
  const normalized = React.useMemo(() => {
    const last365 = cells.slice(-365);
    if (last365.length >= 365) return last365;
    return [...Array.from({ length: 365 - last365.length }, () => 0), ...last365];
  }, [cells]);

  const yearDays = React.useMemo<HeatDay[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = addDays(today, -364);
    return Array.from({ length: 365 }, (_, i) => ({ date: addDays(start, i), value: normalized[i] ?? 0 }));
  }, [normalized]);

  const leadingEmpty = React.useMemo(() => yearDays[0]?.date.getDay() ?? 0, [yearDays]);

  const padded = React.useMemo(() => {
    const empty: Array<HeatDay | null> = Array.from({ length: leadingEmpty }, () => null);
    return [...empty, ...yearDays];
  }, [leadingEmpty, yearDays]);

  const weeks = React.useMemo(() => {
    const weekCount = Math.ceil(padded.length / 7);
    return Array.from({ length: weekCount }, (_, w) => {
      const slice = padded.slice(w * 7, w * 7 + 7);
      return slice.length < 7 ? [...slice, ...Array.from({ length: 7 - slice.length }, () => null)] : slice;
    });
  }, [padded]);

  const monthLabels = React.useMemo(() => {
    const labels: Array<string | null> = [];
    let lastMonth: number | null = null;
    weeks.forEach((week) => {
      const first = week.find((d) => d !== null) as HeatDay | undefined;
      if (!first) {
        labels.push(null);
        return;
      }
      const month = first.date.getMonth();
      const shouldShow = (first.date.getDate() <= 7) && month !== lastMonth;
      labels.push(shouldShow ? fmtMonth.format(first.date) : null);
      if (shouldShow) lastMonth = month;
    });
    return labels;
  }, [weeks]);

  const total = React.useMemo(() => normalized.reduce((a, b) => a + b, 0), [normalized]);
  const activeDays = React.useMemo(() => normalized.filter((v) => v > 0).length, [normalized]);
  const maxStreak = React.useMemo(() => {
    let best = 0;
    let cur = 0;
    normalized.forEach((v) => {
      if (v > 0) {
        cur += 1;
        best = Math.max(best, cur);
      } else {
        cur = 0;
      }
    });
    return best;
  }, [normalized]);

  const [tooltip, setTooltip] = React.useState<null | {
    x: number;
    y: number;
    text: string;
  }>(null);

  const wrapperRef = React.useRef<HTMLDivElement | null>(null);

  return (
    <section
      className={[
        'bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-200',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Header stats */}
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold tracking-tight text-dt-text">{title}</h3>
        <div className="text-right">
          <div className="text-sm font-medium text-dt-text">{total} submissions in the past year</div>
          <div className="mt-0.5 text-sm text-dt-muted">{activeDays} active days • Max streak: {maxStreak}</div>
        </div>
      </div>

      {/* Heatmap grid — no horizontal scroll */}
      <div
        ref={wrapperRef}
        className="mt-4 relative"
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Month labels */}
        <div className="flex dt-fade-in" style={{ gap: GAP, marginBottom: 6 }}>
          {monthLabels.map((m, i) => (
            <div
              key={`m-${i}`}
              style={{ width: CELL, flexShrink: 0, overflow: 'visible' }}
              className="text-[10px] text-dt-muted leading-none whitespace-nowrap"
            >
              {m ?? ''}
            </div>
          ))}
        </div>

        {/* Grid of weeks x days */}
        <div className="flex dt-fade-in" style={{ gap: GAP }}>
          {weeks.map((week, weekIndex) => (
            <div key={`week-${weekIndex}`} className="flex flex-col" style={{ gap: GAP }}>
              {week.map((day, dayIndex) => {
                const value = day?.value ?? 0;
                return (
                  <div
                    key={`cell-${weekIndex}-${dayIndex}`}
                    onMouseEnter={(e) => {
                      if (!day) return;
                      const label = `${fmtDate.format(day.date)} — ${value} problem${value !== 1 ? 's' : ''} solved`;
                      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                      const host = wrapperRef.current?.getBoundingClientRect();
                      if (!host) return;
                      setTooltip({
                        x: rect.left - host.left + rect.width / 2,
                        y: rect.top - host.top,
                        text: label,
                      });
                    }}
                    style={{
                      width: CELL,
                      height: CELL,
                      borderRadius: RADIUS,
                      backgroundColor: colorFor(value),
                      flexShrink: 0,
                    }}
                    aria-label={day ? `${fmtDate.format(day.date)}: ${value} problems solved` : undefined}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Tooltip */}
        {tooltip ? (
          <div
            className="pointer-events-none absolute z-20"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <div className="-translate-x-1/2 -translate-y-3 rounded-md border border-black/5 bg-white px-2.5 py-1.5 text-xs font-medium text-dt-text shadow-sm whitespace-nowrap">
              {tooltip.text}
            </div>
          </div>
        ) : null}

        {/* Legend */}
        <div className="mt-3 flex justify-end items-center gap-2 text-xs text-dt-muted">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((v) => (
            <div
              key={`leg-${v}`}
              style={{ width: CELL, height: CELL, borderRadius: RADIUS, backgroundColor: colorFor(v) }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </section>
  );
});

HeatmapCard.displayName = 'HeatmapCard';
