import { gateway, generateText } from 'ai'

export const runtime = 'edge'

type IntakeResult = {
  category: 'health' | 'civic' | 'financial' | 'support' | 'general'
  intent: string
  urgency: 'low' | 'normal' | 'high'
  summary: string
  suggestedService: string
  response: string
}

const fallback = (text: string): IntakeResult => {
  const lower = text.toLowerCase()
  const health = /doctor|clinic|health|prescription|nurse|medical/.test(lower)
  const civic = /license|permit|id|document|benefit|municipal|city/.test(lower)
  const financial = /bank|account|payment|loan|money|tax/.test(lower)
  const high = /urgent|emergency|today|asap|immediately/.test(lower)
  const category = health ? 'health' : civic ? 'civic' : financial ? 'financial' : 'general'
  const suggestedService = health ? 'Primary care desk' : civic ? 'Civic services desk' : financial ? 'Member services' : 'Information desk'
  return {
    category,
    intent: health ? 'Get health support' : civic ? 'Complete a civic service' : financial ? 'Resolve an account question' : 'Get help from a service team',
    urgency: high ? 'high' : 'normal',
    summary: text.trim().slice(0, 110),
    suggestedService,
    response: `I found the best next step: connect you with the ${suggestedService}. We will keep your place clear while the team gets ready.`,
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const text = typeof body?.text === 'string' ? body.text.trim() : ''
    if (!text || text.length > 1000) return Response.json({ error: 'Please describe what you need in 1,000 characters or less.' }, { status: 400 })

    try {
      const result = await generateText({
        model: gateway('google/gemini-3.5-flash'),
        system: 'You are QueueKind intake. Convert a visitor\'s unstructured request into a welcoming, concise service queue ticket. Return only valid JSON with category, intent, urgency, summary, suggestedService, response. category must be health, civic, financial, support, or general. urgency must be low, normal, or high.',
        prompt: text,
      })
      const cleaned = result.text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(cleaned) as IntakeResult
      return Response.json(parsed)
    } catch {
      return Response.json(fallback(text))
    }
  } catch {
    return Response.json({ error: 'We could not read that request. Please try again.' }, { status: 400 })
  }
}
