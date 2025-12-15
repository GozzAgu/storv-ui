export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { storeName, storeAddress, storeType } = body

    if (!storeName || typeof storeName !== 'string') {
      return {
        success: false,
        error: 'Store name is required'
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
        description: generateFallbackDescription(storeName, storeAddress, storeType)
      }
    }

    // Build the prompt with available information
    let prompt = `Generate a brief, professional store description for "${storeName}".`
    if (storeAddress && storeAddress.trim()) {
      prompt += ` The store is located at ${storeAddress}.`
    }
    prompt += ` The description should be 2-3 sentences highlighting what makes this store special, its focus, and what customers can expect. Keep it engaging and professional.`

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
            content: 'You are a helpful assistant that generates concise, professional store descriptions. Keep descriptions to 2-3 sentences, focusing on what makes the store special and what customers can expect.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('OpenAI API error:', errorData)
      
      // Fallback to generated description if API fails
      return {
        success: true,
        description: generateFallbackDescription(storeName, storeAddress, storeType)
      }
    }

    const data = await response.json()
    const description = data.choices?.[0]?.message?.content?.trim()

    if (!description) {
      return {
        success: true,
        description: generateFallbackDescription(storeName, storeAddress, storeType)
      }
    }

    return {
      success: true,
      description
    }
  } catch (error: any) {
    console.error('Error generating AI store description:', error)
    
    // Return fallback description on error
    const body = await readBody(event).catch(() => ({}))
    return {
      success: true,
      description: generateFallbackDescription(body.storeName || '', body.storeAddress || '', body.storeType)
    }
  }
})

function generateFallbackDescription(storeName: string, storeAddress?: string, storeType?: string): string {
  const storeNameLower = storeName.toLowerCase()
  
  // Check if store name contains keywords that suggest a specific type
  const typeBasedDescriptions: Record<string, string> = {
    electronics: `${storeName} offers a wide selection of the latest electronics, gadgets, and tech accessories. We provide quality products and excellent customer service to meet all your technology needs.`,
    clothing: `${storeName} features a curated collection of fashionable clothing and accessories. We offer trendy styles and quality garments for every occasion.`,
    grocery: `${storeName} is your neighborhood grocery store providing fresh produce, quality groceries, and everyday essentials. We're committed to offering great value and friendly service.`,
    restaurant: `${storeName} serves delicious meals in a welcoming atmosphere. We're dedicated to providing exceptional food and service to our valued customers.`,
    pharmacy: `${storeName} provides essential health and wellness products along with professional pharmaceutical services. We're here to support your health and wellbeing.`,
    book: `${storeName} is a haven for book lovers, offering a diverse selection of books across all genres. We're passionate about connecting readers with great stories.`,
  }

  // Check if store name contains any of these keywords
  for (const [keyword, description] of Object.entries(typeBasedDescriptions)) {
    if (storeNameLower.includes(keyword)) {
      return description
    }
  }

  // Build description with available information
  let description = `${storeName} is committed to providing quality products and excellent customer service.`
  
  if (storeAddress && storeAddress.trim()) {
    description += ` Located at ${storeAddress}, we're here to serve our community with dedication and care.`
  } else {
    description += ` We strive to create a welcoming shopping experience for all our customers.`
  }

  return description
}
