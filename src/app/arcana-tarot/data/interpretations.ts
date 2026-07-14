import type { TarotInterpretation } from "../types";
import type { TarotCardName } from "./cards";

export const CARD_INTERPRETATIONS = {
  "The Fool": {
    element: "Air",
    astrology: "Uranus",
    counsel:
      "Leap forward with faith. The void before you is fertile ground for creation.",
    symbols: [
      "The White Rose (Innocence)",
      "The Dog (Instinctual warning)",
      "The Cliff (Edge of transition)",
    ],
  },
  "The Magician": {
    element: "Air",
    astrology: "Mercury",
    counsel:
      "Assemble your resources and focus your intent. Your thoughts carry the weight of manifestation.",
    symbols: [
      "The Infinity Sign (Limitless mind)",
      "The Four Tools (Earthly elements)",
      "The Red Rose (Passionate will)",
    ],
  },
  "The High Priestess": {
    element: "Water",
    astrology: "The Moon",
    counsel:
      "Withdraw from external noise. Let the silence reveal the secret currents flowing underneath.",
    symbols: [
      "The Pomegranates (Hidden fertility)",
      "The Columns (Duality of reality)",
      "The Scroll (Sacred law)",
    ],
  },
  "The Empress": {
    element: "Earth",
    astrology: "Venus",
    counsel:
      "Nurture what you have planted. Allow beauty, joy, and nature to feed your spirit.",
    symbols: [
      "The Wheat (Harvest & success)",
      "The Crown of Stars (Cosmic guidance)",
      "The Shield (Abundant safety)",
    ],
  },
  "The Emperor": {
    element: "Fire",
    astrology: "Aries",
    counsel:
      "Command your boundaries. Structure your chaos into stable systems of order and authority.",
    symbols: [
      "The Stone Throne (Rigid rule)",
      "The Ankh (Life and authority)",
      "The Rams (Fierce leadership)",
    ],
  },
  "The Hierophant": {
    element: "Earth",
    astrology: "Taurus",
    counsel:
      "Look to established wisdom and shared ideals. Seek answers in the lineage of teachers.",
    symbols: [
      "The Triple Crown (Divine authority)",
      "The Crossed Keys (Heavenly portals)",
      "The Pillars (Shared structure)",
    ],
  },
  "The Lovers": {
    element: "Air",
    astrology: "Gemini",
    counsel:
      "Align your decisions with your moral truth. Unite your conscious desire with your higher values.",
    symbols: [
      "The Angel (Higher protection)",
      "The Serpent (Temptation of choice)",
      "The Mountain (Noble ascension)",
    ],
  },
  "The Chariot": {
    element: "Water",
    astrology: "Cancer",
    counsel:
      "Forge a path between opposing impulses. Keep your eyes on the goal and drive forward.",
    symbols: [
      "The Black & White Sphinxes (Opposing forces)",
      "The Starry Canopy (Celestial shelter)",
      "The Shield (Steely armor)",
    ],
  },
  Strength: {
    element: "Fire",
    astrology: "Leo",
    counsel:
      "Subdue the beast with compassion. Gentle patience will outlast raw aggression.",
    symbols: [
      "The Lion (Wild passions)",
      "The Garland of Flowers (Gentle ties)",
      "The Infinity Sign (Eternal resolve)",
    ],
  },
  "The Hermit": {
    element: "Earth",
    astrology: "Virgo",
    counsel:
      "Light your own lantern and seek the quiet paths of self-examination.",
    symbols: [
      "The Lantern (Inner consciousness)",
      "The Staff (Spiritual guidance)",
      "The Snowy Peaks (High isolation)",
    ],
  },
  "Wheel of Fortune": {
    element: "Fire",
    astrology: "Jupiter",
    counsel:
      "Acknowledge the cycle of change. Flow with the rotation of fate, resisting nothing.",
    symbols: [
      "The Wheel (Cyclical movement)",
      "The Sphinx (Karmic balance)",
      "The Four Beasts (Fixed knowledge)",
    ],
  },
  Justice: {
    element: "Air",
    astrology: "Libra",
    counsel:
      "Look at your deeds honestly. Act with absolute truth, accepting the consequences.",
    symbols: [
      "The Scales (Balanced karma)",
      "The Double-Edged Sword (Clear cut truth)",
      "The Red Veil (Guarded structure)",
    ],
  },
  "The Hanged Man": {
    element: "Water",
    astrology: "Neptune",
    counsel:
      "Pause and hang in stillness. Surrender control to see the world upside down.",
    symbols: [
      "The Halo (Internal awakening)",
      "The Crossed Leg (Free choice in pause)",
      "The Living Tree (Sustaining life)",
    ],
  },
  Death: {
    element: "Water",
    astrology: "Scorpio",
    counsel:
      "Allow what is dying to wither. The soil must be cleared for new seeds to sprout.",
    symbols: [
      "The White Rose Banner (Rebirth banner)",
      "The Rising Sun (Eternal return)",
      "The Scythe (Metamorphosis)",
    ],
  },
  Temperance: {
    element: "Fire",
    astrology: "Sagittarius",
    counsel:
      "Blend your elements with patience. Find the golden middle path and recover your balance.",
    symbols: [
      "The Golden Cups (Blending opposites)",
      "The Rising Path (Spiritual journey)",
      "The Wings (Heavenly guide)",
    ],
  },
  "The Devil": {
    element: "Earth",
    astrology: "Capricorn",
    counsel:
      "Examine the loose chains around your neck. You hold the key to your own liberation.",
    symbols: [
      "The Inverted Pentagram (Material focus)",
      "The Loose Chains (Self-bondage)",
      "The Flame (Burning desire)",
    ],
  },
  "The Tower": {
    element: "Fire",
    astrology: "Mars",
    counsel:
      "Let the bolt strike. The false structures of pride must fall so truth can rise.",
    symbols: [
      "The Lightning (Divine revelation)",
      "The Crown Fall (Toppled ego)",
      "The Flames (Cleansing fire)",
    ],
  },
  "The Star": {
    element: "Air",
    astrology: "Aquarius",
    counsel:
      "Pour your hope back into the world. Trust the guidance of the stars after the storm.",
    symbols: [
      "The Great Star (Divine hope)",
      "The Water Pitchers (Emotional relief)",
      "The Bird (Awakened soul)",
    ],
  },
  "The Moon": {
    element: "Water",
    astrology: "Pisces",
    counsel:
      "Navigate the shifting tide by instinct. Do not fear the illusions of the dark night.",
    symbols: [
      "The Twin Towers (Guarded borders)",
      "The Pool of Water (Subconscious)",
      "The Wolf & Dog (Wild vs. tamed)",
    ],
  },
  "The Sun": {
    element: "Fire",
    astrology: "The Sun",
    counsel:
      "Bask in the light of truth and share your warmth. Success and joy are yours to claim.",
    symbols: [
      "The Sunflower (Fulfillment)",
      "The Child & White Horse (Purity & freedom)",
      "The Red Banner (Vitality)",
    ],
  },
  Judgement: {
    element: "Fire",
    astrology: "Pluto",
    counsel:
      "Forgive your past. Answer the call of your higher self and wake up to your purpose.",
    symbols: [
      "The Angel's Trumpet (Destiny call)",
      "The Open Graves (Rebirth & relief)",
      "The Sea (Collective mind)",
    ],
  },
  "The World": {
    element: "Earth",
    astrology: "Saturn",
    counsel:
      "Celebrate the integration of your lessons. You have completed the loop in harmony.",
    symbols: [
      "The Laurel Wreath (Victory)",
      "The Dancer (Harmonious float)",
      "The Four Corners (Cosmic pillars)",
    ],
  },
} as const satisfies Record<TarotCardName, TarotInterpretation>;
