import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const tags = [
  'Sprint Planning', 'Kanban Boards', 'Task Tracking',
  'Team Chat', 'AI Insights', 'Time Tracking',
  'Milestones', 'Reports', 'Integrations'
];

const WordRevealDesktop = ({ text }) => {
  const containerRef = useRef(null);
  const words = text.split(' ');

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const SCROLL_END = 0.7;

  return (
    <section className="mx-auto pt-[30vh] pb-[35vh] max-w-340 mb-12 px-4 sm:px-6">
      <div ref={containerRef} className="relative mx-auto text-[25px] font-semibold">
        <div className="absolute inset-0 flex flex-wrap justify-start pointer-events-none select-none">
          {words.map((word, i) => (
            <span key={`bg-${i}`} className="mr-2 text-gray-400/20">{word}</span>
          ))}
        </div>
        <div className="relative flex flex-wrap justify-start">
          {words.map((word, i) => {
            const start = (i / words.length) * SCROLL_END;
            const end = ((i + 1) / words.length) * SCROLL_END;
            const opacity = useTransform(scrollYProgress, [start, end], [0, 1]);
            const x = useTransform(scrollYProgress, [start, end], [-2, 0]);
            return (
              <motion.span key={i} style={{ opacity, x }} className="inline-block mr-2 text-orange-600">
                {word}
              </motion.span>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const WordRevealMobile = ({ text, index }) => {
  const words = text.split(' ');

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay: index * 0.15, ease: 'easeOut' }}
      className="mx-auto py-8 px-4 sm:px-6"
    >
      <div className="relative mx-auto text-[22px] sm:text-[25px] font-semibold">
        <div className="flex flex-wrap justify-start">
          {words.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: (index * 0.15) + (i * 0.04), ease: 'easeOut' }}
              className="inline-block mr-2 text-orange-600"
            >
              {word}
            </motion.span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const Words = () => {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mq.matches);
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const descriptions = [
    "Collabora8r streamlines team collaboration with real-time updates task management and seamless communication. Manage projects efficiently track progress dynamically and build stronger teams together.",
    "Real-time synchronization ensures all team members stay connected and informed instantly. Get instant notifications for task updates project changes and team activities keeping everyone on the same page always.",
    "Empower your teams to achieve more with less friction and maximum impact. Boost productivity reduce bottlenecks and deliver projects faster with intelligent project management and collaboration tools."
  ];

  return (
    <div className="max-w-340 mx-auto relative w-full px-4 sm:px-6">
      <div className="flex md:flex-row flex-col">
        <div className="md:sticky md:top-0 md:h-screen md:w-1/2 w-full flex flex-col justify-center p-6 sm:p-8 md:p-14 mb-25 sm:mb-0 z-10 bg-white">
          <div className="mb-6">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-4">
              <rect x="4" y="4" width="40" height="40" rx="12" fill="#FFF7ED" stroke="#EA580C" strokeWidth="2" />
              <path d="M16 24L22 30L32 18" stroke="#EA580C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="38" cy="10" r="3" fill="#EA580C" />
              <circle cx="10" cy="38" r="2" fill="#F97316" />
            </svg>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-50 border border-orange-300 text-orange-600 text-xs font-bold rounded-full w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-600" />
              Why Choose Us
            </span>
          </div>

          <div className="relative mb-6">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -left-2 -top-2 opacity-20">
              <path d="M18 2L22 14L34 14L24 22L28 34L18 26L8 34L12 22L2 14L14 14L18 2Z" fill="#EA580C" />
            </svg>
            <h2 className="font-black text-[30px] md:text-[45px] text-gray-900 leading-[1.05]">
              Everything your team needs to{' '}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-600 to-orange-500">ship faster</span>
            </h2>
          </div>

          <p className="text-sm md:text-[15px] text-gray-600 leading-relaxed mb-8 font-medium">
            From task assignment and real-time updates to comprehensive analytics. 
            Built for teams of all sizes, it reduces friction and maximizes productivity.
          </p>

          <div className="flex flex-wrap gap-2 mb-8">
            {tags.map((tag) => (
              <span key={tag} className="px-3 py-1.5 bg-white border border-orange-200 text-orange-700 text-xs font-bold rounded-full hover:bg-orange-50 hover:border-orange-400 transition-colors">
                {tag}
              </span>
            ))}
          </div>

          <button className="w-fit bg-orange-600 hover:bg-orange-700 rounded-full py-3.5 px-10 font-bold text-sm text-white transition-all shadow-lg shadow-orange-600/20 hover:shadow-xl">
            Explore Features
          </button>
        </div>

        <div className="w-full md:w-1/2">
          {isDesktop
            ? descriptions.map((desc, index) => <WordRevealDesktop key={index} text={desc} />)
            : descriptions.map((desc, index) => <WordRevealMobile key={index} text={desc} index={index} />)
          }
        </div>
      </div>
    </div>
  );
};

export default Words;
