export interface CycleLog {
  id: number;
  start: string;
  end: string | null;
  trackedEnd?: string;
}

export type PhaseKey =
  | 'MENSTRUAL'
  | 'FOLLICULAR'
  | 'OVULATORY'
  | 'LUTEAL'
  | 'LATE';

export interface PhaseInfo {
  name: string;
  color: string;
  icon: string;
  hormone: string;
  mood: string;
  energy: string;
  body: string;
  activity: string;
  food: string;
}

export const PHASES: Record<PhaseKey, PhaseInfo> = {
  MENSTRUAL: {
    name: 'Menstrual Phase', color: '#ff2d75', icon: '☾',
    hormone: 'Progesterone Drop',
    mood: 'Turning inward, reflective, sometimes emotional. Honor your need for solitude.',
    energy: 'Lowest point. Your body needs rest, iron-rich foods, and warmth.',
    body: 'Cramping or bloating. Skin may be sensitive. Prioritize hydration.',
    activity: 'Light stretching, journaling, meditation, and early nights.',
    food: "Spinach, lentils, red meat (iron to replace what's lost). Dark chocolate, bananas, nuts (magnesium for cramps). Ginger or turmeric tea to ease inflammation. Cravings are real — don't stress them."
  },
  FOLLICULAR: {
    name: 'Follicular Phase', color: '#00d2ff', icon: '☽',
    hormone: 'Estrogen Rising',
    mood: 'Outgoing, creative, and mentally sharp. Optimism returns.',
    energy: 'Building steadily. You feel lighter and more capable every day.',
    body: 'Skin starts to glow as estrogen boosts collagen. Energy is steady and balanced.',
    activity: 'Starting new projects, social events, cardio, brainstorming.',
    food: "Yogurt, kimchi, kefir (fermented foods support estrogen metabolism). Pumpkin seeds, eggs, chickpeas (zinc for follicle development). Fresh fruits, leafy greens, whole grains. A great phase to eat varied and well."
  },
  OVULATORY: {
    name: 'Ovulatory Phase', color: '#00ffaa', icon: '○',
    hormone: 'LH Surge',
    mood: 'Confident, flirtatious, high communication. Peak social drive.',
    energy: 'Peak performance. You can handle high-intensity workouts and complex tasks.',
    body: 'High libido. Peak fertility. Clear, bright skin.',
    activity: 'Public speaking, heavy lifting, networking, bold moves.',
    food: "Berries, leafy greens, colorful veg (antioxidants to support the egg). Flaxseed, broccoli, oats (fiber to clear excess estrogen). Salmon, eggs, legumes for protein. Energy is high — enjoy bigger meals without guilt."
  },
  LUTEAL: {
    name: 'Luteal Phase', color: '#bc8cff', icon: '◑',
    hormone: 'Progesterone Peak',
    mood: 'Nesting, detail-oriented, but possibly irritable. Embrace introspection.',
    energy: 'Waning. You might feel "foggy" or easily winded. Rest when needed.',
    body: 'Oily skin or breakouts. Increased appetite. Metabolism speeds up.',
    activity: 'Organizing, deep cleaning, strength training, finishing tasks.',
    food: "Sweet potato, oats, brown rice (complex carbs stabilize blood sugar and curb mood swings). Dairy, almonds, sardines (calcium shown to reduce PMS). Bananas, chicken, potatoes (B6 for mood and bloating). Ease up on caffeine and alcohol — both amplify PMS symptoms noticeably."
  },
  LATE: {
    name: 'Late Cycle (PMS)', color: '#cf2a2a', icon: '⚠',
    hormone: 'Delayed Cycle',
    mood: 'Sensitivity, impatience, or anxiety. Listen to your boundaries.',
    energy: 'Low resilience, fatigue may increase. Cancel non-essentials.',
    body: 'Bloating, breast tenderness, headaches possible.',
    activity: 'Hydration, light walking, restful yoga, self-compassion.',
    food: "Warm, comforting whole foods — soups, stews, complex carbs. Magnesium-rich snacks like nuts and dark chocolate. Cut back on salty and processed foods to reduce bloating. Herbal teas like chamomile or peppermint can soothe tension."
  }
};