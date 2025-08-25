// Central pricing configuration for PaperLM
export interface PricingBreakdown {
  baseAmount: number;
  currency: 'USD' | 'INR';
  fees: {
    name: string;
    amount: number;
    percentage?: number;
    description: string;
  }[];
  total: number;
}

export interface PlanConfig {
  id: string;
  name: string;
  description: string;
  isPopular?: boolean;
  pricing: {
    usd: PricingBreakdown;
    inr: PricingBreakdown;
  };
  features: string[];
  limits: {
    documents: number | 'unlimited';
    messages: number | 'unlimited';
  };
  buttonText: string;
  ctaLink: string;
}

// Current exchange rate and fee structure (update as needed)
// const EXCHANGE_RATE = 84; // 1 USD = 84 INR (approximate)
const USD_TO_INR_BASE_RATE = 83.5; // Base rate before fees

// Fee calculations for INR payments
const calculateINRFees = (usdAmount: number) => {
  const baseINR = usdAmount * USD_TO_INR_BASE_RATE;
  
  // Indian payment gateway fees and charges
  const forexMarkup = baseINR * 0.035; // 3.5% forex markup
  const paymentGatewayFee = baseINR * 0.02; // 2% payment gateway fee
  const gst = (baseINR + forexMarkup + paymentGatewayFee) * 0.18; // 18% GST
  const cessAndTax = (baseINR + forexMarkup + paymentGatewayFee + gst) * 0.005; // 0.5% cess
  
  return {
    baseINR: Math.round(baseINR),
    fees: [
      {
        name: 'Base Amount',
        amount: Math.round(baseINR),
        description: `$${usdAmount} at ₹${USD_TO_INR_BASE_RATE}/USD`
      },
      {
        name: 'Forex Markup',
        amount: Math.round(forexMarkup),
        percentage: 3.5,
        description: 'Foreign exchange conversion fee'
      },
      {
        name: 'Payment Gateway',
        amount: Math.round(paymentGatewayFee),
        percentage: 2.0,
        description: 'Payment processing fee'
      },
      {
        name: 'GST',
        amount: Math.round(gst),
        percentage: 18.0,
        description: 'Goods and Services Tax'
      },
      {
        name: 'Cess & Tax',
        amount: Math.round(cessAndTax),
        percentage: 0.5,
        description: 'Additional cess and regulatory fees'
      }
    ],
    total: Math.round(baseINR + forexMarkup + paymentGatewayFee + gst + cessAndTax)
  };
};

// Define pricing plans
export const PRICING_PLANS: PlanConfig[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for trying out PaperLM',
    pricing: {
      usd: {
        baseAmount: 0,
        currency: 'USD',
        fees: [],
        total: 0
      },
      inr: {
        baseAmount: 0,
        currency: 'INR',
        fees: [],
        total: 0
      }
    },
    features: [
      'Smart document parsing & analysis',
      'AI-powered chat interface',
      'Source citations included',
      'Basic document summaries'
    ],
    limits: {
      documents: 2,
      messages: 10
    },
    buttonText: 'Start for free',
    ctaLink: '/sign-up'
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For researchers and professionals',
    isPopular: true,
    pricing: {
      usd: {
        baseAmount: 5,
        currency: 'USD',
        fees: [],
        total: 5
      },
      inr: (() => {
        const inrCalc = calculateINRFees(5);
        return {
          baseAmount: inrCalc.baseINR,
          currency: 'INR' as const,
          fees: inrCalc.fees,
          total: inrCalc.total
        };
      })()
    },
    features: [
      'Unlimited document uploads',
      'Unlimited chat conversations',
      'Advanced AI-powered analysis',
      'Advanced automated note generation',
      'Document history & workspace sync',
      'Priority customer support'
    ],
    limits: {
      documents: 'unlimited',
      messages: 'unlimited'
    },
    buttonText: 'Upgrade to Pro',
    ctaLink: '/sign-up'
  }
];

// Usage limits for backend validation
export const USAGE_LIMITS = {
  free: {
    documents: 2,
    messages: 10
  },
  pro: {
    documents: -1, // -1 represents unlimited
    messages: -1   // -1 represents unlimited
  }
} as const;

// Pricing display configuration
export const PRICING_CONFIG = {
  showINRBreakdown: true,
  currency: {
    usd: {
      symbol: '$',
      code: 'USD'
    },
    inr: {
      symbol: '₹',
      code: 'INR'
    }
  },
  paymentNotes: [
    'All plans include data encryption, secure processing, and GDPR compliance',
    'Pro plan is non-recurring and requires manual renewal after expiry',
    'INR pricing includes all applicable fees and taxes'
  ]
} as const;

// Helper functions
export const getPlanById = (id: string): PlanConfig | undefined => {
  return PRICING_PLANS.find(plan => plan.id === id);
};

export const getFreePlanLimits = () => USAGE_LIMITS.free;
export const getProPlanLimits = () => USAGE_LIMITS.pro;