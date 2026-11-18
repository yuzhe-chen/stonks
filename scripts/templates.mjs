// Headline writing. Real headlines are never copied: only a signal (sector and direction) is read from the news,
// and one of these made-up lines is shown instead. {co} company, {ceo} its CEO, {thing} what the sector sells,
// {sector} sector nickname, {co2} a second company in the same sector.
export const GOOD = [
  '{co} soars after {ceo} says the quiet part out loud',
  '{co} beats expectations by being slightly less terrible than feared',
  '{ceo} spotted holding a clipboard, {co} jumps',
  'Analysts upgrade {co} from "no idea" to "probably fine"',
  '{co} announces record {thing} sales, refuses to elaborate',
  '{co} shares rally on rumor that {ceo} finally read the report',
  'Everyone suddenly wants {thing}, {co} unprepared for success',
  '{co} lands deal nobody can fully explain, stock climbs',
  '{ceo} drops mic at earnings call, mic is under review',
  '{co} confirms it has {thing}, and apparently that matters',
  '{co} hires consultant, discovers {thing} are in demand',
  'Fund manager calls {co} "a steal" before checking the price',
  '{co} quietly makes money for once',
  '{ceo} promises "synergy", {co} up eight percent',
  'Pension fund buys {co}, no one asks why',
  '{co} stock climbs for reasons only {ceo} understands',
];
export const BAD = [
  '{co} plunges after {ceo} discovers the spreadsheet had a second tab',
  '{co} misses expectations, blames the weather, indoors',
  '{ceo} resigns to "spend time with a lawyer", {co} drops',
  'Analysts downgrade {co} from "probably fine" to "oh no"',
  '{co} recalls all {thing}, cannot say which ones',
  'Investors flee {co} after {ceo} uses the word "pivot" twice',
  'Nobody wants {thing} anymore, {co} caught holding the bag',
  '{co} announces layoffs by calendar invite, stock slides',
  '{ceo} blames "headwinds" for {co} slump, there are no windows',
  'Leaked memo reveals {co} runs on a single laptop',
  '{co} under investigation for something with a very long name',
  'Fund manager dumps {co}, says "never liked it", held it for ten years',
  '{co} loses money in a new and creative way',
  '{ceo} says "we are fine", {co} down nine percent',
  'Regulators ask {co} a few friendly questions, it is not going well',
  '{co} shares sink after {ceo} tweets at 3 a.m.',
];
export const SECTOR_GOOD = [
  'Entire {sector} industry rallies, nobody sure why',
  '{sector} stocks jump as investors remember {thing} exist',
  'Good day for {thing}, bad day to be a short seller',
  '{sector} shares surge, {co} and {co2} lead the group chat',
];
export const SECTOR_BAD = [
  'Entire {sector} industry sinks, {co} and {co2} blame each other',
  '{sector} stocks slide as investors reconsider {thing}',
  'Rough day for {thing}, rougher day for everyone holding them',
  '{sector} shares tumble, analysts "saw this coming" retroactively',
];
export const MARKET_GOOD = [
  'Market rallies on news that everything is fine for now',
  'Stocks surge after a headline traders pretend to understand',
  'Broad rally lifts everything, including things that should not be lifted',
];
export const MARKET_BAD = [
  'Market sinks on news that everything is, in fact, not fine',
  'Stocks tumble after a headline traders pretend to understand',
  'Broad selloff takes down the good and the bad, mostly the bad',
];
export const DEKS = [
  'Analysts are "monitoring the situation", which means refreshing.',
  'Several people on the internet are certain they called this.',
  'The company declined to comment, then commented.',
  'Shares moved before most readers finished this sentence.',
  'A spokesperson described the move as "a number going somewhere".',
  'Traders say this is either very good or very bad.',
  'Experts disagree, and have for some time.',
  'This is not investment advice, it is barely journalism.',
  'The group chat has been informed.',
  'Everyone is calling it a lesson, nobody is sure which.',
];

// Timeless events: invented, bigger swings on one company. kind: 'wild'
// good:true lifts, false drops. Pick of company is random within the sector (or any sector if sector is null).
export const WILD = [
  { good: false, mag: 11, t: '{co} CEO {ceo} caught on a hot mic explaining the business model', d: 'The model, it turns out, was vibes.' },
  { good: false, mag: 14, t: '{co} accidentally emails customers the entire internal roadmap, it is one slide', d: 'The slide says "figure it out".' },
  { good: false, mag: 9, t: 'Fire at {co} warehouse, insurance company asks if it was "a big fire"', d: 'It was a medium fire with big feelings.' },
  { good: true, mag: 12, t: '{co} accidentally invents something useful', d: 'Legal is checking whether they can take it back.' },
  { good: true, mag: 10, t: 'Celebrity mentions {co} in a podcast, retail traders stampede', d: 'The celebrity has never heard of the company.' },
  { good: false, mag: 12, t: '{ceo} announces {co} is "a lifestyle brand now"', d: 'Nobody can tell what the lifestyle is.' },
  { good: true, mag: 13, t: '{co} rebrands as "AI" without changing anything else', d: 'The stock does not care about the details.' },
  { good: false, mag: 10, t: 'Whistleblower says {co} breakroom has no snacks, morale collapses', d: 'Productivity was already hard to measure.' },
  { good: true, mag: 9, t: '{co} cuts all meetings, productivity measured at "yes"', d: 'The calendar app is suing.' },
  { good: false, mag: 15, t: '{co} loses the password to the company, {ceo} says "have you tried turning it off"', d: 'The board has tried that.' },
  { good: true, mag: 11, t: '{co} CEO {ceo} goes viral for answering an email in one day', d: 'HR has opened an inquiry.' },
  { good: false, mag: 13, t: 'Intern at {co} pushes the red button to see what happens', d: 'What happened was the stock.' },
  { good: true, mag: 8, t: '{co} wins "best place to work" from a survey it ran itself', d: 'Turnout was strong.' },
  { good: false, mag: 12, t: '{ceo} of {co} says the company is "bigger than money", shareholders disagree', d: 'They checked the balance sheet.' },
  { good: true, mag: 14, t: 'Rival of {co} sets its own office on fire, {co} benefits quietly', d: 'No comment, but a very nice cake.' },
  { good: false, mag: 9, t: '{co} announces subscription tier for the {thing} you already own', d: 'There is also a tier for the tier.' },
];
// the free money event: everyone can claim once
export const BRRR = [
  { t: 'The printer goes brrr: every investor gets a free {amt}', d: 'Economists call it "stimulus". Your landlord calls it Tuesday.' },
  { t: 'Central bank sneezes, {amt} falls out of the sky', d: 'Inflation says hello.' },
  { t: 'Surprise rebate, {amt} for everyone who remembers their password', d: 'That was not a long list.' },
  { t: 'Treasury finds {amt} behind the couch, hands it out', d: 'The couch is now under investigation.' },
];

// Scheduled appointments (the page counts down to them). dir +1 good for the market, -1 bad.
export const SCHED = {
  rate: { label: 'Rate decision', up: ['Central bank blinks, markets cheer', 'Rates held, traders announce they are "relieved"', 'Surprise cut, everyone pretends they expected it'],
    down: ['Central bank hikes rates, markets sulk', 'Rate decision lands, traders discover they have feelings', 'Hawkish speech, doves not available for comment'], dek: 'A man read a statement slowly. Prices did the rest.' },
  jobs: { label: 'Jobs report', up: ['Jobs report beats forecasts, economists blame the weather anyway', 'Hiring surges, nobody can find the new jobs'],
    down: ['Jobs report misses forecasts, economists blame the weather', 'Hiring stalls, "adjusted" numbers adjusted again'], dek: 'The number will be revised next month, quietly.' },
  earn: { label: 'Earnings', up: ['{co} reports earnings, says "cautiously optimistic" and means it', '{co} beats earnings, {ceo} thanks "the team", the team is one intern', '{co} posts a profit, auditors request a recount'],
    down: ['{co} reports earnings, {ceo} says "transitory" four times', '{co} misses earnings, blames "unprecedented normal conditions"', '{co} posts a loss, calls it "an investment in the future"'], dek: 'The call was forty minutes. The stock moved in four seconds.' },
};
