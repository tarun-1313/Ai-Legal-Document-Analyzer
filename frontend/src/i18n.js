import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "nav": {
        "dashboard": "Dashboard",
        "analytics": "Analytics",
        "chat": "Legal AI Chat",
        "upload": "Upload Document",
        "logout": "Logout"
      },
      "dashboard": {
        "title": "Legal Risk Intelligence",
        "subtitle": "Multilingual AI Safety Advisor",
        "easy_mode": "Easy Mode",
        "prof_mode": "Professional Mode",
        "risk_score": "Safety Score",
        "summary": "Executive Summary",
        "risks": "Risk Analysis",
        "clauses": "Clause Analysis",
        "recommendations": "AI Recommendations"
      },
      "analytics": {
        "title": "Legal Risk Intelligence Dashboard",
        "scorecard": "Risk Summary Scorecard",
        "attention_areas": "Risk Attention Areas",
        "loss_areas": "Potential Loss Areas",
        "negotiation_tips": "What to Negotiate?",
        "safety_score": "Safety Score",
        "financial_risk": "Financial Safety",
        "legal_risk": "Legal Safety",
        "compliance_risk": "Compliance Safety",
        "ownership_risk": "Ownership Safety"
      }
    }
  },
  hi: {
    translation: {
      "nav": {
        "dashboard": "डैशबोर्ड",
        "analytics": "एनालिटिक्स",
        "chat": "कानूनी AI चैट",
        "upload": "दस्तावेज़ अपलोड करें",
        "logout": "लॉगआउट"
      },
      "dashboard": {
        "title": "कानूनी जोखिम इंटेलिजेंस",
        "subtitle": "बहुभाषी AI सुरक्षा सलाहकार",
        "easy_mode": "आसान मोड",
        "prof_mode": "प्रोफेशनल मोड",
        "risk_score": "सुरक्षा स्कोर",
        "summary": "कार्यकारी सारांश",
        "risks": "जोखिम विश्लेषण",
        "clauses": "खंड विश्लेषण",
        "recommendations": "AI सिफारिशें"
      },
      "analytics": {
        "title": "कानूनी जोखिम इंटेलिजेंस डैशबोर्ड",
        "scorecard": "जोखिम सारांश स्कोरकार्ड",
        "attention_areas": "जोखिम ध्यान क्षेत्र",
        "loss_areas": "संभावित हानि क्षेत्र",
        "negotiation_tips": "क्या बातचीत करें?",
        "safety_score": "सुरक्षा स्कोर",
        "financial_risk": "वित्तीय सुरक्षा",
        "legal_risk": "कानूनी सुरक्षा",
        "compliance_risk": "अनुपालन सुरक्षा",
        "ownership_risk": "स्वामित्व सुरक्षा"
      }
    }
  }
  // Add more languages as needed...
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
