import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { useAuth } from './hooks/useAuth';
import { useOrders, useCreateOrder, useUpdateOrder, usePatchOrder, useDeleteOrder } from './hooks/useOrders';
import { useSettings, useUpdateSettings } from './hooks/useSettings';
import { useToast } from './hooks/useToast';
import { useSelectionMode } from './hooks/useSelectionMode';
import { CONFIG } from './lib/config';
import { advanceStage, cyclePayment, todayStats, stageLabel, payLabel } from './lib/domain';
import { formatExport } from './lib/export';
import { BASE } from './api/client';
import LogoIcon from './components/LogoIcon';
import AuthPrompt from './components/AuthPrompt';
import StatsBar from './components/StatsBar';
import CraftQueue from './components/CraftQueue';
import DaysView from './components/DaysView';
import BoardView from './components/BoardView';
import OrderSheet from './components/OrderSheet';
import SettingsSheet from './components/SettingsSheet';
import Toast from './components/Toast';
import OnboardingGuide from './components/OnboardingGuide';
import BulkActionBar from './components/BulkActionBar';
import ErrorBoundary from './components/ErrorBoundary';
import type { ViewMode, Order } from './types';

function AuthGate() {
  const auth = useAuth();

  if (!auth.authenticated) {
    return (
      <div className="max-w-[540px] mx-auto px-4 pb-24">
        <AuthPrompt onLogin={auth.login} onRegister={auth.register} />
      </div>
    );
  }

  return <MainApp auth={auth} />;
}

function MainApp({ auth: { username, logout } }: { auth: ReturnType<typeof useAuth> }) {
  const { data: orders = [], isLoading: ordersLoading, isError: ordersError } = useOrders();
  const { data: settings, isLoading: settingsLoading } = useSettings();

  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder();
  const patchOrder = usePatchOrder();
  const deleteOrder = useDeleteOrder();
  const updateSettings = useUpdateSettings();

  const [view, setView] = useState<ViewMode>('days');
  const [showOrderSheet, setShowOrderSheet] = useState(false);
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [deletedOrder, setDeletedOrder] = useState<Order | null>(null);

  const selection = useSelectionMode();
  const { toast, closeToast, toastState } = useToast();

  if (ordersLoading || settingsLoading) {
    return (
      <div className="max-w-[540px] mx-auto px-4 pb-24">
        <div className="animate-pulse space-y-4 pt-16">
          <div className="h-4 bg-line/30 rounded w-1/3" />
          <div className="h-8 bg-line/30 rounded w-2/3" />
          <div className="h-20 bg-line/20 rounded-xl" />
          <div className="h-20 bg-line/20 rounded-xl" />
        </div>
      </div>
    );
  }

  if (ordersError) {
    return (
      <div className="max-w-[540px] mx-auto px-4 py-16 text-center">
        <p className="font-mono text-[12px] text-g3 mb-2">Gagal memuat data</p>
        <p className="font-mono text-[11px] text-soft/60 mb-4">Periksa koneksi dan coba lagi</p>
        <button
          className="bg-pop text-[#1a0a12] border-0 rounded-xl px-6 py-3 font-display font-semibold text-[14px] cursor-pointer"
          onClick={() => window.location.reload()}
        >
          Muat Ulang
        </button>
      </div>
    );
  }

  const stats = todayStats(orders, settings);
  const curSettings = settings ?? { cap: CONFIG.DEFAULT_CAP, lead: CONFIG.DEFAULT_LEAD, designs: [], icon: CONFIG.DEFAULT_ICON };

  function handleNewOrder() {
    setEditingOrder(null);
    setShowOrderSheet(true);
  }

  function handleEditOrder(order: Order) {
    setEditingOrder(order);
    setShowOrderSheet(true);
  }

  async function handleSaveOrder(data: Partial<Order>, isEdit: boolean) {
    if (isEdit && editingOrder) {
      updateOrder.mutate({ id: editingOrder.id, data }, {
        onSuccess: () => toast('Pesanan diperbarui', 'success'),
        onError: (e) => toast(e.message, 'error'),
      });
    } else {
      createOrder.mutate(data, {
        onSuccess: () => toast('Pesanan ditambahkan', 'success'),
        onError: (e) => toast(e.message, 'error'),
      });
    }

    if (data.design && !(curSettings.designs || []).some((d) => d.name.toLowerCase() === data.design!.toLowerCase())) {
      const newDesigns = [{ name: data.design, eff: data.eff || 'Med', price: data.price || 0 }, ...(curSettings.designs || [])].slice(0, CONFIG.MAX_DESIGN_PRESETS);
      updateSettings.mutate({ designs: newDesigns });
    }
  }

  function handleDeleteOrder(id: string) {
    const deleted = orders.find((o) => o.id === id);
    if (deleted) setDeletedOrder(deleted);
    setShowOrderSheet(false);
    setEditingOrder(null);
    deleteOrder.mutate(id, {
      onSuccess: () => {
        toast('Pesanan dihapus', 'success', { label: 'Batalkan', onClick: handleUndoDelete });
      },
    });
  }

  function handleUndoDelete() {
    if (!deletedOrder) return;
    createOrder.mutate(deletedOrder as unknown as Partial<Order>, {
      onSuccess: () => toast('Pesanan dikembalikan', 'success'),
    });
    setDeletedOrder(null);
  }

  function handleStageChange(id: string) {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    const newStage = advanceStage(order.stage, order.pay);
    if (newStage === null) {
      toast('Pesanan harus Lunas sebelum Selesai', 'error');
      return;
    }
    if (newStage === order.stage) return;
    patchOrder.mutate({ id, data: { stage: newStage } }, {
      onSuccess: () => toast(`Pindah ke ${stageLabel(newStage)}`, 'success'),
    });
  }

  function handlePayCycle(id: string) {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    const newPay = cyclePayment(order.pay);
    patchOrder.mutate({ id, data: { pay: newPay } }, {
      onSuccess: () => toast(`Pembayaran: ${payLabel(newPay)}`, 'success'),
    });
  }

  function handleSaveSettings(data: Partial<typeof curSettings>) {
    updateSettings.mutate(data, {
      onSuccess: () => toast('Pengaturan disimpan', 'success'),
    });
  }

  function handleBulkAdvance() {
    const ids = Array.from(selection.selected);
    const targets = orders.filter((o) => ids.includes(o.id));
    let advanced = 0;
    let skipped = 0;

    for (const order of targets) {
      const newStage = advanceStage(order.stage, order.pay);
      if (newStage === null || newStage === order.stage) {
        skipped++;
        continue;
      }
      advanced++;
      updateOrder.mutate({ id: order.id, data: { stage: newStage } });
    }

    if (advanced > 0 && skipped > 0) {
      toast(`${advanced} dilanjutkan, ${skipped} dilewati (belum Lunas)`, 'info');
    } else if (advanced > 0) {
      toast(`${advanced} pesanan dilanjutkan`, 'success');
    } else {
      toast('Tidak ada yang bisa dilanjutkan', 'error');
    }
    selection.exit();
  }

  function handleOrderReminder(order: Order) {
    const token = localStorage.getItem('st_auth_token');
    if (!token) {
      toast('Sesi berakhir', 'error');
      return;
    }
    const url = `${BASE}/api/orders/${order.id}/ics?t=${encodeURIComponent(token)}`;
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast('Membuka kalender…', 'info');
  }

  async function handleExport() {
    try {
      const text = formatExport(orders);
      await navigator.clipboard.writeText(text);
      toast('Pesanan disalin', 'success');
    } catch {
      toast('Gagal menyalin', 'error');
    }
  }

  return (
    <div className="max-w-[540px] mx-auto px-4 pb-24">
      <header className="sticky top-0 z-20 bg-bg pt-[max(14px,env(safe-area-inset-top))] border-b border-line">
        <div className="flex items-center justify-between gap-2.5 pb-[11px]">
          <div className="flex items-center gap-2">
            <LogoIcon name={curSettings?.icon || CONFIG.DEFAULT_ICON} />
            <span className="font-display font-bold text-[22px] tracking-[-0.03em]">{username || CONFIG.DEFAULT_NAME}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              className="border border-line2 bg-transparent w-[44px] h-[44px] rounded-lg grid place-items-center text-base cursor-pointer text-ink"
              aria-label="Pengaturan"
              onClick={() => setShowSettingsSheet(true)}
            >
              {'\u2699'}
            </button>
          </div>
        </div>

        <StatsBar todayLoad={stats.todayLoad} queueCount={stats.queueCount} unpaidCount={stats.unpaidCount} />

        <div className="flex border border-line2 rounded-lg overflow-hidden mb-1">
          <button
            className={`flex-1 border-0 py-[9px] font-mono text-[11px] tracking-[0.12em] uppercase cursor-pointer ${view === 'days' ? 'bg-ink text-bg font-semibold' : 'text-ink/65'}`}
            onClick={() => setView('days')}
          >
            Hari
          </button>
          <button
            className={`flex-1 border-0 py-[9px] font-mono text-[11px] tracking-[0.12em] uppercase cursor-pointer ${view === 'board' ? 'bg-ink text-bg font-semibold' : 'text-ink/65'}`}
            onClick={() => setView('board')}
          >
            Papan
          </button>
        </div>
      </header>

      <main>
      <section className="bg-surface border border-line rounded-2xl p-4 pt-4 pb-2 my-4">
        <h2 className="font-display font-bold text-[19px] m-0 tracking-[-0.02em]">Selanjutnya</h2>
        <CraftQueue orders={orders} settings={curSettings} onEditOrder={handleEditOrder} />
      </section>

      <OnboardingGuide
        onOpenSettings={() => setShowSettingsSheet(true)}
        onNewOrder={handleNewOrder}
      />

      {view === 'days' ? (
        <DaysView orders={orders} settings={curSettings} onEditOrder={handleEditOrder} onPayCycle={handlePayCycle} onStageAdvance={handleStageChange} selectionMode={selection.active} selectedIds={selection.selected} onToggleSelect={selection.toggle} onLongPress={selection.enter} />
      ) : (
        <BoardView orders={orders} onStageAdvance={handleStageChange} onPayCycle={handlePayCycle} onEditOrder={handleEditOrder} selectionMode={selection.active} selectedIds={selection.selected} onToggleSelect={selection.toggle} onLongPress={selection.enter} />
      )}

      {selection.active ? (
        <BulkActionBar count={selection.selected.size} onAdvance={handleBulkAdvance} onCancel={selection.exit} />
      ) : (
        <div className="fixed left-0 right-0 bottom-0 z-30 bg-gradient-to-t from-bg via-bg to-transparent pt-3.5 pb-[max(16px,env(safe-area-inset-bottom))] max-w-[540px] mx-auto px-4">
          <button
            className="w-full bg-pop text-[#1a0a12] border-0 rounded-xl py-4 font-display font-bold text-base cursor-pointer tracking-[-0.01em] active:brightness-[0.94]"
            onClick={handleNewOrder}
          >
            + Pesanan baru
          </button>
        </div>
      )}

      {showOrderSheet && (
        <OrderSheet
          order={editingOrder}
          settings={curSettings}
          orders={orders}
          onSave={handleSaveOrder}
          onClose={() => { setShowOrderSheet(false); setEditingOrder(null); }}
          onDelete={handleDeleteOrder}
          onReminder={handleOrderReminder}
        />
      )}

      {showSettingsSheet && (
        <SettingsSheet
          settings={curSettings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettingsSheet(false)}
          onLogout={logout}
          onExport={handleExport}
        />
      )}

      </main>
      <Toast message={toastState.message} type={toastState.type} show={toastState.show} action={toastState.action} onClose={closeToast} />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AuthGate />
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
