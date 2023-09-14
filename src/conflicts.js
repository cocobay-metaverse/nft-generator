const micromatch = require("micromatch");

// const ABORT = -1; //Consider a duplicate DNA
const NO_CONFLICT = 0;
const SKIP = 1; //Do not include layers matching pattern
const EXCLUDE = 2; //Exclude single items within the layer config matching the pattern

const conflicts = [
  {
    pattern: "ObjectRight/both_*",
    conflictsWith: "ObjectLeft/*",
    behaviour: SKIP,
  },
  {
    pattern: "Body/a_*",
    conflictsWith: "Hat/b_*",
    behaviour: EXCLUDE,
  },
  {
    pattern: "Body/b_*",
    conflictsWith: "Hat/a_*",
    behaviour: EXCLUDE,
  },
];

const getConflictAction = (relativePath, existingLayers) => {
  if (relativePath === "" || typeof relativePath === "undefined")
    return NO_CONFLICT;

  const currentConflicts = conflicts.filter((c) =>
    micromatch.isMatch(relativePath, c.conflictsWith),
  );

  for (const currentConflict of currentConflicts) {
    for (const existingLayer of existingLayers) {
      const existingRelativePath = existingLayer.relativePath;

      if (typeof existingRelativePath !== "undefined") {
        if (micromatch.isMatch(existingRelativePath, currentConflict.pattern)) {
          return currentConflict.behaviour;
        }
      }
    }
  }

  return NO_CONFLICT;
};

module.exports = {
  NO_CONFLICT,
  SKIP,
  EXCLUDE,
  getConflictAction,
};
