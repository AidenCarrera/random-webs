import type { TarotCardDefinition } from "../types";

export const TAROT_CARDS = [
  {
    name: "The Fool",
    meaning: "New beginnings, optimism, trust in life",
    details:
      "The Fool is the spirit of new beginnings, representing a leap of faith into the unknown. It calls upon you to trust the journey, embrace innocence, and step forward with an open heart. Do not let fear of the unseen hold you back, for the universe paths the way for the pure of intent.",
  },
  {
    name: "The Magician",
    meaning: "Action, the power to manifest",
    details:
      "The Magician represents power, focus, and the capacity to manifest your dreams into physical reality. Armed with the elements of the earth, you possess all the tools necessary to succeed. Direct your will with absolute clarity and shape the raw energies around you.",
  },
  {
    name: "The High Priestess",
    meaning: "Inaction, going within, the subconscious",
    details:
      "The High Priestess sits at the threshold of the conscious and subconscious mind. She represents intuition, secret knowledge, and divine feminine wisdom. Silence the noise of the external world, look inward, and trust the quiet voice that speaks within the shadows.",
  },
  {
    name: "The Empress",
    meaning: "Abundance, nurturing, fertility, life in bloom!",
    details:
      "The Empress is the mother of abundance, nurturing growth, creativity, and the fertile power of nature. She reminds you to connect with your senses, embrace beauty, and allow your projects or relationships to blossom in their own natural time.",
  },
  {
    name: "The Emperor",
    meaning: "Structure, stability, rules and power",
    details:
      "The Emperor brings structure, order, and authority. He represents the protective father figure who establishes rules, boundaries, and logical systems. Focus on discipline, step into your authority, and lay down solid foundations to secure your empire.",
  },
  {
    name: "The Hierophant",
    meaning: "Institutions, tradition, society and its rules",
    details:
      "The Hierophant is the keeper of sacred tradition, representing spiritual education, institutions, and conventional beliefs. He calls you to seek wisdom in established paths, respect lineage, or search for a mentor who can guide your spiritual learning.",
  },
  {
    name: "The Lovers",
    meaning: "Sexuality, passion, choice, uniting",
    details:
      "The Lovers signify deep harmony, passion, and critical choices. While it represents union and relationship, it also highlights the alignment of personal values and the necessity of making choices from a place of moral truth and self-love.",
  },
  {
    name: "The Chariot",
    meaning: "Movement, progress, integration",
    details:
      "The Chariot is the symbol of willpower, conquest, and triumph over opposing forces. By steering your resolve and keeping opposing impulses in check, you can charge forward toward victory. Success is claimed through focus and sheer determination.",
  },
  {
    name: "Strength",
    meaning: "Courage, subtle power, integration of animal self",
    details:
      "Strength represents the quiet fortitude of the human spirit. Rather than raw physical force, it is the soft power of compassion, patience, and self-belief that tames the wild beast within. Meet adversity with a gentle heart and enduring courage.",
  },
  {
    name: "The Hermit",
    meaning: "Meditation, solitude, consciousness",
    details:
      "The Hermit retreats from the worldly clamor, holding a lantern to illuminate the path of self-discovery. This card advises a period of solitude, meditation, and deep introspection. The answers you seek cannot be found in others; they lie inside you.",
  },
  {
    name: "Wheel of Fortune",
    meaning: "Cycles, change, ups and downs",
    details:
      "The Wheel of Fortune reminds us that change is the only constant in the cosmos. Luck, fate, and destiny spin in cycles of ups and downs. Embrace both the triumphs and the trials, for this moment too shall pass, clearing the path for what is to come.",
  },
  {
    name: "Justice",
    meaning: "Fairness, equality, balance",
    details:
      "Justice represents truth, fairness, and the karmic law of cause and effect. Your past actions have led to your present circumstances. Look at your life with complete honesty, accept responsibility, and resolve to act with integrity moving forward.",
  },
  {
    name: "The Hanged Man",
    meaning: "Surrender, new perspective, enlightenment",
    details:
      "The Hanged Man suspends himself in time, choosing sacrifice to gain a higher perspective. This card suggests letting go of control, pausing your actions, and looking at your dilemmas upside down. True enlightenment comes when you surrender the struggle.",
  },
  {
    name: "Death",
    meaning: "End of cycle, beginnings, change, metamorphosis",
    details:
      "Death is not a physical end, but a profound transformation, signifying the closing of one door so another may open. Let go of old habits, relationships, or beliefs that no longer serve you. Embrace the beautiful metamorphosis of rebirth.",
  },
  {
    name: "Temperance",
    meaning: "Balance, moderation, being sensible",
    details:
      "Temperance calls for moderation, balance, and the peaceful blending of opposites. It encourages patience, self-restraint, and finding the middle path. By bringing harmony to your inner state, you will flow naturally around any obstacle.",
  },
  {
    name: "The Devil",
    meaning: "Addiction, materialism, playfulness",
    details:
      "The Devil warns of attachment, illusion, and the chains of materialism or addiction. The chains around your neck are loose; they are held only by your own beliefs. Acknowledge your shadow self, break free from self-imposed prisons, and reclaim your freedom.",
  },
  {
    name: "The Tower",
    meaning: "Sudden upheaval, broken pride, disaster",
    details:
      "The Tower represents sudden, chaotic change and the destruction of false foundations. While the collapse is terrifying, it is necessary to shatter illusions and clear the ground. Build anew on honest, unbreakable bedrock.",
  },
  {
    name: "The Star",
    meaning: "Hope, faith, rejuvenation",
    details:
      "The Star pours water of hope and rejuvenation into the earth. It represents faith, healing, and spiritual guidance after a great storm. Trust that the night is passing, peace is returning, and you are being guided by divine light.",
  },
  {
    name: "The Moon",
    meaning: "Unconscious, illusions, intuition",
    details:
      "The Moon shines upon the path of illusions, fears, and wild dreams. Things may not be as they seem in the pale light of night. Pay close attention to your dreams, trust your intuition, and navigate the shadows with care.",
  },
  {
    name: "The Sun",
    meaning: "Joy, success, celebration, positivity",
    details:
      "The Sun is the ultimate beacon of joy, success, and vitality. It radiates warmth, clarity, and positive energy upon your path. Embrace your achievements, express gratitude, and share your inner light with the world.",
  },
  {
    name: "Judgement",
    meaning: "Reflection, reckoning, awakening",
    details:
      "Judgement calls you to rise, reflect upon your life's journey, and answer a higher spiritual calling. It is a moment of self-evaluation, forgiveness, and awakening. Wash away past regrets and step into a renewed version of yourself.",
  },
  {
    name: "The World",
    meaning: "Fulfillment, harmony, completion",
    details:
      "The World represents the completion of a major cycle, harmony, and cosmic triumph. You have traveled the path, integrated your lessons, and reached a place of wholeness. Celebrate your success and prepare to begin the loop anew.",
  },
] as const satisfies readonly TarotCardDefinition[];

export type TarotCard = (typeof TAROT_CARDS)[number];
export type TarotCardName = TarotCard["name"];
