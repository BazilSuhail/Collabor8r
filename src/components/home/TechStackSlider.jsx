import { motion } from "motion/react"
import {
  SiReact, SiNextdotjs, SiTypescript, SiTailwindcss, SiNodedotjs,
  SiPython, SiDocker, SiPostgresql, SiRedis, SiFigma,
  SiGraphql, SiMongodb, SiGit
} from "react-icons/si"
import { BsAmazon } from "react-icons/bs"
import { FiLayers } from "react-icons/fi"

const icons = [
  SiReact, SiNextdotjs, SiTypescript, SiTailwindcss, SiNodedotjs,
  SiPython, SiDocker, SiPostgresql, SiRedis, SiFigma,
  SiGraphql, SiMongodb, BsAmazon, SiGit,
]

export default function TechStackSlider() {
  return (
    <section className="max-w-325 overflow-x-hidden mx-4 sm:mx-auto mb-10 px-4 py-8 sm:py-16 bg-[#F4F4F4] rounded-[24px] sm:rounded-[45px]">
      
        <div className="inline-flex items-center gap-2 px-5 mb-4 py-2 bg-white border-2 border-black rounded-full">
          <FiLayers size={14} className="text-[#FF4D24]" />
          <span className="text-xs font-bold text-black uppercase tracking-[0.15em]">Powered by</span>
          <span className="w-2 h-2 rounded-full bg-[#FF4D24]" />
        </div>
      
      <div className="relative">
        <motion.div
          className="flex gap-10 sm:gap-20 items-center"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
        >
          {[...icons, ...icons].map((Icon, i) => (
            <div key={i} className="shrink-0 flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-white border-2 border-black/10 rounded-xl sm:rounded-2xl hover:border-[#FF4D24] transition-colors duration-300">
              <Icon className="text-[#FF4D24] w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
