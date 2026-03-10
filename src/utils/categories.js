export const CATEGORIES = [
  { key: "food",          label: "Food & Dining",  icon: "🍕", badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
  { key: "travel",        label: "Travel",          icon: "✈️", badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  { key: "home",          label: "Home & Rent",     icon: "🏠", badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
  { key: "entertainment", label: "Entertainment",   icon: "🎬", badge: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300" },
  { key: "shopping",      label: "Shopping",        icon: "🛍️", badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" },
  { key: "health",        label: "Health",          icon: "💊", badge: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
  { key: "utilities",     label: "Utilities",       icon: "💡", badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300" },
  { key: "other",         label: "Other",           icon: "💼", badge: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" },
];

const KEYWORDS = {
  food:          ["food","dinner","lunch","breakfast","pizza","restaurant","cafe","coffee","eat","drinks","groceries","grocery","meal","snack","ice cream","burger","chai","biryani","swiggy","zomato","dining","bar","pub","juice","tea"],
  travel:        ["travel","trip","flight","hotel","taxi","uber","ola","train","bus","petrol","fuel","cab","auto","metro","airbnb","transport","toll","parking","boat","ferry","ride"],
  home:          ["rent","home","house","maintenance","cleaning","furniture","appliance","electricity","water","plumber","repair","society","deposit"],
  entertainment: ["movie","netflix","spotify","subscription","game","party","concert","event","ticket","show","bowling","cinema","prime","hotstar","night out"],
  shopping:      ["shopping","clothes","amazon","flipkart","buy","market","store","zara","shoes","myntra","fashion","mall","purchase"],
  health:        ["doctor","medicine","pharmacy","hospital","medical","gym","health","fitness","yoga","dentist","clinic"],
  utilities:     ["electricity","internet","wifi","phone","bill","gas","utility","recharge","dtv","broadband","cable","insurance"],
};

export function detectCategory(title = "") {
  const lower = title.toLowerCase();
  for (const [key, words] of Object.entries(KEYWORDS)) {
    if (words.some((w) => lower.includes(w))) return key;
  }
  return "other";
}

export function getCategoryInfo(key) {
  return CATEGORIES.find((c) => c.key === key) || CATEGORIES[CATEGORIES.length - 1];
}
