// src/features/intelligence-experience/evidence/InfrastructureProofViewer.tsx
// Shows concrete infrastructural proof extracted from code (e.g., Dockerfiles, K8s configs).

import React from 'react';

export const InfrastructureProofViewer: React.FC = () => {
  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Infrastructure Proof</h4>
      <div className="bg-[#0d1117] p-3 rounded font-mono text-xs text-slate-300 overflow-x-auto border border-slate-700">
        <div className="text-slate-500 mb-2">// Extracted from docker-compose.yml</div>
        <div className="text-emerald-400">redis:</div>
        <div className="pl-4">image: redis:alpine</div>
        <div className="pl-4">command: redis-server --requirepass $REDIS_PASSWORD</div>
        <div className="pl-4">ports:</div>
        <div className="pl-8 text-blue-300">- "6379:6379"</div>
      </div>
    </div>
  );
};
