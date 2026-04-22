/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Check, X, Search, ShieldCheck, User, Users, Bell,
  Settings, Smartphone, LayoutDashboard, Calendar, ShoppingCart,
  ChefHat, Sparkles, Box, ListChecks, ChevronRight, AlertCircle, PlayCircle, Lock, Globe, Monitor, Mail, Eye,
  Home, Refrigerator, Clock, AlertTriangle, BarChart3, Moon, Plus, TrendingDown, ChevronDown,
  Package, Timer, Star, Trash2, CheckCircle2,
  ArrowRight, Menu, Quote, Zap, Shield, Heart
} from "lucide-react";

import LogoImage from "@/assets/logo inicial black pagina de vendas.svg";

// ═══════════════════════════════════════════════
// PUSH NOTIFICATION SYSTEM
// ═══════════════════════════════════════════════

const pushNotifications = [
  { id: 1, icon: "⚠️", title: "Validade Próxima", body: "Iogurte Natural vence amanhã", color: "#F59E0B", time: "agora" },
  { id: 2, icon: "🛒", title: "Lista de Compras", body: "3 itens adicionados automaticamente", color: "#2D6A4F", time: "2min" },
  { id: 3, icon: "🍳", title: "Sugestão de Receita", body: "Bolo de Iogurte — use antes que vença!", color: "#52B788", time: "5min" },
  { id: 4, icon: "📦", title: "Estoque Baixo", body: "Sabão em pó está acabando (2 dias)", color: "#EF4444", time: "8min" },
  { id: 5, icon: "🌙", title: "Check-up Noturno", body: "Revise 4 itens antes de dormir", color: "#2D6A4F", time: "12min" },
  { id: 6, icon: "👥", title: "MultiPRO", body: "Lucas marcou 2 itens como comprados", color: "#2D6A4F", time: "15min" },
  { id: 7, icon: "🔔", title: "Lembrete Semanal", body: "Relatório mensal disponível", color: "#F97316", time: "20min" },
];

function PushNotificationOverlay({ show, notification }: { show: boolean; notification: typeof pushNotifications[0] }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -80, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -80, opacity: 0, scale: 0.85 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="absolute top-2 left-2 right-2 z-[100]"
        >
          <div
            className="rounded-2xl p-3 flex items-start gap-3 shadow-2xl border border-white/20"
            style={{
              background: 'rgba(250,248,244,0.97)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.18)'
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
              style={{ background: `${notification.color}18` }}
            >
              {notification.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-[11px] font-bold text-gray-800 uppercase tracking-wide">KAZA</p>
                <p className="text-[9px] text-gray-400 font-medium">{notification.time}</p>
              </div>
              <p className="text-[12px] font-bold text-gray-900 leading-snug">{notification.title}</p>
              <p className="text-[10px] text-gray-500 leading-snug mt-0.5">{notification.body}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════
// DEMO TABS — Full app rendered (no login)
// ═══════════════════════════════════════════════

const DemoHome = () => {
  return (
    <div className="flex flex-col h-full bg-[#fafafa] overflow-y-auto hide-scrollbar">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 rounded-b-[1.5rem]" style={{ background: 'linear-gradient(135deg, #0F3D38 0%, #165A52 100%)' }} />
        <div className="absolute inset-0 rounded-b-[1.5rem] bg-black/10" />
        <div className="relative px-4 pt-5 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-sm">👋</span>
                <span className="text-[8px] font-bold text-white/60 bg-white/10 px-1.5 py-0.5 rounded-full">IndividualPRO</span>
              </div>
              <h2 className="text-lg font-bold text-white leading-tight">Boa tarde, Ana</h2>
              <p className="text-[9px] text-white/50 mt-0.5 font-medium">⚠️ 2 item(ns) vencendo hoje!</p>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                <Search className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 relative">
                <Bell className="w-3.5 h-3.5 text-white" />
                <span className="absolute -right-0.5 -top-0.5 w-3.5 h-3.5 rounded-full bg-red-500 text-[7px] font-bold text-white flex items-center justify-center">3</span>
              </div>
            </div>
          </div>
          {/* Action cards */}
          <div className="grid grid-cols-3 gap-1.5 mt-3">
            {[
              { icon: BarChart3, label: "Relatório Mensal", bg: "rgba(22,90,82,0.25)" },
              { icon: Moon, label: "Check-up Noturno", bg: "rgba(99,102,241,0.20)" },
              { icon: Plus, label: "Adicionar Item", bg: "rgba(22,90,82,0.30)" },
            ].map((card, i) => (
              <div key={i} className="rounded-xl p-2 text-left" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="mb-1 w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: card.bg }}>
                  <card.icon className="w-3 h-3 text-white" />
                </div>
                <p className="text-[8px] font-semibold text-white leading-snug">{card.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-1.5 px-3 mt-3">
        {[
          { value: "24", label: "Geladeira", color: "#3B82F6", bg: "#EFF6FF" },
          { value: "2", label: "Vencendo", color: "#F59E0B", bg: "#FFFBEB" },
          { value: "3", label: "Alertas", color: "#EF4444", bg: "#FEF2F2" },
          { value: "7", label: "Comprar", color: "#10B981", bg: "#ECFDF5" },
        ].map((stat, i) => (
          <div key={i} className="flex flex-col items-center rounded-xl p-2 border" style={{ background: stat.bg, borderColor: `${stat.color}15` }}>
            <span className="text-sm font-bold leading-none" style={{ color: stat.color }}>{stat.value}</span>
            <span className="text-[7px] mt-0.5 font-medium text-gray-500">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Weekly Progress */}
      <div className="mx-3 mt-2.5 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
        <p className="text-[10px] font-bold text-gray-800 mb-2">Progresso da semana</p>
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 shrink-0">
            <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" strokeWidth="3" stroke="#E5E7EB" />
              <circle cx="18" cy="18" r="14" fill="none" strokeWidth="3" stroke="#10B981" strokeDasharray="78 22" strokeLinecap="round" />
              <circle cx="18" cy="18" r="14" fill="none" strokeWidth="3" stroke="#F87171" strokeDasharray="8 92" strokeDashoffset="-78" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[8px] font-bold text-gray-800">78%</span>
            </div>
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[8px] text-gray-500">Consumidos</span>
              </div>
              <span className="text-[9px] font-bold text-gray-800">14</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <span className="text-[8px] text-gray-500">Desperdiçados</span>
              </div>
              <span className="text-[9px] font-bold text-gray-800">4</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tip */}
      <div className="mx-3 mt-2 rounded-xl p-2.5 border border-amber-200/50" style={{ background: 'rgba(255,251,235,0.8)' }}>
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.15)' }}>
            <span className="text-[10px]">💡</span>
          </div>
          <div>
            <p className="text-[7px] font-bold text-amber-600/60 uppercase tracking-wider">Dica do dia</p>
            <p className="text-[10px] font-semibold text-gray-800 leading-snug">Bolo de Iogurte</p>
            <p className="text-[8px] text-gray-500 mt-0.5">Use o iogurte antes que vença</p>
          </div>
        </div>
      </div>

      {/* Consumables Low */}
      <div className="px-3 mt-2.5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <TrendingDown className="w-3 h-3 text-red-500" />
          <p className="text-[10px] font-bold text-gray-800">Consumíveis acabando</p>
        </div>
        {[
          { name: "Sabão em Pó", stock: "0.3 kg", days: "2d", emoji: "🧼" },
          { name: "Papel Higiênico", stock: "4 rolos", days: "3d", emoji: "🧻" },
        ].map((c, i) => (
          <div key={i} className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50/50 px-3 py-2 mb-1.5">
            <span className="text-sm">{c.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-semibold text-gray-800">{c.name}</p>
              <p className="text-[7px] text-gray-400">{c.stock} · {c.days}</p>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#2D6A4F]/10">
              <ShoppingCart className="w-2.5 h-2.5 text-[#2D6A4F]" />
              <span className="text-[7px] font-semibold text-[#2D6A4F]">Adicionar</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recently Added */}
      <div className="px-3 mt-2 pb-16">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] font-bold text-gray-800">Adicionados recentemente</p>
          <p className="text-[8px] text-[#2D6A4F] font-medium">Ver todos →</p>
        </div>
        {[
          { name: "Leite Integral", loc: "Geladeira", emoji: "🥛", exp: "3 dias" },
          { name: "Arroz Branco", loc: "Despensa", emoji: "🍚", exp: "6 meses" },
          { name: "Ovos", loc: "Geladeira", emoji: "🥚", exp: "12 dias" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white p-2 mb-1.5 shadow-sm">
            <span className="text-sm">{item.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-semibold text-gray-800 truncate">{item.name}</p>
              <p className="text-[7px] text-gray-400">{item.loc} • {item.exp}</p>
            </div>
            <ChevronRight className="w-3 h-3 text-gray-300" />
          </div>
        ))}
      </div>
    </div>
  );
};

// — FRIDGE/ESTOQUE TAB
const DemoFridge = () => {
  const categories = [
    { name: "Todos", count: 42, active: true },
    { name: "Geladeira", count: 24, active: false },
    { name: "Despensa", count: 12, active: false },
    { name: "Freezer", count: 6, active: false },
  ];

  const items = [
    { name: "Leite Integral", cat: "Laticínios", emoji: "🥛", qty: "2 L", exp: "3 dias", status: "ok" },
    { name: "Iogurte Natural", cat: "Laticínios", emoji: "🥣", qty: "3 un", exp: "1 dia", status: "warning" },
    { name: "Frango", cat: "Carnes", emoji: "🍗", qty: "1 kg", exp: "2 dias", status: "warning" },
    { name: "Arroz Branco", cat: "Grãos", emoji: "🍚", qty: "5 kg", exp: "6 meses", status: "ok" },
    { name: "Tomate", cat: "Hortifruti", emoji: "🍅", qty: "6 un", exp: "5 dias", status: "ok" },
    { name: "Queijo Minas", cat: "Laticínios", emoji: "🧀", qty: "300g", exp: "hoje", status: "danger" },
    { name: "Cebola", cat: "Hortifruti", emoji: "🧅", qty: "4 un", exp: "15 dias", status: "ok" },
  ];

  return (
    <div className="flex flex-col h-full bg-[#fafafa] overflow-y-auto hide-scrollbar">
      <div className="px-4 pt-5 pb-3">
        <h2 className="text-lg font-bold text-gray-800">Estoque</h2>
        <p className="text-[10px] text-gray-500 mt-0.5">42 itens controlados</p>
      </div>
      <div className="px-4 mb-3">
        <div className="flex items-center gap-2 rounded-xl bg-white border border-gray-100 px-3 py-2">
          <Search className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-[10px] text-gray-400">Buscar itens...</span>
        </div>
      </div>
      <div className="px-4 mb-3 flex gap-1.5 overflow-x-auto hide-scrollbar">
        {categories.map((cat, i) => (
          <div key={i} className={`shrink-0 px-2.5 py-1 rounded-full text-[9px] font-semibold border ${cat.active ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]' : 'bg-white text-gray-600 border-gray-200'}`}>
            {cat.name} ({cat.count})
          </div>
        ))}
      </div>
      <div className="px-4 space-y-1.5 pb-16">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-white p-2.5 shadow-sm">
            <span className="text-lg">{item.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-gray-800">{item.name}</p>
              <p className="text-[8px] text-gray-400">{item.cat} • {item.qty}</p>
            </div>
            <div className="text-right">
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${item.status === 'danger' ? 'bg-red-100 text-red-600' :
                item.status === 'warning' ? 'bg-amber-100 text-amber-600' :
                  'bg-emerald-50 text-emerald-600'
                }`}>{item.exp}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// — RECIPES TAB
const DemoRecipes = () => {
  const recipes = [
    { name: "Bolo de Iogurte", time: "45min", diff: "Fácil", match: "92%", emoji: "🍰", highlight: true },
    { name: "Risoto de Queijo", time: "35min", diff: "Médio", match: "85%", emoji: "🍚" },
    { name: "Omelete Especial", time: "15min", diff: "Fácil", match: "100%", emoji: "🍳" },
    { name: "Frango Grelhado", time: "30min", diff: "Fácil", match: "78%", emoji: "🍗" },
    { name: "Salada César", time: "20min", diff: "Fácil", match: "70%", emoji: "🥗" },
  ];

  return (
    <div className="flex flex-col h-full bg-[#fafafa] overflow-y-auto hide-scrollbar">
      <div className="px-4 pt-5 pb-3">
        <h2 className="text-lg font-bold text-gray-800">Receitas</h2>
        <p className="text-[10px] text-gray-500 mt-0.5">Sugestões baseadas no seu estoque</p>
      </div>
      <div className="mx-4 mb-3 rounded-xl p-3 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #1B3A2D 100%)' }}>
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full blur-xl -translate-y-4 translate-x-4" />
        <div className="relative flex items-center gap-2.5">
          <span className="text-2xl">🍳</span>
          <div>
            <p className="text-[8px] font-bold text-white/60 uppercase tracking-wider">Use antes que vença</p>
            <p className="text-[11px] font-bold text-white">Omelete com Queijo Minas</p>
            <p className="text-[8px] text-white/50 mt-0.5">100% dos ingredientes em casa</p>
          </div>
        </div>
      </div>
      <div className="px-4 mb-3">
        <div className="flex items-center gap-2 rounded-xl bg-white border border-gray-100 px-3 py-2">
          <Search className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-[10px] text-gray-400">Buscar receitas...</span>
        </div>
      </div>
      <div className="px-4 space-y-2 pb-16">
        {recipes.map((recipe, i) => (
          <div key={i} className={`flex items-center gap-2.5 rounded-xl border p-2.5 shadow-sm ${recipe.highlight ? 'border-emerald-200 bg-emerald-50/50' : 'border-gray-100 bg-white'}`}>
            <span className="text-xl">{recipe.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-gray-800">{recipe.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[7px] text-gray-400 flex items-center gap-0.5"><Timer className="w-2 h-2" /> {recipe.time}</span>
                <span className="text-[7px] text-gray-400">• {recipe.diff}</span>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-[9px] font-bold ${parseInt(recipe.match) >= 90 ? 'text-[#2D6A4F]' : 'text-gray-500'}`}>{recipe.match}</span>
              <p className="text-[6px] text-gray-400">match</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// — SHOPPING TAB
const DemoShopping = () => {
  const [checked, setChecked] = useState<number[]>([0]);

  const items = [
    { name: "Leite Integral", qty: "3 caixas", cat: "Laticínios", emoji: "🥛" },
    { name: "Ovos", qty: "1 dúzia", cat: "Proteínas", emoji: "🥚" },
    { name: "Detergente Neutro", qty: "2 un", cat: "Limpeza", emoji: "🧴" },
    { name: "Sabão em Pó", qty: "1 kg", cat: "Limpeza", emoji: "🧼" },
    { name: "Papel Higiênico", qty: "12 rolos", cat: "Higiene", emoji: "🧻" },
    { name: "Tomate", qty: "6 un", cat: "Hortifruti", emoji: "🍅" },
    { name: "Banana", qty: "1 cacho", cat: "Frutas", emoji: "🍌" },
  ];

  return (
    <div className="flex flex-col h-full bg-[#fafafa] overflow-y-auto hide-scrollbar">
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Lista de Compras</h2>
          <p className="text-[10px] text-gray-500 mt-0.5">{items.length} itens • {checked.length} comprado(s)</p>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span className="text-[8px] font-semibold text-emerald-600">Guardar</span>
        </div>
      </div>
      <div className="mx-4 mb-3 rounded-xl p-2.5 flex items-center gap-2 bg-amber-50 border border-amber-200/60">
        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <p className="text-[9px] font-bold text-amber-700">Repor Sabão em Pó e Papel Higiênico hoje.</p>
      </div>
      <div className="px-4 space-y-1.5 pb-16">
        {items.map((item, i) => {
          const isChecked = checked.includes(i);
          return (
            <div
              key={i}
              onClick={() => setChecked(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}
              className={`flex items-center gap-2.5 rounded-xl border p-2.5 transition-all cursor-pointer ${isChecked ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-100 shadow-sm'}`}
            >
              <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all ${isChecked ? 'bg-[#2D6A4F] border-[#2D6A4F]' : 'border-gray-300'}`}>
                {isChecked && <Check className="w-2.5 h-2.5 text-white" />}
              </div>
              <span className="text-sm">{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-[10px] font-semibold ${isChecked ? 'line-through text-gray-400' : 'text-gray-800'}`}>{item.name}</p>
                <p className="text-[8px] text-gray-400">{item.qty} • {item.cat}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// — SETTINGS TAB  
const DemoSettings = () => {
  return (
    <div className="flex flex-col h-full bg-[#fafafa] overflow-y-auto hide-scrollbar">
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white font-bold text-lg shadow-sm">A</div>
          <div>
            <h2 className="text-base font-bold text-gray-800">Ana Silva</h2>
            <p className="text-[10px] text-gray-500">ana.silva@email.com</p>
          </div>
        </div>
      </div>
      <div className="mx-4 mb-3 rounded-xl p-3 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #1B3A2D 100%)' }}>
        <div>
          <p className="text-[8px] font-bold text-white/60 uppercase tracking-wider">Plano atual</p>
          <p className="text-[12px] font-bold text-white">IndividualPRO</p>
        </div>
        <span className="text-[8px] font-bold text-white bg-white/20 px-2 py-0.5 rounded-full">Ativo</span>
      </div>
      <div className="px-4 space-y-1.5 pb-16">
        {[
          { icon: User, label: "Dados Pessoais", sub: "Nome, email e foto" },
          { icon: Bell, label: "Notificações", sub: "Alertas, lembretes e sons" },
          { icon: Globe, label: "Idioma", sub: "Português (BR)" },
          { icon: Smartphone, label: "Instalar App", sub: "Adicionar à tela inicial" },
          { icon: ShieldCheck, label: "Privacidade", sub: "Dados e segurança" },
          { icon: AlertCircle, label: "Sobre o KAZA", sub: "Versão 2.4.1" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
              <item.icon className="w-4 h-4 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-gray-800">{item.label}</p>
              <p className="text-[8px] text-gray-400">{item.sub}</p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
          </div>
        ))}
      </div>
    </div>
  );
};


// ═══════════════════════════════════════════════
// INTERACTIVE DEMO PHONE
// ═══════════════════════════════════════════════

const InteractiveDemoPhone = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [showNotif, setShowNotif] = useState(false);
  const [currentNotif, setCurrentNotif] = useState(0);
  const notifCycle = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let idx = 0;
    const cycle = () => {
      setCurrentNotif(idx);
      setShowNotif(true);
      setTimeout(() => setShowNotif(false), 3200);
      idx = (idx + 1) % pushNotifications.length;
    };
    const initial = setTimeout(cycle, 2000);
    notifCycle.current = setInterval(cycle, 6500);
    return () => {
      clearTimeout(initial);
      if (notifCycle.current) clearInterval(notifCycle.current);
    };
  }, []);

  const tabs = [
    { id: "home", icon: Home, label: "Início" },
    { id: "fridge", icon: Refrigerator, label: "Estoque" },
    { id: "recipes", icon: ChefHat, label: "Receitas" },
    { id: "shopping", icon: ShoppingCart, label: "Lista" },
    { id: "settings", icon: Settings, label: "Perfil" },
  ];

  return (
    <div className="relative w-[340px] shrink-0 h-[640px] lg:h-[680px] rounded-[2.8rem] border-[7px] border-[#1A1A1A] shadow-[0_30px_80px_-15px_rgba(0,0,0,0.5)] overflow-hidden bg-[#fafafa]">
      <div className="w-[90px] h-6 bg-[#1A1A1A] absolute top-1.5 left-1/2 -translate-x-1/2 rounded-full z-50 flex items-center justify-end px-2.5">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-900 border border-blue-800/50"></div>
      </div>
      <PushNotificationOverlay show={showNotif} notification={pushNotifications[currentNotif]} />
      <div className="w-full h-full relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="w-full h-full"
          >
            {activeTab === "home" && <DemoHome />}
            {activeTab === "fridge" && <DemoFridge />}
            {activeTab === "recipes" && <DemoRecipes />}
            {activeTab === "shopping" && <DemoShopping />}
            {activeTab === "settings" && <DemoSettings />}
          </motion.div>
        </AnimatePresence>
        <div className="absolute bottom-0 left-0 right-0 z-40">
          <div
            className="mx-2 mb-2 rounded-2xl flex items-center justify-around h-[52px] border"
            style={{ background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(24px)', borderColor: 'rgba(0,0,0,0.05)', boxShadow: '0 -2px 20px rgba(0,0,0,0.06)' }}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex flex-col items-center gap-0.5 flex-1 py-1 outline-none"
                >
                  <div className={`relative flex items-center justify-center w-7 h-7 rounded-xl transition-all ${isActive ? 'bg-[#2D6A4F]/12' : ''}`}>
                    <tab.icon className={`w-[16px] h-[16px] transition-colors ${isActive ? 'text-[#2D6A4F]' : 'text-gray-400'}`} />
                  </div>
                  <span className={`text-[8px] transition-all ${isActive ? 'text-[#2D6A4F] font-semibold' : 'text-gray-400'}`}>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div
          className="absolute bottom-[68px] right-3 z-40 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ background: '#2D6A4F', boxShadow: '0 4px 20px rgba(45,106,79,0.35)' }}
        >
          <Plus className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
};


// ═══════════════════════════════════════════════
// ANIMATED SECTION WRAPPER
// ═══════════════════════════════════════════════

function FadeInSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}


// ═══════════════════════════════════════════════
const TRUSTED_FEATURES = [
  { icon: Refrigerator, label: "Controle de Dispensa" },
  { icon: AlertTriangle, label: "Monitoramento dos itens e do vencimento" },
  { icon: ChefHat, label: "Receitas baseadas nos seus itens" },
  { icon: Bell, label: "Notificações multi-usuário" },
  { icon: TrendingDown, label: "Relatório de economia mensal" },
  { icon: Trash2, label: "Controle de Lixo" },
];

// ═══════════════════════════════════════════════
// SCROLL-AWARE HEADER HOOK
// ═══════════════════════════════════════════════

function useScrollDirection() {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        // Always show when near top
        if (currentScrollY < 80) {
          setIsVisible(true);
        } else if (currentScrollY > lastScrollY.current + 5) {
          // Scrolling down
          setIsVisible(false);
        } else if (currentScrollY < lastScrollY.current - 5) {
          // Scrolling up
          setIsVisible(true);
        }
        lastScrollY.current = currentScrollY;
        ticking.current = false;
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return isVisible;
}

// ═══════════════════════════════════════════════
// POLICY MODAL COMPONENT
// ═══════════════════════════════════════════════

function PolicyModal({ isOpen, onClose, title, content }: { isOpen: boolean, onClose: () => void, title: string, content: React.ReactNode }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           className="fixed inset-0 z-[100] flex justify-center items-center p-4 sm:p-6"
        >
           <div className="absolute inset-0 bg-[#0A1F18]/80 backdrop-blur-md" onClick={onClose} />
           
           <motion.div 
             initial={{ opacity: 0, scale: 0.95, y: 20 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             exit={{ opacity: 0, scale: 0.95, y: 20 }}
             className="relative w-full max-w-3xl max-h-[85vh] bg-[#FAF8F4] overflow-hidden rounded-[2.5rem] shadow-2xl flex flex-col"
           >
             <div className="flex items-center justify-between p-6 sm:p-8 border-b border-gray-200/60 bg-white">
               <h2 className="text-2xl sm:text-3xl font-black text-[#1B3A2D] font-display" style={{ fontFamily: 'Instrument Serif' }}>{title}</h2>
               <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-[#1B3A2D] transition-colors">
                 <X className="w-5 h-5" />
               </button>
             </div>
             
             <div className="p-6 sm:p-8 overflow-y-auto font-medium text-[#1B3A2D] space-y-8 bg-[#FAF8F4]">
                {content}
             </div>
           </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ═══════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════

export default function SalesPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const headerVisible = useScrollDirection();

  // SEO: set document title and meta
  useEffect(() => {
    document.title = "KAZA — Gestão Doméstica Inteligente | Controle de Estoque, Receitas e Lista de Compras";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "KAZA organiza o estoque da sua casa, avisa sobre validades, sugere receitas com o que você tem e monta a lista de compras automaticamente. Controle de consumíveis, check-up noturno, lembrete do lixo e compartilhamento familiar. Experimente grátis.");
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = "KAZA organiza o estoque da sua casa, avisa sobre validades, sugere receitas com o que você tem e monta a lista de compras automaticamente. Controle de consumíveis, check-up noturno, lembrete do lixo e compartilhamento familiar. Experimente grátis.";
      document.head.appendChild(meta);
    }

    // JSON-LD structured data
    const existingLd = document.querySelector('script[data-kaza-ld]');
    if (!existingLd) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-kaza-ld", "true");
      script.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "KAZA",
        "applicationCategory": "LifestyleApplication",
        "operatingSystem": "Web, Android, iOS",
        "description": "Gestão doméstica inteligente. Controle de estoque, receitas, lista de compras e compartilhamento familiar.",
        "offers": [
          { "@type": "Offer", "name": "IndividualPRO", "price": "19.90", "priceCurrency": "BRL" },
          { "@type": "Offer", "name": "MultiPRO", "price": "37.90", "priceCurrency": "BRL" }
        ],
        "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.9", "ratingCount": "500" }
      });
      document.head.appendChild(script);
    }

    // Open Graph Tags
    const ogTags = [
      { property: 'og:title', content: 'KAZA — Gestão Doméstica Inteligente' },
      { property: 'og:description', content: 'Organize seu estoque, evite desperdício e economize tempo com o KAZA.' },
      { property: 'og:image', content: 'https://kaza.app/icons/512.png' },
      { property: 'og:url', content: 'https://kaza.app' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'KAZA — Gestão Doméstica Inteligente' },
      { name: 'twitter:description', content: 'Controle de estoque, receitas e lista de compras inteligente.' },
      { name: 'twitter:image', content: 'https://kaza.app/icons/512.png' }
    ];

    ogTags.forEach(tag => {
      const selector = tag.property ? `meta[property="${tag.property}"]` : `meta[name="${tag.name}"]`;
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        if (tag.property) element.setAttribute('property', tag.property);
        if (tag.name) element.setAttribute('name', tag.name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', tag.content);
    });
  }, []);

  return (
    <>
      {/* Global Style Injections */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap');

        .font-sora { font-family: 'Sora', sans-serif; }
        .font-instrument { font-family: 'Instrument Serif', serif; }

        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        body { background-color: #FAF8F4; color: #1B3A2D; }
        html.dark body { background-color: #FAF8F4; color: #1B3A2D; }
        
        .sales-nav-blur {
          background: rgba(250, 248, 244, 0.85);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-bottom: 1px solid rgba(45,106,79,0.08);
        }

        /* Grain overlay */
        .grain-bg::after {
          content: '';
          position: absolute;
          inset: 0;
          opacity: 0.035;
          pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-size: 128px 128px;
        }

        /* Smooth scroll */
        html { scroll-behavior: smooth; }

        /* Glass card */
        .glass-card {
          background: rgba(255,255,255,0.65);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(45,106,79,0.08);
        }

        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }

        @keyframes float-medium {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        .float-slow { animation: float-slow 6s ease-in-out infinite; }
        .float-medium { animation: float-medium 4s ease-in-out infinite; }

        /* Green gradient text */
        .gradient-text {
          background: linear-gradient(135deg, #2D6A4F 0%, #52B788 50%, #74C69D 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      <div className="min-h-screen font-sora text-[#1B3A2D] selection:bg-emerald-300/40 selection:text-emerald-900 overflow-x-hidden" style={{ background: '#FAF8F4' }} lang="pt-BR">

        {/* ═══ 1. NAVBAR — Scroll-aware on mobile ═══ */}
        <header
          className="fixed top-0 inset-x-0 sales-nav-blur z-50"
          style={{
            transform: headerVisible ? 'translateY(0)' : 'translateY(-100%)',
            transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <div className="max-w-6xl mx-auto px-5 sm:px-6 h-20 flex items-center justify-between">
            <Link to="/pagina-de-vendas" className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg" aria-label="KAZA - Voltar ao início">
              <img src={LogoImage} alt="KAZA — Gestão doméstica inteligente" className="h-[34px] object-contain" />
            </Link>

            <nav className="hidden md:flex items-center gap-1" aria-label="Navegação principal">
              {[
                { label: "Funcionalidades", href: "#funcionalidades" },
                { label: "Como funciona", href: "#como-funciona" },
                { label: "Planos", href: "#planos" },
              ].map((item) => (
                <a key={item.href} href={item.href} className="px-4 py-2 text-[13px] font-semibold text-[#1B3A2D]/70 hover:text-[#2D6A4F] transition-colors rounded-lg hover:bg-emerald-50/50">
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <Link to="/auth" className="hidden md:block text-[13px] font-semibold text-[#1B3A2D]/70 hover:text-[#2D6A4F] transition-colors px-4 py-2">
                Entrar
              </Link>
              <Link to="/auth" className="bg-[#2D6A4F] text-white px-6 py-2.5 rounded-full text-[13px] font-bold hover:bg-[#1B3A2D] transition-all hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5 outline-none" aria-label="Criar conta grátis no KAZA">
                Começar grátis
              </Link>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center hover:bg-emerald-50 transition-colors"
                aria-label="Abrir menu de navegação"
              >
                <Menu className="w-5 h-5 text-[#1B3A2D]" />
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden border-t border-emerald-100/50 overflow-hidden"
                style={{ background: 'rgba(250,250,254,0.98)' }}
              >
                <div className="px-6 py-4 flex flex-col gap-2">
                  {[
                    { label: "Funcionalidades", href: "#funcionalidades" },
                    { label: "Como funciona", href: "#como-funciona" },
                    { label: "Planos", href: "#planos" },
                  ].map((item) => (
                    <a key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm font-semibold text-[#1B3A2D]/80 hover:text-[#2D6A4F] hover:bg-emerald-50 rounded-xl transition-colors">
                      {item.label}
                    </a>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        <div className="h-20 w-full" />

        <main className="w-full flex flex-col overflow-x-hidden">

          {/* ═══ 2. HERO — Left text + Right phone ═══ */}
          <section className="relative pt-6 lg:pt-20 pb-20 lg:pb-28 w-full overflow-hidden grain-bg">

            {/* Background blobs */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
              <div className="absolute top-[-20%] right-[-15%] w-[700px] h-[700px] rounded-full blur-[120px] opacity-30" style={{ background: 'radial-gradient(circle, #A7D5C0 0%, #C8E6D5 40%, transparent 70%)' }} />
              <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-25" style={{ background: 'radial-gradient(circle, #FDE68A 0%, #FEF3C7 40%, transparent 70%)' }} />
              <div className="absolute bottom-[-10%] left-[30%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-20" style={{ background: 'radial-gradient(circle, #94D2BD 0%, #B5DFC8 40%, transparent 70%)' }} />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-6">
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center lg:items-start lg:pt-12">

                {/* Left — Copy */}
                <div className="flex flex-col items-center text-center lg:text-left lg:items-start relative">

                  <motion.h1
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.7 }}
                    className="text-[2.6rem] sm:text-5xl lg:text-[3.8rem] font-extrabold leading-[1.08] tracking-tight mb-3 lg:mb-6"
                  >
                    PARE DE{' '}
                    <span className="font-instrument italic font-normal gradient-text">DESPERDIÇAR</span>
                    <br />
                    COMIDA E DINHEIRO
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.5 }}
                    className="text-[#1B3A2D]/60 text-base lg:text-lg font-medium leading-relaxed max-w-lg mb-8"
                  >
                    O KAZA monitora tudo que entra na sua casa — da geladeira à despensa. Avisa antes de vencer, sugere receitas pra usar o que tem e monta a lista de compras sozinho.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="flex flex-col sm:flex-row items-center sm:items-center gap-4 mb-8"
                  >
                    <Link
                      to="/auth"
                      className="relative overflow-hidden bg-[#2D6A4F] text-white px-8 py-4 rounded-2xl text-center transition-all shadow-[0_8px_30px_-8px_rgba(45,106,79,0.5)] hover:-translate-y-1 hover:shadow-[0_14px_40px_-8px_rgba(45,106,79,0.6)] font-bold text-base flex items-center gap-2 group"
                      aria-label="Começar a usar o KAZA gratuitamente"
                    >
                      Começar agora — grátis
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <a href="#planos" className="flex items-center gap-2 text-[#1B3A2D]/70 hover:text-[#2D6A4F] font-semibold text-sm transition-colors group">
                      <div className="w-10 h-10 rounded-full border-2 border-[#1B3A2D]/15 flex items-center justify-center group-hover:border-[#2D6A4F]/40 transition-colors">
                        <Eye className="w-5 h-5" />
                      </div>
                      Ver planos
                    </a>
                  </motion.div>

                  {/* Social proof */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex -space-x-2.5">
                      {['👩', '👨', '👩', '👦'].map((avatar, i) => (
                        <div key={i} className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2D6A4F] to-[#1B3A2D] border-[2.5px] border-white flex items-center justify-center text-sm shadow-sm">
                          {avatar}
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                        <span className="text-[12px] font-bold text-[#1B3A2D] ml-1.5">4.9</span>
                      </div>
                      <p className="text-[11px] text-[#1B3A2D]/50 font-medium">+500 famílias organizam a casa com KAZA</p>
                    </div>
                  </motion.div>
                </div>

                {/* Right — Interactive Phone */}
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="relative flex justify-center lg:justify-end"
                >
                  <div className="relative">
                    <InteractiveDemoPhone />

                    {/* Floating notification card */}
                    <motion.div
                      initial={{ scale: 0, opacity: 0, x: 40 }}
                      animate={{ scale: 1, opacity: 1, x: 0 }}
                      transition={{ delay: 2.2, type: "spring" }}
                      className="absolute top-[50px] right-[-30px] lg:right-[-70px] rounded-2xl p-3.5 shadow-2xl z-30 flex items-center gap-3 max-w-[220px] float-slow"
                      style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)', border: '1px solid rgba(45,106,79,0.1)' }}
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-amber-100">
                        <span className="text-base">⚠️</span>
                      </div>
                      <div>
                        <p className="font-bold text-[11px] text-gray-800">Validade Próxima</p>
                        <p className="text-[9px] text-gray-500 mt-0.5 leading-snug">Iogurte vence amanhã</p>
                      </div>
                    </motion.div>

                    {/* Floating sync badge */}
                    <motion.div
                      initial={{ scale: 0, opacity: 0, x: -40 }}
                      animate={{ scale: 1, opacity: 1, x: 0 }}
                      transition={{ delay: 2.8, type: "spring" }}
                      className="absolute bottom-[120px] left-[-25px] lg:left-[-80px] rounded-2xl p-3 shadow-xl z-30 flex items-center gap-2.5 float-medium"
                      style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)', border: '1px solid rgba(45,106,79,0.1)' }}
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <p className="font-bold text-[10px] text-gray-700">Sincronização 24/7</p>
                    </motion.div>

                    {/* Floating AI badge */}
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 3.2, type: "spring" }}
                      className="absolute top-[220px] left-[-15px] lg:left-[-60px] z-30 float-slow"
                    >
                      <div className="w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #52B788 100%)' }}>
                        <span className="text-2xl">🍳</span>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* ═══ 3. TRUSTED PARTNER BAR ═══ */}
          <section className="py-10 border-y border-emerald-100/50 bg-white/60" aria-label="Funcionalidades confiáveis">
            <div className="max-w-6xl mx-auto px-5 sm:px-6">
              <p className="text-center text-[11px] font-bold text-[#1B3A2D]/30 uppercase tracking-[0.2em] mb-6">Tudo que sua casa precisa em um só lugar</p>
              <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 items-center">
                {TRUSTED_FEATURES.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-[#1B3A2D]/35">
                    <item.icon className="w-4 h-4" />
                    <span className="text-[13px] font-bold tracking-wide">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ═══ 4. POWERFUL FEATURES — Themed colored cards ═══ */}
          <section id="funcionalidades" className="py-24 lg:py-32 relative" aria-labelledby="funcionalidades-heading">
            <div className="max-w-6xl mx-auto px-5 sm:px-6">
              <FadeInSection>
                <div className="text-center max-w-2xl mx-auto mb-16 lg:mb-20">
                  <span className="inline-block px-4 py-1.5 border border-emerald-200/60 text-[#2D6A4F] font-bold text-[10px] rounded-full tracking-widest uppercase mb-5 bg-emerald-50/50">Funcionalidades</span>
                  <h2 id="funcionalidades-heading" className="text-3xl md:text-5xl font-extrabold tracking-tight mb-5 leading-tight">
                    Tudo que você precisa pra{' '}
                    <span className="font-instrument italic font-normal gradient-text">acabar com o desperdício</span>
                  </h2>
                  <p className="text-[#1B3A2D]/55 text-base lg:text-lg font-medium leading-relaxed">
                    Do item que está vencendo na geladeira ao sabão em pó que está acabando — o KAZA cuida de cada detalhe da sua rotina doméstica.
                  </p>
                </div>
              </FadeInSection>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                {[
                  {
                    icon: Box,
                    emoji: "📦",
                    title: "Estoque Completo",
                    desc: "Cadastre tudo: geladeira, despensa, freezer e limpeza. O KAZA monitora quantidades, validades e avisa quando algo está acabando.",
                    borderColor: "#0D9488",
                    bgIcon: "bg-teal-50",
                    borderClass: "border-l-4 border-l-teal-500",
                  },
                  {
                    icon: ChefHat,
                    emoji: "🍳",
                    title: "Receitas que Evitam Desperdício",
                    desc: "O KAZA sugere receitas com base no que você já tem em casa — priorizando os itens que estão perto de vencer.",
                    borderColor: "#D97706",
                    bgIcon: "bg-amber-50",
                    borderClass: "border-l-4 border-l-amber-500",
                  },
                  {
                    icon: Calendar,
                    emoji: "📅",
                    title: "Planejador de Refeições",
                    desc: "Monte o cardápio da semana: café, almoço, jantar e lanche. O KAZA calcula os ingredientes e adiciona o que falta na lista.",
                    borderColor: "#2563EB",
                    bgIcon: "bg-sky-50",
                    borderClass: "border-l-4 border-l-sky-500",
                  },
                  {
                    icon: ListChecks,
                    emoji: "🛒",
                    title: "Lista de Compras Automática",
                    desc: "A lista se monta sozinha com base no que acabou, no que vai vencer e no que o planejador precisa. Só ir ao mercado.",
                    borderColor: "#2D6A4F",
                    bgIcon: "bg-emerald-50",
                    borderClass: "border-l-4 border-l-emerald-600",
                  },
                  {
                    icon: Moon,
                    emoji: "🌙",
                    title: "Check-up Noturno",
                    desc: "Antes de dormir, revise o que consumiu ou descartou no dia. O KAZA atualiza tudo e gera seu relatório de aproveitamento.",
                    borderColor: "#6366F1",
                    bgIcon: "bg-indigo-50",
                    borderClass: "border-l-4 border-l-indigo-500",
                    featured: true,
                  },
                  {
                    icon: Trash2,
                    emoji: "🗑️",
                    title: "Lembrete do Lixo",
                    desc: "Configure os dias de coleta e o KAZA avisa na hora certa — com vibração se necessário. Nunca mais esqueça o lixo.",
                    borderColor: "#E11D48",
                    bgIcon: "bg-rose-50",
                    borderClass: "border-l-4 border-l-rose-500",
                  },
                ].map((feature, i) => (
                  <FadeInSection key={i} delay={i * 0.08}>
                    <div className={`group relative rounded-3xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-default ${feature.featured ? 'bg-[#1B3A2D] text-white' : 'bg-white border border-gray-100/80 hover:border-emerald-200/60'} ${feature.featured ? '' : feature.borderClass}`}>
                      {feature.featured && (
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[60px] opacity-20" />
                      )}
                      <div className={`relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-sm transition-transform group-hover:scale-110 ${feature.featured ? 'bg-white/10 border border-white/10' : feature.bgIcon + ' border border-gray-100'}`}>
                        {feature.emoji}
                      </div>
                      <h3 className={`font-bold text-lg mb-3 relative z-10 ${feature.featured ? 'text-white' : 'text-[#1B3A2D]'}`}>
                        {feature.title}
                      </h3>
                      <p className={`text-sm font-medium leading-relaxed relative z-10 ${feature.featured ? 'text-white/65' : 'text-[#1B3A2D]/55'}`}>
                        {feature.desc}
                      </p>
                    </div>
                  </FadeInSection>
                ))}
              </div>
            </div>
          </section>

          {/* ═══ 5. HOW IT WORKS ═══ */}
          <section id="como-funciona" className="py-24 lg:py-32 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #F0F7F4 0%, #FAF8F4 100%)' }} aria-labelledby="como-funciona-heading">
            <div className="max-w-6xl mx-auto px-5 sm:px-6">
              <FadeInSection>
                <div className="text-center max-w-2xl mx-auto mb-16 lg:mb-20">
                  <span className="inline-block px-4 py-1.5 border border-emerald-200/60 text-[#2D6A4F] font-bold text-[10px] rounded-full tracking-widest uppercase mb-5 bg-white/60">Passo a Passo</span>
                  <h2 id="como-funciona-heading" className="text-3xl md:text-5xl font-extrabold tracking-tight mb-5 leading-tight">
                    Comece a usar em{' '}
                    <span className="font-instrument italic font-normal gradient-text">3 minutos</span>
                  </h2>
                  <p className="text-[#1B3A2D]/55 text-base lg:text-lg font-medium leading-relaxed">
                    Sem complicação. Crie a conta, cadastre o primeiro item e o KAZA já começa a trabalhar pra você.
                  </p>
                </div>
              </FadeInSection>

              <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
                {[
                  {
                    step: "01",
                    emoji: "📱",
                    color: "#2D6A4F",
                    title: "Crie sua conta",
                    desc: "Basta email ou Google. Escolha se vai usar sozinho (IndividualPRO) ou com a família (MultiPRO).",
                  },
                  {
                    step: "02",
                    emoji: "📦",
                    color: "#52B788",
                    title: "Cadastre o que tem em casa",
                    desc: "Adicione itens da geladeira, despensa e limpeza. Coloque a validade e o KAZA monitora a partir daí.",
                  },
                  {
                    step: "03",
                    emoji: "🚀",
                    color: "#74C69D",
                    title: "O KAZA faz o resto",
                    desc: "Alertas de validade, sugestões de receitas, lista de compras automática e relatório de desperdício — tudo rodando sozinho.",
                  },
                ].map((item, i) => (
                  <FadeInSection key={i} delay={i * 0.12}>
                    <div className="relative text-center group">
                      <div className="relative inline-flex mb-6">
                        <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-lg transition-transform group-hover:scale-110" style={{ background: `linear-gradient(135deg, ${item.color}20, ${item.color}08)`, border: `1px solid ${item.color}20` }}>
                          {item.emoji}
                        </div>
                        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-lg" style={{ background: item.color }}>
                          {item.step}
                        </div>
                      </div>
                      <h3 className="font-bold text-lg text-[#1B3A2D] mb-3">{item.title}</h3>
                      <p className="text-sm text-[#1B3A2D]/55 font-medium leading-relaxed max-w-xs mx-auto">{item.desc}</p>
                    </div>
                  </FadeInSection>
                ))}
              </div>
            </div>
          </section>

          {/* ═══ 6. MULTIPRO ═══ */}
          <section className="py-24 lg:py-32 bg-white relative" aria-labelledby="multipro-heading">
            <div className="max-w-6xl mx-auto px-5 sm:px-6">
              <FadeInSection>
                <div className="text-center max-w-3xl mx-auto mb-16">
                  <span className="inline-block px-4 py-1.5 border border-emerald-200/60 text-[#2D6A4F] font-bold text-[10px] rounded-full tracking-widest uppercase mb-5 bg-emerald-50/50">MultiPRO</span>
                  <h2 id="multipro-heading" className="text-3xl md:text-5xl font-extrabold tracking-tight mb-5 leading-tight">
                    Uma casa, até 4 acessos,{' '}
                    <span className="font-instrument italic font-normal gradient-text">todo mundo sincronizado</span>
                  </h2>
                  <p className="text-[#1B3A2D]/55 text-base lg:text-lg font-medium leading-relaxed">
                    A conta mestre convida até 3 pessoas. Cada membro vê o estoque, marca itens comprados, usa receitas e recebe alertas. Sem precisar mandar lista no WhatsApp.
                  </p>
                </div>
              </FadeInSection>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                {[
                  {
                    name: "ANA",
                    role: "Conta Mestre",
                    sub: "Administração total",
                    avatar: "A",
                    bg: "bg-[#2D6A4F]",
                    items: [
                      { text: "Convida e gerencia perfis", ok: true },
                      { text: "Visualiza quem está conectado", ok: true },
                      { text: "Pode desconectar outras sessões", ok: true },
                      { text: "Acesso completo a todas as funções", ok: true },
                    ],
                    badge: "Conta Mestre"
                  },
                  {
                    name: "LUCAS",
                    role: "Subconta",
                    sub: "Acesso às funções do dia a dia",
                    avatar: "L",
                    bg: "bg-gray-100",
                    items: [
                      { text: "Marca itens comprados na lista", ok: true },
                      { text: "Registra lixo levado pra fora", ok: true },
                      { text: "Marca uso de itens em receitas", ok: true },
                      { text: "Convida ou remove membros", ok: false },
                    ],
                  },
                  {
                    name: "MARINA",
                    role: "Subconta",
                    sub: "Acesso às funções do dia a dia",
                    avatar: "M",
                    bg: "bg-emerald-50",
                    items: [
                      { text: "Favorita receitas e planeja refeições", ok: true },
                      { text: "Adiciona e edita o plano alimentar", ok: true },
                      { text: "Recebe alertas de validade", ok: true },
                      { text: "Gerencia assinatura", ok: false },
                    ],
                  },
                ].map((profile, i) => (
                  <FadeInSection key={i} delay={i * 0.1}>
                    <div className={`relative rounded-3xl p-8 border transition-transform hover:-translate-y-1 ${i === 0 ? 'bg-[#1B3A2D] border-[#1B3A2D] shadow-2xl' : 'bg-white border-gray-100 shadow-sm'}`}>
                      {profile.badge && (
                        <div className="absolute top-0 right-8 -translate-y-1/2 bg-[#2D6A4F] text-white text-[9px] uppercase font-bold tracking-widest px-3 py-1 rounded-full shadow-lg">
                          {profile.badge}
                        </div>
                      )}
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold mb-5 shadow-sm ${i === 0 ? 'bg-[#2D6A4F] text-white' : profile.bg + ' text-[#1B3A2D]'}`}>
                        {profile.avatar}
                      </div>
                      <h3 className={`font-bold text-base mb-0.5 ${i === 0 ? 'text-white' : 'text-[#1B3A2D]'}`}>
                        {profile.role} — {profile.name}
                      </h3>
                      <p className={`text-[12px] font-medium mb-6 ${i === 0 ? 'text-emerald-300' : 'text-[#1B3A2D]/40'}`}>
                        {profile.sub}
                      </p>
                      <ul className="space-y-3">
                        {profile.items.map((item, j) => (
                          <li key={j} className="flex items-start gap-2.5">
                            {item.ok
                              ? <Check className={`w-4 h-4 shrink-0 mt-0.5 ${i === 0 ? 'text-emerald-400' : 'text-[#2D6A4F]'}`} />
                              : <X className={`w-4 h-4 shrink-0 mt-0.5 ${i === 0 ? 'text-red-400' : 'text-red-400'}`} />
                            }
                            <span className={`text-[13px] font-medium ${!item.ok ? 'text-red-400' : i === 0 ? 'text-white/80' : 'text-[#1B3A2D]/60'}`}>
                              {item.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </FadeInSection>
                ))}
              </div>

              <FadeInSection delay={0.3}>
                <div className="mt-10 text-center">
                  <p className="text-sm text-[#1B3A2D]/50 font-medium bg-emerald-50/50 inline-block px-6 py-2.5 rounded-full border border-emerald-100/50">
                    Subcontas têm acesso completo ao dia a dia — só a gestão de membros e assinatura é exclusiva da conta mestre.
                  </p>
                </div>
              </FadeInSection>
            </div>
          </section>

          {/* ═══ 7. UNIFIED: PLANS + DEMO (merged Explore + Pricing) ═══ */}
          <section id="planos" className="py-24 lg:py-32 relative overflow-hidden grain-bg" style={{ background: '#FAF8F4' }} aria-labelledby="planos-heading">
            {/* Background blobs */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
              <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-25" style={{ background: 'radial-gradient(circle, #A7D5C0 0%, #C8E6D5 40%, transparent 70%)' }} />
              <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-20" style={{ background: 'radial-gradient(circle, #94D2BD 0%, #B5DFC8 40%, transparent 70%)' }} />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-6">
              <FadeInSection>
                <div className="text-center max-w-2xl mx-auto mb-16">
                  <span className="inline-block px-4 py-1.5 border border-emerald-200/60 text-[#2D6A4F] font-bold text-[10px] rounded-full tracking-widest uppercase mb-5 bg-white/70">Planos e Preços</span>
                  <h2 id="planos-heading" className="text-3xl md:text-5xl font-extrabold tracking-tight mb-5 leading-tight">
                    Experimente o KAZA e{' '}
                    <span className="font-instrument italic font-normal gradient-text">escolha seu plano</span>
                  </h2>
                  <p className="text-[#1B3A2D]/55 text-lg font-medium">
                    Teste o app ao lado e veja como funciona. Depois, escolha o plano ideal pra sua casa.
                  </p>
                </div>
              </FadeInSection>

              {/* Grid: planos à esquerda, telefone à direita */}
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                {/* Planos */}
                <div className="flex flex-col gap-6">
                  <FadeInSection delay={0}>
                    <div className="bg-white/80 border border-gray-100 rounded-[2rem] p-8 shadow-sm hover:shadow-md transition-all flex flex-col backdrop-blur-sm">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between items-center text-center sm:text-left gap-4 sm:gap-0 mb-4">
                        <div>
                          <h3 className="font-extrabold text-xl text-[#1B3A2D]">IndividualPRO</h3>
                          <p className="text-[#1B3A2D]/50 font-medium text-xs mt-0.5">Pra quem cuida da casa sozinho.</p>
                        </div>
                        <div className="text-center sm:text-right">
                          <span className="text-3xl font-extrabold tracking-tight text-[#1B3A2D]">R$19,90</span>
                          <span className="text-[#1B3A2D]/40 font-medium text-xs">/mês</span>
                        </div>
                      </div>
                      <ul className="space-y-2.5 mb-6 flex-1 w-fit mx-auto sm:w-auto sm:mx-0 text-left">
                        {["1 conta, 1 dispositivo", "Estoque ilimitado de itens", "Alertas de validade e consumíveis", "Receitas com base no estoque", "Check-up noturno + relatório mensal"].map((item, i) => (
                          <li key={i} className="flex items-center gap-2.5">
                            <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 text-[#2D6A4F]" />
                            </div>
                            <span className="text-sm font-medium text-[#1B3A2D]/70">{item}</span>
                          </li>
                        ))}
                      </ul>
                      <Link to="/auth" className="bg-[#1B3A2D] text-white font-bold py-3.5 rounded-2xl text-center transition-all hover:bg-[#234B3B] outline-none w-full block text-sm" aria-label="Assinar plano IndividualPRO">
                        Escolher IndividualPRO
                      </Link>
                    </div>
                  </FadeInSection>

                  <FadeInSection delay={0.1}>
                    <div className="relative bg-[#1B3A2D] rounded-[2rem] p-8 shadow-2xl flex flex-col overflow-hidden">
                      <div className="absolute top-0 right-0 w-56 h-56 bg-emerald-600 rounded-full blur-[70px] -z-[1] opacity-30" />
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between items-center text-center sm:text-left gap-4 sm:gap-0 mb-4">
                        <div>
                          <h3 className="font-extrabold text-xl text-white">MultiPRO</h3>
                          <p className="text-emerald-300/60 font-medium text-xs mt-0.5">1 conta mestre + até 3 convidados.</p>
                        </div>
                        <div className="text-center sm:text-right flex flex-col items-center sm:items-end">
                          <div className="inline-block bg-amber-400 text-[#1B3A2D] text-[9px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full mb-1">Mais completo</div>
                          <div>
                            <span className="text-3xl font-extrabold tracking-tight text-white">R$37,90</span>
                            <span className="text-emerald-300/40 font-medium text-xs">/mês</span>
                          </div>
                        </div>
                      </div>
                      <ul className="space-y-2.5 mb-6 flex-1 w-fit mx-auto sm:w-auto sm:mx-0 text-left">
                        {[
                          { text: "Tudo do IndividualPRO, mais:", accent: true },
                          { text: "Convida até 3 pessoas para a casa" },
                          { text: "Estoque e lista compartilhados em tempo real" },
                          { text: "Alertas e permissões por perfil" },
                          { text: "Controle de sessões e membros" },
                        ].map((item, i) => (
                          <li key={i} className="flex items-center gap-2.5">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${item.accent ? 'bg-amber-400/20' : 'bg-emerald-500/20'}`}>
                              <Check className={`w-2.5 h-2.5 ${item.accent ? 'text-amber-400' : 'text-emerald-400'}`} />
                            </div>
                            <span className={`text-sm font-medium ${item.accent ? 'text-amber-300 italic' : 'text-white/80'}`}>{item.text}</span>
                          </li>
                        ))}
                      </ul>
                      <Link to="/auth" className="bg-[#2D6A4F] hover:bg-[#3a8464] text-white font-bold py-3.5 rounded-2xl text-center transition-all shadow-[0_8px_24px_-8px_rgba(45,106,79,0.5)] outline-none w-full block hover:-translate-y-0.5 text-sm" aria-label="Testar plano MultiPRO com 7 dias grátis">
                        Testar MultiPRO — 7 dias grátis
                      </Link>
                    </div>
                  </FadeInSection>
                </div>

                {/* Telefone interativo */}
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="relative flex justify-center lg:justify-end"
                >
                  <div className="relative">
                    <InteractiveDemoPhone />
                    {/* Floating badges */}
                    <motion.div
                      initial={{ scale: 0, opacity: 0, x: 40 }}
                      whileInView={{ scale: 1, opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.8, type: "spring" }}
                      className="absolute top-[60px] right-[-25px] lg:right-[-65px] rounded-2xl p-3 shadow-xl z-30 flex items-center gap-2.5 float-slow"
                      style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)', border: '1px solid rgba(45,106,79,0.1)' }}
                    >
                      <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-base">💳</div>
                      <div>
                        <p className="font-bold text-[10px] text-gray-800">7 dias grátis</p>
                        <p className="text-[9px] text-gray-500">MultiPRO</p>
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{ scale: 0, opacity: 0, x: -40 }}
                      whileInView={{ scale: 1, opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1.1, type: "spring" }}
                      className="absolute bottom-[130px] left-[-20px] lg:left-[-75px] rounded-2xl p-3 shadow-xl z-30 flex items-center gap-2 float-medium"
                      style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)', border: '1px solid rgba(45,106,79,0.1)' }}
                    >
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <p className="font-bold text-[10px] text-gray-700">Cancele quando quiser</p>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* ═══ 8. TESTIMONIALS ═══ */}
          <section className="py-24 lg:py-32 relative" style={{ background: '#FAF8F4' }} aria-labelledby="depoimentos-heading">
            <div className="max-w-6xl mx-auto px-5 sm:px-6">
              <FadeInSection>
                <div className="text-center max-w-2xl mx-auto mb-16">
                  <span className="inline-block px-4 py-1.5 border border-emerald-200/60 text-[#2D6A4F] font-bold text-[10px] rounded-full tracking-widest uppercase mb-5 bg-emerald-50/50">Depoimentos</span>
                  <h2 id="depoimentos-heading" className="text-3xl md:text-5xl font-extrabold tracking-tight mb-5 leading-tight">
                    Quem usa,{' '}
                    <span className="font-instrument italic font-normal gradient-text">não volta atrás</span>
                  </h2>
                </div>
              </FadeInSection>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    text: "Parei de jogar comida fora. O KAZA me avisa antes de vencer e sugere receitas com o que eu já tenho em casa. Economizei mais de R$200 no primeiro mês.",
                    name: "Carla M.",
                    role: "Mãe de 2 filhos",
                    avatar: "CM",
                  },
                  {
                    text: "Meu marido instala o app e já sabe o que comprar. Sem WhatsApp, sem ligação. O estoque é compartilhado e a lista se atualiza em tempo real.",
                    name: "Juliana R.",
                    role: "Usuária MultiPRO",
                    avatar: "JR",
                  },
                  {
                    text: "O check-up noturno virou rotina. Em 30 segundos reviso o que usei no dia. O relatório mensal mostra exatamente quanto economizei de desperdício.",
                    name: "Rafael S.",
                    role: "Mora sozinho",
                    avatar: "RS",
                  },
                ].map((testimonial, i) => (
                  <FadeInSection key={i} delay={i * 0.1} className="h-full">
                    <div className="relative bg-white rounded-3xl p-8 border border-gray-100/80 shadow-sm hover:shadow-lg transition-shadow h-full flex flex-col">
                      <Quote className="w-8 h-8 text-emerald-200 mb-4" />
                      <p className="text-[#1B3A2D]/70 text-sm font-medium leading-relaxed mb-6">
                        "{testimonial.text}"
                      </p>
                      <div className="flex items-center gap-3 mt-auto">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2D6A4F] to-[#1B3A2D] flex items-center justify-center text-white text-[11px] font-bold">
                          {testimonial.avatar}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1B3A2D]">{testimonial.name}</p>
                          <p className="text-[11px] text-[#1B3A2D]/40 font-medium">{testimonial.role}</p>
                        </div>
                      </div>
                    </div>
                  </FadeInSection>
                ))}
              </div>
            </div>
          </section>


          {/* ═══ 10. FINAL CTA ═══ */}
          <section className="py-20 px-5 sm:px-6 max-w-6xl mx-auto w-full mb-12" aria-label="Chamada para ação final">
            <FadeInSection>
              <div className="relative rounded-[2.5rem] p-12 md:p-20 text-center overflow-hidden shadow-2xl" style={{ background: 'linear-gradient(135deg, #1B3A2D 0%, #0A1F18 100%)' }}>
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#2D6A4F 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-600 rounded-full blur-[100px] opacity-20" />
                <div className="absolute bottom-0 left-0 w-60 h-60 bg-teal-500 rounded-full blur-[80px] opacity-15" />

                <div className="relative z-10 w-full max-w-3xl mx-auto">
                  <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight tracking-tight">
                    Menos desperdício.
                    <br />
                    <span className="font-instrument italic font-normal text-emerald-300">Mais economia real.</span>
                  </h2>
                  <p className="text-emerald-200/50 text-base md:text-lg font-medium mb-12 leading-relaxed max-w-xl mx-auto">
                    IndividualPRO por R$19,90/mês pra quem cuida da casa sozinho. MultiPRO por R$37,90/mês com 7 dias grátis pra dividir com a família.
                  </p>

                  <div className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full">
                    <Link to="/auth" className="w-full sm:w-auto bg-white text-[#1B3A2D] hover:bg-gray-50 font-bold py-4 px-8 rounded-2xl text-center transition-all shadow-sm text-sm" aria-label="Assinar IndividualPRO">
                      Escolher IndividualPRO
                    </Link>
                    <Link to="/auth" className="w-full sm:w-auto bg-[#2D6A4F] hover:bg-[#1B3A2D] text-white font-bold py-4 px-8 rounded-2xl text-center transition-all shadow-[0_10px_30px_-10px_rgba(45,106,79,0.5)] hover:-translate-y-1 text-sm" aria-label="Testar MultiPRO com 7 dias grátis">
                      Testar MultiPRO — 7 dias grátis
                    </Link>
                  </div>

                  <div className="flex flex-col items-center mt-8 gap-2">
                    <div className="flex items-center gap-3 text-white/30">
                      <Zap className="w-4 h-4" />
                      <span className="text-sm font-medium">Aceitamos PIX automático e Cartão de Crédito</span>
                    </div>
                  </div>
                </div>
              </div>
            </FadeInSection>
          </section>

        </main>

        {/* ═══ 11. FOOTER ═══ */}
        <footer className="bg-[#0A1F18] pt-16 pb-8 border-t border-white/5 relative z-10">
          <div className="max-w-6xl w-full mx-auto px-5 sm:px-6 grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
            <div className="md:col-span-4 flex flex-col">
              <Link to="/pagina-de-vendas" className="mb-6 inline-block" aria-label="KAZA">
                <img src={LogoImage} alt="KAZA Logo" className="h-[32px] object-contain brightness-0 invert" />
              </Link>
              <p className="text-emerald-100/50 text-sm leading-relaxed max-w-sm font-medium">KAZA — Sua casa organizada. Menos desperdício, mais economia, tudo no automático.</p>
            </div>

            <div className="md:col-span-2">
              <h5 className="font-bold text-white mb-4 uppercase tracking-wider text-[11px]">Produto</h5>
              <ul className="space-y-3">
                <li><a href="#funcionalidades" className="text-emerald-100/50 hover:text-emerald-300 text-sm font-medium transition-colors">Funcionalidades</a></li>
                <li><a href="#planos" className="text-emerald-100/50 hover:text-emerald-300 text-sm font-medium transition-colors">Planos</a></li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <h5 className="font-bold text-white mb-4 uppercase tracking-wider text-[11px]">Acessar</h5>
              <ul className="space-y-3">
                <li><a href="#como-funciona" className="text-emerald-100/50 hover:text-emerald-300 text-sm font-medium transition-colors">Como funciona</a></li>
                <li><Link to="/auth" className="text-emerald-100/50 hover:text-emerald-300 text-sm font-medium transition-colors">Criar conta</Link></li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <h5 className="font-bold text-white mb-4 uppercase tracking-wider text-[11px]">Atendimento</h5>
              <ul className="space-y-3">
                <li><a href="#" className="text-emerald-100/50 hover:text-emerald-300 text-sm font-medium transition-colors">Contato</a></li>
                <li><a href="#" className="text-emerald-100/50 hover:text-emerald-300 text-sm font-medium transition-colors">Suporte</a></li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <h5 className="font-bold text-white mb-4 uppercase tracking-wider text-[11px]">Políticas</h5>
              <ul className="space-y-3">
                <li><button onClick={() => setPrivacyModalOpen(true)} className="text-emerald-100/50 hover:text-emerald-300 text-sm font-medium transition-colors text-left">Privacidade</button></li>
                <li><button onClick={() => setTermsModalOpen(true)} className="text-emerald-100/50 hover:text-emerald-300 text-sm font-medium transition-colors text-left">Termos de Uso</button></li>
              </ul>
            </div>
          </div>

          <div className="w-full border-t border-white/5 pt-8">
            <div className="max-w-6xl mx-auto px-5 sm:px-6 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs font-medium text-emerald-100/30">© {new Date().getFullYear()} KAZA. Todos os direitos reservados.</p>
            </div>
          </div>
        </footer>

        {/* ═══ POLICY MODALS ═══ */}
        <PolicyModal 
          isOpen={privacyModalOpen} 
          onClose={() => setPrivacyModalOpen(false)} 
          title="Política de Privacidade" 
          content={
            <>
              <p className="text-sm font-bold text-[#1B3A2D]/40 mb-8 uppercase tracking-wider">Última atualização: Abril de 2026</p>
              <section>
                <h3 className="text-xl font-bold text-[#1B3A2D] mb-3">1. Informações que Coletamos</h3>
                <p className="leading-relaxed text-[#1B3A2D]/70">A KAZA coleta informações para fornecer serviços melhores e mais personalizados aos nossos usuários. Nós coletamos apenas o necessário para garantir o funcionamento do gerenciador doméstico (estoque, notificações de validade e afins).</p>
              </section>
              <section>
                <h3 className="text-xl font-bold text-[#1B3A2D] mb-3">2. Como Usamos as Informações</h3>
                <p className="leading-relaxed text-[#1B3A2D]/70">Nós utilizamos os dados da sua despensa para gerar alertas de validade de maneira local e na nuvem. A Inteligência Artificial de receitas cruza apenas seus itens anonimizados para evitar qualquer identificação pessoal durante a geração de ideias de receita.</p>
              </section>
              <section>
                <h3 className="text-xl font-bold text-[#1B3A2D] mb-3">3. Segurança dos Dados</h3>
                <p className="leading-relaxed text-[#1B3A2D]/70">Sua segurança é primordial. Trabalhamos com servidores de ponta (Supabase) que garantem a criptografia de dados em trânsito e em repouso. Nenhum dado de consumo será vendido para plataformas terceiras de marketing indesejado.</p>
              </section>
            </>
          }
        />
        <PolicyModal 
          isOpen={termsModalOpen} 
          onClose={() => setTermsModalOpen(false)} 
          title="Termos de Uso" 
          content={
            <>
              <p className="text-sm font-bold text-[#1B3A2D]/40 mb-8 uppercase tracking-wider">Última atualização: Abril de 2026</p>
              <section>
                <h3 className="text-xl font-bold text-[#1B3A2D] mb-3">1. Aceitação</h3>
                <p className="leading-relaxed text-[#1B3A2D]/70">Ao acessar e usar a plataforma KAZA, você concorda em cumprir estes termos de serviço e todas as leis e regulamentos aplicáveis. Se você não concordar com algum destes termos, está proibido de usar ou acessar este site.</p>
              </section>
              <section>
                <h3 className="text-xl font-bold text-[#1B3A2D] mb-3">2. Licença de Uso</h3>
                <p className="leading-relaxed text-[#1B3A2D]/70 mb-3">É concedida permissão para baixar temporariamente uma cópia dos materiais (informações ou software) no aplicativo KAZA, apenas para visualização transitória pessoal e não comercial. Esta é a concessão de uma licença, não uma transferência de título, e sob esta licença você não pode:</p>
                <ul className="list-disc pl-6 space-y-2 leading-relaxed text-[#1B3A2D]/70">
                  <li>Modificar ou copiar os materiais;</li>
                  <li>Tentar descompilar ou fazer engenharia reversa de qualquer software contido no app KAZA;</li>
                  <li>Remover quaisquer direitos autorais ou outras notações de propriedade dos materiais.</li>
                </ul>
              </section>
              <section>
                <h3 className="text-xl font-bold text-[#1B3A2D] mb-3">3. Limitações</h3>
                <p className="leading-relaxed text-[#1B3A2D]/70">Em nenhum caso a KAZA ou seus fornecedores serão responsáveis por quaisquer danos (incluindo, sem limitação, danos por perda de dados ou lucro ou devido a interrupção dos negócios) decorrentes do uso ou da incapacidade de usar os materiais da nossa plataforma.</p>
              </section>
            </>
          }
        />
      </div>
    </>
  );
}
