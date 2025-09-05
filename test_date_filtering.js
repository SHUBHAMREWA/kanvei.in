// Test script for date filtering functionality
// This can be run in the browser console on the orders page

console.log("🚀 Testing Advanced Date Filtering for Orders");

// Test different date filter options
const testDateFilters = async () => {
  const baseUrl = window.location.origin;
  const testUserId = 'test-user-id'; // Replace with actual user ID for testing
  
  const dateFilters = [
    { filter: 'all', description: 'All Time' },
    { filter: 'today', description: 'Today' },
    { filter: 'yesterday', description: 'Yesterday' },
    { filter: '7_days', description: 'Last 7 Days' },
    { filter: '2_weeks', description: 'Last 2 Weeks' },
    { filter: '3_weeks', description: 'Last 3 Weeks' },
    { filter: '1_month', description: 'Last Month' },
    { filter: '2_months', description: 'Last 2 Months' },
    { filter: 'custom', description: 'Custom Range (Jan 1 - Dec 31, 2024)' }
  ];
  
  console.log("📅 Testing Date Filter Options:");
  
  for (const { filter, description } of dateFilters) {
    try {
      let url = `${baseUrl}/api/orders?userId=${testUserId}&dateFilter=${filter}`;
      
      // Add custom date range for custom filter
      if (filter === 'custom') {
        url += '&startDate=2024-01-01&endDate=2024-12-31';
      }
      
      console.log(`\n🔍 Testing: ${description} (${filter})`);
      console.log(`📡 URL: ${url}`);
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Success: Found ${data.orders?.length || 0} orders`);
        
        // Show date range of found orders
        if (data.orders && data.orders.length > 0) {
          const dates = data.orders.map(order => new Date(order.createdAt));
          const minDate = new Date(Math.min(...dates));
          const maxDate = new Date(Math.max(...dates));
          console.log(`📊 Date range: ${minDate.toLocaleDateString()} to ${maxDate.toLocaleDateString()}`);
        }
      } else {
        console.log(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
  }
  
  console.log("\n✨ Date filtering tests completed!");
};

// Test status filtering
const testStatusFiltering = async () => {
  const baseUrl = window.location.origin;
  const testUserId = 'test-user-id'; // Replace with actual user ID for testing
  
  const statusFilters = ['all', 'pending', 'processing', 'shipping', 'delivered', 'cancelled'];
  
  console.log("\n📋 Testing Status Filter Options:");
  
  for (const status of statusFilters) {
    try {
      const url = `${baseUrl}/api/orders?userId=${testUserId}&status=${status}`;
      console.log(`\n🔍 Testing status: ${status}`);
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Success: Found ${data.orders?.length || 0} orders with status '${status}'`);
      } else {
        console.log(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
  }
};

// Test combined filtering
const testCombinedFiltering = async () => {
  const baseUrl = window.location.origin;
  const testUserId = 'test-user-id'; // Replace with actual user ID for testing
  
  console.log("\n🔄 Testing Combined Filtering:");
  
  try {
    const url = `${baseUrl}/api/orders?userId=${testUserId}&status=delivered&dateFilter=1_month`;
    console.log(`🔍 Testing: Delivered orders from last month`);
    console.log(`📡 URL: ${url}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Success: Found ${data.orders?.length || 0} delivered orders from last month`);
    } else {
      console.log(`❌ Error: ${data.error}`);
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }
};

// Helper function to test UI filters
const testUIFilters = () => {
  console.log("\n🎨 Testing UI Filter Components:");
  
  // Check if date filter dropdown exists
  const dateFilter = document.querySelector('select[value*="dateFilter"], select[value*="7_days"], select[value*="1_month"]');
  if (dateFilter) {
    console.log("✅ Date filter dropdown found");
  } else {
    console.log("❌ Date filter dropdown not found");
  }
  
  // Check if custom date inputs exist
  const startDateInput = document.querySelector('input[type="date"]');
  if (startDateInput) {
    console.log("✅ Custom date range inputs found");
  } else {
    console.log("❌ Custom date range inputs not found");
  }
  
  // Check if filter summary badges exist
  const filterBadges = document.querySelectorAll('.bg-green-100, .bg-blue-100, .bg-purple-100');
  console.log(`📋 Found ${filterBadges.length} filter summary badges`);
};

// Main test function
const runAllTests = async () => {
  console.log("🧪 Starting comprehensive date filtering tests...\n");
  
  testUIFilters();
  await testDateFilters();
  await testStatusFiltering();
  await testCombinedFiltering();
  
  console.log("\n🎉 All tests completed! Check the results above.");
  console.log("💡 To test with real data, replace 'test-user-id' with an actual user ID from your database.");
};

// Auto-run tests (comment out if you want to run manually)
// runAllTests();

console.log("📚 Available test functions:");
console.log("- testDateFilters(): Test date filtering options");
console.log("- testStatusFiltering(): Test status filtering");
console.log("- testCombinedFiltering(): Test combined filters");
console.log("- testUIFilters(): Test UI components");
console.log("- runAllTests(): Run all tests");
console.log("\n💡 Call any function to start testing, e.g.: testDateFilters()");
