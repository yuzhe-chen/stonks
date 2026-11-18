#!/bin/sh
# push and deploy the Stonks backend, refusing anything that could show Google's permission screen
cd "$(dirname "$0")"
node -e '
const fs=require("fs");
const m=JSON.parse(fs.readFileSync("appsscript.json","utf8")),bad=[];
if(JSON.stringify(m.oauthScopes||null)!=="[]")bad.push("oauthScopes must be an empty list");
if(!m.webapp||m.webapp.executeAs!=="USER_DEPLOYING"||m.webapp.access!=="ANYONE_ANONYMOUS")bad.push("webapp must run as the owner for anyone");
if(m.dependencies&&Object.keys(m.dependencies).length)bad.push("advanced services need scopes");
const code=fs.readFileSync("Code.gs","utf8");
const banned=/\b(UrlFetchApp|SpreadsheetApp|GmailApp|MailApp|DriveApp|DocumentApp|SlidesApp|FormApp|CalendarApp|ContactsApp|GroupsApp|ScriptApp|Session\.get(Active|Effective)User|AdminDirectory|YouTube|BigQuery)\b/g;
const hits=[...new Set(code.match(banned)||[])];if(hits.length)bad.push("uses "+hits.join(", "));
if(bad.length){console.error("REFUSING TO DEPLOY: "+bad.join("; "));process.exit(1);}' || exit 1
CLASP=/Users/yixinlu/planner/appsscript/node_modules/.bin/clasp
$CLASP push -f || exit 1
DEP=$(cat .deployment 2>/dev/null)
if [ -n "$DEP" ]; then $CLASP deploy -i "$DEP" -d "stonks" || exit 1; else $CLASP deploy -d "stonks" | tee /dev/stderr | sed -n "s/^Deployed \(AKfycb[A-Za-z0-9_-]*\) .*/\1/p" > .deployment; fi
URL="https://script.google.com/macros/s/$(cat .deployment)/exec"
page=$(curl -s -L "$URL")
if echo "$page" | grep -qi "oauth\|authorization is required\|needs your permission\|ServiceLogin\|accounts.google.com/signin"; then echo "LIVE CHECK FAILED: Google permission screen" >&2; exit 1; fi
echo "$page" | grep -q '"game":"stonks"' || { echo "LIVE CHECK FAILED: backend not answering" >&2; exit 1; }
echo "live check ok $URL"
