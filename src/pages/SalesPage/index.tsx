import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Check, X, ArrowUpRight, Trash2, Home, Box, User,
  ShoppingCart, ChefHat, AlertTriangle, Menu, CalendarClock,
  Sparkles, ShieldCheck
} from "lucide-react";

import LogoImage from "@/assets/logo inicial nome.svg";

// --- INTERACTIVE MOCKUPS (Glass & Dark Mode variants) ---

const EstoqueMockup = () => {
  const [items, setItems] = useState([
    { id: 1, name: "Azeite Virgem", amount: 2, unit: "lts" },
    { id: 2, name: "Arroz Agulhinha", amount: 1, unit: "pcts" },
    { id: 3, name: "Café Torrado", amount: 0, unit: "un" }
  ]);

  const consume = (id: number) => {
    setItems(items.map(i => i.id === id && i.amount > 0 ? { ...i, amount: i.amount - 1 } : i));
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {items.map(item => (
        <div key={item.id} className="bg-[#12312b]/80 backdrop-blur-md p-4 rounded-3xl shadow-sm border border-emerald-500/20 flex flex-col gap-3 transition-colors hover:bg-[#153a33]">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#071916] flex items-center justify-center border border-emerald-900/50">
                <span className="text-lg opacity-80" aria-hidden="true">{item.id === 1 ? '🫒' : item.id === 2 ? '🍚' : '☕'}</span>
              </div>
              <div>
                <p className="font-bold text-sm text-emerald-50">{item.name}</p>
                <p className="text-[11px] text-emerald-400/80 font-bold uppercase tracking-wider mt-0.5">{item.amount > 0 ? `${item.amount} ${item.unit} em estoque` : 'Faltando'}</p>
              </div>
            </div>
            {item.amount > 0 ? (
              <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-emerald-300" aria-hidden="true" />
            )}
          </div>
          <button 
            onClick={() => consume(item.id)}
            disabled={item.amount === 0}
            className="w-full text-[11px] font-black uppercase tracking-wider py-2.5 rounded-xl border border-emerald-600/30 text-emerald-100 hover:bg-emerald-800/30 focus-visible:bg-emerald-800/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label={`Consumir uma unidade de ${item.name}`}
          >
            {item.amount === 0 ? 'Já na Lista' : 'Baixar Estoque'}
          </button>
        </div>
      ))}
    </div>
  );
};

const AlertasLixoMockup = () => {
  const [alerts, setAlerts] = useState([
    { id: 1, title: "Iogurte Natural", status: "Vence Hoje", icon: <AlertTriangle className="w-4 h-4 text-red-500"/>, type: "danger" },
    { id: 2, title: "Lixo Orgânico", status: "Caminhão passa 18h", icon: <Trash2 className="w-4 h-4 text-emerald-500"/>, type: "chore" }
  ]);
  const [completeTimeout, setCompleteTimeout] = useState<number[]>([]);

  const resolveAlert = (id: number) => {
    // Spin animation class triggers, then remove
    setCompleteTimeout(prev => [...prev, id]);
    setTimeout(() => {
      setAlerts(alerts.filter(a => a.id !== id));
      setCompleteTimeout(prev => prev.filter(t => t !== id));
    }, 600);
  };

  if (alerts.length === 0) {
    return (
      <div className="bg-white/40 backdrop-blur-[30px] border border-white/50 p-8 flex flex-col items-center justify-center text-center rounded-[2rem] h-full w-full">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 shadow-sm border border-emerald-200">
          <Check className="w-8 h-8 text-emerald-600" aria-hidden="true" />
        </div>
        <p className="text-[#071d18] font-black text-xl">Vida Organizada!</p>
        <p className="text-gray-600 text-sm mt-1 font-medium">Nenhum vencimento ou tarefa pendente.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {alerts.map(a => (
        <div 
          key={a.id} 
          className={`bg-white/60 backdrop-blur-[40px] p-5 rounded-[2rem] shadow-sm border border-white relative group overflow-hidden flex items-center justify-between transition-all duration-500 ${completeTimeout.includes(a.id) ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}
        >
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-gray-100">
                {a.icon}
             </div>
             <div>
               <p className="font-black text-[#0A241D] text-lg leading-tight mb-1">{a.title}</p>
               <p className={`text-[10px] font-black uppercase tracking-widest ${a.type === 'danger' ? 'text-red-500' : 'text-emerald-600'}`}>
                 {a.status}
               </p>
             </div>
          </div>
          <button 
            onClick={() => resolveAlert(a.id)}
            className="w-10 h-10 bg-white shadow-sm border border-gray-100 text-[#071d18] hover:text-emerald-600 hover:border-emerald-200 rounded-full flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A5C4A]"
            aria-label={`Resolver ${a.title}`}
          >
            <Check className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
};

const ListaMockup = () => {
  const [lista, setLista] = useState([
    { id: 1, name: "Limpa Vidros", qtd: "1 unid.", done: false },
    { id: 2, name: "Pão de Forma", qtd: "1 pct", done: true },
    { id: 3, name: "Maçã Fuji", qtd: "6 un", done: false }
  ]);

  const toggle = (id: number) => {
    setLista(lista.map(i => i.id === id ? { ...i, done: !i.done } : i));
  };

  return (
    <div className="flex flex-col gap-2 bg-[#071916]/50 backdrop-blur-md p-2 rounded-[2rem] border border-white/5 w-full">
      {lista.map(i => (
        <label 
          key={i.id} 
          className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all focus-within:ring-2 focus-within:ring-emerald-500 outline-none ${i.done ? 'bg-[#000000]/20 opacity-50' : 'bg-[#0b2924] hover:bg-[#0e352f] shadow-sm'}`}
        >
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${i.done ? 'bg-emerald-500 border-emerald-500' : 'border-emerald-800'}`}>
            {i.done && <Check className="w-3 h-3 text-[#071916]" aria-hidden="true" />}
          </div>
          <input 
            type="checkbox" 
            checked={i.done} 
            onChange={() => toggle(i.id)} 
            className="sr-only"
            aria-label={`Marcar ${i.name} como comprado`}
          />
          <div className="flex-1">
            <span className={`block font-bold text-sm transition-all ${i.done ? 'line-through text-emerald-100' : 'text-white'}`}>{i.name}</span>
            <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">{i.qtd}</span>
          </div>
        </label>
      ))}
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---

export default function SalesPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Phone Mockup Integration State
  const [comprarCount, setComprarCount] = useState(1);
  const [demoItems, setDemoItems] = useState([
    { id: 1, name: "Sabão em Pó", status: "Acaba em 3 dias", added: false },
    { id: 2, name: "Extrato de Tomate", status: "Sugestão", added: false }
  ]);

  const handleAddDemoItem = (id: number) => {
    setDemoItems(demoItems.map(item => 
      item.id === id && !item.added ? { ...item, added: true } : item
    ));
    const wasAdded = demoItems.find(i => i.id === id)?.added;
    if (!wasAdded) setComprarCount(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#F2F7F5] text-[#0A241D] font-sans selection:bg-[#1A5C4A] selection:text-white" style={{colorScheme: 'light'}}>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .ios26-glass {
          background: rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(60px) saturate(180%);
          -webkit-backdrop-filter: blur(60px) saturate(180%);
          border: 1px solid rgba(255,255,255,0.7);
        }
        
        .ios26-dark-glass {
          background: rgba(8, 26, 23, 0.4);
          backdrop-filter: blur(60px) saturate(180%);
          -webkit-backdrop-filter: blur(60px) saturate(180%);
          border: 1px solid rgba(255,255,255,0.05);
        }

        .animate-marquee-infinite {
            display: inline-block;
            white-space: nowrap;
            animation: marquee 30s linear infinite;
        }
        @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
        }
      `}</style>

      {/* --- Ambient iOS 26 Background Elements --- */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-emerald-200/40 rounded-full blur-[140px] mix-blend-multiply opacity-70"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-[#1A5C4A]/10 rounded-full blur-[120px] mix-blend-multiply"></div>
      </div>

      {/* --- NAVBAR --- */}
      <header className="fixed top-0 inset-x-0 ios26-glass z-50 transition-colors shadow-[0_4px_30px_rgba(0,0,0,0.02)]">
        <div className="max-w-[1400px] mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/pagina-de-vendas" className="focus-visible:ring-2 focus-visible:ring-[#1A5C4A] outline-none rounded-xl p-1">
              <img src={LogoImage} alt="Kaza Logo" className="h-[46px] w-[140px] object-contain" />
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-10 bg-white/40 px-8 py-3.5 rounded-full border border-white/60 shadow-sm">
            <a href="#funcionalidades" className="text-sm font-bold text-gray-600 hover:text-[#0A241D] transition-colors outline-none focus-visible:underline">Ecossistema</a>
            <a href="#experiencia" className="text-sm font-bold text-gray-600 hover:text-[#0A241D] transition-colors outline-none focus-visible:underline">Interatividade</a>
            <a href="#planos" className="text-sm font-bold text-gray-600 hover:text-[#0A241D] transition-colors outline-none focus-visible:underline">Pacotes</a>
          </nav>

          <div className="hidden lg:flex">
             <Link to="/auth" className="bg-[#0A241D]/90 backdrop-blur-md text-emerald-50 px-8 py-4 rounded-full text-sm font-black hover:bg-black transition-transform active:scale-95 shadow-xl border border-white/10 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0A241D]">
                Criar Conta Grátis
             </Link>
          </div>

          <button 
            className="lg:hidden p-3 text-[#0A241D] rounded-full focus-visible:ring-2 focus-visible:ring-[#1A5C4A] outline-none bg-white/60 shadow-sm" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="lg:hidden absolute top-[96px] left-0 w-full ios26-glass p-6 flex flex-col gap-4 shadow-2xl border-t border-white/20">
            <a href="#funcionalidades" onClick={() => setIsMenuOpen(false)} className="text-xl font-black text-[#0A241D] p-3 rounded-2xl hover:bg-white/50">Ecossistema</a>
            <a href="#planos" onClick={() => setIsMenuOpen(false)} className="text-xl font-black text-[#0A241D] p-3 rounded-2xl hover:bg-white/50">Pacotes Premium</a>
            <Link to="/auth" className="mt-4 bg-[#0A241D] text-emerald-50 text-center py-5 rounded-[2rem] font-black text-lg outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0A241D] shadow-xl border border-white/10">
              Acessar Módulo Central
            </Link>
          </div>
        )}
      </header>

      <main className="relative z-10 w-full flex flex-col overflow-x-hidden pt-[96px]">
        
        {/* --- HERO SECTION --- */}
        <section className="relative w-full px-6 lg:px-8 py-16 lg:py-24 flex flex-col items-center justify-start min-h-[90vh]">
           
           <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full ios26-glass text-[#0A241D] text-[11px] font-black uppercase tracking-[0.2em] shadow-sm mb-8">
              <Sparkles className="w-4 h-4 text-emerald-600" aria-hidden="true"/> Organização Limpa
           </div>
           
           <h1 className="text-center font-medium tracking-tight text-[#1A5C4A]/80 mb-2 leading-tight text-5xl md:text-[5rem] lg:text-[6rem]" style={{ textWrap: 'balance' }}>
              Deixe que o software
           </h1>
           <h2 className="text-center font-black tracking-tighter text-[#0A241D] leading-[0.95] mb-16 lg:mb-24 text-[3.5rem] md:text-[6rem] lg:text-[7rem]" style={{ textWrap: 'balance' }}>
              Gerencie seu lar.
           </h2>

           {/* Dashboard Mockup Centerpiece */}
           <div className="relative w-full max-w-[1000px] mx-auto bg-[#071916] rounded-[3rem] p-6 lg:p-10 shadow-[0_40px_100px_-20px_rgba(7,25,22,0.5)] border border-emerald-900/30 flex flex-col md:flex-row gap-6">
              
              {/* Dashboard Intro Column */}
              <div className="flex-1 flex flex-col justify-between p-4">
                <div className="mb-10 lg:mb-0">
                   <div className="w-14 h-14 rounded-[1.5rem] bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 mb-6">
                     <Home className="text-emerald-400 w-6 h-6" />
                   </div>
                   <h3 className="text-3xl font-black text-white mb-4">Módulo <br/><span className="text-emerald-400">Residencial</span></h3>
                   <p className="text-emerald-100/60 font-medium">Controle de ponta a ponta: do inventário despensa aos lembretes rotineiros como o descarte de lixo orgânico.</p>
                </div>
                
                <Link to="/auth" className="bg-emerald-500 hover:bg-emerald-400 text-[#071916] px-8 py-4 rounded-full font-black text-sm text-center transition-colors shadow-[0_10px_30px_-10px_rgba(16,185,129,0.5)] w-fit mt-8 outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">
                   Iniciar Gratuitamente
                </Link>
              </div>

              {/* Interactive Widget Column (Estoque & Lista) */}
              <div className="flex-[1.2] flex flex-col gap-6 w-full lg:max-w-[380px]">
                 <div className="bg-[#0b2924] rounded-[2rem] p-6 border border-white/5">
                    <p className="text-emerald-500 text-[10px] uppercase font-black tracking-widest mb-4 flex items-center gap-2"><Box className="w-3 h-3"/> Inventário</p>
                    <EstoqueMockup />
                 </div>
                 <div className="bg-[#0b2924] rounded-[2rem] p-6 border border-white/5">
                    <p className="text-emerald-500 text-[10px] uppercase font-black tracking-widest mb-4 flex items-center gap-2"><ShoppingCart className="w-3 h-3"/> Lista Smart</p>
                    <ListaMockup />
                 </div>
              </div>

           </div>
        </section>

        {/* --- SECTION: ECOSYSTEM (GARBAGE/ALERTS) --- */}
        <section id="experiencia" className="py-24 lg:py-32 px-6 lg:px-8 max-w-[1400px] mx-auto w-full">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            
            <div className="flex-1 w-full max-w-md mx-auto order-2 lg:order-1 relative">
               <div className="absolute top-[10%] -left-[10%] w-[80%] h-[80%] bg-[#1A5C4A]/20 blur-[80px] rounded-full -z-10"></div>
               <div className="bg-white/60 backdrop-blur-[60px] rounded-[4rem] p-8 lg:p-12 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-white flex flex-col relative overflow-hidden">
                  <h4 className="text-2xl font-black text-[#0A241D] mb-8 leading-tight">Central de <br/>Notificações</h4>
                  <AlertasLixoMockup />
               </div>
            </div>

            <div className="flex-1 text-center lg:text-left order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full ios26-glass text-[10px] font-black uppercase tracking-[0.2em] mb-8 text-[#1A5C4A]">
                Ecosistema Autônomo
              </div>
              <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-[#0A241D] mb-6 leading-[0.95]" style={{ textWrap: 'balance'}}>
                A rotina, <br className="hidden lg:block"/><span className="text-[#1A5C4A] font-medium tracking-tight">sem esquecimentos.</span>
              </h2>
              <p className="text-xl text-gray-600 mb-10 max-w-lg mx-auto lg:mx-0 font-medium leading-relaxed">
                Deixe de memorizar datas de vencimento ou os dias do caminhão de lixo. Ao lado, você resolve alertas ou marca as tarefas como feitas tocando diretamente nas pendências.
              </p>
            </div>
            
          </div>
        </section>

        {/* --- SECTION: MOBILE APP EXPERIENCE --- */}
        <section id="funcionalidades" className="py-24 lg:py-32 px-6 lg:px-8 max-w-[1400px] mx-auto text-center w-full">
           <h2 className="text-4xl md:text-5xl font-medium text-gray-500 mb-2 leading-tight">Em qualquer dispositivo</h2>
           <h2 className="text-5xl md:text-6xl font-black text-[#0A241D] leading-none mb-16">PWA Integrado ao Sistema</h2>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 text-left">
              
              <div className="ios26-glass rounded-[3rem] p-8 lg:p-10 min-h-[400px] flex flex-col relative overflow-hidden group border border-white">
                 <div className="w-16 h-16 rounded-[2rem] bg-emerald-50 flex items-center justify-center mb-8 border border-emerald-100/50 shadow-sm">
                   <CalendarClock className="w-8 h-8 text-emerald-600"/>
                 </div>
                 <h4 className="font-black text-3xl mb-4 text-[#0A241D] leading-tight">Agendamentos<br/>Precisos</h4>
                 <p className="text-gray-600 font-medium text-lg leading-relaxed mt-auto">Planeje eventos de consumo, receitas ou reabastecimento. A inteligência te guiará o mês inteiro.</p>
              </div>

              {/* Center App Interaction */}
              <div className="bg-[#071916] rounded-[3rem] p-8 lg:p-10 min-h-[400px] flex flex-col items-center justify-end relative overflow-hidden border border-emerald-900 group shadow-2xl">
                 <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-[#113a30] to-transparent opacity-50 z-0"></div>
                 <h4 className="font-black text-3xl mb-4 absolute top-10 left-10 text-left z-10 text-emerald-50 leading-[1.1]">Lista em 1<br/>Toque</h4>
                 
                 {/* Fake Integrated Phone UI */}
                 <div className="w-[240px] h-[300px] bg-[#0c2b24] rounded-t-[3rem] border border-emerald-900/50 absolute bottom-0 translate-y-16 group-hover:translate-y-8 transition-transform duration-700 flex flex-col pt-8 px-5 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-10">
                    <div className="w-16 h-1 bg-white/20 rounded-full mx-auto mb-6"></div>
                    
                    <div className="flex flex-col gap-3">
                      {demoItems.map(item => (
                        <div key={item.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between backdrop-blur-md transition-all">
                          <div>
                            <p className="font-bold text-sm text-emerald-50">{item.name}</p>
                          </div>
                          <button 
                            onClick={() => handleAddDemoItem(item.id)}
                            disabled={item.added}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all outline-none ${
                              item.added ? 'bg-emerald-500 text-[#0c2b24] cursor-not-allowed scale-95' : 'bg-white text-[#0c2b24] hover:scale-105 active:scale-95'
                            }`}
                          >
                            {item.added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                          </button>
                        </div>
                      ))}
                    </div>
                 </div>
              </div>

              <div className="ios26-glass rounded-[3rem] p-8 lg:p-10 min-h-[400px] flex flex-col relative overflow-hidden group border border-white">
                 <div className="w-16 h-16 rounded-[2rem] bg-emerald-50 flex items-center justify-center mb-8 border border-emerald-100/50 shadow-sm">
                   <ShieldCheck className="w-8 h-8 text-emerald-600"/>
                 </div>
                 <h4 className="font-black text-3xl mb-4 text-[#0A241D] leading-tight">Auditoria e <br/>Gastos</h4>
                 <p className="text-gray-600 font-medium text-lg leading-relaxed mt-auto">Sincronização em nuvem permite que mais de uma pessoa auditem e contribuam na mesma casa simuntâneamente.</p>
              </div>

           </div>
        </section>

        {/* --- PRICING SECTION --- */}
        <section id="planos" className="py-24 lg:py-32 px-6 relative w-full">
          <div className="absolute inset-0 bg-[#071916] rounded-t-[4rem] lg:rounded-[5rem] lg:mx-8 -z-10 shadow-2xl overflow-hidden">
             <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#1A5C4A] blur-[150px] opacity-40 rounded-full mix-blend-screen"></div>
          </div>
          
          <div className="max-w-[1200px] mx-auto text-center pt-8">
            <h2 className="text-5xl md:text-[5rem] font-black tracking-tighter text-white mb-6 text-balance">Expanda sua Mente.</h2>
            <p className="text-xl text-emerald-200/60 font-medium max-w-2xl mx-auto mb-20">Você também pode utilizar nosso ecossistema sem nenhuma taxa oculta de forma vitalícia nas modalidades gratuitas.</p>

            <div className="grid md:grid-cols-2 gap-8 lg:gap-12 text-left">
              
              {/* Free Plan */}
              <div className="bg-[#0b2924] rounded-[3rem] p-12 lg:p-14 border border-emerald-900/30 flex flex-col shadow-inner">
                <h3 className="text-3xl font-black text-white mb-2 tracking-tight">Standard</h3>
                <p className="text-emerald-500 mb-10 font-medium text-lg">Indivíduos super organizados.</p>
                <div className="mb-10">
                  <span className="text-6xl font-black tracking-tighter text-white">Grátis</span>
                </div>
                <ul className="space-y-6 mb-12 flex-1">
                  <li className="flex items-start gap-4 text-lg font-medium text-emerald-100/90 leading-tight"><Check className="text-emerald-500 w-6 h-6 shrink-0" aria-hidden="true"/> 50 itens no inventário virtual</li>
                  <li className="flex items-start gap-4 text-lg font-medium text-emerald-100/90 leading-tight"><Check className="text-emerald-500 w-6 h-6 shrink-0" aria-hidden="true"/> 1 Usuário por conta residencial</li>
                  <li className="flex items-start gap-4 text-lg font-medium text-emerald-100/90 leading-tight"><Check className="text-emerald-500 w-6 h-6 shrink-0" aria-hidden="true"/> Alertas de Vencimento Nativos</li>
                </ul>
                <Link to="/auth" className="w-full block text-center py-5 rounded-full bg-white text-[#071916] font-black text-lg hover:bg-emerald-50 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#071916] outline-none">
                  Fazer Login
                </Link>
              </div>

              {/* Premium Plan Matching the Screenshot (Plano Atual Premium) */}
              <div className="ios26-dark-glass rounded-[3rem] p-12 lg:p-14 shadow-2xl relative flex flex-col text-white">
                <div className="absolute top-10 right-10">
                   <div className="relative flex h-4 w-4">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                   </div>
                </div>
                <h3 className="text-3xl font-black mb-2 tracking-tight">Plus Premium</h3>
                <p className="text-emerald-200/80 mb-10 font-medium text-lg">Controle master da sua casa inteligente.</p>
                
                <div className="mb-10 bg-[#071d1a] border border-emerald-900/50 rounded-3xl p-6 flex items-center justify-between">
                   <div>
                      <p className="text-emerald-500 text-[10px] uppercase font-black tracking-widest mb-1">Período de Teste</p>
                      <p className="font-bold text-white">7 Dias sem compromisso</p>
                   </div>
                   <div className="text-3xl font-black text-white">
                      R$27<span className="text-sm font-medium text-emerald-500 ml-1">/mês</span>
                   </div>
                </div>

                <ul className="space-y-6 mb-12 flex-1">
                  <li className="flex items-start gap-4 text-lg font-medium text-white leading-tight"><Check className="text-emerald-400 w-6 h-6 shrink-0" aria-hidden="true"/> Reposição & Estoque Ilimitados</li>
                  <li className="flex items-start gap-4 text-lg font-medium text-white leading-tight"><Check className="text-emerald-400 w-6 h-6 shrink-0" aria-hidden="true"/> Múltiplos integrantes via convite</li>
                  <li className="flex items-start gap-4 text-lg font-medium text-white leading-tight"><Check className="text-emerald-400 w-6 h-6 shrink-0" aria-hidden="true"/> Receitas Smart</li>
                </ul>
                <Link to="/auth" className="w-full block text-center py-5 rounded-full bg-emerald-500 text-[#071916] font-black text-lg hover:bg-emerald-400 transition-colors shadow-[0_10px_30px_-5px_rgba(16,185,129,0.4)] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500 outline-none">
                  Acessar Premium
                </Link>
              </div>

            </div>
          </div>
        </section>

      </main>

      {/* --- EXTRA LARGE FOOTER --- */}
      <footer className="bg-[#F8FAF9] pt-20 flex flex-col border-t border-gray-200">
        
        {/* Marquee Huge Text */}
        <div className="w-full overflow-hidden flex whitespace-nowrap opacity-[0.4] text-[#1A5C4A] pt-4 pb-0 select-none mix-blend-multiply" aria-hidden="true">
          <div className="animate-marquee-infinite flex items-center">
            <span className="inline-block text-[15vw] md:text-[8vw] font-black tracking-tighter leading-none mr-8 uppercase">Gestão da casa</span>
            <span className="inline-block w-4 h-4 md:w-8 md:h-8 mr-8 bg-[#1A5C4A] rounded-full"></span>
            <span className="inline-block text-[15vw] md:text-[8vw] font-medium tracking-tighter leading-none mr-8 uppercase text-emerald-900/50">Crie sua Conta</span>
            <span className="inline-block w-4 h-4 md:w-8 md:h-8 mr-8 bg-[#1A5C4A] rounded-full"></span>
            <span className="inline-block text-[15vw] md:text-[8vw] font-black tracking-tighter leading-none mr-8 uppercase">Gestão da casa</span>
            <span className="inline-block w-4 h-4 md:w-8 md:h-8 mr-8 bg-[#1A5C4A] rounded-full"></span>
            <span className="inline-block text-[15vw] md:text-[8vw] font-medium tracking-tighter leading-none mr-8 uppercase text-emerald-900/50">Crie sua Conta</span>
            <span className="inline-block w-4 h-4 md:w-8 md:h-8 mr-8 bg-[#1A5C4A] rounded-full"></span>
          </div>
        </div>

        <div className="max-w-[1400px] w-full mx-auto px-6 grid md:grid-cols-12 gap-12 lg:gap-20 mt-16 pb-16">
           <div className="col-span-1 md:col-span-6 lg:col-span-5 flex flex-col">
             <div className="flex items-center gap-3 mb-6">
               <img src={LogoImage} alt="Kaza Logo" className="h-[40px] opacity-80 mix-blend-multiply" />
             </div>
             <p className="text-gray-500 font-medium max-w-sm text-lg leading-relaxed mb-10">Conectando todas as áreas do seu lar com fluxos automatizados, mantendo seu orçamento no azul.</p>
           </div>
           
           <div className="col-span-1 md:col-span-3 lg:col-span-2 lg:col-start-8">
              <h4 className="font-black text-[#0A241D] mb-6 text-sm tracking-widest uppercase">Utilidade</h4>
              <ul className="space-y-4">
                <li><a href="#funcionalidades" className="text-gray-500 hover:text-[#1A5C4A] font-medium transition-colors outline-none focus-visible:font-bold">Ecosistema PWA</a></li>
                <li><a href="#experiencia" className="text-gray-500 hover:text-[#1A5C4A] font-medium transition-colors outline-none focus-visible:font-bold">Módulos Interativos</a></li>
                <li><Link to="/auth" className="text-gray-500 hover:text-[#1A5C4A] font-medium transition-colors outline-none focus-visible:font-bold">Painel (Login)</Link></li>
              </ul>
           </div>

           <div className="col-span-1 md:col-span-3 lg:col-span-3">
              <h4 className="font-black text-[#0A241D] mb-6 text-sm tracking-widest uppercase">Políticas</h4>
              <ul className="space-y-4">
                <li><Link to="/pagina-de-vendas/privacidade" className="text-gray-500 hover:text-[#1A5C4A] font-medium transition-colors outline-none focus-visible:font-bold">Política de Privacidade</Link></li>
                <li><Link to="/pagina-de-vendas/termos-de-uso" className="text-gray-500 hover:text-[#1A5C4A] font-medium transition-colors outline-none focus-visible:font-bold">Termos de Uso</Link></li>
              </ul>
           </div>
        </div>
        <div className="w-full bg-[#1A5C4A] py-6">
            <div className="max-w-[1400px] mx-auto px-6 text-center lg:text-left">
               <p className="text-sm font-bold text-emerald-100 uppercase tracking-widest">© {new Date().getFullYear()} Kaza. Os direitos de design estão reservados.</p>
            </div>
        </div>
      </footer>
    </div>
  );
}
