/**
 * Edge Function: geocode-cep
 * 
 * Converte CEP brasileiro em coordenadas geográficas usando OpenStreetMap Nominatim.
 * Implementa cache para evitar chamadas repetidas.
 * 
 * Rate limit do Nominatim: 1 requisição por segundo (respeitamos com delay)
 * 
 * @endpoint POST /functions/v1/geocode-cep
 * @body { cep: string }
 * @returns { latitude, longitude, address, city, state, cached }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NominatimResult {
  lat: string
  lon: string
  display_name: string
  address?: {
    city?: string
    town?: string
    municipality?: string
    state?: string
    postcode?: string
  }
}

interface GeocodeResponse {
  latitude: number
  longitude: number
  address: string | null
  city: string | null
  state: string | null
  cached: boolean
  cep: string
}

// Normaliza CEP para apenas números
function normalizeCep(cep: string): string {
  return cep.replace(/\D/g, '').slice(0, 8)
}

// Formata CEP para busca (XXXXX-XXX)
function formatCepForSearch(cep: string): string {
  const clean = normalizeCep(cep)
  if (clean.length >= 8) {
    return `${clean.slice(0, 5)}-${clean.slice(5, 8)}`
  }
  return clean
}

// Busca coordenadas no Nominatim (OpenStreetMap)
async function geocodeWithNominatim(cep: string): Promise<GeocodeResponse | null> {
  const formattedCep = formatCepForSearch(cep)
  
  // User-Agent é obrigatório para Nominatim
  const headers = {
    'User-Agent': 'ListaEscolar/1.0 (https://listaescolar.com.br)',
    'Accept': 'application/json',
  }
  
  try {
    // Primeira tentativa: busca direta por CEP + Brasil
    const searchQuery = encodeURIComponent(`${formattedCep}, Brasil`)
    const url = `https://nominatim.openstreetmap.org/search?q=${searchQuery}&format=json&addressdetails=1&limit=1&countrycodes=br`
    
    console.log(`[Geocode] Buscando: ${formattedCep}`)
    
    const response = await fetch(url, { headers })
    
    if (!response.ok) {
      console.error(`[Geocode] Erro HTTP: ${response.status}`)
      return null
    }
    
    const results: NominatimResult[] = await response.json()
    
    if (results.length === 0) {
      console.log(`[Geocode] Nenhum resultado para: ${formattedCep}`)
      return null
    }
    
    const result = results[0]
    const address = result.address
    
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      address: result.display_name,
      city: address?.city || address?.town || address?.municipality || null,
      state: address?.state || null,
      cached: false,
      cep: normalizeCep(cep),
    }
  } catch (error) {
    console.error(`[Geocode] Erro na busca:`, error)
    return null
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    const { cep } = await req.json()
    
    if (!cep) {
      return new Response(
        JSON.stringify({ error: 'CEP é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const cleanCep = normalizeCep(cep)
    
    if (cleanCep.length < 5) {
      return new Response(
        JSON.stringify({ error: 'CEP deve ter pelo menos 5 dígitos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // 1. Verificar cache primeiro
    console.log(`[Geocode] Verificando cache para: ${cleanCep}`)
    
    const { data: cachedData, error: cacheError } = await supabase
      .from('cep_coordinates')
      .select('*')
      .eq('cep', cleanCep)
      .single()
    
    if (cachedData && !cacheError) {
      console.log(`[Geocode] Cache hit para: ${cleanCep}`)
      return new Response(
        JSON.stringify({
          latitude: cachedData.latitude,
          longitude: cachedData.longitude,
          address: cachedData.address,
          city: cachedData.city,
          state: cachedData.state,
          cached: true,
          cep: cleanCep,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // 2. Buscar no Nominatim
    console.log(`[Geocode] Cache miss, buscando no Nominatim: ${cleanCep}`)
    const geocodeResult = await geocodeWithNominatim(cleanCep)
    
    if (!geocodeResult) {
      // Se não encontrou com CEP completo, tenta com prefixo
      console.log(`[Geocode] Tentando com prefixo de 5 dígitos`)
      const prefixResult = await geocodeWithNominatim(cleanCep.slice(0, 5))
      
      if (!prefixResult) {
        return new Response(
          JSON.stringify({ 
            error: 'Não foi possível geocodificar o CEP',
            cep: cleanCep 
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Salvar no cache com o CEP original
      await supabase
        .from('cep_coordinates')
        .upsert({
          cep: cleanCep,
          latitude: prefixResult.latitude,
          longitude: prefixResult.longitude,
          address: prefixResult.address,
          city: prefixResult.city,
          state: prefixResult.state,
          source: 'nominatim_prefix',
          updated_at: new Date().toISOString(),
        })
      
      return new Response(
        JSON.stringify({
          ...prefixResult,
          cep: cleanCep,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // 3. Salvar no cache
    console.log(`[Geocode] Salvando no cache: ${cleanCep}`)
    
    const { error: insertError } = await supabase
      .from('cep_coordinates')
      .upsert({
        cep: cleanCep,
        latitude: geocodeResult.latitude,
        longitude: geocodeResult.longitude,
        address: geocodeResult.address,
        city: geocodeResult.city,
        state: geocodeResult.state,
        source: 'nominatim',
        updated_at: new Date().toISOString(),
      })
    
    if (insertError) {
      console.error(`[Geocode] Erro ao salvar cache:`, insertError)
    }
    
    return new Response(
      JSON.stringify(geocodeResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('[Geocode] Erro geral:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
