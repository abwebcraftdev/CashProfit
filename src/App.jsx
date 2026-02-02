import React, { useState, useEffect } from 'react';
import { Plus, X, LayoutDashboard } from 'lucide-react';
import Dashboard from './components/Dashboard';
import SimulationView from './components/SimulationView';
import UpdateModal from './components/UpdateModal';
import clsx from 'clsx';

export default function App() {
  const [simulations, setSimulations] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or simId
  const [contextMenu, setContextMenu] = useState(null);

  useEffect(() => {
    loadSimulations();
    // Close context menu on click outside
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const loadSimulations = async () => {
    try {
      const keys = await window.storage.list('sim:');
      if (keys && keys.keys.length > 0) {
        const loadedSims = [];
        for (const key of keys.keys) {
          try {
            const result = await window.storage.get(key);
            if (result && result.value) {
              loadedSims.push(JSON.parse(result.value));
            }
          } catch (err) {
            console.log('Clé non trouvée:', key);
          }
        }
        setSimulations(loadedSims);
      }
    } catch (error) {
      console.log('Erreur chargement:', error);
    }
  };

  const createNewSimulation = () => {
    const newSim = {
      id: Date.now(),
      name: `Simulation ${simulations.length + 1}`,
      isTest: false,
      services: [{
        id: 1,
        name: '',
        price: 0,
        quantity: 0,
        frequency: 'mois',
        params: {
          socialChargesRate: 25 // Par défaut 25%
        }
      }],
      params: {}
    };
    const updatedSims = [...simulations, newSim];
    setSimulations(updatedSims);
    setActiveTab(newSim.id);
    saveSimulation(newSim);
  };

  const saveSimulation = async (sim) => {
    try {
      await window.storage.set(`sim:${sim.id}`, JSON.stringify(sim));
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    }
  };

  const deleteSimulation = async (simId) => {
    if (!simId) {
      console.warn('Tentative de suppression avec simId invalide:', simId);
      return;
    }

    // Convertir en string pour être sûr
    const simIdStr = String(simId);

    try {
      // Supprimer de la liste d'abord pour une mise à jour immédiate de l'UI
      const updatedSims = simulations.filter(s => s.id !== simId);
      setSimulations(updatedSims);

      // Changer d'onglet si nécessaire
      if (activeTab === simId) {
        setActiveTab('dashboard');
      }

      // Supprimer du storage
      const storageKey = `sim:${simIdStr}`;
      await window.storage.delete(storageKey);
    } catch (error) {
      console.error('Erreur suppression:', error);
      // Recharger les simulations en cas d'erreur pour restaurer l'état
      loadSimulations();
    }
  };

  const updateSimulation = (simId, updates) => {
    const updatedSims = simulations.map(s =>
      s.id === simId ? { ...s, ...updates } : s
    );
    setSimulations(updatedSims);
    const currentSim = updatedSims.find(s => s.id === simId);
    if (currentSim) saveSimulation(currentSim);
  };

  const handleContextMenu = (e, simId) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      simId
    });
  };

  const toggleTestMode = (simId) => {
    const sim = simulations.find(s => s.id === simId);
    if (sim) {
      updateSimulation(simId, { isTest: !sim.isTest });
    }
  };

  const activeSim = simulations.find(s => s.id === activeTab);

  const handleDuplicateToOtherSimulation = (service, targetSimId) => {
    if (!service || !targetSimId) return;

    const targetSim = simulations.find(s => s.id === targetSimId);
    if (!targetSim) return;

    // Deep clone the service avec un nouvel ID
    const duplicatedService = {
      ...JSON.parse(JSON.stringify(service)),
      id: Date.now(),
      name: `${service.name} (copie)`
    };

    // Ajouter le service dupliqué à la simulation cible
    const updatedTargetServices = [...targetSim.services, duplicatedService];
    updateSimulation(targetSimId, { services: updatedTargetServices });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header / Tabs - Glassmorphism */}
      <div className="glass-strong pt-2 px-4 flex items-end gap-2 overflow-x-auto">
        {/* Dashboard Tab */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 rounded-t-lg transition font-medium text-sm cursor-pointer",
            activeTab === 'dashboard'
              ? "glass-strong text-white shadow-lg"
              : "glass-light text-white/70 hover:text-white hover:bg-white/10"
          )}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </button>

        {/* Simulation Tabs */}
        {simulations.map((sim) => (
          <div
            key={sim.id}
            onContextMenu={(e) => handleContextMenu(e, sim.id)}
            onClick={() => setActiveTab(sim.id)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-t-lg cursor-pointer transition group relative",
              activeTab === sim.id
                ? "glass-strong text-white shadow-lg"
                : "glass-light text-white/70 hover:text-white hover:bg-white/10"
            )}
          >
            <input
              type="text"
              value={sim.name}
              onChange={(e) => updateSimulation(sim.id, { name: e.target.value })}
              className="bg-transparent outline-none font-medium text-sm w-32 text-white placeholder-white/50"
            />
            {sim.isTest && (
              <span className="text-[10px] bg-amber-500/30 text-amber-200 px-1.5 py-0.5 rounded border border-amber-400/30">
                TEST
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                deleteSimulation(sim.id);
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded transition cursor-pointer"
              title="Supprimer cette simulation"
            >
              <X className="w-3 h-3 text-white/70" />
            </button>
          </div>
        ))}

        <button
          onClick={createNewSimulation}
          className="p-2 mb-1 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
          title="Nouvelle simulation"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'dashboard' ? (
          <Dashboard simulations={simulations} />
        ) : activeSim ? (
          <SimulationView
            simulation={activeSim}
            updateSimulation={(updates) => updateSimulation(activeSim.id, updates)}
            simulations={simulations}
            currentSimId={activeSim.id}
            onDuplicateToOtherSimulation={handleDuplicateToOtherSimulation}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-white/60">
            Simulation introuvable
          </div>
        )}
      </div>

      {/* Context Menu - Glassmorphism */}
      {contextMenu && (
        <div
          className="fixed glass-strong rounded-lg py-1 z-50 w-48 shadow-xl"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={() => toggleTestMode(contextMenu.simId)}
            className="w-full text-left px-4 py-2 text-sm text-white/90 hover:bg-white/10 transition cursor-pointer"
          >
            {simulations.find(s => s.id === contextMenu.simId)?.isTest
              ? "Marquer comme Reel"
              : "Marquer comme Test (Exclure du Dashboard)"}
          </button>
          <button
            onClick={() => deleteSimulation(contextMenu.simId)}
            className="w-full text-left px-4 py-2 text-sm text-red-300 hover:bg-red-500/20 transition cursor-pointer"
          >
            Supprimer
          </button>
        </div>
      )}

      {/* Update Modal */}
      <UpdateModal />
    </div>
  );
}
