import React from "react";
import { Link } from "react-router-dom";
import {
  HomeIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  CheckCircleIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowRightStartOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

const Sidebar = ({ handleLogout, isCollapsed, toggleSidebar }) => {
  return (
    <div
      className={`bg-gray-900 text-gray-100 flex flex-col h-screen transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* En-tête avec le titre et le bouton toggle */}
      <div className="p-5 flex items-center justify-between">
        <h1
          className={`text-xl font-bold flex items-center gap-2 ${
            isCollapsed ? "hidden" : "text-center"
          }`}
        >
          <ShieldCheckIcon className="h-6 w-6 text-blue-400" />
          {!isCollapsed && "AI Security"}
        </h1>
        <button
          onClick={toggleSidebar}
          className="p-2 bg-gray-700 text-gray-100 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
          aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? (
            <ChevronRightIcon className="h-5 w-5" />
          ) : (
            <ChevronLeftIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="space-y-2 flex-1">
        <Link
          to="/"
          className={`flex items-center p-2 rounded hover:bg-gray-700 transition-colors duration-200 ${
            isCollapsed ? "justify-center" : ""
          }`}
          aria-label="Tableau de bord"
        >
          <HomeIcon className="h-5 w-5 text-blue-400" />
          {!isCollapsed && <span className="ml-3">Dashboard</span>}
        </Link>
        <Link
          to="/generate-policy"
          className={`flex items-center p-2 rounded hover:bg-gray-700 transition-colors duration-200 ${
            isCollapsed ? "justify-center" : ""
          }`}
          aria-label="Génération de Politiques"
        >
          <ShieldCheckIcon className="h-5 w-5 text-blue-400" />
          {!isCollapsed && <span className="ml-3">Génération de Politiques</span>}
        </Link>
        <Link
          to="/scan"
          className={`flex items-center p-2 rounded hover:bg-gray-700 transition-colors duration-200 ${
            isCollapsed ? "justify-center" : ""
          }`}
          aria-label="Analyse de Vulnérabilités"
        >
          <ShieldExclamationIcon className="h-5 w-5 text-blue-400" />
          {!isCollapsed && <span className="ml-3">Analyse de Vulnérabilités</span>}
        </Link>
        <Link
          to="/compliance"
          className={`flex items-center p-2 rounded hover:bg-gray-700 transition-colors duration-200 ${
            isCollapsed ? "justify-center" : ""
          }`}
          aria-label="Validation et Conformité"
        >
          <CheckCircleIcon className="h-5 w-5 text-blue-400" />
          {!isCollapsed && <span className="ml-3">Validation & Conformité</span>}
        </Link>
        <Link
          to="/risks"
          className={`flex items-center p-2 rounded hover:bg-gray-700 transition-colors duration-200 ${
            isCollapsed ? "justify-center" : ""
          }`}
          aria-label="Monitoring des Risques"
        >
          <ChartBarIcon className="h-5 w-5 text-blue-400" />
          {!isCollapsed && <span className="ml-3">Monitoring des Risques</span>}
        </Link>
        <Link
          to="/pricing"
          className={`flex items-center p-2 rounded hover:bg-gray-700 transition-colors duration-200 ${
            isCollapsed ? "justify-center" : ""
          }`}
          aria-label="Tarification"
        >
          <CurrencyDollarIcon className="h-5 w-5 text-blue-400" />
          {!isCollapsed && <span className="ml-3">Tarification</span>}
        </Link>
      </nav>

      {/* Bouton Déconnexion */}
      <button
        onClick={handleLogout}
        className={`flex items-center p-2 w-full rounded hover:bg-red-600 transition-colors duration-200 text-left mt-2 ${
          isCollapsed ? "justify-center" : ""
        }`}
        aria-label="Se déconnecter"
      >
        <ArrowRightStartOnRectangleIcon className="h-5 w-5 text-blue-400" />
        {!isCollapsed && <span className="ml-3">Déconnexion</span>}
      </button>
    </div>
  );
};

export default Sidebar;