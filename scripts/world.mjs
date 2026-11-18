// The made-up world: 20 sectors, 10 companies each. Nothing here is a real company.
// vol: typical daily swing in percent. thing: what the sector sells (used by headline templates).
export const SECTORS = [
  { id: 'chips', name: 'Sand Into Money', thing: 'chips', vol: 3.2, beta: 1.4,
    cos: [['PEBL', 'Pebble Logic', 'Makes thinking rocks'], ['TRNZ', 'Transistor Nation', 'One billion switches per snack'], ['WAFR', 'Wafer Thin Margins', 'Very small, very expensive'],
      ['DIEX', 'Die Hard Silicon', 'Yippee ki-yay, megahertz'], ['NANO', 'Nanometer Mike', 'Smaller every quarter, like his promises'], ['FABB', 'Fabbo Foundry', 'We fab, you wait'],
      ['GATE', 'Logic Gate Keepers', 'Nothing gets through without a fee'], ['CLKR', 'Overclocked Dreams', 'Runs hot, runs fast'], ['QBTZ', 'Qubit Pie', 'Is both baked and unbaked'], ['SLCN', 'Silicone Valley', 'Mostly sealant']] },
  { id: 'soft', name: 'Software, Eventually', thing: 'software', vol: 2.4, beta: 1.2,
    cos: [['SAAS', 'Subscribe To Everything', 'Your toaster now has a plan'], ['BUGZ', 'Known Issue Systems', 'It is a feature'], ['PTCH', 'Patch Tuesday Holdings', 'Sorry for the reboot'], ['CLUD', 'Somebody Elses Computer', 'The cloud is just a rented basement'],
      ['DEVX', 'Standup Meeting Inc', 'Could have been an email'], ['CRUD', 'Crud Ware', 'Create, read, update, delete, repeat'], ['LOGN', 'Forgot Password Co', 'Please verify you are human'], ['ALPH', 'Beta Forever', 'Version 0.9 since 2011'],
      ['KERN', 'Kernel Panic Partners', 'Please do not turn off your computer'], ['APIX', 'Rate Limited Ltd', 'Too many requests, try again later']] },
  { id: 'ai', name: 'Machine Feelings', thing: 'AI models', vol: 4.0, beta: 1.6,
    cos: [['HALU', 'Hallucination Labs', 'Confidently wrong since launch'], ['PRMT', 'Prompt Dependency', 'Please say please'], ['GPUZ', 'Hungry Hungry Servers', 'Eats the power grid for lunch'], ['LLMZ', 'Large Language Mumbling', 'Seventy billion parameters, no opinions'],
      ['BOTT', 'Botty McBotface', 'Your new coworker'], ['AGIX', 'Almost General Intelligence', 'Two years away since forever'], ['TOKN', 'Token Economy', 'Charges by the word'], ['SNTN', 'Sentient Maybe', 'Legal says we cannot confirm'],
      ['NEUR', 'Neural Net Worth', 'Valued at vibes'], ['AUTO', 'Autocomplete Anything', 'Finishes your sentences, and your career']] },
  { id: 'social', name: 'Doomscroll Industries', thing: 'attention', vol: 3.0, beta: 1.3,
    cos: [['SCRL', 'Endless Scroll', 'There is no bottom'], ['LIKE', 'Like Farm', 'Harvested daily'], ['FEED', 'Algorithm Said So', 'Not our fault'], ['VIRL', 'Gone Viral Group', 'Contagious, legally'],
      ['SELF', 'Selfie Stick Capital', 'Reach for the stars, at arm length'], ['TRND', 'Trending Now Ltd', 'Dead by Thursday'], ['STRY', 'Story Time Media', 'Disappears in 24 hours, like the profits'], ['CMNT', 'Comment Section Inc', 'Never read this'],
      ['FLWR', 'Follower Futures', 'Bought and paid for'], ['INFL', 'Influence Peddlers', 'Use my code']] },
  { id: 'gadget', name: 'Shiny Rectangles', thing: 'gadgets', vol: 2.2, beta: 1.1,
    cos: [['PINE', 'Pineapple Computing', 'Think slightly different'], ['SMRT', 'Smart Everything Corp', 'Your fridge has opinions'], ['BEZL', 'Bezel Free Holdings', 'All screen, no phone'], ['DONG', 'Dongle Dynamics', 'You will need an adapter'],
      ['BATT', 'Battery Anxiety', 'Ten percent left, always'], ['WRBL', 'Wearable Regret', 'Counts steps you did not take'], ['CHGR', 'Charger Lost Inc', 'Where did it go'], ['EARB', 'Earbud Orphans', 'Sold as singles'],
      ['TABL', 'Tablet Of Stone', 'Fragile and heavy'], ['GLSS', 'Cracked Screen Co', 'Insurance sold separately']] },
  { id: 'auto', name: 'Wheels And Deals', thing: 'cars', vol: 2.8, beta: 1.2,
    cos: [['VROM', 'Vroom Vroom Motors', 'Loud on purpose'], ['ELEK', 'Electric Slide Motors', 'Everybody do the recall'], ['SEDN', 'Beige Sedan Group', 'Reliable, unforgivably'], ['TRKS', 'Truck Nutz Industries', 'Never hauled anything'],
      ['LEMN', 'Lemon Law Partners', 'Sold as is'], ['HYBR', 'Halfway Hybrid', 'Cannot commit'], ['DEAL', 'Dealer Markup Holdings', 'Plus mandatory protection plan'], ['AUTO', 'Self Driving Eventually', 'Hands on wheel please'],
      ['TIRE', 'Tire Fire Rubber', 'Burns bright'], ['PARK', 'Parallel Parking Failures', 'Third attempt']].map(r => r[0] === 'AUTO' ? ['SDRV', r[1], r[2]] : r) },
  { id: 'oil', name: 'Dinosaur Juice', thing: 'oil', vol: 3.0, beta: 1.0,
    cos: [['GUSH', 'Gusher Petroleum', 'Oops, struck oil'], ['FRAK', 'Frack Attack Energy', 'Shake it like a Polaroid'], ['PUMP', 'Pump Jack Holdings', 'Nodding in agreement'], ['DINO', 'Fossil Fuel Fanatics', 'Proud, loudly'],
      ['SLCK', 'Slick Willy Refining', 'Smooth operator'], ['BRRL', 'Barrel Roll Resources', 'Do a barrel roll'], ['TNKR', 'Tanker Trouble Ltd', 'Please do not turn that wheel'], ['OPEC', 'Cartel Of Nice Men', 'Just a friendly production chat'],
      ['GASP', 'Gas Pump Gouge', 'Pay at the pump, cry at the pump'], ['WELL', 'Well Well Well Inc', 'If it is not the oil prices']] },
  { id: 'green', name: 'Sunshine And Wind', thing: 'clean energy', vol: 3.1, beta: 1.2,
    cos: [['SOLR', 'Solar Power Nap', 'Charged by laziness'], ['WIND', 'Wind Of Change', 'Blowing in the wind'], ['BTRY', 'Battery Acid Trip', 'Stored energy, stored feelings'], ['HYDR', 'Dam Good Power', 'Held back by regulation'],
      ['GRNE', 'Greenwash Holdings', 'Now with a leaf on the logo'], ['TURB', 'Turbine Tantrum', 'Spins when upset'], ['FUSN', 'Fusion Always Ten Years Away', 'Now only nine'], ['PANL', 'Panel Discussion Energy', 'Mostly talk'],
      ['GEOT', 'Hot Rock Utilities', 'Down to earth'], ['EVCH', 'Charging Station Queue', 'Waiting for your turn']] },
  { id: 'air', name: 'Fly Responsibly', thing: 'flights', vol: 3.0, beta: 1.3,
    cos: [['JETS', 'Jet Lag Airways', 'We lost your luggage, and you'], ['LUGG', 'Lost Luggage Logistics', 'Found in another country'], ['WING', 'Wing And A Prayer Air', 'Fly now, pray later'], ['SEAT', 'Middle Seat Holdings', 'Armrest is ours'],
      ['TURB', 'Turbulence Express', 'Please remain seated'], ['LAND', 'Hard Landing Partners', 'Applause optional'], ['GATE', 'Gate Change Airlines', 'Now boarding at the other end'], ['SNAK', 'Tiny Pretzel Co', 'One bag per person'],
      ['CABN', 'Cabin Pressure Corp', 'Oxygen mask first'], ['TAXI', 'Tarmac Wait Group', 'Estimated delay, forever']].map(r => r[0] === 'TURB' && r[1] === 'Turbulence Express' ? ['TBLX', r[1], r[2]] : r[0] === 'GATE' ? ['GTCH', r[1], r[2]] : r) },
  { id: 'ship', name: 'Boats And Boxes', thing: 'freight', vol: 2.6, beta: 1.0,
    cos: [['BOXY', 'Boxy Container Lines', 'Everything arrives in a box'], ['STUK', 'Stuck In Canal Shipping', 'We are blocking the road'], ['CRGO', 'Cargo Cult Logistics', 'Build the port, the ships will come'], ['DOCK', 'Dockworker Dispute Inc', 'Back in an hour'],
      ['TRKK', 'Last Mile Misery', 'Left with a neighbor'], ['FRGT', 'Freight Train Of Thought', 'Delayed at every station'], ['PORT', 'Port Of Call Of Duty', 'Respawns weekly'], ['PKGE', 'Package Thief Insurance', 'Porch pirates welcome'],
      ['TARF', 'Tariff Time Holdings', 'Pass the cost along'], ['SHIP', 'Ships Passing In The Night', 'Never actually meet']] },
  { id: 'bank', name: 'Other Peoples Money', thing: 'loans', vol: 2.0, beta: 1.0,
    cos: [['LEND', 'Lend Lease Lunch', 'Terms and conditions apply'], ['VAUL', 'Vault Of Vibes', 'Trust us'], ['RATE', 'Rate Hike Hotline', 'Press one to feel pain'], ['FEES', 'Hidden Fees Savings', 'Read the fine print twice'],
      ['OVRD', 'Overdraft Overlords', 'Negative is the new positive'], ['CRED', 'Credit Score Cult', 'Seven hundred and cult'], ['INTR', 'Interest Compounded Daily', 'Yours, mostly ours'], ['ATMM', 'ATM Fee Frenzy', 'Three dollars to see your own money'],
      ['TRST', 'Trust Fund Babies', 'Born ready'], ['BAIL', 'Bailout Brothers', 'Too big to fail, too big to care']] },
  { id: 'crypto', name: 'Magic Internet Money', thing: 'coins', vol: 6.0, beta: 1.8,
    cos: [['COIN', 'Coin Flip Capital', 'Heads we win, tails you lose'], ['MOON', 'Moon Shot Tokens', 'Rocket sold separately'], ['DOGE', 'Wow Much Currency', 'Very coin, so crash'], ['MINE', 'Mining My Own Business', 'Burns a small country of electricity'],
      ['WLLT', 'Lost Wallet Seed Phrase', 'Forgotten in a drawer'], ['RUGZ', 'Rug Pull Rugs', 'Floor sold separately'], ['GASF', 'Gas Fee Gaming', 'Cost more than the item'], ['NFTS', 'Right Click Save As', 'Own the receipt'],
      ['STBL', 'Stablecoin Probably', 'Pegged, we promise'], ['DEFI', 'Decentralized Mess', 'Nobody is in charge']] },
  { id: 'insure', name: 'Hope You Never Need Us', thing: 'policies', vol: 1.8, beta: 0.7,
    cos: [['CLAM', 'Claim Denied Group', 'Not covered'], ['HEDG', 'Hedge Your Bets Mutual', 'Risk is our business'], ['PREM', 'Premium Hike Partners', 'Going up, again'], ['DEDU', 'Deductible Dynasty', 'You pay first'],
      ['FLOD', 'Flood Zone Underwriters', 'Water damage excluded'], ['ACTU', 'Actuary Anonymous', 'The spreadsheet says no'], ['FIRE', 'Fire And Brimstone Assurance', 'Acts of God, excluded'], ['LIFE', 'Life Is Short Mutual', 'Terms vary'],
      ['FPRT', 'Fine Print Fidelity', 'In very small letters'], ['GECK', 'Reptile Rate Quotes', 'Fifteen minutes could save you']] },
  { id: 'home', name: 'Roofs Over Heads', thing: 'houses', vol: 2.0, beta: 0.9,
    cos: [['MORT', 'Mortgage For Life', 'Thirty years, then refinance'], ['HOME', 'Starter Home Myth', 'Four hundred thousand, fixer upper'], ['LAWN', 'Lawn Care Lobby', 'Keep off the grass'], ['HOAA', 'HOA Fines Unlimited', 'Your mailbox is the wrong color'],
      ['REIT', 'Rent Is Too High Trust', 'Nobody asked'], ['OPEN', 'Open House Snacks', 'Free cookies, no offers'], ['BRKR', 'Broker Fee Brotherhood', 'Six percent of your dreams'], ['COND', 'Condo Of Cards', 'Special assessment incoming'],
      ['ZONE', 'Zoning Board Of Vengeance', 'Not in my backyard'], ['MOLD', 'Black Mold Estates', 'Character included']] },
  { id: 'pharma', name: 'Take Two Of These', thing: 'drugs', vol: 3.4, beta: 0.9,
    cos: [['PILL', 'Pill Pushers Pharma', 'Side effects may include side effects'], ['TRYL', 'Phase Three Trials', 'Results pending, forever'], ['VACC', 'Booster Shot Brothers', 'Another one'], ['BIOG', 'Biotech Bro Labs', 'Disrupting your cells'],
      ['COUG', 'Cough Syrup Dynasty', 'Tastes like regret'], ['PTNT', 'Patent Cliff Partners', 'Falling soon'], ['FDAA', 'Pending Approval Pharma', 'Still pending'], ['GNRC', 'Generic Brand Holdings', 'Same, but gray'],
      ['DOCT', 'Waiting Room Wellness', 'Please fill out these forms again'], ['SURG', 'Scalpel And Sons', 'Just a little off the top']] },
  { id: 'food', name: 'Snacks And Staples', thing: 'groceries', vol: 1.8, beta: 0.7,
    cos: [['SNAK', 'Crunch Time Snacks', 'Half the bag is air'], ['COFE', 'Bean Counters Coffee', 'Eight dollars, no refills'], ['CHIP', 'Chip Dip Kingdom', 'Double dip allowed'], ['SHRK', 'Shrinkflation Foods', 'Same price, smaller bag'],
      ['WHET', 'Amber Waves Of Margin', 'Grain of truth'], ['EGGZ', 'Egg Price Anxiety', 'Fragile market'], ['SODA', 'Fizzy Dreams Beverage', 'Sugar rush, then crash'], ['FRZN', 'Freezer Burn Brands', 'Forgotten since 2019'],
      ['VEGG', 'Kale Is Fine Farms', 'Nobody asked for this'], ['DINE', 'Drive Thru Dynasty', 'Ice cream machine is broken']].map(r => r[0] === 'CHIP' ? ['DPPR', r[1], r[2]] : r) },
  { id: 'retail', name: 'Shop Till You Drop', thing: 'stuff', vol: 2.3, beta: 1.1,
    cos: [['CART', 'Abandoned Cart Holdings', 'You forgot something'], ['SALE', 'Everything Must Go Inc', 'Every day since 1998'], ['BLCK', 'Black Friday Brawl', 'Doors open at midnight'], ['RTRN', 'Return Policy Roulette', 'Receipt required'],
      ['MALL', 'Dead Mall Partners', 'Food court still open'], ['CHKO', 'Checkout Line Longest', 'Next cashier please'], ['SELF', 'Self Checkout Shame', 'Unexpected item in bagging area'], ['PRIM', 'Next Day Maybe Delivery', 'Arrives when it arrives'],
      ['COUP', 'Coupon Clippers United', 'Expired yesterday'], ['BULK', 'Bulk Buy Barn', 'Eighty rolls of paper towels']].map(r => r[0] === 'SELF' ? ['SCHK', r[1], r[2]] : r) },
  { id: 'media', name: 'Entertain Me Please', thing: 'content', vol: 2.8, beta: 1.2,
    cos: [['STRM', 'Streaming Overload', 'Twelve subscriptions, nothing to watch'], ['FLIX', 'Chill Never Happens', 'Are you still watching'], ['BOXO', 'Box Office Bomb Squad', 'Sequel announced anyway'], ['GAME', 'Day One Patch Games', 'Fixed later, maybe'],
      ['SEQL', 'Sequel Of A Sequel', 'Part nine'], ['CRIT', 'Critics Choice Chaos', 'Nobody agrees'], ['SPOT', 'Spoiler Alert Media', 'He was dead all along'], ['LOOT', 'Loot Box Lottery', 'Gambling for children'],
      ['REAL', 'Reality Check Television', 'Scripted, obviously'], ['POPC', 'Overpriced Popcorn Co', 'Bucket included']] },
  { id: 'space', name: 'Up And Away', thing: 'rockets', vol: 4.0, beta: 1.5,
    cos: [['ROKT', 'Rocket Surgery Aerospace', 'It is not rocket science, it is worse'], ['ORBT', 'Orbital Debris Removal', 'Mind the gap'], ['LNCH', 'Launch Window Pending', 'Scrubbed again'], ['SATL', 'Satellite Of Love', 'Pings every orbit'],
      ['MARS', 'Mars Or Bust Holdings', 'Bust is likelier'], ['ASTR', 'Asteroid Mining Dreamers', 'Pitch deck only'], ['DFNS', 'Big Boom Defense', 'We have not read the treaty'], ['SHLD', 'Shield Wall Contractors', 'Over budget by default'],
      ['DRNE', 'Drone Zone Dynamics', 'Watching you watch us'], ['MOON', 'Lunar Real Estate', 'Quiet neighbors']].map(r => r[0] === 'MOON' ? ['LUNA', r[1], r[2]] : r) },
  { id: 'metal', name: 'Rocks We Dug Up', thing: 'metal', vol: 2.8, beta: 1.0,
    cos: [['GOLD', 'Fools Gold Mining', 'All that glitters'], ['COPR', 'Copper Top Holdings', 'Wires, mostly'], ['LITH', 'Lithium Lunch Break', 'Charged up'], ['STEL', 'Steel Magnolia Metals', 'Strong and sweet'],
      ['ALUM', 'Foil Hat Aluminum', 'Protect your thoughts'], ['SLVR', 'Silver Lining Mines', 'Always a cloud first'], ['DIAM', 'Diamonds Are Forever Maybe', 'Artificial scarcity'], ['RARE', 'Rare Earth Rarely', 'Hard to find, harder to explain'],
      ['COAL', 'Lump Of Coal Inc', 'Naughty list supplier'], ['IRON', 'Iron Will Resources', 'Never rusts, always rusts']] },
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
      const price = Math.round((8 + (h % 41200) / 100) * 100) / 100;
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
