import React from 'react'

function App() {
  return (
    <div className="min-h-screen bg-cyberBg flex flex-col items-center justify-center text-white p-5">
      {/* ප්‍රධාන සයිබර්පන්ක් කාඩ් එක */}
      <div className="bg-cyberDark border border-cyberBlue/30 rounded-2xl p-8 max-w-md w-full text-center shadow-[0_0_20px_rgba(0,210,255,0.15)]">
        
        {/* ලෝගෝ එක සහ නම */}
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyberBlue to-purple-500 mb-2 tracking-wide animate-pulse">
          CYBET
        </h1>
        <p className="text-gray-400 text-sm mb-6 uppercase tracking-widest">
          Cyberpunk Dice Casino
        </p>
        
        {/* ස්ටේටස් box එක */}
        <div className="border border-dashed border-cyberBlue/20 rounded-xl p-4 bg-black/40 mb-6">
          <p className="text-xs text-cyberBlue uppercase tracking-widest font-semibold mb-1">Tailwind + PostCSS Status</p>
          <p className="text-xl font-bold text-green-400">100% Working! 🚀</p>
        </div>

        {/* ටෙස්ට් බටන් එක */}
        <button className="w-full bg-gradient-to-r from-cyberBlue to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(0,210,255,0.3)] transform hover:scale-[1.02]">
          Let's Roll the Dice
        </button>
        
      </div>
    </div>
  )
}

export default App