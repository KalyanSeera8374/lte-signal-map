import DeviceDetail from "../models/device_Details.js";
import { getCityCenter } from "../utils/geocodeCity.js";

export const devicesService = {
  async list({ limit, page, device_name, lat, lng, radius }) {
    const match = {};
    if (device_name) match.device_name = device_name;

    // If lat/lng provided, use $geoNear to compute distance
    if (lat && lng) {
      const pipeline = [
        {
          $geoNear: {
            near: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
            distanceField: "distance_km",
            distanceMultiplier: 0.001,   // meters → km
            spherical: true,
            ...(radius && { maxDistance: parseFloat(radius) * 1000 }), // km→m
          },
        },
        { $match: match },
        { $sort: { distance_km: 1 } },
      ];

      if (limit && page) {
        pipeline.push({ $skip: (page - 1) * limit }, { $limit: limit });
      }

      const items = await DeviceDetail.aggregate(pipeline);
      const total = (await DeviceDetail.aggregate([
        { $geoNear: { ...pipeline[0].$geoNear, distanceField: "tmp" } },
        { $match: match },
        { $count: "count" },
      ]))[0]?.count || items.length;

      return { items, total };
    }

    // Otherwise, normal find without geo
    let q = DeviceDetail.find(match).sort({ updatedAt: -1 });
    if (limit && page) q = q.skip((page - 1) * limit).limit(limit);
    const [items, total] = await Promise.all([
      q.lean(),
      DeviceDetail.countDocuments(match),
    ]);
    return { items, total };
  },
   async getById(id) {
    return DeviceDetail.findById(id).lean();
  },
  // 👇 NEW: center on city and search by radius
  async nearCity({ city, state, country, radiusKm, device_name, limit, page }) {
    // 1) Geocode the city to get center point
    const center = await getCityCenter(city, state, country);
    if (!center) {
      const name = [city, state, country].filter(Boolean).join(", ");
      const err = new Error(`Could not geocode city: ${name}`);
      err.status = 400;
      throw err;
    }

    const match = {};
    if (device_name) match.device_name = device_name;

    // 2) $geoNear around the city center
    const near = {
      near: { type: "Point", coordinates: [center.lon, center.lat] }, // [lng, lat]
      distanceField: "distance_km",
      distanceMultiplier: 0.001, // meters → km
      spherical: true,
      maxDistance: radiusKm * 1000, // radius in meters
    };

    const pipeline = [{ $geoNear: near }, { $match: match }, { $sort: { distance_km: 1 } }];
    if (limit && page) pipeline.push({ $skip: (page - 1) * limit }, { $limit: limit });

    const items = await DeviceDetail.aggregate(pipeline);
    const countPipe = [{ $geoNear: near }, { $match: match }, { $count: "count" }];
    const total = (await DeviceDetail.aggregate(countPipe))[0]?.count ?? items.length;

    return { items, total };
  },
};
