/**
 * Setup Hierarchical Categories for Kanvei (CommonJS Version)
 * Creates parent-child category structure for clothing and its subcategories
 * Run with: node setup-clothing-categories.js
 */

const mongoose = require('mongoose')

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://kanchanwebitya:sQkk1qqGZaqlzFh5@cluster0.wmn4omx.mongodb.net/kanveiecommerce'

// Category Schema (inline for simplicity)
const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    index: true,
  },
  description: {
    type: String,
    trim: true,
  },
  image: {
    type: String,
    trim: true,
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    default: null,
  },
}, {
  timestamps: true,
})

const Category = mongoose.model('Category', CategorySchema)

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
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log('✅ Connected to MongoDB')

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

    console.log('\n🎉 Hierarchical categories setup completed!')
    console.log('\n📋 Summary:')
    console.log(`   • Main clothing category created with subcategories`)
    console.log(`   • Routes will be available:`)
    console.log(`     - /categories/clothing (shows all clothing products including subcategories)`)
    console.log(`     - /categories/clothing/mens-wear (shows only mens-wear products)`)
    console.log(`     - /categories/clothing/womens-wear (shows only womens-wear products)`)
    console.log(`     - /categories/clothing/kids-wear (shows only kids-wear products)`)

  } catch (error) {
    console.error('❌ Error setting up hierarchical categories:', error)
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Disconnected from MongoDB')
    process.exit(0)
  }
}

// Run the setup
setupHierarchicalCategories()
