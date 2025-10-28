import { z } from "zod";

export const TickGpsSchema = z.object({
  timestamp: z.string().datetime().optional(),
  device_name: z.string(),
  gps_location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  mac_addr: z.string(),
  lte_signal_strength: z.number(),
});
