import { useEffect, useRef } from "react";
import {
  RiTeamLine, RiProjectorLine, RiTaskLine, RiTimeLine,
  RiShieldCheckLine, RiCustomerServiceLine
} from "react-icons/ri";

const cardIcons = [
  RiProjectorLine, RiTeamLine, RiTaskLine,
  RiTimeLine, RiShieldCheckLine, RiCustomerServiceLine
];

const Card = ({ data = [] }) => {
  const cardsContainerRef = useRef(null);

  useEffect(() => {
    const cardsContainer = cardsContainerRef.current;
    if (!cardsContainer) return;

    const cards = cardsContainer.querySelectorAll(".stack-card");
    const parentContainer = cardsContainer.closest(".stats-scroll");

    const rotateCards = () => {
      cards.forEach((card, index) => {
        if (card.classList.contains("card-away")) {
          const dir = index % 3;
          let transform = '';
          if (dir === 0) {
            transform = `translateY(-150vh)`;
          } else if (dir === 1) {
            transform = `translateX(150vh)`;
          } else {
            transform = `translateY(150vh)`;
          }
          card.style.transform = transform;
        } else {
          card.style.transform = 'none';
          card.style.zIndex = cards.length - index;
        }
      });
    };

    const handleScroll = () => {
      if (!parentContainer) return;
      const distance = window.innerHeight * 0.5;
      const topVal = parentContainer.getBoundingClientRect().top;
      let index = -1 * (topVal / distance + 1);
      index = Math.floor(index);

      cards.forEach((card, i) => {
        if (i <= index) {
          card.classList.add("card-away");
        } else {
          card.classList.remove("card-away");
        }
      });
      rotateCards();
    };

    rotateCards();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [data]);

  return (
    <div ref={cardsContainerRef} className="block">
      {data.map((card, index) => {
        const Icon = cardIcons[index % cardIcons.length];
        return (
          <div key={index}
            className={`
              stack-card mx-auto z-100 self-center mb-2.5 absolute left-[5%] md:left-[10%]
              transition-all duration-500 ease-in-out box-border p-5 md:p-7 flex flex-col
              justify-between ${
              index % 2 === 0
                ? 'bg-orange-600 text-white'
                : 'bg-orange-50 text-gray-900 border border-orange-200'
            }
              stack-card z-100
              w-[90%] md:w-[80%]
              h-72 md:h-72 lg:h-96 top-[2vh] md:top-[25vh] rounded-[20px] md:rounded-[25px]
            `}
          >
            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
              <Icon className="text-[22px] md:text-[32px]" />
              <div className="text-[18px] md:text-[30px] font-bold">{card.sub}</div>
            </div>
            <p className={`text-[11px] md:text-sm leading-relaxed font-medium line-clamp-3 ${
              index % 2 === 0 ? 'text-white/90' : 'text-gray-600'
            }`}>
              {card.desc}
            </p>
            <div className="font-poppins mt-auto font-bold text-[44px] md:text-[80px] mb-4 leading-13">
              {card.content}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const StatsSection = () => {
  const statsData = [
    { sub: "Active Projects", content: "1000+", desc: "Organizations collaborating and managing projects seamlessly on Collabora8r every single day, building stronger teams and delivering better results" },
    { sub: "Team Members", content: "50K+", desc: "Professionals worldwide working together collaboratively to achieve ambitious project goals, milestones, and deliver exceptional value to their organizations" },
    { sub: "Tasks Managed", content: "500K+", desc: "Tasks meticulously created, assigned, tracked and successfully completed across thousands of projects with precision and transparency" },
    { sub: "Real-time Updates", content: "24/7", desc: "Instant notifications and live updates keeping teams perfectly synchronized, informed and connected no matter where they are located globally" },
    { sub: "Uptime Guarantee", content: "99.9%", desc: "Highly reliable and stable infrastructure ensuring your critical projects are always accessible and running smoothly without interruptions" },
    { sub: "Support Teams", content: "24/7", desc: "Dedicated, responsive support specialists available round-the-clock providing immediate assistance and solutions for any challenges you encounter" },
  ];

  return (
    <div className="stats-scroll max-w-340 mx-auto overflow-clip relative w-full transition-colors duration-300 h-[300vh] md:h-[400vh]">
      <div className="sticky top-0 h-screen flex flex-col md:block">
        <div className="w-full grid grid-cols-1 md:grid-cols-2 auto-rows-fr h-full items-start md:items-center px-4 sm:px-6 md:px-0">
          <div className="w-full place-content-center h-full p-4 sm:p-6 md:p-12 lg:p-16">
            <span className="inline-block px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-[11px] md:text-sm font-bold mb-2 md:mb-4 border border-orange-200">
              By the Numbers
            </span>
            <h2 className="text-3xl md:text-5xl font-black  text-gray-800  leading-tight mb-1 md:mb-6">
              Built for teams that
              <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-600 to-orange-500"> ship</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-[13px] sm:text-sm md:text-base leading-relaxed mb-2 md:mb-8 ">
              From startups to enterprises, thousands of teams trust Collabora8r to manage their most important projects.
            </p>
            <div className="grid grid-cols-2 gap-1 sm:gap-3 md:gap-4">
              {[
                { label: "99.9% Uptime", icon: RiShieldCheckLine },
                { label: "24/7 Support", icon: RiCustomerServiceLine },
                { label: "50+ Integrations", icon: RiTaskLine },
                { label: "Global Teams", icon: RiTeamLine },
              ].map(({ label, icon: Icon }) => (
                <div key={label} className="flex items-center gap-1.5 md:gap-3 p-2 md:p-3 rounded-xl bg-orange-50 dark:bg-[#151515] border border-orange-100 dark:border-[#1a1a1a]">
                  <div className="w-6 h-6 md:w-9 md:h-9 rounded-lg bg-orange-600 flex items-center justify-center shrink-0">
                    <Icon className="text-white text-sm md:text-lg" />
                  </div>
                  <span className="text-[10px] md:text-sm font-bold text-gray-900 dark:text-white">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative w-full h-full">
            <Card data={statsData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsSection;
