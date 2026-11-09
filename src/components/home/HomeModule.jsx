import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { styles } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../context/I18nContext';
import { ROLES } from '../../constants/roles';

const fmtCLP = (n) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0);

export default function HomeModule() {
  const { profile, isSuperadmin, isAdmin, isConcierge } = useAuth();
  const { showError } = useToast();
  const { t } = useTranslation();

  const role = profile?.role || ROLES.USER;

  // KPIs
  const [kpis, setKpis] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (role === ROLES.SUPERADMIN) {
          await loadSuperadminKpis();
        } else if (role === ROLES.ADMIN) {
          await loadAdminKpis();
        } else if (role === ROLES.CONCIERGE) {
          await loadConciergeKpis();
        } else {
          await loadUserKpis();
        }
      } catch (err) {
        showError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [role, profile]);

  const loadSuperadminKpis = async () => {
    const [companies, condominiums, units] = await Promise.all([
      supabase.from('management_companies').select('id', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('condominiums').select('id', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('units').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    ]);
    setKpis({
      companies: companies.count || 0,
      condominiums: condominiums.count || 0,
      units: units.count || 0,
    });
  };

  const loadAdminKpis = async () => {
    const condoId = profile?.condominium_id;
    if (!condoId) { setKpis({}); return; }
    const [bills, certs, expenses] = await Promise.all([
      supabase.from('unit_expense_bills').select('id, status, balance, units!inner(condominium_id)', { count: 'exact' }).eq('units.condominium_id', condoId).is('deleted_at', null),
      supabase.from('official_certifications').select('id, status', { count: 'exact' }).eq('condominium_id', condoId).is('deleted_at', null),
      supabase.from('expenses').select('amount', { count: 'exact' }).eq('condominium_id', condoId).is('deleted_at', null),
    ]);
    const pendingBills = (bills.data || []).filter(b => b.status === 'pending').length;
    const overdueBills = (bills.data || []).filter(b => b.status === 'overdue').length;
    const expiringCerts = (certs.data || []).filter(c => c.status === 'warning_expiring' || c.status === 'expired').length;
    const totalExpenses = (expenses.data || []).reduce((sum, e) => sum + (e.amount || 0), 0);
    setKpis({
      pendingBills,
      overdueBills,
      expiringCerts,
      totalExpenses,
      totalBills: bills.count || 0,
    });
  };

  const loadConciergeKpis = async () => {
    const condoId = profile?.condominium_id;
    if (!condoId) { setKpis({}); return; }
    const [visits, parcels, bookings] = await Promise.all([
      supabase.from('visitor_logs').select('id', { count: 'exact', head: true }).eq('condominium_id', condoId),
      supabase.from('parcels').select('id', { count: 'exact', head: true }).eq('condominium_id', condoId).eq('status', 'pending'),
      supabase.from('common_area_bookings').select('id', { count: 'exact', head: true }).eq('condominium_id', condoId),
    ]);
    setKpis({
      visits: visits.count || 0,
      parcels: parcels.count || 0,
      bookings: bookings.count || 0,
    });
  };

  const loadUserKpis = async () => {
    const userId = profile?.id;
    if (!userId) { setKpis({}); return; }
    const [bills, parcels] = await Promise.all([
      supabase.from('unit_expense_bills').select('id, status, balance, total_amount').eq('owner_id', userId).is('deleted_at', null),
      supabase.from('parcels').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);
    const pendingBill = (bills.data || []).find(b => b.status === 'pending' || b.status === 'overdue');
    setKpis({
      billStatus: pendingBill?.status || 'al_dia',
      billAmount: pendingBill?.balance || 0,
      parcels: parcels.count || 0,
    });
  };

  const cardStyle = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    padding: '20px',
    flex: '1 1 200px',
    minWidth: '180px',
  };

  const kpiLabel = {
    fontSize: '12px',
    color: 'var(--text-dim)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '4px',
  };

  const kpiValue = {
    fontSize: '24px',
    fontWeight: '700',
    color: 'var(--text-main)',
  };

  if (loading) return <div style={{ padding: '24px', color: 'var(--text-dim)' }}>Cargando…</div>;

  return (
    <div style={{ marginTop: '28px' }}>
      <h3 style={{ margin: '0 0 4px' }}>Bienvenido, {profile?.first_name || profile?.full_name || 'Usuario'}</h3>
      <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: '13px' }}>
        {role === ROLES.SUPERADMIN && 'Panel de control global de la plataforma'}
        {role === ROLES.ADMIN && 'Gestión de condominios asignados'}
        {role === ROLES.CONCIERGE && 'Estación de turno - Conserjería'}
        {role === ROLES.USER && 'Portal del residente'}
      </p>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {role === ROLES.SUPERADMIN && (
          <>
            <div style={cardStyle}>
              <div style={kpiLabel}>Empresas Gestoras</div>
              <div style={kpiValue}>{kpis.companies}</div>
            </div>
            <div style={cardStyle}>
              <div style={kpiLabel}>Condominios</div>
              <div style={kpiValue}>{kpis.condominiums}</div>
            </div>
            <div style={cardStyle}>
              <div style={kpiLabel}>Unidades</div>
              <div style={kpiValue}>{kpis.units}</div>
            </div>
          </>
        )}
        {role === ROLES.ADMIN && (
          <>
            <div style={cardStyle}>
              <div style={kpiLabel}>Colillas Pendientes</div>
              <div style={kpiValue}>{kpis.pendingBills}</div>
            </div>
            <div style={cardStyle}>
              <div style={kpiLabel}>Colillas Vencidas</div>
              <div style={{ ...kpiValue, color: kpis.overdueBills > 0 ? 'var(--danger-text)' : 'var(--text-main)' }}>{kpis.overdueBills}</div>
            </div>
            <div style={cardStyle}>
              <div style={kpiLabel}>Certificaciones por Vencer</div>
              <div style={{ ...kpiValue, color: kpis.expiringCerts > 0 ? 'var(--warning-text)' : 'var(--text-main)' }}>{kpis.expiringCerts}</div>
            </div>
            <div style={cardStyle}>
              <div style={kpiLabel}>Egresos del Período</div>
              <div style={kpiValue}>{fmtCLP(kpis.totalExpenses)}</div>
            </div>
          </>
        )}
        {role === ROLES.CONCIERGE && (
          <>
            <div style={cardStyle}>
              <div style={kpiLabel}>Visitas Registradas</div>
              <div style={kpiValue}>{kpis.visits}</div>
            </div>
            <div style={cardStyle}>
              <div style={kpiLabel}>Paquetes Pendientes</div>
              <div style={{ ...kpiValue, color: kpis.parcels > 0 ? 'var(--warning-text)' : 'var(--text-main)' }}>{kpis.parcels}</div>
            </div>
            <div style={cardStyle}>
              <div style={kpiLabel}>Reservas Hoy</div>
              <div style={kpiValue}>{kpis.bookings}</div>
            </div>
          </>
        )}
        {role === ROLES.USER && (
          <>
            <div style={cardStyle}>
              <div style={kpiLabel}>Estado Gasto Común</div>
              <div style={{ ...kpiValue, color: kpis.billStatus === 'overdue' ? 'var(--danger-text)' : kpis.billStatus === 'pending' ? 'var(--warning-text)' : 'var(--success-text)', fontSize: '18px' }}>
                {kpis.billStatus === 'overdue' ? 'Vencido' : kpis.billStatus === 'pending' ? 'Por Pagar' : 'Al Día'}
              </div>
            </div>
            <div style={cardStyle}>
              <div style={kpiLabel}>Monto Pendiente</div>
              <div style={kpiValue}>{fmtCLP(kpis.billAmount)}</div>
            </div>
            <div style={cardStyle}>
              <div style={kpiLabel}>Paquetes por Retirar</div>
              <div style={{ ...kpiValue, color: kpis.parcels > 0 ? 'var(--warning-text)' : 'var(--text-main)' }}>{kpis.parcels}</div>
            </div>
          </>
        )}
      </div>

      {/* Quick actions hint */}
      <div style={{ padding: '16px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: '13px' }}>
        {role === ROLES.SUPERADMIN && 'Usa el menú lateral para gestionar empresas, condominios, usuarios y auditoría global.'}
        {role === ROLES.ADMIN && 'Usa el menú lateral para gestionar condominios, unidades, finanzas, asambleas y mantenciones.'}
        {role === ROLES.CONCIERGE && 'Usa el menú lateral para registrar visitas, paquetes, novedades y gestionar áreas comunes.'}
        {role === ROLES.USER && 'Usa el menú lateral para ver tus unidades, reservar áreas comunes, pagar gastos comunes y participar en asambleas.'}
      </div>
    </div>
  );
}
