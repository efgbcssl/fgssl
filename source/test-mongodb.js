// Test MongoDB connection
const { MongoClient } = require('mongodb');

async function testConnection() {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
        console.error('❌ MONGODB_URI environment variable is not set');
        return;
    }
    
    console.log('🔍 Testing MongoDB connection...');
    console.log('URI:', uri.replace(/\/\/.*@/, '//***:***@')); // Hide credentials
    
    try {
        const client = new MongoClient(uri);
        await client.connect();
        console.log('✅ MongoDB connection successful!');
        
        // Test database access
        const db = client.db();
        const collections = await db.listCollections().toArray();
        console.log('📁 Available collections:', collections.map(c => c.name));
        
        await client.close();
        console.log('🔌 Connection closed');
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        
        if (error.message.includes('authentication failed')) {
            console.log('\n💡 Possible fixes:');
            console.log('1. Check your username and password');
            console.log('2. Make sure special characters in password are URL-encoded');
            console.log('3. Verify the database user has proper permissions');
            console.log('4. Check if the user exists in MongoDB Atlas');
        }
    }
}

testConnection();
