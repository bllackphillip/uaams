export const STUDY_LEVELS = ["Bachelor", "Master", "PhD"];

export const QUALIFICATIONS = [
  "High School / A-Levels",
  "Foundation / Pre-University",
  "Diploma",
  "Bachelor's Degree",
  "Master's Degree",
  "Other",
];

// Each entry has a name (stored in DB) and ISO 3166-1 alpha-2 code (for flag emoji)
export const COUNTRIES = [
  { name: "Afghanistan", code: "AF" },
  { name: "Albania", code: "AL" },
  { name: "Algeria", code: "DZ" },
  { name: "Andorra", code: "AD" },
  { name: "Angola", code: "AO" },
  { name: "Antigua and Barbuda", code: "AG" },
  { name: "Argentina", code: "AR" },
  { name: "Armenia", code: "AM" },
  { name: "Australia", code: "AU" },
  { name: "Austria", code: "AT" },
  { name: "Azerbaijan", code: "AZ" },
  { name: "Bahamas", code: "BS" },
  { name: "Bahrain", code: "BH" },
  { name: "Bangladesh", code: "BD" },
  { name: "Barbados", code: "BB" },
  { name: "Belarus", code: "BY" },
  { name: "Belgium", code: "BE" },
  { name: "Belize", code: "BZ" },
  { name: "Bhutan", code: "BT" },
  { name: "Bolivia", code: "BO" },
  { name: "Bosnia and Herzegovina", code: "BA" },
  { name: "Botswana", code: "BW" },
  { name: "Brazil", code: "BR" },
  { name: "Brunei", code: "BN" },
  { name: "Bulgaria", code: "BG" },
  { name: "Cambodia", code: "KH" },
  { name: "Cameroon", code: "CM" },
  { name: "Canada", code: "CA" },
  { name: "Chad", code: "TD" },
  { name: "Chile", code: "CL" },
  { name: "China", code: "CN" },
  { name: "Colombia", code: "CO" },
  { name: "Costa Rica", code: "CR" },
  { name: "Croatia", code: "HR" },
  { name: "Cuba", code: "CU" },
  { name: "Cyprus", code: "CY" },
  { name: "Czech Republic", code: "CZ" },
  { name: "Denmark", code: "DK" },
  { name: "Dominican Republic", code: "DO" },
  { name: "Ecuador", code: "EC" },
  { name: "Egypt", code: "EG" },
  { name: "El Salvador", code: "SV" },
  { name: "Estonia", code: "EE" },
  { name: "Ethiopia", code: "ET" },
  { name: "Finland", code: "FI" },
  { name: "France", code: "FR" },
  { name: "Georgia", code: "GE" },
  { name: "Germany", code: "DE" },
  { name: "Ghana", code: "GH" },
  { name: "Greece", code: "GR" },
  { name: "Guatemala", code: "GT" },
  { name: "Haiti", code: "HT" },
  { name: "Honduras", code: "HN" },
  { name: "Hungary", code: "HU" },
  { name: "Iceland", code: "IS" },
  { name: "India", code: "IN" },
  { name: "Indonesia", code: "ID" },
  { name: "Iran", code: "IR" },
  { name: "Iraq", code: "IQ" },
  { name: "Ireland", code: "IE" },
  { name: "Israel", code: "IL" },
  { name: "Italy", code: "IT" },
  { name: "Jamaica", code: "JM" },
  { name: "Japan", code: "JP" },
  { name: "Jordan", code: "JO" },
  { name: "Kazakhstan", code: "KZ" },
  { name: "Kenya", code: "KE" },
  { name: "Kuwait", code: "KW" },
  { name: "Kyrgyzstan", code: "KG" },
  { name: "Latvia", code: "LV" },
  { name: "Lebanon", code: "LB" },
  { name: "Libya", code: "LY" },
  { name: "Lithuania", code: "LT" },
  { name: "Luxembourg", code: "LU" },
  { name: "Malaysia", code: "MY" },
  { name: "Maldives", code: "MV" },
  { name: "Malta", code: "MT" },
  { name: "Mexico", code: "MX" },
  { name: "Moldova", code: "MD" },
  { name: "Mongolia", code: "MN" },
  { name: "Montenegro", code: "ME" },
  { name: "Morocco", code: "MA" },
  { name: "Mozambique", code: "MZ" },
  { name: "Myanmar", code: "MM" },
  { name: "Namibia", code: "NA" },
  { name: "Nepal", code: "NP" },
  { name: "Netherlands", code: "NL" },
  { name: "New Zealand", code: "NZ" },
  { name: "Nigeria", code: "NG" },
  { name: "North Macedonia", code: "MK" },
  { name: "Norway", code: "NO" },
  { name: "Oman", code: "OM" },
  { name: "Pakistan", code: "PK" },
  { name: "Palestine", code: "PS" },
  { name: "Panama", code: "PA" },
  { name: "Paraguay", code: "PY" },
  { name: "Peru", code: "PE" },
  { name: "Philippines", code: "PH" },
  { name: "Poland", code: "PL" },
  { name: "Portugal", code: "PT" },
  { name: "Qatar", code: "QA" },
  { name: "Romania", code: "RO" },
  { name: "Russia", code: "RU" },
  { name: "Rwanda", code: "RW" },
  { name: "Saudi Arabia", code: "SA" },
  { name: "Senegal", code: "SN" },
  { name: "Serbia", code: "RS" },
  { name: "Singapore", code: "SG" },
  { name: "Slovakia", code: "SK" },
  { name: "Slovenia", code: "SI" },
  { name: "Somalia", code: "SO" },
  { name: "South Africa", code: "ZA" },
  { name: "South Korea", code: "KR" },
  { name: "Spain", code: "ES" },
  { name: "Sri Lanka", code: "LK" },
  { name: "Sudan", code: "SD" },
  { name: "Sweden", code: "SE" },
  { name: "Switzerland", code: "CH" },
  { name: "Syria", code: "SY" },
  { name: "Taiwan", code: "TW" },
  { name: "Tajikistan", code: "TJ" },
  { name: "Tanzania", code: "TZ" },
  { name: "Thailand", code: "TH" },
  { name: "Tunisia", code: "TN" },
  { name: "Turkey", code: "TR" },
  { name: "Turkmenistan", code: "TM" },
  { name: "Uganda", code: "UG" },
  { name: "Ukraine", code: "UA" },
  { name: "United Arab Emirates", code: "AE" },
  { name: "United Kingdom", code: "GB" },
  { name: "United States", code: "US" },
  { name: "Uzbekistan", code: "UZ" },
  { name: "Venezuela", code: "VE" },
  { name: "Vietnam", code: "VN" },
  { name: "Yemen", code: "YE" },
  { name: "Zambia", code: "ZM" },
  { name: "Zimbabwe", code: "ZW" },
];

// Converts ISO 3166-1 alpha-2 code to flag emoji (e.g. "GB" → "🇬🇧")
export function countryFlag(code) {
  return code.toUpperCase().split("").map((c) =>
    String.fromCodePoint(c.charCodeAt(0) + 127397)
  ).join("");
}

export const MIN_AGE_BY_LEVEL = { Bachelor: 17, Master: 21, PhD: 23 };

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];

export const CURRENT_YEAR = new Date().getFullYear();
export const GRADUATION_YEARS = Array.from(
  { length: CURRENT_YEAR - 1969 },
  (_, i) => CURRENT_YEAR - i
);

// 4 Solent campuses with courses per study level
export const UNIVERSITIES = [
  {
    id: "solent-southampton",
    name: "Solent University Southampton",
    courses: {
      Bachelor: [
        "BSc (Hons) Computer Science",
        "BSc (Hons) Cyber Security",
        "BSc (Hons) Business Management",
        "BSc (Hons) Maritime Technology",
        "BSc (Hons) Marine Engineering",
        "BSc (Hons) Sport and Exercise Science",
        "BA (Hons) Media & Journalism",
      ],
      Master: [
        "MSc Data Science",
        "MSc Cyber Security",
        "MBA Business Administration",
        "MSc Maritime Operations",
        "MSc Engineering Management",
      ],
      PhD: [
        "PhD Computer Science",
        "PhD Maritime Studies",
        "PhD Business Research",
      ],
    },
  },
  {
    id: "solent-london",
    name: "Solent University London",
    courses: {
      Bachelor: [
        "BA (Hons) Fashion Design",
        "BA (Hons) Graphic Design",
        "BSc (Hons) Marketing",
        "BA (Hons) Film Production",
        "BA (Hons) Advertising & Brand Management",
        "BSc (Hons) Events Management",
      ],
      Master: [
        "MA Fashion Design",
        "MSc Marketing Management",
        "MA Film & Television",
        "MSc Digital Marketing",
      ],
      PhD: [
        "PhD Design Research",
        "PhD Media Studies",
      ],
    },
  },
  {
    id: "solent-manchester",
    name: "Solent University Manchester",
    courses: {
      Bachelor: [
        "BSc (Hons) Engineering Technology",
        "BSc (Hons) Construction Management",
        "BSc (Hons) Project Management",
        "BSc (Hons) Digital Technology",
        "BSc (Hons) Architecture",
      ],
      Master: [
        "MSc Engineering Management",
        "MSc Construction Project Management",
        "MSc Digital Infrastructure",
      ],
      PhD: [
        "PhD Engineering Research",
        "PhD Built Environment",
      ],
    },
  },
  {
    id: "solent-birmingham",
    name: "Solent University Birmingham",
    courses: {
      Bachelor: [
        "BSc (Hons) Healthcare Management",
        "BA (Hons) Education Studies",
        "BSc (Hons) Psychology",
        "BSc (Hons) Social Work",
        "BSc (Hons) Public Health",
      ],
      Master: [
        "MSc Healthcare Leadership",
        "MSc Educational Leadership",
        "MSc Counselling Psychology",
      ],
      PhD: [
        "PhD Health Sciences",
        "PhD Educational Research",
      ],
    },
  },
];

const MONTH_MAP = {
  January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
  July: 6, August: 7, September: 8, October: 9, November: 10, December: 11,
};

function intakeToDate(intake) {
  const [month, year] = intake.split(" ");
  return new Date(parseInt(year), MONTH_MAP[month], 1);
}

// Different intake schedules per level, filtered to future dates only
const ALL_INTAKES_BY_LEVEL = {
  Bachelor: ["September 2026", "January 2027", "September 2027", "January 2028"],
  Master:   ["September 2026", "January 2027", "April 2027",     "September 2027"],
  PhD:      ["September 2026", "January 2027", "September 2027"],
};

const now = new Date();
export const INTAKES_BY_LEVEL = Object.fromEntries(
  Object.entries(ALL_INTAKES_BY_LEVEL).map(([level, intakes]) => [
    level,
    intakes.filter((i) => intakeToDate(i) >= now),
  ])
);

// Flat de-duplicated list for backward compatibility
export const INTAKES = [...new Set(Object.values(INTAKES_BY_LEVEL).flat())].sort(
  (a, b) => intakeToDate(a) - intakeToDate(b)
);
