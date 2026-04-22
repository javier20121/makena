// /api/products.js
export default async function handler(req, res) {
  // 1. Configurar CORS para permitir peticiones desde tu frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // 2. Obtener variables de entorno (Deben estar configuradas en Vercel Dashboard)
  const token = process.env.TIENDANUBE_TOKEN;
  const defaultStoreId = process.env.TIENDANUBE_STORE_ID;
  const { storeId, ...params } = req.query;

  if (!token) {
    console.error('[ERROR Vercel] Falta TIENDANUBE_TOKEN en variables de entorno');
    return res.status(500).json({ error: 'Error de configuración del servidor' });
  }

  const finalStoreId = storeId || defaultStoreId;
  if (!finalStoreId) {
    return res.status(400).json({ error: 'Falta storeId' });
  }

  // 3. Construir URL de Tiendanube
  const tnUrl = new URL(`https://api.tiendanube.com/v1/${finalStoreId}/products`);
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== '') {
      tnUrl.searchParams.append(key, params[key]);
    }
  });

  console.log(`[Proxy] Conectando a Tiendanube: ${finalStoreId}`);

  try {
    const response = await fetch(tnUrl.toString(), {
      method: 'GET',
      headers: {
        'Authentication': `bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Makena-Proxy/1.0'
      },
    });

    // 4. Manejar errores de Tiendanube (401, 404, 500)
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
    
    // 5. Validar que la respuesta sea un Array (Tiendanube suele devolver array directo)
    // Si devuelve un objeto { products: [...] }, ajustamos aquí.
    const productsArray = Array.isArray(data) ? data : (data.products || []);

    res.setHeader('X-Total-Count', response.headers.get('X-Total-Count') || productsArray.length);
    return res.status(200).json(productsArray);

  } catch (error) {
    console.error('[Proxy] Excepción de red:', error.message);
    return res.status(500).json({ error: 'Error interno del proxy', details: error.message });
  }
}
