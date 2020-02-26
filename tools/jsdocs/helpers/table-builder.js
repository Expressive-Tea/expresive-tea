'use strict';

function extraColumnInfo(params) {
  const result = {
    showAttributes: false,
    showDefaultValue: false,
  };

  params.forEach((param) => {
    result.showAttributes = result.showAttributes || param.optional;
    result.showDefaultValue = result.showDefaultValue || param.defaultvalue !== undefined;
  });

  return result;
}

function buildTableEntry(param, columnInfo) {
  const attributeCell = columnInfo.showAttributes ? `<td class="attributes">${param.optional}</td>` : '';
  const defaultCell = columnInfo.showDefaultValue ? `<td class="default">${param.defaultvalue === undefined ? '' : param.defaultvalue}</td>` : '';

  return `<tr>
            <td class="name">${param.name}</td>
            <td class="type">${param.type}</td>
            ${attributeCell}
            ${defaultCell}
            <td class="description last">${param.description}</td>
          </tr>`;
}

function buildTableHeader(columnInfo) {
  const attributeHeader = columnInfo.showAttributes ? '<th>Attributes</th>' : '';
  const defaultHeader = columnInfo.showDefaultValue ? '<th>Default</th>' : '';
  return `<thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                ${attributeHeader}
                ${defaultHeader}
                <th class="last">Description</th>
              </tr>
            </thead>`;
}

exports.build = function(title, params){
  const columnInfo = extraColumnInfo(params);
  const paramTableEntries = [];

  params.forEach((param) => {
    paramTableEntries.push(buildTableEntry(param, columnInfo));
  });

  return `<h5>${title}:</h5>
          <table class="params">
            ${buildTableHeader(columnInfo)}
            ${paramTableEntries.join('')}
          </table>`;
}
