import connectDB from "../../../lib/mongodb"
import Category from "../../../lib/models/Category"

export async function GET(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const mainOnly = searchParams.get("mainOnly") === "true"
    const withHierarchy = searchParams.get("withHierarchy") === "true"

    let categories

    if (mainOnly) {
      categories = await Category.find({ parentCategory: null }).lean()
    } else if (withHierarchy) {
      const all = await Category.find({}).lean()
      const byId = new Map(all.map((c) => [String(c._id), { ...c, subcategories: [] }]))
      const roots = []
      for (const cat of byId.values()) {
        if (cat.parentCategory) {
          const parent = byId.get(String(cat.parentCategory))
          if (parent) {
            parent.subcategories.push(cat)
          } else {
            roots.push(cat)
          }
        } else {
          roots.push(cat)
        }
      }
      categories = roots
    } else {
      categories = await Category.find({}).lean()
    }

    return Response.json({ success: true, categories })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()
    const payload = {
      name: body.name,
      slug: body.slug,
      description: body.description,
      image: body.image,
      parentCategory: body.parentCategory ?? null,
    }
    const category = await Category.create(payload)

    return Response.json({ success: true, category })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
