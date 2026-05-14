import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { useAppData } from './hooks/useAppData.js';
import { currentMonth } from './lib/commissions.js';
import Header from './components/Header.jsx';
import Dashboard from './views/Dashboard.jsx';
import Forecast from './views/Forecast.jsx';
import MissionsView from './views/MissionsView.jsx';
import MissionDetail from './views/MissionDetail.jsx';
import InvoiceView from './views/Invoice/InvoiceView.jsx';
import PipelineView from './views/Pipeline/PipelineView.jsx';
import SettingsView from './views/Settings/SettingsView.jsx';
import AuthPage from './views/AuthPage.jsx';
import Modal from './components/Modal.jsx';
import MissionForm from './components/MissionForm.jsx';
import SaleForm from './components/SaleForm.jsx';
import styles from './App.module.css';

function AppInner() {
  const { user, signOut } = useAuth();
  const { missions, sales, loading, addMission, updateMission, deleteMission, addSale, updateSale, deleteSale } = useAppData();
  const [view, setView] = useState('dashboard');
  const [selectedMissionId, setSelectedMissionId] = useState(null);
  const [modal, setModal] = useState(null);

  if (!user) return <AuthPage />;
  if (loading) return <div style={{ minHeight: '100vh', background: '#08080e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Sans, sans-serif' }}>Chargement…</div>;

  const selectedMission = missions.find((m) => m.id === selectedMissionId) ?? null;
  const goView = (next) => { setSelectedMissionId(null); setView(next); };
  const openMission = (id) => { setView('missions'); setSelectedMissionId(id); };

  return (
    <div className={styles.app}>
      <Header view={view} onChangeView={goView} onNewMission={() => setModal({ kind: 'mission' })} user={user} onSignOut={signOut} />
      <main className={styles.main}>
        {view === 'dashboard' && <Dashboard missions={missions} sales={sales} onOpenMission={openMission} />}
        {view === 'forecast'  && <Forecast missions={missions} sales={sales} />}
        {view === 'pipeline'  && <PipelineView missions={missions} />}
        {view === 'invoice'   && <InvoiceView missions={missions} sales={sales} />}
        {view === 'settings'  && <SettingsView />}
        {view === 'missions'  && !selectedMission && <MissionsView missions={missions} sales={sales} onOpen={openMission} onNewMission={() => setModal({ kind: 'mission' })} />}
        {view === 'missions'  && selectedMission && (
          <MissionDetail
            mission={selectedMission}
            sales={sales.filter((s) => s.missionId === selectedMission.id)}
            onBack={() => setSelectedMissionId(null)}
            onAddSale={() => setModal({ kind: 'sale', missionId: selectedMission.id })}
            onEditSale={(sale) => setModal({ kind: 'sale', sale, missionId: sale.missionId })}
            onDeleteSale={deleteSale}
            onEdit={() => setModal({ kind: 'mission', mission: selectedMission })}
            onDelete={async () => { if (confirm('Supprimer cette mission ?')) { await deleteMission(selectedMission.id); setSelectedMissionId(null); } }}
            onToggleStatus={() => updateMission(selectedMission.id, { status: selectedMission.status === 'active' ? 'completed' : 'active' })}
          />
        )}
      </main>
      {modal?.kind === 'mission' && (
        <Modal title={modal.mission ? 'Modifier la mission' : 'Nouvelle mission'} onClose={() => setModal(null)}>
          <MissionForm mission={modal.mission} onSubmit={async (data) => { modal.mission ? await updateMission(modal.mission.id, data) : await addMission(data); setModal(null); }} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {modal?.kind === 'sale' && (
        <Modal title={modal.sale ? 'Modifier la vente' : 'Nouvelle vente'} onClose={() => setModal(null)} size="lg">
          <SaleForm mission={missions.find((m) => m.id === modal.missionId)} sale={modal.sale} defaultMonth={currentMonth()} onSubmit={async (data) => { modal.sale ? await updateSale(modal.sale.id, data) : await addSale({ missionId: modal.missionId, ...data }); setModal(null); }} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}

export default function App() {
  return <AuthProvider><AppInner /></AuthProvider>;
}
