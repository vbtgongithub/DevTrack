import React from 'react';
import type { Submission, Platform, SubmissionStatus } from '../../types/dsa';
import { Icon } from '../shared/Icon';
import { PlatformLogo } from './PlatformLogo';

export type SubmissionsTableProps = {
  title: string;
  submissions: Submission[];
  className?: string;
};

const statusClass = (status: SubmissionStatus) =>
  status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600';

const platformLabel: Record<Platform, string> = {
  leetcode: 'LeetCode',
  codeforces: 'Codeforces',
  codechef: 'CodeChef',
  hackerrank: 'HackerRank',
};

const statusMeta: Record<SubmissionStatus, { label: string; icon: string }> = {
  accepted: { label: 'Accepted', icon: 'check-circle' },
  wrong: { label: 'Wrong', icon: 'exclamation-triangle' },
};

export const SubmissionsTable: React.FC<SubmissionsTableProps> = React.memo(
  ({ title, submissions, className }) => {
    return (
      <section
        className={[
          'bg-white border border-gray-300 shadow-md rounded-xl p-5 transition-all duration-200',
          'hover:shadow-lg hover:scale-[1.01]',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-200">
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 pr-4 font-medium">Problem</th>
                <th className="pb-3 pr-4 font-medium">Topic</th>
                <th className="pb-3 pr-4 font-medium">Platform</th>
                <th className="pb-3 pr-4 font-medium">Language</th>
                <th className="pb-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission) => (
                <tr
                  key={submission.id}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition"
                >
                  <td className="py-3 pr-4">
                    <span
                      className={[
                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                        statusClass(submission.status),
                      ].join(' ')}
                    >
                      <Icon name={statusMeta[submission.status].icon} size={14} className="text-current" />
                      {statusMeta[submission.status].label}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-gray-900 font-medium">{submission.problem}</td>
                  <td className="py-3 pr-4 text-gray-600">{submission.topic}</td>
                  <td className="py-3 pr-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center shrink-0">
                        <PlatformLogo platform={submission.platform} iconSize={14} className="" />
                      </div>
                      <span className="text-sm text-gray-700">{platformLabel[submission.platform]}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-gray-600">{submission.language}</td>
                  <td className="py-3 text-gray-500">{submission.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }
);

SubmissionsTable.displayName = 'SubmissionsTable';
