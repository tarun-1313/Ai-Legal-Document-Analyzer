import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FileText, BarChart2, MessageSquare, Shield, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: FileText },
    { name: 'Intelligence', path: '/chat', icon: MessageSquare },
    { name: 'Analytics', path: '/analytics', icon: BarChart2 },
  ];

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <nav className="bg-dark/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center space-x-2">
        <Link to="/" className="flex items-center space-x-2">
          <div className="p-1.5 bg-primary/20 rounded-lg">
            <Shield className="text-primary w-6 h-6" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">LegalAI</span>
        </Link>
      </div>
      
      {user && (
        <div className="hidden md:flex bg-white/5 rounded-full p-1 border border-white/10">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                location.pathname === item.path 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <item.icon size={16} />
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
      )}

      <div className="flex items-center space-x-4">
        {user ? (
          <>
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Logged in as</span>
              <span className="text-sm font-medium text-white">{user.name}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-2 bg-white/5 text-white hover:bg-red-500/10 hover:text-red-400 px-4 py-2 rounded-xl text-sm font-medium border border-white/10 hover:border-red-500/20 transition-all"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </>
        ) : (
          <Link 
            to="/auth"
            className="flex items-center space-x-2 bg-primary text-white hover:bg-primary/90 px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all"
          >
            <LogIn size={16} />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
