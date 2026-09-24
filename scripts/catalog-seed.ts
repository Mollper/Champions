/**
 * Universities for the AI catalog: only names and countries are chosen by hand —
 * a spread of regions, study areas (tech, medicine, business, law, design, arts,
 * media) and admission difficulty, from the most selective to open
 * ones. Everything else (costs, requirements, deadlines, photos) comes from the
 * pipeline in src/lib/catalog.
 */
export const SEED: { name: string; country: string }[] = [
  // United States: from Stanford to open state universities, plus art, music and media schools
  { name: "Stanford University", country: "US" },
  { name: "University of California, Berkeley", country: "US" },
  { name: "University of Michigan", country: "US" },
  { name: "New York University", country: "US" },
  { name: "Northeastern University", country: "US" },
  { name: "Purdue University", country: "US" },
  { name: "University of Illinois Urbana-Champaign", country: "US" },
  { name: "University of Arizona", country: "US" },
  { name: "Rhode Island School of Design", country: "US" },
  { name: "Berklee College of Music", country: "US" },
  { name: "Emerson College", country: "US" },
  // Canada
  { name: "University of British Columbia", country: "CA" },
  { name: "McGill University", country: "CA" },
  { name: "University of Waterloo", country: "CA" },
  { name: "Simon Fraser University", country: "CA" },
  { name: "York University", country: "CA" },
  // United Kingdom
  { name: "Imperial College London", country: "GB" },
  { name: "London School of Economics", country: "GB" },
  { name: "King's College London", country: "GB" },
  { name: "University of Edinburgh", country: "GB" },
  { name: "University of Leeds", country: "GB" },
  { name: "Coventry University", country: "GB" },
  { name: "University of the Arts London", country: "GB" },
  { name: "Goldsmiths, University of London", country: "GB" },
  // Germany
  { name: "RWTH Aachen University", country: "DE" },
  { name: "Heidelberg University", country: "DE" },
  { name: "Technische Universität Berlin", country: "DE" },
  { name: "Constructor University", country: "DE" },
  { name: "Berlin University of the Arts", country: "DE" },
  // Netherlands
  { name: "University of Amsterdam", country: "NL" },
  { name: "Maastricht University", country: "NL" },
  { name: "Erasmus University Rotterdam", country: "NL" },
  { name: "University of Twente", country: "NL" },
  // Italy
  { name: "Bocconi University", country: "IT" },
  { name: "University of Bologna", country: "IT" },
  { name: "Sapienza University of Rome", country: "IT" },
  { name: "University of Padua", country: "IT" },
  { name: "Polytechnic University of Turin", country: "IT" },
  // Czechia
  { name: "Czech Technical University in Prague", country: "CZ" },
  { name: "Masaryk University", country: "CZ" },
  { name: "Prague University of Economics and Business", country: "CZ" },
  // South Korea
  { name: "Seoul National University", country: "KR" },
  { name: "Yonsei University", country: "KR" },
  { name: "Korea University", country: "KR" },
  { name: "Sungkyunkwan University", country: "KR" },
  // Singapore and Hong Kong
  { name: "Nanyang Technological University", country: "SG" },
  { name: "Singapore Management University", country: "SG" },
  { name: "Hong Kong University of Science and Technology", country: "HK" },
  { name: "Chinese University of Hong Kong", country: "HK" },
  { name: "City University of Hong Kong", country: "HK" },
  // Australia and New Zealand
  { name: "University of New South Wales", country: "AU" },
  { name: "Monash University", country: "AU" },
  { name: "University of Queensland", country: "AU" },
  { name: "Australian National University", country: "AU" },
  { name: "Deakin University", country: "AU" },
  { name: "University of Auckland", country: "NZ" },
  { name: "University of Otago", country: "NZ" },
  // Turkey
  { name: "Sabancı University", country: "TR" },
  { name: "Bilkent University", country: "TR" },
  { name: "Middle East Technical University", country: "TR" },
  { name: "Istanbul Technical University", country: "TR" },
  // Kazakhstan and Uzbekistan: strong options close to home
  { name: "Kazakh-British Technical University", country: "KZ" },
  { name: "KIMEP University", country: "KZ" },
  { name: "Satbayev University", country: "KZ" },
  { name: "Al-Farabi Kazakh National University", country: "KZ" },
  { name: "Westminster International University in Tashkent", country: "UZ" },
  { name: "Inha University Tashkent", country: "UZ" },
  // Switzerland
  { name: "École Polytechnique Fédérale de Lausanne", country: "CH" },
  { name: "University of Zurich", country: "CH" },
  { name: "University of Geneva", country: "CH" },
  { name: "University of St. Gallen", country: "CH" },
  // France
  { name: "Sorbonne University", country: "FR" },
  { name: "Paris-Saclay University", country: "FR" },
  { name: "École polytechnique", country: "FR" },
  { name: "ESCP Business School", country: "FR" },
  // Spain and Portugal
  { name: "IE University", country: "ES" },
  { name: "University of Salamanca", country: "ES" },
  { name: "Complutense University of Madrid", country: "ES" },
  { name: "Pompeu Fabra University", country: "ES" },
  { name: "University of Lisbon", country: "PT" },
  { name: "University of Porto", country: "PT" },
  // Ireland
  { name: "Trinity College Dublin", country: "IE" },
  { name: "University College Dublin", country: "IE" },
  { name: "University of Galway", country: "IE" },
  // Hungary and Poland: medicine and engineering in English at moderate prices
  { name: "Semmelweis University", country: "HU" },
  { name: "University of Debrecen", country: "HU" },
  { name: "Budapest University of Technology and Economics", country: "HU" },
  { name: "Eötvös Loránd University", country: "HU" },
  { name: "University of Warsaw", country: "PL" },
  { name: "Warsaw University of Technology", country: "PL" },
  { name: "Jagiellonian University", country: "PL" },
  { name: "Kozminski University", country: "PL" },
  // Austria, Belgium and the Nordics
  { name: "University of Vienna", country: "AT" },
  { name: "TU Wien", country: "AT" },
  { name: "KU Leuven", country: "BE" },
  { name: "Ghent University", country: "BE" },
  { name: "KTH Royal Institute of Technology", country: "SE" },
  { name: "Lund University", country: "SE" },
  { name: "University of Helsinki", country: "FI" },
  { name: "Aalto University", country: "FI" },
  // Japan and China
  { name: "University of Tokyo", country: "JP" },
  { name: "Waseda University", country: "JP" },
  { name: "Keio University", country: "JP" },
  { name: "Ritsumeikan Asia Pacific University", country: "JP" },
  { name: "Tsinghua University", country: "CN" },
  { name: "Peking University", country: "CN" },
  { name: "Zhejiang University", country: "CN" },
  { name: "Fudan University", country: "CN" },
  // Malaysia and the UAE
  { name: "University of Malaya", country: "MY" },
  { name: "Taylor's University", country: "MY" },
  { name: "Universiti Teknologi Malaysia", country: "MY" },
  { name: "Khalifa University", country: "AE" },
  { name: "New York University Abu Dhabi", country: "AE" },
  { name: "American University of Sharjah", country: "AE" },
  { name: "United Arab Emirates University", country: "AE" },
];
// UniRoute · scripts/catalog-seed.ts
