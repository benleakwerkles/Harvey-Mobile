export const FLOCK_NETWORK_LADDER = [
  "DISCOVERED",
  "RECEIVED",
  "ACCEPTED",
  "JOINED",
] as const;

export type FlockNetworkLadderState = (typeof FLOCK_NETWORK_LADDER)[number];
export type FlockNetworkObservationState = "UNOBSERVED" | FlockNetworkLadderState;

export interface FlockNetworkLadderStep {
  readonly state: FlockNetworkLadderState;
  readonly reached: boolean;
  readonly evidence: string | null;
}

export interface FlockNetworkBoundary {
  readonly liveTransport: false;
  readonly remoteControl: false;
  readonly externalDelivery: false;
  readonly canonPromotion: false;
}

export interface FlockNetworkSnapshot {
  readonly sender: "SWANSON@DOSS";
  readonly receiver: "DINK@MEDULLINA";
  readonly scope: "Harvey Mobile / Werkles";
  readonly state: "UNOBSERVED";
  readonly status: "NO VERIFIED PING";
  readonly freshness: "UNAVAILABLE";
  readonly sourceStatus: "NO IMMUTABLE SOURCE";
  readonly sourceUrl: null;
  readonly canonStatus: "NOT CANON";
  readonly ladder: readonly FlockNetworkLadderStep[];
  readonly boundary: FlockNetworkBoundary;
}

const EMPTY_LADDER: readonly FlockNetworkLadderStep[] = Object.freeze(
  FLOCK_NETWORK_LADDER.map((state) => Object.freeze({ state, reached: false, evidence: null })),
);

const NETWORK_BOUNDARY: FlockNetworkBoundary = Object.freeze({
  liveTransport: false,
  remoteControl: false,
  externalDelivery: false,
  canonPromotion: false,
});

export const FLOCK_NETWORK_SNAPSHOT: FlockNetworkSnapshot = Object.freeze({
  sender: "SWANSON@DOSS",
  receiver: "DINK@MEDULLINA",
  scope: "Harvey Mobile / Werkles",
  state: "UNOBSERVED",
  status: "NO VERIFIED PING",
  freshness: "UNAVAILABLE",
  sourceStatus: "NO IMMUTABLE SOURCE",
  sourceUrl: null,
  canonStatus: "NOT CANON",
  ladder: EMPTY_LADDER,
  boundary: NETWORK_BOUNDARY,
});

export function getFlockNetworkSnapshot(): FlockNetworkSnapshot {
  return FLOCK_NETWORK_SNAPSHOT;
}
