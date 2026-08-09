'use server';

import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';
import { getGrievances, getClusters } from '../../../../services/grievanceService';
import { Grievance, CivicCluster } from '../../../../types';

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function filterNearbyGrievances(grievances: Grievance[], lat: number, lng: number, radiusKm: number) {
  return grievances.filter((g) => {
    if (typeof g.latitude !== 'number' || typeof g.longitude !== 'number') {
      return false;
    }
    return calculateDistanceKm(lat, lng, g.latitude, g.longitude) <= radiusKm;
  });
}

function filterNearbyClusters(clusters: CivicCluster[], lat: number, lng: number, radiusKm: number) {
  return clusters.filter((c) => {
    if (typeof c.latitude !== 'number' || typeof c.longitude !== 'number') {
      return false;
    }
    const centerDistance = calculateDistanceKm(lat, lng, c.latitude, c.longitude);
    const clusterRadiusKm = (c.radiusMeters || 0) / 1000;
    return centerDistance <= radiusKm + clusterRadiusKm;
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const latParam = url.searchParams.get('lat');
  const lngParam = url.searchParams.get('lng');
  const radiusParam = url.searchParams.get('radius');

  if (!latParam || !lngParam) {
    return NextResponse.json({ error: 'Latitude and longitude are required.' }, { status: 400 });
  }

  const lat = Number(latParam);
  const lng = Number(lngParam);
  const radiusKm = Number(radiusParam ?? '2');

  if (Number.isNaN(lat) || Number.isNaN(lng) || Number.isNaN(radiusKm)) {
    return NextResponse.json({ error: 'Invalid numeric query parameters.' }, { status: 400 });
  }

  const isSupabaseConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  try {
    if (isSupabaseConfigured) {
      const { data: grievanceRows, error: grievanceError } = await supabase
        .from('grievances')
        .select('*');

      const { data: clusterRows, error: clusterError } = await supabase
        .from('clusters')
        .select('*');

      if (grievanceError || clusterError) {
        console.warn('[NearbyAPI] Supabase query error', grievanceError || clusterError);
      }

      const mappedGrievances: Grievance[] = (grievanceRows || []).map((g: any) => ({
        id: g.id,
        title: g.title,
        description: g.description,
        category: g.category,
        severity: g.severity || 'HIGH',
        latitude: g.latitude,
        longitude: g.longitude,
        landmark: g.landmark,
        createdAt: g.created_at || g.createdAt,
        status: g.status,
        isAnonymous: g.is_anonymous !== undefined ? g.is_anonymous : g.isAnonymous,
        authorityId: g.authority_id || g.authorityId,
        clusterId: g.cluster_id || g.clusterId,
        reporterId: g.reporter_id || g.reporterId,
        evidence: g.evidence || [],
        timeline: g.timeline || [],
        citizenConfirmations: g.citizen_confirmations !== undefined ? g.citizen_confirmations : (g.citizenConfirmations || 0),
        slaDeadline: g.sla_deadline || g.slaDeadline,
        isEscalated: g.is_escalated !== undefined ? g.is_escalated : (g.isEscalated || false)
      }));

      const mappedClusters: CivicCluster[] = (clusterRows || []).map((c: any) => ({
        id: c.id,
        title: c.name || c.title || 'Cluster',
        category: c.category,
        latitude: c.latitude,
        longitude: c.longitude,
        radiusMeters: c.radius_meters !== undefined ? c.radius_meters : (c.radiusMeters || 0),
        confidence: c.confidence,
        reportsCount: c.reports_count !== undefined ? c.reports_count : (c.reportsCount || 0),
        citizenConfirmations: c.citizen_confirmations !== undefined ? c.citizen_confirmations : (c.citizenConfirmations || 0),
        severity: c.severity || 'HIGH',
        status: c.status,
        createdAt: c.created_at || c.createdAt,
        lastReportedAt: c.last_reported_at || c.lastReportedAt,
        authorityId: c.authority_id || c.authorityId || 'dept-electrical',
        description: c.description || ''
      }));

      return NextResponse.json({
        grievances: filterNearbyGrievances(mappedGrievances, lat, lng, radiusKm),
        clusters: filterNearbyClusters(mappedClusters, lat, lng, radiusKm)
      });
    }

    const localGrievances = getGrievances();
    const localClusters = getClusters();
    return NextResponse.json({
      grievances: filterNearbyGrievances(localGrievances, lat, lng, radiusKm),
      clusters: filterNearbyClusters(localClusters, lat, lng, radiusKm)
    });
  } catch (error) {
    console.error('[NearbyAPI] error', error);
    return NextResponse.json({ error: 'Unable to resolve nearby grievances.' }, { status: 500 });
  }
}
