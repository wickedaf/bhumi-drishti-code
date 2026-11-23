import React, { useState, useEffect } from 'react'
import {
  Compass,
  Coins,
  TrendingUp,
  Calendar,
  Sparkles,
  Key,
  Check,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  HelpCircle,
  Lightbulb,
  ArrowUpRight,
  Trash2
} from 'lucide-react'
import { AstryxCard, AstryxButton, AstryxBadge } from '../astryx/AstryxComponents'
import { SpokenAudioPlayer } from './FarmerComponents'
import {
  fetchLandIntelligence,
  checkGeminiKeyStatus,
  setGeminiApiKey,
  getClientGeminiKey,
  saveClientGeminiKey,
  type LandIntelligenceResult,
  type District,
  type Crop
} from '../../services/api'
import type { Language } from '../../i18n/translations'

interface LandIntelligenceCardProps {
  district: District
  currentCropId: string
  lang?: Language
  onApplyCrop?: (cropId: string) => void
}

export const LandIntelligenceCard: React.FC<LandIntelligenceCardProps> = ({
  district,
  currentCropId,
  lang = 'bn',
  onApplyCrop
}) => {
  const [landSize, setLandSize] = useState<number>(1.0)
  const [selectedCropId, setSelectedCropId] = useState<string>(currentCropId || 'aman_rice')
  const [seedVariety, setSeedVariety] = useState<string>('')
  const [farmerQuery, setFarmerQuery] = useState<string>('')

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<LandIntelligenceResult | null>(null)

  // Gemini API Key management
  const [hasKey, setHasKey] = useState(false)
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [inputKey, setInputKey] = useState('')
  const [keySuccess, setKeySuccess] = useState(false)

  useEffect(() => {
    const localKey = getClientGeminiKey()
    if (localKey && localKey.length > 5) {
      setHasKey(true)
      setInputKey(localKey)
    }
    checkKey()
  }, [])

  useEffect(() => {
    if (currentCropId && currentCropId !== selectedCropId) {
      setSelectedCropId(currentCropId)
      runIntelligence(currentCropId, landSize)
    }
  }, [currentCropId])

  useEffect(() => {
    runIntelligence(selectedCropId, landSize)
  }, [district.id])

  const checkKey = async () => {
    try {
      const status = await checkGeminiKeyStatus()
      if (status.is_configured) {
        setHasKey(true)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleSaveKey = async () => {
    const cleanKey = inputKey.trim()
    if (!cleanKey) return
    try {
      await setGeminiApiKey(cleanKey)
      setHasKey(true)
      setKeySuccess(true)
      setTimeout(() => {
        setShowKeyModal(false)
        setKeySuccess(false)
        runIntelligence(selectedCropId, landSize)
      }, 1000)
    } catch (e) {
      console.warn('Saved client-side fallback:', e)
      saveClientGeminiKey(cleanKey)
      setHasKey(true)
      setKeySuccess(true)
      setTimeout(() => {
        setShowKeyModal(false)
        setKeySuccess(false)
        runIntelligence(selectedCropId, landSize)
      }, 1000)
    }
  }

  const handleClearKey = () => {
    saveClientGeminiKey('')
    setInputKey('')
    setHasKey(false)
    setShowKeyModal(false)
    runIntelligence(selectedCropId, landSize)
  }

  const runIntelligence = async (cropId: string, size: number) => {
    setLoading(true)
    try {
      const data = await fetchLandIntelligence({
        district_id: district.id,
        land_size_bigha: size,
        target_crop_id: cropId,
        seed_variety: seedVariety || undefined,
        query_text: farmerQuery || undefined
      })
      setResult(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectCropRanking = (cropId: string) => {
    setSelectedCropId(cropId)
    runIntelligence(cropId, landSize)
    if (onApplyCrop) onApplyCrop(cropId)
  }

  return (
    <AstryxCard className="bg-white border-2 border-[#1b4d3e]/20 shadow-md p-4 sm:p-6 space-y-6">
      {/* Top Banner with Gemini Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#d0d7cd]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#dcfce7] text-[#14532d] rounded-lg">
              <Compass className="w-5 h-5 text-[#1b4d3e]" />
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-[#1c2826]">
              {lang === 'bn' ? 'ভূমি প্রজ্ঞা ও আয়-মুনাফা পূর্বাভাস' : 'Land Intelligence & Profitability Predictor'}
            </h2>
          </div>
          <p className="text-xs text-[#43544f] mt-1">
            {lang === 'bn'
              ? `${district.name_bn} জেলার মাটির গুণাগুণ, আর্দ্রতা ও আবহাওয়া অনুসারে সেরা ফসল ও লাভ-ক্ষতির পূর্ণাঙ্গ হিসাব`
              : `Predicts the best crop and projected earnings based on soil profile and climate in ${district.name_en}`}
          </p>
        </div>

        {/* Gemini Key Pill */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowKeyModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#d0d7cd] bg-[#f4f6f2] hover:bg-[#e9ece6] text-xs font-semibold text-[#1c2826] cursor-pointer transition-all"
            title="Configure Gemini API Key"
          >
            <Key className="w-3.5 h-3.5 text-[#1b4d3e]" />
            <span>{hasKey ? (lang === 'bn' ? 'Gemini AI: যুক্ত আছে' : 'Gemini AI: Connected') : (lang === 'bn' ? 'Gemini API Key দিন' : 'Connect Gemini API Key')}</span>
            <span className={`w-2 h-2 rounded-full ${hasKey ? 'bg-[#22c55e]' : 'bg-[#eab308]'}`}></span>
          </button>
        </div>
      </div>

      {/* Input Controls: Land Size + Target Crop + Query */}
      <div className="bg-[#fdfbf7] border border-[#ebdcc5] rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-[#a97843] uppercase tracking-wide flex items-center gap-1.5">
          <Lightbulb className="w-4 h-4" />
          {lang === 'bn' ? 'জমির তথ্য ও আপনার লক্ষ্য' : 'Land Specifications & Query'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Land Size */}
          <div>
            <label className="block font-semibold text-[#43544f] mb-1">
              {lang === 'bn' ? 'জমির পরিমাণ (বিঘা / Bigha)' : 'Land Area (Bigha / 33 decimals)'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0.25"
                max="50"
                step="0.25"
                value={landSize}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 1.0
                  setLandSize(val)
                  runIntelligence(selectedCropId, val)
                }}
                className="w-full bg-white border border-[#d0d7cd] rounded-lg px-3 py-2 text-sm text-[#1c2826] font-bold focus:outline-none focus:ring-2 focus:ring-[#1b4d3e]"
              />
              <span className="text-[#6f807a] font-medium whitespace-nowrap">
                {lang === 'bn' ? 'বিঘা' : 'Bigha'}
              </span>
            </div>
          </div>

          {/* Target Crop */}
          <div>
            <label className="block font-semibold text-[#43544f] mb-1">
              {lang === 'bn' ? 'ফসল বিবেচনা করুন' : 'Evaluate Specific Crop'}
            </label>
            <select
              value={selectedCropId}
              onChange={(e) => {
                const newCrop = e.target.value
                setSelectedCropId(newCrop)
                runIntelligence(newCrop, landSize)
                if (onApplyCrop) onApplyCrop(newCrop)
              }}
              className="w-full bg-white border border-[#d0d7cd] rounded-lg px-3 py-2 text-sm text-[#1c2826] focus:outline-none focus:ring-2 focus:ring-[#1b4d3e]"
            >
              <option value="aman_rice">{lang === 'bn' ? 'রোপা আমন ধান (Aman Rice)' : 'T. Aman Rice'}</option>
              <option value="potato">{lang === 'bn' ? 'গোল আলু (Potato)' : 'Potato'}</option>
              <option value="wheat">{lang === 'bn' ? 'গম (Wheat)' : 'Wheat'}</option>
              <option value="boro_rice">{lang === 'bn' ? 'বোরো ধান (Boro Rice)' : 'Boro Rice'}</option>
              <option value="mustard">{lang === 'bn' ? 'সরিষা (Mustard)' : 'Mustard'}</option>
              <option value="maize">{lang === 'bn' ? 'ভুট্টা (Maize / Corn)' : 'Maize / Corn'}</option>
              <option value="aus_rice">{lang === 'bn' ? 'আউশ ধান (Aus Rice)' : 'Aus Rice'}</option>
              <option value="jute">{lang === 'bn' ? 'তোষা পাট (Jute)' : 'Jute'}</option>
            </select>
          </div>

          {/* Seed Variety (Optional) */}
          <div>
            <label className="block font-semibold text-[#43544f] mb-1">
              {lang === 'bn' ? 'বীজের জাত (ঐচ্ছিক)' : 'Seed Variety (Optional)'}
            </label>
            <input
              type="text"
              value={seedVariety}
              onChange={(e) => setSeedVariety(e.target.value)}
              onBlur={() => runIntelligence(selectedCropId, landSize)}
              placeholder={lang === 'bn' ? 'যেমন: ব্রি ধান-৮৭ বা বারি আলু-৭' : 'e.g. BRRI dhan-87 / Diamond'}
              className="w-full bg-white border border-[#d0d7cd] rounded-lg px-3 py-2 text-sm text-[#1c2826] focus:outline-none focus:ring-2 focus:ring-[#1b4d3e]"
            />
          </div>
        </div>

        {/* Farmer Specific Query text */}
        <div>
          <label className="block font-semibold text-[#43544f] text-xs mb-1">
            {lang === 'bn' ? 'আপনার সুনির্দিষ্ট প্রশ্ন বা পরিস্থিতি (ঐচ্ছিক)' : 'Your Specific Field Question (Optional)'}
          </label>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              runIntelligence(selectedCropId, landSize)
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={farmerQuery}
              onChange={(e) => setFarmerQuery(e.target.value)}
              placeholder={lang === 'bn' ? 'যেমন: এই জমিতে কোন ফসল সবচেয়ে বেশি লাভজনক হবে এবং খরচ কেমন?' : 'e.g. Which crop will yield the highest net profit on my land?'}
              className="flex-1 bg-white border border-[#d0d7cd] rounded-lg px-3 py-2 text-xs text-[#1c2826] focus:outline-none focus:ring-2 focus:ring-[#1b4d3e]"
            />
            <AstryxButton
              type="submit"
              variant="primary"
              size="md"
              disabled={loading}
              className="whitespace-nowrap"
            >
              {loading ? (lang === 'bn' ? 'বিশ্লেষণ চলছে...' : 'Analyzing...') : (lang === 'bn' ? '💡 হিসাব দেখুন' : '💡 Calculate Profit')}
            </AstryxButton>
          </form>
        </div>
      </div>

      {result && (
        <div className="space-y-6">
          {/* Top 3 Best Crop Recommendations Ranking */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sm text-[#1c2826] flex items-center gap-2">
                🏆 {lang === 'bn' ? `${district.name_bn} জেলার জন্য সেরা লাভজনক ফসল র‍্যাংকিং` : `Best Crop Recommendations for ${district.name_en}`}
              </h3>
              <span className="text-xs text-[#6f807a]">
                {lang === 'bn' ? 'মাটি ও আবহাওয়া উপযোগী' : 'Ranked by land suitability & ROI'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {result.recommended_crops_ranking.slice(0, 3).map((crop, idx) => {
                const isSelected = crop.crop_id === selectedCropId
                return (
                  <div
                    key={crop.crop_id}
                    onClick={() => handleSelectCropRanking(crop.crop_id)}
                    className={`rounded-xl p-3 border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#1b4d3e] bg-[#f0fdf4] shadow-sm'
                        : 'border-[#d0d7cd] bg-white hover:border-[#1b4d3e]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#1b4d3e] text-white">
                        #{idx + 1} {crop.suitability_pct}% {lang === 'bn' ? 'উপযোগী' : 'Fit'}
                      </span>
                      <AstryxBadge color={crop.profit_rating === 'High' ? 'green' : 'yellow'} size="sm">
                        {lang === 'bn' ? `লাভ: ৳${crop.estimated_profit_bdt.toLocaleString()}` : `Profit: ৳${crop.estimated_profit_bdt.toLocaleString()}`}
                      </AstryxBadge>
                    </div>

                    <h4 className="font-bold text-base text-[#1c2826] mt-1">
                      {lang === 'bn' ? crop.name_bn : crop.name_en}
                    </h4>
                    <p className="text-xs text-[#6f807a]">
                      {lang === 'bn' ? crop.season_bn : crop.season_en}
                    </p>

                    <div className="mt-2 pt-2 border-t border-[#d0d7cd] flex items-center justify-between text-xs">
                      <span className="text-[#43544f]">{crop.recommended_seeds[0]}</span>
                      <span className="text-[#1b4d3e] font-semibold flex items-center">
                        {isSelected ? (lang === 'bn' ? '✓ নির্বাচিত' : '✓ Active') : (lang === 'bn' ? 'নির্বাচন' : 'Select')}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Comprehensive Economic & Profitability Breakdown Card */}
          <div className="bg-[#f7f8f6] border border-[#d0d7cd] rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#d0d7cd]">
              <div>
                <span className="text-xs font-bold text-[#1b4d3e] uppercase tracking-wide">
                  {lang === 'bn' ? 'আয় ও ব্যয়ের পূর্ণাঙ্গ ব্যালেন্স শিট' : 'Projected Profit & Loss Statement'}
                </span>
                <h3 className="text-lg font-bold text-[#1c2826]">
                  {lang === 'bn'
                    ? `${result.selected_crop.name_bn} — ${landSize} বিঘা জমির অর্থনৈতিক হিসাব`
                    : `${result.selected_crop.name_en} — Economics for ${landSize} Bigha`}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <AstryxBadge color="green" size="lg">
                  {lang === 'bn' ? `নিট লাভ: ৳${result.economic_projection.net_profit_bdt.toLocaleString()} টাকা` : `Net Profit: ৳${result.economic_projection.net_profit_bdt.toLocaleString()} BDT`}
                </AstryxBadge>
                <AstryxBadge color="earth" size="md">
                  ROI: +{result.economic_projection.roi_pct}%
                </AstryxBadge>
              </div>
            </div>

            {/* Metric Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-[#d0d7cd]">
                <span className="text-[#6f807a] block mb-0.5">{lang === 'bn' ? 'প্রত্যাশিত ফলন' : 'Expected Yield'}</span>
                <span className="text-base font-bold text-[#1c2826]">
                  {result.economic_projection.yield_maund_total} {lang === 'bn' ? 'মণ' : 'maunds'}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#d0d7cd]">
                <span className="text-[#6f807a] block mb-0.5">{lang === 'bn' ? 'বাজার দর' : 'Market Price'}</span>
                <span className="text-base font-bold text-[#1c2826]">
                  ৳{result.economic_projection.market_price_per_maund_bdt} {lang === 'bn' ? '/ মণ' : '/ maund'}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#d0d7cd]">
                <span className="text-[#6f807a] block mb-0.5">{lang === 'bn' ? 'সম্ভাব্য মোট বিক্রয়' : 'Gross Revenue'}</span>
                <span className="text-base font-bold text-[#15803d]">
                  ৳{result.economic_projection.gross_revenue_bdt.toLocaleString()}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#d0d7cd]">
                <span className="text-[#6f807a] block mb-0.5">{lang === 'bn' ? 'উৎপাদন মোট খরচ' : 'Total Expenses'}</span>
                <span className="text-base font-bold text-[#c84b31]">
                  ৳{result.economic_projection.costs_breakdown.total_cost_bdt.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Itemized Cost Breakdown Bar */}
            <div className="bg-white p-3.5 rounded-xl border border-[#d0d7cd] space-y-2">
              <h4 className="font-bold text-xs text-[#1c2826]">
                {lang === 'bn' ? 'খরচের খাতওয়ারী হিসাব (Cost Breakdown):' : 'Cost Breakdown by Input Item:'}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-[#fdfbf7] p-2 rounded-lg border border-[#ebdcc5]">
                  <span className="text-[#6f807a] block">{lang === 'bn' ? '🌱 বীজ খরচ' : '🌱 Seeds'}</span>
                  <span className="font-bold text-[#1c2826]">৳{result.economic_projection.costs_breakdown.seeds_bdt.toLocaleString()}</span>
                </div>
                <div className="bg-[#fdfbf7] p-2 rounded-lg border border-[#ebdcc5]">
                  <span className="text-[#6f807a] block">{lang === 'bn' ? '🧪 সার ও ওষুধ' : '🧪 Fertilizers'}</span>
                  <span className="font-bold text-[#1c2826]">৳{result.economic_projection.costs_breakdown.fertilizers_bdt.toLocaleString()}</span>
                </div>
                <div className="bg-[#fdfbf7] p-2 rounded-lg border border-[#ebdcc5]">
                  <span className="text-[#6f807a] block">{lang === 'bn' ? '💧 সেচ খরচ' : '💧 Irrigation'}</span>
                  <span className="font-bold text-[#1c2826]">৳{result.economic_projection.costs_breakdown.irrigation_bdt.toLocaleString()}</span>
                </div>
                <div className="bg-[#fdfbf7] p-2 rounded-lg border border-[#ebdcc5]">
                  <span className="text-[#6f807a] block">{lang === 'bn' ? '🚜 জমি ও শ্রমিক' : '🚜 Labor & Tillage'}</span>
                  <span className="font-bold text-[#1c2826]">৳{result.economic_projection.costs_breakdown.labor_tillage_bdt.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Month-by-Month Agronomic Timeline */}
          <div className="bg-white border border-[#d0d7cd] rounded-2xl p-4 sm:p-5">
            <h3 className="font-bold text-sm text-[#1c2826] mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#1b4d3e]" />
              {lang === 'bn' ? 'মাসভিত্তিক চাষপদ্ধতি ও করণীয় সূচি' : 'Month-by-Month Seasonal Agronomic Calendar'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {result.timeline_stages.map((stage, idx) => (
                <div key={idx} className="bg-[#f4f6f2] p-3 rounded-xl border border-[#d0d7cd] text-center">
                  <span className="text-xs font-bold text-[#1b4d3e] block mb-1">
                    {stage.month}
                  </span>
                  <span className="text-xs text-[#1c2826] font-medium block">
                    {lang === 'bn' ? stage.phase_bn : stage.phase_en}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Optimal Techniques & High Yield Seeds */}
          <div className="bg-[#fdfbf7] border border-[#dcc19e] rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-[#ebdcc5]">
              <h3 className="font-bold text-sm text-[#1c2826] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#1b4d3e]" />
                {lang === 'bn' ? 'এআই কৃষি পরামর্শ ও আধুনিক প্রযুক্তি' : 'AI Agronomic Guidance & Modern Techniques'}
              </h3>
              <div className="flex items-center gap-2">
                <AstryxBadge color="green" size="sm">
                  {result.advisory.source}
                </AstryxBadge>
                <SpokenAudioPlayer text={lang === 'bn' ? result.advisory.bn : result.advisory.en} lang={lang} />
              </div>
            </div>

            <p className="text-sm leading-relaxed text-[#1c2826] whitespace-pre-line mb-4">
              {lang === 'bn' ? result.advisory.bn : result.advisory.en}
            </p>

            <div className="bg-white p-3 rounded-xl border border-[#d0d7cd] text-xs">
              <span className="font-bold text-[#1b4d3e] block mb-1">
                {lang === 'bn' ? '💡 প্রস্তাবিত আধুনিক পদ্ধতি (Recommended Technique):' : '💡 Recommended Technique:'}
              </span>
              <p className="text-[#43544f]">
                {lang === 'bn' ? result.optimal_techniques.technique_bn : result.optimal_techniques.technique_en}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Gemini API Key Configuration Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#d0d7cd]">
            <h3 className="text-lg font-bold text-[#1c2826] mb-2 flex items-center gap-2">
              <Key className="w-5 h-5 text-[#1b4d3e]" />
              {lang === 'bn' ? 'Google Gemini API Key কনফিগারেশন' : 'Configure Google Gemini API Key'}
            </h3>
            <p className="text-xs text-[#43544f] mb-4">
              {lang === 'bn'
                ? 'আপনার Gemini API key প্রবেশ করান। এটি দিয়ে ভয়েস ট্রান্সক্রিপশন, ছবি বিশ্লেষণ এবং লাইভ এআই ল্যান্ড ইন্টেলিজেন্স আরও শক্তিশালী হবে।'
                : 'Enter your Google Gemini API key to activate real-time multimodal voice parsing, vision crop identification, and deep land intelligence.'}
            </p>

            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-[#f4f6f2] border border-[#d0d7cd] rounded-xl px-3.5 py-2.5 text-sm text-[#1c2826] mb-3 focus:outline-none focus:ring-2 focus:ring-[#1b4d3e]"
            />

            {keySuccess && (
              <div className="bg-[#f0fdf4] border border-[#86efac] rounded-lg p-2.5 text-xs text-[#15803d] font-semibold flex items-center gap-1.5 mb-3">
                <Check className="w-4 h-4" />
                {lang === 'bn' ? 'Gemini API Key সফলভাবে যুক্ত হয়েছে!' : 'Gemini API Key configured successfully!'}
              </div>
            )}

            <div className="flex items-center justify-between gap-2 mt-4">
              {hasKey ? (
                <button
                  type="button"
                  onClick={handleClearKey}
                  className="px-3 py-1.5 text-xs text-[#c84b31] hover:bg-[#fee2e2] rounded-lg flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'কি মুছুন' : 'Remove Key'}</span>
                </button>
              ) : <div></div>}

              <div className="flex gap-2">
                <button
                  onClick={() => setShowKeyModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#6f807a] hover:text-[#1c2826] cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <AstryxButton
                  variant="primary"
                  size="md"
                  onClick={handleSaveKey}
                  disabled={!inputKey.trim()}
                >
                  {lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Key'}
                </AstryxButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </AstryxCard>
  )
}
