const DATA_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRRGficGpTkygC-LtXsHvNScXEQ1t1yLffocy-y8XqVOApmPcPOSUEP8zybjeG1aiH4MIsy5gyAmaWx/pub?output=csv";
const IMAGE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRRGficGpTkygC-LtXsHvNScXEQ1t1yLffocy-y8XqVOApmPcPOSUEP8zybjeG1aiH4MIsy5gyAmaWx/pub?gid=880648267&single=true&output=csv";

let imageMap = {};

Promise.all([
  fetch(DATA_URL).then(res => res.text()),
  fetch(IMAGE_URL).then(res => res.text())
])
.then(([dataText, imageText]) => {
  const dataParsed = Papa.parse(dataText, { header: true }).data;
  const imageParsed = Papa.parse(imageText, { header: true }).data;

  const filteredData = dataParsed.filter(row => row["Item Code"] && row["Variant Code"]);
  imageParsed.forEach(row => {
    if (row["Item Code"] && row["Image URL"]) {
      imageMap[row["Item Code"]] = row["Image URL"];
    }
  });

  renderCatalogue(filteredData);
})
.catch(err => {
  document.getElementById("catalogue").innerHTML = "<p>❌ Failed to load data.</p>";
});

function renderCatalogue(data) {
  const container = document.getElementById("catalogue");
  const categorySelect = document.getElementById("categorySelect");
  const categories = [...new Set(data.map(item => item["Category"]))];

  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });

  categorySelect.addEventListener("change", () => {
    const selected = categorySelect.value;
    const filtered = data.filter(row => row["Category"] === selected);
    const itemsGrouped = groupBy(filtered, "Item Code");

    container.innerHTML = "";

    Object.entries(itemsGrouped).forEach(([itemCode, entries]) => {
      const block = document.createElement("div");
      block.className = "item-block";

      const img = document.createElement("img");
      img.src = imageMap[itemCode] || "default.jpg";
      img.alt = itemCode;
      img.className = "item-image";

      const name = entries[0]["Item Name"];
      const specs = entries[0]["Specs"];

      block.innerHTML += `<h2>${name}</h2>`;
      block.appendChild(img);
      block.innerHTML += `<p><em>${specs}</em></p>`;

      const table = document.createElement("table");
      table.innerHTML = `
        <tr>
          <th>Variant Code</th>
          <th>Description</th>
          <th>Price/Unit</th>
          <th>Unit</th>
          <th>WhatsApp</th>
        </tr>
      `;

      entries.forEach(entry => {
        const msg = encodeURIComponent(
          `Hi, I’m interested in this tool:\nItem: ${name}\nVariant Code: ${entry["Variant Code"]}\nDescription: ${entry["Description"]}\nPrice: ${entry["Price/Unit"]}`
        );

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${entry["Variant Code"]}</td>
          <td>${entry["Description"]}</td>
          <td>${entry["Price/Unit"]}</td>
          <td>${entry["Unit"]}</td>
          <td><a target="_blank" href="https://wa.me/917986297302?text=${msg}"><i class="fab fa-whatsapp"></i>WhatsApp</a></td>
        `;
        table.appendChild(tr);
      });

      block.appendChild(table);
      container.appendChild(block);
    });
  });
}

function groupBy(array, key) {
  return array.reduce((result, item) => {
    const value = item[key];
    if (!result[value]) result[value] = [];
    result[value].push(item);
    return result;
  }, {});
}
