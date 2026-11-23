import React from 'react'
import { Sliders, BarChart3 } from 'lucide-react'
import { AstryxCard, AstryxButton, AstryxBadge } from '../astryx/AstryxComponents'
import type { District, Crop, PredictionResult } from '../../services/api'
import { translations } from '../../i18n/translations'
import type { Language } from '../../i18n/translations'

interface OfficerDashboardProps {
  districts: District[]
  crops: Crop[]
  selectedDistrict: string
  selectedCrop: string
  onDistrictChange: (id: string) => void
  onCropChange: (id: string) => void
  onRunPredict: () => void
  loading: boolean
  predictionData?: PredictionResult | null
  lang?: Language
}

export const OfficerDashboard: React.FC<OfficerDashboardProps> = ({
  districts,
  crops,
  selectedDistrict,
  selectedCrop,
  onDistrictChange,
  onCropChange,
  onRunPredict,
  loading,
  predictionData,
  lang = 'bn'
}) => {
  const t = translations[lang]

  return (
    <div className="space-y-4">
      {/* Parameter Control Bar */}
      <AstryxCard>
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#d0d7cd]">
          <Sliders className="w-5 h-5 text-[#1b4d3e]" />
          <h3 className="font-bold text-[#1c2826] text-base">{t.officerTitle}</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#43544f] mb-1">
              {t.selectDistrict}
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => onDistrictChange(e.target.value)}
              className="w-full bg-[#f4f6f2] border border-[#d0d7cd] rounded-lg px-3 py-2 text-sm text-[#1c2826] focus:outline-none focus:ring-2 focus:ring-[#1b4d3e]"
            >
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {lang === 'bn' ? `${d.name_bn} (${d.name_en}) — ${d.division}` : `${d.name_en} (${d.name_bn}) — ${d.division}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#43544f] mb-1">
              {t.selectCrop}
            </label>
            <select
              value={selectedCrop}
              onChange={(e) => onCropChange(e.target.value)}
              className="w-full bg-[#f4f6f2] border border-[#d0d7cd] rounded-lg px-3 py-2 text-sm text-[#1c2826] focus:outline-none focus:ring-2 focus:ring-[#1b4d3e]"
            >
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {lang === 'bn' ? `${c.name_bn} (${c.name_en})` : `${c.name_en} (${c.name_bn})`}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <AstryxButton
              variant="primary"
              size="md"
              onClick={onRunPredict}
              disabled={loading}
              className="w-full justify-center h-[42px]"
            >
              {loading ? t.btnRunningPredict : t.btnRunPredict}
            </AstryxButton>
          </div>
        </div>
      </AstryxCard>

      {/* Model Explainability & Feature Weights */}
      {predictionData && predictionData.metrics && (
        <AstryxCard>
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#d0d7cd]">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#1b4d3e]" />
              <h4 className="font-bold text-sm text-[#1c2826]">
                {t.featureWeightsTitle}
              </h4>
            </div>
            <AstryxBadge color="green" size="sm">
              {t.testMape} {predictionData.metrics.yield_mape_pct}%
            </AstryxBadge>
          </div>

          <p className="text-xs text-[#43544f] mb-3">
            {t.featureWeightsSub}
          </p>

          <div className="space-y-2">
            {predictionData.metrics.top_features.map((feat, idx) => {
              const labelMapBn: Record<string, string> = {
                rain_anomaly_pct: 'বৃষ্টিপাতের বিচ্যুতি (Rainfall Anomaly %)',
                consecutive_dry_days: 'টানা অনাবৃষ্টি দিন (Consecutive Dry Days)',
                ndvi_mean: 'স্যাটেলাইট উদ্ভিদ সূচক (Sentinel-2 NDVI)',
                total_rainfall_mm: 'মোট মৌসুমী বৃষ্টিপাত (Total Rainfall mm)',
                mean_temp_c: 'গড় তাপমাত্রা (Mean Temp °C)',
                soil_organic_carbon: 'মাটির জৈব কার্বন (Soil Organic Carbon)',
                soil_ph: 'মাটির অম্লমান (Soil pH)'
              }
              const labelMapEn: Record<string, string> = {
                rain_anomaly_pct: 'Rainfall Anomaly (%)',
                consecutive_dry_days: 'Consecutive Dry Days',
                ndvi_mean: 'Sentinel-2 Vegetation Index (NDVI)',
                total_rainfall_mm: 'Total Seasonal Rainfall (mm)',
                mean_temp_c: 'Mean Ambient Temperature (°C)',
                soil_organic_carbon: 'Soil Organic Carbon (%)',
                soil_ph: 'Soil pH Level'
              }

              const displayLabel = lang === 'bn'
                ? (labelMapBn[feat.feature] || feat.feature)
                : (labelMapEn[feat.feature] || feat.feature)

              const pctWidth = Math.min(100, Math.round(feat.importance * 220))

              return (
                <div key={idx} className="text-xs">
                  <div className="flex justify-between text-[#1c2826] font-medium mb-0.5">
                    <span>{displayLabel}</span>
                    <span>{(feat.importance * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-[#f4f6f2] h-2 rounded-full overflow-hidden border border-[#d0d7cd]">
                    <div
                      className="bg-[#1b4d3e] h-full rounded-full transition-all duration-500"
                      style={{ width: `${pctWidth}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </AstryxCard>
      )}
    </div>
  )
}
