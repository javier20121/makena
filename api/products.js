export default async function handler(req, res) {
  // CORS — permite llamadas desde cualquier origen (necesario para Vercel + frontend)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { storeId, ...params } = req.query;
  // Es mejor usar el token directamente aquí o vía process.env
  const token = 'eab22a1052be423fc56d633f7c34f8507d8e747a';

  if (!storeId) {
    return res.status(400).json({ error: 'Falta storeId' });
  }
  // Construimos la URL real de Tiendanube
  const tnUrl = new URL(`https://api.tiendanube.com/v1/${storeId}/products`);

  // Pasamos los parámetros de búsqueda/paginación
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== '') {
      tnUrl.searchParams.append(key, params[key]);
    }
  });

  console.log(`[Proxy] Llamando a Tiendanube: ${tnUrl.toString()}`);

  try {
    const response = await fetch(tnUrl.toString(), {
      method: 'GET',
      headers: {
        // Tiendanube requiere "bearer" en minúscula
        'Authentication': `bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Makena/1.0 (Vercel Proxy)',
      },
    });

    const data = await response.json();

    // Reenviamos el header de total para la paginación
    const totalCount = response.headers.get('X-Total-Count') || '0';
    res.setHeader('X-Total-Count', totalCount);

    console.log(`[Proxy] Tiendanube respondió ${response.status}, total: ${totalCount}`);

    return res.status(response.status).json(data);
  } catch (error) {
    console.error('[Proxy] Error al contactar Tiendanube:', error.message);
    return res.status(500).json({
      error: 'Error en el servidor proxy',
      details: error.message
    });
  }
}
