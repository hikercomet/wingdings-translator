document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('mapping-table-container');

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

    container.innerHTML = createTableHTML(mapping);

  } catch (error) {
    container.innerHTML = `<p class="error">対応表の読み込みに失敗しました: ${error.message}</p>`;
    console.error('Failed to load mapping table:', error);
  }
});

function createTableHTML(mapping) {
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
          <th>文字 (ASCII)</th>
          <th>記号 (Wingdings)</th>
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
