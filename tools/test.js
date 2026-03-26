const json = require("../files/forge-recipes.json");

// console.log(json)

let out = {};
for (const v of Object.values(json.inputs)) {
    Object.assign(out, v);
}

console.log(out)