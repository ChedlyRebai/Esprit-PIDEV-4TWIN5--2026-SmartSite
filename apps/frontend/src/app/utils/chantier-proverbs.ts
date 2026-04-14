export const CHANTIER_PROVERBS = [
  {
    proverb: "A construction is only as strong as its foundation.",
    meaning: "Success depends on proper preparation and groundwork."
  },
  {
    proverb: "The best builders plan twice and build once.",
    meaning: "Proper planning prevents poor performance."
  },
  {
    proverb: "Measure twice, cut once.",
    meaning: "Careful preparation saves time, money, and resources."
  },
  {
    proverb: "A house is built with bricks, but a home is built with love.",
    meaning: "Physical structures need care, but relationships need more."
  },
  {
    proverb: "The craftsman is known by his work.",
    meaning: "Quality work speaks for itself."
  },
  {
    proverb: "Patience is the key to construction.",
    meaning: "Great results take time and careful execution."
  },
  {
    proverb: "Every beam was once a tree.",
    meaning: "Resources must be carefully selected and prepared."
  },
  {
    proverb: "A structure is only as good as those who build it.",
    meaning: "Team quality determines project success."
  },
  {
    proverb: "The foundation determines the height.",
    meaning: "Starting right ensures lasting success."
  },
  {
    proverb: "No construction without a plan.",
    meaning: "Organization is essential for any project."
  },
  {
    proverb: "Tools don't make the craftsman, skill does.",
    meaning: "Expertise matters more than equipment."
  },
  {
    proverb: "A wall is built stone by stone.",
    meaning: "Big achievements come from small, consistent efforts."
  },
  {
    proverb: "Quality is remembered long after the price is forgotten.",
    meaning: "Excellence leaves a lasting impression."
  },
  {
    proverb: "The roof leaks most where it's not reinforced.",
    meaning: "Weak points need the most attention."
  },
  {
    proverb: "One nail lost shoes a horse, one horse lost a rider, one rider lost a battle.",
    meaning: "Every detail matters in complex projects."
  },
  {
    proverb: "Vision without execution is hallucination.",
   meaning: "Plans must be put into action to succeed."
  },
  {
    proverb: "The journey of a thousand miles begins with a single step.",
    meaning: "Every big project starts with one action."
  },
  {
    proverb: "When the winds blow, the strong walls stand.",
    meaning: "Quality construction withstands challenges."
  },
  {
    proverb: "A good plan today is better than a perfect plan tomorrow.",
    meaning: "Action beats over-planning."
  },
  {
    proverb: "Teamwork builds the dream.",
    meaning: "Collaboration achieves great results."
  }
];

export const getRandomProverb = () => {
  const index = Math.floor(Math.random() * CHANTIER_PROVERBS.length);
  return CHANTIER_PROVERBS[index];
};

export const getProverbOfTheDay = () => {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const index = dayOfYear % CHANTIER_PROVERBS.length;
  return CHANTIER_PROVERBS[index];
};
