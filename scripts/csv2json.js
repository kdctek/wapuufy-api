#!/usr/bin/env node

/**
 * Converts wapuus.csv and models.csv into JSON files for the API.
 *
 * Usage: node scripts/csv2json.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8').trim();
  const lines = content.split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = (values[idx] || '').trim();
    });
    rows.push(row);
  }

  return rows;
}

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  values.push(current);
  return values;
}

function buildWapuus(rows) {
  return rows
    .filter(row => row.id && row['wapuu.name'] && row['wapuu.src'])
    .map(row => ({
      name: row.id,
      wapuu: {
        name: row['wapuu.name'],
        src: row['wapuu.src'],
        url: row['wapuu.url'] || '',
        repository: row['wapuu.repository'] || '',
        mime_type: row['wapuu.mime_type'] || 'image/png',
      },
      author: {
        name: row['author.name'] || '',
        url: row['author.url'] || '',
      },
      description: row.description || '',
      event: row.event || '',
      tags: row.tags ? row.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    }));
}

function buildModels(rows) {
  return rows
    .filter(row => row.id && row.name && row.model_url)
    .map(row => ({
      id: row.id,
      name: row.name,
      model_url: row.model_url,
      thumbnail_url: row.thumbnail_url || '',
      mime_type: row.mime_type || 'model/gltf-binary',
      animations: row.animations ? row.animations.split(',').map(a => a.trim()).filter(Boolean) : [],
      file_size: row.file_size ? parseInt(row.file_size, 10) : 0,
      author: {
        name: row['author.name'] || '',
        url: row['author.url'] || '',
      },
      description: row.description || '',
      license: row.license || 'CC-BY-SA-4.0',
    }));
}

// Build wapuus.json
const wapuuRows = parseCSV(path.join(ROOT, 'wapuus.csv'));
const wapuus = buildWapuus(wapuuRows);
fs.writeFileSync(
  path.join(ROOT, 'v1', 'wapuus.json'),
  JSON.stringify(wapuus, null, 2) + '\n'
);
console.log(`Built v1/wapuus.json — ${wapuus.length} entries`);

// Build models.json
const modelRows = parseCSV(path.join(ROOT, 'models.csv'));
const models = buildModels(modelRows);
fs.writeFileSync(
  path.join(ROOT, 'v1', 'models.json'),
  JSON.stringify(models, null, 2) + '\n'
);
console.log(`Built v1/models.json — ${models.length} entries`);
