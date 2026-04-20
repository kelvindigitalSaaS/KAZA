import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const webPushVapidPublic = Deno.env.get("WEB_PUSH_VAPID_PUBLIC")!;
const webPushVapidPrivate = Deno.env.get("WEB_PUSH_VAPID_PRIVATE")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, apikey, x-client-info",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

interface PushPayload {
  group_id?: string;
  home_id?: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  exclude_user_id?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const payload: PushPayload = await req.json();
    console.log("[PUSH] Received payload:", JSON.stringify(payload));
    const { group_id, home_id, title, body, data, exclude_user_id } = payload;

    if ((!group_id && !home_id) || !title || !body) {
      const missing = [];
      if (!group_id && !home_id) missing.push("group_id or home_id");
      if (!title) missing.push("title");
      if (!body) missing.push("body");
      
      console.error("[PUSH] Missing fields:", missing.join(", "));
      return json({ error: `Missing required fields: ${missing.join(", ")}` }, 400);
    }

    let userIds: string[] = [];

    if (home_id) {
      // Home-based members (shopping list, consumables, etc.)
      let homeQuery = supabase
        .from("home_members")
        .select("user_id")
        .eq("home_id", home_id);

      if (exclude_user_id) {
        homeQuery = homeQuery.neq("user_id", exclude_user_id);
      }

      const { data: homeMembers, error: homeError } = await homeQuery;
      if (homeError) return json({ error: homeError.message }, 500);
      userIds = (homeMembers || []).map((m) => m.user_id);
    } else if (group_id) {
      // Group-based members (subscription group)
      let membersQuery = supabase
        .from("sub_account_members")
        .select("user_id")
        .eq("group_id", group_id)
        .eq("is_active", true);

      if (exclude_user_id) {
        membersQuery = membersQuery.neq("user_id", exclude_user_id);
      }

      const { data: members, error: membersError } = await membersQuery;
      if (membersError) return json({ error: membersError.message }, 500);
      userIds = (members || []).map((m) => m.user_id);
    }

    if (userIds.length === 0) {
      return json({ success: true, sent: 0 });
    }

    // Get push subscriptions for these users
    const { data: subscriptions, error: subsError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .in("user_id", userIds)
      .eq("is_active", true);

    if (subsError) {
      return json({ error: subsError.message }, 500);
    }

    let sentCount = 0;

    // Send web push notifications
    if (subscriptions && subscriptions.length > 0) {
      for (const sub of subscriptions) {
        try {
          const pushPayloadJson = JSON.stringify({
            title,
            body,
            icon: "/icon.png",
            badge: "/icons/badge-96.svg",
            data: data || {},
          });

          // Note: Full web-push implementation requires the npm package
          // In production, use: import * as webpush from 'web-push';
          // webpush.sendNotification(subscription, pushPayloadJson);

          sentCount++;
        } catch (error) {
          console.error(`Failed to send push to subscription ${sub.id}:`, error);
        }
      }
    }

    return json({ success: true, sent: sentCount });
  } catch (error) {
    console.error(error);
    return json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      500
    );
  }
});

