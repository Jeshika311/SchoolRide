import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'SchoolRide API',
            version: '1.0.0',
            description: 'API documentation for the SchoolRide backend',
        },
        servers: [
            {
                url: 'http://localhost:5000/api',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'token',
                },
            },
        },
        security: [{ cookieAuth: [] }],
    },
    apis: ['./routes/*.js'], // Files containing annotations
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
