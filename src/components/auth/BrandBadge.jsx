const BrandBadge = () => (
  <div className="flex justify-center items-center bg-white py-4 shadow-md rounded-2xl border border-slate-200 w-full gap-2 mb-6">
    <div className="w-7 h-7 bg-[#FF4D24] rounded-lg flex items-center justify-center">
      <img src="/collabor8r.svg" alt="C" className="w-3.5 h-3.5 brightness-0 invert" />
    </div>
    <p className="ml-2 text-[20px] font-bold text-[#111111] tracking-tight">Collabor<span className='text-orange-600'>8</span>r</p>
  </div>
)

export default BrandBadge
