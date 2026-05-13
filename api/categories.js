// /api/categories.js
module.exports = async function handler(req, res) {
  const allowedOrigin = process.env.APP_ORIGIN;

  if (allowedOrigin && req.headers.origin === allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // 2. Obtener variables de entorno
  const token = process.env.TIENDANUBE_TOKEN;
  const defaultStoreId = process.env.TIENDANUBE_STORE_ID;
  const { storeId } = req.query;

  if (!token) {
    console.error('[ERROR Vercel] Falta TIENDANUBE_TOKEN en variables de entorno');
    return res.status(500).json({ error: 'Error de configuración del servidor' });
  }

  const finalStoreId = defaultStoreId || storeId;
  if (!finalStoreId) {
    return res.status(400).json({ error: 'Falta storeId' });
  }

  // 3. Construir URL de Tiendanube para categorías
  const tnUrl = new URL(`https://api.tiendanube.com/v1/${finalStoreId}/categories`);
  try {
    const response = await fetch(tnUrl.toString(), {
      method: 'GET',
      headers: {
        'Authentication': `bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Makena-Proxy/1.0'
      },
    });

    // 4. Manejar errores
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Tiendanube] Error ${response.status}:`, errorText);
      return res.status(response.status).json({
        error: 'Error al conectar con Tiendanube',
        status: response.status,
        details: errorText
      });
    }

    const data = await response.json();
    // 5. Validar respuesta
    const categoriesArray = Array.isArray(data) ? data : (data.categories || []);

    res.setHeader('X-Total-Count', categoriesArray.length);
    return res.status(200).json(categoriesArray);

  } catch (error) {
    console.error('[Proxy Categories] Excepción de red:', error.message);
    return res.status(500).json({ error: 'Error interno del proxy', details: error.message });
  }
}
