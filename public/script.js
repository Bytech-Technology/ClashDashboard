const filterSelect = document.getElementById('estadoFilter');
const sortSelect = document.getElementById('sortBy');
const container = document.getElementById('players-container');
const cards = Array.from(container.children);


// Filtrar por estado
filterSelect.addEventListener('change', () => {
  const value = filterSelect.value.toLowerCase();
  cards.forEach(card => {
    if (value === 'all' || card.dataset.estado === value) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
});

// Ordenar cards
sortSelect.addEventListener('change', () => {
  const value = sortSelect.value;
  if (value === 'none') {
    // Restaurar el orden original de las cards
    cards.forEach(card => container.appendChild(card));
    return;
  }
  const sorted = cards.slice().sort((a, b) => {
    let aVal, bVal;
    switch (value) {
      case 'nombre':
        aVal = a.dataset.nombre;
        bVal = b.dataset.nombre;
        return aVal.localeCompare(bVal);
      case 'donaciones':
        aVal = parseInt(a.dataset.donaciones);
        bVal = parseInt(b.dataset.donaciones);
        return bVal - aVal;
      case 'trofeos':
        aVal = parseInt(a.dataset.trofeos);
        bVal = parseInt(b.dataset.trofeos);
        return bVal - aVal;
      case 'xp':
        aVal = parseInt(a.dataset.xp);
        bVal = parseInt(b.dataset.xp);
        return bVal - aVal;
    }
  });
  sorted.forEach(card => container.appendChild(card));
});
