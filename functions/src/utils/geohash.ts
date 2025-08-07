import { geohashForLocation, geohashQueryBounds, distanceBetween } from 'geofire-common';
import { Location } from '../types';

export const generateGeohash = (latitude: number, longitude: number): string => {
  return geohashForLocation([latitude, longitude]);
};

export const getGeohashBounds = (
  center: [number, number],
  radiusInKm: number
): string[][] => {
  return geohashQueryBounds(center, radiusInKm * 1000); // Convert km to meters
};

export const calculateDistance = (
  location1: Location,
  location2: Location
): number => {
  return distanceBetween(
    [location1.latitude, location1.longitude],
    [location2.latitude, location2.longitude]
  ) / 1000; // Convert meters to km
};

export const isWithinRadius = (
  center: Location,
  target: Location,
  radiusInKm: number
): boolean => {
  const distance = calculateDistance(center, target);
  return distance <= radiusInKm;
};

export const createLocationObject = (
  latitude: number,
  longitude: number,
  address: string,
  city: string,
  state: string,
  country: string,
  postalCode?: string
): Location => {
  return {
    latitude,
    longitude,
    address,
    geohash: generateGeohash(latitude, longitude),
    city,
    state,
    country,
    postalCode,
  };
};