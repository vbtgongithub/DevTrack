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

const CELL = 8;
const GAP = 2;
const RADIUS = 1;

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
        'bg-white/40 backdrop-blur-2xl border border-dt-primary/10 rounded-2xl p-4 sm:p-5 shadow-dt-card group/heatmap',
        'hover:shadow-dt-floating hover:-translate-y-0.5 transition-all duration-500 relative overflow-hidden',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="absolute top-0 right-0 w-[250px] h-[250px] bg-dt-primary/5 rounded-full blur-[60px] pointer-events-none -translate-y-1/2 translate-x-1/3 opacity-40 group-hover/heatmap:scale-105 transition-transform duration-700" />

      {/* Header stats - Compressed */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4 relative z-10">
        <div>
           <h3 className="text-[15px] font-black tracking-tighter text-dt-text">{title}</h3>
           <p className="text-[9px] font-black text-dt-textSecondary/50 tracking-widest uppercase mt-0.5">Consistency Matrix</p>
        </div>
        <div className="text-left sm:text-right flex flex-row sm:flex-col gap-2 sm:gap-0">
          <div className="text-[12px] font-bold text-dt-text"><span className="text-dt-primary">{total}</span> submissions past year</div>
          <div className="text-[10px] font-medium text-dt-textMuted opacity-70">{activeDays} active days • Max streak: <span className="font-bold text-dt-textSecondary">{maxStreak}</span></div>
        </div>
      </div>

      {/* Heatmap grid - Tighter */}
      <div
        ref={wrapperRef}
        className="mt-2 relative"
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Month labels */}
        <div className="flex dt-fade-in" style={{ gap: GAP, marginBottom: 8 }}>
          {monthLabels.map((m, i) => (
            <div
              key={`m-${i}`}
              style={{ width: CELL, flexShrink: 0, overflow: 'visible' }}
              className="text-[9px] font-bold text-dt-textMuted/60 leading-none whitespace-nowrap uppercase tracking-tighter"
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
                      const label = `${fmtDate.format(day.date)} — ${value} problem${value !== 1 ? 's' : ''}`;
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
                    className="hover:scale-125 hover:z-10 transition-transform duration-200 cursor-crosshair"
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
            <div className="-translate-x-1/2 -translate-y-4 rounded-lg border border-dt-primary/10 bg-white/90 backdrop-blur-md px-2.5 py-1.5 text-[10px] font-black text-dt-text shadow-dt-floating whitespace-nowrap uppercase tracking-widest animate-in fade-in zoom-in duration-200">
              {tooltip.text}
            </div>
          </div>
        ) : null}

        {/* Legend */}
        <div className="mt-6 flex justify-end items-center gap-2.5 text-[9px] font-black uppercase tracking-widest text-dt-textMuted/50">
          <span>Less</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((v) => (
              <div
                key={`leg-${v}`}
                style={{ width: CELL, height: CELL, borderRadius: RADIUS, backgroundColor: colorFor(v) }}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
    </section>
  );
});

HeatmapCard.displayName = 'HeatmapCard';
