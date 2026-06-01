/**
 * Reverse-geocoding via OpenStreetMap Nominatim.
 *
 * Turns a lat/lng into a human-readable address plus structured fields
 * (country, state, district, road). Nominatim is a free, best-effort service
 * with a strict usage policy, so this module:
 *
 *   - sends the required descriptive `User-Agent`;
 *   - applies a short timeout;
 *   - NEVER throws on failure — it returns `null` so a flaky third party can
 *     never block a citizen's complaint submission.
 *
 * @see https://nominatim.org/release-docs/develop/api/Reverse/
 */

import axios from "axios";
import { env } from "../config/env.js";
import type { Country } from "@prisma/client";

/** Structured result of a reverse-geocode lookup. */
export interface ReverseGeocodeResult {
  /** Full formatted display address, when available. */
  address: string | null;
  /** Country name as reported by OSM (free-text, not the enum). */
  countryName: string | null;
  /** ISO 3166-1 alpha-2 country code (upper-cased), when available. */
  countryCode: string | null;
  /** State / region, when available. */
  state: string | null;
  /** District / county, when available. */
  district: string | null;
  /** Road / street name, when available. */
  roadName: string | null;
}

/** Subset of the Nominatim reverse response we read. */
interface NominatimAddress {
  road?: string;
  state?: string;
  county?: string;
  state_district?: string;
  country?: string;
  country_code?: string;
}

/** Top-level Nominatim reverse response shape. */
interface NominatimReverseResponse {
  display_name?: string;
  address?: NominatimAddress;
  error?: string;
}

/** Request timeout for the Nominatim call, in milliseconds. */
const REQUEST_TIMEOUT_MS = 5000;

/**
 * Map a Prisma {@link Country} enum value to its ISO alpha-2 code, used to
 * confirm a geocoded point falls in the user's registered country.
 */
const COUNTRY_ISO: Readonly<Record<Country, string>> = {
  INDIA: "IN",
  BANGLADESH: "BD",
  NEPAL: "NP",
  SRI_LANKA: "LK",
  MYANMAR: "MM",
  THAILAND: "TH",
  BHUTAN: "BT",
};

/**
 * Resolve the ISO alpha-2 code for a {@link Country} enum value.
 *
 * @param country Prisma country enum.
 * @returns Upper-case ISO 3166-1 alpha-2 code (e.g. `"IN"`).
 */
export function isoCodeForCountry(country: Country): string {
  return COUNTRY_ISO[country];
}

/**
 * Reverse-geocode a coordinate to an address (best effort).
 *
 * @param latitude  Latitude in decimal degrees.
 * @param longitude Longitude in decimal degrees.
 * @returns A {@link ReverseGeocodeResult}, or `null` if the lookup fails.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodeResult | null> {
  try {
    const response = await axios.get<NominatimReverseResponse>(
      `${env.NOMINATIM_BASE_URL}/reverse`,
      {
        params: {
          lat: latitude,
          lon: longitude,
          format: "json",
          zoom: 18,
          addressdetails: 1,
        },
        headers: {
          "User-Agent": env.NOMINATIM_USER_AGENT,
          Accept: "application/json",
        },
        timeout: REQUEST_TIMEOUT_MS,
      },
    );

    const data = response.data;
    if (!data || data.error) return null;

    const addr = data.address ?? {};
    return {
      address: data.display_name ?? null,
      countryName: addr.country ?? null,
      countryCode: addr.country_code ? addr.country_code.toUpperCase() : null,
      state: addr.state ?? null,
      district: addr.county ?? addr.state_district ?? null,
      roadName: addr.road ?? null,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(
      "[geocode.service] Reverse geocode failed; continuing without address:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
