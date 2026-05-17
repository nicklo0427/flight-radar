import "dotenv/config";
import { createTursoClient, createTursoRepository } from "../db/repositories.js";
import { loadEnvironment, getTursoConnectionConfig } from "../config/env.js";

interface SeedTrackedDestinationRow {
  id: string;
  originAirportCode: string;
  destinationAirportCode: string;
  destinationCity?: string;
  destinationCountry?: string;
  tripType: "round_trip" | "one_way";
  cabinClass: "economy" | "premium_economy" | "business" | "first";
  departureDateFrom?: string;
  departureDateTo?: string;
  returnDateFrom?: string;
  returnDateTo?: string;
  maxStops?: number | null;
  currencyCode: string;
  locale: string;
}

const seedRows: SeedTrackedDestinationRow[] = [
// 2027/01 桃園 TPE → 檳城 PEN
  // 需求：週四 / 週五出發，隔週週二 / 週三回程，直飛
  {
    id: "tpe-pen-rt-econ-2027-01",
    originAirportCode: "TPE",
    destinationAirportCode: "PEN",
    destinationCity: "Penang",
    destinationCountry: "Malaysia",
    tripType: "round_trip",
    cabinClass: "economy",
    departureDateFrom: "2027-01-01",
    departureDateTo: "2027-01-29",
    returnDateFrom: "2027-01-12",
    returnDateTo: "2027-02-10",
    maxStops: 0,
    currencyCode: "TWD",
    locale: "zh-TW"
  },

  // 2027/05月底～06月初 松山 TSA → 東京羽田 HND
  // 需求：月底 / 六月初出發，5～7天回程，直飛
  {
    id: "tsa-hnd-rt-econ-2027-05-06",
    originAirportCode: "TSA",
    destinationAirportCode: "HND",
    destinationCity: "Tokyo Haneda",
    destinationCountry: "Japan",
    tripType: "round_trip",
    cabinClass: "economy",
    departureDateFrom: "2027-05-25",
    departureDateTo: "2027-06-07",
    returnDateFrom: "2027-05-30",
    returnDateTo: "2027-06-14",
    maxStops: 0,
    currencyCode: "TWD",
    locale: "zh-TW"
  },

  // 2027/05月底～06月初 桃園 TPE → 東京羽田 HND
  {
    id: "tpe-hnd-rt-econ-2027-05-06",
    originAirportCode: "TPE",
    destinationAirportCode: "HND",
    destinationCity: "Tokyo Haneda",
    destinationCountry: "Japan",
    tripType: "round_trip",
    cabinClass: "economy",
    departureDateFrom: "2027-05-25",
    departureDateTo: "2027-06-07",
    returnDateFrom: "2027-05-30",
    returnDateTo: "2027-06-14",
    maxStops: 0,
    currencyCode: "TWD",
    locale: "zh-TW"
  },

  // 2027/05月底～06月初 桃園 TPE → 東京成田 NRT
  {
    id: "tpe-nrt-rt-econ-2027-05-06",
    originAirportCode: "TPE",
    destinationAirportCode: "NRT",
    destinationCity: "Tokyo Narita",
    destinationCountry: "Japan",
    tripType: "round_trip",
    cabinClass: "economy",
    departureDateFrom: "2027-05-25",
    departureDateTo: "2027-06-07",
    returnDateFrom: "2027-05-30",
    returnDateTo: "2027-06-14",
    maxStops: 0,
    currencyCode: "TWD",
    locale: "zh-TW"
  },

  // 2027/11 桃園 TPE → 清邁 CNX
  // 需求：11月出發，約5天回程，直飛
  {
    id: "tpe-cnx-rt-econ-2027-11",
    originAirportCode: "TPE",
    destinationAirportCode: "CNX",
    destinationCity: "Chiang Mai",
    destinationCountry: "Thailand",
    tripType: "round_trip",
    cabinClass: "economy",
    departureDateFrom: "2027-11-01",
    departureDateTo: "2027-11-30",
    returnDateFrom: "2027-11-06",
    returnDateTo: "2027-12-05",
    maxStops: 0,
    currencyCode: "TWD",
    locale: "zh-TW"
  }
];

async function main(): Promise<void> {
  const env = loadEnvironment();
  const client = createTursoClient(getTursoConnectionConfig(env));
  const repository = createTursoRepository(client);

  for (const row of seedRows) {
    await client.execute({
      sql: `
        INSERT OR REPLACE INTO tracked_destinations (
          id,
          origin_airport_code,
          destination_airport_code,
          destination_city,
          destination_country,
          trip_type,
          cabin_class,
          departure_date_from,
          departure_date_to,
          return_date_from,
          return_date_to,
          max_stops,
          currency_code,
          locale,
          is_active,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
      `,
      args: [
        row.id,
        row.originAirportCode,
        row.destinationAirportCode,
        row.destinationCity ?? null,
        row.destinationCountry ?? null,
        row.tripType,
        row.cabinClass,
        row.departureDateFrom ?? null,
        row.departureDateTo ?? null,
        row.returnDateFrom ?? null,
        row.returnDateTo ?? null,
        typeof row.maxStops === "number" ? row.maxStops : null,
        row.currencyCode,
        row.locale
      ]
    });
  }

  const activeDestinations = await repository.listActiveTrackedDestinations();

  console.log(`[seed-tracked-destinations] inserted or updated ${seedRows.length} rows`);
  console.log(`[seed-tracked-destinations] active tracked destinations: ${activeDestinations.length}`);

  for (const destination of activeDestinations) {
    console.log(
      `- ${destination.id}: ${destination.originAirportCode} -> ${destination.destinationAirportCode} (${destination.cabinClass})`
    );
  }

  await client.close();
}

void main().catch((error) => {
  console.error("[seed-tracked-destinations] failed", error);
  process.exitCode = 1;
});
