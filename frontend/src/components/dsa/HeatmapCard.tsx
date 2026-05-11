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
  if (value >= 4) return '#059669'; // Emerald 600
  if (value === 3) return '#10B981'; // Emerald 500
  if (value === 2) return '#34D399'; // Emerald 400
  if (value === 1) return '#6EE7B7'; // Emerald 300
  return 'rgba(229, 231, 235, 0.4)'; // Gray 200 with transparency for glass feel
};

const addDays = (d: Date, delta: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + delta);
  return x;
};

const CELL = 12;
const GAP = 4;
const RADIUS = 4;

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
        'bg-white/80 backdrop-blur-3xl border border-[#10B981]/20 rounded-[32px] p-8 lg:p-10 shadow-[0_8px_40px_rgba(16,185,129,0.06)] group/heatmap',
        'hover:shadow-[0_16px_60px_rgba(16,185,129,0.12)] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] relative overflow-hidden',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-[#34D399]/10 to-[#059669]/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/4 group-hover/heatmap:scale-[1.5] transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.03),transparent_60%)] pointer-events-none" />

      {/* Header stats - Compressed */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8 relative z-10">
        <div>
           <div className="flex items-center gap-2 mb-1.5">
             <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
             <span className="text-[10px] font-black text-[#10B981] uppercase tracking-[0.2em]">Live Telemetry</span>
           </div>
           <h3 className="text-2xl font-black tracking-tighter text-dt-text">{title}</h3>
        </div>
        <div className="text-left sm:text-right flex flex-row sm:flex-col gap-2 sm:gap-1">
          <div className="text-[14px] font-black text-dt-text"><span className="text-[#10B981] text-xl drop-shadow-sm">{total}</span> submissions past year</div>
          <div className="text-[11px] font-bold text-dt-textSecondary/80 tracking-wide uppercase">{activeDays} active days • Max streak: <span className="font-black text-[#10B981]">{maxStreak}</span></div>
        </div>
      </div>

      {/* Heatmap grid - Tighter */}
      <div
        ref={wrapperRef}
        className="mt-2 relative"
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Month labels */}
        <div className="flex dt-fade-in mb-3" style={{ gap: GAP }}>
          {monthLabels.map((m, i) => (
            <div
              key={`m-${i}`}
              style={{ width: CELL, flexShrink: 0, overflow: 'visible' }}
              className="text-[10px] font-black text-dt-textSecondary/50 leading-none whitespace-nowrap uppercase tracking-[0.1em]"
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
                      boxShadow: value > 0 ? `0 0 10px ${colorFor(value)}40` : 'none',
                    }}
                    className={`hover:scale-[1.4] hover:z-10 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-crosshair border ${value > 0 ? 'border-black/5' : 'border-transparent'}`}
                    aria-label={day ? `${fmtDate.format(day.date)}: ${value} problems solved` : undefined}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {tooltip ? (
          <div
            className="pointer-events-none absolute z-30"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <div className="-translate-x-1/2 -translate-y-6 rounded-xl border border-[#10B981]/20 bg-white/95 backdrop-blur-xl px-3.5 py-2 text-[11px] font-black text-dt-text shadow-[0_8px_30px_rgba(16,185,129,0.15)] whitespace-nowrap uppercase tracking-widest animate-in fade-in zoom-in duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] relative">
               <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white/95 border-b border-r border-[#10B981]/20 rotate-45" />
              {tooltip.text}
            </div>
          </div>
        ) : null}

        {/* Legend */}
        <div className="mt-8 flex justify-end items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-dt-textSecondary/50">
          <span>Less</span>
          <div className="flex gap-1.5">
            {[0, 1, 2, 3, 4].map((v) => (
              <div
                key={`leg-${v}`}
                style={{ 
                  width: CELL, 
                  height: CELL, 
                  borderRadius: RADIUS, 
                  backgroundColor: colorFor(v),
                  boxShadow: v > 0 ? `0 0 8px ${colorFor(v)}40` : 'none',
                  border: v > 0 ? '1px solid rgba(0,0,0,0.05)' : 'none'
                }}
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
