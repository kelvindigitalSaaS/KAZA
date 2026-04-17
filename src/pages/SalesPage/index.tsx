import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Check, X, ArrowUpRight, Trash2, Home, Box, User,
  ShoppingCart, ChefHat, AlertTriangle, Menu
} from "lucide-react";

// --- REUSABLE COMPONENTS ---

const KazaLogo = ({ className = "w-8 h-8" }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="28" fill="#1A5C4A"/>
    <path d="M50 22 L82 72 L18 72 Z" fill="#1A5C4A" stroke="#FFFFFF" strokeWidth="8" strokeLinejoin="round"/>
    <path d="M50 40 L62 55 V72 H38 V55 Z" fill="#FFFFFF"/>
  </svg>
);

// --- INTERACTIVE MOCKUPS ---

const EstoqueMockup = () => {
  const [items, setItems] = useState([
    { id: 1, name: "Arroz Agulhinha", amount: 2, max: 2, unit: "pcts" },
    { id: 2, name: "Leite Integral", amount: 1, max: 2, unit: "lts" },
    { id: 3, name: "Ovos Brancos", amount: 0, max: 12, unit: "un" }
  ]);

  const consume = (id: number) => {
    setItems(items.map(i => i.id === id && i.amount > 0 ? { ...i, amount: i.amount - 1 } : i));
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {items.map(item => (
        <div key={item.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-3 transition-colors hover:border-[#1A5C4A]/20">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                <span className="text-lg" aria-hidden="true">{item.id === 1 ? '🍚' : item.id === 2 ? '🥛' : '🥚'}</span>
              </div>
              <div>
                <p className="font-bold text-sm text-[#0A241D]">{item.name}</p>
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{item.amount > 0 ? `${item.amount} ${item.unit} restantes` : 'Acabou'}</p>
              </div>
            </div>
            {item.amount > 0 ? (
              <Check className="w-4 h-4 text-emerald-500" aria-hidden="true" />
            ) : (
              <X className="w-4 h-4 text-red-400" aria-hidden="true" />
            )}
          </div>
          <button 
            onClick={() => consume(item.id)}
            disabled={item.amount === 0}
            className="w-full text-[11px] font-black uppercase tracking-wider py-2.5 rounded-xl border border-gray-100 text-gray-700 hover:bg-gray-50 focus-visible:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-[#1A5C4A] outline-none"
            aria-label={`Consumir uma unidade de ${item.name}`}
          >
            {item.amount === 0 ? 'Adicionar à Lista' : 'Marcar Consumo'}
          </button>
        </div>
      ))}
    </div>
  );
};

const AlertasMockup = () => {
  const [alerts, setAlerts] = useState([
    { id: 1, title: "Iogurte (4x)", status: "Vence hoje!", type: "danger" },
    { id: 2, title: "Manteiga 500g", status: "Vence em 2 dias", type: "warning" }
  ]);

  const dismiss = (id: number) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  if (alerts.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-100 p-8 flex flex-col items-center justify-center text-center rounded-[2rem] h-full w-full shadow-inner">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
          <Check className="w-8 h-8 text-emerald-500" aria-hidden="true" />
        </div>
        <p className="text-emerald-800 font-bold text-lg">Tudo em dia!</p>
        <p className="text-emerald-600/80 text-sm mt-1 font-medium">Você poupou dinheiro hoje.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {alerts.map(a => (
        <div key={a.id} className="bg-white p-5 rounded-3xl shadow-md border border-gray-100/50 relative group overflow-hidden flex items-center justify-between">
          <div>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest mb-2 ${a.type === 'danger' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
              <AlertTriangle className="w-3 h-3" aria-hidden="true"/> {a.status}
            </div>
            <p className="font-bold text-[#0A241D] text-sm">{a.title}</p>
          </div>
          <button 
            onClick={() => dismiss(a.id)}
            className="w-10 h-10 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full flex items-center justify-center transition-colors focus-visible:text-red-500 focus-visible:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-500 outline-none"
            aria-label={`Remover alerta de ${a.title}`}
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
};

const ListaMockup = () => {
  const [lista, setLista] = useState([
    { id: 1, name: "Leite Integral", qtd: "2 lts", done: false },
    { id: 2, name: "Pão de Forma", qtd: "1 pct", done: true },
    { id: 3, name: "Maçã Fuji", qtd: "6 un", done: false }
  ]);

  const toggle = (id: number) => {
    setLista(lista.map(i => i.id === id ? { ...i, done: !i.done } : i));
  };

  return (
    <div className="flex flex-col gap-2 bg-[#F8F8F6] p-2 rounded-[2rem] w-full">
      {lista.map(i => (
        <label 
          key={i.id} 
          className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all focus-within:ring-2 focus-within:ring-[#1A5C4A] outline-none ${i.done ? 'bg-gray-100/50 opacity-60' : 'bg-white shadow-sm hover:shadow-md'}`}
        >
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${i.done ? 'bg-black border-black' : 'border-gray-300'}`}>
            {i.done && <Check className="w-3 h-3 text-white" aria-hidden="true" />}
          </div>
          <input 
            type="checkbox" 
            checked={i.done} 
            onChange={() => toggle(i.id)} 
            className="sr-only"
            aria-label={`Marcar ${i.name} como comprado`}
          />
          <div className="flex-1">
            <span className={`block font-bold text-sm transition-all ${i.done ? 'line-through text-gray-500' : 'text-[#0A241D]'}`}>{i.name}</span>
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{i.qtd}</span>
          </div>
        </label>
      ))}
    </div>
  );
};

const ReceitasMockup = () => {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="perspective-1000 w-full min-h-[320px] md:min-h-[250px] group cursor-pointer" onClick={() => setFlipped(!flipped)}>
      <div className={`relative w-full h-full transition-transform duration-700 preserve-3d ${flipped ? 'rotate-y-180' : ''}`}>
        
        {/* Frente */}
        <div className="absolute inset-0 backface-hidden bg-white rounded-[2rem] overflow-hidden shadow-2xl flex flex-col group-focus-visible:ring-2 group-focus-visible:ring-emerald-400">
          <div className="h-[60%] bg-cover bg-center relative" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100%25\' height=\'100%25\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3ClinearGradient id=\'g\' x1=\'0%25\' y1=\'0%25\' x2=\'100%25\' y2=\'100%25\'%3E%3Cstop offset=\'0%25\' stop-color=\'%23fcd34d\'/%3E%3Cstop offset=\'100%25\' stop-color=\'%23f97316\'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=\'100%25\' height=\'100%25\' fill=\'url(%23g)\'/%3E%3C/svg%3E")'}}>
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-[#0A241D] text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm">
              Sugerida Hoje
            </div>
            <div className="absolute -bottom-6 right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
              <ChefHat className="text-[#1A5C4A] w-5 h-5"/>
            </div>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-end">
            <p className="font-black text-xl text-[#0A241D] mb-1">Frango Grelhado Cítrico</p>
            <p className="text-xs text-gray-500 flex items-center gap-1 font-bold">Toque para desvirar e ver os ingredientes <ArrowUpRight className="w-3 h-3"/></p>
          </div>
        </div>
        
        {/* Verso */}
        <div className="absolute inset-0 backface-hidden bg-[#0A241D] rounded-[2rem] shadow-2xl p-8 rotate-y-180 flex flex-col justify-center text-white">
          <p className="text-[#F5C842] text-[11px] font-black uppercase tracking-widest mb-4 flex items-center gap-2"><Box className="w-4 h-4"/> Você tem em estoque:</p>
          <ul className="text-sm space-y-3 opacity-90 font-medium">
            <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-400" /> Peito de Frango (500g)</li>
            <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-400" /> Limões (3 unid.)</li>
            <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-400" /> Azeite</li>
            <li className="flex items-center gap-3 text-gray-500 pt-2 border-t border-white/10"><X className="w-4 h-4" /> Tempero Seco <span className="text-[10px] font-bold ml-auto bg-white/10 px-2 py-1 rounded text-white">+ Carrinho</span></li>
          </ul>
        </div>

      </div>
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};

const RelatorioMockup = () => {
  const [active, setActive] = useState<number | null>(null);
  const data = [
    { label: "Jan", val: 50, cost: "R$ 450" },
    { label: "Fev", val: 40, cost: "R$ 380" },
    { label: "Mar", val: 80, cost: "R$ 620" },
    { label: "Abr", val: 20, cost: "R$ 150" },
    { label: "Mai", val: 60, cost: "R$ 510" }
  ];

  return (
    <div className="flex items-end gap-2 md:gap-4 h-full w-full min-h-[200px] bg-[#F8F8F6] p-6 pt-12 rounded-[2rem]">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-4 h-full justify-end relative">
          {active === i && (
            <div className="absolute bottom-[calc(100%+8px)] w-max bg-black text-white text-xs font-black tracking-wider px-3 py-2 rounded-xl shadow-lg z-10">
              {d.cost}
            </div>
          )}
          <button 
            onMouseEnter={() => setActive(i)} 
            onMouseLeave={() => setActive(null)}
            onClick={() => setActive(i)}
            className="w-full bg-[#1A5C4A] rounded-t-xl hover:bg-[#0A241D] hover:opacity-100 opacity-80 transition-all focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1A5C4A] outline-none" 
            style={{ height: `${d.val}%` }}
            aria-label={`Gasto de ${d.label}: ${d.cost}`}
          />
          <span className="text-[10px] font-black text-gray-400 tracking-wider uppercase">{d.label}</span>
        </div>
      ))}
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---

export default function SalesPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-[#0A241D] font-sans selection:bg-[#1A5C4A] selection:text-white" style={{colorScheme: 'light'}}>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .bg-grid {
          background-size: 40px 40px;
          background-image: radial-gradient(circle, #e5e7eb 1px, rgba(0, 0, 0, 0) 1px);
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

      {/* --- NAVBAR --- */}
      <header className="fixed top-0 inset-x-0 bg-white/90 backdrop-blur-md z-50 transition-colors border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-6 h-[88px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-[#1A5C4A] outline-none rounded-lg p-1">
              <KazaLogo className="w-10 h-10" />
              <span className="text-[26px] font-black tracking-tight text-[#0A241D] mt-1" translate="no">kaza</span>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-10 bg-gray-50/80 px-8 py-3 rounded-full border border-gray-200 shadow-sm">
            <a href="#funcionalidades" className="text-sm font-bold text-gray-500 hover:text-[#0A241D] transition-colors outline-none focus-visible:underline">Aplicações</a>
            <a href="#experiencia" className="text-sm font-bold text-gray-500 hover:text-[#0A241D] transition-colors outline-none focus-visible:underline">Experiência</a>
            <a href="#planos" className="text-sm font-bold text-gray-500 hover:text-[#0A241D] transition-colors outline-none focus-visible:underline">Planos</a>
          </nav>

          <div className="hidden lg:flex">
             <Link to="/auth" className="bg-[#0A241D] text-white px-8 py-3.5 rounded-full text-sm font-black hover:bg-black transition-transform active:scale-95 shadow-[0_10px_20px_-10px_rgba(10,36,29,0.5)] outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black">
                Acessar Web App
             </Link>
          </div>

          <button 
            className="lg:hidden p-2 text-[#0A241D] rounded-full focus-visible:ring-2 focus-visible:ring-[#1A5C4A] outline-none bg-gray-50" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="lg:hidden absolute top-[88px] left-0 w-full bg-white border-b border-gray-100 p-6 flex flex-col gap-4 shadow-2xl">
            <a href="#funcionalidades" onClick={() => setIsMenuOpen(false)} className="text-xl font-black text-[#0A241D] p-2 rounded hover:bg-gray-50">Aplicações</a>
            <a href="#planos" onClick={() => setIsMenuOpen(false)} className="text-xl font-black text-[#0A241D] p-2 rounded hover:bg-gray-50">Planos</a>
            <Link to="/auth" className="mt-4 bg-[#0A241D] text-white text-center py-5 rounded-[2rem] font-black text-lg outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black">
              Criar Conta Grátis
            </Link>
          </div>
        )}
      </header>

      <main className="relative z-10 w-full flex flex-col overflow-x-hidden pt-[88px]">
        
        {/* --- HERO SECTION --- */}
        <section className="relative w-full px-4 lg:px-8 py-12 lg:py-20 flex flex-col items-center justify-start min-h-[85vh] bg-grid">
           
           <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm mb-6 text-gray-500">
              Gerente Doméstico
           </div>
           
           <h1 className="text-center font-medium tracking-tight text-gray-400 mb-2 leading-tight text-5xl md:text-7xl lg:text-[6rem]" style={{ textWrap: 'balance' }}>
              A organização da sua casa
           </h1>
           <h2 className="text-center font-black tracking-tighter text-[#0A241D] leading-[0.95] mb-12 lg:mb-20 text-5xl md:text-7xl lg:text-[7rem]" style={{ textWrap: 'balance' }}>
              Começa aqui.
           </h2>

           {/* Hero Complex Layout */}
           <div className="relative w-full max-w-5xl mx-auto flex justify-center pb-20">
              
              {/* Floating Widget 1 - Left */}
              <div className="hidden lg:flex absolute left-0 top-10 bg-white p-6 rounded-[2rem] shadow-xl items-center gap-4 border border-gray-100 z-20 hover:-translate-y-2 transition-transform duration-500">
                <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500"><AlertTriangle aria-hidden="true"/></div>
                <div>
                  <p className="font-black text-[#0A241D] text-lg">Vence Hoje</p>
                  <p className="text-sm text-gray-500 font-medium">Iogurte Laranja</p>
                </div>
              </div>

              {/* Floating Widget 2 - Right */}
              <div className="hidden lg:flex absolute right-0 top-32 bg-white p-6 rounded-[2rem] shadow-xl flex-col gap-4 border border-gray-100 z-20 hover:-translate-y-2 transition-transform duration-500">
                 <div className="flex gap-[-10px]">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-emerald-800 font-bold z-10">M</div>
                    <div className="w-10 h-10 rounded-full bg-amber-100 border-2 border-white flex items-center justify-center text-amber-800 font-bold -ml-4 z-20">J</div>
                 </div>
                 <p className="text-xs font-black uppercase tracking-wider text-gray-400">Sincronização<br/><span className="text-[#0A241D]">Multiusuário</span></p>
              </div>

              {/* Main Phone Mockup */}
              <div className="relative w-[300px] md:w-[340px] aspect-[9/19] bg-[#0A241D] rounded-[3rem] border-[12px] border-[#0A241D] shadow-[0_40px_80px_-20px_rgba(10,36,29,0.4)] overflow-hidden flex flex-col z-10">
                <div className="absolute top-0 inset-x-0 h-6 w-36 bg-[#0A241D] rounded-b-[1.5rem] mx-auto z-30" aria-hidden="true"></div>
                
                <div className="flex-1 bg-[#FAFAFA] pt-14 pb-8 px-5 overflow-y-auto hide-scrollbar relative flex flex-col items-center">
                   <div className="w-full mb-6">
                      <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest mb-1">Visão Geral</p>
                      <h3 className="text-3xl font-black text-[#0A241D] tracking-tight">Kaza.</h3>
                   </div>
                   
                   {/* Embed interactive component */}
                   <ListaMockup />

                   <Link to="/auth" className="mt-auto w-full bg-[#1A5C4A] text-white py-4 rounded-[1.5rem] text-center font-black text-sm uppercase tracking-wider outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1A5C4A]">
                      Abrir WebApp
                   </Link>
                </div>
              </div>

           </div>
        </section>

        {/* --- SECTION: CUSTOMIZED WORKOUTS STYLED (ESTOQUE) --- */}
        <section id="funcionalidades" className="py-24 lg:py-32 px-4 lg:px-8 max-w-[1400px] mx-auto w-full">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            <div className="flex-1 text-center lg:text-left order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-[10px] font-black uppercase tracking-[0.2em] mb-8 text-gray-500 border border-gray-200">
                Estoque Inteligente
              </div>
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-[#0A241D] mb-4 leading-[0.95]" style={{ textWrap: 'balance'}}>
                Controle Total <br className="hidden lg:block"/><span className="text-gray-400 font-medium tracking-tight">da sua casa</span>
              </h2>
              <p className="text-xl text-gray-600 mb-10 max-w-lg mx-auto lg:mx-0 font-medium leading-relaxed">
                Tudo o que entra e sai. O aplicativo rastreia as quantidades automaticamente e avisa muito antes de você precisar ir ao mercado. Teste ao lado.
              </p>
              <Link to="/auth" className="inline-block bg-[#0A241D] text-white px-10 py-5 rounded-full font-black text-lg hover:bg-black transition-colors shadow-2xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black outline-none">
                Criar Conta
              </Link>
            </div>
            
            <div className="flex-1 w-full max-w-md mx-auto order-1 lg:order-2">
               <div className="bg-white rounded-[4rem] p-8 lg:p-12 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col relative overflow-hidden">
                  <div className="w-20 h-2 bg-gray-200 rounded-full mx-auto mb-12"></div>
                  <h4 className="text-2xl font-black text-[#0A241D] mb-8">Despensa</h4>
                  <EstoqueMockup />
               </div>
            </div>
          </div>
        </section>

        {/* --- SECTION: IMMERSIVE ENDLESS OPTIONS (RECEITAS) --- */}
        <section id="experiencia" className="px-4 lg:px-8 w-full max-w-[1500px] mx-auto py-12">
          <div className="relative w-full rounded-[4rem] overflow-hidden bg-[#1A5C4A] aspect-auto min-h-[800px] lg:min-h-[600px] flex flex-col lg:flex-row justify-between p-8 lg:p-16 gap-12 isolate">
             
             {/* Abstract Immersive Background */}
             <div className="absolute inset-0 bg-gradient-to-br from-[#0A241D] to-[#1A5C4A] opacity-95 -z-10" aria-hidden="true"></div>
             <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#F5C842]/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 -z-10" aria-hidden="true"></div>
             <div className="absolute inset-0 -z-10 opacity-10" style={{backgroundImage: 'radial-gradient(circle at center, white 2px, transparent 2px)', backgroundSize: '48px 48px'}} aria-hidden="true"></div>

             <div className="relative z-10 max-w-xl shrink-0 pt-8 lg:pt-0">
                <div className="inline-flex px-4 py-2 rounded-full bg-white/10 text-emerald-100 text-[10px] font-black uppercase tracking-[0.2em] mb-8 backdrop-blur border border-white/20">
                  Inteligência Artificial
                </div>
                <h2 className="text-5xl md:text-7xl font-medium text-emerald-100/70 mb-2 leading-[0.95] tracking-tight">Infinitas</h2>
                <h2 className="text-5xl md:text-7xl font-black text-white leading-[0.95] tracking-tighter" style={{ textWrap: 'balance'}}>Opções de Pratos</h2>
                <p className="text-emerald-50 mt-8 text-xl font-medium leading-relaxed">
                  Não sabe o que cozinhar com o resto do almoço? O Kaza cruza os ingredientes da sua geladeira e cria a receita perfeita, com um toque.
                </p>
             </div>

             <div className="relative z-10 flex w-full lg:w-auto mt-auto lg:mt-0 lg:ml-auto items-end pb-4 lg:pb-0">
                {/* Embedded 3D Recipe Card */}
                <div className="w-full md:w-[350px] mx-auto lg:mx-0">
                  <ReceitasMockup />
                </div>
             </div>
          </div>
        </section>

        {/* --- SECTION: ELEVATE HEALTH (3 COLUMNS) --- */}
        <section className="py-24 lg:py-32 px-4 lg:px-8 max-w-[1400px] mx-auto text-center">
           <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-gray-200 text-gray-500">
             Visão Geral
           </div>
           
           <h2 className="text-5xl md:text-6xl lg:text-[5.5rem] font-medium text-gray-400 mb-0 leading-[1]">Eleve a Gestão</h2>
           <h2 className="text-5xl md:text-6xl lg:text-[5.5rem] font-black tracking-tighter text-[#0A241D] leading-[1] mb-20 lg:mb-24 text-balance">
             Reduza o desperdício
           </h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              
              {/* Box 1 - Alertas */}
              <div className="bg-[#F8F8F6] rounded-[3rem] p-8 lg:p-10 min-h-[400px] flex flex-col items-start relative border border-gray-200">
                 <h4 className="font-black text-3xl mb-8 text-left text-[#0A241D] leading-[1.1]">Alertas de <br/>Vencimento</h4>
                 <div className="w-full mt-auto text-left">
                   <AlertasMockup />
                 </div>
              </div>

              {/* Box 2 - Chart */}
              <div className="bg-white border border-gray-200 shadow-sm rounded-[3rem] p-8 lg:p-10 min-h-[400px] flex flex-col items-start">
                 <h4 className="font-black text-3xl mb-8 text-left text-[#0A241D] leading-[1.1]">Controle de <br/>Gastos Mês a Mês</h4>
                 <div className="w-full mt-auto h-[220px]">
                   <RelatorioMockup />
                 </div>
              </div>

              {/* Box 3 - Mockup App in Hand */}
              <div className="bg-emerald-50 rounded-[3rem] p-8 lg:p-10 min-h-[400px] flex flex-col items-center justify-end relative overflow-hidden border border-emerald-100 group md:col-span-2 lg:col-span-1">
                 <h4 className="font-black text-3xl mb-8 absolute top-8 lg:top-10 left-8 lg:left-10 text-left z-10 text-emerald-900 leading-[1.1]">Na palma <br/>da mão</h4>
                 {/* Fake Phone Half */}
                 <div className="w-[220px] h-[280px] bg-[#0A241D] rounded-t-[3rem] border-[12px] border-[#0A241D] absolute bottom-0 translate-y-16 group-hover:translate-y-8 transition-transform duration-700 flex flex-col pt-8 px-4 shadow-2xl">
                    <div className="w-full h-8 bg-white/10 rounded-full mb-4"></div>
                    <div className="w-3/4 h-8 bg-white/5 rounded-full mb-4"></div>
                    <div className="w-full h-24 bg-white rounded-2xl p-4 mt-auto">
                      <div className="w-10 h-10 bg-gray-100 rounded-full"></div>
                    </div>
                 </div>
              </div>
           </div>
        </section>

      </main>

      {/* --- FOOTER CTA SECTION (MARQUEE) --- */}
      <footer id="planos" className="bg-[#0A241D] pt-12 rounded-t-[4rem] lg:rounded-t-[6rem] overflow-hidden relative mt-12 w-full flex flex-col border-t-[12px] border-[#1A5C4A]">
        
        {/* Marquee Huge Text */}
        <div className="w-full overflow-hidden flex whitespace-nowrap opacity-[0.8] text-white pt-10 pb-8 select-none" aria-hidden="true">
          <div className="animate-marquee-infinite">
            <span className="inline-block text-[15vw] md:text-[12vw] font-black tracking-tighter leading-none mr-8 uppercase">Gestão da sua Casa • </span>
            <span className="inline-block text-[15vw] md:text-[12vw] font-medium tracking-tighter leading-none mr-8 uppercase text-emerald-100/50">Crie sua Conta • </span>
            <span className="inline-block text-[15vw] md:text-[12vw] font-black tracking-tighter leading-none mr-8 uppercase">Gestão da sua Casa • </span>
            <span className="inline-block text-[15vw] md:text-[12vw] font-medium tracking-tighter leading-none mr-8 uppercase text-emerald-100/50">Crie sua Conta • </span>
          </div>
        </div>

        {/* Links and CTA Grid */}
        <div className="max-w-[1400px] w-full mx-auto px-6 grid md:grid-cols-12 gap-16 lg:gap-20 mt-10 pb-20 border-t border-white/10 pt-20">
           <div className="col-span-1 md:col-span-6 lg:col-span-5 flex flex-col">
             <div className="flex items-center gap-3 mb-10">
               <KazaLogo className="w-12 h-12" />
               <span className="text-4xl font-black tracking-tight text-white mt-1" translate="no">kaza</span>
             </div>
             <h3 className="text-3xl font-black text-white mb-10 leading-tight">Empoderando cada<br/>etapa do seu lar.</h3>
             <div className="mt-auto">
               <Link to="/auth" className="inline-block bg-white text-[#0A241D] px-10 py-5 rounded-full font-black text-lg hover:bg-gray-100 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A241D] focus-visible:ring-white outline-none">
                 Começar Agora Grátis
               </Link>
             </div>
           </div>
           
           <div className="col-span-1 md:col-span-3 lg:col-span-2 lg:col-start-8">
              <h4 className="font-bold text-white mb-8 text-sm tracking-widest uppercase">Kaza App</h4>
              <ul className="space-y-5">
                <li><a href="#funcionalidades" className="text-gray-400 hover:text-white font-medium transition-colors text-lg outline-none focus-visible:text-white">Aplicações</a></li>
                <li><a href="#experiencia" className="text-gray-400 hover:text-white font-medium transition-colors text-lg outline-none focus-visible:text-white">Experiência</a></li>
                <li><Link to="/auth" className="text-gray-400 hover:text-white font-medium transition-colors text-lg outline-none focus-visible:text-white">Entrar (Login)</Link></li>
              </ul>
           </div>

           <div className="col-span-1 md:col-span-3 lg:col-span-3 border-t md:border-t-0 md:border-l border-white/10 pt-10 md:pt-0 md:pl-10 lg:pl-16">
              <h4 className="font-bold text-white mb-8 text-sm tracking-widest uppercase">Legal</h4>
              <ul className="space-y-5">
                <li><Link to="/settings/privacy" className="text-gray-400 hover:text-white font-medium transition-colors text-lg outline-none focus-visible:text-white">Privacidade</Link></li>
                <li><Link to="/settings/faq" className="text-gray-400 hover:text-white font-medium transition-colors text-lg outline-none focus-visible:text-white">Termos de Uso</Link></li>
              </ul>
              
              <div className="mt-20 pt-10 border-t border-white/10">
                 <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">© {new Date().getFullYear()} Kaza Inc.</p>
              </div>
           </div>
        </div>
      </footer>
    </div>
  );
}
