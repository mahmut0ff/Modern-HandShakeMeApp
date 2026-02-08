import { OrderRepository } from './core/shared/repositories/order.repository';
import { logger } from './core/shared/utils/logger';

async function verifyFix() {
    const orderRepo = new OrderRepository();
    const testClientId = 'test-client-' + Date.now();

    console.log('--- Verification Started ---');
    console.log(`Using Test Client ID: ${testClientId}`);

    try {
        // 1. Create a test order
        console.log('Step 1: Creating test order...');
        const newOrder = await orderRepo.create({
            clientId: testClientId,
            categoryId: '1',
            title: 'Test Job Visibility Fix',
            description: 'This is a test job to verify that the GSI3 indexing fix works correctly.',
            city: 'Bishkek',
            budgetType: 'NEGOTIABLE'
        });
        console.log(`Order created with ID: ${newOrder.id}`);

        // 2. Fetch orders for this client
        console.log('Step 2: Fetching orders for client...');
        const clientOrders = await orderRepo.findByClient(testClientId);

        console.log(`Found ${clientOrders.length} orders for client.`);

        const foundOrder = clientOrders.find(o => o.id === newOrder.id);

        if (foundOrder) {
            console.log('SUCCESS: New order found in client order list!');
            console.log(`Order Title: ${foundOrder.title}`);
        } else {
            console.error('FAILURE: New order NOT found in client order list.');
            process.exit(1);
        }

    } catch (error) {
        console.error('An error occurred during verification:', error);
        process.exit(1);
    }

    console.log('--- Verification Completed Successfully ---');
}

verifyFix();
