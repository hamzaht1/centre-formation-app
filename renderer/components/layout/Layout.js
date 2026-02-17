import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ children }) {
  const [isMobileOpen, setMobileOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      
      {/* Sidebar est fixée (fixed), donc elle ne pousse pas le contenu automatiquement */}
      <Sidebar 
        isOpen={isMobileOpen} 
        setIsOpen={setMobileOpen} 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
      />
      
      {/* 
         CORRECTION ICI : 
         On applique une marge à gauche (ml-64 ou ml-20) sur ce conteneur.
         Cela déplace toute la zone de contenu (Header + Main) pour qu'elle ne soit 
         pas cachée derrière la Sidebar fixe.
         
         La transition 'duration-300' permet le glissement fluide lors du collapse.
      */}
      <div className={`
        flex-1 flex flex-col h-screen overflow-hidden relative 
        transition-all duration-300 ease-in-out
        ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}
      `}>
       
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 relative no-scrollbar">
          {/* 
             On retire le 'pl' conditionnel ici. 
             Le 'container mx-auto' centre le contenu naturellement 
             à l'intérieur de l'espace libéré par la marge du parent.
          */}
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}