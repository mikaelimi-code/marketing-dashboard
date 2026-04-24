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
  "A fazer":              { bg: "#F1F5F9", accent: "#94A3B8", text: "#475569" },
  "Em andamento":         { bg: "#DBEAFE", accent: "#3B82F6", text: "#1D4ED8" },
  "Aguardando aprovação": { bg: "#FEF3C7", accent: "#F59E0B", text: "#92400E" },
  "Concluído":            { bg: "#D1FAE5", accent: "#10B981", text: "#065F46" },
  "Pausado":              { bg: "#FEE2E2", accent: "#F87171", text: "#991B1B" },
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
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const I = { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #E2E8F0", fontSize: 13, color: "#1E293B", background: "#F8FAFC", outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
  const L = { fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, display: "block" };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 520, maxWidth: "95vw", boxShadow: "0 24px 60px rgba(15,23,42,0.2)", maxHeight: "92vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0F172A" }}>{form.id ? "✏️ Editar Demanda" : "✨ Nova Demanda"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: "#94A3B8", cursor: "pointer" }}>✕</button>
        </div>
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
        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 8, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Cancelar</button>
          <button onClick={() => form.title.trim() && onSave(form)} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#1E3A8A,#3B82F6)", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>Salvar</button>
        </div>
      </div>
    </div>
  );
}

// ── AI INTAKE ─────────────────────────────────────────────────────────────────
function AIIntake({ onTaskCreated }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const interpret = async () => {
    if (!text.trim()) return;
    setLoading(true); setError(""); setPreview(null);
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 800, system: `Extraia dados de demanda e retorne APENAS JSON com: title,person("Gabi"|"Julia"|"Mikaeli"),priority("Urgente"|"Alta"|"Normal"|"Baixa"),date("YYYY-MM-DD"|""),channel("Instagram"|"YouTube"|"TikTok"|"WhatsApp"|"Site"|"Interno"),status("A fazer"|"Em andamento"|"Aguardando aprovação"|"Concluído"|"Pausado"),sector("imersao"|"redes"|"conteudo"|"parcerias"|"performance"|"interno"),obs. Escritório Mikaeli Scudeler — previdência internacional e vistos para Espanha.`, messages: [{ role: "user", content: text }] }) });
      const data = await resp.json();
      const raw = data.content?.find(b => b.type === "text")?.text || "";
      setPreview(JSON.parse(raw.replace(/```json|```/g, "").trim()));
    } catch { setError("Não foi possível interpretar."); }
    setLoading(false);
  };
  const sec = preview ? SECTORS.find(s => s.id === preview.sector) : null;
  return (
    <div style={{ background: "linear-gradient(135deg,#EFF6FF,#DBEAFE)", borderRadius: 14, padding: 20, border: "1.5px solid #BFDBFE", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#1E3A8A,#3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>✨</div>
        <div><div style={{ fontSize: 14, fontWeight: 700, color: "#1E3A8A" }}>Funil Inteligente de Demandas</div><div style={{ fontSize: 11, color: "#3B82F6" }}>Descreva em linguagem natural — a IA organiza automaticamente</div></div>
      </div>
      <textarea value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && e.metaKey && interpret()} placeholder={'Ex: "Reels urgente para Instagram sobre vistos, Julia cuida, entregar sexta"'} style={{ width: "100%", minHeight: 76, padding: "10px 14px", borderRadius: 10, border: "1.5px solid #BFDBFE", fontSize: 13, color: "#1E293B", background: "#fff", resize: "none", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
      <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "center" }}>
        <button onClick={interpret} disabled={loading || !text.trim()} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: text.trim() ? "linear-gradient(135deg,#1E3A8A,#3B82F6)" : "#CBD5E1", color: "#fff", cursor: text.trim() ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>{loading ? "⏳ Interpretando..." : "✨ Interpretar com IA"}</button>
        <span style={{ fontSize: 11, color: "#94A3B8" }}>⌘+Enter</span>
        {error && <span style={{ fontSize: 11, color: "#DC2626" }}>⚠ {error}</span>}
      </div>
      {preview && (
        <div style={{ marginTop: 14, background: "#fff", borderRadius: 10, padding: 14, border: "1.5px solid #93C5FD" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", marginBottom: 10, textTransform: "uppercase" }}>✅ Confirme a demanda:</div>
          {sec && <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: sec.bg, color: sec.color, padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700, marginBottom: 10 }}>{sec.icon} {sec.label}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            {[["Título", preview.title], ["Responsável", preview.person], ["Prioridade", preview.priority], ["Canal", `${CHANNEL_ICONS[preview.channel] || ""} ${preview.channel}`], ["Status", preview.status], ["Data", preview.date || "Não definida"]].map(([k, v]) => (
              <div key={k} style={{ fontSize: 12 }}><span style={{ color: "#94A3B8", fontWeight: 600 }}>{k}: </span><span style={{ color: "#1E293B", fontWeight: 600 }}>{v}</span></div>
            ))}
          </div>
          {preview.obs && <div style={{ fontSize: 12, color: "#64748B", marginBottom: 10 }}><strong>Obs:</strong> {preview.obs}</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { onTaskCreated({ ...preview, id: null }); setText(""); setPreview(null); }} style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#1E3A8A,#3B82F6)", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Confirmar ✓</button>
            <button onClick={() => setPreview(null)} style={{ padding: "7px 14px", borderRadius: 8, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Descartar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── KANBAN CARD ───────────────────────────────────────────────────────────────
function KCard({ task, onEdit, onDelete }) {
  const fmt = d => d ? new Date(d + "T12:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : null;
  const over = task.date && new Date(task.date) < new Date() && task.status !== "Concluído";
  const sec = SECTORS.find(s => s.id === task.sector);
  return (
    <div style={{ background: "#fff", borderRadius: 10, padding: "12px 14px", boxShadow: "0 1px 4px rgba(15,23,42,0.07)", borderLeft: `3px solid ${PRIORITY_STYLE[task.priority].dot}`, transition: "all 0.15s" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(15,23,42,0.11)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 1px 4px rgba(15,23,42,0.07)"; }}>
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
      {task.obs && <p style={{ margin: "8px 0 0", fontSize: 11, color: "#94A3B8", fontStyle: "italic", borderTop: "1px solid #F1F5F9", paddingTop: 6 }}>{task.obs.length > 55 ? task.obs.slice(0, 55) + "…" : task.obs}</p>}
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
function InstaPanel({ onCreateTask }) {
  const [posts, setPosts] = useState(DEMO_POSTS);
  const [token, setToken] = useState(""); const [mode, setMode] = useState("demo"); const [loading, setLoad] = useState(false); const [exp, setExp] = useState(null);
  const sorted = [...posts].sort((a, b) => b.comments.filter(c => !c.answered).length - a.comments.filter(c => !c.answered).length);
  const fetchReal = async () => { if (!token.trim()) return; setLoad(true); try { const r = await fetch(`https://graph.instagram.com/me/media?fields=id,caption,media_type,timestamp&access_token=${token}`); const d = await r.json(); if (d.error) throw new Error(d.error.message); const en = await Promise.all(d.data.slice(0, 6).map(async p => { const cr = await fetch(`https://graph.instagram.com/${p.id}/comments?fields=id,text,timestamp,username&access_token=${token}`); const cd = await cr.json(); return { id: p.id, caption: p.caption || "", timestamp: p.timestamp?.split("T")[0], media_type: p.media_type, comments: (cd.data || []).map(c => ({ ...c, answered: false })) }; })); setPosts(en); setMode("real"); } catch (e) { alert("Erro: " + e.message); } setLoad(false); };
  const tog = (pid, cid) => setPosts(ps => ps.map(p => p.id !== pid ? p : { ...p, comments: p.comments.map(c => c.id !== cid ? c : { ...c, answered: !c.answered }) }));
  const mIcon = t => t === "VIDEO" ? "🎥" : t === "CAROUSEL_ALBUM" ? "🖼️" : "📷";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div><h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1E293B" }}>📸 Monitoramento de Comentários</h3><p style={{ margin: "3px 0 0", fontSize: 12, color: "#64748B" }}>{mode === "demo" ? "Modo demonstração · dados fictícios" : "✅ Conta real conectada"}</p></div>
        <button onClick={() => setMode(m => m === "setup" ? "demo" : "setup")} style={{ fontSize: 12, padding: "7px 14px", borderRadius: 8, border: "1.5px solid #E2E8F0", background: mode === "real" ? "#D1FAE5" : "#fff", color: mode === "real" ? "#059669" : "#3B82F6", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>{mode === "real" ? "✅ Conectado" : "🔗 Conectar conta real"}</button>
      </div>
      {mode === "setup" && <div style={{ background: "#FFF7ED", border: "1.5px solid #FED7AA", borderRadius: 12, padding: 16, marginBottom: 16 }}><div style={{ fontSize: 13, fontWeight: 700, color: "#92400E", marginBottom: 6 }}>🔐 Conectar Instagram Business</div><p style={{ margin: "0 0 10px", fontSize: 12, color: "#78350F", lineHeight: 1.6 }}>Acesse <strong>developers.facebook.com → Graph API Explorer</strong>, gere token com <code>instagram_basic</code> e <code>instagram_manage_comments</code>.</p><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><input value={token} onChange={e => setToken(e.target.value)} placeholder="EAABw0xyz..." style={{ flex: 1, minWidth: 200, padding: "7px 10px", borderRadius: 8, border: "1.5px solid #FCD34D", fontSize: 12, fontFamily: "monospace", outline: "none" }} /><button onClick={fetchReal} disabled={loading} style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: "#F59E0B", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>{loading ? "⏳" : "Conectar"}</button><button onClick={() => setMode("demo")} style={{ padding: "7px 12px", borderRadius: 8, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button></div></div>}
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

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────
export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [view, setView] = useState("setores");
  const [tab, setTab] = useState("demandas");
  const [modal, setModal] = useState(null);
  const [filters, setFilters] = useState({ person: "", priority: "", channel: "", status: "", sector: "" });

  const loadTasks = useCallback(async () => {
    const { data } = await supabase.from("tasks").select("*").order("created_at", { ascending: true });
    if (data) setTasks(data);
    setLoadingTasks(false);
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const saveTask = async (form) => {
    const payload = { title: form.title, person: form.person, priority: form.priority, date: form.date || "", channel: form.channel, status: form.status, sector: form.sector, obs: form.obs || "" };
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
  const TABS = [["demandas", "📋 Demandas"], ["instagram", "📸 Instagram"], ["relatorios", "📊 Relatórios"]];

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
            {tab === "demandas" && <button onClick={() => setModal(emptyTask())} style={{ background: "rgba(255,255,255,0.14)", backdropFilter: "blur(8px)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.25)", padding: "8px 16px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6, marginLeft: 8, fontFamily: "inherit" }}>+ Nova Demanda</button>}
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
        {tab === "instagram" && <InstaPanel onCreateTask={task => { saveTask({ ...task, id: null }); setTab("demandas"); }} />}
        {tab === "relatorios" && <ReportsPage />}
      </div>
      {modal && <TaskModal task={modal} onSave={saveTask} onClose={() => setModal(null)} />}
    </div>
  );
}
