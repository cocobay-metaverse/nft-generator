const basePath = process.cwd();
const fs = require("fs");
const layersDir = `${basePath}/layers`;

const { layerConfigurations } = require(`${basePath}/src/config.js`);

const { getElements } = require("../src/main.js");
const { defaultNameTransform } = require("../src/config.js");
const { writeToCsv } = require("./jsonToCSV.js");

// read json data
let rawdata = fs.readFileSync(`${basePath}/build/json/_metadata.json`);
let data = JSON.parse(rawdata);
let editionSize = data.length;

let rarityData = [];

// intialize layers to chart
layerConfigurations.forEach((config) => {
  let layers = config.layersOrder;

  layers.forEach((layer) => {
    // get elements for each layer
    let elementsForLayer = [];
    let elements = getElements(`${layersDir}/${layer.name}/`);
    elements.forEach((element) => {
      // just get name and weight for each element
      let rarityDataElement = {
        layerFrequency: layer.frequency ?? 100,
        trait: layer.metadataNameTransform
          ? layer.metadataNameTransform(element.name)
          : defaultNameTransform(element.name),
        weight: element.weight.toFixed(0),
        occurrence: 0, // initialize at 0
      };
      elementsForLayer.push(rarityDataElement);
    });
    let layerName =
      layer.options?.["displayName"] != undefined
        ? layer.options?.["displayName"]
        : layer.name;
    // don't include duplicate layers
    if (!rarityData.includes(layer.name)) {
      // add elements for each layer to chart
      rarityData[layerName] = elementsForLayer;
    }
  });
});

// fill up rarity chart with occurrences from metadata
data.forEach((element) => {
  let attributes = element.attributes;
  attributes.forEach((attribute) => {
    let traitType = attribute.trait_type;
    let value = attribute.value;

    let rarityDataTraits = rarityData[traitType];
    rarityDataTraits.forEach((rarityDataTrait) => {
      if (rarityDataTrait.trait == value) {
        // keep track of occurrences
        rarityDataTrait.occurrence++;
      }
    });
  });
});

// convert occurrences to occurence string
for (var layer in rarityData) {
  let elementsInLayer = 0;
  for (var attribute in rarityData[layer]) {
    elementsInLayer += rarityData[layer][attribute].occurrence;
    // get chance
    let chance = (
      (rarityData[layer][attribute].occurrence / editionSize) *
      100
    ).toFixed(2);

    if (rarityData[layer][attribute].occurrence == 0) {
      console.error(
        `Error! Trait not present in collection: Layer ${layer}, trait ${rarityData[layer][attribute].trait}`,
      );
      process.exit(1);
    }

    rarityData[layer][attribute].percentage = `${chance}%`;

    // show two decimal places in percent
    rarityData[layer][
      attribute
    ].occurrenceSummary = `${rarityData[layer][attribute].occurrence} in ${editionSize} editions (${chance} %)`;
  }

  if (elementsInLayer < editionSize) {
    const occurrence = editionSize - elementsInLayer;
    const chance = ((occurrence / editionSize) * 100).toFixed(2);
    const layerFrequency = Object.values(rarityData[layer])[0]?.layerFrequency;

    rarityData[layer]["----TRAIT ABSENT----"] = {
      layerFrequency:
        typeof layerFrequency !== "undefined" ? 100 - layerFrequency : 0,
      trait: "----TRAIT ABSENT----",
      weight: 0,
      occurrence,
      percentage: `${chance}%`,
      occurrenceSummary: `${occurrence} in ${editionSize} editions (${chance} %)`,
    };
  }
}

const layerRarityDataForCSV = [];

// print out rarity data
for (var layer in rarityData) {
  console.log(`Trait type: ${layer}`);
  for (var trait in rarityData[layer]) {
    const outputObj = {
      layer: layer,
      ...rarityData[layer][trait],
      layerFrequency: `${rarityData[layer][trait].layerFrequency}%`,
    };

    console.log(outputObj);

    layerRarityDataForCSV.push(outputObj);
  }
  console.log();
}

writeToCsv(
  layerRarityDataForCSV,
  [
    "layer",
    "layerFrequency",
    "trait",
    "weight",
    "occurrence",
    "percentage",
    "occurrenceSummary",
  ],
  "build/rarity.csv",
);
