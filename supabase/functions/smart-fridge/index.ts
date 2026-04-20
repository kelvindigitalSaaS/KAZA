/* eslint-disable @typescript-eslint/no-explicit-any */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type"
};

// --- Samsung SmartThings ---
const SAMSUNG_BASE = "https://api.smartthings.com/v1";

async function samsungRequest(
  path: string,
  token: string,
  method = "GET",
  body?: unknown
) {
  const res = await fetch(`${SAMSUNG_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SmartThings ${res.status}: ${text}`);
  }
  return res.json();
}

async function samsungDiscover(token: string) {
  const data = await samsungRequest("/devices", token);
  const fridges = (data.items ?? []).filter((d: any) => {
    const cats: string[] =
      d.components?.[0]?.categories?.map((c: any) => c.name) ?? [];
    return cats.some((c) => /refrigerator/i.test(c));
  });
  return fridges.map((d: any) => ({
    id: d.deviceId,
    name: d.label || d.name || "Samsung Fridge",
    brand: "samsung",
    model: d.deviceManufacturerCode ?? ""
  }));
}

async function samsungStatus(token: string, deviceId: string) {
  const data = await samsungRequest(`/devices/${deviceId}/status`, token);
  const main = data.components?.main ?? {};

  const fridgeTemp =
    main.refrigerationSetpoint?.coolingSetpoint?.value ??
    main.thermostatCoolingSetpoint?.coolingSetpoint?.value ??
    null;

  const freezerTemp =
    main.freezer?.freezerSetpoint?.value ??
    main["custom.freezerSetpoint"]?.freezerSetpoint?.value ??
    null;

  const doorOpen =
    main.contactSensor?.contact?.value === "open" ||
    main.doorControl?.door?.value === "open" ||
    false;

  const ecoMode =
    main["samsungce.powerCool"]?.powerCool?.value === false ||
    main["custom.energySavingMode"]?.energySavingMode?.value === "on" ||
    false;

  return { fridgeTemp, freezerTemp, doorOpen, ecoMode, raw: main };
}

async function samsungControl(
  token: string,
  deviceId: string,
  commands: unknown[]
) {
  return samsungRequest(`/devices/${deviceId}/commands`, token, "POST", {
    commands
  });
}

// --- LG ThinQ ---
const LG_AUTH_URL = "https://us.api.rscse.lge.com"; // placeholder â€” real endpoint varies by region

async function lgDiscover(countryCodes: string[]) {
  // LG ThinQ uses a proprietary auth flow (OAuth2 + custom headers).
  // Return instructions so the user knows what to do.
  return {
    error: "lg_manual",
    message:
      "A API da LG ThinQ requer autenticaÃ§Ã£o OAuth2 via app oficial. " +
      "Use o app LG ThinQ para vincular a conta e obter o token de acesso.",
    helpUrl: "https://www.lg.com/br/suporte/app-lg-thinq"
  };
}

// ---- Main handler ----
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const respond = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  try {
    const { action, brand, token, deviceId, commands } = await req.json();

    // ---- Samsung SmartThings ----
    if (brand === "samsung") {
      if (!token)
        return respond(
          { error: "Token pessoal Samsung SmartThings Ã© obrigatÃ³rio." },
          400
        );

      if (action === "discover") {
        const devices = await samsungDiscover(token);
        return respond({ devices });
      }

      if (action === "status") {
        if (!deviceId) return respond({ error: "deviceId obrigatÃ³rio." }, 400);
        const status = await samsungStatus(token, deviceId);
        return respond(status);
      }

      if (action === "control") {
        if (!deviceId || !commands)
          return respond({ error: "deviceId e commands obrigatÃ³rios." }, 400);
        const result = await samsungControl(token, deviceId, commands);
        return respond({ success: true, result });
      }

      return respond({ error: "AÃ§Ã£o invÃ¡lida." }, 400);
    }

    // ---- LG ThinQ ----
    if (brand === "lg") {
      if (action === "discover") {
        return respond(await lgDiscover(["BR"]));
      }
      return respond(
        { error: "AÃ§Ã£o nÃ£o suportada para LG. Use o app LG ThinQ." },
        400
      );
    }

    // ---- Outras marcas (nÃ£o possuem API pÃºblica aberta) ----
    const brandGuide: Record<string, string> = {
      brastemp: "https://conectado.brastemp.com.br",
      consul: "https://www.consul.com.br/conectados",
      electrolux: "https://www.electrolux.com.br/eletrodomesticos-inteligentes",
      whirlpool: "https://www.whirlpoolbrasil.com.br",
      panasonic: "https://panasonic.net/cns/appliance/",
      bosch: "https://www.bosch-home.com/br",
      ge: "https://www.geaplicances.com.br",
      midea: "https://www.midea.com.br",
      haier: "https://www.haier.com/br",
      hisense: "https://hisense.com.br",
      beko: "https://www.beko.com.br"
    };

    return respond(
      {
        error: "brand_not_supported",
        message:
          `A marca ${brand} nÃ£o possui uma API pÃºblica aberta para integraÃ§Ã£o direta. ` +
          `Acesse o app oficial da marca para controlar a geladeira.`,
        helpUrl: brandGuide[brand] ?? null
      },
      422
    );
  } catch (err: any) {
    console.error("smart-fridge error:", err);
    return respond({ error: err.message ?? "Erro desconhecido." }, 500);
  }
});
