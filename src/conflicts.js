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
  [
    "Aquamarine",
    "Dark Blue",
    "Dark Pink",
    "Dark Purple",
    "Green",
    "Light Blue",
    "Light Pink",
    "Light Purple",
    "Orange",
    "Yellow",
  ].map((color) => {
    return {
      pattern: `Background/${color}*`,
      conflictsWith: `Body/(a|b)_${color}*`,
      behaviour: EXCLUDE,
    };
  }),
  {
    pattern: "Body/(a|b)_Yellow*",
    conflictsWith: "Face/Moustache*",
    behaviour: EXCLUDE,
  },
  {
    pattern: "Body/(a|b)_Dark Pink*",
    conflictsWith: "Face/Love*",
    behaviour: EXCLUDE,
  },
  {
    pattern: "Body/(a|b)_Aquamarine*",
    conflictsWith: "Wear/Green Dress*",
    behaviour: EXCLUDE,
  },
  {
    pattern: "Body/(a|b)_Dark Blue*",
    conflictsWith:
      "Wear/(Blue Jeans|Fancy Dress|Farmer Costume|Yellow Costume)*",
    behaviour: EXCLUDE,
  },
  {
    pattern: "Body/(a|b)_Dark Pink*",
    conflictsWith: "Wear/Fancy Dress*",
    behaviour: EXCLUDE,
  },
  {
    pattern: "Body/(a|b)_Light Pink*",
    conflictsWith: "Wear/Caveman Costume*",
    behaviour: EXCLUDE,
  },
  {
    pattern: "Body/(a|b)_Yellow*",
    conflictsWith: "Wear/(Basketballer|Peace Neckclace|Yellow Costume)*",
    behaviour: EXCLUDE,
  },
  {
    pattern: "Body/(a|b)_Dark Blue*",
    conflictsWith: "Legs/Cosy Sandals*",
    behaviour: EXCLUDE,
  },
  {
    pattern: "Body/(a|b)_Dark Blue*",
    conflictsWith: "Legs/Cosy Sandals*",
    behaviour: EXCLUDE,
  },
  {
    pattern: "Body/(a|b)_Light Purple*",
    conflictsWith: "Legs/Home Espadrilles*",
    behaviour: EXCLUDE,
  },
  {
    pattern: "Body/(a|b)_Yellow*",
    conflictsWith: "ObjectRight/Bracelet*",
    behaviour: EXCLUDE,
  },
  {
    pattern: "Body/(a|b)_Aquamarine*",
    conflictsWith: "ObjectRight/Coco Book*",
    behaviour: EXCLUDE,
  },
  {
    pattern: "Body/(a|b)_Light Pink*",
    conflictsWith: "ObjectRight/Electric Guitar*",
    behaviour: EXCLUDE,
  },
  {
    pattern: "Background/Light Pink*",
    conflictsWith: "ObjectRight/Electric Guitar*",
    behaviour: EXCLUDE,
  },
  {
    pattern: "Body/(a|b)_Light Purple*",
    conflictsWith: "ObjectRight/Ghettoblaster*",
    behaviour: EXCLUDE,
  },
  {
    pattern: "Background/Light Purple*",
    conflictsWith: "ObjectRight/Ghettoblaster*",
    behaviour: EXCLUDE,
  },
  {
    pattern: "Body/(a|b)_Dark Blue*",
    conflictsWith: "ObjectRight/both_Cables*",
    behaviour: EXCLUDE,
  },
  {
    pattern: "Background/Dark Blue*",
    conflictsWith: "ObjectRight/both_Cables*",
    behaviour: EXCLUDE,
  },
  {
    pattern: "Accessory/*",
    conflictsWith: "Hat/Astronaut Helmet*",
    behaviour: EXCLUDE,
  },
  {
    pattern: "Accessory/(Headphones|Japanese Mask|Snow Goggles)*",
    conflictsWith: "Hat/*",
    behaviour: SKIP,
  },
  {
    pattern: "Body/(a|b)_Dark Blue*",
    conflictsWith: "Accessory/Blue Goggles*",
    behaviour: EXCLUDE,
  },
  {
    pattern: "Body/b_*",
    conflictsWith: "Accessory/Headphones*",
    behaviour: EXCLUDE,
  },
  {
    pattern: "Body/(a|b)_Dark Pink*",
    conflictsWith: "Accessory/Pink Goggles*",
    behaviour: EXCLUDE,
  },
  {
    pattern: "Body/b*",
    conflictsWith: "Accessory/Snow Goggles*",
    behaviour: EXCLUDE,
  },
  {
    pattern:
      "Wear/(Fancy Dress|Farmer Costume|Green Dress|Magician Dress|Peace Neckclace|Yellow Costume)*",
    conflictsWith: "Accessory/Tattoos*",
    behaviour: EXCLUDE,
  },
  {
    pattern:
      "Wear/(Blue Jeans|Fancy Dress|Farmer Costume|Magician Dress|Yellow Costume)*",
    conflictsWith: "Legs/Casted Leg*",
    behaviour: EXCLUDE,
  },
  {
    pattern: "ObjectRight/(Bracelet|Casual Watch|both_Skipping Rope)*",
    conflictsWith: "Accessory/Tattoos*",
    behaviour: EXCLUDE,
  },
  {
    pattern: "ObjectLeft/(Beer Jar|Hand Fan|Rainbow Parchment)*",
    conflictsWith: "Accessory/Tattoos*",
    behaviour: EXCLUDE,
  },
  {
    pattern: "ObjectLeft/(Caveman Club|Flower|Lollipop|Witch Broomstick)*",
    conflictsWith: "Accessory/Musical Notes*",
    behaviour: EXCLUDE,
  },
].flat();

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
