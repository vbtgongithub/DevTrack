// ============================================================================
// BadgesMomentumCard.tsx — Badges/Momentum Display Card
// ============================================================================
import React from 'react';
import { Icon } from '../shared/Icon';

interface BadgesMomentumCardProps {
  totalProblems?: number;
  longestStreak?: number;
}

export const BadgesMomentumCard: React.FC<BadgesMomentumCardProps> = ({ 
  totalProblems = 0,
  longestStreak = 0 
}) => {
  // Calculate badge milestones
  const badges = React.useMemo(() => {
    const result = [];
    
    // Century badge (100 problems)
    if (totalProblems >= 100) {
      result.push({ emoji: '💯', title: 'CENTURY', unlocked: true });
    }
    
    // Half Century badge (50 problems)
    if (totalProblems >= 50) {
      result.push({ emoji: '💯', title: 'HALF CENTURY', unlocked: true });
    }
    
    // If no badges yet, show locked state
    if (result.length === 0) {
      result.push({ emoji: '🔒', title: 'LOCKED', unlocked: false });
    }
    
    return result.slice(0, 2); // Show max 2 badges
  }, [totalProblems]);

  return (
    <div
      className="dt-card p-4 flex flex-col justify-between bg-white rounded-[28px] border border-gray-300 shadow-dt-floating hover:shadow-dt-card-hover hover:border-emerald-500/30 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] relative overflow-hidden"
      style={{ animation: 'dtFadeIn 800ms cubic-bezier(0.16,1,0.3,1) 200ms both' }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.03),transparent_40%)]" />

      <div className="relative flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 shadow-sm border border-emerald-500/10">
          <Icon name="badge-check" size={20} className="text-emerald-600" />
        </div>
        <div>
          <div className="text-[10px] text-dt-textMuted font-black uppercase tracking-[0.2em]">Ecosystem</div>
          <div className="text-lg font-black text-dt-text tracking-tighter leading-tight">Badges</div>
        </div>
      </div>

      <div className="relative mt-3 space-y-2">
        {badges.map((badge, idx) => (
          <div
            key={idx}
            className={[
              'flex items-center justify-between p-2 rounded-xl transition-all duration-300',
              badge.unlocked 
                ? 'bg-emerald-50 border border-emerald-100' 
                : 'bg-gray-50 border border-gray-100 opacity-50'
            ].join(' ')}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{badge.emoji}</span>
              <span className={[
                'text-[10px] font-black uppercase tracking-wider',
                badge.unlocked ? 'text-emerald-700' : 'text-gray-400'
              ].join(' ')}>
                {badge.title}
              </span>
            </div>
            {badge.unlocked && (
              <Icon name="check-circle" size={14} className="text-emerald-600" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
