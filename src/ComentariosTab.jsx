import { useState, useEffect, useMemo } from 'react';

// ===== Identidade da marca =====
const C = {
  navy: '#1C252D',
  gold: '#C69263',
  nude: '#EADDD3',
  brown: '#431E17',
  white: '#FFFFFF',
  danger: '#A32D2D',
  dangerBg: '#FCEBEB',
  dangerBorder: '#E24B4A',
  muted: '#6B7280',
  line: '#E7E2DA',
};

const fmtTempo = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 3600) return `há ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  return `há ${Math.floor(diff / 86400)}d`;
};

// ===== Componente principal =====
export default function ComentariosTab({ supabase, igFetch }) {
  const [comentarios, setComentarios] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [postAberto, setPostAberto] = useState(null); // media_id do post aberto, ou null
  const [acao, setAcao] = useState(null); // {tipo, comentario} para modal de resposta

  // Carrega comentários + status
  const carregar = async () => {
    setLoading(true);
    const { data: coments } = await supabase
      .from('comentarios_instagram')
      .select('*')
      .order('timestamp', { ascending: false });
    const { data: statusData } = await supabase
      .from('comentarios_status')
      .select('*');
    const sm = {};
    (statusData || []).forEach((s) => { sm[s.comment_id] = s; });
    setStatusMap(sm);
    setComentarios(coments || []);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const ehRespondido = (c) => {
    const st = statusMap[c.comment_id];
    return st && st.status === 'answered';
  };

  // ===== Agrupa por post e calcula contadores =====
  const { porPost, ofensivos, revisar, totais } = useMemo(() => {
    const grupos = {};
    const ofens = [];
    const rev = [];
    let totalPend = 0, totalGraves = 0, totalRevisar = 0;

    for (const c of comentarios) {
      const respondido = statusMap[c.comment_id] && statusMap[c.comment_id].status === 'answered';
      const nivel = c.moderacao_nivel || (c.moderacao_flagged ? 'ofensivo' : 'limpo');
      if (nivel === 'ofensivo') ofens.push(c);
      else if (nivel === 'revisar') rev.push(c);

      if (!grupos[c.media_id]) {
        grupos[c.media_id] = {
          media_id: c.media_id,
          media_caption: c.media_caption,
          media_permalink: c.media_permalink,
          media_type: c.media_type,
          timestamp: c.timestamp,
          comentarios: [],
          pendentes: 0,
          graves: 0,
          revisar: 0,
        };
      }
      grupos[c.media_id].comentarios.push(c);
      if (!respondido && nivel === 'limpo') { grupos[c.media_id].pendentes++; totalPend++; }
      if (nivel === 'ofensivo') { grupos[c.media_id].graves++; totalGraves++; }
      if (nivel === 'revisar') { grupos[c.media_id].revisar++; totalRevisar++; }
    }

    const lista = Object.values(grupos)
      .filter((g) => g.pendentes > 0 || g.graves > 0 || g.revisar > 0)
      .sort((a, b) => {
        // Prioridade: primeiro os com graves, depois com revisar, depois mais pendentes
        if (b.graves !== a.graves) return b.graves - a.graves;
        if (b.revisar !== a.revisar) return b.revisar - a.revisar;
        return b.pendentes - a.pendentes;
      });

    return {
      porPost: lista,
      ofensivos: ofens.sort((a, b) => (b.moderacao_score || 0) - (a.moderacao_score || 0)),
      revisar: rev.sort((a, b) => (b.moderacao_score || 0) - (a.moderacao_score || 0)),
      totais: { pendentes: totalPend, graves: totalGraves, revisar: totalRevisar, posts: lista.length },
    };
  }, [comentarios, statusMap]);

  // ===== Ações =====
  const marcarRespondido = async (c) => {
    const payload = {
      comment_id: c.comment_id, media_id: c.media_id,
      status: 'answered', resposta: '(marcado manualmente)',
      respondido_em: new Date().toISOString(),
    };
    await supabase.from('comentarios_status').upsert(payload, { onConflict: 'comment_id' });
    setStatusMap((sm) => ({ ...sm, [c.comment_id]: payload }));
  };

  const ocultar = async (c) => {
    await igFetch('hide_comment', { comment_id: c.comment_id, hide: true });
    // remove da lista local
    setComentarios((cs) => cs.filter((x) => x.comment_id !== c.comment_id));
  };

  const responder = async (c, mensagem) => {
    const res = await igFetch('reply_comment', { comment_id: c.comment_id, message: mensagem });
    if (res && res.success) {
      await marcarRespondido(c);
      setAcao(null);
    } else {
      alert('Não foi possível enviar a resposta. Tente novamente.');
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: C.muted, fontFamily: 'Outfit, sans-serif' }}>Carregando comentários…</div>;
  }

  // ===== Tela de detalhe de um post =====
  if (postAberto) {
    const grupo = porPost.find((g) => g.media_id === postAberto)
      || { comentarios: comentarios.filter((c) => c.media_id === postAberto) };
    return (
      <PostDetalhe
        grupo={grupo}
        ehRespondido={ehRespondido}
        onVoltar={() => setPostAberto(null)}
        onResponder={(c) => setAcao({ tipo: 'responder', comentario: c })}
        onOcultar={ocultar}
        onMarcar={marcarRespondido}
      />
    );
  }

  // ===== Tela principal =====
  return (
    <div style={{ fontFamily: 'Outfit, sans-serif', color: C.navy, maxWidth: 920, margin: '0 auto', padding: '8px 0' }}>
      {/* Cards de resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        <CardResumo label="A responder" valor={totais.pendentes} />
        <CardResumo label="Graves / ofensivos" valor={totais.graves} danger />
        <CardResumo label="Para revisar" valor={totais.revisar} amber />
        <CardResumo label="Posts pendentes" valor={totais.posts} />
      </div>

      {/* Aviso de prioridade quando há graves */}
      {totais.graves > 0 && (
        <div style={{ background: C.dangerBg, border: `1px solid ${C.dangerBorder}`, borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.danger }}>⚠ {totais.graves} comentário(s) ofensivo(s) precisam de atenção</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: C.danger }}>os vídeos com graves estão no topo da lista</span>
        </div>
      )}

      {/* Posts com pendentes */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>Vídeos com comentários</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: C.muted }}>graves primeiro, depois mais pendentes</span>
      </div>

      {porPost.length === 0 ? (
        <div style={{ padding: 30, textAlign: 'center', color: C.muted, background: C.nude, borderRadius: 12 }}>
          Nenhum comentário pendente no momento.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {porPost.map((g) => (
            <CardPost key={g.media_id} g={g} onAbrir={() => setPostAberto(g.media_id)} />
          ))}
        </div>
      )}

      {/* Modal de resposta */}
      {acao && acao.tipo === 'responder' && (
        <ModalResposta
          comentario={acao.comentario}
          onCancelar={() => setAcao(null)}
          onEnviar={(msg) => responder(acao.comentario, msg)}
        />
      )}
    </div>
  );
}

// ===== Subcomponentes =====
function CardResumo({ label, valor, danger, amber }) {
  let bg = C.nude, labelColor = C.muted, valorColor = C.navy;
  if (danger) { bg = C.dangerBg; labelColor = C.danger; valorColor = '#791F1F'; }
  if (amber) { bg = '#FAEEDA'; labelColor = '#854F0B'; valorColor = '#633806'; }
  return (
    <div style={{ background: bg, borderRadius: 8, padding: 16 }}>
      <div style={{ fontSize: 13, color: labelColor, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 600, color: valorColor }}>{valor}</div>
    </div>
  );
}


function CardPost({ g, onAbrir }) {
  const temGrave = g.graves > 0;
  return (
    <div onClick={onAbrir} style={{ background: temGrave ? C.dangerBg : C.white, border: `${temGrave ? '1.5px' : '1px'} solid ${temGrave ? C.dangerBorder : C.line}`, borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
      <div style={{ width: 48, height: 48, borderRadius: 8, background: temGrave ? '#F7C1C1' : C.nude, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ color: temGrave ? C.danger : C.gold, fontSize: 20 }}>{g.media_type === 'VIDEO' || g.media_type === 'REELS' ? '▶' : '▣'}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>{g.media_type || 'Post'} · {fmtTempo(g.timestamp)}</div>
        <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {g.media_caption || 'Sem legenda'}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        {g.graves > 0 && <span style={{ background: '#F09595', color: '#501313', fontSize: 12, padding: '2px 10px', borderRadius: 8, fontWeight: 600 }}>{g.graves} graves</span>}
        {g.revisar > 0 && <span style={{ background: '#FAC775', color: '#633806', fontSize: 12, padding: '2px 10px', borderRadius: 8 }}>{g.revisar} revisar</span>}
        {g.pendentes > 0 && <span style={{ background: C.nude, color: C.brown, fontSize: 12, padding: '2px 10px', borderRadius: 8 }}>{g.pendentes} a responder</span>}
      </div>
      <span style={{ color: '#C4B8A8', fontSize: 18 }}>›</span>
    </div>
  );
}

function PostDetalhe({ grupo, ehRespondido, onVoltar, onResponder, onOcultar, onMarcar }) {
  const [filtro, setFiltro] = useState('pendentes');
  const coments = grupo.comentarios || [];
  const filtrados = coments.filter((c) => {
    const resp = ehRespondido(c);
    const nivel = c.moderacao_nivel || (c.moderacao_flagged ? 'ofensivo' : 'limpo');
    if (filtro === 'pendentes') return !resp && nivel === 'limpo';
    if (filtro === 'respondidos') return resp;
    if (filtro === 'problematicos') return nivel === 'ofensivo' || nivel === 'revisar';
    return true;
  });
  const nivelDe = (c) => c.moderacao_nivel || (c.moderacao_flagged ? 'ofensivo' : 'limpo');
  const cont = {
    pendentes: coments.filter((c) => !ehRespondido(c) && nivelDe(c) === 'limpo').length,
    respondidos: coments.filter((c) => ehRespondido(c)).length,
    problematicos: coments.filter((c) => nivelDe(c) === 'ofensivo' || nivelDe(c) === 'revisar').length,
  };

  return (
    <div style={{ fontFamily: 'Outfit, sans-serif', color: C.navy, maxWidth: 920, margin: '0 auto', padding: '8px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <button onClick={onVoltar} style={btnStyle()}>← Voltar</button>
        <span style={{ fontSize: 12, color: '#9CA3AF' }}>Comentários › post</span>
      </div>

      <div style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 8, background: C.nude, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: C.gold, fontSize: 22 }}>{grupo.media_type === 'VIDEO' || grupo.media_type === 'REELS' ? '▶' : '▣'}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>{grupo.media_type || 'Post'} · {fmtTempo(grupo.timestamp)}</div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>{grupo.media_caption || 'Sem legenda'}</div>
          </div>
          {grupo.media_permalink && <a href={grupo.media_permalink} target="_blank" rel="noopener noreferrer" style={{ ...btnStyle(), textDecoration: 'none' }}>Abrir no Instagram</a>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <BotaoFiltro ativo={filtro === 'pendentes'} onClick={() => setFiltro('pendentes')} label={`A responder · ${cont.pendentes}`} />
        <BotaoFiltro ativo={filtro === 'respondidos'} onClick={() => setFiltro('respondidos')} label={`Respondidos · ${cont.respondidos}`} />
        <BotaoFiltro ativo={filtro === 'problematicos'} onClick={() => setFiltro('problematicos')} label={`Problemáticos · ${cont.problematicos}`} danger />
        <BotaoFiltro ativo={filtro === 'todos'} onClick={() => setFiltro('todos')} label="Todos" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtrados.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: C.muted, background: C.nude, borderRadius: 8 }}>Nenhum comentário nesta categoria.</div>
        ) : filtrados.map((c) => (
          <ComentarioItem key={c.comment_id} c={c} respondido={ehRespondido(c)} onResponder={() => onResponder(c)} onOcultar={() => onOcultar(c)} onMarcar={() => onMarcar(c)} />
        ))}
      </div>
    </div>
  );
}

function ComentarioItem({ c, respondido, onResponder, onOcultar, onMarcar }) {
  const nivel = c.moderacao_nivel || (c.moderacao_flagged ? 'ofensivo' : 'limpo');
  const ofensivo = nivel === 'ofensivo';
  const revisar = nivel === 'revisar';
  const bg = ofensivo ? C.dangerBg : revisar ? '#FAEEDA' : C.white;
  const borda = ofensivo ? C.dangerBorder : revisar ? '#EF9F27' : C.line;
  const tagBg = ofensivo ? '#F09595' : '#FAC775';
  const tagColor = ofensivo ? '#501313' : '#633806';
  const btnColor = ofensivo ? '#791F1F' : '#854F0B';
  return (
    <div style={{ background: bg, border: `1px solid ${borda}`, borderRadius: 8, padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>@{c.from_username}</span>
        {(ofensivo || revisar) && <span style={{ background: tagBg, color: tagColor, fontSize: 11, padding: '1px 8px', borderRadius: 8 }}>{c.moderacao_categoria} · {Number(c.moderacao_score).toFixed(2)}</span>}
        {respondido && <span style={{ background: '#D1FAE5', color: '#065F46', fontSize: 11, padding: '1px 8px', borderRadius: 8 }}>respondido</span>}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9CA3AF' }}>{fmtTempo(c.timestamp)}</span>
      </div>
      <div style={{ fontSize: 13, color: '#374151', marginBottom: 10 }}>{c.text}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(ofensivo || revisar) && <button onClick={onOcultar} style={btnStyle(btnColor, borda)}>Ocultar</button>}
        <button onClick={onResponder} style={btnStyle()}>Responder</button>
        {!respondido && <button onClick={onMarcar} style={btnStyle()}>Marcar respondido</button>}
        {c.media_permalink && <a href={c.media_permalink} target="_blank" rel="noopener noreferrer" style={{ ...btnStyle(), textDecoration: 'none', display: 'inline-block' }}>Abrir</a>}
      </div>
    </div>
  );
}

function BotaoFiltro({ ativo, onClick, label, danger }) {
  return (
    <button onClick={onClick} style={{
      fontSize: 12, padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
      border: `1px solid ${ativo ? (danger ? C.dangerBorder : C.gold) : C.line}`,
      background: ativo ? (danger ? C.dangerBg : C.nude) : C.white,
      color: ativo ? (danger ? '#791F1F' : C.brown) : C.muted,
    }}>{label}</button>
  );
}

function ModalResposta({ comentario, onCancelar, onEnviar }) {
  const [texto, setTexto] = useState('');
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,37,45,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: C.white, borderRadius: 12, padding: 24, width: 'min(480px, 90vw)', fontFamily: 'Outfit, sans-serif' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: C.navy, marginBottom: 4 }}>Responder a @{comentario.from_username}</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 12, padding: 10, background: C.nude, borderRadius: 8 }}>{comentario.text}</div>
        <textarea value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escreva sua resposta…" rows={4}
          style={{ width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 8, border: `1px solid ${C.line}`, fontFamily: 'inherit', fontSize: 13, resize: 'vertical' }} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
          <button onClick={onCancelar} style={btnStyle()}>Cancelar</button>
          <button onClick={() => texto.trim() && onEnviar(texto)} style={{ ...btnStyle(C.white), background: C.navy, borderColor: C.navy }}>Enviar resposta</button>
        </div>
      </div>
    </div>
  );
}

function btnStyle(color = '#64748B', borderColor = '#E2E8F0') {
  return {
    fontSize: 12, padding: '6px 12px', borderRadius: 7,
    border: `1px solid ${borderColor}`, background: 'transparent',
    color, cursor: 'pointer', fontFamily: 'inherit',
  };
}
