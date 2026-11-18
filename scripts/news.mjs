// Reads public news feeds and turns each headline into a signal: which sectors move and which way.
// The real text is only used for matching, it is never stored or shown.
export const FEEDS = [
  ['BBC', 'https://feeds.bbci.co.uk/news/business/rss.xml'],
  ['BBC', 'https://feeds.bbci.co.uk/news/technology/rss.xml'],
  ['BBC', 'https://feeds.bbci.co.uk/news/world/rss.xml'],
  ['NPR', 'https://feeds.npr.org/1006/rss.xml'],
  ['NPR', 'https://feeds.npr.org/1001/rss.xml'],
  ['Guardian', 'https://www.theguardian.com/business/rss'],
  ['Guardian', 'https://www.theguardian.com/technology/rss'],
  ['CNBC', 'https://www.cnbc.com/id/10001147/device/rss/rss.html'],
  ['CNBC', 'https://www.cnbc.com/id/19854910/device/rss/rss.html'],
];

// sign: +1 moves with the headline's mood, -1 against it. first listed sector is the primary one.
export const RULES = [
  { w: /\b(?:chips?|semiconductors?|nvidia|tsmc|intel|processors?|microchips?|wafers?)\b/i, fx: [['chips', 1], ['gadget', 0.3], ['ai', 0.4]] },
  { w: /\b(software|saas|cybersecurity|hack(?:ed|ers?)?|data breach|microsoft|oracle|salesforce|cloud)\b/i, fx: [['soft', 1]] },
  { w: /\b(ai|a\.i\.|openai|chatbot|artificial intelligence|generative|anthropic|large language|gemini|chatgpt)\b/i, fx: [['ai', 1], ['chips', 0.5], ['soft', 0.3]] },
  { w: /\b(facebook|meta|instagram|tiktok|social media|snapchat|twitter|youtube|influencer|x corp|teen\w* online)\b/i, fx: [['social', 1], ['media', 0.2]] },
  { w: /\b(apple|iphone|samsung|smartphone|gadget|laptop|wearable|headset|android|google pixel)\b/i, fx: [['gadget', 1], ['chips', 0.3]] },
  { w: /\b(tesla|ford|general motors|toyota|volkswagen|electric vehicle|ev sales|car sales|carmaker|automaker|recall)\b/i, fx: [['auto', 1], ['metal', 0.2]] },
  { w: /\b(oil|crude|opec|gasoline|petrol|refiner\w*|petroleum|natural gas|lng|fuel prices)\b/i, fx: [['oil', 1], ['air', -0.5], ['ship', -0.3], ['green', 0.2]] },
  { w: /\b(solar|wind farm|wind power|renewable|clean energy|battery|climate|emissions|net zero|heat ?wave)\b/i, fx: [['green', 1], ['oil', -0.3]] },
  { w: /\b(airline|boeing|airbus|flight\w*|airport|air travel|tourism|travel|faa|cruise|holiday travel)\b/i, fx: [['air', 1]] },
  { w: /\b(shipping|port|freight|supply chain|container|suez|cargo|tariff\w*|trade war|logistics|strike at)\b/i, fx: [['ship', 1], ['retail', -0.3]] },
  { w: /\b(bank|banks|banking|lender|lending|jpmorgan|goldman|credit|loan\w*|the fed|fed (?:chair|rates?|cuts?|hikes?|meeting|minutes|officials?)|federal reserve|interest rate\w*|mortgage rate\w*)\b/i, fx: [['bank', 1], ['home', 0.4]] },
  { w: /\b(bitcoin|crypto\w*|ethereum|blockchain|stablecoin|token|coinbase|binance)\b/i, fx: [['crypto', 1]] },
  { w: /\b(insurance|insurer\w*|claims?|hurricane|wildfire|flood\w*|earthquake|storm|tornado|disaster)\b/i, fx: [['insure', -1], ['home', -0.4]] },
  { w: /\b(housing|home prices?|real estate|mortgage|rent|landlord|homebuyer\w*|property market)\b/i, fx: [['home', 1], ['bank', 0.2]] },
  { w: /\b(fda|drug\w*|vaccine\w*|pharma\w*|biotech|clinical trial|medicine|obesity|ozempic)\b/i, fx: [['pharma', 1]] },
  { w: /\b(food|grocer\w*|crop\w*|harvest|wheat|corn|coffee|cocoa|egg\w*|beef|farm\w*|restaurant\w*|snack\w*|inflation)\b/i, fx: [['food', 1], ['retail', 0.2]] },
  { w: /\b(retail\w*|amazon|walmart|target|shoppers?|consumer spending|holiday sales|black friday|e-commerce|store closures?)\b/i, fx: [['retail', 1], ['ship', 0.3]] },
  { w: /\b(netflix|disney|streaming|box office|hollywood|video game\w*|gaming|nintendo|sony|spotify|film|studio)\b/i, fx: [['media', 1]] },
  { w: /\b(space|nasa|spacex|rocket\w*|satellite\w*|defen[cs]e|missile\w*|pentagon|military|drone\w*)\b/i, fx: [['space', 1], ['oil', 0.2]] },
  { w: /\b(gold|copper|lithium|mining|miners?|steel|aluminium|aluminum|silver|metals?|rare earths?|nickel)\b/i, fx: [['metal', 1], ['auto', 0.1]] },
];
// market-wide headlines: every sector moves a little in line with its beta
export const MACRO = /\b(stock market|wall street|dow|s&p|nasdaq|recession|inflation|jobs report|unemployment|gdp|economy|economic|rate cut|rate hike|stocks|shares|market rout|sell-?off|rally)\b/i;

const UP = /\b(bumper|boost\w*|surge\w*|soar\w*|jump\w*|rise\w*|rises|rose|record|beat\w*|rall(?:y|ies|ied)|gain\w*|boom\w*|deal|approve\w*|win\w*|growth|strong|rebound\w*|up|higher|hire\w*|launch\w*|expand\w*|profit\w*|breakthrough|cut(?:s)? rates?|ease\w*)\b/i;
const DOWN = /\b(fall\w*|fell|drop\w*|plunge\w*|slump\w*|crash\w*|cut\w*|ban\w*|recall\w*|strike\w*|lawsuit\w*|sue\w*|fire\w*|probe\w*|layoff\w*|job cuts?|shortage\w*|slide\w*|tumble\w*|loss\w*|warn\w*|fears?|delay\w*|halt\w*|fraud\w*|hack\w*|breach\w*|outage\w*|collapse\w*|sink\w*|down|lower|decline\w*|crisis|hit|hits|threat\w*|attack\w*|war|tariff\w*)\b/i;
const STRONG = /\b(plunge\w*|soar\w*|crash\w*|surge\w*|record|collapse\w*|tumble\w*|boom\w*|biggest|worst|best|huge|massive|historic)\b/i;

export function decode(s) {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/<[^>]+>/g, '').trim();
}
export async function fetchFeed(src, url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(12000), headers: { 'user-agent': 'stonks-game-news-reader' } });
    if (!r.ok) return [];
    const x = await r.text(), out = [];
    for (const m of x.matchAll(/<item[\s>]([\s\S]*?)<\/item>/g)) {
      const t = (m[1].match(/<title[^>]*>([\s\S]*?)<\/title>/) || [])[1], d = (m[1].match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/) || [])[1];
      let link = decode((m[1].match(/<link[^>]*>([\s\S]*?)<\/link>/) || [])[1] || '');
      if (!/^https?:\/\/[^\s<>"]+$/.test(link)) link = '';
      if (t) out.push({ title: decode(t), t: d ? Date.parse(d) || 0 : 0, src, link });
    }
    return out.slice(0, 25);
  } catch (e) { return []; }
}
// -> { fx: {sector: signedMove}, primary, mood } or null when nothing in the world cares
// phrases that contain a keyword but are about something else (a place, a tax, a crime): taken out before matching
const NOISE = /\b(?:west bank|gaza strip|national insurance|river ?banks?|food banks?|blood banks?|bank holidays?|health ministry|ministry of health|drugs? (?:trade|trafficking|cartels?|smuggling|gangs?|lords?|busts?|dealers?)|illegal drugs?|war on drugs)\b/gi;
export function classify(title, tie = 1) {
  title = title.replace(NOISE, ' ');
  const up = (title.match(new RegExp(UP.source, 'gi')) || []).length, dn = (title.match(new RegExp(DOWN.source, 'gi')) || []).length;
  const strong = STRONG.test(title);
  let mood = up === dn ? 0 : (up > dn ? 1 : -1);
  const hit = RULES.filter(r => r.w.test(title));
  const macro = MACRO.test(title);
  if (!hit.length && !macro) return null;
  const base = (strong ? 3.2 : 1.6) * (mood === 0 ? 0.35 : 1);
  const fx = {};
  let primary = null;
  hit.forEach((r, i) => r.fx.forEach(([s, sign], j) => {
    if (primary === null && j === 0) primary = s;
    fx[s] = (fx[s] || 0) + (mood || tie) * sign * base * (i === 0 ? 1 : 0.7);
  }));
  return { fx, primary, mood, macro: macro && !hit.length, macroMove: (mood || tie) * base * 0.6, strong };
}
