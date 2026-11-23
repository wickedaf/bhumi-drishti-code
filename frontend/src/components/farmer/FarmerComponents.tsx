import React, { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Camera, Volume2, VolumeX, CheckCircle2, Sparkles, AlertCircle, Image as ImageIcon, Send } from 'lucide-react'
import { AstryxButton, AstryxBadge } from '../astryx/AstryxComponents'
import { submitVoiceQuery, submitImageQuery } from '../../services/api'
import { translations } from '../../i18n/translations'
import type { Language } from '../../i18n/translations'

interface VoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onDetected: (data: { districtId: string; cropId: string; symptoms?: string[] }) => void
  lang?: Language
}

export const VoiceInputModal: React.FC<VoiceModalProps> = ({ isOpen, onClose, onDetected, lang = 'bn' }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [customText, setCustomText] = useState('')
  const [loading, setLoading] = useState(false)
  const [micError, setMicError] = useState<string | null>(null)
  const [recordingSeconds, setRecordingSeconds] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<any>(null)

  const t = translations[lang]

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  if (!isOpen) return null

  const handleStartRecording = async () => {
    setMicError(null)
    setTranscript('')
    audioChunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        processSpeechOrAudio(audioBlob, transcript)
      }

      recorder.start()
      setIsRecording(true)
      setRecordingSeconds(0)

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 12) {
            handleStopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)

      // Parallel Web Speech API if supported
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        try {
          const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
          const recognition = new SpeechRecognition()
          recognition.lang = lang === 'bn' ? 'bn-BD' : 'en-US'
          recognition.continuous = false
          recognition.interimResults = false

          recognition.onresult = (event: any) => {
            const text = event.results[0][0].transcript
            setTranscript(text)
          }
          recognition.start()
        } catch (e) {
          console.warn('Speech recognition fallback to audio stream')
        }
      }
    } catch (err: any) {
      console.warn('Microphone access blocked or unavailable:', err)
      setMicError(lang === 'bn' ? 'মাইক্রোফোন সংযোগ পাওয়া যায়নি। নিচের নমুনা বাক্যে চাপ দিন বা সরাসরি লিখুন।' : 'Microphone unavailable. Use sample queries or type below.')
      setIsRecording(false)
    }
  }

  const handleStopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setIsRecording(false)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }

  const processSpeechOrAudio = async (audioBlob?: Blob, textHint?: string) => {
    setLoading(true)
    try {
      const textToSend = textHint || transcript || (lang === 'bn' ? 'রংপুরে আমন ধান, খরা আছে নি?' : 'Aman rice in Rangpur, is there drought?')
      const res = await submitVoiceQuery(audioBlob, textToSend)
      if (res.extracted) {
        onDetected({
          districtId: res.extracted.district_id,
          cropId: res.extracted.crop_id,
          symptoms: res.extracted.visual_symptoms
        })
        onClose()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customText.trim()) return
    processSpeechOrAudio(undefined, customText.trim())
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#d0d7cd] text-center">
        <h3 className="text-xl font-bold text-[#1c2826] mb-1">{t.voiceModalTitle}</h3>
        <p className="text-xs sm:text-sm text-[#43544f] mb-5">{t.voiceModalDesc}</p>

        {/* Big tactile mic button */}
        <div className="flex flex-col items-center justify-center mb-5">
          <button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={loading}
            className={`w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer ${
              isRecording
                ? 'bg-[#c84b31] scale-105 shadow-xl animate-pulse text-white'
                : 'bg-[#1b4d3e] hover:bg-[#166534] shadow-lg text-white active:scale-95'
            }`}
          >
            {isRecording ? <MicOff className="w-10 h-10 mb-1" /> : <Mic className="w-10 h-10 mb-1" />}
            <span className="text-xs font-semibold">
              {isRecording ? `${t.voiceListening} (${recordingSeconds}s)` : t.voiceTapMic}
            </span>
          </button>
          {isRecording && (
            <p className="text-xs text-[#c84b31] font-semibold mt-2">
              {lang === 'bn' ? 'কথা শেষ হলে আবার চাপুন' : 'Tap again to stop and submit'}
            </p>
          )}
        </div>

        {/* Live Audio Visualizer */}
        {isRecording && (
          <div className="flex items-center justify-center gap-1.5 h-10 mb-3">
            <span className="wave-bar"></span>
            <span className="wave-bar"></span>
            <span className="wave-bar"></span>
            <span className="wave-bar"></span>
            <span className="wave-bar"></span>
          </div>
        )}

        {transcript && (
          <div className="bg-[#f0fdf4] border border-[#86efac] rounded-lg p-3 text-sm text-[#14532d] font-medium mb-3">
            "{transcript}"
          </div>
        )}

        {micError && (
          <div className="bg-[#fffbeb] border border-[#fde68a] rounded-lg p-2.5 text-xs text-[#92400e] text-left mb-3 flex items-start gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#d97706] mt-0.5" />
            <span>{micError}</span>
          </div>
        )}

        {/* Manual Fallback Text Input */}
        <form onSubmit={handleManualSubmit} className="flex gap-2 mb-4">
          <input
            type="text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder={lang === 'bn' ? 'বা এখানে লিখে পাঠান...' : 'Or type your query here...'}
            className="flex-1 text-xs bg-[#f4f6f2] border border-[#d0d7cd] rounded-xl px-3 py-2 text-[#1c2826] focus:outline-none focus:ring-2 focus:ring-[#1b4d3e]"
          />
          <button
            type="submit"
            disabled={loading || !customText.trim()}
            className="px-3 py-2 bg-[#1b4d3e] text-white rounded-xl text-xs font-semibold hover:bg-[#166534] disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Quick Click Samples */}
        <div className="text-left">
          <p className="text-xs font-semibold text-[#6f807a] mb-2 uppercase tracking-wide">
            {t.voiceExamplesTitle}
          </p>
          <div className="space-y-1.5">
            {t.voicePhrases.map((phrase, idx) => (
              <button
                key={idx}
                onClick={() => processSpeechOrAudio(undefined, phrase)}
                disabled={loading}
                className="w-full text-left text-xs bg-[#f4f6f2] hover:bg-[#e9ece6] p-2.5 rounded-lg text-[#1c2826] border border-[#d0d7cd] flex items-center justify-between cursor-pointer"
              >
                <span>"{phrase}"</span>
                <Sparkles className="w-3.5 h-3.5 text-[#1b4d3e] shrink-0" />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#6f807a] hover:text-[#1c2826] font-medium cursor-pointer"
          >
            {t.voiceClose}
          </button>
        </div>
      </div>
    </div>
  )
}

interface CameraModalProps {
  isOpen: boolean
  onClose: () => void
  onDetected: (data: { districtId: string; cropId: string; symptoms?: string[] }) => void
  lang?: Language
}

export const CameraInputModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onDetected, lang = 'bn' }) => {
  const [selectedFile, setSelectedFile] = useState<File | Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)

  if (!isOpen) return null

  const t = translations[lang]

  // Sample Field Photos for Instant Testing
  const sampleImages = [
    {
      label_bn: 'আমন ধানের জমি (শুষ্ক মাটি)',
      label_en: 'Aman Rice Field (Dry Soil)',
      crop: 'aman_rice',
      symptoms: ['soil_cracking', 'moisture_stress'],
      preview: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23d4a373"/><path d="M0,150 Q75,130 150,150 T300,150 L300,200 L0,200 Z" fill="%23a97843"/><text x="50%25" y="45%25" dominant-baseline="middle" text-anchor="middle" fill="%231b4d3e" font-size="16" font-family="sans-serif" font-weight="bold">🌾 Aman Paddy Field</text><text x="50%25" y="65%25" dominant-baseline="middle" text-anchor="middle" fill="%2378350f" font-size="13">Dry cracked soil sample</text></svg>'
    },
    {
      label_bn: 'গোল আলুর চারা ও পাতা',
      label_en: 'Potato Crop Foliage',
      crop: 'potato',
      symptoms: ['moisture_stress'],
      preview: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%2386efac"/><circle cx="150" cy="100" r="50" fill="%23166534"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="16" font-family="sans-serif" font-weight="bold">🥔 Potato Plant</text></svg>'
    },
    {
      label_bn: 'সতেজ গমের জমি',
      label_en: 'Healthy Wheat Crop',
      crop: 'wheat',
      symptoms: [],
      preview: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23fef08a"/><path d="M50,180 L150,50 L250,180 Z" fill="%23ca8a04"/><text x="50%25" y="85%25" dominant-baseline="middle" text-anchor="middle" fill="%231c2826" font-size="16" font-family="sans-serif" font-weight="bold">🌾 Wheat Crop Sample</text></svg>'
    }
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setAnalysisResult(null)
      handleAnalyze(file)
    }
  }

  const handleSelectSample = (sample: typeof sampleImages[0]) => {
    // Create a named File for the sample so backend recognizes the filename
    const file = new File([sample.preview], `${sample.crop}_sample.jpg`, { type: 'image/jpeg' })
    setSelectedFile(file)
    setPreviewUrl(sample.preview)
    setAnalysisResult(null)
    handleAnalyze(file)
  }

  const handleAnalyze = async (fileOverride?: File | Blob) => {
    setAnalyzing(true)
    try {
      const fileToSend = fileOverride || selectedFile || new File(['sample'], 'farmer_crop.jpg', { type: 'image/jpeg' })
      const res = await submitImageQuery(fileToSend)
      setAnalysisResult(res)
    } catch (e) {
      console.error(e)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleConfirm = () => {
    if (analysisResult) {
      onDetected({
        districtId: analysisResult.resolved_district?.district_id || 'dinajpur',
        cropId: analysisResult.detected_crop?.crop_id || 'potato',
        symptoms: analysisResult.visual_stress?.symptoms || []
      })
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#d0d7cd]">
        <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-[#ebdcc5]">
          <h3 className="text-xl font-bold text-[#1c2826] flex items-center gap-2">
            <Camera className="w-6 h-6 text-[#1b4d3e]" /> {t.cameraModalTitle}
          </h3>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#dcfce7] text-[#15803d] border border-[#86efac]">
            <Sparkles className="w-3 h-3 text-[#15803d]" />
            <span>Gemini Vision AI</span>
          </span>
        </div>
        <p className="text-xs sm:text-sm text-[#43544f] mb-4">{t.cameraModalDesc}</p>

        {/* Upload Box */}
        <div className="border-2 border-dashed border-[#d0d7cd] rounded-xl p-3 text-center bg-[#f4f6f2] mb-3">
          {previewUrl ? (
            <div className="relative">
              <img src={previewUrl} alt="Preview" className="max-h-44 mx-auto rounded-lg object-contain bg-white p-1" />
              <label className="mt-2 inline-block text-xs text-[#1b4d3e] font-semibold cursor-pointer underline">
                {t.cameraChangePhoto}
                <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
              </label>
            </div>
          ) : (
            <label className="cursor-pointer block py-5">
              <Camera className="w-10 h-10 text-[#6f807a] mx-auto mb-2" />
              <span className="text-sm font-semibold text-[#1b4d3e] block">{t.cameraUploadPrompt}</span>
              <span className="text-xs text-[#6f807a]">{t.cameraFormats}</span>
              <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
            </label>
          )}
        </div>

        {/* 1-Click Sample Field Photos */}
        {!previewUrl && (
          <div className="mb-4 text-left">
            <p className="text-xs font-semibold text-[#6f807a] mb-1.5 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5" />
              {lang === 'bn' ? 'বা তাৎক্ষণিক পরীক্ষার জন্য ছবি বেছে নিন:' : 'Or tap a sample field photo below:'}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {sampleImages.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSample(s)}
                  className="bg-[#f4f6f2] hover:bg-[#e9ece6] border border-[#d0d7cd] rounded-lg p-2 text-center text-xs cursor-pointer transition-all active:scale-95"
                >
                  <span className="block font-semibold text-[#1c2826] text-[11px] leading-tight">
                    {lang === 'bn' ? s.label_bn : s.label_en}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {analyzing && (
          <div className="bg-[#f0fdf4] border border-[#86efac] rounded-xl p-3.5 mb-3 text-center">
            <Sparkles className="w-5 h-5 text-[#15803d] animate-spin mx-auto mb-1.5" />
            <span className="text-xs font-bold text-[#14532d] block">
              {lang === 'bn' ? 'জেমিনাই এআই দিয়ে পাতা ও রোগের লক্ষণ বিশ্লেষণ চলছে...' : 'Analyzing crop photo and symptoms with Gemini Vision AI...'}
            </span>
          </div>
        )}

        {previewUrl && !analysisResult && !analyzing && (
          <AstryxButton
            variant="primary"
            onClick={() => handleAnalyze()}
            disabled={analyzing}
            className="w-full justify-center mb-3"
          >
            {t.cameraBtnAnalyze}
          </AstryxButton>
        )}

        {analysisResult && (
          <div className="bg-[#f0fdf4] border border-[#86efac] rounded-xl p-3.5 mb-4 text-left">
            <div className="flex items-center gap-2 text-[#14532d] font-bold text-sm mb-1">
              <CheckCircle2 className="w-4 h-4 text-[#15803d]" />
              {t.cameraDetectedCrop} {lang === 'bn' ? analysisResult.detected_crop?.name_bn : analysisResult.detected_crop?.name_en}
            </div>
            <p className="text-xs text-[#43544f] mb-2 font-medium">{analysisResult.visual_stress?.notes_bn}</p>
            <div className="flex flex-wrap items-center gap-2">
              <AstryxBadge color="yellow" size="sm">
                {t.cameraMoistureStatus} {analysisResult.visual_stress?.moisture_level}
              </AstryxBadge>
              <AstryxBadge color="earth" size="sm">
                {t.cameraArea} {lang === 'bn' ? analysisResult.resolved_district?.name_bn : analysisResult.resolved_district?.name_en}
              </AstryxBadge>
              {analysisResult.ai_source && (
                <AstryxBadge color="green" size="sm">
                  <Sparkles className="w-3 h-3 inline mr-1 text-[#15803d]" />
                  {analysisResult.ai_source}
                </AstryxBadge>
              )}
            </div>

            <AstryxButton
              variant="primary"
              onClick={handleConfirm}
              className="w-full justify-center mt-3"
            >
              {t.cameraBtnConfirm}
            </AstryxButton>
          </div>
        )}

        <div className="flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#6f807a] hover:text-[#1c2826] cursor-pointer">
            {t.cameraClose}
          </button>
        </div>
      </div>
    </div>
  )
}

export const SpokenAudioPlayer: React.FC<{ text: string; lang?: Language }> = ({ text, lang = 'bn' }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const audioElRef = useRef<HTMLAudioElement | null>(null)
  const t = translations[lang]

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      if (audioElRef.current) {
        audioElRef.current.pause()
      }
    }
  }, [])

  const handleSpeak = () => {
    if (isPlaying) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      if (audioElRef.current) {
        audioElRef.current.pause()
      }
      setIsPlaying(false)
      return
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utteranceRef.current = utterance
      utterance.lang = lang === 'bn' ? 'bn-BD' : 'en-US'
      utterance.rate = 0.95

      // Select matching voice if available
      const voices = window.speechSynthesis.getVoices()
      if (voices && voices.length > 0) {
        const matchingVoice = voices.find(v => v.lang.startsWith(lang === 'bn' ? 'bn' : 'en'))
        if (matchingVoice) utterance.voice = matchingVoice
      }

      utterance.onstart = () => setIsPlaying(true)
      utterance.onend = () => setIsPlaying(false)
      utterance.onerror = () => {
        setIsPlaying(false)
        playFallbackAudio()
      }

      window.speechSynthesis.speak(utterance)
      setIsPlaying(true)
    } else {
      playFallbackAudio()
    }
  }

  const playFallbackAudio = () => {
    try {
      if (!audioElRef.current) {
        audioElRef.current = new Audio('/api/assist/tts')
        audioElRef.current.onended = () => setIsPlaying(false)
        audioElRef.current.onerror = () => setIsPlaying(false)
      }
      audioElRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
    } catch (e) {
      setIsPlaying(false)
    }
  }

  return (
    <button
      onClick={handleSpeak}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer ${
        isPlaying
          ? 'bg-[#c84b31] text-white animate-pulse'
          : 'bg-[#1b4d3e] text-white hover:bg-[#166534] active:scale-95'
      }`}
    >
      {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      <span>{isPlaying ? t.btnStopAudio : t.btnListenAudio}</span>
    </button>
  )
}
