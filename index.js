const SELECTED_STYLE = "box-shadow: 0 0 0 2px #FF4800;";
const SELECTED_OUTLINE = "3px solid #FF4800";
// ------------------- レシピのロード --------------------
let recipeData = null;

const materialSelect = document.getElementById("materialSelect");
const typeSelect = document.getElementById("typeSelect");

const materialCustom = document.getElementById("materialCustom");
const typeCustom = document.getElementById("typeCustom");

loadDefinitions();

async function loadDefinitions() {
    const res = await fetch("./files/forge-recipes.json");
    recipeData = await res.json();

    initMaterialTiles();
}

function initMaterialTiles() {
    materialTiles.innerHTML = "";

    Object.entries(recipeData.materials).forEach(([material, data]) => {
        const tile = document.createElement("div");

        tile.className = "recipe-tile tile-text";

        const color = data.color || "#666";

        tile.style.background = color;

        // tile.textContent = material.substring(0,3);
        tile.textContent = material;

        tile.title = material;

        tile.onclick = () => selectMaterial(material, tile);

        materialTiles.appendChild(tile);
    });
}
let selectedMaterial = null;

function selectMaterial(material, tile) {
    selectedMaterial = material;

    [...materialTiles.children].forEach((t) => (t.style.outline = ""));

    tile.style.outline = SELECTED_OUTLINE;

    updateTypeTiles();
}

// クラフト対象タイル生成
function updateTypeTiles() {
    typeTiles.innerHTML = "";
    console.log(`[updateTypeTiles] selectedMaterial: ${selectedMaterial}`);
    const materialTypes = recipeData.materials[selectedMaterial].types || {};

    const allInputs = recipeData.inputs;
    Object.keys(allInputs).forEach((input) => {
        const types = recipeData.inputs[input]; // ← 各Input毎のtype定義

        console.log(Object.keys(recipeData.inputs));
        console.log(Object.keys(types));

        const itemTypeCategories = document.createElement("div");
        itemTypeCategories.className = "item-type-categories";
        const categoryLabel = document.createElement("div");
        categoryLabel.innerText = input;

        itemTypeCategories.append(categoryLabel);

        Object.keys(types).forEach((type) => {
            console.log(`[updateTypeTiles] types: ${types} ${type}`);

            const hasTarget = materialTypes[type] !== undefined;

            const tileWrapper = document.createElement("div");
            tileWrapper.className = "tile-img-wrapper";

            const tile = document.createElement("div");
            tile.className = "recipe-tile tile-text tile-img";

            tile.title = type;

            // 未定義なら暗く
            if (!hasTarget) {
                tile.style.filter = "brightness(0.5)";
            }

            const iconPath = "./files/type_icons/" + type + ".png";

            const img = document.createElement("img");
            img.src = iconPath;

            img.onerror = () => {
                tile.textContent = type;
            };

            img.onload = () => {
                tile.appendChild(img);
            };

            tile.appendChild(img);

            tile.onclick = () => selectType(type, tile, hasTarget);

            tileWrapper.appendChild(tile);
            itemTypeCategories.appendChild(tileWrapper);
        });
        typeTiles.appendChild(itemTypeCategories);
    });
}
/* ------------------- Select type ------------------- */

function selectType(type, tile, hasTarget) {
    typeTiles.querySelectorAll(".tile-img-wrapper").forEach((t) => (t.style = ""));

    tile.parentElement.style = SELECTED_STYLE;

    applyRecipe(selectedMaterial, type, hasTarget);
}

function applyRecipe(material, type, hasTarget) {
    // const restrictions = recipeData.types[type] || [];
    const restrictions = {};
    for (const v of Object.values(recipeData.inputs)) {
        Object.assign(restrictions, v);
    }
    const restriction = restrictions[type] || [];

    if (hasTarget) {
        const target = recipeData.materials[material].types[type];
        document.getElementById("target").value = target;
    } else {
        // 未定義 → 0
        document.getElementById("target").value = 0;
    }

    setRestrictions(restriction);
}

function setRestrictions(list) {
    restrictionDiv.innerHTML = "";

    list.forEach((v) => {
        const tile = createRestrictionTile(v);

        tile.onclick = () => restrictionDiv.removeChild(tile);

        restrictionDiv.appendChild(tile);
    });
}

/* ---------------------- calc ----------------------- */

const numbers = [
    { v: -3, cls: "cyan" },
    { v: -6, cls: "lightblue" },
    { v: -9, cls: "navy" },
    { v: -15, cls: "purple" },
    { v: 2, cls: "lime" },
    { v: 7, cls: "yellow" },
    { v: 13, cls: "orange" },
    { v: 16, cls: "red" },
];

const restrictionDiv = document.getElementById("restriction");
const paletteDiv = document.getElementById("palette");
const resultDiv = document.getElementById("result");

initPalette();

/* ---------------- UI 初期化 ---------------- */

function initPalette() {
    // 制限タイル選択ボタンの生成
    numbers.forEach((n) => {
        const t = createRestrictionTile(n.v);

        // クリックで選択できるように設定
        t.onclick = () => {
            if (restrictionDiv.children.length < 3) {
                const copy = createRestrictionTile(n.v);

                copy.onclick = () => restrictionDiv.removeChild(copy);

                restrictionDiv.appendChild(copy);
            }
        };

        paletteDiv.appendChild(t);
    });

    // 計算実行イベント設定
    document.querySelectorAll(".input-box input").forEach((input) => {
        input.oninput = () => solve();
    });
    let mo = new MutationObserver(() => solve());
    mo.observe(restrictionDiv, { childList: true });
}

function createRestrictionTile(v) {
    const n = numbers.find((x) => x.v === v);

    const t = document.createElement("div");
    t.className = "tile " + n.cls;
    t.textContent = v;

    return t;
}
function createResultTile(v) {
    const n = numbers.find((x) => x.v === v);

    const t = document.createElement("div");
    t.className = "output-tile " + n.cls;
    t.textContent = v;

    return t;
}

/* ---------------- 入力取得 ---------------- */

function getInput() {
    const initial = parseInt(document.getElementById("initial").value);
    const target = parseInt(document.getElementById("target").value);

    const restrictions = [...restrictionDiv.children].map((t) => parseInt(t.textContent));

    return { initial, target, restrictions };
}

/* ---------------- 計算ロジック ---------------- */

function calculateOptimalCombination(initial, target, restrictions) {
    const restrictionSum = restrictions.reduce((a, b) => a + b, 0);
    const remain = target - initial - restrictionSum;

    const vals = numbers.map((n) => n.v);

    const MAX = 400;
    const visited = new Set();
    const queue = [];

    queue.push({ sum: 0, path: [] });
    visited.add(0);

    while (queue.length > 0) {
        const current = queue.shift();

        if (current.sum === remain) {
            return current.path;
        }

        for (let v of vals) {
            const nextSum = current.sum + v;

            if (nextSum < -MAX || nextSum > MAX) continue;
            if (visited.has(nextSum)) continue;

            visited.add(nextSum);

            queue.push({
                sum: nextSum,
                path: [...current.path, v],
            });
        }
    }

    return null;
}

/* ---------------- 表示更新 ---------------- */

function renderResult(core, restrictions) {
    resultDiv.innerHTML = "";

    if (!core) {
        resultDiv.textContent = "解なし";
        return;
    }

    const counts = {};

    core.forEach((v) => (counts[v] = (counts[v] || 0) + 1));

    const sorted = Object.keys(counts)
        .map(Number)
        .sort((a, b) => a - b);

    // 計算結果の手順を表示
    sorted.forEach((v) => {
        for (let i = 0; i < counts[v]; i++) {
            resultDiv.appendChild(createResultTile(v));
        }
    });

    // 末尾に制限を表示
    const sortedRestrictions = restrictions.reverse();
    sortedRestrictions.forEach((v) => resultDiv.appendChild(createResultTile(v)));
}

/* ---------------- 実行 ---------------- */

function solve() {
    resultDiv.textContent = "探索中...";

    const { initial, target, restrictions } = getInput();

    const core = calculateOptimalCombination(initial, target, restrictions);

    renderResult(core, restrictions);
}
