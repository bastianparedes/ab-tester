window.ab_tester = {
  campaignsData: [
    {
      id: 1,
      name: 'Homepage Banner Test',
      variations: [
        { id: 101, name: 'Control (Imagen original)' },
        { id: 102, name: 'Variante A (Nuevo copy)' },
      ],
    },
    {
      id: 2,
      name: 'Checkout Button Color',
      variations: [
        { id: 201, name: 'Control (Botón azul)' },
        { id: 202, name: 'Variante A (Botón verde)' },
        { id: 203, name: 'Variante B (Botón rojo)' },
      ],
    },
    {
      id: 3,
      name: 'Pricing Page Layout',
      variations: [
        { id: 301, name: 'Diseño actual' },
        { id: 302, name: 'Diseño simplificado' },
      ],
    },
  ],
};

import('./entry');
