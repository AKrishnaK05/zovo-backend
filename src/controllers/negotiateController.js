const { WebPubSubServiceClient } = require('@azure/web-pubsub');

// Config
const HUB_NAME = 'Hub';

const negotiate = async (req, res) => {
    try {
        const connectionString = process.env.AZURE_WEB_PUBSUB_CONNECTION_STRING || process.env.WebPubSubConnectionString;

        if (!connectionString) {
            // If no connection string (e.g. local), return 400 or a specific status letting frontend know to use local Socket.IO
            return res.status(400).json({
                success: false,
                message: 'Azure Web PubSub not configured. Use local Socket.IO connection.'
            });
        }

        const serviceClient = new WebPubSubServiceClient(connectionString, HUB_NAME);

        // Get userId from query or auth (req.user.id)
        // User requested req.query.userId specifically for testing
        const userId = req.query.userId || (req.user ? req.user.id : null) || 'anonymous';

        // Generate token
        const token = await serviceClient.getClientAccessToken({
            userId: userId,
            roles: [`webpubsub.joinLeaveGroup`, `webpubsub.sendToGroup`] // standard roles
        });

        res.status(200).json({
            success: true,
            url: token.url
        });

    } catch (error) {
        console.error('Negotiate error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to negotiate Web PubSub token'
        });
    }
};

module.exports = { negotiate };
