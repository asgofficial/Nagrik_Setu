import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const radiusKmStr = searchParams.get('radius') || '2';
    const category = searchParams.get('category') || 'All';
    const severity = searchParams.get('severity') || 'All';
    const status = searchParams.get('status') || 'All';

    if (!latStr || !lngStr) {
      return NextResponse.json(
        { error: 'Missing lat or lng query parameters.' },
        { status: 400 }
      );
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    const radiusMeters = parseFloat(radiusKmStr) * 1000;

    if (isNaN(lat) || isNaN(lng) || isNaN(radiusMeters)) {
      return NextResponse.json(
        { error: 'Invalid latitude, longitude or radius parameters.' },
        { status: 400 }
      );
    }

    // Perform PostGIS spatial query using RPC function get_nearby_grievances
    const { data: nearbyGrievances, error: gError } = await supabase.rpc(
      'get_nearby_grievances',
      {
        user_lat: lat,
        user_lng: lng,
        radius_meters: radiusMeters,
        filter_category: category,
        filter_severity: severity,
        filter_status: status,
      }
    );

    if (gError) {
      console.error('[API /nearby] PostGIS grievances query error:', gError);
      return NextResponse.json(
        { error: 'Database spatial query failed.', details: gError.message },
        { status: 500 }
      );
    }

    // Perform PostGIS spatial query for nearby clusters using get_nearby_clusters
    const { data: nearbyClusters, error: cError } = await supabase.rpc(
      'get_nearby_clusters',
      {
        user_lat: lat,
        user_lng: lng,
        radius_meters: radiusMeters,
        filter_category: category,
        filter_severity: severity,
      }
    );

    if (cError) {
      console.warn('[API /nearby] PostGIS clusters query warning:', cError);
    }

    // Map public-safe grievance fields for citizen response
    const publicGrievances = (nearbyGrievances || []).map((g: any) => ({
      id: g.id,
      title: g.title,
      description: g.description,
      category: g.category,
      severity: g.severity,
      latitude: g.latitude,
      longitude: g.longitude,
      landmark: g.landmark,
      createdAt: g.created_at,
      status: g.status,
      isAnonymous: g.is_anonymous,
      evidence: g.evidence || [],
      clusterId: g.cluster_id,
      citizenConfirmations: g.citizen_confirmations || 0,
      slaDeadline: g.sla_deadline,
      isEscalated: g.is_escalated,
      escalatedTo: g.escalated_to,
      distanceMeters: Math.round(g.distance_meters || 0),
    }));

    const publicClusters = (nearbyClusters || []).map((c: any) => ({
      id: c.id,
      title: c.name || c.title || 'Civic Cluster',
      category: c.category,
      latitude: c.latitude,
      longitude: c.longitude,
      radiusMeters: c.affected_radius || 220,
      confidence: c.confidence || 90,
      reportsCount: c.reports_count || 0,
      citizenConfirmations: c.citizen_confirmations || 0,
      severity: c.severity,
      status: c.status,
      createdAt: c.created_at,
      description: c.description,
      distanceMeters: Math.round(c.distance_meters || 0),
    }));

    return NextResponse.json({
      grievances: publicGrievances,
      clusters: publicClusters,
      count: publicGrievances.length,
      clusterCount: publicClusters.length,
      queryCenter: { lat, lng, radiusKm: parseFloat(radiusKmStr) },
    });
  } catch (err: any) {
    console.error('[API /nearby] Fatal error:', err);
    return NextResponse.json(
      { error: 'Internal server error processing nearby query.' },
      { status: 500 }
    );
  }
}
