export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { folderName, folderType } = body

    if (!folderName || typeof folderName !== 'string') {
      return {
        success: false,
        error: 'Folder name is required'
      }
    }

    // Get OpenAI API key from runtime config
    const config = useRuntimeConfig()
    const apiKey = config.openaiApiKey || process.env.OPENAI_API_KEY

    if (!apiKey) {
      console.warn('OpenAI API key not configured. Using fallback description.')
      // Return a simple generated description as fallback
      return {
        success: true,
        description: generateFallbackDescription(folderName, folderType)
      }
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates concise, professional descriptions for inventory folders. Keep descriptions to 1-2 sentences, focusing on the purpose and use case of the folder.'
          },
          {
            role: 'user',
            content: `Generate a brief, professional description for an inventory folder. The folder name is "${folderName}".${folderType && folderType !== 'general' ? ` The folder type is "${folderType}".` : ''} The description should be 1-2 sentences explaining what this folder is used for. Prioritize the folder name over the type when generating the description.`
          }
        ],
        max_tokens: 100,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('OpenAI API error:', errorData)
      
      // Fallback to generated description if API fails
      return {
        success: true,
        description: generateFallbackDescription(folderName, folderType)
      }
    }

    const data = await response.json()
    const description = data.choices?.[0]?.message?.content?.trim()

    if (!description) {
      return {
        success: true,
        description: generateFallbackDescription(folderName, folderType)
      }
    }

    return {
      success: true,
      description
    }
  } catch (error: any) {
    console.error('Error generating AI description:', error)
    
    // Return fallback description on error
    const body = await readBody(event).catch(() => ({}))
    return {
      success: true,
      description: generateFallbackDescription(body.folderName || '', body.folderType)
    }
  }
})

function generateFallbackDescription(folderName: string, folderType?: string): string {
  // Always prioritize folder name over type
  const folderNameLower = folderName.toLowerCase()
  
  // Check if folder name contains keywords that suggest a specific category
  const nameBasedDescriptions: Record<string, string> = {
    car: `Inventory folder for managing cars and automotive vehicles. Use this folder to organize and track your car inventory.`,
    vehicle: `Inventory folder for managing vehicles. Use this folder to organize and track your vehicle inventory.`,
    auto: `Inventory folder for managing automotive items. Use this folder to organize and track your automotive inventory.`,
    electronic: `Inventory folder for managing electronic devices and components. Use this folder to organize and track your electronics inventory.`,
    clothing: `Inventory folder for managing clothing and apparel items. Use this folder to organize and track your clothing inventory.`,
    food: `Inventory folder for managing food and beverage products. Use this folder to organize and track your food inventory.`,
    office: `Inventory folder for managing office supplies and stationery. Use this folder to organize and track your office inventory.`,
  }

  // Check if folder name contains any of these keywords
  for (const [keyword, description] of Object.entries(nameBasedDescriptions)) {
    if (folderNameLower.includes(keyword)) {
      return description
    }
  }

  // Default: use folder name in description
  return `Inventory folder for managing ${folderNameLower} items. Use this folder to organize and track your ${folderNameLower} inventory.`
}
