export const CATEGORIES = [
  { key: "food",          label: "Food & Dining",  icon: "🍕", badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
  { key: "travel",        label: "Travel",          icon: "✈️", badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  { key: "home",          label: "Home & Rent",     icon: "🏠", badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
  { key: "entertainment", label: "Entertainment",   icon: "🎬", badge: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300" },
  { key: "shopping",      label: "Shopping",        icon: "🛍️", badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" },
  { key: "health",        label: "Health",          icon: "💊", badge: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
  { key: "utilities",     label: "Utilities",       icon: "💡", badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300" },
  { key: "love",          label: "Love & Dates",   icon: "❤️", badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" },
  { key: "other",         label: "Other",           icon: "💼", badge: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" },
];

const KEYWORDS = {
  food:          ["food","dinner","lunch","breakfast","pizza","restaurant","cafe","coffee","eat","drinks","groceries","grocery","meal","snack","ice cream","burger","chai","biryani","swiggy","zomato","dining","bar","pub","juice","tea","bakery","dosa","thali","paneer","chicken","mutton","fish","noodle","pasta","sandwich","momos","roll","paratha","pav bhaji","chaat","samosa","idli","vada","kebab","starbucks","mcdonald","dominos","domino","kfc","subway","haldiram","barbeque","bbq","tandoori","mughlai","dhaba","canteen","mess","tiffin","khana","restro","eatery","diner","bistro","pizzeria","wine","beer","cocktail","soda","milkshake","lassi","chole","rajma","dal","roti","naan","kulcha","brownie","waffle","pancake","cupcake","dessert","sweet","mithai"],
  travel:        ["travel","trip","flight","hotel","taxi","uber","ola","train","bus","petrol","fuel","cab","auto","metro","airbnb","transport","toll","parking","boat","ferry","ride","rapido","indigo","spicejet","vistara","air india","goibibo","makemytrip","irctc","redbus","airline","airport","railway","luggage","passport","visa","resort","motel","hostel","lodge","oyo","treebo","cleartrip","yatra","diesel","cng","fastag","highway"],
  home:          ["rent","home","house","maintenance","cleaning","furniture","appliance","plumber","repair","society","deposit","ikea","urban clap","urbanclap","carpenter","painter","pest control","renovation","interior","sofa","bed","mattress","curtain","washing machine","fridge","ac service","geyser","chimney","housing","flat","apartment","brokerage","shifting","packers","movers"],
  entertainment: ["movie","netflix","spotify","subscription","game","party","concert","event","ticket","show","bowling","cinema","prime","hotstar","night out","disney","jiocinema","zee5","sonyliv","youtube premium","apple music","gaming","playstation","xbox","steam","imax","pvr","inox","cinepolis","multiplex","carnival","amusement","theme park","waterpark","museum","theatre","theater","drama","stand up","comedy","standup","karaoke","nightclub","lounge","arcade","birthday","anniversary","celebration","festival","diwali","holi","christmas","picnic","outing","hangout","escape room","paintball","trampoline"],
  shopping:      ["shopping","clothes","amazon","flipkart","buy","market","store","zara","shoes","myntra","fashion","mall","purchase","meesho","ajio","nykaa","croma","vijay sales","dmart","big bazaar","lifestyle","max fashion","h&m","uniqlo","decathlon","electronics","gadget","phone","laptop","tablet","headphone","earbuds","watch","jewellery","jewelry","gold","silver","saree","kurta","jeans","dress","cosmetics","makeup","perfume","bag","wallet","sunglasses","accessories","stationery","book","gift","toy","snapdeal","lenskart","pepperfry","bewakoof","souled store"],
  health:        ["doctor","medicine","pharmacy","hospital","medical","gym","health","fitness","yoga","dentist","clinic","apollo","fortis","practo","1mg","netmeds","pharmeasy","lab test","blood test","x-ray","scan","mri","consultation","therapy","physiotherapy","surgery","insurance claim","ambulance","vaccination","vaccine","checkup","eye care","optical","supplement","protein","vitamin","wellness","spa","massage","salon","haircut","parlour","parlor","grooming","facial"],
  love:          ["date","valentine","roses","romantic","romance","anniversary dinner","couple","girlfriend","boyfriend","wife","husband","partner","candle","bouquet","proposal","engagement","honeymoon","love","darling","sweetheart","bae","babe","flower","chocolates","perfume gift","jewellery gift","ring","heart","cuddle","spa couple","movie date","dinner date","rooftop","picnic date","beach date","getaway","staycation"],
  utilities:     ["electricity","internet","wifi","phone bill","gas bill","utility","recharge","broadband","cable","insurance","airtel","jio","vodafone","bsnl","tata sky","dish tv","hathway","act fibernet","postpaid","prepaid","data pack","emi","loan","credit card","bank charge","lic","premium","mutual fund","sip","investment","tax","gst","income tax","property tax","water bill","piped gas","cylinder","indane","hp gas","bharat gas","maintenance charge"],
};

// Detect category from a title string
export function detectCategory(title = "") {
  const lower = title.toLowerCase();
  for (const [key, words] of Object.entries(KEYWORDS)) {
    if (words.some((w) => lower.includes(w))) return key;
  }
  return "other";
}

// Detect category from full OCR text — scores all categories by keyword hit count
export function detectCategoryFromText(rawText = "") {
  const lower = rawText.toLowerCase();
  const scores = {};
  for (const [key, words] of Object.entries(KEYWORDS)) {
    scores[key] = 0;
    for (const w of words) {
      if (lower.includes(w)) scores[key]++;
    }
  }
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  if (best && best[1] > 0) return best[0];
  return "other";
}

export function getCategoryInfo(key) {
  return CATEGORIES.find((c) => c.key === key) || CATEGORIES[CATEGORIES.length - 1];
}
