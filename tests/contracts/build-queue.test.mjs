import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { BUILD_QUEUE_PRIORITIES, BUILD_QUEUE_STATUSES, addBuildQueueItem, advanceBuildQueueStatus, createBuildQueueItem, getBuildQueueView, reprioritizeBuildQueueItem } from "../../src/data/buildQueue.ts";

function itemFor(overrides={}) { return createBuildQueueItem({ id:"build-default", title:"Verify the session build queue", area:"Harvey Mobile", priority:"P1", createdAt:"2026-07-29T19:00:00.000Z", ...overrides }); }
function find(items,id){const value=items.find((item)=>item.id===id);assert.ok(value);return value;}
function zero(flags){assert.equal(Object.isFrozen(flags),true);assert.equal(Object.values(flags).every((value)=>value===false),true);}

test("queue ordering is input-independent and follows the deterministic tuple",()=>{
 const older=itemFor({id:"build-p0-older",title:"Older P0 move",priority:"P0",createdAt:"2026-07-29T19:00:00.000Z"});
 const newer=itemFor({id:"build-p0-newer",title:"Newer P0 move",priority:"P0",createdAt:"2026-07-29T19:01:00.000Z"});
 const active=find(advanceBuildQueueStatus([itemFor({id:"build-p1-active",title:"Active P1 move",createdAt:"2026-07-29T19:03:00.000Z"})],"build-p1-active"),"build-p1-active");
 const queued=itemFor({id:"build-p1-queued",title:"Queued P1 move",createdAt:"2026-07-29T19:02:00.000Z"});
 const low=itemFor({id:"build-p3-queued",title:"Queued P3 move",priority:"P3",createdAt:"2026-07-29T19:04:00.000Z"});
 const doneSource=itemFor({id:"build-p0-done",title:"Completed P0 move",priority:"P0",createdAt:"2026-07-29T18:59:00.000Z"});
 const done=find(advanceBuildQueueStatus(advanceBuildQueueStatus([doneSource],doneSource.id),doneSource.id),doneSource.id);
 const input=[low,done,queued,newer,active,older]; const expected=[older.id,newer.id,active.id,queued.id,low.id,done.id];
 assert.deepEqual(getBuildQueueView(input).items.map((item)=>item.id),expected);
 assert.deepEqual(getBuildQueueView([...input].reverse()).items.map((item)=>item.id),expected);
 const view=getBuildQueueView(input); assert.deepEqual([view.totalCount,view.openCount,view.activeCount,view.doneCount],[6,5,1,1]); assert.equal(view.persistence,"SESSION_ONLY"); assert.equal(view.transport,"NONE"); zero(view.effectFlags);
});

test("queue lifecycle is monotonic, immutable, and fail-closed",()=>{
 assert.deepEqual(BUILD_QUEUE_PRIORITIES,["P0","P1","P2","P3"]); assert.deepEqual(BUILD_QUEUE_STATUSES,["QUEUED","ACTIVE_LOCAL","DONE_LOCAL"]);
 const base=itemFor({id:"build-life",title:"Exercise local lifecycle",priority:"P2"}); const queued=Object.freeze([base]); const active=advanceBuildQueueStatus(queued,base.id); const done=advanceBuildQueueStatus(active,base.id);
 assert.equal(find(active,base.id).status,"ACTIVE_LOCAL"); assert.equal(find(done,base.id).status,"DONE_LOCAL"); assert.deepEqual(advanceBuildQueueStatus(done,base.id),done);
 const promoted=reprioritizeBuildQueueItem(active,base.id,"P0"); assert.equal(find(promoted,base.id).priority,"P0"); assert.deepEqual(addBuildQueueItem(queued,itemFor({id:"build-added",title:"Added session move",priority:"P0"})).map((item)=>item.id),["build-added","build-life"]);
 [queued,active,done,promoted].forEach((items)=>items.forEach((item)=>{assert.equal(Object.isFrozen(item),true);zero(item.effectFlags);}));
 assert.throws(()=>addBuildQueueItem(queued,itemFor({id:base.id})),/unique/i); assert.throws(()=>advanceBuildQueueStatus(queued,"build-missing"),/not found/i); assert.throws(()=>reprioritizeBuildQueueItem(queued,base.id,"URGENT"),/priority/i);
});

test("queue labels and effects reject secrets and elevated claims",()=>{
 for (const overrides of [{id:"main"},{title:" leading"},{title:"token: ghp_abcdefghijklmnopqrstuvwxyz1234567890"},{title:"Artifact delivered externally"},{title:"Harvey Mobile deployed"},{area:"secret=abc"}]) assert.throws(()=>itemFor(overrides));
 const item=itemFor(); for (const invalid of [{...item,persistence:"DURABLE"},{...item,transport:"NETWORK"},{...item,deployed:true},{...item,effectFlags:{...item.effectFlags,executed:true}}]) assert.throws(()=>getBuildQueueView([invalid]),/field|boundary|effect/i);
});

test("queue UI imports the model and exposes accessible 320px-safe controls",async()=>{
 const source=await readFile(new URL("../../src/components/BuildQueueCard.tsx",import.meta.url),"utf8");
 assert.match(source,/from\s+["']..\/data\/buildQueue["']/); assert.match(source,/BUILD_QUEUE_PRIORITIES/); assert.doesNotMatch(source,/(?:export\s+)?const\s+BUILD_PRIORITIES\b/);
 assert.equal(source.includes("SESSION QUEUE · NOT DISPATCHED"),true); assert.match(source,/accessibilityRole=["']button["']/); assert.match(source,/accessibilityState=/); assert.match(source,/accessibilityLiveRegion=["']polite["']/); assert.equal(source.includes("New session build move"),true); assert.match(source,/Does not save or dispatch./i);
 assert.match(source,/width:\s*["']100%["']/); assert.match(source,/flexWrap:\s*["']wrap["']/); assert.match(source,/flexBasis:\s*78/); assert.match(source,/flexGrow:\s*1/); assert.match(source,/minWidth:\s*0/); assert.match(source,/minHeight:\s*48/); assert.doesNotMatch(source,/\b(fetch|axios|XMLHttpRequest|WebSocket|AsyncStorage|SecureStore)\b/);
});
