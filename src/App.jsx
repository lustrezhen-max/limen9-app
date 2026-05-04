import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Heart, Sun, Cloud, BookOpen, Sparkles, ArrowRight, AlertCircle, Check, X, ShieldAlert, Activity, Database, Cpu, Globe2, User, Fingerprint, Terminal, Crosshair, Triangle, GitBranch, Beaker, Monitor, Smartphone, Languages, HeartPulse, Sparkle, Stethoscope, Volume2, VolumeX } from 'lucide-react';

const IMAGE_STYLE_SUFFIX = ", masterpiece, high quality anime style, Limen-9 dystopia concept art, bright, clean, healing light, hospital or modern sci-fi room";

// --- 遊戲底層數據 (治癒系雙語版) ---

const CASE_TYPES = {
  FAMILY: { 
    id: 'FAMILY', 
    icon: <Heart className="w-5 h-5 lg:w-6 lg:h-6 text-rose-400" />, 
    name: { zh: '親情級 · 深度依戀', en: 'KINSHIP: DEEP ATTACHMENT' },
    desc: { zh: '源於深層的情感連結。需以極度溫和的耐心進行疏導，切忌強硬分離。', en: 'Rooted in deep emotional bonds. Requires extremely gentle guidance; avoid harsh detachment.' }
  },
  ROMANCE: { 
    id: 'ROMANCE', 
    icon: <Sparkles className="w-5 h-5 lg:w-6 lg:h-6 text-amber-400" />, 
    name: { zh: '情感級 · 鏡像迷局', en: 'ROMANCE: MIRROR MAZE' },
    desc: { zh: '容易陷入反覆的自我懷疑。需及時給予肯定，打破思維的死循環。', en: 'Prone to repetitive self-doubt. Timely validation needed to break the cognitive loop.' }
  },
  SOCIAL: { 
    id: 'SOCIAL', 
    icon: <Cloud className="w-5 h-5 lg:w-6 lg:h-6 text-sky-400" />, 
    name: { zh: '泛化級 · 人際焦慮', en: 'SOCIAL: PEER ANXIETY' },
    desc: { zh: '對外界目光過於敏感。需建立心理安全邊界，隔絕無效的社交內耗。', en: 'Over-sensitive to external judgment. Requires safe boundaries to isolate social friction.' }
  }
};

const INTERVENTIONS = [
  {
    id: 'DIVERT',
    tag: { zh: '溫和疏導 [ SAFE ]', en: 'GENTLE [ SAFE ]' },
    name: { zh: '注意力轉移', en: 'DIVERT ATTENTION' },
    desc: { zh: '引導對象尋找生活中的微小確幸。安全且平緩，能讓緊繃的神經逐漸放鬆。', en: 'Guide target to find small joys in life. Safe and gentle, gradually relaxes tense nerves.' },
    execute: () => ({ 
      msg: { zh: '[ 疏導成功 ] 已成功轉移注意力，焦慮絲線開始柔軟、細化。', en: '[ GUIDANCE OK ] Attention diverted. Anxiety threads softening and thinning.' }, 
      type: 'success', changes: { density: -10, frequency: -20, dependency: -5, closure: -5 } 
    })
  },
  {
    id: 'RESTRUCT',
    tag: { zh: '深度剖析 [ CAUTION ]', en: 'ANALYSIS [ CAUTION ]' },
    name: { zh: '邏輯鏈路梳理', en: 'LOGIC RESTRUCTURE' },
    desc: { zh: '理性地陪同對象復盤事件。若對象情緒不穩，可能會適得其反加重自責。', en: 'Rationally review events with the target. May backfire and increase guilt if target is unstable.' },
    execute: (roll) => {
      if (roll >= 12) return { msg: { zh: '[ 梳理成功 ] 思想盲區被溫柔解開，糾結的絲線化為飛灰消散。', en: '[ RESTRUCTURE OK ] Mental blind spots gently untied. Tangled threads dissolving.' }, type: 'success', changes: { density: -30, dependency: -40, closure: -20, frequency: -15 } };
      if (roll <= 6) return { msg: { zh: '[ 情緒波動 ] 對象產生抗拒！過度的理性分析反而加重了自我否定，絲線增粗！', en: '[ EMOTIONAL SPIKE ] Target resisted! Over-analysis worsened self-denial. Threads thickened!' }, type: 'danger', changes: { dependency: +35, closure: +25, frequency: +25 } };
      return { msg: { zh: '[ 進展緩慢 ] 對象仍在猶豫，核心心結暫時無法觸及。', en: '[ SLOW PROGRESS ] Target hesitating. Core knot remains temporarily unreachable.' }, type: 'warning', changes: { dependency: +15, closure: +10 } };
    }
  },
  {
    id: 'ACCEPT',
    tag: { zh: '情感療癒 [ SENSITIVE ]', en: 'HEALING [ SENSITIVE ]' },
    name: { zh: '無條件共鳴', en: 'UNCONDITIONAL EMPATHY' },
    desc: { zh: '給予全盤的接納與擁抱。但極度自卑者可能會覺得這是一種「居高臨下的同情」。', en: 'Provide total acceptance and embrace. Extremely insecure targets might feel this is condescending pity.' },
    execute: (roll) => {
      if (roll >= 14) return { msg: { zh: '[ 共鳴生效 ] 心理防線融化，對象感受到了真正的理解，絲線迅速消退。', en: '[ EMPATHY ACTIVE ] Defenses melted. Target feels truly understood. Threads fading rapidly.' }, type: 'success', changes: { closure: -45, frequency: -30, density: -15 } };
      if (roll <= 9) return { msg: { zh: '[ 信任危機 ] 對象無法承受這份接納，將其視為憐憫！情緒封閉，絲線收緊！', en: '[ TRUST CRISIS ] Target cannot bear the acceptance, viewing it as pity! Emotionally closed off, threads tightened!' }, type: 'danger', changes: { closure: +40, density: +30, frequency: +20 } };
      return { msg: { zh: '[ 輕微觸動 ] 情緒得到了一絲慰藉，但深層焦慮依然存在。', en: '[ SLIGHT TOUCH ] A hint of comfort received, but deep anxiety remains.' }, type: 'warning', changes: { closure: +10, density: +10 } };
    }
  },
  {
    id: 'RESTRICT',
    tag: { zh: '緊急干預 [ CRITICAL ]', en: 'EMERGENCY [ CRITICAL ]' },
    name: { zh: '強制思緒阻斷', en: 'THOUGHT INTERRUPTION' },
    desc: { zh: '在對象即將崩潰時，強行將其拉離當前情境。手段激進，容易引起劇烈的情緒反彈。', en: 'Pull target away from the situation abruptly when on the verge of collapse. Radical, prone to severe emotional rebound.' },
    execute: (roll) => {
      if (roll >= 10) return { msg: { zh: '[ 阻斷成功 ] 成功將對象從深淵邊緣拉回，致命的內耗絲線瞬間隱形。', en: '[ INTERRUPT SUCCESS ] Target pulled back from the edge. Lethal friction threads instantly invisible.' }, type: 'success', changes: { frequency: -50, density: -25 } };
      if (roll <= 6) return { msg: { zh: '[ 阻斷失敗 ] 粗暴的干預引發了災難級的創傷反彈！結繭極速惡化！', en: '[ INTERRUPT FAILED ] Harsh intervention triggered catastrophic trauma rebound! Cocooning critical!' }, type: 'danger', changes: { density: +50, frequency: +40, closure: +25 } };
      return { msg: { zh: '[ 治標不治本 ] 僅實現了表層的平靜，深層的痛苦仍在翻湧。', en: '[ BAND-AID FIX ] Surface calmness achieved, but deep pain still surges.' }, type: 'warning', changes: { density: +15, frequency: +15 } };
    }
  }
];

const CASES = [
  {
    id: 1,
    name: { zh: "關懷對象 #2904-R", en: "PATIENT #2904-R" },
    age: 22,
    origin: { zh: "下層數據篩查區", en: "Lower Data Sector" },
    family: { zh: "系統撫育機構出身，渴望陪伴", en: "System Orphanage, yearns for companionship" },
    trigger: { zh: "02:00 未被回應的通訊信號", en: "02:00 Unanswered Comm Signal" },
    profile: { 
      zh: "對象自幼缺乏情感寄託，將全部自我價值綁定於單一的親密關係。表現出分離焦慮，極易因被忽視而陷入深度的自我懷疑與內耗。", 
      en: "Target lacks emotional support since childhood, binding total self-worth to a single intimate relationship. Exhibits separation anxiety. Highly susceptible to deep self-doubt when ignored." 
    },
    // 直接指定本地圖片路徑，前提是圖片已放置在 public/ 根目錄下
    image: "/case1.png",
    text: { 
      zh: "「他又沒有回消息。已經過去三個小時了。我是不是上一句話說得太重了？還是他根本就不在乎？如果他在乎，為什麼連個標點符號都不發？我要不要再發一條解釋一下？不，那樣顯得我很卑微。可是萬一他真的誤會了呢？我必須找到一個合理的解釋...」", 
      en: "\"He hasn't replied. It's been three hours. Was my last message too harsh? Or does he simply not care? If he did, why not even send a punctuation mark? Should I send another message to explain? No, that makes me look pathetic. But what if he really misunderstood? I must find a logical explanation...\"" 
    },
    trueType: CASE_TYPES.ROMANCE.id,
    initialStats: { density: 45, frequency: 85, dependency: 90, closure: 50 }
  },
  {
    id: 2,
    name: { zh: "關懷對象 #8131-F", en: "PATIENT #8131-F" },
    age: 58,
    origin: { zh: "前工業區", en: "Former Industrial Zone" },
    family: { zh: "喪偶，獨子於三年前意外離世", en: "Widowed, only child passed away in an accident" },
    trigger: { zh: "一塊停擺的舊時代機械手錶", en: "A halted old-world mechanical watch" },
    text: { 
      zh: "「指針不走了。就像那年我在醫療艙外，聽見生命維持系統停止的聲音。我總覺得如果我當時多懂一點醫學知識，或者早點帶他去檢查... 那塊表他戴了三十年，我連遺物都保護不好。這是給我的懲罰，一條永遠無法解開的因果鏈。」", 
      en: "\"The hands stopped moving. Just like that year outside the medical bay, hearing the life support system flatline. I always feel that if I had known more medical knowledge, or taken him for a checkup earlier... He wore that watch for thirty years, and I can't even protect a relic. This is my punishment, an unbreakable causal chain.\"" 
    },
    profile: { 
      zh: "老舊機械維護員。背負深重的愧疚感，認為兒子的死是自身疏忽所致。長期處於自我封閉與自責狀態，極度需要被傾聽與寬慰。", 
      en: "Old machinery maintenance worker. Bears deep guilt, believing his son's death was due to his own negligence. Chronically self-isolated and remorseful, desperately needs to be heard and comforted." 
    },
    image: "/case2.png",
    trueType: CASE_TYPES.FAMILY.id,
    initialStats: { density: 85, frequency: 35, dependency: 65, closure: 75 }
  },
  {
    id: 3,
    name: { zh: "關懷對象 #4402-S", en: "PATIENT #4402-S" },
    age: 28,
    origin: { zh: "中層執行區", en: "Mid-level Execution Sector" },
    family: { zh: "高壓學術家庭，以績效衡量價值", en: "High-Pressure Academic Family (Value = Performance)" },
    trigger: { zh: "執行區例會上的三秒停頓", en: "A 3-second pause at the execution briefing" },
    text: { 
      zh: "「我提交完數據後，主管停頓了三秒才點頭。那三秒裡，旁邊的同事也看了我一眼。是不是我的報告完全不符合系統要求？中午資源分配時他們也沒叫我，肯定是因為覺得我能力不行被淘汰了。整個執行區都在暗暗嘲笑我。我該怎麼修補這些關係...」", 
      en: "\"After I submitted the data, the supervisor paused for three seconds before nodding. In those three seconds, the colleague next to me glanced over. Was my report completely off-spec? They didn't call me for resource distribution at noon. They must think I'm incompetent and redundant. The entire execution sector is secretly laughing at me. How do I mend these relationships...\"" 
    },
    profile: { 
      zh: "新晉干員。受原生家庭嚴苛要求影響，對環境反饋極度敏感，具有嚴重的職場表現焦慮。迫切需要建立自信與心理安全邊界。", 
      en: "Junior operative. Influenced by strict family expectations, extremely sensitive to environmental feedback, suffering from severe workplace performance anxiety. Urgently needs to build self-confidence and psychological boundaries." 
    },
    image: "/case3.png",
    trueType: CASE_TYPES.SOCIAL.id,
    initialStats: { density: 30, frequency: 65, dependency: 80, closure: 35 }
  }
];

// --- 夢幻環境光效背景 (Ambient Glassmorphism Background) ---
const AmbientBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
     <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-teal-200/40 blur-[120px] animate-[pulse_10s_ease-in-out_infinite_alternate]"></div>
     <div className="absolute top-[40%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-200/30 blur-[100px] animate-[pulse_15s_ease-in-out_infinite_alternate-reverse]"></div>
     <div className="absolute bottom-[-10%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-rose-100/40 blur-[90px] animate-[pulse_12s_ease-in-out_infinite_alternate]"></div>
     <div className="absolute inset-0 bg-slate-50/40 backdrop-blur-[50px]"></div>
     <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
  </div>
);

// --- 沉浸式治癒粒子系統 ---
const HealingParticles = () => {
  const particles = useMemo(() => Array.from({length: 25}).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: Math.random() * 4 + 2,
    delay: Math.random() * 5,
    duration: Math.random() * 10 + 15,
    opacity: Math.random() * 0.4 + 0.2
  })), []);

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map(p => (
        <div 
          key={p.id} 
          className="absolute bg-white rounded-full animate-[floatUp_linear_infinite]"
          style={{
            left: `${p.left}%`,
            bottom: '-20px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            opacity: p.opacity,
            boxShadow: '0 0 12px rgba(255,255,255,0.9)'
          }} 
        />
      ))}
    </div>
  );
};

// --- 明亮版：認知淨化風暴（Purify Overlay） ---
const PurifyOverlay = ({ isLandscape, lang }) => {
  const particles = useMemo(() => Array.from({length: 60}).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: Math.random() * 6 + 2,
    delay: Math.random() * 1,
    duration: Math.random() * 1 + 1.5,
    isTeal: Math.random() > 0.5
  })), []);

  return (
    <div className="fixed inset-0 overflow-hidden z-[100] pointer-events-none animate-[stormEnter_0.8s_ease-out_forwards]">
      <div className="absolute inset-0 bg-white/70 backdrop-blur-xl animate-[pulseGlow_2s_infinite]"></div>
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${isLandscape ? 'w-[60vw] h-[60vw]' : 'w-[100vw] h-[100vw]'} max-w-[600px] max-h-[600px] bg-teal-100/60 blur-[100px] animate-pulse`}></div>
      
      {particles.map(p => (
        <div 
          key={p.id}
          className={`absolute rounded-full animate-[particleRush_linear_infinite] ${p.isTeal ? 'bg-teal-300' : 'bg-cyan-200'}`}
          style={{
            left: `${p.left}%`,
            bottom: '-20px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            boxShadow: `0 0 20px ${p.isTeal ? 'rgba(45,212,191,0.8)' : 'rgba(34,211,238,0.8)'}`
          }}
        />
      ))}

      {/* 柔和的波紋光環 */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${isLandscape ? 'w-[45vw] h-[45vw]' : 'w-[70vw] h-[70vw]'} max-w-[600px] max-h-[600px] border border-teal-300/30 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]`}></div>
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${isLandscape ? 'w-[30vw] h-[30vw]' : 'w-[50vw] h-[50vw]'} max-w-[400px] max-h-[400px] border-4 border-dotted border-cyan-200/50 rounded-full animate-[spin_6s_linear_infinite]`}></div>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center z-40 px-4 text-center">
        <HeartPulse className={`w-20 h-20 ${isLandscape ? 'md:w-32 md:h-32' : ''} text-teal-500 mb-6 animate-[pulse_1s_ease-in-out_infinite] drop-shadow-[0_0_25px_rgba(45,212,191,0.7)]`} />
        <h2 className={`text-slate-800 font-black tracking-[0.2em] drop-shadow-sm uppercase ${isLandscape ? 'text-5xl lg:text-6xl' : 'text-3xl'}`}>
          {lang === 'zh' ? '認知淨化中' : 'PURIFYING'}
        </h2>
        <p className={`text-teal-600 mt-6 uppercase font-bold bg-white/90 px-8 py-2.5 shadow-[0_8px_30px_rgba(45,212,191,0.2)] rounded-full ${isLandscape ? 'text-lg tracking-[0.4em]' : 'text-xs tracking-[0.2em]'}`}>
          {lang === 'zh' ? '正在梳理思緒軌跡...' : 'CLARIFYING NEURAL PATHWAYS...'}
        </p>
      </div>
    </div>
  );
};

// --- 核心雷達與絲線渲染 (治癒明亮風格) ---
const ThreadCocoonVisualizer = ({ stats, imageUrl, forceDemoSize, isLandscape, isTransitioning }) => {
  const MAX_LINES = 60;
  const activeLineCount = Math.max(6, Math.floor((stats.density / 100) * MAX_LINES));
  const tightness = Math.max(0, Math.min(1, stats.closure / 100)); 
  
  const normalizedFreq = stats.frequency / 100;
  const normalizedDen = stats.density / 100;
  
  // 在淺色背景下，線條稍微明顯一點
  const baseThickness = 0.8 + Math.pow(normalizedFreq, 2) * 3.0 + (normalizedDen * 1.5);
  const globalOpacity = 0.2 + (normalizedFreq * 0.6) + (normalizedDen * 0.2);

  let colorMode = 'teal';
  if (stats.closure > 45 || stats.density > 60) colorMode = 'amber';
  if (stats.closure > 75 || stats.density > 85) colorMode = 'rose';
  if (stats.density <= 15 && stats.closure === 0) colorMode = 'teal'; 

  // 白底適配顏色：加深了線條顏色以保證對比度，提亮了核心光暈
  const colorMap = {
    teal: { stroke: 'stroke-teal-400', core: 'bg-teal-200', shell: 'fill-teal-50/80' },
    amber: { stroke: 'stroke-amber-400', core: 'bg-amber-200', shell: 'fill-amber-50/80' },
    rose: { stroke: 'stroke-rose-400', core: 'bg-rose-200', shell: 'fill-rose-50/90' }
  };
  const currentColors = colorMap[colorMode];

  const pseudoRand = (seed) => {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const chaosLines = useMemo(() => {
    return Array.from({ length: MAX_LINES }).map((_, i) => {
      const isVisible = i < activeLineCount;
      const randAngle = (i / MAX_LINES) * Math.PI * 2;
      const tightnessInv = 1 - tightness;

      const rX = 16 + pseudoRand(i*1) * 8;
      const rY = 28 + pseudoRand(i*2) * 8;

      const startX = 50 + Math.cos(randAngle) * (rX + pseudoRand(i*3) * 100 * tightnessInv);
      const startY = 52 + Math.sin(randAngle) * (rY + pseudoRand(i*4) * 100 * tightnessInv);
      const endX = 50 + Math.cos(randAngle + Math.PI) * (rX + pseudoRand(i*5) * 100 * tightnessInv); 
      const endY = 52 + Math.sin(randAngle + Math.PI) * (rY + pseudoRand(i*6) * 100 * tightnessInv);

      const pullOutward = 30 + 150 * tightnessInv * Math.abs(Math.sin(i * 45.6 + i * i));
      const ctrl1X = 50 + (pseudoRand(i*7) - 0.5) * 400 * tightnessInv;
      const ctrl1Y = 52 + (pseudoRand(i*8) - 0.5) * 400 * tightnessInv;
      const ctrl2X = 50 + (pseudoRand(i*9) - 0.5) * 400 * tightnessInv;
      const ctrl2Y = 52 + (pseudoRand(i*10) - 0.5) * 400 * tightnessInv;

      return {
        id: i,
        d: `M ${startX} ${startY} C ${ctrl1X} ${ctrl1Y}, ${ctrl2X} ${ctrl2Y}, ${endX} ${endY}`,
        opacity: isVisible ? ((0.1 + pseudoRand(i*11) * 0.5 + (tightness * 0.4)) * globalOpacity) : 0
      };
    });
  }, [activeLineCount, tightness, globalOpacity]);

  const pulseDuration = Math.max(0.5, 4 - (stats.frequency / 100) * 2.5);
  const imageOpacity = Math.max(0.3, 1 - tightness * 0.7);

  let heightClass = forceDemoSize ? 'min-h-[220px]' : (isLandscape ? 'h-full min-h-[250px]' : 'h-[300px]');
  const transitionClass = isTransitioning ? 'scale-105 blur-[1px] brightness-110 opacity-80' : 'scale-100 blur-0 brightness-100 opacity-100';

  return (
    <div className={`relative w-full ${heightClass} bg-white/60 border border-white/80 flex items-center justify-center overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[2rem] flex-shrink-0 lg:flex-grow transition-all duration-[800ms] ease-in-out backdrop-blur-2xl ${transitionClass}`}>
      
      {/* 柔和點陣背景 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(148,163,184,0.15)_1px,transparent_1px)] bg-[size:20px_20px]"></div>

      <div
        className={`absolute rounded-full ${isLandscape ? 'blur-[60px]' : 'blur-[40px]'} opacity-50 transition-colors duration-1000 ${currentColors.core}`}
        style={{
          width: `${40 + stats.closure * 1.5}%`,
          height: `${40 + stats.closure * 1.5}%`,
          animation: `pulseCocoon ${pulseDuration}s infinite alternate ease-in-out`
        }}
      />
      
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full z-10 opacity-90 pointer-events-none">
        <defs>
          <clipPath id="avatar-clip">
            <circle cx="50" cy="52" r="22" />
          </clipPath>
        </defs>

        {imageUrl ? (
          <g className="transition-all duration-1000 ease-in-out" style={{ opacity: imageOpacity }}>
            <image 
              href={imageUrl} 
              x="28" y="30" 
              width="44" height="44" 
              clipPath="url(#avatar-clip)" 
              preserveAspectRatio="xMidYMid slice" 
            />
            <circle cx="50" cy="52" r="23" fill="none" stroke="rgba(45,212,191,0.3)" strokeWidth="0.5" strokeDasharray="2 4" />
            <circle cx="50" cy="52" r="22" fill="none" className={currentColors.stroke} strokeWidth="1.5" opacity="0.6" />
          </g>
        ) : (
          <g className="transition-all duration-1000 ease-in-out" style={{ opacity: imageOpacity }}>
            {/* 明亮風格人物靜坐剪影 */}
            <circle cx="50" cy="42" r="6" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5"/>
            <path d="M 40 68 C 40 48, 60 48, 60 68 Z" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5"/>
          </g>
        )}

        <ellipse
          cx="50"
          cy="52"
          rx="22"
          ry="33"
          className={`${currentColors.shell} transition-all duration-1000 ease-in-out`}
          style={{ opacity: Math.max(0, (stats.closure - 55) / 45) }}
        />

        <g style={{ transformOrigin: '50px 50px' }} className="animate-[spin_60s_linear_infinite]">
          {chaosLines.map((line) => (
            <path
              key={line.id}
              d={line.d}
              fill="none"
              strokeWidth={baseThickness} 
              className={`${currentColors.stroke} transition-all duration-[1200ms] ease-in-out`}
              style={{ opacity: line.opacity, strokeLinecap: 'round' }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
};


// --- 結繭演變過程的全息動畫組件 (明亮版) ---
const CocoonEvolutionPage = ({ onNext, isLandscape, lang }) => {
  const [phase, setPhase] = useState(0); 

  const demoStats = useMemo(() => {
    if(phase === 0) return { density: 10, frequency: 10, closure: 0 }; 
    if(phase === 1) return { density: 60, frequency: 65, closure: 35 }; 
    if(phase === 2) return { density: 95, frequency: 95, closure: 95 }; 
    return { density: 5, frequency: 5, closure: 0 }; 
  }, [phase]);

  const phaseData = [
    { 
      title: { zh: "PHASE 1: 思維游離", en: "PHASE 1: TRACE" }, 
      desc: { zh: "未完成的思考如細絲般緩慢環繞，此時情緒穩定，尚未構成威脅。", en: "Incomplete thoughts orbit slowly like fine threads. Emotion is stable, no threat detected." }, 
      color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-200"
    },
    { 
      title: { zh: "PHASE 2: 解釋衝動", en: "PHASE 2: IMPULSE" }, 
      desc: { zh: "個體陷入內耗，尋求解釋。絲線變得狂躁、雜亂，開始向核心收緊。", en: "Subject falls into internal friction, seeking explanations. Threads become chaotic, tightening towards the core." }, 
      color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200"
    },
    { 
      title: { zh: "PHASE 3: 絕對結繭", en: "PHASE 3: COLLAPSE" }, 
      desc: { zh: "結構死鎖。認知徹底被雜念包裹坍縮，形成不可逆的思維死繭。", en: "Structural deadlock. Cognition completely enveloped and collapsed by stray thoughts, forming an irreversible cocoon." }, 
      color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200"
    },
    { 
      title: { zh: "PHASE 4: 認知重構", en: "PHASE 4: RESOLVE" }, 
      desc: { zh: "成功疏導。絲線被梳理、細化，最終消散於無形，身心恢復平穩。", en: "Successful guidance. Threads are combed and thinned, eventually dissipating. Wellbeing restored." }, 
      color: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-200"
    }
  ];

  return (
    <div className="w-full flex flex-col items-center justify-center p-4 lg:p-10 animate-fade-in text-slate-800 py-12">
      <div className="text-center relative mb-8 w-full">
        <h1 className={`font-black text-slate-800 uppercase drop-shadow-sm relative z-10 ${isLandscape ? 'text-4xl tracking-[0.2em] mb-4' : 'text-2xl tracking-[0.1em] mb-2'}`}>
          {lang === 'zh' ? '認知結繭演化矩陣' : 'COCOON EVOLUTION MATRIX'}
        </h1>
        <p className={`text-cyan-600 font-mono font-bold relative z-10 ${isLandscape ? 'text-base tracking-[0.3em]' : 'text-xs tracking-[0.1em]'}`}>
          [ COGNITIVE COCOON EVOLUTION ]
        </p>
      </div>

      <div className={`mt-4 bg-white/70 border border-slate-200/50 backdrop-blur-xl rounded-[2.5rem] ${isLandscape ? 'p-10 flex-row' : 'p-6 flex-col'} flex items-center gap-8 shadow-[0_10px_40px_rgba(0,0,0,0.05)] relative overflow-hidden w-full max-w-5xl`}>
        
        <div className={`flex items-center justify-center relative flex-shrink-0 rounded-[2rem] bg-slate-50/50 ${isLandscape ? 'w-[350px] h-[350px]' : 'w-full h-[250px]'}`}>
           <ThreadCocoonVisualizer stats={demoStats} imageUrl={null} forceDemoSize={true} isLandscape={isLandscape} isTransitioning={false} />
        </div>

        <div className={`flex-grow z-10 w-full ${isLandscape ? 'text-left' : 'text-center'}`}>
          <div className="flex flex-col gap-3 lg:gap-4">
            {phaseData.map((d, i) => (
              <div 
                key={i} 
                onMouseEnter={() => setPhase(i)}
                onClick={() => setPhase(i)}
                className={`p-4 lg:p-5 rounded-2xl border transition-all duration-[600ms] cursor-pointer ${phase === i ? `${d.bg} ${d.border} shadow-md scale-[1.02]` : 'bg-slate-50/50 border-transparent opacity-60 scale-100 hover:opacity-100 hover:bg-slate-100'}`}
              >
                <h3 className={`font-black tracking-widest mb-1.5 ${isLandscape ? 'text-lg' : 'text-sm'} ${phase === i ? d.color : 'text-slate-500'}`}>
                  {d.title[lang]}
                </h3>
                <p className={`leading-relaxed tracking-wide font-sans ${isLandscape ? 'text-sm' : 'text-xs'} ${phase === i ? 'text-slate-700' : 'text-slate-500'}`}>
                  {d.desc[lang]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center relative z-10 w-full mt-12 mb-10">
        <button 
          onClick={onNext}
          className={`bg-gradient-to-r from-teal-400 to-cyan-500 text-white font-bold hover:brightness-110 transition-all flex items-center justify-center mx-auto rounded-full w-full max-w-md shadow-[0_8px_20px_rgba(45,212,191,0.25)] hover:shadow-[0_12px_25px_rgba(34,211,238,0.4)] hover:-translate-y-1 ${isLandscape ? 'px-12 py-5 gap-4 text-base tracking-[0.2em]' : 'px-8 py-4 gap-3 text-sm tracking-[0.1em]'}`}
        >
          {lang === 'zh' ? '[ 演化確認 · 進入驗證協議 ]' : '[ EVOLUTION CONFIRMED · PROCEED ]'} <ArrowRight className={isLandscape ? 'w-5 h-5' : 'w-4 h-4'} />
        </button>
      </div>
    </div>
  );
};

const TacticalProgressBar = ({ label, value, description, isLandscape }) => {
  let currentStyle = 'bg-gradient-to-r from-teal-300 to-cyan-400 shadow-[0_0_10px_rgba(45,212,191,0.4)]';
  let textColor = 'text-teal-600';
  if (value > 45) { currentStyle = 'bg-gradient-to-r from-amber-300 to-orange-400 shadow-[0_0_10px_rgba(251,191,36,0.4)]'; textColor = 'text-amber-500'; }
  if (value > 75) { currentStyle = 'bg-gradient-to-r from-rose-400 to-pink-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]'; textColor = 'text-rose-500'; }

  return (
    <div className={`group flex-shrink-0 ${isLandscape ? 'mb-5' : 'mb-4'}`}>
      <div className={`flex justify-between items-end ${isLandscape ? 'mb-2' : 'mb-1.5'}`}>
        <div className="flex flex-col">
          <span className={`font-bold text-slate-700 tracking-wider ${isLandscape ? 'text-sm' : 'text-xs'}`}>{label}</span>
          <span className={`text-slate-400 font-mono uppercase tracking-widest mt-0.5 opacity-90 ${isLandscape ? 'text-[10px]' : 'text-[8px]'}`}>{description}</span>
        </div>
        <span className={`font-black font-mono tracking-widest ${textColor} ${isLandscape ? 'text-base' : 'text-sm'}`}>{Math.round(value)}%</span>
      </div>
      <div className={`w-full bg-slate-100 border border-slate-200/50 relative overflow-hidden rounded-full ${isLandscape ? 'h-2.5' : 'h-2'}`}>
        <div 
          className={`absolute left-0 top-0 bottom-0 ${currentStyle} transition-all duration-700 ease-out rounded-full`} 
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
};

export default function App() {
  const [gameState, setGameState] = useState('LIMEN9'); 
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  const [phase, setPhase] = useState('DIAGNOSIS'); 
  const [transitionPhase, setTransitionPhase] = useState('NONE'); 
  const [lang, setLang] = useState('zh'); 
  
  const [stats, setStats] = useState({ density: 0, frequency: 0, dependency: 0, closure: 0 });
  const [diagnosis, setDiagnosis] = useState(null);
  const [turns, setTurns] = useState(0);
  
  const [currentFeedback, setCurrentFeedback] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scoreBoard, setScoreBoard] = useState({ terminates: 0, stabilizes: 0, cocoons: 0, collapses: 0 });

  const [aiHint, setAiHint] = useState(null);
  const [isGeneratingHint, setIsGeneratingHint] = useState(false);

  const [preloadedImages, setPreloadedImages] = useState({});
  const [isPreloading, setIsPreloading] = useState(true);

  const [isLandscape, setIsLandscape] = useState(window.innerWidth > 1024);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const audioRef = useRef(null);

  const currentCase = CASES[currentCaseIndex];
  const MAX_TURNS = 3;

  useEffect(() => {
    // 設置並加載 BGM (讀取您上傳的本地文件)
    audioRef.current = new Audio('/心流轻语.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.4; // 舒適的背景音量
    
    // 預加載音頻
    audioRef.current.load();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = ""; // 清除資源
      }
    };
  }, []);

  useEffect(() => {
    // 監聽 isAudioOn 狀態並播放/暫停音樂
    if (audioRef.current) {
      if (isAudioOn) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            console.warn("Audio play failed:", e);
            // 如果瀏覽器仍攔截，自動復位按鈕狀態
            setIsAudioOn(false);
          });
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [isAudioOn]);

  // --- 移除複雜的 API 請求，改用本地圖片快速讀取 ---
  useEffect(() => {
    // 瞬間加載本地圖片，告別 API 延遲！
    const imgMap = {};
    CASES.forEach(c => {
      // 若該案件配置了本地 image 屬性，則使用它；否則回退到 null
      imgMap[c.id] = c.image || null;
    });
    setPreloadedImages(imgMap);
    
    // 稍微延遲一點點取消 Loading，讓過渡動畫更平滑
    setTimeout(() => {
      setIsPreloading(false);
    }, 500);
  }, []);
  // ------------------------------------------------

  const currentCaseImage = preloadedImages[currentCase?.id];

  useEffect(() => {
    if (gameState === 'CASE' && currentCase) {
      setStats({ ...currentCase.initialStats });
      setPhase('DIAGNOSIS');
      setDiagnosis(null);
      setTurns(0);
      setCurrentFeedback(null);
      setAiHint(null);
    }
  }, [currentCaseIndex, gameState]);

  const handleDiagnosis = (typeId) => {
    setAiHint(null); 
    setDiagnosis(typeId);
    setPhase('INTERVENTION');
    if (typeId === currentCase.trueType) {
      setCurrentFeedback({ 
        msg: { zh: "[ 檔案鎖定 ] 判定精準，已為您開放最佳疏導權限。", en: "[ PROFILE MATCHED ] Diagnosis accurate. Optimal guidance permissions granted." }, 
        type: "success" 
      });
    } else {
      setCurrentFeedback({ 
        msg: { zh: "[ 判定偏差 ] 警告：錯誤的干預手段可能引發對象情緒崩潰！", en: "[ MISMATCH ] Warning: Incorrect methods may cause emotional breakdown!" }, 
        type: "warning" 
      });
    }
  };

  const generateAiHint = () => {
    setIsGeneratingHint(true);
    setTimeout(() => {
      let hintObj = {zh: '', en: ''};
      
      if (phase === 'DIAGNOSIS') {
          if (currentCase.trueType === 'FAMILY') {
            hintObj.zh = ">> 醫療AI分析：檢測到強烈的親情羈絆與代際自責，對象極有可能陷入「親情級」深度依戀。";
            hintObj.en = ">> MED-AI: Strong kinship bonds and intergenerational guilt detected. High probability of 'Kinship' deep attachment.";
          } else if (currentCase.trueType === 'ROMANCE') {
            hintObj.zh = ">> 醫療AI分析：檢測到嚴重的情感依賴與分離焦慮，波形高度吻合「情感級」鏡像迷局。";
            hintObj.en = ">> MED-AI: Severe emotional dependence and separation anxiety detected. Matches 'Romance' mirror maze.";
          } else if (currentCase.trueType === 'SOCIAL') {
            hintObj.zh = ">> 醫療AI分析：檢測到群體視角引發的過度焦慮，符合「泛化級」人際焦慮特徵。";
            hintObj.en = ">> MED-AI: Over-anxiety triggered by group perspective. Matches 'Social' peer anxiety.";
          }
      } else {
          if (diagnosis === currentCase.trueType) {
              if (diagnosis === 'FAMILY') {
                hintObj.zh = ">> 療癒建議：親情依戀者內心極度脆弱。強烈建議使用 [無條件共鳴] 進行安撫。請勿使用強硬轉移。";
                hintObj.en = ">> THERAPY CALC: Kinship attachment is deeply fragile. [UNCONDITIONAL EMPATHY] highly recommended. Avoid harsh diversions.";
              }
              if (diagnosis === 'ROMANCE') {
                hintObj.zh = ">> 療癒建議：對象正處於情感死循環。建議使用 [注意力轉移] 溫打斷，粗暴阻斷易引發自殘傾嚮。";
                hintObj.en = ">> THERAPY CALC: Target in romance loop. [DIVERT ATTENTION] recommended. Rough interruptions may cause self-harm.";
              }
              if (diagnosis === 'SOCIAL') {
                hintObj.zh = ">> 療癒建議：人際焦慮正在蔓延。建議使用 [邏輯鏈路梳理]，幫助其理性看清現實，建立自信。";
                hintObj.en = ">> THERAPY CALC: Peer anxiety spreading. [LOGIC RESTRUCTURE] recommended to help them see reality rationally.";
              }
          } else {
              hintObj.zh = ">> 系統警告：您的診斷與對象特徵匹配度低於 15%！醫療AI無法給出安全建議，請謹慎操作！";
              hintObj.en = ">> SYS WARNING: Diagnosis matches target profile by < 15%! Med-AI cannot provide safe recommendations. CAUTION!";
          }
      }
      
      setAiHint(hintObj);
      setIsGeneratingHint(false);
    }, 1500);
  };

  const executeIntervention = (intervention) => {
    setTransitionPhase('INITIATING');
    setAiHint(null);
    setCurrentFeedback(null);
    
    setTimeout(() => {
      setTransitionPhase('NONE');
      setPhase('PROCESSING');
      setIsProcessing(true);
      
      const baseRoll = Math.floor(Math.random() * 20) + 1;
      const modifier = (diagnosis === currentCase.trueType) ? 2 : -2;
      const finalRoll = intervention.id === 'DIVERT' ? 20 : (baseRoll + modifier); 
      
      const outcome = intervention.execute(finalRoll);
      const newStats = {
        density: Math.max(0, Math.min(100, stats.density + (outcome.changes.density || 0))),
        frequency: Math.max(0, Math.min(100, stats.frequency + (outcome.changes.frequency || 0))),
        dependency: Math.max(0, Math.min(100, stats.dependency + (outcome.changes.dependency || 0))),
        closure: Math.max(0, Math.min(100, stats.closure + (outcome.changes.closure || 0))),
      };
      
      setStats(newStats);
      setCurrentFeedback({ msg: outcome.msg, type: outcome.type });
      setIsProcessing(false);
      
      setTimeout(() => { checkCaseStatus(newStats, turns + 1); }, 2500); 
    }, 800); 
  };

  const checkCaseStatus = (currentStats, currentTurn) => {
    let outcome = null;
    if (currentStats.closure >= 95 || currentStats.density >= 95) outcome = 'COLLAPSE';
    else if (currentStats.closure <= 20 && currentStats.frequency <= 20) outcome = 'TERMINATE';
    else if (currentTurn >= MAX_TURNS) {
      if (currentStats.closure < 50 && currentStats.density < 60) outcome = 'STABILIZE';
      else outcome = 'COCOON';
    }

    if (outcome) {
      setPhase('RESULT');
      processCaseEnd(outcome);
    } else {
      setTurns(currentTurn);
      setPhase('INTERVENTION');
    }
  };

  const processCaseEnd = (outcome) => {
    let label = {zh: '', en: ''}; let desc = {zh: '', en: ''};
    switch(outcome) {
      case 'TERMINATE':
        label = {zh: '徹底釋然 [ 療癒成功 ]', en: 'RESOLVED [ SUCCESS ]'}; 
        desc = {zh: '對象的心結已被徹底梳理，痛苦消散，成功挽救了一顆靈魂。', en: 'Core knot fully resolved. Pain dissipated. A soul successfully saved.'};
        setScoreBoard(s => ({ ...s, terminates: s.terminates + 1 })); break;
      case 'STABILIZE':
        label = {zh: '情緒平復 [ 轉入觀察 ]', en: 'CALMED [ OBSERVATION ]'}; 
        desc = {zh: '焦慮頻率已大幅降低，情況穩定。安排轉入低級別心理監護。', en: 'Anxiety frequency reduced. Stable condition. Transferred to low-level care.'};
        setScoreBoard(s => ({ ...s, stabilizes: s.stabilizes + 1 })); break;
      case 'COCOON':
        label = {zh: '深度抑鬱 [ 高危警報 ]', en: 'DEEP DEPRESSION [ WARNING ]'}; 
        desc = {zh: '干預效果不佳，對象已將自己封鎖在痛苦的繭中，隨時可能崩潰。', en: 'Intervention ineffective. Subject locked in a cocoon of pain, prone to breakdown.'};
        setScoreBoard(s => ({ ...s, cocoons: s.cocoons + 1 })); break;
      case 'COLLAPSE':
        label = {zh: '精神坍縮 [ 搶救失敗 ]', en: 'COLLAPSE [ FAILED ]'}; 
        desc = {zh: '對象的認知徹底坍縮解體。很遺憾，我們未能阻止這場悲劇。', en: 'Cognitive structure totally disintegrated. Regrettably, we failed to stop this tragedy.'};
        setScoreBoard(s => ({ ...s, collapses: s.collapses + 1 })); break;
    }
    setCurrentFeedback({ msg: { zh: `【${label.zh}】 ${desc.zh}`, en: `[ ${label.en} ] ${desc.en}` }, type: (outcome === 'TERMINATE' || outcome === 'STABILIZE') ? 'success' : 'danger' });
  };

  const nextCase = () => {
    if (currentCaseIndex + 1 < CASES.length) {
      setCurrentCaseIndex(prev => prev + 1);
      setGameState('CASE_INTRO');
    } else {
      setGameState('END');
    }
  };

  const advanceState = (state) => {
    setGameState(state);
  };

  const startJourney = (state) => {
    if(!isAudioOn) setIsAudioOn(true);
    advanceState(state);
  };

  const renderLimen9 = () => (
    <div className="w-full flex flex-col items-center justify-center p-4 lg:p-10 animate-fade-in text-center z-10 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.05)_0%,transparent_80%)] animate-[pulse_4s_ease-in-out_infinite] pointer-events-none z-0"></div>

      <div className={`relative flex-shrink-0 flex items-center justify-center perspective-1000 opacity-0 animate-[warpIn_2s_cubic-bezier(0.16,1,0.3,1)_forwards] z-10 mt-10 md:mt-0 ${isLandscape ? 'w-64 h-64 lg:w-80 lg:h-80' : 'w-48 h-48'}`}>
        <div className={`absolute inset-0 rounded-full bg-cyan-400/20 animate-pulse ${isLandscape ? 'blur-[60px]' : 'blur-[40px]'}`}></div>
        <div className={`relative rounded-full overflow-hidden bg-white shadow-[0_10px_40px_rgba(6,182,212,0.2)] flex items-center justify-center before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_30%_30%,rgba(6,182,212,0.1),transparent_60%)] border border-slate-200 ${isLandscape ? 'w-48 h-48 lg:w-64 lg:h-64' : 'w-32 h-32'}`}>
          <div className="absolute w-[300%] h-full opacity-40 animate-[planetPan_30s_linear_infinite]" style={{ backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMTAwIj48cGF0aCBkPSJNMCA1MCBRIDI1IDMwIDUwIDUwIFQgMTAwIDUwIFQgMTUwIDUwIFQgMjAwIDUwIEwgMjAwIDEwMCBMIDAgMTAwIFoiIGZpbGw9IiNlMmU4ZjAiLz48cGF0aCBkPSJNMCA3MCBRIDI1IDQwIDUwIDYwIFQgMTAwIDYwIFQgMTUwIDcwIFQgMjAwIDYwIEwgMjAwIDEwMCBMIDAgMTAwIFoiIGZpbGw9IiNmOGZhZmMiIG9wYWNpdHk9IjAuNSIvPjwvc3ZnPg==')", backgroundSize: '100px 100%' }}></div>
        </div>
        <div className={`absolute rounded-full border border-cyan-200 border-t-cyan-400/80 animate-[spin_15s_linear_infinite] ${isLandscape ? 'w-72 h-72 lg:w-96 lg:h-96' : 'w-56 h-56'}`} style={{ transform: 'rotateX(70deg)' }}></div>
        <div className={`absolute rounded-full border border-rose-200 border-b-cyan-300 border-dashed animate-[spin_25s_linear_reverse_infinite] ${isLandscape ? 'w-80 h-80 lg:w-[450px] lg:h-[450px]' : 'w-64 h-64'}`} style={{ transform: 'rotateX(70deg)' }}></div>
      </div>
      
      <div className="mt-8 flex-shrink-0 z-10 w-full max-w-4xl px-4">
        <h1 className={`font-black text-slate-800 mb-2 uppercase opacity-0 animate-[titleReveal_2.5s_cubic-bezier(0.16,1,0.3,1)_forwards_0.5s] drop-shadow-sm ${isLandscape ? 'text-6xl lg:text-7xl tracking-[0.3em]' : 'text-4xl tracking-[0.2em]'}`}>
          Limen-9
        </h1>
        <h2 className={`text-cyan-600 font-bold uppercase opacity-0 animate-[textFadeUp_1s_ease-out_forwards_1.5s] ${isLandscape ? 'text-sm lg:text-base tracking-[0.4em]' : 'text-xs tracking-[0.3em]'}`}>
          {lang === 'zh' ? '[ 心理療癒終端 · 系統簡介 ]' : '[ PSYCH-CARE TERMINAL · INTRO ]'}
        </h2>
      </div>
      
      <div className="mt-8 w-full max-w-4xl bg-white/70 p-6 md:p-10 border border-slate-200/50 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.05)] text-left space-y-6 md:space-y-8 opacity-0 animate-[textFadeUp_1.5s_ease-out_forwards_2s] z-10 relative rounded-[2rem]">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"></div>
        
        <div>
          <h3 className="text-cyan-600 font-black text-base md:text-lg mb-1 lg:mb-2 flex items-center gap-2 lg:gap-3 tracking-widest uppercase">
            <Globe2 className="w-4 h-4 lg:w-5 lg:h-5 opacity-80" /> {lang === 'zh' ? '具象化的悲傷' : 'MATERIALIZED SORROW'}
          </h3>
          <p className="text-slate-600 text-xs md:text-sm leading-relaxed tracking-wide font-sans">
            {lang === 'zh' 
              ? '在這顆星球上，悲傷與內耗不再是無形的。那些未被治癒的心理創傷會析出，化作肉眼可見的「認知絲線」，纏繞在人們周圍。' 
              : 'On this planet, sorrow is no longer invisible. Unhealed psychological traumas precipitate into visible "Cognitive Threads" that entangle people.'}
          </p>
        </div>
        <div>
          <h3 className="text-rose-500 font-black text-base md:text-lg mb-1 lg:mb-2 flex items-center gap-2 lg:gap-3 tracking-widest uppercase">
            <GitBranch className="w-4 h-4 lg:w-5 lg:h-5 opacity-80" /> {lang === 'zh' ? '抑鬱與結繭' : 'DEPRESSION & COCOONING'}
          </h3>
          <p className="text-slate-600 text-xs md:text-sm leading-relaxed tracking-wide font-sans">
            {lang === 'zh'
              ? '當人們過度自責、試圖尋找無解的答案時，絲線將瘋狂滋生、收束，化為禁錮靈魂的死繭。一旦結構閉合，個體的認知將徹底不可逆坍縮。'
              : 'When people over-blame themselves, seeking unanswerable answers, threads grow wildly. Eventually, they are trapped in a "cocoon" of their own making, leading to mental breakdown.'}
          </p>
        </div>
        <div>
          <h3 className="text-blue-500 font-black text-base md:text-lg mb-1 lg:mb-2 flex items-center gap-2 lg:gap-3 tracking-widest uppercase">
            <HeartPulse className="w-4 h-4 lg:w-5 lg:h-5 opacity-80" /> {lang === 'zh' ? '療癒中樞：你的使命' : 'HEALING CENTER: YOUR MISSION'}
          </h3>
          <p className="text-slate-600 text-xs md:text-sm leading-relaxed tracking-wide font-sans">
            {lang === 'zh'
              ? '你即將登入的，是星球上最後的心理療愈系統。作為專業的疏導員，你的任務是溫柔地梳理這些絲線，將他們從深淵的邊緣拉回。'
              : 'You are entering the planet\'s last psychological healing system. As a professional counselor, your mission is to gently untangle these threads and pull them back from the abyss.'}
          </p>
        </div>
      </div>

      <button 
        onClick={() => startJourney('EVOLUTION')}
        className={`mt-10 mb-10 z-10 flex-shrink-0 bg-gradient-to-r from-teal-400 to-cyan-500 text-white font-black uppercase shadow-[0_8px_20px_rgba(45,212,191,0.25)] hover:shadow-[0_12px_25px_rgba(34,211,238,0.4)] opacity-0 animate-[textFadeUp_1s_ease-out_forwards_3s] rounded-full hover:-translate-y-1 transition-all ${isLandscape ? 'px-12 py-5 tracking-[0.2em] text-sm' : 'px-8 py-4 tracking-[0.1em] text-xs'}`}
      >
        {lang === 'zh' ? '查看結繭演化演示' : 'VIEW EVOLUTION DEMO'}
      </button>
    </div>
  );

  const renderLogin = () => (
    <div className="w-full flex items-center justify-center p-4 lg:p-6 z-50 font-mono text-cyan-600 py-12 animate-fade-in">
      <div className="max-w-2xl w-full relative z-10 my-auto">
         <div className={`space-y-3 mb-8 uppercase font-bold text-cyan-500/80 ${isLandscape ? 'text-sm tracking-widest' : 'text-[10px] tracking-wider'}`}>
           <div className="opacity-0 animate-[fadeIn_0.5s_forwards] flex items-center gap-2"><Terminal className="w-4 h-4"/> CONNECTING TO HEALING TERMINAL...</div>
           <div className="opacity-0 animate-[fadeIn_0.5s_forwards_1s] flex items-center gap-2"><Activity className="w-4 h-4"/> BIOMETRIC SCAN IN PROGRESS... [ VERIFIED ]</div>
           <div className="opacity-0 animate-[fadeIn_0.5s_forwards_2s] flex items-center gap-2"><Cpu className="w-4 h-4"/> EMPATHY ENGINE ONLINE.</div>
           <div className="opacity-0 animate-[fadeIn_0.5s_forwards_3s] flex items-center gap-2 text-teal-500"><Database className="w-4 h-4"/> FETCHING COUNSELOR PROFILE...</div>
         </div>

         <div className={`bg-white/80 border-slate-200 opacity-0 animate-[bounceIn_0.8s_cubic-bezier(0.16,1,0.3,1)_forwards_4s] flex flex-col items-center shadow-[0_15px_50px_rgba(0,0,0,0.08)] relative font-sans rounded-2xl backdrop-blur-xl ${isLandscape ? 'p-10 border' : 'p-6 border'}`}>
           <Fingerprint className={`text-cyan-500 animate-pulse drop-shadow-sm ${isLandscape ? 'w-20 h-20 mb-6' : 'w-16 h-16 mb-4'}`} />
           <h2 className={`font-black tracking-widest text-slate-800 uppercase ${isLandscape ? 'text-3xl mb-2' : 'text-2xl mb-1'}`}>
             {lang === 'zh' ? '特級心理疏導員' : 'SENIOR COUNSELOR'}
           </h2>
           <p className={`text-cyan-600 font-bold border-b border-slate-200 w-full text-center font-mono ${isLandscape ? 'tracking-[0.5em] mb-8 pb-4 text-lg' : 'tracking-[0.3em] mb-6 pb-3 text-sm'}`}>OP-893-X</p>
           
           <div className={`text-left w-full space-y-3 text-slate-600 leading-relaxed font-bold ${isLandscape ? 'text-sm space-y-5' : 'text-xs'}`}>
             <p className="flex justify-between border-b border-slate-100 pb-2"><span className="text-slate-500 uppercase">{lang === 'zh' ? '職級:' : 'RANK:'}</span> <span className="text-slate-800">TIER 4 {lang === 'zh' ? '[ 療癒核心 ]' : '[ HEALING CORE ]'}</span></p>
             <p className="flex justify-between border-b border-slate-100 pb-2"><span className="text-slate-500 uppercase">{lang === 'zh' ? '最高指令:' : 'MISSION:'}</span> <span className="text-slate-800">{lang === 'zh' ? '治癒心靈創傷，防止認知坍縮。' : 'Heal mental trauma, prevent collapse.'}</span></p>
             <p className={`bg-rose-50/80 text-rose-600 tracking-wide border-rose-200 rounded-lg ${isLandscape ? 'mt-6 p-5 border' : 'mt-4 p-4 border'}`}>
               <span className={`font-black flex items-center gap-2 text-rose-500 uppercase ${isLandscape ? 'mb-2' : 'mb-1'}`}><AlertCircle className="w-4 h-4"/> {lang === 'zh' ? '關懷提示' : 'CARE ALERT'}</span>
               {lang === 'zh' ? '每個異常體都擁有一顆破碎的心。請時刻關注雷達數據，用最適合的手段溫柔地解開他們的心結。' : 'Every anomaly has a broken heart. Monitor radar data closely and use the most suitable methods to gently untie their knots.'}
             </p>
           </div>
         </div>

         <div className="mt-10 text-center opacity-0 animate-[fadeIn_1s_forwards_5.5s]">
           <button 
             onClick={() => startJourney('INTRO')} 
             className={`bg-cyan-600 text-white font-black uppercase hover:bg-cyan-500 transition-all shadow-[0_8px_20px_rgba(6,182,212,0.3)] hover:-translate-y-1 rounded-full w-full sm:w-auto ${isLandscape ? 'px-12 py-5 tracking-[0.2em] text-sm' : 'px-8 py-4 tracking-[0.1em] text-xs'}`}
           >
             {lang === 'zh' ? '接受任命 · 進入療癒大廳' : 'ACCEPT DUTY · ENTER HALL'}
           </button>
         </div>
      </div>
    </div>
  );

  const renderIntro = () => (
    <div className="w-full flex flex-col items-center justify-center p-4 lg:p-10 animate-fade-in text-slate-800 py-12">
      
      <div className="w-full max-w-5xl bg-white/80 border border-slate-200 shadow-[0_20px_60px_rgba(0,0,0,0.05)] rounded-[3rem] flex flex-col overflow-hidden relative backdrop-blur-xl">
        <div className="bg-cyan-50/80 border-b border-cyan-100 p-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Sparkle className="w-4 h-4 text-cyan-500" />
            <span className="text-cyan-600 text-[10px] md:text-xs font-mono tracking-widest uppercase">LIMEN-9 // HEALING PROTOCOL_READING</span>
          </div>
          <div className="flex gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-200 border border-rose-300"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-slate-200 border border-amber-300"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-slate-200 border border-cyan-300"></div>
          </div>
        </div>

        <div className={`p-6 lg:p-10 flex ${isLandscape ? 'flex-row' : 'flex-col'} gap-6 lg:gap-10 relative`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(148,163,184,0.1)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none"></div>

          <div className={`flex flex-col items-center justify-center border border-slate-200 bg-slate-50/50 rounded-[2rem] p-8 relative overflow-hidden shadow-sm ${isLandscape ? 'w-1/3' : 'w-full'}`}>
             <div className="absolute inset-0 bg-teal-500/5 animate-pulse"></div>
             <HeartPulse className="w-16 h-16 md:w-20 md:h-20 text-rose-400 mb-6 drop-shadow-sm" />
             <h2 className="text-base md:text-lg font-black text-slate-800 tracking-widest uppercase mb-2">{lang === 'zh' ? '最高關懷級別' : 'MAX CARE LEVEL'}</h2>
             <p className="text-rose-500 font-mono text-[10px] md:text-xs tracking-[0.2em] mb-6">[ CLEARANCE: TIER 4 ]</p>
             <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-slate-300 to-transparent mb-6"></div>
             <div className="text-center space-y-2 font-mono text-[10px] text-slate-500">
               <p>SYS_VER: 9.4.2_HEAL</p>
               <p>AUTHORIZATION: OP-893-X</p>
               <p className="text-teal-500 animate-pulse mt-2">STATUS: STANDBY</p>
             </div>
          </div>

          <div className={`flex flex-col gap-4 lg:gap-5 relative z-10 ${isLandscape ? 'w-2/3' : 'w-full'}`}>
             <div className="flex items-center gap-3 mb-2">
               <Activity className="w-5 h-5 text-teal-500" />
               <h3 className="text-lg md:text-xl font-black text-slate-800 tracking-[0.2em] uppercase">{lang === 'zh' ? '療癒核心守則' : 'CORE GUIDELINES'}</h3>
             </div>

             <div className="bg-white/60 border-l-4 border-cyan-400 p-4 lg:p-5 rounded-r-xl hover:bg-slate-50 transition-all group shadow-sm border border-slate-100">
                <h4 className="text-sm md:text-base font-bold text-cyan-600 mb-2 tracking-widest flex items-center justify-between">
                  {lang === 'zh' ? '1. 溫柔梳理' : '1. GENTLE COMBING'} <span className="text-[9px] md:text-[10px] font-mono text-cyan-400 group-hover:text-cyan-500">[ COMBING ]</span>
                </h4>
                <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                  {lang === 'zh' ? '當目標陷入焦慮時，絲線會不受控地生長。你的首要任務是安撫他們的情緒，通過合適的干預手段讓絲線重新變得柔軟。' : 'When targets panic, threads grow out of control. Your priority is to soothe them and soften the threads using appropriate methods.'}
                </p>
             </div>

             <div className="bg-white/60 border-l-4 border-amber-400 p-4 lg:p-5 rounded-r-xl hover:bg-slate-50 transition-all group shadow-sm border border-slate-100">
                <h4 className="text-sm md:text-base font-bold text-amber-500 mb-2 tracking-widest flex items-center justify-between">
                  {lang === 'zh' ? '2. 對症下藥' : '2. TARGETED CARE'} <span className="text-[9px] md:text-[10px] font-mono text-amber-400 group-hover:text-amber-500">[ EMPATHY ]</span>
                </h4>
                <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                  {lang === 'zh' ? '每種心理創傷都需要不同的應對方式。請藉助 AI 解析目標的執念類型，給予最貼心的疏導。' : 'Every trauma requires a different approach. Use AI to analyze the obsession type and provide the most considerate guidance.'}
                </p>
             </div>

             <div className="bg-white/60 border-l-4 border-rose-400 p-4 lg:p-5 rounded-r-xl hover:bg-slate-50 transition-all group shadow-sm border border-slate-100">
                <h4 className="text-sm md:text-base font-bold text-rose-500 mb-2 tracking-widest flex items-center justify-between">
                  {lang === 'zh' ? '3. 挽救邊緣' : '3. PULL FROM BRINK'} <span className="text-[9px] md:text-[10px] font-mono text-rose-400 group-hover:text-rose-500">[ RESCUE ]</span>
                </h4>
                <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                  {lang === 'zh' ? '如果目標接近崩潰（結繭度極高），請不要猶豫，使用強效手段將他們從深淵拉回。' : 'If a target is near collapse (high cocooning), do not hesitate. Use strong methods to pull them back from the abyss.'}
                </p>
             </div>
          </div>
        </div>

        <div className="bg-slate-50 border-t border-slate-200 p-4 lg:p-6 flex justify-center lg:justify-end items-center rounded-b-[2.5rem]">
           <button
              onClick={() => advanceState('CASE_INTRO')}
              className="px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-teal-400 to-cyan-500 hover:brightness-105 text-white font-black uppercase tracking-[0.2em] shadow-[0_8px_15px_rgba(6,182,212,0.3)] hover:shadow-[0_12px_25px_rgba(34,211,238,0.4)] transition-all flex items-center justify-center gap-3 rounded-full w-full md:w-auto text-xs md:text-sm hover:-translate-y-0.5"
           >
              {lang === 'zh' ? '[ 確認守則 · 準備接診 ]' : '[ PROTOCOL CONFIRMED · RECEIVE PATIENT ]'} <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
           </button>
        </div>
      </div>
    </div>
  );

  const renderCaseIntro = () => (
    <div className="w-full flex flex-col items-center justify-center p-4 lg:p-10 animate-fade-in py-12">
      <div className={`bg-white/90 backdrop-blur-xl border border-slate-200 w-full max-w-5xl relative overflow-hidden flex items-center shadow-[0_20px_60px_rgba(0,0,0,0.05)] rounded-[2.5rem] ${isLandscape ? 'p-12 flex-row gap-10' : 'p-6 flex-col gap-6'}`}>
        
        <div className={`border-slate-200 flex-shrink-0 relative overflow-hidden bg-slate-50 shadow-[0_10px_30px_rgba(0,0,0,0.05)] flex items-center justify-center group rounded-[2rem] ${isLandscape ? 'w-64 h-64 border-[6px]' : 'w-40 h-40 border-4'}`}>
          <div className={`absolute inset-0 border-teal-500/20 group-hover:border-teal-400/50 transition-colors z-20 rounded-[2rem] ${isLandscape ? 'border-4' : 'border-2'}`}></div>
          
          {isPreloading ? (
             <div className="flex flex-col items-center text-teal-500 z-10">
                <Activity className="w-6 h-6 lg:w-8 lg:h-8 animate-pulse mb-2" />
                <span className="text-[10px] font-bold tracking-widest uppercase font-mono">Loading...</span>
             </div>
          ) : currentCaseImage ? (
             <>
               <img src={currentCaseImage} alt="Profile" className="w-full h-full object-cover animate-fade-in z-0" />
               <div className="absolute inset-0 bg-teal-900/5 mix-blend-overlay z-10"></div>
             </>
          ) : (
             <User className="w-12 h-12 lg:w-16 lg:h-16 text-slate-300 z-10" />
          )}
        </div>

        <div className={`flex-grow relative z-10 w-full ${isLandscape ? 'text-left' : 'text-center'}`}>
          <div className={`inline-flex items-center gap-2 px-3 py-1 lg:px-4 lg:py-1.5 bg-teal-50 text-teal-600 text-[10px] lg:text-xs font-bold tracking-widest mb-4 rounded-full uppercase shadow-sm`}>
             <BookOpen className={isLandscape ? 'w-4 h-4' : 'w-3 h-3'}/> {lang === 'zh' ? '關懷對象檔案' : 'PATIENT PROFILE'}
          </div>
          <h2 className={`font-black text-slate-800 uppercase drop-shadow-sm ${isLandscape ? 'text-4xl tracking-[0.1em] mb-6' : 'text-2xl tracking-[0.05em] mb-4'}`}>{currentCase.name[lang]}</h2>
          
          <div className={`grid gap-3 mb-6 w-full text-left ${isLandscape ? 'grid-cols-2 max-w-none' : 'grid-cols-2 max-w-sm mx-auto'}`}>
            <div className="bg-slate-50 p-3 border-l-4 border-teal-400 rounded-r-xl shadow-sm">
               <span className="block text-[9px] lg:text-[10px] text-slate-400 font-mono mb-1 uppercase">{lang === 'zh' ? '年齡' : 'AGE'}</span>
               <p className="text-sm lg:text-base text-slate-700 font-bold">{currentCase.age}</p>
            </div>
            <div className="bg-slate-50 p-3 border-l-4 border-teal-400 rounded-r-xl shadow-sm">
               <span className="block text-[9px] lg:text-[10px] text-slate-400 font-mono mb-1 uppercase">{lang === 'zh' ? '出身' : 'ORIGIN'}</span>
               <p className="text-sm lg:text-base text-slate-700 font-bold truncate">{currentCase.origin[lang]}</p>
            </div>
            <div className="bg-slate-50 p-3 border-l-4 border-teal-400 col-span-2 rounded-r-xl shadow-sm">
               <span className="block text-[9px] lg:text-[10px] text-slate-400 font-mono mb-1 uppercase">{lang === 'zh' ? '家庭背景' : 'FAMILY BACKGROUND'}</span>
               <p className="text-sm lg:text-base text-slate-700 font-bold truncate">{currentCase.family[lang]}</p>
            </div>
          </div>

          <p className={`text-slate-600 leading-relaxed bg-white border border-slate-100 shadow-sm rounded-xl text-left whitespace-pre-line ${isLandscape ? 'text-sm p-5 mb-8' : 'text-xs p-4 mb-6'}`}>
            {currentCase.profile[lang]}
          </p>
          
          <button 
            onClick={() => advanceState('CASE')}
            className={`bg-gradient-to-r from-teal-400 to-cyan-500 text-white font-bold shadow-[0_8px_20px_rgba(45,212,191,0.2)] hover:shadow-[0_12px_30px_rgba(34,211,238,0.3)] hover:brightness-105 hover:-translate-y-1 transition-all flex items-center justify-center rounded-full w-full uppercase ${isLandscape ? 'md:w-auto px-10 py-4 gap-3 tracking-[0.2em] text-sm' : 'px-8 py-4 gap-3 tracking-[0.1em] text-xs'}`}
          >
            {lang === 'zh' ? '開始溫柔對話' : 'INITIATE GENTLE DIALOGUE'} <Heart className={isLandscape ? 'w-5 h-5' : 'w-4 h-4'} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderCase = () => (
    <div className={`absolute inset-0 flex flex-col p-2 lg:p-6 animate-fade-in text-slate-800 z-10 custom-scrollbar ${isLandscape ? 'overflow-hidden' : 'overflow-y-auto'}`}>
      
      {transitionPhase === 'INITIATING' && (
         <div className="fixed inset-0 z-[110] bg-teal-50 mix-blend-overlay pointer-events-none animate-[neuralFlash_0.8s_ease-in-out_forwards]"></div>
      )}

      {/* 頂部固定欄 */}
      <div className={`flex-shrink-0 flex justify-between items-center gap-2 bg-white/80 border border-slate-200 backdrop-blur-xl rounded-2xl shadow-sm ${isLandscape ? 'flex-row p-3 lg:p-4 mb-4' : 'flex-col sm:flex-row p-3 mb-3'}`}>
        <div className="flex items-center gap-3 lg:gap-5 w-full sm:w-auto pl-1 lg:pl-2">
          <div className="w-10 h-10 lg:w-14 lg:h-14 border-2 border-white bg-slate-100 flex-shrink-0 relative overflow-hidden rounded-lg lg:rounded-xl shadow-sm">
             {currentCaseImage ? <img src={currentCaseImage} alt="Avatar" className="w-full h-full object-cover" /> : <User className="w-6 h-6 lg:w-8 lg:h-8 text-slate-400 m-auto mt-2 lg:mt-3" />}
          </div>
          <div>
            <h2 className="text-lg lg:text-2xl font-black text-slate-800 tracking-widest uppercase">{currentCase.name[lang]}</h2>
            <p className="text-[9px] lg:text-xs text-cyan-600 font-mono mt-0.5 lg:mt-1 tracking-[0.1em] lg:tracking-[0.2em] animate-pulse">[{lang === 'zh' ? ' 檔案解讀中 ' : ' READING '}] // {currentCaseIndex + 1} / {CASES.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 lg:gap-4 bg-slate-50 px-3 py-2 lg:px-5 lg:py-3 border border-slate-200 shadow-inner rounded-xl w-full sm:w-auto justify-between sm:justify-start">
          <span className="text-[10px] font-bold text-slate-500 tracking-[0.1em] uppercase">{lang === 'zh' ? '剩餘療癒次數:' : 'REMAINING TURNS:'}</span>
          <div className="flex gap-1 lg:gap-1.5">
            {[...Array(MAX_TURNS)].map((_, i) => (
               <div key={i} className={`h-3 w-5 lg:h-4 lg:w-10 border rounded-sm ${i < turns ? 'bg-teal-400 border-teal-300 shadow-sm' : 'bg-slate-200 border-slate-300'} transition-all skew-x-[-15deg]`}></div>
            ))}
          </div>
        </div>
      </div>

      <div className={`flex-grow grid w-full max-w-full ${isLandscape ? 'grid-cols-12 gap-5 min-h-0' : 'grid-cols-1 gap-4'}`}>
        
        {/* 左半側：交互控制區 */}
        <div className={`flex flex-col ${isLandscape ? 'col-span-7 gap-5 min-h-0 h-full' : 'col-span-1 gap-4 h-auto'}`}>
          
          <div className={`bg-white/80 p-4 lg:p-6 rounded-2xl border border-slate-200 relative group flex flex-col backdrop-blur-xl shadow-sm ${isLandscape ? 'min-h-0 flex-shrink flex-grow' : 'min-h-[180px]'}`}>
            <div className="absolute top-0 left-0 w-1 lg:w-1.5 h-full bg-teal-300 rounded-l-2xl"></div>
            <div className="flex items-center justify-between mb-3 lg:mb-4 border-b border-slate-100 pb-2 lg:pb-3 flex-shrink-0">
              <div className="flex items-center gap-2 lg:gap-3">
                <BookOpen className="w-4 h-4 lg:w-5 lg:h-5 text-teal-500" />
                <h3 className="text-xs lg:text-sm font-bold text-slate-700 tracking-widest uppercase">{lang === 'zh' ? '傾聽：殘餘記憶日誌' : 'TRACE LOGS DECRYPTED'}</h3>
              </div>
            </div>
            
            <div className={`flex-grow pr-2 relative z-10 ${isLandscape ? 'overflow-y-auto custom-scrollbar min-h-0' : ''}`}>
              <p className="text-slate-600 leading-relaxed lg:leading-[2.0] text-sm lg:text-base font-sans tracking-wide whitespace-pre-line">
                {currentCase.text[lang]}
              </p>
            </div>
            <div className="mt-3 lg:mt-4 pt-3 lg:pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-2 lg:gap-3 text-[10px] lg:text-xs text-slate-400 font-mono flex-shrink-0">
               <span className="tracking-widest uppercase text-slate-400">{lang === 'zh' ? '[ 創傷觸發點 ]:' : '[ SOURCE TRIGGER ]: '}</span>
               <span className="bg-slate-50 border border-slate-200 px-3 py-1.5 text-slate-700 font-bold tracking-widest rounded-md break-words shadow-sm">{currentCase.trigger[lang]}</span>
            </div>
          </div>

          {currentFeedback && (
            <div className={`p-4 lg:p-5 border flex items-center gap-3 lg:gap-4 animate-slide-in shadow-md relative overflow-hidden flex-shrink-0 rounded-2xl ${
              currentFeedback.type === 'success' ? 'bg-teal-50 border-teal-200 text-teal-800' :
              currentFeedback.type === 'danger' ? 'bg-rose-50 border-rose-200 text-rose-800' :
              'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              {currentFeedback.type === 'danger' && <AlertCircle className="w-5 h-5 lg:w-6 lg:h-6 flex-shrink-0 animate-pulse text-rose-500" />}
              {currentFeedback.type === 'success' && <Check className="w-5 h-5 lg:w-6 lg:h-6 flex-shrink-0 text-teal-500" />}
              {currentFeedback.type === 'warning' && <AlertCircle className="w-5 h-5 lg:w-6 lg:h-6 flex-shrink-0 text-amber-500" />}
              <span className="text-sm lg:text-base font-bold leading-relaxed tracking-wide relative z-10">
                {currentFeedback.msg[lang]}
              </span>
            </div>
          )}

          <div className={`bg-white/80 p-4 lg:p-6 border border-slate-200 relative rounded-2xl overflow-hidden backdrop-blur-xl shadow-sm ${isLandscape ? 'flex-shrink-0' : ''}`}>
             {(phase === 'PROCESSING' || phase === 'RESULT') && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-md z-20 border border-slate-200 rounded-2xl"></div>
             )}

             {phase === 'DIAGNOSIS' && (
              <div className="animate-fade-in relative z-10">
                 <h4 className="text-sm lg:text-base font-bold text-cyan-600 mb-4 flex items-center gap-2 lg:gap-3 tracking-widest uppercase">
                   <span className="bg-cyan-100 text-cyan-600 w-6 h-6 lg:w-7 lg:h-7 flex items-center justify-center text-xs rounded-md font-black">01</span> 
                   {lang === 'zh' ? '分析對象的心理執念' : 'CLASSIFY OBSESSION TYPE'}
                 </h4>
                 <div className="flex flex-col gap-2">
                    {Object.values(CASE_TYPES).map(type => (
                      <button
                        key={type.id}
                        onClick={() => handleDiagnosis(type.id)}
                        className="flex items-center gap-3 lg:gap-5 p-3 border border-slate-200 bg-white hover:bg-slate-50 hover:border-cyan-400 hover:shadow-md transition-all text-left group relative overflow-hidden rounded-xl"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-200 group-hover:bg-cyan-400 transition-colors"></div>
                        <div className="p-2 lg:p-2.5 border border-slate-100 bg-slate-50 group-hover:border-cyan-200 transition-colors shadow-sm rounded-lg flex-shrink-0">
                          {type.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 text-sm lg:text-base mb-0.5 tracking-widest truncate group-hover:text-cyan-700 transition-colors">{type.name[lang]}</div>
                          <div className="text-[10px] lg:text-xs text-slate-500 leading-relaxed tracking-wide hidden sm:block">{type.desc[lang]}</div>
                        </div>
                      </button>
                    ))}
                 </div>
                 
                 <div className="mt-4 lg:mt-5 border-t border-slate-100 pt-4 lg:pt-5">
                   {!aiHint && !isGeneratingHint && (
                     <button onClick={generateAiHint} className="w-full py-3 bg-slate-50 border border-slate-200 text-slate-500 hover:text-cyan-600 hover:border-cyan-300 hover:bg-white transition-all font-mono text-[10px] lg:text-xs tracking-[0.2em] flex items-center justify-center gap-2 group rounded-xl uppercase font-bold shadow-sm">
                       <Stethoscope className="w-4 h-4 group-hover:text-cyan-500" />
                       {lang === 'zh' ? '[ 請求醫療 AI 解析 ]' : '[ REQUEST MED-AI ANALYSIS ]'}
                     </button>
                   )}
                   {isGeneratingHint && (
                     <div className="w-full py-3 bg-cyan-50 border border-cyan-100 text-cyan-600 font-mono text-[10px] lg:text-xs tracking-[0.2em] flex items-center justify-center gap-2 animate-pulse rounded-xl font-bold">
                       <Activity className="w-4 h-4 animate-spin" />
                       ANALYZING TRACE LOGS...
                     </div>
                   )}
                   {aiHint && (
                     <div className={`w-full p-4 bg-white border-l-4 font-mono text-[10px] md:text-xs leading-relaxed tracking-wider rounded-r-xl shadow-sm font-bold ${aiHint[lang].includes('錯誤') || aiHint[lang].includes('WARNING') ? 'border-rose-400 text-rose-600' : 'border-cyan-400 text-cyan-700'}`}>
                       {aiHint[lang]}
                     </div>
                   )}
                 </div>
              </div>
             )}

             {phase === 'INTERVENTION' && (
              <div className="animate-fade-in relative z-10">
                 <h4 className="text-sm lg:text-base font-bold text-teal-600 mb-4 flex items-center gap-2 lg:gap-3 tracking-widest uppercase">
                   <span className="bg-teal-100 text-teal-600 w-6 h-6 lg:w-7 lg:h-7 flex items-center justify-center text-xs rounded-lg font-black">02</span> 
                   {lang === 'zh' ? '選擇溫和的疏導手段' : 'EXECUTE HEALING PROCESS'}
                 </h4>
                 <div className={`grid gap-2 lg:gap-3 ${isLandscape ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {INTERVENTIONS.map(inv => (
                      <button
                        key={inv.id}
                        onClick={() => executeIntervention(inv)}
                        className={`text-left p-3 lg:p-4 border transition-all relative overflow-hidden group flex flex-col justify-center bg-white hover:shadow-md rounded-2xl h-full ${inv.id === 'ACCEPT' || inv.id === 'RESTRICT' ? 'border-rose-100 hover:border-rose-300' : 'border-teal-100 hover:border-teal-300'}`}
                      >
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 opacity-50 transition-colors ${inv.id === 'ACCEPT' || inv.id === 'RESTRICT' ? 'bg-rose-200 group-hover:bg-rose-400' : 'bg-teal-200 group-hover:bg-teal-400'}`}></div>
                        
                        <div className="relative z-10 flex flex-col justify-center h-full w-full pl-2">
                          <div className="font-bold text-slate-700 group-hover:text-slate-900 text-sm lg:text-base mb-1 tracking-widest flex items-center justify-between gap-2 transition-colors uppercase">
                            <span className="truncate">{inv.name[lang]}</span>
                            <span className={`text-[8px] lg:text-[9px] font-mono px-1.5 py-0.5 border rounded-md whitespace-nowrap flex-shrink-0 ${inv.id === 'ACCEPT' || inv.id === 'RESTRICT' ? 'border-rose-200 text-rose-500 bg-rose-50' : 'border-teal-200 text-teal-600 bg-teal-50'}`}>{inv.tag[lang]}</span>
                          </div>
                          <div className="text-[10px] lg:text-xs text-slate-500 leading-relaxed hidden sm:block">{inv.desc[lang]}</div>
                        </div>
                      </button>
                    ))}
                 </div>
                 
                 <div className="mt-4 lg:mt-5 border-t border-slate-100 pt-4 lg:pt-5">
                   {!aiHint && !isGeneratingHint && (
                     <button onClick={generateAiHint} className="w-full py-3 bg-white border border-slate-200 text-slate-500 hover:text-teal-600 hover:border-teal-300 hover:shadow-sm transition-all font-mono text-[10px] lg:text-xs tracking-[0.2em] flex items-center justify-center gap-2 group rounded-xl uppercase font-bold shadow-sm">
                       <HeartPulse className="w-4 h-4 group-hover:text-teal-500" />
                       {lang === 'zh' ? '[ 請求療癒方案建議 ]' : '[ REQUEST THERAPY CALC ]'}
                     </button>
                   )}
                   {isGeneratingHint && (
                     <div className="w-full py-3 bg-teal-50 border border-teal-100 text-teal-600 font-mono text-[10px] lg:text-xs tracking-[0.2em] flex items-center justify-center gap-2 animate-pulse rounded-xl font-bold">
                       <Activity className="w-4 h-4 animate-spin" />
                       ANALYZING THERAPY OPTIONS...
                     </div>
                   )}
                   {aiHint && (
                     <div className={`w-full p-4 bg-white border-l-4 font-mono text-[10px] md:text-xs leading-relaxed tracking-wider rounded-r-xl shadow-sm font-bold ${aiHint[lang].includes('錯誤') || aiHint[lang].includes('WARNING') ? 'border-rose-400 text-rose-600' : 'border-teal-400 text-teal-700'}`}>
                       {aiHint[lang]}
                     </div>
                   )}
                 </div>
              </div>
             )}

             {phase === 'RESULT' && (
               <div className="animate-fade-in flex flex-col items-center justify-center py-6 lg:py-10 z-30 relative">
                 <button
                    onClick={nextCase}
                    className="w-full max-w-sm py-4 lg:py-5 bg-gradient-to-r from-teal-400 to-cyan-500 hover:brightness-105 text-white font-black shadow-[0_8px_20px_rgba(45,212,191,0.3)] hover:shadow-[0_12px_25px_rgba(34,211,238,0.4)] hover:-translate-y-1 transition-all flex justify-center items-center gap-2 lg:gap-3 text-sm lg:text-base animate-bounce-in tracking-[0.2em] rounded-full uppercase"
                 >
                    {lang === 'zh' ? '[ 更新檔案 · 接待下一位 ]' : '[ LOG SAVED · NEXT PATIENT ]'} <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5" />
                 </button>
               </div>
             )}
          </div>
        </div>

        {/* 右半側：監控 */}
        <div className={`flex flex-col ${isLandscape ? 'col-span-5 min-h-0 h-full' : 'col-span-1 h-auto pb-6'}`}>
          <div className={`bg-white/80 p-4 lg:p-6 border border-slate-200 flex flex-col h-full shadow-sm rounded-2xl backdrop-blur-xl ${isLandscape ? 'min-h-[400px]' : 'h-auto'}`}>
            <div className="flex items-center justify-between mb-4 lg:mb-5 border-b border-slate-100 pb-2 lg:pb-3 flex-shrink-0">
              <h3 className="text-xs lg:text-sm font-bold text-slate-600 tracking-widest flex items-center gap-2 uppercase">
                <Activity className="w-4 h-4 lg:w-5 lg:h-5 text-teal-500" /> {lang === 'zh' ? '情緒波動監控雷達' : 'EMOTION RADAR'}
              </h3>
              {diagnosis && <span className="text-[8px] lg:text-[9px] font-bold px-2.5 py-1 bg-teal-50 text-teal-700 tracking-widest rounded-md uppercase border border-teal-100">{CASE_TYPES[diagnosis].name[lang]}</span>}
            </div>
            
            <div className={`flex flex-col relative mb-4 lg:mb-6 ${isLandscape ? 'flex-grow min-h-[150px]' : 'h-[300px]'}`}>
              <ThreadCocoonVisualizer stats={stats} imageUrl={currentCaseImage} isLandscape={isLandscape} isTransitioning={transitionPhase === 'INITIATING'} />
            </div>

            <div className="space-y-2 lg:space-y-4 flex-shrink-0 px-2">
              <TacticalProgressBar label={lang === 'zh' ? "焦慮絲線密度" : "ANXIETY THREADS"} value={stats.density} description="THREAT: TENSION BURST" isLandscape={isLandscape} />
              <TacticalProgressBar label={lang === 'zh' ? "回想與內耗頻率" : "OVERTHINKING FREQ"} value={stats.frequency} description="THREAT: PULSE RATE" isLandscape={isLandscape} />
              <TacticalProgressBar label={lang === 'zh' ? "自我否定程度" : "SELF-DENIAL"} value={stats.dependency} description="THREAT: LOGIC LOOP" isLandscape={isLandscape} />
              <div className="pt-3 lg:pt-4 border-t border-slate-100 mt-2">
                 <TacticalProgressBar label={lang === 'zh' ? "抑鬱結繭危險值" : "DEPRESSION COCOONING"} value={stats.closure} description="CRITICAL: COLLAPSE PROBABILITY" isLandscape={isLandscape} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEnd = () => {
    const totalHelped = scoreBoard.terminates + scoreBoard.stabilizes;
    const ratio = totalHelped / CASES.length;
    
    let title = ""; let desc = ""; let icon = null;
    if (ratio >= 0.7) {
      title = lang === 'zh' ? "首席心理療癒師" : "CHIEF HEALER";
      desc = lang === 'zh' ? "你溫柔且精準地解開了病患的心結，為這顆星球留住了寶貴的溫度與光芒。" : "You gently and precisely untied the patients' knots, preserving precious warmth and light on this planet.";
      icon = <HeartPulse className="w-16 h-16 lg:w-24 lg:h-24 text-teal-500 mx-auto mb-4 lg:mb-6 drop-shadow-md" />;
    } else if (ratio >= 0.4) {
      title = lang === 'zh' ? "合格的疏導員" : "QUALIFIED COUNSELOR";
      desc = lang === 'zh' ? "勉強及格。部分病患因疏導不當而崩潰，這是我們都不願見到的代價。" : "Passable. Some patients collapsed due to improper guidance, a price we hate to see.";
      icon = <Activity className="w-16 h-16 lg:w-24 lg:h-24 text-amber-500 mx-auto mb-4 lg:mb-6 drop-shadow-md" />;
    } else {
      title = lang === 'zh' ? "失職的干預者" : "ROGUE ELEMENT";
      desc = lang === 'zh' ? "極度危險的失職！你過度的干預引發了大規模的情緒崩潰，請深刻反省。" : "Critical failure! Excessive intervention caused massive emotional collapse. Reflect on your actions.";
      icon = <ShieldAlert className="w-16 h-16 lg:w-24 lg:h-24 text-rose-500 mx-auto mb-4 lg:mb-6 drop-shadow-md animate-pulse" />;
    }

    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 lg:p-10 animate-fade-in text-slate-800 overflow-y-auto custom-scrollbar z-10">
        <div className="bg-white/90 p-6 lg:p-14 border border-slate-200 w-full max-w-4xl relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.05)] rounded-[3rem] my-auto backdrop-blur-2xl">
          
          <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:30px_30px]"></div>

          <div className="relative z-10 text-center">
            {icon}
            <h1 className="text-3xl lg:text-5xl font-black text-slate-800 mb-2 lg:mb-4 tracking-[0.1em] lg:tracking-[0.2em] uppercase">{lang === 'zh' ? '療癒週期終了' : 'ARCHIVE COMPLETED'}</h1>
            <p className="text-slate-400 mb-8 lg:mb-12 text-xs lg:text-sm font-mono tracking-widest">[ SYSTEM_ARCHIVE_COMPLETED ]</p>
            
            <div className="bg-slate-50/80 p-5 lg:p-8 text-left mb-8 lg:mb-12 border border-slate-200 relative rounded-2xl shadow-sm">
              <h3 className="text-xs lg:text-sm font-black text-cyan-600 mb-6 lg:mb-8 tracking-[0.1em] lg:tracking-[0.2em] text-center border-b border-slate-200 pb-3 lg:pb-4 uppercase">{lang === 'zh' ? '工作全局統計報告' : 'GLOBAL SYSTEM METRICS'}</h3>
              <div className="grid grid-cols-2 gap-y-6 lg:gap-y-10 gap-x-4 lg:gap-x-8 px-2 sm:px-10">
                <div className="flex flex-col gap-1 lg:gap-2"><span className="text-slate-500 font-bold text-[10px] lg:text-xs tracking-widest uppercase">{lang === 'zh' ? '徹底釋然 [ 療癒成功 ]' : 'RESOLVED [ SECURED ]'}</span><span className="font-black text-slate-800 text-2xl lg:text-4xl font-mono">{scoreBoard.terminates}</span></div>
                <div className="flex flex-col gap-1 lg:gap-2"><span className="text-slate-500 font-bold text-[10px] lg:text-xs tracking-widest uppercase">{lang === 'zh' ? '情緒平復 [ 轉入觀察 ]' : 'CALMED [ OBSERVATION ]'}</span><span className="font-black text-slate-800 text-2xl lg:text-4xl font-mono">{scoreBoard.stabilizes}</span></div>
                <div className="flex flex-col gap-1 lg:gap-2"><span className="text-amber-500 font-bold text-[10px] lg:text-xs tracking-widest uppercase">{lang === 'zh' ? '深度抑鬱 [ 高危警報 ]' : 'DEPRESSION [ WARNING ]'}</span><span className="font-black text-amber-500 text-2xl lg:text-4xl font-mono drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]">{scoreBoard.cocoons}</span></div>
                <div className="flex flex-col gap-1 lg:gap-2"><span className="text-rose-500 font-bold text-[10px] lg:text-xs tracking-widest uppercase">{lang === 'zh' ? '精神坍縮 [ 搶救失敗 ]' : 'COLLAPSE [ FAILED ]'}</span><span className="font-black text-rose-500 text-2xl lg:text-4xl font-mono drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]">{scoreBoard.collapses}</span></div>
              </div>
            </div>

            <div className="text-center relative">
              <h3 className="text-cyan-600 font-black text-xl lg:text-3xl mb-3 lg:mb-4 tracking-widest uppercase">{title}</h3>
              <p className="text-slate-600 leading-relaxed text-xs lg:text-sm tracking-wide max-w-2xl mx-auto px-4">{desc}</p>
            </div>
            
            <button onClick={() => window.location.reload()} className="mt-8 lg:mt-12 px-8 py-3.5 lg:px-12 lg:py-4 bg-cyan-600 text-white hover:bg-cyan-500 hover:-translate-y-1 transition-all font-black tracking-[0.2em] rounded-full text-xs lg:text-sm w-full sm:w-auto shadow-[0_8px_20px_rgba(6,182,212,0.3)] uppercase">
              {lang === 'zh' ? '重啟療癒終端' : 'REBOOT TERMINAL'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const lockScroll = isLandscape && gameState === 'CASE';

  return (
    <div className={`h-screen w-full bg-slate-50 text-slate-800 font-sans selection:bg-cyan-200 selection:text-slate-900 flex flex-col relative ${lockScroll ? 'overflow-hidden' : 'overflow-x-hidden overflow-y-auto custom-scrollbar'}`}>
      
      {/* 夢幻環境光效背景與治癒粒子 */}
      <AmbientBackground />
      <HealingParticles />

      {(gameState !== 'LIMEN9' && gameState !== 'LOGIN') && (
        <header className="h-12 lg:h-16 bg-white/60 border-b border-white/80 flex items-center px-4 lg:px-8 justify-between flex-shrink-0 z-40 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative w-full backdrop-blur-2xl">
          <div className="flex items-center gap-2 lg:gap-3 text-cyan-600 font-black tracking-wider lg:tracking-[0.1em] text-xs lg:text-sm">
            <HeartPulse className="w-4 h-4 lg:w-5 lg:h-5 opacity-80" /><span>HEALING_CENTER</span>
          </div>
          <div className="flex items-center gap-2 lg:gap-6">
            
            <button 
              onClick={() => setIsAudioOn(!isAudioOn)} 
              className="flex items-center gap-1.5 text-[9px] lg:text-[10px] text-slate-500 hover:text-cyan-600 transition-colors font-bold tracking-widest uppercase bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm relative z-50 cursor-pointer hover:shadow-md hover:-translate-y-0.5"
            >
              {isAudioOn ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
              <span className="hidden sm:inline">{isAudioOn ? 'BGM: ON' : 'BGM: OFF'}</span>
            </button>

            <button 
              onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} 
              className="flex items-center gap-1.5 text-[9px] lg:text-[10px] text-slate-500 hover:text-cyan-600 transition-colors font-bold tracking-widest uppercase bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm relative z-50 cursor-pointer hover:shadow-md hover:-translate-y-0.5"
            >
              <Languages className="w-3 h-3" />
              <span className="hidden sm:inline">{lang === 'zh' ? 'ZH / EN' : 'EN / ZH'}</span>
            </button>
            <button 
              onClick={() => setIsLandscape(!isLandscape)} 
              className="flex items-center gap-1.5 text-[9px] lg:text-[10px] text-slate-500 hover:text-cyan-600 transition-colors font-bold tracking-widest uppercase bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm relative z-50 cursor-pointer hover:shadow-md hover:-translate-y-0.5"
            >
              {isLandscape ? <Monitor className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
              <span className="hidden sm:inline">{isLandscape ? 'DESKTOP' : 'MOBILE'}</span>
            </button>
            <div className="text-[8px] lg:text-[10px] text-slate-400 font-bold tracking-widest font-mono hidden md:block">
              OP-893-X
            </div>
          </div>
        </header>
      )}

      <main className={`flex-grow w-full relative z-10 flex flex-col ${lockScroll ? 'overflow-hidden' : ''}`}>
        {gameState === 'LIMEN9' && renderLimen9()}
        {gameState === 'EVOLUTION' && <CocoonEvolutionPage onNext={() => startJourney('LOGIN')} isLandscape={isLandscape} lang={lang}/>}
        {gameState === 'LOGIN' && renderLogin()}
        {gameState === 'INTRO' && renderIntro()}
        {gameState === 'CASE_INTRO' && renderCaseIntro()}
        {gameState === 'CASE' && renderCase()}
        {gameState === 'END' && renderEnd()}
      </main>

      {phase === 'PROCESSING' && gameState === 'CASE' && <PurifyOverlay isLandscape={isLandscape} lang={lang} />}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes bounceIn { 0% { transform: scale(0.95); opacity: 0; } 50% { transform: scale(1.02); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes pulseCocoon { 0% { transform: scale(0.95); opacity: 0.4; } 100% { transform: scale(1.05); opacity: 0.6; } }
        @keyframes planetPan { 0% { background-position: 0 0; } 100% { background-position: -200px 0; } }
        
        @keyframes warpIn {
          0% { transform: scale(0) translateZ(-800px) rotateX(30deg); opacity: 0; filter: blur(10px); }
          100% { transform: scale(1) translateZ(0) rotateX(0deg); opacity: 1; filter: blur(0); }
        }
        @keyframes titleReveal {
          0% { opacity: 0; transform: translateY(20px) scale(0.95); letter-spacing: 0.1em; filter: blur(5px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes textFadeUp {
          0% { opacity: 0; transform: translateY(15px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes glitchText {
          0% { transform: translate(0); text-shadow: -1px 0 rgba(34,211,238,0.5), 1px 0 rgba(45,212,191,0.5); }
          20% { transform: translate(-1px, 0.5px); text-shadow: 1px 0 rgba(34,211,238,0.5), -1px 0 rgba(45,212,191,0.5); }
          40% { transform: translate(-0.5px, -0.5px); text-shadow: -1px 0 rgba(34,211,238,0.5), 1px 0 rgba(45,212,191,0.5); }
          60% { transform: translate(1px, 0.5px); text-shadow: 1px 0 rgba(34,211,238,0.5), -1px 0 rgba(45,212,191,0.5); }
          80% { transform: translate(0.5px, -0.5px); text-shadow: -1px 0 rgba(34,211,238,0.5), 1px 0 rgba(45,212,191,0.5); }
          100% { transform: translate(0); text-shadow: 1px 0 rgba(34,211,238,0.5), -1px 0 rgba(45,212,191,0.5); }
        }

        @keyframes floatUp {
          0% { transform: translateY(100vh) scale(0.8); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(-100px) scale(1.2); opacity: 0; }
        }

        @keyframes particleRush {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateY(-100vh) scale(0.2); opacity: 0; }
        }
        
        /* 治癒系光暈閃爍 */
        @keyframes pulseGlow {
          0%, 100% { background-color: rgba(255, 255, 255, 0.85); }
          50% { background-color: rgba(240, 253, 250, 0.95); }
        }
        
        @keyframes stormEnter {
          from { opacity: 0; transform: scale(1.02); filter: blur(5px); }
          to { opacity: 1; transform: scale(1); filter: blur(0); }
        }
        @keyframes neuralFlash {
          0% { opacity: 0; filter: brightness(1); }
          40% { opacity: 0.6; filter: brightness(1.2); }
          100% { opacity: 0; filter: brightness(1); }
        }

        .perspective-1000 { perspective: 1000px; }
        .animate-fade-in { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-in { animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-bounce-in { animation: bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }

        /* 全局定制滾動條：適配淺色治癒主題 */
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.02); border-radius: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(6,182,212,0.2); border-radius: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6,182,212,0.4); }
      `}} />
    </div>
  );
}
