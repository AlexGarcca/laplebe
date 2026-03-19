-- ============================================================================
-- COMPLETE ATOMIC BETTING SYSTEM
-- ============================================================================
-- Includes: Tables + RLS Policies + RPC Functions
-- Safe to re-run: All DDL has IF NOT EXISTS checks
-- Execute in Supabase SQL Editor as single transaction
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: CREATE TABLES (if not exists)
-- ============================================================================

-- Tabla de tickets (agrupador de apuestas)
CREATE TABLE IF NOT EXISTS public.bet_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monto numeric NOT NULL CHECK (monto > 0 AND monto <= 999999),
  cuota_total numeric NOT NULL CHECK (cuota_total > 0),
  tipo text NOT NULL CHECK (tipo IN ('simple', 'parlay')),
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'ganada', 'perdida', 'cancelada')),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  settled_at timestamptz,
  
  CONSTRAINT bet_tickets_user_id_key UNIQUE (id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_bet_tickets_user_id ON public.bet_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_bet_tickets_estado ON public.bet_tickets(estado);
CREATE INDEX IF NOT EXISTS idx_bet_tickets_created_at ON public.bet_tickets(created_at DESC);

-- Tabla de movimientos de saldo (audit trail)
CREATE TABLE IF NOT EXISTS public.bet_movimientos (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_id uuid REFERENCES public.bet_tickets(id) ON DELETE SET NULL,
  tipo text NOT NULL CHECK (tipo IN ('debito_apuesta', 'credito_cancelacion', 'credito_ganancia', 'debito_penalizacion')),
  monto numeric NOT NULL CHECK (monto > 0),
  saldo_anterior numeric NOT NULL,
  saldo_nuevo numeric NOT NULL,
  referencia text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  
  CONSTRAINT bet_movimientos_balance CHECK (saldo_nuevo = saldo_anterior + (CASE WHEN tipo IN ('credito_cancelacion', 'credito_ganancia') THEN monto ELSE -monto END))
);

CREATE INDEX IF NOT EXISTS idx_bet_movimientos_user_id ON public.bet_movimientos(user_id);
CREATE INDEX IF NOT EXISTS idx_bet_movimientos_ticket_id ON public.bet_movimientos(ticket_id);
CREATE INDEX IF NOT EXISTS idx_bet_movimientos_created_at ON public.bet_movimientos(created_at DESC);

-- ============================================================================
-- PART 2: ALTER APUESTAS TABLE (add ticket_id if not exists)
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'apuestas' AND column_name = 'ticket_id'
  ) THEN
    -- Agregar columna sin FK constraint primero
    ALTER TABLE public.apuestas ADD COLUMN ticket_id uuid;
  END IF;
END $$;

-- ============================================================================
-- PART 3: UPDATE APUESTAS ESTADO CHECK (allow 'cancelada')
-- ============================================================================

DO $$
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE public.apuestas DROP CONSTRAINT IF EXISTS apuestas_estado_check;
  
  -- Add new constraint with 'cancelada' state
  ALTER TABLE public.apuestas ADD CONSTRAINT apuestas_estado_check 
    CHECK (estado IN ('pendiente', 'ganada', 'perdida', 'cancelada'));
END $$;

-- ============================================================================
-- PART 4: ADD FOREIGN KEY CONSTRAINT (after tables exist)
-- ============================================================================

DO $$
BEGIN
  -- Agregar constraint de FK a apuestas.ticket_id si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'apuestas' AND constraint_name = 'apuestas_ticket_id_fkey'
  ) THEN
    ALTER TABLE public.apuestas 
    ADD CONSTRAINT apuestas_ticket_id_fkey 
    FOREIGN KEY (ticket_id) REFERENCES public.bet_tickets(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- PART 5: RLS POLICIES
-- ============================================================================

-- Enable RLS on all betting tables
ALTER TABLE public.bet_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bet_movimientos ENABLE ROW LEVEL SECURITY;

-- Admin helper (single source of truth for privileged RLS checks)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    auth.uid() IN (
      '09c83b94-132f-4711-8009-0aa427d8df84'::uuid
    )
    OR lower(auth.jwt() ->> 'email') IN (
      'garcca29@gmail.com',
      'sanchez_24399@hotmail.com'
    ),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_super_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin TO postgres;

-- Enable RLS on admin-result workflow tables (safe if already enabled)
ALTER TABLE public.partidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jugadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estadisticas_jugadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alineaciones ENABLE ROW LEVEL SECURITY;

-- partidos policies for admin result closure
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'partidos' AND policyname = 'admin_select_partidos') THEN
    CREATE POLICY admin_select_partidos ON public.partidos
      FOR SELECT USING (public.is_super_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'partidos' AND policyname = 'admin_update_partidos') THEN
    CREATE POLICY admin_update_partidos ON public.partidos
      FOR UPDATE USING (public.is_super_admin())
      WITH CHECK (public.is_super_admin());
  END IF;
END $$;

-- jugadores policies for disciplinary updates
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'jugadores' AND policyname = 'admin_select_jugadores') THEN
    CREATE POLICY admin_select_jugadores ON public.jugadores
      FOR SELECT USING (public.is_super_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'jugadores' AND policyname = 'admin_update_jugadores') THEN
    CREATE POLICY admin_update_jugadores ON public.jugadores
      FOR UPDATE USING (public.is_super_admin())
      WITH CHECK (public.is_super_admin());
  END IF;
END $$;

-- estadisticas_jugadores policies for replace-on-save flow
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'estadisticas_jugadores' AND policyname = 'admin_select_estadisticas_jugadores') THEN
    CREATE POLICY admin_select_estadisticas_jugadores ON public.estadisticas_jugadores
      FOR SELECT USING (public.is_super_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'estadisticas_jugadores' AND policyname = 'admin_insert_estadisticas_jugadores') THEN
    CREATE POLICY admin_insert_estadisticas_jugadores ON public.estadisticas_jugadores
      FOR INSERT WITH CHECK (public.is_super_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'estadisticas_jugadores' AND policyname = 'admin_delete_estadisticas_jugadores') THEN
    CREATE POLICY admin_delete_estadisticas_jugadores ON public.estadisticas_jugadores
      FOR DELETE USING (public.is_super_admin());
  END IF;
END $$;

-- alineaciones policy for GK lookup during result capture
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'alineaciones' AND policyname = 'admin_select_alineaciones') THEN
    CREATE POLICY admin_select_alineaciones ON public.alineaciones
      FOR SELECT USING (public.is_super_admin());
  END IF;
END $$;

-- bet_tickets policies
DO $$ 
BEGIN
  -- SELECT own tickets
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bet_tickets' AND policyname = 'select_own_tickets') THEN
    CREATE POLICY select_own_tickets ON public.bet_tickets
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  -- INSERT own tickets
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bet_tickets' AND policyname = 'insert_own_tickets') THEN
    CREATE POLICY insert_own_tickets ON public.bet_tickets
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  -- UPDATE own tickets
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bet_tickets' AND policyname = 'update_own_tickets') THEN
    CREATE POLICY update_own_tickets ON public.bet_tickets
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- bet_movimientos policies
DO $$ 
BEGIN
  -- SELECT own movimientos
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bet_movimientos' AND policyname = 'select_own_movimientos') THEN
    CREATE POLICY select_own_movimientos ON public.bet_movimientos
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  -- INSERT own movimientos
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bet_movimientos' AND policyname = 'insert_own_movimientos') THEN
    CREATE POLICY insert_own_movimientos ON public.bet_movimientos
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================================
-- PART 6: RPC FUNCTIONS
-- ============================================================================

-- Drop old versions if they exist
DROP FUNCTION IF EXISTS place_bet_ticket(uuid, numeric, numeric, text, jsonb) CASCADE;
DROP FUNCTION IF EXISTS cancel_bet_ticket(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS settle_match_bets(uuid, text) CASCADE;

-- 6A. PLACE_BET_TICKET
CREATE FUNCTION place_bet_ticket(
  p_user_id uuid,
  p_monto numeric,
  p_cuota_total numeric,
  p_tipo text,
  p_apuestas_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ticket_id uuid;
  v_saldo_anterior numeric;
  v_saldo_nuevo numeric;
  v_user_exists boolean;
  v_apuestas_count int;
  v_inserted_count int;
  v_resultado jsonb;
  v_error_msg text;
BEGIN
  -- ========== VALIDACIONES INICIALES ==========
  
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id)
  INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    RAISE EXCEPTION 'Usuario no existe en auth.users' USING ERRCODE = '28000';
  END IF;

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado' USING ERRCODE = '42501';
  END IF;

  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Solo puedes registrar apuestas en tu propia cuenta' USING ERRCODE = '42501';
  END IF;

  IF p_monto <= 0 THEN
    RAISE EXCEPTION 'Monto debe ser positivo' USING ERRCODE = '22003';
  END IF;

  IF p_cuota_total <= 0 THEN
    RAISE EXCEPTION 'Cuota total debe ser positiva' USING ERRCODE = '22003';
  END IF;

  IF p_monto > 999999 THEN
    RAISE EXCEPTION 'Monto excede límite máximo' USING ERRCODE = '22003';
  END IF;

  IF p_tipo NOT IN ('simple', 'parlay') THEN
    RAISE EXCEPTION 'Tipo de apuesta inválido (debe ser simple o parlay)' USING ERRCODE = '22023';
  END IF;

  v_apuestas_count := jsonb_array_length(p_apuestas_data);
  IF v_apuestas_count = 0 THEN
    RAISE EXCEPTION 'Debes incluir al menos una apuesta en el ticket' USING ERRCODE = '22023';
  END IF;

  IF (p_tipo = 'simple' AND v_apuestas_count != 1) OR 
     (p_tipo = 'parlay' AND v_apuestas_count < 2) THEN
    RAISE EXCEPTION 'Tipo de apuesta no coincide con cantidad de apuestas' USING ERRCODE = '22023';
  END IF;

  -- ========== BLOQUEO Y VALIDACIÓN DE SALDO ==========
  
  SELECT saldo_bet 
  INTO v_saldo_anterior
  FROM perfiles_presidentes
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_saldo_anterior IS NULL THEN
    RAISE EXCEPTION 'Perfil de usuario no encontrado en perfiles_presidentes' USING ERRCODE = '22012';
  END IF;

  IF p_monto > v_saldo_anterior THEN
    RAISE EXCEPTION 'Saldo insuficiente (disponible: %L, solicitado: %L)', 
                    v_saldo_anterior, p_monto USING ERRCODE = '42501';
  END IF;

  -- ========== CREAR TICKET ==========
  
  v_ticket_id := gen_random_uuid();

  BEGIN
    INSERT INTO bet_tickets (
      id,
      user_id,
      monto,
      cuota_total,
      tipo,
      estado,
      created_at
    ) VALUES (
      v_ticket_id,
      p_user_id,
      ROUND(p_monto::numeric, 2),
      ROUND(p_cuota_total::numeric, 2),
      p_tipo,
      'pendiente',
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    v_error_msg := SQLERRM;
    RAISE EXCEPTION 'Fallo insertar bet_tickets: %L', v_error_msg USING ERRCODE = '23505';
  END;

  -- ========== INSERTAR APUESTAS ==========
  
  BEGIN
    WITH insert_batch AS (
      INSERT INTO apuestas (
        user_id,
        partido_id,
        monto,
        seleccion,
        momio,
        es_parlay,
        parlay_id,
        ticket_id,
        estado,
        created_at
      )
      SELECT
        p_user_id,
        (value->>'partido_id')::uuid,
        p_monto,
        value->>'seleccion',
        (value->>'momio')::numeric,
        p_tipo = 'parlay',
        v_ticket_id,
        v_ticket_id,
        'pendiente',
        NOW()
      FROM jsonb_array_elements(p_apuestas_data)
      RETURNING id
    )
    SELECT count(*) INTO v_inserted_count FROM insert_batch;
  EXCEPTION WHEN OTHERS THEN
    v_error_msg := SQLERRM;
    RAISE EXCEPTION 'Fallo insertar apuestas: %L', v_error_msg USING ERRCODE = 'P0001';
  END;

  IF v_inserted_count != v_apuestas_count THEN
    RAISE EXCEPTION 'Se insertaron % de % apuestas esperadas (datos corruptos)', 
                    v_inserted_count, v_apuestas_count USING ERRCODE = '22023';
  END IF;

  -- ========== ACTUALIZAR SALDO ==========
  
  v_saldo_nuevo := ROUND((v_saldo_anterior - p_monto)::numeric, 2);

  UPDATE perfiles_presidentes
  SET saldo_bet = v_saldo_nuevo
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fallo actualizar saldo (usuario no existe post-update)' USING ERRCODE = '22012';
  END IF;

  -- ========== REGISTRAR MOVIMIENTO (OPCIONAL) ==========
  
  BEGIN
    INSERT INTO bet_movimientos (
      user_id,
      ticket_id,
      tipo,
      monto,
      saldo_anterior, 
      saldo_nuevo,
      referencia,
      created_at
    ) VALUES (
      p_user_id,
      v_ticket_id,
      'debito_apuesta',
      p_monto,
      v_saldo_anterior,
      v_saldo_nuevo,
      'Ticket ' || v_ticket_id::text,
      NOW()
    );
  EXCEPTION 
    WHEN UNDEFINED_TABLE THEN
      RAISE NOTICE 'bet_movimientos table not ready yet';
    WHEN OTHERS THEN
      RAISE NOTICE 'Warning: could not log movimiento: %', SQLERRM;
  END;

  -- ========== RETORNAR ÉXITO ==========
  
  v_resultado := jsonb_build_object(
    'ticket_id', v_ticket_id::text,
    'monto', ROUND(p_monto::numeric, 2),
    'cuota_total', ROUND(p_cuota_total::numeric, 2),
    'saldo_anterior', v_saldo_anterior,
    'saldo_nuevo', v_saldo_nuevo,
    'apuestas_count', v_inserted_count,
    'tipo', p_tipo,
    'timestamp', NOW()::text
  );

  RETURN v_resultado;

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

-- 6B. CANCEL_BET_TICKET
CREATE FUNCTION cancel_bet_ticket(
  p_user_id uuid,
  p_ticket_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ticket_estado text;
  v_monto_reembolso numeric;
  v_saldo_anterior numeric;
  v_saldo_nuevo numeric;
  v_updated_count int;
  v_resultado jsonb;
  v_error_msg text;
BEGIN
  -- ========== VALIDACIONES INICIALES ==========
  
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado' USING ERRCODE = '42501';
  END IF;

  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Solo puedes cancelar tus propias apuestas' USING ERRCODE = '42501';
  END IF;

  IF p_ticket_id IS NULL THEN
    RAISE EXCEPTION 'ticket_id no puede estar nulo' USING ERRCODE = '22023';
  END IF;

  -- ========== BLOQUEO PESSIMISTA DEL TICKET ==========
  
  SELECT estado, monto
  INTO v_ticket_estado, v_monto_reembolso
  FROM bet_tickets
  WHERE id = p_ticket_id
    AND user_id = p_user_id
  FOR UPDATE;

  IF v_ticket_estado IS NULL THEN
    RAISE EXCEPTION 'Ticket no encontrado o no es tuyo' USING ERRCODE = '22012';
  END IF;

  IF v_ticket_estado != 'pendiente' THEN
    RAISE EXCEPTION 'No puedes cancelar un ticket que ya está % (solo pendiente)', 
                    v_ticket_estado USING ERRCODE = '22023';
  END IF;

  -- ========== BLOQUEO PESSIMISTA DEL PERFIL ==========
  
  SELECT saldo_bet
  INTO v_saldo_anterior
  FROM perfiles_presidentes
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_saldo_anterior IS NULL THEN
    RAISE EXCEPTION 'Perfil de usuario no encontrado' USING ERRCODE = '22012';
  END IF;

  -- ========== ACTUALIZAR TICKET A CANCELADA ==========
  
  UPDATE bet_tickets
  SET 
    estado = 'cancelada',
    settled_at = NOW()
  WHERE id = p_ticket_id
    AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fallo actualizar ticket a cancelada (cambió entre lectura y actualización)' 
                    USING ERRCODE = '22023';
  END IF;

  -- ========== MARCAR APUESTAS COMO CANCELADAS ==========
  
  BEGIN
    UPDATE apuestas
    SET estado = 'cancelada'
    WHERE ticket_id = p_ticket_id
      AND user_id = p_user_id
      AND estado = 'pendiente';

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    IF v_updated_count = 0 THEN
      RAISE EXCEPTION 'No hay apuestas pendientes para este ticket' USING ERRCODE = '22023';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_error_msg := SQLERRM;
    RAISE EXCEPTION 'Fallo actualizar apuestas a cancelada: %L', v_error_msg USING ERRCODE = 'P0001';
  END;

  -- ========== ACREDITAR SALDO (REEMBOLSO) ==========
  
  v_saldo_nuevo := ROUND((v_saldo_anterior + v_monto_reembolso)::numeric, 2);

  UPDATE perfiles_presidentes
  SET saldo_bet = v_saldo_nuevo
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fallo acreditar saldo (usuario desapareció post-update)' USING ERRCODE = '22012';
  END IF;

  -- ========== REGISTRAR MOVIMIENTO (OPCIONAL) ==========
  
  BEGIN
    INSERT INTO bet_movimientos (
      user_id,
      ticket_id,
      tipo,
      monto,
      saldo_anterior,
      saldo_nuevo,
      referencia,
      created_at
    ) VALUES (
      p_user_id,
      p_ticket_id,
      'credito_cancelacion',
      v_monto_reembolso,
      v_saldo_anterior,
      v_saldo_nuevo,
      'Cancelación de ticket ' || p_ticket_id::text,
      NOW()
    );
  EXCEPTION 
    WHEN UNDEFINED_TABLE THEN
      RAISE NOTICE 'bet_movimientos table not ready yet';
    WHEN OTHERS THEN
      RAISE NOTICE 'Warning: could not log movimiento: %', SQLERRM;
  END;

  -- ========== RETORNAR ÉXITO ==========
  
  v_resultado := jsonb_build_object(
    'ticket_id', p_ticket_id::text,
    'estado_anterior', 'pendiente',
    'estado_nuevo', 'cancelada',
    'monto_reembolsado', ROUND(v_monto_reembolso::numeric, 2),
    'saldo_anterior', v_saldo_anterior,
    'saldo_nuevo', v_saldo_nuevo,
    'apuestas_canceladas', v_updated_count,
    'timestamp', NOW()::text
  );

  RETURN v_resultado;

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

-- 6C. SETTLE_MATCH_BETS
CREATE FUNCTION settle_match_bets(
  p_partido_id uuid,
  p_resultado_real text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row_count int;
  v_tickets_liquidados int := 0;
  v_tickets_ganados int := 0;
  v_tickets_perdidos int := 0;
  v_total_pagado numeric := 0;
  v_total_apuestas_actualizadas int := 0;
  v_email text;
  v_legacy_pagadas int := 0;
  v_legacy_monto_pagado numeric := 0;
  v_pendientes_count int;
  v_perdidas_count int;
  v_total_count int;
  v_ganadas_count int;
  v_ticket_monto numeric;
  v_ticket_cuota_total numeric;
  v_ticket_user_id uuid;
  v_saldo_anterior numeric;
  v_saldo_nuevo numeric;
  v_payout numeric;
  v_ticket_estado text;
  v_resultado jsonb;
  r_ticket record;
  r_legacy record;
BEGIN
  -- ========== VALIDACIONES INICIALES ==========

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado' USING ERRCODE = '42501';
  END IF;

  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Solo administrador autorizado puede liquidar apuestas' USING ERRCODE = '42501';
  END IF;

  IF p_partido_id IS NULL THEN
    RAISE EXCEPTION 'partido_id no puede estar nulo' USING ERRCODE = '22023';
  END IF;

  IF p_resultado_real NOT IN ('LOCAL', 'VISITA', 'EMPATE') THEN
    RAISE EXCEPTION 'resultado_real inválido (debe ser LOCAL, VISITA o EMPATE)' USING ERRCODE = '22023';
  END IF;

  -- ========== ACTUALIZAR APUESTAS DEL PARTIDO ==========

  UPDATE apuestas
  SET estado = CASE WHEN seleccion = p_resultado_real THEN 'ganada' ELSE 'perdida' END
  WHERE partido_id = p_partido_id
    AND estado = 'pendiente';

  GET DIAGNOSTICS v_total_apuestas_actualizadas = ROW_COUNT;

  -- ========== LIQUIDAR TICKETS NUEVOS (CON ticket_id) ==========

  FOR r_ticket IN
    SELECT DISTINCT a.ticket_id
    FROM apuestas a
    WHERE a.partido_id = p_partido_id
      AND a.ticket_id IS NOT NULL
  LOOP
    SELECT estado, user_id, monto, cuota_total
    INTO v_ticket_estado, v_ticket_user_id, v_ticket_monto, v_ticket_cuota_total
    FROM bet_tickets
    WHERE id = r_ticket.ticket_id
    FOR UPDATE;

    IF v_ticket_estado IS NULL OR v_ticket_estado != 'pendiente' THEN
      CONTINUE;
    END IF;

    SELECT
      COUNT(*),
      COUNT(*) FILTER (WHERE estado = 'ganada'),
      COUNT(*) FILTER (WHERE estado = 'perdida'),
      COUNT(*) FILTER (WHERE estado = 'pendiente')
    INTO v_total_count, v_ganadas_count, v_perdidas_count, v_pendientes_count
    FROM apuestas
    WHERE ticket_id = r_ticket.ticket_id;

    IF v_total_count = 0 OR v_pendientes_count > 0 THEN
      CONTINUE;
    END IF;

    IF v_perdidas_count > 0 THEN
      UPDATE bet_tickets
      SET estado = 'perdida', settled_at = NOW()
      WHERE id = r_ticket.ticket_id;

      v_tickets_perdidos := v_tickets_perdidos + 1;
      v_tickets_liquidados := v_tickets_liquidados + 1;
      CONTINUE;
    END IF;

    IF v_ganadas_count = v_total_count THEN
      SELECT saldo_bet
      INTO v_saldo_anterior
      FROM perfiles_presidentes
      WHERE id = v_ticket_user_id
      FOR UPDATE;

      IF v_saldo_anterior IS NULL THEN
        RAISE EXCEPTION 'Perfil no encontrado para ticket %', r_ticket.ticket_id USING ERRCODE = '22012';
      END IF;

      v_payout := ROUND((v_ticket_monto * v_ticket_cuota_total)::numeric, 2);
      v_saldo_nuevo := ROUND((v_saldo_anterior + v_payout)::numeric, 2);

      UPDATE perfiles_presidentes
      SET saldo_bet = v_saldo_nuevo
      WHERE id = v_ticket_user_id;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Fallo actualizar saldo para ticket %', r_ticket.ticket_id USING ERRCODE = '22012';
      END IF;

      UPDATE bet_tickets
      SET estado = 'ganada', settled_at = NOW()
      WHERE id = r_ticket.ticket_id;

      INSERT INTO bet_movimientos (
        user_id,
        ticket_id,
        tipo,
        monto,
        saldo_anterior,
        saldo_nuevo,
        referencia,
        created_at
      ) VALUES (
        v_ticket_user_id,
        r_ticket.ticket_id,
        'credito_ganancia',
        v_payout,
        v_saldo_anterior,
        v_saldo_nuevo,
        'Liquidación ticket ' || r_ticket.ticket_id::text || ' partido ' || p_partido_id::text,
        NOW()
      );

      v_tickets_ganados := v_tickets_ganados + 1;
      v_tickets_liquidados := v_tickets_liquidados + 1;
      v_total_pagado := ROUND((v_total_pagado + v_payout)::numeric, 2);
    END IF;
  END LOOP;

  -- ========== COMPATIBILIDAD LEGACY (apuestas simples sin ticket_id) ==========

  FOR r_legacy IN
    SELECT id, user_id, monto, momio
    FROM apuestas
    WHERE partido_id = p_partido_id
      AND ticket_id IS NULL
      AND es_parlay = false
      AND estado = 'ganada'
      AND NOT EXISTS (
        SELECT 1
        FROM bet_movimientos bm
        WHERE bm.user_id = apuestas.user_id
          AND bm.referencia = 'Liquidación legacy apuesta ' || apuestas.id::text || ' partido ' || p_partido_id::text
      )
  LOOP
    SELECT saldo_bet
    INTO v_saldo_anterior
    FROM perfiles_presidentes
    WHERE id = r_legacy.user_id
    FOR UPDATE;

    IF v_saldo_anterior IS NULL THEN
      CONTINUE;
    END IF;

    v_payout := ROUND((r_legacy.monto * r_legacy.momio)::numeric, 2);
    v_saldo_nuevo := ROUND((v_saldo_anterior + v_payout)::numeric, 2);

    UPDATE perfiles_presidentes
    SET saldo_bet = v_saldo_nuevo
    WHERE id = r_legacy.user_id;

    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    IF v_row_count = 0 THEN
      CONTINUE;
    END IF;

    INSERT INTO bet_movimientos (
      user_id,
      ticket_id,
      tipo,
      monto,
      saldo_anterior,
      saldo_nuevo,
      referencia,
      created_at
    ) VALUES (
      r_legacy.user_id,
      NULL,
      'credito_ganancia',
      v_payout,
      v_saldo_anterior,
      v_saldo_nuevo,
      'Liquidación legacy apuesta ' || r_legacy.id::text || ' partido ' || p_partido_id::text,
      NOW()
    );

    v_legacy_pagadas := v_legacy_pagadas + 1;
    v_legacy_monto_pagado := ROUND((v_legacy_monto_pagado + v_payout)::numeric, 2);
  END LOOP;

  v_resultado := jsonb_build_object(
    'partido_id', p_partido_id::text,
    'resultado_real', p_resultado_real,
    'apuestas_actualizadas', v_total_apuestas_actualizadas,
    'tickets_liquidados', v_tickets_liquidados,
    'tickets_ganados', v_tickets_ganados,
    'tickets_perdidos', v_tickets_perdidos,
    'total_pagado', ROUND(v_total_pagado::numeric, 2),
    'legacy_pagadas', v_legacy_pagadas,
    'legacy_monto_pagado', ROUND(v_legacy_monto_pagado::numeric, 2),
    'timestamp', NOW()::text
  );

  RETURN v_resultado;

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

-- ============================================================================
-- GRANT EXECUTION PERMISOS
-- ============================================================================
GRANT EXECUTE ON FUNCTION place_bet_ticket TO authenticated;
GRANT EXECUTE ON FUNCTION place_bet_ticket TO postgres;

GRANT EXECUTE ON FUNCTION cancel_bet_ticket TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_bet_ticket TO postgres;

GRANT EXECUTE ON FUNCTION settle_match_bets TO authenticated;
GRANT EXECUTE ON FUNCTION settle_match_bets TO postgres;

-- ============================================================================
-- COMMIT
-- ============================================================================

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (run after COMMIT to verify success)
-- ============================================================================

-- SELECT 'bet_tickets' as table_name, COUNT(*) as rows FROM bet_tickets
-- UNION ALL
-- SELECT 'bet_movimientos', COUNT(*) FROM bet_movimientos
-- UNION ALL
-- SELECT 'place_bet_ticket (RPC)', 1 WHERE EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'place_bet_ticket')
-- UNION ALL
-- SELECT 'cancel_bet_ticket (RPC)', 1 WHERE EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'cancel_bet_ticket')
-- UNION ALL
-- SELECT 'settle_match_bets (RPC)', 1 WHERE EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'settle_match_bets');
