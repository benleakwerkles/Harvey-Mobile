declare const process: {
  env: {
    EXPO_PUBLIC_HARVEY_BUILD_SHA?: string;
  };
};

export type BuildIdentity = Readonly<
  | {
      state: "CI_BOUND";
      sha: string;
      truthLabel: "BUNDLE TREE SHA · CI BOUND";
    }
  | {
      state: "UNBOUND_LOCAL";
      sha: null;
      truthLabel: "BUNDLE TREE SHA · UNBOUND LOCAL";
    }
  | {
      state: "UNBOUND_INVALID";
      sha: null;
      truthLabel: "BUNDLE TREE SHA · INVALID/UNBOUND";
    }
>;

const fullShaPattern = /^[a-f0-9]{40}$/i;

export function getBuildIdentity(candidate: string | undefined): BuildIdentity {
  if (candidate === undefined || candidate.trim() === "") {
    return Object.freeze({
      state: "UNBOUND_LOCAL",
      sha: null,
      truthLabel: "BUNDLE TREE SHA · UNBOUND LOCAL",
    });
  }

  if (!fullShaPattern.test(candidate)) {
    return Object.freeze({
      state: "UNBOUND_INVALID",
      sha: null,
      truthLabel: "BUNDLE TREE SHA · INVALID/UNBOUND",
    });
  }

  return Object.freeze({
    state: "CI_BOUND",
    sha: candidate.toLowerCase(),
    truthLabel: "BUNDLE TREE SHA · CI BOUND",
  });
}

export const BUILD_IDENTITY = getBuildIdentity(process.env.EXPO_PUBLIC_HARVEY_BUILD_SHA);
