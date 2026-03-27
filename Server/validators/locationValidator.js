import Joi from 'joi';

const objectId = Joi.string().length(24).hex();

export const createLocationSchema = Joi.object({
    trip_id: objectId.required(),
    longitude: Joi.number().min(-180).max(180).required(),
    latitude: Joi.number().min(-90).max(90).required(),
    speed: Joi.number().min(0).default(0)
});

export const updateLocationSchema = Joi.object({
    trip_id: objectId.optional(),
    longitude: Joi.number().min(-180).max(180).optional(),
    latitude: Joi.number().min(-90).max(90).optional(),
    speed: Joi.number().min(0).optional()
})
    .or('trip_id', 'longitude', 'latitude', 'speed')
    .custom((value, helpers) => {
        const hasLongitude = value.longitude !== undefined;
        const hasLatitude = value.latitude !== undefined;
        if (hasLongitude !== hasLatitude) {
            return helpers.error('any.custom', {
                message: 'Both longitude and latitude are required together'
            });
        }
        return value;
    }, 'coordinates pair validation');

export const locationListQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    trip_id: objectId.optional()
});

export const locationHistoryQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(500).default(50)
});

export const nearbyLocationQuerySchema = Joi.object({
    longitude: Joi.number().min(-180).max(180).required(),
    latitude: Joi.number().min(-90).max(90).required(),
    radius: Joi.number().integer().min(1).max(100000).default(1000)
});