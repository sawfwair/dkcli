import type { FutureTopologyItem } from './future.ts';

export type LoopPreset = {
  id: string;
  label: string;
  query: string;
  items: FutureTopologyItem[];
};

export const LOOP_PRESET_IMAGES: Partial<Record<string, Partial<Record<string, string>>>> = {
  'saas-pricing': { headline: '/future/saas.jpg' },
  'recipe-blog': { 'dish-title': '/future/brownies.jpg' },
  portfolio: {
    'branding-project': '/future/branding.jpg',
    'motion-project': '/future/motion.jpg',
    'editorial-project': '/future/editorial.jpg'
  },
  dashboard: { greeting: '/future/dashboard.jpg' },
  restaurant: {
    hero: '/future/restaurant.jpg',
    starters: '/future/tasting.jpg'
  }
};

export function loopPresetImage(presetId: string, itemId: string): string | null {
  return LOOP_PRESET_IMAGES[presetId]?.[itemId] ?? null;
}

export const LOOP_PRESETS: LoopPreset[] = [
  {
    id: 'saas-pricing',
    label: 'SaaS pricing',
    query:
      'Design a pricing page that guides users from free tier through enterprise, with social proof and a clear upgrade path.',
    items: [
      {
        id: 'headline',
        role: 'title',
        label: 'Simple, transparent pricing',
        text: 'Start free, scale as you grow. No hidden fees, no surprises.'
      },
      {
        id: 'free-tier',
        role: 'data',
        label: 'Free plan',
        text: 'Up to 1,000 requests per month with community support and basic analytics.'
      },
      {
        id: 'pro-tier',
        role: 'data',
        label: 'Pro plan',
        text: '50,000 requests, priority support, advanced analytics, and custom domains.'
      },
      {
        id: 'enterprise',
        role: 'data',
        label: 'Enterprise',
        text: 'Unlimited requests, dedicated account manager, SLA guarantees, SSO, audit logs.'
      },
      {
        id: 'social-proof',
        role: 'support',
        label: 'Trusted by teams',
        text: 'Over 2,000 companies use our platform to ship faster and more reliably.'
      },
      {
        id: 'upgrade-cta',
        role: 'cta',
        label: 'Start your free trial',
        text: 'No credit card required. Upgrade or cancel any time.'
      },
      {
        id: 'faq-link',
        role: 'meta',
        label: 'Common questions',
        text: 'Billing cycles, plan changes, and refund policy explained.'
      }
    ]
  },
  {
    id: 'recipe-blog',
    label: 'Recipe blog',
    query:
      'Layout a recipe blog post with the recipe itself prominent, supporting narrative, and practical kitchen details.',
    items: [
      {
        id: 'dish-title',
        role: 'title',
        label: 'Miso caramel brownies',
        text: 'Rich dark chocolate brownies with a white miso caramel swirl and flaky salt.'
      },
      {
        id: 'story',
        role: 'body',
        label: 'The backstory',
        text: 'I discovered miso caramel at a tiny bakery in Kyoto and spent two years trying to recreate it.'
      },
      {
        id: 'ingredients',
        role: 'data',
        label: 'Ingredients',
        text: 'Dark chocolate, butter, eggs, sugar, flour, white miso paste, heavy cream, flaky salt.'
      },
      {
        id: 'instructions',
        role: 'data',
        label: 'Instructions',
        text: 'Melt chocolate and butter. Whisk eggs and sugar. Fold together. Swirl miso caramel. Bake at 350F for 25 minutes.'
      },
      {
        id: 'tips',
        role: 'support',
        label: 'Kitchen notes',
        text: 'Use white miso, not red. Let brownies cool completely before cutting for clean edges.'
      },
      {
        id: 'print-btn',
        role: 'cta',
        label: 'Print recipe',
        text: 'Printer-friendly version without the photos and narrative.'
      },
      {
        id: 'nutrition',
        role: 'meta',
        label: 'Nutrition',
        text: 'Approximately 280 calories per serving. Contains dairy, eggs, wheat, and soy.'
      }
    ]
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    query:
      'Build a creative portfolio that balances personal narrative with diverse project types across branding, motion, and editorial.',
    items: [
      {
        id: 'intro',
        role: 'title',
        label: 'Designer and art director',
        text: 'Twelve years of branding, editorial, and motion design for startups and cultural institutions.'
      },
      {
        id: 'branding-project',
        role: 'body',
        label: 'Rebrand for Aleph',
        text: 'Visual identity system spanning wordmark, color, type, and spatial guidelines.'
      },
      {
        id: 'motion-project',
        role: 'body',
        label: 'Festival titles',
        text: 'Animated title sequence for a film festival using generative typography.'
      },
      {
        id: 'editorial-project',
        role: 'body',
        label: 'Magazine layout',
        text: 'Art direction and layout for a quarterly print journal on architecture.'
      },
      {
        id: 'about',
        role: 'support',
        label: 'About',
        text: 'Based in Montreal. Open to freelance, contract, and creative direction roles.'
      },
      {
        id: 'contact',
        role: 'cta',
        label: 'Get in touch',
        text: 'Email, availability calendar, and selected client references.'
      }
    ]
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    query:
      'Arrange a personal dashboard that shows weather, calendar, fitness, news, and finance side by side.',
    items: [
      {
        id: 'weather',
        role: 'data',
        label: 'Weather today',
        text: 'Partly cloudy with a high of 22 degrees and light winds from the northwest.'
      },
      {
        id: 'calendar',
        role: 'data',
        label: 'Next meeting',
        text: 'Product review at 2pm with the design team in room 4B.'
      },
      {
        id: 'fitness',
        role: 'data',
        label: 'Step count',
        text: '7,432 steps today. You need 2,568 more to hit your daily goal.'
      },
      {
        id: 'news',
        role: 'body',
        label: 'Headlines',
        text: 'Global chip shortage eases as new fabrication plants come online in Arizona.'
      },
      {
        id: 'stocks',
        role: 'data',
        label: 'Portfolio',
        text: 'S&P 500 up 0.3%. Your watchlist: AAPL +1.2%, TSLA -0.8%.'
      },
      {
        id: 'greeting',
        role: 'title',
        label: 'Good morning',
        text: 'Monday, March 29. You have four meetings and two deadlines.'
      }
    ]
  },
  {
    id: 'restaurant',
    label: 'Restaurant',
    query:
      'Design a restaurant website with the menu, ambiance photos, reservation system, and location details.',
    items: [
      {
        id: 'hero',
        role: 'title',
        label: 'Seasonal tasting menu',
        text: 'Seven courses inspired by the maritime terroir of Prince Edward Island.'
      },
      {
        id: 'starters',
        role: 'data',
        label: 'First courses',
        text: 'Oysters with mignonette. Smoked mackerel rillettes. Beet tartare with horseradish cream.'
      },
      {
        id: 'mains',
        role: 'data',
        label: 'Main courses',
        text: 'Pan-seared halibut with saffron beurre blanc. Braised lamb shoulder with root vegetables.'
      },
      {
        id: 'wine',
        role: 'support',
        label: 'Wine pairings',
        text: 'Optional five-glass pairing selected by our sommelier to complement each course.'
      },
      {
        id: 'reservation',
        role: 'cta',
        label: 'Reserve a table',
        text: 'Book online for parties of 2 to 8. Private dining available for larger groups.'
      },
      {
        id: 'hours',
        role: 'meta',
        label: 'Hours and location',
        text: 'Wednesday through Sunday, 5pm to 10pm. 142 Richmond Street, Charlottetown.'
      }
    ]
  }
];
