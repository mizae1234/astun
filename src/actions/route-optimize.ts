"use server";

// Route Optimization using Gemini AI + OSRM
// Gemini: geocodes Thai addresses + suggests optimal delivery order with reasoning
// OSRM: calculates actual driving distance/time

const API_KEY = process.env.GOOGLE_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

type OptimizeResult = {
  optimizedOrder: number[];
  totalDistance: string;
  totalDuration: string;
  reasoning: string;
  legs: { address: string; distance: string; duration: string }[];
};

async function askGemini(prompt: string): Promise<string | null> {
  if (!API_KEY) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1 },
        }),
      }
    );
    const data = await res.json();
    if (data.error) {
      console.error("Gemini API error:", data.error.message);
      return null;
    }
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (e) {
    console.error("Gemini fetch error:", e);
    return null;
  }
}

export async function optimizeDeliveryRoute(
  originAddress: string,
  addresses: string[]
): Promise<OptimizeResult | { error: string }> {
  if (addresses.length < 2) return { error: "ต้องมีอย่างน้อย 2 จุดจัดส่ง" };
  if (!API_KEY) return { error: "ยังไม่ได้ตั้งค่า API Key" };

  // Step 1: Ask Gemini to geocode all addresses AND suggest optimal order
  const prompt = `คุณเป็นผู้เชี่ยวชาญด้านการจัดส่งสินค้าในประเทศไทย

จุดเริ่มต้น (สาขา): "${originAddress}"

จุดจัดส่ง:
${addresses.map((a, i) => `${i}: "${a}"`).join("\n")}

ทำ 2 อย่าง:
1. หาพิกัด (latitude, longitude) ของจุดเริ่มต้นและทุกจุดจัดส่ง
2. แนะนำลำดับการจัดส่งที่ดีที่สุด โดยพิจารณาจากตำแหน่งทางภูมิศาสตร์ เส้นทางถนน และการจราจร

ตอบเป็น JSON เท่านั้น ไม่ต้องมี markdown:
{
  "origin": { "lat": number, "lon": number },
  "points": [
    { "idx": number, "lat": number, "lon": number }
  ],
  "optimizedOrder": [index ที่เรียงตามลำดับที่ควรจัดส่ง],
  "reasoning": "คำอธิบายสั้นๆ ว่าทำไมถึงเรียงแบบนี้"
}

สำคัญ: optimizedOrder ต้องเป็น array ของ index (0-based) จากจุดจัดส่งด้านบน`;

  const aiResult = await askGemini(prompt);
  if (!aiResult) return { error: "ไม่สามารถเชื่อมต่อ Gemini AI ได้" };

  let parsed: any;
  try {
    // Clean the response - remove markdown code blocks if any
    const cleaned = aiResult.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return { error: "AI ตอบกลับในรูปแบบที่ไม่ถูกต้อง" };
  }

  if (!parsed.origin || !parsed.optimizedOrder || !Array.isArray(parsed.optimizedOrder)) {
    return { error: "AI ตอบกลับไม่ครบถ้วน" };
  }

  const optimizedOrder: number[] = parsed.optimizedOrder;
  const reasoning: string = parsed.reasoning || "";

  // Step 2: Use OSRM to calculate actual driving distances
  // Build coordinates in optimized order
  const origin = parsed.origin;
  const orderedPoints = optimizedOrder.map((idx: number) => {
    const p = parsed.points?.find((pt: any) => pt.idx === idx);
    return p || null;
  }).filter(Boolean);

  if (orderedPoints.length < 2) {
    // If OSRM can't be used, return AI result without distances
    return {
      optimizedOrder,
      totalDistance: "—",
      totalDuration: "—",
      reasoning,
      legs: optimizedOrder.map((idx: number) => ({
        address: addresses[idx] || "",
        distance: "—",
        duration: "—",
      })),
    };
  }

  // Call OSRM for driving route
  const allCoords = [
    `${origin.lon},${origin.lat}`,
    ...orderedPoints.map((p: any) => `${p.lon},${p.lat}`),
  ].join(";");

  try {
    const osrmRes = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${allCoords}?overview=false&steps=false`
    );
    const osrmData = await osrmRes.json();

    if (osrmData.code === "Ok" && osrmData.routes?.[0]) {
      const route = osrmData.routes[0];
      const legs = route.legs.map((leg: any, i: number) => {
        const distKm = leg.distance / 1000;
        const durMin = Math.round(leg.duration / 60);
        return {
          address: i < optimizedOrder.length ? addresses[optimizedOrder[i]] || "" : "",
          distance: distKm >= 1 ? `${distKm.toFixed(1)} km` : `${Math.round(leg.distance)} m`,
          duration: durMin >= 60 ? `${Math.floor(durMin / 60)} ชม. ${durMin % 60} นาที` : `${durMin} นาที`,
        };
      });

      const totalDistKm = route.distance / 1000;
      const totalDurMin = Math.round(route.duration / 60);

      return {
        optimizedOrder,
        totalDistance: totalDistKm >= 1 ? `${totalDistKm.toFixed(1)} km` : `${Math.round(route.distance)} m`,
        totalDuration: totalDurMin >= 60
          ? `${Math.floor(totalDurMin / 60)} ชม. ${totalDurMin % 60} นาที`
          : `${totalDurMin} นาที`,
        reasoning,
        legs,
      };
    }
  } catch { /* fall through */ }

  // Fallback if OSRM fails — return AI result without distances
  return {
    optimizedOrder,
    totalDistance: "—",
    totalDuration: "—",
    reasoning,
    legs: optimizedOrder.map((idx: number) => ({
      address: addresses[idx] || "",
      distance: "—",
      duration: "—",
    })),
  };
}

// AI suggests which orders to select from the full list based on proximity + route efficiency
export async function suggestDeliveryOrders(
  originAddress: string,
  orders: { id: string; customerName: string; customerAddress: string; orderNumber: string }[],
  maxOrders?: number
): Promise<{ selectedIndices: number[]; reasoning: string } | { error: string }> {
  if (!API_KEY) return { error: "ยังไม่ได้ตั้งค่า API Key" };
  if (orders.length === 0) return { error: "ไม่มี orders" };

  const limit = maxOrders || Math.min(orders.length, 10);

  const prompt = `คุณเป็นผู้เชี่ยวชาญด้านโลจิสติกส์และการจัดส่งสินค้าในประเทศไทย

จุดเริ่มต้น (สาขา/คลัง): "${originAddress}"

รายการ orders ที่รอจัดส่ง:
${orders.map((o, i) => `${i}: [${o.orderNumber}] ${o.customerName} — "${o.customerAddress}"`).join("\n")}

วิเคราะห์และเลือก orders ที่ควรจัดส่งด้วยกันในรอบเดียว (สูงสุด ${limit} orders) โดยพิจารณา:
1. ความใกล้ชิดทางภูมิศาสตร์ — เลือก orders ที่อยู่ในโซนเดียวกันหรือเส้นทางเดียวกัน
2. ประสิทธิภาพเส้นทาง — เรียงลำดับให้ขับรถสั้นที่สุด ไม่ต้องวนไปวนมา
3. ความเป็นไปได้ — ส่งทันภายในวันเดียว

ตอบเป็น JSON เท่านั้น ไม่ต้องมี markdown:
{
  "selectedIndices": [index ของ orders ที่เลือก เรียงตามลำดับจัดส่ง],
  "reasoning": "คำอธิบายสั้นๆ เป็นภาษาไทย ว่าทำไมเลือก orders เหล่านี้ และเรียงแบบนี้"
}`;

  const aiResult = await askGemini(prompt);
  if (!aiResult) return { error: "ไม่สามารถเชื่อมต่อ Gemini AI ได้" };

  try {
    const cleaned = aiResult.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (!parsed.selectedIndices || !Array.isArray(parsed.selectedIndices)) {
      return { error: "AI ตอบกลับไม่ครบถ้วน" };
    }
    return {
      selectedIndices: parsed.selectedIndices,
      reasoning: parsed.reasoning || "",
    };
  } catch {
    return { error: "AI ตอบกลับในรูปแบบที่ไม่ถูกต้อง" };
  }
}

// AI sorts ALL given orders based purely on logical driving distance from the origin branch
export async function sortOrdersByDistance(
  originAddress: string,
  orders: { id: string; customerName: string; customerAddress: string }[]
): Promise<{ sortedIds: string[] } | { error: string }> {
  if (!API_KEY) return { error: "ยังไม่ได้ตั้งค่า API Key" };
  if (orders.length === 0) return { error: "ไม่มี orders" };

  const prompt = `คุณเป็นผู้เชี่ยวชาญด้านโลจิสติกส์ในประเทศไทย

จุดเริ่มต้น: "${originAddress}"

รายชื่อจุดส่ง:
${orders.map((o) => `[ID: ${o.id}] "${o.customerAddress || o.customerName}"`).join("\n")}

จงเรียงลำดับจุดส่งทั้งหมดข้างต้น โดยเริ่มจากจุดที่อยู่ใกล้และเดินทางจากจุดเริ่มต้นได้สะดวกที่สุด ไปยังจุดที่ไกลที่สุด

ตอบเป็น JSON เท่านั้น ไม่ต้องมี markdown:
{
  "sortedIds": ["ID1", "ID2", "ID3", ...]
}

ห้ามตัด ID ใดๆ ออก ต้องเรียงให้ครบทุก ID จากข้อมูลด้านบน`;

  const aiResult = await askGemini(prompt);
  if (!aiResult) return { error: "ไม่สามารถเชื่อมต่อ Gemini AI ได้" };

  try {
    const cleaned = aiResult.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (!parsed.sortedIds || !Array.isArray(parsed.sortedIds)) {
      return { error: "AI ตอบกลับไม่ครบถ้วน" };
    }
    return { sortedIds: parsed.sortedIds };
  } catch {
    return { error: "AI ตอบกลับในรูปแบบที่ไม่ถูกต้อง" };
  }
}
