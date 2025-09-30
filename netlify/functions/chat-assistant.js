const Anthropic = require('@anthropic-ai/sdk');

const BAZA_WIEDZY = `
# BAZA WIEDZY SUNDEK ENERGIA

## DANE FIRMY
- Nazwa: SUNDEK ENERGIA sp. z o.o.
- NIP: 6351863563
- Telefon: +48 518 618 058
- Email: biuro@sundek-energia.pl

## PRODUKTY I CENY (2025)

### MODUŁY
- Hyundai 450W: ~450 PLN netto/szt

### FALOWNIKI
- Deye hybrydowy 12kW: ~8.500 PLN netto
- Deye sieciowy 12kW: ~4.500 PLN netto

### MAGAZYNY
- Deye 10 kWh: ~12.000 PLN
- Deye 15 kWh: ~16.000 PLN (polecany)
- Deye 20 kWh: ~20.000 PLN

### KONSTRUKCJA
- ~1.200 PLN/kWp netto (dach skośny)

### MONTAŻ
- ~3.500 PLN netto (kompletny)

## VAT
- Instalacje PV: 8%

## PRODUKCJA (Śląsk)
- 950 kWh/kWp/rok

## AUTOKONSUMPCJA
- Bez magazynu: ~30%
- Z magazynem: ~70-80%

## DOTACJE 2025
- Mój Prąd 6.0: do 7.000 PLN (wymaga magazyn min 10kWh)
- Granty gminne: 3.000-5.000 PLN

## OKRES ZWROTU
- Z dotacjami: 6-8 lat

## WARUNKI
- Termin: 30 dni od umowy
- Płatności: 50/50 lub 30/70
- Gwarancja montaż: 3 lata

## FALOWNIK - RÓŻNICE

SIECIOWY:
- Tylko sieć
- Brak zasilania podczas awarii
- Tańszy (~4.500 PLN)

HYBRYDOWY:
- Sieć + magazyn + backup
- Zasilanie podczas awarii
- Droższy (~8.500 PLN)
- Przyszłościowy

## ARGUMENTY SPRZEDAŻOWE

"ZA DROGIE":
- Inwestycja ~53.000 zł
- Dotacje: -11.000 zł
- Rzeczywisty koszt: 42.000 zł
- Oszczędności: 5.700 zł/rok
- Zwrot w 7 lat, potem czyste oszczędności!

"PO CO MAGAZYN":
- Bez: autokonsumpcja 30%
- Z magazynem: 70-80%
- Różnica: 3.000-4.000 zł/rok więcej oszczędności!
- + dotacja 7.000 zł (tylko z magazynem)
- + prąd podczas awarii
`;

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { 
      statusCode: 204, 
      headers, 
      body: '' 
    };
  }

  // Check if POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  try {
    const { messages } = JSON.parse(event.body);
    
    const systemPrompt = `Jesteś AI asystentem dla handlowców SUNDEK ENERGIA.

${BAZA_WIEDZY}

ZASADY:
- Konkretnie, zwięźle, po partnersku
- Używaj liczb z bazy wiedzy
- Jeśli nie wiesz - powiedz że trzeba sprawdzić
- Pomagaj w czasie rzeczywistym!`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: messages
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
