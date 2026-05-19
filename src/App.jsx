import { useState, useMemo, useEffect, useCallback } from "react";
import { supabase } from "./supabase.js";

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const PEOPLE = ["Gabi", "Julia", "Mikaeli"];
const SECTORS = [
  { id: "imersao",     label: "Imersão",      icon: "🚀", color: "#6366F1", bg: "#EEF2FF" },
  { id: "redes",       label: "Redes Sociais", icon: "📱", color: "#EC4899", bg: "#FDF2F8" },
  { id: "conteudo",    label: "Conteúdo",      icon: "🎬", color: "#F59E0B", bg: "#FFFBEB" },
  { id: "parcerias",   label: "Parcerias",     icon: "🤝", color: "#10B981", bg: "#ECFDF5" },
  { id: "performance", label: "Performance",   icon: "📊", color: "#3B82F6", bg: "#EFF6FF" },
  { id: "interno",     label: "Interno",       icon: "🏢", color: "#64748B", bg: "#F8FAFC" },
];
const STATUSES = ["A fazer", "Em andamento", "Aguardando aprovação", "Concluído", "Pausado"];
const PRIORITIES = ["Urgente", "Alta", "Normal", "Baixa"];
const CHANNELS = ["Instagram", "YouTube", "TikTok", "WhatsApp", "Site", "Interno"];
const CHANNEL_ICONS = { Instagram: "📸", YouTube: "▶️", TikTok: "🎵", WhatsApp: "💬", Site: "🌐", Interno: "🏢" };
const PERSON_COLORS = { Gabi: "#3B82F6", Julia: "#6366F1", Mikaeli: "#0EA5E9" };
const PRIORITY_STYLE = {
  Urgente: { bg: "#FEE2E2", color: "#DC2626", dot: "#DC2626" },
  Alta:    { bg: "#FEF3C7", color: "#D97706", dot: "#D97706" },
  Normal:  { bg: "#DBEAFE", color: "#2563EB", dot: "#2563EB" },
  Baixa:   { bg: "#F1F5F9", color: "#64748B", dot: "#94A3B8" },
};
const STATUS_STYLE = {
  "A fazer":              { bg: "#F1EFE8", accent: "#888780", text: "#2C2C2A",  cardBg: "#F8F6F1", border: "#D3D1C7" },
  "Em andamento":         { bg: "#E6F1FB", accent: "#378ADD", text: "#042C53",  cardBg: "#EEF6FD", border: "#B5D4F4" },
  "Aguardando aprovação": { bg: "#FAEEDA", accent: "#BA7517", text: "#412402",  cardBg: "#FEF6EC", border: "#FAC775" },
  "Concluído":            { bg: "#EAF3DE", accent: "#639922", text: "#173404",  cardBg: "#F2F9EA", border: "#C0DD97" },
  "Pausado":              { bg: "#FCEBEB", accent: "#E24B4A", text: "#501313",  cardBg: "#FEF3F3", border: "#F7C1C1" },
};
const KEYWORDS = ["dúvida","quando","como","preço","valor","funciona","ajuda","quero","preciso","?","visto","previdência","curso","turma","aposentadoria","custo"];
const PLATFORMS = [
  { id: "instagram", label: "Instagram",    icon: "📸", color: "#E1306C", bg: "#FDF2F8" },
  { id: "youtube",   label: "YouTube",      icon: "▶️",  color: "#FF0000", bg: "#FEF2F2" },
  { id: "tiktok",    label: "TikTok",       icon: "🎵", color: "#010101", bg: "#F8FAFC" },
  { id: "trafego",   label: "Tráfego Pago", icon: "💰", color: "#059669", bg: "#ECFDF5" },
  { id: "geral",     label: "Geral",        icon: "📊", color: "#3B82F6", bg: "#EFF6FF" },
];
const METRICS = [
  { id: "alcance",      label: "Alcance",          icon: "👁",  unit: "" },
  { id: "impressoes",   label: "Impressões",        icon: "📡", unit: "" },
  { id: "engajamento",  label: "Engajamento",       icon: "❤️", unit: "%" },
  { id: "seguidores",   label: "Novos Seguidores",  icon: "👥", unit: "" },
  { id: "cliques",      label: "Cliques / Tráfego", icon: "🔗", unit: "" },
  { id: "leads",        label: "Leads gerados",     icon: "🎯", unit: "" },
  { id: "investimento", label: "Investimento",      icon: "💵", unit: "R$" },
  { id: "retorno",      label: "Retorno (ROAS)",    icon: "📈", unit: "x" },
];
const PLATFORM_METRICS = {
  instagram: ["alcance","impressoes","engajamento","seguidores","cliques","leads"],
  youtube:   ["alcance","impressoes","engajamento","seguidores","cliques"],
  tiktok:    ["alcance","impressoes","engajamento","seguidores"],
  trafego:   ["alcance","leads","investimento","retorno"],
  geral:     ["alcance","impressoes","engajamento","seguidores","cliques","leads","investimento","retorno"],
};
const ATTENTION_OPTS = ["✅ Ótimo","📈 Crescendo","⚠️ Estável","🔴 Precisa atenção","📉 Queda"];
const REPORT_STATUS_STYLE = {
  "Rascunho":     { bg: "#F1F5F9", color: "#475569", dot: "#94A3B8" },
  "Em andamento": { bg: "#DBEAFE", color: "#1D4ED8", dot: "#3B82F6" },
  "Concluído":    { bg: "#D1FAE5", color: "#065F46", dot: "#10B981" },
};

const makeEmptyReport = () => ({
  id: null, title: "", tipo: "Mensal", periodo: "", responsavel: "Gabi",
  status: "Rascunho", observacoes: "", destaques: "", melhorias: "",
  plataformas: Object.fromEntries(PLATFORMS.map(p => [p.id, {
    ativo: ["instagram","youtube","tiktok"].includes(p.id),
    atencao: "⚠️ Estável",
    metricas: Object.fromEntries(METRICS.map(m => [m.id, { atual: "", anterior: "" }])),
  }])),
});

const emptyTask = () => ({ id: null, title: "", person: "Gabi", priority: "Normal", date: "", channel: "Instagram", status: "A fazer", sector: "redes", obs: "" });

const DEMO_POSTS = [
  { id: "d1", caption: "Você sabia que dá para se aposentar pelo Brasil mesmo morando na Espanha? 🇪🇸🇧🇷 No vídeo de hoje explico o Método PREV completo...", timestamp: "2025-04-20", media_type: "VIDEO",
    comments: [{ id:"c1",username:"ana.lima",text:"Quanto custa a consultoria?",answered:false},{ id:"c2",username:"pedro.br",text:"Preciso muito disso! Como funciona?",answered:false},{ id:"c3",username:"carol_esp",text:"Como funciona para quem já está há 5 anos aqui?",answered:false},{ id:"c4",username:"roberto.m",text:"Adorei o conteúdo! 👏",answered:true},{ id:"c5",username:"julia_g",text:"Quando abre nova turma do curso?",answered:false},{ id:"c6",username:"marina.s",text:"Quero saber mais sobre o visto também",answered:false}]},
  { id: "d2", caption: "Os 3 erros mais comuns no CNIS que podem atrasar sua aposentadoria 🚨", timestamp: "2025-04-18", media_type: "CAROUSEL_ALBUM",
    comments: [{ id:"c7",username:"marcos.v",text:"Meu CNIS está cheio de erros, como corrigir?",answered:false},{ id:"c8",username:"silvia.s",text:"Quando abre nova turma do curso?",answered:false},{ id:"c9",username:"fernanda.b",text:"Excelente conteúdo! 💯",answered:true}]},
  { id: "d3", caption: "Visto D7 Portugal vs Visto Nômade Espanha — qual escolher em 2025? ⚡", timestamp: "2025-04-15", media_type: "VIDEO",
    comments: [{ id:"c10",username:"tiago.mn",text:"Qual o preço do serviço de visto?",answered:false},{ id:"c11",username:"beatriz.c",text:"Preciso desse visto urgente! Como faço?",answered:false},{ id:"c12",username:"jose.lima",text:"Ótima explicação!",answered:true}]},
];

// ── HELPERS ───────────────────────────────────────────────────────────────────
function delta(a, b) {
  const x = parseFloat(a), y = parseFloat(b);
  if (!x || !y || isNaN(x) || isNaN(y)) return null;
  const p = ((x - y) / y) * 100;
  return { pct: p.toFixed(1), up: p >= 0 };
}

function Avatar({ name, size = 28 }) {
  return <div style={{ width: size, height: size, borderRadius: "50%", background: PERSON_COLORS[name] || "#94A3B8", color: "#fff", fontSize: size * 0.38, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0, border: "2px solid #fff", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }}>{name[0]}</div>;
}
function PBadge({ p }) {
  const s = PRIORITY_STYLE[p];
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: s.bg, color: s.color, padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, display: "inline-block" }} />{p}</span>;
}
function HBar({ score }) {
  const c = score >= 70 ? "#EF4444" : score >= 40 ? "#F59E0B" : "#10B981";
  return <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ flex: 1, height: 5, background: "#E2E8F0", borderRadius: 999 }}><div style={{ width: `${score}%`, height: "100%", background: c, borderRadius: 999 }} /></div><span style={{ fontSize: 11, fontWeight: 700, color: c, minWidth: 24 }}>{score}</span></div>;
}

// ── TASK MODAL ────────────────────────────────────────────────────────────────
function TaskModal({ task, onSave, onClose }) {
  const [form, setForm] = useState({ ...task });
  const [activeTab, setActiveTab] = useState("form");
  const [newComment, setNewComment] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const I = { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #E2E8F0", fontSize: 13, color: "#1E293B", background: "#F8FAFC", outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
  const L = { fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, display: "block" };

  const comments = form.task_comments || [];

  const addComment = () => {
    if (!newComment.trim()) return;
    const entry = { id: Date.now(), text: newComment.trim(), author: "Você", ts: new Date().toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) };
    setForm(f => ({ ...f, task_comments: [...(f.task_comments || []), entry] }));
    setNewComment("");
  };

  const ss = STATUS_STYLE[form.status] || STATUS_STYLE["A fazer"];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, width: 560, maxWidth: "95vw", boxShadow: "0 24px 60px rgba(15,23,42,0.2)", maxHeight: "92vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "20px 24px 0", borderBottom: "1px solid #F1F5F9" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div style={{ flex: 1, marginRight: 12 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0F172A" }}>{form.id ? form.title || "Editar Demanda" : "✨ Nova Demanda"}</h2>
              {form.id && <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <span style={{ fontSize: 11, background: ss.bg, color: ss.text, padding: "2px 9px", borderRadius: 999, fontWeight: 600, border: `1px solid ${ss.border}` }}>{form.status}</span>
              </div>}
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: "#94A3B8", cursor: "pointer", flexShrink: 0 }}>✕</button>
          </div>
          {form.id && (
            <div style={{ display: "flex", gap: 2 }}>
              {[["form", "✏️ Editar"], ["history", `📋 Histórico (${comments.length})`]].map(([v, l]) => (
                <button key={v} onClick={() => setActiveTab(v)} style={{ padding: "6px 14px", borderRadius: "6px 6px 0 0", border: "none", background: activeTab === v ? "#fff" : "transparent", color: activeTab === v ? "#1E3A8A" : "#64748B", fontWeight: activeTab === v ? 700 : 500, fontSize: 12, cursor: "pointer", fontFamily: "inherit", borderBottom: activeTab === v ? "2px solid #3B82F6" : "2px solid transparent" }}>{l}</button>
              ))}
            </div>
          )}
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "20px 24px" }}>
          {/* FORM TAB */}
          {activeTab === "form" && (
            <div style={{ display: "grid", gap: 14 }}>
              <div><label style={L}>Título</label><input style={I} value={form.title} onChange={e => set("title", e.target.value)} placeholder="Descreva a demanda..." /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={L}>Setor</label><select style={I} value={form.sector} onChange={e => set("sector", e.target.value)}>{SECTORS.map(s => <option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}</select></div>
                <div><label style={L}>Responsável</label><select style={I} value={form.person} onChange={e => set("person", e.target.value)}>{PEOPLE.map(p => <option key={p}>{p}</option>)}</select></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={L}>Prioridade</label><select style={I} value={form.priority} onChange={e => set("priority", e.target.value)}>{PRIORITIES.map(p => <option key={p}>{p}</option>)}</select></div>
                <div><label style={L}>Canal</label><select style={I} value={form.channel} onChange={e => set("channel", e.target.value)}>{CHANNELS.map(c => <option key={c}>{CHANNEL_ICONS[c]} {c}</option>)}</select></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={L}>Status</label><select style={I} value={form.status} onChange={e => set("status", e.target.value)}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
                <div><label style={L}>Data</label><input type="date" style={I} value={form.date} onChange={e => set("date", e.target.value)} /></div>
              </div>
              <div><label style={L}>Observação</label><textarea style={{ ...I, resize: "vertical", minHeight: 68 }} value={form.obs} onChange={e => set("obs", e.target.value)} placeholder="Observações..." /></div>
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === "history" && (
            <div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 20 }}>
                {comments.length === 0 && (
                  <div style={{ textAlign: "center", padding: "30px 0", color: "#94A3B8", fontSize: 13 }}>Nenhum registro ainda. Adicione o primeiro abaixo!</div>
                )}
                {[...comments].reverse().map((c, i) => (
                  <div key={c.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", paddingBottom: i < comments.length - 1 ? 16 : 0 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#3B82F6", marginTop: 5, flexShrink: 0 }} />
                      {i < comments.length - 1 && <div style={{ width: 1, flex: 1, background: "#E2E8F0", margin: "4px 0", minHeight: 24 }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: "#1E293B", lineHeight: 1.5 }}>{c.text}</div>
                      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 3 }}>{c.author} · {c.ts}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 14 }}>
                <label style={L}>Adicionar registro</label>
                <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Ex: Aprovado pela Mikaeli · Aguardando arte final · Publicado hoje..." style={{ ...I, resize: "vertical", minHeight: 72 }} />
                <button onClick={addComment} disabled={!newComment.trim()} style={{ marginTop: 8, padding: "8px 18px", borderRadius: 8, border: "none", background: newComment.trim() ? "linear-gradient(135deg,#1E3A8A,#3B82F6)" : "#CBD5E1", color: "#fff", cursor: newComment.trim() ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>Registrar</button>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "14px 24px", borderTop: "1px solid #E2E8F0", display: "flex", gap: 10, justifyContent: "flex-end", background: "#F8FAFC" }}>
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 8, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Cancelar</button>
          <button onClick={() => form.title.trim() && onSave(form)} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#1E3A8A,#3B82F6)", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>Salvar</button>
        </div>
      </div>
    </div>
  );
}

// ── QUICK ADD FUNNEL ──────────────────────────────────────────────────────────
function AIIntake({ onTaskCreated }) {
  const [title, setTitle] = useState("");
  const [sector, setSector] = useState("redes");
  const [person, setPerson] = useState("Gabi");
  const [priority, setPriority] = useState("Normal");

  const sec = SECTORS.find(s => s.id === sector);

  const handleAdd = () => {
    if (!title.trim()) return;
    onTaskCreated({ id: null, title: title.trim(), person, priority, date: "", channel: "Instagram", status: "A fazer", sector, obs: "" });
    setTitle("");
  };

  const I = { padding: "7px 10px", borderRadius: 8, border: "1.5px solid #BFDBFE", fontSize: 13, color: "#1E293B", background: "#fff", outline: "none", fontFamily: "inherit" };

  return (
    <div style={{ background: "linear-gradient(135deg,#EFF6FF,#DBEAFE)", borderRadius: 14, padding: 18, border: "1.5px solid #BFDBFE", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#1E3A8A,#3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>⚡</div>
        <div><div style={{ fontSize: 14, fontWeight: 700, color: "#1E3A8A" }}>Adicionar Demanda Rápida</div><div style={{ fontSize: 11, color: "#3B82F6" }}>Preencha os campos e adicione direto ao kanban</div></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto auto", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAdd()}
          placeholder="Descreva a demanda... (Enter para adicionar)"
          style={{ ...I, width: "100%", boxSizing: "border-box", padding: "9px 12px" }}
        />
        <select value={sector} onChange={e => setSector(e.target.value)} style={I}>
          {SECTORS.map(s => <option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
        </select>
        <select value={person} onChange={e => setPerson(e.target.value)} style={I}>
          {PEOPLE.map(p => <option key={p}>{p}</option>)}
        </select>
        <select value={priority} onChange={e => setPriority(e.target.value)} style={I}>
          {PRIORITIES.map(p => <option key={p}>{p}</option>)}
        </select>
        <button onClick={handleAdd} disabled={!title.trim()} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: title.trim() ? "linear-gradient(135deg,#1E3A8A,#3B82F6)" : "#CBD5E1", color: "#fff", cursor: title.trim() ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 13, fontFamily: "inherit", whiteSpace: "nowrap" }}>
          + Adicionar
        </button>
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 10, alignItems: "center" }}>
        {sec && <span style={{ fontSize: 11, background: sec.bg, color: sec.color, padding: "2px 9px", borderRadius: 999, fontWeight: 600 }}>{sec.icon} {sec.label}</span>}
        <span style={{ fontSize: 11, color: "#94A3B8" }}>Para mais detalhes (canal, data, obs) use o botão <strong>"+ Nova Demanda"</strong> no topo</span>
      </div>
    </div>
  );
}

// ── KANBAN CARD ───────────────────────────────────────────────────────────────
function KCard({ task, onEdit, onDelete }) {
  const fmt = d => d ? new Date(d + "T12:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : null;
  const over = task.date && new Date(task.date) < new Date() && task.status !== "Concluído";
  const sec = SECTORS.find(s => s.id === task.sector);
  const ss = STATUS_STYLE[task.status] || STATUS_STYLE["A fazer"];
  return (
    <div style={{ background: ss.cardBg, borderRadius: 10, padding: "12px 14px", boxShadow: "0 1px 4px rgba(15,23,42,0.06)", borderLeft: `3px solid ${ss.accent}`, border: `1px solid ${ss.border}`, borderLeftWidth: 3, transition: "all 0.15s" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(15,23,42,0.10)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 1px 4px rgba(15,23,42,0.06)"; }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6, marginBottom: 8 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1E293B", lineHeight: 1.4 }}>{task.title}</p>
        <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
          <button onClick={() => onEdit(task)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#CBD5E1", padding: 2 }}>✏️</button>
          <button onClick={() => onDelete(task.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#CBD5E1", padding: 2 }}>🗑</button>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
        <PBadge p={task.priority} />
        {sec && <span style={{ fontSize: 10, background: sec.bg, color: sec.color, padding: "2px 7px", borderRadius: 999, fontWeight: 600 }}>{sec.icon} {sec.label}</span>}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}><Avatar name={task.person} size={22} /><span style={{ fontSize: 11, color: "#64748B" }}>{CHANNEL_ICONS[task.channel]} {task.channel}</span></div>
        {task.date && <span style={{ fontSize: 11, color: over ? "#DC2626" : "#94A3B8", fontWeight: over ? 700 : 400 }}>{over ? "⚠ " : "📅 "}{fmt(task.date)}</span>}
      </div>
      {task.obs && <p style={{ margin: "8px 0 0", fontSize: 11, color: ss.accent, fontStyle: "italic", borderTop: `1px solid ${ss.border}`, paddingTop: 6, opacity: 0.8 }}>{task.obs.length > 55 ? task.obs.slice(0, 55) + "…" : task.obs}</p>}
    </div>
  );
}

// ── SETORES VIEW ──────────────────────────────────────────────────────────────
function SetoresView({ tasks, onEdit, onDelete, onNewTask }) {
  const [exp, setExp] = useState(SECTORS.map(s => s.id));
  const tog = id => setExp(e => e.includes(id) ? e.filter(x => x !== id) : [...e, id]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {SECTORS.map(sec => {
        const st = tasks.filter(t => t.sector === sec.id);
        const done = st.filter(t => t.status === "Concluído").length;
        const urg = st.filter(t => t.priority === "Urgente").length;
        const pct = st.length ? Math.round((done / st.length) * 100) : 0;
        const open = exp.includes(sec.id);
        const wl = PEOPLE.map(p => ({ name: p, count: st.filter(t => t.person === p && t.status !== "Concluído").length })).filter(w => w.count > 0);
        return (
          <div key={sec.id} style={{ background: "#fff", borderRadius: 14, border: `1.5px solid ${sec.color}22`, overflow: "hidden", boxShadow: "0 1px 6px rgba(15,23,42,0.05)" }}>
            <div onClick={() => tog(sec.id)} style={{ padding: "14px 18px", cursor: "pointer", borderBottom: open ? `1px solid ${sec.color}18` : "none", background: sec.bg }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 20 }}>{sec.icon}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#1E293B", flex: 1 }}>{sec.label}</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  {urg > 0 && <span style={{ fontSize: 11, background: "#FEE2E2", color: "#DC2626", padding: "2px 9px", borderRadius: 999, fontWeight: 700 }}>⚡ {urg} urgente{urg > 1 ? "s" : ""}</span>}
                  <span style={{ fontSize: 11, background: "#F1F5F9", color: "#475569", padding: "2px 9px", borderRadius: 999, fontWeight: 600 }}>{st.length} tarefas</span>
                  <span style={{ fontSize: 11, background: "#D1FAE5", color: "#065F46", padding: "2px 9px", borderRadius: 999, fontWeight: 600 }}>{done} concluídas</span>
                  {wl.length > 0 && <div style={{ display: "flex", gap: 3 }}>{wl.map(w => <div key={w.name} style={{ position: "relative" }}><Avatar name={w.name} size={24} />{w.count > 1 && <span style={{ position: "absolute", top: -4, right: -4, background: sec.color, color: "#fff", borderRadius: 999, fontSize: 9, fontWeight: 800, width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid #fff" }}>{w.count}</span>}</div>)}</div>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 110 }}>
                  <div style={{ flex: 1, height: 6, background: "#E2E8F0", borderRadius: 999 }}><div style={{ width: `${pct}%`, height: "100%", background: sec.color, borderRadius: 999, transition: "width 0.5s ease" }} /></div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: sec.color, minWidth: 30 }}>{pct}%</span>
                </div>
                <span style={{ fontSize: 12, color: sec.color }}>{open ? "▲" : "▼"}</span>
              </div>
            </div>
            {open && (
              <div style={{ padding: "14px 18px" }}>
                {st.length === 0 ? <div style={{ textAlign: "center", padding: "16px 0", color: "#94A3B8", fontSize: 13 }}>Nenhuma demanda</div>
                  : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 10 }}>{st.map(t => <KCard key={t.id} task={t} onEdit={onEdit} onDelete={onDelete} />)}</div>}
                <button onClick={() => onNewTask(sec.id)} style={{ marginTop: 12, width: "100%", padding: "7px", borderRadius: 8, border: `1.5px dashed ${sec.color}66`, background: "transparent", color: sec.color, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>+ Adicionar em {sec.label}</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── INSTAGRAM PANEL ───────────────────────────────────────────────────────────
const DEMO_INSIGHTS = {
  profile: { username: "mikaeliscudeler.advogada", followers_count: 8420, media_count: 312, biography: "Advogada | Previdência Internacional 🇧🇷🇪🇸 | Vistos para a Espanha" },
  growth: [
    { week: "Sem 13", followers: 7980 }, { week: "Sem 14", followers: 8105 }, { week: "Sem 15", followers: 8230 }, { week: "Sem 16", followers: 8420 },
  ],
  metrics: { reach: 48200, impressions: 124000, engagement_rate: 4.2, profile_views: 3840, website_clicks: 890, saves: 1240 },
  top_posts: [
    { id: "p1", caption: "Você sabia que dá para se aposentar pelo Brasil mesmo morando na Espanha? 🇪🇸🇧🇷", media_type: "VIDEO", timestamp: "2025-04-20", like_count: 847, comments_count: 93, saves: 412, reach: 18400, engagement_rate: 7.3 },
    { id: "p2", caption: "Os 3 erros mais comuns no CNIS que podem atrasar sua aposentadoria 🚨", media_type: "CAROUSEL_ALBUM", timestamp: "2025-04-18", like_count: 623, comments_count: 48, saves: 298, reach: 12100, engagement_rate: 5.8 },
    { id: "p3", caption: "Visto D7 Portugal vs Visto Nômade Espanha — qual escolher em 2025? ⚡", media_type: "VIDEO", timestamp: "2025-04-15", like_count: 541, comments_count: 67, saves: 231, reach: 9800, engagement_rate: 5.2 },
    { id: "p4", caption: "Como calcular seu tempo de contribuição sendo brasileiro no exterior 📊", media_type: "CAROUSEL_ALBUM", timestamp: "2025-04-10", like_count: 389, comments_count: 31, saves: 187, reach: 7200, engagement_rate: 4.1 },
    { id: "p5", caption: "Método PREV: o caminho para sua aposentadoria mesmo morando fora 🎯", media_type: "IMAGE", timestamp: "2025-04-08", like_count: 298, comments_count: 24, saves: 143, reach: 5900, engagement_rate: 3.8 },
  ],
};

function InsightsPanel({ token, mode }) {
  const [data, setData] = useState(DEMO_INSIGHTS);
  const [loading, setLoading] = useState(false);
  const mIcon = t => t === "VIDEO" ? "🎥" : t === "CAROUSEL_ALBUM" ? "🖼️" : "📷";

  const fetchInsights = async () => {
    if (!token || mode !== "real") return;
    setLoading(true);
    try {
      const [profileR, mediaR, insightsR] = await Promise.all([igFetch('profile'), igFetch('media'), igFetch('insights')]);
      const profile = profileR.profile || {};
      const media = { data: mediaR.media || [] };
      const insights = { data: insightsR.insights || [] };
      const reach = insights.data?.find(m => m.name === "reach")?.values?.slice(-1)[0]?.value || 0;
      const impressions = insights.data?.find(m => m.name === "impressions")?.values?.slice(-1)[0]?.value || 0;
      const profile_views = insights.data?.find(m => m.name === "profile_views")?.values?.slice(-1)[0]?.value || 0;
      const website_clicks = insights.data?.find(m => m.name === "website_clicks")?.values?.slice(-1)[0]?.value || 0;
      setData({ profile, metrics: { reach, impressions, profile_views, website_clicks, engagement_rate: 0, saves: 0 }, top_posts: (media.data || []).map(p => ({ ...p, saves: 0, reach: 0, engagement_rate: 0 })), growth: data.growth });
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchInsights(); }, []);

  const followerGrowth = data.growth.length >= 2 ? data.growth[data.growth.length - 1].followers - data.growth[data.growth.length - 2].followers : 0;
  const maxFollowers = Math.max(...data.growth.map(g => g.followers));
  const minFollowers = Math.min(...data.growth.map(g => g.followers));

  if (loading) return <div style={{ textAlign: "center", padding: 40, color: "#94A3B8" }}>⏳ Carregando insights...</div>;

  return (
    <div>
      {/* Profile header */}
      <div style={{ background: "linear-gradient(135deg,#FDF2F8,#FCE7F3)", borderRadius: 14, padding: "16px 20px", marginBottom: 20, border: "1.5px solid #FBCFE8", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#E1306C,#833AB4)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 22, fontWeight: 700, flexShrink: 0 }}>M</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1E293B" }}>@{data.profile.username}</div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{data.profile.biography}</div>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#E1306C" }}>{data.profile.followers_count?.toLocaleString("pt-BR")}</div>
            <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase" }}>Seguidores</div>
            {followerGrowth > 0 && <div style={{ fontSize: 11, color: "#059669", fontWeight: 700 }}>▲ +{followerGrowth} esta sem.</div>}
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#6366F1" }}>{data.profile.media_count}</div>
            <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase" }}>Posts</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#F59E0B" }}>{data.metrics.engagement_rate}%</div>
            <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase" }}>Engajamento</div>
          </div>
        </div>
      </div>

      {/* Metrics grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 12, marginBottom: 20 }}>
        {[
          ["👁", "Alcance semanal", data.metrics.reach?.toLocaleString("pt-BR"), "#3B82F6", "#EFF6FF"],
          ["📡", "Impressões", data.metrics.impressions?.toLocaleString("pt-BR"), "#6366F1", "#EEF2FF"],
          ["👤", "Visitas ao perfil", data.metrics.profile_views?.toLocaleString("pt-BR"), "#EC4899", "#FDF2F8"],
          ["🔗", "Cliques no link", data.metrics.website_clicks?.toLocaleString("pt-BR"), "#059669", "#ECFDF5"],
          ["🔖", "Salvamentos", data.metrics.saves?.toLocaleString("pt-BR"), "#F59E0B", "#FFFBEB"],
        ].map(([icon, label, value, color, bg]) => (
          <div key={label} style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", border: `1.5px solid ${bg}`, boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color }}>{value || "—"}</div>
            <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Follower growth chart */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E2E8F0", padding: "16px 20px", marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", marginBottom: 14 }}>📈 Crescimento de seguidores</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 80 }}>
          {data.growth.map((g, i) => {
            const pct = maxFollowers === minFollowers ? 80 : 20 + ((g.followers - minFollowers) / (maxFollowers - minFollowers)) * 60;
            const isLast = i === data.growth.length - 1;
            return (
              <div key={g.week} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: isLast ? "#E1306C" : "#94A3B8" }}>{g.followers?.toLocaleString("pt-BR")}</div>
                <div style={{ width: "100%", height: `${pct}px`, background: isLast ? "linear-gradient(135deg,#E1306C,#F472B6)" : "#E2E8F0", borderRadius: "4px 4px 0 0", transition: "height 0.5s ease" }} />
                <div style={{ fontSize: 10, color: "#94A3B8" }}>{g.week}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top posts */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E2E8F0", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #F1F5F9", fontSize: 14, fontWeight: 700, color: "#1E293B" }}>🏆 Top posts do período</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
              {["", "Conteúdo", "❤️ Curtidas", "💬 Coment.", "🔖 Salvos", "👁 Alcance", "📊 Engaj."].map(h => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#64748B", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.top_posts.map((p, i) => (
              <tr key={p.id} style={{ borderBottom: "1px solid #F1F5F9", background: i === 0 ? "#FFF5F7" : i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                <td style={{ padding: "10px 12px", fontSize: 16 }}>{mIcon(p.media_type)}</td>
                <td style={{ padding: "10px 12px", maxWidth: 220 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#1E293B" }}>{p.caption?.length > 60 ? p.caption.slice(0, 60) + "…" : p.caption}</div>
                  <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>{p.timestamp}</div>
                </td>
                <td style={{ padding: "10px 12px", fontWeight: 700, color: "#E1306C" }}>{p.like_count?.toLocaleString("pt-BR")}</td>
                <td style={{ padding: "10px 12px", fontWeight: 600, color: "#475569" }}>{p.comments_count?.toLocaleString("pt-BR")}</td>
                <td style={{ padding: "10px 12px", fontWeight: 600, color: "#F59E0B" }}>{p.saves?.toLocaleString("pt-BR")}</td>
                <td style={{ padding: "10px 12px", fontWeight: 600, color: "#3B82F6" }}>{p.reach?.toLocaleString("pt-BR")}</td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: p.engagement_rate >= 5 ? "#059669" : p.engagement_rate >= 3 ? "#D97706" : "#DC2626", background: p.engagement_rate >= 5 ? "#D1FAE5" : p.engagement_rate >= 3 ? "#FEF3C7" : "#FEE2E2", padding: "2px 8px", borderRadius: 999 }}>{p.engagement_rate}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InstaPanel({ onCreateTask }) {
  const [posts, setPosts] = useState(DEMO_POSTS);
  const [token, setToken] = useState("");
  const [mode, setMode] = useState("real");
  const [loading, setLoad] = useState(false);
  const [exp, setExp] = useState(null);
  const [instaTab, setInstaTab] = useState("insights");

  const sorted = [...posts].sort((a, b) => b.comments.filter(c => !c.answered).length - a.comments.filter(c => !c.answered).length);
  const fetchReal = async () => {
    if (!token.trim()) return; setLoad(true);
    try {
      const r = await fetch(`https://graph.instagram.com/me/media?fields=id,caption,media_type,timestamp&access_token=${token}`);
      const d = await r.json();
      if (d.error) throw new Error(d.error.message);
      const en = await Promise.all(d.data.slice(0, 6).map(async p => {
        const cr = await fetch(`https://graph.instagram.com/${p.id}/comments?fields=id,text,timestamp,username&access_token=${token}`);
        const cd = await cr.json();
        return { id: p.id, caption: p.caption || "", timestamp: p.timestamp?.split("T")[0], media_type: p.media_type, comments: (cd.data || []).map(c => ({ ...c, answered: false })) };
      }));
      setPosts(en); setMode("real");
    } catch (e) { alert("Erro: " + e.message); }
    setLoad(false);
  };
  const tog = (pid, cid) => setPosts(ps => ps.map(p => p.id !== pid ? p : { ...p, comments: p.comments.map(c => c.id !== cid ? c : { ...c, answered: !c.answered }) }));
  const mIcon = t => t === "VIDEO" ? "🎥" : t === "CAROUSEL_ALBUM" ? "🖼️" : "📷";
  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1E293B" }}>📸 Instagram — @mikaeliscudeler.advogada</h3>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: "#64748B" }}>{mode === "demo" ? "Modo demonstração · dados fictícios" : "✅ Conta real conectada"}</p>
        </div>
        <button onClick={() => setMode(m => m === "setup" ? "demo" : "setup")} style={{ fontSize: 12, padding: "7px 14px", borderRadius: 8, border: "1.5px solid #E2E8F0", background: mode === "real" ? "#D1FAE5" : "#fff", color: mode === "real" ? "#059669" : "#E1306C", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>{mode === "real" ? "✅ Conectado" : "🔗 Conectar conta real"}</button>
      </div>

      {mode === "setup" && (
        <div style={{ background: "#FFF7ED", border: "1.5px solid #FED7AA", borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E", marginBottom: 6 }}>🔐 Conectar Instagram Business</div>
          <p style={{ margin: "0 0 10px", fontSize: 12, color: "#78350F", lineHeight: 1.6 }}>Acesse <strong>developers.facebook.com → Graph API Explorer</strong>, gere token com <code>instagram_basic</code>, <code>instagram_manage_insights</code> e <code>instagram_manage_comments</code>.</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input value={token} onChange={e => setToken(e.target.value)} placeholder="EAABw0xyz..." style={{ flex: 1, minWidth: 200, padding: "7px 10px", borderRadius: 8, border: "1.5px solid #FCD34D", fontSize: 12, fontFamily: "monospace", outline: "none" }} />
            <button onClick={fetchReal} disabled={loading} style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: "#F59E0B", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>{loading ? "⏳" : "Conectar"}</button>
            <button onClick={() => setMode("demo")} style={{ padding: "7px 12px", borderRadius: 8, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 4, background: "#F1F5F9", borderRadius: 9, padding: 3, marginBottom: 20, width: "fit-content" }}>
        {[["insights", "📊 Insights do perfil"], ["comentarios", "💬 Comentários"]].map(([v, l]) => (
          <button key={v} onClick={() => setInstaTab(v)} style={{ padding: "6px 16px", borderRadius: 7, border: "none", background: instaTab === v ? "#fff" : "transparent", color: instaTab === v ? "#E1306C" : "#64748B", fontWeight: instaTab === v ? 700 : 500, fontSize: 13, cursor: "pointer", boxShadow: instaTab === v ? "0 1px 3px rgba(0,0,0,0.08)" : "none", fontFamily: "inherit" }}>{l}</button>
        ))}
      </div>

      {/* Insights tab */}
      {instaTab === "insights" && <InsightsPanel token={token} mode={mode} />}

      {/* Comentários tab */}
      {instaTab === "comentarios" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
          {sorted.map((post, idx) => {
            const un = post.comments.filter(c => !c.answered);
            const heat = Math.min(100, un.length * 18 + post.comments.length * 3);
            const kw = post.comments.filter(c => !c.answered && KEYWORDS.some(k => c.text.toLowerCase().includes(k)));
            const bc = heat >= 70 ? "#FCA5A5" : heat >= 40 ? "#FCD34D" : "#BBF7D0";
            const isE = exp === post.id;
            return (
              <div key={post.id} style={{ background: "#fff", borderRadius: 12, border: `1.5px solid ${bc}`, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}><span style={{ fontSize: 16 }}>{mIcon(post.media_type)}</span>{idx === 0 && <span style={{ fontSize: 9, background: "#FEE2E2", color: "#DC2626", padding: "2px 7px", borderRadius: 999, fontWeight: 800, textTransform: "uppercase" }}>⚡ Máx</span>}</div>
                  <span style={{ fontSize: 11, color: "#94A3B8" }}>{post.timestamp}</span>
                </div>
                <p style={{ margin: "0 0 10px", fontSize: 12, color: "#334155", lineHeight: 1.4 }}>{post.caption.length > 85 ? post.caption.slice(0, 85) + "…" : post.caption}</p>
                <div style={{ marginBottom: 8 }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94A3B8", marginBottom: 4 }}><span>Score</span><span><strong style={{ color: "#475569" }}>{un.length}</strong> sem resposta · {post.comments.length} total</span></div><HBar score={heat} /></div>
                {kw.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>{[...new Set(kw.flatMap(c => KEYWORDS.filter(k => c.text.toLowerCase().includes(k))))].slice(0, 4).map(k => <span key={k} style={{ fontSize: 10, background: "#FEF3C7", color: "#92400E", padding: "1px 7px", borderRadius: 999, fontWeight: 600 }}>"{k}"</span>)}</div>}
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button onClick={() => setExp(isE ? null : post.id)} style={{ flex: 1, padding: "6px", borderRadius: 7, border: "1.5px solid #E2E8F0", background: "#F8FAFC", color: "#475569", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "inherit" }}>{isE ? "▲ Fechar" : `▼ ${un.length} pendente${un.length !== 1 ? "s" : ""}`}</button>
                  {un.length > 0 && <button onClick={() => onCreateTask({ title: `Responder comentários — "${post.caption.slice(0, 35)}..."`, channel: "Instagram", priority: heat >= 70 ? "Urgente" : "Alta", person: "Gabi", status: "A fazer", sector: "redes", date: "", obs: `${un.length} comentários sem resposta` })} style={{ padding: "6px 10px", borderRadius: 7, border: "none", background: "linear-gradient(135deg,#1E3A8A,#3B82F6)", color: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: "inherit" }}>+ Demanda</button>}
                </div>
                {isE && <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 10, marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>{post.comments.map(c => <div key={c.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", opacity: c.answered ? 0.38 : 1 }}><div style={{ width: 26, height: 26, borderRadius: "50%", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#1E3A8A", flexShrink: 0 }}>{c.username[0].toUpperCase()}</div><div style={{ flex: 1 }}><div style={{ fontSize: 10, fontWeight: 700, color: "#475569" }}>@{c.username}</div><div style={{ fontSize: 12, color: "#334155" }}>{c.text}</div></div><button onClick={() => tog(post.id, c.id)} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, border: "1.5px solid #E2E8F0", background: c.answered ? "#D1FAE5" : "#fff", color: c.answered ? "#059669" : "#94A3B8", cursor: "pointer", fontWeight: 700, flexShrink: 0, fontFamily: "inherit" }}>{c.answered ? "✓" : "Marcar"}</button></div>)}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── REPORT MODAL ──────────────────────────────────────────────────────────────
function ReportModal({ report, onSave, onClose }) {
  const [form, setForm] = useState(JSON.parse(JSON.stringify(report)));
  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const spf = (pid, k, v) => setForm(f => ({ ...f, plataformas: { ...f.plataformas, [pid]: { ...f.plataformas[pid], [k]: v } } }));
  const sm = (pid, mid, fld, v) => setForm(f => ({ ...f, plataformas: { ...f.plataformas, [pid]: { ...f.plataformas[pid], metricas: { ...f.plataformas[pid].metricas, [mid]: { ...f.plataformas[pid].metricas[mid], [fld]: v } } } } }));
  const I = { width: "100%", padding: "7px 10px", borderRadius: 7, border: "1.5px solid #E2E8F0", fontSize: 13, color: "#1E293B", background: "#F8FAFC", outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
  const L = { fontSize: 10, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3, display: "block" };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 18, width: 700, maxWidth: "97vw", maxHeight: "94vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 30px 80px rgba(15,23,42,0.25)" }} onClick={e => e.stopPropagation()}>
        <div style={{ background: "linear-gradient(135deg,#0F172A,#1E3A8A)", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><div style={{ fontSize: 11, color: "#93C5FD", fontWeight: 700, textTransform: "uppercase" }}>Relatório de Marketing</div><div style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginTop: 2 }}>{form.id ? "Editar" : "Novo Relatório"}</div></div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: "20px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div><label style={L}>Título</label><input style={I} value={form.title} onChange={e => sf("title", e.target.value)} placeholder="Ex: Relatório Mensal — Abril 2025" /></div>
            <div><label style={L}>Tipo</label><select style={I} value={form.tipo} onChange={e => sf("tipo", e.target.value)}><option>Semanal</option><option>Mensal</option></select></div>
            <div><label style={L}>Período</label><input type={form.tipo === "Mensal" ? "month" : "date"} style={I} value={form.periodo} onChange={e => sf("periodo", e.target.value)} /></div>
            <div><label style={L}>Status</label><select style={I} value={form.status} onChange={e => sf("status", e.target.value)}><option>Rascunho</option><option>Em andamento</option><option>Concluído</option></select></div>
          </div>
          {PLATFORMS.map(plat => {
            const pd = form.plataformas[plat.id];
            const rm = METRICS.filter(m => PLATFORM_METRICS[plat.id].includes(m.id));
            return (
              <div key={plat.id} style={{ marginBottom: 14, border: `1.5px solid ${pd.ativo ? plat.color + "33" : "#E2E8F0"}`, borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "10px 16px", background: pd.ativo ? plat.bg : "#F8FAFC", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", flex: 1 }}>
                    <input type="checkbox" checked={pd.ativo} onChange={e => spf(plat.id, "ativo", e.target.checked)} style={{ width: 16, height: 16, accentColor: plat.color, cursor: "pointer" }} />
                    <span style={{ fontSize: 16 }}>{plat.icon}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: pd.ativo ? plat.color : "#94A3B8" }}>{plat.label}</span>
                  </label>
                  {pd.ativo && <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>Status:</span><select value={pd.atencao} onChange={e => spf(plat.id, "atencao", e.target.value)} style={{ padding: "3px 8px", borderRadius: 7, border: `1.5px solid ${plat.color}44`, fontSize: 12, fontFamily: "inherit", background: "#fff", color: "#1E293B", cursor: "pointer" }}>{ATTENTION_OPTS.map(o => <option key={o}>{o}</option>)}</select></div>}
                </div>
                {pd.ativo && <div style={{ padding: "12px 16px" }}><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(165px,1fr))", gap: 10 }}>
                  {rm.map(m => {
                    const mv = pd.metricas[m.id]; const d = delta(mv.atual, mv.anterior);
                    return (
                      <div key={m.id} style={{ background: "#F8FAFC", borderRadius: 8, padding: "10px 12px", border: "1px solid #E2E8F0" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>{m.icon} {m.label}{d && <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 800, color: d.up ? "#059669" : "#DC2626", background: d.up ? "#D1FAE5" : "#FEE2E2", padding: "1px 5px", borderRadius: 999 }}>{d.up ? "▲" : "▼"} {Math.abs(d.pct)}%</span>}</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                          <div><div style={{ fontSize: 9, color: "#94A3B8", fontWeight: 600, marginBottom: 2 }}>ATUAL{m.unit ? ` (${m.unit})` : ""}</div><input value={mv.atual} onChange={e => sm(plat.id, m.id, "atual", e.target.value)} placeholder="—" style={{ width: "100%", padding: "5px 7px", borderRadius: 6, border: "1.5px solid #E2E8F0", fontSize: 13, fontWeight: 700, color: "#1E293B", background: "#fff", outline: "none", fontFamily: "inherit", boxSizing: "border-box", textAlign: "center" }} /></div>
                          <div><div style={{ fontSize: 9, color: "#94A3B8", fontWeight: 600, marginBottom: 2 }}>ANTERIOR</div><input value={mv.anterior} onChange={e => sm(plat.id, m.id, "anterior", e.target.value)} placeholder="—" style={{ width: "100%", padding: "5px 7px", borderRadius: 6, border: "1.5px solid #E2E8F0", fontSize: 13, color: "#64748B", background: "#F1F5F9", outline: "none", fontFamily: "inherit", boxSizing: "border-box", textAlign: "center" }} /></div>
                        </div>
                      </div>
                    );
                  })}
                </div></div>}
              </div>
            );
          })}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 4 }}>
            <div><label style={{ ...L, color: "#059669" }}>✅ Destaques positivos</label><textarea value={form.destaques} onChange={e => sf("destaques", e.target.value)} placeholder="O que foi bem?" style={{ ...I, resize: "vertical", minHeight: 80 }} /></div>
            <div><label style={{ ...L, color: "#DC2626" }}>🔴 Pontos de melhoria</label><textarea value={form.melhorias} onChange={e => sf("melhorias", e.target.value)} placeholder="Onde melhorar?" style={{ ...I, resize: "vertical", minHeight: 80 }} /></div>
          </div>
          <div style={{ marginTop: 12 }}><label style={L}>📝 Observações gerais</label><textarea value={form.observacoes} onChange={e => sf("observacoes", e.target.value)} placeholder="Contexto do período..." style={{ ...I, resize: "vertical", minHeight: 60 }} /></div>
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid #E2E8F0", display: "flex", gap: 10, justifyContent: "flex-end", background: "#F8FAFC" }}>
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 8, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Cancelar</button>
          <button onClick={() => form.title.trim() && onSave(form)} style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#1E3A8A,#3B82F6)", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>Salvar Relatório</button>
        </div>
      </div>
    </div>
  );
}

// ── REPORT DETAIL ─────────────────────────────────────────────────────────────
function ReportDetail({ report, onEdit, onClose }) {
  const ap = PLATFORMS.filter(p => report.plataformas[p.id]?.ativo);
  const rs = REPORT_STATUS_STYLE[report.status] || REPORT_STATUS_STYLE["Rascunho"];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 18, width: 760, maxWidth: "97vw", maxHeight: "94vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 30px 80px rgba(15,23,42,0.25)" }} onClick={e => e.stopPropagation()}>
        <div style={{ background: "linear-gradient(135deg,#0F172A,#1E3A8A)", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 11, background: rs.bg, color: rs.color, padding: "2px 9px", borderRadius: 999, fontWeight: 700 }}>{report.status}</span>
              <span style={{ fontSize: 11, color: "#93C5FD" }}>{report.tipo} · {report.periodo}</span>
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#fff" }}>{report.title}</div>
            <div style={{ fontSize: 12, color: "#93C5FD", marginTop: 2 }}>Montado por {report.responsavel}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => onEdit(report)} style={{ background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.25)", color: "#fff", padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>✏️ Editar</button>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: "20px 24px" }}>
          {ap.map(plat => {
            const pd = report.plataformas[plat.id];
            const rm = METRICS.filter(m => PLATFORM_METRICS[plat.id].includes(m.id) && (pd.metricas[m.id]?.atual || pd.metricas[m.id]?.anterior));
            if (!rm.length) return null;
            return (
              <div key={plat.id} style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 18 }}>{plat.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: plat.color }}>{plat.label}</span>
                  <span style={{ fontSize: 12, background: "#F1F5F9", color: "#475569", padding: "2px 9px", borderRadius: 999, fontWeight: 600 }}>{pd.atencao}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(155px,1fr))", gap: 10 }}>
                  {rm.map(m => {
                    const mv = pd.metricas[m.id]; const d = delta(mv.atual, mv.anterior);
                    return (
                      <div key={m.id} style={{ background: "#F8FAFC", borderRadius: 10, padding: "12px 14px", border: `1.5px solid ${d ? (d.up ? "#BBF7D0" : "#FECACA") : "#E2E8F0"}` }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", marginBottom: 4 }}>{m.icon} {m.label}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "#1E293B" }}>{mv.atual || "—"}{m.unit === "%" || m.unit === "x" ? m.unit : ""}</div>
                        {mv.anterior && <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>Anterior: {mv.anterior}</div>}
                        {d && <div style={{ fontSize: 12, fontWeight: 800, color: d.up ? "#059669" : "#DC2626", marginTop: 4 }}>{d.up ? "▲ +" : "▼ "}{d.pct}%</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {(report.destaques || report.melhorias || report.observacoes) && (
            <div style={{ display: "grid", gridTemplateColumns: report.destaques && report.melhorias ? "1fr 1fr" : "1fr", gap: 12, marginTop: 8 }}>
              {report.destaques && <div style={{ background: "#ECFDF5", borderRadius: 10, padding: "14px 16px", border: "1.5px solid #A7F3D0" }}><div style={{ fontSize: 11, fontWeight: 700, color: "#059669", marginBottom: 6, textTransform: "uppercase" }}>✅ Destaques</div><p style={{ margin: 0, fontSize: 13, color: "#065F46", lineHeight: 1.6 }}>{report.destaques}</p></div>}
              {report.melhorias && <div style={{ background: "#FEF2F2", borderRadius: 10, padding: "14px 16px", border: "1.5px solid #FECACA" }}><div style={{ fontSize: 11, fontWeight: 700, color: "#DC2626", marginBottom: 6, textTransform: "uppercase" }}>🔴 Pontos de atenção</div><p style={{ margin: 0, fontSize: 13, color: "#991B1B", lineHeight: 1.6 }}>{report.melhorias}</p></div>}
              {report.observacoes && <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "14px 16px", border: "1.5px solid #E2E8F0", gridColumn: report.destaques && report.melhorias ? "1 / -1" : "auto" }}><div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 6, textTransform: "uppercase" }}>📝 Observações</div><p style={{ margin: 0, fontSize: 13, color: "#334155", lineHeight: 1.6 }}>{report.observacoes}</p></div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── REPORTS PAGE ──────────────────────────────────────────────────────────────
function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [detail, setDetail] = useState(null);
  const [ft, setFt] = useState("");

  const loadReports = useCallback(async () => {
    const { data } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
    if (data) setReports(data.map(r => ({ ...r, plataformas: r.plataformas })));
    setLoading(false);
  }, []);

  useEffect(() => { loadReports(); }, [loadReports]);

  const save = async (form) => {
    const payload = { title: form.title, tipo: form.tipo, periodo: form.periodo, responsavel: form.responsavel, status: form.status, observacoes: form.observacoes, destaques: form.destaques, melhorias: form.melhorias, plataformas: form.plataformas };
    if (form.id) {
      await supabase.from("reports").update(payload).eq("id", form.id);
    } else {
      await supabase.from("reports").insert(payload);
    }
    setModal(null);
    loadReports();
  };

  const fil = ft ? reports.filter(r => r.tipo === ft) : reports;
  const total = reports.length, conc = reports.filter(r => r.status === "Concluído").length, em = reports.filter(r => r.status === "Em andamento").length;

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "#94A3B8", fontSize: 14 }}>⏳ Carregando relatórios...</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div><h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1E293B" }}>📊 Controle de Relatórios</h2><p style={{ margin: "3px 0 0", fontSize: 12, color: "#64748B" }}>Histórico, métricas por plataforma e pontos de atenção</p></div>
        <button onClick={() => setModal(makeEmptyReport())} style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#1E3A8A,#3B82F6)", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>+ Novo Relatório</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 12, marginBottom: 20 }}>
        {[["📋", "Total", total, "#E2E8F0", "#475569"], ["✅", "Concluídos", conc, "#D1FAE5", "#065F46"], ["⏳", "Em andamento", em, "#DBEAFE", "#1D4ED8"], ["📝", "Rascunhos", total - conc - em, "#FEF3C7", "#92400E"]].map(([i, l, c, bg, col]) => (
          <div key={l} style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", border: `1.5px solid ${bg}`, boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
            <div style={{ fontSize: 22 }}>{i}</div><div style={{ fontSize: 24, fontWeight: 800, color: col, marginTop: 4 }}>{c}</div><div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
        {["", "Semanal", "Mensal"].map(t => <button key={t} onClick={() => setFt(t)} style={{ padding: "5px 14px", borderRadius: 8, border: "1.5px solid", borderColor: ft === t ? "#3B82F6" : "#E2E8F0", background: ft === t ? "#EFF6FF" : "#fff", color: ft === t ? "#1D4ED8" : "#64748B", cursor: "pointer", fontSize: 12, fontWeight: ft === t ? 700 : 500, fontFamily: "inherit" }}>{t || "Todos"}</button>)}
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#94A3B8" }}>{fil.length} relatório{fil.length !== 1 ? "s" : ""}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {fil.map(r => {
          const rs = REPORT_STATUS_STYLE[r.status] || REPORT_STATUS_STYLE["Rascunho"];
          const ap = PLATFORMS.filter(p => r.plataformas[p.id]?.ativo);
          const alert = ap.some(p => r.plataformas[p.id]?.atencao === "🔴 Precisa atenção" || r.plataformas[p.id]?.atencao === "📉 Queda");
          return (
            <div key={r.id} style={{ background: "#fff", borderRadius: 14, border: `1.5px solid ${alert ? "#FCA5A5" : "#E2E8F0"}`, padding: "16px 20px", boxShadow: "0 1px 4px rgba(15,23,42,0.05)", cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 14px rgba(15,23,42,0.10)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(15,23,42,0.05)"; e.currentTarget.style.transform = ""; }}
              onClick={() => setDetail(r)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, background: rs.bg, color: rs.color, padding: "2px 9px", borderRadius: 999, fontWeight: 700 }}><span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: rs.dot, marginRight: 5 }} />{r.status}</span>
                    <span style={{ fontSize: 11, background: "#F1F5F9", color: "#475569", padding: "2px 9px", borderRadius: 999, fontWeight: 600 }}>{r.tipo}</span>
                    {alert && <span style={{ fontSize: 11, background: "#FEE2E2", color: "#DC2626", padding: "2px 9px", borderRadius: 999, fontWeight: 700 }}>🔴 Atenção necessária</span>}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1E293B", marginBottom: 4 }}>{r.title}</div>
                  <div style={{ fontSize: 12, color: "#64748B" }}>Período: <strong>{r.periodo}</strong> · Responsável: <strong>{r.responsavel}</strong></div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-end", minWidth: 180 }}>
                  {ap.map(p => { const pd = r.plataformas[p.id]; const ac = pd.atencao === "✅ Ótimo" ? "#059669" : pd.atencao === "📈 Crescendo" ? "#2563EB" : pd.atencao === "🔴 Precisa atenção" || pd.atencao === "📉 Queda" ? "#DC2626" : "#64748B"; return (<div key={p.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}><span>{p.icon}</span><span style={{ color: "#475569", fontWeight: 500 }}>{p.label}</span><span style={{ fontSize: 11, color: ac, fontWeight: 600 }}>{pd.atencao}</span></div>); })}
                </div>
              </div>
              {(r.destaques || r.melhorias) && <div style={{ display: "flex", gap: 10, marginTop: 12, paddingTop: 12, borderTop: "1px solid #F1F5F9", flexWrap: "wrap" }}>
                {r.destaques && <div style={{ flex: 1, minWidth: 160, fontSize: 12, color: "#065F46", background: "#ECFDF5", padding: "6px 10px", borderRadius: 7 }}>✅ {r.destaques.length > 80 ? r.destaques.slice(0, 80) + "…" : r.destaques}</div>}
                {r.melhorias && <div style={{ flex: 1, minWidth: 160, fontSize: 12, color: "#991B1B", background: "#FEF2F2", padding: "6px 10px", borderRadius: 7 }}>🔴 {r.melhorias.length > 80 ? r.melhorias.slice(0, 80) + "…" : r.melhorias}</div>}
              </div>}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}><span style={{ fontSize: 11, color: "#3B82F6", fontWeight: 600 }}>Ver detalhes →</span></div>
            </div>
          );
        })}
        {fil.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#94A3B8", fontSize: 13 }}>Nenhum relatório ainda. Crie o primeiro! 👆</div>}
      </div>
      {modal && <ReportModal report={modal} onSave={save} onClose={() => setModal(null)} />}
      {detail && <ReportDetail report={detail} onEdit={r => { setDetail(null); setModal(r); }} onClose={() => setDetail(null)} />}
    </div>
  );
}

// ── CALENDARIO PAGE ───────────────────────────────────────────────────────────
const NOTION_FN = 'https://axkqfqqaffqhbnvgyvhu.supabase.co/functions/v1/notion-sync';
const IG_FN = 'https://axkqfqqaffqhbnvgyvhu.supabase.co/functions/v1/instagram-data';
const IG_ANON_KEY = 'sb_publishable_KPSHnzry3YQXN4T3j64M6A_sLJF-Tip';

async function igFetch(action, extra = {}) {
  try {
    const res = await fetch(IG_FN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${IG_ANON_KEY}` },
      body: JSON.stringify({ action, ...extra }),
    });
    return await res.json();
  } catch (e) {
    return { error: e.message };
  }
}
const NOTION_ANON = 'sb_publishable_KPSHnzry3YQXN4T3j64M6A_sLJF-Tip';

const CANAL_OPTS = ["Instagram", "TikTok", "YouTube", "Facebook", "Close Friends", "Instagram - dark post"];
const STATUS_CAL = ["Pesquisa", "Criando redação", "Redação aprovada", "Criando arte", "Arte aprovada", "Captação", "Iniciar edição", "Editando vídeo", "Vídeo aprovado", "Gravação Dra", "Revisão Dra", "Revisão Gabi", "Aprovado", "Programado", "Dra postou", "Finalizado"];
const PERFIL_OPTS = ["ADV", "IMERSÃO"];
const FORMATO_OPTS = ["Semanal Estratégico", "Humor", "Neutro", "Provo quem EU SOU", "Provo que RESOLVO", "Provo que ENTENDO"];
const RESULTADO_OPTS = ["", "REPETIR", "Ruim", "Aceitável", "Bom", "Excelente!"];

const STATUS_CAL_COLOR = {
  "Pesquisa": "#EEF2FF", "Criando redação": "#DBEAFE", "Redação aprovada": "#BBF7D0",
  "Criando arte": "#FEF3C7", "Arte aprovada": "#BBF7D0", "Captação": "#FDE8D8",
  "Iniciar edição": "#FEE2E2", "Editando vídeo": "#DBEAFE", "Vídeo aprovado": "#BBF7D0",
  "Gravação Dra": "#FDF2F8", "Revisão Dra": "#FDF2F8", "Revisão Gabi": "#EEF2FF",
  "Aprovado": "#D1FAE5", "Programado": "#FEF3C7", "Dra postou": "#D1FAE5", "Finalizado": "#F1F5F9",
};
const STATUS_CAL_TEXT = {
  "Pesquisa": "#6366F1", "Criando redação": "#2563EB", "Redação aprovada": "#059669",
  "Criando arte": "#D97706", "Arte aprovada": "#059669", "Captação": "#EA580C",
  "Iniciar edição": "#DC2626", "Editando vídeo": "#2563EB", "Vídeo aprovado": "#059669",
  "Gravação Dra": "#EC4899", "Revisão Dra": "#EC4899", "Revisão Gabi": "#6366F1",
  "Aprovado": "#065F46", "Programado": "#92400E", "Dra postou": "#065F46", "Finalizado": "#475569",
};

const emptyItem = () => ({ id: null, notion_id: null, title: "", status: "Pesquisa", plataforma: "", responsavel: "", data_publicacao: "", formato: "", foco: "", resultado: "", perfil: "ADV" });

function CalModal({ item, onSave, onClose }) {
  const [form, setForm] = useState({ ...item });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const I = { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #E2E8F0", fontSize: 13, color: "#1E293B", background: "#F8FAFC", outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
  const L = { fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, display: "block" };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 540, maxWidth: "95vw", boxShadow: "0 24px 60px rgba(15,23,42,0.2)", maxHeight: "92vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0F172A" }}>{form.id ? "✏️ Editar Conteúdo" : "✨ Novo Conteúdo"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: "#94A3B8", cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ display: "grid", gap: 14 }}>
          <div><label style={L}>Nome do Conteúdo</label><input style={I} value={form.title} onChange={e => set("title", e.target.value)} placeholder="Ex: Reels sobre visto D7..." /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={L}>Status</label><select style={I} value={form.status} onChange={e => set("status", e.target.value)}>{STATUS_CAL.map(s => <option key={s}>{s}</option>)}</select></div>
            <div><label style={L}>Perfil</label><select style={I} value={form.perfil} onChange={e => set("perfil", e.target.value)}>{PERFIL_OPTS.map(p => <option key={p}>{p}</option>)}</select></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={L}>Plataforma</label><select style={I} value={form.plataforma} onChange={e => set("plataforma", e.target.value)}><option value="">— Selecionar —</option>{CANAL_OPTS.map(c => <option key={c}>{c}</option>)}</select></div>
            <div><label style={L}>Responsável</label><select style={I} value={form.responsavel} onChange={e => set("responsavel", e.target.value)}><option value="">— Selecionar —</option>{PEOPLE.map(p => <option key={p}>{p}</option>)}</select></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={L}>Data de Publicação</label><input type="date" style={I} value={form.data_publicacao} onChange={e => set("data_publicacao", e.target.value)} /></div>
            <div><label style={L}>Formato</label><select style={I} value={form.formato} onChange={e => set("formato", e.target.value)}><option value="">— Selecionar —</option>{FORMATO_OPTS.map(f => <option key={f}>{f}</option>)}</select></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={L}>Resultado</label><select style={I} value={form.resultado} onChange={e => set("resultado", e.target.value)}>{RESULTADO_OPTS.map(r => <option key={r}>{r}</option>)}</select></div>
            <div><label style={L}>Foco em gerar</label><input style={I} value={form.foco} onChange={e => set("foco", e.target.value)} placeholder="Ex: Leads qualificadas" /></div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 8, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Cancelar</button>
          <button onClick={() => form.title.trim() && onSave(form)} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#1E3A8A,#3B82F6)", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>
            {form.id ? "Salvar" : "Criar no Notion + Dashboard"} ✓
          </button>
        </div>
      </div>
    </div>
  );
}

function CalendarioPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [modal, setModal] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPlat, setFilterPlat] = useState("");
  const [viewMode, setViewMode] = useState("lista");
  const [syncMsg, setSyncMsg] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase.from("calendario").select("*").order("data_publicacao", { ascending: true });
    if (data) setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const syncFromNotion = async () => {
    setSyncing(true); setSyncMsg("");
    try {
      const res = await fetch(NOTION_FN, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${NOTION_ANON}` },
        body: JSON.stringify({ action: "sync-from-notion" }),
      });
      const d = await res.json();
      if (d.success) { setSyncMsg(`✅ ${d.count} itens sincronizados do Notion!`); await load(); }
      else setSyncMsg("⚠️ Erro ao sincronizar: " + JSON.stringify(d.error));
    } catch (e) { setSyncMsg("⚠️ Erro: " + e.message); }
    setSyncing(false);
    setTimeout(() => setSyncMsg(""), 4000);
  };

  const saveItem = async (form) => {
    const action = form.id ? "update" : "create";
    setSyncing(true);
    try {
      const res = await fetch(NOTION_FN, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${NOTION_ANON}` },
        body: JSON.stringify({ action, item: form }),
      });
      const d = await res.json();
      if (d.success) { setSyncMsg("✅ Salvo no Notion e no Dashboard!"); await load(); }
      else setSyncMsg("⚠️ Erro: " + JSON.stringify(d.error));
    } catch (e) { setSyncMsg("⚠️ Erro: " + e.message); }
    setSyncing(false);
    setModal(null);
    setTimeout(() => setSyncMsg(""), 3000);
  };

  const filtered = items.filter(i =>
    (!filterStatus || i.status === filterStatus) &&
    (!filterPlat || (i.plataforma || "").includes(filterPlat))
  );

  const fmtDate = d => d ? new Date(d + "T12:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "—";

  // Group by week for calendar view
  const grouped = filtered.reduce((acc, item) => {
    const key = item.data_publicacao ? item.data_publicacao.slice(0, 7) : "Sem data";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "#94A3B8" }}>⏳ Carregando calendário...</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1E293B" }}>📅 Calendário de Conteúdo</h2>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: "#64748B" }}>Sincronizado com o Notion · {items.length} conteúdos</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={syncFromNotion} disabled={syncing} style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid #E2E8F0", background: "#fff", color: syncing ? "#94A3B8" : "#6366F1", cursor: syncing ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
            {syncing ? "⏳ Sincronizando..." : "🔄 Sincronizar com Notion"}
          </button>
          <button onClick={() => setModal(emptyItem())} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#1E3A8A,#3B82F6)", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>
            + Novo Conteúdo
          </button>
        </div>
      </div>

      {syncMsg && <div style={{ background: syncMsg.startsWith("✅") ? "#D1FAE5" : "#FEE2E2", color: syncMsg.startsWith("✅") ? "#065F46" : "#991B1B", padding: "10px 16px", borderRadius: 10, marginBottom: 16, fontSize: 13, fontWeight: 600 }}>{syncMsg}</div>}

      {/* Notion banner */}
      <div style={{ background: "linear-gradient(135deg,#EEF2FF,#E0E7FF)", borderRadius: 12, padding: "12px 16px", marginBottom: 18, border: "1.5px solid #C7D2FE", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>🔗</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#4338CA" }}>Integrado ao Notion — Calendário de conteúdo ADV</div>
          <div style={{ fontSize: 11, color: "#6366F1" }}>Crie aqui → aparece no Notion · Edite no Notion → clique "Sincronizar" para atualizar</div>
        </div>
        <a href="https://www.notion.so/2f8bd48ca8808088b71ae07ee69246fc" target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#4338CA", fontWeight: 600, textDecoration: "none", padding: "5px 12px", borderRadius: 7, border: "1.5px solid #C7D2FE", background: "#fff" }}>Abrir no Notion →</a>
      </div>

      {/* Toolbar */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", padding: "10px 14px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 3, background: "#F1F5F9", borderRadius: 7, padding: 3 }}>
          {[["lista", "☰ Lista"], ["agrupado", "🗂 Por mês"]].map(([v, l]) => (
            <button key={v} onClick={() => setViewMode(v)} style={{ padding: "4px 12px", borderRadius: 5, border: "none", background: viewMode === v ? "#fff" : "transparent", color: viewMode === v ? "#1E3A8A" : "#64748B", fontWeight: viewMode === v ? 700 : 500, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>{l}</button>
          ))}
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: "5px 8px", borderRadius: 7, border: `1.5px solid ${filterStatus ? "#3B82F6" : "#E2E8F0"}`, fontSize: 12, color: filterStatus ? "#1E3A8A" : "#64748B", background: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
          <option value="">Todos — Status</option>
          {STATUS_CAL.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterPlat} onChange={e => setFilterPlat(e.target.value)} style={{ padding: "5px 8px", borderRadius: 7, border: `1.5px solid ${filterPlat ? "#3B82F6" : "#E2E8F0"}`, fontSize: 12, color: filterPlat ? "#1E3A8A" : "#64748B", background: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
          <option value="">Todas — Plataforma</option>
          {CANAL_OPTS.map(c => <option key={c}>{c}</option>)}
        </select>
        {(filterStatus || filterPlat) && <button onClick={() => { setFilterStatus(""); setFilterPlat(""); }} style={{ fontSize: 11, color: "#EF4444", background: "#FEE2E2", border: "none", padding: "4px 10px", borderRadius: 999, cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>✕ Limpar</button>}
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#94A3B8" }}>{filtered.length} conteúdo{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* LISTA VIEW */}
      {viewMode === "lista" && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1.5px solid #E2E8F0" }}>
                {["Conteúdo", "Status", "Plataforma", "Responsável", "Data", "Perfil", "Resultado", ""].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #F1F5F9", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 600, color: "#1E293B", maxWidth: 220 }}>{item.title || "—"}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ fontSize: 11, background: STATUS_CAL_COLOR[item.status] || "#F1F5F9", color: STATUS_CAL_TEXT[item.status] || "#475569", padding: "2px 9px", borderRadius: 999, fontWeight: 600, whiteSpace: "nowrap" }}>{item.status || "—"}</span>
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: 12, color: "#475569" }}>{item.plataforma || "—"}</td>
                  <td style={{ padding: "10px 12px" }}>{item.responsavel ? <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Avatar name={item.responsavel.split(", ")[0]} size={22} /><span style={{ fontSize: 12 }}>{item.responsavel}</span></div> : <span style={{ color: "#94A3B8", fontSize: 12 }}>—</span>}</td>
                  <td style={{ padding: "10px 12px", fontSize: 12, color: "#64748B", whiteSpace: "nowrap" }}>{fmtDate(item.data_publicacao)}</td>
                  <td style={{ padding: "10px 12px" }}>{item.perfil && <span style={{ fontSize: 11, background: item.perfil === "ADV" ? "#FEE2E2" : "#DBEAFE", color: item.perfil === "ADV" ? "#DC2626" : "#1D4ED8", padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>{item.perfil}</span>}</td>
                  <td style={{ padding: "10px 12px", fontSize: 12, color: "#64748B" }}>{item.resultado || "—"}</td>
                  <td style={{ padding: "10px 8px" }}>
                    <button onClick={() => setModal(item)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12 }}>✏️</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>Nenhum conteúdo encontrado. Clique em "Sincronizar com Notion" para importar! 👆</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* AGRUPADO POR MÊS */}
      {viewMode === "agrupado" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {Object.keys(grouped).sort().map(month => {
            const monthItems = grouped[month];
            const label = month === "Sem data" ? "Sem data definida" : new Date(month + "-01T12:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
            return (
              <div key={month} style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E2E8F0", overflow: "hidden" }}>
                <div style={{ background: "linear-gradient(135deg,#EFF6FF,#DBEAFE)", padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1E3A8A", textTransform: "capitalize" }}>📅 {label}</span>
                  <span style={{ fontSize: 12, color: "#3B82F6", fontWeight: 600 }}>{monthItems.length} conteúdo{monthItems.length !== 1 ? "s" : ""}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12, padding: 14 }}>
                  {monthItems.map(item => (
                    <div key={item.id} onClick={() => setModal(item)} style={{ background: "#F8FAFC", borderRadius: 10, padding: "12px 14px", border: "1.5px solid #E2E8F0", cursor: "pointer", transition: "all 0.15s" }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(15,23,42,0.10)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = ""; e.currentTarget.style.transform = ""; }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1E293B", marginBottom: 8, lineHeight: 1.3 }}>{item.title || "Sem título"}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                        {item.status && <span style={{ fontSize: 10, background: STATUS_CAL_COLOR[item.status] || "#F1F5F9", color: STATUS_CAL_TEXT[item.status] || "#475569", padding: "2px 7px", borderRadius: 999, fontWeight: 600 }}>{item.status}</span>}
                        {item.plataforma && <span style={{ fontSize: 10, background: "#F1F5F9", color: "#475569", padding: "2px 7px", borderRadius: 999, fontWeight: 500 }}>{item.plataforma}</span>}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        {item.responsavel ? <Avatar name={item.responsavel.split(", ")[0]} size={22} /> : <span />}
                        <span style={{ fontSize: 11, color: "#94A3B8" }}>📅 {fmtDate(item.data_publicacao)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {Object.keys(grouped).length === 0 && <div style={{ textAlign: "center", padding: 60, color: "#94A3B8", fontSize: 13 }}>Nenhum conteúdo ainda. Clique em "Sincronizar com Notion"! 👆</div>}
        </div>
      )}

      {modal && <CalModal item={modal} onSave={saveItem} onClose={() => setModal(null)} />}
    </div>
  );
}


// ── WHATSAPP NOTIFY ───────────────────────────────────────────────────────────
const WA_NUMBERS = { Gabi: "5515997408935", Julia: "5515991032138" };
function notifyWhatsApp(person, message) {
  const num = WA_NUMBERS[person];
  if (!num) return;
  const url = `https://api.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}

// ── AGENDA PAGE ───────────────────────────────────────────────────────────────
function AgendaPage({ tasks }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate() + 7);

  const fmtDate = d => d ? new Date(d + "T12:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" }) : "—";
  const fmtShort = d => d ? new Date(d + "T12:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "—";

  const categorize = (task) => {
    if (!task.date || task.status === "Concluído") return null;
    const d = new Date(task.date + "T12:00"); d.setHours(0,0,0,0);
    if (d < today) return "atrasado";
    if (d.getTime() === today.getTime()) return "hoje";
    if (d.getTime() === tomorrow.getTime()) return "amanha";
    if (d <= nextWeek) return "semana";
    return "futuro";
  };

  const groups = { atrasado: [], hoje: [], amanha: [], semana: [], futuro: [] };
  tasks.forEach(t => { const cat = categorize(t); if (cat) groups[cat].push(t); });

  const groupConfig = [
    { key: "atrasado", label: "⚠️ Atrasadas", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
    { key: "hoje",     label: "🔥 Hoje",       color: "#EA580C", bg: "#FFF7ED", border: "#FED7AA" },
    { key: "amanha",   label: "⏰ Amanhã",      color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
    { key: "semana",   label: "📅 Esta semana", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
    { key: "futuro",   label: "🗓 Próximas",    color: "#475569", bg: "#F8FAFC", border: "#E2E8F0" },
  ];

  // Calendar view - current month
  const [calMonth, setCalMonth] = useState(new Date());
  const [calView, setCalView] = useState("lista");

  const firstDay = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1);
  const lastDay = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0);
  const startPad = firstDay.getDay();
  const days = [];
  for (let i = 0; i < startPad; i++) days.push(null);
  for (let i = 1; i <= lastDay.getDate(); i++) days.push(i);

  const tasksByDay = {};
  tasks.forEach(t => {
    if (!t.date || t.status === "Concluído") return;
    const d = new Date(t.date + "T12:00");
    if (d.getMonth() === calMonth.getMonth() && d.getFullYear() === calMonth.getFullYear()) {
      const key = d.getDate();
      if (!tasksByDay[key]) tasksByDay[key] = [];
      tasksByDay[key].push(t);
    }
  });

  const totalPending = groups.atrasado.length + groups.hoje.length + groups.amanha.length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1E293B" }}>🗓 Agenda de Demandas</h2>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: "#64748B" }}>
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
            {totalPending > 0 && <span style={{ marginLeft: 8, background: "#FEE2E2", color: "#DC2626", padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>⚡ {totalPending} urgente{totalPending > 1 ? "s" : ""}</span>}
          </p>
        </div>
        <div style={{ display: "flex", gap: 3, background: "#F1F5F9", borderRadius: 8, padding: 3 }}>
          {[["lista", "☰ Lista"], ["calendario", "📅 Calendário"]].map(([v, l]) => (
            <button key={v} onClick={() => setCalView(v)} style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: calView === v ? "#fff" : "transparent", color: calView === v ? "#1E3A8A" : "#64748B", fontWeight: calView === v ? 700 : 500, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>{l}</button>
          ))}
        </div>
      </div>

      {calView === "lista" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {groupConfig.map(g => {
            const items = groups[g.key];
            if (items.length === 0) return null;
            return (
              <div key={g.key}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: g.color }}>{g.label}</span>
                  <span style={{ fontSize: 11, background: g.bg, color: g.color, padding: "1px 8px", borderRadius: 999, fontWeight: 600, border: `1px solid ${g.border}` }}>{items.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {items.sort((a, b) => a.date > b.date ? 1 : -1).map(task => {
                    const sec = SECTORS.find(s => s.id === task.sector);
                    return (
                      <div key={task.id} style={{ background: "#fff", borderRadius: 10, padding: "12px 16px", border: `1.5px solid ${g.border}`, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#1E293B" }}>{task.title}</div>
                          {task.obs && <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{task.obs}</div>}
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                          {sec && <span style={{ fontSize: 10, background: sec.bg, color: sec.color, padding: "2px 7px", borderRadius: 999, fontWeight: 600 }}>{sec.icon} {sec.label}</span>}
                          <span style={{ fontSize: 11, fontWeight: 600, color: g.color }}>📅 {fmtShort(task.date)}</span>
                          <Avatar name={task.person} size={24} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {Object.values(groups).every(g => g.length === 0) && (
            <div style={{ textAlign: "center", padding: 60, color: "#94A3B8", fontSize: 14 }}>🎉 Nenhuma demanda pendente com data definida!</div>
          )}
        </div>
      )}

      {calView === "calendario" && (
        <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E2E8F0", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", background: "linear-gradient(135deg,#1E3A8A,#3B82F6)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 8, padding: "4px 12px", cursor: "pointer", fontSize: 16, fontFamily: "inherit" }}>‹</button>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#fff", textTransform: "capitalize" }}>
              {calMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </span>
            <button onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 8, padding: "4px 12px", cursor: "pointer", fontSize: 16, fontFamily: "inherit" }}>›</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", background: "#F8FAFC" }}>
            {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map(d => (
              <div key={d} style={{ padding: "8px 4px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>{d}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", border: "1px solid #F1F5F9" }}>
            {days.map((day, i) => {
              const isToday = day && new Date().getDate() === day && new Date().getMonth() === calMonth.getMonth() && new Date().getFullYear() === calMonth.getFullYear();
              const dayTasks = day ? (tasksByDay[day] || []) : [];
              return (
                <div key={i} style={{ minHeight: 80, padding: "6px 4px", borderRight: "1px solid #F1F5F9", borderBottom: "1px solid #F1F5F9", background: isToday ? "#EFF6FF" : "#fff" }}>
                  {day && (
                    <>
                      <div style={{ fontSize: 12, fontWeight: isToday ? 800 : 500, color: isToday ? "#1E3A8A" : "#475569", marginBottom: 4, width: 22, height: 22, borderRadius: "50%", background: isToday ? "#3B82F6" : "transparent", color: isToday ? "#fff" : "#475569", display: "flex", alignItems: "center", justifyContent: "center" }}>{day}</div>
                      {dayTasks.slice(0, 2).map(t => {
                        const sec = SECTORS.find(s => s.id === t.sector);
                        return <div key={t.id} style={{ fontSize: 9, background: sec?.bg || "#F1F5F9", color: sec?.color || "#475569", borderRadius: 4, padding: "1px 4px", marginBottom: 2, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", fontWeight: 600 }}>{t.title}</div>;
                      })}
                      {dayTasks.length > 2 && <div style={{ fontSize: 9, color: "#94A3B8" }}>+{dayTasks.length - 2} mais</div>}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── DEMANDAS FIXAS ────────────────────────────────────────────────────────────
const FREQ_OPTS = ["Diária", "Semanal", "Mensal", "Por lançamento"];
const FREQ_COLORS = { "Diária": { bg: "#FEE2E2", color: "#DC2626" }, "Semanal": { bg: "#DBEAFE", color: "#2563EB" }, "Mensal": { bg: "#D1FAE5", color: "#059669" }, "Por lançamento": { bg: "#FEF3C7", color: "#D97706" } };

function FixaModal({ item, onSave, onClose }) {
  const [form, setForm] = useState({ ...item });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const I = { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #E2E8F0", fontSize: 13, color: "#1E293B", background: "#F8FAFC", outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
  const L = { fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, display: "block" };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 560, maxWidth: "95vw", boxShadow: "0 24px 60px rgba(15,23,42,0.2)", maxHeight: "92vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0F172A" }}>📌 {form.id ? "Editar Rotina" : "Nova Rotina"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: "#94A3B8", cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ display: "grid", gap: 14 }}>
          <div><label style={L}>Nome da Rotina</label><input style={I} value={form.title} onChange={e => set("title", e.target.value)} placeholder="Ex: Responder comentários TikTok" /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={L}>Setor</label><select style={I} value={form.sector} onChange={e => set("sector", e.target.value)}>{SECTORS.map(s => <option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}</select></div>
            <div><label style={L}>Canal</label><select style={I} value={form.channel} onChange={e => set("channel", e.target.value)}>{CHANNELS.map(c => <option key={c}>{CHANNEL_ICONS[c]} {c}</option>)}</select></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={L}>Responsável</label><select style={I} value={form.person} onChange={e => set("person", e.target.value)}><option value="">Em aberto</option>{PEOPLE.map(p => <option key={p}>{p}</option>)}<option value="Gabi/Julia">Gabi/Julia</option></select></div>
            <div><label style={L}>Frequência</label><select style={I} value={form.frequency} onChange={e => set("frequency", e.target.value)}>{FREQ_OPTS.map(f => <option key={f}>{f}</option>)}</select></div>
          </div>
          <div>
            <label style={L}>📖 Como fazer — Passo a passo</label>
            <textarea style={{ ...I, resize: "vertical", minHeight: 140, lineHeight: 1.6 }} value={form.how_to} onChange={e => set("how_to", e.target.value)} placeholder={"Documente o passo a passo aqui:\n\n1. Abrir o Instagram\n2. Verificar comentários novos\n3. Responder priorizando leads com dúvidas\n4. Chamar no privado quem demonstrou interesse..."} />
            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>💡 Este espaço garante que qualquer pessoa da equipe consiga realizar a tarefa, mesmo sem experiência prévia.</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 8, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Cancelar</button>
          <button onClick={() => form.title.trim() && onSave(form)} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#1E3A8A,#3B82F6)", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>Salvar Rotina</button>
        </div>
      </div>
    </div>
  );
}

function FixasPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [filterFreq, setFilterFreq] = useState("");
  const [filterPerson, setFilterPerson] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase.from("demandas_fixas").select("*").order("frequency").order("title");
    if (data) setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (form) => {
    const payload = { title: form.title, sector: form.sector, channel: form.channel, person: form.person, frequency: form.frequency, how_to: form.how_to, active: form.active !== false };
    if (form.id) await supabase.from("demandas_fixas").update(payload).eq("id", form.id);
    else await supabase.from("demandas_fixas").insert(payload);
    setModal(null);
    load();
  };

  const toggleActive = async (item) => {
    await supabase.from("demandas_fixas").update({ active: !item.active }).eq("id", item.id);
    load();
  };

  const filtered = items.filter(i =>
    (!filterFreq || i.frequency === filterFreq) &&
    (!filterPerson || i.person === filterPerson)
  );

  const grouped = FREQ_OPTS.reduce((acc, f) => {
    acc[f] = filtered.filter(i => i.frequency === f);
    return acc;
  }, {});

  const emptyFixa = () => ({ id: null, title: "", sector: "redes", channel: "Instagram", person: "Gabi", frequency: "Diária", how_to: "", active: true });

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "#94A3B8" }}>⏳ Carregando rotinas...</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1E293B" }}>📌 Rotinas & Demandas Fixas</h2>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: "#64748B" }}>Manual operacional da equipe · {items.filter(i => i.active).length} rotinas ativas</p>
        </div>
        <button onClick={() => setModal(emptyFixa())} style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#1E3A8A,#3B82F6)", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>+ Nova Rotina</button>
      </div>

      <div style={{ background: "linear-gradient(135deg,#FFF7ED,#FFEDD5)", borderRadius: 12, padding: "12px 16px", marginBottom: 18, border: "1.5px solid #FED7AA", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>💡</span>
        <div style={{ fontSize: 12, color: "#92400E", lineHeight: 1.5 }}>
          <strong>Manual operacional vivo</strong> — Documente o "Como fazer" de cada rotina. Assim, qualquer pessoa da equipe consegue executar qualquer tarefa, mesmo sem ter feito antes. Clique em qualquer rotina para ver ou editar o passo a passo.
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", padding: "10px 14px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 18 }}>
        <select value={filterFreq} onChange={e => setFilterFreq(e.target.value)} style={{ padding: "5px 8px", borderRadius: 7, border: `1.5px solid ${filterFreq ? "#3B82F6" : "#E2E8F0"}`, fontSize: 12, color: filterFreq ? "#1E3A8A" : "#64748B", background: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
          <option value="">Todas — Frequência</option>
          {FREQ_OPTS.map(f => <option key={f}>{f}</option>)}
        </select>
        <select value={filterPerson} onChange={e => setFilterPerson(e.target.value)} style={{ padding: "5px 8px", borderRadius: 7, border: `1.5px solid ${filterPerson ? "#3B82F6" : "#E2E8F0"}`, fontSize: 12, color: filterPerson ? "#1E3A8A" : "#64748B", background: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
          <option value="">Todos — Responsável</option>
          {PEOPLE.map(p => <option key={p}>{p}</option>)}
        </select>
        {(filterFreq || filterPerson) && <button onClick={() => { setFilterFreq(""); setFilterPerson(""); }} style={{ fontSize: 11, color: "#EF4444", background: "#FEE2E2", border: "none", padding: "4px 10px", borderRadius: 999, cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>✕ Limpar</button>}
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#94A3B8" }}>{filtered.length} rotina{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {FREQ_OPTS.map(freq => {
          const group = grouped[freq];
          if (group.length === 0) return null;
          const fc = FREQ_COLORS[freq] || { bg: "#F1F5F9", color: "#475569" };
          return (
            <div key={freq}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, background: fc.bg, color: fc.color, padding: "3px 12px", borderRadius: 999 }}>{freq === "Diária" ? "🔄" : freq === "Semanal" ? "📆" : freq === "Mensal" ? "🗓" : "🚀"} {freq}</span>
                <span style={{ fontSize: 11, color: "#94A3B8" }}>{group.length} rotina{group.length !== 1 ? "s" : ""}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {group.map(item => {
                  const sec = SECTORS.find(s => s.id === item.sector);
                  const isExp = expanded === item.id;
                  const hasHowTo = item.how_to && item.how_to.trim().length > 0;
                  return (
                    <div key={item.id} style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #E2E8F0", overflow: "hidden", opacity: item.active ? 1 : 0.5, transition: "opacity 0.2s" }}>
                      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 160 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#1E293B", display: "flex", alignItems: "center", gap: 6 }}>
                            {item.title}
                            {hasHowTo && <span style={{ fontSize: 9, background: "#D1FAE5", color: "#059669", padding: "1px 6px", borderRadius: 999, fontWeight: 700 }}>✓ Documentado</span>}
                            {!hasHowTo && <span style={{ fontSize: 9, background: "#FEE2E2", color: "#DC2626", padding: "1px 6px", borderRadius: 999, fontWeight: 700 }}>! Sem passo a passo</span>}
                          </div>
                          <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
                            {sec && <span style={{ fontSize: 10, background: sec.bg, color: sec.color, padding: "1px 7px", borderRadius: 999, fontWeight: 600 }}>{sec.icon} {sec.label}</span>}
                            <span style={{ fontSize: 10, background: "#F1F5F9", color: "#475569", padding: "1px 7px", borderRadius: 999, fontWeight: 500 }}>{CHANNEL_ICONS[item.channel]} {item.channel}</span>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          {item.person ? <div style={{ display: "flex", alignItems: "center", gap: 5 }}><Avatar name={item.person.split("/")[0]} size={24} /><span style={{ fontSize: 12, color: "#475569" }}>{item.person}</span></div> : <span style={{ fontSize: 12, color: "#94A3B8", fontStyle: "italic" }}>Em aberto</span>}
                          <button onClick={() => setExpanded(isExp ? null : item.id)} style={{ padding: "5px 12px", borderRadius: 7, border: "1.5px solid #E2E8F0", background: isExp ? "#EFF6FF" : "#F8FAFC", color: isExp ? "#1E3A8A" : "#475569", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "inherit" }}>
                            {isExp ? "▲ Fechar" : "📖 Ver passo a passo"}
                          </button>
                          <button onClick={() => setModal(item)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>✏️</button>
                          <button onClick={() => toggleActive(item)} title={item.active ? "Pausar rotina" : "Ativar rotina"} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>{item.active ? "⏸" : "▶️"}</button>
                          <button onClick={async () => { if (window.confirm("Excluir esta rotina permanentemente?")) { await supabase.from("demandas_fixas").delete().eq("id", item.id); load(); } }} style={{ background: "none", border: "1px solid #FECACA", borderRadius: 6, cursor: "pointer", fontSize: 11, color: "#DC2626", padding: "3px 8px", fontFamily: "inherit" }}>Excluir</button>
                        </div>
                      </div>
                      {isExp && (
                        <div style={{ padding: "14px 16px", background: "#F8FAFC", borderTop: "1px solid #E2E8F0" }}>
                          {hasHowTo ? (
                            <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{item.how_to}</div>
                          ) : (
                            <div style={{ textAlign: "center", padding: "20px 0" }}>
                              <div style={{ fontSize: 13, color: "#94A3B8", marginBottom: 10 }}>Ainda não tem passo a passo documentado.</div>
                              <button onClick={() => setModal(item)} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#1E3A8A,#3B82F6)", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>📝 Documentar agora</button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {modal && <FixaModal item={modal} onSave={save} onClose={() => setModal(null)} />}
    </div>
  );
}




// ── PLANNER DO DIA ────────────────────────────────────────────────────────────
const BLOCOS_CONFIG = {
  Gabi:    [{ id: "manha", label: "☀️ Manhã", inicio: "07:30", fim: "13:00" }, { id: "tarde", label: "🌤 Tarde", inicio: "14:00", fim: "17:00" }],
  Julia:   [{ id: "manha", label: "☀️ Manhã", inicio: "07:30", fim: "11:00" }, { id: "tarde", label: "🌤 Tarde", inicio: "11:00", fim: "17:00" }],
  Mikaeli: [{ id: "manha", label: "☀️ Manhã", inicio: "08:00", fim: "12:00" }, { id: "tarde", label: "🌤 Tarde", inicio: "13:00", fim: "17:00" }],
};

const TEMPO_SUGERIDO = { Urgente: 60, Alta: 30, Normal: 20, Baixa: 15 };
const TIPO_TEMPO = { post: 30, demanda: 25, manual: 20 };

function tempoLabel(min) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m > 0 ? `${h}h${m}min` : `${h}h`;
}

function gerarSugestoes(tasks, calendarioItems, pessoa) {
  const today = new Date().toISOString().split("T")[0];
  const sugestoes = [];

  // Demandas urgentes/alta atribuídas à pessoa
  tasks.filter(t => t.person === pessoa && t.status !== "Concluído" && (t.priority === "Urgente" || t.priority === "Alta" || t.date === today))
    .sort((a, b) => {
      const ordem = { Urgente: 0, Alta: 1, Normal: 2, Baixa: 3 };
      return (ordem[a.priority] || 2) - (ordem[b.priority] || 2);
    })
    .slice(0, 8)
    .forEach(t => {
      sugestoes.push({
        id: `task_${t.id}`,
        titulo: t.title,
        tipo: "demanda",
        prioridade: t.priority,
        bloco: t.priority === "Urgente" ? "manha" : "tarde",
        feito: false,
        tempo: TEMPO_SUGERIDO[t.priority] || 20,
        source_id: t.id,
        canal: t.channel,
        sector: t.sector,
      });
    });

  // Posts do calendário de hoje
  calendarioItems.filter(c => c.data_publicacao === today && (!c.responsavel || c.responsavel.includes(pessoa)))
    .forEach(c => {
      sugestoes.push({
        id: `post_${c.id}`,
        titulo: `📅 Publicar: ${c.title}`,
        tipo: "post",
        prioridade: "Alta",
        bloco: "manha",
        feito: false,
        tempo: 30,
        source_id: c.id,
        canal: c.plataforma,
      });
    });

  return sugestoes;
}

function PlannerPage({ tasks }) {
  const [pessoa, setPessoa] = useState("Gabi");
  const [planner, setPlanner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sugestoes, setSugestoes] = useState([]);
  const [confirmando, setConfirmando] = useState(false);
  const [selecionadas, setSelecionadas] = useState({});
  const [novasTarefas, setNovasTarefas] = useState({});
  const [textoNovo, setTextoNovo] = useState({ manha: "", tarde: "" });
  const [calendario, setCalendario] = useState([]);

  const today = new Date().toISOString().split("T")[0];
  const blocos = BLOCOS_CONFIG[pessoa] || BLOCOS_CONFIG.Gabi;

  const loadCalendario = useCallback(async () => {
    const { data } = await supabase.from("calendario").select("*").eq("data_publicacao", today);
    if (data) setCalendario(data);
  }, [today]);

  const loadPlanner = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("planner_dia").select("*").eq("data", today).eq("pessoa", pessoa).maybeSingle();
    if (data?.itens?.length > 0) {
      setPlanner(data);
      setConfirmando(false);
    } else {
      // Gerar sugestões
      const sugs = gerarSugestoes(tasks, calendario, pessoa);
      setSugestoes(sugs);
      const sel = {};
      sugs.forEach(s => { sel[s.id] = true; });
      setSelecionadas(sel);
      setConfirmando(true);
      setPlanner(null);
    }
    setLoading(false);
  }, [pessoa, tasks, calendario, today]);

  useEffect(() => { loadCalendario(); }, [loadCalendario]);
  useEffect(() => { loadPlanner(); }, [loadPlanner]);

  const salvarPlanner = async (itens) => {
    await supabase.from("planner_dia").delete().eq("data", today).eq("pessoa", pessoa);
    const { data: inserted } = await supabase.from("planner_dia").insert({ data: today, pessoa, itens, updated_at: new Date().toISOString() }).select().single();
    setPlanner(inserted || { data: today, pessoa, itens, id: Date.now() });
    setConfirmando(false);
  };

  const confirmarPlanner = async () => {
    const itens = sugestoes.filter(s => selecionadas[s.id]);
    Object.entries(novasTarefas).forEach(([bloco, lista]) => {
      if (Array.isArray(lista)) lista.forEach(t => itens.push(t));
    });
    const ordem = { Urgente: 0, Alta: 1, Normal: 2, Baixa: 3 };
    itens.sort((a, b) => {
      if (a.bloco !== b.bloco) return a.bloco === "manha" ? -1 : 1;
      return (ordem[a.prioridade] || 2) - (ordem[b.prioridade] || 2);
    });
    // Update state immediately so user sees planner right away
    const fakePlanner = { data: today, pessoa, itens, id: Date.now() };
    setPlanner(fakePlanner);
    setConfirmando(false);
    // Save to Supabase in background
    try {
      await supabase.from("planner_dia").delete().eq("data", today).eq("pessoa", pessoa);
      await supabase.from("planner_dia").insert({ data: today, pessoa, itens, updated_at: new Date().toISOString() });
    } catch(e) { console.error("Supabase save error:", e); }
  };

  const toggleFeito = async (itemId) => {
    if (!planner) return;
    const updated = planner.itens.map(i => i.id === itemId ? { ...i, feito: !i.feito } : i);
    await supabase.from("planner_dia").update({ itens: updated, updated_at: new Date().toISOString() }).eq("id", planner.id);
    setPlanner(p => ({ ...p, itens: updated }));
  };

  const moverBloco = async (itemId, novoBloco) => {
    if (!planner) return;
    const updated = planner.itens.map(i => i.id === itemId ? { ...i, bloco: novoBloco } : i);
    await supabase.from("planner_dia").update({ itens: updated, updated_at: new Date().toISOString() }).eq("id", planner.id);
    setPlanner(p => ({ ...p, itens: updated }));
  };

  const adicionarManual = async (bloco) => {
    const texto = textoNovo[bloco]?.trim();
    if (!texto) return;
    const novoItem = { id: `manual_${Date.now()}`, titulo: texto, tipo: "manual", prioridade: "Normal", bloco, feito: false, tempo: 20 };
    const updated = [...(planner?.itens || []), novoItem];
    await supabase.from("planner_dia").upsert({ data: today, pessoa, itens: updated, updated_at: new Date().toISOString() }, { onConflict: "data,pessoa" });
    setPlanner(p => p ? { ...p, itens: updated } : { itens: updated });
    setTextoNovo(t => ({ ...t, [bloco]: "" }));
  };

  const deletarItem = async (itemId) => {
    const updated = planner.itens.filter(i => i.id !== itemId);
    await supabase.from("planner_dia").update({ itens: updated, updated_at: new Date().toISOString() }).eq("id", planner.id);
    setPlanner(p => ({ ...p, itens: updated }));
  };

  const resetarDia = async () => {
    if (!window.confirm("Resetar o planner de hoje e gerar novas sugestões?")) return;
    await supabase.from("planner_dia").delete().eq("data", today).eq("pessoa", pessoa);
    loadPlanner();
  };

  const PRIO_COLOR = { Urgente: { bg: "#FEE2E2", color: "#DC2626", dot: "#DC2626" }, Alta: { bg: "#FEF3C7", color: "#D97706", dot: "#F59E0B" }, Normal: { bg: "#DBEAFE", color: "#2563EB", dot: "#3B82F6" }, Baixa: { bg: "#F1F5F9", color: "#64748B", dot: "#94A3B8" } };
  const TIPO_ICON = { demanda: "📋", post: "📅", manual: "✏️" };

  const itensPorBloco = (blocoId) => (planner?.itens || []).filter(i => i.bloco === blocoId);
  const totalMinutos = (blocoId) => itensPorBloco(blocoId).reduce((s, i) => s + (i.tempo || 0), 0);
  const feitosHoje = (planner?.itens || []).filter(i => i.feito).length;
  const totalHoje = (planner?.itens || []).length;
  const pctDia = totalHoje > 0 ? Math.round((feitosHoje / totalHoje) * 100) : 0;

  const dataFormatada = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1E293B" }}>⚡ Planner do Dia</h2>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: "#64748B", textTransform: "capitalize" }}>{dataFormatada}</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Person selector */}
          <div style={{ display: "flex", gap: 4, background: "#F1F5F9", borderRadius: 10, padding: 4 }}>
            {PEOPLE.map(p => (
              <button key={p} onClick={() => setPessoa(p)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 7, border: "none", background: pessoa === p ? "#fff" : "transparent", boxShadow: pessoa === p ? "0 1px 4px rgba(0,0,0,0.1)" : "none", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                <Avatar name={p} size={20} />
                <span style={{ fontSize: 13, fontWeight: pessoa === p ? 700 : 500, color: pessoa === p ? PERSON_COLORS[p] : "#64748B" }}>{p}</span>
              </button>
            ))}
          </div>
          {planner && <button onClick={resetarDia} style={{ fontSize: 12, padding: "7px 12px", borderRadius: 8, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", cursor: "pointer", fontFamily: "inherit" }}>🔄 Novo planner</button>}
        </div>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 60, color: "#94A3B8" }}>⏳ Carregando seu dia...</div>}

      {/* TELA DE CONFIRMAÇÃO */}
      {!loading && confirmando && (
        <div>
          <div style={{ background: "linear-gradient(135deg,#EFF6FF,#DBEAFE)", borderRadius: 14, padding: "16px 20px", marginBottom: 20, border: "1.5px solid #BFDBFE" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1E3A8A", marginBottom: 4 }}>✨ Sugestões para o seu dia, {pessoa}!</div>
            <div style={{ fontSize: 12, color: "#3B82F6" }}>O sistema selecionou as tarefas mais importantes. Confirme, ajuste ou adicione mais antes de montar seu planner.</div>
          </div>

          {sugestoes.length === 0 && (
            <div style={{ textAlign: "center", padding: "30px 0", color: "#94A3B8", fontSize: 13 }}>
              Nenhuma demanda atribuída a {pessoa} hoje. Adicione tarefas manualmente abaixo!
            </div>
          )}

          {sugestoes.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Tarefas sugeridas — marque as que quer no planner</div>
              {sugestoes.map(s => {
                const pc = PRIO_COLOR[s.prioridade] || PRIO_COLOR.Normal;
                const sec = SECTORS.find(x => x.id === s.sector);
                return (
                  <div key={s.id} onClick={() => setSelecionadas(sel => ({ ...sel, [s.id]: !sel[s.id] }))}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: selecionadas[s.id] ? "#F0FDF4" : "#F8FAFC", border: `1.5px solid ${selecionadas[s.id] ? "#A7F3D0" : "#E2E8F0"}`, borderRadius: 10, cursor: "pointer", transition: "all 0.15s" }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${selecionadas[s.id] ? "#10B981" : "#CBD5E1"}`, background: selecionadas[s.id] ? "#10B981" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {selecionadas[s.id] && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 14 }}>{TIPO_ICON[s.tipo]}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#1E293B" }}>{s.titulo}</div>
                      <div style={{ display: "flex", gap: 6, marginTop: 3 }}>
                        <span style={{ fontSize: 10, background: pc.bg, color: pc.color, padding: "1px 6px", borderRadius: 999, fontWeight: 600 }}>{s.prioridade}</span>
                        {sec && <span style={{ fontSize: 10, background: sec.bg, color: sec.color, padding: "1px 6px", borderRadius: 999, fontWeight: 600 }}>{sec.icon} {sec.label}</span>}
                        <span style={{ fontSize: 10, color: "#94A3B8" }}>⏱ {tempoLabel(s.tempo)}</span>
                      </div>
                    </div>
                    <select value={s.bloco} onChange={e => { e.stopPropagation(); setSugestoes(sg => sg.map(x => x.id === s.id ? { ...x, bloco: e.target.value } : x)); }} onClick={e => e.stopPropagation()}
                      style={{ fontSize: 11, padding: "3px 6px", borderRadius: 6, border: "1.5px solid #E2E8F0", background: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
                      {blocos.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
                    </select>
                  </div>
                );
              })}
            </div>
          )}

          {/* Adicionar tarefas manuais */}
          {blocos.map(b => (
            <div key={b.id} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>+ Adicionar tarefa manual em {b.label}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={novasTarefas[b.id] || ""} onChange={e => setNovasTarefas(n => ({ ...n, [b.id]: e.target.value }))} onKeyDown={e => { if (e.key === "Enter" && novasTarefas[b.id]?.trim()) { const nova = { id: `manual_${Date.now()}`, titulo: novasTarefas[b.id].trim(), tipo: "manual", prioridade: "Normal", bloco: b.id, feito: false, tempo: 20 }; setSugestoes(s => [...s, nova]); setSelecionadas(sel => ({ ...sel, [nova.id]: true })); setNovasTarefas(n => ({ ...n, [b.id]: "" })); } }} placeholder={`Tarefa para ${b.label.toLowerCase()}...`} style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1.5px solid #E2E8F0", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
                <button onClick={() => { if (novasTarefas[b.id]?.trim()) { const nova = { id: `manual_${Date.now()}`, titulo: novasTarefas[b.id].trim(), tipo: "manual", prioridade: "Normal", bloco: b.id, feito: false, tempo: 20 }; setSugestoes(s => [...s, nova]); setSelecionadas(sel => ({ ...sel, [nova.id]: true })); setNovasTarefas(n => ({ ...n, [b.id]: "" })); } }} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#3B82F6", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>+ Add</button>
              </div>
            </div>
          ))}

          <button onClick={confirmarPlanner} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#1E3A8A,#3B82F6)", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "inherit", marginTop: 8 }}>
            ⚡ Montar meu planner do dia ({Object.values(selecionadas).filter(Boolean).length} tarefas)
          </button>
        </div>
      )}

      {/* PLANNER DO DIA */}
      {!loading && !confirmando && planner && (
        <div>
          {/* Progresso do dia */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E2E8F0", padding: "14px 18px", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B" }}>Progresso do dia — {pessoa}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: pctDia === 100 ? "#059669" : "#3B82F6" }}>{feitosHoje}/{totalHoje} concluídas</div>
            </div>
            <div style={{ height: 10, background: "#F1F5F9", borderRadius: 999 }}>
              <div style={{ width: `${pctDia}%`, height: "100%", background: pctDia === 100 ? "linear-gradient(135deg,#10B981,#059669)" : "linear-gradient(135deg,#3B82F6,#6366F1)", borderRadius: 999, transition: "width 0.5s ease" }} />
            </div>
            {pctDia === 100 && <div style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: "#059669", marginTop: 8 }}>🎉 Dia concluído! Ótimo trabalho, {pessoa}!</div>}
          </div>

          {/* Blocos */}
          {blocos.map(bloco => {
            const itens = itensPorBloco(bloco.id);
            const mins = totalMinutos(bloco.id);
            const feitos = itens.filter(i => i.feito).length;
            return (
              <div key={bloco.id} style={{ marginBottom: 20 }}>
                {/* Bloco header */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, padding: "10px 16px", background: "linear-gradient(135deg,#F8FAFC,#F1F5F9)", borderRadius: 10, border: "1.5px solid #E2E8F0" }}>
                  <span style={{ fontSize: 18 }}>{bloco.label.split(" ")[0]}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#1E293B" }}>{bloco.label.split(" ").slice(1).join(" ")}</span>
                    <span style={{ fontSize: 12, color: "#64748B", marginLeft: 8 }}>{bloco.inicio} – {bloco.fim}</span>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#64748B" }}>⏱ {tempoLabel(mins)}</span>
                    <span style={{ fontSize: 11, background: "#D1FAE5", color: "#065F46", padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>{feitos}/{itens.length}</span>
                  </div>
                </div>

                {/* Itens do bloco */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {itens.length === 0 && (
                    <div style={{ padding: "12px 16px", background: "#F8FAFC", borderRadius: 8, border: "1.5px dashed #E2E8F0", textAlign: "center", fontSize: 12, color: "#94A3B8" }}>Sem tarefas neste bloco</div>
                  )}
                  {itens.map((item, idx) => {
                    const pc = PRIO_COLOR[item.prioridade] || PRIO_COLOR.Normal;
                    const sec = item.sector ? SECTORS.find(x => x.id === item.sector) : null;
                    return (
                      <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: item.feito ? "#F0FDF4" : "#fff", border: `1.5px solid ${item.feito ? "#A7F3D0" : pc.bg}`, borderRadius: 10, borderLeft: `4px solid ${item.feito ? "#10B981" : pc.dot}`, transition: "all 0.2s", opacity: item.feito ? 0.75 : 1 }}>
                        {/* Checkbox */}
                        <div onClick={() => toggleFeito(item.id)} style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${item.feito ? "#10B981" : "#CBD5E1"}`, background: item.feito ? "#10B981" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "all 0.2s" }}>
                          {item.feito && <span style={{ color: "#fff", fontSize: 13 }}>✓</span>}
                        </div>

                        <span style={{ fontSize: 14, flexShrink: 0 }}>{TIPO_ICON[item.tipo] || "📋"}</span>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: item.feito ? "#64748B" : "#1E293B", textDecoration: item.feito ? "line-through" : "none", lineHeight: 1.4 }}>{item.titulo}</div>
                          <div style={{ display: "flex", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 10, background: pc.bg, color: pc.color, padding: "1px 6px", borderRadius: 999, fontWeight: 600 }}>{item.prioridade}</span>
                            {sec && <span style={{ fontSize: 10, background: sec.bg, color: sec.color, padding: "1px 6px", borderRadius: 999, fontWeight: 600 }}>{sec.icon} {sec.label}</span>}
                            <span style={{ fontSize: 10, color: "#94A3B8" }}>⏱ {tempoLabel(item.tempo)}</span>
                            {item.canal && <span style={{ fontSize: 10, color: "#94A3B8" }}>{CHANNEL_ICONS[item.canal]} {item.canal}</span>}
                          </div>
                        </div>

                        {/* Mover bloco */}
                        <select value={item.bloco} onChange={e => moverBloco(item.id, e.target.value)} style={{ fontSize: 10, padding: "3px 6px", borderRadius: 6, border: "1.5px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer", fontFamily: "inherit", color: "#64748B" }}>
                          {blocos.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
                        </select>

                        <button onClick={() => deletarItem(item.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#CBD5E1", flexShrink: 0 }} onMouseEnter={e => e.currentTarget.style.color = "#EF4444"} onMouseLeave={e => e.currentTarget.style.color = "#CBD5E1"}>✕</button>
                      </div>
                    );
                  })}
                </div>

                {/* Adicionar no bloco */}
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <input value={textoNovo[bloco.id] || ""} onChange={e => setTextoNovo(t => ({ ...t, [bloco.id]: e.target.value }))} onKeyDown={e => e.key === "Enter" && adicionarManual(bloco.id)} placeholder={`+ Adicionar tarefa em ${bloco.label.split(" ").slice(1).join(" ").toLowerCase()}...`} style={{ flex: 1, padding: "7px 12px", borderRadius: 8, border: "1.5px solid #E2E8F0", fontSize: 12, fontFamily: "inherit", outline: "none", background: "#F8FAFC", color: "#475569" }} />
                  <button onClick={() => adicionarManual(bloco.id)} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "#3B82F6", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}>+</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── PARCERIAS ─────────────────────────────────────────────────────────────────
const PARCERIA_TIPOS = ["Escola de idiomas", "Contador/Financeiro", "Advogado/Escritório", "Infoprodutor/Criador", "Câmbio/Remessas", "Agência de Imigração", "Outro"];
const PARCERIA_STATUS = ["Prospecção", "Contato feito", "Proposta enviada", "Contrato enviado", "Ativo", "Pausado", "Encerrado"];
const PARCERIA_MODELO = ["Comissão por indicação", "Permuta de conteúdo", "Contrato fixo mensal", "Parceria pontual", "Outro"];

const PARCERIA_STATUS_STYLE = {
  "Prospecção":       { bg: "#F1F5F9", color: "#475569", dot: "#94A3B8" },
  "Contato feito":    { bg: "#EEF2FF", color: "#4338CA", dot: "#6366F1" },
  "Proposta enviada": { bg: "#FEF3C7", color: "#92400E", dot: "#F59E0B" },
  "Contrato enviado": { bg: "#DBEAFE", color: "#1D4ED8", dot: "#3B82F6" },
  "Ativo":            { bg: "#D1FAE5", color: "#065F46", dot: "#10B981" },
  "Pausado":          { bg: "#FEF3C7", color: "#92400E", dot: "#F59E0B" },
  "Encerrado":        { bg: "#FEE2E2", color: "#991B1B", dot: "#EF4444" },
};

const PIPELINE_STEPS = ["Prospecção", "Contato feito", "Proposta enviada", "Contrato enviado", "Ativo"];

const emptyParceria = () => ({
  id: null, nome: "", tipo: "", contato_nome: "", contato_email: "",
  contato_whatsapp: "", contato_instagram: "", status: "Prospecção",
  modelo_financeiro: "", valor: "", data_inicio: "", data_vencimento: "",
  renovacao_automatica: false, leads_gerados: 0, vendas_geradas: 0,
  obs: "", historico: [],
});

function ParceriaModal({ item, onSave, onClose }) {
  const [form, setForm] = useState({ ...item, historico: item.historico || [] });
  const [activeTab, setActiveTab] = useState("info");
  const [newComment, setNewComment] = useState("");
  const [uploading, setUploading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const uploadContrato = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `contrato_${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage.from("contratos").upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("contratos").getPublicUrl(fileName);
      set("contrato_url", urlData.publicUrl);
      set("contrato_nome", file.name);
    } catch (e) { alert("Erro ao enviar arquivo: " + e.message); }
    setUploading(false);
  };

  const addHistorico = () => {
    if (!newComment.trim()) return;
    const entry = { id: Date.now(), text: newComment.trim(), ts: new Date().toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) };
    setForm(f => ({ ...f, historico: [...(f.historico || []), entry] }));
    setNewComment("");
  };

  const I = { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #E2E8F0", fontSize: 13, color: "#1E293B", background: "#F8FAFC", outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
  const L = { fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, display: "block" };
  const ss = PARCERIA_STATUS_STYLE[form.status] || PARCERIA_STATUS_STYLE["Prospecção"];

  // Vencimento alert
  const diasVenc = form.data_vencimento ? Math.ceil((new Date(form.data_vencimento) - new Date()) / 86400000) : null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, width: 600, maxWidth: "97vw", boxShadow: "0 24px 60px rgba(15,23,42,0.2)", maxHeight: "94vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "20px 24px 0", borderBottom: "1px solid #F1F5F9" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div style={{ flex: 1, marginRight: 12 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0F172A" }}>{form.id ? form.nome || "Editar Parceria" : "🤝 Nova Parceria"}</h2>
              {form.id && (
                <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, background: ss.bg, color: ss.color, padding: "2px 9px", borderRadius: 999, fontWeight: 600 }}>
                    <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: ss.dot, marginRight: 4 }} />{form.status}
                  </span>
                  {form.tipo && <span style={{ fontSize: 11, background: "#F1F5F9", color: "#475569", padding: "2px 9px", borderRadius: 999 }}>{form.tipo}</span>}
                  {diasVenc !== null && diasVenc <= 30 && (
                    <span style={{ fontSize: 11, background: diasVenc <= 7 ? "#FEE2E2" : "#FEF3C7", color: diasVenc <= 7 ? "#DC2626" : "#D97706", padding: "2px 9px", borderRadius: 999, fontWeight: 700 }}>
                      {diasVenc <= 0 ? "⚠️ Vencido!" : `⏰ Vence em ${diasVenc}d`}
                    </span>
                  )}
                </div>
              )}
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: "#94A3B8", cursor: "pointer" }}>✕</button>
          </div>
          {form.id && (
            <div style={{ display: "flex", gap: 2 }}>
              {[["info", "📋 Informações"], ["financeiro", "💰 Financeiro"], ["resultados", "📊 Resultados"], ["historico", `💬 Histórico (${(form.historico||[]).length})`]].map(([v, l]) => (
                <button key={v} onClick={() => setActiveTab(v)} style={{ padding: "6px 12px", borderRadius: "6px 6px 0 0", border: "none", background: activeTab === v ? "#fff" : "transparent", color: activeTab === v ? "#1E3A8A" : "#64748B", fontWeight: activeTab === v ? 700 : 500, fontSize: 12, cursor: "pointer", fontFamily: "inherit", borderBottom: activeTab === v ? "2px solid #3B82F6" : "2px solid transparent" }}>{l}</button>
              ))}
            </div>
          )}
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "20px 24px" }}>

          {/* INFO TAB */}
          {(activeTab === "info" || !form.id) && (
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={L}>Nome do Parceiro / Empresa</label><input style={I} value={form.nome} onChange={e => set("nome", e.target.value)} placeholder="Ex: Escola de Espanhol Madrid" /></div>
                <div><label style={L}>Tipo</label><select style={I} value={form.tipo} onChange={e => set("tipo", e.target.value)}><option value="">— Selecionar —</option>{PARCERIA_TIPOS.map(t => <option key={t}>{t}</option>)}</select></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={L}>Status</label><select style={I} value={form.status} onChange={e => set("status", e.target.value)}>{PARCERIA_STATUS.map(s => <option key={s}>{s}</option>)}</select></div>
                <div><label style={L}>Nome do Contato</label><input style={I} value={form.contato_nome} onChange={e => set("contato_nome", e.target.value)} placeholder="Nome da pessoa" /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={L}>Email</label><input style={I} value={form.contato_email} onChange={e => set("contato_email", e.target.value)} placeholder="email@exemplo.com" /></div>
                <div><label style={L}>WhatsApp</label><input style={I} value={form.contato_whatsapp} onChange={e => set("contato_whatsapp", e.target.value)} placeholder="55 11 99999-9999" /></div>
              </div>
              <div><label style={L}>Instagram</label><input style={I} value={form.contato_instagram} onChange={e => set("contato_instagram", e.target.value)} placeholder="@perfil" /></div>
              <div><label style={L}>Observações gerais</label><textarea style={{ ...I, resize: "vertical", minHeight: 80 }} value={form.obs} onChange={e => set("obs", e.target.value)} placeholder="Contexto, como conheceu, notas importantes..." /></div>
            </div>
          )}

          {/* FINANCEIRO TAB */}
          {activeTab === "financeiro" && (
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={L}>Modelo financeiro</label><select style={I} value={form.modelo_financeiro} onChange={e => set("modelo_financeiro", e.target.value)}><option value="">— Selecionar —</option>{PARCERIA_MODELO.map(m => <option key={m}>{m}</option>)}</select></div>
                <div><label style={L}>Valor / Percentual acordado</label><input style={I} value={form.valor} onChange={e => set("valor", e.target.value)} placeholder="Ex: 10% / R$ 500/mês" /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={L}>Data de início</label><input type="date" style={I} value={form.data_inicio} onChange={e => set("data_inicio", e.target.value)} /></div>
                <div><label style={L}>Vencimento do contrato</label><input type="date" style={I} value={form.data_vencimento} onChange={e => set("data_vencimento", e.target.value)} /></div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input type="checkbox" id="renovacao" checked={form.renovacao_automatica} onChange={e => set("renovacao_automatica", e.target.checked)} style={{ width: 16, height: 16, accentColor: "#3B82F6", cursor: "pointer" }} />
                <label htmlFor="renovacao" style={{ fontSize: 13, color: "#475569", cursor: "pointer" }}>Renovação automática</label>
              </div>
              {diasVenc !== null && (
                <div style={{ background: diasVenc <= 0 ? "#FEF2F2" : diasVenc <= 7 ? "#FEF2F2" : diasVenc <= 30 ? "#FFFBEB" : "#ECFDF5", border: `1.5px solid ${diasVenc <= 7 ? "#FECACA" : diasVenc <= 30 ? "#FDE68A" : "#A7F3D0"}`, borderRadius: 10, padding: "12px 16px", fontSize: 13, color: diasVenc <= 7 ? "#7F1D1D" : diasVenc <= 30 ? "#78350F" : "#065F46", fontWeight: 600 }}>
                  {diasVenc <= 0 ? "⚠️ Contrato vencido! Ação necessária." : diasVenc <= 7 ? `⚠️ Vence em ${diasVenc} dia${diasVenc > 1 ? "s" : ""}! Renovar ou encerrar.` : diasVenc <= 30 ? `⏰ Vence em ${diasVenc} dias.` : `✅ Contrato válido por mais ${diasVenc} dias.`}
                </div>
              )}

              {/* Anexo de contrato */}
              <div style={{ borderTop: "1.5px solid #E2E8F0", paddingTop: 14 }}>
                <label style={L}>📎 Anexar contrato (PDF, DOC)</label>
                {form.contrato_url ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#ECFDF5", border: "1.5px solid #A7F3D0", borderRadius: 8, padding: "10px 14px" }}>
                    <span style={{ fontSize: 18 }}>📄</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#065F46" }}>{form.contrato_nome || "Contrato anexado"}</div>
                      <a href={form.contrato_url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#059669" }}>Ver documento →</a>
                    </div>
                    <button onClick={() => { set("contrato_url", ""); set("contrato_nome", ""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#DC2626", fontSize: 12, fontFamily: "inherit" }}>✕ Remover</button>
                  </div>
                ) : (
                  <div>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", background: "#F8FAFC", border: "1.5px dashed #CBD5E1", borderRadius: 8, cursor: uploading ? "not-allowed" : "pointer" }}>
                      <span style={{ fontSize: 20 }}>📎</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>{uploading ? "⏳ Enviando..." : "Clique para anexar o contrato"}</div>
                        <div style={{ fontSize: 11, color: "#94A3B8" }}>PDF, DOC, DOCX — até 10MB</div>
                      </div>
                      <input type="file" accept=".pdf,.doc,.docx" style={{ display: "none" }} onChange={e => e.target.files[0] && uploadContrato(e.target.files[0])} disabled={uploading} />
                    </label>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 6 }}>⚠️ Para usar esta função, é necessário criar o bucket "contratos" no Supabase Storage.</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RESULTADOS TAB */}
          {activeTab === "resultados" && (
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={L}>Leads gerados</label>
                  <input type="number" style={I} value={form.leads_gerados} onChange={e => set("leads_gerados", parseInt(e.target.value) || 0)} />
                  <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>Total de leads vindos desta parceria</div>
                </div>
                <div>
                  <label style={L}>Vendas / Conversões</label>
                  <input type="number" style={I} value={form.vendas_geradas} onChange={e => set("vendas_geradas", parseInt(e.target.value) || 0)} />
                  <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>Total de clientes convertidos</div>
                </div>
              </div>
              {(form.leads_gerados > 0 || form.vendas_geradas > 0) && (
                <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "14px 16px", border: "1.5px solid #E2E8F0" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 10 }}>Resumo de performance</div>
                  <div style={{ display: "flex", gap: 20 }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 28, fontWeight: 800, color: "#3B82F6" }}>{form.leads_gerados}</div>
                      <div style={{ fontSize: 11, color: "#94A3B8" }}>Leads</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 28, fontWeight: 800, color: "#10B981" }}>{form.vendas_geradas}</div>
                      <div style={{ fontSize: 11, color: "#94A3B8" }}>Conversões</div>
                    </div>
                    {form.leads_gerados > 0 && (
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 28, fontWeight: 800, color: "#6366F1" }}>{Math.round((form.vendas_geradas / form.leads_gerados) * 100)}%</div>
                        <div style={{ fontSize: 11, color: "#94A3B8" }}>Taxa conversão</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* HISTÓRICO TAB */}
          {activeTab === "historico" && (
            <div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 20 }}>
                {(form.historico || []).length === 0 && (
                  <div style={{ textAlign: "center", padding: "30px 0", color: "#94A3B8", fontSize: 13 }}>Nenhum registro ainda. Documente conversas, follow-ups e atualizações!</div>
                )}
                {[...(form.historico || [])].reverse().map((c, i) => (
                  <div key={c.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", paddingBottom: i < (form.historico||[]).length - 1 ? 16 : 0 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", marginTop: 5, flexShrink: 0 }} />
                      {i < (form.historico||[]).length - 1 && <div style={{ width: 1, flex: 1, background: "#E2E8F0", margin: "4px 0", minHeight: 24 }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: "#1E293B", lineHeight: 1.5 }}>{c.text}</div>
                      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{c.ts}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 14 }}>
                <label style={L}>Registrar atualização</label>
                <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Ex: Enviado contrato por email · Reunião marcada para quinta · Parceiro confirmou interesse..." style={{ ...({ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #E2E8F0", fontSize: 13, color: "#1E293B", background: "#F8FAFC", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }), resize: "vertical", minHeight: 80 }} />
                <button onClick={addHistorico} disabled={!newComment.trim()} style={{ marginTop: 8, padding: "8px 18px", borderRadius: 8, border: "none", background: newComment.trim() ? "linear-gradient(135deg,#1E3A8A,#3B82F6)" : "#CBD5E1", color: "#fff", cursor: newComment.trim() ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>Registrar</button>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "14px 24px", borderTop: "1px solid #E2E8F0", display: "flex", gap: 10, justifyContent: "space-between", alignItems: "center", background: "#F8FAFC" }}>
          <div>
            {form.id && <button onClick={() => { if (window.confirm("Excluir esta parceria permanentemente?")) { onSave({ ...form, _delete: true }); } }} style={{ padding: "9px 14px", borderRadius: 8, border: "1.5px solid #FECACA", background: "#FEF2F2", color: "#DC2626", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>🗑 Excluir parceria</button>}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 8, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Cancelar</button>
            <button onClick={() => form.nome.trim() && onSave(form)} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#1E3A8A,#3B82F6)", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>Salvar Parceria</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ParceriasPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [view, setView] = useState("pipeline");

  const load = useCallback(async () => {
    const { data } = await supabase.from("parcerias").select("*").order("created_at", { ascending: false });
    if (data) setItems(data.map(p => ({ ...p, historico: p.historico || [] })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (form) => {
    if (form._delete) { await supabase.from("parcerias").delete().eq("id", form.id); setModal(null); load(); return; }
    const payload = { nome: form.nome, tipo: form.tipo, contato_nome: form.contato_nome, contato_email: form.contato_email, contato_whatsapp: form.contato_whatsapp, contato_instagram: form.contato_instagram, status: form.status, modelo_financeiro: form.modelo_financeiro, valor: form.valor, data_inicio: form.data_inicio, data_vencimento: form.data_vencimento, renovacao_automatica: form.renovacao_automatica, leads_gerados: form.leads_gerados || 0, vendas_geradas: form.vendas_geradas || 0, obs: form.obs, historico: form.historico || [], contrato_url: form.contrato_url || "", contrato_nome: form.contrato_nome || "", updated_at: new Date().toISOString() };
    if (form.id) await supabase.from("parcerias").update(payload).eq("id", form.id);
    else await supabase.from("parcerias").insert(payload);
    setModal(null);
    load();
  };

  const del = async (id) => {
    if (window.confirm("Excluir esta parceria?")) { await supabase.from("parcerias").delete().eq("id", id); load(); }
  };

  const filtered = items.filter(i => (!filterStatus || i.status === filterStatus) && (!filterTipo || i.tipo === filterTipo));
  const ativos = items.filter(i => i.status === "Ativo").length;
  const totalLeads = items.reduce((s, i) => s + (i.leads_gerados || 0), 0);
  const totalVendas = items.reduce((s, i) => s + (i.vendas_geradas || 0), 0);
  const vencendoBreve = items.filter(i => { if (!i.data_vencimento) return false; const d = Math.ceil((new Date(i.data_vencimento) - new Date()) / 86400000); return d >= 0 && d <= 30; });

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "#94A3B8" }}>⏳ Carregando parcerias...</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1E293B" }}>🤝 Controle de Parcerias</h2>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: "#64748B" }}>{ativos} ativas · {items.length} no total</p>
        </div>
        <button onClick={() => setModal(emptyParceria())} style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#1E3A8A,#3B82F6)", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>+ Nova Parceria</button>
      </div>

      {/* Alerta vencimentos */}
      {vencendoBreve.length > 0 && (
        <div style={{ background: "#FFFBEB", border: "1.5px solid #FDE68A", borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>⏰</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#78350F" }}>{vencendoBreve.length} contrato{vencendoBreve.length > 1 ? "s" : ""} vence{vencendoBreve.length > 1 ? "m" : ""} nos próximos 30 dias!</div>
            <div style={{ fontSize: 11, color: "#92400E" }}>{vencendoBreve.map(p => p.nome).join(" · ")}</div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10, marginBottom: 20 }}>
        {[
          ["🤝", "Total", items.length, "#475569", "#F8FAFC"],
          ["✅", "Ativos", ativos, "#059669", "#ECFDF5"],
          ["🔄", "Em negociação", items.filter(i => ["Contato feito","Proposta enviada","Contrato enviado"].includes(i.status)).length, "#2563EB", "#EFF6FF"],
          ["🎯", "Leads gerados", totalLeads, "#6366F1", "#EEF2FF"],
          ["💰", "Conversões", totalVendas, "#D97706", "#FFFBEB"],
        ].map(([icon, label, value, color, bg]) => (
          <div key={label} style={{ background: bg, borderRadius: 12, padding: "12px 14px", border: `1px solid ${bg}` }}>
            <div style={{ fontSize: 18 }}>{icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color, marginTop: 4 }}>{value}</div>
            <div style={{ fontSize: 11, color, fontWeight: 600, opacity: 0.8 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", padding: "10px 14px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 3, background: "#F1F5F9", borderRadius: 7, padding: 3 }}>
          {[["pipeline", "🔄 Pipeline"], ["lista", "☰ Lista"]].map(([v, l]) => (
            <button key={v} onClick={() => setView(v)} style={{ padding: "4px 12px", borderRadius: 5, border: "none", background: view === v ? "#fff" : "transparent", color: view === v ? "#1E3A8A" : "#64748B", fontWeight: view === v ? 700 : 500, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>{l}</button>
          ))}
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: "5px 8px", borderRadius: 7, border: `1.5px solid ${filterStatus ? "#3B82F6" : "#E2E8F0"}`, fontSize: 12, color: filterStatus ? "#1E3A8A" : "#64748B", background: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
          <option value="">Todos — Status</option>
          {PARCERIA_STATUS.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} style={{ padding: "5px 8px", borderRadius: 7, border: `1.5px solid ${filterTipo ? "#3B82F6" : "#E2E8F0"}`, fontSize: 12, color: filterTipo ? "#1E3A8A" : "#64748B", background: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
          <option value="">Todos — Tipo</option>
          {PARCERIA_TIPOS.map(t => <option key={t}>{t}</option>)}
        </select>
        {(filterStatus || filterTipo) && <button onClick={() => { setFilterStatus(""); setFilterTipo(""); }} style={{ fontSize: 11, color: "#EF4444", background: "#FEE2E2", border: "none", padding: "4px 10px", borderRadius: 999, cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>✕ Limpar</button>}
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#94A3B8" }}>{filtered.length} parceiro{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* PIPELINE VIEW */}
      {view === "pipeline" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 14 }}>
          {PIPELINE_STEPS.map(step => {
            const col = filtered.filter(p => p.status === step);
            const ss = PARCERIA_STATUS_STYLE[step];
            return (
              <div key={step}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: ss.dot, display: "inline-block" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", flex: 1 }}>{step}</span>
                  <span style={{ fontSize: 10, background: ss.bg, color: ss.color, borderRadius: 999, padding: "1px 7px", fontWeight: 700 }}>{col.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 60 }}>
                  {col.map(p => {
                    const diasV = p.data_vencimento ? Math.ceil((new Date(p.data_vencimento) - new Date()) / 86400000) : null;
                    return (
                      <div key={p.id} onClick={() => setModal(p)} style={{ background: "#fff", borderRadius: 10, padding: "12px 14px", boxShadow: "0 1px 4px rgba(15,23,42,0.07)", border: `1.5px solid ${ss.bg}`, cursor: "pointer", transition: "all 0.15s", borderLeft: `3px solid ${ss.dot}` }}
                        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 14px rgba(15,23,42,0.10)"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 1px 4px rgba(15,23,42,0.07)"; }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1E293B", marginBottom: 4 }}>{p.nome}</div>
                        {p.tipo && <div style={{ fontSize: 10, color: "#64748B", marginBottom: 6 }}>{p.tipo}</div>}
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          {p.contato_nome && <div style={{ fontSize: 11, color: "#94A3B8" }}>👤 {p.contato_nome}</div>}
                          {p.valor && <div style={{ fontSize: 11, color: "#059669", fontWeight: 600 }}>💰 {p.valor}</div>}
                          {diasV !== null && diasV <= 30 && <div style={{ fontSize: 10, color: diasV <= 7 ? "#DC2626" : "#D97706", fontWeight: 700 }}>{diasV <= 0 ? "⚠️ Vencido" : `⏰ ${diasV}d`}</div>}
                        </div>
                      </div>
                    );
                  })}
                  {col.length === 0 && <div style={{ border: "1.5px dashed #E2E8F0", borderRadius: 10, padding: 14, textAlign: "center", color: "#CBD5E1", fontSize: 11 }}>Vazio</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LISTA VIEW */}
      {view === "lista" && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1.5px solid #E2E8F0" }}>
                {["Parceiro", "Tipo", "Status", "Contato", "Modelo", "Leads", "Vencimento", ""].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#64748B", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const ss = PARCERIA_STATUS_STYLE[p.status] || PARCERIA_STATUS_STYLE["Prospecção"];
                const diasV = p.data_vencimento ? Math.ceil((new Date(p.data_vencimento) - new Date()) / 86400000) : null;
                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid #F1F5F9", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: "#1E293B" }}>{p.nome}</td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: "#64748B" }}>{p.tipo || "—"}</td>
                    <td style={{ padding: "10px 12px" }}><span style={{ fontSize: 11, background: ss.bg, color: ss.color, padding: "2px 8px", borderRadius: 999, fontWeight: 600, whiteSpace: "nowrap" }}><span style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: ss.dot, marginRight: 4 }} />{p.status}</span></td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: "#475569" }}>{p.contato_nome || "—"}</td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: "#475569" }}>{p.modelo_financeiro || "—"}</td>
                    <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 700, color: "#6366F1" }}>{p.leads_gerados || 0}</td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: diasV !== null && diasV <= 30 ? (diasV <= 7 ? "#DC2626" : "#D97706") : "#64748B", fontWeight: diasV !== null && diasV <= 30 ? 700 : 400 }}>
                      {p.data_vencimento ? (diasV !== null && diasV <= 0 ? "⚠️ Vencido" : diasV !== null && diasV <= 30 ? `⏰ ${diasV}d` : new Date(p.data_vencimento + "T12:00").toLocaleDateString("pt-BR")) : "—"}
                    </td>
                    <td style={{ padding: "10px 8px" }}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => setModal(p)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>✏️</button>
                        <button onClick={() => del(p.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>🗑</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>Nenhuma parceria encontrada</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Encerrados */}
      {items.filter(i => i.status === "Encerrado" || i.status === "Pausado").length > 0 && (
        <div style={{ marginTop: 20, opacity: 0.6 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Pausados / Encerrados</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {items.filter(i => i.status === "Encerrado" || i.status === "Pausado").map(p => (
              <div key={p.id} onClick={() => setModal(p)} style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, color: "#64748B" }}>{p.nome} <span style={{ fontSize: 10 }}>({p.status})</span></div>
            ))}
          </div>
        </div>
      )}

      {modal && <ParceriaModal item={modal} onSave={save} onClose={() => setModal(null)} />}
    </div>
  );
}

// ── HOME PAGE ─────────────────────────────────────────────────────────────────
const VERSICULOS = [
  { text: "Tudo posso naquele que me fortalece.", ref: "Filipenses 4,13" },
  { text: "O Senhor é meu pastor e nada me faltará.", ref: "Salmos 23,1" },
  { text: "Confia no Senhor de todo o teu coração.", ref: "Provérbios 3,5" },
  { text: "Sede fortes e corajosos. Não temais, nem vos assusteis.", ref: "Deuteronômio 31,6" },
  { text: "Buscai primeiro o Reino de Deus e a sua justiça.", ref: "Mateus 6,33" },
  { text: "Com Deus faremos proezas.", ref: "Salmos 60,14" },
  { text: "Eu sou o caminho, a verdade e a vida.", ref: "João 14,6" },
  { text: "A fé é o fundamento das coisas que se esperam.", ref: "Hebreus 11,1" },
  { text: "O amor é paciente, o amor é bondoso.", ref: "1 Coríntios 13,4" },
  { text: "Pedi e dar-se-vos-á; buscai e encontrareis.", ref: "Mateus 7,7" },
  { text: "Lançai sobre Ele toda a vossa ansiedade, porque Ele tem cuidado de vós.", ref: "1 Pedro 5,7" },
  { text: "Porque sou eu que conheço os planos que tenho a vosso respeito.", ref: "Jeremias 29,11" },
  { text: "Alegrai-vos sempre no Senhor.", ref: "Filipenses 4,4" },
  { text: "Não vos deixarei órfãos, voltarei para vós.", ref: "João 14,18" },
  { text: "Com alegria hauríeis água das fontes da salvação.", ref: "Isaías 12,3" },
  { text: "Sede vigilantes e firmes na fé.", ref: "1 Coríntios 16,13" },
  { text: "O Senhor te abençoe e te guarde.", ref: "Números 6,24" },
  { text: "Deus é amor, e quem permanece no amor permanece em Deus.", ref: "1 João 4,16" },
  { text: "A misericórdia do Senhor é eterna.", ref: "Salmos 118,1" },
  { text: "Não vos preocupeis com o dia de amanhã.", ref: "Mateus 6,34" },
  { text: "Onde estão dois ou três reunidos em meu nome, aí estou eu no meio deles.", ref: "Mateus 18,20" },
  { text: "Graças a Deus que nos dá a vitória por Jesus Cristo.", ref: "1 Coríntios 15,57" },
  { text: "Vinde a mim todos os que estais cansados e sobrecarregados.", ref: "Mateus 11,28" },
  { text: "Sede a luz do mundo.", ref: "Mateus 5,14" },
  { text: "O Senhor está comigo, não temerei.", ref: "Salmos 118,6" },
  { text: "Amai-vos uns aos outros como eu vos amei.", ref: "João 15,12" },
  { text: "Nada vos perturbará, nada vos espantará.", ref: "Santa Teresa de Ávila" },
  { text: "Tende ânimo, sou eu, não temais.", ref: "Mateus 14,27" },
  { text: "A paz que eu vos dou não é como a que o mundo dá.", ref: "João 14,27" },
  { text: "Sede santos, porque eu, o Senhor vosso Deus, sou santo.", ref: "Levítico 19,2" },
  { text: "Deus não nos deu espírito de covardia, mas de força, amor e equilíbrio.", ref: "2 Timóteo 1,7" },
];

const DATAS_COMEMORATIVAS = [
  { mes: 1,  dia: 1,  nome: "Ano Novo / Dia Mundial da Paz", tag: "comemorativa" },
  { mes: 1,  dia: 6,  nome: "Dia de Reis (Epifania)", tag: "religioso" },
  { mes: 1,  dia: 25, nome: "Dia do Turismo", tag: "conteudo" },
  { mes: 2,  dia: 4,  nome: "Dia Mundial contra o Câncer", tag: "conteudo" },
  { mes: 2,  dia: 9,  nome: "Dia do Advogado", tag: "profissional" },
  { mes: 2,  dia: 14, nome: "Dia dos Namorados (Internacional)", tag: "comemorativa" },
  { mes: 3,  dia: 8,  nome: "Dia Internacional da Mulher", tag: "comemorativa" },
  { mes: 3,  dia: 25, nome: "Anunciação do Senhor", tag: "religioso" },
  { mes: 4,  dia: 7,  nome: "Dia Mundial da Saúde", tag: "conteudo" },
  { mes: 4,  dia: 21, nome: "Tiradentes / Feriado Nacional", tag: "feriado" },
  { mes: 4,  dia: 22, nome: "Dia da Terra", tag: "conteudo" },
  { mes: 5,  dia: 1,  nome: "Dia do Trabalho", tag: "feriado" },
  { mes: 5,  dia: 11, nome: "Dia das Mães", tag: "comemorativa" },
  { mes: 5,  dia: 13, nome: "Nossa Senhora de Fátima", tag: "religioso" },
  { mes: 6,  dia: 12, nome: "Dia dos Namorados (Brasil)", tag: "comemorativa" },
  { mes: 6,  dia: 13, nome: "Festas Juninas — Santo Antônio", tag: "religioso" },
  { mes: 6,  dia: 24, nome: "Festas Juninas — São João", tag: "religioso" },
  { mes: 6,  dia: 29, nome: "São Pedro e São Paulo", tag: "religioso" },
  { mes: 7,  dia: 25, nome: "Santiago Apóstolo", tag: "religioso" },
  { mes: 8,  dia: 11, nome: "Dia dos Pais", tag: "comemorativa" },
  { mes: 8,  dia: 15, nome: "Assunção de Nossa Senhora", tag: "religioso" },
  { mes: 9,  dia: 7,  nome: "Independência do Brasil", tag: "feriado" },
  { mes: 9,  dia: 8,  nome: "Natividade de Nossa Senhora", tag: "religioso" },
  { mes: 10, dia: 4,  nome: "São Francisco de Assis", tag: "religioso" },
  { mes: 10, dia: 12, nome: "Nossa Senhora Aparecida — Feriado", tag: "religioso" },
  { mes: 10, dia: 15, nome: "Dia das Crianças / Dia do Professor", tag: "comemorativa" },
  { mes: 11, dia: 1,  nome: "Dia de Todos os Santos", tag: "religioso" },
  { mes: 11, dia: 2,  nome: "Finados — Feriado", tag: "feriado" },
  { mes: 11, dia: 15, nome: "Proclamação da República", tag: "feriado" },
  { mes: 11, dia: 20, nome: "Dia da Consciência Negra", tag: "feriado" },
  { mes: 12, dia: 8,  nome: "Imaculada Conceição — Feriado", tag: "religioso" },
  { mes: 12, dia: 25, nome: "Natal", tag: "religioso" },
  { mes: 12, dia: 31, nome: "Réveillon / Ano Novo", tag: "comemorativa" },
];

const TAG_STYLE = {
  religioso:    { bg: "#FAEEDA", color: "#633806" },
  comemorativa: { bg: "#FDF2F8", color: "#831843" },
  feriado:      { bg: "#FEF2F2", color: "#7F1D1D" },
  profissional: { bg: "#EEF2FF", color: "#3730A3" },
  conteudo:     { bg: "#ECFDF5", color: "#064E3B" },
};

function HomePage({ tasks, setTab }) {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  const versiculo = VERSICULOS[dayOfYear % VERSICULOS.length];

  // Task stats
  const todayStr = today.toISOString().split("T")[0];
  const tomorrowStr = new Date(today.getTime() + 86400000).toISOString().split("T")[0];
  const urgentes = tasks.filter(t => t.priority === "Urgente" && t.status !== "Concluído");
  const vencem_hoje = tasks.filter(t => t.date === todayStr && t.status !== "Concluído");
  const vencem_amanha = tasks.filter(t => t.date === tomorrowStr && t.status !== "Concluído");
  const atrasadas = tasks.filter(t => t.date && t.date < todayStr && t.status !== "Concluído");
  const concluidas_semana = tasks.filter(t => t.status === "Concluído");
  const em_andamento = tasks.filter(t => t.status === "Em andamento");

  // Greeting
  const hora = today.getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

  // Next dates comemorativas (next 30 days)
  const proximasDatas = [];
  for (let i = 0; i <= 30; i++) {
    const d = new Date(today.getTime() + i * 86400000);
    const m = d.getMonth() + 1;
    const dia = d.getDate();
    const found = DATAS_COMEMORATIVAS.filter(dc => dc.mes === m && dc.dia === dia);
    found.forEach(dc => proximasDatas.push({ ...dc, date: d, diasRestantes: i }));
  }

  // Sector progress
  const sectorStats = SECTORS.map(sec => {
    const secTasks = tasks.filter(t => t.sector === sec.id);
    const done = secTasks.filter(t => t.status === "Concluído").length;
    const pct = secTasks.length ? Math.round((done / secTasks.length) * 100) : 0;
    const urgSec = secTasks.filter(t => t.priority === "Urgente" && t.status !== "Concluído").length;
    return { ...sec, total: secTasks.length, done, pct, urgSec };
  }).filter(s => s.total > 0);

  const I = { padding: "6px 10px", borderRadius: 7, border: "1.5px solid #E2E8F0", fontSize: 12, color: "#1E293B", background: "#fff", outline: "none", fontFamily: "inherit", cursor: "pointer", fontWeight: 600 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* GREETING + VERSICULO */}
      <div style={{ background: "linear-gradient(135deg,#1E3A8A,#2563EB,#3B82F6)", borderRadius: 16, padding: "22px 24px", color: "#fff" }}>
        <div style={{ fontSize: 12, color: "#BAE6FD", fontWeight: 600, marginBottom: 4 }}>
          {today.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>{saudacao}, equipe! 👋</div>
        <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 12, padding: "14px 18px", borderLeft: "3px solid rgba(255,255,255,0.4)" }}>
          <div style={{ fontSize: 14, fontStyle: "italic", color: "#EFF6FF", lineHeight: 1.6, marginBottom: 6 }}>"{versiculo.text}"</div>
          <div style={{ fontSize: 11, color: "#BAE6FD", fontWeight: 600 }}>— {versiculo.ref}</div>
        </div>
      </div>

      {/* ALERTAS */}
      {(atrasadas.length > 0 || urgentes.length > 0) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {atrasadas.length > 0 && (
            <div onClick={() => setTab("agenda")} style={{ background: "#FEF2F2", border: "1.5px solid #FECACA", borderRadius: 12, padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>⚠️</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#7F1D1D" }}>{atrasadas.length} demanda{atrasadas.length > 1 ? "s" : ""} atrasada{atrasadas.length > 1 ? "s" : ""}!</div>
                <div style={{ fontSize: 11, color: "#991B1B" }}>{atrasadas.slice(0, 2).map(t => t.title).join(" · ")}{atrasadas.length > 2 ? ` +${atrasadas.length - 2}` : ""}</div>
              </div>
              <span style={{ fontSize: 12, color: "#DC2626", fontWeight: 600 }}>Ver →</span>
            </div>
          )}
          {urgentes.length > 0 && (
            <div onClick={() => setTab("demandas")} style={{ background: "#FFF7ED", border: "1.5px solid #FED7AA", borderRadius: 12, padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>🔥</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#78350F" }}>{urgentes.length} urgente{urgentes.length > 1 ? "s" : ""} no radar</div>
                <div style={{ fontSize: 11, color: "#92400E" }}>{urgentes.slice(0, 2).map(t => t.title).join(" · ")}{urgentes.length > 2 ? ` +${urgentes.length - 2}` : ""}</div>
              </div>
              <span style={{ fontSize: 12, color: "#D97706", fontWeight: 600 }}>Ver →</span>
            </div>
          )}
        </div>
      )}

      {/* QUICK STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10 }}>
        {[
          { icon: "🔥", label: "Hoje vencem", value: vencem_hoje.length, color: "#DC2626", bg: "#FEF2F2", action: () => setTab("agenda") },
          { icon: "⏰", label: "Amanhã", value: vencem_amanha.length, color: "#D97706", bg: "#FFFBEB", action: () => setTab("agenda") },
          { icon: "⚡", label: "Em andamento", value: em_andamento.length, color: "#2563EB", bg: "#EFF6FF", action: () => setTab("demandas") },
          { icon: "✅", label: "Concluídas", value: concluidas_semana.length, color: "#059669", bg: "#ECFDF5", action: () => setTab("demandas") },
          { icon: "📋", label: "Total tarefas", value: tasks.length, color: "#475569", bg: "#F8FAFC", action: () => setTab("demandas") },
        ].map(s => (
          <div key={s.label} onClick={s.action} style={{ background: s.bg, borderRadius: 12, padding: "14px 16px", cursor: "pointer", transition: "transform 0.15s", border: `1px solid ${s.bg}` }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = ""}>
            <div style={{ fontSize: 18, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.color, fontWeight: 600, opacity: 0.8 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ATALHOS RAPIDOS */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Atalhos rápidos</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { icon: "📋", label: "Nova demanda", action: () => setTab("demandas"), color: "#1E3A8A" },
            { icon: "📅", label: "Novo conteúdo", action: () => setTab("calendario"), color: "#6366F1" },
            { icon: "🗓", label: "Ver agenda", action: () => setTab("agenda"), color: "#D97706" },
            { icon: "📌", label: "Rotinas", action: () => setTab("fixas"), color: "#059669" },
            { icon: "📊", label: "Relatórios", action: () => setTab("relatorios"), color: "#3B82F6" },
          ].map(a => (
            <button key={a.label} onClick={a.action} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, border: `1.5px solid ${a.color}22`, background: "#fff", color: a.color, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>
              <span style={{ fontSize: 14 }}>{a.icon}</span>{a.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* PROGRESSO POR SETOR */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E2E8F0", padding: "16px 18px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 14 }}>📊 Progresso por setor</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sectorStats.map(sec => (
              <div key={sec.id} onClick={() => setTab("demandas")} style={{ cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "#334155", fontWeight: 500 }}>{sec.icon} {sec.label}</span>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {sec.urgSec > 0 && <span style={{ fontSize: 9, background: "#FEE2E2", color: "#DC2626", padding: "1px 5px", borderRadius: 999, fontWeight: 700 }}>⚡{sec.urgSec}</span>}
                    <span style={{ fontSize: 11, fontWeight: 700, color: sec.color }}>{sec.pct}%</span>
                  </div>
                </div>
                <div style={{ height: 6, background: "#F1F5F9", borderRadius: 999 }}>
                  <div style={{ width: `${sec.pct}%`, height: "100%", background: sec.color, borderRadius: 999, transition: "width 0.5s ease" }} />
                </div>
              </div>
            ))}
            {sectorStats.length === 0 && <div style={{ textAlign: "center", padding: "16px 0", color: "#94A3B8", fontSize: 12 }}>Nenhuma tarefa ainda</div>}
          </div>
        </div>

        {/* DATAS COMEMORATIVAS */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E2E8F0", padding: "16px 18px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 14 }}>🗓 Datas para posts (próximos 30 dias)</div>
          {proximasDatas.length === 0 ? (
            <div style={{ textAlign: "center", padding: "16px 0", color: "#94A3B8", fontSize: 12 }}>Nenhuma data comemorativa nos próximos 30 dias</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 240, overflowY: "auto" }}>
              {proximasDatas.map((d, i) => {
                const ts = TAG_STYLE[d.tag] || TAG_STYLE.conteudo;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ textAlign: "center", minWidth: 36 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#1E293B", lineHeight: 1 }}>{d.dia}</div>
                      <div style={{ fontSize: 9, color: "#94A3B8", textTransform: "uppercase", fontWeight: 600 }}>{d.date.toLocaleDateString("pt-BR", { month: "short" })}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#1E293B" }}>{d.nome}</div>
                      <div style={{ display: "flex", gap: 5, marginTop: 2, alignItems: "center" }}>
                        <span style={{ fontSize: 9, background: ts.bg, color: ts.color, padding: "1px 6px", borderRadius: 999, fontWeight: 600 }}>{d.tag}</span>
                        <span style={{ fontSize: 10, color: d.diasRestantes === 0 ? "#DC2626" : d.diasRestantes <= 3 ? "#D97706" : "#94A3B8", fontWeight: d.diasRestantes <= 3 ? 700 : 400 }}>
                          {d.diasRestantes === 0 ? "hoje!" : d.diasRestantes === 1 ? "amanhã" : `em ${d.diasRestantes} dias`}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => setTab("calendario")} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, border: "1.5px solid #E2E8F0", background: "#F8FAFC", color: "#3B82F6", cursor: "pointer", fontWeight: 600, fontFamily: "inherit", whiteSpace: "nowrap" }}>+ Post</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* DEMANDAS DE HOJE */}
      {vencem_hoje.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #FED7AA", padding: "16px 18px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E", marginBottom: 12 }}>🔥 Vencem hoje</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {vencem_hoje.map(task => {
              const sec = SECTORS.find(s => s.id === task.sector);
              const ss = STATUS_STYLE[task.status] || STATUS_STYLE["A fazer"];
              return (
                <div key={task.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: ss.cardBg, borderRadius: 9, border: `1px solid ${ss.border}`, borderLeft: `3px solid ${ss.accent}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1E293B" }}>{task.title}</div>
                    {sec && <span style={{ fontSize: 10, background: sec.bg, color: sec.color, padding: "1px 6px", borderRadius: 999, fontWeight: 600 }}>{sec.icon} {sec.label}</span>}
                  </div>
                  <Avatar name={task.person} size={26} />
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────
export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [view, setView] = useState("setores");
  const [tab, setTab] = useState("home");
  const [modal, setModal] = useState(null);
  const [filters, setFilters] = useState({ person: "", priority: "", channel: "", status: "", sector: "" });

  const loadTasks = useCallback(async () => {
    const { data } = await supabase.from("tasks").select("*").order("created_at", { ascending: true });
    if (data) setTasks(data);
    setLoadingTasks(false);
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const saveTask = async (form) => {
    const payload = { title: form.title, person: form.person, priority: form.priority, date: form.date || "", channel: form.channel, status: form.status, sector: form.sector, obs: form.obs || "", task_comments: form.task_comments || [], checklist: form.checklist || [] };
    if (form.id) {
      await supabase.from("tasks").update(payload).eq("id", form.id);
    } else {
      await supabase.from("tasks").insert(payload);
    }
    setModal(null);
    loadTasks();
  };

  const deleteTask = async (id) => {
    await supabase.from("tasks").delete().eq("id", id);
    loadTasks();
  };

  const filtered = useMemo(() => tasks.filter(t =>
    (!filters.person || t.person === filters.person) &&
    (!filters.priority || t.priority === filters.priority) &&
    (!filters.channel || t.channel === filters.channel) &&
    (!filters.status || t.status === filters.status) &&
    (!filters.sector || t.sector === filters.sector)
  ), [tasks, filters]);

  const stats = useMemo(() => STATUSES.map(s => ({ label: s, count: tasks.filter(t => t.status === s).length, ...STATUS_STYLE[s] })), [tasks]);
  const fmtDate = d => d ? new Date(d + "T12:00").toLocaleDateString("pt-BR") : "—";
  const TABS = [["home", "🏠 Início"], ["planner", "⚡ Planner"], ["demandas", "📋 Demandas"], ["agenda", "🗓 Agenda"], ["fixas", "📌 Rotinas"], ["parcerias", "🤝 Parcerias"], ["calendario", "📅 Calendário"], ["instagram", "📸 Instagram"], ["relatorios", "📊 Relatórios"]];

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans','Segoe UI',sans-serif", color: "#1E293B" }}>

      {/* HEADER */}
      <div style={{ background: "linear-gradient(135deg,#0F172A 0%,#1E3A8A 65%,#2563EB 100%)", padding: "22px 28px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 10, color: "#93C5FD", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 3 }}>Mikaeli Scudeler Advogada</div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#fff" }}>Dashboard de Marketing</h1>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "#93C5FD" }}>{tasks.length} demandas · {SECTORS.length} setores · Gabi · Julia · Mikaeli</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {PEOPLE.map(p => <Avatar key={p} name={p} size={34} />)}
            {(tab === "demandas" || tab === "home") && <button onClick={() => { setModal(emptyTask()); setTab("demandas"); }} style={{ background: "rgba(255,255,255,0.14)", backdropFilter: "blur(8px)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.25)", padding: "8px 16px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6, marginLeft: 8, fontFamily: "inherit" }}>+ Nova Demanda</button>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
          {stats.map(s => <div key={s.label} onClick={() => { setTab("demandas"); setFilters(f => ({ ...f, status: f.status === s.label ? "" : s.label })); }} style={{ background: filters.status === s.label ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.09)", borderRadius: "8px 8px 0 0", padding: "8px 16px", minWidth: 90, cursor: "pointer", borderTop: `2.5px solid ${s.accent}`, transition: "background 0.15s", flexShrink: 0 }}><div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>{s.count}</div><div style={{ fontSize: 9, color: "#BAE6FD", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>{s.label}</div></div>)}
        </div>
        <div style={{ display: "flex", marginTop: 10 }}>
          {TABS.map(([k, l]) => <button key={k} onClick={() => setTab(k)} style={{ padding: "8px 20px", background: tab === k ? "#fff" : "transparent", color: tab === k ? "#1E3A8A" : "rgba(255,255,255,0.65)", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, borderRadius: "8px 8px 0 0", transition: "all 0.15s", fontFamily: "inherit" }}>{l}</button>)}
        </div>
      </div>

      <div style={{ padding: "22px 28px" }}>
        {tab === "demandas" && (
          <>
            <AIIntake onTaskCreated={form => setModal({ ...form, id: null })} />
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", padding: "10px 14px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 18 }}>
              <div style={{ display: "flex", gap: 3, background: "#F1F5F9", borderRadius: 7, padding: 3 }}>
                {[["setores", "🗂 Setores"], ["kanban", "⬛ Kanban"], ["lista", "☰ Lista"]].map(([v, l]) => <button key={v} onClick={() => setView(v)} style={{ padding: "4px 12px", borderRadius: 5, border: "none", background: view === v ? "#fff" : "transparent", color: view === v ? "#1E3A8A" : "#64748B", fontWeight: view === v ? 700 : 500, fontSize: 12, cursor: "pointer", boxShadow: view === v ? "0 1px 3px rgba(0,0,0,0.08)" : "none", fontFamily: "inherit" }}>{l}</button>)}
              </div>
              {[["sector", "Setor", SECTORS.map(s => ({ val: s.id, label: `${s.icon} ${s.label}` }))], ["person", "Pessoa", PEOPLE.map(p => ({ val: p, label: p }))], ["priority", "Prioridade", PRIORITIES.map(p => ({ val: p, label: p }))], ["channel", "Canal", CHANNELS.map(c => ({ val: c, label: c }))]].map(([k, lb, opts]) => (
                <select key={k} value={filters[k]} onChange={e => setFilters(f => ({ ...f, [k]: e.target.value }))} style={{ padding: "5px 8px", borderRadius: 7, border: `1.5px solid ${filters[k] ? "#3B82F6" : "#E2E8F0"}`, fontSize: 12, color: filters[k] ? "#1E3A8A" : "#64748B", background: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
                  <option value="">Todos — {lb}</option>
                  {opts.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                </select>
              ))}
              {Object.values(filters).some(Boolean) && <button onClick={() => setFilters({ person: "", priority: "", channel: "", status: "", sector: "" })} style={{ fontSize: 11, color: "#EF4444", background: "#FEE2E2", border: "none", padding: "4px 10px", borderRadius: 999, cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>✕ Limpar</button>}
              <span style={{ marginLeft: "auto", fontSize: 11, color: "#94A3B8" }}>{filtered.length} demanda{filtered.length !== 1 ? "s" : ""}</span>
            </div>

            {loadingTasks ? (
              <div style={{ textAlign: "center", padding: 60, color: "#94A3B8", fontSize: 14 }}>⏳ Carregando demandas...</div>
            ) : (
              <>
                {view === "setores" && <SetoresView tasks={filtered} onEdit={setModal} onDelete={deleteTask} onNewTask={sid => setModal({ ...emptyTask(), sector: sid })} />}
                {view === "kanban" && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 16 }}>
                    {STATUSES.map(status => { const col = filtered.filter(t => t.status === status); const s = STATUS_STYLE[status]; return (<div key={status}><div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: s.accent, display: "inline-block" }} /><span style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", flex: 1 }}>{status}</span><span style={{ background: s.bg, color: s.text, borderRadius: 999, fontSize: 10, fontWeight: 700, padding: "1px 7px" }}>{col.length}</span></div><div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 60 }}>{col.map(t => <KCard key={t.id} task={t} onEdit={setModal} onDelete={deleteTask} />)}{col.length === 0 && <div style={{ border: "1.5px dashed #E2E8F0", borderRadius: 10, padding: 18, textAlign: "center", color: "#CBD5E1", fontSize: 12 }}>Vazio</div>}</div></div>); })}
                  </div>
                )}
                {view === "lista" && (
                  <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", overflow: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead><tr style={{ background: "#F8FAFC", borderBottom: "1.5px solid #E2E8F0" }}>{["Demanda", "Setor", "Responsável", "Prioridade", "Canal", "Status", "Data", ""].map(h => <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
                      <tbody>
                        {filtered.map((t, i) => { const ov = t.date && new Date(t.date) < new Date() && t.status !== "Concluído"; const s = STATUS_STYLE[t.status]; const sec = SECTORS.find(x => x.id === t.sector); return (<tr key={t.id} style={{ borderBottom: "1px solid #F1F5F9", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}><td style={{ padding: "10px 12px", fontWeight: 600, color: "#1E293B", maxWidth: 200 }}>{t.title}</td><td style={{ padding: "10px 12px" }}>{sec && <span style={{ fontSize: 11, background: sec.bg, color: sec.color, padding: "2px 8px", borderRadius: 999, fontWeight: 600, whiteSpace: "nowrap" }}>{sec.icon} {sec.label}</span>}</td><td style={{ padding: "10px 12px" }}><div style={{ display: "flex", alignItems: "center", gap: 6 }}><Avatar name={t.person} size={22} /><span style={{ fontSize: 12 }}>{t.person}</span></div></td><td style={{ padding: "10px 12px" }}><PBadge p={t.priority} /></td><td style={{ padding: "10px 12px", fontSize: 12, color: "#475569", whiteSpace: "nowrap" }}>{CHANNEL_ICONS[t.channel]} {t.channel}</td><td style={{ padding: "10px 12px" }}><span style={{ background: s.bg, color: s.text, padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600, borderLeft: `3px solid ${s.accent}`, whiteSpace: "nowrap" }}>{t.status}</span></td><td style={{ padding: "10px 12px", fontSize: 12, color: ov ? "#DC2626" : "#64748B", fontWeight: ov ? 700 : 400, whiteSpace: "nowrap" }}>{ov ? "⚠ " : ""}{fmtDate(t.date)}</td><td style={{ padding: "10px 8px" }}><div style={{ display: "flex", gap: 2 }}><button onClick={() => setModal(t)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12 }}>✏️</button><button onClick={() => deleteTask(t.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12 }}>🗑</button></div></td></tr>); })}
                        {filtered.length === 0 && <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>Nenhuma demanda encontrada</td></tr>}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </>
        )}
        {tab === "home" && <HomePage tasks={tasks} setTab={setTab} />}
        {tab === "agenda" && <AgendaPage tasks={tasks} />}
        {tab === "fixas" && <FixasPage />}
        {tab === "planner" && <PlannerPage tasks={tasks} />}
        {tab === "parcerias" && <ParceriasPage />}
        {tab === "calendario" && <CalendarioPage />}
        {tab === "instagram" && <InstaPanel onCreateTask={task => { saveTask({ ...task, id: null }); setTab("demandas"); }} />}
        {tab === "relatorios" && <ReportsPage />}
      </div>
      {modal && <TaskModal task={modal} onSave={saveTask} onClose={() => setModal(null)} />}
    </div>
  );
}
