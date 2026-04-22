export default async function handler(req, res) {
  const { storeId, ...params } = req.query;
  const token = 'eab22a1052be423fc56d633f7c34f8507d8e747a';

  if (!storeId) {
    return res.status(400).json({ error: 'Falta storeId' });
  }

  // Construimos la URL real de Tiendanube
  const tnUrl = new URL(`https://api.tiendanube.com/v1/${storeId}/products`);
  
  // Pasamos los parámetros de búsqueda/paginación
  Object.keys(params).forEach(key => tnUrl.searchParams.append(key, params[key]));

  try {
    const response = await fetch(tnUrl.toString(), {
      method: 'GET',
      headers: {
        'Authentication': `bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Makena Proxy (Vercel)'
      },
    });

    const data = await response.json();
    // Reenviamos el header de total de productos para la paginación
    res.setHeader('X-Total-Count', response.headers.get('X-Total-Count') || '0');
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor proxy', details: error.message });
  }
}