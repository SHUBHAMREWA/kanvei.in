/**
 * Setup Hierarchical Categories for Kanvei
 * Creates parent-child category structure for clothing and its subcategories
 * Run with: node setup-hierarchical-categories.js
 */

import mongoose from 'mongoose'
import connectDB from './src/lib/mongodb.js'
import Category from './src/lib/models/Category.js'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://kanchanwebitya:sQkk1qqGZaqlzFh5@cluster0.wmn4omx.mongodb.net/kanveiecommerce'

const hierarchicalCategories = [
  // Main clothing category
  {
    name: 'clothing',
    slug: 'clothing',
    description: 'Fashion and clothing for all ages',
    image: 'https://res.cloudinary.com/dowefzekn/image/upload/clothing-main.jpg',
    parentCategory: null,
    children: [
      {
        name: 'mens-wear',
        slug: 'mens-wear',
        description: 'Stylish clothing for men',
        image: 'https://res.cloudinary.com/dowefzekn/image/upload/mens-wear.jpg'
      },
      {
        name: 'womens-wear',
        slug: 'womens-wear', 
        description: 'Elegant fashion for women',
        image: 'https://res.cloudinary.com/dowefzekn/image/upload/womens-wear.jpg'
      },
      {
        name: 'kids-wear',
        slug: 'kids-wear',
        description: 'Comfortable clothes for children',
        image: 'https://res.cloudinary.com/dowefzekn/image/upload/kids-wear.jpg'
      }
    ]
  }
]

async function setupHierarchicalCategories() {
  try {
    console.log('🔗 Connecting to MongoDB...')
    
    // Connect to MongoDB
    if (mongoose.connections[0].readyState !== 1) {
      await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      console.log('✅ Connected to MongoDB')
    }

    console.log('🏗️ Setting up hierarchical categories...')

    for (const categoryData of hierarchicalCategories) {
      console.log(`\n📂 Processing category: ${categoryData.name}`)
      
      // Check if parent category already exists
      let parentCategory = await Category.findOne({ 
        name: categoryData.name,
        slug: categoryData.slug 
      })

      if (!parentCategory) {
        // Create parent category
        parentCategory = await Category.create({
          name: categoryData.name,
          slug: categoryData.slug,
          description: categoryData.description,
          image: categoryData.image,
          parentCategory: null
        })
        console.log(`✅ Created parent category: ${parentCategory.name} (ID: ${parentCategory._id})`)
      } else {
        console.log(`📋 Parent category '${categoryData.name}' already exists (ID: ${parentCategory._id})`)
      }

      // Create child categories
      if (categoryData.children && categoryData.children.length > 0) {
        console.log(`👶 Creating ${categoryData.children.length} child categories...`)
        
        for (const childData of categoryData.children) {
          // Check if child category already exists
          let childCategory = await Category.findOne({ 
            name: childData.name,
            slug: childData.slug,
            parentCategory: parentCategory._id
          })

          if (!childCategory) {
            childCategory = await Category.create({
              name: childData.name,
              slug: childData.slug,
              description: childData.description,
              image: childData.image,
              parentCategory: parentCategory._id
            })
            console.log(`   ✅ Created child category: ${childCategory.name} (Parent: ${parentCategory.name})`)
          } else {
            console.log(`   📋 Child category '${childData.name}' already exists`)
          }
        }
      }
    }

    console.log('\n🔍 Verifying category structure...')
    
    // Verify the structure
    const clothingCategory = await Category.findOne({ name: 'clothing' })
    if (clothingCategory) {
      const childCategories = await Category.find({ parentCategory: clothingCategory._id })
      
      console.log(`\n📊 Category Structure:`)
      console.log(`👔 Parent: ${clothingCategory.name} (${clothingCategory._id})`)
      
      childCategories.forEach(child => {
        console.log(`   👶 Child: ${child.name} (${child._id})`)
      })
      
      console.log(`\n✅ Total: 1 parent + ${childCategories.length} children = ${childCategories.length + 1} categories`)
    }

    console.log('\n🧪 Testing API endpoints...')
    
    // Test the API endpoints
    const testResults = {
      parentCategory: 0,
      childCategories: 0
    }

    try {
      // Test parent category API
      const response = await fetch('http://localhost:3000/api/products?category=clothing')
      const data = await response.json()
      
      if (data.success) {
        testResults.parentCategory = data.products?.length || 0
        console.log(`✅ Parent category API: ${testResults.parentCategory} products found`)
      } else {
        console.log('❌ Parent category API failed')
      }

      // Test child category APIs
      const childCategories = ['mens-wear', 'womens-wear', 'kids-wear']
      
      for (const childCat of childCategories) {
        try {
          const childResponse = await fetch(`http://localhost:3000/api/products?category=clothing&subcategory=${childCat}`)
          const childData = await childResponse.json()
          
          if (childData.success) {
            const productCount = childData.products?.length || 0
            testResults.childCategories += productCount
            console.log(`✅ Child category '${childCat}': ${productCount} products`)
          } else {
            console.log(`❌ Child category '${childCat}' API failed`)
          }
        } catch (err) {
          console.log(`❌ Error testing child category '${childCat}': ${err.message}`)
        }
      }
      
    } catch (err) {
      console.log(`⚠️  API testing failed: ${err.message}`)
      console.log('   Make sure the development server is running (npm run dev)')
    }

    console.log('\n🎉 Hierarchical categories setup completed!')
    console.log('\n📋 Summary:')
    console.log(`   • Main clothing category: ${testResults.parentCategory} products`)
    console.log(`   • All subcategories: ${testResults.childCategories} products`)
    console.log(`   • Routes available:`)
    console.log(`     - /categories/clothing (shows all clothing products)`)
    console.log(`     - /categories/clothing/mens-wear`)
    console.log(`     - /categories/clothing/womens-wear`)
    console.log(`     - /categories/clothing/kids-wear`)

  } catch (error) {
    console.error('❌ Error setting up hierarchical categories:', error)
  } finally {
    if (mongoose.connections[0].readyState === 1) {
      await mongoose.disconnect()
      console.log('🔌 Disconnected from MongoDB')
    }
  }
}

// Check if this script is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupHierarchicalCategories()
}
