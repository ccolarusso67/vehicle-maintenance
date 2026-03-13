'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MakeIndex, MakeData, FluidSpec } from '@/data/types';

interface Message {
  role: 'bot' | 'user';
  text: string;
  html?: string;
  buttons?: QuickButton[];
}

interface QuickButton {
  label: string;
  value: string;
}

interface ConversationState {
  step: 'idle' | 'awaiting_make' | 'awaiting_model' | 'awaiting_type' | 'vehicle_selected';
  makes: MakeIndex[];
  makeData: MakeData | null;
  selectedMake: string;
  selectedModel: string;
  selectedType: string;
  fluids: FluidSpec[];
}

// BigCommerce product URL mapping by SKU prefix
const PRODUCT_URLS: Record<string, { url: string; id: number }> = {
  'UFS0530': { url: 'https://ultra1plus.com/drive/5w-30-full-synthetic-motor-oil', id: 114 },
  'UFS0520': { url: 'https://ultra1plus.com/drive/5w-20-full-synthetic-motor-oil', id: 132 },
  'UFS0020': { url: 'https://ultra1plus.com/drive/0w-20-full-synthetic-motor-oil', id: 106 },
  'UFS0540': { url: 'https://ultra1plus.com/drive/5w-30-full-synthetic-motor-oil', id: 114 },
  'UFSG7590': { url: 'https://ultra1plus.com/gear/75w-90-synthetic-gear-lube-oil', id: 144 },
  'UFS7590': { url: 'https://ultra1plus.com/gear/75w-90-synthetic-gear-lube-oil', id: 144 },
  'UFSMVATF': { url: 'https://ultra1plus.com/drive/atf-dexron-vi-full-synthetic-transmission-fluid-multi-vehicle', id: 30 },
  'UFSDVIMV': { url: 'https://ultra1plus.com/drive/atf-dexron-vi-full-synthetic-transmission-fluid-multi-vehicle', id: 30 },
  'UCDIIIMM': { url: 'https://ultra1plus.com/drive/atf-dexron-iii-mercon-multi-purpose', id: 64 },
  'UELAC5050': { url: 'https://ultra1plus.com/cool/orange-oat-naps-free-antifreeze-coolant-50-50', id: 259 },
  'UACEL5050': { url: 'https://ultra1plus.com/cool/orange-oat-naps-free-antifreeze-coolant-50-50', id: 259 },
  'USB2540': { url: 'https://ultra1plus.com/aqua/sae-25w-40-synthetic-blend-4t-marine-engine-oil', id: 81 },
};

function getProductUrl(sku?: string): string | null {
  if (!sku) return null;
  for (const [prefix, info] of Object.entries(PRODUCT_URLS)) {
    if (sku.startsWith(prefix) && info.id > 0) return info.url;
  }
  return null;
}

function getCartUrl(sku?: string): string | null {
  if (!sku) return null;
  for (const [prefix, info] of Object.entries(PRODUCT_URLS)) {
    if (sku.startsWith(prefix) && info.id > 0) {
      return `https://ultra1plus.com/cart.php?action=add&product_id=${info.id}`;
    }
  }
  return null;
}

function cleanMakeName(name: string): string {
  return name.replace(/\s*\(.*\)$/, '');
}

function fluidToHtml(f: FluidSpec): string {
  const product = f.p && f.p !== 'Special Product'
    ? `<span class="text-[#FFC700] font-bold">${f.p}</span>`
    : '<span class="text-[#888]">OEM / Special Product</span>';
  const lines = [`<strong>${f.ic} ${f.n}</strong>`, product];
  if (f.c) lines.push(`<span class="text-[#888]">Cap:</span> ${f.c}`);
  if (f.i) lines.push(`<span class="text-[#888]">Interval:</span> ${f.i}`);

  const shopUrl = getProductUrl(f.u1pSku);
  const cartUrl = getCartUrl(f.u1pSku);
  if (shopUrl) {
    lines.push(
      `<span class="flex gap-2 mt-1.5">` +
      `<a href="${shopUrl}" target="_blank" class="inline-block px-2 py-1 text-xs font-bold bg-[#222] text-[#FFC700] border border-[#FFC700]/40 hover:bg-[#FFC700] hover:text-black transition-colors">View Product</a>` +
      (cartUrl ? `<a href="${cartUrl}" target="_blank" class="inline-block px-2 py-1 text-xs font-bold bg-[#FFC700] text-black hover:bg-[#e6b400] transition-colors">Add to Cart</a>` : '') +
      `</span>`
    );
  }
  return lines.join('<br/>');
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-tl-lg rounded-tr-lg rounded-br-lg px-4 py-3 flex gap-1.5">
        <span className="w-2 h-2 bg-[#FFC700] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-[#FFC700] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-[#FFC700] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      text: "Hi! I'm Enzo, your Ultra1Plus maintenance assistant. How can I help you today?",
      buttons: [
        { label: 'Find fluids for my vehicle', value: 'find fluids' },
        { label: 'Shop products', value: 'shop' },
        { label: 'Maintenance tips', value: 'tips' },
        { label: 'Help', value: 'help' },
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [state, setState] = useState<ConversationState>({
    step: 'idle',
    makes: [],
    makeData: null,
    selectedMake: '',
    selectedModel: '',
    selectedType: '',
    fluids: [],
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/data/index.json')
      .then(r => r.json())
      .then((makes: MakeIndex[]) => setState(s => ({ ...s, makes })))
      .catch(console.error);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const addBot = useCallback((text: string, html?: string, buttons?: QuickButton[]) => {
    setTyping(false);
    setMessages(m => [...m, { role: 'bot', text, html, buttons }]);
  }, []);

  const botReply = useCallback((text: string, html?: string, buttons?: QuickButton[], delay = 400) => {
    setTyping(true);
    setTimeout(() => addBot(text, html, buttons), delay);
  }, [addBot]);

  const findMake = useCallback((query: string, makes: MakeIndex[]): MakeIndex | null => {
    const q = query.toLowerCase().trim();
    const exact = makes.find(m => m.name.toLowerCase() === q);
    if (exact) return exact;
    const partial = makes.find(m => cleanMakeName(m.name).toLowerCase() === q);
    if (partial) return partial;
    const contains = makes.filter(m => m.name.toLowerCase().includes(q));
    if (contains.length === 1) return contains[0];
    return null;
  }, []);

  // Try to parse "make + model" from a single sentence
  const parseVehicleFromSentence = useCallback((text: string, makes: MakeIndex[]): { make: MakeIndex; modelHint: string } | null => {
    const lc = text.toLowerCase().replace(/[?.,!]/g, '');
    const words = lc.split(/\s+/);

    for (const make of makes) {
      const baseName = cleanMakeName(make.name).toLowerCase();
      const idx = lc.indexOf(baseName);
      if (idx >= 0) {
        const after = lc.slice(idx + baseName.length).trim();
        // Extract model hint (first significant word/number after make)
        const modelMatch = after.match(/^(\S+(?:\s*\S+)?)/);
        const modelHint = modelMatch ? modelMatch[1].replace(/^(for|the|my|a)\s*/i, '') : '';
        if (modelHint && modelHint.length > 1) {
          return { make, modelHint };
        }
      }
    }
    // Also check common shorthand like "f150", "f-150", "rav4"
    const modelPatterns: Record<string, { makeName: string; model: string }> = {
      'f150': { makeName: 'Ford', model: 'F-150' },
      'f-150': { makeName: 'Ford', model: 'F-150' },
      'silverado': { makeName: 'Chevrolet', model: 'Silverado' },
      'camry': { makeName: 'Toyota', model: 'Camry' },
      'rav4': { makeName: 'Toyota', model: 'RAV4' },
      'civic': { makeName: 'Honda', model: 'Civic' },
      'cr-v': { makeName: 'Honda', model: 'CR-V' },
      'crv': { makeName: 'Honda', model: 'CR-V' },
      'accord': { makeName: 'Honda', model: 'Accord' },
      'corolla': { makeName: 'Toyota', model: 'Corolla' },
      'ram 1500': { makeName: 'Ram', model: '1500' },
      'wrangler': { makeName: 'Jeep', model: 'Wrangler' },
      'mustang': { makeName: 'Ford', model: 'Mustang' },
      'explorer': { makeName: 'Ford', model: 'Explorer' },
    };

    for (const [pattern, info] of Object.entries(modelPatterns)) {
      if (words.includes(pattern) || lc.includes(pattern)) {
        const make = makes.find(m => cleanMakeName(m.name).toLowerCase() === info.makeName.toLowerCase());
        if (make) return { make, modelHint: info.model };
      }
    }
    return null;
  }, []);

  const processMessage = useCallback((text: string) => {
    const lc = text.toLowerCase().trim();

    // Reset
    if (lc === 'reset' || lc === 'start over' || lc === 'new vehicle' || lc === 'clear') {
      setState(s => ({ ...s, step: 'idle', makeData: null, selectedMake: '', selectedModel: '', selectedType: '', fluids: [] }));
      botReply("No problem! How can I help you?", undefined, [
        { label: 'Find fluids for my vehicle', value: 'find fluids' },
        { label: 'Shop products', value: 'shop' },
      ]);
      return;
    }

    // Help
    if (lc === 'help' || lc === '?') {
      botReply(
        "Here's what I can do:",
        `<div class="space-y-1">
          <p><strong>Find fluids</strong> — Tell me your vehicle (e.g., "Toyota Camry" or "Ford F-150")</p>
          <p><strong>Ask questions</strong> — "What oil?", "How often to change oil?"</p>
          <p><strong>Order products</strong> — I'll show Add to Cart buttons for Ultra1Plus products</p>
          <p><strong>Shop</strong> — Browse all Ultra1Plus products</p>
          <p><strong>Reset</strong> — Start a new vehicle lookup</p>
        </div>`,
        [
          { label: 'Find fluids for my vehicle', value: 'find fluids' },
          { label: 'Shop products', value: 'shop' },
        ]
      );
      return;
    }

    // Find fluids prompt
    if (lc === 'find fluids' || lc === 'find fluids for my vehicle' || lc === 'look up vehicle') {
      setState(s => ({ ...s, step: 'idle' }));
      botReply("What's your vehicle? You can type the make (e.g., \"Toyota\") or make and model together (e.g., \"Ford F-150\").");
      return;
    }

    // Tips
    if (lc === 'tips' || lc === 'maintenance tips') {
      botReply(
        "Here are some essential maintenance tips:",
        `<div class="space-y-2">
          <p><strong>🛢️ Engine Oil</strong> — Change every 5,000-10,000 miles with full synthetic. Always use the viscosity grade in your owner's manual.</p>
          <p><strong>❄️ Coolant</strong> — Check level monthly. Replace every 5 years or 150,000 miles for extended life coolant.</p>
          <p><strong>🔴 Brake Fluid</strong> — Inspect every 15,000 miles. Replace every 2-3 years as it absorbs moisture.</p>
          <p><strong>⚙️ Transmission</strong> — Service every 60,000 miles. Use the correct ATF type for your vehicle.</p>
          <p><strong>🔧 Differential</strong> — Change fluid every 30,000-60,000 miles, sooner if towing.</p>
        </div>`,
        [
          { label: 'Find fluids for my vehicle', value: 'find fluids' },
          { label: 'Shop products', value: 'shop' },
        ]
      );
      return;
    }

    // Shop
    if (lc === 'shop' || lc === 'shop products' || lc.includes('where to buy') || lc.includes('purchase') || lc.includes('store')) {
      botReply(
        'Browse our full product line:',
        `<div class="space-y-1.5">
          <a href="https://ultra1plus.com/motor-oil-6/" target="_blank" class="block px-2 py-1.5 text-xs font-bold bg-[#222] text-[#FFC700] border border-[#FFC700]/40 hover:bg-[#FFC700] hover:text-black transition-colors">🛢️ Motor Oil</a>
          <a href="https://ultra1plus.com/transmission-fluids/" target="_blank" class="block px-2 py-1.5 text-xs font-bold bg-[#222] text-[#FFC700] border border-[#FFC700]/40 hover:bg-[#FFC700] hover:text-black transition-colors">⚙️ Transmission Fluid</a>
          <a href="https://ultra1plus.com/gear/" target="_blank" class="block px-2 py-1.5 text-xs font-bold bg-[#222] text-[#FFC700] border border-[#FFC700]/40 hover:bg-[#FFC700] hover:text-black transition-colors">🔧 Gear Oil</a>
          <a href="https://ultra1plus.com/antifreeze-coolant" target="_blank" class="block px-2 py-1.5 text-xs font-bold bg-[#222] text-[#FFC700] border border-[#FFC700]/40 hover:bg-[#FFC700] hover:text-black transition-colors">❄️ Coolant &amp; Antifreeze</a>
          <a href="https://ultra1plus.com" target="_blank" class="block px-2 py-1.5 text-xs font-bold bg-[#FFC700] text-black hover:bg-[#e6b400] transition-colors text-center mt-2">Visit Ultra1Plus Store</a>
        </div>`
      );
      return;
    }

    // Order / add to cart for current vehicle
    if ((lc.includes('order') || lc.includes('buy') || lc.includes('cart') || lc.includes('add to cart')) && state.fluids.length > 0) {
      const orderableFluids = state.fluids.filter(f => f.u1pSku && getCartUrl(f.u1pSku));
      if (orderableFluids.length > 0) {
        const html = orderableFluids.map(f => {
          const cartUrl = getCartUrl(f.u1pSku);
          const shopUrl = getProductUrl(f.u1pSku);
          return `<div class="flex items-center justify-between gap-2 py-1.5 border-b border-[#333] last:border-0">
            <span class="text-xs">${f.ic} ${f.p}</span>
            <span class="flex gap-1 flex-shrink-0">
              ${shopUrl ? `<a href="${shopUrl}" target="_blank" class="px-2 py-1 text-[10px] font-bold bg-[#222] text-[#FFC700] border border-[#FFC700]/40 hover:bg-[#FFC700] hover:text-black transition-colors">View</a>` : ''}
              ${cartUrl ? `<a href="${cartUrl}" target="_blank" class="px-2 py-1 text-[10px] font-bold bg-[#FFC700] text-black hover:bg-[#e6b400] transition-colors">Add to Cart</a>` : ''}
            </span>
          </div>`;
        }).join('');
        botReply(
          `Here are the Ultra1Plus products for your ${cleanMakeName(state.selectedMake)}:`,
          `<div>${html}</div>`
        );
      } else {
        botReply("The fluids for this vehicle require OEM-specific products. Visit ultra1plus.com for our full catalog!", undefined, [
          { label: 'Shop products', value: 'shop' },
        ]);
      }
      return;
    }

    // Handle general questions when vehicle selected
    if (state.step === 'idle' || state.step === 'vehicle_selected') {
      if (lc.includes('how often') || lc.includes('interval') || lc.includes('when should')) {
        if (state.fluids.length > 0) {
          const engine = state.fluids.find(f => f.n.toLowerCase() === 'engine');
          if (engine?.i) {
            botReply(`For your ${cleanMakeName(state.selectedMake)}, the engine oil change interval is: ${engine.i}. Always consult your owner's manual.`, undefined, [
              { label: 'Show all fluids', value: 'show all' },
              { label: 'Order products', value: 'order' },
            ]);
            return;
          }
        }
        botReply("Oil change intervals vary by vehicle. Most modern cars recommend every 5,000-10,000 miles with synthetic oil.", undefined, [
          { label: 'Find fluids for my vehicle', value: 'find fluids' },
        ]);
        return;
      }

      // Fluid-specific questions
      if (state.fluids.length > 0) {
        const fluidKeywords: Record<string, string[]> = {
          'engine': ['oil', 'engine oil', 'motor oil', 'engine'],
          'transmission': ['transmission', 'trans', 'atf', 'gear box', 'gearbox'],
          'coolant': ['coolant', 'antifreeze', 'radiator'],
          'brake': ['brake', 'braking'],
          'differential': ['differential', 'diff', 'axle'],
          'power steering': ['power steering', 'steering'],
          'transfer': ['transfer case', 'transfer'],
        };

        for (const [fluidType, keywords] of Object.entries(fluidKeywords)) {
          if (keywords.some(kw => lc.includes(kw))) {
            const match = state.fluids.find(f => f.n.toLowerCase().includes(fluidType));
            if (match) {
              botReply(
                `Here's the ${match.n.toLowerCase()} info for your ${cleanMakeName(state.selectedMake)}:`,
                fluidToHtml(match),
                [
                  { label: 'Show all fluids', value: 'show all' },
                  { label: 'Order all products', value: 'order' },
                  { label: 'New vehicle', value: 'reset' },
                ]
              );
              return;
            }
          }
        }

        if (lc.includes('all fluid') || lc.includes('show all') || lc.includes('list all') || lc.includes('everything')) {
          const html = state.fluids.map(f => fluidToHtml(f)).join('<hr class="my-2 border-[#333]"/>');
          botReply(
            `All ${state.fluids.length} fluid specs for your ${cleanMakeName(state.selectedMake)} ${state.selectedModel}:`,
            html,
            [
              { label: 'Order products', value: 'order' },
              { label: 'New vehicle', value: 'reset' },
            ]
          );
          return;
        }
      }

      // Try natural language: "what oil for my toyota camry"
      const parsed = parseVehicleFromSentence(text, state.makes);
      if (parsed) {
        setState(s => ({ ...s, step: 'awaiting_model', selectedMake: parsed.make.name, selectedModel: '', selectedType: '', fluids: [] }));
        setTyping(true);

        fetch(`/data/${parsed.make.id}.json`)
          .then(r => r.json())
          .then((data: MakeData) => {
            setState(s => ({ ...s, makeData: data }));
            const model = data.models.find(m => m.name.toLowerCase().includes(parsed.modelHint.toLowerCase()));
            if (model) {
              setState(s => ({ ...s, selectedModel: model!.name }));
              if (model.types.length === 1) {
                const type = model.types[0];
                setState(s => ({ ...s, step: 'vehicle_selected', selectedType: type.name, fluids: type.fluids }));
                const html = type.fluids.map(f => fluidToHtml(f)).join('<hr class="my-2 border-[#333]"/>');
                addBot(
                  `Here are the fluid specs for your ${cleanMakeName(parsed.make.name)} ${model!.name}:`,
                  html,
                  [
                    { label: 'Order products', value: 'order' },
                    { label: 'New vehicle', value: 'reset' },
                  ]
                );
              } else {
                setState(s => ({ ...s, step: 'awaiting_type' }));
                const buttons = model.types.slice(0, 6).map((t, i) => ({ label: t.name.length > 35 ? t.name.slice(0, 35) + '...' : t.name, value: String(i + 1) }));
                const list = model.types.map((t, i) => `${i + 1}. ${t.name}`).join('\n');
                addBot(`${model!.name} has ${model!.types.length} variants:\n\n${list}\n\nWhich one?`, undefined, buttons);
              }
            } else {
              addBot(`Found ${cleanMakeName(parsed.make.name)} but couldn't match "${parsed.modelHint}". Type your model name.`);
            }
          })
          .catch(() => { setTyping(false); addBot("Sorry, couldn't load that data."); });
        return;
      }

      // Simple make match
      const make = findMake(text, state.makes);
      if (make) {
        setState(s => ({ ...s, step: 'awaiting_model', selectedMake: make.name, selectedModel: '', selectedType: '', fluids: [] }));
        setTyping(true);

        fetch(`/data/${make.id}.json`)
          .then(r => r.json())
          .then((data: MakeData) => {
            setState(s => ({ ...s, makeData: data }));
            if (data.models.length <= 8) {
              const buttons = data.models.map((m, i) => ({ label: m.name.length > 30 ? m.name.slice(0, 30) + '...' : m.name, value: String(i + 1) }));
              const list = data.models.map((m, i) => `${i + 1}. ${m.name}`).join('\n');
              addBot(`Found ${data.models.length} models for ${cleanMakeName(make.name)}. Which one?\n\n${list}`, undefined, buttons);
            } else {
              addBot(`Found ${data.models.length} models for ${cleanMakeName(make.name)}. Type your model name (e.g., "Camry" or "F-150").`);
            }
          })
          .catch(() => { setTyping(false); addBot("Sorry, couldn't load data for that make."); setState(s => ({ ...s, step: 'idle' })); });
        return;
      }

      // Multiple matches
      const multiMatch = state.makes.filter(m => m.name.toLowerCase().includes(lc));
      if (multiMatch.length > 1 && multiMatch.length <= 5) {
        const buttons = multiMatch.map((m, i) => ({ label: cleanMakeName(m.name), value: m.name }));
        botReply(`I found multiple matches. Which one?`, undefined, buttons);
        setState(s => ({ ...s, step: 'awaiting_make' }));
        return;
      }

      botReply("I'm not sure I understood that. What would you like to do?", undefined, [
        { label: 'Find fluids for my vehicle', value: 'find fluids' },
        { label: 'Shop products', value: 'shop' },
        { label: 'Help', value: 'help' },
      ]);
      return;
    }

    // Awaiting make
    if (state.step === 'awaiting_make') {
      const selected = findMake(text, state.makes);
      if (!selected) {
        botReply("I couldn't find that make. Please try again.", undefined, [
          { label: 'Start over', value: 'reset' },
        ]);
        return;
      }
      setState(s => ({ ...s, step: 'awaiting_model', selectedMake: selected!.name }));
      setTyping(true);

      fetch(`/data/${selected.id}.json`)
        .then(r => r.json())
        .then((data: MakeData) => {
          setState(s => ({ ...s, makeData: data }));
          if (data.models.length <= 8) {
            const buttons = data.models.map((m, i) => ({ label: m.name.length > 30 ? m.name.slice(0, 30) + '...' : m.name, value: String(i + 1) }));
            addBot(`Found ${data.models.length} models. Which one?`, undefined, buttons);
          } else {
            addBot(`Found ${data.models.length} models for ${cleanMakeName(selected!.name)}. Type your model name.`);
          }
        })
        .catch(() => { setTyping(false); addBot("Sorry, couldn't load that data."); setState(s => ({ ...s, step: 'idle' })); });
      return;
    }

    // Awaiting model
    if (state.step === 'awaiting_model' && state.makeData) {
      const models = state.makeData.models;
      const num = parseInt(text);
      let model = null;

      if (num > 0 && num <= models.length) {
        model = models[num - 1];
      } else {
        model = models.find(m => m.name.toLowerCase().includes(lc));
      }

      if (!model) {
        const partials = models.filter(m => m.name.toLowerCase().includes(lc));
        if (partials.length > 1 && partials.length <= 8) {
          const buttons = partials.map((m, i) => ({ label: m.name.length > 30 ? m.name.slice(0, 30) + '...' : m.name, value: String(i + 1) }));
          const list = partials.map((m, i) => `${i + 1}. ${m.name}`).join('\n');
          botReply(`Multiple matches:\n\n${list}`, undefined, buttons);
          return;
        }
        botReply("I couldn't find that model. Please check the spelling and try again.");
        return;
      }

      setState(s => ({ ...s, selectedModel: model!.name }));

      if (model.types.length === 1) {
        const type = model.types[0];
        setState(s => ({ ...s, step: 'vehicle_selected', selectedType: type.name, fluids: type.fluids }));
        const html = type.fluids.map(f => fluidToHtml(f)).join('<hr class="my-2 border-[#333]"/>');
        botReply(
          `Here are the fluid specs for your ${cleanMakeName(state.selectedMake)} ${model!.name}:`,
          html,
          [
            { label: 'Order products', value: 'order' },
            { label: 'New vehicle', value: 'reset' },
          ]
        );
      } else {
        setState(s => ({ ...s, step: 'awaiting_type' }));
        const buttons = model.types.slice(0, 6).map((t, i) => ({ label: t.name.length > 35 ? t.name.slice(0, 35) + '...' : t.name, value: String(i + 1) }));
        const list = model.types.map((t, i) => `${i + 1}. ${t.name}`).join('\n');
        botReply(`${model!.name} has ${model!.types.length} variants:\n\n${list}\n\nWhich one?`, undefined, buttons);
      }
      return;
    }

    // Awaiting type
    if (state.step === 'awaiting_type' && state.makeData) {
      const model = state.makeData.models.find(m => m.name === state.selectedModel);
      if (!model) return;

      const num = parseInt(text);
      let type = null;

      if (num > 0 && num <= model.types.length) {
        type = model.types[num - 1];
      } else {
        type = model.types.find(t => t.name.toLowerCase().includes(lc));
      }

      if (!type) {
        botReply("I couldn't find that variant. Please pick from the list.");
        return;
      }

      setState(s => ({ ...s, step: 'vehicle_selected', selectedType: type!.name, fluids: type!.fluids }));
      const html = type.fluids.map(f => fluidToHtml(f)).join('<hr class="my-2 border-[#333]"/>');
      botReply(
        `Here are the fluid specs for your ${cleanMakeName(state.selectedMake)} ${state.selectedModel}:`,
        html,
        [
          { label: 'Order products', value: 'order' },
          { label: 'New vehicle', value: 'reset' },
        ]
      );
      return;
    }
  }, [state, addBot, botReply, findMake, parseVehicleFromSentence]);

  const handleSend = useCallback((overrideText?: string) => {
    const text = (overrideText || input).trim();
    if (!text) return;

    setMessages(m => [...m, { role: 'user', text }]);
    if (!overrideText) setInput('');

    processMessage(text);
  }, [input, processMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  const handleQuickButton = (value: string) => {
    handleSend(value);
  };

  return (
    <>
      {/* Chat toggle button */}
      {open ? (
        <button
          onClick={() => setOpen(false)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#FFC700] hover:bg-[#e6b400] text-black rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
          aria-label="Close chat"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-black border-2 border-red-600 text-white
            pl-5 pr-6 py-3 rounded-full shadow-2xl hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all hover:scale-105 group enzo-flash"
          aria-label="Open Enzo maintenance assistant"
        >
          <div className="w-10 h-10 bg-[#FFC700] rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-black font-black text-xs">U1P</span>
          </div>
          <div className="text-left">
            <span className="block text-sm font-bold uppercase tracking-wide text-[#FFC700]">Enzo</span>
            <span className="block text-xs text-gray-400">Ask me anything</span>
          </div>
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[400px] max-w-[calc(100vw-2rem)] bg-black border-2 border-[#FFC700] shadow-2xl animate-slide-up flex flex-col"
          style={{ height: 'min(560px, calc(100vh - 8rem))' }}
        >
          {/* Header */}
          <div className="bg-black px-4 py-3 border-b border-[#FFC700]/30 flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 bg-[#FFC700] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-black font-black text-xs">U1P</span>
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-bold text-sm uppercase tracking-wide">Enzo</h3>
              <p className="text-[#FFC700] text-xs">Your Maintenance Assistant</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i}>
                <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] px-3 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#FFC700] text-black rounded-tl-lg rounded-tr-lg rounded-bl-lg'
                        : 'bg-[#1a1a1a] text-gray-200 rounded-tl-lg rounded-tr-lg rounded-br-lg border border-[#333]'
                    }`}
                  >
                    {msg.html ? (
                      <div dangerouslySetInnerHTML={{ __html: msg.html }} />
                    ) : (
                      msg.text.split('\n').map((line, j) => (
                        <p key={j} className={j > 0 ? 'mt-1' : ''}>{line}</p>
                      ))
                    )}
                  </div>
                </div>
                {/* Quick-reply buttons */}
                {msg.buttons && msg.role === 'bot' && i === messages.length - 1 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 ml-1">
                    {msg.buttons.map(btn => (
                      <button
                        key={btn.value}
                        type="button"
                        onClick={() => handleQuickButton(btn.value)}
                        className="px-2.5 py-1.5 text-xs font-medium border border-[#FFC700]/40 text-[#FFC700] bg-[#111]
                          hover:bg-[#FFC700] hover:text-black transition-colors rounded-full"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {typing && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-[#333] p-3 flex gap-2 flex-shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Enzo anything..."
              className="flex-1 bg-[#1a1a1a] text-white text-sm px-3 py-2.5 border border-[#333] focus:border-[#FFC700] focus:outline-none placeholder-[#666]"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="bg-[#FFC700] hover:bg-[#e6b400] text-black px-3 py-2.5 font-bold text-sm uppercase tracking-wide disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
