import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, X, Search, ShieldCheck, User, Users, Bell,
  Settings, Smartphone, LayoutDashboard, Calendar, ShoppingCart,
  ChefHat, Sparkles, Box, ListChecks, ChevronRight, AlertCircle, PlayCircle, Lock, Globe, Monitor, Mail, Eye,
  Home, Refrigerator, Clock, AlertTriangle, BarChart3, Moon, Plus, TrendingDown, ChevronDown,
  Package, Timer, Flame, Star, Heart, Trash2, UtensilsCrossed, CheckCircle2
} from "lucide-react";

import LogoImage from "@/assets/logo inicial black pagina de vendas.svg";
import LogoNome from "@/assets/logo inicial nome.svg";

// ═══════════════════════════════════════════════
// PUSH NOTIFICATION SYSTEM — Simulated real notifications
// ═══════════════════════════════════════════════

const pushNotifications = [
  { id: 1, icon: "⚠️", title: "Validade Próxima", body: "Iogurte Natural vence amanhã", color: "#F59E0B", time: "agora" },
  { id: 2, icon: "🛒", title: "Lista de Compras", body: "3 itens adicionados automaticamente", color: "#2D6A4F", time: "2min" },
  { id: 3, icon: "🍳", title: "Sugestão de Receita", body: "Bolo de Iogurte — use antes que vença!", color: "#8B5CF6", time: "5min" },
  { id: 4, icon: "📦", title: "Estoque Baixo", body: "Sabão em pó está acabando (2 dias)", color: "#EF4444", time: "8min" },
  { id: 5, icon: "🌙", title: "Check-up Noturno", body: "Revise 4 itens antes de dormir", color: "#6366F1", time: "12min" },
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
// HERO PHONE — Real app elements appearing with animations
// ═══════════════════════════════════════════════

const HeroPhoneMockup = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 600),
      setTimeout(() => setStep(2), 1200),
      setTimeout(() => setStep(3), 1800),
      setTimeout(() => setStep(4), 2400),
      setTimeout(() => setStep(5), 3000),
      setTimeout(() => setStep(6), 3600),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="relative w-full h-full flex justify-center items-center">
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, type: "spring", stiffness: 90 }}
        className="relative w-[280px] lg:w-[320px] h-[560px] lg:h-[640px] rounded-[2.8rem] border-[7px] border-[#1A1A1A] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden"
      >
        {/* Dynamic Island */}
        <div className="w-[90px] h-6 bg-[#1A1A1A] absolute top-1.5 left-1/2 -translate-x-1/2 rounded-full z-30 flex items-center justify-end px-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-900 border border-blue-800/50"></div>
        </div>

        {/* App Screen Content */}
        <div className="w-full h-full flex flex-col bg-[#fafafa] overflow-hidden">

          {/* Hero Header - gradient like real app */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: step >= 1 ? 1 : 0 }}
            className="relative overflow-hidden"
          >
            <div className="absolute inset-0 rounded-b-[1.5rem]" style={{ background: 'linear-gradient(135deg, #0F3D38 0%, #165A52 100%)' }} />
            <div className="relative px-4 pt-10 pb-5">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: step >= 1 ? 1 : 0, y: step >= 1 ? 0 : 10 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-1.5 mb-1"
              >
                <span className="text-sm">👋</span>
                <span className="text-[8px] font-bold text-white/60 bg-white/10 px-1.5 py-0.5 rounded-full">IndividualPRO</span>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: step >= 1 ? 1 : 0, y: step >= 1 ? 0 : 10 }}
                transition={{ delay: 0.2 }}
                className="text-[18px] lg:text-[20px] font-bold text-white leading-tight"
              >
                Boa tarde, Ana
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: step >= 2 ? 1 : 0 }}
                transition={{ delay: 0.1 }}
                className="text-[10px] text-white/50 mt-1 font-medium"
              >
                ⚠️ 2 item(ns) vencendo hoje!
              </motion.p>

              {/* Action Cards */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: step >= 2 ? 1 : 0, y: step >= 2 ? 0 : 10 }}
                className="grid grid-cols-3 gap-1.5 mt-3"
              >
                {[
                  { icon: "📊", label: "Relatório" },
                  { icon: "🌙", label: "Check-up" },
                  { icon: "➕", label: "Adicionar" },
                ].map((card, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: step >= 2 ? 1 : 0, scale: step >= 2 ? 1 : 0.8 }}
                    transition={{ delay: 0.1 * i }}
                    className="rounded-xl p-2 text-left"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <span className="text-[11px]">{card.icon}</span>
                    <p className="text-[8px] font-semibold text-white mt-1 leading-snug">{card.label}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: step >= 3 ? 1 : 0, y: step >= 3 ? 0 : 15 }}
            className="grid grid-cols-4 gap-1.5 px-3 mt-3"
          >
            {[
              { value: "24", label: "Geladeira", color: "#3B82F6", bg: "#EFF6FF" },
              { value: "2", label: "Vencendo", color: "#F59E0B", bg: "#FFFBEB" },
              { value: "3", label: "Alertas", color: "#EF4444", bg: "#FEF2F2" },
              { value: "7", label: "Comprar", color: "#10B981", bg: "#ECFDF5" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: step >= 3 ? 1 : 0, scale: step >= 3 ? 1 : 0.8 }}
                transition={{ delay: 0.08 * i }}
                className="flex flex-col items-center rounded-xl p-2 border"
                style={{ background: stat.bg, borderColor: `${stat.color}15` }}
              >
                <span className="text-[14px] font-bold leading-none" style={{ color: stat.color }}>{stat.value}</span>
                <span className="text-[7px] mt-0.5 font-medium text-gray-500">{stat.label}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Tip Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: step >= 4 ? 1 : 0, x: step >= 4 ? 0 : -20 }}
            className="mx-3 mt-2.5 rounded-xl p-2.5 border border-amber-200/50"
            style={{ background: 'rgba(255,251,235,0.8)' }}
          >
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.15)' }}>
                <span className="text-[10px]">💡</span>
              </div>
              <div>
                <p className="text-[7px] font-bold text-amber-600/60 uppercase tracking-wider">Dica do dia</p>
                <p className="text-[10px] font-semibold text-gray-800 leading-snug">Bolo de Iogurte</p>
                <p className="text-[8px] text-gray-500 mt-0.5 leading-snug">Use o iogurte antes que vença</p>
              </div>
            </div>
          </motion.div>

          {/* Recently Added Section */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: step >= 5 ? 1 : 0, y: step >= 5 ? 0 : 15 }}
            className="px-3 mt-2.5"
          >
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-bold text-gray-800">Adicionados recentemente</p>
              <p className="text-[8px] text-[#2D6A4F] font-medium">Ver todos →</p>
            </div>
            <div className="space-y-1.5">
              {[
                { name: "Leite Integral", loc: "Geladeira", emoji: "🥛", exp: "3 dias" },
                { name: "Arroz Branco", loc: "Despensa", emoji: "🍚", exp: "6 meses" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: step >= 5 ? 1 : 0, x: step >= 5 ? 0 : -15 }}
                  transition={{ delay: 0.1 * i }}
                  className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white p-2 shadow-sm"
                >
                  <span className="text-[14px]">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-gray-800 truncate">{item.name}</p>
                    <p className="text-[7px] text-gray-400">{item.loc} • {item.exp}</p>
                  </div>
                  <ChevronRight className="w-3 h-3 text-gray-300" />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Bottom Nav */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: step >= 6 ? 1 : 0, y: step >= 6 ? 0 : 20 }}
            className="mt-auto"
          >
            <div
              className="mx-2 mb-2 rounded-2xl flex items-center justify-around h-12 border"
              style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', borderColor: 'rgba(0,0,0,0.04)' }}
            >
              {[
                { icon: Home, label: "Início", active: true },
                { icon: Refrigerator, label: "Estoque", active: false },
                { icon: ChefHat, label: "Receitas", active: false },
                { icon: ShoppingCart, label: "Lista", active: false },
                { icon: Settings, label: "Perfil", active: false },
              ].map((tab, i) => (
                <div key={i} className="flex flex-col items-center gap-0.5">
                  <div className={`relative flex items-center justify-center w-6 h-6 rounded-lg ${tab.active ? 'bg-[#2D6A4F]/10' : ''}`}>
                    <tab.icon className={`w-3.5 h-3.5 ${tab.active ? 'text-[#2D6A4F]' : 'text-gray-400'}`} />
                  </div>
                  <span className={`text-[7px] ${tab.active ? 'text-[#2D6A4F] font-semibold' : 'text-gray-400'}`}>{tab.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Floating Push Notification Effect */}
      <motion.div
        initial={{ scale: 0, opacity: 0, x: 30 }}
        animate={{ scale: 1, opacity: 1, x: 0 }}
        transition={{ delay: 2.5, type: "spring" }}
        className="absolute top-[40px] right-[-15px] lg:right-[-50px] rounded-2xl p-3 shadow-2xl z-30 flex items-center gap-2.5 max-w-[200px]"
        style={{ background: 'rgba(250,248,244,0.97)', backdropFilter: 'blur(12px)', border: '1px solid rgba(232,226,217,0.6)' }}
      >
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#F59E0B18' }}>
          <span className="text-sm">⚠️</span>
        </div>
        <div>
          <p className="font-bold text-[10px] text-gray-800">Validade Próxima</p>
          <p className="text-[8px] text-gray-500 mt-0.5 leading-snug">Iogurte vence amanhã</p>
        </div>
      </motion.div>

      {/* Floating Sync Badge */}
      <motion.div
        initial={{ scale: 0, opacity: 0, x: -30 }}
        animate={{ scale: 1, opacity: 1, x: 0 }}
        transition={{ delay: 3.0, type: "spring" }}
        className="absolute bottom-[100px] left-[-15px] lg:left-[-60px] rounded-xl p-2.5 shadow-xl z-30 flex items-center gap-2"
        style={{ background: 'rgba(250,248,244,0.97)', backdropFilter: 'blur(12px)', border: '1px solid rgba(232,226,217,0.6)' }}
      >
        <div className="w-2 h-2 rounded-full bg-[#52B788] animate-pulse"></div>
        <p className="font-bold text-[9px] text-gray-700">Sincronização 24/7</p>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// DEMO TABS — Full app rendered in HTML (no login)
// ═══════════════════════════════════════════════

// — HOME TAB (full replica)
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

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="flex items-center gap-2 rounded-xl bg-white border border-gray-100 px-3 py-2">
          <Search className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-[10px] text-gray-400">Buscar itens...</span>
        </div>
      </div>

      {/* Category pills */}
      <div className="px-4 mb-3 flex gap-1.5 overflow-x-auto hide-scrollbar">
        {categories.map((cat, i) => (
          <div key={i} className={`shrink-0 px-2.5 py-1 rounded-full text-[9px] font-semibold border ${cat.active ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]' : 'bg-white text-gray-600 border-gray-200'}`}>
            {cat.name} ({cat.count})
          </div>
        ))}
      </div>

      {/* Items */}
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

      {/* Suggestion banner */}
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

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="flex items-center gap-2 rounded-xl bg-white border border-gray-100 px-3 py-2">
          <Search className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-[10px] text-gray-400">Buscar receitas...</span>
        </div>
      </div>

      {/* Recipe cards */}
      <div className="px-4 space-y-2 pb-16">
        {recipes.map((recipe, i) => (
          <div key={i} className={`flex items-center gap-2.5 rounded-xl border p-2.5 shadow-sm ${recipe.highlight ? 'border-amber-200 bg-amber-50/50' : 'border-gray-100 bg-white'}`}>
            <span className="text-xl">{recipe.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-gray-800">{recipe.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[7px] text-gray-400 flex items-center gap-0.5"><Timer className="w-2 h-2" /> {recipe.time}</span>
                <span className="text-[7px] text-gray-400">• {recipe.diff}</span>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-[9px] font-bold ${parseInt(recipe.match) >= 90 ? 'text-emerald-600' : 'text-gray-500'}`}>{recipe.match}</span>
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

      {/* Alert */}
      <div className="mx-4 mb-3 rounded-xl p-2.5 flex items-center gap-2 bg-amber-50 border border-amber-200/60">
        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <p className="text-[9px] font-bold text-amber-700">Repor Sabão em Pó e Papel Higiênico hoje.</p>
      </div>

      {/* Items */}
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

      {/* Plan badge */}
      <div className="mx-4 mb-3 rounded-xl p-3 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #1B3A2D 100%)' }}>
        <div>
          <p className="text-[8px] font-bold text-white/60 uppercase tracking-wider">Plano atual</p>
          <p className="text-[12px] font-bold text-white">IndividualPRO</p>
        </div>
        <span className="text-[8px] font-bold text-white bg-white/20 px-2 py-0.5 rounded-full">Ativo</span>
      </div>

      {/* Settings sections */}
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
// INTERACTIVE DEMO PHONE — Full app with bottom nav & push notifications
// ═══════════════════════════════════════════════

const InteractiveDemoPhone = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [showNotif, setShowNotif] = useState(false);
  const [currentNotif, setCurrentNotif] = useState(0);
  const notifCycle = useRef<NodeJS.Timeout | null>(null);

  // Auto-cycle push notifications
  useEffect(() => {
    let idx = 0;
    const cycle = () => {
      setCurrentNotif(idx);
      setShowNotif(true);
      setTimeout(() => setShowNotif(false), 3200);
      idx = (idx + 1) % pushNotifications.length;
    };

    // First notification after 2s
    const initial = setTimeout(cycle, 2000);
    // Then every 6s
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
    <div className="relative w-full max-w-[340px] h-[640px] lg:h-[680px] rounded-[2.8rem] border-[7px] border-[#1A1A1A] shadow-[0_30px_80px_-15px_rgba(0,0,0,0.5)] overflow-hidden bg-[#fafafa]">
      {/* Dynamic Island */}
      <div className="w-[90px] h-6 bg-[#1A1A1A] absolute top-1.5 left-1/2 -translate-x-1/2 rounded-full z-50 flex items-center justify-end px-2.5">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-900 border border-blue-800/50"></div>
      </div>

      {/* Push Notification Overlay */}
      <PushNotificationOverlay show={showNotif} notification={pushNotifications[currentNotif]} />

      {/* Screen Content */}
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

        {/* Bottom Navigation */}
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

        {/* FAB */}
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
// ORIGINAL DEMO MOCKUPS (kept for the tab-based view)
// ═══════════════════════════════════════════════

const DemoIndividual = () => (
  <div className="flex flex-col h-full bg-fundo-claro">
    <div className="p-5 bg-superficie border-b border-borda">
      <h4 className="font-fraunces text-lg font-bold text-verde-escuro">Meu Painel Solo</h4>
      <p className="text-texto-secundario text-[11px] mt-0.5">Tudo concentrado em uma única conta, simples, claro e direto.</p>
    </div>
    <div className="p-5 flex flex-col gap-3">
      <div className="bg-superficie border border-borda rounded-xl p-3.5 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-verde-palido p-2 rounded-lg text-principal"><Box className="w-4 h-4" /></div>
          <div><p className="font-bold text-sm text-texto-principal">Estoque Geral</p><p className="text-[11px] text-texto-secundario">142 itens controlados</p></div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300" />
      </div>
      <div className="bg-superficie border border-borda rounded-xl p-3.5 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-[#FFF9F0] p-2 rounded-lg text-ambar"><ShoppingCart className="w-4 h-4" /></div>
          <div><p className="font-bold text-sm text-texto-principal">Minha Lista</p><p className="text-[11px] text-texto-secundario">12 itens pendentes</p></div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300" />
      </div>
      <div className="bg-superficie border border-borda rounded-xl p-3.5 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-[#FFF5F5] p-2 rounded-lg text-red-500"><AlertCircle className="w-4 h-4" /></div>
          <div><p className="font-bold text-sm text-texto-principal">Alertas</p><p className="text-[11px] text-texto-secundario">2 itens vencendo</p></div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300" />
      </div>
    </div>
  </div>
);

const DemoMestre = () => (
  <div className="flex flex-col h-full bg-superficie relative">
    <div className="p-5 bg-verde-escuro text-white rounded-t-[1.5rem]">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-fraunces text-lg font-bold">Visão da Casa</h4>
        <div className="bg-white/20 px-2.5 py-0.5 rounded-full text-[10px] font-mono">CONTA MESTRE</div>
      </div>
      <p className="text-verde-palido text-[11px]">A conta mestre visualiza a casa inteira e controla os demais acessos.</p>
    </div>
    <div className="p-5 flex flex-col gap-3">
      <h5 className="font-bold text-xs text-texto-principal uppercase tracking-widest">Membros Conectados</h5>

      <div className="border border-borda rounded-xl p-3.5 flex justify-between items-center relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-principal"></div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-verde-palido flex items-center justify-center font-bold text-principal text-sm">A</div>
          <div><p className="font-bold text-sm text-texto-principal">Ana (Você)</p><p className="text-[11px] text-texto-secundario">Conta Mestre • Online</p></div>
        </div>
        <button className="text-[10px] border border-borda px-2 py-0.5 rounded-full text-texto-secundario bg-gray-50 cursor-default">Ativo</button>
      </div>

      <div className="border border-borda rounded-xl p-3.5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-bold text-texto-secundario text-sm">L</div>
          <div><p className="font-bold text-sm text-texto-principal">Lucas</p><p className="text-[11px] text-texto-secundario">Subconta Compras • iPhone</p></div>
        </div>
        <button className="text-[10px] border border-red-100 bg-red-50 text-red-600 px-2 py-0.5 rounded-full">Desconectar</button>
      </div>

      <button className="mt-1 w-full py-2.5 bg-fundo-claro border border-borda rounded-xl text-sm font-bold text-principal flex items-center justify-center gap-2">
        <Settings className="w-4 h-4" /> Gerenciar Acessos
      </button>
    </div>
  </div>
);

const DemoCompras = () => (
  <div className="flex flex-col h-full bg-fundo-claro">
    <div className="p-5 bg-superficie border-b border-borda flex justify-between items-center">
      <div>
        <h4 className="font-fraunces text-lg font-bold text-verde-escuro">Compras</h4>
        <p className="text-texto-secundario text-[11px] mt-0.5">Perfil focado apenas em suprimentos.</p>
      </div>
      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-bold text-texto-secundario text-sm">L</div>
    </div>
    <div className="p-5 flex flex-col gap-2.5">
      <div className="bg-[#FFF9F0] border border-[#FFEACA] rounded-xl p-2.5 flex gap-2.5 text-ambar mb-1 shadow-sm">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <p className="text-[11px] font-bold">Repor Sabão em Pó e Papel Higiênico hoje.</p>
      </div>

      {[
        { n: "Leite Integral", q: "3 caixas", done: true },
        { n: "Ovos", q: "1 dúzia", done: false },
        { n: "Detergente Neutro", q: "2 unidades", done: false }
      ].map((i, idx) => (
        <div key={idx} className={`bg-superficie border border-borda rounded-xl p-3.5 flex items-center gap-3 shadow-sm transition-opacity ${i.done ? 'opacity-50' : 'opacity-100'}`}>
          <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${i.done ? 'bg-principal border-principal' : 'border-gray-300'}`}>
            {i.done && <Check className="w-2.5 h-2.5 text-white" />}
          </div>
          <div>
            <p className={`font-bold text-sm ${i.done ? 'line-through text-texto-secundario' : 'text-texto-principal'}`}>{i.n}</p>
            <p className="text-[11px] text-texto-secundario">{i.q}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const DemoCozinha = () => (
  <div className="flex flex-col h-full bg-superficie">
    <div className="p-5 bg-verde-palido border-b border-verde-claro/30 flex justify-between items-center">
      <div>
        <h4 className="font-fraunces text-lg font-bold text-principal">Cozinha</h4>
        <p className="text-principal/80 text-[11px] mt-0.5">Receitas e planejamento.</p>
      </div>
      <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center font-bold text-principal shadow-sm text-sm">M</div>
    </div>
    <div className="p-5 flex flex-col gap-3">
      <div className="bg-superficie border border-red-100 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-red-50 p-2 flex items-center gap-2 text-red-600 border-b border-red-100">
          <AlertCircle className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Aviso de Validade</span>
        </div>
        <div className="p-3.5">
          <p className="text-sm font-bold text-texto-principal">Iogurte Natural vence amanhã.</p>
          <p className="text-[11px] text-texto-secundario mt-1">Temos receita de Bolo de Iogurte disponível.</p>
        </div>
      </div>

      <h5 className="font-bold text-xs text-texto-principal uppercase tracking-widest mt-1">Plano de Hoje</h5>
      <div className="border border-borda rounded-xl p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-fundo-claro flex items-center justify-center text-principal">
            <ChefHat className="w-4 h-4" />
          </div>
          <div>
            <p className="text-texto-secundario text-[11px]">Jantar</p>
            <p className="font-bold text-sm text-texto-principal">Risoto de Queijo</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300" />
      </div>
    </div>
  </div>
);

const DemoSessoes = () => (
  <div className="flex flex-col h-full bg-fundo-claro">
    <div className="p-5 bg-verde-escuro text-white text-center">
      <ShieldCheck className="w-7 h-7 mx-auto text-verde-palido mb-2" />
      <h4 className="font-fraunces text-lg font-bold">Controle de Sessões</h4>
      <p className="text-verde-palido text-[11px] mt-0.5">Gerencie os acessos do MultiPRO em tempo real.</p>
    </div>
    <div className="p-5 flex flex-col gap-2.5">
      <div className="bg-superficie border border-principal rounded-xl p-3.5 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-principal text-white text-[9px] uppercase font-bold px-2 py-0.5 rounded-bl-lg">Este Aparelho</div>
        <div className="flex items-center gap-3">
          <Smartphone className="w-5 h-5 text-principal" />
          <div><p className="font-bold text-sm text-texto-principal">iPhone 15 Pro - Ana (Mestre)</p><p className="text-[11px] text-verde-claro font-bold">Online agora</p></div>
        </div>
      </div>
      <div className="bg-superficie border border-borda rounded-xl p-3.5 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Smartphone className="w-5 h-5 text-texto-secundario" />
          <div><p className="font-bold text-sm text-texto-principal">Galaxy S23 - Lucas (Compras)</p><p className="text-[11px] text-verde-claro font-bold">Online agora</p></div>
        </div>
        <button className="text-gray-400" title="Desconectar Sessão"><X className="w-4 h-4" /></button>
      </div>
      <div className="bg-superficie border border-borda rounded-xl p-3.5 shadow-sm opacity-60">
        <div className="flex items-center gap-3">
          <Smartphone className="w-5 h-5 text-gray-400" />
          <div><p className="font-bold text-sm text-gray-500">iPhone 13 - Marina (Cozinha)</p><p className="text-[11px] text-gray-400">Desconectado (visto há 2h)</p></div>
        </div>
      </div>
    </div>
  </div>
);


// ═══════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════

export default function SalesPage() {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { id: 0, label: "IndividualPRO", subtitle: "Uso solo" },
    { id: 1, label: "Conta Mestre", subtitle: "MultiPRO" },
    { id: 2, label: "Subconta Compras", subtitle: "MultiPRO" },
    { id: 3, label: "Subconta Cozinha", subtitle: "MultiPRO" },
    { id: 4, label: "Sessões conectadas", subtitle: "Segurança" },
  ];

  return (
    <>
      {/* Global Style Injections */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&display=swap');

        .font-fraunces { font-family: 'Fraunces', serif; }
        .font-sans { font-family: 'DM Sans', sans-serif; }
        .font-mono { font-family: 'DM Mono', monospace; }

        .bg-fundo-claro { background-color: #FAF8F4; }
        .bg-superficie { background-color: #FFFFFF; }
        .bg-principal { background-color: #2D6A4F; }
        .bg-verde-claro { background-color: #52B788; }
        .bg-verde-palido { background-color: #D8F3DC; }
        .bg-verde-escuro { background-color: #1B3A2D; }
        .bg-ambar { background-color: #F4A261; }

        .text-principal { color: #2D6A4F; }
        .text-verde-claro { color: #52B788; }
        .text-verde-palido { color: #D8F3DC; }
        .text-verde-escuro { color: #1B3A2D; }
        .text-ambar { color: #F4A261; }
        .text-texto-principal { color: #1A1A1A; }
        .text-texto-secundario { color: #5A5A5A; }

        .border-borda { border-color: #E8E2D9; }
        
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        body { background-color: #FAF8F4; color: #1A1A1A; }
        html.dark body { background-color: #FAF8F4; color: #1A1A1A; }
        
        .nav-blur {
          background: rgba(250, 248, 244, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(232, 226, 217, 0.6);
        }
      `}</style>

      <div className="min-h-screen bg-fundo-claro font-sans text-texto-principal selection:bg-verde-claro selection:text-white">

        {/* 1. NAVBAR */}
        <header className="fixed top-0 inset-x-0 nav-blur z-50">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <Link to="/pagina-de-vendas" className="flex items-center outline-none focus-visible:ring-2 focus-visible:ring-principal rounded-lg">
              <img src={LogoImage} alt="KAZA Logo" className="h-[36px] object-contain" />
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#como-ajuda" className="text-sm font-bold text-texto-principal hover:text-principal transition-colors">Funcionalidades</a>
              <a href="#multipro" className="text-sm font-bold text-texto-principal hover:text-principal transition-colors">Como funciona</a>
              <a href="#planos" className="text-sm font-bold text-texto-principal hover:text-principal transition-colors">Planos</a>
              <a href="#" className="text-sm font-bold text-texto-secundario hover:text-principal transition-colors">Blog</a>
            </nav>

            <Link to="/auth" className="bg-principal text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-verde-escuro transition-transform hover:scale-105 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 shadow-sm">
              Começar agora
            </Link>
          </div>
        </header>

        {/* Spacer for fixed nav */}
        <div className="h-20 w-full" />

        <main className="w-full flex flex-col overflow-x-hidden">

          {/* 2. HERO — Headline + Phone with real app elements + CTA */}
          <section className="relative pt-8 lg:pt-16 pb-16 lg:pb-0 w-full overflow-hidden">

            {/* Dynamic Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
              <div className="absolute top-0 left-[-10%] w-[60%] lg:w-[40%] h-[600px] lg:h-[800px] bg-[#D4C3FD] rounded-full blur-[100px] opacity-40 mix-blend-multiply" />
              <div className="absolute top-0 right-[-10%] w-[60%] lg:w-[40%] h-[600px] lg:h-[800px] bg-[#FFE0C8] rounded-full blur-[100px] opacity-50 mix-blend-multiply" />
              <div className="absolute top-[60%] left-1/2 -translate-x-1/2 w-full h-[400px] bg-gradient-to-b from-transparent to-white z-10" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col items-center">

              {/* Headline — centered, no logo/bar needed */}
              <div className="text-center max-w-3xl mx-auto mb-10 lg:mb-14">
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="inline-block px-4 py-1.5 border border-principal/20 text-principal font-bold text-[10px] rounded-full tracking-widest uppercase mb-6 shadow-sm bg-white/50 backdrop-blur-sm"
                >
                  Gestão doméstica inteligente
                </motion.span>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="font-fraunces text-4xl md:text-5xl lg:text-7xl font-bold text-texto-principal leading-[1.05] mb-5 tracking-tight text-balance"
                >
                  A casa que se organiza com você.
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.5 }}
                  className="text-texto-secundario text-base lg:text-lg font-medium leading-relaxed max-w-xl mx-auto mb-2 text-balance"
                >
                  KAZA cuida do estoque, avisa o que está acabando, sugere refeições e organiza a lista de compras da casa.
                </motion.p>
              </div>

              {/* Phone Mockup with real app elements */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.7 }}
                className="relative w-[320px] lg:w-[380px] h-[580px] lg:h-[680px] mb-8"
              >
                <HeroPhoneMockup />
              </motion.div>

              {/* CTA below the phone */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="flex flex-col items-center gap-4 mb-6"
              >
                <Link to="/auth" className="bg-principal text-white px-10 py-4 rounded-full text-center transition-all shadow-lg hover:-translate-y-1 hover:shadow-xl font-bold text-base">
                  Começar agora — é grátis por 7 dias
                </Link>

                <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm border border-borda rounded-full px-5 py-2.5 shadow-sm">
                  <Globe className="w-4 h-4 text-principal shrink-0" />
                  <p className="text-sm font-medium text-texto-secundario">
                    <span className="text-texto-principal font-bold">WebApp</span> — funciona direto no navegador, em <span className="text-texto-principal font-bold">Android</span> e <span className="text-texto-principal font-bold">iOS</span>
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 lg:gap-8 text-[11px] font-bold text-texto-secundario items-center">
                  <p>• IndividualPRO: <span className="text-texto-principal">R$19,90/mês</span></p>
                  <p>• MultiPRO: <span className="text-texto-principal">R$37,90/mês</span> <span className="bg-ambar/10 text-ambar px-2 py-0.5 rounded ml-1 border border-ambar/20 uppercase tracking-widest text-[9px]">7 Dias Grátis</span></p>
                </div>
              </motion.div>

            </div>
          </section>

          {/* 3. COMO O KAZA TE AJUDA (Bento Grid) */}
          <section id="como-ajuda" className="py-24 bg-white relative">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="font-fraunces text-4xl md:text-5xl font-bold text-verde-escuro mb-4 tracking-tight">Tudo que sua casa precisa, em um só lugar</h2>
                <p className="text-texto-secundario text-lg font-medium">Do que está vencendo ao que falta comprar — o KAZA reduz a carga mental da rotina.</p>
              </div>

              <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 md:gap-6 pb-8 md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible pr-6 md:pr-0 pl-6 md:pl-0 -mx-6 md:mx-0 hide-scrollbar pt-2">
                <div className="shrink-0 w-[85vw] sm:w-[320px] md:w-auto snap-center bg-fundo-claro border border-borda rounded-3xl p-8 hover:-translate-y-1 transition-transform group">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-borda flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Box className="w-6 h-6 text-principal" />
                  </div>
                  <h3 className="font-bold text-xl text-texto-principal mb-3">Controle de estoque</h3>
                  <p className="text-texto-secundario font-medium leading-relaxed text-sm">Gerencie geladeira, despensa e limpeza com alertas de reposição e validade.</p>
                </div>
                <div className="shrink-0 w-[85vw] sm:w-[320px] md:w-auto snap-center bg-fundo-claro border border-borda rounded-3xl p-8 hover:-translate-y-1 transition-transform group">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-borda flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <ChefHat className="w-6 h-6 text-principal" />
                  </div>
                  <h3 className="font-bold text-xl text-texto-principal mb-3">Receitas inteligentes</h3>
                  <p className="text-texto-secundario font-medium leading-relaxed text-sm">O app sugere receitas com base no que existe em casa.</p>
                </div>
                <div className="shrink-0 w-[85vw] sm:w-[320px] md:w-auto snap-center bg-fundo-claro border border-borda rounded-3xl p-8 hover:-translate-y-1 transition-transform group">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-borda flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Calendar className="w-6 h-6 text-principal" />
                  </div>
                  <h3 className="font-bold text-xl text-texto-principal mb-3">Plano de refeições</h3>
                  <p className="text-texto-secundario font-medium leading-relaxed text-sm">Monte semana ou mês com café, almoço, jantar e lanches.</p>
                </div>
                <div className="shrink-0 w-[85vw] sm:w-[320px] md:w-auto snap-center bg-fundo-claro border border-borda rounded-3xl p-8 hover:-translate-y-1 transition-transform group">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-borda flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <ListChecks className="w-6 h-6 text-principal" />
                  </div>
                  <h3 className="font-bold text-xl text-texto-principal mb-3">Lista de compras</h3>
                  <p className="text-texto-secundario font-medium leading-relaxed text-sm">A lista se atualiza com o que acabou, vai vencer ou faltará em breve.</p>
                </div>
                <div className="shrink-0 w-[85vw] sm:w-[320px] md:w-auto snap-center bg-verde-escuro border border-verde-escuro rounded-3xl p-8 shadow-xl hover:-translate-y-1 transition-transform group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform relative z-10">
                    <Users className="w-6 h-6 text-verde-escuro" />
                  </div>
                  <h3 className="font-bold text-xl text-white mb-3 relative z-10">Perfis compartilhados</h3>
                  <p className="text-verde-palido/90 font-medium leading-relaxed text-sm relative z-10">No MultiPRO, até 3 acessos participam da mesma casa com organização centralizada.</p>
                </div>
                <div className="shrink-0 w-[85vw] sm:w-[320px] md:w-auto snap-center bg-fundo-claro border border-borda rounded-3xl p-8 hover:-translate-y-1 transition-transform group">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-borda flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Bell className="w-6 h-6 text-principal" />
                  </div>
                  <h3 className="font-bold text-xl text-texto-principal mb-3">Notificações por perfil</h3>
                  <p className="text-texto-secundario font-medium leading-relaxed text-sm">Cada acesso pode receber alertas específicos conforme seu papel na casa.</p>
                </div>
              </div>
            </div>
          </section>

          {/* 4. MULTIPRO NA PRÁTICA */}
          <section id="multipro" className="py-24 bg-verde-palido/40">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="font-fraunces text-4xl md:text-5xl font-bold text-verde-escuro mb-4 tracking-tight">Uma casa, até 3 acessos, cada pessoa com seu papel</h2>
                <p className="text-texto-secundario text-lg font-medium">No MultiPRO, todos compartilham a mesma casa, mas cada perfil entra com sua própria sessão, suas permissões e suas notificações.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10">
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-borda relative">
                  <div className="absolute top-0 right-10 -translate-y-1/2 bg-verde-escuro text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full shadow-lg">Gestão Global</div>
                  <div className="w-16 h-16 rounded-full bg-verde-escuro flex items-center justify-center text-white text-xl font-bold mb-6 shadow-sm">A</div>
                  <h3 className="font-fraunces text-xl font-bold text-texto-principal mb-1">CONTA MESTRE — ANA</h3>
                  <p className="text-sm font-mono text-verde-claro mb-6">Administração</p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3"><Check className="w-4 h-4 text-principal shrink-0 mt-0.5" /><span className="text-sm text-texto-secundario">Controla acessos e convida perfis</span></li>
                    <li className="flex items-start gap-3"><Check className="w-4 h-4 text-principal shrink-0 mt-0.5" /><span className="text-sm text-texto-secundario">Visualiza quem está conectado</span></li>
                    <li className="flex items-start gap-3"><Check className="w-4 h-4 text-principal shrink-0 mt-0.5" /><span className="text-sm text-texto-secundario">Pode trocar de perfil livremente</span></li>
                    <li className="flex items-start gap-3"><Check className="w-4 h-4 text-principal shrink-0 mt-0.5" /><span className="text-sm text-texto-secundario">Pode desconectar outras sessões</span></li>
                  </ul>
                </div>

                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-borda relative mt-8 md:mt-0">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-texto-secundario text-xl font-bold mb-6 border border-borda">L</div>
                  <h3 className="font-fraunces text-xl font-bold text-texto-principal mb-1">SUBCONTA COMPRAS — LUCAS</h3>
                  <p className="text-sm font-mono text-texto-secundario mb-6">Restrito a suprimentos</p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3"><Check className="w-4 h-4 text-texto-secundario shrink-0 mt-0.5" /><span className="text-sm text-texto-secundario">Recebe alerta apenas de mercado</span></li>
                    <li className="flex items-start gap-3"><Check className="w-4 h-4 text-texto-secundario shrink-0 mt-0.5" /><span className="text-sm text-texto-secundario">Pode marcar itens comprados</span></li>
                    <li className="flex items-start gap-3"><Check className="w-4 h-4 text-texto-secundario shrink-0 mt-0.5" /><span className="text-sm text-texto-secundario">Visualiza lista e verfica o estoque global</span></li>
                    <li className="flex items-start gap-3"><Check className="w-4 h-4 text-texto-secundario shrink-0 mt-0.5" /><span className="text-sm text-texto-secundario text-red-400 font-medium">Não vê receitas e outras áreas sem permissão</span></li>
                  </ul>
                </div>

                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-borda relative mt-8 md:mt-0">
                  <div className="w-16 h-16 rounded-full bg-fundo-claro flex items-center justify-center text-principal text-xl font-bold mb-6 border border-borda">M</div>
                  <h3 className="font-fraunces text-xl font-bold text-texto-principal mb-1">SUBCONTA COZINHA — MARINA</h3>
                  <p className="text-sm font-mono text-texto-secundario mb-6">Foco nas refeições</p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3"><Check className="w-4 h-4 text-texto-secundario shrink-0 mt-0.5" /><span className="text-sm text-texto-secundario">Recebe alertas de validade da dispensa</span></li>
                    <li className="flex items-start gap-3"><Check className="w-4 h-4 text-texto-secundario shrink-0 mt-0.5" /><span className="text-sm text-texto-secundario">Visualiza e edita o plano de refeições</span></li>
                    <li className="flex items-start gap-3"><Check className="w-4 h-4 text-texto-secundario shrink-0 mt-0.5" /><span className="text-sm text-texto-secundario">Acompanha receitas e ingredientes em uso</span></li>
                  </ul>
                </div>
              </div>

              <div className="mt-12 text-center">
                <p className="text-sm text-texto-secundario italic font-medium bg-white inline-block px-6 py-2 rounded-full border border-borda shadow-sm">
                  A conta mestre é criada primeiro e pode gerenciar os demais acessos quando quiser.
                </p>
              </div>
            </div>
          </section>

          {/* 5. DEMO INTERATIVA — FULL APP RUNNING IN HTML */}
          <section id="demo" className="py-16 lg:py-24 bg-[#11241C] relative overflow-hidden">
            {/* Background texture */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#52B788 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
              <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
                <motion.span
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="inline-block px-4 py-1.5 border border-[#52B788]/30 text-[#52B788] font-bold text-[10px] rounded-full tracking-widest uppercase mb-5 bg-[#52B788]/5"
                >
                  Experiência completa sem login
                </motion.span>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="font-fraunces text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight"
                >
                  Explore o KAZA funcionando em tempo real
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="text-verde-palido/70 text-base lg:text-lg font-medium max-w-xl mx-auto"
                >
                  Navegue por cada tela, veja notificações aparecerem e sinta a experiência completa do app — tudo direto aqui.
                </motion.p>
              </div>

              <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-center">

                {/* Left: Tab navigation for MultiPRO views */}
                <div className="w-full lg:w-[360px] flex flex-col gap-2 z-10">
                  <p className="text-[10px] font-bold text-[#52B788]/60 uppercase tracking-widest mb-2 px-1">Modos de visualização</p>
                  {tabs.map((tab, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full text-left p-4 rounded-xl transition-all border outline-none focus-visible:ring-2 focus-visible:ring-white flex items-center justify-between group ${activeTab === tab.id
                        ? 'bg-verde-escuro border-verde-claro shadow-lg'
                        : 'bg-transparent border-white/10 hover:bg-white/5 hover:border-white/20'
                        }`}
                    >
                      <div>
                        <p className={`text-[9px] uppercase font-bold tracking-widest mb-0.5 ${activeTab === tab.id ? 'text-verde-claro' : 'text-gray-500'}`}>{tab.subtitle}</p>
                        <h4 className={`text-base font-bold ${activeTab === tab.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>{tab.label}</h4>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === tab.id ? 'text-white translate-x-1' : 'text-gray-600'}`} />
                    </button>
                  ))}
                </div>

                {/* Center: Interactive Demo Phone */}
                <div className="flex-1 flex justify-center items-center">
                  <div className="relative">
                    <InteractiveDemoPhone />

                    {/* Glow effect behind phone */}
                    <div className="absolute inset-0 -z-10 blur-[60px] opacity-20" style={{ background: 'radial-gradient(ellipse at center, #52B788 0%, transparent 70%)' }} />
                  </div>
                </div>

                {/* Right: MultiPRO view in second phone */}
                <div className="hidden lg:flex flex-col items-center">
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">Visão MultiPRO</p>
                  <div className="w-[260px] h-[520px] rounded-[2.5rem] border-[6px] border-[#2A3A33] shadow-2xl overflow-hidden bg-white relative">
                    {/* Notch */}
                    <div className="absolute top-1 inset-x-0 h-4 bg-transparent flex justify-center z-50 pointer-events-none">
                      <div className="w-[70px] h-4 bg-[#2A3A33] rounded-b-xl"></div>
                    </div>
                    <div className="w-full h-full overflow-hidden">
                      <AnimatePresence mode="popLayout">
                        <motion.div
                          key={activeTab}
                          initial={{ opacity: 0, scale: 0.92, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.92, y: -20 }}
                          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                          className="w-full h-full"
                        >
                          {activeTab === 0 && <DemoIndividual />}
                          {activeTab === 1 && <DemoMestre />}
                          {activeTab === 2 && <DemoCompras />}
                          {activeTab === 3 && <DemoCozinha />}
                          {activeTab === 4 && <DemoSessoes />}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile: show second phone below on small screens */}
              <div className="lg:hidden mt-10">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4 text-center">Visão MultiPRO</p>
                <div className="flex justify-center">
                  <div className="w-full max-w-[300px] h-[520px] rounded-[2.5rem] border-[6px] border-[#2A3A33] shadow-2xl overflow-hidden bg-white relative">
                    <div className="absolute top-1 inset-x-0 h-4 bg-transparent flex justify-center z-50 pointer-events-none">
                      <div className="w-[70px] h-4 bg-[#2A3A33] rounded-b-xl"></div>
                    </div>
                    <div className="w-full h-full overflow-hidden">
                      <AnimatePresence mode="popLayout">
                        <motion.div
                          key={activeTab}
                          initial={{ opacity: 0, scale: 0.92, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.92, y: -20 }}
                          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                          className="w-full h-full"
                        >
                          {activeTab === 0 && <DemoIndividual />}
                          {activeTab === 1 && <DemoMestre />}
                          {activeTab === 2 && <DemoCompras />}
                          {activeTab === 3 && <DemoCozinha />}
                          {activeTab === 4 && <DemoSessoes />}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 6. PLANOS DE PREÇO */}
          <section id="planos" className="py-24 bg-white relative">
            <div className="max-w-5xl mx-auto px-6">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="font-fraunces text-4xl md:text-5xl font-bold text-verde-escuro mb-4 tracking-tight">Escolha o plano ideal para sua casa</h2>
                <p className="text-texto-secundario text-lg font-medium">Use sozinho com o IndividualPRO ou compartilhe a gestão da casa com até 3 acessos no MultiPRO.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-20 relative items-center">

                <div className="bg-superficie border border-borda rounded-[3rem] p-10 lg:p-12 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
                  <h3 className="font-fraunces text-3xl font-bold text-texto-principal mb-2">IndividualPRO</h3>
                  <p className="text-texto-secundario mb-8 font-medium">Para quem organiza a casa sozinho com total clareza.</p>

                  <div className="mb-10">
                    <span className="text-5xl font-bold font-mono tracking-tighter text-texto-principal">R$19,90</span><span className="text-texto-secundario">/mês</span>
                  </div>

                  <ul className="space-y-4 mb-10 flex-1">
                    <li className="flex items-start gap-3"><Check className="text-principal shrink-0 w-5 h-5" /> <span className="font-medium text-texto-principal">1 conta principal, 1 usuário</span></li>
                    <li className="flex items-start gap-3"><Check className="text-principal shrink-0 w-5 h-5" /> <span className="font-medium text-texto-principal">Estoque completo e infinito</span></li>
                    <li className="flex items-start gap-3"><Check className="text-principal shrink-0 w-5 h-5" /> <span className="font-medium text-texto-principal">Alertas de validade e reposição</span></li>
                    <li className="flex items-start gap-3"><Check className="text-principal shrink-0 w-5 h-5" /> <span className="font-medium text-texto-principal">Lista de compras inteligente e receitas</span></li>
                    <li className="flex items-start gap-3"><Check className="text-principal shrink-0 w-5 h-5" /> <span className="font-medium text-texto-principal">Notificações da rotina geral</span></li>
                  </ul>

                  <Link to="/auth" className="bg-fundo-claro border border-borda hover:bg-gray-50 text-texto-principal font-bold py-4 rounded-full text-center transition-colors shadow-sm outline-none w-full block">
                    Escolher IndividualPRO
                  </Link>
                </div>

                <div className="bg-verde-escuro border border-[#234B3B] rounded-[3rem] p-10 lg:p-12 shadow-2xl flex flex-col h-full relative overflow-hidden md:scale-105 z-10">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-principal rounded-full blur-[80px] -z-10 opacity-50"></div>
                  <div className="absolute top-8 right-8 bg-ambar text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full">Mais completo</div>

                  <h3 className="font-fraunces text-3xl font-bold text-white mb-2">MultiPRO</h3>
                  <p className="text-verde-palido/80 mb-8 font-medium pr-12 text-balance leading-relaxed">Para casas com gestão compartilhada, múltiplos acessos e controle central.</p>

                  <div className="mb-10 flex flex-col items-start gap-1">
                    <div className="flex items-baseline">
                      <span className="text-5xl font-bold font-mono tracking-tighter text-white">R$37,90</span><span className="text-verde-palido/60">/mês</span>
                    </div>
                  </div>

                  <ul className="space-y-4 mb-10 flex-1">
                    <li className="flex items-start gap-3"><Check className="text-ambar shrink-0 w-5 h-5" /> <span className="font-medium text-white italic">Tudo do IndividualPRO, mais:</span></li>
                    <li className="flex items-start gap-3"><Check className="text-verde-claro shrink-0 w-5 h-5" /> <span className="font-medium text-white">Até 3 acessos (Conta mestre + subcontas)</span></li>
                    <li className="flex items-start gap-3"><Check className="text-verde-claro shrink-0 w-5 h-5" /> <span className="font-medium text-white">Permissões e notificações por perfil</span></li>
                    <li className="flex items-start gap-3"><Check className="text-verde-claro shrink-0 w-5 h-5" /> <span className="font-medium text-white">Lista e estoque unificados para todos</span></li>
                    <li className="flex items-start gap-3"><Check className="text-verde-claro shrink-0 w-5 h-5" /> <span className="font-medium text-white">Visualização e controle de sessões conectadas</span></li>
                  </ul>

                  <Link to="/auth" className="bg-ambar hover:bg-orange-500 text-white font-bold py-4 rounded-full text-center transition-all shadow-[0_10px_20px_-10px_rgba(244,162,97,0.5)] outline-none w-full block hover:-translate-y-1">
                    Testar MultiPRO por 7 dias
                  </Link>
                </div>
              </div>

              {/* Comparativo Rápido */}
              <div className="bg-fundo-claro border border-borda rounded-[2rem] p-6 md:p-12 shadow-sm">
                <h4 className="font-bold text-xl text-center mb-6 md:mb-8">Comparativo Rápido</h4>

                <table className="w-full text-left hidden md:table">
                  <thead>
                    <tr className="border-b border-borda">
                      <th className="py-4 px-2 text-texto-secundario font-medium">Recurso</th>
                      <th className="py-4 px-2 font-bold text-texto-principal w-1/3 text-center">IndividualPRO</th>
                      <th className="py-4 px-2 font-bold text-verde-escuro w-1/3 text-center bg-verde-palido/20 rounded-t-xl">MultiPRO</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    <tr className="border-b border-borda">
                      <td className="py-4 px-2 font-medium">Preço mensal</td>
                      <td className="py-4 px-2 text-center font-mono text-texto-secundario">R$19,90/mês</td>
                      <td className="py-4 px-2 text-center font-mono font-bold text-principal bg-verde-palido/20">R$37,90/mês</td>
                    </tr>
                    <tr className="border-b border-borda">
                      <td className="py-4 px-2 font-medium">Usuários</td>
                      <td className="py-4 px-2 text-center text-texto-secundario">1</td>
                      <td className="py-4 px-2 text-center font-bold text-principal bg-verde-palido/20">Até 3 acessos</td>
                    </tr>
                    <tr className="border-b border-borda">
                      <td className="py-4 px-2 font-medium">Conta mestre</td>
                      <td className="py-4 px-2 text-center text-gray-300">—</td>
                      <td className="py-4 px-2 text-center font-bold text-principal bg-verde-palido/20"><Check className="w-4 h-4 mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-borda">
                      <td className="py-4 px-2 font-medium">Subcontas</td>
                      <td className="py-4 px-2 text-center text-gray-300">—</td>
                      <td className="py-4 px-2 text-center font-bold text-principal bg-verde-palido/20"><Check className="w-4 h-4 mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-borda">
                      <td className="py-4 px-2 font-medium">Notificações por perfil</td>
                      <td className="py-4 px-2 text-center text-gray-300">—</td>
                      <td className="py-4 px-2 text-center font-bold text-principal bg-verde-palido/20"><Check className="w-4 h-4 mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-borda">
                      <td className="py-4 px-2 font-medium">Sessões conectadas</td>
                      <td className="py-4 px-2 text-center text-gray-300">—</td>
                      <td className="py-4 px-2 text-center font-bold text-principal bg-verde-palido/20"><Check className="w-4 h-4 mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-borda">
                      <td className="py-4 px-2 font-medium">Gestão compartilhada</td>
                      <td className="py-4 px-2 text-center text-gray-300">—</td>
                      <td className="py-4 px-2 text-center font-bold text-principal bg-verde-palido/20"><Check className="w-4 h-4 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="py-4 px-2 font-medium">Teste Grátis</td>
                      <td className="py-4 px-2 text-center text-texto-secundario">—</td>
                      <td className="py-4 px-2 text-center font-bold text-ambar bg-verde-palido/20 rounded-b-xl">7 dias de teste</td>
                    </tr>
                  </tbody>
                </table>

                {/* Mobile: stacked cards */}
                <div className="md:hidden flex flex-col gap-3">
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="text-[11px] font-bold text-texto-secundario uppercase tracking-wider">Recurso</div>
                    <div className="text-[11px] font-bold text-texto-principal text-center uppercase tracking-wider">Individual</div>
                    <div className="text-[11px] font-bold text-verde-escuro text-center uppercase tracking-wider bg-verde-palido/30 rounded-lg py-1">MultiPRO</div>
                  </div>
                  {[
                    { recurso: "Preço mensal", ind: "R$19,90", multi: "R$37,90", isText: true },
                    { recurso: "Usuários", ind: "1", multi: "Até 3", isText: true },
                    { recurso: "Conta mestre", ind: false, multi: true, isText: false },
                    { recurso: "Subcontas", ind: false, multi: true, isText: false },
                    { recurso: "Notificações por perfil", ind: false, multi: true, isText: false },
                    { recurso: "Sessões conectadas", ind: false, multi: true, isText: false },
                    { recurso: "Gestão compartilhada", ind: false, multi: true, isText: false },
                    { recurso: "Teste Grátis", ind: "—", multi: "7 dias", isText: true, multiHighlight: true },
                  ].map((row, idx) => (
                    <div key={idx} className="grid grid-cols-3 gap-2 items-center bg-white rounded-xl border border-borda p-3 shadow-sm">
                      <p className="text-sm font-medium text-texto-principal">{row.recurso}</p>
                      <div className="text-center">
                        {row.isText
                          ? <span className="text-sm text-texto-secundario font-mono">{row.ind as string}</span>
                          : row.ind
                            ? <Check className="w-4 h-4 text-principal mx-auto" />
                            : <span className="text-gray-300 text-sm">—</span>
                        }
                      </div>
                      <div className="text-center bg-verde-palido/20 rounded-lg py-1">
                        {row.isText
                          ? <span className={`text-sm font-bold font-mono ${(row as any).multiHighlight ? 'text-ambar' : 'text-principal'}`}>{row.multi as string}</span>
                          : row.multi
                            ? <Check className="w-4 h-4 text-principal mx-auto" />
                            : <span className="text-gray-300 text-sm">—</span>
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 7. SECRECY / TRUST */}
          <section className="py-20 bg-fundo-claro">
            <div className="max-w-6xl mx-auto px-6">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="font-fraunces text-3xl md:text-4xl font-bold text-texto-principal mb-4 tracking-tight">Compartilhado, mas organizado com segurança</h2>
                <p className="text-texto-secundario font-medium leading-relaxed">O KAZA foi pensado para lares com rotinas reais. Mesmo no MultiPRO, cada acesso tem seu papel, sua sessão e seu controle.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-superficie border border-borda p-6 rounded-3xl text-center shadow-sm">
                  <div className="w-12 h-12 bg-fundo-claro rounded-full flex items-center justify-center mx-auto mb-4 text-principal"><Lock className="w-5 h-5" /></div>
                  <h4 className="font-bold text-sm text-texto-principal">Permissões por perfil</h4>
                </div>
                <div className="bg-superficie border border-borda p-6 rounded-3xl text-center shadow-sm">
                  <div className="w-12 h-12 bg-fundo-claro rounded-full flex items-center justify-center mx-auto mb-4 text-principal"><User className="w-5 h-5" /></div>
                  <h4 className="font-bold text-sm text-texto-principal">Sessão individual por acesso</h4>
                </div>
                <div className="bg-superficie border border-borda p-6 rounded-3xl text-center shadow-sm">
                  <div className="w-12 h-12 bg-fundo-claro rounded-full flex items-center justify-center mx-auto mb-4 text-principal"><Settings className="w-5 h-5" /></div>
                  <h4 className="font-bold text-sm text-texto-principal">Conta mestre com gestão</h4>
                </div>
                <div className="bg-superficie border border-borda p-6 rounded-3xl text-center shadow-sm">
                  <div className="w-12 h-12 bg-fundo-claro rounded-full flex items-center justify-center mx-auto mb-4 text-principal"><Smartphone className="w-5 h-5" /></div>
                  <h4 className="font-bold text-sm text-texto-principal">Controle sobre conectados</h4>
                </div>
              </div>
            </div>
          </section>

          {/* 8. CTA FINAL */}
          <section className="py-24 px-6 max-w-7xl mx-auto w-full mb-12">
            <div className="bg-verde-escuro rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl border border-principal">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#52B788 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
              <div className="relative z-10 w-full max-w-3xl mx-auto">
                <h2 className="font-fraunces text-4xl md:text-5xl font-bold text-white mb-6 text-balance leading-tight">Menos carga mental.<br />Mais casa funcionando.</h2>
                <p className="text-verde-palido text-lg md:text-xl font-medium mb-12 text-balance leading-relaxed">
                  Escolha o plano que combina com sua rotina: IndividualPRO por R$19,90/mês para organização solo ou MultiPRO por R$37,90/mês para até 3 acessos compartilhados.
                </p>

                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full">
                  <Link to="/auth" className="w-full sm:w-auto bg-superficie text-principal hover:bg-gray-50 border border-transparent font-bold py-4 px-8 rounded-full text-center transition-all shadow-sm">
                    Escolher IndividualPRO
                  </Link>
                  <Link to="/auth" className="w-full sm:w-auto bg-ambar hover:bg-orange-500 text-white font-bold py-4 px-8 rounded-full text-center transition-all shadow-[0_10px_20px_-10px_rgba(244,162,97,0.5)] hover:-translate-y-1">
                    Testar MultiPRO por 7 dias
                  </Link>
                </div>

                <p className="text-sm font-medium text-verde-claro mt-8">Veja a demo antes de entrar</p>
                <p className="text-xs text-white/50 mt-2 font-mono uppercase tracking-widest">Mesma casa. Diferentes acessos. Tudo organizado.</p>
              </div>
            </div>
          </section>

        </main>

        {/* 9. FOOTER */}
        <footer className="bg-superficie border-t border-borda pt-16 pb-8">
          <div className="max-w-7xl w-full mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
            <div className="md:col-span-4 flex flex-col">
              <Link to="/pagina-de-vendas" className="mb-6 inline-block">
                <img src={LogoImage} alt="KAZA Logo" className="h-[32px] object-contain" />
              </Link>
              <p className="text-texto-secundario text-sm leading-relaxed max-w-sm">KAZA — sua casa organizada com inteligência.</p>
            </div>

            <div className="md:col-span-2">
              <h5 className="font-bold text-texto-principal mb-4 uppercase tracking-wider text-xs">Produto</h5>
              <ul className="space-y-3">
                <li><a href="#como-ajuda" className="text-texto-secundario hover:text-principal text-sm transition-colors">Funcionalidades</a></li>
                <li><a href="#demo" className="text-texto-secundario hover:text-principal text-sm transition-colors">Modo Teste</a></li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <h5 className="font-bold text-texto-principal mb-4 uppercase tracking-wider text-xs">Acessar</h5>
              <ul className="space-y-3">
                <li><a href="#planos" className="text-texto-secundario hover:text-principal text-sm transition-colors">Planos</a></li>
                <li><Link to="/auth" className="text-texto-secundario hover:text-principal text-sm transition-colors">Criar conta</Link></li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <h5 className="font-bold text-texto-principal mb-4 uppercase tracking-wider text-xs">Conteúdo</h5>
              <ul className="space-y-3">
                <li><a href="#" className="text-texto-secundario hover:text-principal text-sm transition-colors">Blog</a></li>
                <li><a href="#" className="text-texto-secundario hover:text-principal text-sm transition-colors">Contato</a></li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <h5 className="font-bold text-texto-principal mb-4 uppercase tracking-wider text-xs">Políticas</h5>
              <ul className="space-y-3">
                <li><Link to="/pagina-de-vendas/privacidade" className="text-texto-secundario hover:text-principal text-sm transition-colors">Privacidade</Link></li>
                <li><Link to="/pagina-de-vendas/termos-de-uso" className="text-texto-secundario hover:text-principal text-sm transition-colors">Termos</Link></li>
              </ul>
            </div>
          </div>

          <div className="w-full border-t border-borda pt-8">
            <div className="max-w-7xl mx-auto px-6 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs font-medium text-texto-secundario">© {new Date().getFullYear()} KAZA. Todos os direitos reservados.</p>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
