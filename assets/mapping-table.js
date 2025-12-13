document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('mapping-table-container');

  function toKatakana(text) {
    return text.replace(/[\u3040-\u309F]/g, function(match) {
      const chr = match.charCodeAt(0) + 0x60;
      return String.fromCharCode(chr);
    });
  }

  try {
    const response = await fetch('../data/wingdings-map.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const mapping = data.ascii_to_wingdings;

    if (!mapping) {
      throw new Error('Mapping data not found in JSON file.');
    }

    container.innerHTML = createTableHTML(mapping, toKatakana);

  } catch (error) {
    container.innerHTML = `<p class="error">${toKatakana('タイオウヒョウノヨミコミニシッパイシマシタ')}: ${error.message}</p>`;
    console.error('Failed to load mapping table:', error);
  }
});

function createTableHTML(mapping, toKatakana) {
  let tableRows = '';
  for (const [key, value] of Object.entries(mapping)) {
    tableRows += `
      <tr>
        <td><code>${escapeHTML(key)}</code></td>
        <td class="wingdings-char">${escapeHTML(value)}</td>
      </tr>
    `;
  }

  return `
    <table class="mapping-table">
      <thead>
        <tr>
          <th>${toKatakana('モジ (ASCII)')}</th>
          <th>${toKatakana('キゴウ (WINGDINGS)')}</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  `;
}

function escapeHTML(str) {
    const p = document.createElement('p');
    p.textContent = str;
    return p.innerHTML;
}
