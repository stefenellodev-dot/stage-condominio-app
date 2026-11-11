import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { useIsMobile } from '../../../hooks/useMediaQuery';

export function ResidentUnitsView() {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const [unit, setUnit] = useState(null);

  useEffect(() => {
    if (!profile?.id) return;
    const fetchUnit = async () => {
      const { data } = await supabase.from('units').select('*, condominiums(name, address, rut)').eq('owner_id', profile.id).limit(1).maybeSingle();
      setUnit(data);
    };
    fetchUnit();
  }, [profile?.id]);

  if (!unit) return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>Cargando datos de unidad...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '12px' : '20px' }}>
      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-subtle)', padding: '24px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '800' }}>Ficha de Mi Unidad: Depto {unit.unit_number}</h1>
        <div style={{ fontSize: '12.5px', color: 'var(--text-dim)', marginBottom: '20px' }}>{unit.condominiums?.name} • {unit.condominiums?.address}</div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
          <div style={{ padding: '14px', backgroundColor: 'var(--bg-surface)', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 'bold' }}>ALÍCUOTA DE DERECHOS (LEY 21.442)</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--primary)', marginTop: '4px' }}>{unit.aliquot}%</div>
          </div>
          <div style={{ padding: '14px', backgroundColor: 'var(--bg-surface)', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 'bold' }}>ESTACIONAMIENTO ASIGNADO</div>
            <div style={{ fontSize: '18px', fontWeight: '800', marginTop: '4px' }}>{unit.parking_number || 'Sin asignar'}</div>
          </div>
          <div style={{ padding: '14px', backgroundColor: 'var(--bg-surface)', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 'bold' }}>BODEGA ASIGNADA</div>
            <div style={{ fontSize: '18px', fontWeight: '800', marginTop: '4px' }}>{unit.storage_number || 'Sin asignar'}</div>
          </div>
          <div style={{ padding: '14px', backgroundColor: 'var(--bg-surface)', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 'bold' }}>PROPIETARIO / TITULAR</div>
            <div style={{ fontSize: '15px', fontWeight: '700', marginTop: '4px' }}>{profile.full_name}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
