import React from 'react';
import { Icon } from '../shared/Icon';
import type { Platform } from '../../types/dsa';

import leetcodeLogo from '@/assets/logos/LeetCode.png';
import codeforcesLogo from '@/assets/logos/Codeforces.png';
import codechefLogo from '@/assets/logos/CodeChef.png';
import githubLogo from '@/assets/logos/github.png';

export type PlatformLogoProps = {
  platform: Platform;
  className?: string;
  iconSize?: number;
  alt?: string;
};

const iconName: Record<Platform, string> = {
  leetcode: 'code-bracket',
  codeforces: 'chart-bar',
  codechef: 'academic-cap',
  github: 'code-bracket',
};

const label: Record<Platform, string> = {
  leetcode: 'LeetCode',
  codeforces: 'Codeforces',
  codechef: 'CodeChef',
  github: 'GitHub',
};

const platformLogos: Record<Platform, string> = {
  leetcode: leetcodeLogo,
  codeforces: codeforcesLogo,
  codechef: codechefLogo,
  github: githubLogo,
};

export const PlatformLogo: React.FC<PlatformLogoProps> = React.memo(
  ({ platform, className, iconSize = 14, alt }) => {
    const [failed, setFailed] = React.useState(false);
    const resolvedClassName = className && className.trim().length > 0 ? className : undefined;

    if (failed) {
      return <Icon name={iconName[platform]} size={iconSize} className={resolvedClassName ?? 'text-gray-700'} />;
    }

    return (
      <img
        src={platformLogos[platform]}
        alt={alt ?? `${label[platform]} logo`}
        className={['w-5 h-5 object-contain', resolvedClassName].filter(Boolean).join(' ')}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }
);

PlatformLogo.displayName = 'PlatformLogo';
