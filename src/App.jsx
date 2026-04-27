import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const NOTION_TOKEN = Deno.env.get('NOTION_TOKEN')
const NOTION_DB_ID = '2f8bd48ca8808088b71ae07ee69246fc'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function mapNotionPage(page) {
  return {
    notion_id: page.id,
    title: page.properties['Nome do conteúdo']?.title?.[0]?.plain_text || '',
    status: page.properties['Status']?.status?.name || '',
    plataforma: (page.properties['Plataforma']?.multi_select || []).map(s => s.name).join(', '),
    responsavel: (page.properties['Responsável']?.multi_select || []).map(s => s.name).join(', '),
    data_publicacao: page.properties['Data de publicação']?.date?.start || '',
    formato: (page.properties['Formato']?.multi_select || []).map(s => s.name).join(', '),
    foco: (page.properties['Foco em gerar:']?.multi_select || []).map(s => s.name).join(', '),
    resultado: page.properties['Resultado']?.select?.name || '',
    perfil: page.properties['Perfil']?.select?.name || '',
    updated_at: new Date().toISOString(),
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  const { action, item } = await req.json()

  // ── SYNC FROM NOTION → SUPABASE ──────────────────────────────────────────
  if (action === 'sync-from-notion') {
    const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_DB_ID}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ page_size: 100, sorts: [{ property: 'Data de publicação', direction: 'descending' }] }),
    })

    const data = await res.json()
    if (!data.results) return new Response(JSON.stringify({ error: data }), { status: 400, headers })

    const items = data.results.map(mapNotionPage)
    for (const it of items) {
      await supabase.from('calendario').upsert(it, { onConflict: 'notion_id' })
    }

    return new Response(JSON.stringify({ success: true, count: items.length }), { headers })
  }

  // ── CREATE IN BOTH NOTION + SUPABASE ─────────────────────────────────────
  if (action === 'create') {
    const plataformas = (item.plataforma || '').split(', ').filter(Boolean)
    const responsaveis = (item.responsavel || '').split(', ').filter(Boolean)

    const props = {
      'Nome do conteúdo': { title: [{ text: { content: item.title } }] },
      'Status': { status: { name: item.status || 'Pesquisa' } },
      'Plataforma': { multi_select: plataformas.map(p => ({ name: p })) },
      'Responsável': { multi_select: responsaveis.map(r => ({ name: r })) },
    }
    if (item.data_publicacao) props['Data de publicação'] = { date: { start: item.data_publicacao } }
    if (item.perfil) props['Perfil'] = { select: { name: item.perfil } }
    if (item.formato) props['Formato'] = { multi_select: item.formato.split(', ').filter(Boolean).map(f => ({ name: f })) }

    const notionRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ parent: { database_id: NOTION_DB_ID }, properties: props }),
    })

    const page = await notionRes.json()
    if (!page.id) return new Response(JSON.stringify({ error: page }), { status: 400, headers })

    await supabase.from('calendario').insert({ ...item, notion_id: page.id, updated_at: new Date().toISOString() })

    return new Response(JSON.stringify({ success: true, notion_id: page.id }), { headers })
  }

  // ── UPDATE IN BOTH ────────────────────────────────────────────────────────
  if (action === 'update') {
    const plataformas = (item.plataforma || '').split(', ').filter(Boolean)
    const responsaveis = (item.responsavel || '').split(', ').filter(Boolean)

    const props = {
      'Nome do conteúdo': { title: [{ text: { content: item.title } }] },
      'Status': { status: { name: item.status || 'Pesquisa' } },
      'Plataforma': { multi_select: plataformas.map(p => ({ name: p })) },
      'Responsável': { multi_select: responsaveis.map(r => ({ name: r })) },
    }
    if (item.data_publicacao) props['Data de publicação'] = { date: { start: item.data_publicacao } }
    if (item.perfil) props['Perfil'] = { select: { name: item.perfil } }

    if (item.notion_id) {
      await fetch(`https://api.notion.com/v1/pages/${item.notion_id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${NOTION_TOKEN}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ properties: props }),
      })
    }

    await supabase.from('calendario').update({ ...item, updated_at: new Date().toISOString() }).eq('id', item.id)

    return new Response(JSON.stringify({ success: true }), { headers })
  }

  return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers })
})
