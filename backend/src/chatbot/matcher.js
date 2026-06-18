const knowledgeBase = require('./knowledge-base');

const SUPPORTED_LANGS = ['en', 'ta', 'hi', 'bn', 'ml', 'te'];

const FALLBACK = {
  en: `I'm sorry, I didn't understand that. Here are some things you can ask me:

<ul>
  <li>"How do I <strong>sign up</strong>?"</li>
  <li>"What <strong>courses</strong> do you offer?"</li>
  <li>"What is the <strong>price</strong>?"</li>
  <li>"Show me <strong>Web Development</strong> courses"</li>
  <li>"How do I <strong>start</strong> learning?"</li>
</ul>`,
  ta: `மன்னிக்கவும், எனக்கு புரியவில்லை. நீங்கள் கேட்கக்கூடிய சில விஷயங்கள்:

<ul>
  <li>"நான் எப்படி <strong>பதிவு</strong> செய்வது?"</li>
  <li>"என்ன <strong>படிப்புகள்</strong> உள்ளன?"</li>
  <li>"<strong>விலை</strong> என்ன?"</li>
  <li>"<strong>வெப் டெவலப்மென்ட்</strong> படிப்புகளைக் காட்டு"</li>
  <li>"நான் எப்படி <strong>கற்றலைத் தொடங்க</strong> வேண்டும்?"</li>
</ul>`,
  hi: `क्षमा करें, मैं समझ नहीं पाया। आप ये पूछ सकते हैं:

<ul>
  <li>"मैं कैसे <strong>साइन अप</strong> करूँ?"</li>
  <li>"आप <strong>कौन से कोर्स</strong> प्रदान करते हैं?"</li>
  <li>"<strong>कीमत</strong> क्या है?"</li>
  <li>"<strong>वेब डेवलपमेंट</strong> कोर्स दिखाएँ"</li>
  <li>"मैं कैसे <strong>सीखना शुरू</strong> करूँ?"</li>
</ul>`,
  bn: `দুঃখিত, আমি বুঝতে পারিনি। আপনি এই বিষয়গুলি জিজ্ঞাসা করতে পারেন:

<ul>
  <li>"আমি কিভাবে <strong>সাইন আপ</strong> করব?"</li>
  <li>"আপনারা <strong>কী কী কোর্স</strong> অফার করেন?"</li>
  <li>"<strong>মূল্য</strong> কত?"</li>
  <li>"<strong>ওয়েব ডেভেলপমেন্ট</strong> কোর্স দেখান"</li>
  <li>"আমি কিভাবে <strong>শেখা শুরু</strong> করব?"</li>
</ul>`,
  ml: `ക്ഷമിക്കണം, എനിക്ക് മനസ്സിലായില്ല. നിങ്ങൾക്ക് ഇവ ചോദിക്കാം:

<ul>
  <li>"ഞാൻ എങ്ങനെ <strong>സൈൻ അപ്പ്</strong> ചെയ്യും?"</li>
  <li>"നിങ്ങൾ <strong>എന്ത് കോഴ്സുകൾ</strong> വാഗ്ദാനം ചെയ്യുന്നു?"</li>
  <li>"<strong>വില</strong> എത്രയാണ്?"</li>
  <li>"<strong>വെബ് ഡെവലപ്മെന്റ്</strong> കോഴ്സുകൾ കാണിക്കൂ"</li>
  <li>"ഞാൻ എങ്ങനെ <strong>പഠനം ആരംഭിക്കും</strong>?"</li>
</ul>`,
  te: `క్షమించండి, నాకు అర్థం కాలేదు. మీరు ఈ విషయాలు అడగవచ్చు:

<ul>
  <li>"నేను ఎలా <strong>సైన్ అప్</strong> చేయాలి?"</li>
  <li>"మీరు <strong>ఏ కోర్సులు</strong> అందిస్తారు?"</li>
  <li>"<strong>ధర</strong> ఎంత?"</li>
  <li>"<strong>వెబ్ డెవలప్మెంట్</strong> కోర్సులు చూపించు"</li>
  <li>"నేను ఎలా <strong>నేర్చుకోవడం ప్రారంభించాలి</strong>?"</li>
</ul>`,
};

function tokenize(str) {
  return str.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/\s+/)
    .filter(Boolean);
}

function getScore(input, entry) {
  const lower = input.toLowerCase().trim();
  const words = new Set(tokenize(lower));
  let weightSum = 0;

  for (const kw of entry.keywords) {
    const kwLower = kw.toLowerCase();
    if (kwLower.includes(' ')) {
      if (lower.includes(kwLower)) {
        weightSum += kwLower.split(/\s+/).length * 2;
      }
    } else {
      if (words.has(kwLower)) {
        weightSum += 1;
      }
    }
  }

  return weightSum * entry.priority;
}

function getReply(message, language = 'en') {
  const lang = SUPPORTED_LANGS.includes(language) ? language : 'en';

  if (!message || typeof message !== 'string') {
    return { reply: FALLBACK[lang] };
  }

  const input = message.trim();
  if (!input) {
    return { reply: FALLBACK[lang] };
  }

  let bestEntry = null;
  let bestScore = 0;

  for (const entry of knowledgeBase) {
    const score = getScore(input, entry);
    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  if (bestEntry && bestScore >= 0.5) {
    const answer = bestEntry.answer[lang] || bestEntry.answer.en;
    return { reply: answer };
  }

  return { reply: FALLBACK[lang] };
}

module.exports = { getReply };
