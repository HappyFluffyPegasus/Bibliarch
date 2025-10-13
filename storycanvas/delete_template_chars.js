// Script to find and delete protagonist/antagonist from database
const { createClient } = require('@supabase/supabase-js')

async function deleteTemplateCharacters() {
  // Get env vars
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Get all canvas data
  const { data: allCanvases, error } = await supabase
    .from('canvas_data')
    .select('*')

  if (error) {
    console.error('Error fetching canvases:', error)
    process.exit(1)
  }

  console.log(`Found ${allCanvases.length} canvases`)

  let deleted = false

  for (const canvas of allCanvases) {
    const nodes = canvas.nodes || []
    const originalLength = nodes.length

    // Filter out protagonist and antagonist
    const filteredNodes = nodes.filter(node => {
      const isTemplateChar = 
        node.id === 'antagonist' || 
        node.id === 'main-character' ||
        (node.type === 'character' && (node.text === 'Protagonist' || node.text === 'Antagonist'))
      
      if (isTemplateChar) {
        console.log(`Deleting: ${node.text} (${node.id}) from canvas ${canvas.canvas_type}`)
      }
      
      return !isTemplateChar
    })

    if (filteredNodes.length < originalLength) {
      // Update canvas
      const { error: updateError } = await supabase
        .from('canvas_data')
        .update({ nodes: filteredNodes })
        .eq('id', canvas.id)

      if (updateError) {
        console.error('Error updating canvas:', updateError)
      } else {
        console.log(`✅ Updated canvas ${canvas.canvas_type}`)
        deleted = true
      }
    }
  }

  if (deleted) {
    console.log('✅ Template characters deleted successfully!')
  } else {
    console.log('No template characters found')
  }
}

deleteTemplateCharacters()
