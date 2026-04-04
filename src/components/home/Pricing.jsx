import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FiCheck, FiArrowRight, FiZap, FiTarget, FiActivity } from 'react-icons/fi';

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState('monthly');

  const plans = [
    {
      name: "Starter",
      description: "For small teams getting ideas off the ground.",
      priceMonthly: 0,
      priceYearly: 0,
      features: [
        "Up to 5 active projects",
        "Collaborative whiteboard docs",
        "Basic Git integration",
        "100MB storage limit"
      ],
      buttonText: "Start for free",
      accentColor: "bg-[#F4F4F4] text-[#111111] border-2 border-black/5 hover:border-black",
      btnClass: "bg-black text-white hover:bg-neutral-800",
      popular: false
    },
    {
      name: "Pro Pack",
      description: "For scaling teams that need raw speed and power.",
      priceMonthly: 19,
      priceYearly: 15,
      features: [
        "Unlimited active sprints",
        "Advanced CRDT multi-player",
        "Custom logic automation engine",
        "Custom webhooks & integrations",
        "Priority 24/7 support channels",
        "10GB workspace storage"
      ],
      buttonText: "Upgrade to Pro",
      accentColor: "bg-[#FF4D24] text-white",
      btnClass: "bg-white text-black hover:bg-[#FFE500] hover:text-black",
      popular: true
    },
    {
      name: "Enterprise",
      description: "Custom control, security, and dedicated support.",
      priceMonthly: 49,
      priceYearly: 39,
      features: [
        "Everything in Pro Pack",
        "SOC2 Type II compliance",
        "SAML SSO & Advanced IAM",
        "Dedicated database clusters",
        "Custom SLAs & uptime agreements",
        "Unlimited cloud storage"
      ],
      buttonText: "Contact Sales",
      accentColor: "bg-[#0B0B0B] text-white",
      btnClass: "bg-[#FF4D24] text-white hover:bg-[#ff5d38]",
      popular: false
    }
  ];

  return (
    <section className="w-full lg:mt-40 max-w-340 mx-auto p-6 md:p-10 bg-white">
      
      <div className="flex flex-col items-center text-center mb-16">
        <span className="inline-block px-3 py-1 bg-black text-white rounded-full text-xs font-bold mb-4">
          Fair & Simple Pricing
        </span>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#111111] tracking-tight max-w-2xl leading-none">
          No hidden fees. Scale as you expand.
        </h2>
        
        <div className="mt-8 flex items-center bg-[#F4F4F4] p-1.5 rounded-full border border-black/5 relative">
          <button 
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all duration-200 z-10 ${
              billingCycle === 'monthly' ? 'text-white' : 'text-gray-500 hover:text-black'
            }`}
          >
            Billed Monthly
          </button>
          <button 
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all duration-200 z-10 flex items-center gap-1.5 ${
              billingCycle === 'yearly' ? 'text-white' : 'text-gray-500 hover:text-black'
            }`}
          >
            Billed Annually
            <span className="bg-[#FFE500] text-black text-[9px] px-1.5 py-0.5 rounded-full font-extrabold uppercase">
              Save 20%
            </span>
          </button>

          <motion.div 
            className="absolute top-1.5 bottom-1.5 left-1.5 bg-black rounded-full shadow-md"
            layout
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            style={{
              width: billingCycle === 'monthly' ? '125px' : '150px',
              x: billingCycle === 'monthly' ? 0 : '125px'
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {plans.map((plan, index) => (
          <motion.div
            key={index}
            whileHover={{ y: -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`rounded-[2rem] p-6 md:p-10 flex flex-col justify-between min-h-[420px] md:min-h-[500px] relative transition-all duration-200 ${plan.accentColor}`}
          >
            {plan.popular && (
              <div className="absolute top-8 right-8 bg-[#FFE500] text-black text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm uppercase tracking-wider">
                <FiZap size={12} fill="currentColor" /> MOST POPULAR
              </div>
            )}

            <div>
              <div className="mb-8">
                <h3 className="text-2xl md:text-3xl font-black tracking-tight">{plan.name}</h3>
                <p className={`text-sm mt-2 max-w-[240px] leading-relaxed ${plan.popular ? 'text-white/80' : 'text-gray-500'}`}>
                  {plan.description}
                </p>
              </div>

              <div className="mb-8 flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl md:text-6xl font-mono font-extrabold tracking-tighter">
                  ${billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly}
                </span>
                <span className={`text-sm font-semibold ${plan.popular ? 'text-white/70' : 'text-gray-400'}`}>
                  / user / month
                </span>
              </div>

              <hr className={`my-6 border ${plan.popular ? 'border-white/10' : 'border-black/5'}`} />

              <ul className="space-y-4">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm font-semibold">
                    <span className={`p-1 rounded-full shrink-0 ${
                      plan.popular ? 'bg-white/15 text-white' : 'bg-[#FF4D24]/10 text-[#FF4D24]'
                    }`}>
                      <FiCheck size={14} strokeWidth={3} />
                    </span>
                    <span className={plan.popular ? 'text-white/90' : 'text-gray-800'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-10">
              <button className={`w-full py-4 rounded-full font-extrabold flex items-center justify-center gap-2 transition-all duration-200 shadow-sm ${plan.btnClass}`}>
                {plan.buttonText}
                <FiArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

    </section>
  );
}
