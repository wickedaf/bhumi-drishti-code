import React from 'react'
import { Leaf, Sun, CloudRain } from 'lucide-react'
import { AstryxCard, AstryxBadge } from '../astryx/AstryxComponents'
import { SpokenAudioPlayer } from '../farmer/FarmerComponents'
import type { PredictionResult } from '../../services/api'
import { translations } from '../../i18n/translations'
import type { Language } from '../../i18n/translations'

interface OutlookCardProps {
  data: PredictionResult
  lang?: Language
}

export const OutlookCard: React.FC<OutlookCardProps> = ({ data, lang = 'bn' }) => {
  const { prediction, crop, district, previous_season, explanation_bn, explanation_en, features } = data
  const t = translations[lang]

  const activeExplanation = lang === 'bn' ? explanation_bn : (explanation_en || explanation_bn)
  const yieldBandDisplay = lang === 'bn' ? prediction.yield_band_bn : (prediction.yield_band_en || prediction.yield_band)
  const droughtDisplay = lang === 'bn' ? prediction.drought_risk.level_bn : (prediction.drought_risk.level_en || prediction.drought_risk.level)
  const waterlogDisplay = lang === 'bn' ? prediction.waterlog_risk.level_bn : (prediction.waterlog_risk.level_en || prediction.waterlog_risk.level)

  const prevDroughtDisplay = lang === 'bn' ? previous_season.drought_level_bn : (previous_season.drought_level_en || 'Moderate')
  const prevWaterlogDisplay = lang === 'bn' ? previous_season.waterlog_level_bn : (previous_season.waterlog_level_en || 'Low')

  return (
    <div className="space-y-4">
      {/* 3 Core Metric Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Yield Band */}
        <AstryxCard className="flex flex-col justify-between border-l-4 border-l-[#1b4d3e]">
          <div>
            <div className="flex items-center justify-between text-xs text-[#6f807a] mb-1 font-semibold">
              <span>{t.outlookYieldTitle}</span>
              <Leaf className="w-4 h-4 text-[#1b4d3e]" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-[#1c2826] mt-1">
              {yieldBandDisplay}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[#d0d7cd] flex items-center justify-between text-xs text-[#43544f]">
            <span>{t.outlookYieldExpected}</span>
            <span className="font-bold text-[#1b4d3e]">{prediction.predicted_yield_tha} {t.unitTonHa}</span>
          </div>
        </AstryxCard>

        {/* Drought Risk */}
        <AstryxCard className={`flex flex-col justify-between border-l-4 ${prediction.drought_risk.level === 'High' ? 'border-l-[#c84b31]' : 'border-l-[#a97843]'}`}>
          <div>
            <div className="flex items-center justify-between text-xs text-[#6f807a] mb-1 font-semibold">
              <span>{t.outlookDroughtTitle}</span>
              <Sun className={`w-4 h-4 ${prediction.drought_risk.level === 'High' ? 'text-[#c84b31]' : 'text-[#a97843]'}`} />
            </div>
            <div className="text-lg sm:text-xl font-bold text-[#1c2826] mt-1">
              {droughtDisplay}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[#d0d7cd] flex items-center justify-between text-xs text-[#43544f]">
            <span>{t.outlookRiskIndex}</span>
            <span className="font-bold">{(prediction.drought_risk.score * 100).toFixed(0)}%</span>
          </div>
        </AstryxCard>

        {/* Waterlogging Risk */}
        <AstryxCard className="flex flex-col justify-between border-l-4 border-l-[#3a86c8]">
          <div>
            <div className="flex items-center justify-between text-xs text-[#6f807a] mb-1 font-semibold">
              <span>{t.outlookWaterlogTitle}</span>
              <CloudRain className="w-4 h-4 text-[#3a86c8]" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-[#1c2826] mt-1">
              {waterlogDisplay}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[#d0d7cd] flex items-center justify-between text-xs text-[#43544f]">
            <span>{t.outlookRiskIndex}</span>
            <span className="font-bold">{(prediction.waterlog_risk.score * 100).toFixed(0)}%</span>
          </div>
        </AstryxCard>
      </div>

      {/* Grounded Explanation with TTS audio player */}
      <AstryxCard className="bg-[#fdfbf7] border-[#dcc19e]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-[#ebdcc5]">
          <h4 className="font-bold text-[#1c2826] flex items-center gap-2">
            {t.advisoryHeader}
          </h4>
          <SpokenAudioPlayer text={activeExplanation} lang={lang} />
        </div>
        <p className="text-sm leading-relaxed text-[#1c2826]">
          {activeExplanation}
        </p>

        {/* Environmental Fact Badges */}
        <div className="mt-3 pt-3 flex flex-wrap gap-2 text-xs">
          <span className="bg-white border border-[#d0d7cd] px-2.5 py-1 rounded-md text-[#43544f]">
            {t.badgeNdvi} <strong className="text-[#1c2826]">{features.ndvi_mean}</strong>
          </span>
          <span className="bg-white border border-[#d0d7cd] px-2.5 py-1 rounded-md text-[#43544f]">
            {t.badgeRain} <strong className="text-[#1c2826]">{features.total_rainfall_mm} {t.unitMm}</strong> ({features.rain_anomaly_pct > 0 ? '+' : ''}{features.rain_anomaly_pct}%)
          </span>
          <span className="bg-white border border-[#d0d7cd] px-2.5 py-1 rounded-md text-[#43544f]">
            {t.badgeDryDays} <strong className="text-[#1c2826]">{features.consecutive_dry_days} {t.unitDays}</strong>
          </span>
          <span className="bg-white border border-[#d0d7cd] px-2.5 py-1 rounded-md text-[#43544f]">
            {t.badgeSoilPh} <strong className="text-[#1c2826]">{features.soil_ph}</strong>
          </span>
        </div>
      </AstryxCard>

      {/* Season-Over-Season Delta (2025 vs 2026) */}
      <AstryxCard className="bg-white">
        <h4 className="font-bold text-[#1c2826] text-sm mb-3 flex items-center justify-between">
          <span>{t.comparisonTitle}</span>
          <AstryxBadge color="earth" size="sm">{t.comparisonBadge}</AstryxBadge>
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="bg-[#f4f6f2] p-2.5 rounded-lg border border-[#d0d7cd]">
            <span className="text-[#6f807a] block mb-0.5">{t.comp2025Yield}</span>
            <span className="font-bold text-[#1c2826]">{previous_season.yield_tha} {t.unitTonHa}</span>
          </div>
          <div className="bg-[#f4f6f2] p-2.5 rounded-lg border border-[#d0d7cd]">
            <span className="text-[#6f807a] block mb-0.5">{t.comp2026Yield}</span>
            <span className="font-bold text-[#1b4d3e]">{prediction.predicted_yield_tha} {t.unitTonHa}</span>
          </div>
          <div className="bg-[#f4f6f2] p-2.5 rounded-lg border border-[#d0d7cd]">
            <span className="text-[#6f807a] block mb-0.5">{t.compYieldDelta}</span>
            <span className={`font-bold ${previous_season.delta_yield_pct >= 0 ? 'text-[#15803d]' : 'text-[#c84b31]'}`}>
              {previous_season.delta_yield_pct >= 0 ? '+' : ''}{previous_season.delta_yield_pct}%
            </span>
          </div>
          <div className="bg-[#f4f6f2] p-2.5 rounded-lg border border-[#d0d7cd]">
            <span className="text-[#6f807a] block mb-0.5">{t.compDroughtShift}</span>
            <span className="font-bold text-[#1c2826]">
              {prevDroughtDisplay} ➔ {lang === 'bn' ? prediction.drought_risk.level_bn.split(' ')[0] : prediction.drought_risk.level}
            </span>
          </div>
        </div>
      </AstryxCard>
    </div>
  )
}
