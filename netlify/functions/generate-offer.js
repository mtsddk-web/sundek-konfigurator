const Anthropic = require('@anthropic-ai/sdk');

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
    const { prompt } = JSON.parse(event.body);
    
    // Prosty, szybki prompt
    const systemPrompt = `Jesteś kalkulatorem instalacji PV. Zwracasz TYLKO czysty JSON bez markdown, komentarzy czy dodatkowego tekstu.

CENY STAŁE (netto):
- Moduł 450W: 450 PLN
- Falownik 12kW: 8500 PLN
- Magazyn 15kWh: 16000 PLN
- Konstrukcja: 1200 PLN/kWp
- Montaż: 3500 PLN
- VAT: 8%
- Produkcja (Śląsk): 950 kWh/kWp/rok
- Dotacja Mój Prąd (z magazynem): 7000 PLN
- Dotacja gminna: 4000 PLN

Format odpowiedzi (przykład dla 10kWp z magazynem 15kWh):
{
  "zestawienie": {
    "moduly": {"model": "Hyundai 450W", "ilosc": 23, "cenaSzt": 450, "wartosc": 10350},
    "falownik": {"model": "Deye 12kW Hybrydowy", "cena": 8500},
    "magazyn": {"model": "Deye 15kWh", "cena": 16000},
    "konstrukcja": {"opis": "System montażowy", "cena": 12000},
    "montaz": {"opis": "Montaż kompletny", "cena": 3500},
    "razem": {"netto": 50350, "vat": 4028, "brutto": 54378}
  },
  "dotacje": {
    "mojPrad": 7000,
    "gminna": 4000,
    "razem": 11000
  },
  "poDoacji": 43378,
  "kalkulacjeROI": {
    "produkcjaRoczna": 9500,
    "oszczednosciRok": 5700,
    "okresZwrotu": "7.6"
  },
  "warunki": {
    "termin": "30 dni",
    "platnosci": "50% zaliczka, 50% po montażu",
    "gwarancjaMontaz": "3 lata"
  }
}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }]
    });

    let responseText = response.content[0].text;
    
    // Strip markdown i whitespace
    responseText = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    
    // Parse JSON
    const ofertaData = JSON.parse(responseText);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(ofertaData)
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        details: 'Błąd generowania oferty. Sprawdź logi.' 
      })
    };
  }
};
