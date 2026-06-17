import React from 'react';
import { Search, Bell } from 'lucide-react';

const Header = ({ activePage }) => {
  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-orange-100 px-8 py-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
      <h2 className="text-xl font-bold text-slate-800 capitalize">{activePage}</h2>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-2 top-2.5" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-4 py-2 bg-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <Bell className="w-5 h-5 text-slate-400 cursor-pointer hover:text-orange-500 transition-colors" />
        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center font-bold text-white border border-orange-600 text-sm shadow-md">
          RS
        </div>
      </div>
    </header>
  );
};

export default Header;
