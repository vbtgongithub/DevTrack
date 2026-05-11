import React from 'react';

export const Footer: React.FC = () => {
  const footerLinks = {
    Product: ['Features', 'Pricing', 'Dashboard', 'Integrations'],
    Company: ['About', 'Blog', 'Careers', 'Contact'],
    Resources: ['Documentation', 'API', 'Guides', 'Community'],
    Legal: ['Privacy', 'Terms', 'Security', 'Cookies'],
  };

  return (
    <footer className="py-16 bg-dt-bg border-t border-dt-primary/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-6 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-dt-primary to-dt-secondary flex items-center justify-center shadow-lg shadow-dt-primary/20 ring-1 ring-white/10">
                <svg className="w-5 h-5 text-white drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <span className="text-xl font-bold text-dt-text tracking-tight">DevTrack</span>
            </div>
            <p className="text-[14px] font-medium text-dt-textSecondary mb-6 max-w-xs leading-relaxed">
              The all-in-one platform for tracking your developer journey. Level up your coding skills with actionable insights.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-dt-textMuted hover:text-dt-primary transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-dt-textMuted hover:text-dt-primary transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <div className="text-[15px] font-bold text-dt-text mb-4 tracking-tight">{category}</div>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-[14px] font-medium text-dt-textSecondary hover:text-dt-primary transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-dt-primary/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[13px] font-semibold text-dt-textMuted">
            © 2026 DevTrack. All rights reserved.
          </p>
          <div className="flex gap-6 text-[13px] font-semibold text-dt-textMuted">
            <a href="#" className="hover:text-dt-text transition-colors">Privacy</a>
            <a href="#" className="hover:text-dt-text transition-colors">Terms</a>
            <a href="#" className="hover:text-dt-text transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
