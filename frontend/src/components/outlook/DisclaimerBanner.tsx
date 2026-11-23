import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { translations } from '../../i18n/translations'
import type { Language } from '../../i18n/translations'

export const DisclaimerBanner: React.FC<{ lang?: Language }> = ({ lang = 'bn' }) => {
  const t = translations[lang]

  return (
    <div className="space-y-3 pt-2">
      {/* Official DAE Advisory Caution */}
      <div className="bg-[#fffbeb] border border-[#fde68a] rounded-xl p-3.5 text-xs text-[#92400e] flex items-start gap-2.5 shadow-sm">
        <AlertTriangle className="w-5 h-5 text-[#d97706] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>{t.disclaimerStrong}</strong> {t.disclaimerText}
        </div>
      </div>

      {/* Attribution & AI Transparency */}
      <footer className="text-center py-4 border-t border-[#d0d7cd] text-xs text-[#6f807a] space-y-1">
        <p>{t.footerSources}</p>
        <p>{t.footerAuthor}</p>
      </footer>
    </div>
  )
}
