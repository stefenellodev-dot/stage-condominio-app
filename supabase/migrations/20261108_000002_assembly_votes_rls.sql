-- ============================================================================
-- MIGRACIÓN: RLS para assembly_votes (verificación de acreditación)
-- Art. 15 Ley 21.442: solo usuarios acreditados pueden votar
-- ============================================================================

-- Eliminar política existente
DROP POLICY IF EXISTS "Emision de voto" ON assembly_votes;

-- Nueva política: solo usuarios acreditados (is_verified=true en assembly_attendees)
-- pueden emitir voto por su unidad
CREATE POLICY "Emision de voto" ON assembly_votes
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.assembly_attendees aa
    WHERE aa.assembly_id = (SELECT assembly_id FROM public.assembly_topics WHERE id = assembly_votes.topic_id)
      AND aa.unit_id = assembly_votes.unit_id
      AND aa.user_id = auth.uid()
      AND aa.is_verified = true
  )
  OR is_superadmin()
);
