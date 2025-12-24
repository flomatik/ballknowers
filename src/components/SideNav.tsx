import type { Player } from '@/types'

interface SideNavProps {
  currentPage: 'draft' | 'standings'
  onNavigate: (page: 'draft' | 'standings') => void
  players: Player[]
  isOpen: boolean
  onClose: () => void
}

export default function SideNav({ currentPage, onNavigate, players, isOpen, onClose }: SideNavProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 text-gray-400 hover:text-white z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="p-6">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-white mb-1">
            NFL Pick'em
          </h1>
          <p className="text-xs text-gray-400">2025 Season</p>
        </div>
        
        <nav className="space-y-1">
          <button
            onClick={() => onNavigate('draft')}
            className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-3 text-sm font-medium ${
              currentPage === 'draft'
                ? 'bg-gray-800 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>Draft</span>
          </button>
          
          <button
            onClick={() => onNavigate('standings')}
            className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-3 text-sm font-medium ${
              currentPage === 'standings'
                ? 'bg-gray-800 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Standings</span>
          </button>
        </nav>
        
        <div className="mt-8 pt-6 border-t border-gray-700">
          <div className="text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Players</div>
          <div className="text-lg font-semibold text-white">{players.length} <span className="text-gray-400 font-normal">/ 10</span></div>
        </div>
      </div>
    </div>
    </>
  )
}

