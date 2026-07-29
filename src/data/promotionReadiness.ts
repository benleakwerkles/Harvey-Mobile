import type { BuildIdentity } from "./buildIdentity";
import { serializeEvidenceBundle, type EvidenceBundle } from "./evidenceBundle.ts";

export const PROMOTION_EVIDENCE_MAX_AGE_DAYS = 7;
export type PromotionReadinessState = "READY_FOR_HUMAN_REVIEW" | "PENDING_HUMAN_GATE";
export type PromotionCriterionState = "PASS" | "BLOCK" | "PENDING";
export type PromotionReasonCode = "EVIDENCE_EFFECT_CLAIM" | "EVIDENCE_BOUNDARY_INVALID" | "CURRENT_BUILD_UNBOUND" | "EVIDENCE_BUILD_UNBOUND" | "BUILD_SHA_MISMATCH" | "EVALUATION_TIME_INVALID" | "EVIDENCE_TIME_INVALID" | "EVIDENCE_FUTURE" | "EVIDENCE_STALE" | "HUMAN_APPROVAL_REQUIRED";
export type PromotionReadinessEffectFlags = Readonly<{ approvalGranted:false; canonWritten:false; merged:false; deployed:false; hosted:false; delivered:false; executed:false; verified:false }>;
export type PromotionReadinessCriterion = Readonly<{ id:"EVIDENCE_BOUNDARY"|"CURRENT_BUILD_BOUND"|"EVIDENCE_BUILD_BOUND"|"BUILD_SHA_MATCH"|"EVIDENCE_FRESHNESS"|"HUMAN_APPROVAL"; label:string; state:PromotionCriterionState; detail:string }>;
export type PromotionReadinessView = Readonly<{ state:PromotionReadinessState; truth:"ADVISORY_READINESS_NOT_APPROVAL"; approvalState:"PENDING_HUMAN_GATE"; repository:"benleakwerkles/Harvey-Mobile"; evidenceBundleId:string|null; evidenceSourceSha:string|null; evidenceBuildSha:string|null; currentBuildSha:string|null; evidenceAgeDays:number|null; criteria:readonly PromotionReadinessCriterion[]; reasonCodes:readonly PromotionReasonCode[]; nextActionLabel:string; effectFlags:PromotionReadinessEffectFlags }>;

const FULL_SHA=/^[0-9a-f]{40}$/; const DAY_MS=86_400_000;
const ZERO:PromotionReadinessEffectFlags=Object.freeze({approvalGranted:false,canonWritten:false,merged:false,deployed:false,hosted:false,delivered:false,executed:false,verified:false});
function criterion(id:PromotionReadinessCriterion["id"],label:string,state:PromotionCriterionState,detail:string):PromotionReadinessCriterion{return Object.freeze({id,label,state,detail});}

export function getPromotionReadinessView(input:Readonly<{evidenceBundle:EvidenceBundle;buildIdentity:BuildIdentity;now:Date}>):PromotionReadinessView{
 const bundle=input.evidenceBundle as EvidenceBundle|undefined,reasons:PromotionReasonCode[]=[];
 const candidateEffects=bundle&&typeof bundle==="object"&&bundle.effectFlags&&typeof bundle.effectFlags==="object"?Object.values(bundle.effectFlags):[]; const effectClaim=candidateEffects.some((value)=>value!==false);
 let boundaryValid=false; try{if(bundle){serializeEvidenceBundle(bundle);boundaryValid=true;}}catch{boundaryValid=false;} if(effectClaim)reasons.push("EVIDENCE_EFFECT_CLAIM"); if(!boundaryValid)reasons.push("EVIDENCE_BOUNDARY_INVALID");
 const currentBuildSha=input.buildIdentity?.state==="CI_BOUND"&&typeof input.buildIdentity.sha==="string"&&FULL_SHA.test(input.buildIdentity.sha)?input.buildIdentity.sha:null; const currentBuildBound=currentBuildSha!==null; if(!currentBuildBound)reasons.push("CURRENT_BUILD_UNBOUND");
 const evidenceIdentity=bundle?.summaries?.buildIdentity; const evidenceBuildSha=boundaryValid&&evidenceIdentity?.state==="CI_BOUND"&&typeof evidenceIdentity.sha==="string"&&FULL_SHA.test(evidenceIdentity.sha)?evidenceIdentity.sha:null; const evidenceBuildBound=evidenceBuildSha!==null; if(!evidenceBuildBound)reasons.push("EVIDENCE_BUILD_UNBOUND");
 const shaMatch=currentBuildBound&&evidenceBuildBound&&currentBuildSha===evidenceBuildSha; if(currentBuildBound&&evidenceBuildBound&&!shaMatch)reasons.push("BUILD_SHA_MISMATCH");
 const nowMs=input.now instanceof Date?input.now.getTime():Number.NaN,createdMs=typeof bundle?.createdAt==="string"?Date.parse(bundle.createdAt):Number.NaN,observedMs=typeof bundle?.provenance?.observedAt==="string"?Date.parse(bundle.provenance.observedAt):Number.NaN; const evaluationTimeValid=Number.isFinite(nowMs),evidenceTimeValid=Number.isFinite(createdMs)&&Number.isFinite(observedMs)&&observedMs<=createdMs; if(!evaluationTimeValid)reasons.push("EVALUATION_TIME_INVALID"); if(!evidenceTimeValid)reasons.push("EVIDENCE_TIME_INVALID");
 const evidenceFuture=evaluationTimeValid&&evidenceTimeValid&&(createdMs>nowMs||observedMs>nowMs); if(evidenceFuture)reasons.push("EVIDENCE_FUTURE"); const evidenceStale=evaluationTimeValid&&evidenceTimeValid&&!evidenceFuture&&(nowMs-observedMs)>PROMOTION_EVIDENCE_MAX_AGE_DAYS*DAY_MS; if(evidenceStale)reasons.push("EVIDENCE_STALE"); const evidenceFresh=boundaryValid&&!effectClaim&&evaluationTimeValid&&evidenceTimeValid&&!evidenceFuture&&!evidenceStale; const evidenceAgeDays=evaluationTimeValid&&evidenceTimeValid&&!evidenceFuture?Math.floor((nowMs-observedMs)/DAY_MS):null;
 const ready=boundaryValid&&!effectClaim&&currentBuildBound&&evidenceBuildBound&&shaMatch&&evidenceFresh; reasons.push("HUMAN_APPROVAL_REQUIRED");
 const criteria=Object.freeze([
  criterion("EVIDENCE_BOUNDARY","Safe evidence bundle",boundaryValid&&!effectClaim?"PASS":"BLOCK",boundaryValid&&!effectClaim?"Exact metadata-only bundle validated.":"Bundle schema, truth, or zero-effect boundary failed."),
  criterion("CURRENT_BUILD_BOUND","Current bundle identity",currentBuildBound?"PASS":"BLOCK",currentBuildBound?"Current app bundle has a full CI-bound SHA.":"Current app bundle is unbound or invalid."),
  criterion("EVIDENCE_BUILD_BOUND","Evidence build identity",evidenceBuildBound?"PASS":"BLOCK",evidenceBuildBound?"Evidence records a full CI-bound build SHA.":"Evidence does not prove a CI-bound build SHA."),
  criterion("BUILD_SHA_MATCH","Build identity matches evidence",shaMatch?"PASS":"BLOCK",shaMatch?"Current and evidenced build SHAs match.":"Current and evidenced build SHAs are unavailable or different."),
  criterion("EVIDENCE_FRESHNESS","Evidence is current",evidenceFresh?"PASS":"BLOCK",evidenceFresh?"Evidence is within the 7-day review window.":"Evidence time is invalid, future-dated, or stale."),
  criterion("HUMAN_APPROVAL","Separate human promotion gate","PENDING","Readiness never grants approval, writes canon, merges, or deploys.")
 ]);
 return Object.freeze({state:ready?"READY_FOR_HUMAN_REVIEW":"PENDING_HUMAN_GATE",truth:"ADVISORY_READINESS_NOT_APPROVAL",approvalState:"PENDING_HUMAN_GATE",repository:"benleakwerkles/Harvey-Mobile",evidenceBundleId:typeof bundle?.bundleId==="string"?bundle.bundleId:null,evidenceSourceSha:typeof bundle?.provenance?.sourceSha==="string"&&FULL_SHA.test(bundle.provenance.sourceSha)?bundle.provenance.sourceSha:null,evidenceBuildSha,currentBuildSha,evidenceAgeDays,criteria,reasonCodes:Object.freeze(reasons),nextActionLabel:ready?"Review the evidence and decide the separate human promotion gate.":"Resolve blocked criteria before requesting human promotion review.",effectFlags:ZERO});
}
