const languageData: { [key: string]: { name: string; flag: string } } = {
  'en': { name: 'English', flag: '🇬🇧' },
  'es': { name: 'Spanish', flag: '🇪🇸' },
  'fr': { name: 'French', flag: '🇫🇷' },
  'de': { name: 'German', flag: '🇩🇪' },
  'zh': { name: 'Chinese', flag: '🇨🇳' },
  'ja': { name: 'Japanese', flag: '🇯🇵' },
  'ko': { name: 'Korean', flag: '🇰🇷' },
  'ar': { name: 'Arabic', flag: '🇸🇦' },
  'pt': { name: 'Portuguese', flag: '🇵🇹' },
  'ru': { name: 'Russian', flag: '🇷🇺' },
  'it': { name: 'Italian', flag: '🇮🇹' },
  'hi': { name: 'Hindi', flag: '🇮🇳' },
  'nl': { name: 'Dutch', flag: '🇳🇱' },
  'sv': { name: 'Swedish', flag: '🇸🇪' },
  'no': { name: 'Norwegian', flag: '🇳🇴' },
  'da': { name: 'Danish', flag: '🇩🇰' },
  'fi': { name: 'Finnish', flag: '🇫🇮' },
  'pl': { name: 'Polish', flag: '🇵🇱' },
  'tr': { name: 'Turkish', flag: '🇹🇷' },
  'uk': { name: 'Ukrainian', flag: '🇺🇦' },
  'he': { name: 'Hebrew', flag: '🇮🇱' },
  'th': { name: 'Thai', flag: '🇹🇭' },
  'vi': { name: 'Vietnamese', flag: '🇻🇳' },
  'id': { name: 'Indonesian', flag: '🇮🇩' },
  'ms': { name: 'Malay', flag: '🇲🇾' },
  'el': { name: 'Greek', flag: '🇬🇷' },
  'cs': { name: 'Czech', flag: '🇨🇿' },
  'hu': { name: 'Hungarian', flag: '🇭🇺' },
  'ro': { name: 'Romanian', flag: '🇷🇴' },
  'bg': { name: 'Bulgarian', flag: '🇧🇬' },
  'hr': { name: 'Croatian', flag: '🇭🇷' },
  'sk': { name: 'Slovak', flag: '🇸🇰' },
  'sl': { name: 'Slovenian', flag: '🇸🇮' },
  'et': { name: 'Estonian', flag: '🇪🇪' },
  'lv': { name: 'Latvian', flag: '🇱🇻' },
  'lt': { name: 'Lithuanian', flag: '🇱🇹' },
  'is': { name: 'Icelandic', flag: '🇮🇸' },
  'ga': { name: 'Irish', flag: '🇮🇪' },
  'mt': { name: 'Maltese', flag: '🇲🇹' },
  'cy': { name: 'Welsh', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
  'gd': { name: 'Scottish Gaelic', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  'ca': { name: 'Catalan', flag: '🇪🇸' }, // Catalan is spoken in Spain
  'eu': { name: 'Basque', flag: '🇪🇸' }, // Basque is spoken in Spain and France
  'gl': { name: 'Galician', flag: '🇪🇸' }, // Galician is spoken in Spain
  'az': { name: 'Azerbaijani', flag: '🇦🇿' },
  'ka': { name: 'Georgian', flag: '🇬🇪' },
  'kk': { name: 'Kazakh', flag: '🇰🇿' },
  'uz': { name: 'Uzbek', flag: '🇺🇿' },
  'tg': { name: 'Tajik', flag: '🇹🇯' },
  'ky': { name: 'Kyrgyz', flag: '🇰🇬' },
  'tk': { name: 'Turkmen', flag: '🇹🇲' },
  'mn': { name: 'Mongolian', flag: '🇲🇳' },
  'lo': { name: 'Lao', flag: '🇱🇦' },
  'km': { name: 'Khmer', flag: '🇰🇭' },
  'my': { name: 'Burmese', flag: '🇲🇲' },
  'ne': { name: 'Nepali', flag: '🇳🇵' },
  'si': { name: 'Sinhala', flag: '🇱🇰' },
  'am': { name: 'Amharic', flag: '🇪🇹' },
  'so': { name: 'Somali', flag: '🇸🇴' },
  'sw': { name: 'Swahili', flag: '🇰🇪' }, // Spoken in multiple East African countries, Kenya flag used as example
  'yo': { name: 'Yoruba', flag: '🇳🇬' },
  'ig': { name: 'Igbo', flag: '🇳🇬' },
  'ha': { name: 'Hausa', flag: '🇳🇬' },
  'zu': { name: 'Zulu', flag: '🇿🇦' },
  'xh': { name: 'Xhosa', flag: '🇿🇦' },
  'af': { name: 'Afrikaans', flag: '🇿🇦' },
  'sq': { name: 'Albanian', flag: '🇦🇱' },
  'mk': { name: 'Macedonian', flag: '🇲🇰' },
  'sr': { name: 'Serbian', flag: '🇷🇸' },
  'bs': { name: 'Bosnian', flag: '🇧🇦' },
  'hy': { name: 'Armenian', flag: '🇦🇲' },
  'ur': { name: 'Urdu', flag: '🇵🇰' },
  'bn': { name: 'Bengali', flag: '🇧🇩' },
  'pa': { name: 'Punjabi', flag: '🇮🇳' },
  'gu': { name: 'Gujarati', flag: '🇮🇳' },
  'ml': { name: 'Malayalam', flag: '🇮🇳' },
  'kn': { name: 'Kannada', flag: '🇮🇳' },
  'te': { name: 'Telugu', flag: '🇮🇳' },
  'ta': { name: 'Tamil', flag: '🇮🇳' },
  'mr': { name: 'Marathi', flag: '🇮🇳' },
  'or': { name: 'Odia', flag: '🇮🇳' },
  'as': { name: 'Assamese', flag: '🇮🇳' },
  'sd': { name: 'Sindhi', flag: '🇵🇰' },
  'ps': { name: 'Pashto', flag: '🇦🇫' },
  'fa': { name: 'Persian', flag: '🇮🇷' },
  'ku': { name: 'Kurdish', flag: '🇮🇶' }, // Spoken in multiple countries, Iraq flag used as example
  'ug': { name: 'Uyghur', flag: '🇨🇳' },
  'dz': { name: 'Dzongkha', flag: '🇧🇹' },
  'sg': { name: 'Sango', flag: '🇨🇫' },
  'sn': { name: 'Shona', flag: '🇿🇼' },
  'mg': { name: 'Malagasy', flag: '🇲🇬' },
  'rw': { name: 'Kinyarwanda', flag: '🇷🇼' },
  'ln': { name: 'Lingala', flag: '🇨🇩' },
  'lu': { name: 'Luba-Katanga', flag: '🇨🇩' },
  'kg': { name: 'Kongo', flag: '🇨🇩' },
  'ak': { name: 'Akan', flag: '🇬🇭' },
  'ff': { name: 'Fulah', flag: '🇸🇳' }, // Spoken in multiple West African countries, Senegal flag used as example
  'wo': { name: 'Wolof', flag: '🇸🇳' },
  'om': { name: 'Oromo', flag: '🇪🇹' },
  'ti': { name: 'Tigrinya', flag: '🇪🇷' },
  'gn': { name: 'Guarani', flag: '🇵🇾' },
  'ay': { name: 'Aymara', flag: '🇧🇴' },
  'qu': { name: 'Quechua', flag: '🇵🇪' },
  'kl': { name: 'Kalaallisut', flag: '🇬🇱' },
  'fo': { name: 'Faroese', flag: '🇫🇴' },
  'sm': { name: 'Samoan', flag: '🇼🇸' },
  'to': { name: 'Tongan', flag: '🇹🇴' },
  'fj': { name: 'Fijian', flag: '🇫🇯' },
  'mh': { name: 'Marshallese', flag: '🇲🇭' },
  'na': { name: 'Nauru', flag: '🇳🇷' },
  'ki': { name: 'Kiribati', flag: '🇰🇮' },
  'tvl': { name: 'Tuvaluan', flag: '🇹🇻' },
  'bi': { name: 'Bislama', flag: '🇻🇺' },
  'nr': { name: 'Ndebele (South)', flag: '🇿🇦' },
  'ss': { name: 'Swati', flag: '🇸🇿' },
  'st': { name: 'Sotho (Southern)', flag: '🇱🇸' },
  'tn': { name: 'Tswana', flag: '🇧🇼' },
  'ts': { name: 'Tsonga', flag: '🇿🇦' },
  've': { name: 'Venda', flag: '🇿🇦' },
  'dv': { name: 'Divehi', flag: '🇲🇻' },
  'ch': { name: 'Chamorro', flag: '🇬🇺' },
  'rn': { name: 'Rundi', flag: '🇧🇮' },
  'ny': { name: 'Nyanja', flag: '🇲🇼' },
  'kj': { name: 'Kwanyama', flag: '🇦🇴' },
  'ng': { name: 'Ndonga', flag: '🇳🇦' },
  'ii': { name: 'Sichuan Yi', flag: '🇨🇳' },
  'za': { name: 'Zhuang', flag: '🇨🇳' },
  'bo': { name: 'Tibetan', flag: '🇨🇳' },
  'jv': { name: 'Javanese', flag: '🇮🇩' },
  'su': { name: 'Sundanese', flag: '🇮🇩' },
  'ceb': { name: 'Cebuano', flag: '🇵🇭' },
  'tl': { name: 'Tagalog', flag: '🇵🇭' },
  'ht': { name: 'Haitian Creole', flag: '🇭🇹' },
  'eo': { name: 'Esperanto', flag: '🏳️' }, // No specific country flag, using white flag
  'io': { name: 'Ido', flag: '🏳️' },
  'ia': { name: 'Interlingua', flag: '🏳️' },
  'vo': { name: 'Volapük', flag: '🏳️' },
  'jbo': { name: 'Lojban', flag: '🏳️' },
  'tok': { name: 'Toki Pona', flag: '🏳️' },
  'art': { name: 'Artificial Language', flag: '🏳️' },
  // Add more languages as needed
};

export function getLanguageData(code: string): { name: string; flag: string } | null {
  return languageData[code.toLowerCase()] || null;
}