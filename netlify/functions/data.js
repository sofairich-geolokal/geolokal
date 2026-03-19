import { getStore } from '@netlify/blobs'
export default async function handler(req, context) {
  const store = getStore('app-data')
  if (req.method === 'POST') {
    const body = JSON.parse(req.body || '{}')
    await store.setJSON('geojson_data', body)
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'content-type': 'application/json' },
    })
  }
  const data = await store.get('geojson_data', { type: 'json' })
  return new Response(JSON.stringify({ data }), {
    headers: { 'content-type': 'application/json' },
  })
}
