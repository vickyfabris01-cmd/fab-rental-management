import { db, BUCKETS, uploadFile } from "../../config/supabase";

// =============================================================================
// lib/api/rooms.js
//
// CRUD for buildings, floors, rooms, and beds.
// RLS ensures managers/owners only see their own tenant's data.
// =============================================================================

const ROOM_SELECT = `
  id, tenant_id, building_id, floor_id, room_number, room_type,
  capacity, monthly_price, semester_price, status,
  description, amenities, images, created_at, updated_at,
  buildings(id, name),
  floors(id, floor_number, floor_name)
`;

const BUILDING_SELECT =
  "id, tenant_id, name, address, description, total_floors, images, created_at, updated_at";

// ─────────────────────────────────────────────────────────────────────────────
// Buildings
// ─────────────────────────────────────────────────────────────────────────────

export async function getBuildings(tenantId) {
  const { data, error } = await db
    .buildings()
    .select(BUILDING_SELECT)
    .eq("tenant_id", tenantId)
    .order("name");
  return { data: data ?? [], error };
}

export async function getBuilding(buildingId) {
  const { data, error } = await db
    .buildings()
    .select(BUILDING_SELECT)
    .eq("id", buildingId)
    .single();
  return { data, error };
}

export async function createBuilding(tenantId, payload) {
  const { data, error } = await db
    .buildings()
    .insert({ tenant_id: tenantId, ...payload })
    .select(BUILDING_SELECT)
    .single();
  return { data, error };
}

export async function updateBuilding(buildingId, updates) {
  const { data, error } = await db
    .buildings()
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", buildingId)
    .select(BUILDING_SELECT)
    .single();
  return { data, error };
}

export async function deleteBuilding(buildingId) {
  const { error } = await db.buildings().delete().eq("id", buildingId);
  return { error };
}

// ─────────────────────────────────────────────────────────────────────────────
// Floors
// ─────────────────────────────────────────────────────────────────────────────

export async function getFloors(buildingId) {
  const { data, error } = await db
    .floors()
    .select("id, building_id, floor_number, floor_name, created_at")
    .eq("building_id", buildingId)
    .order("floor_number");
  return { data: data ?? [], error };
}

export async function createFloor(tenantId, buildingId, payload) {
  const { data, error } = await db
    .floors()
    .insert({ tenant_id: tenantId, building_id: buildingId, ...payload })
    .select()
    .single();
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// Rooms
// ─────────────────────────────────────────────────────────────────────────────

/**
 * List rooms for a tenant with optional filters.
 *
 * @param {string} tenantId
 * @param {object} [opts]
 * @param {string}   [opts.status]       Filter by room status
 * @param {string}   [opts.buildingId]   Filter by building
 * @param {string}   [opts.floorId]      Filter by floor
 * @param {string}   [opts.roomType]     Filter by type (single, double, dormitory)
 * @param {number}   [opts.limit]
 * @param {number}   [opts.offset]
 */
export async function getRooms(tenantId, opts = {}) {
  let query = db
    .rooms()
    .select(ROOM_SELECT)
    .eq("tenant_id", tenantId)
    .order("room_number");

  if (opts.status)     query = query.eq("status", opts.status);
  if (opts.buildingId) query = query.eq("building_id", opts.buildingId);
  if (opts.floorId)    query = query.eq("floor_id", opts.floorId);
  if (opts.roomType)   query = query.eq("room_type", opts.roomType);
  if (opts.limit)      query = query.limit(opts.limit);
  if (opts.offset)     query = query.range(opts.offset, opts.offset + (opts.limit ?? 50) - 1);

  const { data, error } = await query;
  return { data: data ?? [], error };
}

/**
 * Get a single room with its current tenancy and occupant info.
 */
export async function getRoom(roomId) {
  const { data, error } = await db
    .rooms()
    .select(`
      ${ROOM_SELECT},
      tenancies!inner(
        id, status, client_id, move_in_date, agreed_price,
        profiles!client_id(id, full_name, avatar_url, phone)
      )
    `)
    .eq("id", roomId)
    .single();
  return { data, error };
}

/**
 * Get rooms that are publicly browseable (available only).
 * No tenant_id filter — used on the public browse page.
 */
export async function getAvailableRooms(opts = {}) {
  let query = db
    .rooms()
    .select(`
      id, tenant_id, room_number, room_type, capacity,
      monthly_price, semester_price, status,
      description, amenities, images,
      buildings(id, name, address),
      tenants(id, name, slug)
    `)
    .eq("status", "available")
    .order("monthly_price");

  if (opts.roomType)   query = query.eq("room_type", opts.roomType);
  if (opts.maxPrice)   query = query.lte("monthly_price", opts.maxPrice);
  if (opts.minPrice)   query = query.gte("monthly_price", opts.minPrice);
  if (opts.buildingId) query = query.eq("building_id", opts.buildingId);
  if (opts.limit)      query = query.limit(opts.limit);

  const { data, error } = await query;
  return { data: data ?? [], error };
}

export async function createRoom(tenantId, payload) {
  const { data, error } = await db
    .rooms()
    .insert({ tenant_id: tenantId, ...payload })
    .select(ROOM_SELECT)
    .single();
  return { data, error };
}

export async function updateRoom(roomId, updates) {
  const { data, error } = await db
    .rooms()
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", roomId)
    .select(ROOM_SELECT)
    .single();
  return { data, error };
}

export async function deleteRoom(roomId) {
  const { error } = await db.rooms().delete().eq("id", roomId);
  return { error };
}

/**
 * Upload room images to Storage and append the URLs to the room's images array.
 *
 * @param {string}   roomId
 * @param {string}   tenantId
 * @param {File[]}   files
 * @returns {Promise<{ data: { images: string[] } | null, error }>}
 */
export async function uploadRoomImages(roomId, tenantId, files) {
  const urls = [];
  for (const file of files) {
    const ext  = file.name.split(".").pop();
    const path = `${tenantId}/${roomId}/${Date.now()}.${ext}`;
    try {
      const url = await uploadFile(BUCKETS.PROPERTY_IMGS, path, file);
      urls.push(url);
    } catch (err) {
      return { data: null, error: err };
    }
  }

  // Append to existing images array using Postgres array concat
  const { data: current } = await db.rooms().select("images").eq("id", roomId).single();
  const existing = current?.images ?? [];

  const { data, error } = await db
    .rooms()
    .update({ images: [...existing, ...urls], updated_at: new Date().toISOString() })
    .eq("id", roomId)
    .select("id, images")
    .single();
  return { data, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// Beds
// ─────────────────────────────────────────────────────────────────────────────

export async function getBeds(roomId) {
  const { data, error } = await db
    .beds()
    .select("id, room_id, bed_number, status, created_at")
    .eq("room_id", roomId)
    .order("bed_number");
  return { data: data ?? [], error };
}

export async function createBed(tenantId, roomId, bedNumber) {
  const { data, error } = await db
    .beds()
    .insert({ tenant_id: tenantId, room_id: roomId, bed_number: bedNumber, status: "available" })
    .select()
    .single();
  return { data, error };
}

export async function deleteBed(bedId) {
  const { error } = await db.beds().delete().eq("id", bedId);
  return { error };
}

// ─────────────────────────────────────────────────────────────────────────────
// Occupancy summary
// Quick count query used by the manager dashboard stats cards.
//
// @param {string} tenantId
// @returns {Promise<{ total, occupied, available, maintenance }>}
// ─────────────────────────────────────────────────────────────────────────────
export async function getRoomOccupancySummary(tenantId) {
  const { data, error } = await db
    .rooms()
    .select("status")
    .eq("tenant_id", tenantId);

  if (error) return { data: null, error };

  const summary = (data ?? []).reduce(
    (acc, r) => {
      acc.total++;
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    },
    { total: 0, available: 0, occupied: 0, maintenance: 0, reserved: 0 }
  );

  return { data: summary, error: null };
}
