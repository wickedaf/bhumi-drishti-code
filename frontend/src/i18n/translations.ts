export type Language = 'bn' | 'en'

export const translations = {
  bn: {
    // Top Bar
    appTitle: 'ভূমি দৃষ্টি',
    appTitleEn: 'Bhumi Drishti',
    appSubtitle: 'স্যাটেলাইট ও আবহাওয়াভিত্তিক মৌসুমী ফসল ফলাফল ও ঝুঁকি পূর্বাভাস',
    modeFarmer: 'সহজ মোড (কৃষক)',
    modeOfficer: 'অফিসার মোড',
    switchLang: 'English',

    // Farmer Mode Box
    farmerTag: '🌾 কৃষক ভাইদের জন্য সহজ ইনপুট',
    farmerHeadline: 'কোনো কিছু লিখতে হবে না — মুখে বলুন বা ছবি দিন!',
    btnVoice: 'মুখে বলুন',
    btnVoiceSub: 'বাংলায় কথা বলে খুঁজুন',
    btnCamera: 'ছবি দিন',
    btnCameraSub: 'জমির চারা বা পাতার ছবি',
    btnLocation: 'আমার এলাকা',
    btnLocationSub: 'জিপিএস দিয়ে অবস্থান ধরুন',
    btnLocationLoading: 'শনাক্ত হচ্ছে...',
    searchPlaceholder: 'বা সহজ বাংলায় লিখে খুঁজুন (যেমন: রংপুরে আমন ধান, খরা আছে নি?)...',
    btnSearch: 'খুঁজুন',
    currentCropArea: 'বর্তমান ফসল ও এলাকা:',

    // Voice Modal
    voiceModalTitle: '🎤 মুখে বলে খুঁজুন',
    voiceModalDesc: 'মাইক চাপুন এবং আপনার এলাকার নাম ও ফসলের কথা বলুন',
    voiceListening: 'শুনছি...',
    voiceTapMic: 'মাইক চাপুন',
    voiceExamplesTitle: 'বা নিচের একটি উদাহরণে চাপ দিন:',
    voiceClose: 'বন্ধ করুন',
    voicePhrases: [
      'রংপুরে আমন ধান চাষ করুম, বৃষ্টি তো নাই, খরা হইব নি?',
      'দিনাজপুরে আলুর জমিতে পাতা শুকায় যাচ্ছে',
      'বগুড়ায় এবার বোরো ধান দিলে ফলন কেমন পাইব?',
      'সিলেটে হাওরের জমিতে ধান লাগামু'
    ],

    // Camera Modal
    cameraModalTitle: 'ফসলের ছবি দিন',
    cameraModalDesc: 'আপনার জমির চারা বা পাতার ছবি তুলুন। এআই স্বয়ংক্রিয়ভাবে ফসল ও মাটির অবস্থা শনাক্ত করবে।',
    cameraUploadPrompt: 'ক্যামেরা দিয়ে ছবি তুলুন বা গ্যালারি থেকে দিন',
    cameraChangePhoto: 'অন্য ছবি বেছে নিন',
    cameraFormats: 'JPG, PNG সমর্থিত',
    cameraBtnAnalyze: '🔍 ছবি বিশ্লেষণ করুন',
    cameraBtnAnalyzing: 'এআই ছবি বিশ্লেষণ করছে...',
    cameraDetectedCrop: 'শনাক্ত ফসল:',
    cameraMoistureStatus: 'মাটির অবস্থা:',
    cameraArea: 'এলাকা:',
    cameraBtnConfirm: 'এই তথ্য নিয়ে পূর্বাভাস দেখুন ➔',
    cameraClose: 'বন্ধ করুন',

    // Outlook Card
    outlookYieldTitle: 'সম্ভাব্য ফলন পূর্বাভাস',
    outlookYieldExpected: 'প্রত্যাশিত ফলন:',
    outlookDroughtTitle: 'খরার ঝুঁকি',
    outlookWaterlogTitle: 'জলাবদ্ধতা ঝুঁকি',
    outlookRiskIndex: 'ঝুঁকি সূচক:',
    unitTonHa: 'টন/হেক্টর',

    advisoryHeader: '📝 তথ্যভিত্তিক বাংলা পরামর্শ',
    btnListenAudio: '🔊 বাংলায় পরামর্শ শুনুন',
    btnStopAudio: 'অডিও থামান',

    badgeNdvi: '🛰️ NDVI:',
    badgeRain: '🌧️ মোট বৃষ্টি:',
    badgeDryDays: '☀️ খরা দিন:',
    badgeSoilPh: '🌱 মাটির pH:',
    unitMm: 'মিমি',
    unitDays: 'দিন',

    // Season Comparison
    comparisonTitle: '📈 বিগত মৌসুমের সাথে তুলনা (২০২৫ বনাম ২০২৬)',
    comparisonBadge: 'তুলনামূলক চিত্র',
    comp2025Yield: '২০২৫ ফলন',
    comp2026Yield: '২০২৬ পূর্বাভাস',
    compYieldDelta: 'ফলন পরিবর্তন',
    compDroughtShift: 'খরা মাত্রা (২০২৫ ➔ ২০২৬)',

    // Officer Dashboard
    officerTitle: 'কৃষি কর্মকর্তা নিয়ন্ত্রণ প্যানেল (Structured Selector)',
    selectDistrict: 'জেলা নির্বাচন (District)',
    selectCrop: 'ফসল নির্বাচন (Crop)',
    btnRunPredict: '🔍 বিশ্লেষণ ও পূর্বাভাস চালান',
    btnRunningPredict: 'গণনা চলছে...',
    featureWeightsTitle: 'মডেল ফিচার গুরুত্ব সূচক (Feature Importance / SHAP Weights)',
    featureWeightsSub: 'গ্রেডিয়েন্ট বুস্টেড রিগ্রেশন মডেলে কোন নিয়ামকগুলো ফলন ও ঝুঁকিতে সবচেয়ে বেশি প্রভাব ফেলেছে:',
    testMape: 'টেস্ট MAPE:',

    // Map Card
    mapTitle: '🗺️ সেন্টিনেল-২ স্যাটেলাইট ভেজিটেশন ম্যাপ',
    mapSub: 'জেলার বর্তমান উদ্ভিজ্জ ঘনত্ব ও আর্দ্রতা চিত্র',
    mapLegendTitle: '🛰️ সেন্টিনেল-২ NDVI লেজেন্ড',
    mapLegendGreen: '০.৬০ - ১.০০ (সতেজ)',
    mapLegendYellow: '০.৫০ - ০.৫৯ (মাঝারি)',
    mapLegendRed: '০.২৫ - ০.৪৯ (শুষ্ক / খরা)',
    mapPopupDistrict: 'জেলা:',
    mapPopupNdvi: 'সেন্টিনেল-২ NDVI স্কোর:',
    mapPopupHealthy: 'সতেজ ও সুস্থ উদ্ভিদ (Healthy)',
    mapPopupModerate: 'মাঝারি উদ্ভিজ্জ স্বাস্থ্য (Moderate)',
    mapPopupStressed: 'শুষ্ক / উদ্ভিদের পানির অভাব (Stressed)',

    // Disclaimer & Footer
    disclaimerStrong: 'সতর্কীকরণ ও পরামর্শ:',
    disclaimerText: 'এই পূর্বাভাসটি স্যাটেলাইট (Copernicus Sentinel-2), আবহাওয়া (Open-Meteo) এবং ঐতিহাসিক কৃষি তথ্যভিত্তিক একটি ডিজিটাল পরিকল্পনা সহায়তা, এটি কোনো ১০০% নিশ্চয়তা নয়। জমিতে বীজ বপন, সেচ বা সার প্রয়োগের মতো বড় সিদ্ধান্ত গ্রহণের পূর্বে আপনার নিকটস্থ ইউনিয়ন/উপজেলা কৃষি কর্মকর্তার সাথে যাচাই করে নেওয়ার পরামর্শ দেওয়া হচ্ছে।',
    footerSources: 'তথ্যসূত্র: বাংলাদেশ পরিসংখ্যান ব্যুরো (BBS) • কৃষি সম্প্রসারণ অধিদপ্তর (DAE) • Copernicus Sentinel-2 • Open-Meteo • ISRIC SoilGrids',
    footerAuthor: 'ভূমি দৃষ্টি (Bhumi Drishti) v1.1 • তৈরি করেছেন: সারা তাসফিয়া (East West University, ID: 2025-2-60-346)'
  },
  en: {
    // Top Bar
    appTitle: 'Bhumi Drishti',
    appTitleEn: 'Land Vision',
    appSubtitle: 'Satellite & Weather-Based Seasonal Crop Outcome and Climate Risk Predictor',
    modeFarmer: 'Farmer Mode (Simple)',
    modeOfficer: 'Officer Mode (Analytics)',
    switchLang: 'বাংলা',

    // Farmer Mode Box
    farmerTag: '🌾 Zero-Friction Input for Farmers',
    farmerHeadline: 'No typing needed — just speak or take a field photo!',
    btnVoice: 'Voice Input',
    btnVoiceSub: 'Speak in colloquial language',
    btnCamera: 'Field Photo',
    btnCameraSub: 'Snap crop leaf or soil photo',
    btnLocation: 'My Location',
    btnLocationSub: 'Auto-detect via phone GPS',
    btnLocationLoading: 'Locating...',
    searchPlaceholder: 'Or search freely (e.g. Aman rice in Rangpur, is there drought risk?)...',
    btnSearch: 'Search',
    currentCropArea: 'Active Crop & District:',

    // Voice Modal
    voiceModalTitle: '🎤 Speak to Search',
    voiceModalDesc: 'Tap the microphone and state your district and crop in your natural dialect',
    voiceListening: 'Listening...',
    voiceTapMic: 'Tap Mic',
    voiceExamplesTitle: 'Or tap a sample query below:',
    voiceClose: 'Close',
    voicePhrases: [
      'Thinking of planting Aman rice in Rangpur, is there drought risk?',
      'Potato plants in Dinajpur are showing yellowing leaves',
      'What is the expected yield for Boro rice in Bogura this year?',
      'Planning to cultivate paddy in Sylhet Haor wetlands'
    ],

    // Camera Modal
    cameraModalTitle: 'Crop & Field Photo',
    cameraModalDesc: 'Take a photo of your field or leaf. Multimodal AI will identify the crop species and visual soil stress.',
    cameraUploadPrompt: 'Take photo with camera or upload from gallery',
    cameraChangePhoto: 'Choose another photo',
    cameraFormats: 'JPG, PNG supported',
    cameraBtnAnalyze: '🔍 Analyze Photo with AI',
    cameraBtnAnalyzing: 'Analyzing photo...',
    cameraDetectedCrop: 'Detected Crop:',
    cameraMoistureStatus: 'Soil Moisture:',
    cameraArea: 'Region:',
    cameraBtnConfirm: 'View Seasonal Outlook ➔',
    cameraClose: 'Close',

    // Outlook Card
    outlookYieldTitle: 'Projected Yield Outlook',
    outlookYieldExpected: 'Expected Yield:',
    outlookDroughtTitle: 'Drought Risk',
    outlookWaterlogTitle: 'Waterlogging Risk',
    outlookRiskIndex: 'Risk Index:',
    unitTonHa: 'ton/ha',

    advisoryHeader: '📝 Data-Grounded Advisory',
    btnListenAudio: '🔊 Listen to Advisory',
    btnStopAudio: 'Stop Audio',

    badgeNdvi: '🛰️ NDVI:',
    badgeRain: '🌧️ Total Rain:',
    badgeDryDays: '☀️ Dry Days:',
    badgeSoilPh: '🌱 Soil pH:',
    unitMm: 'mm',
    unitDays: 'days',

    // Season Comparison
    comparisonTitle: '📈 Season-Over-Season Comparison (2025 vs 2026)',
    comparisonBadge: 'Comparative Delta',
    comp2025Yield: '2025 Yield',
    comp2026Yield: '2026 Outlook',
    compYieldDelta: 'Yield Shift',
    compDroughtShift: 'Drought Shift (2025 ➔ 2026)',

    // Officer Dashboard
    officerTitle: 'Agricultural Extension Officer Control Panel',
    selectDistrict: 'Select District',
    selectCrop: 'Select Crop',
    btnRunPredict: '🔍 Analyze & Run Prediction',
    btnRunningPredict: 'Computing...',
    featureWeightsTitle: 'Model Feature Importance (SHAP Weights)',
    featureWeightsSub: 'Which environmental factors exerted the highest influence on yield & risk predictions:',
    testMape: 'Test MAPE:',

    // Map Card
    mapTitle: '🗺️ Sentinel-2 Satellite Vegetation Map',
    mapSub: 'Vegetation canopy density and moisture status',
    mapLegendTitle: '🛰️ Sentinel-2 NDVI Legend',
    mapLegendGreen: '0.60 - 1.00 (Healthy)',
    mapLegendYellow: '0.50 - 0.59 (Moderate)',
    mapLegendRed: '0.25 - 0.49 (Dry / Moisture Deficit)',
    mapPopupDistrict: 'District:',
    mapPopupNdvi: 'Sentinel-2 NDVI Score:',
    mapPopupHealthy: 'Healthy Canopy Vigor',
    mapPopupModerate: 'Moderate Canopy Health',
    mapPopupStressed: 'Moisture Stressed / Drought Risk',

    // Disclaimer & Footer
    disclaimerStrong: 'Advisory Disclaimer:',
    disclaimerText: 'This outlook is a data-driven advisory aid based on Copernicus Sentinel-2 satellite observations, Open-Meteo meteorological models, and historical BBS/DAE records. It is not an absolute guarantee. Please consult your local Upazila Agriculture Extension Officer before making capital-intensive planting or irrigation decisions.',
    footerSources: 'Data Sources: Bangladesh Bureau of Statistics (BBS) • Department of Agricultural Extension (DAE) • Copernicus Sentinel-2 • Open-Meteo • ISRIC SoilGrids',
    footerAuthor: 'Bhumi Drishti (Land Vision) v1.1 • Author: Sara Tasfia (East West University, ID: 2025-2-60-346)'
  }
}
