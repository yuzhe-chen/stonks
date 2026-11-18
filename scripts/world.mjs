// The made-up world: 20 sectors, 10 companies each. Nothing here is a real company.
// vol: typical daily swing in percent. thing: what the sector sells (used by headline templates).
export const SECTORS = [
  { id: 'chips', name: 'Semiconductors', thing: 'chips', vol: 3.2, beta: 1.4,
    cos: [['NVDI', 'Nvidiot Graphics', 'Sells shovels to the AI gold rush'], ['TSMS', 'Taiwan Semi-Conductive', 'Makes everyone else\'s chips, quietly'], ['INTL', 'Intel Inside Job', 'Used to be the guy'], ['AMDD', 'Ayy Em Dee', 'Second place, loudly'],
      ['QCRM', 'Qualcrumb', 'Licenses your phone back to you'], ['ASMR', 'ASMR Lithography', 'Soothing, and the only one who can do it'], ['MCRN', 'Macaron Technology', 'Memory, but sweet'], ['ARMS', 'Arm And A Leg Holdings', 'Licensing fees'],
      ['PEBL', 'Pebble Logic', 'Makes thinking rocks'], ['WAFR', 'Wafer Thin Margins', 'Very small, very expensive']] },
  { id: 'soft', name: 'Software', thing: 'software', vol: 2.4, beta: 1.2,
    cos: [['MHRD', 'Microhard', 'Your computer will restart to install updates'], ['ORKL', 'Orakle Databases', 'Audits you for fun'], ['SELL', 'Sellsforce', 'Ten tabs of dashboards'], ['ADOP', 'Adope Creative Suffering', 'Subscription for the subscription'],
      ['ZOOM', 'Zoomer Meetings', 'You are on mute'], ['SLKR', 'Slackerr', 'Notification number 400'], ['IBMM', 'International Big Mood', 'Still a mainframe company'], ['TAXU', 'Tax Intuit', 'Free, as long as you do not file'],
      ['BUGZ', 'Known Issue Systems', 'It is a feature'], ['LOGN', 'Forgot Password Co', 'Please verify you are human']] },
  { id: 'ai', name: 'Artificial Intelligence', thing: 'AI models', vol: 4.0, beta: 1.6,
    cos: [['CLAI', 'ClosedAI', 'Open in name only'], ['MISA', 'Misanthropic', 'Safety first, then second, then a funding round'], ['DPMD', 'DeepMind Your Business', 'Solves protein folding, ignores you'], ['YAI', 'Why AI', 'Asks questions about the universe, mostly yours'],
      ['MSTR', 'Mistrial AI', 'Very French, very fast'], ['PRPX', 'Perplexed AI', 'Searches and shrugs'], ['MJRN', 'Midjourney Of Many Fingers', 'Seven fingers, great lighting'], ['CFLW', 'Character Flaw AI', 'Your imaginary friend has a subscription'],
      ['HALU', 'Hallucination Labs', 'Confidently wrong since launch'], ['AGIX', 'Almost General Intelligence', 'Two years away since forever']] },
  { id: 'social', name: 'Social Media', thing: 'attention', vol: 3.0, beta: 1.3,
    cos: [['FBLK', 'Faceblock', 'Blocks your face from your friends'], ['MTVM', 'Metaverse Of Madness', 'Legless avatars, endless meetings'], ['IGRM', 'Instagrim', 'Everyone is happier than you'], ['TKTK', 'TikTock', 'Three seconds to impress'],
      ['TWTR', 'Tweeter X', 'Formerly something else'], ['SNPC', 'Snapchap', 'It disappears, so do you'], ['RDIT', 'Redd Dit', 'Seventeen thousand upvotes for a cat'], ['LKDO', 'Linkedout', 'Thrilled to announce my layoff'],
      ['DSCD', 'Discordant', 'Server of one'], ['SCRL', 'Endless Scroll', 'There is no bottom']] },
  { id: 'gadget', name: 'Consumer Electronics', thing: 'gadgets', vol: 2.2, beta: 1.1,
    cos: [['PINE', 'Pineapple Computing', 'Think slightly different'], ['SNSG', 'Sunsong Electronics', 'Folds, then breaks'], ['SNNY', 'Sonny Boy', 'Proprietary cables since 1979'], ['NTND', 'Nintendont', 'Will not let you have it'],
      ['DULL', 'Dull Computers', 'Gets the job done, slowly'], ['HPIC', 'HP Ink Cartel', 'Ink costs more than gold'], ['DONG', 'Dongle Dynamics', 'You will need an adapter'], ['BATT', 'Battery Anxiety', 'Ten percent left, always'],
      ['GLSS', 'Cracked Screen Co', 'Insurance sold separately'], ['EARB', 'Earbud Orphans', 'Sold as singles']] },
  { id: 'auto', name: 'Automotive', thing: 'cars', vol: 2.8, beta: 1.2,
    cos: [['TSLR', 'Tesler Motors', 'Full self driving, any year now'], ['FJRD', 'Fjord Motor Company', 'Built Ford tough, spelled Norwegian'], ['GENM', 'Generic Motors', 'Brand loyalty not included'], ['TYTA', 'Toyoda', 'Never breaks, never exciting'],
      ['VWAG', 'Volks Wagon Of Scandal', 'Passes the emissions test, only the test'], ['RVAN', 'Rivien', 'Adventure sold separately'], ['HRLY', 'Harley Quinn Motorcycles', 'Loud, leather, lawsuit'], ['FRRI', 'Ferrarri Fines', 'Red, fast, ticketed'],
      ['LEMN', 'Lemon Law Partners', 'Sold as is'], ['DEAL', 'Dealer Markup Holdings', 'Plus mandatory protection plan']] },
  { id: 'oil', name: 'Oil And Gas', thing: 'oil', vol: 3.0, beta: 1.0,
    cos: [['GUSH', 'Gusher Petroleum', 'Oops, struck oil'], ['FRAK', 'Frack Attack Energy', 'Shake it like a Polaroid'], ['PUMP', 'Pump Jack Holdings', 'Nodding in agreement'], ['DINO', 'Fossil Fuel Fanatics', 'Proud, loudly'],
      ['SLCK', 'Slick Willy Refining', 'Smooth operator'], ['BRRL', 'Barrel Roll Resources', 'Do a barrel roll'], ['TNKR', 'Tanker Trouble Ltd', 'Please do not turn that wheel'], ['OPEC', 'Cartel Of Nice Men', 'Just a friendly production chat'],
      ['GASP', 'Gas Pump Gouge', 'Pay at the pump, cry at the pump'], ['WELL', 'Well Well Well Inc', 'If it is not the oil prices']] },
  { id: 'green', name: 'Clean Energy', thing: 'clean energy', vol: 3.1, beta: 1.2,
    cos: [['SOLR', 'Solar Power Nap', 'Charged by laziness'], ['PLGD', 'Plugged Power', 'Hydrogen is always next year'], ['NXTE', 'NextEraser', 'Rubs out the grid'], ['FSLR', 'First Solarium', 'Tanning, but for electricity'],
      ['WIND', 'Wind Of Change', 'Blowing in the wind'], ['BTRY', 'Battery Acid Trip', 'Stored energy, stored feelings'], ['GRNE', 'Greenwash Holdings', 'Now with a leaf on the logo'], ['FUSN', 'Fusion Always Ten Years Away', 'Now only nine'],
      ['GEOT', 'Hot Rock Utilities', 'Down to earth'], ['EVCH', 'Charging Station Queue', 'Waiting for your turn']] },
  { id: 'air', name: 'Airlines And Travel', thing: 'flights', vol: 3.0, beta: 1.3,
    cos: [['BOIN', 'Boing Boing Aerospace', 'Doors sold separately'], ['ABUS', 'Airbust', 'Fly by wire, pray by hand'], ['DLTA', 'Delta Variant Air', 'Spreads quickly'], ['UNTD', 'Untied Airlines', 'We apologize for the removal'],
      ['SWRS', 'Southworst Airlines', 'Open seating, open season'], ['SPRT', 'Spirit Of Delay', 'Pay extra to breathe'], ['JTBL', 'JetBlew It', 'Free snacks, blown schedule'], ['RYNR', 'Ryan Air Fee', 'Toilets cost extra'],
      ['LUGG', 'Lost Luggage Logistics', 'Found in another country'], ['JETS', 'Jet Lag Airways', 'We lost your luggage, and you']] },
  { id: 'ship', name: 'Shipping And Logistics', thing: 'freight', vol: 2.6, beta: 1.0,
    cos: [['FDXX', 'FedNope', 'Delivery attempted, nobody home'], ['UPSD', 'UPSide Down Delivery', 'Your package is face down'], ['MRSK', 'Maersk Me Later', 'Boxes, boats, belated'], ['DHLL', 'DHL Hell', 'Customs held your gift'],
      ['STUK', 'Stuck In Canal Shipping', 'We are blocking the road'], ['CRGO', 'Cargo Cult Logistics', 'Build the port, the ships will come'], ['DOCK', 'Dockworker Dispute Inc', 'Back in an hour'], ['TRKK', 'Last Mile Misery', 'Left with a neighbor'],
      ['TARF', 'Tariff Time Holdings', 'Pass the cost along'], ['PKGE', 'Package Thief Insurance', 'Porch pirates welcome']] },
  { id: 'bank', name: 'Banking And Payments', thing: 'loans', vol: 2.0, beta: 1.0,
    cos: [['JPMG', 'JP Morgain', 'Too big to fail, too big to fine'], ['GSAX', 'Goldman Sacks', 'Vampire squid in a vest'], ['BOAM', 'Bank Of Americano', 'Overdraft with a cappuccino'], ['WFRG', 'Wells Fargone', 'Created your account, without telling you'],
      ['CITI', 'Citi Bank Of Vibes', 'Your balance is a feeling'], ['VIZA', 'Viza Card', 'Everywhere you want to be, with fees'], ['MSTC', 'Mastercarb', 'Priceless, but only after the interest'], ['PYPL', 'PayPal Hold Your Money', 'Account limited, again'],
      ['RBHD', 'Robinhoodlum', 'Takes from the rich, gives to the market makers'], ['VNMO', 'Venmoney', 'Who owes who, nobody knows']] },
  { id: 'crypto', name: 'Crypto', thing: 'coins', vol: 6.0, beta: 1.8,
    cos: [['BCRN', 'Bitcorn', 'Digital gold, dug up with real electricity'], ['ETHM', 'Etherium Maybe', 'Smart contracts, dumb gas fees'], ['CNBS', 'Coinbass', 'Heavy fees, low frequency'], ['BNNC', 'Binanace', 'Not available in your country'],
      ['DOGE', 'Wow Much Currency', 'Very coin, so crash'], ['FTXX', 'FTX Marks The Spot', 'Treasure not found'], ['TTHR', 'Tether Ball', 'Pegged, we promise'], ['SOLN', 'Solanaaaa', 'Down again, up again'],
      ['RUGZ', 'Rug Pull Rugs', 'Floor sold separately'], ['NFTS', 'Right Click Save As', 'Own the receipt']] },
  { id: 'insure', name: 'Insurance', thing: 'policies', vol: 1.8, beta: 0.7,
    cos: [['GEEK', 'Geeko', 'Fifteen minutes could save you fifteen minutes'], ['STFM', 'State Farmer', 'Like a good neighbor, until the claim'], ['RGRS', 'Regressive Insurance', 'Rates only go one direction'], ['ALLS', 'Allstate Of Panic', 'Are you in good hands, or just hands'],
      ['FLDY', 'Floyds Of London', 'Will insure anything, for a fee'], ['AIGG', 'AIG Aye Aye', 'Bailed out, ahoy'], ['CLAM', 'Claim Denied Group', 'Not covered'], ['PREM', 'Premium Hike Partners', 'Going up, again'],
      ['DEDU', 'Deductible Dynasty', 'You pay first'], ['FIRE', 'Fire And Brimstone Assurance', 'Acts of God, excluded']] },
  { id: 'home', name: 'Real Estate', thing: 'houses', vol: 2.0, beta: 0.9,
    cos: [['ZILC', 'Zilch Real Estate', 'Zestimates are suggestions'], ['RDFS', 'Redfish', 'Always a bigger one'], ['CLDR', 'Closeddoor', 'We buy houses, then stop'], ['WWNT', 'WeWorkNot', 'Hot desks, cold balance sheet'],
      ['HDSP', 'Home Despot', 'Eleven aisles to find a screw'], ['LNNR', 'Lenient Homes', 'Beige, in bulk'], ['MORT', 'Mortgage For Life', 'Thirty years, then refinance'], ['HOAA', 'HOA Fines Unlimited', 'Your mailbox is the wrong color'],
      ['COND', 'Condo Of Cards', 'Special assessment incoming'], ['MOLD', 'Black Mold Estates', 'Character included']] },
  { id: 'pharma', name: 'Pharmaceuticals', thing: 'drugs', vol: 7.0, beta: 0.9,
    cos: [['PFZZ', 'Pfizzer', 'Fizzy, until the trial results'], ['MDNA', 'Moderate-na', 'Just a little RNA, not too much'], ['JNJR', 'Johnson And Johnsun', 'Powder, ointment, litigation'], ['MRCK', 'Murk', 'Clear as mud'],
      ['ABBD', 'AbbDie', 'Rate of return, one way or another'], ['LILY', 'Eli Silly', 'Weight loss, wallet loss'], ['OZMP', 'Oh Oh Ozempic', 'Oh oh oh, what a feeling'], ['CVSR', 'CVS Receipt Roll', 'The receipt is longer than the aisle'],
      ['WLGR', 'Wallgreens', 'Locked behind glass'], ['TRYL', 'Phase Three Trials', 'Results pending, forever']] },
  { id: 'food', name: 'Food And Beverage', thing: 'groceries', vol: 1.8, beta: 0.7,
    cos: [['COKE', 'Coka-Colada', 'Sugar and an umbrella'], ['PEPS', 'Pepsee', 'Okay, is Pepsi okay'], ['MCDS', 'McDownalds', 'The ice cream machine is broken'], ['SBUX', 'Starbux', 'Eight dollars and your name misspelled'],
      ['CHPT', 'Chipotle Portion Control', 'Someone else got more'], ['NSTL', 'Nestlay', 'Everything, owned, quietly'], ['KLGG', 'Kelloggs Shrinkflation', 'Same box, fewer flakes'], ['GMLS', 'Generic Mills', 'Cheerios, but off brand'],
      ['SHRK', 'Shrinkflation Foods', 'Same price, smaller bag'], ['EGGZ', 'Egg Price Anxiety', 'Fragile market']] },
  { id: 'retail', name: 'Retail', thing: 'stuff', vol: 2.3, beta: 1.1,
    cos: [['WMRT', 'Wallmart', 'Everyday low prices, everyday long lines'], ['AMZE', 'Amazin Prime Delivery', 'Arrives before you finish ordering'], ['TRGT', 'Targeted Ads', 'Came for soap, left with a lawn chair'], ['CSTC', 'Costcoin Bulk', 'Forty eight rolls of everything'],
      ['BSTB', 'Best Bye', 'We will price match, eventually'], ['EBUY', 'eBuy Nothing', 'Used, as described, not as pictured'], ['IKEA', 'Ikeaha Flatpack', 'One screw left over'], ['SHEN', 'Shein Shein Shein', 'Arrives in four to six months'],
      ['BLCK', 'Black Friday Brawl', 'Doors open at midnight'], ['SALE', 'Everything Must Go Inc', 'Every day since 1998']] },
  { id: 'media', name: 'Media And Entertainment', thing: 'content', vol: 2.8, beta: 1.2,
    cos: [['NFLX', 'Netflux', 'Are you still watching, please'], ['DIZY', 'Dizzy', 'The mouse owns your childhood'], ['WARN', 'Warner Brothers In Law', 'Cancelled, then restored, then cancelled'], ['SPFY', 'Spotifly', 'Pays artists in exposure'],
      ['PARM', 'Paramount Of Nowhere', 'Peaks and valleys, mostly valleys'], ['ACTV', 'Activisshun', 'Call of Duty 47'], ['EAGM', 'Electric Arts Its In The Wallet', 'Microtransactions for the soul'], ['HULO', 'Hulooo', 'Is anyone there'],
      ['ROKZ', 'Rokuzzz', 'Boots up in twelve minutes'], ['LOOT', 'Loot Box Lottery', 'Gambling for children']] },
  { id: 'space', name: 'Aerospace And Defense', thing: 'rockets', vol: 4.0, beta: 1.5,
    cos: [['SPCZ', 'SpaceZ', 'Rapid unscheduled disassembly'], ['BLOR', 'Blue Origami', 'Folds under pressure'], ['LMRT', 'Lockheart Martian', 'Cost plus, plus, plus'], ['RYTN', 'Rayteon', 'Missiles with a sense of humor'],
      ['NGRP', 'Northrop Grumpman', 'Grumpy, armed'], ['GDYN', 'General Dynamite', 'Boom, as a service'], ['VGRF', 'Virgin Galactic Refunds', 'Tickets sold, tickets returned'], ['PLNT', 'Palantiri', 'The seeing stone, with a contract'],
      ['ROKT', 'Rocket Surgery Aerospace', 'It is not rocket science, it is worse'], ['ORBT', 'Orbital Debris Removal', 'Mind the gap']] },
  { id: 'metal', name: 'Metals And Mining', thing: 'metal', vol: 2.8, beta: 1.0,
    cos: [['NWMT', 'Newmount', 'Just a really big hole'], ['FCXM', 'Freeport Of Mac And Cheese', 'Copper, cheese, and cash'], ['RTNT', 'Rio Tinted', 'Rose colored, and red flagged'], ['BHPX', 'Big Hole Production', 'Hole, you were saying'],
      ['ALCA', 'Alcoa Local', 'Cans for the whole town'], ['NUKR', 'Nuke-or Steel', 'Strong, glowing'], ['USST', 'US Steal', 'Bought, sold, bought again'], ['BRRK', 'Barrack Gold', 'Dig, baby, dig'],
      ['GOLD', 'Fools Gold Mining', 'All that glitters'], ['LITH', 'Lithium Lunch Break', 'Charged up']] },
];

// Fictional names for headlines
export const CEOS = ['Chad Brickwell', 'Dolores Fenwick', 'Rex Hargrove', 'Mildred Okafor', 'Trent Vandermolen', 'Gladys Pennywhistle', 'Buck Sterling', 'Priya Lindqvist',
  'Marcus Tallowby', 'Beatrice Vanterpool', 'Dale Moorecroft', 'Ingrid Plunkett', 'Walt Oberdorf', 'Fiona Blackwell-Smythe', 'Gus Applewhite', 'Tamsin Quill'];

export function buildWorld() {
  const companies = [];
  SECTORS.forEach((s, si) => {
    const seen = new Set();
    s.cos.forEach(([t, name, tag], i) => {
      let tk = t; while (seen.has(tk) || companies.some(c => c.t === tk)) tk = tk.slice(0, 3) + String.fromCharCode(65 + (i % 26));
      seen.add(tk);
      // price between 8 and 420, deterministic
      let h = 2166136261; for (const ch of tk + name) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
      const price = s.id === 'pharma' ? Math.round((0.15 + (h % 900) / 100) * 100) / 100 : Math.round((8 + (h % 41200) / 100) * 100) / 100;
      const vol = Math.round((s.vol * (0.7 + ((h >>> 8) % 70) / 100)) * 100) / 100;
      companies.push({ t: tk, n: name, g: tag, s: s.id, p: price, v: vol, ceo: CEOS[(h >>> 4) % CEOS.length] });
    });
  });
  // index funds: price-weighted, value = base * sum(prices now) / sum(prices at the start)
  const ofSectors = ids => companies.filter(c => ids.includes(c.s)).map(c => c.t);
  const mk = (t, n, g, base, m) => ({ t, n, g, base, m, p0: m.reduce((a, x) => a + companies.find(c => c.t === x).p, 0), s: 'index', v: 1.6 });
  const indices = [
    mk('TWLN', 'Tow Lones Industrial Average', 'Thirty serious companies and a feeling', 30000, ['bank', 'oil', 'auto', 'air', 'ship', 'food', 'retail', 'metal', 'home', 'pharma', 'insure', 'space'].flatMap(s => companies.filter(c => c.s === s).slice(0, 3).map(c => c.t)).slice(0, 30)),
    mk('FSTQ', 'FASTDAQ Composite', 'Everything with a screen, a server or a dream', 15000, ofSectors(['chips', 'soft', 'ai', 'social', 'gadget', 'media', 'crypto'])),
    mk('SP2H', 'Standard and Poor-ish 200', 'The whole made-up economy in one number', 5000, companies.map(c => c.t)),
    mk('NERV', 'Nervous 20', 'The twenty companies that cannot sit still', 1000, companies.slice().sort((a, b) => b.v - a.v).slice(0, 20).map(c => c.t)),
  ];
  return { sectors: SECTORS.map(s => ({ id: s.id, name: s.name, thing: s.thing, beta: s.beta })), companies, indices };
}
