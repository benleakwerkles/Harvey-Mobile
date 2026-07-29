import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createBuildQueueItem, getBuildQueueView } from "../../src/data/buildQueue.ts";
import { acknowledgeDailyMission, advanceDailyMissionFocus, createDailyMissionSession, getDailyMissionView } from "../../src/data/dailyMission.ts";
import { PROJECT_COCKPIT_SNAPSHOT, getProjectCockpitView } from "../../src/data/projectCockpit.ts";
import { getResilienceFreshnessView } from "../../src/data/resilienceFreshness.ts";

const DAY=86_400_000,NOW=new Date("2026-07-29T16:00:00.000Z"),SHA="a".repeat(40);
const QUEUE=getBuildQueueView([
 createBuildQueueItem({id:"build-zulu",title:"Review zulu mission",area:"Mission",priority:"P1",createdAt:"2026-07-29T15:00:00.000Z"}),
 createBuildQueueItem({id:"build-alpha",title:"Review alpha mission",area:"Mission",priority:"P1",createdAt:"2026-07-29T15:00:00.000Z"}),
 createBuildQueueItem({id:"build-p0",title:"Review priority-zero mission",area:"Mission",priority:"P0",createdAt:"2026-07-29T15:01:00.000Z"})
]);
const COCKPIT=getProjectCockpitView(PROJECT_COCKPIT_SNAPSHOT,NOW);
const PROMOTION_EFFECTS=Object.freeze({approvalGranted:false,canonWritten:false,merged:false,deployed:false,hosted:false,delivered:false,executed:false,verified:false});
const PROMOTION=Object.freeze({state:"READY_FOR_HUMAN_REVIEW",truth:"ADVISORY_READINESS_NOT_APPROVAL",approvalState:"PENDING_HUMAN_GATE",repository:"benleakwerkles/Harvey-Mobile",evidenceBundleId:"evidence-bundle-c13",evidenceSourceSha:SHA,evidenceBuildSha:SHA,currentBuildSha:SHA,evidenceAgeDays:0,criteria:Object.freeze([{id:"EVIDENCE_BOUNDARY",label:"Safe evidence bundle",state:"PASS",detail:"Exact metadata-only bundle validated."},{id:"CURRENT_BUILD_BOUND",label:"Current bundle identity",state:"PASS",detail:"Current app bundle has a full CI-bound SHA."},{id:"EVIDENCE_BUILD_BOUND",label:"Evidence build identity",state:"PASS",detail:"Evidence records a full CI-bound build SHA."},{id:"BUILD_SHA_MATCH",label:"Build identity matches evidence",state:"PASS",detail:"Current and evidenced build SHAs match."},{id:"EVIDENCE_FRESHNESS",label:"Evidence is current",state:"PASS",detail:"Evidence is within the review window."},{id:"HUMAN_APPROVAL",label:"Separate human promotion gate",state:"PENDING",detail:"Readiness never grants approval."}].map(Object.freeze)),reasonCodes:Object.freeze(["HUMAN_APPROVAL_REQUIRED"]),nextActionLabel:"Review the evidence and decide the separate human promotion gate.",effectFlags:PROMOTION_EFFECTS});
const CURRENT=getResilienceFreshnessView({subject:"EVIDENCE_BUNDLE",observedAt:new Date(NOW.getTime()-DAY).toISOString(),now:NOW});
const input=(overrides={})=>({buildQueue:QUEUE,cockpit:COCKPIT,evidenceFreshness:CURRENT,promotionReadiness:PROMOTION,now:NOW,...overrides});
const mission=(overrides={})=>getDailyMissionView(input(overrides));
const freshness=(age)=>getResilienceFreshnessView({subject:"EVIDENCE_BUNDLE",observedAt:new Date(NOW.getTime()-age).toISOString(),now:NOW});
const forgeQueueItem=(patch)=>{const items=[...QUEUE.items];items[0]={...items[0],...patch};return {...QUEUE,items:Object.freeze(items)};};
const unboundPromotion=()=>({...PROMOTION,state:"PENDING_HUMAN_GATE",evidenceBuildSha:null,currentBuildSha:null,reasonCodes:Object.freeze(["CURRENT_BUILD_UNBOUND","EVIDENCE_BUILD_UNBOUND","HUMAN_APPROVAL_REQUIRED"])});
function assertZeroEffects(value){assert.deepEqual(Object.keys(value).sort(),["changesApproval","changesQueue","modifiesFiles","sendsNetwork"]);assert.ok(Object.values(value).every((effect)=>effect===false));}
function assertBlocked(view,codes){assert.equal(view.state,"BLOCKED");assert.deepEqual(view.blockReasonCodes,codes);assert.deepEqual(view.today,[]);assert.deepEqual(view.next,[]);assertZeroEffects(view.effectFlags);}

test("daily mission is deterministic, exact, frozen, and canonically ranked",()=>{
 const first=mission(),second=mission();assert.deepEqual(first,second);assert.equal(first.state,"READY");assert.equal(first.createdAt,NOW.toISOString());assert.deepEqual(first.blockReasonCodes,[]);
 assert.deepEqual(Object.keys(first).sort(),["allItems","blockReasonCodes","createdAt","effectFlags","live","next","state","today","truth","watch"]);assert.equal(first.truth,"DAILY_MISSION_ADVISORY_NOT_EXECUTED");assert.equal(first.live,false);assertZeroEffects(first.effectFlags);
 assert.deepEqual(first.today.map(({id,sourceKind,lane,rank,reasonCode,title})=>[id,sourceKind,lane,rank,reasonCode,title]),[["mission-build-p0","BUILD_QUEUE","TODAY",1,"BUILD_QUEUE_PRIORITY","Review priority-zero mission"],["mission-build-alpha","BUILD_QUEUE","TODAY",2,"BUILD_QUEUE_PRIORITY","Review alpha mission"]]);
 assert.deepEqual(first.next.map(({id,sourceKind,lane,rank,reasonCode})=>[id,sourceKind,lane,rank,reasonCode]),[["mission-cockpit-verify-cockpit-contracts","COCKPIT","NEXT",3,"COCKPIT_HIGHEST_VALUE"]]);
 assert.deepEqual(first.watch.map(({id,sourceKind,lane,rank,reasonCode,title})=>[id,sourceKind,lane,rank,reasonCode,title]),[["mission-watch-promotion","PROMOTION_READINESS","WATCH",4,"PROMOTION_GATE_WATCH","Complete the separate human promotion gate"]]);
 assert.deepEqual(first.allItems,[...first.today,...first.next,...first.watch]);assert.deepEqual(first.allItems.map((item)=>item.rank),[1,2,3,4]);
 for(const item of first.allItems){assert.deepEqual(Object.keys(item).sort(),["effectFlags","id","lane","persistence","rank","reasonCode","sourceId","sourceKind","title","transport","truth"]);assert.equal(item.truth,"SESSION_ADVISORY_NOT_EXECUTED");assert.equal(item.persistence,"SESSION_ONLY");assert.equal(item.transport,"NONE");assertZeroEffects(item.effectFlags);assert.ok(Object.isFrozen(item));}
 for(const value of [first,first.today,first.next,first.watch,first.allItems,first.effectFlags])assert.ok(Object.isFrozen(value));
});

test("freshness clock boundaries are exact and source drift blocks",()=>{
 const atTwo=mission({evidenceFreshness:freshness(2*DAY)}),afterTwo=mission({evidenceFreshness:freshness(2*DAY+1)}),atSeven=mission({evidenceFreshness:freshness(7*DAY)}),afterSeven=mission({evidenceFreshness:freshness(7*DAY+1)});
 assert.equal(atTwo.state,"READY");assert.equal(atTwo.watch.some((item)=>item.id==="mission-watch-evidence"),false);
 for(const view of [afterTwo,atSeven]){assert.equal(view.state,"READY");const item=view.watch.find((candidate)=>candidate.id==="mission-watch-evidence");assert.equal(item?.title,"Review aging evidence before it becomes stale");assert.equal(item?.reasonCode,"EVIDENCE_FRESHNESS_WATCH");}
 assertBlocked(afterSeven,["STALE_EVIDENCE"]);assert.equal(afterSeven.watch.find((item)=>item.id==="mission-watch-evidence")?.title,"Refresh evidence before planning work");
 const future=getResilienceFreshnessView({subject:"EVIDENCE_BUNDLE",observedAt:new Date(NOW.getTime()+1).toISOString(),now:NOW});assertBlocked(mission({evidenceFreshness:future}),["FUTURE_EVIDENCE"]);
 const invalid=getResilienceFreshnessView({subject:"EVIDENCE_BUNDLE",observedAt:"bad",now:NOW});assertBlocked(mission({evidenceFreshness:invalid}),["INVALID_EVIDENCE"]);
 const unavailable=getResilienceFreshnessView({subject:"EVIDENCE_BUNDLE",observedAt:null,now:NOW});assertBlocked(mission({evidenceFreshness:unavailable}),["UNAVAILABLE_EVIDENCE"]);
 const drift={...CURRENT,checkedAt:new Date(NOW.getTime()-1).toISOString()};assertBlocked(mission({evidenceFreshness:drift}),["INVALID_CHECK_TIME"]);
 const badNow=mission({now:new Date("bad")});assert.equal(badNow.createdAt,null);assertBlocked(badNow,["INVALID_CHECK_TIME"]);
});

test("block reasons retain fixed order without inventing executable work",()=>{
 const stale=freshness(7*DAY+1);const view=mission({buildQueue:getBuildQueueView([]),evidenceFreshness:stale,promotionReadiness:unboundPromotion()});
 assertBlocked(view,["EMPTY_BUILD_QUEUE","STALE_EVIDENCE","PROMOTION_UNBOUND"]);assert.deepEqual(view.watch.map((item)=>item.id),["mission-watch-evidence","mission-watch-promotion"]);assert.deepEqual(view.allItems,view.watch);assert.deepEqual(view.allItems.map((item)=>item.rank),[1,2]);
});

test("unknown fields, raw content, secrets, credentials, and effect claims never enter the view",()=>{
 const rawValues=["password=hunter2","Authorization: Bearer abcdefghijklmnop","github_pat_"+"a".repeat(24),"Merged and deployed release"];
 for(const rawCapture of rawValues){const view=getDailyMissionView({...input(),rawCapture});assertBlocked(view,["INPUT_SCHEMA_INVALID"]);assert.equal(JSON.stringify(view).includes(rawCapture),false);assert.deepEqual(view.allItems,[]);}
 for(const title of rawValues){const view=mission({buildQueue:forgeQueueItem({title})});assertBlocked(view,["INPUT_SCHEMA_INVALID"]);assert.equal(JSON.stringify(view).includes(title),false);assert.deepEqual(view.allItems,[]);}
 const nestedUnknown=mission({buildQueue:forgeQueueItem({debug:"raw source"})});assertBlocked(nestedUnknown,["INPUT_SCHEMA_INVALID"]);assert.deepEqual(nestedUnknown.allItems,[]);
 const claimed=[{buildQueue:{...QUEUE,effectFlags:{...QUEUE.effectFlags,executed:true}}},{buildQueue:forgeQueueItem({effectFlags:{...QUEUE.items[0].effectFlags,deployed:true}})},{cockpit:{...COCKPIT,effectFlags:{...COCKPIT.effectFlags,merged:true}}},{evidenceFreshness:{...CURRENT,effectFlags:{...CURRENT.effectFlags,delivered:true}}},{promotionReadiness:{...PROMOTION,effectFlags:{...PROMOTION.effectFlags,approvalGranted:true}}}];
 for(const override of claimed){const view=mission(override);assertBlocked(view,["INPUT_EFFECT_CLAIM"]);assert.deepEqual(view.allItems,[]);assertZeroEffects(view.effectFlags);}
});

test("duplicate queue and cockpit source IDs fail closed",()=>{
 const queueItem=QUEUE.items[0],duplicateQueue={...QUEUE,totalCount:2,openCount:2,activeCount:0,doneCount:0,items:Object.freeze([queueItem,{...queueItem}])};const queueView=mission({buildQueue:duplicateQueue});assertBlocked(queueView,["DUPLICATE_SOURCE_ID"]);assert.deepEqual(queueView.allItems,[]);
 const action=COCKPIT.rankedActions[0],duplicateCockpit={...COCKPIT,rankedActions:Object.freeze([action,{...action}]),topAction:action,highestValueAction:action};const cockpitView=mission({cockpit:duplicateCockpit});assertBlocked(cockpitView,["DUPLICATE_SOURCE_ID"]);assert.deepEqual(cockpitView.allItems,[]);
});

test("session review lifecycle is frozen, deterministic, idempotent, and source-preserving",()=>{
 const sourcesBefore=JSON.stringify(input()),view=mission(),initial=createDailyMissionSession(view);assert.deepEqual(Object.keys(initial).sort(),["acknowledgedMissionIds","effectFlags","focusedMissionId","persistence","transport","truth"]);assert.equal(initial.truth,"SESSION_REVIEW_STATE_NOT_EXECUTION");assert.equal(initial.persistence,"SESSION_ONLY");assert.equal(initial.transport,"NONE");assert.equal(initial.focusedMissionId,view.allItems[0].id);assert.deepEqual(initial.acknowledgedMissionIds,[]);assertZeroEffects(initial.effectFlags);assert.ok(Object.isFrozen(initial));assert.ok(Object.isFrozen(initial.acknowledgedMissionIds));
 const advanced=advanceDailyMissionFocus(view,initial);assert.equal(advanced.focusedMissionId,view.allItems[1].id);
 const secondFirst=acknowledgeDailyMission(view,initial,view.allItems[1].id);assert.deepEqual(secondFirst.acknowledgedMissionIds,[view.allItems[1].id]);assert.equal(secondFirst.focusedMissionId,view.allItems[0].id);
 const canonical=acknowledgeDailyMission(view,secondFirst,view.allItems[0].id);assert.deepEqual(canonical.acknowledgedMissionIds,[view.allItems[0].id,view.allItems[1].id]);assert.equal(canonical.focusedMissionId,view.allItems[2].id);assert.deepEqual(acknowledgeDailyMission(view,canonical,view.allItems[0].id),canonical);
 assert.throws(()=>acknowledgeDailyMission(view,initial,"mission-unknown"),/mission|unknown/i);assert.throws(()=>advanceDailyMissionFocus(view,{...initial,focusedMissionId:"mission-unknown"}),/session|drift|focus/i);assert.throws(()=>advanceDailyMissionFocus(view,{...initial,effectFlags:{...initial.effectFlags,changesQueue:true}}),/effect|queue/i);
 assert.equal(JSON.stringify(input()),sourcesBefore);for(const session of [advanced,secondFirst,canonical]){assertZeroEffects(session.effectFlags);assert.ok(Object.isFrozen(session));assert.ok(Object.isFrozen(session.acknowledgedMissionIds));}
});

test("daily mission UI is ordered, non-color, dynamic-type safe, 48px, and session-only",async()=>{
 const [source,home,pkgText,workflow]=await Promise.all([readFile(new URL("../../src/components/DailyMissionCard.tsx",import.meta.url),"utf8"),readFile(new URL("../../app/index.tsx",import.meta.url),"utf8"),readFile(new URL("../../package.json",import.meta.url),"utf8"),readFile(new URL("../../.github/workflows/verify.yml",import.meta.url),"utf8")]);
 for(const literal of ["DAILY MISSION","TODAY","NEXT","WATCH","READY · ADVISORY ONLY","BLOCKED · ADVISORY ONLY","HUMAN GATE REQUIRED","SESSION ACKNOWLEDGED · NOT EXECUTED","SESSION FOCUS · NOT EXECUTION","NO DAILY MISSION ITEMS","INVALID_CHECK_TIME","INPUT_SCHEMA_INVALID","INPUT_EFFECT_CLAIM","DUPLICATE_SOURCE_ID","EMPTY_BUILD_QUEUE","STALE_EVIDENCE","FUTURE_EVIDENCE","INVALID_EVIDENCE","UNAVAILABLE_EVIDENCE","PROMOTION_UNBOUND","No work was executed, saved, sent, approved, merged, deployed, delivered, hosted, or promoted to canon.","Acknowledge advisory item","Focus next advisory item"])assert.ok(source.includes(literal),literal);
 assert.ok(source.indexOf("TODAY")<source.indexOf("NEXT")&&source.indexOf("NEXT")<source.indexOf("WATCH"));assert.match(source,/accessibilityRole=["']header["']/);assert.match(source,/accessibilityLiveRegion=["']polite["']/);assert.match(source,/accessibilityRole=["']button["']/);assert.match(source,/accessibilityHint=/);assert.match(source,/onAcknowledge/);assert.match(source,/onAdvanceFocus/);assert.match(source,/minHeight:\s*48/);assert.match(source,/width:\s*["']100%["']/);assert.match(source,/minWidth:\s*0/);assert.match(source,/flexWrap:\s*["']wrap["']/);
 assert.doesNotMatch(source,/allowFontScaling=\{false\}|numberOfLines=|horizontal=\{true\}/);assert.doesNotMatch(source,/\b(Clipboard|Share|Linking|fetch|XMLHttpRequest|WebSocket|AsyncStorage|FileSystem|openURL)\b|router\.push|expo-(?:sharing|clipboard|file-system)/);
 const dailyIndex=home.indexOf("<DailyMissionCard"),commandIndex=home.indexOf("<CommandBoard");assert.ok(dailyIndex>=0&&commandIndex>=0&&dailyIndex<commandIndex,"DailyMissionCard must render on Home before CommandBoard");
 const script=JSON.parse(pkgText).scripts["test:contracts"],matches=script.match(/tests\/contracts\/daily-mission\.test\.mjs/g)??[];assert.equal(matches.length,1);assert.ok(workflow.indexOf("Run behavior contracts")<workflow.indexOf("Typecheck"));assert.ok(workflow.indexOf("Typecheck")<workflow.indexOf("Export Android bundle"));
});
