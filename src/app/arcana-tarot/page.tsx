"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Eye, BookOpenText } from "lucide-react";
import { Cinzel_Decorative } from "next/font/google";

const cinzel = Cinzel_Decorative({
  weight: ["400", "700", "900"],
  subsets: ["latin"],
});

// Detailed Tarot Data
const TAROT_CARDS = [
  {
    name: "The Fool",
    meaning: "New beginnings, optimism, trust in life",
    details: "The Fool is the spirit of new beginnings, representing a leap of faith into the unknown. It calls upon you to trust the journey, embrace innocence, and step forward with an open heart. Do not let fear of the unseen hold you back, for the universe paths the way for the pure of intent."
  },
  {
    name: "The Magician",
    meaning: "Action, the power to manifest",
    details: "The Magician represents power, focus, and the capacity to manifest your dreams into physical reality. Armed with the elements of the earth, you possess all the tools necessary to succeed. Direct your will with absolute clarity and shape the raw energies around you."
  },
  {
    name: "The High Priestess",
    meaning: "Inaction, going within, the subconscious",
    details: "The High Priestess sits at the threshold of the conscious and subconscious mind. She represents intuition, secret knowledge, and divine feminine wisdom. Silence the noise of the external world, look inward, and trust the quiet voice that speaks within the shadows."
  },
  {
    name: "The Empress",
    meaning: "Abundance, nurturing, fertility, life in bloom!",
    details: "The Empress is the mother of abundance, nurturing growth, creativity, and the fertile power of nature. She reminds you to connect with your senses, embrace beauty, and allow your projects or relationships to blossom in their own natural time."
  },
  {
    name: "The Emperor",
    meaning: "Structure, stability, rules and power",
    details: "The Emperor brings structure, order, and authority. He represents the protective father figure who establishes rules, boundaries, and logical systems. Focus on discipline, step into your authority, and lay down solid foundations to secure your empire."
  },
  {
    name: "The Hierophant",
    meaning: "Institutions, tradition, society and its rules",
    details: "The Hierophant is the keeper of sacred tradition, representing spiritual education, institutions, and conventional beliefs. He calls you to seek wisdom in established paths, respect lineage, or search for a mentor who can guide your spiritual learning."
  },
  {
    name: "The Lovers",
    meaning: "Sexuality, passion, choice, uniting",
    details: "The Lovers signify deep harmony, passion, and critical choices. While it represents union and relationship, it also highlights the alignment of personal values and the necessity of making choices from a place of moral truth and self-love."
  },
  {
    name: "The Chariot",
    meaning: "Movement, progress, integration",
    details: "The Chariot is the symbol of willpower, conquest, and triumph over opposing forces. By steering your resolve and keeping opposing impulses in check, you can charge forward toward victory. Success is claimed through focus and sheer determination."
  },
  {
    name: "Strength",
    meaning: "Courage, subtle power, integration of animal self",
    details: "Strength represents the quiet fortitude of the human spirit. Rather than raw physical force, it is the soft power of compassion, patience, and self-belief that tames the wild beast within. Meet adversity with a gentle heart and enduring courage."
  },
  {
    name: "The Hermit",
    meaning: "Meditation, solitude, consciousness",
    details: "The Hermit retreats from the worldly clamor, holding a lantern to illuminate the path of self-discovery. This card advises a period of solitude, meditation, and deep introspection. The answers you seek cannot be found in others; they lie inside you."
  },
  {
    name: "Wheel of Fortune",
    meaning: "Cycles, change, ups and downs",
    details: "The Wheel of Fortune reminds us that change is the only constant in the cosmos. Luck, fate, and destiny spin in cycles of ups and downs. Embrace both the triumphs and the trials, for this moment too shall pass, clearing the path for what is to come."
  },
  {
    name: "Justice",
    meaning: "Fairness, equality, balance",
    details: "Justice represents truth, fairness, and the karmic law of cause and effect. Your past actions have led to your present circumstances. Look at your life with complete honesty, accept responsibility, and resolve to act with integrity moving forward."
  },
  {
    name: "The Hanged Man",
    meaning: "Surrender, new perspective, enlightenment",
    details: "The Hanged Man suspends himself in time, choosing sacrifice to gain a higher perspective. This card suggests letting go of control, pausing your actions, and looking at your dilemmas upside down. True enlightenment comes when you surrender the struggle."
  },
  {
    name: "Death",
    meaning: "End of cycle, beginnings, change, metamorphosis",
    details: "Death is not a physical end, but a profound transformation, signifying the closing of one door so another may open. Let go of old habits, relationships, or beliefs that no longer serve you. Embrace the beautiful metamorphosis of rebirth."
  },
  {
    name: "Temperance",
    meaning: "Balance, moderation, being sensible",
    details: "Temperance calls for moderation, balance, and the peaceful blending of opposites. It encourages patience, self-restraint, and finding the middle path. By bringing harmony to your inner state, you will flow naturally around any obstacle."
  },
  {
    name: "The Devil",
    meaning: "Addiction, materialism, playfulness",
    details: "The Devil warns of attachment, illusion, and the chains of materialism or addiction. The chains around your neck are loose; they are held only by your own beliefs. Acknowledge your shadow self, break free from self-imposed prisons, and reclaim your freedom."
  },
  {
    name: "The Tower",
    meaning: "Sudden upheaval, broken pride, disaster",
    details: "The Tower represents sudden, chaotic change and the destruction of false foundations. While the collapse is terrifying, it is necessary to shatter illusions and clear the ground. Build anew on honest, unbreakable bedrock."
  },
  {
    name: "The Star",
    meaning: "Hope, faith, rejuvenation",
    details: "The Star pours water of hope and rejuvenation into the earth. It represents faith, healing, and spiritual guidance after a great storm. Trust that the night is passing, peace is returning, and you are being guided by divine light."
  },
  {
    name: "The Moon",
    meaning: "Unconscious, illusions, intuition",
    details: "The Moon shines upon the path of illusions, fears, and wild dreams. Things may not be as they seem in the pale light of night. Pay close attention to your dreams, trust your intuition, and navigate the shadows with care."
  },
  {
    name: "The Sun",
    meaning: "Joy, success, celebration, positivity",
    details: "The Sun is the ultimate beacon of joy, success, and vitality. It radiates warmth, clarity, and positive energy upon your path. Embrace your achievements, express gratitude, and share your inner light with the world."
  },
  {
    name: "Judgement",
    meaning: "Reflection, reckoning, awakening",
    details: "Judgement calls you to rise, reflect upon your life's journey, and answer a higher spiritual calling. It is a moment of self-evaluation, forgiveness, and awakening. Wash away past regrets and step into a renewed version of yourself."
  },
  {
    name: "The World",
    meaning: "Fulfillment, harmony, completion",
    details: "The World represents the completion of a major cycle, harmony, and cosmic triumph. You have traveled the path, integrated your lessons, and reached a place of wholeness. Celebrate your success and prepare to begin the loop anew."
  }
];

const CARD_METADATA: Record<string, {
  element: string;
  astrology: string;
  counsel: string;
  symbols: string[];
}> = {
  "The Fool": {
    element: "Air",
    astrology: "Uranus 🌌",
    counsel: "Leap forward with faith. The void before you is fertile ground for creation.",
    symbols: ["The White Rose (Innocence)", "The Dog (Instinctual warning)", "The Cliff (Edge of transition)"]
  },
  "The Magician": {
    element: "Air",
    astrology: "Mercury ☿",
    counsel: "Assemble your resources and focus your intent. Your thoughts carry the weight of manifestation.",
    symbols: ["The Infinity Sign (Limitless mind)", "The Four Tools (Earthly elements)", "The Red Rose (Passionate will)"]
  },
  "The High Priestess": {
    element: "Water",
    astrology: "The Moon ☾",
    counsel: "Withdraw from external noise. Let the silence reveal the secret currents flowing underneath.",
    symbols: ["The Pomegranates (Hidden fertility)", "The Columns (Duality of reality)", "The Scroll (Sacred law)"]
  },
  "The Empress": {
    element: "Earth",
    astrology: "Venus ♀",
    counsel: "Nurture what you have planted. Allow beauty, joy, and nature to feed your spirit.",
    symbols: ["The Wheat (Harvest & success)", "The Crown of Stars (Cosmic guidance)", "The Shield (Abundant safety)"]
  },
  "The Emperor": {
    element: "Fire",
    astrology: "Aries ♈",
    counsel: "Command your boundaries. Structure your chaos into stable systems of order and authority.",
    symbols: ["The Stone Throne (Rigid rule)", "The Ankh (Life and authority)", "The Rams (Fierce leadership)"]
  },
  "The Hierophant": {
    element: "Earth",
    astrology: "Taurus ♉",
    counsel: "Look to established wisdom and shared ideals. Seek answers in the lineage of teachers.",
    symbols: ["The Triple Crown (Divine authority)", "The Crossed Keys (Heavenly portals)", "The Pillars (Shared structure)"]
  },
  "The Lovers": {
    element: "Air",
    astrology: "Gemini ♊",
    counsel: "Align your decisions with your moral truth. Unite your conscious desire with your higher values.",
    symbols: ["The Angel (Higher protection)", "The Serpent (Temptation of choice)", "The Mountain (Noble ascension)"]
  },
  "The Chariot": {
    element: "Water",
    astrology: "Cancer ♋",
    counsel: "Forge a path between opposing impulses. Keep your eyes on the goal and drive forward.",
    symbols: ["The Black & White Sphinxes (Opposing forces)", "The Starry Canopy (Celestial shelter)", "The Shield (Steely armor)"]
  },
  "Strength": {
    element: "Fire",
    astrology: "Leo ♌",
    counsel: "Subdue the beast with compassion. Gentle patience will outlast raw aggression.",
    symbols: ["The Lion (Wild passions)", "The Garland of Flowers (Gentle ties)", "The Infinity Sign (Eternal resolve)"]
  },
  "The Hermit": {
    element: "Earth",
    astrology: "Virgo ♍",
    counsel: "Light your own lantern and seek the quiet paths of self-examination.",
    symbols: ["The Lantern (Inner consciousness)", "The Staff (Spiritual guidance)", "The Snowy Peaks (High isolation)"]
  },
  "Wheel of Fortune": {
    element: "Fire",
    astrology: "Jupiter ♃",
    counsel: "Acknowledge the cycle of change. Flow with the rotation of fate, resisting nothing.",
    symbols: ["The Wheel (Cyclical movement)", "The Sphinx (Karmic balance)", "The Four Beasts (Fixed knowledge)"]
  },
  "Justice": {
    element: "Air",
    astrology: "Libra ♎",
    counsel: "Look at your deeds honestly. Act with absolute truth, accepting the consequences.",
    symbols: ["The Scales (Balanced karma)", "The Double-Edged Sword (Clear cut truth)", "The Red Veil (Guarded structure)"]
  },
  "The Hanged Man": {
    element: "Water",
    astrology: "Neptune ♆",
    counsel: "Pause and hang in stillness. Surrender control to see the world upside down.",
    symbols: ["The Halo (Internal awakening)", "The Crossed Leg (Free choice in pause)", "The Living Tree (Sustaining life)"]
  },
  "Death": {
    element: "Water",
    astrology: "Scorpio ♏",
    counsel: "Allow what is dying to wither. The soil must be cleared for new seeds to sprout.",
    symbols: ["The White Rose Banner (Rebirth banner)", "The Rising Sun (Eternal return)", "The Scythe (Metamorphosis)"]
  },
  "Temperance": {
    element: "Fire",
    astrology: "Sagittarius ♐",
    counsel: "Blend your elements with patience. Find the golden middle path and recover your balance.",
    symbols: ["The Golden Cups (Blending opposites)", "The Rising Path (Spiritual journey)", "The Wings (Heavenly guide)"]
  },
  "The Devil": {
    element: "Earth",
    astrology: "Capricorn ♑",
    counsel: "Examine the loose chains around your neck. You hold the key to your own liberation.",
    symbols: ["The Inverted Pentagram (Material focus)", "The Loose Chains (Self-bondage)", "The Flame (Burning desire)"]
  },
  "The Tower": {
    element: "Fire",
    astrology: "Mars ♂",
    counsel: "Let the bolt strike. The false structures of pride must fall so truth can rise.",
    symbols: ["The Lightning (Divine revelation)", "The Crown Fall (Toppled ego)", "The Flames (Cleansing fire)"]
  },
  "The Star": {
    element: "Air",
    astrology: "Aquarius ♒",
    counsel: "Pour your hope back into the world. Trust the guidance of the stars after the storm.",
    symbols: ["The Great Star (Divine hope)", "The Water Pitchers (Emotional relief)", "The Bird (Awakened soul)"]
  },
  "The Moon": {
    element: "Water",
    astrology: "Pisces ♓",
    counsel: "Navigate the shifting tide by instinct. Do not fear the illusions of the dark night.",
    symbols: ["The Twin Towers (Guarded borders)", "The Pool of Water (Subconscious)", "The Wolf & Dog (Wild vs. tamed)"]
  },
  "The Sun": {
    element: "Fire",
    astrology: "The Sun ☉",
    counsel: "Bask in the light of truth and share your warmth. Success and joy are yours to claim.",
    symbols: ["The Sunflower (Fulfillment)", "The Child & White Horse (Purity & freedom)", "The Red Banner (Vitality)"]
  },
  "Judgement": {
    element: "Fire",
    astrology: "Pluto ♇",
    counsel: "Forgive your past. Answer the call of your higher self and wake up to your purpose.",
    symbols: ["The Angel's Trumpet (Destiny call)", "The Open Graves (Rebirth & relief)", "The Sea (Collective mind)"]
  },
  "The World": {
    element: "Earth",
    astrology: "Saturn ♄",
    counsel: "Celebrate the integration of your lessons. You have completed the loop in harmony.",
    symbols: ["The Laurel Wreath (Victory)", "The Dancer (Harmonious float)", "The Four Corners (Cosmic pillars)"]
  }
};

interface DrawnCard {
  card: (typeof TAROT_CARDS)[0];
  position: "Past" | "Present" | "Future";
  revealed: boolean;
}

export default function TarotSpread() {
  const [spread, setSpread] = useState<DrawnCard[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [selectedCard, setSelectedCard] = useState<(typeof TAROT_CARDS)[0] | null>(null);

  const startReading = () => {
    setIsShuffling(true);
    setSpread([]);

    // Simulate shuffle delay
    setTimeout(() => {
      const shuffled = [...TAROT_CARDS].sort(() => Math.random() - 0.5);
      const newSpread = [
        { card: shuffled[0], position: "Past", revealed: false },
        { card: shuffled[1], position: "Present", revealed: false },
        { card: shuffled[2], position: "Future", revealed: false },
      ] as DrawnCard[];

      setSpread(newSpread);
      setIsShuffling(false);
    }, 1500);
  };

  const revealCard = (index: number) => {
    setSpread((prev) =>
      prev.map((c, i) => (i === index ? { ...c, revealed: true } : c)),
    );
  };

  return (
    <div
      className={`min-h-screen bg-[#1a0b2e] text-[#e0b0ff] font-serif flex flex-col items-center md:justify-center py-8 px-4 overflow-x-hidden ${cinzel.className}`}
    >
      <header className="mb-6 md:mb-8 text-center relative isolate z-10">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(88,28,135,0.55)_0%,rgba(88,28,135,0.22)_42%,rgba(88,28,135,0)_74%)] md:h-64 md:w-64" />
        <h1 className="text-5xl md:text-7xl font-bold text-[#ffd700] mb-4 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">
          Arcana
        </h1>
        <p className="text-lg text-purple-200/60 italic tracking-widest font-serif">
          Reveal your fate
        </p>
      </header>

      <div className="max-w-6xl w-full flex flex-col items-center">
        {spread.length === 0 && !isShuffling ? (
          <button
            onClick={startReading}
            className="group relative px-12 py-6 bg-transparent border-2 border-[#ffd700] text-[#ffd700] text-2xl font-bold uppercase tracking-[0.2em] transition-all hover:bg-[#ffd700] hover:text-[#1a0b2e] overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-4">
              Consult the Cards
            </span>
            <div className="absolute inset-0 bg-[#ffd700] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500 z-0" />
          </button>
        ) : isShuffling ? (
          <div className="flex flex-col items-center gap-6 animate-pulse">
            <div className="w-32 h-48 border-4 border-[#ffd700]/30 rounded-xl bg-[#2d1b4e] rotate-12" />
            <p className="text-xl tracking-widest text-[#ffd700]/70">
              SHUFFLING...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 w-full perspective-1000">
            {spread.map((slot, index) => (
              <div
                key={slot.position}
                className="flex flex-col items-center gap-6"
              >
                <p className="text-xl font-bold uppercase text-purple-300/50 tracking-widest border-b border-purple-300/20 pb-2 w-full text-center">
                  {slot.position}
                </p>

                {/* Card Container with Flip */}
                <div
                  onClick={() => !slot.revealed && revealCard(index)}
                  className={`relative w-64 h-96 cursor-pointer transform-style-3d transition-transform duration-700 ${
                    slot.revealed ? "rotate-y-180" : "hover:scale-105"
                  }`}
                >
                  {/* Card Back */}
                  <div className="absolute inset-0 backface-hidden w-full h-full rounded-xl border-4 border-[#ffd700]/50 bg-[#2d1b4e] flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')]">
                    <div className="border-2 border-[#ffd700]/20 w-[90%] h-[90%] flex items-center justify-center">
                      <Eye className="w-16 h-16 text-[#ffd700]/40" />
                    </div>
                  </div>

                  {/* Card Front */}
                  <div className="absolute inset-0 backface-hidden w-full h-full rounded-xl border-4 border-[#ffd700] bg-[#150a26] flex flex-col items-center justify-between p-6 shadow-[0_0_50px_rgba(255,215,0,0.2)] rotate-y-180 bg-linear-to-b from-[#150a26] to-[#2d1b4e]">
                    <div className="text-center w-full">
                      <span className="text-xl opacity-50 block mb-1">✦</span>
                      <h3 className="text-2xl font-bold text-[#ffd700] leading-tight mb-2">
                        {slot.card.name}
                      </h3>
                      <div className="w-full h-px bg-linear-to-r from-transparent via-[#ffd700]/50 to-transparent my-2" />
                    </div>

                    <p className="text-center text-sm md:text-base leading-relaxed italic text-purple-100/90 font-serif px-2">
                      &quot;{slot.card.meaning}&quot;
                    </p>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCard(slot.card);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 border border-[#ffd700]/40 text-[#ffd700] hover:bg-[#ffd700] hover:text-[#1a0b2e] rounded-sm text-xs font-serif uppercase tracking-widest transition-all duration-300 active:scale-95 z-10"
                    >
                      <span className="flex h-4 w-4 items-center justify-center">
                        <BookOpenText className="h-4 w-4" />
                      </span>
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {spread.length > 0 &&
          !isShuffling &&
          spread.every((c) => c.revealed) && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={startReading}
              className="mt-16 flex items-center gap-2 text-[#ffd700]/70 hover:text-[#ffd700] uppercase tracking-widest text-sm font-bold transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Draw Again
            </motion.button>
          )}
      </div>

      {/* Revelation Details Modal Overlay */}
      {selectedCard && (() => {
        const meta = CARD_METADATA[selectedCard.name] || {
          element: "Unknown 🌀",
          astrology: "Unknown 🌌",
          symbols: ["The Veil (Mystery)"]
        };
        return (
          <div 
            className="fixed inset-0 bg-[#07020f]/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300"
            onClick={() => setSelectedCard(null)}
          >
            <div 
              className="max-w-md w-full bg-[#1b0b2e] border-2 border-[#ffd700] p-8 rounded-xl shadow-[0_0_50px_rgba(255,215,0,0.25)] text-center relative flex flex-col gap-5 animate-in zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Occult star details */}
              <div className="text-[#ffd700]/60 text-xs tracking-[0.3em] uppercase">
                ✦ The Arcana Reveal ✦
              </div>

              <div>
                <h2 className="text-3xl font-extrabold text-[#ffd700] tracking-wider mb-1">
                  {selectedCard.name}
                </h2>
                <div className="w-24 h-px bg-linear-to-r from-transparent via-[#ffd700]/60 to-transparent mx-auto my-3" />
                
                {/* Element & Astrology tags centered */}
                <div className="flex gap-2 justify-center mb-4">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-purple-200 border border-purple-500/30 px-2 py-0.5 rounded-sm bg-purple-950/50">
                    {meta.element}
                  </span>
                  <span className="text-[9px] uppercase font-bold tracking-wider text-purple-200 border border-purple-500/30 px-2 py-0.5 rounded-sm bg-purple-950/50">
                    {meta.astrology}
                  </span>
                </div>

                <p className="text-xs font-semibold text-purple-300/60 tracking-widest uppercase mb-1">
                  Short Meaning
                </p>
                <p className="text-sm italic text-purple-100/70 mb-4 font-serif">
                  &ldquo;{selectedCard.meaning}&rdquo;
                </p>
              </div>

              {/* Mystical Interpretation */}
              <div className="text-left border-t border-[#ffd700]/20 pt-5">
                <p className="text-xs font-bold text-[#ffd700]/80 tracking-[0.2em] uppercase mb-2 font-serif text-center">
                  Mystical Interpretation
                </p>
                <p className="text-sm leading-relaxed text-purple-100/90 font-serif text-justify">
                  {selectedCard.details}
                </p>
              </div>

              {/* Sacred Symbols list */}
              <div className="text-left border-t border-[#ffd700]/10 pt-4">
                <p className="text-xs font-bold text-[#ffd700]/70 tracking-[0.2em] uppercase mb-2 font-serif text-center">
                  Sacred Symbols
                </p>
                <ul className="flex flex-col gap-1.5 text-xs text-purple-200/80 font-serif pl-2">
                  {meta.symbols.map((sym, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#ffd700] text-[8px] mt-1">✦</span>
                      <span>{sym}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => setSelectedCard(null)}
                className="mt-2 px-6 py-2 border border-[#ffd700]/50 bg-purple-950/40 text-[#ffd700] hover:bg-[#ffd700] hover:text-[#1a0b2e] font-serif text-xs uppercase tracking-widest transition-all rounded-sm active:scale-95"
              >
                Close Revelation
              </button>
            </div>
          </div>
        );
      })()}

      {/* Bottom spacer to lift layout vertically on desktop */}
      <div className="hidden md:block h-16 md:h-20 shrink-0" />

      {/* Global Style for 3D Transform Class utilities since Tailwind sometimes strips transform-style-3d */}
      <style jsx global>{`
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}
