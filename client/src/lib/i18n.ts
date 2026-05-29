import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "app_name": "Disha",
      "welcome": "Welcome back, Teacher",
      "dashboard": "Dashboard",
      "record": "Record Session",
      "reports": "Reports",
      "portfolio": "Portfolio",
      "growth_score": "Growth Score",
      "inclusion_score": "Inclusion Score",
      "recent_sessions": "Recent Sessions",
      "start_recording": "Start Recording",
      "stop_recording": "Stop Recording",
      "processing_ai": "AI is analyzing your session...",
      "coaching_tips": "AI Coaching Tips",
      "participation": "Participation",
      "teacher_talk": "Teacher Talk",
      "student_talk": "Student Talk",
      "silence": "Silence",
      "wait_time": "Wait Time",
      "login_title": "Empowering Every Teacher",
      "login_subtitle": "An AI that listens to your teaching and helps you grow.",
      "otp_login": "Login with Phone Number",
      "offline_mode": "Offline Mode Active",
      "sync_pending": "Syncing pending sessions..."
    }
  },
  hi: {
    translation: {
      "app_name": "दिशा",
      "welcome": "स्वागत है, शिक्षक",
      "dashboard": "डैशबोर्ड",
      "record": "सत्र रिकॉर्ड करें",
      "reports": "रिपोर्ट",
      "portfolio": "पोर्टफोलियो",
      "growth_score": "विकास स्कोर",
      "inclusion_score": "समावेशन स्कोर",
      "recent_sessions": "हाल के सत्र",
      "start_recording": "रिकॉर्डिंग शुरू करें",
      "stop_recording": "रिकॉर्डिंग बंद करें",
      "processing_ai": "एआई आपके सत्र का विश्लेषण कर रहा है...",
      "coaching_tips": "एआई कोचिंग टिप्स",
      "participation": "भागीदारी",
      "teacher_talk": "शिक्षक संवाद",
      "student_talk": "छात्र संवाद",
      "silence": "मौन",
      "wait_time": "प्रतीक्षा समय",
      "login_title": "हर शिक्षक को सशक्त बनाना",
      "login_subtitle": "एक एआई जो आपके शिक्षण को सुनता है और आपको बढ़ने में मदद करता है।",
      "otp_login": "फोन नंबर के साथ लॉगिन करें",
      "offline_mode": "ऑफलाइन मोड सक्रिय",
      "sync_pending": "लंबित सत्र सिंक हो रहे हैं..."
    }
  },
  mr: {
    translation: {
      "app_name": "दिशा",
      "welcome": "पुन्हा स्वागत आहे, शिक्षक",
      "dashboard": "डॅशबोर्ड",
      "record": "सत्र रेकॉर्ड करा",
      "reports": "अहवाल",
      "portfolio": "पोर्टफोलिओ",
      "growth_score": "वाढ गुण",
      "inclusion_score": "समावेशन गुण",
      "recent_sessions": "अलीकडील सत्रे",
      "start_recording": "रेकॉर्डिंग सुरू करा",
      "stop_recording": "रेकॉर्डिंग थांबवा",
      "processing_ai": "एआय तुमचे सत्र विश्लेषित करत आहे...",
      "coaching_tips": "एआय कोचिंग टिप्स",
      "participation": "सहभाग",
      "teacher_talk": "शिक्षक संवाद",
      "student_talk": "विद्यार्थी संवाद",
      "silence": "मौन",
      "wait_time": "थांबण्याचा वेळ",
      "login_title": "प्रत्येक शिक्षकाला सक्षम करणे",
      "login_subtitle": "एक एआय जी तुमचे अध्यापन ऐकते आणि प्रगतीस मदत करते.",
      "otp_login": "फोन नंबरने लॉगिन करा",
      "offline_mode": "ऑफलाइन मोड सक्रिय",
      "sync_pending": "प्रलंबित सत्रे समक्रमित होत आहेत..."
    }
  },
  te: {
    translation: {
      "app_name": "దిశ",
      "welcome": "తిరిగి స్వాగతం, ఉపాధ్యాయుడా",
      "dashboard": "డాష్‌బోర్డ్",
      "record": "సెషన్ రికార్డ్ చేయండి",
      "reports": "రిపోర్టులు",
      "portfolio": "పోర్ట్‌ఫోలియో",
      "growth_score": "వృద్ధి స్కోరు",
      "inclusion_score": "సమావేశ స్కోరు",
      "recent_sessions": "ఇటీవలి సెషన్లు",
      "start_recording": "రికార్డింగ్ ప్రారంభించు",
      "stop_recording": "రికార్డింగ్ ఆపివేయి",
      "processing_ai": "ఏఐ మీ సెషన్‌ను విశ్లేషిస్తోంది...",
      "coaching_tips": "ఏఐ కోచింగ్ సూచనలు",
      "participation": "భాగస్వామ్యం",
      "teacher_talk": "ఉపాధ్యాయుల మాటలు",
      "student_talk": "విద్యార్థుల మాటలు",
      "silence": "నిశ్శబ్దం",
      "wait_time": "వేచిచూడే సమయం",
      "login_title": "ప్రతి ఉపాధ్యాయుడిని శక్తివంతం చేయడం",
      "login_subtitle": "మీ బోధనను వినే మరియు మీకు ఎదగడంలో సహాయపడే ఏఐ.",
      "otp_login": "ఫోన్ నంబర్‌తో లాగిన్ చేయండి",
      "offline_mode": "ఆఫ్‌లైన్ మోడ్ సక్రియం",
      "sync_pending": "పెండింగ్ సెషన్లు సమకాలీకరిస్తున్నాం..."
    }
  },
  kn: {
    translation: {
      "app_name": "ದಿಶಾ",
      "welcome": "ಮತ್ತೆ ಸ್ವಾಗತ, ಶಿಕ್ಷಕರೇ",
      "dashboard": "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
      "record": "ಸೆಷನ್ ದಾಖಲಿಸಿ",
      "reports": "ವರದಿಗಳು",
      "portfolio": "ಪೋರ್ಟ್‌ಫೋಲಿಯೊ",
      "growth_score": "ವೃದ್ಧಿ ಅಂಕ",
      "inclusion_score": "ಸಮಾವೇಶ ಅಂಕ",
      "recent_sessions": "ಇತ್ತೀಚಿನ ಸೆಷನ್ಗಳು",
      "start_recording": "ದಾಖಲಿಕೆಯನ್ನು ಆರಂಭಿಸಿ",
      "stop_recording": "ದಾಖಲಿಕೆಯನ್ನು ನಿಲ್ಲಿಸಿ",
      "processing_ai": "ಎಐ ನಿಮ್ಮ ಸೆಷನ್ ಅನ್ನು ವಿಶ್ಲೇಷಿಸುತ್ತಿದೆ...",
      "coaching_tips": "ಎಐ ಮಾರ್ಗದರ್ಶನ",
      "participation": "ಪಾಲ್ಗೊಳ್ಳುವಿಕೆ",
      "teacher_talk": "ಶಿಕ್ಷಕರ ಮಾತು",
      "student_talk": "ವಿದ್ಯಾರ್ಥಿಗಳ ಮಾತು",
      "silence": "ಮೌನ",
      "wait_time": "ಕಾಯುವ ಸಮಯ",
      "login_title": "ಪ್ರತಿ ಶಿಕ್ಷಕನನ್ನು ಶಕ್ತಿಮಂತಗೊಳಿಸುವುದು",
      "login_subtitle": "ನಿಮ್ಮ ಬೋಧನೆಯನ್ನು ಕೇಳಿ, ಬೆಳವಣಿಗೆಗೆ ನೆರವಾಗುವ ಎಐ.",
      "otp_login": "ಫೋನ್ ನಂಬರ್ ಬಳಸಿ ಲಾಗಿನ್ ಮಾಡಿ",
      "offline_mode": "ಆಫ್‌ಲೈನ್ ಮೋಡ್ ಸಕ್ರಿಯ",
      "sync_pending": "ಬಾಕಿಯಿರುವ ಸೆಷನ್‌ಗಳು ಸಿಂಕ್ ಆಗುತ್ತಿವೆ..."
    }
  },
  ta: {
    translation: {
      "app_name": "திசா",
      "welcome": "மீண்டும் வரவேற்பு, ஆசிரியரே",
      "dashboard": "டாஷ்போர்டு",
      "record": "அமர்வு பதிவு செய்யவும்",
      "reports": "அறிக்கைகள்",
      "portfolio": "போர்ட்ஃபோலியோ",
      "growth_score": "வளர்ச்சி மதிப்பெண்",
      "inclusion_score": "உள்ளடக்க மதிப்பெண்",
      "recent_sessions": "சமீப அமர்வுகள்",
      "start_recording": "பதிவு தொடங்கவும்",
      "stop_recording": "பதிவை நிறுத்தவும்",
      "processing_ai": "AI உங்கள் அமர்வை பகுப்பாய்வு செய்கிறது...",
      "coaching_tips": "AI வழிகாட்டுதல்",
      "participation": "பங்கேற்பு",
      "teacher_talk": "ஆசிரியர் பேச்சு",
      "student_talk": "மாணவர் பேச்சு",
      "silence": "அமைதி",
      "wait_time": "காத்திருக்கும் நேரம்",
      "login_title": "ஒவ்வொரு ஆசிரியருக்கும் அதிகாரமளித்தல்",
      "login_subtitle": "உங்கள் போதனையை கேட்டு வளர்ச்சிக்கு உதவும் AI.",
      "otp_login": "தொலைபேசி எண்ணுடன் உள்நுழைக",
      "offline_mode": "ஆஃப்லைன் முறை செயல்பாடு",
      "sync_pending": "நிலுவையில் உள்ள அமர்வுகள் ஒத்திசைக்கப்படுகின்றன..."
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'hi', 'mr', 'te', 'kn', 'ta'],
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false,
    }
  });

export default i18n;
