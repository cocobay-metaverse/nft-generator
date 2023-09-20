const basePath = process.cwd();
const { NETWORK } = require(`${basePath}/constants/network.js`);
const fs = require("fs");
const convert = require("xml-js");
const { getConflictAction, SKIP, NO_CONFLICT } = require("./conflicts");
const { defaultNameTransform } = require("./config");
const sha1 = require(`${basePath}/node_modules/sha1`);
const buildDir = `${basePath}/build`;
const layersDir = `${basePath}/layers`;
const {
  format,
  baseUri,
  description,
  uniqueDnaTorrance,
  layerConfigurations,
  rarityDelimiter,
  shuffleLayerConfigurations,
  debugLogs,
  extraMetadata,
  metadataNameTransform,
  namePrefix,
  network,
  solanaMetadata,
} = require(`${basePath}/src/config.js`);

var metadataList = [];
var attributesList = [];
var dnaList = new Set();
const DNA_DELIMITER = "-";

const buildSetup = () => {
  if (fs.existsSync(buildDir)) {
    fs.rmdirSync(buildDir, { recursive: true });
  }
  fs.mkdirSync(buildDir);
  fs.mkdirSync(`${buildDir}/json`);
  fs.mkdirSync(`${buildDir}/images`);
};

const getRarityWeight = (_str) => {
  let nameWithoutExtension = _str.slice(0, -4);
  var nameWithoutWeight = Number(
    nameWithoutExtension.split(rarityDelimiter).pop(),
  );
  if (isNaN(nameWithoutWeight)) {
    nameWithoutWeight = 1;
  }
  return nameWithoutWeight;
};

const cleanDna = (_str) => {
  const withoutOptions = removeQueryStrings(_str);
  var dna = Number(withoutOptions.split(":").shift());
  return dna;
};

const cleanName = (_str) => {
  let nameWithoutExtension = _str.slice(0, -4);
  var nameWithoutWeight = nameWithoutExtension.split(rarityDelimiter).shift();
  return nameWithoutWeight;
};

const getElements = (path) => {
  const categoryRegex = /.*\/([^/]+)\/?$/;

  return fs
    .readdirSync(path)
    .filter((item) => !/(^|\/)\.[^\/\.]/g.test(item))
    .map((i, index) => {
      if (i.includes("-")) {
        throw new Error(`layer name can not contain dashes, please fix: ${i}`);
      }
      const category = categoryRegex.exec(path)[1];
      return {
        id: index + 1,
        category: category,
        name: cleanName(i),
        metadataName: metadataNameTransform
          ? metadataNameTransform(cleanName(i))
          : defaultNameTransform(cleanName(i)),
        filename: i,
        relativePath: `${category}/${i}`,
        path: `${path}${i}`,
        weight: getRarityWeight(i),
      };
    });
};

const layersSetup = (layersOrder) => {
  const layers = layersOrder.map((layerObj, index) => ({
    id: index + 1,
    elements: getElements(
      `${layersDir}/${layerObj.name}/`,
      layerObj.metadataNameTransform,
    ),
    name:
      layerObj.options?.["displayName"] != undefined
        ? layerObj.options?.["displayName"]
        : layerObj.name,
    blend:
      layerObj.options?.["blend"] != undefined
        ? layerObj.options?.["blend"]
        : "source-over",
    opacity:
      layerObj.options?.["opacity"] != undefined
        ? layerObj.options?.["opacity"]
        : 1,
    bypassDNA:
      layerObj.options?.["bypassDNA"] !== undefined
        ? layerObj.options?.["bypassDNA"]
        : false,
  }));

  return layers;
};

const saveImage = (_editionCount, contents) => {
  fs.writeFileSync(`${buildDir}/images/${_editionCount}.svg`, contents);
};

const addMetadata = (_dna, _edition) => {
  let dateTime = Date.now();
  let tempMetadata = {
    name: `${namePrefix} #${_edition}`,
    description: description,
    image: `${baseUri}/${_edition}.svg`,
    dna: sha1(_dna),
    edition: _edition,
    date: dateTime,
    ...extraMetadata,
    attributes: attributesList,
    compiler: "HashLips Art Engine",
  };
  if (network == NETWORK.sol) {
    tempMetadata = {
      //Added metadata for solana
      name: tempMetadata.name,
      symbol: solanaMetadata.symbol,
      description: tempMetadata.description,
      //Added metadata for solana
      seller_fee_basis_points: solanaMetadata.seller_fee_basis_points,
      image: `${_edition}.svg`,
      //Added metadata for solana
      external_url: solanaMetadata.external_url,
      edition: _edition,
      ...extraMetadata,
      attributes: tempMetadata.attributes,
      properties: {
        files: [
          {
            uri: `${_edition}.svg`,
            type: "image/svg",
          },
        ],
        category: "image",
        creators: solanaMetadata.creators,
      },
    };
  }
  metadataList.push(tempMetadata);
  attributesList = [];
};

const addAttributes = (_element) => {
  let selectedElement = _element.layer.selectedElement;
  attributesList.push({
    trait_type: _element.layer.name,
    value: selectedElement.metadataName,
  });
};

const loadLayerImg = async (_layer) => {
  try {
    return new Promise(async (resolve) => {
      fs.readFile(`${_layer.selectedElement.path}`, "utf8", (_err, data) => {
        resolve({ layer: _layer, loadedImage: data });
      });
    });
  } catch (error) {
    console.error("Error loading image:", error);
  }
};

const drawElement = async (renderObject) => {
  addAttributes(renderObject);

  return new Promise(async (resolve) => {
    const object = convert.xml2js(renderObject.loadedImage);
    resolve(
      convert.js2xml(object, {
        ignoreDeclaration: true,
      }),
    );
  });
};

const constructLayerToDna = (_dna = "", _layers = []) => {
  let mappedDnaToLayers = _layers.map((layer, index) => {
    let selectedElement = layer.elements.find(
      (e) =>
        e.id != EMPTY_CHROMOSOME_ID &&
        e.id == cleanDna(_dna.split(DNA_DELIMITER)[index]),
    );

    return {
      name: layer.name,
      blend: layer.blend,
      opacity: layer.opacity,
      selectedElement: selectedElement,
    };
  });
  return mappedDnaToLayers;
};

/**
 * In some cases a DNA string may contain optional query parameters for options
 * such as bypassing the DNA isUnique check, this function filters out those
 * items without modifying the stored DNA.
 *
 * @param {String} _dna New DNA string
 * @returns new DNA string with any items that should be filtered, removed.
 */
const filterDNAOptions = (_dna) => {
  const dnaItems = _dna.split(DNA_DELIMITER);
  const filteredDNA = dnaItems.filter((element) => {
    const query = /(\?.*$)/;
    const querystring = query.exec(element);
    if (!querystring) {
      return true;
    }
    const options = querystring[1].split("&").reduce((r, setting) => {
      const keyPairs = setting.split("=");
      return { ...r, [keyPairs[0]]: keyPairs[1] };
    }, []);

    return options.bypassDNA;
  });

  return filteredDNA.join(DNA_DELIMITER);
};

/**
 * Cleaning function for DNA strings. When DNA strings include an option, it
 * is added to the filename with a ?setting=value query string. It needs to be
 * removed to properly access the file name before Drawing.
 *
 * @param {String} _dna The entire newDNA string
 * @returns Cleaned DNA string without querystring parameters.
 */
const removeQueryStrings = (_dna) => {
  const query = /(\?.*$)/;
  return _dna.replace(query, "");
};

const isDnaUnique = (_DnaList = new Set(), _dna = "") => {
  const _filteredDNA = filterDNAOptions(_dna);
  return !_DnaList.has(_filteredDNA);
};

const EMPTY_CHROMOSOME_ID = 0;

const createDna = (_layers) => {
  let randNum = [];

  const elementsAdded = [];

  _layers.forEach((layer) => {
    var totalWeight = 0;
    layer.elements.forEach((element) => {
      totalWeight += element.weight;
    });

    let layerRandNum = -1;

    while (layerRandNum < 0) {
      //TODO predict infinite loop cases and better warn the user to use a different setup
      // number between 0 - totalWeight
      let random = Math.floor(Math.random() * totalWeight);
      for (var i = 0; i < layer.elements.length; i++) {
        // subtract the current weight from the random weight until we reach a sub zero value.
        random -= layer.elements[i].weight;

        if (random < 0) {
          let conflictAction = getConflictAction(
            layer.elements[i].relativePath,
            elementsAdded,
          );

          if (conflictAction === NO_CONFLICT) {
            elementsAdded.push(layer.elements[i]);
            layerRandNum = randNum.push(
              `${layer.elements[i].id}:${layer.elements[i].filename}${
                layer.bypassDNA ? "?bypassDNA=true" : ""
              }`,
            );
          } else if (conflictAction === SKIP) {
            debugLogs &&
              console.log(
                "detected conflict of type <skip category> on",
                layer.elements[i].relativePath,
              );
            layerRandNum = randNum.push(`${EMPTY_CHROMOSOME_ID}:x`);
          } else {
            debugLogs &&
              console.log(
                "detected conflict of type <randomize trait again> on",
                layer.elements[i].relativePath,
              );
          }

          break; //Layer filled
        }
      }
    }
  });

  return randNum.join(DNA_DELIMITER);
};

const writeMetaData = (_data) => {
  fs.writeFileSync(`${buildDir}/json/_metadata.json`, _data);
};

const saveMetaDataSingleFile = (_editionCount) => {
  let metadata = metadataList.find((meta) => meta.edition == _editionCount);
  debugLogs
    ? console.log(
        `Writing metadata for ${_editionCount}: ${JSON.stringify(metadata)}`,
      )
    : null;
  fs.writeFileSync(
    `${buildDir}/json/${_editionCount}.json`,
    JSON.stringify(metadata, null, 2),
  );
};

function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}

const startCreating = async () => {
  let layerConfigIndex = 0;
  let editionCount = 1;
  let failedCount = 0;
  let abstractedIndexes = [];
  for (
    let i = network == NETWORK.sol ? 0 : 1;
    i <= layerConfigurations[layerConfigurations.length - 1].growEditionSizeTo;
    i++
  ) {
    abstractedIndexes.push(i);
  }
  if (shuffleLayerConfigurations) {
    abstractedIndexes = shuffle(abstractedIndexes);
  }
  debugLogs
    ? console.log("Editions left to create: ", abstractedIndexes)
    : null;
  while (layerConfigIndex < layerConfigurations.length) {
    const layers = layersSetup(
      layerConfigurations[layerConfigIndex].layersOrder,
    );
    while (
      editionCount <= layerConfigurations[layerConfigIndex].growEditionSizeTo
    ) {
      let newDna = createDna(layers);
      if (isDnaUnique(dnaList, newDna)) {
        let results = constructLayerToDna(newDna, layers);
        let loadedElements = [];

        results.forEach((layer) => {
          if (layer.selectedElement) {
            loadedElements.push(loadLayerImg(layer));
          }
        });

        await Promise.all(loadedElements).then(async (renderObjectArray) => {
          debugLogs ? console.log("Clearing canvas") : null;
          let parentSvg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${format.width} ${format.height}">`;
          for (const renderObject of renderObjectArray) {
            parentSvg += "\n" + (await drawElement(renderObject));
          }
          parentSvg += "\n</svg>";
          debugLogs
            ? console.log("Editions left to create: ", abstractedIndexes)
            : null;
          saveImage(abstractedIndexes[0], parentSvg);
          addMetadata(newDna, abstractedIndexes[0]);
          saveMetaDataSingleFile(abstractedIndexes[0]);
          console.log(
            `Created edition: ${abstractedIndexes[0]}, with DNA: ${sha1(
              newDna,
            )}`,
          );
        });
        dnaList.add(filterDNAOptions(newDna));
        editionCount++;
        abstractedIndexes.shift();
      } else {
        console.log("DNA exists!");
        failedCount++;
        if (failedCount >= uniqueDnaTorrance) {
          console.log(
            `You need more layers or elements to grow your edition to ${layerConfigurations[layerConfigIndex].growEditionSizeTo} artworks!`,
          );
          process.exit();
        }
      }
    }
    layerConfigIndex++;
  }
  writeMetaData(JSON.stringify(metadataList, null, 2));
};

module.exports = { startCreating, buildSetup, getElements };
