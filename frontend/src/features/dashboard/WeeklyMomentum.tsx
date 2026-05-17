import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, Progress } from '../../components/ui';

interface WeeklyMomentumProps {
  problemsThisWeek?: number;
  activeDays?: number;
  goalProgress?: number;
}

export function WeeklyMomentum({
  problemsThisWeek = 0,
  activeDays = 0,
  goalProgress = 0,
}: WeeklyMomentumProps) {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const filled = Math.min(7, Math.max(0, activeDays));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Weekly rhythm</CardTitle>
      </CardHeader>
      <div className="flex justify-between gap-1 mb-4">
        {days.map((d, i) => (
          <div key={`${d}-${i}`} className="flex flex-col items-center gap-1 flex-1">
            <motion.div
              layout
              className={`h-8 w-full max-w-[2rem] rounded-md ${i < filled ? 'bg-[#12B76A]/30 border border-[#12B76A]/20' : 'bg-zinc-50 border border-zinc-200'
                }`}
            />
            <span className="text-[10px] text-[#667085] font-medium">{d}</span>
          </div>
        ))}
      </div>
      <p className="text-xs font-medium text-[#667085] mb-2">{problemsThisWeek} problems this week</p>
      <Progress value={goalProgress} max={100} size="sm" showLabel label={`${goalProgress}% goals`} />
    </Card>
  );
}
