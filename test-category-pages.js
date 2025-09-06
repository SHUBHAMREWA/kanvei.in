/**
 * Test script for Category Pages and APIs
 * Tests all category pages and their corresponding APIs
 * Run with: node test-category-pages.js
 */

const categories = [
  { name: 'electronics', displayName: 'Electronics & Gadgets' },
  { name: 'jewellery', displayName: 'Jewellery & Accessories' },
  { name: 'stationery', displayName: 'Stationery & Office Supplies' },
  { name: 'clothing', displayName: 'Fashion & Clothing' },
  { name: 'cosmetics', displayName: 'Beauty & Cosmetics' },
  { name: 'gifts', displayName: 'Gifts & Special Occasions' },
  { name: 'shoes', displayName: 'Footwear & Shoes' }
]

const BASE_URL = 'http://localhost:3000'

async function testCategoryAPI(categoryName) {
  try {
    console.log(`\n🧪 Testing API: /api/products?category=${categoryName}`)
    
    const response = await fetch(`${BASE_URL}/api/products?category=${categoryName}`)
    const data = await response.json()
    
    if (!response.ok) {
      console.log(`❌ API Error: ${response.status} - ${response.statusText}`)
      return false
    }
    
    if (data.success) {
      const productCount = data.products?.length || 0
      const totalCount = data.pagination?.totalCount || 0
      
      console.log(`✅ API Success: ${productCount} products loaded (${totalCount} total available)`)
      
      if (productCount > 0) {
        console.log(`   📦 Sample Product: "${data.products[0].name}" - ₹${data.products[0].price}`)
      } else {
        console.log(`   📋 No products available in this category`)
      }
      
      return true
    } else {
      console.log(`❌ API returned error: ${data.error || 'Unknown error'}`)
      return false
    }
  } catch (error) {
    console.log(`❌ Network Error: ${error.message}`)
    return false
  }
}

async function testCategoryPage(categoryName) {
  try {
    console.log(`🌐 Testing Page: /categories/${categoryName}`)
    
    const response = await fetch(`${BASE_URL}/categories/${categoryName}`)
    
    if (!response.ok) {
      console.log(`❌ Page Error: ${response.status} - ${response.statusText}`)
      return false
    }
    
    console.log(`✅ Page accessible`)
    return true
  } catch (error) {
    console.log(`❌ Page Error: ${error.message}`)
    return false
  }
}

async function testAllCategories() {
  console.log('🚀 Starting Category Pages and APIs Test')
  console.log('=' * 50)
  
  let passedAPIs = 0
  let passedPages = 0
  let totalCategories = categories.length
  
  for (const category of categories) {
    console.log(`\n📂 Testing Category: ${category.displayName} (${category.name})`)
    console.log('-'.repeat(40))
    
    // Test API
    const apiResult = await testCategoryAPI(category.name)
    if (apiResult) passedAPIs++
    
    // Test Page
    const pageResult = await testCategoryPage(category.name)
    if (pageResult) passedPages++
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  
  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(50))
  console.log(`📡 API Tests: ${passedAPIs}/${totalCategories} passed`)
  console.log(`🌐 Page Tests: ${passedPages}/${totalCategories} passed`)
  
  const overallSuccess = (passedAPIs + passedPages) / (totalCategories * 2)
  console.log(`🎯 Overall Success Rate: ${Math.round(overallSuccess * 100)}%`)
  
  if (passedAPIs === totalCategories && passedPages === totalCategories) {
    console.log('\n🎉 All tests passed! Category pages are working perfectly.')
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.')
  }
}

async function testSubcategories() {
  console.log('\n🔍 Testing Clothing Subcategories')
  console.log('-'.repeat(30))
  
  const subcategories = ['mens-wear', 'womens-wear', 'kids-wear']
  
  for (const subcat of subcategories) {
    try {
      console.log(`\n🧪 Testing: /api/products?category=clothing&subcategory=${subcat}`)
      const response = await fetch(`${BASE_URL}/api/products?category=clothing&subcategory=${subcat}`)
      const data = await response.json()
      
      if (data.success) {
        console.log(`✅ Subcategory API works: ${data.products?.length || 0} products`)
      } else {
        console.log(`❌ Subcategory API failed: ${data.error}`)
      }
      
      // Test subcategory page
      console.log(`🌐 Testing: /categories/clothing/${subcat}`)
      const pageResponse = await fetch(`${BASE_URL}/categories/clothing/${subcat}`)
      
      if (pageResponse.ok) {
        console.log(`✅ Subcategory page accessible`)
      } else {
        console.log(`❌ Subcategory page error: ${pageResponse.status}`)
      }
      
    } catch (error) {
      console.log(`❌ Subcategory test failed: ${error.message}`)
    }
    
    await new Promise(resolve => setTimeout(resolve, 200))
  }
}

// Run the tests
async function runAllTests() {
  try {
    await testAllCategories()
    await testSubcategories()
  } catch (error) {
    console.error('❌ Test suite failed:', error)
  }
}

// Check if server is running first
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/api/products`)
    if (response.ok) {
      console.log('✅ Server is running, starting tests...\n')
      return true
    } else {
      console.log('❌ Server responded with error:', response.status)
      return false
    }
  } catch (error) {
    console.log('❌ Cannot connect to server. Please make sure the development server is running on http://localhost:3000')
    console.log('   Run: npm run dev')
    return false
  }
}

// Main execution
checkServer().then(serverOk => {
  if (serverOk) {
    runAllTests()
  }
})
