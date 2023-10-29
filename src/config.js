const basePath = process.cwd();
const { NETWORK } = require(`${basePath}/constants/network.js`);

const network = NETWORK.eth;

// General metadata for Ethereum
const namePrefix = "COCO";
const description = "The first COCOBAY NFT collection 🥥";
const baseUri = "ipfs://???????";

const solanaMetadata = {
  symbol: "YC",
  seller_fee_basis_points: 1000, // Define how much % you want from secondary market sales 1000 = 10%
  external_url: "https://www.youtube.com/c/hashlipsnft",
  creators: [
    {
      address: "7fXNuer5sbZtaTEPhtJ5g5gNtuyRoKkvxdjEjEnPN4mC",
      share: 100,
    },
  ],
};

const isTypeA = new RegExp(/^a_/);
const isTypeB = new RegExp(/^b_/);
const isTypeBoth = new RegExp(/^both_/);

const defaultNameTransform = (name) => {
  if (isTypeA.test(name)) {
    return name.replace(isTypeA, "");
  } else if (isTypeB.test(name)) {
    return name.replace(isTypeB, "");
  } else if (isTypeBoth.test(name)) {
    return name.replace(isTypeBoth, "");
  }

  return name;
};

// If you have selected Solana then the collection starts from 0 automatically
const layerConfigurations = [
  {
    growEditionSizeTo: 1010,
    layersOrder: [
      { name: "Background" },
      { name: "Body" },
      { name: "Face" },
      { name: "Legs", frequency: 50 },
      { name: "Wear", frequency: 50 },
      {
        name: "ObjectRight",
        frequency: 50,
        options: { displayName: "Object" },
      },
      { name: "ObjectLeft", frequency: 50, options: { displayName: "Object" } },
      { name: "Accessory", frequency: 15 },
      { name: "Hat", frequency: 25 },
      { name: "Bubble", frequency: 10 },
    ],
  },
];

const shuffleLayerConfigurations = false;

const debugLogs = false;

const format = {
  width: 600,
  height: 600,
  smoothing: false,
};

const pixelFormat = {
  ratio: 2 / 128,
};

const extraMetadata = {};

const rarityDelimiter = "#";

const uniqueDnaTorrance = 10000;

module.exports = {
  format,
  baseUri,
  description,
  uniqueDnaTorrance,
  layerConfigurations,
  rarityDelimiter,
  shuffleLayerConfigurations,
  debugLogs,
  extraMetadata,
  defaultNameTransform,
  pixelFormat,
  namePrefix,
  network,
  solanaMetadata,
};
